import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'dart:async';
import 'dart:convert';

class BLEEdgeDevice {
  final String id;
  final String name;
  final String fingerprint;
  final int rssi;
  
  BLEEdgeDevice({
    required this.id,
    required this.name,
    required this.fingerprint,
    required this.rssi,
  });
}

class GranoboxEdgeService {
  // UUIDs do serviço BLE (mesmos do Edge-Go)
  static const String serviceUUID = "4fac";
  static const String configCharUUID = "beb5";
  
  final _scanResults = StreamController<List<BLEEdgeDevice>>.broadcast();
  Stream<List<BLEEdgeDevice>> get scanResults => _scanResults.stream;
  
  final List<BLEEdgeDevice> _discoveredDevices = [];
  
  bool _isScanning = false;
  
  Future<void> startScan() async {
    if (_isScanning) return;
    
    _isScanning = true;
    _discoveredDevices.clear();
    
    try {
      // Verificar se Bluetooth está ligado
      final state = await FlutterBluePlus.adapterState.first;
      if (state != BluetoothAdapterState.on) {
        throw Exception('Bluetooth desligado');
      }
      
      // Iniciar scan (sem filtro de serviço para maior compatibilidade)
      await FlutterBluePlus.startScan(
        timeout: const Duration(seconds: 10),
      );
      
      // Escutar resultados do scan
      FlutterBluePlus.scanResults.listen((results) {
        for (ScanResult result in results) {
          final name = result.device.platformName;
          
          // ✅ NOVO: Aceitar tanto nome antigo (Edge-Go XX:XX:XX) quanto novo (edge-go-XXXXXX)
          if (name.isNotEmpty && 
              (name.toLowerCase().startsWith('edge-go-') || 
               name.startsWith('Edge-Go'))) {
            
            String deviceId;
            
            // Extrair device ID conforme formato
            if (name.toLowerCase().startsWith('edge-go-')) {
              // Novo formato: edge-go-d7e2b4
              deviceId = name.toLowerCase();
            } else {
              // Formato antigo: Edge-Go 80:B5:4E:D7:E2:B4
              final parts = name.split(' ');
              deviceId = parts.length > 1 ? parts[1] : 'unknown';
            }
            
            // Verificar se já existe
            final exists = _discoveredDevices.any((d) => d.id == result.device.remoteId.toString());
            
            if (!exists && deviceId != 'unknown') {
              final edgeDevice = BLEEdgeDevice(
                id: result.device.remoteId.toString(),
                name: name,
                fingerprint: deviceId,
                rssi: result.rssi,
              );
              
              _discoveredDevices.add(edgeDevice);
              _scanResults.add(List.from(_discoveredDevices));
            }
          }
        }
      });
      
      // Aguardar fim do scan
      await Future.delayed(const Duration(seconds: 10));
      await stopScan();
      
    } catch (e) {
      print('❌ Erro ao escanear Edge-Go: $e');
      _isScanning = false;
      rethrow;
    }
  }
  
  Future<void> stopScan() async {
    if (!_isScanning) return;
    
    try {
      await FlutterBluePlus.stopScan();
    } catch (e) {
      print('❌ Erro ao parar scan: $e');
    } finally {
      _isScanning = false;
    }
  }
  
  Future<bool> configureEdge({
    required String deviceId,
    BluetoothDevice? bluetoothDevice, // ⭐ NOVO: Device BLE já descoberto (opcional)
    required String wifiSsid,
    String? wifiPassword,
    required bool useStaticIp,
    String? staticIp,
    String? gateway,
    String? netmask,
    required String apiKey,
    String? apiUrl,
  }) async {
    BluetoothDevice? device = bluetoothDevice; // ⭐ USAR device passado, se disponível
    
    try {
      print('🔍 [BLE] Iniciando configuração do Edge-Go: $deviceId');
      
      // ⭐ MELHORIA: Se o device BLE já foi passado, pular o scan
      if (device != null) {
        print('✅ [BLE] Usando device BLE já descoberto: ${device.platformName}');
      } else {
        // ⭐ FALLBACK: Fazer scan se não foi passado device
        print('🔍 [BLE] Fazendo scan rápido para encontrar o device...');
        await FlutterBluePlus.startScan(timeout: const Duration(seconds: 4));
        await Future.delayed(const Duration(seconds: 4));
        await FlutterBluePlus.stopScan();
        
        // ⭐ Procurar de forma mais robusta
        print('🔍 [BLE] Procurando dispositivo: $deviceId');
        final scanResults = await FlutterBluePlus.scanResults.first;
        
        for (var result in scanResults) {
          final deviceName = result.advertisementData.advName;
          final platformName = result.device.platformName;
          final remoteId = result.device.remoteId.toString();
          
          print('   🔍 Analisando: advName="$deviceName", platformName="$platformName", remoteId="$remoteId"');
          
          // Procurar por qualquer correspondência
          if (deviceName.toLowerCase().contains(deviceId.toLowerCase()) || 
              platformName.toLowerCase().contains(deviceId.toLowerCase()) ||
              remoteId == deviceId) {
            device = result.device;
            print('   ✅ Device encontrado!');
            break;
          }
        }
        
        if (device == null) {
          throw Exception('❌ Dispositivo não encontrado após scan. Certifique-se de que está próximo e ligado.');
        }
      }
      
      // ⭐ MELHORIA 3: Verificar se já está conectado e desconectar antes
      print('📱 [BLE] Verificando conexões existentes...');
      try {
        final connectedDevices = FlutterBluePlus.connectedDevices;
        for (var connectedDevice in connectedDevices) {
          if (connectedDevice.remoteId == device.remoteId) {
            print('   ⚠️  Dispositivo já conectado, desconectando primeiro...');
            await connectedDevice.disconnect();
            await Future.delayed(const Duration(seconds: 2));
          }
        }
      } catch (e) {
        print('   ⚠️  Erro ao verificar conexões: $e');
      }
      
      // ⭐ MELHORIA 4: Conectar com timeout maior e retry
      print('📱 [BLE] Conectando ao Edge-Go...');
      int connectRetries = 2;
      bool connected = false;
      
      while (connectRetries > 0 && !connected) {
        try {
          await device.connect(
            timeout: const Duration(seconds: 20),
            autoConnect: false,
          );
          connected = true;
          print('   ✅ Conectado!');
        } catch (e) {
          connectRetries--;
          print('   ⚠️  Erro ao conectar (tentativas restantes: $connectRetries): $e');
          if (connectRetries > 0) {
            await Future.delayed(const Duration(seconds: 3));
          } else {
            throw Exception('Falha ao conectar após múltiplas tentativas');
          }
        }
      }
      
      // Aguardar conexão estabilizar
      await Future.delayed(const Duration(seconds: 3));
      
      // ⭐ MELHORIA 5: Tentar aumentar MTU com tratamento de erro melhor
      try {
        final currentMtu = await device.mtu.first.timeout(const Duration(seconds: 2));
        print('📶 [BLE] MTU atual: $currentMtu bytes');
        
        if (currentMtu < 512) {
          print('📶 [BLE] Solicitando MTU de 512 bytes...');
          final newMtu = await device.requestMtu(512);
          await Future.delayed(const Duration(milliseconds: 500));
          print('📶 [BLE] Novo MTU: $newMtu bytes');
        }
      } catch (e) {
        print('⚠️  [BLE] MTU não ajustável (continuando com padrão): $e');
      }
      
      // ⭐ MELHORIA 6: Descobrir serviços com timeout
      print('🔍 [BLE] Descobrindo serviços BLE...');
      final services = await device.discoverServices()
          .timeout(const Duration(seconds: 10));
      
      print('   📋 Serviços encontrados: ${services.length}');
      for (var service in services) {
        print('      - ${service.uuid}');
      }
      
      // Encontrar serviço de configuração
      BluetoothService? configService;
      for (var service in services) {
        final uuid = service.uuid.toString().toLowerCase();
        if (uuid.contains(serviceUUID.toLowerCase())) {
          configService = service;
          print('   ✅ Serviço de configuração encontrado: ${service.uuid}');
          break;
        }
      }
      
      if (configService == null) {
        throw Exception('❌ Serviço de configuração não encontrado. UUID esperado: $serviceUUID');
      }
      
      // Encontrar característica de configuração
      print('🔍 [BLE] Procurando característica de configuração...');
      BluetoothCharacteristic? configChar;
      for (var char in configService.characteristics) {
        final uuid = char.uuid.toString().toLowerCase();
        print('      - Característica: $uuid');
        if (uuid.contains(configCharUUID.toLowerCase())) {
          configChar = char;
          print('   ✅ Característica de configuração encontrada: ${char.uuid}');
          break;
        }
      }
      
      if (configChar == null) {
        throw Exception('❌ Característica de configuração não encontrada. UUID esperado: $configCharUUID');
      }
      
      // Montar JSON de configuração
      final config = <String, dynamic>{
        'device_id': deviceId, // ⭐ ENVIAR device_id para o ESP32
        'wifi_ssid': wifiSsid,
        'use_static_ip': useStaticIp,
        if (useStaticIp && staticIp != null) 'static_ip': staticIp,
        if (useStaticIp && gateway != null) 'gateway': gateway,
        if (useStaticIp && netmask != null) 'netmask': netmask,
        'api_key': apiKey,
        if (apiUrl != null) 'api_url': apiUrl,
      };
      if (wifiPassword != null && wifiPassword.isNotEmpty) {
        config['wifi_password'] = wifiPassword;
      }
      
      final jsonStr = json.encode(config);
      final data = utf8.encode(jsonStr);
      
      print('📤 [BLE] Enviando configuração (${'${data.length}'} bytes):');
      print('   Device ID: $deviceId');
      print('   WiFi: $wifiSsid');
      print('   API Key: ${apiKey.substring(0, 30)}...');
      print('   API: ${apiUrl ?? "default"}');
      print('   JSON completo: $jsonStr');
      
      // ⭐ SOLUÇÃO: Aceitar desconexão como sucesso!
      // O ESP32 vai desconectar APÓS salvar a configuração e ANTES de reiniciar
      // Isso é ESPERADO e significa SUCESSO!
      int writeRetries = 3;
      bool writeSuccess = false;
      bool deviceDisconnectedDuringWrite = false; // ⭐ NOVO
      
      while (writeRetries > 0 && !writeSuccess) {
        try {
          await configChar.write(
            data,
            withoutResponse: false, // Esperar confirmação
            allowLongWrite: true,   // Permitir escrita longa
          ).timeout(const Duration(seconds: 10));
          
          writeSuccess = true;
          print('   ✅ Dados escritos com sucesso!');
        } catch (e) {
          // ⭐ NOVO: Verificar se é desconexão (o que é SUCESSO neste caso!)
          final errorStr = e.toString().toLowerCase();
          if (errorStr.contains('device is not connected') || 
              errorStr.contains('disconnected') ||
              errorStr.contains('link_supervision_timeout') ||
              errorStr.contains('gatt_error')) {
            print('   ℹ️  Device desconectou durante escrita (ESPERADO!)');
            deviceDisconnectedDuringWrite = true;
            writeSuccess = true; // ⭐ Considerar como sucesso!
            break;
          }
          
          writeRetries--;
          print('   ⚠️  Erro ao escrever (tentativas restantes: $writeRetries): $e');
          if (writeRetries > 0) {
            await Future.delayed(const Duration(seconds: 2));
          } else {
            throw Exception('Falha ao enviar configuração após múltiplas tentativas: $e');
          }
        }
      }
      
      if (deviceDisconnectedDuringWrite) {
        print('✅ [BLE] Configuração recebida pelo ESP32!');
        print('   ESP32 salvou e está reiniciando (desconexão esperada)');
        print('   ⏳ Aguarde 10-20 segundos para o ESP32 conectar ao WiFi...');
      } else {
        print('✅ [BLE] Configuração enviada! ESP32 vai reiniciar em 5 segundos...');
        
        // Aguardar mais tempo antes de desconectar
        await Future.delayed(const Duration(seconds: 6));
        
        // Desconectar graciosamente
        try {
          print('📱 [BLE] Desconectando...');
          await device.disconnect();
          await Future.delayed(const Duration(seconds: 1));
          print('   ✅ Desconectado');
        } catch (e) {
          print('   ⚠️  Erro ao desconectar (ignorado): $e');
        }
      }
      
      return true;
      
    } catch (e, stackTrace) {
      print('❌ [BLE] ERRO ao configurar Edge-Go:');
      print('   Erro: $e');
      print('   Stack: $stackTrace');
      
      // Tentar desconectar em caso de erro
      if (device != null) {
        try {
          await device.disconnect();
        } catch (_) {
          print('   ⚠️  Não foi possível desconectar após erro');
        }
      }
      
      rethrow; // ⭐ NOVO: Re-lançar erro para Flutter tratar
    }
  }
  
  /// Atualizar apenas API Key do Edge-Go via BLE (sem reiniciar WiFi)
  /// ⭐ NOVO: Permite regenerar API Key sem perder conexão WiFi atual
  Future<bool> updateApiKeyOnly({
    required String deviceId,
    BluetoothDevice? bluetoothDevice,
    required String apiKey,
    String? apiUrl,
  }) async {
    BluetoothDevice? device = bluetoothDevice;
    
    try {
      print('🔐 [BLE] Atualizando apenas API Key do Edge-Go: $deviceId');
      
      // ⭐ Se o device BLE já foi passado, usar diretamente
      if (device != null) {
        print('✅ [BLE] Usando device BLE já descoberto: ${device.platformName}');
      } else {
        // ⭐ FALLBACK: Fazer scan se não foi passado device
        print('🔍 [BLE] Fazendo scan rápido para encontrar o device...');
        await FlutterBluePlus.startScan(timeout: const Duration(seconds: 4));
        await Future.delayed(const Duration(seconds: 4));
        await FlutterBluePlus.stopScan();
        
        final scanResults = await FlutterBluePlus.scanResults.first;
        
        for (var result in scanResults) {
          final deviceName = result.advertisementData.advName;
          final platformName = result.device.platformName;
          final remoteId = result.device.remoteId.toString();
          
          if (deviceName.toLowerCase().contains(deviceId.toLowerCase()) || 
              platformName.toLowerCase().contains(deviceId.toLowerCase()) ||
              remoteId == deviceId) {
            device = result.device;
            print('   ✅ Device encontrado!');
            break;
          }
        }
        
        if (device == null) {
          throw Exception('❌ Dispositivo não encontrado após scan. Certifique-se de que está próximo e ligado.');
        }
      }
      
      // Verificar conexões existentes e desconectar se necessário
      bool gotoDiscoverServices = false;
      print('🔵 [BLE] Verificando conexões existentes...');
      try {
        final connectedDevices = FlutterBluePlus.connectedDevices;
        for (var connectedDevice in connectedDevices) {
          if (connectedDevice.remoteId == device.remoteId) {
            print('   ⚠️  Dispositivo já conectado, verificando se conexão está ativa...');
            // Verificar se a conexão ainda está ativa
            try {
              final state = await device.connectionState.first.timeout(
                const Duration(seconds: 1),
              );
              if (state == BluetoothConnectionState.connected) {
                print('   ✅ Conexão está ativa!');
                // Aguardar estabilizar
                await Future.delayed(const Duration(milliseconds: 500));
                // Pular para descobrir serviços
                gotoDiscoverServices = true;
                break;
              }
            } catch (e) {
              print('   ⚠️  Conexão inativa, reconectando...');
              try {
                await device.disconnect();
                await Future.delayed(const Duration(seconds: 1));
              } catch (_) {
                // Ignorar erro de desconexão
              }
            }
            break;
          }
        }
      } catch (e) {
        print('   ⚠️  Erro ao verificar conexões: $e');
      }
      
      // Conectar se necessário
      if (!gotoDiscoverServices) {
        print('   ⚠️  Device não está conectado, conectando...');
        int connectRetries = 3;
        bool connected = false;
        
        while (connectRetries > 0 && !connected) {
          try {
            await device.connect(
              timeout: const Duration(seconds: 15),
              autoConnect: false,
            );
            
            // Aguardar conexão estabilizar
            await Future.delayed(const Duration(milliseconds: 1000));
            
            // Verificar se realmente conectou
            final state = await device.connectionState.first.timeout(
              const Duration(seconds: 3),
            );
            
            if (state == BluetoothConnectionState.connected) {
              connected = true;
              print('   ✅ Conectado com sucesso!');
            } else {
              throw Exception('Estado de conexão: $state');
            }
          } catch (e) {
            connectRetries--;
            print('   ⚠️  Erro ao conectar (tentativas restantes: $connectRetries): $e');
            if (connectRetries > 0) {
              await Future.delayed(const Duration(seconds: 2));
            } else {
              throw Exception('❌ Não foi possível conectar ao dispositivo após múltiplas tentativas. Certifique-se de que está próximo e ligado.');
            }
          }
        }
        
        if (!connected) {
          throw Exception('❌ Não foi possível estabelecer conexão com o dispositivo.');
        }
      }
      
      // Aguardar um pouco para garantir que a conexão está estável
      await Future.delayed(const Duration(milliseconds: 500));
      
      // Descobrir serviços
      print('   🔍 Descobrindo serviços...');
      List<BluetoothService> services;
      try {
        // Verificar conexão antes de descobrir serviços
        final stateBeforeDiscover = await device.connectionState.first.timeout(
          const Duration(seconds: 1),
        );
        if (stateBeforeDiscover != BluetoothConnectionState.connected) {
          throw Exception('❌ Dispositivo não está conectado antes de descobrir serviços. Estado: $stateBeforeDiscover');
        }
        
        services = await device.discoverServices().timeout(
          const Duration(seconds: 10),
          onTimeout: () => throw Exception('Timeout ao descobrir serviços BLE'),
        );
        
        // Verificar novamente após descobrir
        final stateAfterDiscover = await device.connectionState.first.timeout(
          const Duration(seconds: 1),
        );
        if (stateAfterDiscover != BluetoothConnectionState.connected) {
          throw Exception('❌ Dispositivo desconectou durante descoberta de serviços');
        }
      } catch (e) {
        final errorMsg = e.toString();
        if (errorMsg.contains('disconnected') || errorMsg.contains('not connected')) {
          throw Exception('❌ Dispositivo desconectou: $errorMsg');
        }
        rethrow;
      }
      
      print('   ✅ Serviços descobertos (${services.length} serviços)');
      
      // Listar todos os serviços para debug
      print('   📋 Serviços encontrados:');
      for (var service in services) {
        print('      - ${service.uuid} (${service.uuid.toString().toUpperCase()})');
        for (var char in service.characteristics) {
          print('         └─ ${char.uuid} (${char.uuid.toString().toUpperCase()})');
        }
      }
      
      // Encontrar serviço de configuração
      // O firmware usa UUIDs de 16 bits: 0x4fac (service) e 0xbeb5 (char)
      // Mas também pode estar exposto como UUID completo: 4fafc201-1fb5-459e-8fcc-c5c9c331914b
      const serviceUUID16 = '4fac';
      const serviceUUIDFull = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
      const configCharUUID16 = 'beb5';
      const configCharUUIDFull = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
      
      BluetoothService? configService;
      for (var service in services) {
        final uuidStr = service.uuid.toString().toLowerCase();
        final uuidUpper = service.uuid.toString().toUpperCase();
        
        // Verificar se corresponde ao UUID de 16 bits ou ao UUID completo
        // UUIDs de 16 bits podem aparecer como: "4fac", "00004fac-0000-1000-8000-00805f9b34fb", etc
        bool matchesService = uuidStr.contains(serviceUUID16.toLowerCase()) ||
                              uuidStr.contains(serviceUUIDFull.toLowerCase()) ||
                              uuidUpper.contains(serviceUUID16.toUpperCase()) ||
                              uuidUpper.contains(serviceUUIDFull.toUpperCase());
        
        // Verificar também se termina com o UUID de 16 bits (caso tenha base UUID)
        if (!matchesService) {
          // Extrair os últimos 4 caracteres (ou primeiros 4) para comparar com UUID de 16 bits
          final uuidNoHyphens = uuidStr.replaceAll('-', '');
          if (uuidNoHyphens.endsWith(serviceUUID16.toLowerCase()) ||
              uuidNoHyphens.startsWith(serviceUUID16.toLowerCase())) {
            matchesService = true;
          }
        }
        
        if (matchesService) {
          configService = service;
          print('   ✅ Serviço de configuração encontrado: ${service.uuid}');
          break;
        }
      }
      
      if (configService == null) {
        throw Exception('❌ Serviço de configuração não encontrado.\n'
            'UUID esperado (16-bit): $serviceUUID16\n'
            'UUID esperado (128-bit): $serviceUUIDFull\n'
            'Serviços descobertos: ${services.map((s) => s.uuid.toString()).join(", ")}');
      }
      
      // Encontrar característica de configuração
      BluetoothCharacteristic? configChar;
      print('   🔍 Procurando característica de configuração em ${configService.characteristics.length} características...');
      for (var char in configService.characteristics) {
        final uuidStr = char.uuid.toString().toLowerCase();
        final uuidUpper = char.uuid.toString().toUpperCase();
        
        // Verificar se corresponde ao UUID de 16 bits ou ao UUID completo
        bool matchesChar = uuidStr.contains(configCharUUID16.toLowerCase()) ||
                           uuidStr.contains(configCharUUIDFull.toLowerCase()) ||
                           uuidUpper.contains(configCharUUID16.toUpperCase()) ||
                           uuidUpper.contains(configCharUUIDFull.toUpperCase());
        
        // Verificar também se termina com o UUID de 16 bits
        if (!matchesChar) {
          final uuidNoHyphens = uuidStr.replaceAll('-', '');
          if (uuidNoHyphens.endsWith(configCharUUID16.toLowerCase()) ||
              uuidNoHyphens.startsWith(configCharUUID16.toLowerCase())) {
            matchesChar = true;
          }
        }
        
        if (matchesChar) {
          configChar = char;
          print('   ✅ Característica de configuração encontrada: ${char.uuid}');
          break;
        } else {
          print('      ⚠️  Característica não corresponde: ${char.uuid}');
        }
      }
      
      if (configChar == null) {
        final foundChars = configService.characteristics.map((c) => c.uuid.toString()).join(", ");
        throw Exception('❌ Característica de configuração não encontrada.\n'
            'UUID esperado (16-bit): $configCharUUID16\n'
            'UUID esperado (128-bit): $configCharUUIDFull\n'
            'Características encontradas: $foundChars');
      }
      
      // ⭐ IMPORTANTE: Enviar apenas API Key (e device_id se necessário)
      // O edge-go processa campos parciais e não reinicia se não tiver wifi_ssid
      final config = <String, dynamic>{
        'device_id': deviceId,
        'api_key': apiKey,
        if (apiUrl != null) 'api_url': apiUrl,
      };
      
      final jsonStr = json.encode(config);
      final data = utf8.encode(jsonStr);
      
      print('📤 [BLE] Enviando atualização de API Key (${'${data.length}'} bytes):');
      print('   Device ID: $deviceId');
      print('   API Key: ${apiKey.substring(0, 30)}...');
      print('   API: ${apiUrl ?? "default"}');
      print('   JSON: $jsonStr');
      
      // Enviar configuração
      int writeRetries = 3;
      bool writeSuccess = false;
      bool deviceDisconnectedDuringWrite = false;
      
      while (writeRetries > 0 && !writeSuccess) {
        try {
          await configChar.write(
            data,
            withoutResponse: false,
            allowLongWrite: true,
          ).timeout(const Duration(seconds: 10));
          
          writeSuccess = true;
          print('   ✅ API Key atualizada com sucesso!');
        } catch (e) {
          final errorStr = e.toString().toLowerCase();
          if (errorStr.contains('device is not connected') || 
              errorStr.contains('disconnected') ||
              errorStr.contains('link_supervision_timeout') ||
              errorStr.contains('gatt_error')) {
            print('   ℹ️  Device desconectou durante escrita (ESPERADO!)');
            deviceDisconnectedDuringWrite = true;
            writeSuccess = true;
            break;
          }
          
          writeRetries--;
          print('   ⚠️  Erro ao escrever (tentativas restantes: $writeRetries): $e');
          if (writeRetries > 0) {
            await Future.delayed(const Duration(seconds: 2));
          } else {
            throw Exception('Falha ao atualizar API Key após múltiplas tentativas: $e');
          }
        }
      }
      
      if (deviceDisconnectedDuringWrite) {
        print('✅ [BLE] API Key recebida pelo ESP32!');
        print('   ⏳ Aguarde alguns segundos para o ESP32 aplicar a atualização...');
      } else {
        print('✅ [BLE] API Key atualizada!');
        await Future.delayed(const Duration(seconds: 3));
        
        try {
          await device.disconnect();
        } catch (e) {
          print('   ⚠️  Erro ao desconectar (ignorado): $e');
        }
      }
      
      return true;
      
    } catch (e, stackTrace) {
      print('❌ [BLE] ERRO ao atualizar API Key:');
      print('   Erro: $e');
      print('   Stack: $stackTrace');
      
      if (device != null) {
        try {
          await device.disconnect();
        } catch (_) {
          print('   ⚠️  Não foi possível desconectar após erro');
        }
      }
      
      rethrow;
    }
  }
  
  void dispose() {
    _scanResults.close();
  }
}

