import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import '../config/app_config.dart';
import '../services/auth_service.dart';

class EdgeGoDevice {
  final String id;
  final String deviceId;
  final String? name;
  final String status;
  final DateTime? lastSeenAt;
  final String? lastIpAddress;
  final DateTime createdAt;
  final DateTime updatedAt;

  EdgeGoDevice({
    required this.id,
    required this.deviceId,
    this.name,
    required this.status,
    this.lastSeenAt,
    this.lastIpAddress,
    required this.createdAt,
    required this.updatedAt,
  });

  factory EdgeGoDevice.fromJson(Map<String, dynamic> json) {
    return EdgeGoDevice(
      id: json['id'],
      deviceId: json['deviceId'],
      name: json['name'],
      status: json['status'] ?? 'active',
      lastSeenAt: json['lastSeenAt'] != null 
          ? DateTime.parse(json['lastSeenAt']) 
          : null,
      lastIpAddress: json['lastIpAddress'],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  /// Determina se o dispositivo está online baseado no lastSeenAt
  /// Considera online se teve heartbeat nos últimos 5 minutos
  bool get isOnline {
    if (lastSeenAt == null) return false;
    
    final now = DateTime.now();
    final difference = now.difference(lastSeenAt!);
    
    // Considera online se teve heartbeat nos últimos 5 minutos
    return difference.inMinutes <= 5;
  }

  /// Status formatado para exibição
  String get displayStatus {
    if (isOnline) {
      return 'Online';
    } else if (lastSeenAt != null) {
      final now = DateTime.now();
      final difference = now.difference(lastSeenAt!);
      
      if (difference.inMinutes < 60) {
        return 'Offline (${difference.inMinutes}min atrás)';
      } else if (difference.inHours < 24) {
        return 'Offline (${difference.inHours}h atrás)';
      } else {
        return 'Offline (${difference.inDays}d atrás)';
      }
    } else {
      return 'Nunca conectado';
    }
  }
}

class DevicesService {
  static const String _endpoint = '/devices';
  final AuthService _authService = AuthService();

  /// Buscar dispositivos Edge-Go de um cliente
  Future<List<EdgeGoDevice>> getEdgeGoDevicesByClient(String clientId) async {
    try {
      final token = await _authService.getAuthToken();
      if (token == null) {
        throw Exception('Token de autenticação não encontrado');
      }

      final url = Uri.parse('${AppConfig.apiBaseUrl}$_endpoint/client/$clientId/edge-go');
      debugPrint('🔍 DevicesService - Buscando Edge-Go devices: $url');
      
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      debugPrint('🔍 DevicesService - Resposta API: ${response.statusCode}');

      if (response.statusCode == 200) {
        final List<dynamic> jsonList = jsonDecode(response.body);
        final devices = jsonList.map((json) => EdgeGoDevice.fromJson(json)).toList();
        
        debugPrint('🔍 DevicesService - ${devices.length} dispositivos encontrados');
        for (final device in devices) {
          debugPrint('   📱 ${device.deviceId}: ${device.displayStatus}');
        }
        
        return devices;
      } else {
        throw Exception('Erro ao buscar dispositivos: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('❌ Erro ao buscar dispositivos Edge-Go: ${e.toString()}');
      rethrow;
    }
  }

  /// Buscar status de um dispositivo específico pelo deviceId
  Future<EdgeGoDevice?> getDeviceStatus(String clientId, String deviceId) async {
    try {
      final devices = await getEdgeGoDevicesByClient(clientId);
      return devices.where((device) => device.deviceId == deviceId).firstOrNull;
    } catch (e) {
      debugPrint('❌ Erro ao buscar status do dispositivo $deviceId: ${e.toString()}');
      return null;
    }
  }

  /// Criar um mapa de deviceId -> status para facilitar consultas
  Future<Map<String, EdgeGoDevice>> getDeviceStatusMap(String clientId) async {
    try {
      final devices = await getEdgeGoDevicesByClient(clientId);
      final Map<String, EdgeGoDevice> statusMap = {};
      
      for (final device in devices) {
        statusMap[device.deviceId] = device;
      }
      
      return statusMap;
    } catch (e) {
      debugPrint('❌ Erro ao criar mapa de status: ${e.toString()}');
      return {};
    }
  }
}





