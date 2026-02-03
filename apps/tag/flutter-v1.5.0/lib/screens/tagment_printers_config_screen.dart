import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../providers/print_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/tagment_printer_config_provider.dart';
import '../models/print_result_models.dart';
import '../widgets/print_modal.dart';
// import '../components/printer_mode_selector.dart'; // ⚠️ REMOVIDO: Não é mais necessário
import '../components/printer_offset_modal.dart';
import '../services/websocket_print_service.dart'; // ⭐ MIGRADO: WebSocket-only

class TagmentPrintersConfigScreen extends StatefulWidget {
  const TagmentPrintersConfigScreen({super.key});

  @override
  State<TagmentPrintersConfigScreen> createState() => _TagmentPrintersConfigScreenState();
}

class _TagmentPrintersConfigScreenState extends State<TagmentPrintersConfigScreen> {
  final Set<String> _testingPrinters = <String>{};
  
  @override
  void initState() {
    super.initState();
    _carregarDados();
  }

  Future<void> _carregarDados() async {
    print('🔄 _carregarDados iniciado');
    final tagmentProvider = context.read<PrintProvider>();
    final configProvider = context.read<TagmentPrinterConfigProvider>();
    final authProvider = context.read<AuthProvider>();
    
    // Conectar os providers
    tagmentProvider.setPrinterConfigProvider(configProvider);
    
    // Configurar API Key do cliente primeiro
    if (authProvider.user?.clientId != null) {
      final authToken = await authProvider.authToken;
      if (authToken != null) {
        final configurado = await tagmentProvider.configurarApiKeyDoCliente(
          authProvider.user!.clientId,
          authToken,
        );
        
        if (!configurado) {
          print('⚠️ API Key do Tagment não configurada para este cliente');
          return;
        }
      }
    }
    
    // Verificar status da API primeiro
    print('🔍 Verificando status da API...');
    await tagmentProvider.verificarStatusAPI();
    
    // Carregar impressoras
    print('🖨️ Carregando impressoras...');
    await tagmentProvider.carregarImpressoras();
    print('✅ Impressoras carregadas: ${tagmentProvider.impressoras.length}');
    
    // Carregar configuração de impressoras
    print('⚙️ Carregando configuração de impressoras...');
    await configProvider.loadConfig();
    print('✅ Configuração carregada: ${configProvider.config}');
  }

  Future<void> _testarImpressora(String printerId, String printerName) async {
    if (_testingPrinters.contains(printerId)) return;
    
    setState(() {
      _testingPrinters.add(printerId);
    });
    
    try {
      final tagmentProvider = context.read<PrintProvider>();
      final authProvider = context.read<AuthProvider>();
      final wsService = WebSocketPrintService.instance; // ⭐ MIGRADO: WebSocket-only
      
      // Buscar a impressora
      final impressora = tagmentProvider.impressoras.firstWhere(
        (p) => p.id == printerId,
        orElse: () => throw Exception('Impressora não encontrada'),
      );
      
      // Obter API key do Tagment
      final authToken = await authProvider.authToken;
      if (authToken == null) {
        throw Exception('Token de autenticação não encontrado');
      }
      
      // Obter API key do Tagment via configuração
      String? tagmentApiKey;
      try {
        await tagmentProvider.configurarApiKeyDoCliente(
          authProvider.user!.clientId,
          authToken,
        );
        // A API key fica disponível no provider após configuração
        tagmentApiKey = tagmentProvider.apiKeyAtual;
      } catch (e) {
        debugPrint('❌ Erro ao obter API key do Tagment: $e');
      }
      
      if (tagmentApiKey == null || tagmentApiKey.isEmpty) {
        throw Exception('API key do Tagment não configurada');
      }
      
      // ZPL de teste simples
      final testZpl = '''^XA
^FO50,50^A0N,30,30^FDGRANOBOX TESTE^FS
^FO50,100^A0N,20,20^FD${DateTime.now().toString().substring(0, 19)}^FS
^XZ''';
      
      print('🧪 Testando impressora $printerName via WebSocket');
      
      // authToken já foi obtido acima (linha 89), não precisa obter novamente
      
      // Mostrar modal de impressão usando WebSocket
      final result = await showPrintModal(
        context: context,
        title: 'Testando Impressora',
        subtitle: printerName,
        printFunction: (onProgress) => wsService.print(
          printer: impressora,
          content: testZpl,
          authToken: authToken,
          onProgress: onProgress,
        ),
        onSuccess: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Teste enviado para $printerName com sucesso!'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 2),
            ),
          );
        },
        onError: () {
          print('❌ Erro no teste da impressora $printerName');
        },
      );
      
      print('🖨️ Resultado do teste: ${result?.success} - ${result?.message}');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao testar impressora: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _testingPrinters.remove(printerId);
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      appBar: AppBar(
        backgroundColor: AppTheme.dark800,
        title: const Text(
          'Configuração de Impressoras',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        leading: IconButton(
          icon: const Icon(PhosphorIcons.arrowLeft, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(PhosphorIcons.arrowClockwise, color: Colors.white),
            onPressed: _carregarDados,
            tooltip: 'Atualizar',
          ),
        ],
      ),
      body: Consumer<PrintProvider>(
        builder: (context, tagmentProvider, child) {
          if (tagmentProvider.isLoading) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: AppTheme.primary),
                  SizedBox(height: 16),
                  Text(
                    'Carregando impressoras...',
                    style: TextStyle(color: AppTheme.dark300),
                  ),
                ],
              ),
            );
          }

          if (tagmentProvider.error != null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      PhosphorIcons.warning,
                      color: Colors.red,
                      size: 64,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Erro ao carregar impressoras',
                      style: TextStyle(
                        color: Colors.red,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      tagmentProvider.error!,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppTheme.dark300,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: _carregarDados,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Tentar Novamente'),
                    ),
                  ],
                ),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: _carregarDados,
            color: AppTheme.primary,
            backgroundColor: AppTheme.dark800,
            child: Column(
              children: [
                // Status da API
                if (tagmentProvider.apiKeyStatus != null)
                  Container(
                  width: double.infinity,
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: tagmentProvider.apiKeyStatus!.isValid 
                        ? Colors.green.withOpacity(0.1)
                        : Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: tagmentProvider.apiKeyStatus!.isValid 
                          ? Colors.green
                          : Colors.red,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            tagmentProvider.apiKeyStatus!.isValid 
                                ? PhosphorIcons.checkCircle
                                : PhosphorIcons.xCircle,
                            color: tagmentProvider.apiKeyStatus!.isValid 
                                ? Colors.green
                                : Colors.red,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Status da API Tagment',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      if (tagmentProvider.apiKeyStatus!.isValid) ...[
                        Text(
                          '✅ API Key válida',
                          style: TextStyle(color: Colors.green, fontSize: 14),
                        ),
                        if (tagmentProvider.apiKeyStatus!.tier != null)
                          Text(
                            'Tier: ${tagmentProvider.apiKeyStatus!.tier}',
                            style: TextStyle(color: AppTheme.dark300, fontSize: 12),
                          ),
                        if (tagmentProvider.apiKeyStatus!.remainingRequests != null)
                          Text(
                            'Requests restantes: ${tagmentProvider.apiKeyStatus!.remainingRequests}',
                            style: TextStyle(color: AppTheme.dark300, fontSize: 12),
                          ),
                      ] else ...[
                        // Verificar se é erro de verificação mas API Key funciona
                        if (tagmentProvider.apiKeyStatus!.error?.contains('funcional para impressão') == true) ...[
                          Text(
                            '⚠️ API Key funcional',
                            style: TextStyle(color: Colors.orange, fontSize: 14),
                          ),
                          Text(
                            'Status não verificado, mas funciona para impressão',
                            style: TextStyle(color: AppTheme.dark300, fontSize: 12),
                          ),
                        ] else ...[
                          Text(
                            '❌ API Key inválida',
                            style: TextStyle(color: Colors.red, fontSize: 14),
                          ),
                          if (tagmentProvider.apiKeyStatus!.error != null)
                            Text(
                              tagmentProvider.apiKeyStatus!.error!,
                              style: TextStyle(color: AppTheme.dark300, fontSize: 12),
                            ),
                        ],
                      ],
                    ],
                  ),
                ),

              // Lista de impressoras
              Expanded(
                child: tagmentProvider.impressoras.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              PhosphorIcons.printer,
                              color: AppTheme.dark300,
                              size: 64,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Nenhuma impressora encontrada',
                              style: TextStyle(
                                color: AppTheme.dark300,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Verifique se o Print Agent está instalado e configurado.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: AppTheme.dark300,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: tagmentProvider.impressoras.length,
                        itemBuilder: (context, index) {
                          final impressora = tagmentProvider.impressoras[index];
                          return _buildPrinterCard(impressora);
                        },
                      ),
              ),
            ],
          ),
        );
        },
      ),
    );
  }

  Widget _buildPrinterCard(PrinterInfo impressora) {
    final isOnline = impressora.isOnline;
    final isValidade = impressora.isValidadePrinter;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.dark800,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isOnline ? Colors.green : Colors.red,
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header da impressora
          Row(
            children: [
              Icon(
                PhosphorIcons.printer,
                color: isOnline ? Colors.green : Colors.red,
                size: 24,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      impressora.displayName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (impressora.externalLocationId != null)
                      Text(
                        impressora.externalLocationId!,
                        style: TextStyle(
                          color: AppTheme.dark300,
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ),
              // Status badge e botões
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isOnline ? Colors.green : Colors.red,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      isOnline ? 'ONLINE' : 'OFFLINE',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Botões de configuração
                  Consumer<TagmentPrinterConfigProvider>(
                    builder: (context, configProvider, child) {
                      final isValidade = configProvider.isValidadePrinter(impressora.id);
                      final isRotulo = configProvider.isRotuloPrinter(impressora.id);
                      
                      return Row(
                        children: [
                          // Botão Validade
                          _buildConfigButton(
                            icon: PhosphorIcons.clock,
                            isActive: isValidade,
                            onTap: () => _toggleValidadePrinter(impressora.id, isValidade),
                          ),
                          const SizedBox(width: 6),
                          // Botão Rótulo
                          _buildConfigButton(
                            icon: PhosphorIcons.tag,
                            isActive: isRotulo,
                            onTap: () => _toggleRotuloPrinter(impressora.id, isRotulo),
                          ),
                          const SizedBox(width: 6),
                          // Botão de configurações avançadas
                          GestureDetector(
                            onTap: () => _mostrarConfiguracoesAvancadas(impressora),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppTheme.dark600,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: AppTheme.dark500,
                                  width: 1,
                                ),
                              ),
                              child: Icon(
                                PhosphorIcons.sliders,
                                color: AppTheme.dark300,
                                size: 20,
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          // Botão de teste
                          GestureDetector(
                            onTap: isOnline && !_testingPrinters.contains(impressora.id)
                                ? () => _testarImpressora(impressora.id, impressora.displayName)
                                : null,
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isOnline && !_testingPrinters.contains(impressora.id)
                                    ? AppTheme.primary
                                    : AppTheme.dark600,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: _testingPrinters.contains(impressora.id)
                                  ? const SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                      ),
                                    )
                                  : Icon(
                                      PhosphorIcons.play,
                                      color: isOnline ? Colors.white : AppTheme.dark300,
                                      size: 24,
                                    ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          // Tags
          if (impressora.tags != null && impressora.tags!.isNotEmpty)
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: impressora.tags!.map((tag) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isValidade && tag == 'validade' 
                      ? AppTheme.primary.withOpacity(0.2)
                      : AppTheme.dark600,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  tag,
                  style: TextStyle(
                    color: isValidade && tag == 'validade' 
                        ? AppTheme.primary
                        : AppTheme.dark300,
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              )).toList(),
            ),
          
          const SizedBox(height: 12),
          
          // Estatísticas
          Row(
            children: [
              Expanded(
                child: _buildStatItem(
                  'Hoje',
                  '${impressora.printsToday}',
                  PhosphorIcons.calendar,
                ),
              ),
              Expanded(
                child: _buildStatItem(
                  'Total',
                  '${impressora.totalPrints}',
                  PhosphorIcons.chartBar,
                ),
              ),
              Expanded(
                child: _buildStatItem(
                  'Última',
                  impressora.lastSeenAt != null 
                      ? _formatLastSeen(impressora.lastSeenAt!)
                      : 'N/A',
                  PhosphorIcons.clock,
                ),
              ),
            ],
          ),
          
          // Informações de conexão
          if (impressora.connection != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.dark700,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    PhosphorIcons.wifiHigh,
                    color: AppTheme.dark300,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${impressora.connection!['host']}:${impressora.connection!['port']}',
                    style: TextStyle(
                      color: AppTheme.dark300,
                      fontSize: 12,
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Informações de offset
          if (impressora.offsetX != null || impressora.offsetY != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: AppTheme.primary.withOpacity(0.3),
                  width: 1,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    PhosphorIcons.sliders,
                    color: AppTheme.primary,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Offset: X=${impressora.offsetX?.toStringAsFixed(1) ?? '0.0'}mm, Y=${impressora.offsetY?.toStringAsFixed(1) ?? '0.0'}mm',
                    style: TextStyle(
                      color: AppTheme.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
          
          // Erro se houver
          if (impressora.errorMessage != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Icon(
                    PhosphorIcons.warning,
                    color: Colors.red,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      impressora.errorMessage!,
                      style: const TextStyle(
                        color: Colors.red,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(
          icon,
          color: AppTheme.dark300,
          size: 16,
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            color: AppTheme.dark300,
            fontSize: 10,
          ),
        ),
      ],
    );
  }

  String _formatLastSeen(DateTime lastSeen) {
    final now = DateTime.now();
    final difference = now.difference(lastSeen);
    
    if (difference.inMinutes < 1) {
      return 'Agora';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h';
    } else {
      return '${difference.inDays}d';
    }
  }

  Widget _buildConfigButton({
    required IconData icon,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isActive ? AppTheme.primary : AppTheme.dark600,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isActive ? AppTheme.primary : AppTheme.dark500,
            width: 1,
          ),
        ),
        child: Icon(
          icon,
          color: isActive ? Colors.white : AppTheme.dark300,
          size: 18,
        ),
      ),
    );
  }

  Future<void> _toggleValidadePrinter(String printerId, bool isCurrentlyValidade) async {
    final configProvider = context.read<TagmentPrinterConfigProvider>();
    
    try {
      bool success;
      if (isCurrentlyValidade) {
        success = await configProvider.removeValidadePrinter();
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Impressora de validade removida'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );
        }
      } else {
        success = await configProvider.setValidadePrinter(printerId);
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Impressora de validade configurada'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );
        }
      }
      
      if (!success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro: ${configProvider.error ?? 'Erro desconhecido'}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro: $e'),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  Future<void> _toggleRotuloPrinter(String printerId, bool isCurrentlyRotulo) async {
    final configProvider = context.read<TagmentPrinterConfigProvider>();
    
    try {
      bool success;
      if (isCurrentlyRotulo) {
        success = await configProvider.removeRotuloPrinter();
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Impressora de rótulo removida'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );
        }
      } else {
        success = await configProvider.setRotuloPrinter(printerId);
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Impressora de rótulo configurada'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );
        }
      }
      
      if (!success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro: ${configProvider.error ?? 'Erro desconhecido'}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro: $e'),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 3),
        ),
      );
    }
  }

  Future<void> _mostrarConfiguracoesAvancadas(PrinterInfo impressora) async {
    final authProvider = context.read<AuthProvider>();
    final tagmentProvider = context.read<PrintProvider>();
    
    // Obter API key do Tagment
    final authToken = await authProvider.authToken;
    if (authToken == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Token de autenticação não encontrado'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Configurar API key do Tagment se necessário
    if (tagmentProvider.apiKeyAtual == null || tagmentProvider.apiKeyAtual!.isEmpty) {
      await tagmentProvider.configurarApiKeyDoCliente(
        authProvider.user!.clientId,
        authToken,
      );
    }

    final apiKey = tagmentProvider.apiKeyAtual;
    if (apiKey == null || apiKey.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('API key do Tagment não configurada'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Mostrar modal de configurações avançadas
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => PrinterOffsetModal(
        printer: impressora,
        apiKey: apiKey,
      ),
    );

    // Se houve sucesso, recarregar as impressoras para atualizar os dados
    if (result == true) {
      await _carregarDados();
    }
  }
}
