import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

/// Serviço para edição de impressoras no Granobox
class GranoboxPrinterEditService {
  static String get _baseUrl => AppConfig.apiBaseUrl;
  
  /// Atualizar configurações da impressora no Granobox
  Future<bool> atualizarImpressora({
    required String printerId,
    required String authToken,
    String? name,
    String? location, // ⭐ NOVO: Localização
    String? brand,
    String? model,
    String? type,
    String? printMethod, // ✅ NOVO: Método de impressão
    String? ip,
    int? port,
    Map<String, dynamic>? capabilities,
    double? offsetX,
    double? offsetY,
    String? status,
    List<String>? usage,
    String? operationId,
  }) async {
    try {
      print('🔧 [Granobox] Atualizando impressora: $printerId');
      print('🔑 [Granobox] Token: ${authToken.substring(0, 20)}...');
      
      final Map<String, dynamic> data = {};
      
      if (name != null) {
        data['name'] = name;
        print('📝 [Granobox] Name: $name');
      }
      if (location != null) {
        data['location'] = location;
        print('📍 [Granobox] Location: $location');
      }
      if (brand != null) {
        data['brand'] = brand;
        print('🏷️ [Granobox] Brand: $brand');
      }
      if (model != null) {
        data['model'] = model;
        print('🏷️ [Granobox] Model: $model');
      }
      if (type != null) {
        data['type'] = type;
        print('🔧 [Granobox] Type: $type');
      }
      if (printMethod != null) {
        data['printMethod'] = printMethod;
        print('📡 [Granobox] Print Method: $printMethod');
      }
      if (ip != null) data['ip'] = ip;
      if (port != null) data['port'] = port;
      if (capabilities != null) data['capabilities'] = capabilities;
      if (offsetX != null) {
        data['offsetX'] = offsetX;
        print('📍 [Granobox] Offset X: $offsetX');
      }
      if (offsetY != null) {
        data['offsetY'] = offsetY;
        print('📍 [Granobox] Offset Y: $offsetY');
      }
      if (status != null) data['status'] = status;
      if (usage != null) data['usage'] = usage;
      if (operationId != null) {
        data['operationId'] = operationId;
        print('🏢 [Granobox] Operation ID: $operationId');
      }
      
      print('📦 [Granobox] Dados a atualizar: ${jsonEncode(data)}');
      
      final url = '$_baseUrl/printers/$printerId';
      print('🌐 [Granobox] URL completa: $url');
      print('🔑 [Granobox] Headers: Authorization: Bearer ${authToken.substring(0, 20)}...');
      
      print('📤 [Granobox] Enviando requisição PATCH...');
      final response = await http.patch(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(data),
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          print('⏱️ [Granobox] TIMEOUT após 10 segundos!');
          throw Exception('Timeout ao atualizar impressora');
        },
      );
      
      print('📊 [Granobox] Status da resposta: ${response.statusCode}');
      print('📄 [Granobox] Body da resposta: ${response.body}');
      
      if (response.statusCode == 200) {
        print('✅ [Granobox] Impressora atualizada com sucesso!');
        print('✅ [Granobox] offsetX=${data['offsetX']}, offsetY=${data['offsetY']} salvos!');
        return true;
      } else {
        print('❌ [Granobox] Erro HTTP ${response.statusCode}');
        print('❌ [Granobox] Resposta: ${response.body}');
        return false;
      }
    } catch (e, stackTrace) {
      print('❌ [Granobox] Exceção ao atualizar impressora: $e');
      print('❌ [Granobox] Stack trace: $stackTrace');
      return false;
    }
  }
  
  /// Atualizar apenas offsets
  Future<bool> atualizarOffsets({
    required String printerId,
    required String authToken,
    required double offsetX,
    required double offsetY,
  }) async {
    return await atualizarImpressora(
      printerId: printerId,
      authToken: authToken,
      offsetX: offsetX,
      offsetY: offsetY,
    );
  }
  
  /// Atualizar apenas capacidades
  Future<bool> atualizarCapacidades({
    required String printerId,
    required String authToken,
    int? dpi,
    double? maxWidthMm,
    double? maxHeightMm,
    bool? supportsZPL,
    bool? supportsCutter,
    bool? supportsColor,
  }) async {
    final capabilities = <String, dynamic>{};
    
    if (dpi != null) capabilities['dpi'] = dpi;
    if (maxWidthMm != null) capabilities['maxWidthMm'] = maxWidthMm;
    if (maxHeightMm != null) capabilities['maxHeightMm'] = maxHeightMm;
    if (supportsZPL != null) capabilities['supportsZPL'] = supportsZPL;
    if (supportsCutter != null) capabilities['supportsCutter'] = supportsCutter;
    if (supportsColor != null) capabilities['supportsColor'] = supportsColor;
    
    return await atualizarImpressora(
      printerId: printerId,
      authToken: authToken,
      capabilities: capabilities,
    );
  }
  
  /// Atualizar marca e modelo
  Future<bool> atualizarMarcaModelo({
    required String printerId,
    required String authToken,
    String? brand,
    String? model,
  }) async {
    return await atualizarImpressora(
      printerId: printerId,
      authToken: authToken,
      brand: brand,
      model: model,
    );
  }
}

