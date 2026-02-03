import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import '../config/app_config.dart';
import '../services/auth_service.dart';

class EdgeStatusService {
  static const String _mqttEndpoint = '/mqtt';
  final AuthService _authService = AuthService();

  /// Verificar status de um Edge-Go via MQTT ping
  /// Envia um comando ping e aguarda resposta
  Future<EdgeGoStatus> checkEdgeGoStatus(String deviceId) async {
    try {
      final token = await _authService.getAuthToken();
      if (token == null) {
        throw Exception('Token de autenticação não encontrado');
      }

      debugPrint('🏓 EdgeStatusService - Enviando ping MQTT para: $deviceId');
      
      // Enviar ping via MQTT
      final url = Uri.parse('${AppConfig.apiBaseUrl}$_mqttEndpoint/ping');
      
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'deviceId': deviceId,
          'timeout': 5000, // 5 segundos timeout
        }),
      ).timeout(
        const Duration(seconds: 8), // Timeout total da requisição
        onTimeout: () {
          throw Exception('Timeout ao verificar status');
        },
      );

      debugPrint('🏓 EdgeStatusService - Resposta ping: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final isOnline = data['online'] == true;
        final responseTime = data['responseTime'] as int?;
        
        debugPrint('🏓 EdgeStatusService - $deviceId: ${isOnline ? "ONLINE" : "OFFLINE"}');
        if (responseTime != null) {
          debugPrint('🏓 EdgeStatusService - Tempo resposta: ${responseTime}ms');
        }
        
        return EdgeGoStatus(
          deviceId: deviceId,
          isOnline: isOnline,
          responseTime: responseTime,
          lastCheck: DateTime.now(),
          method: 'mqtt_ping',
        );
      } else {
        throw Exception('Erro na verificação: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('❌ Erro ao verificar status $deviceId via MQTT: ${e.toString()}');
      
      // Se MQTT falhar, tentar BLE scan rápido
      return await _checkViaBLE(deviceId);
    }
  }

  /// Verificar status via BLE scan rápido (fallback)
  Future<EdgeGoStatus> _checkViaBLE(String deviceId) async {
    try {
      debugPrint('📡 EdgeStatusService - Tentando BLE scan para: $deviceId');
      
      // TODO: Implementar scan BLE rápido
      // Por enquanto, retorna offline
      
      return EdgeGoStatus(
        deviceId: deviceId,
        isOnline: false,
        responseTime: null,
        lastCheck: DateTime.now(),
        method: 'ble_scan',
        error: 'BLE scan não implementado ainda',
      );
    } catch (e) {
      debugPrint('❌ Erro no BLE scan $deviceId: ${e.toString()}');
      
      return EdgeGoStatus(
        deviceId: deviceId,
        isOnline: false,
        responseTime: null,
        lastCheck: DateTime.now(),
        method: 'error',
        error: e.toString(),
      );
    }
  }

  /// Verificar status de múltiplos dispositivos em paralelo
  Future<Map<String, EdgeGoStatus>> checkMultipleDevices(List<String> deviceIds) async {
    debugPrint('🔍 EdgeStatusService - Verificando ${deviceIds.length} dispositivos...');
    
    final Map<String, EdgeGoStatus> results = {};
    
    // Executar verificações em paralelo
    final futures = deviceIds.map((deviceId) => checkEdgeGoStatus(deviceId));
    final statuses = await Future.wait(futures);
    
    // Mapear resultados
    for (int i = 0; i < deviceIds.length; i++) {
      results[deviceIds[i]] = statuses[i];
    }
    
    final onlineCount = results.values.where((status) => status.isOnline).length;
    debugPrint('🔍 EdgeStatusService - Resultado: $onlineCount/${deviceIds.length} online');
    
    return results;
  }
}

class EdgeGoStatus {
  final String deviceId;
  final bool isOnline;
  final int? responseTime; // em millisegundos
  final DateTime lastCheck;
  final String method; // 'mqtt_ping', 'ble_scan', 'error'
  final String? error;

  EdgeGoStatus({
    required this.deviceId,
    required this.isOnline,
    this.responseTime,
    required this.lastCheck,
    required this.method,
    this.error,
  });

  /// Status formatado para exibição
  String get displayStatus {
    if (error != null) {
      return 'Erro na verificação';
    }
    
    if (isOnline) {
      if (responseTime != null) {
        return 'Online (${responseTime}ms)';
      } else {
        return 'Online';
      }
    } else {
      switch (method) {
        case 'mqtt_ping':
          return 'Offline (MQTT)';
        case 'ble_scan':
          return 'Offline (BLE)';
        default:
          return 'Offline';
      }
    }
  }

  /// Ícone baseado no método de verificação
  String get methodIcon {
    switch (method) {
      case 'mqtt_ping':
        return '📡'; // MQTT
      case 'ble_scan':
        return '📶'; // BLE
      case 'error':
        return '❌'; // Erro
      default:
        return '❓'; // Desconhecido
    }
  }
}





