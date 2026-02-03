import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/product_models.dart';
import '../config/app_config.dart';

/// Serviço para comunicação com a API de produtos
class ProductsService {
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

  /// Buscar todos os produtos do cliente
  Future<List<Product>> getProductsByClient({String? token}) async {
    try {
      final headers = token != null ? _getAuthHeaders(token) : _defaultHeaders;
      
      final response = await _client.get(
        Uri.parse('$_baseUrl/products'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Product.fromJson(json)).toList();
      } else {
        throw Exception('Erro ao buscar produtos: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Erro na comunicação com a API: ${e.toString()}');
    }
  }

  /// Buscar produtos por categoria
  Future<List<Product>> getProductsByCategory(String categoryId, {String? token}) async {
    try {
      final products = await getProductsByClient(token: token);
      return products.where((product) => product.categoryId == categoryId).toList();
    } catch (e) {
      throw Exception('Erro ao buscar produtos da categoria: ${e.toString()}');
    }
  }

  /// Buscar produtos por tipo
  Future<List<Product>> getProductsByType(String type, {String? token}) async {
    try {
      final products = await getProductsByClient(token: token);
      return products.where((product) => product.type == type).toList();
    } catch (e) {
      throw Exception('Erro ao buscar produtos do tipo: ${e.toString()}');
    }
  }

  /// Buscar produto por ID
  Future<Product> getProductById(String id, {String? token}) async {
    try {
      final headers = token != null ? _getAuthHeaders(token) : _defaultHeaders;
      
      final response = await _client.get(
        Uri.parse('$_baseUrl/products/$id'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return Product.fromJson(data);
      } else {
        throw Exception('Erro ao buscar produto: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Erro ao buscar produto: ${e.toString()}');
    }
  }

  /// Criar novo produto
  Future<Product> createProduct(CreateProductRequest request, {String? token}) async {
    try {
      print('🌐 ProductsService: Iniciando criação de produto');
      print('🔗 URL: $_baseUrl/products');
      print('📋 Request body: ${jsonEncode(request.toJson())}');
      
      final headers = token != null ? _getAuthHeaders(token) : _defaultHeaders;
      print('🔑 Headers: $headers');
      
      final response = await _client.post(
        Uri.parse('$_baseUrl/products'),
        headers: headers,
        body: jsonEncode(request.toJson()),
      );

      print('📡 Response status: ${response.statusCode}');
      print('📄 Response body: ${response.body}');

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        print('✅ Produto criado com sucesso na API');
        return Product.fromJson(data);
      } else {
        final errorData = jsonDecode(response.body);
        print('❌ Erro da API: ${errorData['message']}');
        throw Exception(errorData['message'] ?? 'Erro ao criar produto');
      }
    } catch (e) {
      print('❌ Exceção no ProductsService: $e');
      throw Exception('Erro ao criar produto: ${e.toString()}');
    }
  }

  /// Atualizar produto
  Future<Product> updateProduct(String id, UpdateProductRequest request, {String? token}) async {
    try {
      print('🌐 ProductsService: Iniciando atualização de produto');
      print('🔗 URL: $_baseUrl/products/$id');
      print('📋 Request body: ${jsonEncode(request.toJson())}');
      
      final headers = token != null ? _getAuthHeaders(token) : _defaultHeaders;
      print('🔑 Headers: $headers');
      
      final response = await _client.patch(
        Uri.parse('$_baseUrl/products/$id'),
        headers: headers,
        body: jsonEncode(request.toJson()),
      );

      print('📡 Response status: ${response.statusCode}');
      print('📄 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Produto atualizado com sucesso na API');
        return Product.fromJson(data);
      } else {
        final errorData = jsonDecode(response.body);
        print('❌ Erro da API: ${errorData['message']}');
        throw Exception(errorData['message'] ?? 'Erro ao atualizar produto');
      }
    } catch (e) {
      throw Exception('Erro ao atualizar produto: ${e.toString()}');
    }
  }

  /// Deletar produto
  Future<void> deleteProduct(String id, {String? token}) async {
    try {
      final headers = token != null ? _getAuthHeaders(token) : _defaultHeaders;
      
      final response = await _client.delete(
        Uri.parse('$_baseUrl/products/$id'),
        headers: headers,
      );

      if (response.statusCode != 204) {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Erro ao deletar produto');
      }
    } catch (e) {
      throw Exception('Erro ao deletar produto: ${e.toString()}');
    }
  }

  /// Gerar próximo código de produto
  Future<String> generateNextCode({String? token, String? type}) async {
    try {
      final headers = token != null ? _getAuthHeaders(token) : _defaultHeaders;
      
      final uri = Uri.parse('$_baseUrl/products/generate-code');
      final uriWithQuery = type != null 
          ? uri.replace(queryParameters: {'type': type})
          : uri;
      
      final response = await _client.get(
        uriWithQuery,
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['code'] as String;
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['message'] ?? 'Erro ao gerar código');
      }
    } catch (e) {
      throw Exception('Erro ao gerar código: ${e.toString()}');
    }
  }

  /// Dispose do cliente HTTP
  void dispose() {
    _client.close();
  }
}



