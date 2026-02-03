import 'package:flutter/material.dart';
import '../services/v1_5_print_service.dart';
import '../services/granobox_api_service.dart';

/// Provider para impressão via API v1.5
/// 
/// Gerencia a impressão de etiquetas usando o novo endpoint simplificado
class V15PrintProvider with ChangeNotifier {
  final String baseUrl;
  final String authToken;
  
  late V15PrintService _service;
  
  bool _isLoading = false;
  String? _lastError;
  V15PrintResult? _lastResult;

  V15PrintProvider({
    required this.baseUrl,
    required this.authToken,
  }) {
    _service = V15PrintService(
      baseUrl: baseUrl,
      authToken: authToken,
    );
  }

  bool get isLoading => _isLoading;
  String? get lastError => _lastError;
  V15PrintResult? get lastResult => _lastResult;

  /// Imprime etiqueta de validade (rastreável)
  /// 
  /// Exemplo:
  /// ```dart
  /// await v15Provider.printValidityLabel(
  ///   printerId: 'edge-go-d7e2b4',
  ///   templateId: '1c12926f-849b-4bd7-8a61-05036f39f443',
  ///   copies: 5,
  ///   labelData: {
  ///     'produto': 'Manteiga',
  ///     'dataManipulacao': '30/11/2025',
  ///     'dataValidade': '30/12/2025',
  ///     'qtdPeso': '500G',
  ///     'responsavel': 'Tiago L',
  ///     'armazenamento': 'Geladeira 1',
  ///   },
  ///   productId: 'uuid-produto',
  ///   validityDate: '2025-12-30',
  ///   conservationType: 'refrigerado',
  /// );
  /// ```
  Future<V15PrintResult> printValidityLabel({
    required String printerId,
    required String templateId,
    required int copies,
    required Map<String, dynamic> labelData,
    required String productId,
    required String validityDate,
    String? operationId,
    String? storageLocationId,
    String? conservationType,
    String? productionDate,
    Map<String, int>? offsets,
  }) async {
    _isLoading = true;
    _lastError = null;
    notifyListeners();

    try {
      final result = await _service.printValidityLabel(
        printerId: printerId,
        templateId: templateId,
        copies: copies,
        labelData: labelData,
        productId: productId,
        validityDate: validityDate,
        operationId: operationId,
        storageLocationId: storageLocationId,
        conservationType: conservationType,
        productionDate: productionDate,
        offsets: offsets,
      );

      _lastResult = result;
      
      if (!result.success) {
        _lastError = result.message;
      }

      return result;
    } catch (e) {
      _lastError = 'Erro ao imprimir: $e';
      return V15PrintResult(
        success: false,
        message: _lastError!,
        error: {'exception': e.toString()},
      );
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Imprime rótulo genérico (não rastreável)
  /// 
  /// Exemplo:
  /// ```dart
  /// await v15Provider.printGenericLabel(
  ///   printerId: 'edge-go-d7e2b4',
  ///   templateId: 'template-preco',
  ///   copies: 10,
  ///   labelData: {
  ///     'produto': 'Manteiga',
  ///     'preco': 'R\$ 15,00',
  ///   },
  /// );
  /// ```
  Future<V15PrintResult> printGenericLabel({
    required String printerId,
    required String templateId,
    required int copies,
    required Map<String, dynamic> labelData,
    Map<String, int>? offsets,
  }) async {
    _isLoading = true;
    _lastError = null;
    notifyListeners();

    try {
      final result = await _service.printGenericLabel(
        printerId: printerId,
        templateId: templateId,
        copies: copies,
        labelData: labelData,
        offsets: offsets,
      );

      _lastResult = result;
      
      if (!result.success) {
        _lastError = result.message;
      }

      return result;
    } catch (e) {
      _lastError = 'Erro ao imprimir: $e';
      return V15PrintResult(
        success: false,
        message: _lastError!,
        error: {'exception': e.toString()},
      );
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Limpa o último erro
  void clearError() {
    _lastError = null;
    notifyListeners();
  }
}


