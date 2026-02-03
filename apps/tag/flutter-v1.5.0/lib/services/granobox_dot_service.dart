import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:convert';
import 'dart:async';

class BLEDotDevice {
  final String name;
  final String id;
  final BluetoothDevice device;

  BLEDotDevice({
    required this.name,
    required this.id,
    required this.device,
  });
}

class GranoboxDotService {
  static const String SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
  static const String CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

  BluetoothDevice? _connectedDevice;
  BluetoothCharacteristic? _configChar;

  Future<List<BLEDotDevice>> scanForDots() async {
    List<BLEDotDevice> dots = [];

    try {
      print('Verificando permissões...');
      
      // Solicitar permissões necessárias para BLE scan no Android
      Map<Permission, PermissionStatus> statuses = await [
        Permission.bluetoothScan,
        Permission.bluetoothConnect,
        Permission.location,
      ].request();

      print('Status das permissões: $statuses');

      if (statuses[Permission.bluetoothScan] != PermissionStatus.granted ||
          statuses[Permission.bluetoothConnect] != PermissionStatus.granted ||
          statuses[Permission.location] != PermissionStatus.granted) {
        print('Permissões negadas!');
        throw Exception('Permissões de Bluetooth ou Localização negadas');
      }

      print('Verificando se BLE está disponível...');
      
      if (await FlutterBluePlus.isSupported == false) {
        print('BLE não suportado neste dispositivo');
        return dots;
      }

      print('Verificando se Bluetooth está ligado...');
      if (await FlutterBluePlus.adapterState.first != BluetoothAdapterState.on) {
        print('Bluetooth está desligado. Tentando ligar...');
        try {
          await FlutterBluePlus.turnOn();
          await Future.delayed(const Duration(seconds: 2));
        } catch (e) {
          print('Não foi possível ligar o Bluetooth: $e');
          return dots;
        }
      }

      print('Parando scan anterior (se houver)...');
      await FlutterBluePlus.stopScan();
      
      print('Iniciando novo scan...');
      await FlutterBluePlus.startScan(timeout: const Duration(seconds: 5));

      print('Aguardando resultados...');
      await Future.delayed(const Duration(seconds: 6));

      var results = FlutterBluePlus.lastScanResults;
      print('Total de dispositivos encontrados: ${results.length}');
      
      for (var result in results) {
        print('Dispositivo: ${result.device.platformName} (${result.device.remoteId})');
        if (result.device.platformName.contains("Granobox") && 
            !dots.any((d) => d.id == result.device.remoteId.toString())) {
          print('Granobox Dot encontrado!');
          dots.add(BLEDotDevice(
            name: result.device.platformName,
            id: result.device.remoteId.toString(),
            device: result.device,
          ));
        }
      }

      await FlutterBluePlus.stopScan();
      print('Scan finalizado. Dots encontrados: ${dots.length}');
    } catch (e) {
      print('Erro no scan: $e');
      await FlutterBluePlus.stopScan();
    }
    
    return dots;
  }

  Future<bool> connectToDot(BLEDotDevice dot) async {
    try {
      await dot.device.connect(timeout: const Duration(seconds: 10));
      _connectedDevice = dot.device;

      List<BluetoothService> services = await dot.device.discoverServices();

      for (var service in services) {
        if (service.uuid.toString().toLowerCase() == SERVICE_UUID.toLowerCase()) {
          for (var char in service.characteristics) {
            if (char.uuid.toString().toLowerCase() == CHAR_UUID.toLowerCase()) {
              _configChar = char;
              return true;
            }
          }
        }
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  Future<bool> configureWiFi(String ssid, String password) async {
    if (_configChar == null) return false;

    try {
      final config = {
        "wifi_ssid": ssid,
        "wifi_password": password,
      };

      await _configChar!.write(
        utf8.encode(jsonEncode(config)),
        withoutResponse: false,
      );

      await Future.delayed(const Duration(milliseconds: 500));

      final value = await _configChar!.read();
      final response = utf8.decode(value);
      final responseJson = jsonDecode(response);

      return responseJson["status"] == "ok";
    } catch (e) {
      return false;
    }
  }

  Future<bool> configureAPI(String apiUrl) async {
    if (_configChar == null) return false;

    try {
      final config = {
        "api_url": apiUrl,
      };

      await _configChar!.write(
        utf8.encode(jsonEncode(config)),
        withoutResponse: false,
      );

      return true;
    } catch (e) {
      return false;
    }
  }

  Future<void> disconnect() async {
    if (_connectedDevice != null) {
      await _connectedDevice!.disconnect();
      _connectedDevice = null;
      _configChar = null;
    }
  }

  Future<Map<String, String>> sendConfig(
    BluetoothDevice device,
    String ssid,
    String password,
    String apiUrl,
    String apiKey,
  ) async {
    int retries = 1; // Apenas 1 tentativa - ESP32 reinicia após receber
    String? generatedDeviceId;
    String? generatedApiKey;
    
    for (int attempt = 0; attempt < retries; attempt++) {
      try {
        print('Conectando ao dispositivo (tentativa ${attempt + 1}/$retries)...');
        
        // Desconectar primeiro se já estiver conectado
        try {
          await device.disconnect();
          await Future.delayed(const Duration(milliseconds: 500));
        } catch (e) {
          // Ignorar erro de disconnect
        }
        
        await device.connect(timeout: const Duration(seconds: 15));
        _connectedDevice = device;

        // IMPORTANTE: Aumentar MTU para enviar JSON grande (146 bytes)
        print('🔧 Solicitando MTU maior...');
        try {
          final mtu = await device.requestMtu(512);
          print('✅ MTU configurado: $mtu bytes');
        } catch (e) {
          print('⚠️ Erro ao aumentar MTU (continuando): $e');
        }

        print('Descobrindo serviços...');
        List<BluetoothService> services = await device.discoverServices();

      for (var service in services) {
        if (service.uuid.toString().toLowerCase() == SERVICE_UUID.toLowerCase()) {
          for (var char in service.characteristics) {
            if (char.uuid.toString().toLowerCase() == CHAR_UUID.toLowerCase()) {
              _configChar = char;
              
              print('Enviando configuração WiFi...');
              
              // Device ID (MAC address do BLE)
              String deviceId = device.remoteId.toString();
              generatedDeviceId = deviceId;
              
              // IMPORTANTE: API Key agora é recebida como parâmetro
              // Não geramos mais localmente
              generatedApiKey = apiKey;
              
              print('Device ID: $deviceId');
              print('API Key: $apiKey');
              
              final config = {
                "wifi_ssid": ssid,
                "wifi_password": password,
                "api_url": apiUrl,
                "api_key": apiKey,
              };

              print('📋 Configuração a ser enviada:');
              print('   SSID: $ssid (${ssid.length} chars)');
              print('   Password: ${password.length} chars');
              print('   API URL: $apiUrl');
              print('   API Key: $apiKey (${apiKey.length} chars)');
              
              final jsonString = jsonEncode(config);
              print('📤 JSON completo: $jsonString');
              print('   Tamanho total: ${jsonString.length} bytes');
              
              await char.write(
                utf8.encode(jsonString),
                withoutResponse: false,
              );
              
              print('✅ Bytes enviados com sucesso!');

              print('✅ Configuração BLE enviada com sucesso!');
              print('⏳ Aguardando ESP32 processar e reiniciar...');
              await Future.delayed(const Duration(milliseconds: 1500));
              
              print('🔌 Desconectando BLE...');
              try {
                await disconnect();
              } catch (e) {
                // Ignorar erro de disconnect - ESP32 já pode ter reiniciado
                print('ℹ️ Disconnect error (esperado): $e');
              }
              
              print('🎉 Configuração concluída!');
              
              // Retornar deviceId e apiKey para registro no backend
              return {
                'deviceId': deviceId,
                'apiKey': apiKey,
              };
            }
          }
        }
      }

      throw Exception('Característica de configuração não encontrada');
      } catch (e) {
        print('Erro na tentativa ${attempt + 1}: $e');
        await disconnect();
        
        if (attempt == retries - 1) {
          // Última tentativa falhou
          rethrow;
        }
        
        // Aguardar antes de tentar novamente
        await Future.delayed(const Duration(seconds: 2));
      }
    }
    
    throw Exception('Falha ao enviar configuração após $retries tentativas');
  }
}

