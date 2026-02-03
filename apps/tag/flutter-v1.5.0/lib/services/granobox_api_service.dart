import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

/// Serviço para comunicação com a API do Granobox
class GranoboxApiService {
  static String get _baseUrl => AppConfig.apiBaseUrl;
  final http.Client _client = http.Client();

  /// Headers padrão para requisições
  Map<String, String> get _defaultHeaders => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  /// Headers com autenticação
  Map<String, String> _getAuthHeaders(String? token) {
    final headers = Map<String, String>.from(_defaultHeaders);
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  /// Processar template via API do Granobox
  Future<Map<String, dynamic>> processTemplate({
    required String templateId,
    required Map<String, dynamic> data,
    String? clientId,
    String? authToken,
  }) async {
    try {
      final response = await _client.post(
        Uri.parse('$_baseUrl/tagment/process-template'),
        headers: _getAuthHeaders(authToken),
        body: jsonEncode({
          'templateId': templateId,
          'data': data,
          if (clientId != null) 'clientId': clientId,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Erro ao processar template');
      }
    } catch (e) {
      throw Exception('Erro na comunicação com a API: ${e.toString()}');
    }
  }

  /// Validar template
  Future<Map<String, dynamic>> validateTemplate({
    required String templateId,
    String? authToken,
  }) async {
    try {
      final response = await _client.post(
        Uri.parse('$_baseUrl/tagment/validate-template/$templateId'),
        headers: _getAuthHeaders(authToken),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Erro ao validar template');
      }
    } catch (e) {
      throw Exception('Erro na validação: ${e.toString()}');
    }
  }

  /// Obter templates disponíveis
  Future<List<Map<String, dynamic>>> getTemplates({
    String? clientId,
    String? authToken,
  }) async {
    try {
      final uri = Uri.parse('$_baseUrl/tagment/templates').replace(
        queryParameters: clientId != null ? {'clientId': clientId} : null,
      );

      final response = await _client.get(
        uri,
        headers: _getAuthHeaders(authToken),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Erro ao obter templates');
      }
    } catch (e) {
      throw Exception('Erro ao obter templates: ${e.toString()}');
    }
  }

  /// Obter template específico
  Future<Map<String, dynamic>> getTemplate({
    required String templateId,
    String? clientId,
    String? authToken,
  }) async {
    try {
      final uri = Uri.parse('$_baseUrl/tagment/templates/$templateId').replace(
        queryParameters: clientId != null ? {'clientId': clientId} : null,
      );

      final response = await _client.get(
        uri,
        headers: _getAuthHeaders(authToken),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Template não encontrado');
      }
    } catch (e) {
      throw Exception('Erro ao obter template: ${e.toString()}');
    }
  }

  /// Obter template padrão por cliente e tipo de etiqueta (labelType)
  Future<String?> getDefaultTemplateId({
    required String clientId,
    required String labelType,
    String? authToken,
  }) async {
    try {
      final uri = Uri.parse('$_baseUrl/tagment/default-template').replace(
        queryParameters: {
          'clientId': clientId,
          'labelType': labelType,
        },
      );
      
      print('🌐 [getDefaultTemplateId] Fazendo requisição:');
      print('   URL: $uri');
      print('   Client ID: $clientId');
      print('   Label Type: $labelType');
      
      final response = await _client.get(
        uri,
        headers: _getAuthHeaders(authToken),
      );
      
      print('📥 [getDefaultTemplateId] Resposta recebida:');
      print('   Status Code: ${response.statusCode}');
      print('   Body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data == null) {
          print('⚠️ [getDefaultTemplateId] Resposta 200 mas data é null');
          return null;
        }
        // Espera-se um objeto associação com campo templateId
        if (data is Map && data['templateId'] is String) {
          final templateId = data['templateId'] as String;
          print('✅ [getDefaultTemplateId] Template encontrado: $templateId');
          return templateId;
        }
        print('⚠️ [getDefaultTemplateId] Resposta 200 mas formato inesperado: $data');
        return null;
      } else if (response.statusCode == 404) {
        print('ℹ️ [getDefaultTemplateId] Template padrão não configurado (404)');
        return null; // Sem associação configurada
      } else {
        final error = jsonDecode(response.body);
        print('❌ [getDefaultTemplateId] Erro ${response.statusCode}: $error');
        throw Exception(error['message'] ?? 'Erro ao obter template padrão');
      }
    } catch (e, stackTrace) {
      print('❌ [getDefaultTemplateId] Exceção: $e');
      print('   Stack: $stackTrace');
      throw Exception('Erro ao obter template padrão: ${e.toString()}');
    }
  }

  /// Testar conexão com a API
  Future<Map<String, dynamic>> testConnection({String? authToken}) async {
    try {
      final response = await _client.get(
        Uri.parse('$_baseUrl/tagment/test-connection'),
        headers: _getAuthHeaders(authToken),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Erro ao testar conexão');
      }
    } catch (e) {
      throw Exception('Erro na conexão: ${e.toString()}');
    }
  }

  /// Obter configuração do Tagment
  Future<Map<String, dynamic>> getConfig({String? authToken}) async {
    try {
      final response = await _client.get(
        Uri.parse('$_baseUrl/tagment/config'),
        headers: _getAuthHeaders(authToken),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Erro ao obter configuração');
      }
    } catch (e) {
      throw Exception('Erro ao obter configuração: ${e.toString()}');
    }
  }

  /// Liberar recursos
  void dispose() {
    _client.close();
  }
}
