import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

/// Serviço genérico para comunicação com a API
class ApiService {
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

  /// GET request
  Future<http.Response> get(String endpoint, {String? token}) async {
    return await _client.get(
      Uri.parse('$_baseUrl$endpoint'),
      headers: _getAuthHeaders(token),
    );
  }

  /// POST request
  Future<http.Response> post(String endpoint, {Map<String, dynamic>? data, String? token, Duration? timeout}) async {
    return await _client.post(
      Uri.parse('$_baseUrl$endpoint'),
      headers: _getAuthHeaders(token),
      body: data != null ? jsonEncode(data) : null,
    ).timeout(timeout ?? const Duration(seconds: 30)); // Timeout padrão de 30s
  }

  /// PATCH request
  Future<http.Response> patch(String endpoint, {Map<String, dynamic>? data, String? token}) async {
    return await _client.patch(
      Uri.parse('$_baseUrl$endpoint'),
      headers: _getAuthHeaders(token),
      body: data != null ? jsonEncode(data) : null,
    );
  }

  /// DELETE request
  Future<http.Response> delete(String endpoint, {String? token}) async {
    return await _client.delete(
      Uri.parse('$_baseUrl$endpoint'),
      headers: _getAuthHeaders(token),
    );
  }

  /// Dispose do cliente HTTP
  void dispose() {
    _client.close();
  }
}
