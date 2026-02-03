import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import './api_service.dart';

// ⭐ Resposta da adoção
class AdoptDeviceResponse {
  final bool success;
  final String? message;
  final String? deviceId;
  
  AdoptDeviceResponse({
    required this.success,
    this.message,
    this.deviceId,
  });
}

/// Serviço para gerenciar dispositivos Dots na API
class DeviceApiService {
  final ApiService _apiService = ApiService();

  /// Registrar um novo dispositivo Dot no backend
  /// 
  /// Retorna o ID do device registrado ou null em caso de erro
  Future<String?> registerDevice({
    required String deviceId,
    required String apiKey,
    required String authToken,
    String? name,
    String? clientId,
    String? operationId,
    String? bleAddress,
  }) async {
    try {
      print('');
      print('🔵 ========================================');
      print('🔵 REGISTRANDO DEVICE NO BACKEND');
      print('🔵 ========================================');
      print('📡 Device ID: $deviceId');
      print('🔑 API Key: $apiKey');
      print('👤 ClientId: $clientId');
      print('🏭 OperationId: $operationId');
      print('📱 BLE Address: $bleAddress');
      print('🔵 ========================================');
      print('');
      
      final response = await _apiService.post(
        '/devices/register',
        data: {
          'deviceId': deviceId,
          'apiKey': apiKey,
          if (name != null) 'name': name,
          if (clientId != null) 'clientId': clientId,
          if (operationId != null) 'operationId': operationId,
          if (bleAddress != null) 'bleAddress': bleAddress,
        },
        token: authToken,
      ).timeout(const Duration(seconds: 30));

      print('');
      print('📥 RESPOSTA DO BACKEND:');
      print('   Status: ${response.statusCode}');
      print('   Body: ${response.body}');
      print('');

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Device registrado com sucesso! ID: ${data['id']}');
        return data['id'] as String;
      } else if (response.statusCode == 409) {
        // ⭐ CORREÇÃO: Extrair mensagem do backend para mostrar ao usuário
        try {
          final errorData = jsonDecode(response.body);
          final message = errorData['message'] as String? ?? 
                         'Este dispositivo já está registrado para outro usuário';
          print('⚠️  Dispositivo já registrado: $message');
          throw Exception(message);
        } catch (e) {
          // Se não conseguir parsear, usar mensagem padrão
          print('⚠️  Dispositivo já registrado para outro usuário');
          throw Exception('Este dispositivo já está registrado para outro usuário');
        }
      } else {
        print('');
        print('❌ ========================================');
        print('❌ ERRO AO REGISTRAR DEVICE');
        print('❌ ========================================');
        print('❌ Status Code: ${response.statusCode}');
        print('❌ Body: ${response.body}');
        print('❌ URL: ${ApiConfig.devicesUrl}/register');
        print('❌ ========================================');
        print('');
        
        // ⭐ CORREÇÃO: Tentar extrair mensagem de erro do backend
        try {
          final errorData = jsonDecode(response.body);
          final message = errorData['message'] as String? ?? 
                         'Erro ao registrar dispositivo';
          throw Exception('Servidor retornou erro: ${response.statusCode}\n$message');
        } catch (e) {
          if (e is Exception && e.toString().contains('Servidor retornou')) {
            rethrow;
          }
          throw Exception('Servidor retornou erro: ${response.statusCode}\n${response.body}');
        }
      }
    } catch (e, stackTrace) {
      print('');
      print('❌ EXCEÇÃO ao registrar device:');
      print('   Erro: $e');
      print('   StackTrace: $stackTrace');
      print('');
      rethrow;
    }
  }

  /// Buscar informações de um device específico
  Future<Map<String, dynamic>> getDevice({
    required String deviceId,
    required String authToken,
  }) async {
    try {
      final response = await _apiService.get(
        '/devices/$deviceId',
        token: authToken,
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return jsonDecode(response.body) as Map<String, dynamic>;
      } else {
        throw Exception('Erro ${response.statusCode}: ${response.body}');
      }
    } catch (e) {
      print('❌ Erro ao buscar device: $e');
      rethrow;
    }
  }

  // ⭐ NOVO: Adotar dispositivo (vincular ao usuário)
  Future<AdoptDeviceResponse> adoptDevice({
    required String deviceId,
    required String authToken,
    String? name,
    String? operationId,
  }) async {
    try {
      print('🎯 Adotando device: $deviceId');
      print('   Nome: $name');
      print('   Operação: $operationId');
      
      final response = await http.post(
        Uri.parse('${ApiConfig.devicesUrl}/$deviceId/adopt'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          if (name != null) 'name': name,
          if (operationId != null) 'operationId': operationId,
        }),
      );

      print('📊 Status: ${response.statusCode}');
      print('📄 Body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        print('✅ Device adotado com sucesso!');
        return AdoptDeviceResponse(
          success: true,
          message: 'Dispositivo adotado com sucesso',
          deviceId: data['deviceId'],
        );
      } else {
        final error = jsonDecode(response.body);
        return AdoptDeviceResponse(
          success: false,
          message: error['message'] ?? 'Erro ao adotar dispositivo',
        );
      }
    } catch (e) {
      print('❌ Erro ao adotar device: $e');
      return AdoptDeviceResponse(
        success: false,
        message: 'Erro ao adotar dispositivo: $e',
      );
    }
  }

  /// Gerar API Key para um device no backend (endpoint público)
  Future<String> generateApiKey({
    required String deviceId,
  }) async {
    try {
      print('Gerando API Key para device: $deviceId');
      
      final response = await _apiService.post(
        '/devices/$deviceId/generate-key',
        // Não enviar token - endpoint público
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final apiKey = data['apiKey'] as String;
        print('✅ API Key gerada: $apiKey');
        print('   Length: ${apiKey.length}');
        return apiKey;
      } else {
        print('❌ Erro ao gerar API Key: ${response.statusCode}');
        print('Response: ${response.body}');
        throw Exception('Erro ao gerar API Key: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao gerar API Key: $e');
      rethrow;
    }
  }

  /// Gerar API Key para um device com fingerprint (Edge-Go e outros)
  Future<Map<String, dynamic>> generateDeviceApiKey({
    required String authToken,
    required String fingerprint,
    String deviceType = 'edge-go',
  }) async {
    try {
      print('🔐 Gerando API Key para device...');
      print('   Fingerprint: $fingerprint');
      print('   Type: $deviceType');
      
      final response = await _apiService.post(
        '/devices/$fingerprint/generate-key',
        data: {
          'type': deviceType,
        },
        token: authToken,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        print('✅ API Key gerada: ${data['api_key']}');
        return data;
      } else {
        print('❌ Erro ao gerar API Key: ${response.statusCode}');
        print('Response: ${response.body}');
        throw Exception('Erro ao gerar API Key: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao gerar API Key: $e');
      rethrow;
    }
  }

  /// Excluir um device
  Future<bool> deleteDevice(String authToken, String deviceId) async {
    try {
      print('🗑️  [DeviceApiService] Excluindo device: $deviceId');
      print('🗑️  [DeviceApiService] Endpoint: /devices/$deviceId');
      
      final response = await _apiService.delete(
        '/devices/$deviceId',
        token: authToken,
      );

      print('🗑️  [DeviceApiService] Resposta: ${response.statusCode}');
      
      if (response.statusCode == 200 || response.statusCode == 204) {
        print('✅ [DeviceApiService] Device excluído com sucesso');
        return true;
      } else {
        print('⚠️  [DeviceApiService] Status inesperado: ${response.statusCode}');
        print('   Body: ${response.body}');
        return false;
      }
    } catch (e) {
      print('❌ [DeviceApiService] Erro ao excluir device: $e');
      print('   Stack: ${e.toString()}');
      return false;
    }
  }

  /// Listar devices do usuário logado
  Future<List<Map<String, dynamic>>> getMyDevices(String authToken) async {
    try {
      final response = await _apiService.get(
        '/devices',
        token: authToken,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.cast<Map<String, dynamic>>();
      } else {
        print('Erro ao buscar devices: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('Erro ao buscar devices: $e');
      return [];
    }
  }

  void dispose() {
    _apiService.dispose();
  }
}


