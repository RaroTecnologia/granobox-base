import 'package:flutter/foundation.dart';
import '../models/date_config_models.dart';
import '../services/date_config_service.dart';

class DateConfigProvider extends ChangeNotifier {
  final DateConfigService _dateConfigService = DateConfigService();
  
  DateConfig? _dateConfig;
  bool _isLoading = false;
  String? _error;

  DateConfig? get dateConfig => _dateConfig;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  bool get showTimeInDates => _dateConfig?.showTimeInDates ?? true;
  String get dateFormat => _dateConfig?.dateFormat ?? 'dd/MM/yyyy HH:mm';

  /// Carregar configuração de datas
  Future<void> loadDateConfig(String authToken) async {
    _setLoading(true);
    _error = null;

    try {
      _dateConfig = await _dateConfigService.getDateConfig(authToken);
      if (_dateConfig == null) {
        _error = 'Falha ao carregar configuração de datas';
      }
    } catch (e) {
      _error = 'Erro ao carregar configuração: $e';
    } finally {
      _setLoading(false);
    }
  }

  /// Atualizar toggle de exibir hora
  Future<bool> updateShowTimeToggle(String authToken, bool showTime) async {
    _setLoading(true);
    _error = null;

    try {
      // Enviar também o dateFormat atual para evitar validações no backend
      final req = UpdateDateConfigRequest(
        showTimeInDates: showTime,
        dateFormat: _dateConfig?.dateFormat,
      );

      final updated = await _dateConfigService.updateDateConfig(
        authToken: authToken,
        request: req,
      );

      final success = updated != null;
      if (success) {
        // Recarregar configuração para obter dados atualizados
        await loadDateConfig(authToken);
      } else {
        _error = 'Falha ao atualizar configuração';
      }

      return success;
    } catch (e) {
      _error = 'Erro ao atualizar configuração: $e';
      return false;
    } finally {
      _setLoading(false);
    }
  }

  /// Atualizar formato de data
  Future<bool> updateDateFormat(String authToken, String format) async {
    _setLoading(true);
    _error = null;

    try {
      final request = UpdateDateConfigRequest(dateFormat: format);
      final result = await _dateConfigService.updateDateConfig(
        authToken: authToken,
        request: request,
      );

      if (result != null) {
        _dateConfig = result;
        notifyListeners();
        return true;
      } else {
        _error = 'Falha ao atualizar formato de data';
        return false;
      }
    } catch (e) {
      _error = 'Erro ao atualizar formato: $e';
      return false;
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
