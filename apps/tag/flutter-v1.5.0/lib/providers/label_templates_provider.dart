import 'package:flutter/foundation.dart';
import '../models/label_template_models.dart';
import '../services/label_templates_service.dart';

class LabelTemplatesProvider extends ChangeNotifier {
  final LabelTemplatesService _service = LabelTemplatesService();

  List<LabelTemplate> _templates = [];
  LabelTemplate? _templateAtual;
  RenderableSchema? _schemaAtual;
  Map<String, dynamic> _valoresFormulario = {};
  bool _isLoading = false;
  String? _error;

  // Getters
  List<LabelTemplate> get templates => _templates;
  LabelTemplate? get templateAtual => _templateAtual;
  RenderableSchema? get schemaAtual => _schemaAtual;
  Map<String, dynamic> get valoresFormulario => _valoresFormulario;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasTemplates => _templates.isNotEmpty;

  /// Carregar rótulos do cliente
  Future<void> carregarRotulos({
    required String clientId,
    String? authToken,
    bool includeInactive = false,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      print('🏷️ Carregando rótulos do cliente...');
      _templates = await _service.listarRotulos(
        clientId: clientId,
        authToken: authToken,
        includeInactive: includeInactive,
      );
      print('✅ ${_templates.length} rótulos carregados');
      notifyListeners();
    } catch (e) {
      _setError('Erro ao carregar rótulos: $e');
      print('❌ Erro ao carregar rótulos: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Selecionar template e carregar schema
  Future<void> selecionarTemplate({
    required String templateId,
    required String clientId,
    String? productId,
    String? authToken,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      print('🏷️ Carregando schema do rótulo $templateId...');
      
      // Buscar template
      _templateAtual = _templates.firstWhere((t) => t.id == templateId);
      
      // Buscar schema renderizável com auto-fill
      _schemaAtual = await _service.obterSchemaRenderizavel(
        labelId: templateId,
        clientId: clientId,
        productId: productId,
        authToken: authToken,
      );

      // Inicializar valores do formulário com auto-fill e defaults
      _valoresFormulario.clear();
      
      // Auto-filled values da API
      if (_schemaAtual!.autoFilledValues != null) {
        _valoresFormulario.addAll(_schemaAtual!.autoFilledValues!);
        print('✅ Valores auto-preenchidos: ${_schemaAtual!.autoFilledValues!.keys}');
      }

      // Default values dos campos
      for (final field in _schemaAtual!.schema.fields) {
        if (!_valoresFormulario.containsKey(field.name) && field.defaultValue != null) {
          _valoresFormulario[field.name] = field.defaultValue;
        }
      }

      print('✅ Schema carregado com ${_schemaAtual!.schema.fields.length} campos');
      notifyListeners();
    } catch (e) {
      _setError('Erro ao carregar schema: $e');
      print('❌ Erro ao carregar schema: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Atualizar valor de um campo
  void atualizarCampo(String fieldName, dynamic value) {
    _valoresFormulario[fieldName] = value;
    print('📝 Campo atualizado: $fieldName = $value');
    
    // Recalcular campos dependentes
    _recalcularCamposDependentes(fieldName);
    
    notifyListeners();
  }

  /// Recalcular campos que dependem de outro campo
  void _recalcularCamposDependentes(String changedFieldName) {
    if (_schemaAtual == null) return;

    for (final field in _schemaAtual!.schema.fields) {
      if (field.calculateFrom?.field == changedFieldName) {
        final baseValue = _valoresFormulario[changedFieldName];
        if (baseValue != null) {
          final calculatedValue = _calcularValor(field, baseValue);
          if (calculatedValue != null) {
            _valoresFormulario[field.name] = calculatedValue;
            print('🧮 Campo calculado: ${field.name} = $calculatedValue');
          }
        }
      }
    }
  }

  /// Calcular valor baseado em outro campo
  dynamic _calcularValor(FieldSchema field, dynamic baseValue) {
    if (field.calculateFrom == null) return null;

    final calc = field.calculateFrom!;
    
    // Se for cálculo de data (ex: adicionar dias)
    if (field.type == FieldType.date) {
      try {
        DateTime baseDate;
        
        // Parsear data base
        if (baseValue is String) {
          if (baseValue.contains('/')) {
            final parts = baseValue.split('/');
            baseDate = DateTime(
              int.parse(parts[2]),
              int.parse(parts[1]),
              int.parse(parts[0]),
            );
          } else {
            baseDate = DateTime.parse(baseValue);
          }
        } else if (baseValue is DateTime) {
          baseDate = baseValue;
        } else {
          return null;
        }

        // Aplicar operação
        int daysToAdd = calc.value ?? 0;
        
        // Se deve usar valor do produto
        if (calc.productField != null && _schemaAtual?.product != null) {
          final productValue = _schemaAtual!.product![calc.productField];
          if (productValue is int) {
            daysToAdd = productValue;
          }
        }

        final newDate = baseDate.add(Duration(days: daysToAdd));
        return '${newDate.day.toString().padLeft(2, '0')}/${newDate.month.toString().padLeft(2, '0')}/${newDate.year}';
        
      } catch (e) {
        print('⚠️ Erro ao calcular data: $e');
        return null;
      }
    }

    // Para outros tipos (number, decimal)
    if (baseValue is num) {
      final operationValue = calc.value ?? 0;
      
      switch (calc.operation) {
        case 'add':
          return baseValue + operationValue;
        case 'subtract':
          return baseValue - operationValue;
        case 'multiply':
          return baseValue * operationValue;
        case 'divide':
          return operationValue != 0 ? baseValue / operationValue : null;
        default:
          return null;
      }
    }

    return null;
  }

  /// Validar formulário
  Map<String, String> validarFormulario() {
    final erros = <String, String>{};

    if (_schemaAtual == null) {
      erros['geral'] = 'Schema não carregado';
      return erros;
    }

    for (final field in _schemaAtual!.schema.fields) {
      final value = _valoresFormulario[field.name];

      // Verificar campos obrigatórios
      if (field.required && (value == null || value.toString().trim().isEmpty)) {
        erros[field.name] = '${field.label} é obrigatório';
        continue;
      }

      // Validações específicas
      if (value != null && field.validation != null) {
        final validation = field.validation!;
        final valueStr = value.toString();

        // Min/Max length
        if (validation.minLength != null && valueStr.length < validation.minLength!) {
          erros[field.name] = '${field.label} deve ter no mínimo ${validation.minLength} caracteres';
        }
        if (validation.maxLength != null && valueStr.length > validation.maxLength!) {
          erros[field.name] = '${field.label} deve ter no máximo ${validation.maxLength} caracteres';
        }

        // Min/Max value (para números)
        if (value is num) {
          if (validation.min != null && value < validation.min!) {
            erros[field.name] = '${field.label} deve ser no mínimo ${validation.min}';
          }
          if (validation.max != null && value > validation.max!) {
            erros[field.name] = '${field.label} deve ser no máximo ${validation.max}';
          }
        }

        // Pattern (regex)
        if (validation.pattern != null) {
          final regex = RegExp(validation.pattern!);
          if (!regex.hasMatch(valueStr)) {
            erros[field.name] = '${field.label} inválido';
          }
        }
      }
    }

    return erros;
  }

  /// Limpar formulário
  void limparFormulario() {
    _valoresFormulario.clear();
    _templateAtual = null;
    _schemaAtual = null;
    notifyListeners();
  }

  /// Resetar provider
  void reset() {
    _templates.clear();
    _templateAtual = null;
    _schemaAtual = null;
    _valoresFormulario.clear();
    _isLoading = false;
    _error = null;
    notifyListeners();
  }

  // Helpers privados
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
  }
}


