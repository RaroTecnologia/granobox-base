import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

/// Serviço para gerenciamento de firmware dos dispositivos
class FirmwareService {
  // Construtor básico
  FirmwareService();
  
  // Métodos básicos (implementar conforme necessário)
  Future<void> checkFirmwareVersion(String deviceId) async {
    // TODO: Implementar verificação de firmware
  }
  
  Future<void> updateFirmware(String deviceId) async {
    // TODO: Implementar atualização de firmware
  }
  
  /// Busca a versão do firmware do dispositivo
  /// Primeiro tenta buscar do banco (campo version), depois tenta via WebSocket se necessário
  Future<DeviceFirmwareInfo?> getDeviceFirmwareVersion(String deviceId, String token) async {
    try {
      // 1. Buscar versão do banco de dados (vem no GET /devices)
      final response = await http.get(
        Uri.parse('${AppConfig.apiBaseUrl}/devices'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final List<dynamic> devices = jsonDecode(response.body);
        final device = devices.firstWhere(
          (d) => d['deviceId'] == deviceId,
          orElse: () => null,
        );
        
        if (device != null && device['version'] != null) {
          final version = device['version'] as String;
          if (version.isNotEmpty && version != 'null') {
            print('✅ Versão encontrada no banco: $version');
            return DeviceFirmwareInfo(
              currentVersion: version,
              displayVersion: version,
              versionStatus: 'Atualizado',
            );
          }
        }
      }
      
      // 2. Fallback: tentar buscar via WebSocket (para versão em tempo real)
      print('⚠️ Versão não encontrada no banco, tentando via WebSocket...');
      return await refreshDeviceFirmwareVersion(deviceId, token);
    } catch (e) {
      print('❌ Erro ao buscar versão do dispositivo: $e');
      return null;
    }
  }
  
  /// Atualiza a versão do firmware via WebSocket (força verificação em tempo real)
  Future<DeviceFirmwareInfo?> refreshDeviceFirmwareVersion(String deviceId, String token) async {
    try {
      // Tentar buscar via endpoint WebSocket que força verificação
      final response = await http.get(
        Uri.parse('${AppConfig.apiBaseUrl}/edge-go-ws/device/$deviceId/version'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 15));
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        // O endpoint retorna: { version: "1.0.4", deviceId: "...", ... }
        if (data['version'] != null) {
          final version = data['version'] as String;
          print('✅ Versão obtida via WebSocket: $version');
          return DeviceFirmwareInfo(
            currentVersion: version,
            displayVersion: version,
            versionStatus: 'Atualizado',
          );
        }
      }
      
      print('⚠️ Não foi possível obter versão via WebSocket');
      return null;
    } catch (e) {
      print('❌ Erro ao atualizar versão via WebSocket: $e');
      return null;
    }
  }
}

/// Modelo básico para informações de firmware
class DeviceFirmwareInfo {
  final String currentVersion;
  final String displayVersion;
  final String versionStatus;
  final DateTime? lastCheck;
  final DateTime? lastVersionCheck;
  final String? latestVersion;
  final Map<String, dynamic>? metadata;
  final bool needsUpdate;
  final bool isDevelopmentVersion;
  
  DeviceFirmwareInfo({
    required this.currentVersion,
    required this.displayVersion,
    required this.versionStatus,
    this.lastCheck,
    this.lastVersionCheck,
    this.latestVersion,
    this.metadata,
    this.needsUpdate = false,
    this.isDevelopmentVersion = false,
  });
}
