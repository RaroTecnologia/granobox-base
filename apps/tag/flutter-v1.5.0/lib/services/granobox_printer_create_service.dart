import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

/// Serviço para criar impressoras diretamente no Granobox (sem Tagment)
class GranoboxPrinterCreateService {

  /// Criar nova impressora TCP no Granobox
  /// 
  /// [operationId] - ID da operação à qual a impressora está vinculada (opcional)
  ///                 Se não informado, impressora fica disponível para todas as operações
  Future<bool> createTCPPrinter({
    required String token,
    required String clientId,
    required String createdById,
    required String name,
    required String ip,
    required int port,
    String? location,
    List<String>? usage,
    String? operationId, // ⭐ Vincular impressora a uma operação específica
    Map<String, dynamic>? capabilities,
    double offsetX = 0.0,
    double offsetY = 0.0,
    String? brand,
    String? model,
  }) async {
    try {
      print('🖨️ [Granobox] Criando impressora TCP: $name ($ip:$port)');

      final response = await http.post(
        Uri.parse(ApiConfig.printersUrl),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'name': name,
          'type': 'tcp',
          'ip': ip,
          'port': port,
          'location': location ?? 'Não definida',
          'usage': usage ?? ['validity'],
          'clientId': clientId,
          'createdById': createdById,
          'operationId': operationId,
          'capabilities': capabilities ?? {
            'dpi': 203,
            'maxWidthMm': 104,
            'maxHeightMm': 150,
            'supportsZPL': true,
            'supportsCutter': false,
            'supportsColor': false,
          },
          'offsetX': offsetX,
          'offsetY': offsetY,
          'brand': brand,
          'model': model,
          'status': 'active',
          'isActive': true,
        }),
      );

      print('📊 Status: ${response.statusCode}');

      if (response.statusCode == 201 || response.statusCode == 200) {
        print('✅ Impressora TCP criada com sucesso');
        return true;
      } else {
        print('❌ Erro ao criar impressora: ${response.statusCode}');
        print('   Body: ${response.body}');
        throw Exception('Erro ao criar impressora: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao criar impressora TCP: $e');
      throw Exception('Erro ao criar impressora: $e');
    }
  }

  /// Criar nova impressora USB (via Edge-Go)
  /// 
  /// [operationId] - ID da operação à qual a impressora está vinculada (opcional)
  ///                 Se não informado, impressora fica disponível para todas as operações
  Future<bool> createUSBPrinter({
    required String token,
    required String clientId,
    required String createdById,
    required String name,
    required String deviceId,
    required String ip,
    required int port,
    String? location,
    List<String>? usage,
    String? operationId, // ⭐ Vincular impressora a uma operação específica
    Map<String, dynamic>? capabilities,
    double offsetX = 0.0,
    double offsetY = 0.0,
    String? brand,
    String? model,
  }) async {
    try {
      print('🖨️ [Granobox] Criando impressora USB via Edge-Go: $name');

      final response = await http.post(
        Uri.parse(ApiConfig.printersUrl),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'name': name,
          'type': 'usb',
          'deviceId': deviceId,
          'ip': ip,
          'port': port,
          'isUSBPrinter': true,
          'location': location ?? 'Não definida',
          'usage': usage ?? ['validity'],
          'clientId': clientId,
          'createdById': createdById,
          'operationId': operationId,
          'capabilities': capabilities ?? {
            'dpi': 203,
            'maxWidthMm': 104,
            'maxHeightMm': 150,
            'supportsZPL': true,
            'supportsCutter': false,
            'supportsColor': false,
          },
          'offsetX': offsetX,
          'offsetY': offsetY,
          'brand': brand,
          'model': model,
          'status': 'active',
          'isActive': true,
        }),
      );

      print('📊 Status: ${response.statusCode}');

      if (response.statusCode == 201 || response.statusCode == 200) {
        print('✅ Impressora USB criada com sucesso');
        return true;
      } else {
        print('❌ Erro ao criar impressora: ${response.statusCode}');
        print('   Body: ${response.body}');
        throw Exception('Erro ao criar impressora: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao criar impressora USB: $e');
      throw Exception('Erro ao criar impressora: $e');
    }
  }

  /// Atualizar impressora existente
  Future<bool> updatePrinter({
    required String token,
    required String printerId,
    String? name,
    String? ip,
    int? port,
    String? location,
    List<String>? usage,
    Map<String, dynamic>? capabilities,
    double? offsetX,
    double? offsetY,
    String? brand,
    String? model,
    String? status,
  }) async {
    try {
      print('🖨️ [Granobox] Atualizando impressora: $printerId');

      final Map<String, dynamic> data = {};
      if (name != null) data['name'] = name;
      if (ip != null) data['ip'] = ip;
      if (port != null) data['port'] = port;
      if (location != null) data['location'] = location;
      if (usage != null) data['usage'] = usage;
      if (capabilities != null) data['capabilities'] = capabilities;
      if (offsetX != null) data['offsetX'] = offsetX;
      if (offsetY != null) data['offsetY'] = offsetY;
      if (brand != null) data['brand'] = brand;
      if (model != null) data['model'] = model;
      if (status != null) data['status'] = status;

      final response = await http.patch(
        Uri.parse('${ApiConfig.printersUrl}/$printerId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(data),
      );

      print('📊 Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        print('✅ Impressora atualizada com sucesso');
        return true;
      } else {
        print('❌ Erro ao atualizar impressora: ${response.statusCode}');
        throw Exception('Erro ao atualizar impressora: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao atualizar impressora: $e');
      throw Exception('Erro ao atualizar impressora: $e');
    }
  }

  /// Deletar impressora
  Future<bool> deletePrinter({
    required String token,
    required String printerId,
  }) async {
    try {
      print('🗑️ [Granobox] Deletando impressora: $printerId');

      final response = await http.delete(
        Uri.parse('${ApiConfig.printersUrl}/$printerId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('📊 Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        print('✅ Impressora deletada com sucesso');
        return true;
      } else {
        print('❌ Erro ao deletar impressora: ${response.statusCode}');
        throw Exception('Erro ao deletar impressora: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao deletar impressora: $e');
      throw Exception('Erro ao deletar impressora: $e');
    }
  }

  /// Renomear Edge-Go (atualizar nome do device)
  Future<bool> updateDeviceName({
    required String deviceId,
    required String newName,
    required String authToken,
  }) async {
    try {
      print('✏️ [Granobox] Renomeando device: $deviceId -> $newName');

      final response = await http.patch(
        Uri.parse('${ApiConfig.baseUrl}/devices/$deviceId'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'name': newName,
        }),
      );

      print('📊 Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        print('✅ Device renomeado com sucesso');
        return true;
      } else {
        print('❌ Erro ao renomear device: ${response.statusCode}');
        print('   Body: ${response.body}');
        throw Exception('Erro ao renomear device: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Erro ao renomear device: $e');
      throw Exception('Erro ao renomear device: $e');
    }
  }
}

