import 'package:flutter/foundation.dart';
import '../models/tagment_printer_config_models.dart';
import '../services/tagment_printer_config_service.dart';
import 'auth_provider.dart';

class TagmentPrinterConfigProvider extends ChangeNotifier {
  final TagmentPrinterConfigService _configService = TagmentPrinterConfigService();
  final AuthProvider _authProvider;

  TagmentPrinterConfig? _config;
  bool _isLoading = false;
  String? _error;

  TagmentPrinterConfigProvider(this._authProvider);

  // Getters
  TagmentPrinterConfig? get config => _config;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasValidadePrinter => _config?.hasValidadePrinter ?? false;
  bool get hasRotuloPrinter => _config?.hasRotuloPrinter ?? false;
  bool get hasAnyPrinter => _config?.hasAnyPrinter ?? false;

  /// Carregar configuração de impressoras
  Future<void> loadConfig() async {
    final authToken = await _authProvider.authToken;
    if (authToken == null) {
      _error = 'Token de autenticação não encontrado';
      notifyListeners();
      return;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      print('🔧 TagmentPrinterConfigProvider - Carregando configuração...');
      
      final config = await _configService.getTagmentPrinterConfig(authToken);
      
      if (config != null) {
        _config = config;
        print('✅ Configuração carregada: $config');
      } else {
        _error = 'Falha ao carregar configuração';
        print('❌ Erro ao carregar configuração');
      }
    } catch (e) {
      _error = 'Erro ao carregar configuração: $e';
      print('❌ Erro ao carregar configuração: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Definir impressora de validade
  Future<bool> setValidadePrinter(String printerId) async {
    final authToken = await _authProvider.authToken;
    if (authToken == null) {
      _error = 'Token de autenticação não encontrado';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      print('🔧 TagmentPrinterConfigProvider - Definindo impressora de validade: $printerId');
      
      final success = await _configService.setValidadePrinter(
        authToken: authToken,
        printerId: printerId,
      );
      
      if (success) {
        // Recarregar configuração
        await loadConfig();
        print('✅ Impressora de validade definida com sucesso');
      } else {
        _error = 'Falha ao definir impressora de validade';
        print('❌ Erro ao definir impressora de validade');
      }
      
      return success;
    } catch (e) {
      _error = 'Erro ao definir impressora de validade: $e';
      print('❌ Erro ao definir impressora de validade: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Definir impressora de rótulo
  Future<bool> setRotuloPrinter(String printerId) async {
    final authToken = await _authProvider.authToken;
    if (authToken == null) {
      _error = 'Token de autenticação não encontrado';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      print('🔧 TagmentPrinterConfigProvider - Definindo impressora de rótulo: $printerId');
      
      final success = await _configService.setRotuloPrinter(
        authToken: authToken,
        printerId: printerId,
      );
      
      if (success) {
        // Recarregar configuração
        await loadConfig();
        print('✅ Impressora de rótulo definida com sucesso');
      } else {
        _error = 'Falha ao definir impressora de rótulo';
        print('❌ Erro ao definir impressora de rótulo');
      }
      
      return success;
    } catch (e) {
      _error = 'Erro ao definir impressora de rótulo: $e';
      print('❌ Erro ao definir impressora de rótulo: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Remover impressora de validade
  Future<bool> removeValidadePrinter() async {
    final authToken = await _authProvider.authToken;
    if (authToken == null) {
      _error = 'Token de autenticação não encontrado';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      print('🔧 TagmentPrinterConfigProvider - Removendo impressora de validade');
      
      final success = await _configService.removeValidadePrinter(authToken);
      
      if (success) {
        // Recarregar configuração
        await loadConfig();
        print('✅ Impressora de validade removida com sucesso');
      } else {
        _error = 'Falha ao remover impressora de validade';
        print('❌ Erro ao remover impressora de validade');
      }
      
      return success;
    } catch (e) {
      _error = 'Erro ao remover impressora de validade: $e';
      print('❌ Erro ao remover impressora de validade: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Remover impressora de rótulo
  Future<bool> removeRotuloPrinter() async {
    final authToken = await _authProvider.authToken;
    if (authToken == null) {
      _error = 'Token de autenticação não encontrado';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      print('🔧 TagmentPrinterConfigProvider - Removendo impressora de rótulo');
      
      final success = await _configService.removeRotuloPrinter(authToken);
      
      if (success) {
        // Recarregar configuração
        await loadConfig();
        print('✅ Impressora de rótulo removida com sucesso');
      } else {
        _error = 'Falha ao remover impressora de rótulo';
        print('❌ Erro ao remover impressora de rótulo');
      }
      
      return success;
    } catch (e) {
      _error = 'Erro ao remover impressora de rótulo: $e';
      print('❌ Erro ao remover impressora de rótulo: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Verificar se uma impressora é de validade
  bool isValidadePrinter(String printerId) {
    return _config?.tagmentPrinterValidadeId == printerId;
  }

  /// Verificar se uma impressora é de rótulo
  bool isRotuloPrinter(String printerId) {
    return _config?.tagmentPrinterRotuloId == printerId;
  }

  /// Obter ID da impressora de validade
  String? getValidadePrinterId() {
    return _config?.tagmentPrinterValidadeId;
  }

  /// Obter ID da impressora de rótulo
  String? getRotuloPrinterId() {
    return _config?.tagmentPrinterRotuloId;
  }

  /// Limpar estado
  void clear() {
    _config = null;
    _isLoading = false;
    _error = null;
    notifyListeners();
  }
}
