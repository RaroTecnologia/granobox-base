import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import '../models/print_result_models.dart';

/// Retorna true se o errorCode indica impressora pausada (API/ws-service pode enviar string).
bool _isPausedErrorCode(dynamic errorCode) {
  if (errorCode == null) return false;
  final s = errorCode.toString().toUpperCase();
  return s == 'PAUSED' || s == 'PRINTER_PAUSED';
}

/// Service para impressão via API v1.5
///
/// Esta é a nova arquitetura onde o backend processa o template
/// e envia o ZPL para o Edge-Go. O Flutter apenas envia os dados.
class V15PrintService {
  final String baseUrl;
  final String authToken;

  V15PrintService({
    required this.baseUrl,
    required this.authToken,
  });

  /// Imprime etiqueta(s) via endpoint v1.5
  /// 
  /// O backend processa o template no Tagment e envia para o Edge-Go.
  /// 
  /// **Para labelType='validity'**:
  /// - Cada cópia gera um código único
  /// - Cria registros no banco para rastreabilidade
  /// - metadata é obrigatório
  /// 
  /// **Para labelType='label'**:
  /// - Todas as cópias são idênticas
  /// - Não cria registros no banco
  /// - metadata é opcional
  /// 
  /// **Para templates multi-coluna**:
  /// - labelData pode ser um Map (single) ou List<Map> (multi-coluna)
  /// - Se for List, cada item representa os dados de uma coluna
  Future<V15PrintResult> printLabel({
    required String printerId,
    required String labelType, // 'validity' ou 'label'
    required String templateId,
    required int copies,
    required dynamic labelData, // Map<String, dynamic> ou List<Map<String, dynamic>>
    Map<String, dynamic>? metadata,
    Map<String, int>? offsets,
  }) async {
    try {
      debugPrint('🖨️  [v1.5] Printing label...');
      debugPrint('   Printer ID: $printerId');
      debugPrint('   Label type: $labelType');
      debugPrint('   Template ID: $templateId');
      debugPrint('   Copies: $copies');

      final url = Uri.parse('$baseUrl/v1.5/print-label');
      
      // Preparar body - labelData pode ser Map ou List
      final body = <String, dynamic>{
        'printerId': printerId,
        'labelType': labelType,
        'templateId': templateId,
        'copies': copies,
        'labelData': labelData, // Pode ser Map ou List<Map>
        if (metadata != null) 'metadata': metadata,
        if (offsets != null) 'offsets': offsets,
      };
      
      // Log para debug
      if (labelData is List) {
        debugPrint('📊 [v1.5] Multi-column template detected: ${labelData.length} columns');
      }

      debugPrint('📤 [v1.5] Sending request...');
      debugPrint('   URL: $url');

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode(body),
      );

      debugPrint('📨 [v1.5] Response status: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        debugPrint('✅ [v1.5] Success!');
        debugPrint('   Job ID: ${data['jobId']}');
        debugPrint('   Message: ${data['message']}');

        if (data['labels'] != null) {
          final labels = List<Map<String, dynamic>>.from(data['labels']);
          debugPrint('   Labels created: ${labels.length}');
          debugPrint('   Codes: ${labels.map((l) => l['code']).join(', ')}');
        }

        return V15PrintResult(
          success: true,
          jobId: data['jobId'],
          message: data['message'],
          labels: data['labels'] != null
              ? List<Map<String, dynamic>>.from(data['labels'])
              : null,
          details: V15PrintDetails.fromJson(data['details']),
        );
      } else {
        final errorBody = response.body;
        debugPrint('❌ [v1.5] Error: ${response.statusCode}');
        debugPrint('   Body: $errorBody');

        String errorMessage = 'Erro ao imprimir';
        try {
          final errorData = jsonDecode(errorBody);
          errorMessage = errorData['message'] ?? errorMessage;
        } catch (e) {
          // Ignorar erro de parse
        }

        return V15PrintResult(
          success: false,
          message: errorMessage,
          error: {
            'statusCode': response.statusCode,
            'body': errorBody,
          },
        );
      }
    } catch (e, stackTrace) {
      debugPrint('💥 [v1.5] Exception: $e');
      debugPrint('   Stack trace: $stackTrace');

      return V15PrintResult(
        success: false,
        message: 'Erro ao conectar com o servidor: $e',
        error: {'exception': e.toString()},
      );
    }
  }

  /// Atalho para imprimir etiqueta de validade (rastreável)
  Future<V15PrintResult> printValidityLabel({
    required String printerId,
    required String templateId,
    required int copies,
    required Map<String, dynamic> labelData,
    required String productId,
    required String validityDate,
    String? operationId,
    String? storageLocationId,
    String? conservationType,
    String? productionDate,
    Map<String, int>? offsets,
  }) {
    return printLabel(
      printerId: printerId,
      labelType: 'validity',
      templateId: templateId,
      copies: copies,
      labelData: labelData,
      metadata: {
        'productId': productId,
        'validityDate': validityDate,
        if (operationId != null) 'operationId': operationId,
        if (storageLocationId != null) 'storageLocationId': storageLocationId,
        if (conservationType != null) 'conservationType': conservationType,
        if (productionDate != null) 'productionDate': productionDate,
      },
      offsets: offsets,
    );
  }

  /// Atalho para imprimir rótulo genérico (não rastreável)
  Future<V15PrintResult> printGenericLabel({
    required String printerId,
    required String templateId,
    required int copies,
    required Map<String, dynamic> labelData,
    Map<String, int>? offsets,
  }) {
    return printLabel(
      printerId: printerId,
      labelType: 'label',
      templateId: templateId,
      copies: copies,
      labelData: labelData,
      offsets: offsets,
    );
  }

  /// Aguarda a confirmação real do dispositivo (print_ack) antes de retornar sucesso/erro.
  /// O timeout é calculado dinamicamente baseado no número de cópias.
  Future<TagmentPrintResult> pollJobStatusUntilComplete({
    required String jobId,
    required String printerName,
    List<Map<String, dynamic>>? labelsFromCreate,
    V15PrintDetails? detailsFromCreate,
    Function(String)? onProgress,
    Duration interval = const Duration(seconds: 2),
    int? maxAttempts, // Se null, calcula baseado em copies
    Duration initialDelay = const Duration(milliseconds: 800),
    int copies = 1, // Número de cópias para calcular timeout
  }) async {
    // ⭐ Calcular maxAttempts dinamicamente baseado no número de cópias
    // Regra: ~2 segundos por etiqueta, mínimo 5 tentativas, máximo 90 tentativas (3 minutos)
    final calculatedAttempts = maxAttempts ?? 
        ((copies * 2 / interval.inSeconds).ceil() + 5).clamp(5, 90);
    
    debugPrint('📡 [v1.5] Aguardando confirmação para job $jobId');
    debugPrint('   Cópias: $copies, Tentativas: $calculatedAttempts, Intervalo: ${interval.inSeconds}s');
    debugPrint('   Timeout máximo: ${calculatedAttempts * interval.inSeconds}s');
    
    // ⭐ Sempre mostrar "Imprimindo..." antes de começar o polling
    final copiesText = copies > 1 ? '$copies etiquetas' : '1 etiqueta';
    debugPrint('📢 [Progresso] Imprimindo $copiesText...');
    onProgress?.call('Imprimindo $copiesText...');
    // Delay mínimo para usuário ver a mensagem
    await Future.delayed(initialDelay > Duration.zero ? initialDelay : const Duration(milliseconds: 500));
    for (var attempt = 1; attempt <= calculatedAttempts; attempt++) {
      // ⭐ Mensagem mais amigável baseada no progresso
      final progressPercent = ((attempt / calculatedAttempts) * 100).round();
      String progressMsg;
      if (copies > 10) {
        // Para muitas etiquetas, mostrar porcentagem estimada
        progressMsg = 'Imprimindo $copiesText... $progressPercent%';
      } else {
        progressMsg = 'Imprimindo $copiesText...';
      }
      // Só atualizar a mensagem se mudou (evita flickering)
      debugPrint('📢 [Progresso] $progressMsg (tentativa $attempt)');
      try {
        final url = Uri.parse('$baseUrl/edge/jobs/$jobId');
        final response = await http.get(
          url,
          headers: {'Authorization': 'Bearer $authToken'},
        ).timeout(const Duration(seconds: 8));
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          final status = (data['status'] ?? '').toString().toLowerCase();
          final message = (data['message'] ?? '').toString();
          final printerStatus = data['printerStatus'];
          debugPrint('📊 [v1.5] Job $jobId status: $status (tentativa $attempt)');
          if (status == 'success') {
            onProgress?.call('Impressão confirmada');
            return TagmentPrintResult.success(
              message.isNotEmpty ? message : 'Impressão confirmada',
              jobId,
              {
                'method': 'v1.5',
                'printer': printerName,
                'status': status,
                'response': data,
                'labels': labelsFromCreate,
                'details': detailsFromCreate != null
                    ? {
                        'printer': detailsFromCreate.printer,
                        'copies': detailsFromCreate.copies,
                        'zplBytes': detailsFromCreate.zplBytes,
                        'timestamp': detailsFromCreate.timestamp,
                      }
                    : null,
              },
            );
          }
          if (status == 'error' || status == 'timeout' || status == 'failed') {
            String friendlyMessage = message;
            if (friendlyMessage.isEmpty) {
              if (printerStatus != null && printerStatus is Map) {
                if (printerStatus['headOpen'] == true) {
                  friendlyMessage = 'Tampa aberta - feche a tampa da impressora';
                } else if (printerStatus['paperOut'] == true) {
                  friendlyMessage = 'Sem etiqueta - recarregue a impressora';
                } else if (printerStatus['ribbonOut'] == true) {
                  friendlyMessage = 'Sem ribbon - troque o ribbon da impressora';
                } else if (printerStatus['paused'] == true ||
                    _isPausedErrorCode(printerStatus['errorCode'])) {
                  friendlyMessage = 'Impressora pausada - retome a impressão';
                } else if (printerStatus['errorMessage'] != null) {
                  friendlyMessage = printerStatus['errorMessage'].toString();
                } else if (printerStatus['errorCode'] != null) {
                  friendlyMessage = 'Erro: ${printerStatus['errorCode']}';
                }
              }
              if (friendlyMessage.isEmpty) {
                friendlyMessage = status == 'timeout'
                    ? 'Impressora não respondeu a tempo'
                    : 'Erro na impressora';
              }
            }
            onProgress?.call(friendlyMessage);
            return TagmentPrintResult.error(friendlyMessage, {
              'status': status,
              'printer': printerName,
              'jobId': jobId,
              'response': data,
              'printerStatus': printerStatus,
              'method': 'v1.5',
            });
          }
        } else if (response.statusCode == 404) {
          debugPrint('⌛ [v1.5] Job $jobId ainda não encontrado (404). Tentativa $attempt');
        } else if (response.statusCode == 401 || response.statusCode == 403) {
          return TagmentPrintResult.error(
            'Sessão expirada ao consultar status da impressão',
            {'status': response.statusCode, 'jobId': jobId},
          );
        }
      } catch (e) {
        debugPrint('⚠️ [v1.5] Erro ao verificar job $jobId: $e');
      }
      if (attempt < calculatedAttempts) {
        await Future.delayed(interval);
      }
    }

    // Última consulta: o ack pode ter chegado logo após a última tentativa.
    // Se o job já estiver em error com printerStatus, exibir esse erro em vez do timeout.
    try {
      final url = Uri.parse('$baseUrl/edge/jobs/$jobId');
      final response = await http.get(
        url,
        headers: {'Authorization': 'Bearer $authToken'},
      ).timeout(const Duration(seconds: 8));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final status = (data['status'] ?? '').toString().toLowerCase();
        final message = (data['message'] ?? '').toString();
        final printerStatus = data['printerStatus'];
        if (status == 'error' || status == 'failed') {
          String friendlyMessage = message;
          if (friendlyMessage.isEmpty && printerStatus != null && printerStatus is Map) {
            if (printerStatus['headOpen'] == true) {
              friendlyMessage = 'Tampa aberta - feche a tampa da impressora';
            } else if (printerStatus['paperOut'] == true) {
              friendlyMessage = 'Sem etiqueta - recarregue a impressora';
            } else if (printerStatus['ribbonOut'] == true) {
              friendlyMessage = 'Sem ribbon - troque o ribbon da impressora';
            } else if (printerStatus['paused'] == true ||
                _isPausedErrorCode(printerStatus['errorCode'])) {
              friendlyMessage = 'Impressora pausada - retome a impressão';
            } else if (printerStatus['errorMessage'] != null) {
              friendlyMessage = printerStatus['errorMessage'].toString();
            } else if (printerStatus['errorCode'] != null) {
              friendlyMessage = 'Erro: ${printerStatus['errorCode']}';
            }
          }
          if (friendlyMessage.isEmpty) friendlyMessage = 'Erro na impressora';
          onProgress?.call(friendlyMessage);
          return TagmentPrintResult.error(friendlyMessage, {
            'status': status,
            'printer': printerName,
            'jobId': jobId,
            'response': data,
            'printerStatus': printerStatus,
            'method': 'v1.5',
          });
        }
      }
    } catch (_) {}

    onProgress?.call('Impressora não respondeu a tempo');
    return TagmentPrintResult.error(
      'Impressora não respondeu a tempo. Verifique se o dispositivo está ligado e conectado.',
      {
        'status': 'timeout',
        'printer': printerName,
        'jobId': jobId,
        'method': 'v1.5',
      },
    );
  }
}

/// Resultado da impressão v1.5
class V15PrintResult {
  final bool success;
  final String? jobId;
  final String message;
  final List<Map<String, dynamic>>? labels; // Para labelType=validity
  final V15PrintDetails? details;
  final Map<String, dynamic>? error;

  V15PrintResult({
    required this.success,
    this.jobId,
    required this.message,
    this.labels,
    this.details,
    this.error,
  });

  /// Retorna os códigos das etiquetas criadas (para validity)
  List<String> get labelCodes {
    if (labels == null) return [];
    return labels!.map((l) => l['code'] as String).toList();
  }
}

/// Detalhes da impressão
class V15PrintDetails {
  final String printer;
  final int copies;
  final int zplBytes;
  final String timestamp;

  V15PrintDetails({
    required this.printer,
    required this.copies,
    required this.zplBytes,
    required this.timestamp,
  });

  factory V15PrintDetails.fromJson(Map<String, dynamic> json) {
    return V15PrintDetails(
      printer: json['printer'],
      copies: json['copies'],
      zplBytes: json['zplBytes'],
      timestamp: json['timestamp'],
    );
  }
}


