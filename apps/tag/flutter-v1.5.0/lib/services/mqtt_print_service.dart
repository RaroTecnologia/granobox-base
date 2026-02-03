import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/print_result_models.dart';

/// Serviço para impressão via MQTT
class MqttPrintService {
  static String get _baseUrl => AppConfig.apiBaseUrl;

  /// Enviar job de impressão via MQTT
  static Future<TagmentPrintResult> printViaMQTT({
    required PrinterInfo printer,
    required List<Map<String, dynamic>> labels,
    String? authToken,
    Map<String, dynamic>? printConfig,
  }) async {
    try {
      print('📡 [MQTT] Enviando job de impressão via MQTT');
      print('🖨️ [MQTT] Impressora: ${printer.displayName}');
      print('📦 [MQTT] Etiquetas: ${labels.length}');

      // ⭐ CORREÇÃO: Usar deviceId (edge-go-d7e2b4) ao invés do UUID
      final printerId = printer.edgeAgentFingerprint ?? printer.id;
      print('🔍 [MQTT] Printer UUID: ${printer.id}');
      print('🔍 [MQTT] Device ID (para MQTT): $printerId');

      // Preparar payload
      final payload = {
        'printerId': printerId, // ⭐ USAR deviceId aqui!
        'labels': labels,
        if (printConfig != null) 'printConfig': printConfig,
      };

      print('📤 [MQTT] Payload: ${jsonEncode(payload)}');

      // Headers
      final headers = {
        'Content-Type': 'application/json',
        if (authToken != null) 'Authorization': 'Bearer $authToken',
      };

      // Enviar para endpoint MQTT
      final url = '$_baseUrl/mqtt/print';
      print('🌐 [MQTT] URL: $url');

      final response = await http
          .post(Uri.parse(url), headers: headers, body: jsonEncode(payload))
          .timeout(
            const Duration(seconds: 10),
            onTimeout: () {
              throw Exception('Timeout ao enviar job MQTT');
            },
          );

      print('📊 [MQTT] Status: ${response.statusCode}');
      print('📄 [MQTT] Response: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        final jobId = data['jobId'];
        final mqttTopic = data['mqttTopic'];
        final status = (data['status'] ?? 'processing').toString();

        print('✅ [MQTT] Job enviado com sucesso!');
        print('🆔 [MQTT] Job ID: $jobId');
        print('📡 [MQTT] Tópico: $mqttTopic');

        return TagmentPrintResult.success(
          status == 'success'
              ? 'Impressão concluída via MQTT'
              : 'Job enfileirado via MQTT (${labels.length} etiqueta${labels.length > 1 ? 's' : ''})',
          jobId,
          {
            'method': 'mqtt',
            'printer': printer.displayName,
            'printerId': printer.id,
            'labelCount': labels.length,
            'mqttTopic': mqttTopic,
            'timestamp': data['timestamp'],
            'status': status,
          },
        );
      } else {
        print('❌ [MQTT] Erro HTTP ${response.statusCode}');
        return TagmentPrintResult.error(
          'Erro ao enviar job MQTT: ${response.statusCode}',
          {
            'method': 'mqtt',
            'statusCode': response.statusCode,
            'response': response.body,
          },
        );
      }
    } catch (e, stackTrace) {
      print('❌ [MQTT] Exceção: $e');
      print('❌ [MQTT] Stack: $stackTrace');

      return TagmentPrintResult.error('Erro na impressão MQTT: $e', {
        'method': 'mqtt',
        'error': e.toString(),
        'stackTrace': stackTrace.toString(),
      });
    }
  }

  /// Enviar job de impressão MQTT com ZPL pré-gerado
  static Future<TagmentPrintResult> printZplViaMQTT({
    required PrinterInfo printer,
    required String zpl,
    String? authToken,
    int copies = 1,
  }) async {
    // Contar quantas etiquetas tem no ZPL (cada ^XA é uma etiqueta)
    final labelCount = '^XA'.allMatches(zpl).length;

    print('📊 [MQTT] ZPL contém $labelCount etiqueta(s)');

    // Converter ZPL para formato de etiqueta genérica
    // Por enquanto, vamos enviar como raw ZPL no campo customFields
    final label = {
      'produto': 'Impressão via ZPL',
      'lote': 'ZPL-${DateTime.now().millisecondsSinceEpoch}',
      'validade': DateTime.now()
          .add(const Duration(days: 30))
          .toIso8601String()
          .split('T')[0],
      'customFields': {
        'rawZPL': zpl,
        'labelCount': labelCount, // Informar quantidade real de etiquetas
      },
    };

    final result = await printViaMQTT(
      printer: printer,
      labels: [label],
      authToken: authToken,
      printConfig: {'copies': copies},
    );

    // Ajustar mensagem com a quantidade real
    if (result.success) {
      return TagmentPrintResult.success(
        'Job enviado via MQTT ($labelCount etiqueta${labelCount > 1 ? 's' : ''})',
        result.jobId ?? '',
        {
          'labelCount': labelCount,
          'method': 'mqtt',
          'printer': printer.displayName,
        },
      );
    }

    return result;
  }

  /// Verificar status de um job MQTT (futuro)
  static Future<Map<String, dynamic>?> getJobStatus(String jobId) async {
    try {
      final url = '$_baseUrl/mqtt/jobs/$jobId';
      final response = await http.get(Uri.parse(url));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('❌ Erro ao buscar status do job: $e');
      return null;
    }
  }

  /// Obter estatísticas do broker MQTT
  static Future<Map<String, dynamic>?> getMqttStats() async {
    try {
      final url = '$_baseUrl/mqtt/stats';
      final response = await http.get(Uri.parse(url));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('❌ Erro ao buscar stats MQTT: $e');
      return null;
    }
  }
}
