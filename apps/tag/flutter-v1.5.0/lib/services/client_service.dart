import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

/// Serviço para buscar informações do cliente
class ClientService {
  static String get _baseUrl => AppConfig.apiBaseUrl;
  
  /// Buscar informações completas do cliente incluindo API Key do Tagment
  Future<Map<String, dynamic>?> getClientInfo(String clientId, String authToken) async {
    try {
      print('🌐 ClientService - URL: $_baseUrl/clients/$clientId');
      print('🔑 ClientService - Auth Token: ${authToken.substring(0, 20)}...');
      
      final response = await http.get(
        Uri.parse('$_baseUrl/clients/$clientId'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
      );
      
      print('📊 ClientService - Status: ${response.statusCode}');
      // Log seguro do body (truncado)
      final bodyStr = response.body;
      print('📄 ClientService - Body (prefixo 200 chars): ${bodyStr.substring(0, bodyStr.length > 200 ? 200 : bodyStr.length)}');
      
      if (response.statusCode == 200) {
        final result = jsonDecode(response.body);
        print('✅ ClientService - Cliente encontrado');
        print('📊 ClientService - tagmentApiKey presente: ${result['tagmentApiKey'] != null}');
        if (result['tagmentApiKey'] != null) {
          print('🔑 ClientService - API Key: ${result['tagmentApiKey'].toString().substring(0, 10)}...');
        }
        return result;
      } else {
        print('❌ Erro ao buscar cliente: ${response.statusCode}');
        print('📄 ClientService - Body: ${response.body}');
        return null;
      }
    } catch (e) {
      print('❌ Erro de conexão ao buscar cliente: $e');
      return null;
    }
  }
  
  /// Buscar apenas a API Key do Tagment do cliente
  Future<String?> getTagmentApiKey(String clientId, String authToken) async {
    try {
      final clientInfo = await getClientInfo(clientId, authToken);
      return clientInfo?['tagmentApiKey'];
    } catch (e) {
      print('❌ Erro ao buscar API Key do Tagment: $e');
      return null;
    }
  }
}
