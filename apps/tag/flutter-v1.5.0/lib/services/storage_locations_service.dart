import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/storage_location_models.dart';
import '../services/auth_service.dart';

class StorageLocationsService {
  static const String _endpoint = '/storage-locations';
  final AuthService _authService = AuthService();

  Future<List<StorageLocation>> getStorageLocations({bool activeOnly = false}) async {
    try {
      final token = await _authService.getAuthToken();
      if (token == null) {
        throw Exception('Token de autenticação não encontrado');
      }

      final url = Uri.parse('${AppConfig.apiBaseUrl}$_endpoint${activeOnly ? '?active=true' : ''}');
      
      print('🔄 Fazendo requisição para: $url');
      print('🔐 Headers: Content-Type, Accept, Authorization');
      print('🎫 Token: ${token.substring(0, 20)}...');

      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('📡 Status da resposta: ${response.statusCode}');
      print('📄 Body da resposta: ${response.body}');
      print('🔍 Headers da resposta: ${response.headers}');

      if (response.statusCode == 200) {
        final List<dynamic> jsonList = json.decode(response.body);
        final storageLocations = jsonList
            .map((json) => StorageLocation.fromJson(json))
            .toList();
        
        print('✅ Locais de armazenamento parseados: ${storageLocations.length}');
        return storageLocations;
      } else {
        throw Exception('Erro ao buscar locais de armazenamento: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao buscar locais de armazenamento: $e');
      rethrow;
    }
  }

  Future<StorageLocation> getStorageLocationById(String id) async {
    try {
      final token = await _authService.getAuthToken();
      if (token == null) {
        throw Exception('Token de autenticação não encontrado');
      }

      final url = Uri.parse('${AppConfig.apiBaseUrl}$_endpoint/$id');
      
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        return StorageLocation.fromJson(json);
      } else {
        throw Exception('Erro ao buscar local de armazenamento: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao buscar local de armazenamento: $e');
      rethrow;
    }
  }

  Future<StorageLocation> createStorageLocation(CreateStorageLocationRequest request) async {
    try {
      final token = await _authService.getAuthToken();
      if (token == null) {
        throw Exception('Token de autenticação não encontrado');
      }

      final url = Uri.parse('${AppConfig.apiBaseUrl}$_endpoint');
      
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(request.toJson()),
      );

      if (response.statusCode == 201) {
        final json = jsonDecode(response.body);
        return StorageLocation.fromJson(json);
      } else {
        throw Exception('Erro ao criar local de armazenamento: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao criar local de armazenamento: $e');
      rethrow;
    }
  }

  Future<StorageLocation> updateStorageLocation(String id, UpdateStorageLocationRequest request) async {
    try {
      final token = await _authService.getAuthToken();
      if (token == null) {
        throw Exception('Token de autenticação não encontrado');
      }

      final url = Uri.parse('${AppConfig.apiBaseUrl}$_endpoint/$id');
      
      final response = await http.put(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(request.toJson()),
      );

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        return StorageLocation.fromJson(json);
      } else {
        throw Exception('Erro ao atualizar local de armazenamento: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao atualizar local de armazenamento: $e');
      rethrow;
    }
  }

  Future<void> deleteStorageLocation(String id) async {
    try {
      final token = await _authService.getAuthToken();
      if (token == null) {
        throw Exception('Token de autenticação não encontrado');
      }

      final url = Uri.parse('${AppConfig.apiBaseUrl}$_endpoint/$id');
      
      final response = await http.delete(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode != 200) {
        throw Exception('Erro ao deletar local de armazenamento: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao deletar local de armazenamento: $e');
      rethrow;
    }
  }
}
