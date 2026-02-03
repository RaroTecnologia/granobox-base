import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class TagmentPrinterUpdateService {
  final String _baseUrl = 'https://api.tagment.com.br';

  /// Atualizar configurações de uma impressora no Tagment
  Future<bool> updatePrinter({
    required String printerId,
    required String apiKey,
    double? offsetX,
    double? offsetY,
    String? displayName,
    Map<String, dynamic>? otherSettings,
  }) async {
    try {
      print('🔧 TagmentPrinterUpdateService - Atualizando impressora $printerId...');
      print('🌐 URL: $_baseUrl/v1/printers/$printerId');
      
      final updateData = <String, dynamic>{};
      
      if (offsetX != null) updateData['offsetX'] = offsetX;
      if (offsetY != null) updateData['offsetY'] = offsetY;
      if (displayName != null) updateData['displayName'] = displayName;
      if (otherSettings != null) updateData.addAll(otherSettings);
      
      print('📊 Dados de atualização: $updateData');

      final response = await http.patch(
        Uri.parse('$_baseUrl/v1/printers/$printerId'),
        headers: {
          'Authorization': 'Bearer $apiKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(updateData),
      );

      print('📊 Status: ${response.statusCode}');
      print('📄 Response: ${response.body}');

      if (response.statusCode == 200) {
        print('✅ Impressora atualizada com sucesso');
        return true;
      } else {
        print('❌ Erro ao atualizar impressora: ${response.statusCode}');
        print('📄 Body: ${response.body}');
        return false;
      }
    } catch (e) {
      print('❌ Erro de conexão ao atualizar impressora: $e');
      return false;
    }
  }

  /// Atualizar apenas os offsets de uma impressora
  Future<bool> updatePrinterOffsets({
    required String printerId,
    required String apiKey,
    required double offsetX,
    required double offsetY,
  }) async {
    return await updatePrinter(
      printerId: printerId,
      apiKey: apiKey,
      offsetX: offsetX,
      offsetY: offsetY,
    );
  }
}
