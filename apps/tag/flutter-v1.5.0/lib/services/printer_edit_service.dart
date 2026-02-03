import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/print_result_models.dart';

/// Serviço para edição de impressoras via API v1
class PrinterEditService {
  static const String _baseUrl = 'https://api.tagment.com.br';
  final String apiKey;
  
  PrinterEditService({required this.apiKey});
  
  /// Atualizar configurações básicas da impressora
  Future<bool> atualizarConfiguracoesBasicas({
    required String printerId,
    String? displayName,
    String? brand,
    String? model,
    String? thermalType,
    List<String>? tags,
  }) async {
    try {
      print('🔧 Atualizando configurações básicas da impressora: $printerId');
      
      final Map<String, dynamic> data = {};
      if (displayName != null) data['displayName'] = displayName;
      if (brand != null) data['brand'] = brand;
      if (model != null) data['model'] = model;
      if (thermalType != null) data['thermalType'] = thermalType;
      if (tags != null) data['tags'] = tags;
      
      return await _fazerRequisicao(printerId, data);
    } catch (e) {
      print('❌ Erro ao atualizar configurações básicas: $e');
      return false;
    }
  }
  
  /// Atualizar configurações de conexão TCP
  Future<bool> atualizarConfiguracaoTCP({
    required String printerId,
    String? host,
    int? port,
    String? protocol,
    int? timeout,
  }) async {
    try {
      print('🔧 Atualizando configuração TCP da impressora: $printerId');
      
      final Map<String, dynamic> data = {
        'connection': {
          'type': 'tcp',
          if (host != null) 'host': host,
          if (port != null) 'port': port,
          if (protocol != null) 'protocol': protocol,
          if (timeout != null) 'timeout': timeout,
        }
      };
      
      return await _fazerRequisicao(printerId, data);
    } catch (e) {
      print('❌ Erro ao atualizar configuração TCP: $e');
      return false;
    }
  }
  
  /// Atualizar configurações de conexão USB
  Future<bool> atualizarConfiguracaoUSB({
    required String printerId,
    String? devicePath,
    String? cupsName,
    String? cupsUri,
    int? usbTimeout,
  }) async {
    try {
      print('🔧 Atualizando configuração USB da impressora: $printerId');
      
      final Map<String, dynamic> data = {
        'connection': {
          'type': 'usb',
          if (devicePath != null) 'devicePath': devicePath,
          if (cupsName != null) 'cupsName': cupsName,
          if (cupsUri != null) 'cupsUri': cupsUri,
          if (usbTimeout != null) 'usbTimeout': usbTimeout,
        }
      };
      
      return await _fazerRequisicao(printerId, data);
    } catch (e) {
      print('❌ Erro ao atualizar configuração USB: $e');
      return false;
    }
  }
  
  /// Atualizar capacidades da impressora
  Future<bool> atualizarCapacidades({
    required String printerId,
    int? dpi,
    double? maxWidthMm,
    double? maxHeightMm,
    bool? supportsZPL,
    bool? supportsCutter,
    bool? supportsColor,
  }) async {
    try {
      print('🔧 Atualizando capacidades da impressora: $printerId');
      
      final Map<String, dynamic> capabilities = {};
      if (dpi != null) capabilities['dpi'] = dpi;
      if (maxWidthMm != null) capabilities['maxWidthMm'] = maxWidthMm;
      if (maxHeightMm != null) capabilities['maxHeightMm'] = maxHeightMm;
      if (supportsZPL != null) capabilities['supportsZPL'] = supportsZPL;
      if (supportsCutter != null) capabilities['supportsCutter'] = supportsCutter;
      if (supportsColor != null) capabilities['supportsColor'] = supportsColor;
      
      final Map<String, dynamic> data = {'capabilities': capabilities};
      
      return await _fazerRequisicao(printerId, data);
    } catch (e) {
      print('❌ Erro ao atualizar capacidades: $e');
      return false;
    }
  }
  
  /// Atualizar offsets de posicionamento
  Future<bool> atualizarOffsets({
    required String printerId,
    double? offsetX,
    double? offsetY,
  }) async {
    try {
      print('🔧 Atualizando offsets da impressora: $printerId');
      print('   📍 Offset X: $offsetX mm');
      print('   📍 Offset Y: $offsetY mm');
      
      final Map<String, dynamic> data = {};
      if (offsetX != null) data['offsetX'] = offsetX;
      if (offsetY != null) data['offsetY'] = offsetY;
      
      return await _fazerRequisicao(printerId, data);
    } catch (e) {
      print('❌ Erro ao atualizar offsets: $e');
      return false;
    }
  }
  
  /// Atualizar configurações do Print Agent
  Future<bool> atualizarConfiguracaoPrintAgent({
    required String printerId,
    bool? autoConnect,
    bool? debugMode,
    bool? allowRemotePrinting,
    int? maxConcurrentJobs,
  }) async {
    try {
      print('🔧 Atualizando configuração do Print Agent: $printerId');
      
      final Map<String, dynamic> data = {
        'printAgent': {
          if (autoConnect != null) 'autoConnect': autoConnect,
          if (debugMode != null) 'debugMode': debugMode,
          if (allowRemotePrinting != null) 'allowRemotePrinting': allowRemotePrinting,
          if (maxConcurrentJobs != null) 'maxConcurrentJobs': maxConcurrentJobs,
        }
      };
      
      return await _fazerRequisicao(printerId, data);
    } catch (e) {
      print('❌ Erro ao atualizar configuração do Print Agent: $e');
      return false;
    }
  }
  
  /// Atualizar configurações do Flutter
  Future<bool> atualizarConfiguracaoFlutter({
    required String printerId,
    Map<String, dynamic>? segmentConfig,
    int? priority,
    int? timeout,
    int? retryAttempts,
  }) async {
    try {
      print('🔧 Atualizando configuração do Flutter: $printerId');
      
      final Map<String, dynamic> data = {
        'flutter': {
          if (segmentConfig != null) 'segmentConfig': segmentConfig,
          if (priority != null) 'priority': priority,
          if (timeout != null) 'timeout': timeout,
          if (retryAttempts != null) 'retryAttempts': retryAttempts,
        }
      };
      
      return await _fazerRequisicao(printerId, data);
    } catch (e) {
      print('❌ Erro ao atualizar configuração do Flutter: $e');
      return false;
    }
  }
  
  /// Atualizar status da impressora
  Future<bool> atualizarStatus({
    required String printerId,
    String? status,
    String? errorMessage,
  }) async {
    try {
      print('🔧 Atualizando status da impressora: $printerId');
      print('   📊 Status: $status');
      print('   ❌ Error Message: $errorMessage');
      
      final Map<String, dynamic> data = {};
      if (status != null) data['status'] = status;
      if (errorMessage != null) data['errorMessage'] = errorMessage;
      
      return await _fazerRequisicao(printerId, data);
    } catch (e) {
      print('❌ Erro ao atualizar status: $e');
      return false;
    }
  }
  
  /// Fazer requisição PATCH para a API
  Future<bool> _fazerRequisicao(String printerId, Map<String, dynamic> data) async {
    try {
      print('📡 Enviando requisição PATCH para impressora: $printerId');
      print('📊 Dados: $data');
      
      final response = await http.patch(
        Uri.parse('$_baseUrl/v1/printers/$printerId'),
        headers: {
          'Authorization': 'Bearer $apiKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(data),
      );
      
      print('📊 Status da resposta: ${response.statusCode}');
      print('📄 Body da resposta: ${response.body}');
      
      if (response.statusCode == 200) {
        print('✅ Impressora atualizada com sucesso');
        return true;
      } else {
        print('❌ Erro na API: ${response.statusCode} - ${response.body}');
        return false;
      }
    } catch (e) {
      print('❌ Erro na requisição: $e');
      return false;
    }
  }
  
  /// Atualizar múltiplas configurações de uma vez
  Future<bool> atualizarConfiguracaoCompleta({
    required String printerId,
    Map<String, dynamic>? configuracoesBasicas,
    Map<String, dynamic>? conexao,
    Map<String, dynamic>? capacidades,
    Map<String, dynamic>? offsets,
    Map<String, dynamic>? printAgent,
    Map<String, dynamic>? flutter,
    Map<String, dynamic>? status,
  }) async {
    try {
      print('🔧 Atualizando configuração completa da impressora: $printerId');
      
      final Map<String, dynamic> data = {};
      
      if (configuracoesBasicas != null) {
        data.addAll(configuracoesBasicas);
      }
      
      if (conexao != null) {
        data['connection'] = conexao;
      }
      
      if (capacidades != null) {
        data['capabilities'] = capacidades;
      }
      
      if (offsets != null) {
        data.addAll(offsets);
      }
      
      if (printAgent != null) {
        data['printAgent'] = printAgent;
      }
      
      if (flutter != null) {
        data['flutter'] = flutter;
      }
      
      if (status != null) {
        data.addAll(status);
      }
      
      print('📊 Configuração completa: $data');
      
      return await _fazerRequisicao(printerId, data);
    } catch (e) {
      print('❌ Erro ao atualizar configuração completa: $e');
      return false;
    }
  }
}
