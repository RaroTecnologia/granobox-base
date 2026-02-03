import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../services/auth_service.dart';

class RastreabilidadeService {
  static const String _endpoint = '/rastreabilidade';
  final AuthService _authService = AuthService();

  Future<Map<String, dynamic>> createRecebimento(Map<String, dynamic> data) async {
    try {
      final token = await _authService.getAuthToken();
      if (token == null) {
        throw Exception('Token de autenticação não encontrado');
      }

      final url = Uri.parse('${AppConfig.apiBaseUrl}$_endpoint/recebimento');
      
      print('📡 DEBUG - Enviando requisição para: $url');
      print('📦 DEBUG - Dados: ${jsonEncode(data)}');
      
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(data),
      );

      print('📡 DEBUG - Resposta da API:');
      print('  Status: ${response.statusCode}');
      print('  Body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        try {
          final errorBody = jsonDecode(response.body);
          final errorMessage = errorBody['message'] ?? errorBody['error'] ?? 'Erro ao criar recebimento';
          print('❌ DEBUG - Erro da API: $errorMessage');
          throw Exception(errorMessage);
        } catch (e) {
          print('❌ DEBUG - Erro ao decodificar resposta: ${response.body}');
          throw Exception('Erro ao criar recebimento: ${response.statusCode} - ${response.body}');
        }
      }
    } catch (e) {
      throw Exception('Erro ao criar recebimento: ${e.toString()}');
    }
  }

  Future<List<Map<String, dynamic>>> listRecebimentos() async {
    // Método mantido para compatibilidade, mas agora usa paginação
    // Busca todos os recebimentos com limite alto para manter compatibilidade
    final result = await listRecebimentosPaginated(page: 1, limit: 1000);
    final data = result['data'];
    
    if (data is List) {
      // Converte List<dynamic> para List<Map<String, dynamic>>
      return data.map((item) => item as Map<String, dynamic>).toList();
    } else {
      throw Exception('Formato de resposta inválido: esperado List, recebido ${data.runtimeType}');
    }
  }

  Future<Map<String, dynamic>> getEstoque({
    String? search,
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final token = await _authService.getAuthToken();
      if (token == null) {
        throw Exception('Token de autenticação não encontrado');
      }

      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      final url = Uri.parse('${AppConfig.apiBaseUrl}$_endpoint/recebimento/estoque').replace(
        queryParameters: queryParams,
      );
      
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      } else {
        throw Exception('Erro ao buscar estoque: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Erro ao buscar estoque: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> listRecebimentosPaginated({
    int page = 1,
    int limit = 20,
    String? search,
  }) async {
    try {
      final token = await _authService.getAuthToken();
      if (token == null) {
        throw Exception('Token de autenticação não encontrado');
      }

      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };
      
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      final url = Uri.parse('${AppConfig.apiBaseUrl}$_endpoint/recebimento').replace(
        queryParameters: queryParams,
      );
      
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      } else {
        throw Exception('Erro ao listar recebimentos: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Erro ao listar recebimentos: ${e.toString()}');
    }
  }

  Future<Map<String, dynamic>> listContagensPaginated({
    int page = 1,
    int limit = 20,
    String? search,
  }) async {
    try {
      final token = await _authService.getAuthToken();
      if (token == null) {
        throw Exception('Token de autenticação não encontrado');
      }

      final queryParams = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
      };
      
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      final url = Uri.parse('${AppConfig.apiBaseUrl}/inventory-counts').replace(
        queryParameters: queryParams,
      );
      
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      } else {
        throw Exception('Erro ao listar contagens: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Erro ao listar contagens: ${e.toString()}');
    }
  }

  Future<List<Map<String, dynamic>>> createContagens(List<Map<String, dynamic>> items) async {
    try {
      final token = await _authService.getAuthToken();
      if (token == null) {
        throw Exception('Token de autenticação não encontrado');
      }

      final url = Uri.parse('${AppConfig.apiBaseUrl}/inventory-counts/items');
      
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'items': items}),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final result = jsonDecode(response.body);
        if (result is List) {
          return result.map((item) => item as Map<String, dynamic>).toList();
        }
        return [result as Map<String, dynamic>];
      } else {
        final errorBody = jsonDecode(response.body);
        final errorMessage = errorBody['message'] ?? errorBody['error'] ?? 'Erro ao criar contagens';
        throw Exception(errorMessage);
      }
    } catch (e) {
      throw Exception('Erro ao criar contagens: ${e.toString()}');
    }
  }
}

