import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/operation_models.dart';

class OperationsService {
  final String _baseUrl = AppConfig.apiBaseUrl;

  /// Buscar todas as operações do cliente
  Future<List<Operation>> getOperationsByClient({String? token}) async {
    try {
      print('🔄 OperationsService - Buscando operações...');
      
      final headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      };

      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await http.get(
        Uri.parse('$_baseUrl/operations?_ts=${DateTime.now().millisecondsSinceEpoch}'),
        headers: headers,
      );

      print('📡 OperationsService - Status: ${response.statusCode}');
      print('📄 OperationsService - Body: ${response.body}');

      if (response.statusCode == 200) {
        final List<dynamic> jsonList = json.decode(response.body);
        final operations = jsonList.map((json) => Operation.fromJson(json)).toList();
        print('✅ OperationsService - Operações carregadas: ${operations.length}');
        return operations;
      } else {
        throw Exception('Erro ao buscar operações: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ OperationsService - Erro: $e');
      rethrow;
    }
  }

  /// Criar nova operação
  Future<Operation> createOperation(CreateOperationRequest request, {String? token}) async {
    try {
      final headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await http.post(
        Uri.parse('$_baseUrl/operations'),
        headers: headers,
        body: json.encode(request.toJson()),
      );

      if (response.statusCode == 201) {
        return Operation.fromJson(json.decode(response.body));
      } else {
        throw Exception('Erro ao criar operação: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ OperationsService - Erro ao criar operação: $e');
      rethrow;
    }
  }

  /// Atualizar operação
  Future<Operation> updateOperation(String id, UpdateOperationRequest request, {String? token}) async {
    try {
      final headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await http.put(
        Uri.parse('$_baseUrl/operations/$id'),
        headers: headers,
        body: json.encode(request.toJson()),
      );

      if (response.statusCode == 200) {
        return Operation.fromJson(json.decode(response.body));
      } else {
        throw Exception('Erro ao atualizar operação: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ OperationsService - Erro ao atualizar operação: $e');
      rethrow;
    }
  }

  /// Deletar operação
  Future<void> deleteOperation(String id, {String? token}) async {
    try {
      final headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await http.delete(
        Uri.parse('$_baseUrl/operations/$id'),
        headers: headers,
      );

      if (response.statusCode != 204) {
        throw Exception('Erro ao deletar operação: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ OperationsService - Erro ao deletar operação: $e');
      rethrow;
    }
  }
}
