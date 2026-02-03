import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/print_result_models.dart';

/// Serviço de impressão via WebSocket (Edge-Go)
/// 
/// Este serviço implementa impressão APENAS via WebSocket através do endpoint
/// /edge-go-ws/print da API Granobox.
/// 
/// ✅ Vantagens:
/// - Código limpo e enxuto
/// - Única fonte de verdade
/// - Fácil de manter e testar
/// - Suporta todas as impressoras (via Edge-Go)
/// 
/// 📡 Fluxo:
/// 1. Aplicar offsets no ZPL (se necessário)
/// 2. Enviar via POST /edge-go-ws/print
/// 3. WebSocket comunica com Edge-Go
/// 4. Edge-Go imprime na impressora
/// 5. Retornar resultado
class WebSocketPrintService {
  static WebSocketPrintService? _instance;

  WebSocketPrintService._();

  static WebSocketPrintService get instance {
    _instance ??= WebSocketPrintService._();
    return _instance!;
  }

  /// Imprimir usando ZPL pré-gerado
  /// 
  /// [printer] - Informações da impressora (deve ter deviceId)
  /// [content] - ZPL a ser impresso
  /// [authToken] - Token de autenticação da API Granobox
  /// [copies] - Número de cópias (padrão: 1)
  /// [onProgress] - Callback opcional para atualizar UI
  Future<TagmentPrintResult> print({
    required PrinterInfo printer,
    required String content,
    required String authToken,
    int copies = 1,
    Function(String)? onProgress,
  }) async {
    try {
      debugPrint('🖨️ [WebSocket] Iniciando impressão');
      debugPrint('   Impressora: ${printer.displayName}');
      debugPrint('   Edge Fingerprint: ${printer.edgeAgentFingerprint}');
      debugPrint('   Cópias: $copies');

      // Validar edgeAgentFingerprint (funciona como deviceId)
      if (printer.edgeAgentFingerprint == null || printer.edgeAgentFingerprint!.isEmpty) {
        return TagmentPrintResult.error(
          'Impressora não possui Edge-Go configurado',
          {'printer': printer.displayName},
        );
      }

      // 1. Aplicar offsets
      onProgress?.call('Aplicando ajustes...');
      String zplWithOffsets = _applyOffsets(
        content,
        printer.offsetX ?? 0.0,
        printer.offsetY ?? 0.0,
      );

      // 2. Adicionar múltiplas cópias se necessário
      String finalZpl = _addCopies(zplWithOffsets, copies);

      // 3. Enviar via WebSocket
      onProgress?.call('Enviando para impressora...');
      return await _sendViaWebSocket(
        printer: printer,
        zpl: finalZpl,
        authToken: authToken,
        copies: copies,
      );
    } catch (e, stack) {
      debugPrint('❌ Erro na impressão: $e');
      debugPrint('Stack: $stack');
      return TagmentPrintResult.error(
        'Erro ao imprimir: $e',
        {
          'printer': printer.displayName,
          'error': e.toString(),
        },
      );
    }
  }

  /// Enviar impressão via WebSocket
  Future<TagmentPrintResult> _sendViaWebSocket({
    required PrinterInfo printer,
    required String zpl,
    required String authToken,
    required int copies,
  }) async {
    try {
      final url = '${ApiConfig.granoboxApiUrl}/printers/print'; // ⭐ TCP Proxy (funciona para Edge-Go também)
      
      debugPrint('📡 POST $url');
      debugPrint('   Printer ID: ${printer.id}'); // ID da impressora no banco
      debugPrint('   ZPL length: ${zpl.length} bytes');
      debugPrint('   Copies: $copies');

      final response = await http
          .post(
            Uri.parse(url),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $authToken',
            },
            body: jsonEncode({
              'printerId': printer.id, // ID da impressora (não fingerprint)
              'zpl': zpl,
            }),
          )
          .timeout(
            const Duration(seconds: 30),
            onTimeout: () {
              throw Exception('Timeout ao enviar impressão');
            },
          );

      debugPrint('📨 Response status: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        debugPrint('✅ Impressão enviada com sucesso');
        debugPrint('   Job ID: ${data['jobId'] ?? 'N/A'}');

        return TagmentPrintResult.success(
          'Impressão enviada',
          data['jobId']?.toString() ?? 'ws_${DateTime.now().millisecondsSinceEpoch}',
          {
            'method': 'websocket',
            'printer': printer.displayName,
            'printerId': printer.edgeAgentFingerprint,
            'copies': copies,
            'bytes': zpl.length,
            'response': data,
          },
        );
      } else {
        final errorBody = response.body;
        debugPrint('❌ Erro HTTP ${response.statusCode}: $errorBody');

        String errorMessage = 'Erro ao enviar impressão';
        
        // Melhor tratamento de erros
        try {
          final errorData = jsonDecode(errorBody);
          errorMessage = errorData['message'] ?? errorMessage;
          
          // Mensagens específicas para erros comuns
          if (response.statusCode == 400 && errorMessage.contains('Device não está online')) {
            errorMessage = 'Edge-Go está offline. Verifique a conexão.';
          } else if (response.statusCode == 500) {
            errorMessage = 'Edge-Go não está conectado ao servidor. Verifique se está ligado e conectado à internet.';
          }
        } catch (e) {
          // Ignorar erro de parse JSON
        }

        return TagmentPrintResult.error(
          errorMessage,
          {
            'statusCode': response.statusCode,
            'body': errorBody,
            'printer': printer.displayName,
          },
        );
      }
    } catch (e) {
      debugPrint('❌ Exceção ao enviar via WebSocket: $e');
      return TagmentPrintResult.error(
        'Falha na comunicação: $e',
        {
          'printer': printer.displayName,
          'error': e.toString(),
        },
      );
    }
  }

  /// Aplicar offsets X e Y no ZPL
  String _applyOffsets(String zpl, double offsetX, double offsetY) {
    if (offsetX == 0.0 && offsetY == 0.0) {
      return zpl;
    }

    debugPrint('🔧 Aplicando offsets: X=${offsetX}mm, Y=${offsetY}mm');

    // Converter mm para dots (8 dots/mm para 203 DPI)
    final int offsetXDots = (offsetX * 8).round();
    final int offsetYDots = (offsetY * 8).round();

    // Aplicar offset usando ^LH (Label Home)
    // ^LH define a posição inicial de todos os comandos subsequentes
    final lines = zpl.split('\n');
    final buffer = StringBuffer();

    bool offsetApplied = false;

    for (var line in lines) {
      // Adicionar ^LH após ^XA (início da etiqueta)
      if (line.trim().startsWith('^XA') && !offsetApplied) {
        buffer.writeln(line);
        buffer.writeln('^LH$offsetXDots,$offsetYDots');
        offsetApplied = true;
      } else {
        buffer.writeln(line);
      }
    }

    return buffer.toString();
  }

  /// Adicionar múltiplas cópias no ZPL
  String _addCopies(String zpl, int copies) {
    if (copies <= 1) {
      return zpl;
    }

    debugPrint('📄 Adicionando $copies cópias no ZPL');

    // Procurar por ^PQ (Print Quantity) e substituir
    final pqRegex = RegExp(r'\^PQ\d+');
    if (pqRegex.hasMatch(zpl)) {
      return zpl.replaceAll(pqRegex, '^PQ$copies');
    }

    // Se não encontrou ^PQ, adicionar após ^XA
    final lines = zpl.split('\n');
    final buffer = StringBuffer();

    bool pqAdded = false;

    for (var line in lines) {
      buffer.writeln(line);
      
      // Adicionar ^PQ após ^XA
      if (line.trim().startsWith('^XA') && !pqAdded) {
        buffer.writeln('^PQ$copies');
        pqAdded = true;
      }
    }

    return buffer.toString();
  }
}

