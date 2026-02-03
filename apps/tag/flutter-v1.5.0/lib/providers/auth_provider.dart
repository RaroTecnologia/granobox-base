import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../models/auth_models.dart';
import '../services/auth_service.dart';
import '../services/biometric_service.dart';

/// Provider para gerenciamento do estado de autenticação
class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  
  User? _user;
  bool _isLoading = false;
  bool _isInitialized = false;
  String? _error;

  // Getters
  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isInitialized => _isInitialized;
  bool get isAuthenticated => _user != null;
  String? get error => _error;
  
  /// Obter token de autenticação
  Future<String?> get authToken async {
    return await _authService.getAuthToken();
  }

  /// Inicializar o provider (verificar se há sessão salva)
  Future<void> initialize() async {
    if (_isInitialized) return;
    
    _setLoading(true);
    _clearError();

    try {
      // Verificar se há dados salvos
      final userData = await _authService.getUserData();
      final token = await _authService.getAuthToken();
      
      if (userData != null && token != null) {
        // Validar se o token ainda é válido
        final isValid = await _authService.validateToken();
        
        if (isValid) {
          _user = userData;
        } else {
          // Token inválido, fazer logout
          await _authService.logout();
        }
      }
    } catch (e) {
      _setError('Erro ao inicializar autenticação: ${e.toString()}');
    } finally {
      _setLoading(false);
      _isInitialized = true;
      notifyListeners();
    }
  }

  /// Fazer login
  Future<bool> login({
    required String email,
    required String password,
    bool saveForBiometric = false,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      final loginResponse = await _authService.login(
        email: email,
        password: password,
      );

      _user = loginResponse.user;
      // Reset de caches relacionados ao cliente/logado
      try {
        // Limpeza global de cache inteligente
        // ignore: unused_import
        // A limpeza específica por tipo será feita pelos próprios providers
      } catch (_) {}
      
      // Salvar credenciais para biometria se solicitado
      if (saveForBiometric) {
        await BiometricService.saveCredentialsForBiometric(
          email: email,
          password: password,
        );
      }
      
      notifyListeners();
      return true;
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// Fazer login com biometria
  Future<bool> loginWithBiometric() async {
    _setLoading(true);
    _clearError();

    try {
      // Verificar se biometria está disponível e habilitada
      final biometricStatus = await BiometricService.getBiometricStatus();
      if (!biometricStatus.canUseBiometric || !biometricStatus.isEnabled) {
        _setError('Biometria não está disponível ou habilitada');
        return false;
      }

      // Obter credenciais salvas
      final credentials = await BiometricService.getCredentialsForBiometric();
      if (credentials == null) {
        _setError('Nenhuma credencial salva para biometria');
        return false;
      }

      // Autenticar com biometria
      final authenticated = await BiometricService.authenticateWithBiometric(
        reason: 'Use sua biometria para fazer login no GranoBox Tag',
      );

      if (!authenticated) {
        _setError('Autenticação biométrica falhou');
        return false;
      }

      // Fazer login com as credenciais salvas
      final loginResponse = await _authService.login(
        email: credentials['email']!,
        password: credentials['password']!,
      );

      _user = loginResponse.user;
      notifyListeners();
      return true;
    } catch (e) {
      _setError(e.toString());
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// Fazer logout
  Future<void> logout() async {
    _setLoading(true);
    _clearError();

    try {
      await _authService.logout();
      _user = null;
      // Notificar para que providers limparem seus estados/caches
      try {
        // nada síncrono aqui; listeners reagirão ao _user null
      } catch (_) {}
    } catch (e) {
      _setError('Erro ao fazer logout: ${e.toString()}');
    } finally {
      _setLoading(false);
      notifyListeners();
    }
  }

  /// Atualizar dados do usuário
  Future<void> refreshUser() async {
    if (!isAuthenticated) return;

    try {
      final userData = await _authService.getCurrentUser();
      if (userData != null) {
        _user = userData;
        notifyListeners();
      }
    } catch (e) {
      // Se houver erro ao atualizar, o usuário pode ter sido deslogado
      await logout();
    }
  }

  /// Validar token atual
  Future<bool> validateCurrentToken() async {
    if (!isAuthenticated) return false;

    try {
      final isValid = await _authService.validateToken();
      if (!isValid) {
        await logout();
      }
      return isValid;
    } catch (e) {
      await logout();
      return false;
    }
  }

  /// Fazer requisição autenticada
  Future<Map<String, dynamic>?> authenticatedRequest({
    required String method,
    required String endpoint,
    Map<String, dynamic>? body,
  }) async {
    if (!isAuthenticated) {
      throw Exception('Usuário não autenticado');
    }

    try {
      final response = await _authService.authenticatedRequest(
        method: method,
        endpoint: endpoint,
        body: body,
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return jsonDecode(response.body);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Erro na requisição');
      }
    } catch (e) {
      if (e.toString().contains('401') || e.toString().contains('Unauthorized')) {
        // Token expirado, fazer logout
        await logout();
      }
      rethrow;
    }
  }

  /// Limpar erro
  void _clearError() {
    _error = null;
  }

  /// Definir estado de loading
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  /// Definir erro
  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  @override
  void dispose() {
    _authService.dispose();
    super.dispose();
  }
}
