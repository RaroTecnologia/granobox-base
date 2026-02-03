import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../theme/app_theme.dart';
import '../services/granobox_edge_service.dart';
import '../services/device_api_service.dart';
import '../services/auth_service.dart';
import '../services/granobox_printer_create_service.dart';
import '../providers/auth_provider.dart';
import 'package:provider/provider.dart';

class EdgeConfigScreen extends StatefulWidget {
  const EdgeConfigScreen({super.key});

  @override
  State<EdgeConfigScreen> createState() => _EdgeConfigScreenState();
}

class _EdgeConfigScreenState extends State<EdgeConfigScreen> with SingleTickerProviderStateMixin {
  final GranoboxEdgeService _edgeService = GranoboxEdgeService();
  final DeviceApiService _deviceApiService = DeviceApiService();
  final AuthService _authService = AuthService();
  
  List<BLEEdgeDevice> _availableEdges = [];
  List<Map<String, dynamic>> _adoptedEdges = [];
  
  bool _scanning = false;
  bool _loadingEdges = false;
  bool _hasScanned = false;
  
  late TabController _tabController;
  int _currentTab = 0;
  
  // Tipo de device a ser adotado: 'edge-go' (BLE) ou 'edge-pro' (WiFi/QR)
  String _deviceType = 'edge-go';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      setState(() {
        _currentTab = _tabController.index;
      });
    });
    _loadAdoptedEdges();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _edgeService.dispose();
    super.dispose();
  }

  Future<void> _loadAdoptedEdges() async {
    setState(() => _loadingEdges = true);
    
    try {
      final authToken = await _authService.getAuthToken();
      if (authToken != null) {
        final devices = await _deviceApiService.getMyDevices(authToken);
        setState(() {
          // Filtrar Edge-Go (api_key começa com edg_) E Edge-Pro (api_key começa com grx_ ou tipo edge-pro)
          _adoptedEdges = devices.where((d) {
            final apiKey = d['api_key'] as String?;
            final type = d['type'] as String?;
            return (apiKey != null && (apiKey.startsWith('edg_') || apiKey.startsWith('grx_'))) ||
                   (type != null && (type == 'edge-go' || type == 'edge-pro'));
          }).toList();
        });
      }
    } catch (e) {
      print('❌ Erro ao carregar Edge devices: $e');
    } finally {
      setState(() => _loadingEdges = false);
    }
  }

  Future<void> _startScan() async {
    if (_scanning) return;
    
    // ⭐ CORREÇÃO: Capturar context antes de operações assíncronas
    final scaffoldContext = context;
    
    setState(() {
      _scanning = true;
      _hasScanned = true;
      _availableEdges = [];
    });
    
    try {
      _edgeService.scanResults.listen((edges) {
        if (mounted) {
          setState(() {
            _availableEdges = edges;
          });
        }
      });
      
      await _edgeService.startScan();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(scaffoldContext).showSnackBar(
          SnackBar(
            content: Text('Erro ao escanear: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _scanning = false);
      }
    }
  }

  Future<void> _configureEdge(BLEEdgeDevice edge) async {
    print('🔵 [DEBUG] _configureEdge chamado para ${edge.name}');
    
    final ssidController = TextEditingController();
    final passController = TextEditingController();
    final nameController = TextEditingController(text: edge.name);

    print('🔵 [DEBUG] Abrindo dialog de configuração...');
    
    // ⭐ CORREÇÃO: Capturar context antes de operações assíncronas
    final dialogContext = context;
    final confirmed = await showDialog<bool>(
      context: dialogContext,
      builder: (context) => _ConfigureEdgeDialog(
        edge: edge,
        ssidController: ssidController,
        passController: passController,
        nameController: nameController,
      ),
    );

    print('🔵 [DEBUG] Dialog fechado. Confirmado: $confirmed');

    // ⭐ CORREÇÃO: Capturar valores dos controllers ANTES de qualquer operação assíncrona
    // para evitar erro de controller descartado
    final name = nameController.text.trim();
    final ssid = ssidController.text.trim();
    final password = passController.text.trim().isEmpty ? null : passController.text.trim();
    
    // ⭐ CORREÇÃO: Dispor controllers após capturar valores
    ssidController.dispose();
    passController.dispose();
    nameController.dispose();

    if (confirmed == true && mounted) {
      print('🔵 [DEBUG] Iniciando adoção...');
      await _adoptEdge(
        edge: edge,
        name: name,
        ssid: ssid,
        password: password,
      );
      print('🔵 [DEBUG] Adoção concluída');
    } else {
      print('🔵 [DEBUG] Adoção cancelada ou dialog fechado sem confirmação');
    }
  }

  Future<void> _adoptEdge({
    required BLEEdgeDevice edge,
    required String name,
    required String ssid,
    String? password,
  }) async {
    print('🟢 [DEBUG] _adoptEdge INICIADO');
    print('🟢 [DEBUG] Edge: ${edge.name} (${edge.fingerprint})');
    print('🟢 [DEBUG] Name: $name');
    print('🟢 [DEBUG] SSID: $ssid');
    print('🟢 [DEBUG] Senha: ${password == null || password.isEmpty ? "(rede aberta)" : "(informada)"}');
    
    try {
      // Mostrar loading
      if (!mounted) {
        print('🔴 [DEBUG] Widget não mounted - abortando');
        return;
      }
      
      print('🟢 [DEBUG] Mostrando loading dialog...');
      final loadingContext = context; // Capturar context antes de operações assíncronas
      showDialog(
        context: loadingContext,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(),
        ),
      );

      // 1. Obter token de autenticação e dados do usuário
      print('🟢 [DEBUG] Obtendo token de autenticação...');
      final authToken = await _authService.getAuthToken();
      if (authToken == null) {
        print('🔴 [DEBUG] Token não encontrado!');
        if (mounted) {
          Navigator.pop(loadingContext);
        }
        throw Exception('Token de autenticação não encontrado');
      }
      print('🟢 [DEBUG] Token obtido: ${authToken.substring(0, 20)}...');
      
      // ⭐ CORREÇÃO: Obter dados do usuário diretamente do AuthService
      // em vez de usar Provider, para evitar erro _dependents.isEmpty
      print('🟢 [DEBUG] Obtendo dados do usuário...');
      final userData = await _authService.getUserData();
      final clientId = userData?.clientId;
      final userId = userData?.id;
      print('🟢 [DEBUG] ClientId: $clientId, UserId: $userId');

      // 2. Gerar API Key no backend
      print('🔐 Gerando API Key para Edge-Go ${edge.fingerprint}...');
      
      // Extrair MAC do fingerprint (Edge-Go XXXXXX -> 80:B5:4E:XX:XX:XX)
      final fingerprint = edge.fingerprint;
      
      final apiKeyResponse = await _deviceApiService.generateDeviceApiKey(
        authToken: authToken,
        fingerprint: fingerprint,
        deviceType: 'edge-go',
      );

      print('📦 Resposta do backend: $apiKeyResponse');
      
      final apiKey = apiKeyResponse['api_key'] as String? ?? apiKeyResponse['apiKey'] as String?;
      
      if (apiKey == null || apiKey.isEmpty) {
        throw Exception('API Key não foi gerada pelo backend');
      }
      
      print('✅ API Key gerada: $apiKey');

      // 3. Registrar device no backend (associar com userId)
      print('📝 Registrando Edge-Go no backend...');
      final deviceId = await _deviceApiService.registerDevice(
        deviceId: fingerprint,
        apiKey: apiKey,
        authToken: authToken,
        name: 'Edge-Go ${fingerprint.substring(fingerprint.length - 8)}',
      );
      
      if (deviceId == null) {
        throw Exception('Falha ao registrar Edge-Go no backend');
      }
      
      print('✅ Edge-Go registrado com ID: $deviceId');

      // 3.5. Criar impressora automaticamente no Granobox
      print('🖨️ Criando impressora automaticamente...');
      try {
        // ⭐ Valores já capturados no início da função
        if (clientId != null && userId != null) {
          final granoboxService = GranoboxPrinterCreateService();
          await granoboxService.createUSBPrinter(
            token: authToken,
            clientId: clientId,
            createdById: userId,
            name: 'Edge-Go ${fingerprint.substring(fingerprint.length - 8)}',
            deviceId: fingerprint, // Usar fingerprint como deviceId
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

      // 4. Configurar Edge-Go via BLE
      print('📱 Configurando Edge-Go via BLE...');
      final success = await _edgeService.configureEdge(
        deviceId: edge.id,
        wifiSsid: ssid,
        wifiPassword: password,
        useStaticIp: false, // Por enquanto sempre DHCP
        apiKey: apiKey,
        apiUrl: ApiConfig.baseUrl,
      );

      if (!mounted) return;
      Navigator.pop(loadingContext); // Fechar loading usando context capturado

      if (success) {
        // Mostrar sucesso
        if (!mounted) return;
        final scaffoldContext = context; // Capturar context antes de usar
        ScaffoldMessenger.of(scaffoldContext).showSnackBar(
          const SnackBar(
            content: Text('Edge-Go configurado com sucesso! Aguarde alguns segundos para aparecer em "Meus Edge-Go"'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 5),
          ),
        );

        // Recarregar lista após alguns segundos
        Future.delayed(const Duration(seconds: 5), () {
          if (mounted) {
            _loadAdoptedEdges();
          }
        });

        // Voltar para tab de "Meus Edge-Go"
        if (mounted) {
          _tabController.animateTo(1);
        }
      } else {
        throw Exception('Falha ao configurar Edge-Go via BLE');
      }

    } catch (e) {
      print('❌ Erro ao adotar Edge-Go: $e');
      if (mounted) {
        try {
          Navigator.pop(loadingContext); // Fechar loading usando context capturado
        } catch (_) {
          // Ignorar se dialog já foi fechado
        }
        final scaffoldContext = context; // Capturar context antes de usar
        
        // ⭐ CORREÇÃO: Tratar erro 409 (dispositivo já registrado) com mensagem mais clara
        String errorMessage;
        if (e.toString().contains('já está registrado para outro usuário') || 
            e.toString().contains('já registrado') ||
            e.toString().contains('Este dispositivo já está registrado')) {
          errorMessage = 'Este Edge-Go já está registrado para outro usuário.\n\n'
              'Para adotar este dispositivo, é necessário que o usuário anterior o remova primeiro.\n\n'
              'Entre em contato com o suporte se precisar de ajuda.';
        } else {
          errorMessage = 'Erro: ${e.toString().replaceAll('Exception: ', '')}';
        }
        
        ScaffoldMessenger.of(scaffoldContext).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 8), // Mais tempo para ler mensagem longa
          ),
        );
      }
    }
  }

  Future<bool> _deleteEdge(Map<String, dynamic> edge) async {
    try {
      final authToken = await _authService.getAuthToken();
      if (authToken == null) return false;

      final fingerprint = edge['fingerprint'] as String;
      await _deviceApiService.deleteDevice(authToken, fingerprint);
      
      return true;
    } catch (e) {
      return false;
    }
  }

  // ==================== EDGE-PRO (WiFi/QR Code) ====================

  Future<void> _startQRCodeScan() async {
    print('📱 Iniciando scan de QR Code...');
    
    // ⭐ CORREÇÃO: Capturar context antes de operações assíncronas
    final navigatorContext = context;
    
    final qrData = await Navigator.push<String>(
      navigatorContext,
      MaterialPageRoute(
        builder: (context) => _QRCodeScanScreen(),
      ),
    );

    if (qrData != null && mounted) {
      print('✅ QR Code escaneado: $qrData');
      await _processQRCodeData(qrData);
    }
  }

  Future<void> _processQRCodeData(String qrData) async {
    // ⭐ CORREÇÃO: Capturar context antes de operações assíncronas
    final scaffoldContext = context;
    
    try {
      final data = jsonDecode(qrData) as Map<String, dynamic>;
      
      final ssid = data['ssid'] as String?;
      final password = data['password'] as String?;
      final fingerprint = data['fingerprint'] as String?;
      final ip = data['ip'] as String? ?? '192.168.4.1';
      
      if (ssid == null || password == null || fingerprint == null) {
        throw Exception('QR Code inválido - dados faltando');
      }

      await _configureEdgePro(
        ssid: ssid,
        password: password,
        fingerprint: fingerprint,
        ip: ip,
      );

    } catch (e) {
      print('❌ Erro ao processar QR Code: $e');
      if (mounted) {
        ScaffoldMessenger.of(scaffoldContext).showSnackBar(
          SnackBar(
            content: Text('Erro: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _configureEdgePro({
    required String ssid,
    required String password,
    required String fingerprint,
    required String ip,
  }) async {
    final wifiSsidController = TextEditingController();
    final wifiPassController = TextEditingController();

    // ⭐ CORREÇÃO: Capturar context antes de operações assíncronas
    final dialogContext = context;
    final confirmed = await showDialog<bool>(
      context: dialogContext,
      builder: (context) => _ConfigureEdgeProDialog(
        edgeSSID: ssid,
        edgePassword: password,
        fingerprint: fingerprint,
        edgeIP: ip,
        wifiSsidController: wifiSsidController,
        wifiPassController: wifiPassController,
      ),
    );

    // ⭐ CORREÇÃO: Capturar valores dos controllers ANTES de qualquer operação assíncrona
    // para evitar erro de controller descartado
    final homeWiFiSSID = wifiSsidController.text.trim();
    final homeWiFiPassword = wifiPassController.text.trim();
    
    // ⭐ CORREÇÃO: Dispor controllers após capturar valores
    wifiSsidController.dispose();
    wifiPassController.dispose();

    if (confirmed == true && mounted) {
      await _adoptEdgePro(
        edgeSSID: ssid,
        edgePassword: password,
        fingerprint: fingerprint,
        edgeIP: ip,
        homeWiFiSSID: homeWiFiSSID,
        homeWiFiPassword: homeWiFiPassword,
      );
    }
  }

  Future<void> _adoptEdgePro({
    required String edgeSSID,
    required String edgePassword,
    required String fingerprint,
    required String edgeIP,
    required String homeWiFiSSID,
    required String homeWiFiPassword,
  }) async {
    print('🟢 Iniciando adoção do Edge-Pro $fingerprint');
    
    try {
      if (!mounted) return;
      
      // ⭐ CORREÇÃO: Capturar context antes de operações assíncronas
      final loadingContext = context;
      showDialog(
        context: loadingContext,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(),
        ),
      );

      final authToken = await _authService.getAuthToken();
      if (authToken == null) {
        throw Exception('Token de autenticação não encontrado');
      }

      print('🔐 Gerando API Key para Edge-Pro $fingerprint...');
      final apiKeyResponse = await _deviceApiService.generateDeviceApiKey(
        authToken: authToken,
        fingerprint: fingerprint,
        deviceType: 'edge-pro',
      );

      final apiKey = apiKeyResponse['api_key'] as String? ?? apiKeyResponse['apiKey'] as String?;
      
      if (apiKey == null || apiKey.isEmpty) {
        throw Exception('API Key não foi gerada pelo backend');
      }

      print('📝 Registrando Edge-Pro no backend...');
      final deviceId = await _deviceApiService.registerDevice(
        deviceId: fingerprint,
        apiKey: apiKey,
        authToken: authToken,
        name: 'Edge-Pro ${fingerprint.substring(fingerprint.length - 8)}',
      );
      
      if (deviceId == null) {
        throw Exception('Falha ao registrar Edge-Pro no backend');
      }

      print('📡 Configurando Edge-Pro via HTTP...');
      final configUrl = 'http://$edgeIP/configure';
      
      final configData = {
        'wifi_ssid': homeWiFiSSID,
        'wifi_password': homeWiFiPassword,
        'fingerprint': fingerprint,
        'api_key': apiKey,
        'backend_url': ApiConfig.baseUrl,
      };

      final response = await http.post(
        Uri.parse(configUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(configData),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode != 200) {
        throw Exception('Erro HTTP ${response.statusCode}: ${response.body}');
      }

      final result = jsonDecode(response.body);
      if (result['success'] != true) {
        throw Exception(result['message'] ?? 'Erro desconhecido');
      }

      if (!mounted) return;
      Navigator.pop(loadingContext); // Usar context capturado

      final scaffoldContext = context; // Capturar context antes de usar
      ScaffoldMessenger.of(scaffoldContext).showSnackBar(
        const SnackBar(
          content: Text('Edge-Pro configurado! Aguarde aparecer online'),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 5),
        ),
      );

      Future.delayed(const Duration(seconds: 10), () {
        if (mounted) {
          _loadAdoptedEdges();
        }
      });

      _tabController.animateTo(1);

    } catch (e) {
      print('❌ Erro ao adotar Edge-Pro: $e');
      if (mounted) {
        try {
          Navigator.pop(loadingContext); // Usar context capturado
        } catch (_) {
          // Ignorar se dialog já foi fechado
        }
        final scaffoldContext = context; // Capturar context antes de usar
        
        // ⭐ CORREÇÃO: Tratar erro 409 (dispositivo já registrado) com mensagem mais clara
        String errorMessage;
        if (e.toString().contains('já está registrado para outro usuário') || 
            e.toString().contains('já registrado') ||
            e.toString().contains('Este dispositivo já está registrado')) {
          errorMessage = 'Este Edge-Pro já está registrado para outro usuário.\n\n'
              'Para adotar este dispositivo, é necessário que o usuário anterior o remova primeiro.\n\n'
              'Entre em contato com o suporte se precisar de ajuda.';
        } else {
          errorMessage = 'Erro: ${e.toString().replaceAll('Exception: ', '')}';
        }
        
        ScaffoldMessenger.of(scaffoldContext).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 8), // Mais tempo para ler mensagem longa
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
        backgroundColor: AppTheme.dark800,
        title: const Text('Gerenciar Edge Devices'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _currentTab == 1 ? _loadAdoptedEdges : null,
            tooltip: 'Atualizar',
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.primary,
          labelColor: AppTheme.primary,
          unselectedLabelColor: Colors.white60,
          tabs: const [
            Tab(text: 'Adotar Novo Device', icon: Icon(Icons.add_circle_outline)),
            Tab(text: 'Meus Devices', icon: Icon(Icons.devices)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Adotar Novo Edge-Go
          _buildAdoptionTab(),
          
          // Tab 2: Meus Edge-Go
          _buildMyEdgesTab(),
        ],
      ),
    );
  }

  Widget _buildAdoptionTab() {
    return Column(
      children: [
        // Seletor de Tipo de Dispositivo
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _deviceType = 'edge-go'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      color: _deviceType == 'edge-go' ? AppTheme.primary : AppTheme.dark800,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _deviceType == 'edge-go' ? AppTheme.primary : AppTheme.dark700,
                        width: 2,
                      ),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.bluetooth,
                          color: _deviceType == 'edge-go' ? Colors.white : Colors.white60,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Edge-Go',
                          style: TextStyle(
                            color: _deviceType == 'edge-go' ? Colors.white : Colors.white60,
                            fontWeight: _deviceType == 'edge-go' ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                        Text(
                          'ESP32 BLE',
                          style: TextStyle(
                            color: _deviceType == 'edge-go' ? Colors.white70 : Colors.white30,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _deviceType = 'edge-pro'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      color: _deviceType == 'edge-pro' ? Colors.deepPurple : AppTheme.dark800,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _deviceType == 'edge-pro' ? Colors.deepPurple : AppTheme.dark700,
                        width: 2,
                      ),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          Icons.qr_code_scanner,
                          color: _deviceType == 'edge-pro' ? Colors.white : Colors.white60,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Edge-Pro',
                          style: TextStyle(
                            color: _deviceType == 'edge-pro' ? Colors.white : Colors.white60,
                            fontWeight: _deviceType == 'edge-pro' ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                        Text(
                          'Raspberry Pi',
                          style: TextStyle(
                            color: _deviceType == 'edge-pro' ? Colors.white70 : Colors.white30,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        
        // Botão de Scan baseado no tipo
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: SizedBox(
            width: double.infinity,
            child: _deviceType == 'edge-go' 
              ? ElevatedButton.icon(
                  onPressed: _scanning ? null : _startScan,
                  icon: _scanning
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Icon(Icons.bluetooth_searching),
                  label: Text(_scanning ? 'Escaneando BLE...' : 'Escanear via BLE'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                )
              : ElevatedButton.icon(
                  onPressed: _startQRCodeScan,
                  icon: const Icon(Icons.qr_code_scanner),
                  label: const Text('Escanear QR Code'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.deepPurple,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
          ),
        ),
        
        const SizedBox(height: 16),

        // Lista de dispositivos disponíveis (apenas para BLE)
        if (_deviceType == 'edge-go')
          Expanded(
            child: _availableEdges.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _hasScanned ? Icons.print_disabled : Icons.bluetooth_searching,
                        size: 64,
                        color: Colors.white30,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _hasScanned
                            ? 'Nenhum Edge-Go encontrado'
                            : 'Clique em "Escanear" para procurar\ndispositivos Edge-Go próximos',
                        style: const TextStyle(
                          color: Colors.white60,
                          fontSize: 16,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      if (_hasScanned) ...[
                        const SizedBox(height: 16),
                        const Text(
                          'Certifique-se que:\n'
                          '• O Edge-Go está ligado\n'
                          '• Bluetooth está ativado\n'
                          '• O dispositivo está próximo',
                          style: TextStyle(
                            color: Colors.white30,
                            fontSize: 14,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _availableEdges.length,
                  itemBuilder: (context, index) {
                    final edge = _availableEdges[index];
                    return Card(
                      color: AppTheme.dark800,
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: ListTile(
                        contentPadding: const EdgeInsets.all(16),
                        leading: Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(
                            Icons.print,
                            color: AppTheme.primary,
                          ),
                        ),
                        title: Text(
                          edge.name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            Text(
                              'ID: ${edge.fingerprint}',
                              style: const TextStyle(
                                color: Colors.white60,
                                fontSize: 12,
                              ),
                            ),
                            Text(
                              'Sinal: ${edge.rssi} dBm',
                              style: const TextStyle(
                                color: Colors.white60,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                        trailing: ElevatedButton(
                          onPressed: () {
                            print('🔵 [DEBUG] Botão ADOTAR clicado no card do ${edge.name}');
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('🔵 Abrindo configuração para ${edge.name}'),
                                backgroundColor: Colors.blue,
                                duration: const Duration(seconds: 2),
                              ),
                            );
                            _configureEdge(edge);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primary,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: const Text('Adotar'),
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildMyEdgesTab() {
    if (_loadingEdges) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (_adoptedEdges.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.print_disabled,
              size: 64,
              color: Colors.white30,
            ),
            const SizedBox(height: 16),
            const Text(
              'Nenhum Edge-Go adotado ainda',
              style: TextStyle(
                color: Colors.white60,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => _tabController.animateTo(0),
              child: const Text(
                'Adotar primeiro Edge-Go',
                style: TextStyle(color: AppTheme.primary),
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _adoptedEdges.length,
      itemBuilder: (context, index) {
        final edge = _adoptedEdges[index];
        final isOnline = edge['is_online'] == true;
        final lastSeen = edge['last_heartbeat'] as String?;

        return Card(
          color: AppTheme.dark800,
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            leading: Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: isOnline
                    ? Colors.green.withOpacity(0.2)
                    : Colors.red.withOpacity(0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.print,
                color: isOnline ? Colors.green : Colors.red,
              ),
            ),
            title: Text(
              edge['name'] ?? edge['fingerprint'],
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: isOnline ? Colors.green : Colors.red,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isOnline ? 'Online' : 'Offline',
                      style: TextStyle(
                        color: isOnline ? Colors.green : Colors.red,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  'API Key: ${edge['api_key']}',
                  style: const TextStyle(
                    color: Colors.white60,
                    fontSize: 11,
                    fontFamily: 'monospace',
                  ),
                ),
                if (lastSeen != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    'Último sinal: $lastSeen',
                    style: const TextStyle(
                      color: Colors.white30,
                      fontSize: 11,
                    ),
                  ),
                ],
              ],
            ),
            trailing: IconButton(
              icon: const Icon(Icons.delete, color: Colors.red),
              onPressed: () async {
                final confirm = await showDialog<bool>(
                  context: context,
                  builder: (context) => AlertDialog(
                    backgroundColor: AppTheme.dark800,
                    title: const Text(
                      'Excluir Edge-Go?',
                      style: TextStyle(color: Colors.white),
                    ),
                    content: Text(
                      'Deseja excluir ${edge['name'] ?? edge['fingerprint']}?',
                      style: const TextStyle(color: Colors.white70),
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
                        child: const Text('Excluir'),
                      ),
                    ],
                  ),
                );

                if (confirm == true) {
                  final success = await _deleteEdge(edge);
                  if (success && mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Edge-Go excluído'),
                        backgroundColor: Colors.green,
                      ),
                    );
                    _loadAdoptedEdges();
                  }
                }
              },
            ),
          ),
        );
      },
    );
  }
}

class _ConfigureEdgeDialog extends StatefulWidget {
  final BLEEdgeDevice edge;
  final TextEditingController ssidController;
  final TextEditingController passController;
  final TextEditingController nameController;

  const _ConfigureEdgeDialog({
    required this.edge,
    required this.ssidController,
    required this.passController,
    required this.nameController,
  });

  @override
  State<_ConfigureEdgeDialog> createState() => _ConfigureEdgeDialogState();
}

class _ConfigureEdgeDialogState extends State<_ConfigureEdgeDialog> {
  bool _obscurePassword = true;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppTheme.dark800,
      title: Text(
        'Adotar ${widget.edge.name}',
        style: const TextStyle(color: Colors.white),
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Configure as credenciais WiFi para o Edge-Go se conectar à rede.',
              style: TextStyle(color: Colors.white70, fontSize: 14),
            ),
            const SizedBox(height: 20),
            
            // WiFi SSID
            TextField(
              controller: widget.ssidController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'WiFi SSID',
                hintText: 'Nome da rede WiFi',
                labelStyle: TextStyle(color: Colors.white70),
                hintStyle: TextStyle(color: Colors.white30),
                prefixIcon: Icon(Icons.wifi, color: Colors.white70),
                enabledBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.white30),
                ),
                focusedBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: AppTheme.primary),
                ),
              ),
            ),
            const SizedBox(height: 16),
            
            // WiFi Password
            TextField(
              controller: widget.passController,
              obscureText: _obscurePassword,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'Senha WiFi (opcional)',
                hintText: 'Deixe em branco para redes abertas',
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
                  borderSide: BorderSide(color: AppTheme.primary),
                ),
              ),
            ),
            const SizedBox(height: 20),
            
            // Info sobre API Key
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: AppTheme.primary.withOpacity(0.3),
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, color: AppTheme.primary, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Uma API Key será gerada automaticamente para este dispositivo.',
                      style: TextStyle(
                        color: AppTheme.primary.withOpacity(0.9),
                        fontSize: 12,
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
            print('🔵 [DEBUG] Botão Adotar clicado no dialog!');
            print('🔵 [DEBUG] SSID: ${widget.ssidController.text.trim()}');
            print('🔵 [DEBUG] Pass: ${widget.passController.text.trim().isEmpty ? "(vazia)" : "(preenchida)"}');
            
            if (widget.ssidController.text.trim().isEmpty) {
              print('🔴 [DEBUG] Validação falhou - SSID vazio');
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Informe o nome da rede (SSID).'),
                  backgroundColor: Colors.red,
                  duration: Duration(seconds: 3),
                ),
              );
              return;
            }
            
            print('🔵 [DEBUG] Validação OK - fechando dialog com true');
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Iniciando adoção do Edge-Go...'),
                backgroundColor: Colors.green,
                duration: Duration(seconds: 2),
              ),
            );
            Navigator.pop(context, true);
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primary,
            foregroundColor: Colors.white,
          ),
          child: const Text('Adotar'),
        ),
      ],
    );
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
                  'Posicione o QR Code dentro da área',
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
                color: Colors.deepPurple.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: Colors.deepPurple.withOpacity(0.3),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Dispositivo: ${widget.fingerprint}',
                    style: TextStyle(
                      color: Colors.deepPurple.withOpacity(0.9),
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'WiFi Edge-Pro: ${widget.edgeSSID}',
                    style: TextStyle(
                      color: Colors.deepPurple.withOpacity(0.7),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            const Text(
              'Configure o WiFi da sua casa/empresa:',
              style: TextStyle(color: Colors.white70, fontSize: 14),
            ),
            const SizedBox(height: 16),
            
            TextField(
              controller: widget.wifiSsidController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'WiFi SSID (sua rede)',
                hintText: 'Nome da sua rede WiFi',
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
                labelText: 'Senha WiFi (sua rede)',
                hintText: 'Senha da sua rede WiFi',
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
                      'Conecte-se ao WiFi "${widget.edgeSSID}" (senha: ${widget.edgePassword}) antes de clicar em Adotar.',
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
                  content: Text('Preencha SSID e senha do seu WiFi'),
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

