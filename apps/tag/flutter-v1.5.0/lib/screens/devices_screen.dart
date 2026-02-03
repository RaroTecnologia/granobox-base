import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:wifi_scan/wifi_scan.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/iot_device.dart';
import '../services/iot_device_service.dart';
import '../services/device_api_service.dart';
import '../services/edge_http_service.dart';
import '../services/granobox_edge_service.dart';
import '../services/auth_service.dart';
import '../services/firmware_service.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import '../providers/auth_provider.dart';
import '../providers/operations_provider.dart';
import '../providers/print_provider.dart';
import '../widgets/print_modal.dart';
import '../theme/app_theme.dart';
import '../models/operation_models.dart';
import '../config/app_config.dart';
import 'edge_go_print_config_screen.dart';
import '../services/v1_5_print_service.dart';
import '../services/templates_service.dart';
import '../services/granobox_api_service.dart';
import '../services/client_service.dart';
import '../services/granobox_printer_create_service.dart';
import '../models/print_result_models.dart';

/// Tela de dispositivos no estilo Tuya - moderna e unificada
class DevicesScreenTuya extends StatefulWidget {
  const DevicesScreenTuya({super.key});

  @override
  State<DevicesScreenTuya> createState() => _DevicesScreenTuyaState();
}

class _DevicesScreenTuyaState extends State<DevicesScreenTuya> {
  final IoTDeviceService _iotService = IoTDeviceService();
  final DeviceApiService _deviceApiService = DeviceApiService();
  final EdgeHttpService _edgeHttpService = EdgeHttpService();
  final FirmwareService _firmwareService = FirmwareService();
  
  List<IoTDevice> _devices = [];
  bool _isScanning = false;
  Map<String, DeviceFirmwareInfo> _deviceVersions = {};
  
  @override
  void initState() {
    super.initState();
    _loadAdoptedDevices();
    
    // ⭐ NOVO: Iniciar scan BLE automaticamente para atualizar RSSI em tempo real
    // O scan atualiza o RSSI dos dispositivos adotados quando encontrados
    // ⚠️ Delay inicial para evitar scan muito frequente
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        _startAutoScan();
      }
    });
  }
  
  Timer? _autoScanTimer;
  
  /// Scan BLE automático em background para atualizar RSSI
  void _startAutoScan() {
    // Cancelar timer anterior se existir
    _autoScanTimer?.cancel();
    
    // ⚠️ Aumentar intervalo para evitar "scanning too frequently" (10 segundos)
    _autoScanTimer = Timer.periodic(const Duration(seconds: 10), (timer) {
      if (mounted && !_isScanning) {
        // Só escanear se houver dispositivos Edge-Go adotados (Edge-Pro não usa BLE)
        final hasEdgeGoDevices = _devices.any((d) => 
          d.isAdopted && d.type == IoTDeviceType.edgeGo
        );
        
        if (hasEdgeGoDevices) {
          print('📡 Iniciando scan BLE automático para atualizar RSSI...');
          _startBackgroundScanning();
        }
      }
    });
  }

  /// Carrega as versões de firmware dos dispositivos adotados
  Future<void> _loadDeviceVersions() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = await authProvider.authToken;
    
    if (token == null) return;

    // ⭐ NOVO: Só carregar versões para dispositivos que não têm versão no banco
    final adoptedDevices = _devices.where((d) => d.isAdopted).toList();
    final devicesWithoutVersion = adoptedDevices.where((d) => !_deviceVersions.containsKey(d.id)).toList();
    
    if (devicesWithoutVersion.isEmpty) {
      print('✅ Todas as versões já estão carregadas do banco');
      return;
    }
    
    // ⭐ Filtrar Edge-Pro que nunca conectou (sem lastSeen) - não tentar obter versão
    final devicesToCheck = devicesWithoutVersion.where((d) {
      // Edge-Pro sem lastSeen não deve tentar obter versão (nunca conectou)
      if (d.type == IoTDeviceType.edgePro && d.lastSeen == null) {
        print('⏭️  Pulando Edge-Pro ${d.id} - nunca conectou (sem lastSeen)');
        return false;
      }
      return true;
    }).toList();
    
    if (devicesToCheck.isEmpty) {
      print('✅ Nenhum dispositivo precisa de verificação de versão');
      return;
    }
    
    print('📡 Carregando versões para ${devicesToCheck.length} dispositivos sem versão...');
    
    for (final device in devicesToCheck) {
      try {
        final versionInfo = await _firmwareService.getDeviceFirmwareVersion(
          device.id, 
          token
        );
        
        if (versionInfo != null && mounted) {
          setState(() {
            _deviceVersions[device.id] = versionInfo;
          });
        }
      } catch (e) {
        print('❌ Erro ao carregar versão do dispositivo ${device.id}: $e');
      }
    }
  }
  
  @override
  void dispose() {
    _autoScanTimer?.cancel();
    _iotService.stopScan();
    _iotService.dispose();
    super.dispose();
  }
  
  /// Carregar dispositivos já adotados do backend
  Future<void> _loadAdoptedDevices() async {
    if (!mounted) return; // ⭐ Verificar mounted antes de usar context
    
    try {
      final auth = context.read<AuthProvider>();
      final token = await auth.authToken;
      
      if (token == null) {
        print('⚠️ Token não disponível');
        return;
      }
      
      print('📡 Carregando dispositivos do DB...');
      final dbDevices = await _deviceApiService.getMyDevices(token);
      print('✅ ${dbDevices.length} dispositivos encontrados no DB');
      
      // DEBUG: Ver o que veio da API
      for (final dev in dbDevices) {
        print('🔍 Device da API: ${dev['deviceId']}');
        print('   - lastIpAddress: ${dev['lastIpAddress']}');
        print('   - ip: ${dev['ip']}');
        print('   - bleAddress: ${dev['bleAddress']}');
        print('   - name: ${dev['name']}');
        print('   - version: ${dev['version']}');
      }
      
      if (!mounted) return; // ⭐ Verificar mounted antes de setState
      
      setState(() {
        _devices = dbDevices.map((dbDevice) {
          // Parse lastSeenAt para DateTime
          DateTime? lastSeen;
          try {
            if (dbDevice['lastSeenAt'] != null) {
              lastSeen = DateTime.parse(dbDevice['lastSeenAt']);
            }
          } catch (e) {
            print('⚠️ Erro ao parsear lastSeenAt: $e');
          }
          
          // ⭐ NOVO: Criar status com IP se disponível
          IoTDeviceStatus? status;
          final ip = dbDevice['lastIpAddress'] ?? dbDevice['ip']; // Tentar ambos os campos
          if (ip != null && ip.toString().isNotEmpty) {
            status = IoTDeviceStatus(
              ipAddress: ip,
              // Outros campos serão lidos depois via HTTP
            );
            print('📍 Device ${dbDevice['deviceId']} tem IP: $ip');
          } else {
            print('⚠️  Device ${dbDevice['deviceId']} sem IP no banco');
          }
          
          // ⭐ CORRIGIDO: Determinar se está online baseado no status E no lastSeenAt
          // Status 'active' + lastSeenAt recente (< 5 min) = online
          // Status 'suspended' ou 'inactive' = sempre offline
          bool isOnline = false;
          final dbStatus = dbDevice['status']?.toString().toLowerCase();
          if (dbStatus == 'active' || dbStatus == 'online') {
            // Só considerar online se teve heartbeat recente (últimos 5 minutos)
            if (lastSeen != null) {
              final diff = DateTime.now().difference(lastSeen);
              isOnline = diff.inMinutes < 5;
            } else {
              // Sem lastSeenAt = nunca conectou = offline
              isOnline = false;
            }
          } else {
            // Status 'suspended', 'inactive' ou outro = sempre offline
            isOnline = false;
          }
          
          print('📊 Device ${dbDevice['deviceId']}: status=$dbStatus, lastSeen=${lastSeen?.toString() ?? 'null'}, isOnline=$isOnline');
          
          final deviceId = dbDevice['deviceId'] ?? dbDevice['id'] ?? 'unknown';
          
          // ⭐ NOVO: Usar versão do banco diretamente se disponível
          final version = dbDevice['version'];
          if (version != null && version.toString().isNotEmpty && version != 'null') {
            _deviceVersions[deviceId] = DeviceFirmwareInfo(
              currentVersion: version.toString(),
              displayVersion: version.toString(),
              versionStatus: 'Atualizado',
            );
            print('✅ Versão do banco para $deviceId: $version');
          }
          
          return IoTDevice(
            id: deviceId, // ✅ CORRIGIDO: usar deviceId primeiro
            name: dbDevice['name'] ?? 'Dispositivo',
            type: iotDeviceTypeFromString(dbDevice['type'] ?? 'edge-go'), // ✅ Conversão correta
            isOnline: isOnline, // ⭐ CORRIGIDO: Baseado em status + lastSeenAt
            rssi: null, // ⭐ CORRIGIDO: RSSI só vem do scan BLE real, não do banco
            lastSeen: lastSeen, // ✅ CORRIGIDO: converter String para DateTime
            isAdopted: true, // ✅ Dispositivos do DB já estão adotados
            status: status, // ⭐ NOVO: Adicionar status com IP
            macAddress: dbDevice['bleAddress'], // ⭐ NOVO: Endereço BLE para reconfiguração WiFi
          );
        }).toList();
      });
      
      print('📊 ${_devices.length} dispositivos carregados');
      
      // ⭐ CORRIGIDO: Carregar versões apenas para dispositivos que não têm versão no banco
      // Isso evita chamadas desnecessárias e mostra a versão imediatamente
      _loadDeviceVersions();
    } catch (e) {
      print('❌ Erro ao carregar dispositivos adotados: $e');
    }
  }
  
  bool _isDeviceOnline(String? lastSeenAt) {
    if (lastSeenAt == null) return false;
    try {
      final lastSeen = DateTime.parse(lastSeenAt);
      final diff = DateTime.now().difference(lastSeen);
      return diff.inMinutes < 5; // Online se visto nos últimos 5 min
    } catch (_) {
      return false;
    }
  }
  
  /// Iniciar busca por dispositivos BLE com modal de progresso (para adicionar novo dispositivo)
  Future<void> _startScanning() async {
    setState(() => _isScanning = true);
    
    // Abrir bottom sheet com progresso do scan
    _showScanningBottomSheet();
  }
  
  /// Scan silencioso em background (apenas para atualizar RSSI de dispositivos existentes)
  Future<void> _startBackgroundScanning() async {
    if (_isScanning) return; // Não iniciar se já estiver escaneando
    
    final subscription = _iotService.devicesStream.listen((scannedDevices) {
      if (mounted) {
        setState(() {
          // Apenas atualizar RSSI de dispositivos já adotados
          for (final scanned in scannedDevices) {
            final adoptedIndex = _devices.indexWhere((d) => d.id == scanned.id && d.isAdopted);
            if (adoptedIndex >= 0) {
              final old = _devices[adoptedIndex];
              // Atualizar RSSI se estiver online E for Edge-Go ou Edge-Pro
              final shouldUpdateRssi = old.isOnline && (old.type == IoTDeviceType.edgeGo || old.type == IoTDeviceType.edgePro);
              if (shouldUpdateRssi) {
                _devices[adoptedIndex] = IoTDevice(
                  id: old.id,
                  name: old.name,
                  type: old.type,
                  localName: old.localName,
                  isOnline: old.isOnline,
                  rssi: scanned.rssi,
                  status: old.status,
                  lastSeen: old.lastSeen,
                  isAdopted: old.isAdopted,
                  macAddress: old.macAddress ?? scanned.macAddress,
                );
                print('📡 RSSI atualizado via BLE para ${old.id}: ${scanned.rssi} dBm');
              }
            }
          }
        });
      }
    });
    
    await _iotService.startScan();
    
    // Parar scan após 15s (scan de background mais curto)
    Future.delayed(const Duration(seconds: 15), () {
      subscription.cancel();
      if (mounted) {
        _iotService.stopScan();
      }
    });
  }
  
  /// Bottom sheet que mostra o progresso do scan BLE
  void _showScanningBottomSheet() {
    List<IoTDevice> foundDevices = [];
    StreamSubscription? subscription;
    Timer? timeoutTimer;
    bool isActive = true;
    bool scanStopped = false;
    
    // Função helper para parar o scan de forma segura
    void stopScanSafely() {
      if (scanStopped) return; // Evitar múltiplas chamadas
      scanStopped = true;
      isActive = false;
      
      print('🛑 Parando scan BLE...');
      timeoutTimer?.cancel();
      subscription?.cancel();
      _iotService.stopScan();
      
      if (mounted) {
        setState(() => _isScanning = false);
      }
    }
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.dark800,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setSheetState) {
          // Iniciar scan quando o sheet abrir
          if (subscription == null && isActive) {
            subscription = _iotService.devicesStream.listen((scannedDevices) {
              if (isActive && !scanStopped) {
                // Calcular adoptedIds fora dos setStates para compartilhar
                final adoptedIds = _devices.where((d) => d.isAdopted).map((d) => d.id).toSet();
                
                // ⭐ DEBUG: Mostrar o que está sendo filtrado
                print('🔍 [MODAL DEBUG] Scanned: ${scannedDevices.length} devices');
                print('🔍 [MODAL DEBUG] AdoptedIds: $adoptedIds');
                for (final d in scannedDevices) {
                  final isFiltered = adoptedIds.contains(d.id);
                  print('   ${d.id} (${d.name}) -> ${isFiltered ? "FILTRADO" : "MOSTRAR"}');
                }
                
                setSheetState(() {
                  // Filtrar apenas dispositivos não adotados
                  foundDevices = scannedDevices.where((d) => !adoptedIds.contains(d.id)).toList();
                  print('🔍 [MODAL DEBUG] foundDevices após filtro: ${foundDevices.length}');
                });
                
                // Também atualizar a lista principal
                if (mounted) {
                  setState(() {
                    for (final scanned in scannedDevices) {
                      if (!adoptedIds.contains(scanned.id)) {
                        final existingIndex = _devices.indexWhere((d) => d.id == scanned.id);
                        if (existingIndex >= 0) {
                          _devices[existingIndex] = scanned;
                        } else {
                          _devices.add(scanned);
                        }
                      }
                    }
                  });
                }
              }
            });
            
            // Iniciar scan
            _iotService.startScan();
            
            // Timeout: Parar após 30s
            timeoutTimer = Timer(const Duration(seconds: 30), () {
              if (!scanStopped) {
                print('⏱️ Timeout do scan BLE (30s)');
                stopScanSafely();
              }
            });
          }
          
          return Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.7,
            ),
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        PhosphorIcons.bluetooth,
                        color: AppTheme.primary,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Buscando Dispositivos',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            foundDevices.isEmpty 
                                ? 'Procurando dispositivos BLE...'
                                : '${foundDevices.length} dispositivo(s) encontrado(s)',
                            style: TextStyle(
                              color: AppTheme.dark300,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Indicador de scan ativo
                    SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppTheme.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                
                // Lista de dispositivos encontrados
                if (foundDevices.isEmpty)
                  Center(
                    child: Container(
                      padding: const EdgeInsets.all(40),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            PhosphorIcons.magnifyingGlass,
                            size: 48,
                            color: AppTheme.dark500,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Escaneando...',
                            style: TextStyle(
                              color: AppTheme.dark400,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Certifique-se de que o dispositivo\nestá ligado e próximo',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: AppTheme.dark500,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  Flexible(
                    child: ListView.builder(
                      shrinkWrap: true,
                      itemCount: foundDevices.length,
                      itemBuilder: (context, index) {
                        final device = foundDevices[index];
                        return _buildFoundDeviceCard(device, () {
                          // Parar scan e fechar sheet
                          stopScanSafely();
                          Navigator.pop(sheetContext);
                          // Mostrar diálogo de adoção
                          _showAdoptDialog(device);
                        });
                      },
                    ),
                  ),
                
                const SizedBox(height: 16),
                
                // Botão Cancelar
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () {
                      stopScanSafely();
                      Navigator.pop(sheetContext);
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.dark300,
                      side: BorderSide(color: AppTheme.dark600),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('Cancelar'),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    ).whenComplete(() {
      // Cleanup quando o sheet for fechado (garante que o scan para)
      stopScanSafely();
    });
  }
  
  /// Card de dispositivo encontrado no scan
  Widget _buildFoundDeviceCard(IoTDevice device, VoidCallback onTap) {
    IconData icon;
    Color color;
    
    switch (device.type) {
      case IoTDeviceType.edgeGo:
        icon = PhosphorIcons.cpu;
        color = AppTheme.primary;
        break;
      case IoTDeviceType.edgePro:
        icon = PhosphorIcons.hardDrive;
        color = Colors.deepPurple;
        break;
      case IoTDeviceType.dot:
        icon = PhosphorIcons.barcode;
        color = Colors.teal;
        break;
      default:
        icon = PhosphorIcons.bluetooth;
        color = AppTheme.dark400;
    }
    
    return Card(
      color: AppTheme.dark700,
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      device.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      device.type.name.toUpperCase(),
                      style: TextStyle(
                        color: color,
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              // RSSI
              if (device.rssi != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.dark600,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${device.rssi} dBm',
                    style: TextStyle(
                      color: AppTheme.dark300,
                      fontSize: 11,
                    ),
                  ),
                ),
              const SizedBox(width: 8),
              Icon(
                PhosphorIcons.caretRight,
                color: AppTheme.dark400,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  /// Parar busca
  void _stopScanning() {
    _iotService.stopScan();
    setState(() => _isScanning = false);
  }
  
  /// Modal de escolha do tipo de dispositivo (Edge-Go, Edge-Pro, Dot-Go)
  Future<void> _showDeviceTypeModal() async {
    await showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          constraints: const BoxConstraints(maxWidth: 400),
          decoration: BoxDecoration(
            color: AppTheme.dark800,
            borderRadius: BorderRadius.circular(20),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Escolha o tipo de dispositivo',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Selecione conforme o hardware que você possui',
                style: TextStyle(
                  color: AppTheme.dark300,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 24),
              _buildDeviceTypeCard(
                title: 'Edge-Go',
                subtitle: 'ESP32-S3 com impressora USB',
                icon: PhosphorIcons.bluetooth,
                color: AppTheme.primary,
                description: 'Scan BLE • Impressão direta',
                onTap: () {
                  Navigator.pop(context);
                  _startScanning();
                },
              ),
              const SizedBox(height: 12),
              _buildDeviceTypeCard(
                title: 'Edge-Pro',
                subtitle: 'Raspberry Pi com jobs WebSocket',
                icon: PhosphorIcons.bluetooth,
                color: Colors.deepPurple,
                description: 'Scan BLE • Fila de impressão',
                onTap: () {
                  Navigator.pop(context);
                  _startScanning(); // Agora usa BLE igual ao Edge-Go
                },
              ),
              const SizedBox(height: 12),
              _buildDeviceTypeCard(
                title: 'Dot-Go',
                subtitle: 'Leitor de QR Code via BLE',
                icon: PhosphorIcons.barcode,
                color: Colors.teal,
                description: 'Scan BLE • Leitura de códigos',
                onTap: () {
                  Navigator.pop(context);
                  _startScanning();
                },
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    'Cancelar',
                    style: TextStyle(color: AppTheme.dark300),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildDeviceTypeCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required String description,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: color.withOpacity(0.3),
              width: 2,
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        color: color,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: AppTheme.dark300,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: TextStyle(
                        color: color.withOpacity(0.8),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  // ⭐ FUNÇÕES DE EDGE-PRO VIA QR CODE/MANUAL
  // As funções abaixo são mantidas para compatibilidade com dispositivos já adotados
  
  Future<void> _showEdgeProAdoptionOptions() async {
    final option = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        title: const Text(
          'Adotar Edge-Pro',
          style: TextStyle(color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ElevatedButton.icon(
              onPressed: () => Navigator.pop(context, 'qr'),
              icon: const Icon(Icons.qr_code_scanner),
              label: const Text('Escanear QR Code'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                minimumSize: const Size(double.infinity, 50),
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => Navigator.pop(context, 'manual'),
              icon: const Icon(Icons.edit),
              label: const Text('Digitar Device ID'),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: AppTheme.primary),
                foregroundColor: AppTheme.primary,
                minimumSize: const Size(double.infinity, 50),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
        ],
      ),
    );

    if (option == 'qr' && mounted) {
      await _startQRCodeScanForEdgePro();
    } else if (option == 'manual' && mounted) {
      await _showEdgeProAdoptionDialog();
    }
  }
  
  Future<void> _startQRCodeScanForEdgePro() async {
    print('📱 Iniciando scan de QR Code para Edge-Pro...');
    
    final qrData = await Navigator.push<String>(
      context,
      MaterialPageRoute(
        builder: (context) => _QRCodeScanScreen(),
      ),
    );

    if (qrData != null && mounted) {
      print('✅ QR Code escaneado: $qrData');
      await _processEdgeProQRCode(qrData);
    }
  }
  
  Future<void> _processEdgeProQRCode(String qrData) async {
    try {
      // Tentar parsear como JSON primeiro
      Map<String, dynamic> data;
      try {
        data = jsonDecode(qrData) as Map<String, dynamic>;
      } catch (e) {
        // Se não for JSON, tratar como Device ID simples
        print('📝 QR Code não é JSON, tratando como Device ID: $qrData');
        await _performEdgeProAdoption(deviceId: qrData.trim());
        return;
      }
      
      // Se for JSON, extrair fingerprint (Device ID)
      final fingerprint = data['fingerprint'] as String?;
      
      if (fingerprint == null || fingerprint.isEmpty) {
        throw Exception('QR Code inválido - fingerprint não encontrado');
      }

      print('📦 Device ID do QR Code: $fingerprint');
      await _performEdgeProAdoption(deviceId: fingerprint);

    } catch (e) {
      print('❌ Erro ao processar QR Code: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao ler QR Code: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
  
  Future<void> _showEdgeProAdoptionDialog() async {
    final deviceIdController = TextEditingController(text: 'edge-pro-');
    
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        title: const Text(
          'Adotar Edge-Pro',
          style: TextStyle(color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Digite o Device ID do Edge-Pro:',
              style: TextStyle(color: Colors.white70),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: deviceIdController,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'edge-pro-75cba45f',
                hintStyle: TextStyle(color: Colors.white38),
                filled: true,
                fillColor: AppTheme.dark700,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: AppTheme.primary),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: AppTheme.dark600),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: AppTheme.primary, width: 2),
                ),
              ),
              autofocus: true,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.dark700,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: AppTheme.primary, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'O Device ID geralmente está nos logs do Edge-Pro ou no formato: edge-pro-{MAC}',
                      style: TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              final deviceId = deviceIdController.text.trim();
              if (deviceId.isEmpty || !deviceId.startsWith('edge-pro-')) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Device ID inválido. Deve começar com "edge-pro-"'),
                    backgroundColor: Colors.red,
                  ),
                );
                return;
              }
              Navigator.pop(context, true);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
            ),
            child: const Text('Adotar'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final deviceId = deviceIdController.text.trim();
      await _performEdgeProAdoption(deviceId: deviceId);
    }
  }
  
  Future<void> _performEdgeProAdoption({
    required String deviceId,
  }) async {
    print('🟣 Iniciando adoção Edge-Pro $deviceId');
    
    try {
      if (!mounted) return;
      
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(),
        ),
      );

      final auth = context.read<AuthProvider>();
      final token = await auth.authToken;
      
      if (token == null) {
        throw Exception('Token não encontrado');
      }

      print('🔐 Gerando API Key para Edge-Pro...');
      final apiKeyResponse = await _deviceApiService.generateDeviceApiKey(
        authToken: token,
        fingerprint: deviceId,
        deviceType: 'edge-pro',
      );

      final apiKey = apiKeyResponse['api_key'] as String? ?? apiKeyResponse['apiKey'] as String?;
      
      if (apiKey == null || apiKey.isEmpty) {
        throw Exception('API Key não gerada');
      }

      print('📝 Registrando Edge-Pro no backend...');
      await _deviceApiService.registerDevice(
        deviceId: deviceId,
        apiKey: apiKey,
        authToken: token,
        name: 'Edge-Pro ${deviceId.length > 8 ? deviceId.substring(deviceId.length - 8) : deviceId}',
      );

      // ⭐ Edge-Pro novo está em modo provisioning (hotspot WiFi)
      // IP fixo do hotspot: 192.168.4.1 (porta 80)
      // Endpoint: POST http://192.168.4.1/configure
      
      if (!mounted) return;
      Navigator.pop(context);
      
      // Mostrar diálogo pedindo WiFi da casa e instruções
      final wifiSSIDController = TextEditingController();
      final wifiPasswordController = TextEditingController();
      
      final shouldConfigure = await showDialog<bool>(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          backgroundColor: AppTheme.dark800,
          title: const Text(
            'Configurar Edge-Pro',
            style: TextStyle(color: Colors.white),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.wifi, color: Colors.orange, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'IMPORTANTE: Conecte-se no WiFi do Edge-Pro primeiro!\n\nSSID: Edge Pro ${deviceId.length > 8 ? deviceId.substring(deviceId.length - 8) : deviceId}\nSenha: granoboxXXXX (veja no QR code)',
                          style: TextStyle(color: Colors.orange, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'WiFi da sua casa:',
                  style: TextStyle(color: Colors.white70),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: wifiSSIDController,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: 'Nome do WiFi (SSID)',
                    hintStyle: TextStyle(color: Colors.white38),
                    filled: true,
                    fillColor: AppTheme.dark700,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: AppTheme.primary),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: wifiPasswordController,
                  style: const TextStyle(color: Colors.white),
                  obscureText: true,
                  decoration: InputDecoration(
                    hintText: 'Senha do WiFi',
                    hintStyle: TextStyle(color: Colors.white38),
                    filled: true,
                    fillColor: AppTheme.dark700,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: AppTheme.primary),
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () {
                if (wifiSSIDController.text.isNotEmpty) {
                  Navigator.pop(context, true);
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
              ),
              child: const Text('Configurar'),
            ),
          ],
        ),
      );
      
      if (shouldConfigure != true || wifiSSIDController.text.isEmpty) {
        return;
      }
      
      // Mostrar loading
      if (!mounted) return;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(),
        ),
      );
      
      // Tentar configurar via hotspot (192.168.4.1:80/configure)
      try {
        print('📡 Configurando Edge-Pro via hotspot (192.168.4.1:80)...');
        final response = await http.post(
          Uri.parse('http://192.168.4.1/configure'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'wifi_ssid': wifiSSIDController.text,
            'wifi_password': wifiPasswordController.text,
            'fingerprint': deviceId,
            'api_key': apiKey,
            'backend_url': ApiConfig.baseUrl,
          }),
        ).timeout(const Duration(seconds: 15));
        
        if (response.statusCode == 200) {
          final result = jsonDecode(response.body);
          if (result['success'] == true) {
            print('✅ Edge-Pro configurado com sucesso!');
            if (!mounted) return;
            Navigator.pop(context);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('✅ Edge-Pro configurado! O dispositivo está reiniciando e conectando no seu WiFi...'),
                backgroundColor: Colors.green,
                duration: Duration(seconds: 8),
              ),
            );
          } else {
            throw Exception(result['error'] ?? 'Erro desconhecido');
          }
        } else {
          throw Exception('HTTP ${response.statusCode}: ${response.body}');
        }
      } catch (e) {
        print('❌ Erro ao configurar Edge-Pro: $e');
        if (!mounted) return;
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ Erro ao configurar: $e\n\nCertifique-se de estar conectado no WiFi do Edge-Pro.'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 10),
          ),
        );
      }

      // Recarregar lista de dispositivos
      Future.delayed(const Duration(seconds: 2), () {
        _loadAdoptedDevices();
      });

    } catch (e) {
      print('❌ Erro ao adotar Edge-Pro: $e');
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      appBar: AppBar(
        title: const Text('Meus Dispositivos'),
        backgroundColor: AppTheme.dark800,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Header com botão de busca
          _buildSearchHeader(),
          
          // Lista de dispositivos
          Expanded(
            child: _devices.isEmpty
                ? _buildEmptyState()
                : _buildDeviceList(),
          ),
        ],
      ),
    );
  }
  
  Widget _buildSearchHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.dark800,
        border: Border(
          bottom: BorderSide(
            color: AppTheme.dark700,
            width: 1,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _devices.where((d) => d.isAdopted).length.toString() + ' dispositivos conectados',
            style: const TextStyle(
              fontSize: 14,
              color: AppTheme.dark300,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _showDeviceTypeModal,
              icon: const Icon(PhosphorIcons.plus, size: 20),
              label: const Text('Adicionar Novo Dispositivo'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            PhosphorIcons.deviceMobileSpeaker,
            size: 80,
            color: AppTheme.dark600,
          ),
          const SizedBox(height: 16),
          const Text(
            'Nenhum dispositivo encontrado',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppTheme.dark200,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Clique em "Buscar Dispositivos" para procurar',
            style: TextStyle(
              fontSize: 14,
              color: AppTheme.dark400,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildDeviceList() {
    // Separar adotados e não adotados
    final adopted = _devices.where((d) => d.isAdopted).toList();
    final notAdopted = _devices.where((d) => !d.isAdopted).toList();
    
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Dispositivos adotados
        if (adopted.isNotEmpty) ...[
          _buildSectionHeader('Meus Dispositivos', adopted.length),
          const SizedBox(height: 12),
          ...adopted.map((device) => _buildDeviceCard(device, isAdopted: true)),
        ],
        
        // Dispositivos disponíveis para adoção
        if (notAdopted.isNotEmpty) ...[
          const SizedBox(height: 24),
          _buildSectionHeader('Disponíveis para Adoção', notAdopted.length),
          const SizedBox(height: 12),
          ...notAdopted.map((device) => _buildDeviceCard(device, isAdopted: false)),
        ],
      ],
    );
  }
  
  Widget _buildSectionHeader(String title, int count) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Text(
        '$title ($count)',
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: AppTheme.dark100,
        ),
      ),
    );
  }
  
  Widget _buildDeviceCard(IoTDevice device, {required bool isAdopted}) {
    final isOnline = device.isOnline;
    
    return Opacity(
      opacity: isOnline ? 1.0 : 0.5, // ⭐ NOVO: Dispositivos offline ficam opacos
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppTheme.dark800,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isAdopted 
                ? AppTheme.primary.withOpacity(0.5)
                : AppTheme.dark700,
            width: isAdopted ? 2 : 1,
          ),
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: isOnline || !isAdopted ? () { // ⭐ Só permitir clique se estiver online OU não for adotado
              if (isAdopted) {
                _showDeviceCommandsSheet(device);
              } else {
                _showAdoptDialog(device);
              }
            } : null, // ⭐ Desabilitar clique se estiver offline e adotado
            child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    // Ícone do dispositivo
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: isAdopted 
                            ? AppTheme.primary.withOpacity(0.2)
                            : AppTheme.dark700,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        PhosphorIcons.cpu,
                        color: isAdopted ? AppTheme.primary : AppTheme.dark400,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    
                    // Nome e ID
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  device.name,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (isAdopted) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primary,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Text(
                                    'ADOTADO',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                                // Botão de editar nome
                                IconButton(
                                  icon: const Icon(PhosphorIcons.pencilSimple, size: 16),
                                  color: AppTheme.primary,
                                  onPressed: () => _showRenameDialog(device),
                                  padding: const EdgeInsets.all(4),
                                  constraints: const BoxConstraints(),
                                  tooltip: 'Renomear',
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            device.id,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.dark400,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    // Status online/offline
                    if (isAdopted)
                      Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: isOnline ? Colors.green : Colors.red,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: (isOnline ? Colors.green : Colors.red).withOpacity(0.3),
                              blurRadius: 4,
                              spreadRadius: 1,
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                
                const SizedBox(height: 12),
                
                // ⭐ CORRIGIDO: Informações na mesma linha (IP, RSSI, Versão)
                if (isAdopted) ...[
                  Row(
                    children: [
                      // IP (se disponível)
                      if (device.status?.ipAddress != null && device.status!.ipAddress!.isNotEmpty)
                        _buildInfoChip(
                          icon: PhosphorIcons.wifiHigh,
                          label: device.status!.ipAddress!,
                          color: Colors.blue,
                        ),
                      // RSSI (sinal BLE real) - Exibir se estiver online E for Edge-Go ou Edge-Pro (ambos usam BLE)
                      if (device.rssi != null && device.isOnline && (device.type == IoTDeviceType.edgeGo || device.type == IoTDeviceType.edgePro)) ...[
                        if (device.status?.ipAddress != null && device.status!.ipAddress!.isNotEmpty)
                          const SizedBox(width: 8),
                        _buildInfoChip(
                          icon: PhosphorIcons.broadcast,
                          label: '${device.rssi} dBm',
                          color: _getRssiColor(device.rssi!),
                        ),
                      ],
                      // Versão do firmware
                      if ((device.rssi != null && device.isOnline && (device.type == IoTDeviceType.edgeGo || device.type == IoTDeviceType.edgePro)) || 
                          (device.status?.ipAddress != null && device.status!.ipAddress!.isNotEmpty))
                        const SizedBox(width: 8),
                      _buildVersionChip(device.id),
                    ],
                  ),
                ] else ...[
                  // Para dispositivos não adotados, mostrar RSSI (Edge-Go e Edge-Pro usam BLE)
                  if (device.rssi != null && (device.type == IoTDeviceType.edgeGo || device.type == IoTDeviceType.edgePro))
                    Row(
                      children: [
                        _buildInfoChip(
                          icon: PhosphorIcons.broadcast,
                          label: '${device.rssi} dBm',
                          color: _getRssiColor(device.rssi!),
                        ),
                      ],
                    ),
                ],
                
                // ⭐ REMOVIDO: Status de impressora e WebSocket da listagem
                // Essas informações só são carregadas no modal de detalhes
                // Exibir na listagem causava informações incorretas
                
                if (isAdopted) ...[
                  // Botão de teste de impressão
                  const SizedBox(height: 12),
                  Divider(height: 1, color: AppTheme.dark700),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: isOnline ? () => _testPrint(device) : null, // ⭐ Desabilitar se offline
                          icon: const Icon(PhosphorIcons.printer, size: 18),
                          label: const Text('Teste de Impressão'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: isOnline ? AppTheme.primary : AppTheme.dark500,
                            side: BorderSide(color: isOnline ? AppTheme.primary.withOpacity(0.5) : AppTheme.dark600),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton.icon(
                        onPressed: isOnline ? () => _showDeviceCommandsSheet(device) : null, // ⭐ Desabilitar se offline
                        icon: const Icon(PhosphorIcons.gear, size: 18),
                        label: const Text('Detalhes'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: isOnline ? Colors.white70 : AppTheme.dark500,
                          side: BorderSide(color: isOnline ? AppTheme.dark600 : AppTheme.dark700),
                          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
                
                if (!isAdopted) ...[
                  const SizedBox(height: 12),
                  Divider(height: 1, color: AppTheme.dark700),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => _showAdoptDialog(device),
                      icon: const Icon(PhosphorIcons.plus, size: 18),
                      label: const Text('Adotar Dispositivo'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
      ), // ⭐ Fecha Opacity
    );
  }
  
  Widget _buildInfoChip({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  /// Widget para exibir a versão do firmware do dispositivo
  Widget _buildVersionChip(String deviceId) {
    final versionInfo = _deviceVersions[deviceId];
    
    // ⭐ NOVO: Se não tiver versão, não exibir nada (ao invés de "Carregando...")
    if (versionInfo == null) {
      return const SizedBox.shrink();
    }

    // Determinar cor baseada no status da versão
    Color versionColor;
    IconData versionIcon;
    
    if (versionInfo.needsUpdate) {
      versionColor = Colors.orange;
      versionIcon = PhosphorIcons.warningCircle;
    } else if (versionInfo.isDevelopmentVersion) {
      versionColor = Colors.purple;
      versionIcon = PhosphorIcons.wrench;
    } else {
      versionColor = Colors.green;
      versionIcon = PhosphorIcons.checkCircle;
    }

    return GestureDetector(
      onTap: () => _showVersionDetails(deviceId, versionInfo),
      child: _buildInfoChip(
        icon: versionIcon,
        label: 'v${versionInfo.displayVersion}',
        color: versionColor,
      ),
    );
  }

  /// Exibe detalhes da versão do firmware em um modal
  void _showVersionDetails(String deviceId, DeviceFirmwareInfo versionInfo) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.dark800,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Icon(
                  PhosphorIcons.info,
                  color: AppTheme.primary,
                  size: 24,
                ),
                const SizedBox(width: 12),
                const Text(
                  'Informações do Firmware',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            
            // Versão atual
            _buildVersionDetailRow(
              'Versão Atual',
              versionInfo.currentVersion,
              PhosphorIcons.tag,
            ),
            
            // Status
            _buildVersionDetailRow(
              'Status',
              versionInfo.versionStatus,
              PhosphorIcons.checkCircle,
            ),
            
            // Última verificação
            if (versionInfo.lastVersionCheck != null)
              _buildVersionDetailRow(
                'Última Verificação',
                _formatDateTime(versionInfo.lastVersionCheck!),
                PhosphorIcons.clock,
              ),
            
            // Versão mais recente disponível
            if (versionInfo.latestVersion != null)
              _buildVersionDetailRow(
                'Versão Mais Recente',
                versionInfo.latestVersion!,
                PhosphorIcons.downloadSimple,
              ),
            
            // Metadados técnicos
            if (versionInfo.metadata != null) ...[
              const SizedBox(height: 16),
              const Text(
                'Detalhes Técnicos',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.dark300,
                ),
              ),
              const SizedBox(height: 8),
              
              if (versionInfo.metadata!['compile_date'] != null)
                _buildVersionDetailRow(
                  'Data de Compilação',
                  versionInfo.metadata!['compile_date'],
                  PhosphorIcons.calendar,
                ),
              
              if (versionInfo.metadata!['idf_version'] != null)
                _buildVersionDetailRow(
                  'ESP-IDF',
                  versionInfo.metadata!['idf_version'],
                  PhosphorIcons.cpu,
                ),
              
              if (versionInfo.metadata!['chip_model'] != null)
                _buildVersionDetailRow(
                  'Chip',
                  '${versionInfo.metadata!['chip_model']} (${versionInfo.metadata!['chip_cores'] ?? '?'} cores)',
                  PhosphorIcons.cpu,
                ),
            ],
            
            const SizedBox(height: 20),
            
            // Botões de ação
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _refreshDeviceVersion(deviceId),
                    icon: Icon(PhosphorIcons.arrowClockwise, size: 18),
                    label: const Text('Atualizar'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Fechar'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.dark300,
                      side: BorderSide(color: AppTheme.dark600),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// Widget para exibir uma linha de detalhe da versão
  Widget _buildVersionDetailRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 16, color: AppTheme.dark400),
          const SizedBox(width: 12),
          Text(
            '$label:',
            style: const TextStyle(
              fontSize: 14,
              color: AppTheme.dark300,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.white,
                fontFamily: 'monospace',
              ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }

  /// Formata DateTime para exibição
  String _formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);
    
    if (diff.inMinutes < 1) {
      return 'Agora mesmo';
    } else if (diff.inMinutes < 60) {
      return '${diff.inMinutes}min atrás';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h atrás';
    } else {
      return '${diff.inDays}d atrás';
    }
  }

  /// Força atualização da versão via WebSocket
  Future<void> _refreshDeviceVersion(String deviceId) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = await authProvider.authToken;
    
    if (token == null) return;

    try {
      // Mostrar loading
      Navigator.pop(context); // Fechar modal atual
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('🔄 Atualizando versão via WebSocket...'),
          duration: Duration(seconds: 2),
        ),
      );

      final versionInfo = await _firmwareService.refreshDeviceFirmwareVersion(
        deviceId, 
        token
      );
      
      if (versionInfo != null && mounted) {
        setState(() {
          _deviceVersions[deviceId] = versionInfo;
        });
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Versão atualizada: v${versionInfo.displayVersion}'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('⚠️ Não foi possível atualizar a versão'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } catch (e) {
      print('❌ Erro ao atualizar versão: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ Erro: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  Widget _buildStatusBadge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
  
  Color _getRssiColor(int rssi) {
    if (rssi > -60) return Colors.green;
    if (rssi > -75) return Colors.orange;
    return Colors.red;
  }
  
  /// Modal de adoção
  void _showAdoptDialog(IoTDevice device) {
    // ⭐ Selecionar primeira operação automaticamente
    final opsProvider = context.read<OperationsProvider>();
    Operation? selectedOperation = opsProvider.operations.isNotEmpty 
        ? opsProvider.operations.first 
        : null;
    
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Adotar Dispositivo'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Info do dispositivo (sem edição)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.dark700.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.dark600),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Dispositivo',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.dark400,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        device.id,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primary,
                          fontFamily: 'monospace',
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                
                // Seletor de operação
                const Text(
                  'Operação',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Consumer<OperationsProvider>(
                  builder: (context, opsProvider, _) {
                    return DropdownButtonFormField<Operation>(
                      value: selectedOperation,
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(PhosphorIcons.buildings),
                      ),
                      hint: const Text('Selecione uma operação'),
                      items: opsProvider.operations.map((op) {
                        return DropdownMenuItem(
                          value: op,
                          child: Text(op.name),
                        );
                      }).toList(),
                      onChanged: (operation) {
                        setDialogState(() {
                          selectedOperation = operation;
                        });
                      },
                    );
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (selectedOperation == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Selecione uma operação'),
                      backgroundColor: Colors.red,
                    ),
                  );
                  return;
                }
                
                Navigator.pop(context);
                // Usar device.id como nome (ex: edge-go-d7e2b4)
                await _adoptDevice(device, device.id, selectedOperation!);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
              ),
              child: const Text('Adotar'),
            ),
          ],
        ),
      ),
    );
  }
  
  /// Adotar dispositivo Edge-Go via BLE
  Future<void> _adoptDevice(IoTDevice device, String name, Operation operation) async {
    print('🔵 [DEBUG] _adoptDevice chamado para ${device.name}');
    print('🔵 [DEBUG] Device ID: ${device.id}');
    print('🔵 [DEBUG] Nome: $name');
    print('🔵 [DEBUG] Operação: ${operation.name}');
    print('📱 [BLE MAC] ${device.macAddress ?? "MAC não disponível"}'); // ⭐ MOSTRAR MAC BLE
    
    // Mostrar diálogo para coletar credenciais WiFi
    final wifiCredentials = await _showWifiCredentialsDialog();
    
    if (wifiCredentials == null) {
      print('🔵 Usuário cancelou a adoção');
      return;
    }
    
    // ✨ NOVO: Dialog com progresso em tempo real
    String currentStep = 'Iniciando...';
    bool isError = false;
    String? errorMessage;
    StateSetter? setDialogState; // ⭐ CORRIGIDO: nullable para evitar erro
    bool dialogMounted = true; // ⭐ Flag para verificar se o diálogo ainda existe
    
    // ⭐ Helper para atualizar estado do diálogo de forma segura
    void safeSetDialogState(VoidCallback fn) {
      if (dialogMounted && setDialogState != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (dialogMounted && setDialogState != null) {
            try {
              setDialogState!(fn);
            } catch (e) {
              print('⚠️ Erro ao atualizar diálogo: $e');
            }
          }
        });
      }
    }
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setState) {
          setDialogState = setState; // Guardar referência
          return Dialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Título
                  Text(
                    isError ? '❌ Erro na Configuração' : '🔧 Configurando Dispositivo',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: isError ? Colors.red : AppTheme.primary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  
                  // Progresso ou erro
                  if (!isError) ...[
                    const CircularProgressIndicator(),
                    const SizedBox(height: 20),
                  ] else ...[
                    Icon(
                      Icons.error_outline,
                      color: Colors.red,
                      size: 64,
                    ),
                    const SizedBox(height: 16),
                  ],
                  
                  // Mensagem de status
                  Text(
                    isError ? (errorMessage ?? 'Erro desconhecido') : currentStep,
                    style: TextStyle(
                      fontSize: 14,
                      color: isError ? Colors.red[700] : AppTheme.dark400,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  
                  // Botão de fechar (só aparece em erro)
                  if (isError) ...[
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () {
                        dialogMounted = false; // ⭐ Marcar diálogo como fechado
                        Navigator.pop(dialogContext);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                      ),
                      child: const Text('Fechar'),
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
    
    // Helper para atualizar o dialog de forma segura
    void updateDialog(String step) {
      currentStep = step;
      safeSetDialogState(() {}); // ⭐ Usa helper seguro com addPostFrameCallback
    }
    
    try {
      final auth = context.read<AuthProvider>();
      final token = await auth.authToken;
      
      if (token == null) {
        throw Exception('Você não está autenticado. Faça login novamente.');
      }
      
      // 1️⃣ Gerar API Key no backend
      updateDialog('1/3 - Gerando chave de acesso no servidor...');
      
      // ⭐ Usar deviceId COMPLETO (ex: "edge-go-d7e2b4") - mais consistente com resto da API
      final deviceId = device.id;
      
      print('');
      print('🎯 ============================================');
      print('🎯 INICIANDO ADOÇÃO DO DISPOSITIVO');
      print('🎯 ============================================');
      print('📡 Device ID: $deviceId');
      print('📡 Device Name: ${device.name}');
      print('📡 URL: ${AppConfig.apiBaseUrl}/devices/$deviceId/generate-key');
      print('🎯 ============================================');
      print('');
      
      final apiUrl = '${AppConfig.apiBaseUrl}/devices/$deviceId/generate-key';
      print('📡 Fazendo POST para: $apiUrl');
      print('📡 Payload: {"type": "edge-go"}');
      
      final apiKeyResponse = await http.post(
        Uri.parse(apiUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'type': 'edge-go'}),
      ).timeout(const Duration(seconds: 15));
      
      print('');
      print('📥 Resposta do servidor:');
      print('   Status Code: ${apiKeyResponse.statusCode}');
      print('   Body: ${apiKeyResponse.body}');
      print('');
      
      if (apiKeyResponse.statusCode != 200 && apiKeyResponse.statusCode != 201) {
        print('❌ Erro do servidor!');
        throw Exception('Servidor retornou erro: ${apiKeyResponse.statusCode}\n${apiKeyResponse.body}');
      }
      
      final apiKeyData = jsonDecode(apiKeyResponse.body);
      final apiKey = apiKeyData['apiKey'] as String;
      
      print('✅ API Key gerada: ${apiKey.substring(0, 20)}...');
      
      // 2️⃣ Configurar dispositivo via BLE
      updateDialog('2/3 - Enviando configuração via Bluetooth...\n\n'
                   '⏳ Aguarde, isso pode levar até 30 segundos.\n'
                   'O dispositivo está salvando WiFi e reiniciando.');
      
      print('📡 Configurando dispositivo via BLE...');
      print('📡 Usando device.id para BLE: ${device.id}');
      
      // ⭐ CORRIGIDO: Buscar o BluetoothDevice real do cache
      final bluetoothDevice = _iotService.getBluetoothDevice(device.id);
      if (bluetoothDevice == null) {
        throw Exception('❌ Device BLE não encontrado no cache.\n\n'
                       'Por favor, volte à tela de dispositivos e escaneie novamente.');
      }
      print('✅ [BLE] Device encontrado no cache: ${bluetoothDevice.platformName}');
      
      final edgeService = GranoboxEdgeService();
      
      final configured = await edgeService.configureEdge(
        deviceId: device.id,
        bluetoothDevice: bluetoothDevice, // ⭐ PASSAR o device BLE real
        wifiSsid: wifiCredentials['ssid']!,
        wifiPassword: wifiCredentials['password'],
        useStaticIp: false,
        apiKey: apiKey,
        apiUrl: AppConfig.apiBaseUrl,
      );
      
      if (!configured) {
        throw Exception('Dispositivo não respondeu via Bluetooth.\n\n'
                       'Verifique se:\n'
                       '• O dispositivo está ligado\n'
                       '• Bluetooth está ativo no celular\n'
                       '• O dispositivo está próximo (< 5 metros)');
      }
      
      print('✅ Dispositivo configurado via BLE');
      
      // 3️⃣ Registrar dispositivo no backend
      updateDialog('3/3 - Registrando dispositivo no servidor...');
      
      // Pegar clientId e operationId do AuthProvider
      final clientId = auth.user?.clientId;
      
      print('');
      print('🎯 ============ DEBUG ADOPTION ============');
      print('🎯 Device ID: ${device.id}');
      print('🎯 Device Name: $name');
      print('🎯 Auth Token: ${token != null ? "✅ Present" : "❌ Missing"}');
      print('🎯 ClientId: $clientId');
      print('🎯 OperationId: ${operation.id}');
      print('🎯 Operation Name: ${operation.name}');
      print('🎯 API Key: ${apiKey.substring(0, 20)}...');
      print('🎯 ==========================================');
      print('');
      
      print('💾 Registrando dispositivo no backend...');
      print('📱 BLE Address: ${device.macAddress}');
      print('🔑 API Key a ser registrada: $apiKey');
      
      try {
        String? deviceDbId;
        
        try {
          deviceDbId = await _deviceApiService.registerDevice(
            deviceId: device.id,
            apiKey: apiKey,
            authToken: token,
            name: name,
            clientId: clientId,
            operationId: operation.id,
            bleAddress: device.macAddress,
          );
        } catch (e) {
          // ⭐ Se estiver em staging e falhar (ex: operação não existe), tentar sem operationId
          if (ApiConfig.isStaging && e.toString().contains('500')) {
            print('⚠️ Erro 500 em staging - tentando registrar sem operationId...');
            deviceDbId = await _deviceApiService.registerDevice(
              deviceId: device.id,
              apiKey: apiKey,
              authToken: token,
              name: name,
              clientId: clientId,
              // operationId omitido em staging como fallback
              bleAddress: device.macAddress,
            );
          } else {
            rethrow;
          }
        }
        
        if (deviceDbId == null) {
          throw Exception('Falha ao registrar dispositivo no backend - nenhum ID retornado');
        }
        
        print('✅ Dispositivo registrado no backend (DB ID: $deviceDbId)');
        print('✅ API Key salva no banco de dados com sucesso!');
      } catch (e) {
        print('❌ ERRO ao registrar dispositivo no backend:');
        print('   Erro: $e');
        throw Exception('Falha ao registrar dispositivo no backend:\n$e');
      }
      
      // 3.5. Criar impressora automaticamente no Granobox
      print('🖨️ Criando impressora automaticamente...');
      try {
        final userId = auth.user?.id;
        if (clientId != null && userId != null) {
          final granoboxService = GranoboxPrinterCreateService();
          await granoboxService.createUSBPrinter(
            token: token!,
            clientId: clientId,
            createdById: userId,
            name: name,
            deviceId: device.id, // Usar device.id como deviceId
            ip: '0.0.0.0', // Será atualizado dinamicamente
            port: 3001,
            location: 'Não definida',
            usage: ['validity'],
            brand: 'Zebra',
            model: 'ZD230',
          );
          print('✅ Impressora criada automaticamente');
        } else {
          print('⚠️ ClientId ou UserId não encontrado - impressora não criada');
        }
      } catch (e) {
        print('⚠️ Erro ao criar impressora (não crítico): $e');
        // Não interromper o fluxo se a criação da impressora falhar
      }
      
      // ✅ Fechar loading
      dialogMounted = false; // ⭐ Marcar diálogo como fechado ANTES de pop
      if (mounted) {
        try {
          Navigator.pop(context);
        } catch (e) {
          print('⚠️ Erro ao fechar diálogo: $e');
        }
      }
      
      // Aguardar um frame para garantir que o diálogo foi fechado
      await Future.delayed(const Duration(milliseconds: 100));
      
      // ✅ Mostrar sucesso
      if (mounted) {
        try {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('$name configurado com sucesso!\n\n'
                           '⏳ Aguarde 10-30 segundos para o dispositivo conectar ao WiFi.\n'
                           '📡 Rede: ${wifiCredentials['ssid']}'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 6),
            ),
          );
        } catch (e) {
          print('⚠️ Erro ao mostrar snackbar: $e');
        }
      }
      
      // Aguardar antes de recarregar
      await Future.delayed(const Duration(milliseconds: 200));
      
      // Recarregar lista de dispositivos adotados
      if (mounted) {
        try {
          await _loadAdoptedDevices();
        } catch (e) {
          print('⚠️ Erro ao recarregar dispositivos: $e');
        }
      }
      
    } catch (e) {
      print('❌ Erro ao adotar: $e');
      
      // ⭐ CORREÇÃO: Tratar erro 409 (dispositivo já registrado) com mensagem mais clara
      String finalErrorMessage;
      if (e.toString().contains('já está registrado para outro usuário') || 
          e.toString().contains('já registrado')) {
        finalErrorMessage = 'Este dispositivo já está registrado para outro usuário.\n\n'
            'Para adotar este dispositivo, é necessário que o usuário anterior o remova primeiro.\n\n'
            'Entre em contato com o suporte se precisar de ajuda.';
      } else {
        finalErrorMessage = e.toString().replaceAll('Exception: ', '');
      }
      
      // ❌ Atualizar dialog para mostrar erro de forma segura
      isError = true;
      errorMessage = finalErrorMessage;
      safeSetDialogState(() {}); // ⭐ Usa helper seguro
      
      // Esperar um pouco para o usuário ver o erro antes de poder fechar
      await Future.delayed(const Duration(milliseconds: 500));
    }
  }
  
  /// Envia um teste de impressão para o dispositivo usando template padrão
  Future<void> _testPrint(IoTDevice device) async {
    try {
      print('🖨️ [TEST PRINT] Testando impressão em ${device.name}');
      
      // Obter autenticação
      final authProvider = context.read<AuthProvider>();
      final token = await authProvider.authToken;
      final clientId = authProvider.user?.clientId;
      
      if (token == null || token.isEmpty) {
        throw Exception('Usuário não autenticado');
      }
      
      if (clientId == null || clientId.isEmpty) {
        throw Exception('ClientId não disponível');
      }
      
      // Verificar se o dispositivo está adotado e tem ID válido
      if (!device.isAdopted) {
        throw Exception('Dispositivo não adotado. Adote o dispositivo primeiro.');
      }
      
      // Usar device.id como printerId (já deve ser edge-go-xxx ou edge-pro-xxx)
      final printerId = device.id;
      if (!printerId.startsWith('edge-go-') && !printerId.startsWith('edge-pro-')) {
        throw Exception('ID do dispositivo inválido. Deve ser edge-go-xxx ou edge-pro-xxx');
      }
      
      // ⭐ CORRIGIDO: Usar showPrintModal (padrão da aplicação)
      await showPrintModal(
        context: context,
        title: 'Teste de Impressão',
        subtitle: device.name,
        printFunction: (onProgress) async {
          // ⭐ Toda a lógica acontece DENTRO do modal
          onProgress?.call('Buscando template padrão...');
          
          // Buscar template padrão de validade
          print('🔍 [TEST PRINT] Buscando template padrão de validade...');
          final templatesService = TemplatesService();
          String? templateId;
          
          try {
            templateId = await templatesService.getDefaultTemplateIdForClient(
              clientId: clientId,
              labelType: 'validity',
              token: token,
            );
            print('📋 [TEST PRINT] Template padrão encontrado: ${templateId ?? 'não configurado'}');
          } catch (e) {
            print('⚠️ [TEST PRINT] Erro ao buscar template padrão: $e');
          }
          
          // Usar template padrão Granobox se não houver template do cliente
          templateId ??= TemplatesService().granoboxDefaultTemplate.id;
          print('🧩 [TEST PRINT] Template final: $templateId');
          
          onProgress?.call('Preparando dados de teste...');
          
          // Criar dados mock para teste
          final now = DateTime.now();
          final validadeDate = now.add(const Duration(days: 7));
          
          // ⭐ Formatar data no formato brasileiro com hora (dd/MM/yyyy HH:mm)
          String formatDateBR(DateTime date) {
            final dd = date.day.toString().padLeft(2, '0');
            final mm = date.month.toString().padLeft(2, '0');
            final yyyy = date.year.toString();
            final hh = date.hour.toString().padLeft(2, '0');
            final min = date.minute.toString().padLeft(2, '0');
            return '$dd/$mm/$yyyy $hh:$min';
          }
          
          // ⭐ Buscar logo do cliente
          String? logoUuid;
          try {
            final clientService = ClientService();
            final clientInfo = await clientService.getClientInfo(clientId, token);
            logoUuid = clientInfo?['tagmentLogoUuid']?.toString();
            if (logoUuid != null && logoUuid!.isNotEmpty) {
              print('🖼️ [TEST PRINT] Logo UUID do cliente encontrado: $logoUuid');
            } else {
              print('⚠️ [TEST PRINT] Logo UUID do cliente não configurado');
            }
          } catch (e) {
            print('⚠️ [TEST PRINT] Falha ao obter logo do cliente: $e');
          }
          
          final labelData = {
            'nome_produto': 'TESTE DE IMPRESSÃO',
            'marca': 'GRANOBOX',
            'sif': '0000', // ⭐ CORRIGIDO: Removido "SIF", só o número
            'codigo': '',
            'emb_original': formatDateBR(now), // ⭐ CORRIGIDO: Formato brasileiro com hora
            'manipulacao': formatDateBR(now), // ⭐ CORRIGIDO: Formato brasileiro com hora
            'validade': formatDateBR(validadeDate), // ⭐ CORRIGIDO: Formato brasileiro com hora
            'qtd_peso': '1 UN',
            'responsavel': 'TESTE',
            'armazenamento': 'TESTE',
            'label_validade': 'TESTE',
            'lote_industria': '',
            'data_vencimento_industria': '',
            if (logoUuid != null && logoUuid!.isNotEmpty) 'logo': logoUuid, // ⭐ NOVO: Logo do cliente
          };
          
          // Criar serviço v1.5
          final v15Service = V15PrintService(
            baseUrl: ApiConfig.granoboxApiUrl,
            authToken: token,
          );
          
          print('🚀 [TEST PRINT] Enviando impressão via WebSocket...');
          print('   Printer ID: $printerId');
          print('   Template ID: $templateId');
          print('   Cópias: 1');
          
          onProgress?.call('Enviando para impressora...');
          
          // Imprimir usando o mesmo fluxo do fluxo normal
          final result = await v15Service.printGenericLabel(
            printerId: printerId,
            templateId: templateId,
            copies: 1,
            labelData: labelData,
          );
          
          print('📨 [TEST PRINT] Resposta recebida:');
          print('   Success: ${result.success}');
          print('   Message: ${result.message}');
          
          if (!result.success) {
            // ⭐ CORREÇÃO: Tratar erro 404 (impressora não encontrada) com mensagem mais clara
            final errorMessage = result.message ?? 'Erro desconhecido';
            if (errorMessage.contains('não encontrada') || 
                errorMessage.contains('Impressora não encontrada') ||
                errorMessage.contains('404')) {
              throw Exception('Impressora não encontrada no sistema.\n\n'
                  'A impressora ainda não foi criada. Aguarde alguns segundos e tente novamente.\n\n'
                  'Se o problema persistir, verifique se o dispositivo está conectado ao WiFi.');
            }
            throw Exception(errorMessage);
          }
          
          // Converter V15PrintResult para TagmentPrintResult
          return TagmentPrintResult.success(
            result.message ?? 'Teste de impressão enviado com sucesso',
            result.jobId ?? '',
            null,
          );
        },
        onSuccess: () {
          print('✅ [TEST PRINT] Teste enviado com sucesso!');
        },
        onError: () {
          print('❌ [TEST PRINT] Erro ao testar impressão');
        },
      );
    } catch (e) {
      print('❌ [TEST PRINT] Erro: $e');
      
      if (mounted) {
        ScaffoldMessenger.of(context).hideCurrentSnackBar();
        
        // ⭐ CORREÇÃO: Mensagem mais amigável para erro de impressora não encontrada
        String errorMessage;
        if (e.toString().contains('não encontrada') || 
            e.toString().contains('Impressora não encontrada')) {
          errorMessage = 'Impressora não encontrada no sistema.\n\n'
              'A impressora ainda não foi criada. Aguarde alguns segundos e tente novamente.\n\n'
              'Se o problema persistir, verifique se o dispositivo está conectado ao WiFi.';
        } else {
          errorMessage = 'Erro ao enviar teste:\n${e.toString().replaceAll('Exception: ', '')}';
        }
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 8), // Mais tempo para ler mensagem longa
          ),
        );
      }
    }
  }
  
  /// Diálogo para coletar credenciais WiFi
  Future<Map<String, String>?> _showWifiCredentialsDialog() {
    return showGranoboxWifiDialog(
      context,
      title: 'Credenciais WiFi',
      confirmLabel: 'Configurar',
    );
  }
  
  /// Modal de comandos (dispositivos adotados)
  void _showDeviceCommandsSheet(IoTDevice device) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _DeviceCommandsSheet(
        device: device,
        iotService: _iotService,
        edgeHttpService: _edgeHttpService,
        parentContext: this.context,
      ),
    );
  }

  /// Renomear dispositivo
  Future<void> _showRenameDialog(IoTDevice device) async {
    final controller = TextEditingController(text: device.name);

    try {
      final result = await showDialog<String>(
        context: context,
        builder: (context) => AlertDialog(
          backgroundColor: AppTheme.dark800,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Text(
            'Renomear Dispositivo',
            style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
          ),
          content: TextField(
            controller: controller,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Nome',
              labelStyle: const TextStyle(color: AppTheme.dark300),
              hintText: 'Ex: Expedição, Recebimento...',
              hintStyle: const TextStyle(color: AppTheme.dark600),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppTheme.dark700),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppTheme.dark700),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppTheme.primary),
              ),
            ),
            autofocus: true,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'Cancelar',
                style: TextStyle(color: Colors.white),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                final newName = controller.text.trim();
                Navigator.pop(context, newName);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
              ),
              child: const Text('Salvar'),
            ),
          ],
        ),
      );

      if (result != null && result.isNotEmpty && result != device.name) {
        await _renameDevice(device, result);
      }
    } finally {
      controller.dispose();
    }
  }

  Future<void> _renameDevice(IoTDevice device, String newName) async {
    try {
      final authProvider = context.read<AuthProvider>();
      final token = await authProvider.authToken;

      if (token == null) {
        throw Exception('Token não encontrado');
      }

      // Usar o serviço Granobox para atualizar o nome via PATCH /devices/:deviceId
      final response = await http.patch(
        Uri.parse('${AppConfig.apiBaseUrl}/devices/${device.id}'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'name': newName}),
      );

      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Nome atualizado com sucesso!'),
            backgroundColor: Colors.green,
          ),
        );

        // Recarregar lista de dispositivos
        _loadAdoptedDevices();
      } else {
        throw Exception('Erro ao renomear: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao renomear dispositivo: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao renomear: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}

/// Widget stateful para comandos do dispositivo (com atualização de status)
class _DeviceCommandsSheet extends StatefulWidget {
  final IoTDevice device;
  final IoTDeviceService iotService;
  final EdgeHttpService edgeHttpService;
  final BuildContext parentContext;
  
  const _DeviceCommandsSheet({
    required this.device,
    required this.iotService,
    required this.edgeHttpService,
    required this.parentContext,
  });
  
  @override
  State<_DeviceCommandsSheet> createState() => _DeviceCommandsSheetState();
}

class _DeviceCommandsSheetState extends State<_DeviceCommandsSheet> {
  IoTDeviceStatus? _currentStatus;
  bool _isLoadingStatus = false;
  bool _isConnectingBLE = false;
  bool _bleConnected = false;
  
  @override
  void initState() {
    super.initState();
    
    // ⭐ CONECTAR VIA BLE AO ABRIR MODAL (se tiver bleAddress)
    if (widget.device.macAddress != null) {
      _connectBLE();
    } else {
      // Sem bleAddress: tentar HTTP
      _loadStatus();
    }
    
    // ❌ REMOVIDO: Timer automático (só atualiza quando clicar em "Atualizar")
  }
  
  @override
  void dispose() {
    // ⭐ DESCONECTAR BLE ao fechar modal
    if (_bleConnected && widget.device.macAddress != null) {
      print('🔌 Desconectando BLE ao fechar modal...');
      widget.iotService.disconnect(widget.device.macAddress!);
    }
    
    super.dispose();
  }
  
  /// Conectar ao dispositivo via BLE
  Future<void> _connectBLE() async {
    final bleAddress = widget.device.macAddress;
    if (bleAddress == null) {
      print('⚠️  Sem bleAddress disponível');
      return;
    }
    
    setState(() => _isConnectingBLE = true);
    
    try {
      print('🔵 Conectando ao BLE: $bleAddress...');
      
      // Iniciar scan para encontrar o device
      final found = await widget.iotService.scanAndConnect(
        bleAddress,
        timeout: const Duration(seconds: 10),
      );
      
      if (found) {
        print('✅ Conectado via BLE!');
        setState(() {
          _bleConnected = true;
          _isConnectingBLE = false;
        });
        
        // Agora ler status
        _loadStatus();
      } else {
        print('⚠️  Device BLE não encontrado após 10s de scan');
        setState(() => _isConnectingBLE = false);
        
        // Fallback: tentar HTTP se tiver IP
        _loadStatus();
      }
    } catch (e) {
      print('❌ Erro ao conectar BLE: $e');
      setState(() => _isConnectingBLE = false);
      
      // Fallback: tentar HTTP
      _loadStatus();
    }
  }
  
  Future<void> _loadStatus() async {
    if (_isLoadingStatus) return;
    
    setState(() => _isLoadingStatus = true);
    
    try {
      IoTDeviceStatus? status;
      
      // ⭐ CORRIGIDO: Para Edge-Go, sempre priorizar BLE se tiver macAddress (mais confiável)
      if (widget.device.type == IoTDeviceType.edgeGo && widget.device.macAddress != null) {
        print('📱 [Edge-Go] Lendo status via BLE (prioridade)...');
        try {
          final bleAddress = widget.device.macAddress!;
          status = await widget.iotService.readStatus(bleAddress).timeout(
            const Duration(seconds: 10),
            onTimeout: () {
              print('⚠️  Timeout ao ler status via BLE');
              return null;
            },
          );
          
          if (status != null) {
            print('✅ Status obtido via BLE');
          } else {
            print('⚠️  Status BLE retornou null - tentando HTTP como fallback...');
          }
        } catch (e) {
          print('❌ Erro ao ler status via BLE: $e - tentando HTTP como fallback...');
        }
        
        // Fallback: tentar HTTP se BLE falhou e tiver IP
        if (status == null) {
          final ip = widget.device.status?.ipAddress;
          if (ip != null && ip.isNotEmpty) {
            print('📡 [Edge-Go] Fallback: lendo status via HTTP (IP: $ip)...');
            final edgeHttpService = EdgeHttpService();
            try {
              final statusJson = await edgeHttpService.getStatus(ip: ip, port: 80).timeout(
                const Duration(seconds: 3),
                onTimeout: () => null,
              );
              
              if (statusJson != null) {
                status = IoTDeviceStatus.fromJson(statusJson);
                print('✅ Status obtido via HTTP (fallback)');
              }
            } catch (e) {
              print('⚠️  Erro HTTP (fallback): $e');
            }
          }
        }
      }
      // Edge-Pro: tentar HTTP primeiro (não usa BLE)
      else if (widget.device.type == IoTDeviceType.edgePro) {
        final ip = widget.device.status?.ipAddress;
        
        if (ip != null && ip.isNotEmpty) {
          print('📡 [Edge-Pro] Lendo status via HTTP (IP: $ip)...');
          
          final edgeHttpService = EdgeHttpService();
          try {
            final statusJson = await edgeHttpService.getStatus(ip: ip, port: 8080).timeout(
              const Duration(seconds: 3),
              onTimeout: () => null,
            );
            
            if (statusJson != null) {
              status = IoTDeviceStatus.fromJson(statusJson);
              print('✅ Status obtido via HTTP');
            }
          } catch (e) {
            print('⚠️  Erro HTTP: $e - Device pode estar offline');
            status = null;
          }
        } else {
          print('⚠️  [Edge-Pro] Sem IP - aguardando heartbeat do backend...');
          status = null;
        }
      }
      // Dots: sempre usar BLE
      else {
        print('📱 [Dot] Lendo status via BLE...');
        final bleAddress = widget.device.macAddress ?? widget.device.id;
        try {
          status = await widget.iotService.readStatus(bleAddress).timeout(
            const Duration(seconds: 10),
            onTimeout: () {
              print('⚠️  Timeout ao ler status via BLE (Dot)');
              return null;
            },
          );
        } catch (e) {
          print('❌ Erro ao ler status via BLE (Dot): $e');
        }
      }
      
      if (mounted) {
        setState(() {
          _currentStatus = status;
          _isLoadingStatus = false;
        });
      }
    } catch (e) {
      print('❌ Erro ao ler status: $e');
      if (mounted) {
        setState(() => _isLoadingStatus = false);
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) => Container(
        decoration: BoxDecoration(
          color: AppTheme.dark800,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Handle
            Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
              child: Row(
                children: [
                  Icon(
                    PhosphorIcons.cpu,
                    color: AppTheme.primary,
                    size: 28,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.device.name,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          widget.device.id,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppTheme.dark400,
                            fontFamily: 'monospace',
                          ),
                        ),
                        if (widget.device.macAddress != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            'MAC: ${widget.device.macAddress}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppTheme.dark400,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(PhosphorIcons.x, color: AppTheme.dark400),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            
            Divider(height: 1, color: AppTheme.dark700),
            
            // ⭐ Banner de conexão BLE
            if (_isConnectingBLE)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                color: AppTheme.primary.withOpacity(0.1),
                child: Row(
                  children: [
                    SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation(AppTheme.primary),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Conectando via Bluetooth...',
                      style: TextStyle(
                        color: AppTheme.primary,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            
            // ⭐ Banner de BLE conectado
            if (_bleConnected && !_isConnectingBLE)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                color: Colors.green.withOpacity(0.1),
                child: Row(
                  children: [
                    Icon(PhosphorIcons.bluetoothConnected, size: 16, color: Colors.green),
                    const SizedBox(width: 12),
                    Text(
                      'Conectado via Bluetooth',
                      style: TextStyle(
                        color: Colors.green,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            
            // Conteúdo
            Expanded(
              child: ListView(
                controller: scrollController,
                padding: const EdgeInsets.all(20),
                children: [
                  // Status do dispositivo
                  _buildStatusSection(),
                  
                  const SizedBox(height: 24),
                  Divider(color: AppTheme.dark700),
                  const SizedBox(height: 16),
                  
                  // Comandos
                  _buildCommandsSection(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildStatusSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
        const Text(
          'Status do Dispositivo',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppTheme.dark100,
          ),
        ),
            const Spacer(),
            if (_isLoadingStatus)
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            const SizedBox(width: 8),
            TextButton.icon(
              onPressed: _loadStatus,
              icon: const Icon(PhosphorIcons.arrowClockwise, size: 16),
              label: const Text('Atualizar'),
              style: TextButton.styleFrom(
                foregroundColor: AppTheme.primary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        
        // WiFi
        _buildStatusRow(
          'Rede WiFi',
          _isLoadingStatus && _currentStatus == null
              ? 'Carregando...'
              : _currentStatus?.wifiConnected == true 
                  ? (_currentStatus?.wifiSsid != null ? '${_currentStatus!.wifiSsid}' : 'Conectado')
                  : 'Desconectado',
          _isLoadingStatus && _currentStatus == null
              ? AppTheme.dark400
              : _currentStatus?.wifiConnected == true ? Colors.green : Colors.red,
          icon: PhosphorIcons.wifiHigh,
        ),
        
        // ⭐ LAN (Ethernet) - Edge-Pro
        if (widget.device.type == IoTDeviceType.edgePro) ...[
          _buildStatusRow(
            'Rede LAN (Ethernet)',
            _isLoadingStatus && _currentStatus == null
                ? 'Carregando...'
                : _currentStatus?.lanConnected == true 
                    ? (_currentStatus?.lanIP != null ? '${_currentStatus!.lanIP}' : 'Conectado')
                    : 'Desconectado',
            _isLoadingStatus && _currentStatus == null
                ? AppTheme.dark400
                : _currentStatus?.lanConnected == true ? Colors.green : Colors.grey,
            icon: PhosphorIcons.plug,
          ),
        ],
        
        // IP (prioriza LAN se disponível)
        _buildStatusRow(
          'Endereço IP',
          _isLoadingStatus && _currentStatus == null
              ? 'Carregando...'
              : _currentStatus?.ipAddress ?? 'Sem IP',
          _isLoadingStatus && _currentStatus == null
              ? AppTheme.dark400
              : _currentStatus?.ipAddress != null ? Colors.blue : AppTheme.dark400,
          icon: PhosphorIcons.globe,
        ),
        
        // USB Printer
        _buildStatusRow(
          'Impressora USB',
          _isLoadingStatus && _currentStatus == null
              ? 'Carregando...'
              : _currentStatus?.usbConnected == true ? 'Conectada e pronta' : 'Desconectada',
          _isLoadingStatus && _currentStatus == null
              ? AppTheme.dark400
              : _currentStatus?.usbConnected == true ? Colors.green : Colors.orange,
          icon: PhosphorIcons.printer,
        ),
        
        const SizedBox(height: 8),
        Divider(color: AppTheme.dark700),
        const SizedBox(height: 8),
        
        // Backend/API
        _buildStatusRow(
          'API Granobox',
          _isLoadingStatus && _currentStatus == null
              ? 'Carregando...'
              : _currentStatus?.backendAuthenticated == true ? 'Autenticado' : 'Não autenticado',
          _isLoadingStatus && _currentStatus == null
              ? AppTheme.dark400
              : _currentStatus?.backendAuthenticated == true ? Colors.green : Colors.red,
          icon: PhosphorIcons.shieldCheck,
        ),
        
        // WebSocket (Edge-Pro e Edge-Go)
        if (widget.device.type == IoTDeviceType.edgePro)
          _buildStatusRow(
            'WebSocket (Socket.IO)',
            _isLoadingStatus && _currentStatus == null
                ? 'Carregando...'
                : _currentStatus?.backendAuthenticated == true ? 'Conectado' : 'Desconectado',
            _isLoadingStatus && _currentStatus == null
                ? AppTheme.dark400
                : _currentStatus?.backendAuthenticated == true ? Colors.green : Colors.red,
            icon: PhosphorIcons.lightning,
          )
        else
          _buildStatusRow(
            'Comunicação',
            _isLoadingStatus && _currentStatus == null
                ? 'Carregando...'
                : _currentStatus?.mqttConnected == true 
                    ? 'WebSocket Conectado' 
                    : _currentStatus?.backendAuthenticated == true 
                        ? 'API Conectada'
                        : 'Desconectado',
            _isLoadingStatus && _currentStatus == null
                ? AppTheme.dark400
                : (_currentStatus?.mqttConnected == true || _currentStatus?.backendAuthenticated == true) 
                    ? Colors.green 
                    : Colors.red,
            icon: PhosphorIcons.rss,
          ),
        
        // Status geral da nuvem (resumo)
        const SizedBox(height: 8),
        _buildStatusRow(
          'Status Geral',
          _isLoadingStatus && _currentStatus == null
              ? 'Carregando...'
              : _currentStatus?.backendAuthenticated == true
                  ? 'Totalmente operacional' 
                  : 'Offline',
          _isLoadingStatus && _currentStatus == null
              ? AppTheme.dark400
              : _currentStatus?.backendAuthenticated == true
                  ? Colors.green 
                  : Colors.red,
          icon: PhosphorIcons.cloudCheck,
        ),
        
        // Uptime (se disponível)
        if (_currentStatus?.uptime != null) ...[
          const SizedBox(height: 8),
          Divider(color: AppTheme.dark700),
          const SizedBox(height: 8),
          _buildStatusRow(
            'Tempo Ligado',
            _formatUptime(_currentStatus!.uptime!),
            AppTheme.dark300,
            icon: PhosphorIcons.clock,
          ),
        ],
      ],
    );
  }
  
  Widget _buildStatusRow(String label, String value, Color color, {required IconData icon}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 8),
          Text(
            label + ':',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: AppTheme.dark200,
            ),
          ),
          const Spacer(),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
  
  /// Formata uptime em formato amigável
  String _formatUptime(int seconds) {
    if (seconds < 60) {
      return '$seconds seg';
    } else if (seconds < 3600) {
      final mins = (seconds / 60).floor();
      return '$mins min';
    } else if (seconds < 86400) {
      final hours = (seconds / 3600).floor();
      final mins = ((seconds % 3600) / 60).floor();
      return '${hours}h ${mins}min';
    } else {
      final days = (seconds / 86400).floor();
      final hours = ((seconds % 86400) / 3600).floor();
      return '${days}d ${hours}h';
    }
  }
  
  Widget _buildCommandsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Comandos',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppTheme.dark100,
          ),
        ),
        const SizedBox(height: 12),
        
        _buildCommandButton(
          icon: PhosphorIcons.gear,
          label: 'Configurar Impressão',
          subtitle: 'Configurar etiquetas Tag e Validade + Teste',
          color: AppTheme.primary,
          onTap: _configurePrinting,
        ),
        _buildCommandButton(
          icon: PhosphorIcons.wifiHigh,
          label: 'Reconfigurar WiFi',
          subtitle: 'Alterar rede WiFi',
          color: Colors.purple,
          onTap: _reconfigureWifi,
        ),
        // ⭐ NOVO: Botão para regenerar API Key
        if (widget.device.type == IoTDeviceType.edgeGo || widget.device.type == IoTDeviceType.edgePro)
          _buildCommandButton(
            icon: PhosphorIcons.key,
            label: 'Regenerar API Key',
            subtitle: 'Gerar nova chave de autenticação',
            color: Colors.blue,
            onTap: _regenerateApiKey,
          ),
        // ⭐ REMOVIDO: Opção de reiniciar dispositivo
        // O reinício via software pode causar problemas de reconexão (WebSocket, WiFi, USB)
        // Se necessário, o usuário deve reiniciar fisicamente (desligar/ligar da tomada)
        // _buildCommandButton(
        //   icon: PhosphorIcons.arrowClockwise,
        //   label: 'Reiniciar',
        //   subtitle: 'Reiniciar dispositivo',
        //   color: Colors.amber,
        //   onTap: _restartDevice,
        // ),
        _buildCommandButton(
          icon: PhosphorIcons.trash,
          label: 'Remover Dispositivo',
          subtitle: 'Remover dispositivo da lista (não apaga configurações)',
          color: Colors.orange,
          onTap: _removeDevice,
        ),
        _buildCommandButton(
          icon: PhosphorIcons.warning,
          label: 'Reset de Fábrica',
          subtitle: 'Apagar todas as configurações',
          color: Colors.red,
          onTap: _resetDevice,
        ),
      ],
    );
  }
  
  Widget _buildCommandButton({
    required IconData icon,
    required String label,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.dark700.withOpacity(0.3),
              border: Border.all(color: AppTheme.dark600),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, size: 20, color: color),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        label,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.dark100,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.dark400,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  PhosphorIcons.caretRight,
                  size: 18,
                  color: AppTheme.dark500,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
  
  // Comandos
  /// Configurar impressão (Tag e Validade)
  Future<void> _configurePrinting() async {
    try {
      // Navegar para tela de configuração de impressão
      Navigator.pop(context); // Fechar modal atual
      
      // Navegar para configuração de impressão específica do Edge-Go
      await Navigator.push(
        widget.parentContext,
        MaterialPageRoute(
          builder: (context) => EdgeGoPrintConfigScreen(
            edgeGoDevice: widget.device,
          ),
        ),
      );
    } catch (e) {
      print('❌ Erro ao abrir configuração de impressão: $e');
      
      if (mounted) {
        ScaffoldMessenger.of(widget.parentContext).showSnackBar(
          SnackBar(
            content: Text('Erro ao abrir configuração: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  // REMOVIDO: Teste de impressão movido para dentro da configuração
  /*Future<void> _testPrint() async {
    print('🖨️ [DEBUG] _testPrint() chamado!');
    
    // Fechar modal de detalhes
    Navigator.pop(context);
    
    // Usar o provider existente (igual ao fluxo normal)
    final tagmentProvider = context.read<PrintProvider>();
    
    try {
      // Buscar impressora associada a este Edge-Go
      final printerInfo = tagmentProvider.impressoras.firstWhere(
        (p) => p.edgeAgentFingerprint == widget.device.id,
        orElse: () => throw Exception('Impressora não encontrada para este dispositivo'),
      );
      
      print('🖨️ Impressora encontrada: ${printerInfo.displayName}');
      
      // Dados placeholder para teste
      final hoje = DateTime.now();
      final validade = hoje.add(const Duration(days: 7));
      
      final templateData = {
        'produto': 'TESTE IMPRESSÃO',
        'marca': 'GRANOBOX',
        'sif': 'SIF 1234',
        'conservacao': 'RESFRIADO',
        'data_producao': '${hoje.day.toString().padLeft(2, '0')}/${hoje.month.toString().padLeft(2, '0')}/${hoje.year}',
        'data_validade': '${validade.day.toString().padLeft(2, '0')}/${validade.month.toString().padLeft(2, '0')}/${validade.year}',
        'peso_liquido': '1,0 kg',
        'lote_industria': 'L${hoje.millisecondsSinceEpoch % 100000}',
        'data_vencimento_industria': '${validade.day.toString().padLeft(2, '0')}/${validade.month.toString().padLeft(2, '0')}/${validade.year}',
      };
      
      // Usar showPrintModal (helper padrão do sistema)
      await showPrintModal(
        context: context,
        title: 'Teste de Impressão',
        subtitle: printerInfo.displayName,
        printFunction: (onProgress) => tagmentProvider.imprimirComTemplate(
          printer: printerInfo,
          templateId: 'validade_60x60',
          templateData: templateData,
          copies: 1,
          conservacao: 'RESFRIADO',
          onProgress: onProgress,
        ),
        onSuccess: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Etiqueta de teste impressa!'),
              backgroundColor: Colors.green,
            ),
          );
        },
        onError: () {
          print('❌ Erro na impressão de teste');
        },
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }*/
  
  /// ⭐ NOVO: Regenerar API Key e atualizar no dispositivo
  Future<void> _regenerateApiKey() async {
    print('🔐 [DEBUG] _regenerateApiKey() chamado!');
    
    // Confirmar ação
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        title: const Text(
          'Regenerar API Key',
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          'Deseja gerar uma nova API Key para este dispositivo?\n\n'
          'A API Key antiga será invalidada e o dispositivo será reconfigurado automaticamente.',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
            ),
            child: const Text('Regenerar'),
          ),
        ],
      ),
    );
    
    if (confirm != true) return;
    
    // Fechar modal de detalhes
    Navigator.pop(context);
    
    final rootContext = widget.parentContext;
    final messenger = ScaffoldMessenger.maybeOf(rootContext);
    final navigator = Navigator.of(rootContext, rootNavigator: true);
    
    bool loadingVisible = false;
    
    try {
      // Mostrar loading
      showDialog(
        context: rootContext,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          backgroundColor: AppTheme.dark800,
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(color: Colors.blue),
              const SizedBox(height: 20),
              const Text(
                'Regenerando API Key...',
                style: TextStyle(color: Colors.white),
              ),
            ],
          ),
        ),
      );
      loadingVisible = true;
      
      // 1. Obter token de autenticação
      final authService = AuthService();
      final authToken = await authService.getAuthToken();
      if (authToken == null) {
        throw Exception('Usuário não autenticado');
      }
      
      // 2. Gerar nova API Key no backend
      print('🔐 Gerando nova API Key para ${widget.device.id}...');
      final deviceApiService = DeviceApiService();
      
      // Usar fingerprint (MAC address) para gerar API Key
      final fingerprint = widget.device.id; // device.id já é o fingerprint/MAC
      
      final apiKeyResponse = await deviceApiService.generateDeviceApiKey(
        authToken: authToken,
        fingerprint: fingerprint,
        deviceType: widget.device.type == IoTDeviceType.edgeGo ? 'edge-go' : 'edge-pro',
      );
      
      final newApiKey = apiKeyResponse['api_key'] as String? ?? apiKeyResponse['apiKey'] as String?;
      if (newApiKey == null || newApiKey.isEmpty) {
        throw Exception('API Key não foi gerada pelo backend');
      }
      
      print('✅ Nova API Key gerada: ${newApiKey.substring(0, 20)}...');
      
      // 3. Buscar/encontrar dispositivo BLE antes de atualizar API Key
      updateDialog('Procurando dispositivo via Bluetooth...\n\n'
                   '⏳ Certifique-se de que o dispositivo está próximo e ligado.');
      
      print('🔍 Procurando dispositivo BLE: ${widget.device.id}');
      BluetoothDevice? bluetoothDevice;
      
      // Tentar múltiplas formas de encontrar o dispositivo
      if (widget.device.macAddress != null) {
        // 1. Tentar cache primeiro
        bluetoothDevice = widget.iotService.getBluetoothDevice(widget.device.macAddress!);
        print('   Cache (por MAC): ${bluetoothDevice != null ? "✅ Encontrado" : "❌ Não encontrado"}');
      }
      
      // 2. Tentar por device ID
      if (bluetoothDevice == null) {
        bluetoothDevice = widget.iotService.getBluetoothDevice(widget.device.id);
        print('   Cache (por ID): ${bluetoothDevice != null ? "✅ Encontrado" : "❌ Não encontrado"}');
      }
      
      // 3. Se não encontrou no cache, fazer scan
      if (bluetoothDevice == null) {
        print('   🔍 Dispositivo não encontrado no cache, fazendo scan...');
        updateDialog('Escaneando dispositivos Bluetooth...\n\n'
                     '⏳ Por favor, aguarde.');
        
        // Usar scanAndConnect do iotService
        final found = await widget.iotService.scanAndConnect(
          widget.device.macAddress ?? widget.device.id,
          timeout: const Duration(seconds: 10),
        );
        
        if (found) {
          bluetoothDevice = widget.iotService.getBluetoothDevice(
            widget.device.macAddress ?? widget.device.id,
          );
          print('   ✅ Dispositivo encontrado após scan!');
        } else {
          throw Exception('❌ Dispositivo não encontrado via Bluetooth.\n\n'
                         'Certifique-se de que:\n'
                         '- O dispositivo está ligado\n'
                         '- O Bluetooth está ativado no tablet\n'
                         '- O dispositivo está próximo (alguns metros)');
        }
      }
      
      if (bluetoothDevice == null) {
        throw Exception('❌ Não foi possível encontrar o dispositivo Bluetooth');
      }
      
      print('✅ BluetoothDevice encontrado: ${bluetoothDevice.platformName}');
      
      // 4. Atualizar API Key no dispositivo via BLE
      updateDialog('Enviando nova API Key via Bluetooth...\n\n'
                   '⏳ O dispositivo aplicará a nova chave automaticamente.');
      
      final edgeService = GranoboxEdgeService();
      
      final success = await edgeService.updateApiKeyOnly(
        deviceId: widget.device.id,
        bluetoothDevice: bluetoothDevice,
        apiKey: newApiKey,
        apiUrl: ApiConfig.baseUrl,
      );
      
      if (!success) {
        throw Exception('Falha ao atualizar API Key no dispositivo');
      }
      
      // Fechar loading
      if (loadingVisible && navigator.canPop()) {
        navigator.pop();
        loadingVisible = false;
      }
      
      // Mostrar sucesso
      messenger?.showSnackBar(
        const SnackBar(
          content: Text('✅ API Key regenerada e atualizada com sucesso!'),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 5),
        ),
      );
      
      print('✅ API Key regenerada e atualizada!');
      
    } catch (e) {
      // Fechar loading se ainda estiver aberto
      if (loadingVisible && navigator.canPop()) {
        navigator.pop();
        loadingVisible = false;
      }
      
      print('❌ Erro ao regenerar API Key: $e');
      
      messenger?.showSnackBar(
        SnackBar(
          content: Text('Erro: $e'),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 5),
        ),
      );
    }
  }
  
  void updateDialog(String message) {
    // Helper para atualizar mensagem do diálogo (se necessário)
    print('📱 Dialog: $message');
  }
  
  Future<void> _reconfigureWifi() async {
    print('📶 [DEBUG] _reconfigureWifi() chamado!');
    
    // Fechar modal de detalhes para abrir o diálogo principal
    Navigator.pop(context);
    
    final rootContext = widget.parentContext;
    final messenger = ScaffoldMessenger.maybeOf(rootContext);
    final navigator = Navigator.of(rootContext, rootNavigator: true);
    
    // Coletar novas credenciais
    final wifiData = await showGranoboxWifiDialog(
      rootContext,
      title: 'Atualizar WiFi',
      confirmLabel: 'Atualizar',
    );
    
    if (wifiData == null) return;
    
    final ssid = wifiData['ssid']!;
    final password = wifiData['password'];
    
    bool loadingVisible = false;
    try {
      // Mostrar loading no contexto raiz
      showDialog(
        context: rootContext,
        barrierDismissible: false,
        builder: (_) => const Center(
          child: CircularProgressIndicator(),
        ),
      );
      loadingVisible = true;
      
      // Usar bleAddress se disponível, senão usar deviceId
      final deviceIdentifier = widget.device.macAddress ?? widget.device.id;
      print('📶 Reconfigurando WiFi via BLE ($deviceIdentifier)...');
      
      final success = await widget.iotService.reconfigureWiFi(
        deviceIdentifier,
        ssid,
        password: password,
      );
      
      // Fechar loading se ainda estiver aberto
      if (loadingVisible && navigator.canPop()) {
        navigator.pop();
        loadingVisible = false;
      }
      
      if (success) {
        print('✅ Reconfiguração de WiFi reportada com sucesso pelo serviço BLE.');
        messenger?.showSnackBar(
          const SnackBar(
            content: Text('WiFi reconfigurado! O dispositivo irá reiniciar.'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        throw Exception('Falha ao reconfigurar WiFi');
      }
    } catch (e) {
      if (loadingVisible && navigator.canPop()) {
        navigator.pop();
        loadingVisible = false;
      }
      
      messenger?.showSnackBar(
        SnackBar(
          content: Text('Erro: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  Future<void> _restartDevice() async {
    print('🔄 [DEBUG] _restartDevice() chamado!');
    
    // Confirmar ação
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reiniciar Dispositivo'),
        content: const Text('Deseja reiniciar o dispositivo? Ele ficará offline por alguns segundos.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Reiniciar'),
          ),
        ],
      ),
    );
    
    if (confirm != true) return;
    
    // Fechar modal de detalhes
    Navigator.pop(context);
    
    try {
      // Mostrar loading
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(),
        ),
      );
      
      // ⭐ CORRIGIDO: Tentar via API HTTP primeiro (mais confiável se dispositivo estiver online)
      // Usar deviceId (edge-go-xxx ou edge-pro-xxx) para o endpoint
      final deviceId = widget.device.id;
      print('🔄 Tentando reiniciar dispositivo via API HTTP ($deviceId)...');
      
      bool success = false;
      
      // Tentar via API HTTP primeiro (para Edge-Go e Edge-Pro)
      if (widget.device.type == IoTDeviceType.edgeGo || widget.device.type == IoTDeviceType.edgePro) {
        try {
          final authProvider = Provider.of<AuthProvider>(widget.parentContext, listen: false);
          final token = await authProvider.authToken;
          
          if (token != null) {
            final response = await http.post(
              Uri.parse('${AppConfig.apiBaseUrl}/edge-go-ws/device/$deviceId/reboot'),
              headers: {
                'Authorization': 'Bearer $token',
                'Content-Type': 'application/json',
              },
            ).timeout(const Duration(seconds: 10));
            
            if (response.statusCode == 200) {
              final data = jsonDecode(response.body);
              if (data['success'] == true) {
                print('✅ Dispositivo reiniciado via API HTTP');
                success = true;
              }
            } else {
              print('⚠️ API HTTP retornou ${response.statusCode}, tentando BLE...');
            }
          }
        } catch (e) {
          print('⚠️ Erro ao reiniciar via API HTTP: $e - tentando BLE como fallback...');
        }
      }
      
      // Fallback: tentar via BLE se API HTTP falhou ou não é Edge-Go/Edge-Pro
      if (!success) {
        // Usar bleAddress se disponível, senão usar deviceId
        final deviceIdentifier = widget.device.macAddress ?? widget.device.id;
        print('🔄 Tentando reiniciar dispositivo via BLE ($deviceIdentifier)...');
        
        success = await widget.iotService.restartDevice(deviceIdentifier);
      }
      
      // Fechar loading
      if (mounted) Navigator.pop(context);
      
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Dispositivo reiniciando...'),
            backgroundColor: Colors.green,
          ),
        );
      } else if (mounted) {
        throw Exception('Falha ao reiniciar dispositivo. Verifique se o dispositivo está online ou próximo.');
      }
    } catch (e) {
      // Fechar loading se ainda estiver aberto
      if (mounted && Navigator.canPop(context)) {
        Navigator.pop(context);
      }
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  /// Remover dispositivo da lista
  Future<void> _removeDevice() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        title: const Text(
          'Remover Dispositivo',
          style: TextStyle(color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Tem certeza que deseja remover este dispositivo?',
              style: TextStyle(color: AppTheme.dark200),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.orange.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Icon(PhosphorIcons.info, color: Colors.orange, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'O dispositivo será removido apenas da lista. As configurações no dispositivo não serão apagadas.',
                      style: TextStyle(
                        color: Colors.orange,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(
              'Cancelar',
              style: TextStyle(color: AppTheme.dark300),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              foregroundColor: Colors.white,
            ),
            child: const Text('Remover'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        // Fechar o modal atual
        Navigator.pop(context);
        
        // Mostrar loading no contexto pai
        showDialog(
          context: widget.parentContext,
          barrierDismissible: false,
          builder: (context) => const Center(
            child: CircularProgressIndicator(),
          ),
        );

        // Remover do backend (se necessário)
        final authToken = await AuthService().getAuthToken();
        if (authToken != null) {
          try {
            // ⭐ CORRIGIDO: Usar deviceId (edge-go-xxx) para o endpoint
            // O widget.device.id já deve estar no formato correto (edge-go-xxx ou edge-pro-xxx)
            final deviceId = widget.device.id;
            print('🗑️  Removendo dispositivo do backend: $deviceId');
            
            final success = await DeviceApiService().deleteDevice(
              authToken,
              deviceId,
            );
            if (success) {
              print('✅ Dispositivo removido do backend');
            } else {
              print('⚠️ Falha ao remover do backend (continuando)');
            }
          } catch (e) {
            print('⚠️ Erro ao remover do backend (continuando): $e');
            print('   Stack: ${e.toString()}');
            // Não falhar se não conseguir remover do backend
          }
        }

        // Remover da lista local
        widget.iotService.removeDevice(widget.device.id);
        
        // Fechar loading
        Navigator.pop(widget.parentContext);
        
        // Mostrar sucesso
        ScaffoldMessenger.of(widget.parentContext).showSnackBar(
          SnackBar(
            content: Text('✅ Dispositivo "${widget.device.name}" removido com sucesso'),
            backgroundColor: Colors.green,
          ),
        );
        
      } catch (e) {
        // Fechar loading se estiver aberto
        Navigator.pop(widget.parentContext);
        
        ScaffoldMessenger.of(widget.parentContext).showSnackBar(
          SnackBar(
            content: Text('❌ Erro ao remover dispositivo: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
  
  Future<void> _resetDevice() async {
    print('⚠️ [DEBUG] _resetDevice() chamado!');
    
    // Confirmar ação (DUPLA CONFIRMAÇÃO por ser destrutivo)
    final confirm1 = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('⚠️ Reset de Fábrica'),
        content: const Text(
          'ATENÇÃO: Esta ação irá apagar TODAS as configurações do dispositivo!\n\n'
          'O dispositivo voltará ao estado de fábrica e precisará ser configurado novamente.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Continuar'),
          ),
        ],
      ),
    );
    
    if (confirm1 != true) return;
    
    // Segunda confirmação
    final confirm2 = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('🚨 Confirmar Reset'),
        content: const Text(
          'Tem certeza absoluta que deseja resetar o dispositivo?\n\n'
          'Esta ação NÃO PODE ser desfeita!',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade700,
            ),
            child: const Text('RESETAR'),
          ),
        ],
      ),
    );
    
    if (confirm2 != true) return;
    
    // Fechar modal de detalhes
    Navigator.pop(context);
    
    try {
      // Mostrar loading
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(),
        ),
      );
      
      // Usar bleAddress se disponível, senão usar deviceId
      final deviceIdentifier = widget.device.macAddress ?? widget.device.id;
      print('🔄 Resetando dispositivo via BLE ($deviceIdentifier)...');
      
      final success = await widget.iotService.resetDevice(deviceIdentifier);
      
      // Fechar loading
      if (mounted) Navigator.pop(context);
      
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Dispositivo resetado! Ele voltará ao estado de fábrica.'),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 5),
          ),
        );
      } else if (mounted) {
        throw Exception('Falha ao resetar dispositivo');
      }
    } catch (e) {
      // Fechar loading se ainda estiver aberto
      if (mounted && Navigator.canPop(context)) {
        Navigator.pop(context);
      }
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}

/// Exibe diálogo padronizado para coletar SSID e senha do WiFi (com scan 2.4 GHz)
Future<Map<String, String>?> showGranoboxWifiDialog(
  BuildContext context, {
  String title = 'Credenciais WiFi',
  String confirmLabel = 'Configurar',
}) async {
  final ssidController = TextEditingController();
  final passwordController = TextEditingController();
  final messenger = ScaffoldMessenger.maybeOf(context);

  bool obscurePassword = true;
  bool isScanning = false;
  bool manualMode = false;
  String? selectedNetwork;

  final List<String> networkOptions = [];
  final Map<String, String> networkLabels = {};

  Future<void> scanWifiNetworks(StateSetter setState, BuildContext dialogContext) async {
    if (!dialogContext.mounted) return;

    setState(() {
      isScanning = true;
      manualMode = false;
      selectedNetwork = null;
      networkOptions.clear();
      networkLabels.clear();
    });

    try {
      var locationStatus = await Permission.locationWhenInUse.status;
      
      // Se a permissão não está concedida, tentar solicitar
      if (!locationStatus.isGranted) {
        // Se está permanentemente negada, abrir Ajustes
        if (locationStatus.isPermanentlyDenied) {
          if (!dialogContext.mounted) return;
          setState(() {
            isScanning = false;
            manualMode = true;
          });
          
          // Mostrar diálogo explicando e oferecendo abrir Ajustes
          final shouldOpenSettings = await showDialog<bool>(
            context: dialogContext,
            builder: (innerContext) => AlertDialog(
              backgroundColor: AppTheme.dark800,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: const Row(
                children: [
                  Icon(Icons.location_off, color: Colors.orange),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Permissão Necessária',
                      style: TextStyle(color: Colors.white, fontSize: 18),
                    ),
                  ),
                ],
              ),
              content: const Text(
                'Para buscar redes WiFi, é necessário permitir o acesso à localização.\n\n'
                'O app precisa dessa permissão porque o iOS exige localização para escanear redes WiFi.\n\n'
                'Deseja abrir os Ajustes para ativar a permissão?',
                style: TextStyle(color: AppTheme.dark300, fontSize: 14),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(innerContext, false),
                  child: const Text('Cancelar', style: TextStyle(color: AppTheme.dark300)),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.pop(innerContext, true),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                  ),
                  child: const Text('Abrir Ajustes'),
                ),
              ],
            ),
          );
          
          if (shouldOpenSettings == true) {
            await openAppSettings();
          }
          
          return;
        }
        
        // Tentar solicitar a permissão
        locationStatus = await Permission.locationWhenInUse.request();
        
        if (!locationStatus.isGranted) {
          setState(() {
            isScanning = false;
            manualMode = true;
          });
          
          messenger?.showSnackBar(
            const SnackBar(
              content: Text('Permissão de localização negada. Você pode digitar o nome da rede manualmente.'),
              backgroundColor: Colors.orange,
              duration: Duration(seconds: 4),
            ),
          );
          return;
        }
      }

      final canStartScan = await WiFiScan.instance.canStartScan();
      if (canStartScan != CanStartScan.yes) {
        if (!dialogContext.mounted) return;
        setState(() {
          isScanning = false;
          manualMode = true;
        });
        
        messenger?.showSnackBar(
          const SnackBar(
            content: Text('Não foi possível iniciar o scan. Verifique se o WiFi e a localização estão ativados.'),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 4),
          ),
        );
        return;
      }

      await WiFiScan.instance.startScan();
      await Future.delayed(const Duration(seconds: 2));

      if (!dialogContext.mounted) return;

      final results = await WiFiScan.instance.getScannedResults();
      final networksBySsid = <String, WiFiAccessPoint>{};

      for (final ap in results) {
        if (ap.ssid.isEmpty) continue;

        final is24GHz = ap.frequency >= 2400 && ap.frequency < 2500;
        if (!is24GHz) continue;

        if (ap.level < -75) continue;

        final existing = networksBySsid[ap.ssid];
        if (existing == null || existing.level < ap.level) {
          networksBySsid[ap.ssid] = ap;
        }
      }

      final sorted = networksBySsid.values.toList()
        ..sort((a, b) => b.level.compareTo(a.level));

      if (!dialogContext.mounted) return;
      setState(() {
        isScanning = false;
        manualMode = sorted.isEmpty;
        networkOptions.clear();
        networkLabels.clear();

        for (final ap in sorted) {
          final label = ap.ssid;
          if (!networkLabels.containsKey(label)) {
            networkOptions.add(label);
            networkLabels[label] = ap.ssid;
          }
        }

        if (!manualMode && networkOptions.isNotEmpty) {
          selectedNetwork = networkOptions.first;
          ssidController.text = networkLabels[selectedNetwork] ?? '';
        } else {
          ssidController.clear();
          selectedNetwork = null;
        }
      });
      
      if (sorted.isEmpty) {
        messenger?.showSnackBar(
          const SnackBar(
            content: Text('Nenhuma rede WiFi 2.4 GHz encontrada. Digite o nome da rede manualmente.'),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      if (!dialogContext.mounted) return;
      setState(() {
        isScanning = false;
        manualMode = true;
        selectedNetwork = null;
        networkOptions.clear();
        networkLabels.clear();
      });

      messenger?.showSnackBar(
        SnackBar(
          content: Text('Erro ao buscar redes: $e'),
          backgroundColor: Colors.orange,
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  try {
    final result = await showDialog<Map<String, String>>(
      context: context,
      barrierDismissible: true,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setState) {
          final showDropdown = networkOptions.isNotEmpty && !manualMode;

          return AlertDialog(
            backgroundColor: AppTheme.dark800,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            titlePadding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
            contentPadding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
            actionsPadding: const EdgeInsets.fromLTRB(24, 0, 24, 16),
            title: Row(
              children: [
                Icon(Icons.wifi, color: AppTheme.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Escolha uma rede WiFi 2.4 GHz ou digite manualmente para conectar o Granobox Edge.',
                    style: TextStyle(
                      color: AppTheme.dark300,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: isScanning
                          ? null
                          : () => scanWifiNetworks(setState, dialogContext),
                      icon: isScanning
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.wifi_find, size: 18),
                      label: Text(
                        isScanning ? 'Buscando redes...' : 'Buscar redes WiFi (2.4 GHz)',
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.primary,
                        side: BorderSide(color: AppTheme.primary.withOpacity(0.4)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  if (showDropdown) ...[
                    DropdownButtonFormField<String>(
                      value: selectedNetwork,
                      decoration: InputDecoration(
                        labelText: 'Rede WiFi',
                        labelStyle: const TextStyle(color: Colors.white70),
                        prefixIcon: const Icon(Icons.wifi, color: Colors.white70),
                        filled: true,
                        fillColor: AppTheme.dark700,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        helperText: 'O Edge só conecta em redes 2.4 GHz',
                        helperStyle: const TextStyle(color: Colors.white38, fontSize: 11),
                      ),
                      dropdownColor: AppTheme.dark700,
                      items: networkOptions
                          .map(
                            (network) => DropdownMenuItem(
                              value: network,
                              child: Text(
                                network,
                                style: const TextStyle(color: Colors.white),
                              ),
                            ),
                          )
                          .toList(),
                      onChanged: (value) {
                        setState(() {
                          selectedNetwork = value;
                          ssidController.text = value != null
                              ? (networkLabels[value] ?? value)
                              : '';
                        });
                      },
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () {
                          setState(() {
                            manualMode = true;
                            selectedNetwork = null;
                            ssidController.clear();
                          });
                        },
                        child: const Text('Não encontrei minha rede'),
                      ),
                    ),
                  ] else ...[
                    TextField(
                      controller: ssidController,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        labelText: 'Nome da rede (SSID)',
                        hintText: 'Ex: Cozinha-Granobox',
                        labelStyle: const TextStyle(color: Colors.white70),
                        hintStyle: const TextStyle(color: Colors.white30),
                        prefixIcon: const Icon(Icons.wifi, color: Colors.white70),
                        filled: true,
                        fillColor: AppTheme.dark700,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                    if (networkOptions.isNotEmpty)
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton(
                          onPressed: () {
                            setState(() {
                              manualMode = false;
                              if (networkOptions.isNotEmpty) {
                                selectedNetwork = networkOptions.first;
                                ssidController.text = networkLabels[selectedNetwork] ?? '';
                              }
                            });
                          },
                          child: const Text('Escolher rede detectada'),
                        ),
                      ),
                  ],
                  const SizedBox(height: 18),
                  TextField(
                    controller: passwordController,
                    obscureText: obscurePassword,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      labelText: 'Senha do WiFi (opcional)',
                      hintText: 'Deixe em branco para redes abertas',
                      labelStyle: const TextStyle(color: Colors.white70),
                      hintStyle: const TextStyle(color: Colors.white30),
                      prefixIcon: const Icon(Icons.lock, color: Colors.white70),
                      suffixIcon: IconButton(
                        icon: Icon(
                          obscurePassword ? Icons.visibility : Icons.visibility_off,
                          color: Colors.white70,
                        ),
                        onPressed: () {
                          setState(() {
                            obscurePassword = !obscurePassword;
                          });
                        },
                      ),
                      filled: true,
                      fillColor: AppTheme.dark700,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Dica: posicione o Edge próximo ao roteador durante a configuração. '
                    'Se a rede for aberta, deixe a senha em branco.',
                    style: TextStyle(
                      color: AppTheme.dark300,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(dialogContext).pop(),
                child: const Text('Cancelar'),
              ),
              ElevatedButton(
                onPressed: () {
                  final ssid = ssidController.text.trim();
                  final password = passwordController.text.trim();

                  if (ssid.isEmpty) {
                    messenger?.showSnackBar(
                      const SnackBar(
                        content: Text('Informe o nome da rede (SSID).'),
                        backgroundColor: Colors.orange,
                      ),
                    );
                    return;
                  }

                  final result = <String, String>{
                    'ssid': ssid,
                  };

                  if (password.isNotEmpty) {
                    result['password'] = password;
                  }

                  Navigator.of(dialogContext).pop(result);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(confirmLabel),
              ),
            ],
          );
        },
      ),
    );
    
    return result;
  } finally {
    // Dispose dos controllers SEMPRE, independente do resultado
    ssidController.dispose();
    passwordController.dispose();
  }
}

// ==================== EDGE-PRO: QR Code Scanner ====================

class _QRCodeScanScreen extends StatefulWidget {
  @override
  State<_QRCodeScanScreen> createState() => _QRCodeScanScreenState();
}

class _QRCodeScanScreenState extends State<_QRCodeScanScreen> {
  bool _isScanning = true;
  final MobileScannerController controller = MobileScannerController();

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text(
          'Escanear QR Code do Edge-Pro',
          style: TextStyle(color: Colors.white),
        ),
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: controller,
            onDetect: (BarcodeCapture capture) {
              if (_isScanning && capture.barcodes.isNotEmpty) {
                final String? code = capture.barcodes.first.rawValue;
                if (code != null && code.isNotEmpty) {
                  setState(() {
                    _isScanning = false;
                  });
                  Navigator.of(context).pop(code);
                }
              }
            },
          ),
          Center(
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                border: Border.all(
                  color: Colors.deepPurple,
                  width: 4,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
          Positioned(
            bottom: 60,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.black87,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'Posicione o QR Code do Edge-Pro dentro da área',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ==================== EDGE-PRO: Dialog de Configuração ====================

class _ConfigureEdgeProDialog extends StatefulWidget {
  final String edgeSSID;
  final String edgePassword;
  final String fingerprint;
  final String edgeIP;
  final TextEditingController wifiSsidController;
  final TextEditingController wifiPassController;

  const _ConfigureEdgeProDialog({
    required this.edgeSSID,
    required this.edgePassword,
    required this.fingerprint,
    required this.edgeIP,
    required this.wifiSsidController,
    required this.wifiPassController,
  });

  @override
  State<_ConfigureEdgeProDialog> createState() => _ConfigureEdgeProDialogState();
}

class _ConfigureEdgeProDialogState extends State<_ConfigureEdgeProDialog> {
  bool _obscurePassword = true;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppTheme.dark800,
      title: Row(
        children: [
          const Icon(Icons.qr_code_scanner, color: Colors.deepPurple),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Configurar Edge-Pro',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Passo 1: Conectar no WiFi do Edge-Pro
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.blue.withOpacity(0.3),
                  width: 2,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: const BoxDecoration(
                          color: Colors.blue,
                          shape: BoxShape.circle,
                        ),
                        child: const Center(
                          child: Text(
                            '1',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'CONECTE NO WiFi DO EDGE-PRO',
                          style: TextStyle(
                            color: Colors.blue,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    '• Abra as configurações WiFi do seu celular',
                    style: TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '• Procure a rede: "${widget.edgeSSID}"',
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Text(
                        '• Senha: ',
                        style: TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.blue.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          widget.edgePassword,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    '• Aguarde conectar',
                    style: TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Passo 2: Configurar WiFi da casa
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.deepPurple.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.deepPurple.withOpacity(0.3),
                  width: 2,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: const BoxDecoration(
                          color: Colors.deepPurple,
                          shape: BoxShape.circle,
                        ),
                        child: const Center(
                          child: Text(
                            '2',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'CONFIGURE SEU WiFi',
                          style: TextStyle(
                            color: Colors.deepPurple,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Preencha os dados do WiFi onde o Edge-Pro ficará conectado:',
                    style: TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),
            
            TextField(
              controller: widget.wifiSsidController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'SSID',
                hintText: 'Nome da sua rede',
                labelStyle: TextStyle(color: Colors.white70),
                hintStyle: TextStyle(color: Colors.white30),
                prefixIcon: Icon(Icons.wifi, color: Colors.white70),
                enabledBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.white30),
                ),
                focusedBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.deepPurple),
                ),
              ),
            ),
            const SizedBox(height: 16),
            
            TextField(
              controller: widget.wifiPassController,
              obscureText: _obscurePassword,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'Senha',
                hintText: 'Senha da rede',
                labelStyle: const TextStyle(color: Colors.white70),
                hintStyle: const TextStyle(color: Colors.white30),
                prefixIcon: const Icon(Icons.lock, color: Colors.white70),
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscurePassword ? Icons.visibility : Icons.visibility_off,
                    color: Colors.white70,
                  ),
                  onPressed: () {
                    setState(() {
                      _obscurePassword = !_obscurePassword;
                    });
                  },
                ),
                enabledBorder: const UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.white30),
                ),
                focusedBorder: const UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.deepPurple),
                ),
              ),
            ),
            
            const SizedBox(height: 20),
            
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: Colors.orange.withOpacity(0.3),
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber, color: Colors.orange, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Conecte-se manualmente ao WiFi "${widget.edgeSSID}" (senha: ${widget.edgePassword}) antes de clicar em Adotar.',
                      style: TextStyle(
                        color: Colors.orange.withOpacity(0.9),
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('Cancelar'),
        ),
        ElevatedButton(
          onPressed: () {
            if (widget.wifiSsidController.text.trim().isEmpty ||
                widget.wifiPassController.text.trim().isEmpty) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Preencha SSID e senha'),
                  backgroundColor: Colors.red,
                ),
              );
              return;
            }
            
            Navigator.pop(context, true);
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.deepPurple,
            foregroundColor: Colors.white,
          ),
          child: const Text('Adotar'),
        ),
      ],
    );
  }
}
