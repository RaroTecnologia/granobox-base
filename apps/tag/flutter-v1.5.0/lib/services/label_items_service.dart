import 'dart:convert';
import 'dart:developer' as developer;
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/label_item_models.dart';

class LabelItemsService {
  final String baseUrl = '${AppConfig.apiBaseUrl}/label-items';

  /// Listar itens de rótulo
  Future<List<LabelItem>> listarItens({
    required String clientId,
    String? authToken,
    String? labelTemplateId,
    bool includeInactive = false,
    String? search,
  }) async {
    try {
      final queryParams = <String, String>{
        'clientId': clientId,
        if (labelTemplateId != null) 'labelTemplateId': labelTemplateId,
        if (includeInactive) 'includeInactive': 'true',
        if (search != null && search.isNotEmpty) 'search': search,
      };

      final uri = Uri.parse(baseUrl).replace(queryParameters: queryParams);

      developer.log('🔍 GET $uri', name: 'LabelItemsService');

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
      );

      developer.log(
        '📥 Response ${response.statusCode}: ${response.body.substring(0, response.body.length > 200 ? 200 : response.body.length)}',
        name: 'LabelItemsService',
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => LabelItem.fromJson(json)).toList();
      } else {
        throw Exception('Erro ao listar itens: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      developer.log('❌ Erro ao listar itens: $e', name: 'LabelItemsService');
      rethrow;
    }
  }

  /// Buscar item por ID
  Future<LabelItem> buscarItem({
    required String id,
    required String clientId,
    String? authToken,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/$id').replace(queryParameters: {
        'clientId': clientId,
      });

      developer.log('🔍 GET $uri', name: 'LabelItemsService');

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
      );

      if (response.statusCode == 200) {
        return LabelItem.fromJson(json.decode(response.body));
      } else {
        throw Exception('Erro ao buscar item: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      developer.log('❌ Erro ao buscar item: $e', name: 'LabelItemsService');
      rethrow;
    }
  }

  /// Buscar item com schema mesclado
  Future<Map<String, dynamic>> buscarItemComSchema({
    required String id,
    required String clientId,
    String? authToken,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/$id/schema').replace(queryParameters: {
        'clientId': clientId,
      });

      developer.log('🔍 GET $uri', name: 'LabelItemsService');

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Erro ao buscar item com schema: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      developer.log('❌ Erro ao buscar item com schema: $e', name: 'LabelItemsService');
      rethrow;
    }
  }

  /// Criar novo item
  Future<LabelItem> criarItem({
    required CreateLabelItemDto dto,
    String? authToken,
  }) async {
    try {
      final uri = Uri.parse(baseUrl);

      developer.log('📤 POST $uri', name: 'LabelItemsService');
      developer.log('📦 Body: ${json.encode(dto.toJson())}', name: 'LabelItemsService');

      final response = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
        body: json.encode(dto.toJson()),
      );

      developer.log('📥 Response ${response.statusCode}: ${response.body}', name: 'LabelItemsService');

      if (response.statusCode == 201) {
        return LabelItem.fromJson(json.decode(response.body));
      } else {
        throw Exception('Erro ao criar item: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      developer.log('❌ Erro ao criar item: $e', name: 'LabelItemsService');
      rethrow;
    }
  }

  /// Atualizar item
  Future<LabelItem> atualizarItem({
    required String id,
    required String clientId,
    required UpdateLabelItemDto dto,
    String? authToken,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/$id').replace(queryParameters: {
        'clientId': clientId,
      });

      developer.log('📤 PUT $uri', name: 'LabelItemsService');

      final response = await http.put(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
        body: json.encode(dto.toJson()),
      );

      if (response.statusCode == 200) {
        return LabelItem.fromJson(json.decode(response.body));
      } else {
        throw Exception('Erro ao atualizar item: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      developer.log('❌ Erro ao atualizar item: $e', name: 'LabelItemsService');
      rethrow;
    }
  }

  /// Deletar item
  Future<void> deletarItem({
    required String id,
    required String clientId,
    String? authToken,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/$id').replace(queryParameters: {
        'clientId': clientId,
      });

      developer.log('🗑️ DELETE $uri', name: 'LabelItemsService');

      final response = await http.delete(
        uri,
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
      );

      if (response.statusCode != 200) {
        throw Exception('Erro ao deletar item: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      developer.log('❌ Erro ao deletar item: $e', name: 'LabelItemsService');
      rethrow;
    }
  }
}

