import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/tagment_printer_config_models.dart';

class TagmentPrinterConfigService {
  final String _baseUrl = AppConfig.apiBaseUrl;

  /// Obter configuração atual de impressoras Tagment
  Future<TagmentPrinterConfig?> getTagmentPrinterConfig(String authToken) async {
    try {
      print('🔧 TagmentPrinterConfigService - Obtendo configuração de impressoras...');
      print('🌐 URL: $_baseUrl/config/tagment-printers');

      final response = await http.get(
        Uri.parse('$_baseUrl/config/tagment-printers'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
      );

      print('📊 Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final config = TagmentPrinterConfig.fromJson(jsonDecode(response.body));
        print('✅ Configuração obtida: $config');
        return config;
      } else {
        print('❌ Erro ao obter configuração: ${response.statusCode}');
        print('📄 Body: ${response.body}');
        return null;
      }
    } catch (e) {
      print('❌ Erro de conexão ao obter configuração: $e');
      return null;
    }
  }

  /// Atualizar configuração de impressoras Tagment
  Future<TagmentPrinterConfig?> updateTagmentPrinterConfig({
    required String authToken,
    required UpdateTagmentPrinterConfigRequest request,
  }) async {
    try {
      print('🔧 TagmentPrinterConfigService - Atualizando configuração...');
      print('🌐 URL: $_baseUrl/config/tagment-printers');
      print('📊 Dados: ${request.toJson()}');

      final response = await http.patch(
        Uri.parse('$_baseUrl/config/tagment-printers'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(request.toJson()),
      );

      print('📊 Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final config = TagmentPrinterConfig.fromJson(jsonDecode(response.body));
        print('✅ Configuração atualizada: $config');
        return config;
      } else {
        print('❌ Erro ao atualizar configuração: ${response.statusCode}');
        print('📄 Body: ${response.body}');
        return null;
      }
    } catch (e) {
      print('❌ Erro de conexão ao atualizar configuração: $e');
      return null;
    }
  }

  /// Definir impressora de validade
  Future<bool> setValidadePrinter({
    required String authToken,
    required String printerId,
  }) async {
    final config = await getTagmentPrinterConfig(authToken);
    if (config == null) return false;

    final request = UpdateTagmentPrinterConfigRequest(
      tagmentPrinterValidadeId: printerId,
      tagmentPrinterRotuloId: config.tagmentPrinterRotuloId,
    );

    final updatedConfig = await updateTagmentPrinterConfig(
      authToken: authToken,
      request: request,
    );

    return updatedConfig != null;
  }

  /// Definir impressora de rótulo
  Future<bool> setRotuloPrinter({
    required String authToken,
    required String printerId,
  }) async {
    print('');
    print('🏷️ ========== SET ROTULO PRINTER ==========');
    print('🏷️ PrinterId para rótulo: $printerId');
    
    final config = await getTagmentPrinterConfig(authToken);
    if (config == null) {
      print('❌ Falha ao obter configuração atual');
      return false;
    }

    print('📊 Configuração atual:');
    print('   tagmentPrinterValidadeId: ${config.tagmentPrinterValidadeId}');
    print('   tagmentPrinterRotuloId: ${config.tagmentPrinterRotuloId}');

    final request = UpdateTagmentPrinterConfigRequest(
      tagmentPrinterValidadeId: config.tagmentPrinterValidadeId,
      tagmentPrinterRotuloId: printerId,
    );

    print('📤 Request que será enviado:');
    print('   tagmentPrinterValidadeId: ${request.tagmentPrinterValidadeId}');
    print('   tagmentPrinterRotuloId: ${request.tagmentPrinterRotuloId}');
    print('🏷️ =========================================');

    final updatedConfig = await updateTagmentPrinterConfig(
      authToken: authToken,
      request: request,
    );

    return updatedConfig != null;
  }

  /// Remover impressora de validade
  Future<bool> removeValidadePrinter(String authToken) async {
    final config = await getTagmentPrinterConfig(authToken);
    if (config == null) return false;

    final request = UpdateTagmentPrinterConfigRequest(
      tagmentPrinterValidadeId: null,
      tagmentPrinterRotuloId: config.tagmentPrinterRotuloId,
    );

    final updatedConfig = await updateTagmentPrinterConfig(
      authToken: authToken,
      request: request,
    );

    return updatedConfig != null;
  }

  /// Remover impressora de rótulo
  Future<bool> removeRotuloPrinter(String authToken) async {
    final config = await getTagmentPrinterConfig(authToken);
    if (config == null) return false;

    final request = UpdateTagmentPrinterConfigRequest(
      tagmentPrinterValidadeId: config.tagmentPrinterValidadeId,
      tagmentPrinterRotuloId: null,
    );

    final updatedConfig = await updateTagmentPrinterConfig(
      authToken: authToken,
      request: request,
    );

    return updatedConfig != null;
  }
}


