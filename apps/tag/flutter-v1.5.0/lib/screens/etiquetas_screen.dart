import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../components/form_input.dart';
import '../components/custom_icon.dart';
import '../components/header_button.dart';
import '../components/standard_header.dart';
import '../theme/app_theme.dart';
import '../providers/labels_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/print_provider.dart';
import '../providers/categories_products_provider.dart'; // ⭐ NOVO
import '../providers/operator_session_provider.dart';
import '../widgets/print_modal.dart';
import '../providers/date_config_provider.dart';
import '../services/labels_service.dart';
import 'etiqueta_historico_screen.dart';
import '../providers/tagment_printer_config_provider.dart';
import 'main_screen.dart';
import '../components/bottom_navigation.dart';

class EtiquetasScreen extends StatefulWidget {
  const EtiquetasScreen({super.key});

  @override
  State<EtiquetasScreen> createState() => _EtiquetasScreenState();
}

class _EtiquetasScreenState extends State<EtiquetasScreen>
    with AutomaticKeepAliveClientMixin {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  String _sortBy = 'produto_az'; // ordem alfabética por padrão
  String _selectedStatus = '';
  String _filterGroup = ''; // '', vencidos, hoje, amanha, 7dias, personalizado
  DateTime? _customStart;
  DateTime? _customEnd;
  bool _mostrarBaixadas =
      false; // Controle para mostrar/ocultar etiquetas baixadas
  bool _mostrarAtivas = true; // Controle para mostrar etiquetas ativas

  // Modo lote - baixa em lote
  bool _modoLote = false;
  Set<String> _etiquetasSelecionadas = {};

  // Dados da operação e operador (sincronizados com providers)
  String? _operacaoAtual;
  String? _operadorAtual;
  bool _dadosCarregados = false;

  // Índice do footer (para navegação)
  // 0 = Etiquetas, 1 = Alertas, 2 = Rastreab., 3 = Cadastros, 4 = Ajustes
  // Como a tela de etiquetas é acessada via Rastreabilidade, o índice é 2
  int _footerIndex = 2;

  @override
  bool get wantKeepAlive => true; // Manter estado ao trocar de aba

  @override
  void initState() {
    super.initState();
    _sincronizarOperadorDaSessao();

    // Listener para infinite scroll
    _scrollController.addListener(_onScroll);

    // Adicionar listener para mudanças no operador da sessão
    WidgetsBinding.instance.addPostFrameCallback((_) {
      try {
        final operatorSessionProvider = context.read<OperatorSessionProvider>();
        operatorSessionProvider.addListener(_onOperatorSessionChanged);
      } catch (_) {}

      // Forçar carregamento após o primeiro frame
      _forcarCarregamento();
    });
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      // Quando chegar a 200px do final, carregar mais
      _carregarMaisEtiquetas();
    }
  }

  Future<void> _carregarMaisEtiquetas() async {
    final labelsProvider = context.read<LabelsProvider>();

    if (labelsProvider.hasNextPage && !labelsProvider.isLoadingMore) {
      // Calcular filtros de data baseado no filtro de grupo selecionado
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      String? validityDateFrom;
      String? validityDateTo;

      switch (_filterGroup) {
        case 'vencidos':
          validityDateTo = today
              .subtract(const Duration(days: 1))
              .toIso8601String();
          break;
        case 'hoje':
          validityDateFrom = today.toIso8601String();
          validityDateTo = today.add(const Duration(days: 1)).toIso8601String();
          break;
        case 'amanha':
          final amanha = today.add(const Duration(days: 1));
          validityDateFrom = amanha.toIso8601String();
          validityDateTo = amanha
              .add(const Duration(days: 1))
              .toIso8601String();
          break;
        case '7dias':
          validityDateFrom = today.toIso8601String();
          validityDateTo = today.add(const Duration(days: 8)).toIso8601String();
          break;
        case 'personalizado':
          if (_customStart != null) {
            validityDateFrom = DateTime(
              _customStart!.year,
              _customStart!.month,
              _customStart!.day,
            ).toIso8601String();
          }
          if (_customEnd != null) {
            validityDateTo = DateTime(
              _customEnd!.year,
              _customEnd!.month,
              _customEnd!.day,
            ).add(const Duration(days: 1)).toIso8601String();
          }
          break;
      }

      await labelsProvider.carregarProximaPagina(
        type: 'validity',
        validityDateFrom: validityDateFrom,
        validityDateTo: validityDateTo,
      );
    }
  }

  Future<void> _forcarCarregamento() async {
    final authProvider = context.read<AuthProvider>();
    final labelsProvider = context.read<LabelsProvider>();

    final currentClientId = authProvider.user?.clientId;
    final providerClientId = labelsProvider.clientId;

    if (labelsProvider.isLoading) {
      return;
    }

    // SEMPRE carregar se não tiver dados ou clientId diferente
    if (currentClientId != null &&
        (providerClientId != currentClientId ||
            labelsProvider.etiquetas.isEmpty)) {
      await _carregarDados();
      _dadosCarregados = true;
    } else {
      _dadosCarregados = true;
    }
  }

  Future<void> _carregarDadosSeNecessario() async {
    final authProvider = context.read<AuthProvider>();
    final labelsProvider = context.read<LabelsProvider>();

    // Verificar se o clientId do provider corresponde ao usuário logado
    final currentClientId = authProvider.user?.clientId;
    final providerClientId = labelsProvider.clientId;

    // Se está carregando, não disparar outra carga
    if (labelsProvider.isLoading) {
      return;
    }

    // Se o clientId mudou ou não foi configurado, sempre recarregar
    if (currentClientId != null && providerClientId != currentClientId) {
      await _carregarDados();
      _dadosCarregados = true;
      return;
    }

    // Se já tem dados válidos do mesmo cliente, não recarregar
    if (labelsProvider.etiquetas.isNotEmpty &&
        providerClientId == currentClientId) {
      _dadosCarregados = true;
      return;
    }

    // Primeira carga ou sem dados
    await _carregarDados();
    _dadosCarregados = true;
  }

  @override
  void dispose() {
    // Remover listener quando a tela for destruída
    try {
      final operatorSessionProvider = context.read<OperatorSessionProvider>();
      operatorSessionProvider.removeListener(_onOperatorSessionChanged);
    } catch (_) {}
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  // Callback chamado quando o operador da sessão muda
  void _onOperatorSessionChanged() {
    _sincronizarOperadorDaSessao();
  }

  // Sincronizar operador atual com a sessão
  void _sincronizarOperadorDaSessao() {
    try {
      final sessionOperator = context
          .read<OperatorSessionProvider>()
          .currentOperator;
      if (sessionOperator != null && mounted) {
        setState(() {
          _operadorAtual = sessionOperator.name;
        });
      } else if (mounted) {
        setState(() {
          _operadorAtual = null;
        });
      }
    } catch (_) {}
  }

  Widget _buildStatusBadge(Map<String, dynamic> etiqueta) {
    final status = (etiqueta['status'] ?? '').toString().toLowerCase();
    final isUsed =
        (etiqueta['metadata']?['isUsed'] == true) ||
        status == 'used' ||
        status == 'utilizada' ||
        status == 'consumed';
    final isPending = status == 'pending' || status == 'pendente';

    Color bg;
    Color fg;
    IconData icon;
    String text;

    if (isUsed) {
      bg = const Color(0xFFE3E8EF);
      fg = const Color(0xFF64748B);
      icon = PhosphorIcons.checkCircle;
      text = 'Baixada';
    } else if (isPending) {
      bg = const Color(0xFFFFF3DB);
      fg = const Color(0xFFB87900);
      icon = PhosphorIcons.clock;
      text = 'Pendente';
    } else {
      bg = const Color(0xFFD1FAE5);
      fg = const Color(0xFF059669);
      icon = PhosphorIcons.checkCircle;
      text = 'Ativa';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: fg),
          const SizedBox(width: 6),
          Text(
            text,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: fg,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _carregarDados() async {
    final authProvider = context.read<AuthProvider>();
    final labelsProvider = context.read<LabelsProvider>();

    // Configurar clientId no provider
    if (authProvider.user?.clientId != null) {
      labelsProvider.setClientId(authProvider.user!.clientId);
      final token = await authProvider.authToken;
      labelsProvider.setAuthToken(token);

      // Calcular filtros de data baseado no filtro de grupo selecionado
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      String? validityDateFrom;
      String? validityDateTo;

      switch (_filterGroup) {
        case 'vencidos':
          // Vencidos: até ontem
          validityDateTo = today
              .subtract(const Duration(days: 1))
              .toIso8601String();
          break;
        case 'hoje':
          // Hoje: data específica
          validityDateFrom = today.toIso8601String();
          validityDateTo = today.add(const Duration(days: 1)).toIso8601String();
          break;
        case 'amanha':
          // Amanhã: data específica
          final amanha = today.add(const Duration(days: 1));
          validityDateFrom = amanha.toIso8601String();
          validityDateTo = amanha
              .add(const Duration(days: 1))
              .toIso8601String();
          break;
        case '7dias':
          // Próximos 7 dias: de hoje até daqui a 7 dias
          validityDateFrom = today.toIso8601String();
          validityDateTo = today.add(const Duration(days: 8)).toIso8601String();
          break;
        case 'personalizado':
          // Usar as datas personalizadas
          if (_customStart != null) {
            validityDateFrom = DateTime(
              _customStart!.year,
              _customStart!.month,
              _customStart!.day,
            ).toIso8601String();
          }
          if (_customEnd != null) {
            validityDateTo = DateTime(
              _customEnd!.year,
              _customEnd!.month,
              _customEnd!.day,
            ).add(const Duration(days: 1)).toIso8601String();
          }
          break;
      }

      await labelsProvider.carregarEtiquetas(
        type: 'validity',
        validityDateFrom: validityDateFrom,
        validityDateTo: validityDateTo,
      );
      
      // Se estamos mostrando apenas ativas e não encontramos nenhuma,
      // carregar mais páginas automaticamente
      if (_mostrarAtivas && !_mostrarBaixadas) {
        await _carregarAteEncontrarAtivas(validityDateFrom, validityDateTo);
      }
    }
  }
  
  /// Carregar mais páginas até encontrar etiquetas ativas (mínimo 10)
  Future<void> _carregarAteEncontrarAtivas(String? validityDateFrom, String? validityDateTo) async {
    final labelsProvider = context.read<LabelsProvider>();
    
    // Função para contar etiquetas ativas
    int contarAtivas() {
      return labelsProvider.etiquetas.where((e) {
        final isUsedInMetadata = e['metadata']?['isUsed'] == true;
        final status = (e['status'] ?? '').toString().toLowerCase().trim();
        final isConsumed = status == 'used' || status == 'consumed';
        return !isUsedInMetadata && !isConsumed;
      }).length;
    }
    
    int paginas = 0;
    const maxPaginas = 10; // Limite para evitar loop infinito
    const minAtivas = 10; // Mínimo de etiquetas ativas para parar
    
    while (contarAtivas() < minAtivas && 
           labelsProvider.hasNextPage && 
           paginas < maxPaginas) {
      await labelsProvider.carregarProximaPagina(
        type: 'validity',
        validityDateFrom: validityDateFrom,
        validityDateTo: validityDateTo,
      );
      paginas++;
    }
  }

  // Dados mockados removidos - agora usando API via LabelsProvider

  // Removido - agora usando provider diretamente

  @override
  Widget build(BuildContext context) {
    super.build(context); // Necessário para AutomaticKeepAliveClientMixin
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      body: Consumer<LabelsProvider>(
        builder: (context, labelsProvider, child) {
          final etiquetas = labelsProvider.etiquetas;
          final isLoading = labelsProvider.isLoading;
          final error = labelsProvider.error;
          
          // Ordenar por validade (vence primeiro)
          // 1) Filtrar por grupo de datas (vencidos, hoje, amanhã, 7 dias, personalizado)
          bool _matchesGroup(Map<String, dynamic> e) {
            DateTime _parseDate(dynamic v) {
              try {
                if (v == null) return DateTime(2100);
                return DateTime.parse(v.toString());
              } catch (_) {
                return DateTime(2100);
              }
            }

            if (_filterGroup.isEmpty) return true;
            final now = DateTime.now();
            final today = DateTime(now.year, now.month, now.day);
            final validity = _parseDate(e['validityDate']);
            final day = DateTime(validity.year, validity.month, validity.day);

            switch (_filterGroup) {
              case 'vencidos':
                return day.isBefore(today);
              case 'hoje':
                return day.isAtSameMomentAs(today);
              case 'amanha':
                return day.isAtSameMomentAs(today.add(const Duration(days: 1)));
              case '7dias':
                return !day.isBefore(today) &&
                    day.isBefore(today.add(const Duration(days: 8)));
              case 'personalizado':
                if (_customStart == null || _customEnd == null) return true;
                final start = DateTime(
                  _customStart!.year,
                  _customStart!.month,
                  _customStart!.day,
                );
                final end = DateTime(
                  _customEnd!.year,
                  _customEnd!.month,
                  _customEnd!.day,
                );
                return (day.isAtSameMomentAs(start) || day.isAfter(start)) &&
                    (day.isAtSameMomentAs(end) || day.isBefore(end));
              default:
                return true;
            }
          }

          // Filtrar por status (baixadas e/ou ativas)
          List<Map<String, dynamic>> base;
          
          // Função auxiliar para verificar se etiqueta está baixada
          bool _isEtiquetaBaixada(Map<String, dynamic> e) {
            final isUsedInMetadata = e['metadata']?['isUsed'] == true;
            final statusRaw = e['status'];
            final status = statusRaw != null 
                ? statusRaw.toString().toLowerCase().trim() 
                : '';
            final isConsumed = status == 'used' || status == 'consumed';
            return isUsedInMetadata || isConsumed;
          }
          
          if (_mostrarAtivas && _mostrarBaixadas) {
            // Mostrar todas (ativas e baixadas)
            base = etiquetas;
          } else if (_mostrarBaixadas && !_mostrarAtivas) {
            // Mostrar apenas baixadas/consumidas
            base = etiquetas.where(_isEtiquetaBaixada).toList();
          } else {
            // Mostrar apenas ativas (padrão quando _mostrarAtivas=true ou quando ambas estão false)
            base = etiquetas.where((e) => !_isEtiquetaBaixada(e)).toList();
          }

          // Aplicar filtro de busca
          final searchText = _searchController.text.toLowerCase().trim();
          final searchFiltered = searchText.isEmpty
              ? base
              : base.where((e) {
                  final code = (e['code'] ?? '').toString().toLowerCase();
                  final productName = (e['product']?['name'] ?? '')
                      .toString()
                      .toLowerCase();
                  final marca =
                      (e['metadata']?['marca'] ?? e['product']?['brand'] ?? '')
                          .toString()
                          .toLowerCase();
                  final sif =
                      (e['metadata']?['sif'] ?? e['product']?['sif'] ?? '')
                          .toString()
                          .toLowerCase();

                  return code.contains(searchText) ||
                      productName.contains(searchText) ||
                      marca.contains(searchText) ||
                      sif.contains(searchText);
                }).toList();

          final filtered = searchFiltered.where(_matchesGroup).toList();
          
          final sorted = List<Map<String, dynamic>>.from(filtered);
          DateTime _parseDate(dynamic v) {
            try {
              if (v == null) return DateTime(2100);
              return DateTime.parse(v.toString());
            } catch (_) {
              return DateTime(2100);
            }
          }

          // 2) Ordenação - SEMPRE ordenar primeiro por status (ativas primeiro)
          sorted.sort((a, b) {
            // Primeiro, ordenar por status: ativas primeiro (false = ativa, true = baixada)
            final aIsBaixada = _isEtiquetaBaixada(a);
            final bIsBaixada = _isEtiquetaBaixada(b);
            
            // Se uma é ativa e outra é baixada, ativa vem primeiro
            if (aIsBaixada != bIsBaixada) {
              return aIsBaixada ? 1 : -1; // false (ativa) vem antes de true (baixada)
            }
            
            // Se ambas têm o mesmo status, ordenar pelo critério escolhido
            switch (_sortBy) {
              case 'validade_asc':
                return _parseDate(a['validityDate']).compareTo(_parseDate(b['validityDate']));
              case 'validade_desc':
                return _parseDate(b['validityDate']).compareTo(_parseDate(a['validityDate']));
              case 'produto_az':
                return (a['product']?['name'] ?? '')
                    .toString()
                    .toLowerCase()
                    .compareTo(
                      (b['product']?['name'] ?? '').toString().toLowerCase(),
                    );
              case 'recentes':
                return _parseDate(b['createdAt']).compareTo(_parseDate(a['createdAt']));
              default:
                return 0;
            }
          });

          if (isLoading && etiquetas.isEmpty) {
            return const Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            );
          }

          if (error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    PhosphorIcons.warningCircle,
                    color: Colors.red,
                    size: 48,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Erro ao carregar etiquetas',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    error,
                    style: TextStyle(color: Colors.grey, fontSize: 14),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => _carregarDados(),
                    child: const Text('Tentar Novamente'),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              // Header padronizado
              StandardHeader(
                title: 'Controle de Etiquetas',
                subtitle: 'Visualizar e gerenciar etiquetas',
                showBack: true,
                showSearch: false,
                showHome: false,
                iconColor: AppTheme.primary,
                showLeading: true,
                leadingIcon: PhosphorIcons.tag,
              ),

              // Barra de busca e filtros
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
                child: Column(
                  children: [
                    Row(
                        children: [
                          Expanded(
                            child: Container(
                              height: 40,
                              decoration: BoxDecoration(
                                color: AppTheme.dark700,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppTheme.dark600),
                              ),
                              child: TextField(
                                controller: _searchController,
                                onChanged: (value) => setState(() {}),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                ),
                                decoration: InputDecoration(
                                  hintText: 'Buscar etiquetas...',
                                  hintStyle: TextStyle(
                                    color: AppTheme.dark400,
                                    fontSize: 14,
                                  ),
                                  prefixIcon: Icon(
                                    PhosphorIcons.magnifyingGlass,
                                    color: AppTheme.dark400,
                                    size: 16,
                                  ),
                                  suffixIcon: _searchController.text.isNotEmpty
                                      ? IconButton(
                                          icon: Icon(
                                            PhosphorIcons.x,
                                            color: AppTheme.dark400,
                                            size: 16,
                                          ),
                                          onPressed: () {
                                            setState(() {
                                              _searchController.clear();
                                            });
                                          },
                                        )
                                      : null,
                                  border: InputBorder.none,
                                  enabledBorder: InputBorder.none,
                                  focusedBorder: InputBorder.none,
                                  errorBorder: InputBorder.none,
                                  focusedErrorBorder: InputBorder.none,
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 8,
                                  ),
                                  isDense: true,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          // Botão QR Code destacado
                          GestureDetector(
                            onTap: _abrirScannerParaBusca,
                            child: Container(
                              height: 40,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              decoration: BoxDecoration(
                                color: AppTheme.primary,
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppTheme.primary.withOpacity(0.3),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    PhosphorIcons.qrCode,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                  const SizedBox(width: 6),
                                  const Text(
                                    'Scan',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          _buildFilterButton(),
                        ],
                      ),

                      // Contador de etiquetas
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Icon(
                            PhosphorIcons.tag,
                            size: 14,
                            color: AppTheme.dark400,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            sorted.length == 0
                                ? 'nenhuma etiqueta'
                                : '${sorted.length} ${sorted.length == 1 ? 'etiqueta' : 'etiquetas'}',
                            style: TextStyle(
                              color: AppTheme.dark300,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          if (_filterGroup.isNotEmpty) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: AppTheme.primary.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: AppTheme.primary.withOpacity(0.5),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    PhosphorIcons.funnel,
                                    size: 10,
                                    color: AppTheme.primary,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    _getFilterGroupLabel(_filterGroup),
                                    style: TextStyle(
                                      color: AppTheme.primary,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                          if (_searchController.text.isNotEmpty) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.blue.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: Colors.blue.withOpacity(0.5),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    PhosphorIcons.magnifyingGlass,
                                    size: 10,
                                    color: Colors.blue,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Busca ativa',
                                    style: TextStyle(
                                      color: Colors.blue,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                  ],
                ),
              ),

              // Conteúdo principal - Cards redesenhados com pull-to-refresh
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                  child: RefreshIndicator(
                    onRefresh: _carregarDados,
                    child: sorted.isEmpty
                        ? ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: [
                              const SizedBox(height: 120),
                              _buildEmptyState(),
                            ],
                          )
                        : LayoutBuilder(
                            builder: (context, constraints) {
                              // Detectar se é tablet usando a largura total da tela
                              final screenWidth = MediaQuery.of(
                                context,
                              ).size.width;
                              final isTablet = screenWidth > 600;
                              final crossAxisCount = isTablet ? 2 : 1;
                              // Ajustar childAspectRatio para dar mais altura aos cards
                              // Valores menores = mais altura
                              final childAspectRatio = isTablet ? 1.1 : 1.3;

                              return GridView.builder(
                                controller: _scrollController,
                                physics: const AlwaysScrollableScrollPhysics(),
                                gridDelegate:
                                    SliverGridDelegateWithFixedCrossAxisCount(
                                      crossAxisCount: crossAxisCount,
                                      childAspectRatio: childAspectRatio,
                                      crossAxisSpacing: 12,
                                      mainAxisSpacing: 12,
                                    ),
                                itemCount:
                                    sorted.length +
                                    (labelsProvider.isLoadingMore ? 1 : 0),
                                itemBuilder: (context, index) {
                                  if (index < sorted.length) {
                                    final etiqueta = sorted[index];
                                    return _buildEtiquetaCard(etiqueta, true);
                                  } else {
                                    // Loading indicator no final (apenas quando está carregando mais)
                                    return Center(
                                      child: Padding(
                                        padding: const EdgeInsets.all(20),
                                        child: CircularProgressIndicator(
                                          color: AppTheme.primary,
                                          strokeWidth: 2,
                                        ),
                                      ),
                                    );
                                  }
                                },
                              );
                            },
                          ),
                  ),
                ),
              ),
            ],
          );
        },
      ),

      // Footer com botões de ação e navegação
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Botões de ação
          Container(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 4),
            decoration: BoxDecoration(color: AppTheme.dark900),
            child: _modoLote
                ? Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Contador e botão selecionar todas
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '${_etiquetasSelecionadas.length} etiqueta(s) selecionada(s)',
                              style: TextStyle(
                                color: AppTheme.dark300,
                                fontSize: 12,
                              ),
                            ),
                            GestureDetector(
                              onTap: _selecionarTodas,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: AppTheme.dark700,
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: AppTheme.dark600),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      PhosphorIcons.checkSquareOffset,
                                      size: 14,
                                      color: AppTheme.primary,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      'Selecionar Todas',
                                      style: TextStyle(
                                        color: AppTheme.primary,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () {
                                setState(() {
                                  _modoLote = false;
                                  _etiquetasSelecionadas.clear();
                                });
                              },
                              icon: const Icon(PhosphorIcons.x, size: 18),
                              label: const Text('Cancelar'),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppTheme.dark300,
                                side: BorderSide(color: AppTheme.dark600),
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            flex: 2,
                            child: ElevatedButton.icon(
                              onPressed: _etiquetasSelecionadas.isEmpty
                                  ? null
                                  : _aplicarBaixaEmLote,
                              icon: const Icon(PhosphorIcons.checkCircle, size: 20),
                              label: const Text(
                                'Aplicar Baixa',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primary,
                                foregroundColor: Colors.white,
                                disabledBackgroundColor: AppTheme.dark600,
                                disabledForegroundColor: AppTheme.dark400,
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  )
                : Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _mostrarModalBaixarEtiqueta,
                          icon: const Icon(PhosphorIcons.fileX, size: 18),
                          label: const Text(
                            'Baixar Etiqueta',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () {
                            setState(() {
                              _modoLote = true;
                            });
                          },
                          icon: const Icon(PhosphorIcons.checkSquare, size: 18),
                          label: const Text(
                            'Baixar em Lote',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.dark700,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
          ),
          // Footer de navegação
          SafeArea(
            top: false,
            child: BottomNavigation(
              currentIndex: _footerIndex,
              onTap: (index) {
                // Navegar para MainScreen com o índice selecionado
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(
                    builder: (context) => MainScreen(initialIndex: index),
                  ),
                  (route) => false,
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEtiquetaCard(
    Map<String, dynamic> etiqueta, [
    bool compacto = false,
    bool desabilitarToque = false,
  ]) {
    final metadata = Map<String, dynamic>.from(etiqueta['metadata'] ?? {});
    final isUsed = metadata['isUsed'] == true;
    final productionDate = etiqueta['productionDate']?.toString() ?? '';
    final validityDate = etiqueta['validityDate']?.toString() ?? '';
    // Pegar responsável do metadata, ou do operador criador, ou do operador atual
    final responsavel =
        metadata['responsavel'] ??
        etiqueta['createdByName'] ??
        context.read<OperatorSessionProvider>().currentOperator?.name ??
        'N/A';
    final baixaRealizada = (metadata['usedAt'] ?? etiqueta['usedAt'])
        ?.toString();

    final isPending =
        etiqueta['status'] == 'pending' || etiqueta['status'] == 'pendente';

    final etiquetaId = etiqueta['id']?.toString() ?? '';
    final isSelected = _etiquetasSelecionadas.contains(etiquetaId);

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: desabilitarToque
          ? null
          : () {
              try {
                // Se modo lote ativo, alternar seleção
                if (_modoLote) {
                  setState(() {
                    if (isSelected) {
                      _etiquetasSelecionadas.remove(etiquetaId);
                    } else {
                      _etiquetasSelecionadas.add(etiquetaId);
                    }
                  });
                  return;
                }

                // Comportamento normal
                print(
                  '🧪 Tap no card da etiqueta: ${etiqueta['code'] ?? 'sem código'}',
                );
                // Se for pendente, abrir modal de reimpressão para imprimir pela primeira vez
                // Se não for pendente, abrir modal de baixa (ou apenas visualizar se já estiver baixada)
                if (isPending && !isUsed) {
                  _confirmarReimpressaoOuEdicao(etiqueta);
                } else if (isUsed) {
                  // ⭐ Se já estiver baixada, apenas mostrar o modal informativo (sem botão de baixar)
                  _mostrarModalConfirmacaoBaixaComEtiqueta(etiqueta);
                } else {
                  // Etiqueta ativa, pode ser baixada
                  _mostrarModalConfirmacaoBaixaComEtiqueta(etiqueta);
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Erro ao abrir etiqueta: $e'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: _modoLote && isSelected
                ? AppTheme.primary
                : Colors.grey.shade400,
            width: _modoLote && isSelected ? 3 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Builder(
            builder: (context) {
              final content = Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      // Checkbox quando modo lote ativo
                      if (_modoLote) ...[
                        Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppTheme.primary
                                : Colors.transparent,
                            border: Border.all(
                              color: isSelected
                                  ? AppTheme.primary
                                  : Colors.grey.shade400,
                              width: 2,
                            ),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: isSelected
                              ? Icon(
                                  PhosphorIcons.check,
                                  size: 16,
                                  color: Colors.white,
                                )
                              : null,
                        ),
                        const SizedBox(width: 8),
                      ],
                      _buildStatusBadge(etiqueta),
                      const Spacer(),
                      if (!_modoLote)
                        GestureDetector(
                          onTap: isUsed
                              ? () {
                                  // Mostrar mensagem que não pode reimprimir
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Etiqueta já foi baixada/consumida'),
                                      backgroundColor: Colors.orange,
                                      duration: Duration(seconds: 2),
                                    ),
                                  );
                                }
                              : () => _confirmarReimpressaoOuEdicao(etiqueta),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            child: Icon(
                              isUsed
                                  ? PhosphorIcons.prohibit
                                  : PhosphorIcons.printer,
                              size: 22,
                              color: isUsed ? Colors.orange.shade300 : Colors.green,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      (etiqueta['product']['name'] ?? '-')
                          .toString()
                          .toUpperCase(),
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: Colors.black,
                      ),
                      textAlign: TextAlign.left,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 6),
                  GestureDetector(
                    onTap: () async {
                      final code = (etiqueta['code'] ?? '-').toString();
                      await Clipboard.setData(ClipboardData(text: code));
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Row(
                              children: [
                                const Icon(
                                  PhosphorIcons.check,
                                  color: Colors.white,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Text('Código copiado: $code'),
                              ],
                            ),
                            backgroundColor: const Color(0xFF1B9E5A),
                            duration: const Duration(seconds: 2),
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        );
                      }
                    },
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          (etiqueta['code'] ?? '-').toString(),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1B9E5A),
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Icon(
                          PhosphorIcons.copy,
                          size: 16,
                          color: Color(0xFF1B9E5A),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  _buildEtiquetaInfoRow(
                    'Manipulação:',
                    _formatarData(productionDate),
                  ),
                  _buildEtiquetaInfoRow(
                    'Validade:',
                    _formatarData(validityDate),
                  ),
                  if (isUsed)
                    _buildEtiquetaInfoRow(
                      'Baixa realizada:',
                      (baixaRealizada != null && baixaRealizada.isNotEmpty)
                          ? _formatarData(baixaRealizada)
                          : '-',
                    )
                  else
                    _buildEtiquetaInfoRow(
                      'Vencimento:',
                      _getVencimentoText(_calcularDiasVencimento(validityDate)),
                    ),
                  const SizedBox(height: 8),
                  if (!compacto)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'RESPONSÁVEL',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: Colors.black,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              responsavel.toString(),
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Colors.black,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox.shrink(),
                      ],
                    ),
                ],
              );

              return content;
            },
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: TextStyle(fontSize: 10, color: AppTheme.dark400)),
          const SizedBox(width: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 10,
              color: color ?? Colors.white,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEtiquetaInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.black,
            ),
          ),
          Text(
            value,
            style: const TextStyle(fontSize: 14, color: Colors.black),
          ),
        ],
      ),
    );
  }

  /// Calcula a data de validade baseada no tipo de conservação
  String _calcularDataValidade(
    String productionDate,
    String? conservationType,
  ) {
    try {
      final dataProducao = DateTime.parse(productionDate);
      int diasValidade;

      switch (conservationType) {
        case 'ambiente':
          diasValidade = 7; // 7 dias para ambiente
          break;
        case 'refrigerado':
          diasValidade = 30; // 30 dias para refrigerado
          break;
        case 'congelado':
          diasValidade = 90; // 90 dias para congelado
          break;
        default:
          diasValidade = 7;
      }

      final dataValidade = dataProducao.add(Duration(days: diasValidade));
      return _formatarData(dataValidade.toIso8601String().split('T')[0]);
    } catch (e) {
      // Se houver erro no parsing, retorna a data original
      return _formatarData(productionDate);
    }
  }

  /// Formata a data para exibição
  String _formatarData(String data) {
    try {
      final date = DateTime.parse(data);
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
    } catch (e) {
      return data;
    }
  }

  Widget _buildActionButton(Map<String, dynamic> etiqueta) {
    final isUsed = etiqueta['metadata']['isUsed'] == true;

    // Sempre permitir abrir modal de reimpressão
    Color bg;
    IconData icon;
    if (etiqueta['status'] == 'pending') {
      bg = AppTheme.primary;
      icon = PhosphorIcons.printer;
    } else if (isUsed) {
      bg = Colors.green;
      icon =
          PhosphorIcons.printer; // manter ícone de impressora para reimpressão
    } else {
      bg = Colors.blue;
      icon = PhosphorIcons.printer;
    }
    return GestureDetector(
      onTap: () => _confirmarReimpressaoOuEdicao(etiqueta),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 16, color: Colors.white),
      ),
    );
  }

  Future<void> _confirmarReimpressaoOuEdicao(
    Map<String, dynamic> etiqueta,
  ) async {
    final metadata = Map<String, dynamic>.from(etiqueta['metadata'] ?? {});
    final isUsed = metadata['isUsed'] == true;
    final status = etiqueta['status']?.toString();
    
    // ⛔ BLOQUEIO: Não permitir reimprimir etiquetas baixadas/consumidas
    if (isUsed || status == 'consumed') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Não é possível reimprimir etiquetas que já foram baixadas/consumidas'),
          backgroundColor: Colors.orange,
          duration: Duration(seconds: 3),
        ),
      );
      return;
    }
    
    final product = Map<String, dynamic>.from(etiqueta['product'] ?? {});
    final conservacaoAtual =
        (metadata['conservacao'] ?? etiqueta['conservationType'])?.toString() ??
        'ambiente';
    String novaConservacao = conservacaoAtual;

    // Buscar dias de validade do produto
    final diasAmbiente = product['shelfLifeAmbient'] as int?;
    final diasRefrigerado = product['shelfLifeRefrigerated'] as int?;
    final diasCongelado = product['shelfLifeFrozen'] as int?;

    // Buscar data de validade original do produto
    final dataValidadeOriginal =
        product['showExpiryDateOnLabel'] as bool?; // ✅ CORRIGIDO: Flag boolean

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
      // ✅ REMOVIDO: Validade original não faz sentido na reimpressão
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
                    // Header com título e botão de histórico
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Reimprimir Etiqueta',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 20,
                          ),
                        ),
                        // Botão de histórico
                        IconButton(
                          icon: Icon(
                            PhosphorIcons.clockCounterClockwise,
                            color: const Color(0xFF10B981),
                            size: 24,
                          ),
                          onPressed: () {
                            Navigator.pop(context); // Fechar modal atual
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => EtiquetaHistoricoScreen(
                                  labelId: etiqueta['id'],
                                  labelCode: etiqueta['code'] ?? '—',
                                ),
                              ),
                            );
                          },
                          tooltip: 'Ver Histórico',
                        ),
                      ],
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
                                          ? (opcao['tipo'] ==
                                                    'validade_original'
                                                ? 'Data original'
                                                : (dias != null
                                                      ? (dias == 1
                                                            ? '1 dia'
                                                            : '$dias dias')
                                                      : 'N/A'))
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

    // Se mudou a conservação, atualizar metadata e recalcular validade
    if (resultado != conservacaoAtual) {
      await _alterarConservacaoEReimprimir(etiqueta, resultado);
    } else {
      // Mesma conservação, só reimprimir
      await _reimprimirEtiqueta(etiqueta);
    }
  }

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

    // Atualizar metadata com nova conservação e recalcular validade
    try {
      final auth = context.read<AuthProvider>();
      final token = await auth.authToken;
      final labelsService = LabelsService();
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
        }

        await labelsService.atualizarMetadata(
          labelId,
          novoMeta,
          authToken: token,
        );
        // ⭐ Obter operador atual para salvar no histórico
        final currentOperator = context.read<OperatorSessionProvider>().currentOperator;
        await labelsService.adicionarEvento(
          labelId,
          type: 'updated',
          userId: currentOperator?.id,
          metadata: {
            'reason': 'conservation_change',
            'old_conservation': conservacaoAtual,
            'new_conservation': novaConservacao,
            'new_expiry': novoMeta['validade'],
          },
          authToken: token,
        );

        // Reimprimir com dados atualizados
        final etiquetaAtualizada = Map<String, dynamic>.from(etiqueta);
        etiquetaAtualizada['metadata'] = novoMeta;
        // Atualizar também o conservationType da etiqueta principal
        etiquetaAtualizada['conservationType'] = novaConservacao;
        await _reimprimirEtiqueta(etiquetaAtualizada);

        // Recarregar a lista para refletir as mudanças
        try {
          print('🔄 Recarregando lista após alteração de conservação...');
          final labelsProvider = context.read<LabelsProvider>();
          await labelsProvider.carregarEtiquetas(type: 'validity');
          print('✅ Lista recarregada após alteração de conservação');
          if (mounted) {
            setState(() {});
          }
        } catch (e) {
          print('❌ Erro ao recarregar após alteração: $e');
          if (mounted) {
            setState(() {});
          }
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Conservação alterada para $novaConservacao'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Falha ao alterar conservação: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _editarAntesDeReimprimir(Map<String, dynamic> etiqueta) async {
    final metadata = Map<String, dynamic>.from(etiqueta['metadata'] ?? {});
    String conservacao =
        (metadata['conservacao'] ?? etiqueta['conservationType'])?.toString() ??
        '';
    final controllerAmb = TextEditingController(
      text:
          (metadata['emb_original'] ??
                  metadata['manipulacao'] ??
                  etiqueta['productionDate'] ??
                  '')
              .toString(),
    );
    final controllerRef = TextEditingController(
      text: (metadata['validade_refrigerado'] ?? '').toString(),
    );
    final controllerCong = TextEditingController(
      text: (metadata['validade_congelado'] ?? '').toString(),
    );

    final result = await showDialog<Map<String, String>>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              backgroundColor: AppTheme.dark800,
              title: const Text(
                'Alterar dados da etiqueta',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Nova conservação',
                      style: TextStyle(color: Colors.white70),
                    ),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      value: conservacao.isEmpty ? 'ambiente' : conservacao,
                      dropdownColor: AppTheme.dark800,
                      items: const [
                        DropdownMenuItem(
                          value: 'ambiente',
                          child: Text(
                            'Ambiente',
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                        DropdownMenuItem(
                          value: 'refrigerado',
                          child: Text(
                            'Refrigerado',
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                        DropdownMenuItem(
                          value: 'congelado',
                          child: Text(
                            'Congelado',
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                      ],
                      onChanged: (v) => setState(() {
                        conservacao = v ?? 'ambiente';
                      }),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: controllerAmb,
                      decoration: const InputDecoration(
                        labelText: 'Manipulação/Ambiente (BR ou ISO)',
                        labelStyle: TextStyle(color: Colors.white70),
                      ),
                      style: const TextStyle(color: Colors.white),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: controllerRef,
                      decoration: const InputDecoration(
                        labelText: 'Validade Refrigerado',
                        labelStyle: TextStyle(color: Colors.white70),
                      ),
                      style: const TextStyle(color: Colors.white),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: controllerCong,
                      decoration: const InputDecoration(
                        labelText: 'Validade Congelado',
                        labelStyle: TextStyle(color: Colors.white70),
                      ),
                      style: const TextStyle(color: Colors.white),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancelar'),
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop({
                      'ambiente': controllerAmb.text,
                      'refrigerado': controllerRef.text,
                      'congelado': controllerCong.text,
                      'conservacao': conservacao,
                    });
                  },
                  child: const Text('Aplicar'),
                ),
              ],
            );
          },
        );
      },
    );

    if (result == null) return;

    // Atualizar metadata e registrar ocorrência
    try {
      final auth = context.read<AuthProvider>();
      final token = await auth.authToken;
      final labelsService = LabelsService();
      final labelId = etiqueta['id']?.toString();
      if (labelId != null && labelId.isNotEmpty) {
        final novoMeta = Map<String, dynamic>.from(metadata);
        // Atualiza campos
        novoMeta['manipulacao'] = result['ambiente'];
        novoMeta['emb_original'] = result['ambiente'];
        if ((result['conservacao'] ?? '').isNotEmpty) {
          novoMeta['conservacao'] = result['conservacao'];
        }
        if ((result['refrigerado'] ?? '').isNotEmpty)
          novoMeta['validade_refrigerado'] = result['refrigerado'];
        if ((result['congelado'] ?? '').isNotEmpty)
          novoMeta['validade_congelado'] = result['congelado'];

        // Atualiza validade principal conforme nova conservação
        final cons = (result['conservacao'] ?? conservacao).toString();

        // Atualizar label_validade baseado na conservação
        if (cons == 'refrigerado') {
          novoMeta['label_validade'] = 'VALIDADE REFRIGERADO';
          if ((result['refrigerado'] ?? '').isNotEmpty) {
            novoMeta['validade'] = result['refrigerado'];
          }
        } else if (cons == 'congelado') {
          novoMeta['label_validade'] = 'VALIDADE CONGELADO';
          if ((result['congelado'] ?? '').isNotEmpty) {
            novoMeta['validade'] = result['congelado'];
          }
        } else if (cons == 'validade_original') {
          novoMeta['label_validade'] =
              'VALIDADE'; // ✅ NOVO: Para validade original
          if ((result['validade_original'] ?? '').isNotEmpty) {
            novoMeta['validade'] = result['validade_original'];
          }
        } else {
          novoMeta['label_validade'] = 'VALIDADE T. AMBIENTE';
          if ((result['ambiente'] ?? '').isNotEmpty) {
            novoMeta['validade'] = result['ambiente'];
          }
        }

        await labelsService.atualizarMetadata(
          labelId,
          novoMeta,
          authToken: token,
        );
        // ⭐ Obter operador atual para salvar no histórico
        final currentOperator = context.read<OperatorSessionProvider>().currentOperator;
        await labelsService.adicionarEvento(
          labelId,
          type: 'updated',
          userId: currentOperator?.id,
          metadata: {'reason': 'reprint_edit', 'changes': result},
          authToken: token,
        );

        // Reimprimir com dados atualizados
        final etiquetaAtualizada = Map<String, dynamic>.from(etiqueta);
        etiquetaAtualizada['metadata'] = novoMeta;
        // Atualizar também o conservationType da etiqueta principal
        etiquetaAtualizada['conservationType'] = cons;
        await _reimprimirEtiqueta(etiquetaAtualizada);
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Falha ao atualizar etiqueta: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _reimprimirEtiqueta(Map<String, dynamic> etiqueta) async {
    try {
      final auth = context.read<AuthProvider>();
      final clientId = auth.user?.clientId;
      final token = await auth.authToken;
      final tagmentProvider = context.read<PrintProvider>();
      final printerConfigProvider = context
          .read<TagmentPrinterConfigProvider>();

      // Garantir que o provider de configuração esteja associado
      tagmentProvider.setPrinterConfigProvider(printerConfigProvider);
      if (printerConfigProvider.config == null &&
          !printerConfigProvider.isLoading) {
        await printerConfigProvider.loadConfig();
      }

      // Selecionar impressora de validade (respeita configuração manual e online da API)
      final storageLocationId = etiqueta['storageLocationId']?.toString();

      print('🖨️ === DEBUG REIMPRESSÃO ===');
      print('🖨️ Storage Location ID: $storageLocationId');
      print(
        '🖨️ Impressoras antes do refresh: ${tagmentProvider.impressoras.length}',
      );
      print(
        '🖨️ Impressoras online antes: ${tagmentProvider.impressorasOnline.length}',
      );

      // Configurar API Key do Tagment primeiro (se ainda não estiver configurada)
      if (tagmentProvider.apiKeyAtual == null ||
          tagmentProvider.apiKeyAtual!.isEmpty) {
        print('🔑 Configurando API Key do Tagment...');
        final configurado = await tagmentProvider.configurarApiKeyDoCliente(
          clientId!,
          token!,
        );
        if (!configurado) {
          print('❌ Falha ao configurar API Key do Tagment');
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Erro ao configurar sistema de impressão. Tente novamente.',
              ),
              backgroundColor: Colors.red,
              duration: Duration(seconds: 4),
            ),
          );
          return;
        }
        print('✅ API Key configurada com sucesso');
      } else {
        print('✅ API Key já configurada');
      }

      // Sempre forçar refresh de impressoras antes de selecionar
      print('🔄 Iniciando refresh de impressoras...');
      await tagmentProvider.carregarImpressoras(
        locationId: null,
        forceRefresh: true,
        token: token,
        clientId: clientId,
      ); // ⭐ Buscar do Granobox

      print('✅ Refresh concluído!');
      print(
        '🖨️ Impressoras após refresh: ${tagmentProvider.impressoras.length}',
      );
      print(
        '🖨️ Impressoras online após: ${tagmentProvider.impressorasOnline.length}',
      );
      print(
        '🖨️ Impressoras de validade: ${tagmentProvider.impressorasValidade.length}',
      );

      // Listar todas as impressoras disponíveis
      for (var p in tagmentProvider.impressoras) {
        print(
          '   - ${p.displayName}: online=${p.isOnline}, validade=${p.isValidadePrinter}, location=${p.externalLocationId}',
        );
      }

      final metadata = Map<String, dynamic>.from(etiqueta['metadata'] ?? {});
      final categoriesProvider = context.read<CategoriesProductsProvider>();

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

      final product = productId != null
          ? categoriesProvider.getProductById(productId)
          : null;
      final category = product?.categoryId != null
          ? categoriesProvider.getCategoryById(product!.categoryId!)
          : null;

      final printerInfo = await tagmentProvider.obterImpressoraValidade(
        storageLocationId,
        defaultPrinterId: product?.defaultPrinterId,
        categoryDefaultPrinterId: category?.defaultPrinterId,
      );
      print(
        '🖨️ Impressora selecionada: ${printerInfo?.displayName ?? "NENHUMA"}',
      );

      if (printerInfo == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Nenhuma impressora de validade disponível. Verifique as configurações.',
            ),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 4),
          ),
        );
        return;
      }
      // ⭐ WebSocket não precisa de IP - usa deviceId
      final printerIP = '';
      final offsets = tagmentProvider.obterOffsetsImpressora(printerInfo);

      // Extrair dados da etiqueta/metadata (usar exatamente o que foi impresso)
      final produto =
          (metadata['produto'] ?? etiqueta['product']?['name'] ?? '-')
              .toString();
      final marca = (metadata['marca'] ?? '').toString();
      // SIF deve vir do metadata (ou do produto), nunca do código da etiqueta
      final sif = (metadata['sif'] ?? etiqueta['product']?['sif'] ?? '')
          .toString();
      // Datas: preferir metadata original; se vier ISO, converter para BR e incluir hora se configurado
      final dateConfig = Provider.of<DateConfigProvider>(
        context,
        listen: false,
      );
      String _fmt(String raw) {
        if (raw.isEmpty) return raw;
        // Caso já venha em BR
        if (raw.contains('/')) {
          if (!dateConfig.showTimeInDates) return raw;
          // Se está em BR mas sem hora e precisamos de hora, anexar hora atual
          if (raw.contains(':')) return raw; // já tem hora
          final now = DateTime.now();
          final hh = now.hour.toString().padLeft(2, '0');
          final min = now.minute.toString().padLeft(2, '0');
          return '$raw $hh:$min';
        }
        // Caso venha ISO
        try {
          final normalized = raw.replaceAll('T', ' ').split('.').first;
          final dt = DateTime.parse(normalized);
          final dd = dt.day.toString().padLeft(2, '0');
          final mm = dt.month.toString().padLeft(2, '0');
          final yyyy = dt.year.toString();
          final base = '$dd/$mm/$yyyy';
          if (!dateConfig.showTimeInDates) return base;
          // Incluir hora: usar hora do valor se não for 00:00, senão hora atual
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
          return raw; // fallback: não alterar
        }
      }

      final dataEmbalagem = _fmt(
        (metadata['emb_original'] ??
                metadata['manipulacao'] ??
                etiqueta['productionDate'] ??
                '')
            .toString(),
      );
      final dataManipulacao = _fmt(
        (metadata['manipulacao'] ??
                metadata['emb_original'] ??
                etiqueta['productionDate'] ??
                '')
            .toString(),
      );
      final dataValidade = _fmt(
        (metadata['validade'] ?? etiqueta['validityDate'] ?? '').toString(),
      );
      final conservacao =
          (metadata['conservacao'] ?? etiqueta['conservationType'])?.toString();
      // Quantidade/peso: usar metadata quando completo; senão completar com unidade
      String qtdPeso = (metadata['qtd_peso'] ?? '').toString().trim();
      final valorQty = (etiqueta['weight'] ?? etiqueta['quantity'] ?? '')
          .toString()
          .trim();
      final unidadeQty =
          (etiqueta['unit'] ??
                  etiqueta['weightUnit'] ??
                  etiqueta['product']?['weightUnit'] ??
                  metadata['unidade'] ??
                  '')
              .toString()
              .trim();
      if (qtdPeso.isEmpty) {
        if (valorQty.isNotEmpty && unidadeQty.isNotEmpty) {
          qtdPeso = '$valorQty $unidadeQty';
        } else if (valorQty.isNotEmpty) {
          qtdPeso = valorQty;
        }
      } else {
        // Se metadata tem só número, anexar unidade
        final hasLetters = RegExp(r'[A-Za-z]').hasMatch(qtdPeso);
        if (!hasLetters && unidadeQty.isNotEmpty) {
          qtdPeso = '$qtdPeso $unidadeQty';
        }
      }
      // Pegar responsável do metadata, ou do operador criador, ou do operador atual
      final responsavel =
          (metadata['responsavel'] ??
                  etiqueta['createdByName'] ??
                  context
                      .read<OperatorSessionProvider>()
                      .currentOperator
                      ?.name ??
                  'N/A')
              .toString();
      final armazenamento = (metadata['armazenamento'] ?? '').toString();
      // label_validade: se ausente, derivar da conservação
      String labelValidade =
          (metadata['label_validade'] ?? metadata['label_valdade'] ?? '')
              .toString();
      if (labelValidade.isEmpty) {
        final cons = (conservacao ?? '').toString();
        if (cons == 'refrigerado')
          labelValidade = 'VALIDADE REFRIGERADO';
        else if (cons == 'congelado')
          labelValidade = 'VALIDADE CONGELADO';
        else
          labelValidade = 'VALIDADE T. AMBIENTE';
      }
      final codigo = (etiqueta['code'] ?? '').toString();
      final legacyProductId = (etiqueta['productId'] ?? '').toString();

      // Lote e Data de Vencimento da Indústria
      final loteIndustria =
          (metadata['lote_industria'] ?? etiqueta['manufacturingBatch'] ?? '')
              .toString();
      final dataVencimentoIndustria = _fmt(
        (metadata['data_vencimento_industria'] ?? etiqueta['expiryDate'] ?? '')
            .toString(),
      );

      await showPrintModal(
        context: context,
        title: 'Reimprimindo Etiqueta',
        printFunction: (onProgress) => tagmentProvider.imprimirEtiquetaValidade(
          produto: produto,
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
          templateId: product?.customTemplateId, // ⭐ Template do produto
          categoryDefaultTemplateId: category?.defaultTemplateId, // ⭐ Template da categoria
          clientId: clientId,
          authToken: token,
          codigo: codigo,
          productId: productId,
          storageLocationId: storageLocationId,
          conservacao: conservacao,
          reimpressao: true, // NÃO criar nova etiqueta - manter mesmo código
          loteIndustria:
              loteIndustria, // Sempre enviar (mesmo vazio) para evitar placeholders
          dataVencimentoIndustria:
              dataVencimentoIndustria, // Sempre enviar (mesmo vazio) para evitar placeholders
        ),
        onSuccess: () async {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Etiqueta $codigo reimpressa com sucesso'),
              backgroundColor: Colors.green,
            ),
          );
          // Atualizar status da etiqueta para 'printed' após sucesso
          try {
            final labelId = etiqueta['id']?.toString();
            if (labelId != null && labelId.isNotEmpty) {
              final labelsService = LabelsService();
              bool ok = await labelsService.atualizarStatus(
                labelId,
                'printed',
                authToken: token,
              );
              if (!ok) {
                // Fallback: marcar como impressa em lote
                await labelsService.marcarComoImpressas([
                  labelId,
                ], authToken: token);
              }
              // Recarregar a lista exibida para refletir mudanças
              try {
                print('🔄 Recarregando lista de etiquetas após reimpressão...');
                final labelsProvider = context.read<LabelsProvider>();
                await labelsProvider.carregarEtiquetas(type: 'validity');
                print('✅ Lista de etiquetas recarregada com sucesso');
                // Forçar rebuild da tela
                if (mounted) {
                  setState(() {});
                }
              } catch (e) {
                print('❌ Erro ao recarregar lista de etiquetas: $e');
                // Forçar rebuild mesmo com erro para limpar qualquer estado de loading
                if (mounted) {
                  setState(() {});
                }
              }
            }
          } catch (e) {
            print('⚠️ Falha ao atualizar status pós-reimpressão: $e');
          }
        },
        onError: () {},
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao reimprimir: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Widget _buildStatusToggleButton() {
    return GestureDetector(
      onTap: () {
        setState(() {
          _mostrarBaixadas = !_mostrarBaixadas;
        });
      },
      child: Container(
        height: 40,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: _mostrarBaixadas ? Colors.orange : AppTheme.dark700,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: _mostrarBaixadas ? Colors.orange : AppTheme.dark600,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _mostrarBaixadas ? PhosphorIcons.checkCircle : PhosphorIcons.tag,
              color: _mostrarBaixadas ? Colors.white : AppTheme.dark400,
              size: 16,
            ),
            const SizedBox(width: 6),
            Text(
              _mostrarBaixadas ? 'Baixadas' : 'Ativas',
              style: TextStyle(
                color: _mostrarBaixadas ? Colors.white : AppTheme.dark400,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterButton() {
    return GestureDetector(
      onTap: _mostrarFiltros,
      child: Container(
        height: 40,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: AppTheme.primary,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(PhosphorIcons.funnel, color: Colors.white, size: 16),
            const SizedBox(width: 6),
            Text(
              'Filtros',
              style: TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(PhosphorIcons.tag, size: 64, color: AppTheme.dark600),
          const SizedBox(height: 16),
          Text(
            'Nenhuma etiqueta encontrada',
            style: TextStyle(
              fontSize: 18,
              color: AppTheme.dark300,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tente ajustar os filtros ou criar uma nova etiqueta',
            style: TextStyle(fontSize: 14, color: AppTheme.dark400),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  // Funções auxiliares
  Color _getStatusColor(Map<String, dynamic> etiqueta) {
    final isUsed = etiqueta['metadata']['isUsed'] == true;
    if (isUsed) return Colors.green;

    switch (etiqueta['status']) {
      case 'pending':
        return Colors.orange;
      case 'printed':
        return Colors.blue;
      default:
        return AppTheme.dark400;
    }
  }

  IconData _getStatusIcon(Map<String, dynamic> etiqueta) {
    final isUsed = etiqueta['metadata']['isUsed'] == true;
    if (isUsed) return PhosphorIcons.checkCircle;

    switch (etiqueta['status']) {
      case 'pending':
        return PhosphorIcons.clock;
      case 'printed':
        return PhosphorIcons.printer;
      default:
        return PhosphorIcons.question;
    }
  }

  String _getStatusText(Map<String, dynamic> etiqueta) {
    final isUsed = etiqueta['metadata']['isUsed'] == true;
    if (isUsed) return 'Utilizada';

    switch (etiqueta['status']) {
      case 'pending':
        return 'Pendente';
      case 'printed':
        return 'Impressa';
      default:
        return 'Desconhecido';
    }
  }

  int _calcularDiasVencimento(String dataValidade) {
    final agora = DateTime.now();
    // Normalizar para meia-noite para comparar apenas as datas
    final hoje = DateTime(agora.year, agora.month, agora.day);
    final vencimento = DateTime.parse(dataValidade);
    // Normalizar a data de vencimento para meia-noite
    final vencimentoNormalizado = DateTime(vencimento.year, vencimento.month, vencimento.day);
    final diferenca = vencimentoNormalizado.difference(hoje).inDays;
    return diferenca;
  }

  Color _getVencimentoColor(int dias) {
    if (dias < 0) return Colors.red;
    if (dias <= 7) return Colors.orange;
    if (dias <= 30) return Colors.yellow;
    return Colors.green;
  }

  String _getVencimentoText(int dias) {
    if (dias < 0) return 'Venceu há ${dias.abs()} dias';
    if (dias == 0) return 'Vence hoje';
    if (dias == 1) return 'Vence amanhã';
    return 'Vence em $dias dias';
  }

  String _getFilterGroupLabel(String filterGroup) {
    switch (filterGroup) {
      case 'vencidos':
        return 'Vencidos';
      case 'hoje':
        return 'Hoje';
      case 'amanha':
        return 'Amanhã';
      case '7dias':
        return '7 dias';
      case 'personalizado':
        return 'Personalizado';
      default:
        return '';
    }
  }

  void _mostrarFiltros() {
    // Variáveis locais devem ser declaradas fora do builder para não reinicializar a cada rebuild
    String localSort = _sortBy;
    String localGroup = _filterGroup;
    DateTime? localStart = _customStart;
    DateTime? localEnd = _customEnd;
    bool localMostrarBaixadas = _mostrarBaixadas;
    bool localMostrarAtivas = _mostrarAtivas;

    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.dark800,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          Future<void> pickDate(bool isStart) async {
            final initial = isStart
                ? (localStart ?? DateTime.now())
                : (localEnd ?? DateTime.now());
            final picked = await showDatePicker(
              context: context,
              initialDate: initial,
              firstDate: DateTime(2020),
              lastDate: DateTime(2100),
              builder: (context, child) => Theme(
                data: Theme.of(context).copyWith(
                  colorScheme: const ColorScheme.dark(primary: Colors.green),
                ),
                child: child!,
              ),
            );
            if (picked != null) {
              setModalState(() {
                if (isStart) {
                  localStart = picked;
                } else {
                  localEnd = picked;
                }
              });
            }
          }

          Widget chip(String label, String value) {
            final sel = localGroup == value;
            return ChoiceChip(
              label: Text(
                label,
                style: TextStyle(
                  color: sel ? Colors.white : AppTheme.dark300,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              selected: sel,
              selectedColor: AppTheme.primary,
              onSelected: (v) => setModalState(() {
                if (v) {
                  localGroup = value;
                } else {
                  localGroup = '';
                }
              }),
              backgroundColor: sel ? AppTheme.primary : AppTheme.dark700,
              shape: StadiumBorder(
                side: BorderSide(
                  color: sel ? AppTheme.primary : AppTheme.dark600,
                ),
              ),
            );
          }

          return Container(
            height: MediaQuery.of(context).size.height * 0.56,
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    Icon(
                      PhosphorIcons.funnel,
                      color: AppTheme.primary,
                      size: 28,
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Filtros',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(PhosphorIcons.x, color: Colors.white),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Ordenação
                Text(
                  'Ordenar por',
                  style: TextStyle(
                    color: AppTheme.dark300,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final opt in [
                      {'label': 'Validade (↑)', 'value': 'validade_asc'},
                      {'label': 'Validade (↓)', 'value': 'validade_desc'},
                      {'label': 'Produto (A-Z)', 'value': 'produto_az'},
                      {'label': 'Recentes', 'value': 'recentes'},
                    ])
                      ChoiceChip(
                        label: Text(
                          opt['label'] as String,
                          style: TextStyle(
                            color: (localSort == opt['value'])
                                ? Colors.white
                                : AppTheme.dark300,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        selected: localSort == opt['value'],
                        selectedColor: AppTheme.primary,
                        onSelected: (v) => setModalState(() {
                          if (v) localSort = opt['value'] as String;
                        }),
                        backgroundColor: (localSort == opt['value'])
                            ? AppTheme.primary
                            : AppTheme.dark700,
                        shape: StadiumBorder(
                          side: BorderSide(
                            color: (localSort == opt['value'])
                                ? AppTheme.primary
                                : AppTheme.dark600,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                // Status (Ativas/Baixadas)
                Text(
                  'Status',
                  style: TextStyle(
                    color: AppTheme.dark300,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    FilterChip(
                      label: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            localMostrarAtivas ? PhosphorIcons.checkCircle : PhosphorIcons.circle,
                            size: 16,
                            color: localMostrarAtivas ? Colors.white : AppTheme.dark300,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Ativas',
                            style: TextStyle(
                              color: localMostrarAtivas ? Colors.white : AppTheme.dark300,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      selected: localMostrarAtivas,
                      selectedColor: AppTheme.primary,
                      onSelected: (v) => setModalState(() {
                        localMostrarAtivas = v;
                        // Se ambas estiverem desmarcadas, marcar a outra automaticamente
                        if (!localMostrarAtivas && !localMostrarBaixadas) {
                          localMostrarBaixadas = true;
                        }
                      }),
                      backgroundColor: localMostrarAtivas ? AppTheme.primary : AppTheme.dark700,
                      shape: StadiumBorder(
                        side: BorderSide(
                          color: localMostrarAtivas ? AppTheme.primary : AppTheme.dark600,
                        ),
                      ),
                    ),
                    FilterChip(
                      label: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            localMostrarBaixadas ? PhosphorIcons.checkSquare : PhosphorIcons.square,
                            size: 16,
                            color: localMostrarBaixadas ? Colors.white : AppTheme.dark300,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Baixadas',
                            style: TextStyle(
                              color: localMostrarBaixadas ? Colors.white : AppTheme.dark300,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      selected: localMostrarBaixadas,
                      selectedColor: Colors.orange,
                      onSelected: (v) => setModalState(() {
                        localMostrarBaixadas = v;
                        // Se ambas estiverem desmarcadas, marcar a outra automaticamente
                        if (!localMostrarAtivas && !localMostrarBaixadas) {
                          localMostrarAtivas = true;
                        }
                      }),
                      backgroundColor: localMostrarBaixadas ? Colors.orange : AppTheme.dark700,
                      shape: StadiumBorder(
                        side: BorderSide(
                          color: localMostrarBaixadas ? Colors.orange : AppTheme.dark600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Agrupamento por datas
                Text(
                  'Período (Vencimento)',
                  style: TextStyle(
                    color: AppTheme.dark300,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    chip('Todos', ''),
                    chip('Vencidos', 'vencidos'),
                    chip('Hoje', 'hoje'),
                    chip('Amanhã', 'amanha'),
                    chip('Até 7 dias', '7dias'),
                    chip('Personalizado', 'personalizado'),
                  ],
                ),
                if (localGroup == 'personalizado') ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => pickDate(true),
                          child: Text(
                            localStart == null
                                ? 'Início'
                                : '${localStart!.day.toString().padLeft(2, '0')}/${localStart!.month.toString().padLeft(2, '0')}/${localStart!.year}',
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => pickDate(false),
                          child: Text(
                            localEnd == null
                                ? 'Fim'
                                : '${localEnd!.day.toString().padLeft(2, '0')}/${localEnd!.month.toString().padLeft(2, '0')}/${localEnd!.year}',
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () async {
                          setState(() {
                            _sortBy = 'produto_az';
                            _filterGroup = '';
                            _customStart = null;
                            _customEnd = null;
                            _mostrarBaixadas = false;
                            _mostrarAtivas = true; // Resetar para ativas apenas
                          });
                          Navigator.pop(context);
                          // Recarregar dados da API sem filtros
                          await _carregarDados();
                        },
                        child: const Text(
                          'Limpar',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () async {
                          setState(() {
                            _sortBy = localSort;
                            _filterGroup = localGroup;
                            _customStart = localStart;
                            _customEnd = localEnd;
                            _mostrarBaixadas = localMostrarBaixadas;
                            _mostrarAtivas = localMostrarAtivas;
                          });
                          Navigator.pop(context);
                          // Recarregar dados da API com os novos filtros
                          await _carregarDados();
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                        ),
                        child: const Text(
                          'Aplicar',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatusFilter(String label, String value) {
    final isSelected = _selectedStatus == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedStatus = value;
        });
        Navigator.pop(context);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary : AppTheme.dark700,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppTheme.primary : AppTheme.dark600,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppTheme.dark300,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  void _selecionarTodas() {
    final labelsProvider = context.read<LabelsProvider>();
    final etiquetas = labelsProvider.etiquetas;

    // Filtrar apenas etiquetas não usadas (ativas)
    final etiquetasAtivas = etiquetas.where((e) {
      final metadata = Map<String, dynamic>.from(e['metadata'] ?? {});
      final isUsed = metadata['isUsed'] == true;
      return !isUsed;
    }).toList();

    setState(() {
      if (_etiquetasSelecionadas.length == etiquetasAtivas.length) {
        // Se todas já estão selecionadas, desmarcar todas
        _etiquetasSelecionadas.clear();
      } else {
        // Selecionar todas as etiquetas ativas
        _etiquetasSelecionadas = etiquetasAtivas
            .map((e) => e['id']?.toString() ?? '')
            .where((id) => id.isNotEmpty)
            .toSet();
      }
    });
  }

  Future<void> _aplicarBaixaEmLote() async {
    if (_etiquetasSelecionadas.isEmpty) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        title: const Text(
          'Confirmar Baixa em Lote',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Deseja aplicar baixa em ${_etiquetasSelecionadas.length} etiqueta(s) selecionada(s)?\n\nEsta ação não pode ser desfeita.',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            child: const Text('Confirmar Baixa'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      final labelsProvider = context.read<LabelsProvider>();
      final sucesso = await labelsProvider.aplicarBaixaEmLote(
        _etiquetasSelecionadas.toList(),
      );

      if (sucesso && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(PhosphorIcons.checkCircle, color: Colors.white),
                const SizedBox(width: 8),
                Text(
                  '✅ Baixa aplicada em ${_etiquetasSelecionadas.length} etiqueta(s)',
                ),
              ],
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 3),
          ),
        );

        setState(() {
          _etiquetasSelecionadas.clear();
          _modoLote = false;
        });
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(PhosphorIcons.warning, color: Colors.white),
                SizedBox(width: 8),
                Text('❌ Erro ao aplicar baixa em lote'),
              ],
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _mostrarModalBaixarEtiqueta() {
    final TextEditingController codigoController = TextEditingController();

    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => Dialog(
        backgroundColor: AppTheme.dark800,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Container(
          padding: const EdgeInsets.all(24),
          constraints: const BoxConstraints(maxWidth: 400),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Ícone grande de QR Code
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(60),
                  border: Border.all(
                    color: AppTheme.primary.withOpacity(0.3),
                    width: 2,
                  ),
                ),
                child: Icon(
                  PhosphorIcons.qrCode,
                  size: 60,
                  color: AppTheme.primary,
                ),
              ),

              const SizedBox(height: 24),

              // Título
              const Text(
                'Baixar Etiqueta',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 12),

              // Texto explicativo
              Text(
                'Escaneie o QR Code da etiqueta ou digite o código manualmente',
                style: TextStyle(fontSize: 16, color: AppTheme.dark300),
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 32),

              // Campo de código com ícone de câmera
              FormInput(
                controller: codigoController,
                hintText: 'Digite o código da etiqueta...',
                suffixIcon: PhosphorIcons.camera,
                onSuffixIconTap: () {
                  Navigator.pop(context);
                  _mostrarScannerQR(codigoController);
                },
              ),

              const SizedBox(height: 24),

              // Botões
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        _mostrarScannerQR(codigoController);
                      },
                      icon: const Icon(PhosphorIcons.qrCode),
                      label: const Text(
                        'Ler QRCode',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: BorderSide(color: AppTheme.primary),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        if (codigoController.text.isNotEmpty) {
                          _processarBaixaEtiqueta(codigoController.text);
                          Navigator.pop(context);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Confirmar',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _mostrarScannerQR(TextEditingController controller) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          height: 400,
          decoration: BoxDecoration(
            color: AppTheme.dark800,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Icon(
                      PhosphorIcons.qrCode,
                      color: AppTheme.primary,
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        'Escaneie o QR Code',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(PhosphorIcons.x, color: Colors.white),
                    ),
                  ],
                ),
              ),

              // Scanner
              Expanded(
                child: Container(
                  margin: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.primary),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: MobileScanner(
                      onDetect: (capture) {
                        final List<Barcode> barcodes = capture.barcodes;
                        for (final barcode in barcodes) {
                          if (barcode.rawValue != null) {
                            controller.text = barcode.rawValue!;
                            Navigator.pop(context);
                            _processarBaixaEtiqueta(barcode.rawValue!);
                            break;
                          }
                        }
                      },
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _abrirScannerParaBusca() {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          height: 400,
          decoration: BoxDecoration(
            color: AppTheme.dark800,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Icon(
                      PhosphorIcons.qrCode,
                      color: AppTheme.primary,
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        'Escanear QR Code',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(PhosphorIcons.x, color: Colors.white),
                    ),
                  ],
                ),
              ),

              // Scanner
              Expanded(
                child: Container(
                  margin: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.primary),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: MobileScanner(
                      onDetect: (capture) {
                        final List<Barcode> barcodes = capture.barcodes;
                        for (final barcode in barcodes) {
                          if (barcode.rawValue != null) {
                            setState(() {
                              _searchController.text = barcode.rawValue!;
                            });
                            Navigator.pop(context);
                            break;
                          }
                        }
                      },
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _processarBaixaEtiqueta(String codigo) async {
    final auth = context.read<AuthProvider>();
    final token = await auth.authToken;
    final labelsService = LabelsService();

    try {
      final etiqueta = await labelsService.buscarEtiquetaPorCodigo(
        codigo,
        authToken: token,
      );
      if (!mounted) return;

      if (etiqueta == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Etiqueta não encontrada'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      _mostrarModalConfirmacaoBaixaComEtiqueta(etiqueta);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao buscar etiqueta: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _mostrarModalConfirmacaoBaixaComEtiqueta(
    Map<String, dynamic> etiquetaEncontrada,
  ) {
    // ⭐ Verificar se a etiqueta já está baixada
    final metadata = Map<String, dynamic>.from(etiquetaEncontrada['metadata'] ?? {});
    final status = (etiquetaEncontrada['status']?.toString() ?? '').toLowerCase();
    final isUsed = metadata['isUsed'] == true || status == 'used' || status == 'consumed';
    
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => Dialog(
        backgroundColor: AppTheme.dark800,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Container(
          padding: const EdgeInsets.all(20),
          constraints: const BoxConstraints(maxWidth: 500),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Título
              Row(
                children: [
                  Icon(
                    isUsed ? PhosphorIcons.checkCircle : PhosphorIcons.checkCircle,
                    color: isUsed ? Colors.orange : Colors.green,
                    size: 24,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      isUsed ? 'Etiqueta Já Baixada' : 'Etiqueta Encontrada',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  // ✅ NOVO: Botão de histórico
                  IconButton(
                    icon: Icon(
                      PhosphorIcons.clockCounterClockwise,
                      color: const Color(0xFF10B981),
                      size: 24,
                    ),
                    onPressed: () {
                      Navigator.pop(context); // Fechar modal atual
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => EtiquetaHistoricoScreen(
                            labelId: etiquetaEncontrada['id'],
                            labelCode: etiquetaEncontrada['code'] ?? '—',
                          ),
                        ),
                      );
                    },
                    tooltip: 'Ver Histórico',
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(
                      PhosphorIcons.x,
                      color: Colors.white,
                      size: 20,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Card da etiqueta simulada
              Container(
                width: double.infinity,
                child: _buildEtiquetaCard(etiquetaEncontrada, false, true),
              ),

              const SizedBox(height: 20),

              // Botões de ação
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.dark300,
                        side: BorderSide(color: AppTheme.dark600),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        isUsed ? 'Fechar' : 'Cancelar',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  // ⭐ Só mostrar botão "Confirmar Baixa" se a etiqueta NÃO estiver baixada
                  if (!isUsed) ...[
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          _confirmarBaixaEtiqueta(etiquetaEncontrada);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Confirmar Baixa',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _confirmarBaixaEtiqueta(Map<String, dynamic> etiqueta) async {
    final auth = context.read<AuthProvider>();
    final token = await auth.authToken;
    final labelsService = LabelsService();

    // Atualizar status para "used" ou metadata isUsed=true conforme regra desejada
    final id = etiqueta['id'] as String?;
    if (id == null) return;

    final atualizado = await labelsService.atualizarMetadata(id, {
      ...(Map<String, dynamic>.from(etiqueta['metadata'] ?? {})),
      'isUsed': true,
      'usedAt': DateTime.now().toIso8601String(),
    }, authToken: token);

    if (!mounted) return;

    if (atualizado != null) {
      // ⭐ Criar evento de baixa no histórico
      final currentOperator = context.read<OperatorSessionProvider>().currentOperator;
      await labelsService.adicionarEvento(
        id,
        type: 'consumed',
        userId: currentOperator?.id,
        metadata: {
          'reason': 'manual_baixa',
          'baixadoPor': currentOperator?.name ?? 'N/A',
        },
        authToken: token,
      );
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Etiqueta ${etiqueta['code']} baixada com sucesso!'),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 3),
        ),
      );
      // Recarregar lista
      await _carregarDados();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Falha ao atualizar etiqueta'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
