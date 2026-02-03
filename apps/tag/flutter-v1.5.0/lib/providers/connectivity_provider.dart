import 'dart:async';
import 'package:flutter/foundation.dart';
import '../services/connectivity_service.dart';

class ConnectivityProvider extends ChangeNotifier {
  final ConnectivityService _connectivityService = ConnectivityService();
  
  bool _isConnected = true;
  bool _isInitialized = false;
  String? _lastError;
  bool _showDisconnectedBanner = false;
  
  // Stream subscription
  StreamSubscription<bool>? _connectivitySubscription;
  Timer? _disconnectionTimer;

  bool get isConnected => _isConnected;
  bool get isInitialized => _isInitialized;
  String? get lastError => _lastError;
  
  bool get isDisconnected => !_isConnected;
  // ⚠️ DESABILITADO TEMPORARIAMENTE - Modal não está funcionando bem
  bool get showDisconnectedBanner => false; // _showDisconnectedBanner;

  void initialize() {
    if (_isInitialized) return;
    
    print('🌐 Inicializando ConnectivityProvider...');
    
    // Inicializar o serviço de conectividade
    _connectivityService.initialize();
    
    // Escutar mudanças de conectividade
    _connectivitySubscription = _connectivityService.connectivityStream.listen(
      (isConnected) {
        print('🔄 ConnectivityProvider: Status mudou para ${isConnected ? "conectado" : "desconectado"}');
        
        _isConnected = isConnected;
        
        if (!isConnected) {
          _lastError = 'Sem conexão com a internet';
          // Iniciar timer de 10 segundos para mostrar o banner
          _startDisconnectionTimer();
        } else {
          _lastError = null;
          // Cancelar timer e esconder banner imediatamente ao reconectar
          _cancelDisconnectionTimer();
          _showDisconnectedBanner = false;
        }
        
        notifyListeners();
      },
      onError: (error) {
        print('❌ Erro no stream de conectividade: $error');
        _lastError = 'Erro ao verificar conectividade';
        notifyListeners();
      },
    );
    
    _isInitialized = true;
    notifyListeners();
  }

  // Iniciar timer de desconexão (10 segundos)
  void _startDisconnectionTimer() {
    _cancelDisconnectionTimer(); // Cancelar timer anterior se existir
    
    print('⏰ Iniciando timer de desconexão (10 segundos)...');
    _disconnectionTimer = Timer(const Duration(seconds: 10), () {
      if (!_isConnected) {
        print('⚠️ Exibindo banner de desconexão após 10 segundos');
        _showDisconnectedBanner = true;
        notifyListeners();
      }
    });
  }
  
  // Cancelar timer de desconexão
  void _cancelDisconnectionTimer() {
    if (_disconnectionTimer?.isActive == true) {
      print('✅ Cancelando timer de desconexão');
      _disconnectionTimer?.cancel();
    }
    _disconnectionTimer = null;
  }

  // Verificar conectividade manualmente
  Future<bool> checkConnectivity() async {
    try {
      final isConnected = await _connectivityService.checkConnectivityManually();
      _isConnected = isConnected;
      
      if (!isConnected) {
        _lastError = 'Sem conexão com a internet';
        _startDisconnectionTimer();
      } else {
        _lastError = null;
        _cancelDisconnectionTimer();
        _showDisconnectedBanner = false;
      }
      
      notifyListeners();
      return isConnected;
    } catch (e) {
      print('❌ Erro ao verificar conectividade: $e');
      _lastError = 'Erro ao verificar conectividade';
      _isConnected = false;
      _startDisconnectionTimer();
      notifyListeners();
      return false;
    }
  }

  // Verificar se um erro é relacionado à conectividade
  bool isConnectivityError(dynamic error) {
    return _connectivityService.isConnectivityError(error);
  }

  // Obter mensagem de erro apropriada
  String getErrorMessage(dynamic error) {
    if (isConnectivityError(error)) {
      return 'Sem conexão com a internet. Verifique sua conexão WiFi e tente novamente.';
    }
    
    if (error.toString().contains('401')) {
      return 'Não autorizado. Faça login novamente.';
    }
    
    if (error.toString().contains('403')) {
      return 'Acesso negado. Verifique suas permissões.';
    }
    
    if (error.toString().contains('404')) {
      return 'Recurso não encontrado.';
    }
    
    if (error.toString().contains('500')) {
      return 'Erro interno do servidor. Tente novamente mais tarde.';
    }
    
    return 'Erro inesperado. Tente novamente.';
  }

  @override
  void dispose() {
    _connectivitySubscription?.cancel();
    _cancelDisconnectionTimer();
    _connectivityService.dispose();
    super.dispose();
  }
}


