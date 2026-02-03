import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/auth_models.dart';
import '../config/app_config.dart';

/// Serviço de autenticação para comunicação com a API do Granobox
class AuthService {
  static String get _baseUrl => AppConfig.apiBaseUrl;
  static const String _authTokenKey = 'auth_token';
  static const String _userDataKey = 'user_data';

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

  /// Fazer login
  Future<LoginResponse> login({
    required String email,
    required String password,
  }) async {
    try {
      print('🔐 Tentando fazer login...');
      print('📧 Email: $email');
      print('🌐 URL: $_baseUrl/auth/login');
      
      final response = await _client.post(
        Uri.parse('$_baseUrl/auth/login'),
        headers: _defaultHeaders,
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      print('📊 Status Code: ${response.statusCode}');
      print('📄 Response Body: ${response.body}');

      if (response.statusCode == 200) {
        try {
          final responseData = jsonDecode(response.body);
          print('✅ JSON parseado com sucesso');
          print('📋 Dados do usuário: ${responseData['user']}');
          
          final loginResponse = LoginResponse.fromJson(responseData);
          
          // Salvar token e dados do usuário
          await _saveAuthData(loginResponse.accessToken, loginResponse.user);
          
          print('✅ Login realizado com sucesso');
          return loginResponse;
        } catch (e) {
          print('❌ Erro ao parsear resposta de login: $e');
          print('📄 Response body que causou erro: ${response.body}');
          throw Exception('Erro ao processar dados do usuário: $e');
        }
      } else {
        print('❌ Erro HTTP: ${response.statusCode}');
        print('📄 Error body: ${response.body}');
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Erro ao fazer login');
      }
    } catch (e) {
      print('❌ Erro geral no login: $e');
      if (e is Exception) {
        rethrow;
      }
      throw Exception('Erro na comunicação com a API: ${e.toString()}');
    }
  }

  /// Solicitar recuperação de senha
  Future<void> forgotPassword({
    required String email,
  }) async {
    try {
      print('📧 Solicitar recuperação de senha para: $email');
      print('🌐 URL: $_baseUrl/auth/forgot-password');

      final response = await _client.post(
        Uri.parse('$_baseUrl/auth/forgot-password'),
        headers: _defaultHeaders,
        body: jsonEncode({ 'email': email }),
      );

      print('📊 Status Code: ${response.statusCode}');
      print('📄 Response Body: ${response.body}');

      if (response.statusCode == 200) {
        // API retorna mensagem genérica de sucesso; nada a armazenar
        return;
      } else {
        try {
          final error = jsonDecode(response.body);
          throw Exception(error['message'] ?? 'Erro ao solicitar recuperação de senha');
        } catch (_) {
          throw Exception('Erro ao solicitar recuperação de senha');
        }
      }
    } catch (e) {
      print('❌ Erro geral em forgotPassword: $e');
      rethrow;
    }
  }

  /// Fazer logout
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_authTokenKey);
    await prefs.remove(_userDataKey);
  }

  /// Verificar se o usuário está autenticado
  Future<bool> isAuthenticated() async {
    final token = await getAuthToken();
    return token != null && token.isNotEmpty;
  }

  /// Obter token de autenticação salvo
  Future<String?> getAuthToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_authTokenKey);
  }

  /// Obter dados do usuário salvos
  Future<User?> getUserData() async {
    final prefs = await SharedPreferences.getInstance();
    final userDataString = prefs.getString(_userDataKey);
    
    if (userDataString != null) {
      try {
        final userData = jsonDecode(userDataString);
        return User.fromJson(userData);
      } catch (e) {
        // Se houver erro ao parsear, remover dados corrompidos
        await logout();
        return null;
      }
    }
    
    return null;
  }

  /// Salvar dados de autenticação
  Future<void> _saveAuthData(String token, User user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_authTokenKey, token);
    await prefs.setString(_userDataKey, jsonEncode(user.toJson()));
  }

  /// Validar token (verificar se ainda é válido)
  Future<bool> validateToken() async {
    final token = await getAuthToken();
    if (token == null) return false;

    try {
      final response = await _client.get(
        Uri.parse('$_baseUrl/auth/validate'),
        headers: _getAuthHeaders(token),
      );

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  /// Obter informações do usuário atual
  Future<User?> getCurrentUser() async {
    final token = await getAuthToken();
    if (token == null) return null;

    try {
      final response = await _client.get(
        Uri.parse('$_baseUrl/auth/me'),
        headers: _getAuthHeaders(token),
      );

      if (response.statusCode == 200) {
        final userData = jsonDecode(response.body);
        return User.fromJson(userData);
      } else {
        return null;
      }
    } catch (e) {
      return null;
    }
  }

  /// Fazer requisição autenticada
  Future<http.Response> authenticatedRequest({
    required String method,
    required String endpoint,
    Map<String, dynamic>? body,
  }) async {
    final token = await getAuthToken();
    if (token == null) {
      throw Exception('Usuário não autenticado');
    }

    final uri = Uri.parse('$_baseUrl$endpoint');
    final headers = _getAuthHeaders(token);

    switch (method.toUpperCase()) {
      case 'GET':
        return await _client.get(uri, headers: headers);
      case 'POST':
        return await _client.post(
          uri,
          headers: headers,
          body: body != null ? jsonEncode(body) : null,
        );
      case 'PUT':
        return await _client.put(
          uri,
          headers: headers,
          body: body != null ? jsonEncode(body) : null,
        );
      case 'DELETE':
        return await _client.delete(uri, headers: headers);
      default:
        throw Exception('Método HTTP não suportado: $method');
    }
  }

  /// Dispose do cliente HTTP
  void dispose() {
    _client.close();
  }
}
