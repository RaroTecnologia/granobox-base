import 'dart:async';
import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../services/alerts_service.dart';
import '../services/labels_service.dart';
import '../providers/auth_provider.dart';
import '../providers/print_provider.dart';
import '../providers/tagment_printer_config_provider.dart';
import '../providers/categories_products_provider.dart';
import '../providers/operator_session_provider.dart';
import '../providers/date_config_provider.dart';
import '../providers/print_config_provider.dart';
import '../widgets/print_modal.dart';
import '../components/standard_header.dart';
import 'main_screen.dart';

/// Classe para manter o estado do progresso de baixa em lote
class _ProgressState {
  int processadas = 0;
  int sucesso = 0;
  int falhas = 0;
}

class AlertasScreen extends StatefulWidget {
  const AlertasScreen({super.key});

  @override
  State<AlertasScreen> createState() => _AlertasScreenState();
}

class _AlertasScreenState extends State<AlertasScreen> {
  final AlertsService _alertsService = AlertsService();
  final LabelsService _labelsService = LabelsService();
  AlertsData? _alertsData;
  bool _loading = false;
  String? _error;

  // ⭐ Sistema inteligente de toasts para baixas em sequência
  int _baixasPendentes = 0;
  DateTime? _ultimaBaixa;
  Timer? _timerConsolidacao;

  @override
  void initState() {
    super.initState();
    _carregarAlertas();
  }

  @override
  void dispose() {
    _timerConsolidacao?.cancel();
    super.dispose();
  }

  /// Exibe toast consolidado quando há múltiplas baixas em sequência
  void _exibirToastConsolidado() {
    if (_baixasPendentes == 0) return;
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _baixasPendentes == 1
                ? 'Etiqueta baixada com sucesso!'
                : '$_baixasPendentes etiquetas baixadas com sucesso!',
          ),
          backgroundColor: Colors.green,
          duration: Duration(seconds: _baixasPendentes > 10 ? 4 : 2),
        ),
      );
    }
    
    _baixasPendentes = 0;
    _ultimaBaixa = null;
  }

  Future<void> _carregarAlertas() async {
    final authProvider = context.read<AuthProvider>();
    final clientId = authProvider.user?.clientId;
    final authToken = await authProvider.authToken;

    if (clientId == null) {
      setState(() {
        _error = 'Cliente não identificado';
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final data = await _alertsService.getAlertsData(clientId, authToken: authToken);
      setState(() {
        _alertsData = data;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar alertas: $e';
        _loading = false;
      });
    }
  }

  Future<void> _resolverAlerta(String labelId) async {
    final authProvider = context.read<AuthProvider>();
    final authToken = await authProvider.authToken;

    try {
      await _alertsService.resolveAlert(labelId, authToken: authToken);
      
      // ⭐ Criar evento de baixa no histórico
      final currentOperator = context.read<OperatorSessionProvider>().currentOperator;
      await _labelsService.adicionarEvento(
        labelId,
        type: 'consumed',
        userId: currentOperator?.id,
        metadata: {
          'reason': 'alerta_baixa',
          'baixadoPor': currentOperator?.name ?? 'N/A',
        },
        authToken: authToken,
      );
      
      // ⭐ Sistema inteligente de toasts: consolidar se houver múltiplas baixas em sequência
      final agora = DateTime.now();
      final tempoDesdeUltimaBaixa = _ultimaBaixa != null 
          ? agora.difference(_ultimaBaixa!).inSeconds 
          : 999;
      
      // Se passou mais de 2 segundos desde a última baixa, exibir toast consolidado anterior (se houver)
      if (tempoDesdeUltimaBaixa > 2 && _baixasPendentes > 0) {
        _exibirToastConsolidado();
      }
      
      // Incrementar contador de baixas pendentes
      _baixasPendentes++;
      _ultimaBaixa = agora;
      
      // Cancelar timer anterior se existir
      _timerConsolidacao?.cancel();
      
      // Se já tem muitas baixas pendentes (>= 5), exibir imediatamente
      if (_baixasPendentes >= 5) {
        _exibirToastConsolidado();
      } else {
        // Agendar exibição do toast consolidado após 1.5 segundos de inatividade
        _timerConsolidacao = Timer(const Duration(milliseconds: 1500), () {
          _exibirToastConsolidado();
        });
      }
      
      // Recarregar alertas após resolver (sem mostrar toast individual)
      await _carregarAlertas();
    } catch (e) {
      // Em caso de erro, cancelar consolidação e exibir erro imediatamente
      _timerConsolidacao?.cancel();
      _baixasPendentes = 0;
      _ultimaBaixa = null;
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao resolver alerta: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  /// Baixar todas as etiquetas de um bloco
  Future<void> _baixarTodasEtiquetas(List<AlertProduct> produtos, String nomeBloco) async {
    // Filtrar apenas etiquetas não usadas
    final etiquetasParaBaixar = produtos.where((p) => !p.isUsed).toList();
    
    if (etiquetasParaBaixar.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Nenhuma etiqueta disponível para baixar em "$nomeBloco"'),
            backgroundColor: Colors.orange,
          ),
        );
      }
      return;
    }

    // Confirmar ação
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        title: const Text(
          'Baixar Todas as Etiquetas',
          style: TextStyle(color: Colors.white),
        ),
        content: Text(
          'Deseja baixar ${etiquetasParaBaixar.length} etiqueta(s) do bloco "$nomeBloco"?\n\nEsta ação não pode ser desfeita.',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
            ),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );

    if (confirmar != true) return;

    // ⭐ Resetar sistema de consolidação de toasts (baixa em lote tem seu próprio feedback)
    _timerConsolidacao?.cancel();
    _baixasPendentes = 0;
    _ultimaBaixa = null;

    final authProvider = context.read<AuthProvider>();
    final authToken = await authProvider.authToken;

    // Mostrar diálogo de progresso com barra real
    if (!mounted) return;
    
    final total = etiquetasParaBaixar.length;
    
    // Classe para manter o estado do progresso
    final progressState = _ProgressState();
    
    // Usar StatefulBuilder para atualizar o progresso em tempo real
    StateSetter? setDialogState;
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            setDialogState = setState;
            return AlertDialog(
              backgroundColor: AppTheme.dark800,
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Baixando Etiquetas',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Barra de progresso
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: total > 0 ? progressState.processadas / total : 0,
                      backgroundColor: AppTheme.dark600,
                      valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary),
                      minHeight: 8,
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Contador
                  Text(
                    '${progressState.processadas} de $total',
                    style: TextStyle(
                      color: AppTheme.dark300,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 8),
                  // Percentual
                  Text(
                    total > 0 
                        ? '${((progressState.processadas / total) * 100).toStringAsFixed(0)}%' 
                        : '0%',
                    style: TextStyle(
                      color: AppTheme.primary,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Status
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (progressState.sucesso > 0) ...[
                        Icon(PhosphorIcons.checkCircle, size: 16, color: Colors.green),
                        const SizedBox(width: 4),
                        Text(
                          '${progressState.sucesso}',
                          style: TextStyle(color: Colors.green, fontSize: 12),
                        ),
                        const SizedBox(width: 16),
                      ],
                      if (progressState.falhas > 0) ...[
                        Icon(PhosphorIcons.xCircle, size: 16, color: Colors.red),
                        const SizedBox(width: 4),
                        Text(
                          '${progressState.falhas}',
                          style: TextStyle(color: Colors.red, fontSize: 12),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );

    try {
      for (final produto in etiquetasParaBaixar) {
        try {
          final baixado = await _labelsService.marcarComoUsada(
            produto.labelId,
            authToken: authToken,
          );
          progressState.processadas++;
          if (baixado) {
            progressState.sucesso++;
          } else {
            progressState.falhas++;
          }
          
          // Atualizar progresso após cada etiqueta
          if (setDialogState != null && mounted) {
            setDialogState!(() {});
          }
        } catch (e) {
          print('❌ Erro ao baixar etiqueta ${produto.labelId}: $e');
          progressState.processadas++;
          progressState.falhas++;
          if (setDialogState != null && mounted) {
            setDialogState!(() {});
          }
        }
      }

      // Fechar diálogo de progresso
      if (mounted) {
        Navigator.pop(context);
      }

      // Usar os valores finais do progressState
      final sucesso = progressState.sucesso;
      final falhas = progressState.falhas;

      // Recarregar alertas
      await _carregarAlertas();

      // Mostrar resultado
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              falhas > 0
                  ? '$sucesso baixada(s) com sucesso, $falhas falha(s)'
                  : '${sucesso} etiqueta(s) baixada(s) com sucesso!',
            ),
            backgroundColor: falhas > 0 ? Colors.orange : Colors.green,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao baixar etiquetas: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  /// Abre o modal de seleção de conservação antes de reimprimir
  Future<void> _confirmarReimpressao(AlertProduct produto) async {
    final auth = context.read<AuthProvider>();
    final token = await auth.authToken;

    // Verificar código da etiqueta
    if (produto.labelCode == null || produto.labelCode!.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Código da etiqueta não encontrado'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return;
    }

    // Verificar se etiqueta já foi usada
    if (produto.isUsed) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Não é possível reimprimir etiquetas que já foram baixadas/consumidas'),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 3),
          ),
        );
      }
      return;
    }

    // Buscar dados completos da etiqueta
    final etiqueta = await _labelsService.buscarEtiquetaPorCodigo(
      produto.labelCode!,
      authToken: token,
    );

    if (etiqueta == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Etiqueta não encontrada'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return;
    }

    final metadata = Map<String, dynamic>.from(etiqueta['metadata'] ?? {});
    final productData = Map<String, dynamic>.from(etiqueta['product'] ?? {});
    final conservacaoAtual =
        (metadata['conservacao'] ?? etiqueta['conservationType'])?.toString() ??
        'ambiente';
    String novaConservacao = conservacaoAtual;

    // Buscar dias de validade do produto
    final diasAmbiente = productData['shelfLifeAmbient'] as int?;
    final diasRefrigerado = productData['shelfLifeRefrigerated'] as int?;
    final diasCongelado = productData['shelfLifeFrozen'] as int?;

    // Montar opções de conservação
    final opcoes = [
      {
        'tipo': 'ambiente',
        'nome': 'Ambiente',
        'icone': PhosphorIcons.house,
        'dias': diasAmbiente,
        'disponivel': diasAmbiente != null && diasAmbiente > 0,
      },
      {
        'tipo': 'refrigerado',
        'nome': 'Refrigerado',
        'icone': PhosphorIcons.thermometer,
        'dias': diasRefrigerado,
        'disponivel': diasRefrigerado != null && diasRefrigerado > 0,
      },
      {
        'tipo': 'congelado',
        'nome': 'Congelado',
        'icone': PhosphorIcons.snowflake,
        'dias': diasCongelado,
        'disponivel': diasCongelado != null && diasCongelado > 0,
      },
    ];

    final resultado = await showDialog<String>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return Dialog(
              backgroundColor: AppTheme.dark800,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Container(
                width: MediaQuery.of(context).size.width * 0.85,
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header
                    const Text(
                      'Reimprimir Etiqueta',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Selecione a conservação desejada:',
                      style: TextStyle(color: Colors.white70, fontSize: 14),
                    ),
                    const SizedBox(height: 20),
                    // Cards de conservação
                    Row(
                      children: opcoes.map((opcao) {
                        final isSelected = novaConservacao == opcao['tipo'];
                        final isDisponivel = opcao['disponivel'] as bool;
                        final dias = opcao['dias'] as int?;

                        return Expanded(
                          child: Padding(
                            padding: EdgeInsets.only(
                              right: opcoes.indexOf(opcao) < opcoes.length - 1
                                  ? 12
                                  : 0,
                            ),
                            child: GestureDetector(
                              onTap: isDisponivel
                                  ? () => setState(() {
                                      novaConservacao = opcao['tipo'] as String;
                                    })
                                  : null,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 16,
                                  horizontal: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: isDisponivel
                                      ? (isSelected
                                            ? AppTheme.primary.withOpacity(0.2)
                                            : AppTheme.dark700)
                                      : AppTheme.dark800,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isDisponivel
                                        ? (isSelected
                                              ? AppTheme.primary
                                              : AppTheme.dark600)
                                        : AppTheme.dark500,
                                    width: 2,
                                  ),
                                ),
                                child: Column(
                                  children: [
                                    Icon(
                                      opcao['icone'] as IconData,
                                      color: isDisponivel
                                          ? (isSelected
                                                ? AppTheme.primary
                                                : AppTheme.dark300)
                                          : AppTheme.dark500,
                                      size: 32,
                                    ),
                                    const SizedBox(height: 10),
                                    Text(
                                      opcao['nome'] as String,
                                      style: TextStyle(
                                        color: isDisponivel
                                            ? (isSelected
                                                  ? AppTheme.primary
                                                  : Colors.white)
                                            : AppTheme.dark500,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 14,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      isDisponivel
                                          ? (dias != null
                                                ? (dias == 1
                                                      ? '1 dia'
                                                      : '$dias dias')
                                                : 'N/A')
                                          : 'Indisponível',
                                      style: TextStyle(
                                        color: isDisponivel
                                            ? (isSelected
                                                  ? AppTheme.primary
                                                  : AppTheme.dark300)
                                            : AppTheme.dark500,
                                        fontSize: 12,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () => Navigator.of(context).pop(),
                          child: const Text(
                            'Cancelar',
                            style: TextStyle(fontSize: 16),
                          ),
                        ),
                        const SizedBox(width: 12),
                        ElevatedButton(
                          onPressed: () =>
                              Navigator.of(context).pop(novaConservacao),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primary,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 24,
                              vertical: 12,
                            ),
                          ),
                          child: const Text(
                            'Reimprimir',
                            style: TextStyle(fontSize: 16),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );

    if (resultado == null) return;

    // Na tela de alertas, SEMPRE recalcular a validade ao reimprimir
    // (independente de ter mudado a conservação ou não)
    await _alterarConservacaoEReimprimir(etiqueta, resultado);
  }

  /// Altera a conservação, recalcula validade e reimprime
  Future<void> _alterarConservacaoEReimprimir(
    Map<String, dynamic> etiqueta,
    String novaConservacao,
  ) async {
    final metadata = Map<String, dynamic>.from(etiqueta['metadata'] ?? {});
    final product = Map<String, dynamic>.from(etiqueta['product'] ?? {});
    final conservacaoAtual =
        (metadata['conservacao'] ?? etiqueta['conservationType'])?.toString() ??
        'ambiente';

    // Buscar dias de validade do produto
    final diasAmbiente = product['shelfLifeAmbient'] as int?;
    final diasRefrigerado = product['shelfLifeRefrigerated'] as int?;
    final diasCongelado = product['shelfLifeFrozen'] as int?;

    try {
      final auth = context.read<AuthProvider>();
      final token = await auth.authToken;
      final labelId = etiqueta['id']?.toString();

      if (labelId != null && labelId.isNotEmpty) {
        final novoMeta = Map<String, dynamic>.from(metadata);
        novoMeta['conservacao'] = novaConservacao;

        // Atualizar label_validade baseado na nova conservação
        switch (novaConservacao) {
          case 'ambiente':
            novoMeta['label_validade'] = 'VALIDADE T. AMBIENTE';
            break;
          case 'refrigerado':
            novoMeta['label_validade'] = 'VALIDADE REFRIGERADO';
            break;
          case 'congelado':
            novoMeta['label_validade'] = 'VALIDADE CONGELADO';
            break;
        }

        // Recalcular data de validade com base nos dias do produto
        int? diasValidade;
        switch (novaConservacao) {
          case 'ambiente':
            diasValidade = diasAmbiente;
            break;
          case 'refrigerado':
            diasValidade = diasRefrigerado;
            break;
          case 'congelado':
            diasValidade = diasCongelado;
            break;
        }

        String? novaValidityDateISO;
        if (diasValidade != null && diasValidade > 0) {
          final dataManipulacao =
              metadata['manipulacao'] ??
              metadata['emb_original'] ??
              etiqueta['productionDate'];
          DateTime dataBase = DateTime.now();

          // Tentar parsear a data de manipulação se existir
          if (dataManipulacao != null) {
            try {
              final dataStr = dataManipulacao.toString();
              if (dataStr.contains('/')) {
                final parts = dataStr.split('/');
                if (parts.length == 3) {
                  dataBase = DateTime(
                    int.parse(parts[2]),
                    int.parse(parts[1]),
                    int.parse(parts[0]),
                  );
                }
              }
            } catch (e) {
              // Se falhar, usa data atual
            }
          }

          final novaDataValidade = dataBase.add(Duration(days: diasValidade));
          novoMeta['validade'] =
              '${novaDataValidade.day.toString().padLeft(2, '0')}/${novaDataValidade.month.toString().padLeft(2, '0')}/${novaDataValidade.year}';
          // Formato ISO para a API (YYYY-MM-DD)
          novaValidityDateISO =
              '${novaDataValidade.year}-${novaDataValidade.month.toString().padLeft(2, '0')}-${novaDataValidade.day.toString().padLeft(2, '0')}';
        }

        // Atualizar etiqueta na API (metadata + validityDate + conservationType)
        await _labelsService.atualizarEtiqueta(
          labelId,
          validityDate: novaValidityDateISO,
          conservationType: novaConservacao,
          metadata: novoMeta,
          authToken: token,
        );
        // ⭐ Obter operador atual para salvar no histórico
        final currentOperator = context.read<OperatorSessionProvider>().currentOperator;
        await _labelsService.adicionarEvento(
          labelId,
          type: 'updated',
          userId: currentOperator?.id,
          metadata: {
            'reason': novaConservacao != conservacaoAtual 
                ? 'conservation_change' 
                : 'validity_extension',
            'old_conservation': conservacaoAtual,
            'new_conservation': novaConservacao,
            'new_expiry': novoMeta['validade'],
          },
          authToken: token,
        );

        // Reimprimir com dados atualizados
        final etiquetaAtualizada = Map<String, dynamic>.from(etiqueta);
        etiquetaAtualizada['metadata'] = novoMeta;
        etiquetaAtualizada['conservationType'] = novaConservacao;
        // Atualizar também o validityDate no objeto local para consistência
        if (novaValidityDateISO != null) {
          etiquetaAtualizada['validityDate'] = novaValidityDateISO;
        }
        await _reimprimirEtiqueta(etiquetaAtualizada);
        // _reimprimirEtiqueta já recarrega os alertas após a impressão
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Falha ao alterar conservação: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  /// Reimprime a etiqueta com os dados atuais
  Future<void> _reimprimirEtiqueta(Map<String, dynamic> etiqueta) async {
    final auth = context.read<AuthProvider>();
    final clientId = auth.user?.clientId;
    final token = await auth.authToken;

    try {
      final tagmentProvider = context.read<PrintProvider>();
      final printerConfigProvider = context.read<TagmentPrinterConfigProvider>();

      // Garantir que o provider de configuração esteja associado
      tagmentProvider.setPrinterConfigProvider(printerConfigProvider);
      if (printerConfigProvider.config == null && !printerConfigProvider.isLoading) {
        await printerConfigProvider.loadConfig();
      }

      // Configurar API Key do Tagment
      if (tagmentProvider.apiKeyAtual == null || tagmentProvider.apiKeyAtual!.isEmpty) {
        final configurado = await tagmentProvider.configurarApiKeyDoCliente(
          clientId!,
          token!,
        );
        if (!configurado) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Erro ao configurar sistema de impressão. Tente novamente.'),
                backgroundColor: Colors.red,
                duration: Duration(seconds: 4),
              ),
            );
          }
          return;
        }
      }

      // Refresh impressoras
      await tagmentProvider.carregarImpressoras(
        locationId: null,
        forceRefresh: true,
        token: token,
        clientId: clientId,
      );

      final metadata = Map<String, dynamic>.from(etiqueta['metadata'] ?? {});
      final categoriesProvider = context.read<CategoriesProductsProvider>();
      final storageLocationId = etiqueta['storageLocationId']?.toString();

      String? productId;
      final metaProductId = metadata['productId'];
      if (metaProductId is String && metaProductId.isNotEmpty) {
        productId = metaProductId;
      } else {
        final etiquetaProduct = etiqueta['product'];
        if (etiquetaProduct is Map<String, dynamic>) {
          final id = etiquetaProduct['id'];
          if (id is String && id.isNotEmpty) {
            productId = id;
          }
        }
      }

      final productData = productId != null
          ? categoriesProvider.getProductById(productId)
          : null;
      final category = productData?.categoryId != null
          ? categoriesProvider.getCategoryById(productData!.categoryId!)
          : null;

      final printerInfo = await tagmentProvider.obterImpressoraValidade(
        storageLocationId,
        defaultPrinterId: productData?.defaultPrinterId,
        categoryDefaultPrinterId: category?.defaultPrinterId,
      );

      if (printerInfo == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Nenhuma impressora de validade disponível. Verifique as configurações.'),
              backgroundColor: Colors.red,
              duration: Duration(seconds: 4),
            ),
          );
        }
        return;
      }

      final printerIP = '';
      final offsets = tagmentProvider.obterOffsetsImpressora(printerInfo);

      // Extrair dados da etiqueta/metadata
      final produtoNome = (metadata['produto'] ?? etiqueta['product']?['name'] ?? '-').toString();
      final marca = (metadata['marca'] ?? '').toString();
      final sif = (metadata['sif'] ?? etiqueta['product']?['sif'] ?? '').toString();

      // Datas
      final dateConfig = Provider.of<DateConfigProvider>(context, listen: false);
      String _fmt(String raw) {
        if (raw.isEmpty) return raw;
        if (raw.contains('/')) {
          if (!dateConfig.showTimeInDates) return raw;
          if (raw.contains(':')) return raw;
          final now = DateTime.now();
          final hh = now.hour.toString().padLeft(2, '0');
          final min = now.minute.toString().padLeft(2, '0');
          return '$raw $hh:$min';
        }
        try {
          final normalized = raw.replaceAll('T', ' ').split('.').first;
          final dt = DateTime.parse(normalized);
          final dd = dt.day.toString().padLeft(2, '0');
          final mm = dt.month.toString().padLeft(2, '0');
          final yyyy = dt.year.toString();
          final base = '$dd/$mm/$yyyy';
          if (!dateConfig.showTimeInDates) return base;
          int h = dt.hour;
          int m = dt.minute;
          if (h == 0 && m == 0 && !normalized.contains(':')) {
            final now = DateTime.now();
            h = now.hour;
            m = now.minute;
          }
          final hh = h.toString().padLeft(2, '0');
          final min = m.toString().padLeft(2, '0');
          return '$base $hh:$min';
        } catch (_) {
          return raw;
        }
      }

      // ⭐ Verificar configuração de atualizar data na reimpressão
      final printConfig = Provider.of<PrintConfigProvider>(context, listen: false);
      final shouldUpdateDate = printConfig.updateDateOnReprint;

      final dataEmbalagem = _fmt(
        (metadata['emb_original'] ?? metadata['manipulacao'] ?? etiqueta['productionDate'] ?? '').toString(),
      );
      
      // Se a configuração está ativa, usar data/hora atual para manipulação
      final String dataManipulacao;
      if (shouldUpdateDate) {
        final now = DateTime.now();
        final dd = now.day.toString().padLeft(2, '0');
        final mm = now.month.toString().padLeft(2, '0');
        final yyyy = now.year.toString();
        final hh = now.hour.toString().padLeft(2, '0');
        final min = now.minute.toString().padLeft(2, '0');
        if (dateConfig.showTimeInDates) {
          dataManipulacao = '$dd/$mm/$yyyy $hh:$min';
        } else {
          dataManipulacao = '$dd/$mm/$yyyy';
        }
        print('🖨️ [Reimpressão] Data de manipulação ATUALIZADA para: $dataManipulacao');
      } else {
        dataManipulacao = _fmt(
          (metadata['manipulacao'] ?? metadata['emb_original'] ?? etiqueta['productionDate'] ?? '').toString(),
        );
        print('🖨️ [Reimpressão] Data de manipulação MANTIDA: $dataManipulacao');
      }
      final dataValidade = _fmt(
        (metadata['validade'] ?? etiqueta['validityDate'] ?? '').toString(),
      );
      final conservacao = (metadata['conservacao'] ?? etiqueta['conservationType'])?.toString();

      String qtdPeso = (metadata['qtd_peso'] ?? '').toString().trim();
      final valorQty = (etiqueta['weight'] ?? etiqueta['quantity'] ?? '').toString().trim();
      final unidadeQty = (etiqueta['unit'] ?? etiqueta['weightUnit'] ?? etiqueta['product']?['weightUnit'] ?? metadata['unidade'] ?? '').toString().trim();
      if (qtdPeso.isEmpty) {
        if (valorQty.isNotEmpty && unidadeQty.isNotEmpty) {
          qtdPeso = '$valorQty $unidadeQty';
        } else if (valorQty.isNotEmpty) {
          qtdPeso = valorQty;
        }
      } else {
        final hasLetters = RegExp(r'[A-Za-z]').hasMatch(qtdPeso);
        if (!hasLetters && unidadeQty.isNotEmpty) {
          qtdPeso = '$qtdPeso $unidadeQty';
        }
      }

      final responsavel = (metadata['responsavel'] ?? etiqueta['createdByName'] ?? context.read<OperatorSessionProvider>().currentOperator?.name ?? 'N/A').toString();
      final armazenamento = (metadata['armazenamento'] ?? '').toString();

      String labelValidade = (metadata['label_validade'] ?? metadata['label_valdade'] ?? '').toString();
      if (labelValidade.isEmpty) {
        final cons = (conservacao ?? '').toString();
        if (cons == 'refrigerado') {
          labelValidade = 'VALIDADE REFRIGERADO';
        } else if (cons == 'congelado') {
          labelValidade = 'VALIDADE CONGELADO';
        } else {
          labelValidade = 'VALIDADE T. AMBIENTE';
        }
      }

      final codigo = (etiqueta['code'] ?? '').toString();
      final loteIndustria = (metadata['lote_industria'] ?? etiqueta['manufacturingBatch'] ?? '').toString();
      final dataVencimentoIndustria = _fmt((metadata['data_vencimento_industria'] ?? etiqueta['expiryDate'] ?? '').toString());

      await showPrintModal(
        context: context,
        title: 'Reimprimindo Etiqueta',
        printFunction: (onProgress) => tagmentProvider.imprimirEtiquetaValidade(
          produto: produtoNome,
          marca: marca,
          sif: sif,
          dataEmbalagem: dataEmbalagem,
          dataManipulacao: dataManipulacao,
          dataValidade: dataValidade,
          printerIP: printerIP,
          offsetX: offsets['x'] ?? 0.0,
          offsetY: offsets['y'] ?? 0.0,
          printerInfo: printerInfo,
          copies: 1,
          qtdPeso: qtdPeso,
          responsavel: responsavel,
          armazenamento: armazenamento,
          labelValidade: labelValidade,
          templateId: productData?.customTemplateId,
          categoryDefaultTemplateId: category?.defaultTemplateId,
          clientId: clientId,
          authToken: token,
          codigo: codigo,
          productId: productId,
          storageLocationId: storageLocationId,
          conservacao: conservacao,
          reimpressao: true,
          loteIndustria: loteIndustria,
          dataVencimentoIndustria: dataVencimentoIndustria,
        ),
        onSuccess: () {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Etiqueta $codigo reimpressa com sucesso'),
                backgroundColor: Colors.green,
              ),
            );
          }
        },
        onError: () {},
      );

      // Atualizar status da etiqueta após impressão
      try {
        final labelId = etiqueta['id']?.toString();
        if (labelId != null && labelId.isNotEmpty) {
          bool ok = await _labelsService.atualizarStatus(
            labelId,
            'printed',
            authToken: token,
          );
          if (!ok) {
            await _labelsService.marcarComoImpressas([labelId], authToken: token);
          }
        }
      } catch (e) {
        print('⚠️ Falha ao atualizar status pós-reimpressão: $e');
      }

      // Recarregar alertas para refletir as mudanças
      await _carregarAlertas();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao reimprimir etiqueta: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Color _getPrioridadeColor(String prioridade) {
    switch (prioridade) {
      case 'alta':
        return Colors.red;
      case 'média':
        return Colors.orange;
      case 'baixa':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  String _formatarData(String data) {
    try {
      final date = DateTime.parse(data);
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
    } catch (e) {
      return data;
    }
  }

  IconData _getConservationIcon(String? conservationType) {
    switch (conservationType) {
      case 'refrigerado':
        return PhosphorIcons.thermometer;
      case 'congelado':
        return PhosphorIcons.snowflake;
      case 'ambiente':
      default:
        return PhosphorIcons.house;
    }
  }

  Color _getConservationColor(String? conservationType) {
    switch (conservationType) {
      case 'refrigerado':
        return Colors.blue;
      case 'congelado':
        return Colors.cyan;
      case 'ambiente':
      default:
        return Colors.green;
    }
  }

  String _getConservationText(String? conservationType) {
    switch (conservationType) {
      case 'refrigerado':
        return 'Refrigerado';
      case 'congelado':
        return 'Congelado';
      case 'ambiente':
      default:
        return 'Ambiente';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      body: Column(
        children: [
          // Header padronizado
          StandardHeader(
            title: 'Alertas',
            subtitle: 'Produtos próximos ao vencimento',
            showBack: false,
            showSearch: false,
            showHome: true,
            iconColor: AppTheme.primary,
            showLeading: true,
            leadingIcon: PhosphorIcons.warning,
            leadingIconPath: 'assets/icons/alertas.svg',
            onHome: () {
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (context) => const MainScreen()),
                (route) => false,
              );
            },
          ),

          // Conteúdo
          Expanded(
              child: _loading && _alertsData == null
                  ? const Center(
                      child: CircularProgressIndicator(
                        color: AppTheme.primary,
                      ),
                    )
                  : _error != null && _alertsData == null
                      ? RefreshIndicator(
                          onRefresh: _carregarAlertas,
                          color: AppTheme.primary,
                          child: SingleChildScrollView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            child: SizedBox(
                              height: MediaQuery.of(context).size.height * 0.7,
                              child: Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                PhosphorIcons.warning,
                                size: 48,
                                color: Colors.red,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Erro ao carregar alertas',
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _error!,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: AppTheme.dark300,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 24),
                              ElevatedButton(
                                onPressed: _carregarAlertas,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.primary,
                                  foregroundColor: Colors.white,
                                ),
                                child: const Text('Tentar Novamente'),
                              ),
                            ],
                                ),
                              ),
                            ),
                          ),
                        )
                      : _alertsData == null
                          ? RefreshIndicator(
                              onRefresh: _carregarAlertas,
                              color: AppTheme.primary,
                              child: SingleChildScrollView(
                                physics: const AlwaysScrollableScrollPhysics(),
                                child: SizedBox(
                                  height: MediaQuery.of(context).size.height * 0.7,
                                  child: Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(
                                    PhosphorIcons.package,
                                    size: 48,
                                    color: AppTheme.dark300,
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'Nenhum alerta encontrado',
                                    style: TextStyle(
                                      fontSize: 18,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Não há produtos vencidos ou vencendo',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: AppTheme.dark300,
                                    ),
                                  ),
                                ],
                              ),
                                  ),
                                ),
                              ),
                            )
                          : RefreshIndicator(
                              onRefresh: _carregarAlertas,
                              color: AppTheme.primary,
                              child: _buildContent(),
                            ),
            ),
          ],
        ),
    );
  }

  Widget _buildContent() {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Produtos Vencidos
          _buildSection(
            title: 'Produtos Vencidos',
            subtitle: 'Ação imediata necessária',
            icon: PhosphorIcons.xCircle,
            iconColor: Colors.red,
            backgroundColor: Colors.red.withOpacity(0.1),
            borderColor: Colors.red.withOpacity(0.2),
            products: _alertsData!.expired,
            badgeColor: Colors.red,
            emptyMessage: 'Nenhum produto vencido!',
            emptySubtitle: 'Excelente gestão de estoque',
          ),

          const SizedBox(height: 20),

          // Vencendo em 7 dias
          _buildSection(
            title: 'Vencendo em 7 dias',
            subtitle: 'Use antes do vencimento',
            icon: PhosphorIcons.warning,
            iconColor: Colors.orange,
            backgroundColor: Colors.orange.withOpacity(0.1),
            borderColor: Colors.orange.withOpacity(0.2),
            products: _alertsData!.expiring7Days,
            badgeColor: Colors.orange,
            emptyMessage: 'Nenhum produto vencendo em 7 dias',
            emptySubtitle: 'Controle preventivo em dia',
          ),

          const SizedBox(height: 20),

          // Vencendo em 30 dias
          _buildSection(
            title: 'Vencendo em 30 dias',
            subtitle: 'Monitoramento preventivo',
            icon: PhosphorIcons.clock,
            iconColor: Colors.grey,
            backgroundColor: Colors.grey.withOpacity(0.1),
            borderColor: Colors.grey.withOpacity(0.2),
            products: _alertsData!.expiring30Days,
            badgeColor: Colors.grey,
            emptyMessage: 'Nenhum produto vencendo em 30 dias',
            emptySubtitle: 'Planejamento de longo prazo em ordem',
          ),
        ],
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required Color backgroundColor,
    required Color borderColor,
    required List<AlertProduct> products,
    required Color badgeColor,
    required String emptyMessage,
    required String emptySubtitle,
  }) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppTheme.dark800,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon,
                  color: iconColor,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 14,
                        color: iconColor,
                      ),
                    ),
                  ],
                ),
              ),
              // Botão Baixar Todas (só aparece se houver produtos não usados)
              if (products.any((p) => !p.isUsed))
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ElevatedButton.icon(
                    onPressed: () => _baixarTodasEtiquetas(products, title),
                    icon: const Icon(PhosphorIcons.checkCircle, size: 16),
                    label: const Text('Baixar Todas'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: badgeColor.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${products.length}',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: badgeColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          products.isEmpty
              ? SizedBox(
                  width: double.infinity,
                  child: _buildEmptyState(emptyMessage, emptySubtitle),
                )
              : Column(
                  children: products.map((produto) => _buildProductCard(produto)).toList(),
                ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String message, String subtitle) {
    return SizedBox(
      width: double.infinity,
      child: Container(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              PhosphorIcons.checkCircle,
              size: 48,
              color: Colors.green,
            ),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.dark300,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatarDiasVencimento(int daysToExpiration) {
    if (daysToExpiration < 0) {
      final dias = daysToExpiration.abs();
      return dias == 1 ? 'Venceu há 1 dia' : 'Venceu há $dias dias';
    } else if (daysToExpiration == 0) {
      return 'Vence hoje';
    } else {
      return daysToExpiration == 1 ? 'Vence em 1 dia' : 'Vence em $daysToExpiration dias';
    }
  }

  Color _getColorByDaysToExpiration(int daysToExpiration) {
    if (daysToExpiration < 0) {
      // Vencido - sempre vermelho
      return Colors.red;
    } else if (daysToExpiration == 0) {
      // Vencendo hoje - vermelho
      return Colors.red;
    } else if (daysToExpiration <= 3) {
      // Vencendo em 1-3 dias - laranja/vermelho
      return Colors.orange;
    } else if (daysToExpiration <= 7) {
      // Vencendo em 4-7 dias - laranja
      return Colors.orange;
    } else {
      // Vencendo em 8-30 dias - azul
      return Colors.blue;
    }
  }

  Widget _buildProductCard(AlertProduct produto) {
    // Usar cor baseada nos dias de vencimento, não na prioridade
    final cardColor = _getColorByDaysToExpiration(produto.daysToExpiration);
    
    // Sempre usar storageLocation se disponível, não mostrar conservação
    String? displayLocation;
    IconData? locationIcon;
    Color? locationColor;
    
    if (produto.storageLocation != null && produto.storageLocation!.isNotEmpty) {
      displayLocation = produto.storageLocation;
      locationIcon = PhosphorIcons.mapPin;
      locationColor = AppTheme.primary;
    }
    // Não mostrar conservação como fallback - apenas local de armazenamento

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: cardColor.withOpacity(0.2),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: cardColor.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(
              PhosphorIcons.package,
              color: cardColor,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  produto.name,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  children: [
                    // Só mostrar categoria se não for "Produto"
                    if (produto.category.toLowerCase() != 'produto')
                      Text(
                        produto.category,
                        style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.dark300,
                        ),
                      ),
                    // Código da etiqueta
                    if (produto.labelCode != null && produto.labelCode!.isNotEmpty)
                      Text(
                        'Código: ${produto.labelCode}',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.dark300,
                        ),
                      ),
                    Text(
                      _formatarDiasVencimento(produto.daysToExpiration),
                      style: TextStyle(
                        fontSize: 12,
                        color: cardColor,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (displayLocation != null)
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            locationIcon,
                            size: 14,
                            color: locationColor,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            displayLocation!,
                            style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.dark300,
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          // Botão de reimprimir
          if (!produto.isUsed)
            GestureDetector(
              onTap: () => _confirmarReimpressao(produto),
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  PhosphorIcons.printer,
                  color: AppTheme.primary,
                  size: 20,
                ),
              ),
            ),
          if (!produto.isUsed) const SizedBox(width: 8),
          ElevatedButton(
            onPressed: () => _resolverAlerta(produto.labelId),
            style: ElevatedButton.styleFrom(
              backgroundColor: cardColor,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Baixar'),
                const SizedBox(width: 4),
                const Icon(PhosphorIcons.arrowRight, size: 16),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

