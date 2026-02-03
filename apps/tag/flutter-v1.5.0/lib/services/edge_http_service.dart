import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

/// Serviço para enviar comandos HTTP para Edge-Go (quando conectado via WiFi)
class EdgeHttpService {
  /// Ler status do Edge-Go via HTTP
  Future<Map<String, dynamic>?> getStatus({
    required String ip,
    int port = 80, // Porta HTTP do Edge-Go
  }) async {
    try {
      print('📡 Lendo status HTTP do Edge-Go $ip:$port');
      
      final response = await http.get(
        Uri.parse('http://$ip:$port/status'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 5));
      
      print('📊 Status: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        print('✅ Status recebido: ${json.toString().substring(0, 100)}...');
        return json;
      } else {
        print('❌ Erro ao ler status: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      print('❌ Erro ao ler status HTTP: $e');
      return null;
    }
  }
  
  /// Enviar comando HTTP para Edge-Go
  Future<bool> sendCommand({
    required String ip,
    required String command,
    Map<String, dynamic>? params,
    int port = 3001, // Porta HTTP do Edge-Go
  }) async {
    try {
      print('📡 Enviando comando HTTP para Edge-Go $ip:$port');
      print('   Comando: $command');
      if (params != null) print('   Params: $params');
      
      final response = await http.post(
        Uri.parse('http://$ip:$port/command'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'cmd': command,
          if (params != null) 'params': params,
        }),
      ).timeout(const Duration(seconds: 5));
      
      print('📊 Status: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        print('✅ Comando enviado com sucesso');
        return true;
      } else {
        print('❌ Erro: ${response.statusCode}');
        return false;
      }
    } catch (e) {
      print('❌ Erro ao enviar comando HTTP: $e');
      return false;
    }
  }
  
  /// Testar impressão (envia ZPL de teste)
  Future<bool> testPrint({required String ip, int port = 9100}) async {
    try {
      print('🖨️ [EdgeHttpService] Iniciando teste de impressão');
      print('🖨️ [EdgeHttpService] IP: $ip');
      print('🖨️ [EdgeHttpService] Porta: $port');
      
      // Primeiro, testar conectividade básica
      print('🔍 [EdgeHttpService] Testando conectividade básica...');
      
      // ZPL de teste para etiqueta 60x60mm (170x170 dots a 203 DPI)
      final now = DateTime.now().toString().substring(0, 19);
      final testZPL = '''
^XA
^PW170
^LL170
^FO10,10^A0N,30,30^FDTeste Flutter^FS
^FO10,50^A0N,20,20^FDAndroid OK^FS
^FO10,80^A0N,18,18^FD$now^FS
^FO10,110^GB150,1,1^FS
^FO10,120^A0N,16,16^FD60x60mm OK!^FS
^XZ
''';
      
      print('🖨️ [EdgeHttpService] ZPL preparado (${testZPL.length} chars)');
      print('🖨️ [EdgeHttpService] Tentando conectar ao socket...');
      
      final socket = await Socket.connect(ip, port, timeout: const Duration(seconds: 5));
      print('✅ [EdgeHttpService] Socket conectado. Enviando ZPL...');
      socket.write(testZPL);
      await socket.flush();
      await socket.close();
      
      print('✅ [EdgeHttpService] ZPL enviado com sucesso');
      return true;
    } catch (e) {
      print('❌ [EdgeHttpService] Erro ao enviar ZPL: $e');
      return false;
    }
  }
  
  /// Imprimir etiqueta de validade (dados mock)
  Future<bool> printValidityLabel({
    required String ip,
    int port = 9100,
    String? produto,
    String? marca,
    String? sif,
    String? dataValidade,
  }) async {
    try {
      print('🏷️ Imprimindo etiqueta de validade em $ip:$port');
      
      // Template ZPL de validade para 60x60mm (170x170 dots)
      final validadeFormatada = dataValidade ?? 
          DateTime.now().add(const Duration(days: 7)).toString().substring(0, 10);
      
      final zpl = '''
^XA
^PW170
^LL170
^FO5,5^A0N,22,22^FD${produto ?? 'PICANHA BOVINA'}^FS
^FO5,30^A0N,16,16^FD${marca ?? 'GRANOBOX PREMIUM'}^FS
^FO5,50^A0N,14,14^FD${sif ?? 'SIF 1234'}^FS
^FO5,70^GB160,1,1^FS
^FO5,80^A0N,20,20^FDValidade:^FS
^FO5,105^A0N,28,28^FD$validadeFormatada^FS
^FO5,140^A0N,12,12^FDGranobox^FS
^XZ
''';
      
      final socket = await Socket.connect(ip, port, timeout: const Duration(seconds: 5));
      socket.write(zpl);
      await socket.flush();
      await socket.close();
      
      print('✅ Etiqueta enviada com sucesso');
      return true;
    } catch (e) {
      print('❌ Erro ao imprimir etiqueta: $e');
      return false;
    }
  }
}

