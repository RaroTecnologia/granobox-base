import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/template_models.dart';

class TemplatesService {
  static const String _granoboxDefaultTemplateId = '1c12926f-849b-4bd7-8a61-05036f39f443';
  
  /// Obter template padrão Granobox
  Template get granoboxDefaultTemplate => Template(
    id: _granoboxDefaultTemplateId,
    name: 'Granobox Validade Padrão',
    description: 'Template público padrão para etiquetas de validade',
    isPublic: true,
    customerId: null,
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );
  
  /// Buscar detalhes de um template pelo ID
  /// Usa diretamente a API do Tagment (api.tagment.com.br)
  Future<Template?> getTemplateById(String templateId, {required String token, String? tagmentApiKey}) async {
    try {
      // Se tiver API Key do Tagment, usar diretamente a API do Tagment
      if (tagmentApiKey != null && tagmentApiKey.isNotEmpty) {
        final response = await http.get(
          Uri.parse('https://api.tagment.com.br/v1/templates/$templateId'),
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': tagmentApiKey,
          },
        );

        print('🔍 Buscando template $templateId (Tagment direto) - Status: ${response.statusCode}');

        if (response.statusCode == 200) {
          final dynamic decoded = json.decode(response.body);
          
          // Verificar se é uma resposta de erro do Tagment
          if (decoded is Map && decoded['success'] == false) {
            print('❌ Erro do Tagment: ${decoded['error']}');
            return null;
          }
          
          // Resposta com success:true e template dentro de 'template'
          if (decoded is Map && decoded['success'] == true && decoded['template'] != null) {
            final templateData = Map<String, dynamic>.from(decoded['template']);
            print('✅ Template encontrado: ${templateData['name']}');
            return Template.fromJson(templateData);
          }
          
          // Fallback: template direto no root (sem wrapper)
          if (decoded is Map && decoded['id'] != null) {
            final data = Map<String, dynamic>.from(decoded);
            print('✅ Template encontrado: ${data['name']}');
            return Template.fromJson(data);
          }
          
          print('❌ Resposta inesperada: ${response.body.substring(0, response.body.length.clamp(0, 200))}');
          return null;
        } else {
          print('❌ Erro ao buscar template: ${response.body}');
          return null;
        }
      }
      
      // Fallback: usar a API do Granobox (pode não ter a rota)
      final response = await http.get(
        Uri.parse('${AppConfig.apiBaseUrl}/tagment/templates/$templateId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('🔍 Buscando template $templateId - Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return Template.fromJson(data);
      } else {
        print('❌ Erro ao buscar template: ${response.body}');
        return null;
      }
    } catch (e) {
      print('❌ Erro ao buscar template: $e');
      return null;
    }
  }
  
  /// Listar todos os templates (públicos e privados)
  Future<Map<String, List<Template>>> getAllTemplates({required String clientId, required String token}) async {
    try {
      // Buscar via API do Granobox que faz a chamada ao Tagment
      final response = await http.get(
        Uri.parse('${AppConfig.apiBaseUrl}/tagment/templates?customerId=$clientId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('📋 Listando todos os templates - Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        final allTemplates = data.map((t) => Template.fromJson(t)).toList();
        
        // Separar em públicos e privados
        final publicTemplates = allTemplates.where((t) => t.isPublic == true).toList();
        final privateTemplates = allTemplates.where((t) => t.isPublic != true).toList();
        
        return {
          'public': publicTemplates,
          'private': privateTemplates,
        };
      } else {
        print('❌ Erro ao listar templates: ${response.body}');
        return {'public': [], 'private': []};
      }
    } catch (e) {
      print('❌ Erro ao listar templates: $e');
      return {'public': [], 'private': []};
    }
  }
  
  /// Listar apenas templates privados do cliente
  Future<List<Template>> getPrivateTemplates({required String clientId, required String token}) async {
    final result = await getAllTemplates(clientId: clientId, token: token);
    return result['private'] ?? [];
  }
  
  /// Listar apenas templates públicos
  Future<List<Template>> getPublicTemplates({required String clientId, required String token}) async {
    final result = await getAllTemplates(clientId: clientId, token: token);
    return result['public'] ?? [];
  }
  
  /// Adicionar um template público pelo código
  Future<Template?> addPublicTemplateByCode(String templateId, {required String token}) async {
    // Validar que é um UUID válido
    final uuidRegex = RegExp(
      r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
      caseSensitive: false,
    );
    
    if (!uuidRegex.hasMatch(templateId)) {
      throw Exception('Código inválido. Por favor, insira um UUID válido.');
    }
    
    // Buscar o template para validar que existe e é público
    return await getTemplateById(templateId, token: token);
  }
  
  /// Obter template padrão configurado para o cliente
  Future<String?> getDefaultTemplateIdForClient({
    required String clientId,
    required String labelType,
    required String token,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('${AppConfig.apiBaseUrl}/tagment/default-template?clientId=$clientId&labelType=$labelType'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['templateId'] as String?;
      } else if (response.statusCode == 404) {
        return null; // Não configurado
      }
      return null;
    } catch (e) {
      print('❌ Erro ao buscar template padrão: $e');
      return null;
    }
  }
  
  /// Definir template padrão para o cliente
  Future<bool> setDefaultTemplate({
    required String clientId,
    required String labelType,
    required String templateId,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}/tagment/default-template'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'clientId': clientId,
          'labelType': labelType,
          'templateId': templateId,
        }),
      );

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print('❌ Erro ao definir template padrão: $e');
      return false;
    }
  }
}

