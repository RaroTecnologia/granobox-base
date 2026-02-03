import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:permission_handler/permission_handler.dart';
import '../models/iot_device.dart';

/// Serviço unificado para gerenciar dispositivos IoT via BLE
class IoTDeviceService {
  // UUIDs (mesmos para Edge-Go e Dot)
  static const String serviceUuid = '4fac';
  static const String configCharUuid = 'beb5';
  static const String statusCharUuid = 'beb6';
  static const String commandCharUuid = 'beb7';
  
  // Stream de dispositivos descobertos
  final _devicesController = StreamController<List<IoTDevice>>.broadcast();
  Stream<List<IoTDevice>> get devicesStream => _devicesController.stream;
  
  final Map<String, IoTDevice> _discoveredDevices = {};
  final Map<String, BluetoothDevice> _bluetoothDevices = {}; // ⭐ NOVO: Cache dos devices BLE reais
  StreamSubscription? _scanSubscription;
  bool _isScanning = false;

  BluetoothDevice? _getCachedDevice(String identifier) {
    final lower = identifier.toLowerCase();
    if (_bluetoothDevices.containsKey(lower)) {
      return _bluetoothDevices[lower];
    }
    if (_bluetoothDevices.containsKey(identifier)) {
      return _bluetoothDevices[identifier];
    }
    for (final entry in _bluetoothDevices.entries) {
      final remote = entry.value.remoteId.toString().toLowerCase();
      if (remote == lower) {
        return entry.value;
      }
    }
    return null;
  }

  void _cacheBluetoothDevice(
    BluetoothDevice device, {
    String? id,
    String? name,
    String? mac,
  }) {
    final keys = <String>{
      device.remoteId.toString(),
      device.remoteId.toString().toLowerCase(),
      if (id != null && id.isNotEmpty) id.toLowerCase(),
      if (name != null && name.isNotEmpty) name.toLowerCase(),
      if (mac != null && mac.isNotEmpty) mac.toLowerCase(),
    };

    for (final key in keys) {
      _bluetoothDevices[key] = device;
    }
  }
  
  /// Garante que o Bluetooth esteja ligado antes de iniciar um scan.
  Future<bool> _ensureBluetoothReady({Duration timeout = const Duration(seconds: 6)}) async {
    BluetoothAdapterState initialState = await FlutterBluePlus.adapterState.first;
    print('🔄 Estado inicial do Bluetooth: $initialState');

    if (initialState == BluetoothAdapterState.on) {
      return true;
    }

    if (initialState == BluetoothAdapterState.unauthorized ||
        initialState == BluetoothAdapterState.unavailable) {
      print('❌ Bluetooth não autorizado ou indisponível: $initialState');
      return false;
    }

    final completer = Completer<bool>();
    late StreamSubscription<BluetoothAdapterState> sub;
    Timer? timer;

    sub = FlutterBluePlus.adapterState.listen((state) {
      print('🔁 Bluetooth state update: $state');
      if (state == BluetoothAdapterState.on && !completer.isCompleted) {
        completer.complete(true);
        sub.cancel();
        timer?.cancel();
      } else if ((state == BluetoothAdapterState.off ||
              state == BluetoothAdapterState.unauthorized ||
              state == BluetoothAdapterState.unavailable) &&
          !completer.isCompleted) {
        completer.complete(false);
        sub.cancel();
        timer?.cancel();
      }
    });

    timer = Timer(timeout, () {
      if (!completer.isCompleted) {
        print('⏱️ Timeout aguardando Bluetooth ligar');
        completer.complete(false);
      }
      sub.cancel();
    });

    final result = await completer.future;
    return result;
  }

  /// Solicitar permissões de Bluetooth necessárias para scan
  Future<bool> _requestBluetoothPermissions() async {
    print('🔐 Verificando permissões de Bluetooth...');
    
    if (Platform.isAndroid) {
      // Android 12+ requer permissões específicas de Bluetooth
      final bluetoothScan = await Permission.bluetoothScan.status;
      final bluetoothConnect = await Permission.bluetoothConnect.status;
      final locationWhenInUse = await Permission.locationWhenInUse.status;
      
      print('   BluetoothScan: $bluetoothScan');
      print('   BluetoothConnect: $bluetoothConnect');
      print('   Location: $locationWhenInUse');
      
      if (!bluetoothScan.isGranted || !bluetoothConnect.isGranted || !locationWhenInUse.isGranted) {
        print('🔐 Solicitando permissões...');
        final results = await [
          Permission.bluetoothScan,
          Permission.bluetoothConnect,
          Permission.locationWhenInUse,
        ].request();
        
        final allGranted = results.values.every((status) => status.isGranted);
        print('🔐 Resultado: ${allGranted ? "✅ Todas concedidas" : "❌ Algumas negadas"}');
        return allGranted;
      }
      return true;
    } else if (Platform.isIOS) {
      // iOS usa apenas Permission.bluetooth
      final bluetooth = await Permission.bluetooth.status;
      print('   Bluetooth: $bluetooth');
      
      if (!bluetooth.isGranted) {
        final result = await Permission.bluetooth.request();
        print('🔐 Resultado: ${result.isGranted ? "✅ Concedida" : "❌ Negada"}');
        return result.isGranted;
      }
      return true;
    }
    
    return true;
  }

  /// Iniciar scan contínuo de dispositivos
  Future<void> startScan() async {
    if (_isScanning) return;
    
    print('🔍 Iniciando scan de dispositivos IoT...');
    _isScanning = true;
    _discoveredDevices.clear();
    
    // ⭐ NOVO: Solicitar permissões antes de iniciar scan
    final hasPermissions = await _requestBluetoothPermissions();
    if (!hasPermissions) {
      print('❌ Permissões de Bluetooth não concedidas. Cancelando scan.');
      _isScanning = false;
      return;
    }
    
    // Verificar se Bluetooth está disponível
    if (await FlutterBluePlus.isSupported == false) {
      print('❌ Bluetooth não suportado neste dispositivo');
      _isScanning = false;
      return;
    }
    
    // Garantir que o Bluetooth esteja ligado (especialmente no iOS)
    final isReady = await _ensureBluetoothReady();
    if (!isReady) {
      print('⚠️ Bluetooth desligado ou indisponível. Cancelando scan.');
      _isScanning = false;
      return;
    }

    // Cancelar scan anterior se existir
    _scanSubscription?.cancel();
    
    // Escutar resultados do scan
    _scanSubscription = FlutterBluePlus.scanResults.listen((results) {
      // ⭐ DEBUG: Log de todos os dispositivos encontrados
      if (results.isNotEmpty) {
        print('📡 [BLE SCAN] ${results.length} dispositivos no scan:');
        for (var r in results) {
          final n = r.advertisementData.advName;
          if (n.isNotEmpty) {
            print('   • "$n" (${r.device.remoteId}) RSSI: ${r.rssi}');
          }
        }
      }
      
      for (ScanResult result in results) {
        final name = result.advertisementData.advName;
        final macAddress = result.device.remoteId.toString(); // MAC address do BLE
        
        // Filtrar dispositivos Edge-Go, Edge-Pro e Dot
        // Aceitar tanto formato novo (edge-go-d7e2b4) quanto antigo (Edge-Go 80:B5:4E:D7:E3:38)
        bool isEdgeGo = name.toLowerCase().startsWith('edge-go') || name.startsWith('Edge-Go');
        bool isEdgePro = name.toLowerCase().startsWith('edge-pro') || name.startsWith('Edge-Pro');
        bool isDot = name.toLowerCase().startsWith('dot') || name.startsWith('Dot');
        
        if (isEdgeGo || isEdgePro || isDot) {
          IoTDeviceType type;
          if (isEdgeGo) {
            type = IoTDeviceType.edgeGo;
          } else if (isEdgePro) {
            type = IoTDeviceType.edgePro;
          } else {
            type = IoTDeviceType.dot;
          }
          
          // Extrair ID (nome completo no novo formato ou MAC no antigo)
          final id = _extractIdFromName(name);
          
          if (id.isNotEmpty) {
            print('🔍 [BLE SCAN] Dispositivo encontrado:');
            print('   ID: $id');
            print('   Nome: $name');
            print('   MAC BLE: $macAddress'); // ⭐ LOG DO MAC
            print('   RSSI: ${result.rssi} dBm');
            
            // ⭐ Armazenar tanto o IoTDevice quanto o BluetoothDevice real
            _discoveredDevices[id] = IoTDevice(
              id: id,
              name: name,
              type: type,
              isOnline: true,
              rssi: result.rssi,
              lastSeen: DateTime.now(),
              macAddress: macAddress, // ⭐ NOVO: Sempre capturar MAC address
            );
            _cacheBluetoothDevice(
              result.device,
              id: id,
              name: name,
              mac: macAddress,
            ); // ⭐ NOVO: Cache do device BLE
          }
        }
      }
      
      // Notificar listeners
      _devicesController.add(_discoveredDevices.values.toList());
    });
    
    // Iniciar scan (sem filtro de serviço para pegar advertising)
    try {
      await FlutterBluePlus.startScan(
        timeout: Duration(seconds: 4),
        androidUsesFineLocation: true,
      );
    } on PlatformException catch (e) {
      print('❌ Erro de plataforma ao iniciar scan: ${e.code} - ${e.message}');
      _isScanning = false;
      _scanSubscription?.cancel();
      return;
    }
    
    // Continuar scanning em loop
    _continuousScan();
  }
  
  /// Scan contínuo (reinicia a cada 5 segundos)
  void _continuousScan() async {
    while (_isScanning) {
      await Future.delayed(Duration(seconds: 5));
      if (_isScanning) {
        await FlutterBluePlus.startScan(
          timeout: Duration(seconds: 4),
          androidUsesFineLocation: true,
        );
      }
    }
  }
  
  /// Parar scan
  Future<void> stopScan() async {
    print('🛑 Parando scan de dispositivos IoT...');
    _isScanning = false;
    _scanSubscription?.cancel();
    await FlutterBluePlus.stopScan();
  }
  
  /// Extrair ID do nome BLE
  String _extractIdFromName(String name) {
    // NOVO FORMATO (após padronização):
    // "edge-go-d7e2b4" -> "edge-go-d7e2b4" (retorna o nome completo)
    // "edge-pro-123456" -> "edge-pro-123456"
    // "dot-abcdef" -> "dot-abcdef"
    
    // FORMATO ANTIGO (compatibilidade):
    // "Edge-Go 80:B5:4E:D7:E3:38" -> "80:B5:4E:D7:E3:38"
    // "Dot 88:13:BF:02:A7:A2" -> "88:13:BF:02:A7:A2"
    
    // Se o nome contém espaço, extrair a parte após o espaço (formato antigo)
    if (name.contains(' ')) {
      final parts = name.split(' ');
      if (parts.length >= 2) {
        final id = parts.sublist(1).join(' ');
        // Validar formato MAC (XX:XX:XX:XX:XX:XX)
        if (RegExp(r'^[0-9A-F:]{17}$', caseSensitive: false).hasMatch(id)) {
          return id;
        }
      }
    }
    
    // Novo formato: retorna o nome completo (edge-go-d7e2b4, edge-pro-123456, etc)
    // Validar se tem o formato correto (palavras separadas por hífen)
    if (name.toLowerCase().startsWith('edge-go-') ||
        name.toLowerCase().startsWith('edge-pro-') ||
        name.toLowerCase().startsWith('dot-')) {
      return name.toLowerCase(); // Retornar em lowercase para consistência
    }
    
    // ⭐ Fallback: Para nomes tipo "Edge-Pro Staging", criar ID baseado no nome
    // Substituir espaços por hífen e converter para lowercase
    if (name.toLowerCase().startsWith('edge-go') ||
        name.toLowerCase().startsWith('edge-pro') ||
        name.toLowerCase().startsWith('dot')) {
      return name.toLowerCase().replaceAll(' ', '-');
    }
    
    return '';
  }
  
  /// Ler status de um dispositivo via BLE
  Future<IoTDeviceStatus?> readStatus(String deviceId) async {
    try {
      final device = await _findDeviceById(deviceId);
      if (device == null) {
        print('❌ Dispositivo $deviceId não encontrado');
        return null;
      }
      
      print('📱 Conectando ao $deviceId...');
      await device.connect(timeout: Duration(seconds: 10));
      
      print('🔍 Descobrindo serviços...');
      final services = await device.discoverServices();
      
      // Procurar serviço IoT
      final service = services.firstWhere(
        (s) => s.uuid.toString().toUpperCase().contains(serviceUuid.toUpperCase()),
        orElse: () => throw Exception('Serviço IoT não encontrado'),
      );
      
      // Procurar característica STATUS
      final statusChar = service.characteristics.firstWhere(
        (c) => c.uuid.toString().toUpperCase().contains(statusCharUuid.toUpperCase()),
        orElse: () => throw Exception('Característica STATUS não encontrada'),
      );
      
      print('📖 Lendo status...');
      final value = await statusChar.read();
      final jsonStr = utf8.decode(value);
      print('📊 Status recebido via BLE: $jsonStr');
      
      try {
        final json = jsonDecode(jsonStr);
        print('📊 JSON parseado: $json');
        final status = IoTDeviceStatus.fromJson(json);
        print('✅ Status convertido: WiFi=${status.wifiConnected}, USB=${status.usbConnected}, Backend=${status.backendAuthenticated}');
        
        await device.disconnect();
        return status;
      } catch (e) {
        print('❌ Erro ao parsear status JSON: $e');
        print('   JSON recebido: $jsonStr');
        await device.disconnect();
        return null;
      }
      
    } catch (e) {
      print('❌ Erro ao ler status: $e');
      return null;
    }
  }
  
  /// Enviar comando para um dispositivo via BLE
  Future<bool> sendCommand(String deviceId, String command, {Map<String, dynamic>? params}) async {
    try {
      final device = await _findDeviceById(deviceId);
      if (device == null) {
        print('❌ Dispositivo $deviceId não encontrado');
        return false;
      }
      
      print('📱 Conectando ao $deviceId...');
      await device.connect(timeout: Duration(seconds: 10));
      
      print('🔍 Descobrindo serviços...');
      final services = await device.discoverServices();
      
      // Procurar serviço IoT
      final service = services.firstWhere(
        (s) => s.uuid.toString().toUpperCase().contains(serviceUuid.toUpperCase()),
        orElse: () => throw Exception('Serviço IoT não encontrado'),
      );
      
      // Procurar característica COMMAND
      final commandChar = service.characteristics.firstWhere(
        (c) => c.uuid.toString().toUpperCase().contains(commandCharUuid.toUpperCase()),
        orElse: () => throw Exception('Característica COMMAND não encontrada'),
      );
      
      // Montar JSON do comando
      final commandJson = {
        'cmd': command,
        if (params != null) 'params': params,
      };
      
      final jsonStr = jsonEncode(commandJson);
      print('📤 Enviando comando: $jsonStr');
      
      await commandChar.write(utf8.encode(jsonStr), withoutResponse: false);
      print('✅ Comando enviado com sucesso');
      
      await Future.delayed(Duration(milliseconds: 500));
      await device.disconnect();
      
      return true;
      
    } catch (e) {
      print('❌ Erro ao enviar comando: $e');
      return false;
    }
  }
  
  bool _shouldTreatWriteErrorAsSuccess(Object error) {
    final message = error.toString().toLowerCase();
    const softDisconnectSignals = [
      'gatt_error',
      'android-code: 133',
      'fbp-code: 6',
      'device is not connected',
      'writecharacteristic',
    ];

    for (final signal in softDisconnectSignals) {
      if (message.contains(signal)) {
        return true;
      }
    }

    return false;
  }

  /// Reconfigurar dispositivo (WiFi, API Key, Local)
  Future<bool> reconfigure(String deviceId, {
    String? wifiSsid,
    String? wifiPassword,
    bool? useStaticIp,
    String? staticIp,
    String? gateway,
    String? netmask,
    String? apiKey,
    String? apiUrl,
    String? localName,
  }) async {
    try {
      final device = await _findDeviceById(deviceId);
      if (device == null) {
        print('❌ Dispositivo $deviceId não encontrado');
        return false;
      }
      
      print('📱 Conectando ao $deviceId...');
      await device.connect(timeout: Duration(seconds: 10));
      
      // Aumentar MTU
      final mtu = await device.requestMtu(512);
      print('📡 MTU: $mtu bytes');
      await Future.delayed(Duration(milliseconds: 500));
      
      print('🔍 Descobrindo serviços...');
      final services = await device.discoverServices();
      
      // Procurar serviço IoT
      final service = services.firstWhere(
        (s) => s.uuid.toString().toUpperCase().contains(serviceUuid.toUpperCase()),
        orElse: () => throw Exception('Serviço IoT não encontrado'),
      );
      
      // Procurar característica CONFIG
      final configChar = service.characteristics.firstWhere(
        (c) => c.uuid.toString().toUpperCase().contains(configCharUuid.toUpperCase()),
        orElse: () => throw Exception('Característica CONFIG não encontrada'),
      );
      
      // Montar JSON de configuração
      final configJson = <String, dynamic>{};
      
      if (wifiSsid != null) configJson['wifi_ssid'] = wifiSsid;
      if (wifiPassword != null) configJson['wifi_password'] = wifiPassword;
      if (useStaticIp != null) configJson['use_static_ip'] = useStaticIp;
      if (staticIp != null) configJson['static_ip'] = staticIp;
      if (gateway != null) configJson['gateway'] = gateway;
      if (netmask != null) configJson['netmask'] = netmask;
      if (apiKey != null) configJson['api_key'] = apiKey;
      if (apiUrl != null) configJson['api_url'] = apiUrl;
      if (localName != null) configJson['local_name'] = localName;
      
      final jsonStr = jsonEncode(configJson);
      print('📤 Enviando configuração: $jsonStr');
      
      final expectSoftDisconnect = wifiSsid != null || wifiPassword != null;
      bool configSent = false;

      for (int i = 0; i < 3; i++) {
        try {
          await configChar.write(utf8.encode(jsonStr), withoutResponse: false);
          print('✅ Configuração enviada com sucesso');
          
          await Future.delayed(Duration(milliseconds: 500));
          await device.disconnect();
          configSent = true;
          break;
        } catch (e) {
          print('⚠️  Tentativa ${i + 1}/3 falhou: $e');

          if (expectSoftDisconnect && _shouldTreatWriteErrorAsSuccess(e)) {
            print('ℹ️  Device parece ter reiniciado após receber a configuração. Tratando como sucesso.');
            configSent = true;
            break;
          }

          if (i < 2) {
            await Future.delayed(Duration(milliseconds: 1000));
          }
        }
      }

      if (!configSent) {
        return false;
      }

      try {
        await device.disconnect();
      } catch (_) {}
      
      return true;
      
    } catch (e) {
      print('❌ Erro ao reconfigurar: $e');
      return false;
    }
  }
  
  /// Encontrar dispositivo BLE pelo ID ou MAC address
  Future<BluetoothDevice?> _findDeviceById(String deviceId) async {
    final target = deviceId.toLowerCase();

    final cached = _getCachedDevice(deviceId);
    if (cached != null) {
      print('✅ Device $deviceId encontrado no cache');
      return cached;
    }

    final scanResults = FlutterBluePlus.lastScanResults;
    for (var result in scanResults) {
      final name = result.advertisementData.advName;
      final mac = result.device.remoteId.toString();
      final extractedId = _extractIdFromName(name);

      final lowerName = name.toLowerCase();
      final lowerMac = mac.toLowerCase();
      final lowerExtracted = extractedId.toLowerCase();

      final matches = lowerMac == target ||
          (lowerExtracted.isNotEmpty && lowerExtracted == target) ||
          (lowerName.isNotEmpty && lowerName.contains(target));

      if (matches) {
        print('✅ Device $deviceId encontrado no scan (name: $name, mac: $mac)');
        _cacheBluetoothDevice(
          result.device,
          id: extractedId.isNotEmpty ? extractedId : null,
          name: name,
          mac: mac,
        );
        return result.device;
      }
    }

    final connectedDevices = FlutterBluePlus.connectedDevices;
    for (var device in connectedDevices) {
      final name = device.platformName;
      final mac = device.remoteId.toString();
      final lowerName = name.toLowerCase();
      final lowerMac = mac.toLowerCase();

      if (lowerMac == target || lowerName.contains(target)) {
        print('✅ Device $deviceId encontrado nos conectados (name: $name, mac: $mac)');
        _cacheBluetoothDevice(device, name: name, mac: mac);
        return device;
      }
    }

    print('🔎 Device $deviceId não encontrado. Tentando scan direcionado...');
    final found = await scanAndConnect(deviceId, timeout: const Duration(seconds: 8));
    if (!found) {
      print('❌ Device $deviceId não encontrado');
      return null;
    }

    final rescanned = _getCachedDevice(deviceId);
    if (rescanned != null) {
      print('✅ Device $deviceId encontrado após scan direcionado');
      return rescanned;
    }

    for (final entry in _bluetoothDevices.entries) {
      final key = entry.key.toLowerCase();
      final remote = entry.value.remoteId.toString().toLowerCase();
      final name = entry.value.platformName.toLowerCase();

      if (key == target || remote == target || name.contains(target)) {
        return entry.value;
      }
    }

    print('❌ Device $deviceId não encontrado mesmo após scan');
    return null;
  }
  
  /// ⭐ NOVO: Buscar BluetoothDevice real pelo ID
  BluetoothDevice? getBluetoothDevice(String deviceId) {
    return _getCachedDevice(deviceId);
  }
  
  /// ⭐ NOVO: Escanear e conectar a um device específico (usado para comandos em dispositivos adotados)
  Future<bool> scanAndConnect(String identifier, {Duration? timeout}) async {
    timeout ??= const Duration(seconds: 10);
    final target = identifier.toLowerCase();

    print('🔍 Iniciando scan específico para: $identifier');

    if (_getCachedDevice(identifier) != null) {
      print('✅ Device já está no cache');
      return true;
    }

    final completer = Completer<bool>();
    StreamSubscription? tempSubscription;
    Timer? timeoutTimer;

    tempSubscription = FlutterBluePlus.scanResults.listen((results) {
      for (var result in results) {
        final mac = result.device.remoteId.toString();
        final name = result.advertisementData.advName;
        final extractedId = _extractIdFromName(name);

        final lowerMac = mac.toLowerCase();
        final lowerName = name.toLowerCase();
        final lowerExtracted = extractedId.toLowerCase();

        final matches = lowerMac == target ||
            (lowerExtracted.isNotEmpty && lowerExtracted == target) ||
            (lowerName.isNotEmpty && lowerName.contains(target));

        if (matches) {
          print('✅ Device encontrado via scan!');
          print('   MAC: $mac');
          print('   Nome: $name');

          _cacheBluetoothDevice(
            result.device,
            id: extractedId.isNotEmpty ? extractedId : null,
            name: name,
            mac: mac,
          );

          tempSubscription?.cancel();
          timeoutTimer?.cancel();
          FlutterBluePlus.stopScan();

          if (!completer.isCompleted) {
            completer.complete(true);
          }
          return;
        }
      }
    });

    timeoutTimer = Timer(timeout, () {
      print('⏱️  Timeout ao procurar $identifier');
      tempSubscription?.cancel();
      FlutterBluePlus.stopScan();

      if (!completer.isCompleted) {
        completer.complete(false);
      }
    });

    try {
      await FlutterBluePlus.startScan(
        timeout: timeout,
        androidUsesFineLocation: true,
      );
    } catch (e) {
      print('❌ Erro ao iniciar scan: $e');
      tempSubscription?.cancel();
      timeoutTimer?.cancel();
      if (!completer.isCompleted) {
        completer.complete(false);
      }
    }

    return completer.future;
  }
  
  /// Desconectar de um dispositivo específico
  Future<void> disconnect(String deviceId) async {
    try {
      final device = _getCachedDevice(deviceId);
      if (device != null) {
        print('🔌 Desconectando de $deviceId...');
        await device.disconnect();
        print('✅ Desconectado');
      }
    } catch (e) {
      print('⚠️  Erro ao desconectar: $e');
    }
  }
  
  /// Reconfigurar WiFi do dispositivo
  Future<bool> reconfigureWiFi(String deviceId, String ssid, {String? password}) async {
    print('📶 Reconfigurando WiFi do $deviceId...');
    final sanitizedPassword = (password != null && password.isEmpty) ? null : password;
    return await reconfigure(
      deviceId,
      wifiSsid: ssid,
      wifiPassword: sanitizedPassword,
    );
  }
  
  /// Reiniciar dispositivo
  Future<bool> restartDevice(String deviceId) async {
    print('🔄 Reiniciando dispositivo $deviceId...');
    return await sendCommand(deviceId, 'restart');
  }
  
  /// Resetar dispositivo (factory reset)
  Future<bool> resetDevice(String deviceId) async {
    print('⚠️ Resetando dispositivo $deviceId (factory reset)...');
    return await sendCommand(deviceId, 'reset');
  }
  
  /// Remover dispositivo da lista local
  void removeDevice(String deviceId) {
    print('🗑️ Removendo dispositivo $deviceId da lista local...');
    
    // Remover do mapa de dispositivos descobertos
    _discoveredDevices.remove(deviceId);
    
    // Remover do cache de dispositivos Bluetooth
    _bluetoothDevices.removeWhere((key, value) => 
      key.toLowerCase() == deviceId.toLowerCase() ||
      value.remoteId.toString().toLowerCase() == deviceId.toLowerCase()
    );
    
    // Atualizar stream
    _devicesController.add(_discoveredDevices.values.toList());
    
    print('✅ Dispositivo $deviceId removido da lista local');
  }
  
  /// Limpar recursos
  void dispose() {
    _scanSubscription?.cancel();
    _devicesController.close();
    _bluetoothDevices.clear(); // ⭐ NOVO: Limpar cache
    stopScan();
  }
}

