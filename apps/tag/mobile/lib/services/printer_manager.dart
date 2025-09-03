import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'dart:async';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/printer.dart';
import 'zpl_to_cpcl_converter.dart';

class PrinterManager {
  static const String _storageKey = 'printers';
  static const MethodChannel _bluetoothChannel = MethodChannel('bluetooth_channel');
  static const MethodChannel _bluetoothPrinterChannel = MethodChannel('granobox/bluetooth_printer');
  static const EventChannel _bluetoothDiscoveryChannel = EventChannel('bluetooth_discovery_channel');
  static PrinterManager? _instance;
  
  PrinterManager._();
  
  static PrinterManager get instance {
    _instance ??= PrinterManager._();
    return _instance!;
  }

  // Lista de impressoras
  List<Printer> _printers = [];
  Printer? _activePrinter;

  List<Printer> get printers => List.unmodifiable(_printers);
  Printer? get activePrinter => _activePrinter;

  // Inicializar
  Future<void> initialize() async {
    await _loadPrinters();
    await _setDefaultPrinter();
  }

  // Carregar impressoras salvas
  Future<void> _loadPrinters() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final printersJson = prefs.getStringList(_storageKey) ?? [];
      
      _printers = printersJson
          .map((json) => Printer.fromJson(jsonDecode(json)))
          .toList();
          
      // Ordenar por data de criação (mais recente primeiro)
      _printers.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    } catch (e) {
      print('Erro ao carregar impressoras: $e');
      _printers = [];
    }
  }

  // Salvar impressoras
  Future<void> _savePrinters() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final printersJson = _printers
          .map((printer) => jsonEncode(printer.toJson()))
          .toList();
      
      await prefs.setStringList(_storageKey, printersJson);
    } catch (e) {
      print('Erro ao salvar impressoras: $e');
    }
  }

  // Definir impressora padrão
  Future<void> _setDefaultPrinter() async {
    if (_printers.isNotEmpty) {
      _activePrinter = _printers.firstWhere(
        (p) => p.isDefault,
        orElse: () => _printers.first,
      );
    }
  }

  // Adicionar impressora
  Future<void> addPrinter(Printer printer) async {
    // Se for a primeira impressora, definir como padrão
    if (_printers.isEmpty) {
      printer = printer.copyWith(isDefault: true);
    }
    
    // Se for definida como padrão, remover padrão das outras
    if (printer.isDefault) {
      _printers = _printers.map((p) => p.copyWith(isDefault: false)).toList();
    }
    
    _printers.add(printer);
    await _savePrinters();
    
    if (printer.isDefault) {
      _activePrinter = printer;
    }
  }

  // Atualizar impressora
  Future<void> updatePrinter(Printer printer) async {
    final index = _printers.indexWhere((p) => p.id == printer.id);
    if (index != -1) {
      // Se for definida como padrão, remover padrão das outras
      if (printer.isDefault) {
        _printers = _printers.map((p) => p.copyWith(isDefault: false)).toList();
      }
      
      _printers[index] = printer;
      await _savePrinters();
      
      if (printer.isDefault) {
        _activePrinter = printer;
      }
    }
  }

  // Remover impressora
  Future<void> removePrinter(String id) async {
    final printer = _printers.firstWhere((p) => p.id == id);
    final wasDefault = printer.isDefault;
    
    _printers.removeWhere((p) => p.id == id);
    await _savePrinters();
    
    // Se era padrão e ainda há impressoras, definir nova padrão
    if (wasDefault && _printers.isNotEmpty) {
      final newDefault = _printers.first.copyWith(isDefault: true);
      await updatePrinter(newDefault);
    }
    
    // Se era a ativa, definir nova ativa
    if (_activePrinter?.id == id) {
      _activePrinter = _printers.isNotEmpty ? _printers.first : null;
    }
  }

  // Definir impressora ativa
  Future<void> setActivePrinter(String id) async {
    final printer = _printers.firstWhere((p) => p.id == id);
    _activePrinter = printer;
  }

  // Definir impressora padrão
  Future<void> setDefaultPrinter(String id) async {
    final printer = _printers.firstWhere((p) => p.id == id);
    await updatePrinter(printer.copyWith(isDefault: true));
  }

  // Testar conexão TCP
  Future<bool> testTcpConnection(String ip, int port) async {
    try {
      // Verificar se já está conectada
      final printer = _printers.firstWhere((p) => p.address == ip);
      if (printer.connectionStatus == ConnectionStatus.connected) {
        print('🔗 [Flutter] Impressora já está conectada: ${printer.name}');
        return true;
      }

      // Atualizar status para connecting
      await _updatePrinterStatus(printer.id, ConnectionStatus.connecting);
      
      final socket = await Socket.connect(ip, port, timeout: const Duration(seconds: 5));
      await socket.close();
      
      // Atualizar status para connected
      await _updatePrinterStatus(printer.id, ConnectionStatus.connected, lastConnectedAt: DateTime.now());
      print('✅ [Flutter] Conexão TCP estabelecida com sucesso');
      return true;
    } catch (e) {
      // Atualizar status para error
      final printer = _printers.firstWhere((p) => p.address == ip);
      await _updatePrinterStatus(printer.id, ConnectionStatus.error, lastError: e.toString());
      print('❌ [Flutter] Erro na conexão TCP: $e');
      return false;
    }
  }

  // Testar conexão Bluetooth
  Future<bool> testBluetoothConnection(String address) async {
    try {
      // Verificar se já está conectada
      final printer = _printers.firstWhere((p) => p.address == address);
      if (printer.connectionStatus == ConnectionStatus.connected) {
        print('🔗 [Flutter] Impressora já está conectada: ${printer.name}');
        return true;
      }

      // Atualizar status para connecting
      await _updatePrinterStatus(printer.id, ConnectionStatus.connecting);
      
      // Usar o novo plugin otimizado
      final result = await _bluetoothPrinterChannel.invokeMethod('testConnection', {
        'address': address,
      }).timeout(
        const Duration(seconds: 15),
        onTimeout: () {
          print('⏰ [Flutter] Timeout na conexão Bluetooth');
          throw TimeoutException('Timeout na conexão Bluetooth', const Duration(seconds: 15));
        },
      );
      
      if (result == true) {
        await _updatePrinterStatus(printer.id, ConnectionStatus.connected, lastConnectedAt: DateTime.now());
        print('✅ [Flutter] Conexão Bluetooth estabelecida com sucesso');
        return true;
      } else {
        await _updatePrinterStatus(printer.id, ConnectionStatus.error, lastError: 'Falha na conexão');
        return false;
      }
    } catch (e) {
      // Atualizar status para error
      final printer = _printers.firstWhere((p) => p.address == address);
      await _updatePrinterStatus(printer.id, ConnectionStatus.error, lastError: e.toString());
      print('❌ [Flutter] Erro na conexão Bluetooth: $e');
      return false;
    }
  }

  // Imprimir via TCP (sempre ZPL)
  Future<bool> printViaTcp(String zpl, String ip, int port) async {
    try {
      // Verificar se já está conectada
      final printer = _printers.firstWhere((p) => p.address == ip);
      if (printer.connectionStatus != ConnectionStatus.connected) {
        print('⚠️ [Flutter] Tentando conectar antes de imprimir...');
        final connected = await testTcpConnection(ip, port);
        if (!connected) {
          throw Exception('Não foi possível conectar à impressora');
        }
      }

      print('🖨️ [Flutter] Enviando ZPL para impressora TCP: ${printer.name}');
      print('📊 [Flutter] Tamanho ZPL: ${zpl.length} caracteres');
      
      final socket = await Socket.connect(ip, port, timeout: const Duration(seconds: 10));
      
      // Enviar dados em chunks para evitar problemas de buffer
      final bytes = zpl.codeUnits;
      final chunkSize = 1024;
      
      for (int i = 0; i < bytes.length; i += chunkSize) {
        final end = (i + chunkSize < bytes.length) ? i + chunkSize : bytes.length;
        final chunk = bytes.sublist(i, end);
        socket.add(chunk);
        await socket.flush();
        
        // Pequena pausa entre chunks
        if (end < bytes.length) {
          await Future.delayed(const Duration(milliseconds: 50));
        }
      }
      
      await socket.close();
      print('✅ [Flutter] ZPL enviado com sucesso para TCP');
      return true;
    } catch (e) {
      print('❌ [Flutter] Erro na impressão TCP: $e');
      return false;
    }
  }

  // Imprimir via Bluetooth (sempre CPCL)
  Future<bool> printViaBluetooth(String zpl, String address) async {
    try {
      // Verificar se já está conectada
      final printer = _printers.firstWhere((p) => p.address == address);
      if (printer.connectionStatus != ConnectionStatus.connected) {
        print('⚠️ [Flutter] Tentando conectar antes de imprimir...');
        final connected = await testBluetoothConnection(address);
        if (!connected) {
          throw Exception('Não foi possível conectar à impressora Bluetooth');
        }
      }

      print('🖨️ [Flutter] Convertendo ZPL para CPCL para impressora Bluetooth: ${printer.name}');
      
      // Converter ZPL para CPCL
      String cpcl;
      if (zpl.contains('GRANOBOX TAG') && zpl.contains('Teste de Impressão')) {
        // É uma etiqueta de teste
        cpcl = ZplToCpclConverter.convertTestLabel();
        print('🧪 [Flutter] Convertido para CPCL de teste');
      } else if (zpl.contains('GRANOBOX TAG')) {
        // É uma etiqueta do Granobox - extrair dados
        final productName = _extractProductName(zpl);
        final barcode = _extractBarcode(zpl);
        final expiryDate = _extractExpiryDate(zpl);
        
        cpcl = ZplToCpclConverter.convertGranoboxTag(
          productName: productName,
          barcode: barcode,
          expiryDate: expiryDate ?? DateTime.now().add(const Duration(days: 1)),
        );
        print('🏷️ [Flutter] Convertido para CPCL do Granobox');
      } else {
        // Conversão genérica ZPL para CPCL
        cpcl = ZplToCpclConverter.convert(zpl);
        print('🔄 [Flutter] Conversão genérica ZPL para CPCL');
      }
      
      print('📊 [Flutter] Tamanho CPCL: ${cpcl.length} caracteres');
      print('📝 [Flutter] CPCL gerado:\n$cpcl');
      
      // Usar o novo sistema de fila de impressão
      final result = await _bluetoothPrinterChannel.invokeMethod('printZpl', {
        'address': address,
        'zpl': cpcl, // Enviar CPCL no campo zpl (mantém compatibilidade)
      }).timeout(
        const Duration(seconds: 10), // Timeout muito curto para adição à fila
        onTimeout: () {
          print('⏰ [Flutter] Timeout ao adicionar à fila de impressão');
          throw TimeoutException('Timeout ao adicionar à fila de impressão', const Duration(seconds: 10));
        },
      );
      
      if (result is String && result.contains('fila')) {
        print('✅ [Flutter] Job de impressão adicionado à fila com sucesso');
        
        // Aguardar um pouco para a impressão ser processada
        await Future.delayed(const Duration(seconds: 2));
        
        // Verificar se a impressão foi bem-sucedida (opcional)
        return true;
      } else {
        throw Exception('Falha ao adicionar à fila: $result');
      }
    } catch (e) {
      print('❌ [Flutter] Erro na impressão Bluetooth: $e');
      
      // Tentar fallback: impressão direta sem conversão
      if (e is TimeoutException) {
        print('🔄 [Flutter] Tentando fallback: impressão direta...');
        try {
          return await _printDirectBluetooth(zpl, address);
        } catch (fallbackError) {
          print('❌ [Flutter] Fallback também falhou: $fallbackError');
        }
      }
      
      return false;
    }
  }

  // Fallback 1: impressão direta sem conversão
  Future<bool> _printDirectBluetooth(String data, String address) async {
    try {
      print('🔄 [Flutter] Fallback 1: enviando dados diretamente...');
      
      final result = await _bluetoothPrinterChannel.invokeMethod('printZpl', {
        'address': address,
        'zpl': data,
      }).timeout(
        const Duration(seconds: 15), // Timeout mais curto para fallback
        onTimeout: () {
          print('⏰ [Flutter] Timeout no fallback 1 Bluetooth');
          throw TimeoutException('Timeout no fallback 1 Bluetooth', const Duration(seconds: 15));
        },
      );
      
      if (result is String && result.contains('sucesso')) {
        print('✅ [Flutter] Fallback 1 funcionou!');
        return true;
      } else {
        throw Exception('Falha no fallback 1: $result');
      }
    } catch (e) {
      print('❌ [Flutter] Fallback 1 falhou: $e');
      return false;
    }
  }

  // Fallback 2: impressão via plugin básico
  Future<bool> _printBasicBluetooth(String data, String address) async {
    try {
      print('🔄 [Flutter] Fallback 2: usando plugin básico...');
      
      final result = await _bluetoothChannel.invokeMethod('printData', {
        'address': address,
        'data': data,
      }).timeout(
        const Duration(seconds: 10), // Timeout muito curto para fallback
        onTimeout: () {
          print('⏰ [Flutter] Timeout no fallback 2 Bluetooth');
          throw TimeoutException('Timeout no fallback 2 Bluetooth', const Duration(seconds: 10));
        },
      );
      
      if (result == true) {
        print('✅ [Flutter] Fallback 2 funcionou!');
        return true;
      } else {
        throw Exception('Falha no fallback 2: $result');
      }
    } catch (e) {
      print('❌ [Flutter] Fallback 2 falhou: $e');
      return false;
    }
  }

  // Modo de emergência: impressão via plugin básico com dados mínimos
  Future<bool> _printEmergencyBluetooth(String data, String address) async {
    try {
      print('🚨 [Flutter] Modo de emergência: enviando dados mínimos...');
      
      // Simplificar dados para evitar problemas
      final simplifiedData = _simplifyDataForEmergency(data);
      
      final result = await _bluetoothChannel.invokeMethod('printData', {
        'address': address,
        'data': simplifiedData,
      }).timeout(
        const Duration(seconds: 5), // Timeout mínimo para emergência
        onTimeout: () {
          print('⏰ [Flutter] Timeout no modo de emergência');
          throw TimeoutException('Timeout no modo de emergência', const Duration(seconds: 5));
        },
      );
      
      if (result == true) {
        print('✅ [Flutter] Modo de emergência funcionou!');
        return true;
      } else {
        throw Exception('Falha no modo de emergência: $result');
      }
    } catch (e) {
      print('❌ [Flutter] Modo de emergência falhou: $e');
      return false;
    }
  }

  // Simplificar dados para modo de emergência
  String _simplifyDataForEmergency(String data) {
    try {
      // Se for CPCL, tentar simplificar
      if (data.contains('!')) {
        // Manter apenas comandos essenciais
        final lines = data.split('\n');
        final essentialLines = lines.where((line) => 
          line.trim().startsWith('!') || 
          line.trim().startsWith('CENTER') ||
          line.trim().startsWith('T ') ||
          line.trim().startsWith('F ') ||
          line.trim().startsWith('FORM') ||
          line.trim().startsWith('PRINT')
        ).toList();
        
        if (essentialLines.isNotEmpty) {
          return essentialLines.join('\n');
        }
      }
      
      // Se não conseguir simplificar, retornar dados originais
      return data;
    } catch (e) {
      print('⚠️ [Flutter] Erro ao simplificar dados: $e');
      return data;
    }
  }

  // Extrair nome do produto do ZPL
  String _extractProductName(String zpl) {
    try {
      final match = RegExp(r'FD([^\\^]+)').firstMatch(zpl);
      if (match != null) {
        final text = match.group(1)!.trim();
        // Pular o primeiro "GRANOBOX TAG" e pegar o próximo
        final parts = text.split('\\');
        if (parts.length > 1) {
          return parts[1].trim();
        }
        return text;
      }
    } catch (e) {
      print('⚠️ [Flutter] Erro ao extrair nome do produto: $e');
    }
    return 'Produto';
  }

  // Extrair código de barras do ZPL
  String _extractBarcode(String zpl) {
    try {
      final match = RegExp(r'BC[^,]+,[^,]+,[^,]+,[^,]+,[^,]+\\FD([^\\^]+)').firstMatch(zpl);
      if (match != null) {
        return match.group(1)!.trim();
      }
    } catch (e) {
      print('⚠️ [Flutter] Erro ao extrair código de barras: $e');
    }
    return '';
  }

  // Extrair data de validade do ZPL
  DateTime? _extractExpiryDate(String zpl) {
    try {
      final match = RegExp(r'Validade: (\d{2})/(\d{2})/(\d{4})').firstMatch(zpl);
      if (match != null) {
        final day = int.parse(match.group(1)!);
        final month = int.parse(match.group(2)!);
        final year = int.parse(match.group(3)!);
        return DateTime(year, month, day);
      }
    } catch (e) {
      print('⚠️ [Flutter] Erro ao extrair data de validade: $e');
    }
    return null;
  }

  // Imprimir usando impressora ativa (detecção automática ZPL/CPCL)
  Future<bool> print(String zpl) async {
    if (_activePrinter == null) {
      throw Exception('Nenhuma impressora ativa');
    }

    print('🖨️ [Flutter] Iniciando impressão com ${_activePrinter!.name}');
    print('🔌 [Flutter] Tipo de conexão: ${_activePrinter!.type}');
    print('📝 [Flutter] Linguagem configurada: ${_activePrinter!.language}');

    switch (_activePrinter!.type) {
      case PrinterType.tcp:
        if (_activePrinter!.port == null) {
          throw Exception('Porta não definida para impressora TCP');
        }
        // TCP sempre usa ZPL
        print('📡 [Flutter] Enviando via TCP (ZPL)');
        return await printViaTcp(zpl, _activePrinter!.address, _activePrinter!.port!);
      
      case PrinterType.bluetooth:
        // Bluetooth sempre usa CPCL
        print('📱 [Flutter] Enviando via Bluetooth (CPCL)');
        return await printViaBluetooth(zpl, _activePrinter!.address);
    }
  }

  // Gerar ID único
  String _generateId() {
    return DateTime.now().millisecondsSinceEpoch.toString();
  }

  // Criar impressora TCP
  Printer createTcpPrinter(String name, String ip, int port) {
    return Printer(
      id: _generateId(),
      name: name,
      type: PrinterType.tcp,
      address: ip,
      port: port,
      language: PrinterLanguage.zpl, // TCP sempre ZPL
    );
  }

  // Criar impressora Bluetooth
  Printer createBluetoothPrinter(String name, String address) {
    return Printer(
      id: _generateId(),
      name: name,
      type: PrinterType.bluetooth,
      address: address,
      language: PrinterLanguage.cpcl, // Bluetooth sempre CPCL
    );
  }

  // Buscar dispositivos Bluetooth
  Future<List<Map<String, dynamic>>> scanBluetoothDevices() async {
    try {
      print('🔍 [Flutter] Iniciando busca de dispositivos Bluetooth...');
      
      // Usar o novo plugin otimizado
      final result = await _bluetoothPrinterChannel.invokeMethod('scanDevices').timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          print('⏰ [Flutter] Timeout na busca de dispositivos Bluetooth');
          throw TimeoutException('Timeout na busca de dispositivos Bluetooth', const Duration(seconds: 10));
        },
      );
      
      print('🔍 [Flutter] Resultado recebido: $result');
      
      if (result is List) {
        final devices = <Map<String, dynamic>>[];
        
        for (final device in result) {
          if (device is Map) {
            // Converter os valores para os tipos corretos
            final convertedDevice = <String, dynamic>{
              'name': device['name']?.toString() ?? '',
              'address': device['address']?.toString() ?? '',
              'isBonded': device['isBonded']?.toString() == 'true',
              'type': device['type']?.toString() ?? '',
            };
            devices.add(convertedDevice);
          }
        }
        
        print('🔍 [Flutter] ${devices.length} dispositivos convertidos');
        return devices;
      }
      
      print('🔍 [Flutter] Resultado não é uma lista: ${result.runtimeType}');
      return [];
    } catch (e) {
      print('❌ [Flutter] Erro ao buscar dispositivos Bluetooth: $e');
      return [];
    }
  }

  // Iniciar busca profunda de dispositivos Bluetooth
  Future<bool> startBluetoothDiscovery() async {
    try {
      print('🔍 [Flutter] Iniciando busca profunda de dispositivos Bluetooth...');
      
      final result = await _bluetoothChannel.invokeMethod('startDiscovery').timeout(
        const Duration(seconds: 15),
        onTimeout: () {
          print('⏰ [Flutter] Timeout ao iniciar busca profunda');
          throw TimeoutException('Timeout ao iniciar busca profunda', const Duration(seconds: 15));
        },
      );
      
      print('🔍 [Flutter] Busca profunda iniciada: $result');
      return result == true;
    } catch (e) {
      print('❌ [Flutter] Erro ao iniciar busca profunda: $e');
      return false;
    }
  }

  // Escutar eventos de descoberta Bluetooth
  Stream<Map<String, dynamic>> get bluetoothDiscoveryStream {
    return _bluetoothDiscoveryChannel.receiveBroadcastStream().map((event) {
      if (event is Map) {
        return Map<String, dynamic>.from(event);
      }
      return <String, dynamic>{};
    });
  }

  // Parar busca profunda
  Future<void> stopBluetoothDiscovery() async {
    try {
      print('🔍 [Flutter] Parando busca profunda...');
      await _bluetoothChannel.invokeMethod('stopDiscovery');
      print('🔍 [Flutter] Busca profunda parada');
    } catch (e) {
      print('❌ [Flutter] Erro ao parar busca profunda: $e');
    }
  }

  // Conectar a dispositivo Bluetooth com PIN
  Future<bool> connectToBluetoothDevice(String address, {String pin = '0000'}) async {
    try {
      print('🔗 [Flutter] Tentando conectar ao dispositivo: $address com PIN: $pin');
      
      final result = await _bluetoothChannel.invokeMethod('connectToDevice', {
        'address': address,
        'pin': pin,
      }).timeout(
        const Duration(seconds: 20),
        onTimeout: () {
          print('⏰ [Flutter] Timeout na conexão Bluetooth');
          throw TimeoutException('Timeout na conexão Bluetooth', const Duration(seconds: 20));
        },
      );
      
      if (result == true) {
        print('✅ [Flutter] Conexão Bluetooth estabelecida com sucesso');
        
        // Atualizar status da impressora se existir
        final printer = _printers.firstWhere((p) => p.address == address);
        await _updatePrinterStatus(printer.id, ConnectionStatus.connected, lastConnectedAt: DateTime.now());
        
        return true;
      } else {
        print('❌ [Flutter] Falha na conexão Bluetooth');
        return false;
      }
    } catch (e) {
      print('❌ [Flutter] Erro na conexão Bluetooth: $e');
      return false;
    }
  }

  // Verificar se Bluetooth está disponível
  Future<bool> isBluetoothAvailable() async {
    try {
      final result = await _bluetoothChannel.invokeMethod('isBluetoothEnabled');
      return result == true;
    } catch (e) {
      print('Erro ao verificar Bluetooth: $e');
      return false;
    }
  }

  // Habilitar Bluetooth
  Future<bool> enableBluetooth() async {
    try {
      final result = await _bluetoothChannel.invokeMethod('enableBluetooth');
      return result == true;
    } catch (e) {
      print('Erro ao habilitar Bluetooth: $e');
      return false;
    }
  }

  // Desconectar Bluetooth
  Future<void> disconnectBluetooth() async {
    try {
      await _bluetoothChannel.invokeMethod('disconnect');
    } catch (e) {
      print('Erro ao desconectar Bluetooth: $e');
    }
  }

  // Atualizar status da impressora
  Future<void> _updatePrinterStatus(String id, ConnectionStatus status, {DateTime? lastConnectedAt, String? lastError}) async {
    final index = _printers.indexWhere((p) => p.id == id);
    if (index != -1) {
      _printers[index] = _printers[index].copyWith(
        connectionStatus: status,
        lastConnectedAt: lastConnectedAt,
        lastError: lastError,
      );
      await _savePrinters();
    }
  }
}
