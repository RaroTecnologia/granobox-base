import 'package:flutter/foundation.dart';
import '../models/granobox_printer_models.dart';
import '../services/granobox_printer_service.dart';

/// Provider para gerenciar impressoras 100% via Granobox
/// 
/// Este provider substitui completamente a dependência do Tagment para impressoras,
/// mantendo apenas templates no Tagment.
class GranoboxPrinterProvider extends ChangeNotifier {
  final GranoboxPrinterService _printerService = GranoboxPrinterService();

  // Estado
  List<GranoboxPrinter> _printers = [];
  bool _isLoading = false;
  String? _error;
  
  // Cache de configurações
  String? _validityPrinterId;
  String? _labelPrinterId;

  // Getters
  List<GranoboxPrinter> get printers => _printers;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  // Impressoras filtradas
  List<GranoboxPrinter> get onlinePrinters => 
      _printers.where((p) => p.isOnline).toList();
  
  List<GranoboxPrinter> get validityPrinters => 
      _printers.where((p) => p.canPrintValidity).toList();
  
  List<GranoboxPrinter> get labelPrinters => 
      _printers.where((p) => p.canPrintLabels).toList();
  
  List<GranoboxPrinter> get tcpPrinters => 
      _printers.where((p) => p.isTCPPrinter).toList();
  
  List<GranoboxPrinter> get edgePrinters => 
      _printers.where((p) => p.isEdgeGo).toList();

  // Configurações
  String? get validityPrinterId => _validityPrinterId;
  String? get labelPrinterId => _labelPrinterId;
  bool get hasValidityPrinter => _validityPrinterId != null;
  bool get hasLabelPrinter => _labelPrinterId != null;

  /// Carregar todas as impressoras
  Future<void> loadPrinters({
    required String token,
    required String clientId,
    String? operationId,
    bool forceRefresh = false,
  }) async {
    if (_isLoading && !forceRefresh) return;

    _setLoading(true);
    _clearError();

    try {
      print('🖨️ [GranoboxPrinterProvider] Carregando impressoras...');
      print('   ClientId: $clientId');
      print('   OperationId: $operationId');
      print('   ForceRefresh: $forceRefresh');

      final printers = await _printerService.getPrinters(
        token: token,
        clientId: clientId,
        operationId: operationId,
      );

      _printers = printers;
      print('✅ ${printers.length} impressoras carregadas');

      // Log das impressoras encontradas
      for (final printer in printers) {
        print('🖨️ ${printer.name} - Status: ${printer.status.displayName} - Type: ${printer.type}');
      }

      notifyListeners();
    } catch (e) {
      print('❌ Erro ao carregar impressoras: $e');
      _setError('Erro ao carregar impressoras: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Carregar impressoras por tipo de uso
  Future<void> loadPrintersByUsage({
    required String token,
    required String clientId,
    required String usage,
    String? operationId,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      final printers = await _printerService.getPrintersByUsage(
        token: token,
        clientId: clientId,
        usage: usage,
        operationId: operationId,
      );

      _printers = printers;
      notifyListeners();
    } catch (e) {
      _setError('Erro ao carregar impressoras: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Obter impressora específica
  Future<GranoboxPrinter?> getPrinter({
    required String token,
    required String printerId,
  }) async {
    try {
      return await _printerService.getPrinter(
        token: token,
        printerId: printerId,
      );
    } catch (e) {
      print('❌ Erro ao buscar impressora: $e');
      return null;
    }
  }

  /// Criar nova impressora
  Future<GranoboxPrinter?> createPrinter({
    required String token,
    required String clientId,
    required CreatePrinterRequest request,
  }) async {
    try {
      final printer = await _printerService.createPrinter(
        token: token,
        clientId: clientId,
        request: request,
      );

      // Adicionar à lista local
      _printers.add(printer);
      notifyListeners();

      return printer;
    } catch (e) {
      _setError('Erro ao criar impressora: $e');
      return null;
    }
  }

  /// Atualizar impressora existente
  Future<GranoboxPrinter?> updatePrinter({
    required String token,
    required String printerId,
    required CreatePrinterRequest request,
  }) async {
    try {
      final updatedPrinter = await _printerService.updatePrinter(
        token: token,
        printerId: printerId,
        request: request,
      );

      // Atualizar na lista local
      final index = _printers.indexWhere((p) => p.id == printerId);
      if (index != -1) {
        _printers[index] = updatedPrinter;
        notifyListeners();
      }

      return updatedPrinter;
    } catch (e) {
      _setError('Erro ao atualizar impressora: $e');
      return null;
    }
  }

  /// Deletar impressora
  Future<bool> deletePrinter({
    required String token,
    required String printerId,
  }) async {
    try {
      await _printerService.deletePrinter(
        token: token,
        printerId: printerId,
      );

      // Remover da lista local
      _printers.removeWhere((p) => p.id == printerId);
      notifyListeners();

      return true;
    } catch (e) {
      _setError('Erro ao deletar impressora: $e');
      return false;
    }
  }

  /// Testar impressora
  Future<PrintResult> testPrinter({
    required String token,
    required String printerId,
  }) async {
    try {
      return await _printerService.testPrinter(
        token: token,
        printerId: printerId,
      );
    } catch (e) {
      return PrintResult.error('Erro ao testar impressora: $e');
    }
  }

  /// Imprimir ZPL
  Future<PrintResult> printZPL({
    required String token,
    required String printerId,
    required String zpl,
    int copies = 1,
  }) async {
    try {
      return await _printerService.printZPL(
        token: token,
        printerId: printerId,
        zpl: zpl,
        copies: copies,
      );
    } catch (e) {
      return PrintResult.error('Erro ao imprimir: $e');
    }
  }

  /// Obter impressora de validade configurada
  GranoboxPrinter? getValidityPrinter() {
    if (_validityPrinterId != null) {
      return _printers.where((p) => p.id == _validityPrinterId).firstOrNull;
    }
    
    // Fallback: primeira impressora online que pode imprimir validade
    return validityPrinters.where((p) => p.isOnline).firstOrNull;
  }

  /// Obter impressora de rótulo configurada
  GranoboxPrinter? getLabelPrinter() {
    if (_labelPrinterId != null) {
      return _printers.where((p) => p.id == _labelPrinterId).firstOrNull;
    }
    
    // Fallback: primeira impressora online que pode imprimir rótulos
    return labelPrinters.where((p) => p.isOnline).firstOrNull;
  }

  /// Obter melhor impressora para validade baseada em prioridades
  GranoboxPrinter? getBestValidityPrinter({
    String? locationId,
    String? productDefaultPrinterId,
    String? categoryDefaultPrinterId,
  }) {
    print('🔍 Buscando melhor impressora de validade...');
    print('   LocationId: $locationId');
    print('   ProductDefault: $productDefaultPrinterId');
    print('   CategoryDefault: $categoryDefaultPrinterId');
    print('   Total impressoras: ${_printers.length}');

    // Prioridade 1: Impressora definida no produto
    if (productDefaultPrinterId != null) {
      final productPrinter = _printers
          .where((p) => p.id == productDefaultPrinterId && p.canPrintValidity)
          .firstOrNull;
      if (productPrinter != null) {
        print('✅ Usando impressora do produto: ${productPrinter.name}');
        return productPrinter;
      }
    }

    // Prioridade 2: Impressora definida na categoria
    if (categoryDefaultPrinterId != null) {
      final categoryPrinter = _printers
          .where((p) => p.id == categoryDefaultPrinterId && p.canPrintValidity)
          .firstOrNull;
      if (categoryPrinter != null) {
        print('✅ Usando impressora da categoria: ${categoryPrinter.name}');
        return categoryPrinter;
      }
    }

    // Prioridade 3: Impressora configurada manualmente
    final configuredPrinter = getValidityPrinter();
    if (configuredPrinter != null) {
      print('✅ Usando impressora configurada: ${configuredPrinter.name}');
      return configuredPrinter;
    }

    // Prioridade 4: Primeira impressora online de validade
    final onlineValidityPrinter = validityPrinters
        .where((p) => p.isOnline)
        .firstOrNull;
    if (onlineValidityPrinter != null) {
      print('✅ Usando primeira impressora online: ${onlineValidityPrinter.name}');
      return onlineValidityPrinter;
    }

    print('❌ Nenhuma impressora de validade disponível');
    return null;
  }

  /// Obter melhor impressora para rótulos
  GranoboxPrinter? getBestLabelPrinter({
    String? locationId,
  }) {
    // Prioridade 1: Impressora configurada manualmente
    final configuredPrinter = getLabelPrinter();
    if (configuredPrinter != null) {
      return configuredPrinter;
    }

    // Prioridade 2: Primeira impressora online de rótulos
    return labelPrinters.where((p) => p.isOnline).firstOrNull;
  }

  /// Definir impressora de validade
  void setValidityPrinter(String? printerId) {
    _validityPrinterId = printerId;
    notifyListeners();
    // TODO: Salvar no SharedPreferences ou API
  }

  /// Definir impressora de rótulo
  void setLabelPrinter(String? printerId) {
    _labelPrinterId = printerId;
    notifyListeners();
    // TODO: Salvar no SharedPreferences ou API
  }

  /// Registrar dispositivo IoT
  Future<GranoboxPrinter?> registerIoTPrinter({
    required String token,
    required String clientId,
    required String deviceId,
    required String name,
    required String type,
    required String ip,
    required int port,
    String? operationId,
    bool isUSBPrinter = false,
    List<String>? usage,
  }) async {
    try {
      final printer = await _printerService.registerIoTPrinter(
        token: token,
        clientId: clientId,
        deviceId: deviceId,
        name: name,
        type: type,
        ip: ip,
        port: port,
        operationId: operationId,
        isUSBPrinter: isUSBPrinter,
        usage: usage,
      );

      // Adicionar à lista local se não existir
      if (!_printers.any((p) => p.id == printer.id)) {
        _printers.add(printer);
        notifyListeners();
      }

      return printer;
    } catch (e) {
      _setError('Erro ao registrar dispositivo IoT: $e');
      return null;
    }
  }

  /// Resetar todos os dados
  void resetAll() {
    _printers.clear();
    _validityPrinterId = null;
    _labelPrinterId = null;
    _error = null;
    _isLoading = false;
    notifyListeners();
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
