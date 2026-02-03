import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../theme/app_theme.dart';
import '../components/custom_icon.dart';
import '../providers/auth_provider.dart';
import '../providers/operations_provider.dart';
import '../providers/operators_provider.dart';
import '../providers/print_provider.dart';
import '../providers/categories_products_provider.dart'; // ⭐ NOVO
import '../providers/operator_session_provider.dart';
import '../models/operation_models.dart';
import '../models/operator_models.dart';
import 'rotulo_impressao_screen.dart';
import 'manipulado_screen.dart';
import '../widgets/print_modal.dart';
import '../providers/labels_provider.dart';
import '../services/labels_service.dart';

class NovaEtiquetaScreen extends StatefulWidget {
  const NovaEtiquetaScreen({super.key});

  @override
  State<NovaEtiquetaScreen> createState() => _NovaEtiquetaScreenState();
}

class _NovaEtiquetaScreenState extends State<NovaEtiquetaScreen>
    with TickerProviderStateMixin {
  // Controllers para animação de pulso
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  // Dados mockados dos produtos para busca
  final List<Map<String, dynamic>> produtos = [
    // Matéria Prima
    {
      'id': 'mp1',
      'nome': 'Farinha de Trigo Tipo 1',
      'segmento': 'materia-prima',
      'codigo': 'FT001',
      'unidade': 'kg',
    },
    {
      'id': 'mp2',
      'nome': 'Farinha de Milho Fino',
      'segmento': 'materia-prima',
      'codigo': 'FM001',
      'unidade': 'kg',
    },
    {
      'id': 'mp3',
      'nome': 'Açúcar Refinado',
      'segmento': 'materia-prima',
      'codigo': 'AR001',
      'unidade': 'kg',
    },
    {
      'id': 'mp4',
      'nome': 'Sal Refinado',
      'segmento': 'materia-prima',
      'codigo': 'SR001',
      'unidade': 'kg',
    },
    {
      'id': 'mp5',
      'nome': 'Óleo de Soja',
      'segmento': 'materia-prima',
      'codigo': 'OS001',
      'unidade': 'L',
    },

    // Manipulado
    {
      'id': 'man1',
      'nome': 'Massa de Pão',
      'segmento': 'manipulado',
      'codigo': 'MP001',
      'unidade': 'kg',
    },
    {
      'id': 'man2',
      'nome': 'Massa de Bolo',
      'segmento': 'manipulado',
      'codigo': 'MB001',
      'unidade': 'kg',
    },
    {
      'id': 'man3',
      'nome': 'Recheio de Chocolate',
      'segmento': 'manipulado',
      'codigo': 'RC001',
      'unidade': 'kg',
    },
    {
      'id': 'man4',
      'nome': 'Cobertura de Baunilha',
      'segmento': 'manipulado',
      'codigo': 'CB001',
      'unidade': 'kg',
    },
    {
      'id': 'man5',
      'nome': 'Massa de Pizza',
      'segmento': 'manipulado',
      'codigo': 'MZ001',
      'unidade': 'kg',
    },

    // Produto Final
    {
      'id': 'pf1',
      'nome': 'Pão Francês',
      'segmento': 'produto-final',
      'codigo': 'PF001',
      'unidade': 'un',
    },
    {
      'id': 'pf2',
      'nome': 'Pão de Leite',
      'segmento': 'produto-final',
      'codigo': 'PL001',
      'unidade': 'un',
    },
    {
      'id': 'pf3',
      'nome': 'Bolo de Chocolate',
      'segmento': 'produto-final',
      'codigo': 'BC001',
      'unidade': 'un',
    },
    {
      'id': 'pf4',
      'nome': 'Pizza Margherita',
      'segmento': 'produto-final',
      'codigo': 'PM001',
      'unidade': 'un',
    },
    {
      'id': 'pf5',
      'nome': 'Croissant',
      'segmento': 'produto-final',
      'codigo': 'CR001',
      'unidade': 'un',
    },
  ];

  // Dados mock para os tipos de etiqueta
  final List<Map<String, dynamic>> tiposEtiqueta = [
    {
      'id': 'validade',
      'nome': 'Validade',
      'descricao': 'Etiquetas para itens manipulados',
      'iconPath': 'assets/icons/validade.svg',
      'cor': AppTheme.primary,
    },
    {
      'id': 'baixa',
      'nome': 'Baixa de Etiqueta',
      'descricao': 'Dar baixa em etiquetas',
      'icon': PhosphorIcons.qrCode,
      'cor': AppTheme.dark300,
      'isSmall': true, // Card menor
    },
    {
      'id': 'rotulo',
      'nome': 'Rótulo',
      'descricao': 'Rótulos para produtos finalizados',
      'iconPath': 'assets/icons/tag.svg',
      'cor': Color(0xFF6B9080), // Verde claro suave
    },
  ];

  String? _tipoSelecionado;
  String? _categoriaSelecionada;
  String? _localArmazenamentoSelecionado;
  Map<String, dynamic>? _produtoSelecionado;

  // Dados da operação e operador
  // Operação passa a ser lida diretamente do OperationsProvider no build
  String? _operadorAtual;
  // Reverter para não amarrar operação ao clientId aqui

  // Estado de impressão
  bool _isPrinting = false;

  // Lista de locais de armazenamento disponíveis
  final List<Map<String, dynamic>> locaisArmazenamento = [
    {
      'id': 'geladeira',
      'nome': 'Geladeira',
      'descricao': 'Refrigeração (0°C a 8°C)',
      'icon': PhosphorIcons.snowflake,
      'cor': Colors.blue,
    },
    {
      'id': 'freezer',
      'nome': 'Freezer',
      'descricao': 'Congelamento (-18°C ou menos)',
      'icon': PhosphorIcons.snowflake,
      'cor': Colors.cyan,
    },
    {
      'id': 'prateleira',
      'nome': 'Prateleira',
      'descricao': 'Armazenamento ambiente',
      'icon': PhosphorIcons.package,
      'cor': Colors.amber,
    },
    {
      'id': 'estoque',
      'nome': 'Estoque',
      'descricao': 'Área de estoque geral',
      'icon': PhosphorIcons.house,
      'cor': Colors.grey,
    },
    {
      'id': 'balcao',
      'nome': 'Balcão',
      'descricao': 'Área de exposição/venda',
      'icon': PhosphorIcons.mapPin,
      'cor': Colors.green,
    },
    {
      'id': 'outro',
      'nome': 'Outro',
      'descricao': 'Outro tipo de local',
      'icon': PhosphorIcons.mapPin,
      'cor': Colors.purple,
    },
  ];

  @override
  void initState() {
    super.initState();
    _initAnimations();
    _loadDataFromAPI();
    // mantido apenas dados de UI

    // Adicionar listener para mudanças no operador da sessão
    WidgetsBinding.instance.addPostFrameCallback((_) {
      try {
        final operatorSessionProvider = context.read<OperatorSessionProvider>();
        operatorSessionProvider.addListener(_onOperatorSessionChanged);
      } catch (_) {}
    });
  }

  // Callback chamado quando o operador da sessão muda
  void _onOperatorSessionChanged() {
    try {
      final currentSessionOperator = context
          .read<OperatorSessionProvider>()
          .currentOperator;

      if (currentSessionOperator != null && mounted) {
        setState(() {
          _operadorAtual = currentSessionOperator.name;
        });
      }
    } catch (_) {}
  }

  // Removida inicialização forçada do provider/impressoras

  Future<void> _loadDataFromAPI() async {
    final authProvider = context.read<AuthProvider>();
    final operationsProvider = context.read<OperationsProvider>();
    final operatorsProvider = context.read<OperatorsProvider>();

    if (authProvider.isAuthenticated) {
      final token = await authProvider.authToken;
      final clientId = authProvider.user?.clientId;
      if (token != null) {
        await Future.wait([
          operationsProvider.loadOperations(token: token, clientId: clientId),
          operatorsProvider.loadOperators(
            forceRefresh: true,
          ), // Forçar refresh para refletir roles atualizadas
        ]);

        // ⭐ NOVO: Auto-selecionar primeira operação se não houver seleção
        if (operationsProvider.selectedOperation == null &&
            operationsProvider.activeOperations.isNotEmpty) {
          operationsProvider.selectOperation(
            operationsProvider.activeOperations.first,
          );
        }

        // Sincronizar sessão do operador com a lista atualizada (atualiza role/status)
        try {
          context.read<OperatorSessionProvider>().refreshFromOperators(
            operatorsProvider.activeOperators,
          );

          // Sincronizar _operadorAtual com o operador da sessão
          final currentSessionOperator = context
              .read<OperatorSessionProvider>()
              .currentOperator;
          if (currentSessionOperator != null && mounted) {
            setState(() {
              _operadorAtual = currentSessionOperator.name;
            });
          }
        } catch (_) {}

        // Não armazenar localmente operação; será lida do provider no build

        // Não pré-selecionar operador: requer seleção explícita com PIN

        // Atualizar a UI após carregar os dados
        setState(() {});
      }
    }
  }

  void _initAnimations() {
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );

    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.3).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    // Remover listener quando a tela for destruída
    try {
      final operatorSessionProvider = context.read<OperatorSessionProvider>();
      operatorSessionProvider.removeListener(_onOperatorSessionChanged);
    } catch (_) {}
    _pulseController.dispose();
    super.dispose();
  }

  void _mostrarModalBusca() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.dark900,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _BuscaAvancadaModal(
        produtos: produtos,
        segmentos: [
          {
            'id': 'materia-prima',
            'nome': 'Matéria Prima',
            'cor': Colors.blue,
            'icon': PhosphorIcons.circle,
          },
          {
            'id': 'manipulado',
            'nome': 'Manipulado',
            'cor': Colors.green,
            'icon': PhosphorIcons.cookingPot,
          },
          {
            'id': 'produto-final',
            'nome': 'Produto Final',
            'cor': Colors.purple,
            'icon': PhosphorIcons.package,
          },
        ],
        onProdutoSelecionado: (produto) {
          setState(() {
            _produtoSelecionado = produto;
          });
          Navigator.pop(context);
        },
      ),
    );
  }

  void _mostrarModalTrocarOperador() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        title: const Text('Operador', style: TextStyle(color: Colors.white)),
        content: SizedBox(
          width: 400,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Opção para sair do operador (limpar seleção)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: Icon(
                    PhosphorIcons.signOut,
                    color: Colors.redAccent,
                    size: 24,
                  ),
                  title: const Text(
                    'Sair do operador',
                    style: TextStyle(color: Colors.white),
                  ),
                  subtitle: Text(
                    _operadorAtual == null
                        ? 'Nenhum operador selecionado'
                        : 'Atual: ${_operadorAtual!}',
                    style: const TextStyle(color: Color(0xFF9CA3AF)),
                  ),
                  onTap: () {
                    setState(() {
                      _operadorAtual = null;
                    });
                    context.read<OperatorSessionProvider>().setCurrentOperator(
                      null,
                    );
                    Navigator.pop(context);
                  },
                  tileColor: AppTheme.dark700,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
              // Lista de operadores
              // Lista de operadores
              ...context.read<OperatorsProvider>().activeOperators.map<Widget>((
                operador,
              ) {
                final isAtual = operador.name == _operadorAtual;
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: Icon(
                      isAtual ? PhosphorIcons.checkCircle : PhosphorIcons.user,
                      color: isAtual ? Colors.green : AppTheme.primary,
                      size: 24,
                    ),
                    title: Text(
                      operador.name,
                      style: TextStyle(
                        color: isAtual ? Colors.green : Colors.white,
                        fontWeight: isAtual
                            ? FontWeight.bold
                            : FontWeight.normal,
                      ),
                    ),
                    subtitle: isAtual
                        ? const Text(
                            'Operador Atual',
                            style: TextStyle(color: Colors.green),
                          )
                        : null,
                    onTap: isAtual ? null : () => _validarPinOperador(operador),
                    tileColor: isAtual ? AppTheme.dark700 : null,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                );
              }).toList(),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Cancelar',
              style: TextStyle(color: AppTheme.dark300),
            ),
          ),
        ],
      ),
    );
  }

  // ⭐ NOVO: Modal para selecionar operação
  void _mostrarSeletorOperacao() {
    final operationsProvider = context.read<OperationsProvider>();
    final activeOps = operationsProvider.activeOperations;
    final selectedOp = operationsProvider.selectedOperation;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        title: const Text(
          'Selecionar Operação',
          style: TextStyle(color: Colors.white),
        ),
        content: SizedBox(
          width: 300,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ...activeOps.map<Widget>((operation) {
                final isSelected = selectedOp?.id == operation.id;
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: Icon(
                      isSelected
                          ? PhosphorIcons.checkCircle
                          : PhosphorIcons.buildings,
                      color: isSelected ? Colors.green : AppTheme.primary,
                      size: 24,
                    ),
                    title: Text(
                      operation.name,
                      style: TextStyle(
                        color: isSelected ? Colors.green : Colors.white,
                        fontWeight: isSelected
                            ? FontWeight.bold
                            : FontWeight.normal,
                      ),
                    ),
                    subtitle: isSelected
                        ? const Text(
                            'Operação Atual',
                            style: TextStyle(color: Colors.green),
                          )
                        : (operation.agentFingerprint != null
                              ? Container(
                                  margin: const EdgeInsets.only(top: 4),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.green.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: const [
                                      Icon(
                                        Icons.usb,
                                        size: 12,
                                        color: Colors.green,
                                      ),
                                      SizedBox(width: 4),
                                      Text(
                                        'USB disponível',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: Colors.green,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                )
                              : null),
                    onTap: isSelected
                        ? null
                        : () {
                            operationsProvider.selectOperation(operation);
                            Navigator.pop(context);
                          },
                    tileColor: isSelected ? AppTheme.dark700 : null,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                );
              }).toList(),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Cancelar',
              style: TextStyle(color: AppTheme.dark300),
            ),
          ),
        ],
      ),
    );
  }

  void _validarPinOperador(Operator operador) {
    final pinController = TextEditingController();
    bool pinInvalido = false;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          backgroundColor: AppTheme.dark800,
          title: Text(
            'PIN de ${operador.name}',
            style: const TextStyle(color: Colors.white),
          ),
          content: SizedBox(
            width: 300,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Digite o PIN de 4 dígitos para confirmar a troca:',
                  style: TextStyle(color: AppTheme.dark300, fontSize: 14),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: pinController,
                  decoration: InputDecoration(
                    labelText: 'PIN',
                    labelStyle: TextStyle(
                      color: pinInvalido ? Colors.red : AppTheme.dark300,
                    ),
                    border: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: pinInvalido ? Colors.red : AppTheme.dark600,
                      ),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: pinInvalido ? Colors.red : AppTheme.dark600,
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: pinInvalido ? Colors.red : AppTheme.primary,
                      ),
                    ),
                    hintText: '0000',
                    errorText: pinInvalido ? 'PIN incorreto' : null,
                  ),
                  style: const TextStyle(color: Colors.white),
                  keyboardType: TextInputType.number,
                  maxLength: 4,
                  obscureText: true,
                  textAlign: TextAlign.center,
                  onChanged: (value) {
                    if (pinInvalido) {
                      setState(() {
                        pinInvalido = false;
                      });
                    }
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'Cancelar',
                style: TextStyle(color: AppTheme.dark300),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                final pinDigitado = pinController.text;
                if (pinDigitado == operador.pin) {
                  setState(() {
                    _operadorAtual = operador.name;
                  });
                  // Atualizar provider de sessão com o operador atual
                  context.read<OperatorSessionProvider>().setCurrentOperator(
                    operador,
                  );
                  Navigator.pop(context); // Fecha modal do PIN
                  Navigator.pop(context); // Fecha modal de troca
                } else {
                  setState(() {
                    pinInvalido = true;
                  });
                  pinController.clear();
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
              ),
              child: const Text('Confirmar'),
            ),
          ],
        ),
      ),
    );
  }

  void _onSegmentoTapped(Map<String, dynamic> tipo) {
    setState(() {
      _tipoSelecionado = tipo['id'];
      _categoriaSelecionada = null; // Reset da categoria
    });

    if (tipo['id'] == 'validade') {
      // Se não houver operador selecionado, exigir seleção primeiro
      final currentOperator = context
          .read<OperatorSessionProvider>()
          .currentOperator;
      if (currentOperator == null) {
        _mostrarModalTrocarOperador();
        return;
      }
      // Validade vai direto para a tela de manipulado
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => ManipuladoScreen()),
      );
    } else if (tipo['id'] == 'baixa') {
      // Baixa de etiqueta - abrir scanner
      _abrirScannerBaixaEtiqueta();
    } else if (tipo['id'] == 'rotulo') {
      // Rótulo - navegar para a tela de impressão de rótulos
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const RotuloImpressaoScreen()),
      );
    }
  }

  // Método para abrir o scanner de baixa de etiqueta
  void _abrirScannerBaixaEtiqueta() async {
    final result = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _BaixaEtiquetaModal(),
    );

    if (result != null && result.isNotEmpty) {
      _processarBaixaEtiqueta(result);
    }
  }

  // Método para processar a baixa da etiqueta
  void _processarBaixaEtiqueta(String codigo) async {
    try {
      print('🏷️ Processando baixa da etiqueta: $codigo');
      
      // Mostrar loading
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(),
        ),
      );
      
      // Buscar etiqueta pelo código
      final auth = context.read<AuthProvider>();
      final token = await auth.authToken;
      final labelsService = LabelsService();
      
      // Buscar etiqueta pelo código
      final etiqueta = await labelsService.buscarEtiquetaPorCodigo(
        codigo,
        authToken: token,
      );
      
      if (etiqueta == null) {
        // Fechar loading
        Navigator.pop(context);
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Etiqueta com código "$codigo" não encontrada'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
      final etiquetaId = etiqueta['id'] as String?;
      
      if (etiquetaId == null) {
        // Fechar loading
        Navigator.pop(context);
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('ID da etiqueta não encontrado'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
      
      // Verificar se já foi usada
      final metadata = Map<String, dynamic>.from(etiqueta['metadata'] ?? {});
      final jaUsada = metadata['isUsed'] == true;
      
      if (jaUsada) {
        // Fechar loading
        Navigator.pop(context);
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Etiqueta "$codigo" já foi baixada anteriormente'),
            backgroundColor: Colors.orange,
          ),
        );
        return;
      }
      
      // Atualizar metadata para marcar como usada
      final atualizado = await labelsService.atualizarMetadata(etiquetaId, {
        ...metadata,
        'isUsed': true,
        'usedAt': DateTime.now().toIso8601String(),
      }, authToken: token);
      
      // Fechar loading
      Navigator.pop(context);
      
      if (atualizado != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Etiqueta "$codigo" baixada com sucesso!'),
            backgroundColor: AppTheme.primary,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Falha ao dar baixa na etiqueta'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      // Fechar loading se estiver aberto
      if (Navigator.canPop(context)) {
        Navigator.pop(context);
      }
      
      print('Erro ao processar baixa da etiqueta: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao dar baixa na etiqueta: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _mostrarSelecaoLocalArmazenamento() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.dark800,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      isScrollControlled: true,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppTheme.dark600,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),

            Text(
              'Selecionar Local de Armazenamento',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 20),

            // Lista de locais de armazenamento
            ...locaisArmazenamento.map<Widget>((local) {
              final isSelected = local['id'] == _localArmazenamentoSelecionado;
              return GestureDetector(
                onTap: () {
                  setState(() {
                    _localArmazenamentoSelecionado = local['id'];
                  });
                  Navigator.pop(context);
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppTheme.primary.withOpacity(0.1)
                        : AppTheme.dark700,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected ? AppTheme.primary : AppTheme.dark600,
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: local['cor'].withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          local['icon'],
                          color: local['cor'],
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              local['nome'],
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              local['descricao'],
                              style: TextStyle(
                                fontSize: 14,
                                color: AppTheme.dark300,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (isSelected)
                        Icon(
                          PhosphorIcons.checkCircle,
                          color: AppTheme.primary,
                          size: 24,
                        ),
                    ],
                  ),
                ),
              );
            }).toList(),

            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  void _mostrarTelaImpressaoValidade() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.dark800,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      isScrollControlled: true,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppTheme.dark600,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),

            // Título
            Text(
              'Impressão de Etiqueta - Validade',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Matéria Prima - Recebimento de Mercadoria',
              style: TextStyle(fontSize: 22, color: AppTheme.dark300),
              textAlign: TextAlign.center,
            ),

            const SizedBox(height: 24),

            // Campos de entrada
            Column(
              children: [
                // Código do produto
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        decoration: InputDecoration(
                          labelText: 'Código do Produto',
                          labelStyle: TextStyle(color: AppTheme.dark300),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: AppTheme.dark600),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: AppTheme.dark600),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: AppTheme.primary),
                          ),
                          filled: true,
                          fillColor: AppTheme.dark700,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 16,
                          ),
                        ),
                        style: TextStyle(color: Colors.white),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      decoration: BoxDecoration(
                        color: AppTheme.primary,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: IconButton(
                        onPressed: () {
                          // TODO: Implementar leitura de código de barras
                        },
                        icon: const Icon(
                          PhosphorIcons.barcode,
                          color: Colors.white,
                          size: 40,
                        ),
                        style: IconButton.styleFrom(
                          padding: const EdgeInsets.all(16),
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Nome do produto
                TextFormField(
                  decoration: InputDecoration(
                    labelText: 'Nome do Produto',
                    labelStyle: TextStyle(color: AppTheme.dark300),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: AppTheme.dark600),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: AppTheme.dark600),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: AppTheme.primary),
                    ),
                    filled: true,
                    fillColor: AppTheme.dark700,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 16,
                    ),
                  ),
                  style: TextStyle(color: Colors.white),
                ),

                const SizedBox(height: 16),

                // Data de recebimento
                GestureDetector(
                  onTap: () async {
                    final DateTime? dataSelecionada = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now(),
                      firstDate: DateTime.now().subtract(
                        const Duration(days: 30),
                      ),
                      lastDate: DateTime.now(),
                      locale: const Locale('pt', 'BR'),
                      builder: (context, child) {
                        return Theme(
                          data: Theme.of(context).copyWith(
                            colorScheme: ColorScheme.dark(
                              primary: AppTheme.primary,
                              onPrimary: Colors.white,
                              surface: AppTheme.dark800,
                              onSurface: Colors.white,
                            ),
                          ),
                          child: child!,
                        );
                      },
                    );

                    if (dataSelecionada != null) {
                      setState(() {
                        // TODO: Implementar estado para data de recebimento
                      });
                    }
                  },
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 16,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.dark700,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.dark600),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          PhosphorIcons.calendar,
                          color: AppTheme.primary,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Text(
                          'Data de Recebimento',
                          style: TextStyle(
                            fontSize: 16,
                            color: AppTheme.dark300,
                          ),
                        ),
                        const Spacer(),
                        Icon(
                          PhosphorIcons.caretDown,
                          color: AppTheme.primary,
                          size: 16,
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Temperatura de recebimento
                TextFormField(
                  decoration: InputDecoration(
                    labelText: 'Temperatura de Recebimento (°C)',
                    labelStyle: TextStyle(color: AppTheme.dark300),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: AppTheme.dark600),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: AppTheme.dark600),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: AppTheme.primary),
                    ),
                    filled: true,
                    fillColor: AppTheme.dark700,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 16,
                    ),
                  ),
                  style: TextStyle(color: Colors.white),
                  keyboardType: TextInputType.number,
                ),

                const SizedBox(height: 16),

                // Condições de recebimento
                TextFormField(
                  decoration: InputDecoration(
                    labelText: 'Condições de Recebimento',
                    labelStyle: TextStyle(color: AppTheme.dark300),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: AppTheme.dark600),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: AppTheme.dark600),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: AppTheme.primary),
                    ),
                    filled: true,
                    fillColor: AppTheme.dark700,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 16,
                    ),
                  ),
                  style: TextStyle(color: Colors.white),
                  maxLines: 3,
                ),

                const SizedBox(height: 16),

                // Local de armazenamento
                GestureDetector(
                  onTap: () {
                    _mostrarSelecaoLocalArmazenamento();
                  },
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 16,
                    ),
                    decoration: BoxDecoration(
                      color: AppTheme.dark700,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.dark600),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          PhosphorIcons.mapPin,
                          color: AppTheme.primary,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Local de Armazenamento',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.dark300,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                _localArmazenamentoSelecionado != null
                                    ? locaisArmazenamento.firstWhere(
                                        (local) =>
                                            local['id'] ==
                                            _localArmazenamentoSelecionado,
                                      )['nome']
                                    : 'Selecione o local de armazenamento',
                                style: TextStyle(
                                  fontSize: 16,
                                  color: _localArmazenamentoSelecionado != null
                                      ? Colors.white
                                      : AppTheme.dark300,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Icon(
                          PhosphorIcons.caretDown,
                          color: AppTheme.primary,
                          size: 16,
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Botão de impressão
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _isPrinting
                        ? null
                        : () async {
                            print('🔘 BOTÃO CLICADO!');
                            print('🔘 _isPrinting antes: $_isPrinting');

                            // ⭐ Atualizar UI IMEDIATAMENTE antes de processar
                            setState(() {
                              _isPrinting = true;
                              print(
                                '🔘 setState executado: _isPrinting = $_isPrinting',
                              );
                            });

                            // Forçar rebuild da UI
                            await Future.delayed(Duration.zero);
                            print('🔘 UI deve estar com spinner agora!');

                            try {
                              await _imprimirEtiqueta();
                            } finally {
                              if (mounted) {
                                setState(() {
                                  _isPrinting = false;
                                  print('🔘 Resetando _isPrinting = false');
                                });
                              }
                            }
                          },
                    icon: _isPrinting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          )
                        : const Icon(PhosphorIcons.printer, size: 20),
                    label: Text(
                      _isPrinting ? 'Imprimindo...' : 'Imprimir Etiqueta',
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _imprimirEtiqueta() async {
    final t0 = DateTime.now();
    print('⏱️ [T+0ms] 🖨️ === INÍCIO IMPRESSÃO ETIQUETA ===');

    // ⭐ VALIDAÇÃO RÁPIDA (antes de operações lentas)
    if (_produtoSelecionado == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Selecione um produto para imprimir'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 3),
        ),
      );
      return;
    }

    final tagmentProvider = context.read<PrintProvider>();

    if (!tagmentProvider.isInitialized) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Sistema de impressão não configurado'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 3),
        ),
      );
      return;
    }

    print(
      '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] Validações OK',
    );
    print('🖨️ Tagment inicializado: ${tagmentProvider.isInitialized}');
    print(
      '🖨️ Total de impressoras carregadas: ${tagmentProvider.impressoras.length}',
    );
    print(
      '🖨️ Impressoras online: ${tagmentProvider.impressoras.where((p) => p.isOnline).length}',
    );
    print('🖨️ Local selecionado: $_localArmazenamentoSelecionado');

    // ⭐ PREPARAR AUTH (rápido)
    final auth = context.read<AuthProvider>();
    final clientId = auth.user?.clientId;
    final token = await auth.authToken;
    print(
      '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] Auth obtido',
    );

    // ⭐ CONFIGURAR API KEY (se necessário - geralmente já está configurada)
    if (tagmentProvider.apiKeyAtual == null ||
        tagmentProvider.apiKeyAtual!.isEmpty) {
      if (clientId != null && token != null) {
        print(
          '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] 🔑 Configurando API Key...',
        );
        final configurado = await tagmentProvider.configurarApiKeyDoCliente(
          clientId,
          token,
        );
        print(
          '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] API Key configurada: $configurado',
        );
        if (!configurado) {
          print('❌ Falha ao configurar API Key do Tagment');
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Erro ao configurar sistema de impressão'),
              backgroundColor: Colors.red,
              duration: Duration(seconds: 3),
            ),
          );
          return;
        }
      }
    } else {
      print(
        '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] ✅ API Key já configurada',
      );
    }

    // ⭐ ATUALIZAR IMPRESSORAS (operação mais lenta - usuário já viu spinner no botão)
    // Se já tem impressoras carregadas, não forçar refresh (otimização)
    if (tagmentProvider.impressoras.isEmpty) {
      print(
        '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] 🔄 Carregando impressoras...',
      );
      await tagmentProvider.carregarImpressoras(
        locationId: null,
        forceRefresh: true,
        token: token,
        clientId: clientId,
      );
      print(
        '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] ✅ Impressoras carregadas',
      );
    } else {
      print(
        '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] ✅ Usando cache (${tagmentProvider.impressoras.length} impressoras)',
      );
    }

    print(
      '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] ⚡ Abrindo modal IMEDIATAMENTE...',
    );

    // ⭐ ABRIR MODAL PRIMEIRO (feedback instantâneo!)
    // Todo o processamento acontece DENTRO do callback
    final result = await showPrintModal(
      context: context,
      title: 'Imprimindo Etiqueta',
      printFunction: (onProgress) async {
        print(
          '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] 📋 Processando dentro do modal...',
        );

        // Selecionar impressora
        final categoriesProvider = context.read<CategoriesProductsProvider>();
        final productId = _produtoSelecionado?['id'] as String?;
        final productModel = productId != null
            ? categoriesProvider.getProductById(productId)
            : null;
        final categoryModel = productModel?.categoryId != null
            ? categoriesProvider.getCategoryById(productModel!.categoryId!)
            : null;

        final printerInfo = await tagmentProvider.obterImpressoraValidade(
          null,
          defaultPrinterId: productModel?.defaultPrinterId,
          categoryDefaultPrinterId: categoryModel?.defaultPrinterId,
        );

        if (printerInfo == null) {
          throw Exception('❌ Nenhuma impressora de validade online encontrada');
        }

        print(
          '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] ✅ Impressora: ${printerInfo.displayName}',
        );

        // Obter IP se necessário
        String? printerIP;
        if (printerInfo.isUSBPrinter) {
          printerIP = '';
        } else {
          printerIP = await tagmentProvider.obterIPImpressoraValidade(
            null,
            defaultPrinterId: productModel?.defaultPrinterId,
            categoryDefaultPrinterId: categoryModel?.defaultPrinterId,
          );
        }

        // Offsets
        final offsets = tagmentProvider.obterOffsetsImpressora(printerInfo);

        print(
          '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] 🖨️ Iniciando impressão...',
        );

        // Imprimir
        return tagmentProvider.imprimirEtiquetaValidade(
          produto: _produtoSelecionado!['nome'],
          marca: '',
          sif: _produtoSelecionado!['codigo'],
          templateId: productModel?.customTemplateId, // ⭐ Template do produto
          categoryDefaultTemplateId: categoryModel?.defaultTemplateId, // ⭐ Template da categoria
          dataEmbalagem: DateTime.now().toIso8601String().split('T')[0],
          dataManipulacao: DateTime.now().toIso8601String().split('T')[0],
          dataValidade: DateTime.now()
              .add(const Duration(days: 30))
              .toIso8601String()
              .split('T')[0],
          printerIP: printerIP ?? '',
          offsetX: offsets['x'] ?? 0.0,
          offsetY: offsets['y'] ?? 0.0,
          printerInfo: printerInfo,
          codigo: _produtoSelecionado!['codigo'],
          clientId: clientId,
          authToken: token,
          productId: _produtoSelecionado!['id'],
          storageLocationId: _localArmazenamentoSelecionado,
        );
      },
      onSuccess: () {
        Navigator.pop(context);
        // Resetar quantidade para 1 se houver controle nesta tela (quando aplicável)
        try {
          // Se existir algum controlador de quantidade nesta tela, resetar
          // (Nesta tela específica não há campo de quantidade, então é um no-op)
        } catch (_) {}
        // Removido toast de sucesso para manter UX silenciosa
        // Atualizar lista de controle (etiquetas)
        try {
          final labelsProvider = context.read<LabelsProvider>();
          final auth = context.read<AuthProvider>();
          final userClientId = auth.user?.clientId;
          labelsProvider.setClientId(userClientId);
          auth.authToken.then((token) {
            labelsProvider.setAuthToken(token);
            labelsProvider.carregarEtiquetas(type: 'validity');
          });
        } catch (_) {}
      },
      onError: () {
        print('❌ Erro na impressão da etiqueta');
      },
    );

    // Exibir mensagem de resultado ao usuário
    if (result != null) {
      if (result.success) {
        print('✅ Sucesso confirmado no result');
      } else {
        print('❌ Erro confirmado no result: ${result.message}');
      }
    }

    print(
      '🖨️ Resultado da impressão: ${result?.success} - ${result?.message}',
    );
  }

  @override
  Widget build(BuildContext context) {
    final operationsProvider = context.watch<OperationsProvider>();
    final activeOps = operationsProvider.activeOperations;
    final selectedOp = operationsProvider.selectedOperation;

    final currentOperationName = operationsProvider.isLoading
        ? 'Carregando...'
        : (selectedOp != null
              ? selectedOp.name
              : (activeOps.isNotEmpty ? activeOps.first.name : 'Sem operação'));

    return Scaffold(
      backgroundColor: AppTheme.dark900,
      body: Column(
        children: [
          // Header verde melhorado com operação e operador
          Container(
            width: double.infinity,
            color: const Color(0xFF1DA154), // Verde sólido
            padding: EdgeInsets.only(
              top:
                  MediaQuery.of(context).padding.top +
                  24.0, // SafeArea + 24px (mais espaço superior)
              bottom: 16.0,
              left: 20.0,
              right: 20.0,
            ),
            child: Column(
              children: [
                // Logo (SVG branco)
                SizedBox(
                  height: 30,
                  child: SvgPicture.asset(
                    'assets/logo-granobox.svg',
                    colorFilter: const ColorFilter.mode(
                      Colors.white,
                      BlendMode.srcIn,
                    ),
                    fit: BoxFit.contain,
                  ),
                ),

                const SizedBox(height: 20),

                // Linha com operação e operador
                Row(
                  children: [
                    // ⭐ Operação à esquerda (AGORA COM DROPDOWN)
                    Expanded(
                      child: GestureDetector(
                        onTap: activeOps.length > 1
                            ? () => _mostrarSeletorOperacao()
                            : null,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            CustomIcon(
                              iconPath: 'assets/icons/operacao.svg',
                              size: 32,
                              color: Colors.white,
                            ),
                            const SizedBox(width: 12),
                            Flexible(
                              child: Text(
                                currentOperationName,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (activeOps.length > 1) ...[
                              const SizedBox(width: 8),
                              const Icon(
                                Icons.arrow_drop_down,
                                color: Colors.white,
                                size: 24,
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),

                    const Spacer(),

                    // Operador à direita
                    Row(
                      children: [
                        GestureDetector(
                          onTap: () => _mostrarModalTrocarOperador(),
                          child: Text(
                            _operadorAtual == null || _operadorAtual!.isEmpty
                                ? 'Selecionar operador'
                                : _formatarNomeOperador(_operadorAtual),
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        InkWell(
                          onTap: () => _mostrarModalTrocarOperador(),
                          borderRadius: BorderRadius.circular(8),
                          child: Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: CustomIcon(
                              iconPath: 'assets/icons/trocar_operador.svg',
                              size: 32,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Cards dos tipos de etiqueta
          Expanded(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Descrição logo acima dos cards
                    Text(
                      'Para imprimir a etiqueta',
                      style: TextStyle(fontSize: 16, color: AppTheme.dark300),
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 24),

                    // Cards dos tipos de etiqueta
                    ...tiposEtiqueta
                        .where((tipo) {
                          // Filtrar card de rótulo se não estiver habilitado para o cliente
                          if (tipo['id'] == 'rotulo') {
                            final authProvider = context.read<AuthProvider>();
                            final hasRotuloModule =
                                authProvider.user?.client.hasRotuloModule ??
                                false;
                            return hasRotuloModule;
                          }
                          return true;
                        })
                        .map<Widget>((tipo) {
                          // Tamanho maior para Validade (core da aplicação)
                          final isValidade = tipo['id'] == 'validade';
                          final isSmall = tipo['isSmall'] == true;
                          final cardWidth = isValidade ? 320.0 : (isSmall ? 240.0 : 280.0);
                          final cardPadding = isValidade ? 40.0 : (isSmall ? 24.0 : 32.0);

                          return GestureDetector(
                            onTap: () => _onSegmentoTapped(tipo),
                            child: Container(
                              width: cardWidth,
                              margin: const EdgeInsets.only(bottom: 24),
                              padding: EdgeInsets.all(cardPadding),
                              decoration: BoxDecoration(
                                color: AppTheme.dark800,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: _tipoSelecionado == tipo['id']
                                      ? tipo['cor']
                                      : AppTheme.dark700,
                                  width: _tipoSelecionado == tipo['id'] ? 3 : 1,
                                ),
                              ),
                              child: Column(
                                children: [
                                  // Ícone do tipo
                                  tipo['iconPath'] != null
                                      ? CustomIcon(
                                          iconPath: tipo['iconPath'],
                                          size: isValidade ? 110 : (isSmall ? 80 : 96),
                                          color: tipo['cor'],
                                        )
                                      : Icon(
                                          tipo['icon'] ?? PhosphorIcons.tag,
                                          color: tipo['cor'],
                                          size: isValidade ? 110 : (isSmall ? 80 : 96),
                                        ),

                                  const SizedBox(height: 16),

                                  // Nome do tipo
                                  Text(
                                    tipo['nome'],
                                    style: TextStyle(
                                      fontSize: isValidade ? 24 : (isSmall ? 16 : 20),
                                      fontWeight: FontWeight.bold,
                                      color: tipo['cor'],
                                    ),
                                    textAlign: TextAlign.center,
                                  ),

                                  const SizedBox(height: 8),

                                  // Descrição do tipo
                                  Text(
                                    tipo['descricao'],
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: AppTheme.dark300,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ],
                              ),
                            ),
                          );
                        })
                        .toList(),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Formatar nome do operador para exibir primeiro nome + primeira letra do último nome
  String _formatarNomeOperador(String? nomeCompleto) {
    if (nomeCompleto == null || nomeCompleto.isEmpty) {
      return 'Carregando...';
    }

    final partes = nomeCompleto.trim().split(' ');
    if (partes.length == 1) {
      return partes[0]; // Se só tem um nome, retorna ele
    }

    final primeiroNome = partes[0];
    final ultimoNome = partes[partes.length - 1];
    final primeiraLetraUltimoNome = ultimoNome.isNotEmpty
        ? ultimoNome[0].toUpperCase()
        : '';

    return '$primeiroNome $primeiraLetraUltimoNome';
  }
}

// Modal de busca avançada
class _BuscaAvancadaModal extends StatefulWidget {
  final List<Map<String, dynamic>> produtos;
  final List<Map<String, dynamic>> segmentos;
  final Function(Map<String, dynamic>) onProdutoSelecionado;

  const _BuscaAvancadaModal({
    required this.produtos,
    required this.segmentos,
    required this.onProdutoSelecionado,
  });

  @override
  State<_BuscaAvancadaModal> createState() => _BuscaAvancadaModalState();
}

class _BuscaAvancadaModalState extends State<_BuscaAvancadaModal>
    with TickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  List<String> _filtrosSegmentos = [
    'materia-prima',
    'manipulado',
    'produto-final',
  ];
  bool _isListening = false;
  List<Map<String, dynamic>> _resultados = [];

  // Speech to Text
  final SpeechToText _speechToText = SpeechToText();
  bool _speechEnabled = false;
  String _lastWords = '';

  // Animação de pulso
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _resultados = widget.produtos;
    _initSpeech();
    _initAnimations();
  }

  void _initAnimations() {
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );

    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.3).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  void _initSpeech() async {
    _speechEnabled = await _speechToText.initialize(
      onError: (error) {
        debugPrint('Erro no reconhecimento de voz: $error');
        setState(() {
          _isListening = false;
        });
      },
      onStatus: (status) {
        if (status == 'done' || status == 'notListening') {
          setState(() {
            _isListening = false;
          });
        }
      },
    );
  }

  void _filtrarProdutos() {
    final query = _searchController.text.toLowerCase();
    final segmentosFiltrados = _filtrosSegmentos;

    setState(() {
      _resultados = widget.produtos.where((produto) {
        final matchQuery =
            produto['nome'].toLowerCase().contains(query) ||
            produto['codigo'].toLowerCase().contains(query);
        final matchSegmento = segmentosFiltrados.contains(produto['segmento']);
        return matchQuery && matchSegmento;
      }).toList();
    });
  }

  void _toggleFiltroSegmento(String segmento) {
    setState(() {
      if (_filtrosSegmentos.contains(segmento)) {
        _filtrosSegmentos.remove(segmento);
      } else {
        _filtrosSegmentos.add(segmento);
      }
      _filtrarProdutos();
    });
  }

  void _iniciarBuscaPorVoz() async {
    if (!_speechEnabled) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Reconhecimento de voz não disponível'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (_isListening) {
      // Parar de ouvir
      _speechToText.stop();
      _pulseController.stop();
      setState(() {
        _isListening = false;
      });
    } else {
      // Começar a ouvir
      setState(() {
        _isListening = true;
        _lastWords = '';
      });

      // Iniciar animação de pulso
      _pulseController.repeat();

      await _speechToText.listen(
        onResult: (result) {
          setState(() {
            _lastWords = result.recognizedWords;
            if (result.finalResult) {
              _searchController.text = _lastWords;
              _filtrarProdutos();
            }
          });
        },
        listenFor: const Duration(seconds: 10),
        pauseFor: const Duration(seconds: 3),
        localeId: 'pt_BR', // Português Brasil
        partialResults: true,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header do modal
          Row(
            children: [
              const Text(
                'Buscar Item',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const Spacer(),
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(PhosphorIcons.x, color: AppTheme.dark300),
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Campo de busca
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: _searchController,
                focusNode: _searchFocusNode,
                enabled: true,
                autofocus: false,
                onChanged: (value) => _filtrarProdutos(),
                onTap: () {
                  // Focar no campo de busca quando clicado
                  _searchFocusNode.requestFocus();
                },
                decoration: InputDecoration(
                  hintText: 'Buscar item...',
                  hintStyle: TextStyle(color: AppTheme.dark300),
                  prefixIcon: const Icon(
                    PhosphorIcons.magnifyingGlass,
                    color: AppTheme.dark300,
                  ),
                  suffixIcon: GestureDetector(
                    onTap: _iniciarBuscaPorVoz,
                    child: CustomIcon(
                      iconPath: 'assets/icons/microfone.svg',
                      size: 12,
                      color: _isListening ? AppTheme.primary : AppTheme.dark300,
                    ),
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(25),
                    borderSide: BorderSide(color: AppTheme.dark600),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(25),
                    borderSide: BorderSide(color: AppTheme.dark600),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(25),
                    borderSide: BorderSide(color: AppTheme.primary, width: 2),
                  ),
                  filled: true,
                  fillColor: AppTheme.dark800,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 16,
                  ),
                ),
                style: const TextStyle(color: Colors.white, fontSize: 16),
              ),

              // Indicador de reconhecimento de voz
              if (_isListening && _lastWords.isNotEmpty)
                Container(
                  margin: const EdgeInsets.only(top: 8),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppTheme.primary.withOpacity(0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      AnimatedBuilder(
                        animation: _pulseAnimation,
                        builder: (context, child) {
                          return Transform.scale(
                            scale: _pulseAnimation.value,
                            child: CustomIcon(
                              iconPath: 'assets/icons/microfone.svg',
                              size: 16,
                              color: AppTheme.primary,
                            ),
                          );
                        },
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Ouvindo: "$_lastWords"',
                          style: TextStyle(
                            color: AppTheme.primary,
                            fontSize: 12,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),

          const SizedBox(height: 16),

          // Filtros de tipo
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Filtrar por tipo:',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.dark300,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  _buildFiltroChip(
                    'Matéria Prima',
                    'materia-prima',
                    Colors.blue,
                  ),
                  _buildFiltroChip('Manipulado', 'manipulado', Colors.green),
                  _buildFiltroChip(
                    'Produto Final',
                    'produto-final',
                    Colors.purple,
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Resultados da busca
          Expanded(
            child: _resultados.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          PhosphorIcons.magnifyingGlass,
                          color: AppTheme.dark300,
                          size: 48,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Nenhum produto encontrado',
                          style: TextStyle(
                            fontSize: 16,
                            color: AppTheme.dark300,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    itemCount: _resultados.length,
                    itemBuilder: (context, index) {
                      final produto = _resultados[index];
                      final segmento = widget.segmentos.firstWhere(
                        (s) => s['id'] == produto['segmento'],
                      );

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: AppTheme.dark800,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.dark700),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16),
                          leading: Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: segmento['cor'].withOpacity(0.2),
                              borderRadius: BorderRadius.circular(24),
                            ),
                            child: Icon(
                              segmento['icon'],
                              color: segmento['cor'],
                              size: 24,
                            ),
                          ),
                          title: Text(
                            produto['nome'],
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 4),
                              Text(
                                'Código: ${produto['codigo']}',
                                style: TextStyle(
                                  color: AppTheme.dark300,
                                  fontSize: 12,
                                ),
                              ),
                              Text(
                                'Segmento: ${segmento['nome']}',
                                style: TextStyle(
                                  color: AppTheme.dark300,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                          onTap: () => widget.onProdutoSelecionado(produto),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFiltroChip(String label, String segmento, Color cor) {
    final isSelected = _filtrosSegmentos.contains(segmento);

    return GestureDetector(
      onTap: () => _toggleFiltroSegmento(segmento),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? cor.withOpacity(0.2) : AppTheme.dark700,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? cor : AppTheme.dark600,
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isSelected ? PhosphorIcons.check : PhosphorIcons.plus,
              color: isSelected ? cor : AppTheme.dark300,
              size: 14,
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: isSelected ? cor : AppTheme.dark300,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Método para abrir o scanner de baixa de etiqueta
  void _abrirScannerBaixaEtiqueta() async {
    final result = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _BaixaEtiquetaModal(),
    );

    if (result != null && result.isNotEmpty) {
      _processarBaixaEtiqueta(result);
    }
  }

  // Método para processar a baixa da etiqueta
  void _processarBaixaEtiqueta(String codigo) async {
    try {
      print('🏷️ Processando baixa da etiqueta: $codigo');
      
      // Mostrar loading
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(
          child: CircularProgressIndicator(),
        ),
      );
      
      // Buscar etiqueta pelo código
      final auth = context.read<AuthProvider>();
      final token = await auth.authToken;
      final labelsService = LabelsService();
      
      // Buscar etiqueta pelo código
      final etiqueta = await labelsService.buscarEtiquetaPorCodigo(
        codigo,
        authToken: token,
      );
      
      if (etiqueta == null) {
        // Fechar loading
        Navigator.pop(context);
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Etiqueta com código "$codigo" não encontrada'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
      final etiquetaId = etiqueta['id'] as String?;
      
      if (etiquetaId == null) {
        // Fechar loading
        Navigator.pop(context);
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('ID da etiqueta não encontrado'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
      
      // Verificar se já foi usada
      final metadata = Map<String, dynamic>.from(etiqueta['metadata'] ?? {});
      final jaUsada = metadata['isUsed'] == true;
      
      if (jaUsada) {
        // Fechar loading
        Navigator.pop(context);
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Etiqueta "$codigo" já foi baixada anteriormente'),
            backgroundColor: Colors.orange,
          ),
        );
        return;
      }
      
      // Atualizar metadata para marcar como usada
      final atualizado = await labelsService.atualizarMetadata(etiquetaId, {
        ...metadata,
        'isUsed': true,
        'usedAt': DateTime.now().toIso8601String(),
      }, authToken: token);
      
      // Fechar loading
      Navigator.pop(context);
      
      if (atualizado != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Etiqueta "$codigo" baixada com sucesso!'),
            backgroundColor: AppTheme.primary,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Falha ao dar baixa na etiqueta'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      // Fechar loading se estiver aberto
      if (Navigator.canPop(context)) {
        Navigator.pop(context);
      }
      
      print('Erro ao processar baixa da etiqueta: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao dar baixa na etiqueta: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}

// Modal do Scanner para Baixa de Etiqueta
class _BaixaEtiquetaModal extends StatefulWidget {
  @override
  State<_BaixaEtiquetaModal> createState() => _BaixaEtiquetaModalState();
}

class _BaixaEtiquetaModalState extends State<_BaixaEtiquetaModal> {
  final MobileScannerController controller = MobileScannerController();
  bool _isDetected = false;

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height,
      decoration: const BoxDecoration(
        color: Colors.black,
      ),
      child: Stack(
        children: [
          // Scanner
          MobileScanner(
            controller: controller,
            onDetect: (capture) {
              if (_isDetected) return;
              _isDetected = true;
              
              final List<Barcode> barcodes = capture.barcodes;
              if (barcodes.isNotEmpty) {
                final String? code = barcodes.first.rawValue;
                if (code != null && code.isNotEmpty) {
                  Navigator.of(context).pop(code);
                }
              }
            },
          ),
          
          // Overlay apenas com as "quinas" do quadrado (QR Code é quadrado)
          Center(
            child: SizedBox(
              width: 250,
              height: 250,
              child: Stack(
                children: [
                  // Canto superior esquerdo
                  Positioned(
                    top: 0,
                    left: 0,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(color: AppTheme.primary, width: 4),
                          left: BorderSide(color: AppTheme.primary, width: 4),
                        ),
                      ),
                    ),
                  ),
                  // Canto superior direito
                  Positioned(
                    top: 0,
                    right: 0,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(color: AppTheme.primary, width: 4),
                          right: BorderSide(color: AppTheme.primary, width: 4),
                        ),
                      ),
                    ),
                  ),
                  // Canto inferior esquerdo
                  Positioned(
                    bottom: 0,
                    left: 0,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(color: AppTheme.primary, width: 4),
                          left: BorderSide(color: AppTheme.primary, width: 4),
                        ),
                      ),
                    ),
                  ),
                  // Canto inferior direito
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(color: AppTheme.primary, width: 4),
                          right: BorderSide(color: AppTheme.primary, width: 4),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Header preto sólido
          SafeArea(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.black,
              ),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(
                      Icons.close,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                  Expanded(
                    child: Text(
                      'Baixa de Etiqueta',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  // Espaço invisível para balancear o botão de fechar
                  SizedBox(width: 56), // Largura do IconButton
                ],
              ),
            ),
          ),
          
        ],
      ),
    );
  }
}
