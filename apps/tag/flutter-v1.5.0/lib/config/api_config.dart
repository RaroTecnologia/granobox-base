import '../services/environment_service.dart';

/// Configuração centralizada da API
/// ⭐ Agora suporta múltiplos ambientes via EnvironmentService
class ApiConfig {
  // 🌐 URL base da API - Dinâmica baseada no ambiente
  static String get baseUrl => EnvironmentService.baseUrl;
  
  // URLs específicas
  static String get granoboxApiUrl => baseUrl;
  static const String tagmentApiUrl = 'https://api.tagment.com.br/v1';
  
  // Configurações de timeout
  static const Duration defaultTimeout = Duration(seconds: 30);
  static const Duration shortTimeout = Duration(seconds: 10);
  
  // Headers padrão
  static const Map<String, String> defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // Métodos utilitários
  static Map<String, String> getAuthHeaders(String token) {
    return {
      ...defaultHeaders,
      'Authorization': 'Bearer $token',
    };
  }
  
  // URLs completas para endpoints específicos
  static String get printersUrl => '$baseUrl/printers';
  static String get devicesUrl => '$baseUrl/devices';
  static String get authUrl => '$baseUrl/auth';
  static String get labelsUrl => '$baseUrl/labels';
  static String get mqttUrl => '$baseUrl/mqtt';
  static String get edgeGoWsUrl => '$baseUrl/edge-go-ws';
  
  // WebSocket URLs
  static String get wsBaseUrl => baseUrl.replaceFirst('http', 'ws');
  static String get edgeGoWebSocketUrl => EnvironmentService.wsUrl;
  
  // ⭐ Helpers para debug
  static bool get isStaging => EnvironmentService.isStaging;
  static String get environmentName => EnvironmentService.environmentName;
}
