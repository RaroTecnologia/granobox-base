import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/granobox_printer_models.dart';
import '../config/api_config.dart';

/// Serviço para gerenciar impressoras 100% via API do Granobox
/// 
/// Este serviço substitui completamente a dependência do Tagment para impressoras,
/// mantendo apenas templates no Tagment.
class GranoboxPrinterService {
  
  /// Buscar todas as impressoras do cliente
  Future<List<GranoboxPrinter>> getPrinters({
    required String token,
    required String clientId,
    String? operationId,
    String? usage,
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
      
      print('🖨️ [GranoboxPrinter] Buscando impressoras: $url');
      
      final response = await http.get(
        Uri.parse(url),
        headers: ApiConfig.getAuthHeaders(token),
      ).timeout(ApiConfig.defaultTimeout);
      
      print('📊 Status: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        print('✅ Impressoras recebidas: ${data.length}');
        
        // Converter para GranoboxPrinter
        return data.map((item) => GranoboxPrinter.fromJson(item)).toList();
      } else {
        throw Exception('Erro ao buscar impressoras: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao buscar impressoras do Granobox: $e');
      throw Exception('Erro ao buscar impressoras: $e');
    }
  }

  /// Buscar impressoras por tipo de uso (validity, label)
  Future<List<GranoboxPrinter>> getPrintersByUsage({
    required String token,
    required String clientId,
    required String usage,
    String? operationId,
  }) async {
    return getPrinters(
      token: token,
      clientId: clientId,
      operationId: operationId,
      usage: usage,
    );
  }

  /// Buscar impressoras de validade
  Future<List<GranoboxPrinter>> getValidityPrinters({
    required String token,
    required String clientId,
    String? operationId,
  }) async {
    return getPrintersByUsage(
      token: token,
      clientId: clientId,
      usage: 'validity',
      operationId: operationId,
    );
  }

  /// Buscar impressoras de rótulo
  Future<List<GranoboxPrinter>> getLabelPrinters({
    required String token,
    required String clientId,
    String? operationId,
  }) async {
    return getPrintersByUsage(
      token: token,
      clientId: clientId,
      usage: 'label',
      operationId: operationId,
    );
  }

  /// Buscar uma impressora específica
  Future<GranoboxPrinter?> getPrinter({
    required String token,
    required String printerId,
  }) async {
    try {
      final url = '${ApiConfig.printersUrl}/$printerId';
      
      print('🖨️ [GranoboxPrinter] Buscando impressora: $url');
      
      final response = await http.get(
        Uri.parse(url),
        headers: ApiConfig.getAuthHeaders(token),
      ).timeout(ApiConfig.defaultTimeout);
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return GranoboxPrinter.fromJson(data);
      } else if (response.statusCode == 404) {
        return null;
      } else {
        throw Exception('Erro ao buscar impressora: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao buscar impressora: $e');
      throw Exception('Erro ao buscar impressora: $e');
    }
  }

  /// Criar nova impressora
  Future<GranoboxPrinter> createPrinter({
    required String token,
    required String clientId,
    required CreatePrinterRequest request,
  }) async {
    try {
      final url = ApiConfig.printersUrl;
      
      final body = {
        ...request.toJson(),
        'clientId': clientId,
      };
      
      print('🖨️ [GranoboxPrinter] Criando impressora: $url');
      print('📦 Body: ${jsonEncode(body)}');
      
      final response = await http.post(
        Uri.parse(url),
        headers: ApiConfig.getAuthHeaders(token),
        body: jsonEncode(body),
      ).timeout(ApiConfig.defaultTimeout);
      
      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        print('✅ Impressora criada com sucesso');
        return GranoboxPrinter.fromJson(data);
      } else {
        final error = jsonDecode(response.body);
        throw Exception('Erro ao criar impressora: ${error['message'] ?? response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao criar impressora: $e');
      throw Exception('Erro ao criar impressora: $e');
    }
  }

  /// Atualizar impressora existente
  Future<GranoboxPrinter> updatePrinter({
    required String token,
    required String printerId,
    required CreatePrinterRequest request,
  }) async {
    try {
      final url = '${ApiConfig.printersUrl}/$printerId';
      
      final body = request.toJson();
      
      print('🖨️ [GranoboxPrinter] Atualizando impressora: $url');
      print('📦 Body: ${jsonEncode(body)}');
      
      final response = await http.patch(
        Uri.parse(url),
        headers: ApiConfig.getAuthHeaders(token),
        body: jsonEncode(body),
      ).timeout(ApiConfig.defaultTimeout);
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('✅ Impressora atualizada com sucesso');
        return GranoboxPrinter.fromJson(data);
      } else {
        final error = jsonDecode(response.body);
        throw Exception('Erro ao atualizar impressora: ${error['message'] ?? response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao atualizar impressora: $e');
      throw Exception('Erro ao atualizar impressora: $e');
    }
  }

  /// Deletar impressora
  Future<void> deletePrinter({
    required String token,
    required String printerId,
  }) async {
    try {
      final url = '${ApiConfig.printersUrl}/$printerId';
      
      print('🖨️ [GranoboxPrinter] Deletando impressora: $url');
      
      final response = await http.delete(
        Uri.parse(url),
        headers: ApiConfig.getAuthHeaders(token),
      ).timeout(ApiConfig.defaultTimeout);
      
      if (response.statusCode == 200 || response.statusCode == 204) {
        print('✅ Impressora deletada com sucesso');
      } else {
        final error = jsonDecode(response.body);
        throw Exception('Erro ao deletar impressora: ${error['message'] ?? response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao deletar impressora: $e');
      throw Exception('Erro ao deletar impressora: $e');
    }
  }

  /// Testar conexão com impressora via TCP
  Future<PrintResult> testPrinter({
    required String token,
    required String printerId,
  }) async {
    try {
      final url = '${ApiConfig.printersUrl}/$printerId/test';
      
      print('🖨️ [GranoboxPrinter] Testando impressora: $url');
      
      final response = await http.post(
        Uri.parse(url),
        headers: ApiConfig.getAuthHeaders(token),
      ).timeout(const Duration(seconds: 30)); // Timeout maior para teste
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return PrintResult.success(
          data['message'] ?? 'Teste realizado com sucesso',
          details: data,
        );
      } else {
        final error = jsonDecode(response.body);
        return PrintResult.error(
          error['message'] ?? 'Erro no teste da impressora',
          errorDetails: error,
        );
      }
    } catch (e) {
      print('❌ Erro ao testar impressora: $e');
      return PrintResult.error(
        'Erro ao testar impressora: $e',
        errorDetails: {'error': e.toString()},
      );
    }
  }

  /// Imprimir ZPL diretamente via API do Granobox
  Future<PrintResult> printZPL({
    required String token,
    required String printerId,
    required String zpl,
    int copies = 1,
  }) async {
    try {
      final url = '${ApiConfig.printersUrl}/$printerId/print';
      
      final body = {
        'zpl': zpl,
        'copies': copies,
      };
      
      print('🖨️ [GranoboxPrinter] Imprimindo ZPL: $url');
      print('📦 ZPL size: ${zpl.length} bytes, copies: $copies');
      
      final response = await http.post(
        Uri.parse(url),
        headers: ApiConfig.getAuthHeaders(token),
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 30)); // Timeout maior para impressão
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return PrintResult.success(
          data['message'] ?? 'Impressão realizada com sucesso',
          jobId: data['jobId'],
          details: data,
        );
      } else {
        final error = jsonDecode(response.body);
        return PrintResult.error(
          error['message'] ?? 'Erro na impressão',
          errorDetails: error,
        );
      }
    } catch (e) {
      print('❌ Erro ao imprimir: $e');
      return PrintResult.error(
        'Erro ao imprimir: $e',
        errorDetails: {'error': e.toString()},
      );
    }
  }

  /// Registrar dispositivo IoT como impressora (Edge-Go, Dot)
  Future<GranoboxPrinter> registerIoTPrinter({
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
    final request = CreatePrinterRequest(
      name: name,
      type: type,
      deviceId: deviceId,
      ip: ip,
      port: port,
      isUSBPrinter: isUSBPrinter,
      usage: usage ?? ['validity'],
      operationId: operationId,
      interface: isUSBPrinter ? 'usb' : 'tcp',
      printMethod: 'tcp',
    );

    return createPrinter(
      token: token,
      clientId: clientId,
      request: request,
    );
  }

  /// Atualizar status de impressora IoT (heartbeat)
  Future<void> updateIoTPrinterStatus({
    required String token,
    required String deviceId,
    required String ip,
    required int port,
    String status = 'active',
  }) async {
    try {
      final url = '${ApiConfig.printersUrl}/iot/heartbeat';
      
      final body = {
        'deviceId': deviceId,
        'ip': ip,
        'port': port,
        'status': status,
      };
      
      print('🖨️ [GranoboxPrinter] Atualizando status IoT: $url');
      
      final response = await http.patch(
        Uri.parse(url),
        headers: ApiConfig.getAuthHeaders(token),
        body: jsonEncode(body),
      ).timeout(ApiConfig.defaultTimeout);
      
      if (response.statusCode == 200) {
        print('✅ Status IoT atualizado com sucesso');
      } else {
        print('⚠️ Erro ao atualizar status IoT: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao atualizar status IoT: $e');
      // Não propagar erro - heartbeat é opcional
    }
  }
}
