import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/print_result_models.dart';
import '../config/api_config.dart';

/// Serviço para buscar impressoras do backend Granobox (filtradas por operação)
class GranoboxPrintersService {

  /// Buscar impressoras filtradas por operação
  /// 
  /// Retorna impressoras da operação específica + impressoras globais (sem operação)
  Future<List<PrinterInfo>> getPrintersByOperation({
    required String token,
    required String clientId,
    String? operationId,
    String? usage, // 'validity', 'label', etc.
    String? tagmentApiKey, // ✅ NOVO: API Key do Tagment para enriquecimento
  }) async {
    try {
      // Construir URL com query params
      String url = '${ApiConfig.printersUrl}?clientId=$clientId';
      
      if (operationId != null) {
        url += '&operationId=$operationId';
      }
      
      if (usage != null) {
        url += '&usage=$usage';
      }
      
      // ✅ NOVO: Passar API key do Tagment para enriquecimento
      if (tagmentApiKey != null && tagmentApiKey.isNotEmpty) {
        url += '&apiKey=$tagmentApiKey';
      }
      
      print('🖨️ [Granobox] Buscando impressoras: $url');
      
      final response = await http.get(
        Uri.parse(url),
        headers: ApiConfig.getAuthHeaders(token),
      ).timeout(ApiConfig.defaultTimeout);
      
      print('📊 Status: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        print('✅ Impressoras recebidas: ${data.length}');
        
        // 🔍 DEBUG: Mostrar campos brand/model da primeira impressora
        if (data.isNotEmpty) {
          final first = data[0];
          print('🔍 [DEBUG] Primeira impressora:');
          print('   name: ${first['name']}');
          print('   brand: ${first['brand']}');
          print('   model: ${first['model']}');
        }
        
        // Converter para PrinterInfo (adapter)
        return data.map((item) => _convertGranoboxPrinterToTagment(item)).toList();
      } else {
        throw Exception('Erro ao buscar impressoras: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao buscar impressoras do Granobox: $e');
      throw Exception('Erro ao buscar impressoras: $e');
    }
  }

  /// Converter impressora do formato Granobox para PrinterInfo
  PrinterInfo _convertGranoboxPrinterToTagment(Map<String, dynamic> granoboxPrinter) {
    // ⭐ NOVO: Agora Granobox armazena TODOS os dados da impressora
    return PrinterInfo(
      id: granoboxPrinter['id'],
      displayName: granoboxPrinter['name'] ?? 'Impressora',
      status: granoboxPrinter['status'] ?? 'unknown',
      location: granoboxPrinter['location'],
      printsToday: 0, // TODO: Implementar rastreamento de impressões
      totalPrints: 0,
      lastSeenAt: granoboxPrinter['updatedAt'] != null 
          ? DateTime.parse(granoboxPrinter['updatedAt'])
          : null,
      errorMessage: null,
      tags: granoboxPrinter['usage'] != null 
          ? List<String>.from(granoboxPrinter['usage'])
          : null,
      // ⭐ NOVO: Dados de conexão completos do Granobox
      connection: {
        'type': granoboxPrinter['type'] ?? 'tcp',
        'host': granoboxPrinter['ip'],
        'port': granoboxPrinter['port'],
        'protocol': granoboxPrinter['type'] ?? 'tcp',
      },
      // ⭐ NOVO: Capabilities completas do Granobox
      capabilities: granoboxPrinter['capabilities'] != null
          ? Map<String, dynamic>.from(granoboxPrinter['capabilities'])
          : null,
      // ⭐ NOVO: Offsets do Granobox
      // ✅ CORRIGIDO: Manter null se não existir ou se parse falhar (consistente com PrinterInfo.fromJson)
      offsetX: granoboxPrinter['offsetX'] != null 
          ? double.tryParse(granoboxPrinter['offsetX'].toString())
          : null,
      offsetY: granoboxPrinter['offsetY'] != null 
          ? double.tryParse(granoboxPrinter['offsetY'].toString())
          : null,
      // ⭐ NOVO: Dados de dispositivo IoT (Edge-Go, Dot)
      edgeAgentFingerprint: granoboxPrinter['deviceId'], 
      edgeIp: granoboxPrinter['ip'],
      edgePort: granoboxPrinter['port'],
      operationId: granoboxPrinter['operationId'],
      interface: granoboxPrinter['interface'],
      printMethod: granoboxPrinter['printMethod'],
      isUSBPrinterFromBackend: granoboxPrinter['isUSBPrinter'],
      // ✅ NOVO: Marca e Modelo da impressora
      brand: granoboxPrinter['brand'],
      model: granoboxPrinter['model'],
      // ✅ NOVO: Campo isDefault
      isDefault: granoboxPrinter['isDefault'] ?? false,
    );
  }

  /// Buscar impressoras por uso específico
  Future<List<PrinterInfo>> getPrintersByUsage({
    required String token,
    required String clientId,
    required String usage,
    String? operationId,
  }) async {
    return getPrintersByOperation(
      token: token,
      clientId: clientId,
      operationId: operationId,
      usage: usage,
    );
  }
}


