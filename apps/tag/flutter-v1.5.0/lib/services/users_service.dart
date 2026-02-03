import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/client_user_models.dart';
import '../config/app_config.dart';

/// Serviço para gerenciar usuários clientes
class UsersService {
  static String get _baseUrl => AppConfig.apiBaseUrl;

  /// Buscar usuários do cliente
  Future<List<ClientUser>> getUsers({
    required String clientId,
    required String authToken,
  }) async {
    try {
      print('🌐 Buscando usuários do cliente: $clientId');
      
      final response = await http.get(
        Uri.parse('$_baseUrl/clients/$clientId/users'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
      );

      print('📊 Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        final users = data.map((json) => ClientUser.fromJson(json)).toList();
        print('✅ Usuários carregados: ${users.length}');
        return users;
      } else {
        print('❌ Erro ao buscar usuários: ${response.statusCode}');
        print('📄 Body: ${response.body}');
        throw Exception('Erro ao buscar usuários: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro de conexão ao buscar usuários: $e');
      rethrow;
    }
  }

  /// Enviar convite para novo usuário
  Future<void> sendInvite({
    required String clientId,
    required String authToken,
    required String name,
    required String email,
    String? message,
  }) async {
    try {
      print('🌐 Enviando convite para: $email');
      
      final response = await http.post(
        Uri.parse('$_baseUrl/clients/$clientId/invite'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(<String, dynamic>{
          'name': name,
          'email': email,
          if (message != null && message.isNotEmpty) 'message': message,
        }),
      );

      print('📊 Status: ${response.statusCode}');

      if (response.statusCode != 200) {
        print('❌ Erro ao enviar convite: ${response.statusCode}');
        print('📄 Body: ${response.body}');
        throw Exception('Erro ao enviar convite: ${response.body}');
      }

      print('✅ Convite enviado com sucesso');
    } catch (e) {
      print('❌ Erro ao enviar convite: $e');
      rethrow;
    }
  }

  /// Reenviar convite
  Future<void> resendInvite({
    required String clientId,
    required String authToken,
    required String email,
  }) async {
    try {
      print('🌐 Reenviando convite para: $email');
      
      final response = await http.post(
        Uri.parse('$_baseUrl/clients/$clientId/resend-invite'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'email': email,
        }),
      );

      print('📊 Status: ${response.statusCode}');

      if (response.statusCode != 200) {
        print('❌ Erro ao reenviar convite: ${response.statusCode}');
        print('📄 Body: ${response.body}');
        throw Exception('Erro ao reenviar convite: ${response.body}');
      }

      print('✅ Convite reenviado com sucesso');
    } catch (e) {
      print('❌ Erro ao reenviar convite: $e');
      rethrow;
    }
  }

  /// Atualizar status do usuário (ativar/inativar)
  Future<ClientUser> updateUserStatus({
    required String clientId,
    required String userId,
    required String authToken,
    required bool isActive,
  }) async {
    try {
      print('🌐 Atualizando status do usuário: $userId para ${isActive ? "ativo" : "inativo"}');
      
      final response = await http.patch(
        Uri.parse('$_baseUrl/clients/$clientId/users/$userId'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'status': isActive ? 'active' : 'inactive',
        }),
      );

      print('📊 Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final user = ClientUser.fromJson(data);
        print('✅ Status atualizado com sucesso');
        return user;
      } else {
        print('❌ Erro ao atualizar status: ${response.statusCode}');
        print('📄 Body: ${response.body}');
        throw Exception('Erro ao atualizar status: ${response.body}');
      }
    } catch (e) {
      print('❌ Erro ao atualizar status: $e');
      rethrow;
    }
  }
}


