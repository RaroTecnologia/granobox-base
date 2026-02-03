import 'package:flutter/foundation.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/granobox_printer_models.dart';
import '../providers/granobox_printer_provider.dart';
import '../providers/auth_provider.dart';
import '../services/hybrid_granobox_print_service.dart';
import '../config/api_config.dart';

/// Provider híbrido: Templates do Tagment + Impressoras do Granobox
/// 
/// Este provider coordena o fluxo completo de impressão:
/// 1. Buscar templates do Tagment
/// 2. Buscar impressoras do Granobox
/// 3. Renderizar template no Tagment
/// 4. Imprimir via impressora do Granobox
class HybridPrintProvider extends ChangeNotifier {
  final HybridGranoboxPrintService _hybridService = HybridGranoboxPrintService();
  final GranoboxPrinterProvider _printerProvider;
  final AuthProvider _authProvider;

  // Estado
  bool _isLoading = false;
  String? _error;
  String? _tagmentApiKey;
  
  // Cache de templates
  List<Map<String, dynamic>> _availableTemplates = [];
  
  HybridPrintProvider({
    required GranoboxPrinterProvider printerProvider,
    required AuthProvider authProvider,
  }) : _printerProvider = printerProvider,
       _authProvider = authProvider;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get tagmentApiKey => _tagmentApiKey;
  List<Map<String, dynamic>> get availableTemplates => _availableTemplates;
  
  // Getters de impressoras (delegados)
  List<GranoboxPrinter> get printers => _printerProvider.printers;
  List<GranoboxPrinter> get onlinePrinters => _printerProvider.onlinePrinters;
  List<GranoboxPrinter> get validityPrinters => _printerProvider.validityPrinters;
  List<GranoboxPrinter> get labelPrinters => _printerProvider.labelPrinters;
  
  GranoboxPrinter? get validityPrinter => _printerProvider.getValidityPrinter();
  GranoboxPrinter? get labelPrinter => _printerProvider.getLabelPrinter();

  /// Inicializar provider (carregar impressoras e configurar Tagment)
  Future<void> initialize({
    required String clientId,
    String? operationId,
    bool forceRefresh = false,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      final token = await _authProvider.authToken;
      if (token == null) {
        throw Exception('Token de autenticação não encontrado');
      }

      print('🔄 [HybridPrint] Inicializando...');
      print('   ClientId: $clientId');
      print('   OperationId: $operationId');

      // 1. Configurar API Key do Tagment
      await _configureTagmentApiKey(clientId, token);

      // 2. Carregar impressoras do Granobox
      await _printerProvider.loadPrinters(
        token: token,
        clientId: clientId,
        operationId: operationId,
        forceRefresh: forceRefresh,
      );

      // 3. Carregar templates do Tagment (se API key disponível)
      if (_tagmentApiKey != null) {
        await _loadAvailableTemplates();
      }

      print('✅ [HybridPrint] Inicialização concluída');
    } catch (e) {
      print('❌ [HybridPrint] Erro na inicialização: $e');
      _setError('Erro na inicialização: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Configurar API Key do Tagment via cliente
  Future<void> _configureTagmentApiKey(String clientId, String token) async {
    try {
      print('🔑 [HybridPrint] Configurando API Key do Tagment...');
      
      // Buscar API Key diretamente da API do Granobox
      final url = '${ApiConfig.baseUrl}/clients/$clientId';
      
      final response = await http.get(
        Uri.parse(url),
        headers: ApiConfig.getAuthHeaders(token),
      ).timeout(ApiConfig.defaultTimeout);
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _tagmentApiKey = data['tagmentApiKey'] as String?;
        
        if (_tagmentApiKey != null && _tagmentApiKey!.isNotEmpty) {
          print('✅ API Key do Tagment configurada');
        } else {
          print('⚠️ API Key do Tagment não configurada para este cliente');
        }
      } else {
        print('⚠️ Erro ao buscar API Key: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao configurar API Key do Tagment: $e');
      // Não propagar erro - Tagment é opcional para templates
    }
  }

  /// Carregar templates disponíveis no Tagment
  Future<void> _loadAvailableTemplates() async {
    if (_tagmentApiKey == null) return;

    try {
      print('📋 [HybridPrint] Carregando templates do Tagment...');
      
      _availableTemplates = await _hybridService.getAvailableTemplates(
        tagmentApiKey: _tagmentApiKey!,
      );
      
      print('✅ ${_availableTemplates.length} templates carregados');
    } catch (e) {
      print('❌ Erro ao carregar templates: $e');
      // Não propagar erro - templates são opcionais
    }
  }

  /// Imprimir etiqueta de validade
  Future<PrintResult> printValidityLabel({
    required String produto,
    required String marca,
    required String sif,
    required String dataEmbalagem,
    required String dataManipulacao,
    required String dataValidade,
    GranoboxPrinter? forcePrinter,
    String? productDefaultPrinterId,
    String? categoryDefaultPrinterId,
    String? locationId,
    int copies = 1,
  }) async {
    try {
      _clearError();
      
      final token = await _authProvider.authToken;
      if (token == null) {
        return PrintResult.error('Token de autenticação não encontrado');
      }

      if (_tagmentApiKey == null) {
        return PrintResult.error('API Key do Tagment não configurada');
      }

      // 1. Selecionar impressora
      final printer = forcePrinter ?? _printerProvider.getBestValidityPrinter(
        locationId: locationId,
        productDefaultPrinterId: productDefaultPrinterId,
        categoryDefaultPrinterId: categoryDefaultPrinterId,
      );

      if (printer == null) {
        return PrintResult.error('Nenhuma impressora de validade disponível');
      }

      print('🖨️ [HybridPrint] Imprimindo etiqueta de validade...');
      print('   Impressora: ${printer.name}');
      print('   Produto: $produto');

      // 2. Imprimir via serviço híbrido
      return await _hybridService.printValidityLabel(
        granoboxToken: token,
        tagmentApiKey: _tagmentApiKey!,
        printer: printer,
        produto: produto,
        marca: marca,
        sif: sif,
        dataEmbalagem: dataEmbalagem,
        dataManipulacao: dataManipulacao,
        dataValidade: dataValidade,
        copies: copies,
      );

    } catch (e) {
      final error = 'Erro ao imprimir etiqueta de validade: $e';
      _setError(error);
      return PrintResult.error(error);
    }
  }

  /// Imprimir rótulo personalizado
  Future<PrintResult> printCustomLabel({
    required String templateId,
    required Map<String, dynamic> templateData,
    GranoboxPrinter? forcePrinter,
    String? locationId,
    int copies = 1,
  }) async {
    try {
      _clearError();
      
      final token = await _authProvider.authToken;
      if (token == null) {
        return PrintResult.error('Token de autenticação não encontrado');
      }

      if (_tagmentApiKey == null) {
        return PrintResult.error('API Key do Tagment não configurada');
      }

      // 1. Selecionar impressora
      final printer = forcePrinter ?? _printerProvider.getBestLabelPrinter(
        locationId: locationId,
      );

      if (printer == null) {
        return PrintResult.error('Nenhuma impressora de rótulo disponível');
      }

      print('🖨️ [HybridPrint] Imprimindo rótulo personalizado...');
      print('   Impressora: ${printer.name}');
      print('   Template: $templateId');

      // 2. Imprimir via serviço híbrido
      return await _hybridService.printCustomLabel(
        granoboxToken: token,
        tagmentApiKey: _tagmentApiKey!,
        printer: printer,
        templateId: templateId,
        templateData: templateData,
        copies: copies,
      );

    } catch (e) {
      final error = 'Erro ao imprimir rótulo personalizado: $e';
      _setError(error);
      return PrintResult.error(error);
    }
  }

  /// Testar impressora
  Future<PrintResult> testPrinter(GranoboxPrinter printer) async {
    try {
      _clearError();
      
      final token = await _authProvider.authToken;
      if (token == null) {
        return PrintResult.error('Token de autenticação não encontrado');
      }

      print('🧪 [HybridPrint] Testando impressora: ${printer.name}');

      return await _hybridService.testPrinter(
        granoboxToken: token,
        printer: printer,
      );

    } catch (e) {
      final error = 'Erro ao testar impressora: $e';
      _setError(error);
      return PrintResult.error(error);
    }
  }

  /// Imprimir ZPL direto (sem template)
  Future<PrintResult> printZPL({
    required GranoboxPrinter printer,
    required String zpl,
    int copies = 1,
  }) async {
    try {
      _clearError();
      
      final token = await _authProvider.authToken;
      if (token == null) {
        return PrintResult.error('Token de autenticação não encontrado');
      }

      print('🖨️ [HybridPrint] Imprimindo ZPL direto...');
      print('   Impressora: ${printer.name}');
      print('   ZPL size: ${zpl.length} bytes');

      return await _printerProvider.printZPL(
        token: token,
        printerId: printer.id,
        zpl: zpl,
        copies: copies,
      );

    } catch (e) {
      final error = 'Erro ao imprimir ZPL: $e';
      _setError(error);
      return PrintResult.error(error);
    }
  }

  /// Validar template do Tagment
  Future<bool> validateTemplate(String templateId) async {
    if (_tagmentApiKey == null) return false;

    try {
      return await _hybridService.validateTemplate(
        tagmentApiKey: _tagmentApiKey!,
        templateId: templateId,
      );
    } catch (e) {
      print('❌ Erro ao validar template: $e');
      return false;
    }
  }

  /// Recarregar dados
  Future<void> refresh({
    required String clientId,
    String? operationId,
  }) async {
    await initialize(
      clientId: clientId,
      operationId: operationId,
      forceRefresh: true,
    );
  }

  /// Resetar todos os dados
  void resetAll() {
    _printerProvider.resetAll();
    _availableTemplates.clear();
    _tagmentApiKey = null;
    _error = null;
    _isLoading = false;
    notifyListeners();
  }

  // Métodos de configuração de impressoras (delegados)
  void setValidityPrinter(String? printerId) {
    _printerProvider.setValidityPrinter(printerId);
  }

  void setLabelPrinter(String? printerId) {
    _printerProvider.setLabelPrinter(printerId);
  }

  // Métodos privados
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
