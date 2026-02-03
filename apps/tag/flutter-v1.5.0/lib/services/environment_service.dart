import 'package:shared_preferences/shared_preferences.dart';

/// Enum para os ambientes disponíveis
enum AppEnvironment {
  production,
  staging,
}

/// Serviço para gerenciar o ambiente da aplicação (escondido)
class EnvironmentService {
  static const String _envKey = 'app_environment';
  static const String _devModeKey = 'developer_mode_enabled';
  
  static AppEnvironment _currentEnv = AppEnvironment.production;
  static bool _devModeEnabled = false;
  static bool _initialized = false;
  
  /// Ambiente atual
  static AppEnvironment get currentEnvironment => _currentEnv;
  
  /// Verifica se modo desenvolvedor está habilitado
  static bool get isDeveloperModeEnabled => _devModeEnabled;
  
  /// Verifica se está em staging
  static bool get isStaging => _currentEnv == AppEnvironment.staging;
  
  /// Verifica se está em produção
  static bool get isProduction => _currentEnv == AppEnvironment.production;
  
  /// URLs por ambiente
  static String get baseUrl {
    switch (_currentEnv) {
      case AppEnvironment.staging:
        return 'https://staging.granobox.com.br';
      case AppEnvironment.production:
        return 'https://api.granobox.com.br';
    }
  }
  
  /// URL do WebSocket por ambiente
  static String get wsUrl {
    switch (_currentEnv) {
      case AppEnvironment.staging:
        return 'wss://edge.granobox.com.br/edge-go-ws';
      case AppEnvironment.production:
        return 'wss://edge.granobox.com.br/edge-go-ws';
    }
  }
  
  /// Nome do ambiente para exibição
  static String get environmentName {
    switch (_currentEnv) {
      case AppEnvironment.staging:
        return 'STAGING';
      case AppEnvironment.production:
        return 'PRODUÇÃO';
    }
  }
  
  /// Cor do ambiente para indicador visual
  static int get environmentColor {
    switch (_currentEnv) {
      case AppEnvironment.staging:
        return 0xFFFF9800; // Orange
      case AppEnvironment.production:
        return 0xFF4CAF50; // Green
    }
  }
  
  /// Inicializa o serviço - chamar no startup do app
  static Future<void> initialize() async {
    if (_initialized) return;
    
    final prefs = await SharedPreferences.getInstance();
    
    // Carregar modo desenvolvedor
    _devModeEnabled = prefs.getBool(_devModeKey) ?? false;
    
    // Carregar ambiente (só aplica se dev mode estiver habilitado)
    if (_devModeEnabled) {
      final envIndex = prefs.getInt(_envKey) ?? 0;
      _currentEnv = AppEnvironment.values[envIndex];
    } else {
      _currentEnv = AppEnvironment.production;
    }
    
    _initialized = true;
    print('🌍 Ambiente: ${_currentEnv.name} | Dev Mode: $_devModeEnabled');
  }
  
  /// Habilita o modo desenvolvedor (chamado pelo easter egg)
  static Future<void> enableDeveloperMode() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_devModeKey, true);
    _devModeEnabled = true;
    print('🔓 Modo desenvolvedor HABILITADO');
  }
  
  /// Desabilita o modo desenvolvedor
  static Future<void> disableDeveloperMode() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_devModeKey, false);
    await prefs.setInt(_envKey, AppEnvironment.production.index);
    _devModeEnabled = false;
    _currentEnv = AppEnvironment.production;
    print('🔒 Modo desenvolvedor DESABILITADO');
  }
  
  /// Altera o ambiente (requer reiniciar o app para aplicar completamente)
  static Future<void> setEnvironment(AppEnvironment env) async {
    if (!_devModeEnabled) {
      print('⚠️ Modo desenvolvedor não está habilitado');
      return;
    }
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_envKey, env.index);
    _currentEnv = env;
    print('🌍 Ambiente alterado para: ${env.name}');
  }
}
