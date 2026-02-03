import 'package:flutter/foundation.dart';
import '../services/labels_service.dart';

class LabelsProvider with ChangeNotifier {
  final LabelsService _labelsService = LabelsService();
  
  List<Map<String, dynamic>> _etiquetas = [];
  bool _isLoading = false;
  bool _isLoadingMore = false;
  String? _error;
  String? _clientId;
  String? _authToken;
  
  // Paginação
  int _currentPage = 1;
  int _totalPages = 0;
  int _totalItems = 0;
  bool _hasNextPage = false;
  final int _itemsPerPage = 30;

  // Getters
  List<Map<String, dynamic>> get etiquetas => _etiquetas;
  bool get isLoading => _isLoading;
  bool get isLoadingMore => _isLoadingMore;
  String? get error => _error;
  String? get clientId => _clientId;
  int get currentPage => _currentPage;
  int get totalPages => _totalPages;
  int get totalItems => _totalItems;
  bool get hasNextPage => _hasNextPage;

  /// Configurar clientId
  void setClientId(String? clientId) {
    _clientId = clientId;
    notifyListeners();
  }

  void setAuthToken(String? authToken) {
    _authToken = authToken;
    notifyListeners();
  }

  /// Carregar etiquetas com paginação (primeira página)
  Future<void> carregarEtiquetas({
    String? type,
    String? status,
    String? search,
    String? validityDateFrom,
    String? validityDateTo,
    String sortBy = 'createdAt',
    String sortOrder = 'DESC',
  }) async {
    _setLoading(true);
    _clearError();
    _currentPage = 1;

    try {
      print('🔄 LabelsProvider - Carregando etiquetas (página 1)...');
      final result = await _labelsService.buscarEtiquetasPaginadas(
        clientId: _clientId,
        type: type,
        status: status,
        search: search,
        validityDateFrom: validityDateFrom,
        validityDateTo: validityDateTo,
        page: _currentPage,
        limit: _itemsPerPage,
        sortBy: sortBy,
        sortOrder: sortOrder,
        authToken: _authToken,
      );
      
      _etiquetas = (result['data'] as List).cast<Map<String, dynamic>>();
      _atualizarMetadados(result['meta']);
      
      print('✅ LabelsProvider - Etiquetas carregadas: ${_etiquetas.length} de $_totalItems');
    } catch (e) {
      print('❌ LabelsProvider - Erro ao carregar etiquetas: $e');
      _setError('Erro ao carregar etiquetas: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Carregar próxima página (infinite scroll)
  Future<void> carregarProximaPagina({
    String? type,
    String? status,
    String? search,
    String? validityDateFrom,
    String? validityDateTo,
    String sortBy = 'createdAt',
    String sortOrder = 'DESC',
  }) async {
    if (_isLoadingMore || !_hasNextPage) return;

    _isLoadingMore = true;
    notifyListeners();

    try {
      final nextPage = _currentPage + 1;
      print('🔄 LabelsProvider - Carregando página $nextPage...');
      
      final result = await _labelsService.buscarEtiquetasPaginadas(
        clientId: _clientId,
        type: type,
        status: status,
        search: search,
        validityDateFrom: validityDateFrom,
        validityDateTo: validityDateTo,
        page: nextPage,
        limit: _itemsPerPage,
        sortBy: sortBy,
        sortOrder: sortOrder,
        authToken: _authToken,
      );
      
      final novosItens = (result['data'] as List).cast<Map<String, dynamic>>();
      _etiquetas.addAll(novosItens);
      _currentPage = nextPage;
      _atualizarMetadados(result['meta']);
      
      print('✅ LabelsProvider - Página $nextPage carregada: +${novosItens.length} itens (total: ${_etiquetas.length})');
    } catch (e) {
      print('❌ LabelsProvider - Erro ao carregar próxima página: $e');
    } finally {
      _isLoadingMore = false;
      notifyListeners();
    }
  }

  void _atualizarMetadados(Map<String, dynamic>? meta) {
    if (meta != null) {
      _totalPages = meta['totalPages'] ?? 0;
      _totalItems = meta['total'] ?? 0;
      _hasNextPage = meta['hasNextPage'] ?? false;
    }
  }

  /// Carregar etiquetas pendentes
  Future<void> carregarEtiquetasPendentes() async {
    _setLoading(true);
    _clearError();

    try {
      print('🔄 LabelsProvider - Carregando etiquetas pendentes...');
      final etiquetas = await _labelsService.buscarEtiquetasPendentes(
        clientId: _clientId,
        authToken: _authToken,
      );
      
      _etiquetas = etiquetas;
      print('✅ LabelsProvider - Etiquetas pendentes carregadas: ${etiquetas.length}');
    } catch (e) {
      print('❌ LabelsProvider - Erro ao carregar etiquetas pendentes: $e');
      _setError('Erro ao carregar etiquetas pendentes: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Buscar etiqueta por código
  Future<Map<String, dynamic>?> buscarEtiquetaPorCodigo(String code) async {
    try {
      print('🔍 LabelsProvider - Buscando etiqueta por código: $code');
      final etiqueta = await _labelsService.buscarEtiquetaPorCodigo(code);
      
      if (etiqueta != null) {
        print('✅ LabelsProvider - Etiqueta encontrada: $code');
        return etiqueta;
      } else {
        print('❌ LabelsProvider - Etiqueta não encontrada: $code');
        return null;
      }
    } catch (e) {
      print('❌ LabelsProvider - Erro ao buscar etiqueta: $e');
      _setError('Erro ao buscar etiqueta: $e');
      return null;
    }
  }

  /// Marcar etiquetas como impressas
  Future<bool> marcarComoImpressas(List<String> ids) async {
    try {
      print('🔄 LabelsProvider - Marcando etiquetas como impressas...');
      final sucesso = await _labelsService.marcarComoImpressas(ids, authToken: _authToken);
      
      if (sucesso) {
        print('✅ LabelsProvider - Etiquetas marcadas como impressas');
        // Recarregar a lista
        await carregarEtiquetas();
        return true;
      } else {
        print('❌ LabelsProvider - Falha ao marcar etiquetas como impressas');
        return false;
      }
    } catch (e) {
      print('❌ LabelsProvider - Erro ao marcar etiquetas: $e');
      _setError('Erro ao marcar etiquetas: $e');
      return false;
    }
  }

  /// Aplicar baixa em lote
  Future<bool> aplicarBaixaEmLote(List<String> ids) async {
    try {
      print('🔄 LabelsProvider - Aplicando baixa em lote...');
      final sucesso = await _labelsService.aplicarBaixaEmLote(ids, authToken: _authToken);
      
      if (sucesso) {
        print('✅ LabelsProvider - Baixa em lote aplicada');
        // Atualizar metadata localmente para feedback imediato
        for (final id in ids) {
          final index = _etiquetas.indexWhere((e) => e['id'] == id);
          if (index != -1) {
            _etiquetas[index]['metadata'] = {
              ..._etiquetas[index]['metadata'] ?? {},
              'isUsed': true,
              'usedAt': DateTime.now().toIso8601String(),
            };
          }
        }
        notifyListeners();
        return true;
      } else {
        print('❌ LabelsProvider - Falha ao aplicar baixa em lote');
        _setError('Falha ao aplicar baixa em lote');
        return false;
      }
    } catch (e) {
      print('❌ LabelsProvider - Erro ao aplicar baixa em lote: $e');
      _setError('Erro ao aplicar baixa em lote: $e');
      return false;
    }
  }

  /// Atualizar status da etiqueta
  Future<bool> atualizarStatus(String id, String status) async {
    try {
      print('🔄 LabelsProvider - Atualizando status da etiqueta...');
      final sucesso = await _labelsService.atualizarStatus(id, status, authToken: _authToken);
      
      if (sucesso) {
        print('✅ LabelsProvider - Status da etiqueta atualizado');
        // Recarregar a lista
        await carregarEtiquetas();
        return true;
      } else {
        print('❌ LabelsProvider - Falha ao atualizar status');
        return false;
      }
    } catch (e) {
      print('❌ LabelsProvider - Erro ao atualizar status: $e');
      _setError('Erro ao atualizar status: $e');
      return false;
    }
  }

  /// Filtrar etiquetas por status
  List<Map<String, dynamic>> filtrarPorStatus(String status) {
    return _etiquetas.where((etiqueta) => etiqueta['status'] == status).toList();
  }

  /// Filtrar etiquetas por tipo
  List<Map<String, dynamic>> filtrarPorTipo(String type) {
    return _etiquetas.where((etiqueta) => etiqueta['type'] == type).toList();
  }

  /// Buscar etiquetas por texto
  List<Map<String, dynamic>> buscarPorTexto(String texto) {
    if (texto.isEmpty) return _etiquetas;
    
    final textoLower = texto.toLowerCase();
    return _etiquetas.where((etiqueta) {
      final code = etiqueta['code']?.toString().toLowerCase() ?? '';
      final productName = etiqueta['product']?['name']?.toString().toLowerCase() ?? '';
      final productCode = etiqueta['product']?['code']?.toString().toLowerCase() ?? '';
      
      return code.contains(textoLower) || 
             productName.contains(textoLower) || 
             productCode.contains(textoLower);
    }).toList();
  }

  /// Ordenar etiquetas
  List<Map<String, dynamic>> ordenarEtiquetas(String sortBy) {
    final etiquetas = List<Map<String, dynamic>>.from(_etiquetas);
    
    switch (sortBy) {
      case 'recentes':
        etiquetas.sort((a, b) {
          final dateA = DateTime.tryParse(a['createdAt'] ?? '') ?? DateTime(1970);
          final dateB = DateTime.tryParse(b['createdAt'] ?? '') ?? DateTime(1970);
          return dateB.compareTo(dateA);
        });
        break;
      case 'antigas':
        etiquetas.sort((a, b) {
          final dateA = DateTime.tryParse(a['createdAt'] ?? '') ?? DateTime(1970);
          final dateB = DateTime.tryParse(b['createdAt'] ?? '') ?? DateTime(1970);
          return dateA.compareTo(dateB);
        });
        break;
      case 'codigo':
        etiquetas.sort((a, b) {
          final codeA = a['code']?.toString() ?? '';
          final codeB = b['code']?.toString() ?? '';
          return codeA.compareTo(codeB);
        });
        break;
      case 'produto':
        etiquetas.sort((a, b) {
          final nameA = a['product']?['name']?.toString() ?? '';
          final nameB = b['product']?['name']?.toString() ?? '';
          return nameA.compareTo(nameB);
        });
        break;
    }
    
    return etiquetas;
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

  /// Reset ao trocar de cliente
  void resetAll() {
    _etiquetas.clear();
    _clientId = null;
    _authToken = null;
    _error = null;
    _isLoading = false;
    _isLoadingMore = false;
    _currentPage = 1;
    _totalPages = 0;
    _totalItems = 0;
    _hasNextPage = false;
    notifyListeners();
  }
}
