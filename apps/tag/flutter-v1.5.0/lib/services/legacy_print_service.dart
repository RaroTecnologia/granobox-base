import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;
import 'dart:async';
import 'package:http/http.dart' as http;
import '../models/print_result_models.dart';

/// Serviço para impressão via API Tagment v1 com TCP direto
class LegacyPrintService {
  static const String _baseUrl = 'https://api.tagment.com.br';
  final String apiKey;
  
  LegacyPrintService({required this.apiKey});
  
  /// Processar template e retornar ZPL
  Future<String> processarTemplate({
    required String templateId,
    required Map<String, dynamic> data,
    int copies = 1,
  }) async {
    try {
      print('📡 ===== PROCESSANDO TEMPLATE =====');
      print('📡 Template ID: $templateId');
      print('🌐 URL da API: $_baseUrl/v1/templates/process');
      print('🔑 API Key: ${apiKey.substring(0, 10)}...');
      print('📤 Payload completo:');
      print('   Template: $templateId');
      print('   Data:');
      data.forEach((key, value) {
        print('     $key: "$value"');
      });
      print('🚨 DEBUG: INICIANDO CHAMADA PARA API TAGMENT 🚨');
      
      final requestBody = {
        'templateId': templateId,
        'data': data,
        'copies': copies,
      };
      
      print('📤 Request body JSON: ${jsonEncode(requestBody)}');
      
      final response = await http.post(
        Uri.parse('$_baseUrl/v1/templates/process'),
        headers: {
          'Authorization': 'Bearer $apiKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(requestBody),
      );
      
      print('📊 Status da resposta: ${response.statusCode}');
      print('📄 Body da resposta: ${response.body}');
      
      if (response.statusCode == 200) {
        final result = jsonDecode(response.body);
        print('📊 Resultado parseado: $result');
        print('📊 Campo zplCode: ${result['zplCode']}');
        print('📊 Tipo do zplCode: ${result['zplCode'].runtimeType}');
        
        final zplCode = result['zplCode'] as String?;
        if (zplCode == null) {
          throw Exception('Campo zplCode é null na resposta da API');
        }
        
        print('✅ ZPL gerado com sucesso (${zplCode.length} caracteres)');
        print('📄 ZPL Preview: ${zplCode.substring(0, math.min(200, zplCode.length))}...');
        print('📊 Resposta completa da API:');
        print('=' * 50);
        print(response.body);
        print('=' * 50);
        print('🚨 DEBUG: API TAGMENT RESPONDEU COM SUCESSO 🚨');
        
        // Verificar se ZPL está vazio ou inválido
        if (zplCode.isEmpty) {
          throw Exception('ZPL retornado está vazio');
        }
        
        if (!zplCode.startsWith('^XA')) {
          print('⚠️ AVISO: ZPL não começa com ^XA - pode estar malformado');
        }
        
        if (!zplCode.endsWith('^XZ')) {
          print('⚠️ AVISO: ZPL não termina com ^XZ - pode estar malformado');
        }
        
        return zplCode;
      } else {
        print('❌ Erro na API: ${response.statusCode}');
        print('📄 Body da resposta: ${response.body}');
        throw Exception('Erro HTTP: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      throw Exception('Erro ao processar template: $e');
    }
  }
  
  /// Imprimir ZPL diretamente na impressora via TCP
  Future<TagmentPrintResult> imprimirZplDireto({
    required String zplCode,
    required String printerIP,
    int printerPort = 9100,
    int timeout = 10000,
    double offsetX = 0.0,
    double offsetY = 0.0,
    PrinterInfo? printerInfo,
  }) async {
    Socket? socket;
    final stopwatch = Stopwatch()..start();
    
    try {
      print('🖨️ Conectando à impressora $printerIP:$printerPort...');
      print('🔧 Offsets recebidos: X=${offsetX}mm, Y=${offsetY}mm');
      
      // 1. Aplicar offsets no ZPL
      final adjustedZpl = _aplicarOffsets(zplCode, offsetX, offsetY);
      
      // 2. Conectar com timeout
      socket = await Socket.connect(printerIP, printerPort)
        .timeout(Duration(milliseconds: timeout));
      
      print('✅ Conectado à impressora $printerIP:$printerPort');
      
      // 3. Converter ZPL para bytes
      final buffer = utf8.encode(adjustedZpl);
      
      // 4. Log detalhado do ZPL
      print('📄 ZPL completo que será enviado:');
      print('=' * 50);
      print(adjustedZpl);
      print('=' * 50);
      print('📊 Tamanho do ZPL: ${adjustedZpl.length} caracteres');
      print('📊 Tamanho em bytes: ${buffer.length} bytes');
      
      // 5. Enviar dados
      socket.add(buffer);
      await socket.flush();
      
      print('📤 Enviados ${buffer.length} bytes para impressora');
      
        // 5. Calcular tempo de processamento baseado no tamanho do ZPL
        final processingTime = _calcularTempoProcessamento(adjustedZpl.length);
        print('⏳ Aguardando impressora processar o ZPL (${processingTime}ms)...');
        await Future.delayed(Duration(milliseconds: processingTime));
        
        // 6. Verificar status real da impressora com comando ~HS na MESMA conexão
        print('🔍 Verificando status da impressora...');
        
        // 7. Criar completer para aguardar resposta
        final completer = Completer<String>();
        String statusResponse = '';
        
        // 8. Configurar listener para receber resposta
        final subscription = socket.listen(
          (data) {
            statusResponse += utf8.decode(data);
            print('📥 Resposta recebida: "$statusResponse"');
            if (!completer.isCompleted) {
              completer.complete(statusResponse);
            }
          },
          onError: (error) {
            print('❌ Erro ao receber resposta: $error');
            if (!completer.isCompleted) {
              completer.completeError(error);
            }
          },
        );
        
        // 9. Enviar comando ~HS
        socket.add(utf8.encode('~HS\n'));
        await socket.flush();
        
        // 10. Aguardar resposta com timeout
        try {
          await completer.future.timeout(Duration(seconds: 3));
        } catch (e) {
          print('⏰ Timeout aguardando resposta de status');
          // Se timeout, assumir sucesso (fallback inteligente)
          statusResponse = 'SUCCESS_TIMEOUT';
        }
        
        // 11. Cancelar subscription
        await subscription.cancel();
        
        // 12. Identificar marca da impressora e interpretar resposta
        final marcaImpressora = _identificarMarcaImpressora(printerIP, printerInfo);
        final status = _interpretarStatusImpressora(statusResponse, marcaImpressora);
        print('📊 Status da impressora ($marcaImpressora): $status');
        
        if (status['error'] != null) {
          throw Exception('Erro na impressora: ${status['error']}');
        }
      
      stopwatch.stop();
      
      return TagmentPrintResult.success(
        'Impressão realizada com sucesso',
        DateTime.now().millisecondsSinceEpoch.toString(),
        {
          'bytesSent': buffer.length,
          'latency': stopwatch.elapsedMilliseconds,
          'printerIP': printerIP,
          'printerPort': printerPort,
          'printerStatus': status, // Incluir status da impressora
        },
      );
      
    } on SocketException catch (e) {
      return TagmentPrintResult.error(
        'Erro de conexão: ${e.message}',
        {'error': e.message, 'type': 'SocketException'},
      );
    } on TimeoutException catch (e) {
      return TagmentPrintResult.error(
        'Timeout na conexão: ${e.message}',
        {'error': e.message, 'type': 'TimeoutException'},
      );
    } catch (e) {
      return TagmentPrintResult.error(
        'Erro na impressão: $e',
        {'error': e.toString(), 'type': 'Unknown'},
      );
    } finally {
      try {
        await socket?.close();
        print('🔌 Conexão fechada');
      } catch (e) {
        print('⚠️ Erro ao fechar conexão: $e');
      }
    }
  }
  
  /// Imprimir etiqueta de validade (método principal)
  Future<TagmentPrintResult> imprimirEtiquetaValidade({
    required String produto,
    required String marca,
    required String sif,
    required String dataEmbalagem,
    required String dataManipulacao,
    required String dataValidade,
    required String printerIP,
    int printerPort = 9100,
    double offsetX = 0.0,
    double offsetY = 0.0,
    PrinterInfo? printerInfo,
  }) async {
    try {
      print('🚀 Iniciando impressão de etiqueta de validade');
      print('   📋 Produto: $produto');
      print('   🏷️ Marca: $marca');
      print('   🔢 SIF: $sif');
      print('   📅 Embalagem: $dataEmbalagem');
      print('   📅 Manipulação: $dataManipulacao');
      print('   📅 Validade: $dataValidade');
      print('   🖨️ Impressora: $printerIP:$printerPort');
      print('   📊 Dados que serão enviados para API:');
      print('   {');
      print('     "template": "1c12926f-849b-4bd7-8a61-05036f39f443",');
      print('     "data": {');
      print('       "nome_produto": "$produto",');
      print('       "marca": "$marca",');
      print('       "sif": "$sif",');
      print('       "emb_original": "$dataEmbalagem",');
      print('       "manipulacao": "$dataManipulacao",');
      print('       "validade": "$dataValidade"');
      print('     }');
      print('   }');
      
      // 1. Processar template na API
      final zplCode = await processarTemplate(
        templateId: '1c12926f-849b-4bd7-8a61-05036f39f443', // Template GranoBox
        data: {
          'nome_produto': produto,
          'marca': marca,
          'sif': sif,
          'emb_original': dataEmbalagem,
          'manipulacao': dataManipulacao,
          'validade': dataValidade,
        },
        copies: 1, // Default para 1 cópia
      );
      
      // 2. Imprimir ZPL diretamente
      final result = await imprimirZplDireto(
        zplCode: zplCode,
        printerIP: printerIP,
        printerPort: printerPort,
        offsetX: offsetX,
        offsetY: offsetY,
        printerInfo: printerInfo,
      );
      
      print('📊 Resultado da impressão:');
      if (result.success) {
        print('✅ Sucesso: ${result.message}');
      } else {
        print('❌ Erro: ${result.message}');
      }
      
      return result;
      
    } catch (e) {
      print('❌ Erro no fluxo de impressão: $e');
      return TagmentPrintResult.error(
        'Erro no fluxo de impressão: $e',
        {'error': e.toString(), 'type': 'FlowError'},
      );
    }
  }
  
  /// Testar impressora com ZPL simples
  Future<TagmentPrintResult> testarImpressoraComZPL({
    required String printerIP,
    int printerPort = 9100,
    int timeout = 10000,
  }) async {
    try {
      print('🧪 Testando impressora com ZPL simples: $printerIP:$printerPort');
      
      // ZPL de teste simples
      final testZpl = '''^XA
^FO50,50^A0N,30,30^FDGRANOBOX TESTE^FS
^FO50,100^A0N,20,20^FD${DateTime.now().toString()}^FS
^XZ''';
      
      print('📄 ZPL de teste:');
      print('=' * 30);
      print(testZpl);
      print('=' * 30);
      
      final result = await imprimirZplDireto(
        zplCode: testZpl,
        printerIP: printerIP,
        printerPort: printerPort,
        timeout: timeout,
      );
      
      return result;
    } catch (e) {
      print('❌ Erro no teste com ZPL: $e');
      return TagmentPrintResult.error(
        'Erro no teste com ZPL: $e',
        {'error': e.toString(), 'type': 'ZPLTestError'},
      );
    }
  }
  
  /// Testar impressora via TCP direto
  Future<TagmentPrintResult> testarImpressora({
    required String printerIP,
    int printerPort = 9100,
    int timeout = 10000,
  }) async {
    try {
      print('🧪 Testando conexão com impressora $printerIP:$printerPort...');
      
      final socket = await Socket.connect(printerIP, printerPort)
        .timeout(Duration(milliseconds: timeout));
      
      await socket.close();
      
      print('✅ Conexão testada com sucesso');
      
      return TagmentPrintResult.success(
        'Conexão com impressora estabelecida com sucesso',
        DateTime.now().millisecondsSinceEpoch.toString(),
        {
          'printerIP': printerIP,
          'printerPort': printerPort,
          'testType': 'connection',
        },
      );
      
    } on SocketException catch (e) {
      return TagmentPrintResult.error(
        'Erro de conexão: ${e.message}',
        {'error': e.message, 'type': 'SocketException'},
      );
    } on TimeoutException catch (e) {
      return TagmentPrintResult.error(
        'Timeout na conexão: ${e.message}',
        {'error': e.message, 'type': 'TimeoutException'},
      );
    } catch (e) {
      return TagmentPrintResult.error(
        'Erro no teste: $e',
        {'error': e.toString(), 'type': 'Unknown'},
      );
    }
  }
  
  /// Calcular tempo de processamento baseado no tamanho do ZPL
  int _calcularTempoProcessamento(int zplSize) {
    // Fórmula: 500ms base + 1ms por 100 bytes
    // Exemplo: 1527 bytes = 500 + (1527/100)*1 = 500 + 15 = 515ms
    final baseTime = 500; // 500ms base
    final sizeFactor = (zplSize / 100).ceil(); // 1ms por 100 bytes
    final totalTime = baseTime + sizeFactor;
    
    // Limitar entre 500ms e 2000ms
    return totalTime.clamp(500, 2000);
  }

  /// Identificar marca da impressora baseada nas informações da API Tagment
  String _identificarMarcaImpressora(String printerIP, PrinterInfo? printerInfo) {
    // 1. Tentar extrair marca do displayName
    if (printerInfo?.displayName != null) {
      final displayName = printerInfo!.displayName.toLowerCase();
      if (displayName.contains('zebra')) return 'Zebra';
      if (displayName.contains('c3tech')) return 'C3TECH';
      if (displayName.contains('c3')) return 'C3TECH';
    }
    
    // 2. Tentar extrair marca do campo capabilities
    if (printerInfo?.capabilities != null) {
      final capabilities = printerInfo!.capabilities!;
      final make = capabilities['make']?.toString().toLowerCase();
      final model = capabilities['model']?.toString().toLowerCase();
      
      if (make != null) {
        if (make.contains('zebra')) return 'Zebra';
        if (make.contains('c3tech')) return 'C3TECH';
        if (make.contains('c3')) return 'C3TECH';
      }
      
      if (model != null) {
        if (model.contains('zebra')) return 'Zebra';
        if (model.contains('c3tech')) return 'C3TECH';
        if (model.contains('c3')) return 'C3TECH';
      }
    }
    
    // 3. Fallback: usar IP conhecido
    if (printerIP == '192.168.10.69') {
      return 'C3TECH'; // Impressora C3TECH conhecida
    }
    
    // 4. Fallback: tentar identificar pela resposta do ~HS
    return 'Desconhecida';
  }

  /// Interpretar status da impressora baseado no mapeamento TCP
  Map<String, dynamic> _interpretarStatusImpressora(String response, String marca) {
    print('📥 Resposta da impressora ($marca): "$response"');
    
    // Se timeout, assumir sucesso (fallback inteligente)
    if (response == 'SUCCESS_TIMEOUT') {
      print('⏰ Timeout - assumindo sucesso (fallback inteligente)');
      return {
        'marca': marca,
        'online': true,
        'paperOut': false,
        'coverOpen': false,
        'ribbonOut': false,
        'timeout': true,
      };
    }
    
    final lines = response.trim().split('\n');
    final firstLine = lines.first.trim();
    final campos = firstLine.split(',');
    
    print('📊 Campos: $campos');
    
    // Zebra: 030 é PREFIXO PADRÃO (sempre presente), não erro!
    // DESCOBERTA: Resposta tem 12 campos! [030, 0, 0, 0482, 001, 0, 0, 0, 000, 0, 0, 0]
    // HIPÓTESE: Campo 4 (001) pode ser CONTADOR/STATUS, não erro!
    // Vamos verificar campo 8 que tem 000 - pode ser o verdadeiro código de erro
    if (marca.toLowerCase() == 'zebra' || (campos.length >= 5 && campos[0] == '030')) {
      print('🔍 ZEBRA - Campos recebidos (${campos.length} campos): $campos');
      
      // Analisar múltiplos campos para entender o protocolo
      final campo2 = campos.length > 2 ? campos[2] : '0';   // DESCOBERTA: Tampa aberta!
      final campo4 = campos.length > 4 ? campos[4] : '000'; // Era 001 no log (contador)
      final campo8 = campos.length > 8 ? campos[8] : '000'; // Era 000 no log (erro real)
      
      print('🔍 ZEBRA - Campo 2: "$campo2" (DESCOBERTA: tampa aberta quando = 1)');
      print('🔍 ZEBRA - Campo 4: "$campo4" (contador/status)');
      print('🔍 ZEBRA - Campo 8: "$campo8" (código de erro real)');
      
      // NOVA DESCOBERTA: Campo 2 = tampa aberta!
      // Campo 2: 0 = tampa fechada, 1 = tampa aberta
      final realErrorCode = campo8;
      final tampaAberta = campo2 == '1';
      
      final status = {
        'marca': 'Zebra',
        'online': true,
        'paperOut': false,  // Determinado pelo código de erro
        'coverOpen': tampaAberta,  // CORRIGIDO: Campo 2!
        'ribbonOut': campos.length > 1 ? campos[1] == '1' : false,
        'campo2': campo2,
        'campo4': campo4,
        'campo8': campo8,
        'errorCode': realErrorCode,
      };
      
      print('🔍 ZEBRA - Análise dos códigos:');
      print('   - Tampa (campo 2): $tampaAberta (0=fechada, 1=aberta)');
      print('   - Contador (campo 4): $campo4');
      print('   - Erro real (campo 8): $realErrorCode');
      print('   - Ribbon (campo 1): ${status['ribbonOut']}');
      
      // LÓGICA CORRIGIDA: Verificar tampa aberta (campo 2) E códigos de erro (campo 8)
      if (tampaAberta) {
        status['error'] = 'Tampa aberta';
        print('❌ ZEBRA - ERRO: Tampa aberta (campo 2 = 1)');
      } else if (realErrorCode != '000') {
        if (realErrorCode == '001') {
          status['paperOut'] = true;
          status['error'] = 'Papel acabou';
          print('❌ ZEBRA - ERRO: Papel acabou (campo 8 = 001)');
        } else if (realErrorCode == '002') {
          status['error'] = 'Erro na impressora (código 002)';
          print('❌ ZEBRA - ERRO: Código 002 no campo 8');
        } else {
          status['error'] = 'Erro na impressora (código $realErrorCode)';
          print('❌ ZEBRA - ERRO: Código desconhecido $realErrorCode no campo 8');
        }
      } else if (status['ribbonOut'] == true) {
        status['error'] = 'Ribbon acabou';
        print('❌ ZEBRA - ERRO: Ribbon acabou (campo 1 == "1")');
      } else {
        print('✅ ZEBRA - Status OK (tampa fechada, campo 8 = 000)');
        print('✅ ZEBRA - Campo 4 ($campo4) é contador/status operacional');
      }
      
      return status;
    }
    
    // C3TECH: 150,0,0,xxx,000 = sucesso
    if (marca.toLowerCase() == 'c3tech' || (campos.length >= 5 && campos[0] == '150')) {
      final status = {
        'marca': 'C3TECH',
        'online': true,
        'paperOut': campos[1] == '1',
        'coverOpen': false,
        'ribbonOut': false, // térmica direta
      };
      
      // Verificar tampa aberta na segunda linha se existir
      if (lines.length > 1) {
        final segundaLinha = lines[1].trim().split(',');
        if (segundaLinha.length >= 3) {
          status['coverOpen'] = segundaLinha[2] == '1';
        }
      }
      
      // Verificar erros
      if (status['paperOut'] == true) {
        status['error'] = 'Papel acabou';
      } else if (status['coverOpen'] == true) {
        status['error'] = 'Tampa aberta';
      }
      
      return status;
    }
    
    // Resposta não reconhecida - mas dados foram enviados com sucesso
    // Assumir sucesso se temos uma resposta numérica válida
    print('⚠️ Formato de resposta desconhecido, mas dados foram enviados. Assumindo sucesso.');
    return {
      'marca': 'Desconhecida',
      'online': true,  // ✅ Mudado para true - dados foram enviados
      'paperOut': false,
      'coverOpen': false,
      'ribbonOut': false,
      'warning': 'Formato de resposta não reconhecido, mas impressão enviada',
    };
  }
  
  /// Aplicar offsets no código ZPL
  String _aplicarOffsets(String zplCode, double offsetX, double offsetY) {
    if (offsetX == 0 && offsetY == 0) {
      return zplCode; // Sem offsets, retornar ZPL original
    }

    print('🔧 Aplicando offsets da impressora: X=${offsetX}mm, Y=${offsetY}mm');

    // Converter offsets de mm para pontos (8 pontos por mm - padrão Tagment)
    final offsetXPoints = (offsetX * 8).round();
    final offsetYPoints = (offsetY * 8).round();

    // Regex para encontrar comandos ^FO (Field Origin) e ^FT (Field Typeset)
    final foRegex = RegExp(r'\^FO(\d+),(\d+)');
    final ftRegex = RegExp(r'\^FT(\d+),(\d+)');

    String modifiedZpl = zplCode.replaceAllMapped(foRegex, (match) {
      final originalX = int.parse(match.group(1)!);
      final originalY = int.parse(match.group(2)!);
      
      // Aplicar offsets
      final newX = math.max(0, originalX + offsetXPoints);
      final newY = math.max(0, originalY + offsetYPoints);
      
      return '^FO$newX,$newY';
    });

    // Aplicar offsets também em ^FT
    modifiedZpl = modifiedZpl.replaceAllMapped(ftRegex, (match) {
      final originalX = int.parse(match.group(1)!);
      final originalY = int.parse(match.group(2)!);
      final newX = math.max(0, originalX + offsetXPoints);
      final newY = math.max(0, originalY + offsetYPoints);
      return '^FT$newX,$newY';
    });

    print('✅ Offsets aplicados no ZPL');
    return modifiedZpl;
  }
  
  /// Processar resultado com análise inteligente de erros
  TagmentPrintResult _processarResultado(Map<String, dynamic> result) {
    if (result['success'] == true) {
      final printResult = result['printResult'];
      final printerStatus = printResult?['printerStatus'];
      
      // Verificar status da impressora
      if (printerStatus != null) {
        if (printerStatus['paperOut'] == true) {
          return TagmentPrintResult.error(
            'Papel acabou - recarregue a impressora',
            printerStatus,
          );
        }
        
        if (printerStatus['ribbonOut'] == true) {
          return TagmentPrintResult.error(
            'Fita acabou - troque a fita da impressora',
            printerStatus,
          );
        }
        
        if (printerStatus['coverOpen'] == true) {
          return TagmentPrintResult.error(
            'Tampa aberta - feche a tampa da impressora',
            printerStatus,
          );
        }
        
        if (printerStatus['errorCode'] != null) {
          return TagmentPrintResult.error(
            'Erro da impressora: ${printerStatus['errorMessage']}',
            printerStatus,
          );
        }
      }
      
      // Verificar se realmente foi impresso
      if (printResult?['actuallyPrinted'] != true) {
        return TagmentPrintResult.error(
          'Impressão não foi realizada - verifique a impressora',
          printResult,
        );
      }
      
      // Sucesso!
      return TagmentPrintResult.success(
        result['message'] ?? 'Impressão realizada com sucesso',
        result['jobId'],
        printResult,
      );
    } else {
      return TagmentPrintResult.error(
        result['message'] ?? 'Erro desconhecido',
        result,
      );
    }
  }
  
  /// Obter impressoras disponíveis
  Future<List<PrinterInfo>> obterImpressoras({String? locationId}) async {
    try {
      String url = '$_baseUrl/v1/printers';
      if (locationId != null) {
        url += '?externalLocationId=$locationId';
      }
      
      final response = await http.get(
        Uri.parse(url),
        headers: {'Authorization': 'Bearer $apiKey'},
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((item) => PrinterInfo.fromJson(item)).toList();
      } else {
        throw Exception('Erro ao obter impressoras: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Erro de conexão: $e');
    }
  }
  
  /// Obter impressora de validade para uma localização
  Future<PrinterInfo?> obterImpressoraValidade(String? locationId) async {
    try {
      final impressoras = await obterImpressoras(locationId: locationId);
      
      // Buscar por tag 'validade'
      var impressora = impressoras.where((p) => 
        p.tags?.contains('validade') == true && p.status == 'online'
      ).firstOrNull;
      
      // Fallback: primeira online
      if (impressora == null) {
        impressora = impressoras.where((p) => p.status == 'online').firstOrNull;
      }
      
      return impressora;
    } catch (e) {
      print('❌ Erro ao obter impressora de validade: $e');
      return null;
    }
  }
  

  /// Verificar status da API Key
  Future<ApiKeyStatus> verificarStatus() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/v1/auth/info'),
        headers: {'Authorization': 'Bearer $apiKey'},
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return ApiKeyStatus.fromJson(data);
      } else {
        throw Exception('Erro ao verificar status: ${response.statusCode}');
      }
    } catch (e) {
      return ApiKeyStatus.error('Erro de conexão: $e');
    }
  }
}
