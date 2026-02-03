import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/granobox_printer_models.dart';
import '../services/granobox_printer_service.dart';
import '../config/api_config.dart';

/// Serviço híbrido: Impressoras do Granobox + Templates do Tagment
/// 
/// Este serviço implementa o fluxo:
/// 1. Buscar impressoras do Granobox
/// 2. Buscar templates do Tagment
/// 3. Renderizar template no Tagment
/// 4. Imprimir via impressora do Granobox
class HybridGranoboxPrintService {
  final GranoboxPrinterService _printerService = GranoboxPrinterService();
  
  // Base URLs
  static const String _tagmentBaseUrl = 'https://api.tagment.com.br';

  /// Imprimir usando template do Tagment + impressora do Granobox
  Future<PrintResult> printWithTemplate({
    required String granoboxToken,
    required String tagmentApiKey,
    required GranoboxPrinter printer,
    required String templateId,
    required Map<String, dynamic> templateData,
    int copies = 1,
  }) async {
    try {
      print('🖨️ [HybridPrint] Iniciando impressão híbrida...');
      print('   Printer: ${printer.name} (${printer.type})');
      print('   Template: $templateId');
      print('   Copies: $copies');

      // 1. Renderizar template no Tagment
      final zpl = await _renderTemplate(
        apiKey: tagmentApiKey,
        templateId: templateId,
        data: templateData,
      );

      if (zpl == null || zpl.isEmpty) {
        return PrintResult.error('Erro ao renderizar template');
      }

      print('✅ Template renderizado: ${zpl.length} bytes');

      // 2. Imprimir via Granobox
      return await _printViaGranobox(
        token: granoboxToken,
        printer: printer,
        zpl: zpl,
        copies: copies,
      );

    } catch (e) {
      print('❌ Erro na impressão híbrida: $e');
      return PrintResult.error('Erro na impressão: $e');
    }
  }

  /// Renderizar template no Tagment
  Future<String?> _renderTemplate({
    required String apiKey,
    required String templateId,
    required Map<String, dynamic> data,
  }) async {
    try {
      final url = '$_tagmentBaseUrl/v1/templates/$templateId/render';
      
      final body = {
        'data': data,
        'format': 'zpl',
      };

      print('🎨 [Tagment] Renderizando template: $url');
      
      final response = await http.post(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $apiKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        return responseData['zpl'] ?? responseData['content'];
      } else {
        print('❌ Erro ao renderizar template: ${response.statusCode}');
        print('📄 Response: ${response.body}');
        return null;
      }
    } catch (e) {
      print('❌ Erro ao renderizar template: $e');
      return null;
    }
  }

  /// Imprimir via impressora do Granobox
  Future<PrintResult> _printViaGranobox({
    required String token,
    required GranoboxPrinter printer,
    required String zpl,
    int copies = 1,
  }) async {
    try {
      final startTime = DateTime.now();
      PrintResult result;
      
      // Escolher método de impressão baseado no tipo da impressora
      if (printer.canUseTCP && printer.connection.host != null) {
        result = await _printViaTCP(
          token: token,
          printer: printer,
          zpl: zpl,
          copies: copies,
        );
      } else if (printer.canUseWebSocket) {
        result = await _printViaWebSocket(
          token: token,
          printer: printer,
          zpl: zpl,
          copies: copies,
        );
      } else {
        return PrintResult.error('Método de impressão não suportado para esta impressora');
      }

      // ⭐ RASTREAMENTO: Calcular duração e salvar estatísticas
      final duration = DateTime.now().difference(startTime).inMilliseconds;
      await _logPrintStatistics(
        token: token,
        printer: printer,
        result: result,
        duration: duration,
        copies: copies,
      );

      return result;
    } catch (e) {
      return PrintResult.error('Erro ao imprimir via Granobox: $e');
    }
  }

  /// Imprimir via TCP direto (através da API do Granobox)
  Future<PrintResult> _printViaTCP({
    required String token,
    required GranoboxPrinter printer,
    required String zpl,
    int copies = 1,
  }) async {
    try {
      print('🌐 [TCP] Imprimindo via TCP: ${printer.connection.host}:${printer.connection.port}');
      
      // Aplicar offsets se necessário
      String finalZpl = zpl;
      if (printer.offsetX != 0 || printer.offsetY != 0) {
        finalZpl = _applyOffsets(zpl, printer.offsetX, printer.offsetY);
        print('📐 Offsets aplicados: X=${printer.offsetX}mm, Y=${printer.offsetY}mm');
      }

      // Usar o serviço do Granobox para imprimir
      return await _printerService.printZPL(
        token: token,
        printerId: printer.id,
        zpl: finalZpl,
        copies: copies,
      );
    } catch (e) {
      return PrintResult.error('Erro na impressão TCP: $e');
    }
  }

  /// Imprimir via WebSocket (Edge Agent ESP32)
  Future<PrintResult> _printViaWebSocket({
    required String token,
    required GranoboxPrinter printer,
    required String zpl,
    int copies = 1,
  }) async {
    try {
      print('🔌 [WebSocket] Imprimindo via WebSocket: ${printer.deviceId}');
      
      // Aplicar offsets se necessário
      String finalZpl = zpl;
      if (printer.offsetX != 0 || printer.offsetY != 0) {
        finalZpl = _applyOffsets(zpl, printer.offsetX, printer.offsetY);
        print('📐 Offsets aplicados: X=${printer.offsetX}mm, Y=${printer.offsetY}mm');
      }

      // Usar o serviço do Granobox para imprimir via WebSocket
      return await _printerService.printZPL(
        token: token,
        printerId: printer.id,
        zpl: finalZpl,
        copies: copies,
      );
    } catch (e) {
      return PrintResult.error('Erro na impressão WebSocket: $e');
    }
  }

  /// Aplicar offsets ao ZPL
  String _applyOffsets(String zpl, double offsetX, double offsetY) {
    // Converter mm para dots (203 DPI = 8 dots/mm)
    final offsetXDots = (offsetX * 8).round();
    final offsetYDots = (offsetY * 8).round();
    
    if (offsetXDots == 0 && offsetYDots == 0) {
      return zpl;
    }

    // Aplicar offset global no início do ZPL
    final lines = zpl.split('\n');
    final modifiedLines = <String>[];
    
    bool foundXA = false;
    for (final line in lines) {
      modifiedLines.add(line);
      
      // Adicionar offset após ^XA
      if (!foundXA && line.trim() == '^XA') {
        foundXA = true;
        if (offsetXDots != 0 || offsetYDots != 0) {
          modifiedLines.add('^LT$offsetYDots'); // Offset Y (Line Top)
          modifiedLines.add('^LS$offsetXDots'); // Offset X (Label Shift)
        }
      }
    }
    
    return modifiedLines.join('\n');
  }

  /// Imprimir etiqueta de validade
  Future<PrintResult> printValidityLabel({
    required String granoboxToken,
    required String tagmentApiKey,
    required GranoboxPrinter printer,
    required String produto,
    required String marca,
    required String sif,
    required String dataEmbalagem,
    required String dataManipulacao,
    required String dataValidade,
    int copies = 1,
  }) async {
    try {
      // Dados para o template de validade
      final templateData = {
        'produto': produto,
        'marca': marca,
        'sif': sif,
        'dataEmbalagem': dataEmbalagem,
        'dataManipulacao': dataManipulacao,
        'dataValidade': dataValidade,
      };

      // TODO: Buscar templateId de validade da configuração
      const validityTemplateId = 'default-validity-template';

      return await printWithTemplate(
        granoboxToken: granoboxToken,
        tagmentApiKey: tagmentApiKey,
        printer: printer,
        templateId: validityTemplateId,
        templateData: templateData,
        copies: copies,
      );
    } catch (e) {
      return PrintResult.error('Erro ao imprimir etiqueta de validade: $e');
    }
  }

  /// Imprimir rótulo personalizado
  Future<PrintResult> printCustomLabel({
    required String granoboxToken,
    required String tagmentApiKey,
    required GranoboxPrinter printer,
    required String templateId,
    required Map<String, dynamic> templateData,
    int copies = 1,
  }) async {
    return await printWithTemplate(
      granoboxToken: granoboxToken,
      tagmentApiKey: tagmentApiKey,
      printer: printer,
      templateId: templateId,
      templateData: templateData,
      copies: copies,
    );
  }

  /// Testar impressora com ZPL simples
  Future<PrintResult> testPrinter({
    required String granoboxToken,
    required GranoboxPrinter printer,
  }) async {
    try {
      final testZpl = '''
^XA
^FO50,50^A0N,30,30^FDGRANOBOX TESTE^FS
^FO50,100^A0N,20,20^FD${DateTime.now().toString().substring(0, 19)}^FS
^FO50,150^A0N,20,20^FDImpressora: ${printer.name}^FS
^XZ''';

      return await _printViaGranobox(
        token: granoboxToken,
        printer: printer,
        zpl: testZpl,
        copies: 1,
      );
    } catch (e) {
      return PrintResult.error('Erro ao testar impressora: $e');
    }
  }

  /// Buscar templates disponíveis no Tagment
  Future<List<Map<String, dynamic>>> getAvailableTemplates({
    required String tagmentApiKey,
  }) async {
    try {
      final url = '$_tagmentBaseUrl/v1/templates';
      
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $tagmentApiKey',
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return List<Map<String, dynamic>>.from(data['templates'] ?? []);
      } else {
        print('❌ Erro ao buscar templates: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print('❌ Erro ao buscar templates: $e');
      return [];
    }
  }

  /// Validar template do Tagment
  Future<bool> validateTemplate({
    required String tagmentApiKey,
    required String templateId,
  }) async {
    try {
      final url = '$_tagmentBaseUrl/v1/templates/$templateId';
      
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $tagmentApiKey',
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 10));

      return response.statusCode == 200;
    } catch (e) {
      print('❌ Erro ao validar template: $e');
      return false;
    }
  }

  /// ⭐ RASTREAMENTO: Registrar estatísticas de impressão (todas são Edge)
  Future<void> _logPrintStatistics({
    required String token,
    required GranoboxPrinter printer,
    required PrintResult result,
    required int duration,
    required int copies,
  }) async {
    try {
      // Determinar método de impressão usado (todas as impressoras são Edge)
      String printMethod = 'tcp';
      
      if (printer.canUseWebSocket && printer.isEdgeGo) {
        printMethod = 'websocket';
      }

      // Enviar estatísticas para API
      final url = '${ApiConfig.baseUrl}/printers/statistics';
      
      final body = {
        'printerId': printer.id,
        'printMethod': printMethod,
        'printDuration': duration,
        'copies': copies,
        'success': result.success,
        'errorMessage': result.success ? null : result.message,
        'timestamp': DateTime.now().toIso8601String(),
      };

      print('📊 [Statistics] Enviando estatísticas: $printMethod ($duration ms)');

      final response = await http.post(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ Estatísticas salvas com sucesso');
      } else {
        print('⚠️ Erro ao salvar estatísticas: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao registrar estatísticas: $e');
      // Não propagar erro - estatísticas são opcionais
    }
  }
}
