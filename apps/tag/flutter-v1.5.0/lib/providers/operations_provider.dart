import 'package:flutter/foundation.dart';
import '../models/operation_models.dart';
import '../services/operations_service.dart';

class OperationsProvider extends ChangeNotifier {
  final OperationsService _operationsService = OperationsService();

  List<Operation> _operations = [];
  bool _isLoading = false;
  String? _error;
  Operation? _selectedOperation; // ⭐ NOVO: Operação selecionada

  List<Operation> get operations => _operations;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Operation? get selectedOperation => _selectedOperation; // ⭐ NOVO
  
  /// Operações ativas
  List<Operation> get activeOperations => _operations.where((op) => op.isActive).toList();

  /// Buscar todas as operações
  Future<void> loadOperations({String? token, String? clientId}) async {
    _setLoading(true);
    _clearError();
    try {
      final allOperations = await _operationsService.getOperationsByClient(token: token);
      // Filtrar operações pelo clientId se fornecido
      if (clientId != null) {
        _operations = allOperations.where((op) => op.clientId == clientId).toList();
        print('✅ OperationsProvider - Operações filtradas por clientId $clientId: ${_operations.length}');
      } else {
        _operations = allOperations;
        print('✅ OperationsProvider - Operações carregadas: ${_operations.length}');
      }
      notifyListeners();
    } catch (e) {
      print('❌ OperationsProvider - Erro ao carregar operações: $e');
      _handleError(e);
    } finally {
      _setLoading(false);
    }
  }

  /// Criar nova operação
  Future<Operation?> createOperation(CreateOperationRequest request, {String? token}) async {
    _setLoading(true);
    _clearError();
    try {
      final newOperation = await _operationsService.createOperation(request, token: token);
      _operations.add(newOperation);
      notifyListeners();
      return newOperation;
    } catch (e) {
      _setError('Erro ao criar operação: ${e.toString()}');
      return null;
    } finally {
      _setLoading(false);
    }
  }

  /// Atualizar operação
  Future<Operation?> updateOperation(String id, UpdateOperationRequest request, {String? token}) async {
    _setLoading(true);
    _clearError();
    try {
      final updatedOperation = await _operationsService.updateOperation(id, request, token: token);
      final index = _operations.indexWhere((op) => op.id == id);
      if (index != -1) {
        _operations[index] = updatedOperation;
        notifyListeners();
      }
      return updatedOperation;
    } catch (e) {
      _setError('Erro ao atualizar operação: ${e.toString()}');
      return null;
    } finally {
      _setLoading(false);
    }
  }

  /// Deletar operação
  Future<bool> deleteOperation(String id, {String? token}) async {
    _setLoading(true);
    _clearError();
    try {
      await _operationsService.deleteOperation(id, token: token);
      _operations.removeWhere((op) => op.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Erro ao deletar operação: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // ⭐ NOVO: Selecionar operação
  void selectOperation(Operation? operation) {
    _selectedOperation = operation;
    notifyListeners();
    print('✅ OperationsProvider - Operação selecionada: ${operation?.name ?? "Nenhuma"}');
  }

  /// Limpar dados
  void clear() {
    _operations.clear();
    _selectedOperation = null; // ⭐ NOVO: Limpar seleção
    _clearError();
    notifyListeners();
  }

  /// Reset ao trocar de cliente
  void resetAll() {
    clear();
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void _setError(String? message) {
    _error = message;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
  }

  void _handleError(dynamic error) {
    _error = error.toString();
    notifyListeners();
  }
}


