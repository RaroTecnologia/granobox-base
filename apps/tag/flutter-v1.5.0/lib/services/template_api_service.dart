import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../models/print_api_models.dart';

/// Serviço para integração com a API Tagment
class TemplateApiService {
  final PrintApiConfig _config;
  final http.Client _client;

  TemplateApiService({
    required PrintApiConfig config,
    http.Client? client,
  })  : _config = config,
        _client = client ?? http.Client();

  /// Processa template completo (parse + substitute + compile) via API
  Future<PrintApiResult<String>> processTemplate(
    String templateJson,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await _makeRequest(
        '/v1/templates/process',
        method: 'POST',
        body: ProcessTemplateRequest(
          template: templateJson,
          data: data,
        ).toJson(),
      );

      if (!response.success) {
        return PrintApiResult<String>(
          success: false,
          error: response.error ?? 'Erro no processamento do template',
        );
      }

      final processResponse = ProcessTemplateResponse.fromJson(response.data!);
      return PrintApiResult<String>(
        success: true,
        data: processResponse.zpl,
        remainingRequests: processResponse.remainingRequests,
      );
    } catch (error) {
      return PrintApiResult<String>(
        success: false,
        error: 'Erro na comunicação com a API: ${error.toString()}',
      );
    }
  }

  /// Valida template via API
  Future<PrintApiResult<bool>> validateTemplate(String templateJson) async {
    try {
      final response = await _makeRequest(
        '/v1/templates/validate',
        method: 'POST',
        body: {'template': templateJson},
      );

      return PrintApiResult<bool>(
        success: response.success,
        data: response.data?['isValid'] ?? false,
        remainingRequests: response.remainingRequests,
      );
    } catch (error) {
      return PrintApiResult<bool>(
        success: false,
        error: 'Erro na validação: ${error.toString()}',
      );
    }
  }

  /// Compila template para ZPL via API
  Future<PrintApiResult<String>> compileTemplate(TagmentTemplate template) async {
    try {
      final response = await _makeRequest(
        '/v1/templates/compile',
        method: 'POST',
        body: {'template': template.toJson()},
      );

      if (!response.success) {
        return PrintApiResult<String>(
          success: false,
          error: response.error ?? 'Erro na compilação',
        );
      }

      return PrintApiResult<String>(
        success: true,
        data: response.data?['zpl'] ?? '',
        remainingRequests: response.remainingRequests,
      );
    } catch (error) {
      return PrintApiResult<String>(
        success: false,
        error: 'Erro na compilação: ${error.toString()}',
      );
    }
  }

  /// Obtém informações da API Key
  Future<PrintApiResult<ApiKeyInfo>> getAPIKeyInfo() async {
    try {
      final response = await _makeRequest(
        '/v1/auth/info',
        method: 'GET',
      );

      if (!response.success) {
        return PrintApiResult<ApiKeyInfo>(
          success: false,
          error: response.error ?? 'Erro ao obter informações',
        );
      }

      return PrintApiResult<ApiKeyInfo>(
        success: true,
        data: ApiKeyInfo.fromJson(response.data!),
        remainingRequests: response.remainingRequests,
      );
    } catch (error) {
      return PrintApiResult<ApiKeyInfo>(
        success: false,
        error: 'Erro ao obter informações: ${error.toString()}',
      );
    }
  }

  /// Testa conexão com a API
  Future<PrintApiResult<bool>> testConnection() async {
    try {
      final response = await _makeRequest(
        '/v1/health',
        method: 'GET',
      );

      return PrintApiResult<bool>(
        success: response.success,
        data: response.success,
        remainingRequests: response.remainingRequests,
      );
    } catch (error) {
      return PrintApiResult<bool>(
        success: false,
        error: 'Erro na conexão: ${error.toString()}',
      );
    }
  }

  /// Faz requisição HTTP para a API
  Future<PrintApiResult<Map<String, dynamic>>> _makeRequest(
    String endpoint, {
    required String method,
    Map<String, dynamic>? body,
  }) async {
    try {
      final uri = Uri.parse('${_config.baseUrl}$endpoint');
      
      final headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${_config.apiKey}',
        'User-Agent': 'Tagment-Flutter-SDK/1.0.0',
      };

      http.Response response;
      
      switch (method.toUpperCase()) {
        case 'GET':
          response = await _client.get(uri, headers: headers);
          break;
        case 'POST':
          response = await _client.post(
            uri,
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          );
          break;
        case 'PUT':
          response = await _client.put(
            uri,
            headers: headers,
            body: body != null ? jsonEncode(body) : null,
          );
          break;
        case 'DELETE':
          response = await _client.delete(uri, headers: headers);
          break;
        default:
          throw Exception('Método HTTP não suportado: $method');
      }

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return PrintApiResult<Map<String, dynamic>>(
          success: true,
          data: data,
          remainingRequests: data['remainingRequests'],
        );
      } else {
        final errorData = jsonDecode(response.body) as Map<String, dynamic>;
        return PrintApiResult<Map<String, dynamic>>(
          success: false,
          error: errorData['message'] ?? 'HTTP ${response.statusCode}: ${response.reasonPhrase}',
        );
      }
    } on SocketException {
      return PrintApiResult<Map<String, dynamic>>(
        success: false,
        error: 'Erro de conexão: Verifique sua internet',
      );
    } on HttpException catch (e) {
      return PrintApiResult<Map<String, dynamic>>(
        success: false,
        error: 'Erro HTTP: ${e.message}',
      );
    } on FormatException {
      return PrintApiResult<Map<String, dynamic>>(
        success: false,
        error: 'Erro de formato na resposta da API',
      );
    } catch (error) {
      return PrintApiResult<Map<String, dynamic>>(
        success: false,
        error: 'Erro inesperado: ${error.toString()}',
      );
    }
  }

  /// Libera recursos
  void dispose() {
    _client.close();
  }
}



