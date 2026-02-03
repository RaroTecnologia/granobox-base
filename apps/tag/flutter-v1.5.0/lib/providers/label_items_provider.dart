import 'package:flutter/foundation.dart';
import 'dart:developer' as developer;
import '../models/label_item_models.dart';
import '../services/label_items_service.dart';

class LabelItemsProvider with ChangeNotifier {
  final LabelItemsService _service = LabelItemsService();

  List<LabelItem> _items = [];
  LabelItem? _currentItem;
  bool _isLoading = false;
  String? _error;

  // Getters
  List<LabelItem> get items => _items;
  LabelItem? get currentItem => _currentItem;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasItems => _items.isNotEmpty;

  /// Carregar itens de rótulo
  Future<void> carregarItens({
    required String clientId,
    String? authToken,
    String? labelTemplateId,
    bool includeInactive = false,
    String? search,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      developer.log('🔄 Carregando itens de rótulo...', name: 'LabelItemsProvider');

      _items = await _service.listarItens(
        clientId: clientId,
        authToken: authToken,
        labelTemplateId: labelTemplateId,
        includeInactive: includeInactive,
        search: search,
      );

      developer.log('✅ ${_items.length} itens carregados', name: 'LabelItemsProvider');
      notifyListeners();
    } catch (e) {
      developer.log('❌ Erro ao carregar itens: $e', name: 'LabelItemsProvider');
      _setError('Erro ao carregar itens: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Buscar item por ID
  Future<LabelItem?> buscarItem({
    required String id,
    required String clientId,
    String? authToken,
  }) async {
    try {
      developer.log('🔍 Buscando item $id...', name: 'LabelItemsProvider');

      final item = await _service.buscarItem(
        id: id,
        clientId: clientId,
        authToken: authToken,
      );

      _currentItem = item;
      notifyListeners();

      return item;
    } catch (e) {
      developer.log('❌ Erro ao buscar item: $e', name: 'LabelItemsProvider');
      _setError('Erro ao buscar item: $e');
      return null;
    }
  }

  /// Criar novo item
  Future<LabelItem?> criarItem({
    required CreateLabelItemDto dto,
    String? authToken,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      developer.log('➕ Criando novo item...', name: 'LabelItemsProvider');

      final item = await _service.criarItem(
        dto: dto,
        authToken: authToken,
      );

      _items.insert(0, item); // Adicionar no início
      _currentItem = item;

      developer.log('✅ Item criado com sucesso', name: 'LabelItemsProvider');
      notifyListeners();

      return item;
    } catch (e) {
      developer.log('❌ Erro ao criar item: $e', name: 'LabelItemsProvider');
      _setError('Erro ao criar item: $e');
      return null;
    } finally {
      _setLoading(false);
    }
  }

  /// Atualizar item
  Future<bool> atualizarItem({
    required String id,
    required String clientId,
    required UpdateLabelItemDto dto,
    String? authToken,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      developer.log('📝 Atualizando item $id...', name: 'LabelItemsProvider');

      final updatedItem = await _service.atualizarItem(
        id: id,
        clientId: clientId,
        dto: dto,
        authToken: authToken,
      );

      // Atualizar na lista
      final index = _items.indexWhere((item) => item.id == id);
      if (index != -1) {
        _items[index] = updatedItem;
      }

      if (_currentItem?.id == id) {
        _currentItem = updatedItem;
      }

      developer.log('✅ Item atualizado com sucesso', name: 'LabelItemsProvider');
      notifyListeners();

      return true;
    } catch (e) {
      developer.log('❌ Erro ao atualizar item: $e', name: 'LabelItemsProvider');
      _setError('Erro ao atualizar item: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// Deletar item
  Future<bool> deletarItem({
    required String id,
    required String clientId,
    String? authToken,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      developer.log('🗑️ Deletando item $id...', name: 'LabelItemsProvider');

      await _service.deletarItem(
        id: id,
        clientId: clientId,
        authToken: authToken,
      );

      // Remover da lista
      _items.removeWhere((item) => item.id == id);

      if (_currentItem?.id == id) {
        _currentItem = null;
      }

      developer.log('✅ Item deletado com sucesso', name: 'LabelItemsProvider');
      notifyListeners();

      return true;
    } catch (e) {
      developer.log('❌ Erro ao deletar item: $e', name: 'LabelItemsProvider');
      _setError('Erro ao deletar item: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// Selecionar item atual
  void selecionarItem(LabelItem? item) {
    _currentItem = item;
    notifyListeners();
  }

  /// Filtrar itens localmente
  List<LabelItem> filtrarItens({String? search, String? labelTemplateId}) {
    var filtered = _items;

    if (labelTemplateId != null && labelTemplateId.isNotEmpty) {
      filtered = filtered.where((item) => item.labelTemplateId == labelTemplateId).toList();
    }

    if (search != null && search.isNotEmpty) {
      final searchLower = search.toLowerCase();
      filtered = filtered.where((item) {
        return item.name.toLowerCase().contains(searchLower) ||
            (item.code?.toLowerCase().contains(searchLower) ?? false);
      }).toList();
    }

    return filtered;
  }

  /// Limpar lista
  void limpar() {
    _items = [];
    _currentItem = null;
    _error = null;
    notifyListeners();
  }

  // Helpers privados
  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void _setError(String message) {
    _error = message;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
  }
}

