import 'dart:io';
import 'dart:convert';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/print_result_models.dart';
import 'printer_mode_service.dart';
// ⚠️ REMOVIDO: import 'mqtt_print_service.dart'; - MQTT foi removido do projeto

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚠️ DEPRECADO: Este serviço está DEPRECADO e será removido em versões futuras
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// ❌ NÃO USE ESTE SERVIÇO EM CÓDIGO NOVO!
//
// ✅ Use em vez disso: WebSocketPrintService (lib/services/websocket_print_service.dart)
//
// 📝 Motivo da depreciação:
//    - Código muito complexo (~885 linhas)
//    - Suporta múltiplos métodos de impressão (TCP, WebSocket, MQTT)
//    - Difícil de manter e testar
//    - Todas as impressoras agora usam WebSocket via Edge-Go
//
// 📚 Documentação da migração: ../MIGRACAO_WEBSOCKET.md
//
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/// Serviço híbrido de impressão (TCP direto + Edge Agent)
/// 
/// @deprecated Use WebSocketPrintService em vez disso
@Deprecated('Use WebSocketPrintService.instance.print() - Ver MIGRACAO_WEBSOCKET.md')
class HybridPrintService {
  static HybridPrintService? _instance;
  final PrinterModeService _modeService = PrinterModeService.instance;

  HybridPrintService._();

  static HybridPrintService get instance {
    _instance ??= HybridPrintService._();
    return _instance!;
  }

  /// Imprimir usando templateId + data (modo recomendado para Edge)
  Future<TagmentPrintResult> printWithTemplate({
    required PrinterInfo printer,
    required String templateId,
    required Map<String, dynamic> templateData,
    required String apiKey,
    String? baseUrl,
    int copies = 1,
  }) async {
    debugPrint(
      '🖨️ Iniciando impressão com template para ${printer.displayName}',
    );
    debugPrint('📋 Template ID: $templateId');
    debugPrint('📦 Template Data: $templateData');

    try {
      // Para impressoras Edge/USB, sempre usar a API do Tagment
      if (printer.isUSBPrinter) {
        return await printViaEdgeWithTemplate(
          printer: printer,
          templateId: templateId,
          templateData: templateData,
          apiKey: apiKey,
          baseUrl: baseUrl,
          copies: copies,
        );
      }

      // Para impressoras TCP, também podemos usar a API (ela resolve automaticamente)
      // Ou podemos gerar o ZPL localmente se preferir
      return await printViaEdgeWithTemplate(
        printer: printer,
        templateId: templateId,
        templateData: templateData,
        apiKey: apiKey,
        baseUrl: baseUrl,
        copies: copies,
      );
    } catch (e) {
      debugPrint('❌ Erro na impressão com template: $e');
      return TagmentPrintResult.error('Erro na impressão: $e', {
        'printer': printer.displayName,
        'error': e.toString(),
      });
    }
  }

  /// Imprimir usando o modo preferido da impressora (com ZPL pré-gerado)
  Future<TagmentPrintResult> print({
    required PrinterInfo printer,
    required String content,
    required String apiKey,
    String? baseUrl,
    String? authToken,
    bool enableFallback = true,
    int copies = 1,
    Function(String)? onProgress, // ⭐ NOVO: Callback de progresso
  }) async {
    onProgress?.call('Gerando etiqueta...'); // ⭐ NOVO
    await Future.delayed(
      const Duration(milliseconds: 300),
    ); // ⭐ Dar tempo para UI atualizar
    debugPrint('🖨️ Iniciando impressão híbrida para ${printer.displayName}');

    try {
      // ✅ ESTRATÉGIA:
      // - Edge-Go (USB): WebSocket com confirmação
      // - Edge-Pro (Network): WebSocket com confirmação
      // - Demais impressoras: TCP direto (ou modo configurado)

      debugPrint('');
      debugPrint('🔍 ========== DEBUG IMPRESSORA ==========');
      debugPrint('🔍 Nome: ${printer.displayName}');
      debugPrint('🔍 ID: ${printer.id}');
      debugPrint('🔍 isUSBPrinter: ${printer.isUSBPrinter}');
      debugPrint('🔍 canUseTCP: ${printer.canUseTCP}');
      debugPrint('🔍 connection: ${printer.connection}');
      debugPrint('🔍 interface: ${printer.interface}');
      debugPrint('🔍 printMethod: ${printer.printMethod}');

      final printerType = printer.connection?['type'] ?? 'tcp';
      final printMethod = printer.printMethod ?? 'tcp';
      final printerInterface = printer.interface;

      debugPrint('');
      debugPrint('📡 Tipo da impressora (connection[type]): $printerType');
      debugPrint('📡 Interface (printer.interface): $printerInterface');
      debugPrint('📡 Método configurado (printer.printMethod): $printMethod');
      debugPrint('📡 Edge Fingerprint: ${printer.edgeAgentFingerprint}');
      debugPrint('');

      // ⭐ DETECTAR TIPO DE EDGE DEVICE
      final isEdgeGo =
          printer.edgeAgentFingerprint?.startsWith('edge-go-') ?? false;
      final isEdgePro =
          printer.edgeAgentFingerprint?.startsWith('edge-pro-') ?? false;

      if (isEdgePro) {
        debugPrint('');
        debugPrint('🚀 ========== FORÇANDO WEBSOCKET PARA EDGE-PRO ==========');
        debugPrint(
          '✅ Detectado Edge-Pro pelo fingerprint: ${printer.edgeAgentFingerprint}',
        );
        debugPrint('✅ SEMPRE usar WebSocket para este dispositivo!');
        debugPrint('========================================================');
        debugPrint('');

        onProgress?.call('Enviando via WebSocket...'); // ⭐ NOVO
        await Future.delayed(const Duration(milliseconds: 200));

        try {
          debugPrint('📡 Imprimindo via WebSocket (forçado)...');
          final wsResult = await _printViaWebSocket(
            printer: printer,
            content: content,
            authToken: authToken,
            copies: copies,
            onProgress: onProgress,
          );

          return wsResult;
        } catch (e) {
          debugPrint('❌ Erro WebSocket: $e');
          onProgress?.call('Impressora não está disponível.');
          return TagmentPrintResult.error(
            'Impressora não está disponível (falha WebSocket)',
            {'error': e.toString()},
          );
        }
      } else if (isEdgeGo) {
        debugPrint('');
        debugPrint('🚀 ========== FORÇANDO WEBSOCKET PARA EDGE-GO ==========');
        debugPrint(
          '✅ Detectado Edge-Go pelo fingerprint: ${printer.edgeAgentFingerprint}',
        );
        debugPrint('✅ SEMPRE usar WebSocket para este dispositivo!');
        debugPrint('====================================================');
        debugPrint('');

        onProgress?.call('Enviando via WebSocket...'); // ⭐ NOVO
        await Future.delayed(const Duration(milliseconds: 200));

        try {
          debugPrint('📡 Imprimindo via WebSocket (forçado)...');
          final wsResult = await _printViaWebSocket(
            printer: printer,
            content: content,
            authToken: authToken,
            copies: copies,
            onProgress: onProgress,
          );

          return wsResult;
        } catch (e) {
          debugPrint('⚠️ Erro ao imprimir via WebSocket: $e');
          onProgress?.call('Impressora não está disponível.');
          return TagmentPrintResult.error(
            'Impressora não está disponível (falha WebSocket)',
            {'error': e.toString()},
          );
        }
      }

      // ⭐ EDGE-GO (USB Printer via ESP32): WebSocket
      if (printerType == 'edge' && printer.isUSBPrinter) {
        debugPrint('✅ Detectado Edge-Go (USB Printer)');
        debugPrint('✅ Estratégia: WebSocket');
        debugPrint('');

        onProgress?.call('Conectando via WebSocket...'); // ⭐ NOVO
        await Future.delayed(
          const Duration(milliseconds: 200),
        ); // ⭐ Dar tempo para UI atualizar

        try {
          debugPrint('📡 Tentando impressão via WebSocket...');
          final wsResult = await _printViaWebSocket(
            printer: printer,
            content: content,
            authToken: authToken,
            copies: copies,
            onProgress: onProgress,
          );

          return wsResult;
        } catch (e) {
          debugPrint('⚠️ Erro ao imprimir via WebSocket: $e');
          onProgress?.call('Impressora não está disponível.');
          return TagmentPrintResult.error(
            'Impressora não está disponível (falha WebSocket)',
            {'error': e.toString()},
          );
        }
      }

      // ⭐ EDGE-PRO (Network Printer via WebSocket): requer confirmação via WebSocket
      if (printerType == 'edge' && !printer.isUSBPrinter) {
        debugPrint('🔵 Detectado Edge-Pro (Network Printer)');
        onProgress?.call('Impressora não está disponível.');
        return TagmentPrintResult.error(
          'Impressora não está disponível (WebSocket não configurado)',
          {'printer': printer.displayName, 'method': 'websocket'},
        );
      }

      // ⭐ Impressoras TCP normais: usar configuração explícita ou padrão TCP
      if (printMethod == 'websocket') {
        onProgress?.call('Conectando via WebSocket...'); // ⭐ NOVO
        await Future.delayed(
          const Duration(milliseconds: 200),
        ); // ⭐ Dar tempo para UI atualizar
        debugPrint('🔄 Impressora TCP configurada para WebSocket');
        return await _printViaWebSocket(
          printer: printer,
          content: content,
          authToken: authToken,
          copies: copies,
          onProgress: onProgress,
        );
      }

      // Padrão: TCP direto
      onProgress?.call('Conectando com impressora...'); // ⭐ NOVO
      await Future.delayed(
        const Duration(milliseconds: 300),
      ); // ⭐ Dar tempo para UI atualizar
      debugPrint('🔄 Usando TCP direto (padrão)');
      return await _printViaTCP(printer, content, copies: copies);
    } catch (e) {
      debugPrint('❌ Erro na impressão híbrida: $e');
      return TagmentPrintResult.error('Erro na impressão: $e', {
        'printer': printer.displayName,
        'error': e.toString(),
      });
    }
  }

  /// Imprimir usando um modo específico
  Future<TagmentPrintResult> _printWithMode({
    required PrinterInfo printer,
    required String content,
    required PrintMode mode,
    required String apiKey,
    String? baseUrl,
    int copies = 1,
    Function(String)? onProgress, // ⭐ NOVO: Callback de progresso
  }) async {
    debugPrint('🔄 Imprimindo via ${mode.displayName}... (${copies} cópias)');
    // Aplicar offsets no ZPL antes de enviar para qualquer modo
    final double offsetX = printer.offsetX ?? 0.0;
    final double offsetY = printer.offsetY ?? 0.0;
    String contentWithOffsets = content;
    if (offsetX != 0.0 || offsetY != 0.0) {
      onProgress?.call('Aplicando ajustes...'); // ⭐ NOVO
      await Future.delayed(
        const Duration(milliseconds: 200),
      ); // ⭐ Dar tempo para UI atualizar
      contentWithOffsets = _applyOffsetsToZPL(content, offsetX, offsetY);
      debugPrint('✅ Offsets aplicados no ZPL (X=${offsetX}mm, Y=${offsetY}mm)');
    } else {
      debugPrint('ℹ️ Offsets não aplicados (X=0mm, Y=0mm)');
    }

    switch (mode) {
      case PrintMode.tcp:
        onProgress?.call('Enviando para impressora...'); // ⭐ NOVO
        await Future.delayed(
          const Duration(milliseconds: 300),
        ); // ⭐ Dar tempo para UI atualizar
        return await _printViaTCP(printer, contentWithOffsets, copies: copies);
      case PrintMode.edge:
        onProgress?.call('Enviando via USB...'); // ⭐ NOVO
        await Future.delayed(
          const Duration(milliseconds: 300),
        ); // ⭐ Dar tempo para UI atualizar
        return await _printViaEdge(
          printer,
          contentWithOffsets,
          apiKey,
          baseUrl,
          copies: copies,
        );
    }
  }

  /// Impressão via TCP direto
  Future<TagmentPrintResult> _printViaTCP(
    PrinterInfo printer,
    String content, {
    int copies = 1,
  }) async {
    if (!printer.canUseTCP) {
      return TagmentPrintResult.error('Impressora não suporta TCP direto', {
        'printer': printer.displayName,
        'reason': 'USB printer',
      });
    }

    final ip = printer.ip;
    if (ip == null) {
      return TagmentPrintResult.error('IP da impressora não encontrado', {
        'printer': printer.displayName,
      });
    }

    Socket? socket;
    try {
      debugPrint('🌐 Conectando via TCP: $ip:9100');

      // Conectar com timeout
      socket = await Socket.connect(
        ip,
        9100,
        timeout: const Duration(seconds: 5),
      );

      // Para TCP direto, implementar múltiplas cópias no ZPL
      String zplWithCopies = _addCopiesToZPL(content, copies);

      // Enviar dados
      socket.add(utf8.encode(zplWithCopies));
      await socket.flush();

      // Aguardar um pouco para garantir que foi enviado
      await Future.delayed(const Duration(milliseconds: 500));

      // Consultar status da impressora via ~HS
      final status = await _queryPrinterStatus(socket, printer);
      debugPrint('📊 Status TCP: $status');

      if (status['error'] != null) {
        return TagmentPrintResult.error(
          'Erro na impressora: ${status['error']}',
          {
            'method': 'tcp',
            'printer': printer.displayName,
            'ip': ip,
            'status': status,
          },
        );
      }

      debugPrint('✅ Impressão TCP enviada com sucesso (${copies} cópias)');
      return TagmentPrintResult.success(
        'Impressão confirmada',
        'tcp_${DateTime.now().millisecondsSinceEpoch}',
        {
          'method': 'tcp',
          'printer': printer.displayName,
          'ip': ip,
          'copies': copies,
          'bytes': utf8.encode(zplWithCopies).length,
          'printerStatus': status,
          'actuallyPrinted': true,
        },
      );
    } on SocketException catch (e) {
      debugPrint('❌ Erro de conexão TCP: $e');
      return TagmentPrintResult.error('Erro de conexão TCP: ${e.message}', {
        'printer': printer.displayName,
        'ip': ip,
        'error_type': 'socket_exception',
        'error': e.toString(),
      });
    } catch (e) {
      debugPrint('❌ Erro TCP: $e');
      return TagmentPrintResult.error('Erro na impressão TCP: $e', {
        'printer': printer.displayName,
        'ip': ip,
        'error': e.toString(),
      });
    } finally {
      try {
        await socket?.close();
      } catch (e) {
        debugPrint('⚠️ Erro ao fechar socket: $e');
      }
    }
  }

  Future<Map<String, dynamic>> _queryPrinterStatus(
    Socket socket,
    PrinterInfo printer,
  ) async {
    try {
      final completer = Completer<String>();
      String buffer = '';

      final sub = socket.listen(
        (data) {
          buffer += utf8.decode(data);
          if (!completer.isCompleted) {
            completer.complete(buffer);
          }
        },
        onError: (e) {
          if (!completer.isCompleted) {
            completer.completeError(e);
          }
        },
      );

      // Enviar ~HS
      socket.add(utf8.encode('~HS\n'));
      await socket.flush();

      String response;
      try {
        response = await completer.future.timeout(const Duration(seconds: 3));
      } catch (_) {
        await sub.cancel();
        // Timeout — assumir sucesso básico
        return {
          'marca': _detectBrand(printer),
          'timeout': true,
          'online': true,
        };
      }

      await sub.cancel();
      return _interpretStatusResponse(response, _detectBrand(printer));
    } catch (e) {
      return {
        'marca': _detectBrand(printer),
        'error': 'Falha ao consultar status: $e',
      };
    }
  }

  String _detectBrand(PrinterInfo printer) {
    final name = (printer.displayName).toLowerCase();
    if (name.contains('zebra')) return 'Zebra';
    if (name.contains('c3tech') || name.contains('c3')) return 'C3TECH';
    final make = printer.capabilities?['make']?.toString().toLowerCase();
    if (make != null) {
      if (make.contains('zebra')) return 'Zebra';
      if (make.contains('c3tech') || make.contains('c3')) return 'C3TECH';
    }
    return 'Desconhecida';
  }

  Map<String, dynamic> _interpretStatusResponse(String response, String brand) {
    debugPrint('📥 Resposta ~HS ($brand): "$response"');
    final lines = response.trim().split('\n');
    if (lines.isEmpty) {
      return {'marca': brand, 'online': true};
    }
    final fields = lines.first.trim().split(',');

    // Zebra: 030,...; considerar campo 2 (tampa), campo 8 (erro real)
    if (brand.toLowerCase() == 'zebra' ||
        (fields.isNotEmpty && fields[0] == '030')) {
      final coverOpen = fields.length > 2 ? fields[2] == '1' : false;
      final errorCode = fields.length > 8 ? fields[8] : '000';
      final status = {
        'marca': 'Zebra',
        'online': true,
        'coverOpen': coverOpen,
        'paperOut': false,
        'errorCode': errorCode,
      };
      if (coverOpen) {
        status['error'] = 'Tampa aberta';
      } else if (errorCode != '000') {
        status['error'] = errorCode == '001'
            ? 'Papel acabou'
            : 'Erro $errorCode';
        if (errorCode == '001') status['paperOut'] = true;
      }
      return status;
    }

    // C3TECH: 150,...; campos de erro básicos
    if (brand.toLowerCase() == 'c3tech' ||
        (fields.isNotEmpty && fields[0] == '150')) {
      final paperOut = fields.length > 1 ? fields[1] == '1' : false;
      final status = {'marca': 'C3TECH', 'online': true, 'paperOut': paperOut};
      if (paperOut) {
        status['error'] = 'Papel acabou';
      }
      return status;
    }

    return {'marca': brand, 'online': true};
  }

  /// ✅ Verificar se tem ESP32 online
  Future<bool> isESP32Edge({
    required PrinterInfo printer,
    required String apiKey,
    String? baseUrl,
  }) async {
    try {
      final url = baseUrl ?? 'https://api.tagment.com.br';
      final endpoint = '$url/edge-agents';

      debugPrint('🔍 Verificando se tem ESP32 online...');

      final response = await http
          .get(
            Uri.parse(endpoint),
            headers: {'Authorization': 'Bearer $apiKey'},
          )
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final responseBody = jsonDecode(response.body);
        List<dynamic> agents = [];

        if (responseBody is List) {
          agents = responseBody;
        } else if (responseBody is Map && responseBody['data'] != null) {
          if (responseBody['data'] is List) {
            agents = responseBody['data'] as List;
          }
        }

        // Verificar se tem algum ESP32 online
        final hasESP32 = agents.any(
          (a) => a['type'] == 'esp32' && a['status'] == 'online',
        );

        debugPrint('🔍 Tem ESP32 online? ${hasESP32 ? "✅ SIM" : "❌ NÃO"}');

        return hasESP32;
      }

      return false;
    } catch (e) {
      debugPrint('⚠️ Erro ao verificar ESP32: $e');
      return false;
    }
  }

  /// ✅ Buscar Edge por fingerprint
  Future<Map<String, dynamic>?> _getEdgeByFingerprint(
    String fingerprint,
    String apiKey,
    String? baseUrl,
  ) async {
    try {
      final url = baseUrl ?? 'https://api.tagment.com.br';
      final endpoint = '$url/edge-agents';

      final response = await http
          .get(
            Uri.parse(endpoint),
            headers: {'Authorization': 'Bearer $apiKey'},
          )
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final responseBody = jsonDecode(response.body);
        List<dynamic> agents = [];

        if (responseBody is List) {
          agents = responseBody;
        } else if (responseBody is Map && responseBody['data'] != null) {
          if (responseBody['data'] is List) {
            agents = responseBody['data'] as List;
          }
        }

        return agents.firstWhere(
          (a) => a['fingerprint'] == fingerprint,
          orElse: () => null,
        );
      }

      return null;
    } catch (e) {
      debugPrint('❌ Erro ao buscar Edge: $e');
      return null;
    }
  }

  /// ✅ NOVO: Enviar múltiplos jobs individuais para ESP32 (em lotes de 5)
  Future<TagmentPrintResult> printMultipleJobsForESP32({
    required PrinterInfo printer,
    required String templateId,
    required List<Map<String, dynamic>> batchData,
    required String apiKey,
    String? baseUrl,
    double offsetX = 0.0,
    double offsetY = 0.0,
    int maxBatchSize = 5, // Máximo 5 jobs por vez
  }) async {
    try {
      final url = baseUrl ?? 'https://api.tagment.com.br';

      debugPrint(
        '🚀 Enviando ${batchData.length} jobs INDIVIDUAIS para ESP32 (lotes de $maxBatchSize)...',
      );

      int totalSuccess = 0;
      int totalError = 0;
      final jobIds = <String>[];

      // Dividir em lotes de N jobs
      for (int i = 0; i < batchData.length; i += maxBatchSize) {
        final end = (i + maxBatchSize < batchData.length)
            ? i + maxBatchSize
            : batchData.length;
        final batch = batchData.sublist(i, end);

        debugPrint(
          '📦 Processando lote ${(i ~/ maxBatchSize) + 1}: jobs ${i + 1} a $end',
        );

        // Enviar jobs do lote em paralelo (mas limitado a maxBatchSize)
        final futures = <Future<Map<String, dynamic>>>[];

        for (int j = 0; j < batch.length; j++) {
          final data = batch[j];
          final jobIndex = i + j + 1;

          futures.add(
            http
                .post(
                  Uri.parse('$url/v1/printers/${printer.id}/print'),
                  headers: {
                    'Authorization': 'Bearer $apiKey',
                    'Content-Type': 'application/json',
                  },
                  body: jsonEncode({'templateId': templateId, 'data': data}),
                )
                .then((response) {
                  if (response.statusCode == 200) {
                    final result = jsonDecode(response.body);
                    debugPrint(
                      '  ✅ Job $jobIndex/${batchData.length} enviado: ${result['jobId']}',
                    );
                    return {'success': true, 'jobId': result['jobId']};
                  } else {
                    debugPrint(
                      '  ❌ Job $jobIndex/${batchData.length} falhou: ${response.statusCode}',
                    );
                    return {'success': false, 'error': response.body};
                  }
                })
                .catchError((e) {
                  debugPrint('  ❌ Job $jobIndex/${batchData.length} erro: $e');
                  return {'success': false, 'error': e.toString()};
                }),
          );
        }

        // Aguardar todos os jobs do lote
        final results = await Future.wait(futures);

        // Contar sucessos e erros
        for (final result in results) {
          if (result['success'] == true) {
            totalSuccess++;
            if (result['jobId'] != null) {
              jobIds.add(result['jobId']);
            }
          } else {
            totalError++;
          }
        }

        // Pequeno delay entre lotes
        if (end < batchData.length) {
          await Future.delayed(const Duration(milliseconds: 200));
        }
      }

      debugPrint('');
      debugPrint('📊 ========================================');
      debugPrint('📊 Impressão ESP32 concluída!');
      debugPrint('📊 ✅ Sucessos: $totalSuccess');
      debugPrint('📊 ❌ Erros: $totalError');
      debugPrint('📊 📋 Total de jobs: ${jobIds.length}');
      debugPrint('📊 ========================================');

      if (totalSuccess == batchData.length) {
        return TagmentPrintResult.success(
          '✅ $totalSuccess etiqueta(s) enviada(s) para fila do ESP32!',
          jobIds.join(','),
          {
            'method': 'esp32_multi_jobs',
            'printer': printer.displayName,
            'totalSuccess': totalSuccess,
            'totalError': totalError,
            'jobIds': jobIds,
          },
        );
      } else if (totalSuccess > 0) {
        return TagmentPrintResult.error(
          '⚠️ $totalSuccess enviadas, $totalError falharam',
          {
            'printer': printer.displayName,
            'totalSuccess': totalSuccess,
            'totalError': totalError,
            'jobIds': jobIds,
          },
        );
      } else {
        return TagmentPrintResult.error(
          '❌ Todas as $totalError etiquetas falharam',
          {'printer': printer.displayName, 'totalError': totalError},
        );
      }
    } catch (e) {
      debugPrint('❌ Erro ao enviar jobs para ESP32: $e');
      return TagmentPrintResult.error('Erro ao enviar jobs: $e', {
        'printer': printer.displayName,
        'error': e.toString(),
      });
    }
  }

  /// Impressão em lote via Edge Agent (print-batch)
  Future<TagmentPrintResult> printBatchWithTemplate({
    required PrinterInfo printer,
    required String templateId,
    required List<Map<String, dynamic>> batchData,
    required String apiKey,
    String? baseUrl,
    double offsetX = 0.0,
    double offsetY = 0.0,
  }) async {
    try {
      final url = baseUrl ?? 'https://api.tagment.com.br';
      final endpoint = '$url/v1/printers/${printer.id}/print-batch';

      debugPrint('☁️ Enviando LOTE via Edge Agent: $endpoint');
      debugPrint('🔍 DEBUG Batch print details:');
      debugPrint('   - printer.id: ${printer.id}');
      debugPrint('   - printer.displayName: ${printer.displayName}');
      debugPrint('   - templateId: $templateId');
      debugPrint('   - apiKey length: ${apiKey.length}');
      debugPrint('   - total labels: ${batchData.length}');
      debugPrint('   - offsetX: $offsetX, offsetY: $offsetY');

      // Montar array de items no formato correto: [{ data: {...} }, { data: {...} }]
      final items = batchData.map((data) => {'data': data}).toList();

      final requestBody = {
        'template': templateId,
        'items': items,
        'offsetX': offsetX,
        'offsetY': offsetY,
      };

      debugPrint('📦 Request body: ${jsonEncode(requestBody)}');

      final response = await http
          .post(
            Uri.parse(endpoint),
            headers: {
              'Authorization': 'Bearer $apiKey',
              'Content-Type': 'application/json',
            },
            body: jsonEncode(requestBody),
          )
          .timeout(const Duration(seconds: 60)); // Timeout maior para batch

      debugPrint('📡 Response status: ${response.statusCode}');
      debugPrint('📡 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        debugPrint('🔍 DEBUG - Response data completo: $data');
        debugPrint('🔍 DEBUG - success: ${data['success']}');
        debugPrint('🔍 DEBUG - message: ${data['message']}');
        debugPrint('🔍 DEBUG - error: ${data['error']}');
        debugPrint('🔍 DEBUG - count: ${data['count']}');
        debugPrint('🔍 DEBUG - jobId: ${data['jobId']}');

        if (data['success'] == true) {
          debugPrint(
            '✅ Lote de ${data['count'] ?? batchData.length} etiquetas enviado com sucesso',
          );
          debugPrint('🆔 Job ID: ${data['jobId']}');

          return TagmentPrintResult.success(
            '✅ ${data['count'] ?? batchData.length} etiqueta(s) enviada(s) em 1 único job!',
            data['jobId'] ?? 'batch_${DateTime.now().millisecondsSinceEpoch}',
            {
              'method': 'edge_batch',
              'printer': printer.displayName,
              'count': data['count'] ?? batchData.length,
              'response': data,
            },
          );
        } else {
          // Tentar pegar mensagem de erro de vários campos possíveis
          final errorMsg =
              data['message'] ??
              data['error'] ??
              data['errorMessage'] ??
              (data['errors'] != null ? data['errors'].toString() : null) ??
              'Erro desconhecido - API retornou success=false';

          debugPrint('❌ Erro na resposta: $errorMsg');
          debugPrint('📊 Response completo: $data');

          return TagmentPrintResult.error(errorMsg, {
            'printer': printer.displayName,
            'response': data,
          });
        }
      } else {
        debugPrint('❌ Erro HTTP Batch: ${response.statusCode}');
        return TagmentPrintResult.error(
          'Erro Edge Agent Batch: ${response.statusCode} - ${response.body}',
          {
            'printer': printer.displayName,
            'status_code': response.statusCode,
            'response': response.body,
          },
        );
      }
    } catch (e) {
      debugPrint('❌ Erro Edge Agent Batch: $e');
      return TagmentPrintResult.error('Erro Edge Agent Batch: $e', {
        'printer': printer.displayName,
        'error': e.toString(),
      });
    }
  }

  /// Impressão via Edge Agent usando templateId + data (igual web-vite)
  /// ✅ Impressão via WebSocket (Edge-Go e Edge-Pro)
  Future<TagmentPrintResult> _printViaWebSocket({
    required PrinterInfo printer,
    required String content,
    String? authToken,
    int copies = 1,
    Function(String)? onProgress,
  }) async {
    debugPrint('⚡ Imprimindo via WebSocket');
    debugPrint('   - Printer: ${printer.displayName}');
    debugPrint('   - Device: ${printer.edgeAgentFingerprint}');
    debugPrint('   - ZPL length: ${content.length} bytes');
    debugPrint('   - Copies: $copies');

    try {
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (authToken != null && authToken.isNotEmpty) {
        headers['Authorization'] = 'Bearer $authToken';
      }

      // ⭐ Para Edge-Go: usar endpoint /mqtt/print (que internamente usa WebSocket)
      // ⭐ Para Edge-Pro: usar endpoint /edge/print
      final isEdgeGo =
          printer.edgeAgentFingerprint?.startsWith('edge-go-') ?? false;
      final isEdgePro =
          printer.edgeAgentFingerprint?.startsWith('edge-pro-') ?? false;

      final deviceId = printer.edgeAgentFingerprint;
      if (deviceId == null || deviceId.isEmpty) {
        throw Exception('Device fingerprint não encontrado');
      }

      http.Response response;

      if (isEdgeGo) {
        // ⭐ Edge-Go: usar endpoint /mqtt/print (compatível, usa WebSocket internamente)
        debugPrint('📡 Usando endpoint /mqtt/print para Edge-Go (WebSocket interno)');
        
        // Converter ZPL para formato de labels (como fazia antes)
        final labelCount = '^XA'.allMatches(content).length;
        final label = {
          'produto': 'Impressão via ZPL',
          'lote': 'ZPL-${DateTime.now().millisecondsSinceEpoch}',
          'validade': DateTime.now()
              .add(const Duration(days: 30))
              .toIso8601String()
              .split('T')[0],
          'customFields': {
            'rawZPL': content,
            'labelCount': labelCount,
          },
        };

        final payload = {
          'printerId': deviceId,
          'labels': [label],
          'printConfig': {'copies': copies},
        };

        response = await http
            .post(
              Uri.parse('${ApiConfig.baseUrl}/mqtt/print'),
              headers: headers,
              body: jsonEncode(payload),
            )
            .timeout(const Duration(seconds: 15));
      } else {
        // ⭐ Edge-Pro ou outros: usar endpoint /edge/print
        debugPrint('📡 Usando endpoint /edge/print para Edge-Pro');
        
        final printerId = isEdgePro ? 'auto-usb-lp0' : (printer.edgeAgentFingerprint ?? 'auto-usb-lp0');
        
        response = await http
            .post(
              Uri.parse('${ApiConfig.baseUrl}/edge/print'),
              headers: headers,
              body: jsonEncode({
                'deviceFingerprint': deviceId,
                'printerId': printerId,
                'zpl': content,
                'priority': 'high',
                'copies': copies,
              }),
            )
            .timeout(const Duration(seconds: 15));
      }

      debugPrint('📊 WebSocket response: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final jobId =
            data['jobId'] ?? 'ws_${DateTime.now().millisecondsSinceEpoch}';
        final status = data['status'] ?? 'processing';

        debugPrint('✅ Job WebSocket enviado: $jobId (status: $status)');

        if (status == 'success') {
          onProgress?.call('Impressão confirmada');
          return TagmentPrintResult.success('Impressão confirmada', jobId, {
            'method': 'websocket',
            'printer': printer.displayName,
            'status': status,
            if (data['message'] != null) 'backendMessage': data['message'],
          });
        }

        onProgress?.call(
          'Etiqueta enviada. Aguardando confirmação da impressora...',
        );
        return await _pollJobStatus(
          jobId: jobId,
          authToken: authToken ?? '',
          printerName: printer.displayName,
          onProgress: onProgress,
          initialDelay: const Duration(seconds: 1),
          method: 'websocket',
        );
      } else {
        debugPrint(
          '❌ Erro WebSocket: ${response.statusCode} - ${response.body}',
        );
        onProgress?.call('Impressora não está disponível.');
        return TagmentPrintResult.error(
          'Impressora não está disponível (falha WebSocket)',
          {
            'response': response.body,
            'statusCode': response.statusCode,
            'method': 'websocket',
            'printer': printer.displayName,
          },
        );
      }
    } catch (e) {
      debugPrint('❌ Exceção WebSocket: $e');
      onProgress?.call('Impressora não está disponível.');
      return TagmentPrintResult.error(
        'Impressora não está disponível (falha WebSocket)',
        {
          'error': e.toString(),
          'method': 'websocket',
          'printer': printer.displayName,
        },
      );
    }
  }

  Future<TagmentPrintResult> printViaEdgeWithTemplate({
    required PrinterInfo printer,
    required String templateId,
    required Map<String, dynamic> templateData,
    required String apiKey,
    String? baseUrl,
    int copies = 1,
  }) async {
    try {
      final url = baseUrl ?? 'https://api.tagment.com.br';
      final endpoint = '$url/v1/printers/${printer.id}/print';

      debugPrint('☁️ Enviando via Edge Agent (Template): $endpoint');
      debugPrint('🔍 DEBUG Edge print details:');
      debugPrint('   - printer.id: ${printer.id}');
      debugPrint('   - printer.displayName: ${printer.displayName}');
      debugPrint('   - templateId: $templateId');
      debugPrint('   - apiKey length: ${apiKey.length}');
      debugPrint('   - copies: $copies');
      debugPrint('   - templateData: $templateData');

      final response = await http
          .post(
            Uri.parse(endpoint),
            headers: {
              'Authorization': 'Bearer $apiKey',
              'Content-Type': 'application/json',
            },
            body: jsonEncode({
              'templateId': templateId,
              'data': templateData,
              'copies': copies,
            }),
          )
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        debugPrint('📡 Resposta Edge: $data');

        // Validar campo success da resposta
        if (data['success'] == false) {
          final errorMsg =
              data['message'] ?? data['error'] ?? 'Erro ao imprimir';
          debugPrint('❌ Edge retornou success=false: $errorMsg');
          return TagmentPrintResult.error(errorMsg, {
            'method': 'edge',
            'printer': printer.displayName,
            'response': data,
          });
        }

        debugPrint('✅ Impressão Edge enviada com sucesso');

        return TagmentPrintResult.success(
          'Impressão enviada via Edge Agent',
          data['jobId'] ?? 'edge_${DateTime.now().millisecondsSinceEpoch}',
          {'method': 'edge', 'printer': printer.displayName, 'response': data},
        );
      } else {
        debugPrint('❌ Erro HTTP Edge: ${response.statusCode}');
        return TagmentPrintResult.error(
          'Erro Edge Agent: ${response.statusCode}',
          {
            'printer': printer.displayName,
            'status_code': response.statusCode,
            'response': response.body,
          },
        );
      }
    } catch (e) {
      debugPrint('❌ Erro Edge Agent: $e');
      return TagmentPrintResult.error('Erro Edge Agent: $e', {
        'printer': printer.displayName,
        'error': e.toString(),
      });
    }
  }

  /// ✅ NOVO: Impressão via Edge ESP32 HTTP direto (muito mais rápido e confiável)
  Future<TagmentPrintResult> _printViaEdge(
    PrinterInfo printer,
    String content,
    String apiKey,
    String? baseUrl, {
    int copies = 1,
  }) async {
    String? edgeIp; // ✅ Declarar fora do try para usar no catch

    try {
      // ✅ NOVO: SEMPRE buscar IP do Edge via API Tagment (IP dinâmico)
      debugPrint('🔍 Buscando IP do Edge via API Tagment...');
      edgeIp = await _getEdgeIpFromApi(
        printer.edgeAgentFingerprint,
        apiKey,
        baseUrl,
      );

      if (edgeIp == null) {
        return TagmentPrintResult.error(
          'IP do Edge não encontrado. Verifique se o Edge está online.',
          {
            'printer': printer.displayName,
            'fingerprint': printer.edgeAgentFingerprint,
          },
        );
      }

      final edgePort = printer.edgePort ?? 3001;
      final edgeUrl = 'http://$edgeIp:$edgePort/print';

      debugPrint('🖨️ Imprimindo via Edge ESP32 HTTP direto');
      debugPrint('   - Edge IP: $edgeIp:$edgePort');
      debugPrint('   - Printer: ${printer.displayName}');
      debugPrint('   - ZPL length: ${content.length} bytes');
      debugPrint('   - Copies: $copies');

      // ✅ NOVO: Enviar ZPL direto via HTTP POST (text/plain)
      final response = await http
          .post(
            Uri.parse(edgeUrl),
            headers: {'Content-Type': 'text/plain'},
            body: content, // ZPL em texto puro (sem JSON)
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        debugPrint('✅ Impressão Edge ESP32 enviada com sucesso!');
        debugPrint('   - Status: ${data['status']}');
        debugPrint('   - Bytes: ${data['bytes']}');

        return TagmentPrintResult.success(
          'Impressão enviada via Edge ESP32',
          'edge_${DateTime.now().millisecondsSinceEpoch}',
          {
            'method': 'edge-http-direct',
            'printer': printer.displayName,
            'edgeIp': edgeIp,
            'bytes': data['bytes'],
          },
        );
      } else {
        final errorData = jsonDecode(response.body);
        debugPrint('❌ Erro Edge HTTP: ${response.statusCode}');
        debugPrint('   - Message: ${errorData['message']}');

        return TagmentPrintResult.error(
          errorData['message'] ?? 'Erro ao imprimir no Edge',
          {
            'printer': printer.displayName,
            'status_code': response.statusCode,
            'edgeIp': edgeIp,
          },
        );
      }
    } catch (e) {
      debugPrint('❌ Erro ao conectar com Edge ESP32: $e');
      return TagmentPrintResult.error('Erro ao conectar com Edge: $e', {
        'printer': printer.displayName,
        'edgeIp': edgeIp,
        'error': e.toString(),
      });
    }
  }

  /// ✅ NOVO: Buscar IP do Edge via API Tagment
  Future<String?> _getEdgeIpFromApi(
    String? fingerprint,
    String apiKey,
    String? baseUrl,
  ) async {
    try {
      final url = baseUrl ?? 'https://api.tagment.com.br';
      final endpoint = '$url/edge-agents';

      debugPrint('🔍 Buscando Edge Agents em: $endpoint');
      if (fingerprint != null && fingerprint.isNotEmpty) {
        debugPrint('   - Fingerprint: $fingerprint');
      } else {
        debugPrint('   - Sem fingerprint, buscando primeiro Edge online');
      }

      final response = await http
          .get(
            Uri.parse(endpoint),
            headers: {'Authorization': 'Bearer $apiKey'},
          )
          .timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final responseBody = jsonDecode(response.body);

        debugPrint(
          '🔍 DEBUG - Tipo do response body: ${responseBody.runtimeType}',
        );
        debugPrint('🔍 DEBUG - Response body: $responseBody');

        // ✅ CORREÇÃO: API pode retornar objeto ou array
        List<dynamic> agents = [];

        if (responseBody is List) {
          debugPrint('✅ Response é um array');
          agents = responseBody;
        } else if (responseBody is Map && responseBody['data'] != null) {
          debugPrint('✅ Response é Map com campo data');
          debugPrint(
            '🔍 DEBUG - Tipo de data: ${responseBody['data'].runtimeType}',
          );

          if (responseBody['data'] is List) {
            agents = responseBody['data'] as List;
          } else {
            debugPrint('⚠️ Campo data não é array, convertendo objeto único');
            agents = [responseBody['data']];
          }
        } else if (responseBody is Map) {
          debugPrint('✅ Response é Map único, convertendo para array');
          agents = [responseBody];
        } else {
          debugPrint('❌ Response em formato desconhecido');
        }

        debugPrint('📊 Total de Edge Agents: ${agents.length}');

        if (agents.isEmpty) {
          debugPrint('⚠️ Nenhum Edge Agent encontrado');
          return null;
        }

        dynamic agent;

        if (fingerprint != null && fingerprint.isNotEmpty) {
          // Buscar pelo fingerprint específico
          agent = agents.firstWhere(
            (a) => a['fingerprint'] == fingerprint && a['status'] == 'online',
            orElse: () => null,
          );
        } else {
          // ✅ PRIORIDADE 1: Pegar ESP32 online (tem HTTP direto na porta 3001)
          agent = agents.firstWhere(
            (a) => a['status'] == 'online' && a['type'] == 'esp32',
            orElse: () => null,
          );

          debugPrint(
            '🔍 Procurando ESP32 online: ${agent != null ? "✅ Encontrado (${agent['name']})" : "❌ Não encontrado"}',
          );

          // Se não encontrou ESP32, pegar qualquer Edge online com impressora
          if (agent == null) {
            agent = agents.firstWhere((a) {
              if (a['status'] != 'online') return false;

              // Verificar printersList (array) ou printers (número)
              final printersList = a['printersList'];
              final printersCount = a['printers'];

              // Se tem printersList e não está vazio
              if (printersList != null &&
                  printersList is List &&
                  printersList.isNotEmpty) {
                return true;
              }

              // Se tem printers > 0 (número)
              if (printersCount != null &&
                  printersCount is int &&
                  printersCount > 0) {
                return true;
              }

              return false;
            }, orElse: () => null);

            debugPrint(
              '🔍 Edge genérico online: ${agent != null ? "✅ Encontrado (${agent['name']})" : "❌ Não encontrado"}',
            );
          }

          // Se ainda não encontrou, pegar qualquer um online
          if (agent == null) {
            agent = agents.firstWhere(
              (a) => a['status'] == 'online',
              orElse: () => null,
            );

            debugPrint(
              '🔍 Qualquer Edge online: ${agent != null ? "✅ Encontrado (${agent['name']})" : "❌ Não encontrado"}',
            );
          }
        }

        if (agent != null && agent['ip'] != null) {
          debugPrint('✅ IP do Edge encontrado: ${agent['ip']}');
          debugPrint('   - Nome: ${agent['name']}');
          debugPrint('   - Status: ${agent['status']}');
          return agent['ip'];
        } else {
          debugPrint('⚠️ Nenhum Edge online encontrado');
        }
      } else {
        debugPrint('❌ Erro ao buscar Edge Agents: ${response.statusCode}');
      }

      return null;
    } catch (e) {
      debugPrint('❌ Erro ao buscar IP do Edge: $e');
      return null;
    }
  }

  /// Testar conectividade de uma impressora em ambos os modos
  Future<Map<PrintMode, bool>> testPrinterConnectivity({
    required PrinterInfo printer,
    required String apiKey,
    String? baseUrl,
  }) async {
    debugPrint(
      '🔍 Testando conectividade da impressora ${printer.displayName}',
    );

    final results = <PrintMode, bool>{};

    // Testar TCP se disponível
    if (printer.canUseTCP) {
      results[PrintMode.tcp] = await _testTCPConnection(printer);
    } else {
      results[PrintMode.tcp] = false;
    }

    // Testar Edge Agent
    results[PrintMode.edge] = await _testEdgeConnection(
      printer,
      apiKey,
      baseUrl,
    );

    return results;
  }

  /// Testar conexão TCP
  Future<bool> _testTCPConnection(PrinterInfo printer) async {
    final ip = printer.ip;
    if (ip == null) return false;

    Socket? socket;
    try {
      socket = await Socket.connect(
        ip,
        9100,
        timeout: const Duration(seconds: 3),
      );
      return true;
    } catch (e) {
      return false;
    } finally {
      try {
        await socket?.close();
      } catch (e) {
        // Ignorar erro ao fechar
      }
    }
  }

  /// Testar conexão Edge Agent
  Future<bool> _testEdgeConnection(
    PrinterInfo printer,
    String apiKey,
    String? baseUrl,
  ) async {
    try {
      final url = baseUrl ?? 'https://api.tagment.com.br';
      final endpoint = '$url/v1/printers/${printer.id}';

      final response = await http
          .get(
            Uri.parse(endpoint),
            headers: {'Authorization': 'Bearer $apiKey'},
          )
          .timeout(const Duration(seconds: 5));

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  /// Adicionar comando de cópias ao ZPL para impressão TCP direta
  String _addCopiesToZPL(String zpl, int copies) {
    if (copies <= 1) {
      return zpl; // Sem modificação se for 1 cópia
    }

    // Verificar se já tem comando ^PQ
    if (zpl.contains('^PQ')) {
      debugPrint('⚠️ ZPL já contém comando ^PQ, não modificando');
      return zpl;
    }

    // Adicionar comando ^PQ após ^XA
    if (zpl.startsWith('^XA')) {
      final modifiedZpl = zpl.replaceFirst('^XA', '^XA^PQ$copies');
      debugPrint('✅ Adicionado comando ^PQ$copies ao ZPL');
      return modifiedZpl;
    }

    debugPrint('⚠️ ZPL não começa com ^XA, não modificando');
    return zpl;
  }

  /// Aplicar offsets no código ZPL (converte mm -> pontos 8dp/mm e ajusta ^FOx,y)
  String _applyOffsetsToZPL(String zpl, double offsetXmm, double offsetYmm) {
    if (offsetXmm == 0.0 && offsetYmm == 0.0) {
      return zpl;
    }
    final int dx = (offsetXmm * 8).round();
    final int dy = (offsetYmm * 8).round();
    final foRegex = RegExp(r'\^FO(\d+),(\d+)');
    final ftRegex = RegExp(r'\^FT(\d+),(\d+)');
    String modified = zpl.replaceAllMapped(foRegex, (m) {
      final x = int.parse(m.group(1)!);
      final y = int.parse(m.group(2)!);
      final nx = (x + dx).clamp(0, 9999);
      final ny = (y + dy).clamp(0, 9999);
      return '^FO$nx,$ny';
    });
    modified = modified.replaceAllMapped(ftRegex, (m) {
      final x = int.parse(m.group(1)!);
      final y = int.parse(m.group(2)!);
      final nx = (x + dx).clamp(0, 9999);
      final ny = (y + dy).clamp(0, 9999);
      return '^FT$nx,$ny';
    });
    return modified;
  }

  /// Polling assíncrono para verificar status do job
  Future<TagmentPrintResult> _pollJobStatus({
    required String jobId,
    required String authToken,
    required String printerName,
    Function(String)? onProgress,
    Duration interval = const Duration(seconds: 2),
    Duration timeout = const Duration(seconds: 10),
    Duration initialDelay = Duration.zero,
    String method = 'websocket',
  }) async {
    debugPrint(
      '📡 Iniciando polling para job $jobId (timeout: ${timeout.inSeconds}s)',
    );

    if (initialDelay > Duration.zero) {
      await Future.delayed(initialDelay);
    }

    final start = DateTime.now();
    var attempt = 0;

    while (DateTime.now().difference(start) < timeout) {
      attempt++;
      onProgress?.call('Aguardando impressora... (tentativa $attempt)');

      try {
        final response = await http
            .get(
              Uri.parse('${ApiConfig.baseUrl}/edge/jobs/$jobId'),
              headers: {'Authorization': 'Bearer $authToken'},
            )
            .timeout(const Duration(seconds: 6));

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          final status = (data['status'] ?? '').toString().toLowerCase();
          final message = (data['message'] ?? '').toString();

          debugPrint('📊 Job $jobId status: $status (attempt $attempt)');

          if (status == 'success') {
            onProgress?.call('Impressão confirmada');
            return TagmentPrintResult.success('Impressão confirmada', jobId, {
              'method': method,
              'printer': printerName,
              'status': status,
              'response': data,
              if (message.isNotEmpty) 'backendMessage': message,
            });
          }

          if (status == 'error' || status == 'timeout' || status == 'failed') {
            final friendlyMessage = message.isNotEmpty
                ? message
                : status == 'timeout'
                ? 'Impressora não está disponível (sem confirmação)'
                : 'Impressora não está disponível';

            onProgress?.call('Impressora não está disponível.');
            return TagmentPrintResult.error(friendlyMessage, {
              'status': status,
              'printer': printerName,
              'jobId': jobId,
              'response': data,
              'method': method,
            });
          }
        } else if (response.statusCode == 404) {
          // Job ainda não registrado no backend - aguardar
          debugPrint(
            '⌛ Job $jobId ainda não encontrado (404). Tentativa $attempt',
          );
        } else if (response.statusCode == 401 || response.statusCode == 403) {
          onProgress?.call('Sessão expirada ao consultar impressora.');
          return TagmentPrintResult.error(
            'Impressora não está disponível (sessão expirada)',
            {
              'status': response.statusCode,
              'printer': printerName,
              'jobId': jobId,
              'method': method,
            },
          );
        } else {
          debugPrint(
            '⚠️ Resposta inesperada ao verificar job $jobId: ${response.statusCode}',
          );
        }
      } catch (e) {
        debugPrint('⚠️ Erro ao verificar status do job $jobId: $e');
      }

      await Future.delayed(interval);
    }

    onProgress?.call('Timeout aguardando impressora.');
    return TagmentPrintResult.error(
      'Impressora não está disponível (sem confirmação)',
      {
        'status': 'timeout',
        'printer': printerName,
        'jobId': jobId,
        'method': method,
      },
    );
  }
}

