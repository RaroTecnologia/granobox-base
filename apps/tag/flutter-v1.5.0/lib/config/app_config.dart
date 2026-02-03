/// Configuração da aplicação
import 'api_config.dart';

class AppConfig {
  // ⭐ NOVO: URL da API centralizada
  static String get apiBaseUrl => ApiConfig.baseUrl;
  
  // OpenAI API Configuration
  static const String openAiApiKey = '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';
  static const String openAiModel = 'gpt-4o-mini'; // Modelo com suporte a visão
  
  // Configurações da aplicação
  static Map<String, dynamic> get config => {
    'apiUrl': apiBaseUrl,
    'timeout': 30000, // 30 segundos
    'retryAttempts': 3,
    'debugMode': false,
  };
  
  // Método para obter URL completa
  static String getFullUrl(String endpoint) {
    final baseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.substring(0, apiBaseUrl.length - 1) : apiBaseUrl;
    final cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/$endpoint';
    return '$baseUrl$cleanEndpoint';
  }
}
