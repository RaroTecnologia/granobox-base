import 'dart:async';
import 'dart:collection';
import '../models/print_result_models.dart';
import 'legacy_print_service.dart';
import 'printer_config_service.dart';

/// Serviço unificado para impressão que integra configuração local e API Tagment
class UnifiedPrintService {
  final LegacyPrintService _printService;
  final PrinterConfigService _configService;
  
  UnifiedPrintService({
    required String apiKey,
    required PrinterConfigService configService,
  }) : _printService = LegacyPrintService(apiKey: apiKey),
       _configService = configService;

  /// Imprimir etiqueta de validade usando impressora configurada
  Future<TagmentPrintResult> imprimirEtiquetaValidade({
    required String produto,
    required String marca,
    required String sif,
    required String dataEmbalagem,
    required String dataManipulacao,
    required String dataValidade,
    String? forcePrinterId, // Forçar impressora específica
  }) async {
    try {
      // 1. Determinar qual impressora usar
      LocalPrinterConfig? printer;
      
      if (forcePrinterId != null) {
        printer = await _configService.getPrinterById(forcePrinterId);
        if (printer == null) {
          return TagmentPrintResult.error(
            'Impressora especificada não encontrada',
            {'printerId': forcePrinterId},
          );
        }
      } else {
        printer = await _configService.getPreferredValidadePrinter();
        if (printer == null) {
          return TagmentPrintResult.error(
            'Nenhuma impressora configurada para validade',
            {'suggestion': 'Configure uma impressora para validade nas configurações'},
          );
        }
      }
      
      print('🖨️ Usando impressora para validade: ${printer.nome} (${printer.ip}:${printer.porta})');
      
      // 2. Verificar se impressora está online (opcional)
      if (printer.status == 'offline') {
        print('⚠️ Impressora marcada como offline, tentando mesmo assim...');
      }
      
      // 3. Imprimir usando o serviço refatorado
      final result = await _printService.imprimirEtiquetaValidade(
        produto: produto,
        marca: marca,
        sif: sif,
        dataEmbalagem: dataEmbalagem,
        dataManipulacao: dataManipulacao,
        dataValidade: dataValidade,
        printerIP: printer.ip,
        printerPort: printer.porta,
        offsetX: printer.offsetX,
        offsetY: printer.offsetY,
      );
      
      // 4. Atualizar status da impressora baseado no resultado
      if (result.success) {
        await _configService.updatePrinterStatus(printer.id, 'online');
      } else {
        await _configService.updatePrinterStatus(printer.id, 'offline');
      }
      
      return result;
      
    } catch (e) {
      return TagmentPrintResult.error(
        'Erro no serviço de impressão: $e',
        {'error': e.toString(), 'type': 'UnifiedServiceError'},
      );
    }
  }

  /// Imprimir rótulo de produto usando impressora configurada
  Future<TagmentPrintResult> imprimirRotuloProduto({
    required String templateId,
    required Map<String, dynamic> data,
    String? forcePrinterId, // Forçar impressora específica
  }) async {
    try {
      // 1. Determinar qual impressora usar
      LocalPrinterConfig? printer;
      
      if (forcePrinterId != null) {
        printer = await _configService.getPrinterById(forcePrinterId);
        if (printer == null) {
          return TagmentPrintResult.error(
            'Impressora especificada não encontrada',
            {'printerId': forcePrinterId},
          );
        }
      } else {
        printer = await _configService.getPreferredRotuloPrinter();
        if (printer == null) {
          return TagmentPrintResult.error(
            'Nenhuma impressora configurada para rótulo',
            {'suggestion': 'Configure uma impressora para rótulo nas configurações'},
          );
        }
      }
      
      print('🖨️ Usando impressora para rótulo: ${printer.nome} (${printer.ip}:${printer.porta})');
      
      // 2. Processar template
      final zplCode = await _printService.processarTemplate(
        templateId: templateId,
        data: data,
      );
      
      // 3. Imprimir
      final result = await _printService.imprimirZplDireto(
        zplCode: zplCode,
        printerIP: printer.ip,
        printerPort: printer.porta,
        offsetX: printer.offsetX,
        offsetY: printer.offsetY,
      );
      
      // 4. Atualizar status da impressora
      if (result.success) {
        await _configService.updatePrinterStatus(printer.id, 'online');
      } else {
        await _configService.updatePrinterStatus(printer.id, 'offline');
      }
      
      return result;
      
    } catch (e) {
      return TagmentPrintResult.error(
        'Erro no serviço de impressão: $e',
        {'error': e.toString(), 'type': 'UnifiedServiceError'},
      );
    }
  }

  /// Testar impressora específica
  Future<TagmentPrintResult> testarImpressora(String printerId) async {
    try {
      final printer = await _configService.getPrinterById(printerId);
      if (printer == null) {
        return TagmentPrintResult.error(
          'Impressora não encontrada',
          {'printerId': printerId},
        );
      }
      
      // Atualizar status para 'testing'
      await _configService.updatePrinterStatus(printerId, 'testing');
      
      // Testar usando o serviço TCP
      final result = await _printService.testarImpressora(
        printerIP: printer.ip,
        printerPort: printer.porta,
      );
      
      // Atualizar status baseado no resultado
      final newStatus = result.success ? 'online' : 'offline';
      await _configService.updatePrinterStatus(printerId, newStatus);
      
      return result;
      
    } catch (e) {
      // Marcar como offline em caso de erro
      await _configService.updatePrinterStatus(printerId, 'offline');
      
      return TagmentPrintResult.error(
        'Erro no teste da impressora: $e',
        {'error': e.toString(), 'printerId': printerId},
      );
    }
  }

  /// Testar todas as impressoras configuradas
  Future<Map<String, TagmentPrintResult>> testarTodasImpressoras() async {
    final printers = await _configService.getLocalPrinters();
    final results = <String, TagmentPrintResult>{};
    
    // Testar em paralelo (máximo 3 simultâneas para não sobrecarregar)
    final futures = <Future<void>>[];
    final semaphore = Semaphore(3);
    
    for (final printer in printers) {
      futures.add(
        semaphore.acquire().then((_) async {
          try {
            results[printer.id] = await testarImpressora(printer.id);
          } finally {
            semaphore.release();
          }
        })
      );
    }
    
    await Future.wait(futures);
    return results;
  }

  /// Obter lista de impressoras com status atualizado
  Future<List<LocalPrinterConfig>> getImpressorasComStatus() async {
    return await _configService.getLocalPrinters();
  }

  /// Obter estatísticas das impressoras
  Future<Map<String, dynamic>> getEstatisticas() async {
    return await _configService.getPrintersStats();
  }

  /// Verificar se há impressoras configuradas
  Future<bool> hasImpressorasConfiguradas() async {
    final printers = await _configService.getLocalPrinters();
    return printers.isNotEmpty;
  }

  /// Verificar se há impressora de validade configurada
  Future<bool> hasImpressoraValidade() async {
    final printer = await _configService.getPreferredValidadePrinter();
    return printer != null;
  }

  /// Verificar se há impressora de rótulo configurada
  Future<bool> hasImpressoraRotulo() async {
    final printer = await _configService.getPreferredRotuloPrinter();
    return printer != null;
  }

  /// Obter impressoras por tipo
  Future<List<LocalPrinterConfig>> getImpressorasPorTipo({
    bool? validade,
    bool? rotulo,
  }) async {
    final printers = await _configService.getLocalPrinters();
    
    return printers.where((printer) {
      if (validade != null && printer.isValidadePrinter != validade) {
        return false;
      }
      if (rotulo != null && printer.isRotuloPrinter != rotulo) {
        return false;
      }
      return true;
    }).toList();
  }

  /// Processar apenas template (sem imprimir)
  Future<String> processarTemplate({
    required String templateId,
    required Map<String, dynamic> data,
  }) async {
    return await _printService.processarTemplate(
      templateId: templateId,
      data: data,
    );
  }

  /// Verificar status da API Key
  Future<ApiKeyStatus> verificarStatusAPI() async {
    return await _printService.verificarStatus();
  }
}

/// Semáforo simples para controlar concorrência
class Semaphore {
  final int maxCount;
  int _currentCount;
  final Queue<Completer<void>> _waitQueue = Queue<Completer<void>>();

  Semaphore(this.maxCount) : _currentCount = maxCount;

  Future<void> acquire() async {
    if (_currentCount > 0) {
      _currentCount--;
      return;
    }

    final completer = Completer<void>();
    _waitQueue.add(completer);
    return completer.future;
  }

  void release() {
    if (_waitQueue.isNotEmpty) {
      final completer = _waitQueue.removeFirst();
      completer.complete();
    } else {
      _currentCount++;
    }
  }
}

