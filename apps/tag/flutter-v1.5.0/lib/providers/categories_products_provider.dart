import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/category_models.dart' as category_models;
import '../models/product_models.dart';
import '../services/categories_service.dart';
import '../services/products_service.dart';
import '../services/connectivity_service.dart';
import '../services/smart_cache_service.dart';

/// Provider para gerenciamento do estado de categorias e produtos
class CategoriesProductsProvider extends ChangeNotifier {
  final CategoriesService _categoriesService = CategoriesService();
  final ProductsService _productsService = ProductsService();
  final ConnectivityService _connectivityService = ConnectivityService();

  // Cache keys
  static const String _categoriesCacheKey = 'categories_cache';
  static const String _productsCacheKey = 'products_cache';
  static const Duration _cacheTTL = Duration(hours: 1); // Cache por 1 hora

  List<category_models.Category> _categories = [];
  List<Product> _products = [];
  bool _isLoading = false;
  bool _hasLoadedInitially = false;
  String? _error;

  List<category_models.Category> get categories => _categories;
  List<Product> get products => _products;
  bool get isLoading => _isLoading;
  bool get hasLoadedInitially => _hasLoadedInitially;
  String? get error => _error;
  

  /// Buscar todas as categorias
  Future<void> loadCategories({String? token}) async {
    print('🔄 loadCategories chamado');
    _setLoading(true);
    _clearError();
    try {
      _categories = await _categoriesService.getCategoriesByClient(token: token);
      print('✅ Categorias carregadas: ${_categories.length}');
      notifyListeners();
    } catch (e) {
      print('❌ Erro ao carregar categorias: $e');
      _handleError(e);
    } finally {
      _setLoading(false);
    }
  }

  /// Buscar todos os produtos
  Future<void> loadProducts({String? token}) async {
    _setLoading(true);
    _clearError();
    try {
      _products = await _productsService.getProductsByClient(token: token);
      notifyListeners();
    } catch (e) {
      _handleError(e);
    } finally {
      _setLoading(false);
    }
  }

  /// Buscar categorias e produtos com cache inteligente
  Future<void> loadAll({String? token, String? clientId, bool forceRefresh = false}) async {
    print('🔄 Carregando categorias e produtos... (forceRefresh: $forceRefresh)');
    
    // Tentar carregar do cache primeiro (se não for refresh forçado)
    if (!forceRefresh && clientId != null) {
      final cachedCategories = await SmartCacheService.loadData<List<dynamic>>(
        key: 'categories_$clientId',
        type: 'categories',
      );
      final cachedProducts = await SmartCacheService.loadData<List<dynamic>>(
        key: 'products_$clientId',
        type: 'products',
      );
      
      if (cachedCategories != null && cachedProducts != null) {
        print('📦 Dados carregados do cache inteligente (clientId: $clientId)');
        _categories = cachedCategories
            .map((json) => category_models.Category.fromJson(json))
            .toList();
        _products = cachedProducts
            .map((json) => Product.fromJson(json))
            .toList();
        _hasLoadedInitially = true;
        notifyListeners();
        return;
      }
    }
    
    // Se não há cache válido ou é refresh forçado, carregar da API
    _setLoading(true);
    _clearError();
    try {
      print('🌐 Carregando dados da API...');
      final categories = await _categoriesService.getCategoriesByClient(token: token);
      final products = await _productsService.getProductsByClient(token: token);
      
      _categories = categories;
      _products = products;
      
      // Salvar no cache inteligente com clientId
      if (clientId != null) {
        await SmartCacheService.saveData(
          key: 'categories_$clientId',
          data: categories.map((cat) => cat.toJson()).toList(),
          type: 'categories',
          metadata: {'count': categories.length, 'clientId': clientId},
        );
        
        await SmartCacheService.saveData(
          key: 'products_$clientId',
          data: products.map((prod) => prod.toJson()).toList(),
          type: 'products',
          metadata: {'count': products.length, 'clientId': clientId},
        );
      }
      
      print('✅ Categorias carregadas: ${_categories.length}');
      print('✅ Produtos carregados: ${_products.length}');
      _hasLoadedInitially = true;
      notifyListeners();
    } catch (e) {
      print('❌ Erro ao carregar dados: $e');
      _handleError(e);
    } finally {
      _setLoading(false);
    }
  }

  /// Obter categorias raiz (sem parentId)
  List<category_models.Category> get rootCategories {
    return _categories.where((cat) => cat.parentId == null).toList();
  }

  /// Obter subcategorias de uma categoria
  List<category_models.Category> getSubcategories(String parentId) {
    return _categories.where((cat) => cat.parentId == parentId).toList();
  }

  /// Obter categorias organizadas hierarquicamente para dropdown
  List<category_models.Category> get categoriesForDropdown {
    return _buildHierarchicalCategories(_categories);
  }

  /// Construir lista hierárquica de categorias com identação
  List<category_models.Category> _buildHierarchicalCategories(List<category_models.Category> allCategories) {
    final List<category_models.Category> result = [];
    
    // Primeiro, adicionar todas as categorias raiz (sem parentId)
    final rootCategories = allCategories.where((cat) => cat.parentId == null).toList();
    
    for (final rootCategory in rootCategories) {
      result.add(rootCategory);
      
      // Adicionar subcategorias recursivamente
      _addSubcategoriesRecursively(result, allCategories, rootCategory.id, 1);
    }
    
    return result;
  }

  /// Adicionar subcategorias recursivamente com nível de profundidade
  void _addSubcategoriesRecursively(
    List<category_models.Category> result,
    List<category_models.Category> allCategories,
    String parentId,
    int level,
  ) {
    final subcategories = allCategories.where((cat) => cat.parentId == parentId).toList();
    
    for (final subcategory in subcategories) {
      result.add(subcategory);
      
      // Adicionar subcategorias desta subcategoria
      _addSubcategoriesRecursively(result, allCategories, subcategory.id, level + 1);
    }
  }

  /// Obter produtos de uma categoria
  List<Product> getProductsByCategory(String categoryId) {
    return _products
        .where((product) => product.categoryId == categoryId && product.isActive)
        .toList();
  }
  
  /// Obter produtos ativos (usado para listagens)
  List<Product> get activeProducts => _products.where((product) => product.isActive).toList();
  
  /// Obter todos os produtos (incluindo inativos, para administração)
  List<Product> get allProducts => _products;

  /// Obter produtos de um tipo específico
  List<Product> getProductsByType(String type) {
    return _products.where((product) => product.type == type).toList();
  }

  /// Obter categoria por ID
  category_models.Category? getCategoryById(String id) {
    try {
      return _categories.firstWhere((cat) => cat.id == id);
    } catch (e) {
      return null;
    }
  }

  /// Obter produto por ID
  Product? getProductById(String id) {
    try {
      return _products.firstWhere((product) => product.id == id);
    } catch (e) {
      return null;
    }
  }

  /// Criar nova categoria
  Future<category_models.Category?> createCategory(category_models.CreateCategoryRequest request, {String? token}) async {
    _setLoading(true);
    _clearError();
    try {
      final newCategory = await _categoriesService.createCategory(request, token: token);
      _categories.add(newCategory);
      notifyListeners();
      return newCategory;
    } catch (e) {
      _setError('Erro ao criar categoria: ${e.toString()}');
      return null;
    } finally {
      _setLoading(false);
    }
  }

  /// Criar novo produto
  Future<Product?> createProduct(CreateProductRequest request, {String? token}) async {
    print('🔄 Iniciando criação de produto...');
    print('📋 Dados do produto: ${request.toJson()}');
    print('🔑 Token presente: ${token != null}');
    
    _setLoading(true);
    _clearError();
    try {
      print('🌐 Enviando requisição para API...');
      final newProduct = await _productsService.createProduct(request, token: token);
      print('✅ Produto criado na API: ${newProduct.id}');
      
      _products.add(newProduct);
      print('📝 Produto adicionado à lista local: ${_products.length} produtos');
      
      notifyListeners();
      print('🔔 Listeners notificados');
      
      return newProduct;
    } catch (e) {
      print('❌ Erro ao criar produto: $e');
      _setError('Erro ao criar produto: ${e.toString()}');
      return null;
    } finally {
      _setLoading(false);
    }
  }

  /// Atualizar categoria
  Future<category_models.Category?> updateCategory(String id, category_models.UpdateCategoryRequest request, {String? token}) async {
    _setLoading(true);
    _clearError();
    try {
      final updatedCategory = await _categoriesService.updateCategory(id, request, token: token);
      final index = _categories.indexWhere((cat) => cat.id == id);
      if (index != -1) {
        _categories[index] = updatedCategory;
        notifyListeners();
      }
      return updatedCategory;
    } catch (e) {
      _setError('Erro ao atualizar categoria: ${e.toString()}');
      return null;
    } finally {
      _setLoading(false);
    }
  }

  /// Atualizar produto
  Future<Product?> updateProduct(String id, UpdateProductRequest request, {String? token}) async {
    _setLoading(true);
    _clearError();
    try {
      final updatedProduct = await _productsService.updateProduct(id, request, token: token);
      final index = _products.indexWhere((product) => product.id == id);
      if (index != -1) {
        _products[index] = updatedProduct;
        notifyListeners();
      }
      return updatedProduct;
    } catch (e) {
      _setError('Erro ao atualizar produto: ${e.toString()}');
      return null;
    } finally {
      _setLoading(false);
    }
  }

  /// Deletar categoria
  Future<bool> deleteCategory(String id, {String? token}) async {
    _setLoading(true);
    _clearError();
    try {
      await _categoriesService.deleteCategory(id, token: token);
      _categories.removeWhere((cat) => cat.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Erro ao deletar categoria: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// Deletar produto
  Future<bool> deleteProduct(String id, {String? token}) async {
    _setLoading(true);
    _clearError();
    try {
      await _productsService.deleteProduct(id, token: token);
      _products.removeWhere((product) => product.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Erro ao deletar produto: ${e.toString()}');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// Limpar dados
  void clear() {
    _categories.clear();
    _products.clear();
    _clearError();
    notifyListeners();
  }

  /// Reset completo (dados + cache inteligente)
  Future<void> resetAll() async {
    clear();
    try {
      await clearCache();
    } catch (_) {}
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
    notifyListeners();
  }
  
  /// Limpar erro (método público)
  void clearError() {
    _clearError();
  }

  /// Verificar se é um erro de conectividade e definir mensagem apropriada
  void _handleError(dynamic error) {
    print('❌ Erro capturado: $error');
    
    if (_connectivityService.isConnectivityError(error)) {
      _error = 'Sem conexão com a internet. Verifique sua conexão WiFi e tente novamente.';
    } else if (error.toString().contains('401')) {
      _error = 'Não autorizado. Faça login novamente.';
    } else if (error.toString().contains('403')) {
      _error = 'Acesso negado. Verifique suas permissões.';
    } else if (error.toString().contains('404')) {
      _error = 'Recurso não encontrado.';
    } else if (error.toString().contains('500')) {
      _error = 'Erro interno do servidor. Tente novamente mais tarde.';
    } else {
      _error = 'Erro inesperado. Tente novamente.';
    }
    notifyListeners();
  }

  /// Carregar dados do cache
  Future<Map<String, dynamic>?> _loadFromCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      final categoriesJson = prefs.getString(_categoriesCacheKey);
      final productsJson = prefs.getString(_productsCacheKey);
      
      if (categoriesJson != null && productsJson != null) {
        final categoriesData = jsonDecode(categoriesJson) as Map<String, dynamic>;
        final productsData = jsonDecode(productsJson) as Map<String, dynamic>;
        
        // Verificar se o cache ainda é válido
        final cacheTimestamp = DateTime.parse(categoriesData['timestamp']);
        final now = DateTime.now();
        
        if (now.difference(cacheTimestamp) < _cacheTTL) {
          final categories = (categoriesData['data'] as List)
              .map((json) => category_models.Category.fromJson(json))
              .toList();
          final products = (productsData['data'] as List)
              .map((json) => Product.fromJson(json))
              .toList();
          
          print('📦 Cache válido encontrado (${now.difference(cacheTimestamp).inMinutes}min atrás)');
          return {'categories': categories, 'products': products};
        } else {
          print('📦 Cache expirado');
        }
      }
      
      return null;
    } catch (e) {
      print('❌ Erro ao carregar cache: $e');
      return null;
    }
  }

  /// Salvar dados no cache
  Future<void> _saveToCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final timestamp = DateTime.now().toIso8601String();
      
      final categoriesData = {
        'timestamp': timestamp,
        'data': _categories.map((cat) => cat.toJson()).toList(),
      };
      
      final productsData = {
        'timestamp': timestamp,
        'data': _products.map((prod) => prod.toJson()).toList(),
      };
      
      await prefs.setString(_categoriesCacheKey, jsonEncode(categoriesData));
      await prefs.setString(_productsCacheKey, jsonEncode(productsData));
      
      print('💾 Dados salvos no cache');
    } catch (e) {
      print('❌ Erro ao salvar cache: $e');
    }
  }

  /// Limpar cache
  Future<void> clearCache() async {
    try {
      await SmartCacheService.clearCacheByType('categories');
      await SmartCacheService.clearCacheByType('products');
      print('🗑️ Cache inteligente limpo');
    } catch (e) {
      print('❌ Erro ao limpar cache: $e');
    }
  }

  /// Obter estatísticas do cache
  Future<Map<String, dynamic>> getCacheStats() async {
    return await SmartCacheService.getCacheStats();
  }

  /// Verificar se cache é válido
  Future<bool> isCacheValid() async {
    final categoriesValid = await SmartCacheService.isCacheValid(
      key: 'categories',
      type: 'categories',
    );
    final productsValid = await SmartCacheService.isCacheValid(
      key: 'products',
      type: 'products',
    );
    return categoriesValid && productsValid;
  }

  @override
  void dispose() {
    _categoriesService.dispose();
    _productsService.dispose();
    super.dispose();
  }
}
