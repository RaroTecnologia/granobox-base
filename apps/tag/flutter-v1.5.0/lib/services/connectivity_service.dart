import 'dart:async';
import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class ConnectivityService {
  static final ConnectivityService _instance = ConnectivityService._internal();
  factory ConnectivityService() => _instance;
  ConnectivityService._internal();

  final Connectivity _connectivity = Connectivity();
  final StreamController<bool> _connectivityController = StreamController<bool>.broadcast();
  
  Stream<bool> get connectivityStream => _connectivityController.stream;
  
  bool _isConnected = true;
  bool get isConnected => _isConnected;
  
  bool _isInternetAvailable = true;
  bool get isInternetAvailable => _isInternetAvailable;
  
  bool _isAppReady = false;

  void initialize() {
    // ⚠️ DESABILITADO TEMPORARIAMENTE - Causando travamentos e falsos positivos
    print('🌐 [DESABILITADO] Monitor de conectividade desativado');
    
    // Sempre retornar como conectado
    _isConnected = true;
    _isInternetAvailable = true;
    _isAppReady = false; // Manter false para não ativar verificações
    
    /* CÓDIGO ORIGINAL COMENTADO:
    print('🌐 Inicializando monitor de conectividade...');
    
    // Aguardar 5 segundos antes de começar a verificar (app carregando)
    Timer(const Duration(seconds: 5), () {
      print('✅ App pronto - iniciando verificação de conectividade');
      _isAppReady = true;
      _checkConnectivity();
    });
    
    // Escutar mudanças de conectividade (somente se app estiver pronto)
    _connectivity.onConnectivityChanged.listen((List<ConnectivityResult> results) {
      if (_isAppReady) {
        print('🔄 Mudança de conectividade detectada: $results');
        _checkConnectivity();
      }
    });
    
    // Verificar conectividade periodicamente (a cada 30 segundos, somente se app estiver pronto)
    Timer.periodic(const Duration(seconds: 30), (timer) {
      if (_isAppReady) {
        _checkConnectivity();
      }
    });
    */
  }

  Future<void> _checkConnectivity() async {
    try {
      // Verificar se há conexão de rede
      final connectivityResults = await _connectivity.checkConnectivity();
      print('📡 Status de conectividade: $connectivityResults');
      
      bool hasNetworkConnection = connectivityResults.isNotEmpty && 
          connectivityResults.any((result) => result != ConnectivityResult.none);
      
      if (hasNetworkConnection) {
        // Se há conexão de rede, verificar se a internet está funcionando
        await _checkInternetConnection();
      } else {
        print('❌ Sem conexão de rede');
        _updateConnectivityStatus(false, false);
      }
    } catch (e) {
      print('❌ Erro ao verificar conectividade: $e');
      _updateConnectivityStatus(false, false);
    }
  }

  Future<void> _checkInternetConnection() async {
    try {
      print('🌐 Verificando conexão com a internet...');
      
      // Tentar fazer uma requisição para um serviço confiável
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/health'),
        headers: {'Accept': 'application/json'},
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          print('⏰ Timeout na verificação de internet');
          return http.Response('Timeout', 408);
        },
      );
      
      bool internetWorking = response.statusCode == 200;
      print('🌐 Internet funcionando: $internetWorking (Status: ${response.statusCode})');
      
      _updateConnectivityStatus(true, internetWorking);
    } catch (e) {
      print('❌ Erro ao verificar internet: $e');
      _updateConnectivityStatus(true, false);
    }
  }

  void _updateConnectivityStatus(bool hasNetwork, bool hasInternet) {
    bool wasConnected = _isConnected;
    _isConnected = hasNetwork && hasInternet;
    _isInternetAvailable = hasInternet;
    
    // Só notificar mudanças se o app estiver pronto
    if (_isAppReady && wasConnected != _isConnected) {
      print('🔄 Status de conectividade mudou: ${_isConnected ? "✅ Conectado" : "❌ Desconectado"}');
      _connectivityController.add(_isConnected);
    }
  }

  // Método para verificar conectividade manualmente
  Future<bool> checkConnectivityManually() async {
    await _checkConnectivity();
    return _isConnected;
  }

  // Método para verificar se é um erro de conectividade
  bool isConnectivityError(dynamic error) {
    if (error is SocketException) {
      print('🔌 Erro de socket detectado: $error');
      return true;
    }
    
    if (error.toString().toLowerCase().contains('network') ||
        error.toString().toLowerCase().contains('connection') ||
        error.toString().toLowerCase().contains('timeout') ||
        error.toString().toLowerCase().contains('unreachable')) {
      print('🌐 Erro de conectividade detectado: $error');
      return true;
    }
    
    return false;
  }

  void dispose() {
    _connectivityController.close();
  }
}

