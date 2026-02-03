import 'package:flutter/material.dart';
import '../models/print_result_models.dart';
import 'unified_print_service.dart';
import 'printer_config_service.dart';
import 'tagment_printer_config_service.dart';

/// Exemplo de como usar os novos serviços de impressão refatorados
class PrintServiceExample {
  late final UnifiedPrintService _printService;
  late final PrinterConfigService _configService;
  
  PrintServiceExample({required String apiKey}) {
    // Inicializar serviços
    final tagmentConfigService = TagmentPrinterConfigService();
    _configService = PrinterConfigService(tagmentConfigService);
    _printService = UnifiedPrintService(
      apiKey: apiKey,
      configService: _configService,
    );
  }

  /// Exemplo 1: Configurar uma nova impressora
  Future<void> exemploConfigurarImpressora() async {
    try {
      // Criar configuração da impressora
      final novaImpressora = LocalPrinterConfig(
        id: _configService.generatePrinterId(),
        nome: 'Impressora Principal',
        ip: '192.168.1.100',
        porta: 9100,
        isValidadePrinter: true,  // Usar para etiquetas de validade
        isRotuloPrinter: false,   // Não usar para rótulos
        offsetX: 0.0,
        offsetY: 0.0,
      );

      // Validar configuração
      if (!_configService.validatePrinterConfig(novaImpressora)) {
        print('❌ Configuração de impressora inválida');
        return;
      }

      // Adicionar impressora
      final success = await _configService.addPrinter(novaImpressora);
      
      if (success) {
        print('✅ Impressora configurada com sucesso');
        
        // Testar conexão
        final testResult = await _printService.testarImpressora(novaImpressora.id);
        if (testResult.success) {
          print('✅ Teste de conexão bem-sucedido');
        } else {
          print('❌ Falha no teste de conexão: ${testResult.message}');
        }
      } else {
        print('❌ Falha ao configurar impressora');
      }
    } catch (e) {
      print('❌ Erro ao configurar impressora: $e');
    }
  }

  /// Exemplo 2: Imprimir etiqueta de validade
  Future<void> exemploImprimirValidade() async {
    try {
      print('🚀 Iniciando impressão de etiqueta de validade...');
      
      final result = await _printService.imprimirEtiquetaValidade(
        produto: 'PICANHA PREMIUM',
        marca: 'TACCHINO',
        sif: '1234',
        dataEmbalagem: '20/09/2025',
        dataManipulacao: '20/09/2025',
        dataValidade: '25/09/2025',
        // forcePrinterId: 'printer_123', // Opcional: forçar impressora específica
      );

      if (result.success) {
        print('✅ Etiqueta de validade impressa com sucesso!');
        print('📊 Detalhes: ${result.printResult}');
      } else {
        print('❌ Falha na impressão: ${result.message}');
        print('📊 Erro: ${result.errorDetails}');
        
        // Verificar se é problema de configuração
        if (result.errorDetails?['suggestion'] != null) {
          print('💡 Sugestão: ${result.errorDetails!['suggestion']}');
        }
      }
    } catch (e) {
      print('❌ Erro na impressão: $e');
    }
  }

  /// Exemplo 3: Imprimir rótulo de produto
  Future<void> exemploImprimirRotulo() async {
    try {
      print('🚀 Iniciando impressão de rótulo de produto...');
      
      final result = await _printService.imprimirRotuloProduto(
        templateId: 'template-rotulo-uuid',
        data: {
          'PRODUTO': 'SMARTPHONE SAMSUNG',
          'PRECO': '1.299,90',
          'CODIGO': 'SM-A54-128',
          'DESCRICAO': 'Galaxy A54 5G 128GB',
        },
      );

      if (result.success) {
        print('✅ Rótulo de produto impresso com sucesso!');
      } else {
        print('❌ Falha na impressão: ${result.message}');
      }
    } catch (e) {
      print('❌ Erro na impressão: $e');
    }
  }

  /// Exemplo 4: Gerenciar múltiplas impressoras
  Future<void> exemploGerenciarImpressoras() async {
    try {
      // Listar todas as impressoras
      final impressoras = await _printService.getImpressorasComStatus();
      print('📋 Total de impressoras configuradas: ${impressoras.length}');

      for (final impressora in impressoras) {
        print('🖨️ ${impressora.nome} (${impressora.ip}:${impressora.porta}) - Status: ${impressora.status}');
        print('   - Validade: ${impressora.isValidadePrinter ? "✅" : "❌"}');
        print('   - Rótulo: ${impressora.isRotuloPrinter ? "✅" : "❌"}');
      }

      // Obter estatísticas
      final stats = await _printService.getEstatisticas();
      print('📊 Estatísticas:');
      print('   - Total: ${stats['total']}');
      print('   - Online: ${stats['online']}');
      print('   - Offline: ${stats['offline']}');
      print('   - Configuradas para validade: ${stats['validadeConfigured']}');
      print('   - Configuradas para rótulo: ${stats['rotuloConfigured']}');

      // Testar todas as impressoras
      print('🧪 Testando todas as impressoras...');
      final testResults = await _printService.testarTodasImpressoras();
      
      for (final entry in testResults.entries) {
        final printerId = entry.key;
        final result = entry.value;
        final impressora = impressoras.firstWhere((p) => p.id == printerId);
        
        print('🖨️ ${impressora.nome}: ${result.success ? "✅ Online" : "❌ Offline"}');
        if (!result.success) {
          print('   Erro: ${result.message}');
        }
      }
    } catch (e) {
      print('❌ Erro ao gerenciar impressoras: $e');
    }
  }

  /// Exemplo 5: Verificar configurações antes de imprimir
  Future<bool> exemploVerificarConfiguracoes() async {
    try {
      // Verificar se há impressoras configuradas
      final hasImpressoras = await _printService.hasImpressorasConfiguradas();
      if (!hasImpressoras) {
        print('⚠️ Nenhuma impressora configurada');
        return false;
      }

      // Verificar impressora de validade
      final hasValidade = await _printService.hasImpressoraValidade();
      if (!hasValidade) {
        print('⚠️ Nenhuma impressora configurada para validade');
      }

      // Verificar impressora de rótulo
      final hasRotulo = await _printService.hasImpressoraRotulo();
      if (!hasRotulo) {
        print('⚠️ Nenhuma impressora configurada para rótulo');
      }

      // Verificar status da API
      final apiStatus = await _printService.verificarStatusAPI();
      if (apiStatus.isValid) {
        print('✅ API Key válida');
        print('📊 Requests restantes: ${apiStatus.remainingRequests}');
      } else {
        print('❌ Problema com API Key: ${apiStatus.error}');
        return false;
      }

      return hasValidade || hasRotulo;
    } catch (e) {
      print('❌ Erro ao verificar configurações: $e');
      return false;
    }
  }

  /// Exemplo 6: Fluxo completo de impressão com validações
  Future<void> exemploFluxoCompleto() async {
    try {
      print('🔄 Iniciando fluxo completo de impressão...');

      // 1. Verificar configurações
      final configOk = await exemploVerificarConfiguracoes();
      if (!configOk) {
        print('❌ Configurações insuficientes para impressão');
        return;
      }

      // 2. Processar template primeiro (para validar)
      final zplCode = await _printService.processarTemplate(
        templateId: '1c12926f-849b-4bd7-8a61-05036f39f443',
        data: {
          'nome_produto': 'PRODUTO TESTE',
          'marca': 'MARCA TESTE',
          'sif': '1234',
          'emb_original': '20/09/2025',
          'manipulacao': '20/09/2025',
          'validade': '25/09/2025',
        },
      );

      print('✅ Template processado com sucesso (${zplCode.length} caracteres)');

      // 3. Imprimir etiqueta
      final result = await _printService.imprimirEtiquetaValidade(
        produto: 'PRODUTO TESTE',
        marca: 'MARCA TESTE',
        sif: '1234',
        dataEmbalagem: '20/09/2025',
        dataManipulacao: '20/09/2025',
        dataValidade: '25/09/2025',
      );

      if (result.success) {
        print('🎉 Fluxo completo executado com sucesso!');
      } else {
        print('❌ Falha no fluxo: ${result.message}');
      }
    } catch (e) {
      print('❌ Erro no fluxo completo: $e');
    }
  }
}

/// Widget de exemplo para usar na interface
class PrintServiceExampleWidget extends StatefulWidget {
  final String apiKey;
  
  const PrintServiceExampleWidget({
    super.key,
    required this.apiKey,
  });

  @override
  State<PrintServiceExampleWidget> createState() => _PrintServiceExampleWidgetState();
}

class _PrintServiceExampleWidgetState extends State<PrintServiceExampleWidget> {
  late final PrintServiceExample _example;
  bool _isLoading = false;
  String _status = 'Pronto para testar';

  @override
  void initState() {
    super.initState();
    _example = PrintServiceExample(apiKey: widget.apiKey);
  }

  Future<void> _executarExemplo(String nome, Future<void> Function() funcao) async {
    setState(() {
      _isLoading = true;
      _status = 'Executando $nome...';
    });

    try {
      await funcao();
      setState(() {
        _status = '$nome executado com sucesso!';
      });
    } catch (e) {
      setState(() {
        _status = 'Erro em $nome: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Teste dos Serviços de Impressão'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text(
                  _status,
                  style: Theme.of(context).textTheme.bodyLarge,
                  textAlign: TextAlign.center,
                ),
              ),
            ),
            const SizedBox(height: 16),
            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else
              Expanded(
                child: ListView(
                  children: [
                    ElevatedButton(
                      onPressed: () => _executarExemplo(
                        'Configurar Impressora',
                        _example.exemploConfigurarImpressora,
                      ),
                      child: const Text('1. Configurar Impressora'),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: () => _executarExemplo(
                        'Verificar Configurações',
                        () async {
                          await _example.exemploVerificarConfiguracoes();
                        },
                      ),
                      child: const Text('2. Verificar Configurações'),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: () => _executarExemplo(
                        'Gerenciar Impressoras',
                        _example.exemploGerenciarImpressoras,
                      ),
                      child: const Text('3. Gerenciar Impressoras'),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: () => _executarExemplo(
                        'Imprimir Validade',
                        _example.exemploImprimirValidade,
                      ),
                      child: const Text('4. Imprimir Etiqueta Validade'),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: () => _executarExemplo(
                        'Imprimir Rótulo',
                        _example.exemploImprimirRotulo,
                      ),
                      child: const Text('5. Imprimir Rótulo Produto'),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: () => _executarExemplo(
                        'Fluxo Completo',
                        _example.exemploFluxoCompleto,
                      ),
                      child: const Text('6. Fluxo Completo'),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

