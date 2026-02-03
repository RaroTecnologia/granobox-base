import 'dart:async';
import 'dart:typed_data';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:flutter/material.dart';

class QRReaderService {
  static final QRReaderService _instance = QRReaderService._internal();
  factory QRReaderService() => _instance;
  QRReaderService._internal();

  BluetoothDevice? _connectedDevice;
  StreamController<String>? _qrCodeController;
  bool _isConnected = false;
  bool _isScanning = false;
  String? _connectedDeviceName;

  // Getters
  bool get isConnected => _isConnected;
  bool get isScanning => _isScanning;
  String? get connectedDeviceName => _connectedDeviceName;
  Stream<String>? get qrCodeStream => _qrCodeController?.stream;

  // Inicializar o serviço
  Future<void> initialize() async {
    _qrCodeController = StreamController<String>.broadcast();
  }

  // Verificar e solicitar permissões
  Future<bool> _checkPermissions() async {
    // Verificar permissão de localização (necessária para Bluetooth no Android)
    var locationStatus = await Permission.location.status;
    if (!locationStatus.isGranted) {
      locationStatus = await Permission.location.request();
    }

    // Verificar permissão de Bluetooth
    var bluetoothStatus = await Permission.bluetooth.status;
    if (!bluetoothStatus.isGranted) {
      bluetoothStatus = await Permission.bluetooth.request();
    }

    // Verificar permissão de Bluetooth Connect (Android 12+)
    var bluetoothConnectStatus = await Permission.bluetoothConnect.status;
    if (!bluetoothConnectStatus.isGranted) {
      bluetoothConnectStatus = await Permission.bluetoothConnect.request();
    }

    // Verificar permissão de Bluetooth Scan (Android 12+)
    var bluetoothScanStatus = await Permission.bluetoothScan.status;
    if (!bluetoothScanStatus.isGranted) {
      bluetoothScanStatus = await Permission.bluetoothScan.request();
    }

    debugPrint('Permissões:');
    debugPrint('  Location: $locationStatus');
    debugPrint('  Bluetooth: $bluetoothStatus');
    debugPrint('  BluetoothConnect: $bluetoothConnectStatus');
    debugPrint('  BluetoothScan: $bluetoothScanStatus');

    return locationStatus.isGranted && 
           bluetoothStatus.isGranted && 
           bluetoothConnectStatus.isGranted && 
           bluetoothScanStatus.isGranted;
  }

  // Descobrir dispositivos Bluetooth (incluindo HID)
  Future<List<BluetoothDevice>> discoverDevices() async {
    try {
      if (!await _checkPermissions()) {
        throw Exception('Permissões necessárias não foram concedidas');
      }

      // Verificar se o Bluetooth está habilitado
      if (!await FlutterBluePlus.isOn) {
        throw Exception('Bluetooth não está habilitado');
      }

      List<BluetoothDevice> devices = [];

      // Buscar dispositivos conectados
      devices.addAll(FlutterBluePlus.connectedDevices);

      // Buscar dispositivos pareados (incluindo HID)
      try {
        // Fazer um scan rápido para encontrar dispositivos pareados
        await FlutterBluePlus.startScan(timeout: const Duration(seconds: 3));
        
        // Aguardar alguns resultados
        await Future.delayed(const Duration(seconds: 2));
        
        // Parar o scan
        await FlutterBluePlus.stopScan();
        
        // Adicionar dispositivos encontrados no scan
        await for (List<ScanResult> results in FlutterBluePlus.scanResults.take(1)) {
          for (ScanResult result in results) {
            if (!devices.any((device) => device.remoteId == result.device.remoteId)) {
              devices.add(result.device);
            }
          }
        }
      } catch (e) {
        debugPrint('Erro no scan: $e');
      }

      debugPrint('Total de dispositivos encontrados: ${devices.length}');
      for (var device in devices) {
        debugPrint('Dispositivo: ${device.platformName} - ${device.remoteId}');
      }

      return devices;
    } catch (e) {
      debugPrint('Erro ao buscar dispositivos: $e');
      return [];
    }
  }

  // Conectar ao dispositivo
  Future<bool> connectToDevice(BluetoothDevice device) async {
    try {
      if (_connectedDevice != null) {
        await disconnect();
      }

      await device.connect();
      _connectedDevice = device;
      _isConnected = true;
      _connectedDeviceName = device.platformName;

      // Iniciar monitoramento de dados
      await _startListening();

      return true;
    } catch (e) {
      debugPrint('Erro ao conectar: $e');
      _isConnected = false;
      _connectedDeviceName = null;
      return false;
    }
  }

  // Iniciar monitoramento de dados do leitor
  Future<void> _startListening() async {
    if (_connectedDevice == null) return;

    try {
      // Descobrir serviços
      List<BluetoothService> services = await _connectedDevice!.discoverServices();
      
      for (BluetoothService service in services) {
        for (BluetoothCharacteristic characteristic in service.characteristics) {
          if (characteristic.properties.read || characteristic.properties.notify) {
            // Assinar notificações se disponível
            if (characteristic.properties.notify) {
              await characteristic.setNotifyValue(true);
              characteristic.lastValueStream.listen((data) {
                String receivedData = String.fromCharCodes(data);
                
                // Limpar dados recebidos (remover caracteres de controle)
                receivedData = receivedData.replaceAll(RegExp(r'[^\x20-\x7E]'), '');
                
                if (receivedData.isNotEmpty) {
                  _qrCodeController?.add(receivedData.trim());
                }
              });
            }
          }
        }
      }
    } catch (e) {
      debugPrint('Erro na leitura: $e');
      _handleConnectionError();
    }
  }

  // Desconectar do dispositivo
  Future<void> disconnect() async {
    try {
      if (_connectedDevice != null) {
        await _connectedDevice!.disconnect();
      }
      _connectedDevice = null;
      _isConnected = false;
      _isScanning = false;
      _connectedDeviceName = null;
    } catch (e) {
      debugPrint('Erro ao desconectar: $e');
    }
  }

  // Lidar com erros de conexão
  void _handleConnectionError() {
    _isConnected = false;
    _isScanning = false;
    _connectedDeviceName = null;
    _connectedDevice = null;
  }

  // Iniciar/parar escaneamento
  void toggleScanning() {
    if (!_isConnected) return;
    
    _isScanning = !_isScanning;
    
    if (_isScanning) {
      // Enviar comando para iniciar escaneamento (depende do modelo do leitor)
      _sendCommand('SCAN_START');
    } else {
      // Enviar comando para parar escaneamento
      _sendCommand('SCAN_STOP');
    }
  }

  // Enviar comando para o leitor
  void _sendCommand(String command) {
    if (_connectedDevice != null && _isConnected) {
      // TODO: Implementar envio de comandos específicos do leitor
      debugPrint('Enviando comando: $command');
    }
  }

  // Verificar se o Bluetooth está habilitado
  Future<bool> isBluetoothEnabled() async {
    return await FlutterBluePlus.isOn;
  }

  // Habilitar Bluetooth
  Future<bool> enableBluetooth() async {
    try {
      await FlutterBluePlus.turnOn();
      return true;
    } catch (e) {
      debugPrint('Erro ao habilitar Bluetooth: $e');
      return false;
    }
  }

  // Limpar recursos
  void dispose() {
    disconnect();
    _qrCodeController?.close();
    _qrCodeController = null;
  }
}