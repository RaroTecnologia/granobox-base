import 'package:flutter/foundation.dart';
import '../services/granobox_api_service.dart';

/// Provider para gerenciamento da API do Granobox
class GranoboxApiProvider extends ChangeNotifier {
  final GranoboxApiService _apiService = GranoboxApiService();
  
  bool _isLoading = false;
  String? _error;
  String? _authToken;
  String? _clientId;
  List<Map<String, dynamic>> _templates = [];
  Map<String, dynamic>? _config;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get authToken => _authToken;
  String? get clientId => _clientId;
  List<Map<String, dynamic>> get templates => _templates;
  Map<String, dynamic>? get config => _config;
  bool get isConfigured => _authToken != null;

  /// Configurar autenticação
  void setAuth({required String token, String? clientId}) {
    _authToken = token;
    _clientId = clientId;
    _clearError();
    notifyListeners();
  }

  /// Limpar autenticação
  void clearAuth() {
    _authToken = null;
    _clientId = null;
    _templates.clear();
    _config = null;
    _clearError();
    notifyListeners();
  }

  /// Testar conexão com a API
  Future<bool> testConnection() async {
    _setLoading(true);
    _clearError();

    try {
      final result = await _apiService.testConnection(authToken: _authToken);
      _config = result;
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Erro na conexão: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// Carregar templates disponíveis
  Future<void> loadTemplates() async {
    if (_authToken == null) {
      _setError('Não autenticado');
      return;
    }

    _setLoading(true);
    _clearError();

    try {
      _templates = await _apiService.getTemplates(
        clientId: _clientId,
        authToken: _authToken,
      );
      notifyListeners();
    } catch (e) {
      _setError('Erro ao carregar templates: ${e.toString()}');
    } finally {
      _setLoading(false);
    }
  }

  /// Processar template
  Future<Map<String, dynamic>?> processTemplate({
    required String templateId,
    required Map<String, dynamic> data,
  }) async {
    if (_authToken == null) {
      _setError('Não autenticado');
      return null;
    }

    _setLoading(true);
    _clearError();

    try {
      final result = await _apiService.processTemplate(
        templateId: templateId,
        data: data,
        clientId: _clientId,
        authToken: _authToken,
      );
      
      notifyListeners();
      return result;
    } catch (e) {
      _setError('Erro ao processar template: ${e.toString()}');
      return null;
    } finally {
      _setLoading(false);
    }
  }

  /// Validar template
  Future<bool> validateTemplate(String templateId) async {
    if (_authToken == null) {
      _setError('Não autenticado');
      return false;
    }

    _setLoading(true);
    _clearError();

    try {
      final result = await _apiService.validateTemplate(
        templateId: templateId,
        authToken: _authToken,
      );
      
      notifyListeners();
      return result['isValid'] ?? false;
    } catch (e) {
      _setError('Erro ao validar template: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// Obter template por ID
  Future<Map<String, dynamic>?> getTemplate(String templateId) async {
    if (_authToken == null) {
      _setError('Não autenticado');
      return null;
    }

    try {
      return await _apiService.getTemplate(
        templateId: templateId,
        clientId: _clientId,
        authToken: _authToken,
      );
    } catch (e) {
      _setError('Erro ao obter template: ${e.toString()}');
      return null;
    }
  }

  /// Carregar configuração
  Future<void> loadConfig() async {
    if (_authToken == null) {
      _setError('Não autenticado');
      return;
    }

    try {
      _config = await _apiService.getConfig(authToken: _authToken);
      notifyListeners();
    } catch (e) {
      _setError('Erro ao carregar configuração: ${e.toString()}');
    }
  }

  /// Definir estado de carregamento
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  /// Definir erro
  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  /// Limpar erro
  void _clearError() {
    _error = null;
  }

  @override
  void dispose() {
    _apiService.dispose();
    super.dispose();
  }
}
