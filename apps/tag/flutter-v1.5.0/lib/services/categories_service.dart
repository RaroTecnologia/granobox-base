import 'dart:convert';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:http/http.dart' as http;
import '../models/category_models.dart';
import '../config/app_config.dart';

/// Serviço para comunicação com a API de categorias
class CategoriesService {
  static String get _baseUrl => AppConfig.apiBaseUrl;
  
  final http.Client _client = http.Client();

  /// Headers padrão para requisições
  Map<String, String> get _defaultHeaders => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  /// Headers com autenticação
  Map<String, String> _getAuthHeaders(String token) {
    final headers = Map<String, String>.from(_defaultHeaders);
    headers['Authorization'] = 'Bearer $token';
    return headers;
  }

  /// Buscar todas as categorias do cliente
  Future<List<Category>> getCategoriesByClient({String? token}) async {
    try {
      print('🔄 Fazendo requisição para: $_baseUrl/categories');
      final headers = token != null ? _getAuthHeaders(token) : _defaultHeaders;
      print('🔐 Headers: ${headers.keys.join(', ')}');
      
      final response = await _client.get(
        Uri.parse('$_baseUrl/categories'),
        headers: headers,
      );

      print('📡 Status da resposta: ${response.statusCode}');
      print('📄 Body da resposta: ${response.body}');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        final categories = data.map((json) => Category.fromJson(json)).toList();
        print('✅ Categorias parseadas: ${categories.length}');
        return categories;
      } else {
        throw Exception('Erro ao buscar categorias: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro na requisição: $e');
      throw Exception('Erro na comunicação com a API: ${e.toString()}');
    }
  }

  /// Buscar categorias raiz (sem parentId)
  Future<List<Category>> getRootCategories({String? token}) async {
    try {
      final categories = await getCategoriesByClient(token: token);
      return categories.where((cat) => cat.parentId == null).toList();
    } catch (e) {
      throw Exception('Erro ao buscar categorias raiz: ${e.toString()}');
    }
  }

  /// Buscar categorias por pai
  Future<List<Category>> getCategoriesByParent(String parentId, {String? token}) async {
    try {
      final categories = await getCategoriesByClient(token: token);
      return categories.where((cat) => cat.parentId == parentId).toList();
    } catch (e) {
      throw Exception('Erro ao buscar subcategorias: ${e.toString()}');
    }
  }

  /// Criar nova categoria
  Future<Category> createCategory(CreateCategoryRequest request, {String? token}) async {
    try {
      final headers = token != null ? _getAuthHeaders(token) : _defaultHeaders;
      
      final response = await _client.post(
        Uri.parse('$_baseUrl/categories'),
        headers: headers,
        body: jsonEncode(request.toJson()),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return Category.fromJson(data);
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Erro ao criar categoria');
      }
    } catch (e) {
      throw Exception('Erro ao criar categoria: ${e.toString()}');
    }
  }

  /// Atualizar categoria
  Future<Category> updateCategory(String id, UpdateCategoryRequest request, {String? token}) async {
    try {
      final headers = token != null ? _getAuthHeaders(token) : _defaultHeaders;
      final payload = request.toJson();
      debugPrint('🛠️ PATCH /categories/$id payload: $payload');
      
      final response = await _client.patch(
        Uri.parse('$_baseUrl/categories/$id'),
        headers: headers,
        body: jsonEncode(payload),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        debugPrint('✅ Categoria atualizada: $data');
        return Category.fromJson(data);
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Erro ao atualizar categoria');
      }
    } catch (e) {
      throw Exception('Erro ao atualizar categoria: ${e.toString()}');
    }
  }

  /// Deletar categoria
  Future<void> deleteCategory(String id, {String? token}) async {
    try {
      final headers = token != null ? _getAuthHeaders(token) : _defaultHeaders;
      
      final response = await _client.delete(
        Uri.parse('$_baseUrl/categories/$id'),
        headers: headers,
      );

      if (response.statusCode != 204) {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Erro ao deletar categoria');
      }
    } catch (e) {
      throw Exception('Erro ao deletar categoria: ${e.toString()}');
    }
  }

  /// Dispose do cliente HTTP
  void dispose() {
    _client.close();
  }
}
