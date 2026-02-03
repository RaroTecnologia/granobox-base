import 'package:flutter/foundation.dart';
import '../models/print_api_models.dart';
import '../services/template_api_service.dart';

/// Provider para gerenciamento do estado do Tagment
class TemplateProvider extends ChangeNotifier {
  TemplateApiService? _service;
  ApiKeyInfo? _apiKeyInfo;
  bool _isLoading = false;
  String? _error;
  int? _remainingRequests;

  // Getters
  TemplateApiService? get service => _service;
  ApiKeyInfo? get apiKeyInfo => _apiKeyInfo;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int? get remainingRequests => _remainingRequests;
  bool get isInitialized => _service != null;

  /// Inicializa o serviço Tagment
  Future<bool> initialize({
    required String apiKey,
    String baseUrl = 'https://api.tagment.com.br',
    int timeout = 10000,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      _service = TemplateApiService(
        config: PrintApiConfig(
          apiKey: apiKey,
          baseUrl: baseUrl,
          timeout: timeout,
        ),
      );

      // Testa a conexão
      final connectionResult = await _service!.testConnection();
      if (!connectionResult.success) {
        _setError(connectionResult.error ?? 'Falha na conexão com a API');
        return false;
      }

      // Obtém informações da API Key
      await _loadApiKeyInfo();

      notifyListeners();
      return true;
    } catch (e) {
      _setError('Erro ao inicializar Tagment: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// Carrega informações da API Key
  Future<void> _loadApiKeyInfo() async {
    if (_service == null) return;

    try {
      final result = await _service!.getAPIKeyInfo();
      if (result.success && result.data != null) {
        _apiKeyInfo = result.data;
        _remainingRequests = result.remainingRequests;
      } else {
        _setError(result.error ?? 'Erro ao carregar informações da API Key');
      }
    } catch (e) {
      _setError('Erro ao carregar informações da API Key: ${e.toString()}');
    }
  }

  /// Processa um template
  Future<PrintApiResult<String>> processTemplate(
    String templateJson,
    Map<String, dynamic> data,
  ) async {
    if (_service == null) {
      return PrintApiResult<String>(
        success: false,
        error: 'Serviço Tagment não inicializado',
      );
    }

    _setLoading(true);
    _clearError();

    try {
      final result = await _service!.processTemplate(templateJson, data);
      
      if (result.success) {
        _remainingRequests = result.remainingRequests;
        notifyListeners();
      } else {
        _setError(result.error ?? 'Erro ao processar template');
      }

      return result;
    } catch (e) {
      final error = 'Erro ao processar template: ${e.toString()}';
      _setError(error);
      return PrintApiResult<String>(success: false, error: error);
    } finally {
      _setLoading(false);
    }
  }

  /// Valida um template
  Future<PrintApiResult<bool>> validateTemplate(String templateJson) async {
    if (_service == null) {
      return PrintApiResult<bool>(
        success: false,
        error: 'Serviço Tagment não inicializado',
      );
    }

    _setLoading(true);
    _clearError();

    try {
      final result = await _service!.validateTemplate(templateJson);
      
      if (result.success) {
        _remainingRequests = result.remainingRequests;
        notifyListeners();
      } else {
        _setError(result.error ?? 'Erro ao validar template');
      }

      return result;
    } catch (e) {
      final error = 'Erro ao validar template: ${e.toString()}';
      _setError(error);
      return PrintApiResult<bool>(success: false, error: error);
    } finally {
      _setLoading(false);
    }
  }

  /// Compila um template
  Future<PrintApiResult<String>> compileTemplate(TagmentTemplate template) async {
    if (_service == null) {
      return PrintApiResult<String>(
        success: false,
        error: 'Serviço Tagment não inicializado',
      );
    }

    _setLoading(true);
    _clearError();

    try {
      final result = await _service!.compileTemplate(template);
      
      if (result.success) {
        _remainingRequests = result.remainingRequests;
        notifyListeners();
      } else {
        _setError(result.error ?? 'Erro ao compilar template');
      }

      return result;
    } catch (e) {
      final error = 'Erro ao compilar template: ${e.toString()}';
      _setError(error);
      return PrintApiResult<String>(success: false, error: error);
    } finally {
      _setLoading(false);
    }
  }

  /// Atualiza informações da API Key
  Future<void> refreshApiKeyInfo() async {
    await _loadApiKeyInfo();
    notifyListeners();
  }

  /// Limpa o estado
  void clear() {
    _service?.dispose();
    _service = null;
    _apiKeyInfo = null;
    _remainingRequests = null;
    _clearError();
    _setLoading(false);
    notifyListeners();
  }

  /// Define estado de carregamento
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  /// Define erro
  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  /// Limpa erro
  void _clearError() {
    _error = null;
  }

  @override
  void dispose() {
    _service?.dispose();
    super.dispose();
  }
}



