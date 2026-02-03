import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Provider para gerenciar configurações locais de impressão
class PrintConfigProvider extends ChangeNotifier {
  static const String _keyUpdateDateOnReprint = 'print_config_update_date_on_reprint';
  
  bool _updateDateOnReprint = false;
  bool _isLoading = false;

  /// Quando true, permite alterar a data de manipulação na reimpressão
  bool get updateDateOnReprint => _updateDateOnReprint;
  bool get isLoading => _isLoading;

  PrintConfigProvider() {
    _loadConfig();
  }

  /// Carrega as configurações do SharedPreferences
  Future<void> _loadConfig() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      _updateDateOnReprint = prefs.getBool(_keyUpdateDateOnReprint) ?? false;
      print('🖨️ [PrintConfig] Configuração carregada: updateDateOnReprint=$_updateDateOnReprint');
    } catch (e) {
      print('❌ [PrintConfig] Erro ao carregar configuração: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Atualiza a configuração de alterar data na reimpressão
  Future<void> setUpdateDateOnReprint(bool value) async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_keyUpdateDateOnReprint, value);
      _updateDateOnReprint = value;
      print('🖨️ [PrintConfig] Configuração salva: updateDateOnReprint=$value');
    } catch (e) {
      print('❌ [PrintConfig] Erro ao salvar configuração: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Recarrega as configurações
  Future<void> reload() async {
    await _loadConfig();
  }
}



