import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/label_template_models.dart';

class LabelTemplatesService {
  final String baseUrl = AppConfig.apiBaseUrl;

  /// Listar todos os rótulos do cliente
  Future<List<LabelTemplate>> listarRotulos({
    required String clientId,
    String? authToken,
    bool includeInactive = false,
  }) async {
    try {
      final url = Uri.parse(
        '$baseUrl/label-templates?clientId=$clientId${includeInactive ? '&includeInactive=true' : ''}'
      );

      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
      );

      print('🏷️ Listar rótulos - Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final templates = data.map((item) => LabelTemplate.fromJson(item)).toList();
        print('✅ ${templates.length} rótulos carregados');
        return templates;
      } else {
        print('❌ Erro ao listar rótulos: ${response.statusCode}');
        throw Exception('Erro ao listar rótulos: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Exceção ao listar rótulos: $e');
      throw Exception('Erro ao listar rótulos: $e');
    }
  }

  /// Buscar rótulo por ID
  Future<LabelTemplate> buscarRotulo({
    required String id,
    required String clientId,
    String? authToken,
  }) async {
    try {
      final url = Uri.parse('$baseUrl/label-templates/$id?clientId=$clientId');

      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
      );

      if (response.statusCode == 200) {
        return LabelTemplate.fromJson(json.decode(response.body));
      } else {
        throw Exception('Rótulo não encontrado');
      }
    } catch (e) {
      throw Exception('Erro ao buscar rótulo: $e');
    }
  }

  /// Buscar rótulos disponíveis para uma categoria
  Future<List<LabelTemplate>> buscarPorCategoria({
    required String categoryId,
    required String clientId,
    String? authToken,
  }) async {
    try {
      final url = Uri.parse(
        '$baseUrl/label-templates/by-category/$categoryId?clientId=$clientId'
      );

      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((item) => LabelTemplate.fromJson(item)).toList();
      } else {
        throw Exception('Erro ao buscar rótulos da categoria');
      }
    } catch (e) {
      throw Exception('Erro ao buscar rótulos: $e');
    }
  }

  /// Buscar rótulos disponíveis para um produto
  Future<List<LabelTemplate>> buscarPorProduto({
    required String productId,
    required String clientId,
    String? authToken,
  }) async {
    try {
      final url = Uri.parse(
        '$baseUrl/label-templates/by-product/$productId?clientId=$clientId'
      );

      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((item) => LabelTemplate.fromJson(item)).toList();
      } else {
        throw Exception('Erro ao buscar rótulos do produto');
      }
    } catch (e) {
      throw Exception('Erro ao buscar rótulos: $e');
    }
  }

  /// Obter schema renderizável (com auto-fill de produto se fornecido)
  Future<RenderableSchema> obterSchemaRenderizavel({
    required String labelId,
    required String clientId,
    String? productId,
    String? authToken,
  }) async {
    try {
      final url = Uri.parse(
        '$baseUrl/label-templates/$labelId/schema?clientId=$clientId${productId != null ? '&productId=$productId' : ''}'
      );

      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
      );

      print('🏷️ Obter schema - Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ Schema obtido com sucesso');
        print('📦 Auto-filled values: ${data['autoFilledValues']}');
        return RenderableSchema.fromJson(data);
      } else {
        throw Exception('Erro ao obter schema: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao obter schema: $e');
      throw Exception('Erro ao obter schema: $e');
    }
  }

  /// Criar novo rótulo
  Future<LabelTemplate> criarRotulo({
    required CreateLabelTemplateDto dto,
    String? authToken,
  }) async {
    try {
      final url = Uri.parse('$baseUrl/label-templates');

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
        body: json.encode(dto.toJson()),
      );

      if (response.statusCode == 201) {
        return LabelTemplate.fromJson(json.decode(response.body));
      } else {
        throw Exception('Erro ao criar rótulo: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Erro ao criar rótulo: $e');
    }
  }

  /// Atualizar rótulo
  Future<LabelTemplate> atualizarRotulo({
    required String id,
    required String clientId,
    required UpdateLabelTemplateDto dto,
    String? authToken,
  }) async {
    try {
      final url = Uri.parse('$baseUrl/label-templates/$id?clientId=$clientId');

      final response = await http.put(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
        body: json.encode(dto.toJson()),
      );

      if (response.statusCode == 200) {
        return LabelTemplate.fromJson(json.decode(response.body));
      } else {
        throw Exception('Erro ao atualizar rótulo: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Erro ao atualizar rótulo: $e');
    }
  }

  /// Deletar rótulo (soft delete)
  Future<void> deletarRotulo({
    required String id,
    required String clientId,
    String? authToken,
  }) async {
    try {
      final url = Uri.parse('$baseUrl/label-templates/$id?clientId=$clientId');

      final response = await http.delete(
        url,
        headers: {
          'Content-Type': 'application/json',
          if (authToken != null) 'Authorization': 'Bearer $authToken',
        },
      );

      if (response.statusCode != 200) {
        throw Exception('Erro ao deletar rótulo: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Erro ao deletar rótulo: $e');
    }
  }
}

