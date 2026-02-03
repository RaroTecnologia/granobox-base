import 'package:flutter/foundation.dart';
import '../models/operator_models.dart';

/// Provider para manter o operador atual e resolver permissões por nível
class OperatorSessionProvider extends ChangeNotifier {
  Operator? _currentOperator;

  Operator? get currentOperator => _currentOperator;
  bool get hasOperator => _currentOperator != null;
  String get accessLevel {
    return _normalizeAccessLevel(_currentOperator?.role);
  }

  /// Define operador atual
  void setCurrentOperator(Operator? operator) {
    _currentOperator = operator;
    notifyListeners();
  }

  /// Níveis suportados: basic, intermediate, advanced
  bool get isAdvanced => accessLevel == 'advanced';
  bool get isIntermediate => accessLevel == 'intermediate';
  bool get isBasic => accessLevel == 'basic';

  /// Regras de acesso por funcionalidade/aba
  /// Etiquetas (Nova Etiqueta) - permitido para todos os níveis, sempre true
  bool get canCreateLabel => true;

  /// Controle (lista/gestão) - exige operador selecionado e nível válido
  bool get canAccessControl => hasOperator && _hasAny(['basic', 'intermediate', 'advanced']);

  /// Cadastros de produto - permitido para intermediate e advanced
  bool get canAccessProducts => _hasAny(['intermediate', 'advanced']);

  /// Ajustes - apenas advanced (por segurança)
  bool get canAccessSettings => _hasAny(['advanced']);

  bool _hasAny(List<String> levels) {
    final level = accessLevel;
    return levels.contains(level);
  }

  String _normalizeAccessLevel(String? role) {
    if (role == null || role.trim().isEmpty) return 'basic';
    final r = role.trim().toLowerCase();
    if (r == 'advanced' || r == 'intermediate' || r == 'basic') return r;
    return 'basic';
  }

  /// Sincroniza o operador atual com uma lista atualizada de operadores
  /// Atualiza a sessão se encontrar o mesmo id com dados diferentes (ex.: role)
  void refreshFromOperators(List<Operator> operators) {
    if (_currentOperator == null) return;
    Operator? updated;
    for (final op in operators) {
      if (op.id == _currentOperator!.id) {
        updated = op;
        break;
      }
    }
    if (updated == null) return;
    final changed = (updated.role != _currentOperator!.role) ||
        (updated.isActive != _currentOperator!.isActive) ||
        (updated.name != _currentOperator!.name);
    if (changed) {
      _currentOperator = updated;
      notifyListeners();
    }
  }
}


