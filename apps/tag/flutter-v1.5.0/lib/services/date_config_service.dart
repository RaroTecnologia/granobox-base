import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/date_config_models.dart';

class DateConfigService {
  final String _baseUrl = AppConfig.apiBaseUrl;

  /// Obter configuração atual de datas
  Future<DateConfig?> getDateConfig(String authToken) async {
    try {
      print('🔧 DateConfigService - Obtendo configuração de datas...');
      print('🌐 URL: $_baseUrl/config/date');
      print('🔑 Token: ${authToken.substring(0, 20)}...');

      final response = await http.get(
        Uri.parse('$_baseUrl/config/date'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
      );

      print('📊 Status: ${response.statusCode}');
      print('📄 Body: ${response.body}');

      if (response.statusCode == 200) {
        try {
          final raw = response.body;
          if (raw.isEmpty) {
            final fallback = const DateConfig(
              showTimeInDates: true,
              dateFormat: 'dd/MM/yyyy HH:mm',
            );
            print('✅ GET OK (sem body). Usando fallback: ${fallback.toJson()}');
            return fallback;
          }

          final decoded = jsonDecode(raw) as Map<String, dynamic>;
          final show = (decoded['showTimeInDates'] as bool?) ?? true;
          final format = (decoded['dateFormat'] as String?) ?? 'dd/MM/yyyy HH:mm';
          final safe = DateConfig(showTimeInDates: show, dateFormat: format);
          print('✅ Configuração de datas obtida (safe parse): ${safe.toJson()}');
          return safe;
        } catch (e) {
          final fallback = const DateConfig(
            showTimeInDates: true,
            dateFormat: 'dd/MM/yyyy HH:mm',
          );
          print('⚠️ Parse GET falhou; usando fallback: ${fallback.toJson()} - erro: $e');
          return fallback;
        }
      } else {
        print('❌ Erro ao obter configuração de datas: ${response.statusCode}');
        print('📄 Body: ${response.body}');
        return null;
      }
    } catch (e) {
      print('❌ Erro de conexão ao obter configuração de datas: $e');
      return null;
    }
  }

  /// Atualizar configuração de datas
  Future<DateConfig?> updateDateConfig({
    required String authToken,
    required UpdateDateConfigRequest request,
  }) async {
    try {
      print('🔧 DateConfigService - Atualizando configuração de datas...');
      print('🌐 URL: $_baseUrl/config/date');
      print('📊 Dados: ${request.toJson()}');

      final response = await http.patch(
        Uri.parse('$_baseUrl/config/date'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(request.toJson()),
      );

      print('📊 Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        try {
          final raw = response.body;
          if (raw.isEmpty) {
            // Fallback quando API retorna 200 sem body
            final fallback = DateConfig(
              showTimeInDates: request.showTimeInDates ?? true,
              dateFormat: request.dateFormat ?? 'dd/MM/yyyy HH:mm',
            );
            print('✅ Atualização OK (sem body). Usando fallback local: ${fallback.toJson()}');
            return fallback;
          }

          final decoded = jsonDecode(raw);
          // Corrigir caso API retorne nulls
          final show = (decoded['showTimeInDates'] as bool?) ?? (request.showTimeInDates ?? true);
          final format = (decoded['dateFormat'] as String?) ?? (request.dateFormat ?? 'dd/MM/yyyy HH:mm');
          final safe = DateConfig(showTimeInDates: show, dateFormat: format);
          print('✅ Configuração de datas atualizada (safe parse): ${safe.toJson()}');
          return safe;
        } catch (e) {
          // Qualquer falha de parse: retornar fallback baseado no request
          final fallback = DateConfig(
            showTimeInDates: request.showTimeInDates ?? true,
            dateFormat: request.dateFormat ?? 'dd/MM/yyyy HH:mm',
          );
          print('⚠️ Parse falhou; usando fallback local: ${fallback.toJson()} - erro: $e');
          return fallback;
        }
      } else {
        print('❌ Erro ao atualizar configuração de datas: ${response.statusCode}');
        print('📄 Body: ${response.body}');
        return null;
      }
    } catch (e) {
      print('❌ Erro de conexão ao atualizar configuração de datas: $e');
      return null;
    }
  }

  /// Atualizar apenas o toggle de exibir hora
  Future<bool> updateShowTimeToggle({
    required String authToken,
    required bool showTimeInDates,
  }) async {
    final request = UpdateDateConfigRequest(
      showTimeInDates: showTimeInDates,
    );

    final result = await updateDateConfig(
      authToken: authToken,
      request: request,
    );

    return result != null;
  }
}
