import 'package:flutter/foundation.dart';
import '../models/operator_models.dart';
import '../services/operators_service.dart';
import 'auth_provider.dart';

/// Provider para gerenciar operadores com cache
class OperatorsProvider with ChangeNotifier {
  final OperatorsService _operatorsService = OperatorsService();
  final AuthProvider _authProvider;

  OperatorsProvider(this._authProvider);

  // Estado
  List<Operator> _operators = [];
  bool _isLoading = false;
  String? _error;
  DateTime? _lastUpdated;
  bool _hasValidCache = false;

  // Getters
  List<Operator> get operators => _operators;
  bool get isLoading => _isLoading;
  String? get error => _error;
  DateTime? get lastUpdated => _lastUpdated;
  bool get hasValidCache => _hasValidCache;

  /// Operadores ativos
  List<Operator> get activeOperators => _operators.where((op) => op.isActive).toList();

  /// Operadores com PIN configurado
  List<Operator> get operatorsWithPin => _operators.where((op) => op.hasPin).toList();

  /// Carregar operadores (com cache)
  Future<void> loadOperators({bool forceRefresh = false}) async {
    if (_authProvider.user == null) {
      _setError('Usuário não autenticado');
      return;
    }

    _setLoading(true);
    _clearError();

    try {
      final clientId = _authProvider.user!.clientId;
      final token = await _authProvider.authToken;

      if (token == null) {
        _setError('Token de autenticação não disponível');
        return;
      }

      print('🔄 Carregando operadores... (forceRefresh: $forceRefresh)');
      
      // Carregar operadores
      final operators = await _operatorsService.getOperators(
        clientId: clientId,
        authToken: token,
        forceRefresh: forceRefresh,
      );

      _operators = operators;
      _lastUpdated = DateTime.now();
      _hasValidCache = await _operatorsService.hasValidCache(clientId);

      print('✅ Operadores carregados: ${operators.length}');

    } catch (e) {
      _setError('Erro ao carregar operadores: $e');
      print('❌ Erro ao carregar operadores: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Refresh manual dos operadores
  Future<void> refreshOperators() async {
    print('🔄 Refresh manual dos operadores...');
    await loadOperators(forceRefresh: true);
  }

  /// Limpar cache e recarregar
  Future<void> clearCacheAndReload() async {
    print('🗑️ Limpando cache e recarregando operadores...');
    await _operatorsService.clearCache();
    await loadOperators(forceRefresh: true);
  }

  /// Reset ao trocar de cliente
  Future<void> resetAll() async {
    _operators.clear();
    _lastUpdated = null;
    _hasValidCache = false;
    _error = null;
    notifyListeners();
    try {
      await _operatorsService.clearCache();
    } catch (_) {}
  }

  /// Obter informações do cache
  Future<Map<String, dynamic>?> getCacheInfo() async {
    if (_authProvider.user == null) return null;
    
    return await _operatorsService.getCacheInfo(_authProvider.user!.clientId);
  }

  /// Criar operador
  Future<Operator?> createOperator(CreateOperatorRequest request) async {
    if (_authProvider.user == null) {
      _setError('Usuário não autenticado');
      return null;
    }

    try {
      final clientId = _authProvider.user!.clientId;
      final token = await _authProvider.authToken;

      if (token == null) {
        _setError('Token de autenticação não disponível');
        return null;
      }

      print('➕ Criando operador: ${request.name}');
      
      final operator = await _operatorsService.createOperator(
        clientId: clientId,
        authToken: token,
        request: request,
      );

      // Adicionar à lista local
      _operators.add(operator);
      notifyListeners();

      print('✅ Operador criado: ${operator.name}');
      return operator;

    } catch (e) {
      _setError('Erro ao criar operador: $e');
      print('❌ Erro ao criar operador: $e');
      return null;
    }
  }

  /// Atualizar operador
  Future<Operator?> updateOperator(String operatorId, UpdateOperatorRequest request) async {
    try {
      final token = await _authProvider.authToken;

      if (token == null) {
        _setError('Token de autenticação não disponível');
        return null;
      }

      print('✏️ Atualizando operador: $operatorId');
      
      final operator = await _operatorsService.updateOperator(
        operatorId: operatorId,
        authToken: token,
        request: request,
      );

      // Atualizar na lista local
      final index = _operators.indexWhere((op) => op.id == operatorId);
      if (index != -1) {
        _operators[index] = operator;
        notifyListeners();
      }

      print('✅ Operador atualizado: ${operator.name}');
      return operator;

    } catch (e) {
      _setError('Erro ao atualizar operador: $e');
      print('❌ Erro ao atualizar operador: $e');
      return null;
    }
  }

  /// Deletar operador
  Future<bool> deleteOperator(String operatorId) async {
    try {
      final token = await _authProvider.authToken;

      if (token == null) {
        _setError('Token de autenticação não disponível');
        return false;
      }

      print('🗑️ Deletando operador: $operatorId');
      
      await _operatorsService.deleteOperator(
        operatorId: operatorId,
        authToken: token,
      );

      // Remover da lista local
      _operators.removeWhere((op) => op.id == operatorId);
      notifyListeners();

      print('✅ Operador deletado: $operatorId');
      return true;

    } catch (e) {
      _setError('Erro ao deletar operador: $e');
      print('❌ Erro ao deletar operador: $e');
      return false;
    }
  }

  /// Validar PIN do operador
  Future<bool> validatePin(String operatorId, String pin) async {
    try {
      final token = await _authProvider.authToken;

      if (token == null) {
        _setError('Token de autenticação não disponível');
        return false;
      }

      print('🔐 Validando PIN para operador: $operatorId');
      
      final isValid = await _operatorsService.validatePin(
        operatorId: operatorId,
        pin: pin,
        authToken: token,
      );

      print('${isValid ? '✅' : '❌'} PIN ${isValid ? 'válido' : 'inválido'}');
      return isValid;

    } catch (e) {
      _setError('Erro ao validar PIN: $e');
      print('❌ Erro ao validar PIN: $e');
      return false;
    }
  }

  /// Buscar operador por ID
  Operator? getOperatorById(String id) {
    try {
      return _operators.firstWhere((op) => op.id == id);
    } catch (e) {
      return null;
    }
  }

  /// Buscar operador por nome
  Operator? getOperatorByName(String name) {
    try {
      return _operators.firstWhere((op) => op.name == name);
    } catch (e) {
      return null;
    }
  }

  /// Verificar se há operadores carregados
  bool get hasOperators => _operators.isNotEmpty;

  /// Verificar se está carregando
  bool get hasError => _error != null;

  /// Limpar erro
  void clearError() {
    _clearError();
  }

  // Métodos privados
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    super.dispose();
  }
}


