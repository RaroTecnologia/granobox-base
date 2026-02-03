import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:speech_to_text/speech_to_text.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../components/custom_icon.dart';
import '../components/header_button.dart';
import '../providers/auth_provider.dart';
import '../providers/categories_products_provider.dart';
import '../providers/storage_locations_provider.dart';
import '../providers/connectivity_provider.dart';
import '../providers/print_provider.dart';
import '../providers/tagment_printer_config_provider.dart';
import '../providers/date_config_provider.dart';
import '../providers/operators_provider.dart';
import '../providers/operations_provider.dart';
import '../providers/operator_session_provider.dart';
import '../models/operator_models.dart';
import '../utils/culinary_icons.dart';
import '../models/category_models.dart';
import '../models/product_models.dart';
import '../models/storage_location_models.dart';
import '../widgets/connectivity_status_widget.dart';
import '../widgets/print_modal.dart';
import '../widgets/responsive_text.dart';
import '../widgets/cache_indicator_widget.dart';
import '../providers/labels_provider.dart';
import 'main_screen.dart';
import 'etiqueta_personalizada_screen.dart';
import '../services/granobox_api_service.dart';
import '../components/ai_capture_button.dart';

class ManipuladoScreen extends StatefulWidget {
  const ManipuladoScreen({super.key});

  @override
  State<ManipuladoScreen> createState() => _ManipuladoScreenState();
}

class _ManipuladoScreenState extends State<ManipuladoScreen> {
  final TextEditingController _codigoController = TextEditingController();
  final TextEditingController _nomeController = TextEditingController();
  final TextEditingController _dataValidadeController = TextEditingController();
  final TextEditingController _dataManipulacaoController =
      TextEditingController();
  final TextEditingController _quantidadeController = TextEditingController(
    text: '1',
  );
  final TextEditingController _quantidadeEtiquetasController =
      TextEditingController(text: '1');

  // NOVOS CAMPOS: Lote e Data de Vencimento da Indústria
  final TextEditingController _loteIndustriaController =
      TextEditingController();
  final TextEditingController _dataVencimentoIndustriaController =
      TextEditingController();

  DateTime? _dataValidade;
  int _quantidade = 1;
  String? _conservacaoSelecionada;

  // Peso e unidade
  final TextEditingController _pesoController = TextEditingController();
  String _unidadeSelecionada = 'KG';

  // Marca e SIF editáveis
  final TextEditingController _marcaController = TextEditingController();
  final TextEditingController _sifController = TextEditingController();

  // Estados de seleção para borda verde
  String? _categoriaHover;
  String? _subcategoriaHover;
  String? _produtoHover;

  // Data de manipulação e responsável
  DateTime _dataManipulacao = DateTime.now();

  // Estado de impressão
  bool _isPrinting = false;
  String? _responsavelSelecionado;
  StorageLocation? _localArmazenamentoSelecionado;

  // Lista de responsáveis será carregada do OperatorsProvider

  // Lista de unidades disponíveis
  final List<String> unidadesDisponiveis = ['KG', 'G', 'L', 'ML', 'UN'];

  // Lista de locais de armazenamento

  // Dados agora vêm da API através do CategoriesProductsProvider

  // Estados do wizard
  String _currentStep =
      'categorias'; // 'categorias', 'subcategorias', 'produtos', 'configuracao'
  String? _categoriaSelecionada;
  String? _subcategoriaSelecionada;
  Product? _produtoSelecionado;

  // Dados mockados para demonstração - estrutura multinível
  final List<Map<String, dynamic>> categoriasManipulado = [
    {
      'id': 'massas',
      'nome': 'Massas',
      'cor': Colors.blue,
      'subcategorias': [
        {
          'id': 'massas-pao',
          'nome': 'Massas de Pão',
          'produtos': [
            {'id': 'mp1', 'nome': 'Massa de Pão Francês', 'codigo': 'MP001'},
            {'id': 'mp2', 'nome': 'Massa de Pão de Leite', 'codigo': 'MP002'},
            {'id': 'mp3', 'nome': 'Massa de Pão Integral', 'codigo': 'MP003'},
          ],
        },
        {
          'id': 'massas-bolo',
          'nome': 'Massas de Bolo',
          'produtos': [
            {
              'id': 'mb1',
              'nome': 'Massa de Bolo de Chocolate',
              'codigo': 'MB001',
            },
            {
              'id': 'mb2',
              'nome': 'Massa de Bolo de Baunilha',
              'codigo': 'MB002',
            },
          ],
        },
        {
          'id': 'massas-biscoito',
          'nome': 'Massas de Biscoito',
          'produtos': [
            {
              'id': 'mb3',
              'nome': 'Massa de Biscoito Amanteigado',
              'codigo': 'MB003',
            },
          ],
        },
      ],
    },
    {
      'id': 'recheios',
      'nome': 'Recheios',
      'cor': Colors.green,
      'subcategorias': [
        {
          'id': 'recheios-doces',
          'nome': 'Recheios Doces',
          'produtos': [
            {'id': 'rd1', 'nome': 'Recheio de Chocolate', 'codigo': 'RD001'},
            {'id': 'rd2', 'nome': 'Recheio de Baunilha', 'codigo': 'RD002'},
          ],
        },
        {
          'id': 'recheios-salgados',
          'nome': 'Recheios Salgados',
          'produtos': [
            {'id': 'rs1', 'nome': 'Recheio de Frango', 'codigo': 'RS001'},
            {'id': 'rs2', 'nome': 'Recheio de Queijo', 'codigo': 'RS002'},
          ],
        },
      ],
    },
    {
      'id': 'coberturas',
      'nome': 'Coberturas',
      'cor': Colors.orange,
      'subcategorias': [
        {
          'id': 'coberturas-doces',
          'nome': 'Coberturas Doces',
          'produtos': [
            {'id': 'cd1', 'nome': 'Cobertura de Chocolate', 'codigo': 'CD001'},
            {'id': 'cd2', 'nome': 'Cobertura de Baunilha', 'codigo': 'CD002'},
            {'id': 'cd3', 'nome': 'Cobertura de Morango', 'codigo': 'CD003'},
          ],
        },
      ],
    },
  ];

  @override
  void initState() {
    super.initState();
    print('🚀 ManipuladoScreen initState');

    // Inicializar data de manipulação com data atual
    _dataManipulacaoController.text =
        '${_dataManipulacao.day.toString().padLeft(2, '0')}/${_dataManipulacao.month.toString().padLeft(2, '0')}/${_dataManipulacao.year}';

    // ✅ Adicionar listeners para campos de indústria
    _loteIndustriaController.addListener(() {
      print('📦 Lote mudou: "${_loteIndustriaController.text}"');
      if (mounted) setState(() {});
    });
    _dataVencimentoIndustriaController.addListener(() {
      print(
        '📅 Data vencimento mudou: "${_dataVencimentoIndustriaController.text}"',
      );
      if (mounted) setState(() {});
    });

    // ⭐ NOVO: Listener para atualizar responsável quando operador da sessão mudar
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final operatorSessionProvider = context.read<OperatorSessionProvider>();
      operatorSessionProvider.addListener(_onOperatorSessionChanged);
      
      // Verificar se já há operador logado
      final currentOperator = operatorSessionProvider.currentOperator;
      if (currentOperator != null && _responsavelSelecionado == null) {
        setState(() {
          _responsavelSelecionado = currentOperator.name;
        });
        print('✅ Responsável inicializado: ${currentOperator.name}');
      }
    });

    // Carregar dados da API
    _loadDataFromAPI();
  }

  // ⭐ NOVO: Callback para quando o operador da sessão mudar
  void _onOperatorSessionChanged() {
    if (!mounted) return;
    
    final operatorSessionProvider = context.read<OperatorSessionProvider>();
    final currentOperator = operatorSessionProvider.currentOperator;
    
    if (currentOperator != null && _responsavelSelecionado != currentOperator.name) {
      setState(() {
        _responsavelSelecionado = currentOperator.name;
      });
      print('✅ Responsável atualizado para: ${currentOperator.name}');
    }
  }

  Future<void> _loadDataFromAPI() async {
    print('🔄 _loadDataFromAPI iniciado');
    final authProvider = context.read<AuthProvider>();
    final categoriesProductsProvider = context
        .read<CategoriesProductsProvider>();
    final storageLocationsProvider = context.read<StorageLocationsProvider>();
    final operatorsProvider = context.read<OperatorsProvider>();

    // Limpar erros anteriores antes de carregar
    categoriesProductsProvider.clearError();

    print('🔐 isAuthenticated: ${authProvider.isAuthenticated}');

    // Conectar providers para usar configuração manual de impressoras
    final tagmentProvider = context.read<PrintProvider>();
    final configProvider = context.read<TagmentPrinterConfigProvider>();
    tagmentProvider.setPrinterConfigProvider(configProvider);

    // Carregar impressoras e configuração se autenticado
    if (authProvider.isAuthenticated) {
      final token = await authProvider.authToken;
      print('🔑 Token obtido: ${token != null ? 'SIM' : 'NÃO'}');
      if (token != null) {
        // Configurar API Key do cliente
        await tagmentProvider.configurarApiKeyDoCliente(
          authProvider.user!.clientId,
          token,
        );

        // Carregar impressoras (otimizado - usa cache se disponível)
        if (tagmentProvider.impressoras.isEmpty) {
          await tagmentProvider.carregarImpressoras();
        }

        // Carregar configuração de impressoras
        print('🔧 Carregando configuração de impressoras...');
        await configProvider.loadConfig();
        print('🔧 Configuração carregada: ${configProvider.config}');
        print(
          '🔧 Tem impressora de validade: ${configProvider.hasValidadePrinter}',
        );
        print(
          '🔧 ID da impressora de validade: ${configProvider.getValidadePrinterId()}',
        );
      }
    }

    if (authProvider.isAuthenticated) {
      final token = await authProvider.authToken;
      print(
        '🌐 Carregando dados da API com token: ${token != null ? 'SIM' : 'NÃO'}',
      );

      try {
        final clientId = authProvider.user?.clientId;
        await Future.wait([
          categoriesProductsProvider.loadAll(token: token, clientId: clientId),
          storageLocationsProvider.loadStorageLocations(activeOnly: true),
          operatorsProvider.loadOperators(), // Carregar operadores com cache
        ]);

        print('✅ Dados carregados com sucesso');
        print(
          '📊 Categorias carregadas: ${categoriesProductsProvider.categories.length}',
        );
        print(
          '📊 Produtos carregados: ${categoriesProductsProvider.products.length}',
        );

        // Pré-selecionar o operador logado (da sessão) se disponível
        final operatorSessionProvider = context.read<OperatorSessionProvider>();
        final currentOperator = operatorSessionProvider.currentOperator;
        
        if (currentOperator != null) {
          // Usar o operador logado da sessão
          setState(() {
            _responsavelSelecionado = currentOperator.name;
          });
          print('✅ Responsável pré-selecionado: ${currentOperator.name} (operador logado)');
        } else if (_responsavelSelecionado == null && operatorsProvider.activeOperators.isNotEmpty) {
          // Fallback: usar o primeiro operador ativo se não houver operador logado
          setState(() {
            _responsavelSelecionado = operatorsProvider.activeOperators.first.name;
          });
          print('⚠️ Nenhum operador logado, usando primeiro operador ativo: $_responsavelSelecionado');
        }
      } catch (e) {
        print('❌ Erro ao carregar dados: $e');
      }
    } else {
      print('❌ Usuário não autenticado - não carregando dados');
    }
  }

  /// Função para refresh dos dados (usado no pull-to-refresh)
  Future<void> _refreshData() async {
    final authProvider = context.read<AuthProvider>();
    final categoriesProductsProvider = context
        .read<CategoriesProductsProvider>();
    final storageLocationsProvider = context.read<StorageLocationsProvider>();
    final operatorsProvider = context.read<OperatorsProvider>();

    final token = await authProvider.authToken;
    if (token == null) return;

    try {
      final clientId = authProvider.user?.clientId;
      await Future.wait([
        categoriesProductsProvider.loadAll(
          token: token,
          clientId: clientId,
          forceRefresh: true,
        ),
        storageLocationsProvider.loadStorageLocations(activeOnly: true),
        operatorsProvider.loadOperators(forceRefresh: true),
      ]);

      print('🔄 Dados atualizados com sucesso via pull-to-refresh');
    } catch (e) {
      print('❌ Erro ao atualizar dados via pull-to-refresh: $e');
    }
  }

  // Widget helper para breadcrumb clicável
  Widget _buildBreadcrumb() {
    if (_currentStep == 'subcategorias' && _categoriaSelecionada != null) {
      // Usar dados da API em vez dos dados mock
      final categoriesProductsProvider = context
          .read<CategoriesProductsProvider>();
      final categoria = categoriesProductsProvider.getCategoryById(
        _categoriaSelecionada!,
      );

      if (categoria == null) {
        return const SizedBox.shrink();
      }

      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
        child: Row(
          children: [
            GestureDetector(
              onTap: () {
                setState(() {
                  _currentStep = 'categorias';
                  _categoriaSelecionada = null;
                });
              },
              child: Text(
                'Categorias',
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.primary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            Text(
              ' > ${categoria.name}',
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.dark300,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    } else if (_currentStep == 'produtos' &&
        _categoriaSelecionada != null &&
        _subcategoriaSelecionada != null) {
      // Usar dados da API em vez dos dados mock
      final categoriesProductsProvider = context
          .read<CategoriesProductsProvider>();
      final categoria = categoriesProductsProvider.getCategoryById(
        _categoriaSelecionada!,
      );

      if (categoria == null) {
        return const SizedBox.shrink();
      }

      final subcategorias = categoriesProductsProvider.getSubcategories(
        _categoriaSelecionada!,
      );
      final subcategoria = subcategorias.isNotEmpty
          ? subcategorias.firstWhere(
              (sub) => sub.id == _subcategoriaSelecionada,
              orElse: () => subcategorias.first,
            )
          : null;

      if (subcategoria == null) {
        return const SizedBox.shrink();
      }

      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
        child: Row(
          children: [
            GestureDetector(
              onTap: () {
                setState(() {
                  _currentStep = 'categorias';
                  _categoriaSelecionada = null;
                  _subcategoriaSelecionada = null;
                });
              },
              child: Text(
                'Categorias',
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.primary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            Text(
              ' > ',
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.dark300,
                fontWeight: FontWeight.w500,
              ),
            ),
            GestureDetector(
              onTap: () {
                setState(() {
                  _currentStep = 'subcategorias';
                  _subcategoriaSelecionada = null;
                });
              },
              child: Text(
                categoria.name,
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.primary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            Text(
              ' > ${subcategoria.name}',
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.dark300,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    } else if (_currentStep == 'produtos' &&
        _categoriaSelecionada != null &&
        _subcategoriaSelecionada == null) {
      // Produtos diretamente de uma categoria (sem subcategoria)
      final categoriesProductsProvider = context
          .read<CategoriesProductsProvider>();
      final categoria = categoriesProductsProvider.getCategoryById(
        _categoriaSelecionada!,
      );

      if (categoria == null) {
        return const SizedBox.shrink();
      }

      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
        child: Row(
          children: [
            GestureDetector(
              onTap: () {
                setState(() {
                  _currentStep = 'categorias';
                  _categoriaSelecionada = null;
                });
              },
              child: Text(
                'Categorias',
                style: TextStyle(
                  fontSize: 14,
                  color: AppTheme.primary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            Text(
              ' > ${categoria.name}',
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.dark300,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    } else if (_currentStep == 'configuracao' && _produtoSelecionado != null) {
      // Usar dados da API em vez dos dados mock
      final categoriesProductsProvider = context
          .read<CategoriesProductsProvider>();
      final categoria = categoriesProductsProvider.getCategoryById(
        _categoriaSelecionada!,
      );

      if (categoria == null) {
        return const SizedBox.shrink();
      }

      // Verificar se tem subcategoria
      final subcategorias = categoriesProductsProvider.getSubcategories(
        _categoriaSelecionada!,
      );
      final temSubcategoria = _subcategoriaSelecionada != null && subcategorias.isNotEmpty;
      final subcategoria = temSubcategoria
          ? subcategorias.firstWhere(
              (sub) => sub.id == _subcategoriaSelecionada,
              orElse: () => subcategorias.first,
            )
          : null;

      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Breadcrumb de navegação
            Row(
              children: [
                GestureDetector(
                  onTap: () {
                    setState(() {
                      _currentStep = 'categorias';
                      _categoriaSelecionada = null;
                      _subcategoriaSelecionada = null;
                      _produtoSelecionado = null;
                    });
                  },
                  child: Text(
                    'Categorias',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.primary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                Text(
                  ' > ',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppTheme.dark300,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (temSubcategoria && subcategoria != null) ...[
                  // Se tem subcategoria, categoria não é clicável, só mostra
                  Text(
                    categoria.name,
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.dark300,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    ' > ',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.dark300,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        _currentStep = 'produtos';
                        _produtoSelecionado = null;
                        // Manter _categoriaSelecionada e _subcategoriaSelecionada
                      });
                    },
                    child: Text(
                      subcategoria.name,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppTheme.primary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ] else ...[
                  // Se não tem subcategoria, categoria é clicável
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        _currentStep = 'produtos';
                        _produtoSelecionado = null;
                        // Manter _categoriaSelecionada
                      });
                    },
                    child: Text(
                      categoria.name,
                      style: TextStyle(
                        fontSize: 14,
                        color: AppTheme.primary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
                Text(
                  ' > Configurar',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppTheme.dark300,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            // Nome do produto removido daqui pois já existe no header
          ],
        ),
      );
    }

    // Só mostra o breadcrumb se não estiver na tela inicial
    return const SizedBox.shrink();
  }

  @override
  void dispose() {
    // ⭐ NOVO: Remover listener do OperatorSessionProvider
    try {
      context.read<OperatorSessionProvider>().removeListener(_onOperatorSessionChanged);
    } catch (_) {}
    
    _codigoController.dispose();
    _nomeController.dispose();
    _dataValidadeController.dispose();
    _dataManipulacaoController.dispose();
    _loteIndustriaController.dispose();
    _dataVencimentoIndustriaController.dispose();
    _quantidadeController.dispose();
    _marcaController.dispose();
    _sifController.dispose();
    super.dispose();
  }

  void _incrementarQuantidade() {
    setState(() {
      _quantidade++;
      _quantidadeController.text = _quantidade.toString();
    });
  }

  void _decrementarQuantidade() {
    if (_quantidade > 1) {
      setState(() {
        _quantidade--;
        _quantidadeController.text = _quantidade.toString();
      });
    }
  }

  void _incrementarQuantidadeEtiquetas() {
    setState(() {
      final currentValue =
          int.tryParse(_quantidadeEtiquetasController.text) ?? 1;
      final newValue = currentValue + 1;
      _quantidadeEtiquetasController.text = newValue.toString();
    });
  }

  void _decrementarQuantidadeEtiquetas() {
    setState(() {
      final currentValue =
          int.tryParse(_quantidadeEtiquetasController.text) ?? 1;
      if (currentValue > 1) {
        final newValue = currentValue - 1;
        _quantidadeEtiquetasController.text = newValue.toString();
      }
    });
  }

  void _onQuantidadeEtiquetasChanged(String value) {
    setState(() {
      // Não permitir vazio ou zero
      if (value.isEmpty) {
        _quantidadeEtiquetasController.text = '1';
        _quantidadeEtiquetasController.selection = TextSelection.fromPosition(
          TextPosition(offset: _quantidadeEtiquetasController.text.length),
        );
        return;
      }

      final intValue = int.tryParse(value);
      if (intValue == null || intValue < 1) {
        _quantidadeEtiquetasController.text = '1';
        _quantidadeEtiquetasController.selection = TextSelection.fromPosition(
          TextPosition(offset: _quantidadeEtiquetasController.text.length),
        );
      }
    });
  }

  void _onQuantidadeChanged(String value) {
    final newQuantidade = int.tryParse(value) ?? 1;
    if (newQuantidade >= 1 && newQuantidade <= 999) {
      setState(() {
        _quantidade = newQuantidade;
      });
    }
  }

  void _selecionarConservacao(String conservacao) {
    setState(() {
      _conservacaoSelecionada = conservacao;
      _calcularDataValidade();
    });
  }

  /// Retorna todas as opções de conservação (disponíveis e indisponíveis) para o produto selecionado
  List<Map<String, dynamic>> _getOpcoesConservacaoDisponiveis() {
    if (_produtoSelecionado == null) return [];

    // ✅ DEBUG: Verificar valores dos campos de indústria
    print('🔍 DEBUG Ven. Original:');
    print(
      '  - Produto tem showExpiryDateOnLabel: ${_produtoSelecionado!.showExpiryDateOnLabel == true}',
    );
    print(
      '  - Valor showExpiryDateOnLabel: ${_produtoSelecionado!.showExpiryDateOnLabel}',
    );
    print('  - Lote preenchido: ${_loteIndustriaController.text.isNotEmpty}');
    print('  - Valor lote: "${_loteIndustriaController.text}"');
    print(
      '  - Data preenchida: ${_dataVencimentoIndustriaController.text.isNotEmpty}',
    );
    print('  - Valor data: "${_dataVencimentoIndustriaController.text}"');

    final opcoes = <Map<String, dynamic>>[];

    // Sempre mostrar todas as opções, mas marcar como disponível ou não
    opcoes.addAll([
      {
        'tipo': 'ambiente',
        'nome': 'Ambiente',
        'icone': PhosphorIcons.house,
        'dias': _produtoSelecionado!.shelfLifeAmbient,
        'disponivel':
            _produtoSelecionado!.shelfLifeAmbient != null &&
            _produtoSelecionado!.shelfLifeAmbient! > 0,
      },
      {
        'tipo': 'refrigerado',
        'nome': 'Refrigerado',
        'icone': PhosphorIcons.thermometer,
        'dias': _produtoSelecionado!.shelfLifeRefrigerated,
        'disponivel':
            _produtoSelecionado!.shelfLifeRefrigerated != null &&
            _produtoSelecionado!.shelfLifeRefrigerated! > 0,
      },
      {
        'tipo': 'congelado',
        'nome': 'Congelado',
        'icone': PhosphorIcons.snowflake,
        'dias': _produtoSelecionado!.shelfLifeFrozen,
        'disponivel':
            _produtoSelecionado!.shelfLifeFrozen != null &&
            _produtoSelecionado!.shelfLifeFrozen! > 0,
      },
      {
        'tipo': 'validade_original',
        'nome': 'Ven. Original',
        'icone': PhosphorIcons.calendar,
        'dias': null,
        'disponivel':
            _produtoSelecionado!.showExpiryDateOnLabel == true &&
            _dataVencimentoIndustriaController
                .text
                .isNotEmpty,
      },
    ]);

    final disponivelVenOriginal =
        _produtoSelecionado!.showExpiryDateOnLabel == true &&
        _dataVencimentoIndustriaController
            .text
            .isNotEmpty;
    print('  ➡️ Resultado disponível: $disponivelVenOriginal');

    return opcoes;
  }

  /// Formata o texto de dias (singular/plural)
  String _formatarDias(int dias) {
    return dias == 1 ? '1 dia' : '$dias dias';
  }

  void _calcularDataValidade() {
    if (_conservacaoSelecionada != null && _produtoSelecionado != null) {
      // ✅ VALIDADE ORIGINAL: Usar data que o usuário informou no campo "Data de Vencimento Original"
      if (_conservacaoSelecionada == 'validade_original') {
        if (_dataVencimentoIndustriaController.text.isNotEmpty) {
          // Converter de dd/MM/yyyy para DateTime
          final parts = _dataVencimentoIndustriaController.text.split('/');
          if (parts.length == 3) {
            _dataValidade = DateTime(
              int.parse(parts[2]),
              int.parse(parts[1]),
              int.parse(parts[0]),
            );
            _dataValidadeController.text =
                _dataVencimentoIndustriaController.text;
          }
        } else {
          _dataValidadeController.text = '';
        }
        return;
      }

      // Cálculo normal para outros tipos de conservação
      int? diasValidade;

      switch (_conservacaoSelecionada) {
        case 'ambiente':
          diasValidade = _produtoSelecionado!.shelfLifeAmbient;
          break;
        case 'refrigerado':
          diasValidade = _produtoSelecionado!.shelfLifeRefrigerated;
          break;
        case 'congelado':
          diasValidade = _produtoSelecionado!.shelfLifeFrozen;
          break;
      }

      // Se o produto não tem configuração para esse tipo de conservação, usar valor padrão
      if (diasValidade == null || diasValidade <= 0) {
        switch (_conservacaoSelecionada) {
          case 'ambiente':
            diasValidade = 7; // 7 dias padrão para ambiente
            break;
          case 'refrigerado':
            diasValidade = 30; // 30 dias padrão para refrigerado
            break;
          case 'congelado':
            diasValidade = 90; // 90 dias padrão para congelado
            break;
          default:
            diasValidade = 7;
        }
      }

      // ✅ CORREÇÃO: Usar data de manipulação como base (não DateTime.now())
      // Se diasValidade é 30, a validade é 30 dias APÓS a data de manipulação
      // Exemplo: manipulação 09/12 + 30 dias = validade 08/01 (não 09/01)
      _dataValidade = _dataManipulacao.add(Duration(days: diasValidade));
      _dataValidadeController.text =
          '${_dataValidade!.day.toString().padLeft(2, '0')}/${_dataValidade!.month.toString().padLeft(2, '0')}/${_dataValidade!.year}';
    }
  }

  Future<void> _selecionarDataValidade() async {
    final DateTime? data = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 30)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
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

    if (data != null) {
      setState(() {
        _dataValidade = data;
        _dataValidadeController.text =
            '${data.day.toString().padLeft(2, '0')}/${data.month.toString().padLeft(2, '0')}/${data.year}';
      });
    }
  }

  Future<void> _selecionarDataManipulacao() async {
    final DateTime? data = await showDatePicker(
      context: context,
      initialDate: _dataManipulacao,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
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

    if (data != null) {
      setState(() {
        _dataManipulacao = data;
        _dataManipulacaoController.text =
            '${data.day.toString().padLeft(2, '0')}/${data.month.toString().padLeft(2, '0')}/${data.year}';
      });
      // ✅ CORREÇÃO: Recalcular data de validade quando muda a data de manipulação
      _calcularDataValidade();
    }
  }

  Future<void> _selecionarDataVencimentoIndustria() async {
    print('📅 Abrindo date picker para vencimento indústria...');

    final DateTime? data = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(
        const Duration(days: 30),
      ), // ✅ CORRIGIDO: Data futura para vencimento
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(
        const Duration(days: 365 * 5),
      ), // ✅ Até 5 anos no futuro
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
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

    if (data != null) {
      print('✅ Data selecionada: ${data.day}/${data.month}/${data.year}');
      setState(() {
        _dataVencimentoIndustriaController.text =
            '${data.day.toString().padLeft(2, '0')}/${data.month.toString().padLeft(2, '0')}/${data.year}';
        print(
          '✅ Controller atualizado: ${_dataVencimentoIndustriaController.text}',
        );

        // ⭐ NOVO: Verificar se há apenas uma opção de conservação disponível após preencher data
        if (_produtoSelecionado != null) {
          final opcoesConservacao = _getOpcoesConservacaoDisponiveis();
          final opcoesDisponiveis = opcoesConservacao.where((opcao) => opcao['disponivel'] == true).toList();
          
          if (opcoesDisponiveis.length == 1 && _conservacaoSelecionada == null) {
            // Há apenas uma opção disponível e nenhuma está selecionada, selecionar automaticamente
            final tipoConservacao = opcoesDisponiveis[0]['tipo'] as String;
            _conservacaoSelecionada = tipoConservacao;
            _calcularDataValidade();
            print('✅ Tipo de conservação selecionado automaticamente após preencher data: $tipoConservacao');
          }
        }
      });
    } else {
      print('❌ Usuário cancelou seleção de data');
    }
  }

  Widget _buildProdutoGridItem(Product produto) {
    return GestureDetector(
      onTap: () => _selecionarProduto(produto),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.dark800,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: _produtoHover == produto.id ? Colors.green : AppTheme.dark700,
            width: _produtoHover == produto.id ? 2 : 1,
          ),
        ),
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Nome do produto com altura fixa para 3 linhas
                SizedBox(
                  height: 60, // Aproximadamente 3 linhas de texto
                  child: Text(
                    produto.name.toUpperCase(),
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      height: 1.2,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const Spacer(),
                // Ícones de conservação (todos verdes)
                Row(
                  children: [
                    if (produto.shelfLifeAmbient != null && produto.shelfLifeAmbient! > 0)
                      Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: Icon(PhosphorIcons.house, size: 18, color: AppTheme.primary),
                      ),
                    if (produto.shelfLifeRefrigerated != null && produto.shelfLifeRefrigerated! > 0)
                      Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: Icon(PhosphorIcons.thermometerCold, size: 18, color: AppTheme.primary),
                      ),
                    if (produto.shelfLifeFrozen != null && produto.shelfLifeFrozen! > 0)
                      Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: Icon(PhosphorIcons.snowflake, size: 18, color: AppTheme.primary),
                      ),
                  ],
                ),
              ],
            ),
            // Seta no lado direito para consistência
            Positioned(
              right: 0,
              bottom: 0,
              child: Icon(
                PhosphorIcons.arrowRight,
                color: AppTheme.primary.withOpacity(0.5),
                size: 18,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _selecionarCategoria(Category categoria) {
    final categoriesProductsProvider = context
        .read<CategoriesProductsProvider>();

    // Verificar se a categoria tem subcategorias
    final subcategorias = categoriesProductsProvider.getSubcategories(
      categoria.id,
    );

    // Verificar se a categoria tem produtos diretamente
    final produtos = categoriesProductsProvider.getProductsByCategory(
      categoria.id,
    );

    setState(() {
      _categoriaSelecionada = categoria.id;
      _categoriaHover = categoria.id;
      _subcategoriaSelecionada = null;
      _subcategoriaHover = null;
      _produtoSelecionado = null;
      _produtoHover = null;

      // Decidir o próximo passo baseado no que a categoria tem
      // Ajuste: se houver subcategorias OU produtos, ir para 'subcategorias' para exibir visão combinada
      if (subcategorias.isNotEmpty || produtos.isNotEmpty) {
        _currentStep = 'subcategorias';
      } else {
        // Não tem nem subcategorias nem produtos, mostra mensagem
        _currentStep = 'categoria_vazia';
      }
    });
  }

  void _selecionarSubcategoria(String subcategoriaId) {
    setState(() {
      _subcategoriaSelecionada = subcategoriaId;
      _produtoSelecionado = null;
      _currentStep = 'produtos';
    });
  }

  /// Navegar para a tela de etiqueta personalizada quando o produto tem customTemplateId
  void _navegarParaEtiquetaPersonalizada(Product produto, {String? templateIdOverride}) {
    // 🆕 Usar templateIdOverride se fornecido, senão usar do produto
    final templateId = templateIdOverride ?? produto.customTemplateId!;
    
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => EtiquetaPersonalizadaScreen(
          product: produto,
          templateId: templateId,
        ),
      ),
    );
  }

  void _selecionarProduto(Product produto) {
    print('🎯 _selecionarProduto chamado');
    print('🎯 Produto selecionado: ${produto.name} (${produto.code})');
    
    // 🏷️ Verificar se o produto é etiqueta personalizada (rótulo sem rastreabilidade)
    if (produto.isLabelOnly == true) {
      // 🆕 HIERARQUIA: Produto > Categoria
      String? templateId = produto.customTemplateId;
      
      // Se o produto não tem template, buscar da categoria
      if (templateId == null || templateId.isEmpty) {
        final categoriesProvider = context.read<CategoriesProductsProvider>();
        final categoria = categoriesProvider.categories.firstWhere(
          (c) => c.id == produto.categoryId,
          orElse: () => Category(
            id: '', name: '', clientId: '', isActive: false, 
            createdAt: DateTime.now(), updatedAt: DateTime.now(),
          ),
        );
        templateId = categoria.defaultTemplateId;
        print('🏷️ Template não encontrado no produto, usando da categoria: $templateId');
      }
      
      if (templateId != null && templateId.isNotEmpty) {
        print('🏷️ Produto é etiqueta personalizada: $templateId');
        _navegarParaEtiquetaPersonalizada(produto, templateIdOverride: templateId);
        return;
      } else {
        print('⚠️ Produto é etiqueta personalizada mas não tem template configurado');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Este produto não tem template configurado. Configure no produto ou na categoria.'),
            backgroundColor: Colors.orange,
          ),
        );
        return;
      }
    }

    setState(() {
      _produtoSelecionado = produto;
      _currentStep = 'configuracao';
    });

    // Preencher automaticamente o código e nome do produto
    _codigoController.text = produto.code ?? '';
    _nomeController.text = produto.name;

    // Preencher peso e unidade se disponíveis
    if (produto.weight != null && produto.weight!.isNotEmpty) {
      _pesoController.text = produto.weight!;
    }

    if (produto.weightUnit != null && produto.weightUnit!.isNotEmpty) {
      _unidadeSelecionada = produto.weightUnit!
          .toUpperCase(); // ⭐ Converter para maiúsculo
    }

    // Preencher quantidade se disponível
    if (produto.quantity != null && produto.quantity!.isNotEmpty) {
      _quantidade = int.tryParse(produto.quantity!) ?? 1;
      _quantidadeController.text = _quantidade.toString();
    }

    // Preencher marca e SIF se disponíveis (sempre preencher se o produto tiver os campos, mesmo vazios)
    _marcaController.text = produto.brand ?? '';
    _sifController.text = produto.sif ?? '';

    // Definir local de armazenamento padrão se o produto tiver um configurado
    if (produto.defaultStorageLocationId != null) {
      final storageProvider = context.read<StorageLocationsProvider>();
      final localPadrao = storageProvider.getStorageLocationById(
        produto.defaultStorageLocationId,
      );
      if (localPadrao != null) {
        setState(() {
          _localArmazenamentoSelecionado = localPadrao;
        });
        print('🏠 Local de armazenamento padrão definido: ${localPadrao.nome}');
      }
    }

    // ⭐ NOVO: Selecionar automaticamente tipo de conservação se houver apenas uma opção
    final opcoesConservacao = _getOpcoesConservacaoDisponiveis();
    final opcoesDisponiveis = opcoesConservacao.where((opcao) => opcao['disponivel'] == true).toList();
    
    if (opcoesDisponiveis.length == 1) {
      // Há apenas uma opção disponível, selecionar automaticamente
      final tipoConservacao = opcoesDisponiveis[0]['tipo'] as String;
      setState(() {
        _conservacaoSelecionada = tipoConservacao;
      });
      _calcularDataValidade();
      print('✅ Tipo de conservação selecionado automaticamente: $tipoConservacao');
    } else {
      // Limpar seleção se houver múltiplas opções ou nenhuma
      setState(() {
        _conservacaoSelecionada = null;
      });
    }

    print('🎯 _currentStep definido como: $_currentStep');
    print('🎯 _produtoSelecionado definido como: $_produtoSelecionado');
    print('🎯 Peso preenchido: ${_pesoController.text}');
    print('🎯 Unidade preenchida: $_unidadeSelecionada');
    print('🎯 Quantidade preenchida: $_quantidade');
  }

  void _voltar() {
    setState(() {
      if (_currentStep == 'subcategorias') {
        _currentStep = 'categorias';
        _categoriaSelecionada = null;
      } else if (_currentStep == 'produtos') {
        // Verificar se há subcategorias antes de voltar para elas
        if (_categoriaSelecionada != null) {
          final categoriesProductsProvider = context
              .read<CategoriesProductsProvider>();
          final subcategorias = categoriesProductsProvider.getSubcategories(
            _categoriaSelecionada!,
          );

          if (subcategorias.isNotEmpty) {
            // Tem subcategorias, volta para subcategorias
            _currentStep = 'subcategorias';
            _subcategoriaSelecionada = null;
          } else {
            // Não tem subcategorias, volta direto para categorias
            _currentStep = 'categorias';
            _categoriaSelecionada = null;
            _subcategoriaSelecionada = null;
          }
        } else {
          // Fallback: volta para categorias
          _currentStep = 'categorias';
          _categoriaSelecionada = null;
          _subcategoriaSelecionada = null;
        }
      } else if (_currentStep == 'configuracao') {
        _currentStep = 'produtos';
        _produtoSelecionado = null;
      } else if (_currentStep == 'categoria_vazia') {
        _currentStep = 'categorias';
        _categoriaSelecionada = null;
      }
    });
  }

  Future<void> _imprimirEtiqueta() async {
    final t0 = DateTime.now();
    print('⏱️ [T+0ms] 🔘 INÍCIO _imprimirEtiqueta (Manipulado)');

    String? erro = _validarCampos();
    if (erro != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(erro),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 4),
        ),
      );
      return;
    }
    print(
      '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] Validações OK',
    );

    final tagmentProvider = context.read<PrintProvider>();
    final operationsProvider = context.read<OperationsProvider>();
    final authProvider = context.read<AuthProvider>();

    // Obter clientId/token
    final currentClientId = authProvider.user?.clientId;
    final token = await authProvider.authToken;
    print(
      '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] Auth obtido',
    );

    // Configurar API Key (se necessário)
    if (tagmentProvider.apiKeyAtual == null ||
        tagmentProvider.apiKeyAtual!.isEmpty) {
      if (currentClientId != null && token != null) {
        print(
          '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] Configurando API Key...',
        );
        final configurado = await tagmentProvider.configurarApiKeyDoCliente(
          currentClientId,
          token,
        );
        print(
          '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] API Key: $configurado',
        );
      }
    }

    // ⭐ OTIMIZADO: Usar cache de impressoras
    if (tagmentProvider.impressoras.isEmpty) {
      print(
        '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] Carregando impressoras...',
      );
      await tagmentProvider.carregarImpressoras(
        locationId: null,
        forceRefresh: true,
        token: token,
        clientId: currentClientId,
      );
      print(
        '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] Impressoras carregadas',
      );
    } else {
      print(
        '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] Usando cache (${tagmentProvider.impressoras.length} impressoras)',
      );
    }

    print(
      '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] ⚡ Abrindo modal...',
    );

    // ⭐ ABRIR MODAL PRIMEIRO, processar dentro
    final result = await showPrintModal(
      context: context,
      title: 'Imprimindo Etiqueta',
      subtitle: _nomeController.text,
      printFunction: (onProgress) async {
        print(
          '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] 📋 Processando dentro do modal...',
        );

        // Obter impressora
        final categoriesProvider = context.read<CategoriesProductsProvider>();
        final category = _produtoSelecionado?.categoryId != null
            ? categoriesProvider.getCategoryById(
                _produtoSelecionado!.categoryId!,
              )
            : null;

        print('🖨️ [ManipuladoScreen] Buscando impressora:');
        print('   Produto: ${_produtoSelecionado?.name}');
        print('   Produto defaultPrinterId: ${_produtoSelecionado?.defaultPrinterId}');
        print('   Categoria: ${category?.name}');
        print('   Categoria defaultPrinterId: ${category?.defaultPrinterId}');

        final printerInfo = await tagmentProvider.obterImpressoraValidade(
          null,
          defaultPrinterId: _produtoSelecionado?.defaultPrinterId,
          categoryDefaultPrinterId: category?.defaultPrinterId,
        );
        
        print('   ✅ Impressora selecionada: ${printerInfo?.displayName} (ID: ${printerInfo?.id})');

        if (printerInfo == null) {
          throw Exception('❌ Nenhuma impressora de validade online encontrada');
        }

        // Obter offsets
        final offsets = tagmentProvider.obterOffsetsImpressora(printerInfo);

        // Preparar dados do template
        final dateConfigProvider = Provider.of<DateConfigProvider>(
          context,
          listen: false,
        );
        // ⭐ NOVO: Usar configuração do produto se definida, senão usa global
        final showTimeInDates = _produtoSelecionado?.showTimeOnLabel ?? dateConfigProvider.showTimeInDates;

        String formatarDataComHorario(String data, {bool forceNoTime = false}) {
          if (showTimeInDates && !forceNoTime) {
            final now = DateTime.now();
            final hora =
                '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
            return '$data $hora';
          }
          return data;
        }

        String montarLabelValidade() {
          if (_conservacaoSelecionada == null) return '';
          switch (_conservacaoSelecionada) {
            case 'ambiente':
              return 'VALIDADE T. AMBIENTE';
            case 'refrigerado':
              return 'VALIDADE REFRIGERADO';
            case 'congelado':
              return 'VALIDADE CONGELADO';
            case 'validade_original':
              return 'VALIDADE';
            default:
              return 'VALIDADE T. AMBIENTE';
          }
        }

        final isValidadeOriginal =
            _conservacaoSelecionada == 'validade_original';
        
        // ⭐ Hierarquia: produto > categoria > cliente > fallback GranoBox
        String? templateId = _produtoSelecionado?.customTemplateId;
        
        if (templateId == null || templateId.isEmpty) {
          templateId = category?.defaultTemplateId;
        }
        
        // 3. Template padrão do CLIENTE
        if ((templateId == null || templateId.isEmpty) && currentClientId != null && token != null) {
          try {
            print('🔍 [DEBUG] Buscando template padrão do cliente...');
            print('   - Client ID: $currentClientId');
            print('   - Label Type: validity');
            
            final api = GranoboxApiService();
            final clientTemplateId = await api.getDefaultTemplateId(
              clientId: currentClientId!,
              labelType: 'validity',
              authToken: token,
            );
            
            if (clientTemplateId != null && clientTemplateId.isNotEmpty) {
              templateId = clientTemplateId;
              print('✅ [DEBUG] Template padrão do cliente encontrado: $templateId');
            } else {
              print('ℹ️ [DEBUG] Template padrão do cliente não configurado');
            }
          } catch (e, stackTrace) {
            print('⚠️ Falha ao buscar template padrão do cliente: $e');
            print('   Stack trace: $stackTrace');
          }
        }
        
        // 4. Fallback: Template GranoBox padrão
        templateId ??= '1c12926f-849b-4bd7-8a61-05036f39f443';
        print('🧩 Template final selecionado: $templateId');

        final templateData = {
          'nome_produto': _nomeController.text,
          'marca': (_produtoSelecionado?.showBrandOnLabel == true)
              ? (_marcaController.text.isNotEmpty ? _marcaController.text : '')
              : '',
          'sif': (_produtoSelecionado?.showSifOnLabel == true)
              ? _sifController.text.isNotEmpty
                    ? _sifController.text
                    : (_produtoSelecionado?.code ?? _codigoController.text)
              : '',
          'emb_original': formatarDataComHorario(
            _dataManipulacaoController.text,
          ),
          'manipulacao': formatarDataComHorario(
            _dataManipulacaoController.text,
          ),
          'validade': formatarDataComHorario(
            _dataValidadeController.text,
            forceNoTime: isValidadeOriginal,
          ),
          'qtd_peso': _pesoController.text.isNotEmpty
              ? '${_pesoController.text}${_unidadeSelecionada}'
              : '',
          'responsavel': _responsavelSelecionado ?? '',
          'armazenamento': _localArmazenamentoSelecionado?.nome ?? '',
          'label_validade': montarLabelValidade(),
          'codigo': _produtoSelecionado?.code ?? _codigoController.text,
          'lote_industria': isValidadeOriginal
              ? ''
              : _loteIndustriaController.text,
          'data_vencimento_industria': isValidadeOriginal
              ? ''
              : _dataVencimentoIndustriaController.text,
        };

        String toIsoDate(String value) {
          if (value.isEmpty)
            return DateTime.now().toIso8601String().split('T')[0];
          final parts = value.split(' ');
          final datePart = parts.first;
          if (datePart.contains('/')) {
            final dp = datePart.split('/');
            if (dp.length == 3) {
              return '${dp[2]}-${dp[1].padLeft(2, '0')}-${dp[0].padLeft(2, '0')}';
            }
          }
          try {
            final dt = DateTime.parse(datePart);
            return dt.toIso8601String().split('T')[0];
          } catch (_) {
            return DateTime.now().toIso8601String().split('T')[0];
          }
        }

        print(
          '⏱️ [T+${DateTime.now().difference(t0).inMilliseconds}ms] 🖨️ Chamando imprimirComTemplate...',
        );

        // Converter datas
        String convertToIsoDate(String value) {
          if (value.isEmpty)
            return DateTime.now().toIso8601String().split('T')[0];
          final parts = value.split(' ');
          final datePart = parts.first;
          if (datePart.contains('/')) {
            final dp = datePart.split('/');
            if (dp.length == 3) {
              return '${dp[2]}-${dp[1].padLeft(2, '0')}-${dp[0].padLeft(2, '0')}';
            }
          }
          try {
            final dt = DateTime.parse(datePart);
            return dt.toIso8601String().split('T')[0];
          } catch (_) {
            return DateTime.now().toIso8601String().split('T')[0];
          }
        }

        return tagmentProvider.imprimirComTemplate(
          printer: printerInfo,
          templateId: templateId,
          templateData: templateData,
          copies: int.tryParse(_quantidadeEtiquetasController.text) ?? 1,
          clientId: currentClientId,
          authToken: token,
          productId: _produtoSelecionado?.id,
          storageLocationId: _localArmazenamentoSelecionado?.id,
          conservacao: _conservacaoSelecionada,
          productionDate: convertToIsoDate(_dataManipulacaoController.text),
          validityDate: convertToIsoDate(_dataValidadeController.text),
          manufacturingBatch: _loteIndustriaController.text.isNotEmpty
              ? _loteIndustriaController.text
              : null,
          expiryDate: _dataVencimentoIndustriaController.text.isNotEmpty
              ? convertToIsoDate(_dataVencimentoIndustriaController.text)
              : null,
          operationId: operationsProvider.selectedOperation?.id,
          isLabelOnly: _produtoSelecionado?.isLabelOnly ?? false,
          onProgress: onProgress, // ⭐ CORREÇÃO: Passar callback de progresso
        );
      },
      onSuccess: () {
        _limparCampos();
        // Resetar quantidade de etiquetas para 1 após sucesso
        try {
          _quantidadeEtiquetasController.text = '1';
        } catch (_) {}
        // Feedback já exibido pelo modal de impressão.
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
        // Mensagem de erro já exibida pelo modal de impressão.
      }
    }

    print(
      '🖨️ Resultado da impressão: ${result?.success} - ${result?.message}',
    );
  }

  String? _validarCampos() {
    // Apenas tipo de conservação é obrigatório
    // A data de validade é preenchida automaticamente
    if (_conservacaoSelecionada == null) {
      return 'Selecione o tipo de conservação para continuar';
    }

    return null;
  }

  void _mostrarModalSelecionarResponsavel() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        title: const Text(
          'Selecionar Responsável',
          style: TextStyle(color: Colors.white),
        ),
        content: SizedBox(
          width: 400,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Lista de responsáveis
              ...context.read<OperatorsProvider>().activeOperators.map<Widget>((
                operador,
              ) {
                final isSelecionado = operador.name == _responsavelSelecionado;
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: Icon(
                      isSelecionado
                          ? PhosphorIcons.checkCircle
                          : PhosphorIcons.user,
                      color: isSelecionado ? Colors.green : AppTheme.primary,
                      size: 24,
                    ),
                    title: Text(
                      operador.name,
                      style: TextStyle(
                        color: isSelecionado ? Colors.green : Colors.white,
                        fontWeight: isSelecionado
                            ? FontWeight.bold
                            : FontWeight.normal,
                      ),
                    ),
                    subtitle: isSelecionado
                        ? const Text(
                            'Responsável Selecionado',
                            style: TextStyle(color: Colors.green),
                          )
                        : null,
                    onTap: () {
                      setState(() {
                        _responsavelSelecionado = operador.name;
                      });
                      Navigator.pop(context);
                    },
                    tileColor: isSelecionado ? AppTheme.dark700 : null,
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

  void _mostrarSelecaoLocalArmazenamento() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.dark800,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
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
            const Text(
              'Selecionar Local de Armazenamento',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 20),

            // Lista de locais usando Consumer
            Consumer<StorageLocationsProvider>(
              builder: (context, storageLocationsProvider, child) {
                final storageLocations =
                    storageLocationsProvider.storageLocations;

                if (storageLocations.isEmpty) {
                  return const Padding(
                    padding: EdgeInsets.all(20),
                    child: Text(
                      'Nenhum local de armazenamento encontrado',
                      style: TextStyle(color: AppTheme.dark300, fontSize: 16),
                    ),
                  );
                }

                return Column(
                  children: storageLocations.map<Widget>((location) {
                    final isSelecionado =
                        location.id == _localArmazenamentoSelecionado?.id;
                    final icon = _getIconForLocationType(location.tipo.value);
                    final color = _getColorForLocationType(location.tipo.value);

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(25),
                          ),
                          child: Icon(icon, color: color, size: 24),
                        ),
                        title: Text(
                          location.nome,
                          style: TextStyle(
                            color: isSelecionado ? color : Colors.white,
                            fontWeight: isSelecionado
                                ? FontWeight.bold
                                : FontWeight.normal,
                            fontSize: 16,
                          ),
                        ),
                        subtitle: Text(
                          location.descricao ?? location.tipo.displayName,
                          style: TextStyle(
                            color: AppTheme.dark300,
                            fontSize: 14,
                          ),
                        ),
                        trailing: isSelecionado
                            ? Icon(
                                PhosphorIcons.checkCircle,
                                color: color,
                                size: 24,
                              )
                            : null,
                        onTap: () {
                          setState(() {
                            _localArmazenamentoSelecionado = location;
                          });
                          Navigator.pop(context);
                        },
                        tileColor: isSelecionado
                            ? color.withOpacity(0.1)
                            : null,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(
                            color: isSelecionado ? color : AppTheme.dark600,
                            width: isSelecionado ? 2 : 1,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                );
              },
            ),

            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  // Métodos auxiliares para locais de armazenamento
  IconData _getIconForLocationType(String tipo) {
    switch (tipo.toLowerCase()) {
      case 'geladeira':
        return PhosphorIcons.thermometer;
      case 'freezer':
        return PhosphorIcons.snowflake;
      case 'prateleira':
        return PhosphorIcons.package;
      case 'estoque':
        return PhosphorIcons.house;
      case 'balcao':
        return PhosphorIcons.storefront;
      case 'outro':
      default:
        return PhosphorIcons.mapPin;
    }
  }

  Color _getColorForLocationType(String tipo) {
    switch (tipo.toLowerCase()) {
      case 'geladeira':
        return Colors.blue;
      case 'freezer':
        return Colors.cyan;
      case 'prateleira':
        return Colors.amber;
      case 'estoque':
        return Colors.grey;
      case 'balcao':
        return Colors.green;
      case 'outro':
      default:
        return Colors.purple;
    }
  }

  void _limparCampos() {
    setState(() {
      // Limpar apenas campos específicos do produto
      _codigoController.clear();
      _nomeController.clear();
      _dataValidadeController.clear();
      _dataValidade = null;
      _quantidade = 1;
      _quantidadeController.text = '1';
      _conservacaoSelecionada = null;
      _categoriaSelecionada = null;
      _subcategoriaSelecionada = null;
      _produtoSelecionado = null;
      _currentStep = 'categorias';
      _pesoController.clear();
      _unidadeSelecionada = 'KG';

      // MANTER: Responsável, Data de Manipulação, Local de Armazenamento
      // Esses campos fazem sentido persistir entre impressões
      // _responsavelSelecionado - MANTIDO
      // _dataManipulacao - MANTIDO
      // _localArmazenamentoSelecionado - MANTIDO
      // _dataManipulacaoController.text - MANTIDO

      // LIMPAR: Informações da Indústria (Lote e Data de Vencimento)
      // Cada produto tem seu próprio lote e data de vencimento
      _loteIndustriaController.clear();
      _dataVencimentoIndustriaController.clear();
    });
  }

  Widget _buildCategorias() {
    return Consumer<CategoriesProductsProvider>(
      builder: (context, categoriesProductsProvider, child) {
        final rootCategories = categoriesProductsProvider.rootCategories;

        // Se está carregando OU nunca carregou, mostrar loading
        if (categoriesProductsProvider.isLoading ||
            !categoriesProductsProvider.hasLoadedInitially) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary),
                ),
                SizedBox(height: 16),
                ResponsiveText(
                  'Carregando categorias...',
                  fontSize: 16,
                  color: AppTheme.dark300,
                ),
              ],
            ),
          );
        }

        return Column(
          children: [
            // Header fixo
            Container(
              width: double.infinity,
              color: AppTheme.dark900,
              padding: const EdgeInsets.symmetric(
                horizontal: 20.0,
                vertical: 10.0,
              ),
              child: Row(
                children: [
                  // Botão voltar
                  HeaderButton(
                    iconPath: 'assets/icons/voltar.svg',
                    onTap: () => Navigator.pop(context),
                    size: 32,
                    color: AppTheme.primary,
                    tooltip: 'Voltar',
                  ),
                  const SizedBox(width: 16),
                  // Título fixo
                  const Expanded(
                    child: Text(
                      'Etiqueta Validade',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  // Ícone de busca
                  HeaderButton(
                    iconPath: 'assets/icons/lupa.svg',
                    onTap: _mostrarModalBusca,
                    size: 32,
                    color: AppTheme.primary,
                    tooltip: 'Buscar',
                  ),

                  // Botão Home
                  HeaderButton(
                    icon: PhosphorIcons.house,
                    onTap: () {
                      Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const MainScreen(),
                        ),
                        (route) => false,
                      );
                    },
                    size: 32,
                    color: AppTheme.primary,
                    tooltip: 'Home',
                  ),
                ],
              ),
            ),

            // Breadcrumb
            _buildBreadcrumb(),

            // Loading ou erro
            if (categoriesProductsProvider.isLoading)
              const Expanded(
                child: Center(
                  child: CircularProgressIndicator(color: AppTheme.primary),
                ),
              )
            else if (categoriesProductsProvider.error != null)
              Expanded(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(PhosphorIcons.warning, color: Colors.red, size: 48),
                      const SizedBox(height: 16),
                      Text(
                        'Erro ao carregar categorias',
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.red,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Não foi possível carregar as categorias. Verifique sua conexão e tente novamente.',
                        style: TextStyle(fontSize: 14, color: AppTheme.dark300),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadDataFromAPI,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                        ),
                        child: const Text('Tentar Novamente'),
                      ),
                    ],
                  ),
                ),
              )
            // Lista de categorias
            else
              Expanded(
                child: rootCategories.isEmpty
                    ? const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              PhosphorIcons.folderOpen,
                              color: AppTheme.dark300,
                              size: 48,
                            ),
                            SizedBox(height: 16),
                            ResponsiveText(
                              'Nenhuma categoria encontrada',
                              fontSize: 18,
                              color: AppTheme.dark300,
                            ),
                          ],
                        ),
                      )
                    : SmartRefreshWidget(
                        onRefresh: _refreshData,
                        child: ListView.builder(
                          padding: const EdgeInsets.fromLTRB(
                            20,
                            20,
                            20,
                            20,
                          ),
                          itemCount: rootCategories.length,
                          itemBuilder: (context, index) {
                            final categoria = rootCategories[index];
                            final subcategoriesCount =
                                categoriesProductsProvider
                                    .getSubcategories(categoria.id)
                                    .length;
                            final productsCount = categoriesProductsProvider
                                .getProductsByCategory(categoria.id)
                                .length;

                            return Container(
                              margin: const EdgeInsets.only(bottom: 16),
                              decoration: BoxDecoration(
                                color: AppTheme.dark800,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: _categoriaHover == categoria.id
                                      ? Colors.green
                                      : AppTheme.dark700,
                                  width: _categoriaHover == categoria.id
                                      ? 2
                                      : 1,
                                ),
                              ),
                              child: ListTile(
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 4,
                                ),
                                splashColor: Colors.transparent,
                                minVerticalPadding: 0,
                                isThreeLine: false,
                                dense: true,
                                minLeadingWidth: 60,
                                leading: Container(
                                  width: 60,
                                  height: 60,
                                  decoration: BoxDecoration(
                                    color: Colors.green.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(30),
                                  ),
                                  child: categoria.icon != null && CulinaryIcons.isSvg(categoria.icon)
                                      ? CustomIcon(
                                          iconPath: CulinaryIcons.getSvgPathByName(categoria.icon)!,
                                          size: 30,
                                          color: Colors.green,
                                        )
                                      : Icon(
                                          categoria.icon != null
                                              ? (CulinaryIcons.getIconByName(categoria.icon) ?? PhosphorIcons.folder)
                                              : PhosphorIcons.folder,
                                          color: Colors.green,
                                          size: 30,
                                        ),
                                ),
                                title: Text(
                                  categoria.name.toUpperCase(),
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                subtitle: Text(
                                  subcategoriesCount > 0
                                      ? '$subcategoriesCount subcategorias disponíveis'
                                      : '$productsCount produtos disponíveis',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: AppTheme.dark300,
                                  ),
                                ),
                                trailing: Icon(
                                  PhosphorIcons.arrowRight,
                                  color: AppTheme.primary,
                                  size: 24,
                                ),
                                onTap: () => _selecionarCategoria(categoria),
                              ),
                            );
                          },
                        ),
                      ),
              ),
          ],
        );
      },
    );
  }

  Widget _buildSubcategorias() {
    return Consumer<CategoriesProductsProvider>(
      builder: (context, categoriesProductsProvider, child) {
        // Se está carregando OU nunca carregou, mostrar loading
        if (categoriesProductsProvider.isLoading ||
            !categoriesProductsProvider.hasLoadedInitially) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary),
                ),
                SizedBox(height: 16),
                ResponsiveText(
                  'Carregando subcategorias...',
                  fontSize: 16,
                  color: AppTheme.dark300,
                ),
              ],
            ),
          );
        }

        final subcategorias = categoriesProductsProvider.getSubcategories(
          _categoriaSelecionada!,
        );
        final produtosCategoria = categoriesProductsProvider
            .getProductsByCategory(_categoriaSelecionada!);
        
        // Ordenar produtos alfabeticamente por nome
        final produtosCategoriaOrdenados = List.from(produtosCategoria)
          ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
        
        final hasSubcategorias = subcategorias.isNotEmpty;
        final hasProdutos = produtosCategoriaOrdenados.isNotEmpty;

        return Column(
          children: [
            // Header fixo
            Container(
              width: double.infinity,
              color: AppTheme.dark900,
              padding: const EdgeInsets.symmetric(
                horizontal: 20.0,
                vertical: 10.0,
              ),
              child: Row(
                children: [
                  // Botão voltar
                  HeaderButton(
                    iconPath: 'assets/icons/voltar.svg',
                    onTap: _voltar,
                    size: 32,
                    color: AppTheme.primary,
                    tooltip: 'Voltar',
                  ),
                  const SizedBox(width: 16),
                  // Título fixo
                  Expanded(
                    child: ResponsiveText(
                      'Etiqueta Validade',
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  // Ícone de busca
                  HeaderButton(
                    iconPath: 'assets/icons/lupa.svg',
                    onTap: _mostrarModalBusca,
                    size: 32,
                    color: AppTheme.primary,
                    tooltip: 'Buscar',
                  ),

                  // Botão Home
                  HeaderButton(
                    icon: PhosphorIcons.house,
                    onTap: () {
                      Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const MainScreen(),
                        ),
                        (route) => false,
                      );
                    },
                    size: 32,
                    color: AppTheme.primary,
                    tooltip: 'Home',
                  ),
                ],
              ),
            ),

            // Breadcrumb
            _buildBreadcrumb(),

            // Lista de subcategorias com animações
            Expanded(
              child: SmartRefreshWidget(
                onRefresh: _refreshData,
                child: (!hasSubcategorias && !hasProdutos)
                    ? const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              PhosphorIcons.package,
                              color: AppTheme.dark300,
                              size: 48,
                            ),
                            SizedBox(height: 16),
                            ResponsiveText(
                              'Nenhuma subcategoria ou produto nesta categoria',
                              fontSize: 18,
                              color: AppTheme.dark300,
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
                          itemCount: (() {
                          int count = 0;
                          if (hasSubcategorias)
                            count += 1 + subcategorias.length; // header + itens
                          if (hasProdutos) {
                            final rows = (produtosCategoriaOrdenados.length / 2).ceil();
                            count += rows; // Apenas as linhas dos produtos, sem header
                          }
                          return count;
                        })(),
                        itemBuilder: (context, index) {
                          int cursor = 0;
                          // Seção Subcategorias
                          if (hasSubcategorias) {
                            if (index == cursor) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: Text(
                                  'Subcategorias',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              );
                            }
                            if (index > cursor &&
                                index <= cursor + subcategorias.length) {
                              final subcategoria =
                                  subcategorias[index - cursor - 1];
                              return Container(
                                margin: const EdgeInsets.only(bottom: 16),
                                decoration: BoxDecoration(
                                  color: AppTheme.dark800,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: _subcategoriaHover == subcategoria.id
                                        ? Colors.green
                                        : AppTheme.dark700,
                                    width: _subcategoriaHover == subcategoria.id
                                        ? 2
                                        : 1,
                                  ),
                                ),
                                child: ListTile(
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 4,
                                  ),
                                  splashColor: Colors.transparent,
                                  minVerticalPadding: 0,
                                  isThreeLine: false,
                                  dense: true,
                                  minLeadingWidth: 60,
                                  leading: Container(
                                    width: 60,
                                    height: 60,
                                    decoration: BoxDecoration(
                                      color: Colors.green.withOpacity(0.2),
                                      borderRadius: BorderRadius.circular(30),
                                    ),
                                    child: subcategoria.icon != null && CulinaryIcons.isSvg(subcategoria.icon)
                                        ? CustomIcon(
                                            iconPath: CulinaryIcons.getSvgPathByName(subcategoria.icon)!,
                                            size: 30,
                                            color: Colors.green,
                                          )
                                        : Icon(
                                            subcategoria.icon != null
                                                ? (CulinaryIcons.getIconByName(subcategoria.icon) ?? PhosphorIcons.folder)
                                                : PhosphorIcons.folder,
                                            color: Colors.green,
                                            size: 30,
                                          ),
                                  ),
                                  title: Text(
                                    subcategoria.name.toUpperCase(),
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  subtitle: Text(
                                    '${categoriesProductsProvider.getProductsByCategory(subcategoria.id).length} produtos disponíveis',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: AppTheme.dark300,
                                    ),
                                  ),
                                  trailing: Icon(
                                    PhosphorIcons.arrowRight,
                                    color: AppTheme.primary,
                                    size: 24,
                                  ),
                                  onTap: () =>
                                      _selecionarSubcategoria(subcategoria.id),
                                ),
                              );
                            }
                            cursor += 1 + subcategorias.length;
                          }
                          // Seção Produtos
                          if (hasProdutos) {
                            // Renderizar produtos em grid quando dentro do ListView
                            final produtosRestantes = produtosCategoriaOrdenados.length;
                            final rows = (produtosRestantes / 2).ceil();
                            
                            if (index >= cursor && index < cursor + rows) {
                              final rowIndex = index - cursor;
                              final firstProductIndex = rowIndex * 2;
                              final secondProductIndex = firstProductIndex + 1;
                              
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: SizedBox(
                                  height: 140, // Altura aumentada para comportar 3 linhas + ícones com respiro
                                  child: Row(
                                    children: [
                                      // Primeiro produto da linha
                                      Expanded(
                                        child: _buildProdutoGridItem(produtosCategoriaOrdenados[firstProductIndex]),
                                      ),
                                      const SizedBox(width: 12),
                                      // Segundo produto da linha (se existir)
                                      Expanded(
                                        child: secondProductIndex < produtosCategoriaOrdenados.length
                                            ? _buildProdutoGridItem(produtosCategoriaOrdenados[secondProductIndex])
                                            : const SizedBox.shrink(),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            }
                            cursor += rows;
                          }
                          return const SizedBox.shrink();
                        },
                      ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildProdutos() {
    return Consumer<CategoriesProductsProvider>(
      builder: (context, categoriesProductsProvider, child) {
        // Se está carregando OU nunca carregou, mostrar loading
        if (categoriesProductsProvider.isLoading ||
            !categoriesProductsProvider.hasLoadedInitially) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary),
                ),
                SizedBox(height: 16),
                ResponsiveText(
                  'Carregando produtos...',
                  fontSize: 16,
                  color: AppTheme.dark300,
                ),
              ],
            ),
          );
        }

        // Determinar qual categoria usar para buscar produtos
        final categoriaId =
            _subcategoriaSelecionada ?? _categoriaSelecionada ?? '';
        final produtos = categoriesProductsProvider.getProductsByCategory(
          categoriaId,
        );
        
        // Ordenar produtos alfabeticamente por nome
        final produtosOrdenados = List.from(produtos)
          ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));

        return Column(
          children: [
            // Header fixo
            Container(
              width: double.infinity,
              color: AppTheme.dark900,
              padding: const EdgeInsets.symmetric(
                horizontal: 20.0,
                vertical: 10.0,
              ),
              child: Row(
                children: [
                  // Botão voltar
                  HeaderButton(
                    iconPath: 'assets/icons/voltar.svg',
                    onTap: _voltar,
                    size: 32,
                    color: AppTheme.primary,
                    tooltip: 'Voltar',
                  ),
                  const SizedBox(width: 16),
                  // Título fixo
                  Expanded(
                    child: ResponsiveText(
                      'Etiqueta Validade',
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  // Ícone de busca
                  HeaderButton(
                    iconPath: 'assets/icons/lupa.svg',
                    onTap: _mostrarModalBusca,
                    size: 32,
                    color: AppTheme.primary,
                    tooltip: 'Buscar',
                  ),

                  // Ícone de home
                  HeaderButton(
                    icon: PhosphorIcons.house,
                    onTap: () {
                      Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const MainScreen(),
                        ),
                        (route) => false,
                      );
                    },
                    size: 32,
                    color: AppTheme.primary,
                    tooltip: 'Home',
                  ),
                ],
              ),
            ),

            // Breadcrumb
            _buildBreadcrumb(),

            // Lista de produtos com animações
            Expanded(
              child: produtosOrdenados.isEmpty
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            PhosphorIcons.package,
                            color: AppTheme.dark300,
                            size: 48,
                          ),
                          SizedBox(height: 16),
                          ResponsiveText(
                            'Nenhum produto encontrado',
                            fontSize: 18,
                            color: AppTheme.dark300,
                          ),
                        ],
                      ),
                    )
                  : SmartRefreshWidget(
                      onRefresh: _refreshData,
                      child: GridView.builder(
                        padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 1.1, // Ajustado para cards mais altos (140px de altura aprox)
                        ),
                        itemCount: produtosOrdenados.length,
                        itemBuilder: (context, index) {
                          final produto = produtosOrdenados[index];
                          return _buildProdutoGridItem(produto);
                        },
                      ),
                    ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildConfiguracao() {
    print('🔧 _buildConfiguracao chamado');
    print('🔧 _produtoSelecionado: $_produtoSelecionado');
    print('🔧 _codigoController.text: ${_codigoController.text}');
    print('🔧 _nomeController.text: ${_nomeController.text}');

    try {
      return Column(
        children: [
          // Header fixo
          Container(
            width: double.infinity,
            color: AppTheme.dark900,
            padding: const EdgeInsets.symmetric(
              horizontal: 20.0,
              vertical: 10.0,
            ),
            child: Row(
              children: [
                // Botão voltar
                HeaderButton(
                  iconPath: 'assets/icons/voltar.svg',
                  onTap: _voltar,
                  size: 32,
                  color: AppTheme.primary,
                  tooltip: 'Voltar',
                ),
                const SizedBox(width: 16),
                // Título dinâmico com nome do produto
                Expanded(
                  child: Text(
                    _nomeController.text.isEmpty
                        ? 'Etiqueta Validade'
                        : _nomeController.text,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                // Ícone de busca
                HeaderButton(
                  iconPath: 'assets/icons/lupa.svg',
                  onTap: _mostrarModalBusca,
                  size: 32,
                  color: AppTheme.primary,
                  tooltip: 'Buscar',
                ),

                // Botão Home
                HeaderButton(
                  icon: PhosphorIcons.house,
                  onTap: () {
                    Navigator.pushAndRemoveUntil(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const MainScreen(),
                      ),
                      (route) => false,
                    );
                  },
                  size: 32,
                  color: AppTheme.primary,
                  tooltip: 'Home',
                ),
              ],
            ),
          ),

          // Breadcrumb
          _buildBreadcrumb(),

          // Configurações da etiqueta
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  // Configurações
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.dark800,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.dark700),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // 2. Responsável removido (agora é fixo como o operador logado)

                        // 3. Data de Manipulação
                        GestureDetector(
                          onTap: _selecionarDataManipulacao,
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppTheme.dark700,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppTheme.primary),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      PhosphorIcons.calendar,
                                      color: AppTheme.primary,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 20),
                                    Text(
                                      'Data de Manipulação',
                                      style: TextStyle(
                                        fontSize: 16,
                                        color: AppTheme.primary,
                                        fontWeight: FontWeight.w600,
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
                                const SizedBox(height: 6),
                                Text(
                                  _dataManipulacaoController.text,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    color: Colors.white,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 20),

                        // 3.5 Informações da Indústria (Opcional) - Exibir apenas se o produto tem essas flags ativadas
                        if (_produtoSelecionado
                                    ?.showManufacturingBatchOnLabel ==
                                true ||
                            _produtoSelecionado?.showExpiryDateOnLabel ==
                                true) ...[
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppTheme.dark800.withOpacity(0.5),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: AppTheme.dark600,
                                width: 1,
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      PhosphorIcons.package,
                                      color: AppTheme.dark300,
                                      size: 18,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'Informações da Indústria',
                                        style: TextStyle(
                                          color: AppTheme.dark200,
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                    AiCaptureButton(
                                      tooltip: 'Extrair com IA',
                                      fieldsToExtract: [
                                        'lote',
                                        'data_vencimento',
                                      ],
                                      onDataExtracted: (data) {
                                        setState(() {
                                          if (data['lote'] != null &&
                                              data['lote']!.isNotEmpty) {
                                            _loteIndustriaController.text =
                                                data['lote']!;
                                          }
                                          if (data['data_vencimento'] != null &&
                                              data['data_vencimento']!
                                                  .isNotEmpty) {
                                            _dataVencimentoIndustriaController
                                                    .text =
                                                data['data_vencimento']!;
                                          }
                                        });
                                      },
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Lote e data de vencimento da embalagem original',
                                  style: TextStyle(
                                    color: AppTheme.dark400,
                                    fontSize: 12,
                                    fontStyle: FontStyle.italic,
                                  ),
                                ),
                                const SizedBox(height: 16),

                                // Lote da Indústria - Exibir apenas se configurado
                                if (_produtoSelecionado
                                        ?.showManufacturingBatchOnLabel ==
                                    true) ...[
                                  Text(
                                    'Lote Original',
                                    style: TextStyle(
                                      color: AppTheme.dark300,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  TextField(
                                    controller: _loteIndustriaController,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 16,
                                    ),
                                    decoration: InputDecoration(
                                      hintText: 'Ex: L20251015-003',
                                      hintStyle: TextStyle(
                                        color: AppTheme.dark400,
                                        fontSize: 14,
                                      ),
                                      filled: true,
                                      fillColor: AppTheme.dark700,
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8),
                                        borderSide: BorderSide(
                                          color: AppTheme.dark600,
                                        ),
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8),
                                        borderSide: BorderSide(
                                          color: AppTheme.dark600,
                                        ),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(8),
                                        borderSide: BorderSide(
                                          color: AppTheme.primary,
                                        ),
                                      ),
                                      contentPadding:
                                          const EdgeInsets.symmetric(
                                            horizontal: 12,
                                            vertical: 12,
                                          ),
                                      prefixIcon: Icon(
                                        PhosphorIcons.barcode,
                                        color: AppTheme.dark400,
                                        size: 20,
                                      ),
                                    ),
                                  ),

                                  const SizedBox(height: 16),
                                ],

                                // Data de Vencimento da Indústria - Exibir apenas se configurado
                                if (_produtoSelecionado
                                        ?.showExpiryDateOnLabel ==
                                    true) ...[
                                  Text(
                                    'Data de Vencimento Original',
                                    style: TextStyle(
                                      color: AppTheme.dark300,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  GestureDetector(
                                    onTap: _selecionarDataVencimentoIndustria,
                                    child: Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: AppTheme.dark700,
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                          color: AppTheme.dark600,
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          Icon(
                                            PhosphorIcons.calendar,
                                            color: AppTheme.dark400,
                                            size: 20,
                                          ),
                                          const SizedBox(width: 12),
                                          Text(
                                            _dataVencimentoIndustriaController
                                                    .text
                                                    .isEmpty
                                                ? 'Selecionar data'
                                                : _dataVencimentoIndustriaController
                                                      .text,
                                            style: TextStyle(
                                              fontSize: 16,
                                              color:
                                                  _dataVencimentoIndustriaController
                                                      .text
                                                      .isEmpty
                                                  ? AppTheme.dark400
                                                  : Colors.white,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                          const Spacer(),
                                          Icon(
                                            PhosphorIcons.caretDown,
                                            color: AppTheme.dark400,
                                            size: 16,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),

                          const SizedBox(height: 20),
                        ],

                        // 4. Tipo de Conservação
                        Text(
                          'Tipo de Conservação',
                          style: TextStyle(
                            color: AppTheme.dark300,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 12),
                        // Opções de conservação dinâmicas baseadas no produto
                        Builder(
                          builder: (context) {
                            final opcoes = _getOpcoesConservacaoDisponiveis();

                            return Row(
                              children: opcoes.map((opcao) {
                                final isSelected =
                                    _conservacaoSelecionada == opcao['tipo'];
                                final isDisponivel =
                                    opcao['disponivel'] as bool;
                                final dias = opcao['dias'] as int?;

                                return Expanded(
                                  child: Padding(
                                    padding: EdgeInsets.only(
                                      right:
                                          opcoes.indexOf(opcao) <
                                              opcoes.length - 1
                                          ? 12
                                          : 0,
                                    ),
                                    child: GestureDetector(
                                      onTap: isDisponivel
                                          ? () => _selecionarConservacao(
                                              opcao['tipo'],
                                            )
                                          : null,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                          vertical: 12,
                                        ),
                                        decoration: BoxDecoration(
                                          color: isDisponivel
                                              ? (isSelected
                                                    ? AppTheme.primary
                                                          .withOpacity(0.2)
                                                    : AppTheme.dark700)
                                              : AppTheme.dark800,
                                          borderRadius: BorderRadius.circular(
                                            12,
                                          ),
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
                                              opcao['icone'],
                                              color: isDisponivel
                                                  ? (isSelected
                                                        ? AppTheme.primary
                                                        : AppTheme.dark300)
                                                  : AppTheme.dark500,
                                              size: 24,
                                            ),
                                            const SizedBox(height: 8),
                                            Text(
                                              opcao['nome'],
                                              style: TextStyle(
                                                color: isDisponivel
                                                    ? (isSelected
                                                          ? AppTheme.primary
                                                          : Colors.white)
                                                    : AppTheme.dark500,
                                                fontWeight: FontWeight.w600,
                                                fontSize: 12,
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              isDisponivel
                                                  ? (opcao['tipo'] ==
                                                            'validade_original'
                                                        ? 'Data original'
                                                        : (dias != null
                                                              ? _formatarDias(
                                                                  dias,
                                                                )
                                                              : 'N/A'))
                                                  : 'Não disponível',
                                              style: TextStyle(
                                                color: isDisponivel
                                                    ? (isSelected
                                                          ? AppTheme.primary
                                                          : AppTheme.dark300)
                                                    : AppTheme.dark500,
                                                fontSize: 10,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                );
                              }).toList(),
                            );
                          },
                        ),

                        const SizedBox(height: 20),

                        // 5. Data de Validade (Calculada automaticamente)
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.dark700,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.primary),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(
                                    PhosphorIcons.calendar,
                                    color: AppTheme.primary,
                                    size: 20,
                                  ),
                                  const SizedBox(width: 20),
                                  Text(
                                    'Data de Validade',
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: AppTheme.primary,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const Spacer(),
                                  Icon(
                                    PhosphorIcons.checkCircle,
                                    color: AppTheme.primary,
                                    size: 16,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                _dataValidadeController.text.isEmpty
                                    ? 'Selecione o tipo de conservação'
                                    : _dataValidadeController.text,
                                style: TextStyle(
                                  fontSize: 18,
                                  color: _dataValidadeController.text.isEmpty
                                      ? AppTheme.dark300
                                      : Colors.white,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 20),

                        // 6. Marca e SIF (sempre editáveis se configurado para aparecer na etiqueta)
                        if (_produtoSelecionado?.showBrandOnLabel == true ||
                            _produtoSelecionado?.showSifOnLabel == true) ...[
                          Row(
                            children: [
                              // Marca
                              if (_produtoSelecionado?.showBrandOnLabel ==
                                  true) ...[
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Marca',
                                        style: TextStyle(
                                          color: AppTheme.dark300,
                                          fontSize: 14,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      const SizedBox(height: 12),
                                      Container(
                                        width: double.infinity,
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: AppTheme.dark700,
                                          borderRadius: BorderRadius.circular(
                                            12,
                                          ),
                                          border: Border.all(
                                            color: AppTheme.primary,
                                          ),
                                        ),
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Icon(
                                                  PhosphorIcons.tag,
                                                  color: AppTheme.primary,
                                                  size: 20,
                                                ),
                                                const SizedBox(width: 20),
                                                Text(
                                                  'Marca',
                                                  style: TextStyle(
                                                    fontSize: 16,
                                                    color: AppTheme.primary,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 12),
                                            TextFormField(
                                              controller: _marcaController,
                                              decoration: InputDecoration(
                                                hintText: 'Digite a marca',
                                                hintStyle: TextStyle(
                                                  color: AppTheme.dark400,
                                                  fontSize: 14,
                                                ),
                                                filled: true,
                                                fillColor: AppTheme.dark800,
                                                border: OutlineInputBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(8),
                                                  borderSide: BorderSide(
                                                    color: AppTheme.dark600,
                                                  ),
                                                ),
                                                enabledBorder:
                                                    OutlineInputBorder(
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                            8,
                                                          ),
                                                      borderSide: BorderSide(
                                                        color: AppTheme.dark600,
                                                      ),
                                                    ),
                                                focusedBorder:
                                                    OutlineInputBorder(
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                            8,
                                                          ),
                                                      borderSide: BorderSide(
                                                        color: AppTheme.primary,
                                                      ),
                                                    ),
                                                contentPadding:
                                                    const EdgeInsets.symmetric(
                                                      horizontal: 12,
                                                      vertical: 12,
                                                    ),
                                              ),
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 14,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (_produtoSelecionado?.showSifOnLabel == true)
                                  const SizedBox(width: 12),
                              ],

                              // SIF
                              if (_produtoSelecionado?.showSifOnLabel ==
                                  true) ...[
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'SIF',
                                        style: TextStyle(
                                          color: AppTheme.dark300,
                                          fontSize: 14,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      const SizedBox(height: 12),
                                      Container(
                                        width: double.infinity,
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          color: AppTheme.dark700,
                                          borderRadius: BorderRadius.circular(
                                            12,
                                          ),
                                          border: Border.all(
                                            color: AppTheme.primary,
                                          ),
                                        ),
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Icon(
                                                  PhosphorIcons.stamp,
                                                  color: AppTheme.primary,
                                                  size: 20,
                                                ),
                                                const SizedBox(width: 20),
                                                Text(
                                                  'SIF',
                                                  style: TextStyle(
                                                    fontSize: 16,
                                                    color: AppTheme.primary,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            const SizedBox(height: 12),
                                            TextFormField(
                                              controller: _sifController,
                                              decoration: InputDecoration(
                                                hintText: 'Digite o SIF',
                                                hintStyle: TextStyle(
                                                  color: AppTheme.dark400,
                                                  fontSize: 14,
                                                ),
                                                filled: true,
                                                fillColor: AppTheme.dark800,
                                                border: OutlineInputBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(8),
                                                  borderSide: BorderSide(
                                                    color: AppTheme.dark600,
                                                  ),
                                                ),
                                                enabledBorder:
                                                    OutlineInputBorder(
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                            8,
                                                          ),
                                                      borderSide: BorderSide(
                                                        color: AppTheme.dark600,
                                                      ),
                                                    ),
                                                focusedBorder:
                                                    OutlineInputBorder(
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                            8,
                                                          ),
                                                      borderSide: BorderSide(
                                                        color: AppTheme.primary,
                                                      ),
                                                    ),
                                                contentPadding:
                                                    const EdgeInsets.symmetric(
                                                      horizontal: 12,
                                                      vertical: 12,
                                                    ),
                                              ),
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 14,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 20),
                        ],

                        // 7. Local de Armazenamento
                        Text(
                          'Local de Armazenamento',
                          style: TextStyle(
                            color: AppTheme.dark300,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 12),
                        GestureDetector(
                          onTap: _mostrarSelecaoLocalArmazenamento,
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppTheme.dark700,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppTheme.primary),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      PhosphorIcons.buildings,
                                      color: AppTheme.primary,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 20),
                                    Text(
                                      'Local de Armazenamento',
                                      style: TextStyle(
                                        fontSize: 16,
                                        color: AppTheme.primary,
                                        fontWeight: FontWeight.w600,
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
                                const SizedBox(height: 6),
                                Text(
                                  _localArmazenamentoSelecionado?.nome ??
                                      'Selecione um local',
                                  style: TextStyle(
                                    fontSize: 18,
                                    color:
                                        _localArmazenamentoSelecionado == null
                                        ? AppTheme.dark300
                                        : Colors.white,
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

                  const SizedBox(height: 20),

                  // 8. Peso/Quantidade (largura total)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.dark700,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.dark600),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Peso/Quantidade',
                          style: TextStyle(
                            color: AppTheme.dark300,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            // Campo de peso
                            Expanded(
                              child: TextFormField(
                                controller: _pesoController,
                                keyboardType: TextInputType.number,
                                decoration: InputDecoration(
                                  hintText: 'Ex: 500',
                                  hintStyle: TextStyle(
                                    color: AppTheme.dark400,
                                    fontSize: 14,
                                  ),
                                  filled: true,
                                  fillColor: AppTheme.dark800,
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                    borderSide: BorderSide(
                                      color: AppTheme.dark600,
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                    borderSide: BorderSide(
                                      color: AppTheme.dark600,
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                    borderSide: BorderSide(
                                      color: AppTheme.primary,
                                    ),
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 12,
                                  ),
                                ),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            // Dropdown de unidade
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: AppTheme.dark800,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: AppTheme.dark600),
                                ),
                                child: DropdownButtonHideUnderline(
                                  child: DropdownButton<String>(
                                    value: _unidadeSelecionada,
                                    isExpanded: true,
                                    dropdownColor: AppTheme.dark800,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                    ),
                                    items: unidadesDisponiveis.map((
                                      String unidade,
                                    ) {
                                      return DropdownMenuItem<String>(
                                        value: unidade,
                                        child: Text(unidade),
                                      );
                                    }).toList(),
                                    onChanged: (String? newValue) {
                                      if (newValue != null) {
                                        setState(() {
                                          _unidadeSelecionada = newValue;
                                        });
                                      }
                                    },
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Espaçamento extra para evitar sobreposição com navegação
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),

          // Footer com botões de ação
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppTheme.dark800,
              border: Border(top: BorderSide(color: AppTheme.dark700)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Linha: Quantidade + Botão Imprimir
                Row(
                  children: [
                    // Seletor de Quantidade de Etiquetas - Flex menor para dar mais espaço ao botão
                    Expanded(
                      flex:
                          2, // Reduzido de flex padrão para dar mais espaço ao botão
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppTheme.dark700,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.dark600),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            // Botão -
                            GestureDetector(
                              onTap: _decrementarQuantidadeEtiquetas,
                              child: Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  color: AppTheme.dark600,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Icon(
                                  PhosphorIcons.minus,
                                  color: Colors.white,
                                  size: 14,
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                            // Campo de texto
                            SizedBox(
                              width: 50,
                              child: TextFormField(
                                controller: _quantidadeEtiquetasController,
                                textAlign: TextAlign.center,
                                keyboardType: TextInputType.number,
                                onChanged: _onQuantidadeEtiquetasChanged,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                                decoration: const InputDecoration(
                                  border: InputBorder.none,
                                  contentPadding: EdgeInsets.symmetric(
                                    vertical: 2,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                            // Botão +
                            GestureDetector(
                              onTap: _incrementarQuantidadeEtiquetas,
                              child: Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  color: AppTheme.primary,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Icon(
                                  PhosphorIcons.plus,
                                  color: Colors.white,
                                  size: 14,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Botão Imprimir - Flex maior para ter mais espaço
                    Expanded(
                      flex: 3, // Aumentado para dar mais espaço ao botão
                      child: ElevatedButton.icon(
                        onPressed: _isPrinting
                            ? null
                            : () async {
                                print(
                                  '🔘 BOTÃO IMPRIMIR CLICADO (Manipulado)!',
                                );
                                setState(() => _isPrinting = true);
                                await Future.delayed(Duration.zero);
                                try {
                                  await _imprimirEtiqueta();
                                } finally {
                                  if (mounted)
                                    setState(() => _isPrinting = false);
                                }
                              },
                        icon: _isPrinting
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white,
                                  ),
                                ),
                              )
                            : const Icon(PhosphorIcons.printer, size: 18),
                        label: Text(
                          _isPrinting ? 'Imprimindo...' : 'Imprimir',
                          style: const TextStyle(fontSize: 14),
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
        ],
      );
    } catch (e) {
      print('❌ Erro ao construir tela de configuração: $e');
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(PhosphorIcons.warning, color: Colors.red, size: 64),
            const SizedBox(height: 16),
            Text(
              'Erro ao carregar configuração',
              style: TextStyle(
                color: Colors.red,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Não foi possível carregar a configuração. Tente novamente.',
              style: TextStyle(color: AppTheme.dark300, fontSize: 14),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }
  }

  void _mostrarModalBusca() {
    // Busca sempre global por produtos, independente do contexto
    final categoriesProductsProvider = context
        .read<CategoriesProductsProvider>();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.dark900,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _BuscaGlobalModal(
        categoriesProductsProvider: categoriesProductsProvider,
        onProdutoSelecionado: (produto, categoriaPai) {
          Navigator.pop(context);

          // Navegar para o produto selecionado
          setState(() {
            // Encontrar e selecionar a categoria pai
            if (categoriaPai != null) {
              _categoriaSelecionada = categoriaPai.id;
              _subcategoriaSelecionada = null;
              _produtoSelecionado = produto;
              _currentStep = 'configuracao';

              // Preencher campos automaticamente
              _nomeController.text = produto.name;
              _codigoController.text = produto.code ?? '';

              // Preencher peso e unidade se disponíveis
              if (produto.weight != null && produto.weight!.isNotEmpty) {
                _pesoController.text = produto.weight!;
              }

              if (produto.weightUnit != null &&
                  produto.weightUnit!.isNotEmpty) {
                _unidadeSelecionada = produto.weightUnit!
                    .toUpperCase(); // ⭐ Converter para maiúsculo
              }

              // Preencher quantidade se disponível
              if (produto.quantity != null && produto.quantity!.isNotEmpty) {
                _quantidade = int.tryParse(produto.quantity!) ?? 1;
                _quantidadeController.text = _quantidade.toString();
              }

              // Preencher marca e SIF se disponíveis (sempre preencher se o produto tiver os campos, mesmo vazios)
              _marcaController.text = produto.brand ?? '';
              _sifController.text = produto.sif ?? '';

              // Definir local de armazenamento padrão se o produto tiver um configurado
              if (produto.defaultStorageLocationId != null) {
                final storageProvider = context
                    .read<StorageLocationsProvider>();
                final localPadrao = storageProvider.getStorageLocationById(
                  produto.defaultStorageLocationId,
                );
                if (localPadrao != null) {
                  _localArmazenamentoSelecionado = localPadrao;
                  print(
                    '🏠 Local de armazenamento padrão definido via busca: ${localPadrao.nome}',
                  );
                }
              }

              // ⭐ NOVO: Selecionar automaticamente tipo de conservação se houver apenas uma opção
              final opcoesConservacao = _getOpcoesConservacaoDisponiveis();
              final opcoesDisponiveis = opcoesConservacao.where((opcao) => opcao['disponivel'] == true).toList();
              
              if (opcoesDisponiveis.length == 1) {
                // Há apenas uma opção disponível, selecionar automaticamente
                final tipoConservacao = opcoesDisponiveis[0]['tipo'] as String;
                _conservacaoSelecionada = tipoConservacao;
                _calcularDataValidade();
                print('✅ Tipo de conservação selecionado automaticamente (busca): $tipoConservacao');
              } else {
                // Limpar seleção se houver múltiplas opções ou nenhuma
                _conservacaoSelecionada = null;
              }
            }
          });

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Produto selecionado: ${produto.name}'),
              backgroundColor: AppTheme.primary,
            ),
          );
        },
      ),
    );
  }

  // Métodos auxiliares para busca
  String _getItemName(String contexto) {
    switch (contexto) {
      case 'Categorias':
        return 'Categoria';
      case 'Subcategorias':
        return 'Subcategoria';
      case 'Produtos':
        return 'Produto';
      default:
        return 'Item';
    }
  }

  String _getItemDisplayName(dynamic item) {
    if (item is Category) {
      return item.name;
    } else if (item is Product) {
      return item.name;
    }
    return 'Item';
  }

  Widget _buildCategoriaVazia() {
    final categoriesProductsProvider = context
        .read<CategoriesProductsProvider>();
    final categoria = categoriesProductsProvider.getCategoryById(
      _categoriaSelecionada!,
    );

    return Column(
      children: [
        // Header fixo
        Container(
          width: double.infinity,
          color: AppTheme.dark900,
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
          child: Row(
            children: [
              // Botão voltar
              HeaderButton(
                iconPath: 'assets/icons/voltar.svg',
                onTap: _voltar,
                size: 32,
                color: AppTheme.primary,
                tooltip: 'Voltar',
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  categoria?.name ?? 'Categoria',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
              // Ícone de busca
              HeaderButton(
                iconPath: 'assets/icons/lupa.svg',
                onTap: _mostrarModalBusca,
                size: 32,
                color: AppTheme.primary,
                tooltip: 'Buscar',
              ),

              // Botão Home
              HeaderButton(
                icon: PhosphorIcons.house,
                onTap: () {
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (context) => const MainScreen()),
                    (route) => false,
                  );
                },
                size: 32,
                color: AppTheme.primary,
                tooltip: 'Home',
              ),
            ],
          ),
        ),

        // Conteúdo
        Expanded(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    PhosphorIcons.folderOpen,
                    color: AppTheme.primary,
                    size: 80,
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Categoria Vazia',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Esta categoria não possui subcategorias nem produtos cadastrados.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 16,
                      color: AppTheme.dark300,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: _voltar,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 32,
                        vertical: 16,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      'Voltar às Categorias',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return ConnectivityBanner(
      child: Scaffold(
        backgroundColor: AppTheme.dark900,
        body: SafeArea(
          child: _currentStep == 'categorias'
              ? _buildCategorias()
              : _currentStep == 'subcategorias'
              ? _buildSubcategorias()
              : _currentStep == 'produtos'
              ? _buildProdutos()
              : _currentStep == 'categoria_vazia'
              ? _buildCategoriaVazia()
              : _buildConfiguracao(),
        ),
      ),
    );
  }
}

// Modal de busca global por produtos
class _BuscaGlobalModal extends StatefulWidget {
  final CategoriesProductsProvider categoriesProductsProvider;
  final Function(Product, Category?) onProdutoSelecionado;

  const _BuscaGlobalModal({
    required this.categoriesProductsProvider,
    required this.onProdutoSelecionado,
  });

  @override
  State<_BuscaGlobalModal> createState() => _BuscaGlobalModalState();
}

class _BuscaGlobalModalState extends State<_BuscaGlobalModal>
    with TickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  bool _isListening = false;
  List<Map<String, dynamic>> _resultados = []; // Produto + Categoria pai

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
    _carregarTodosProdutos();
    _initSpeech();
    _initAnimations();
  }

  void _carregarTodosProdutos() {
    final produtos = widget.categoriesProductsProvider.products;
    final categorias = widget.categoriesProductsProvider.categories;

    _resultados = produtos.map((produto) {
      // Encontrar a categoria pai do produto
      final categoriaPai = categorias.firstWhere(
        (cat) => cat.id == produto.categoryId,
        orElse: () => categorias.first,
      );

      return {'produto': produto, 'categoria': categoriaPai};
    }).toList();
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
    _pulseController.dispose();
    _searchFocusNode.dispose();
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

  String _removeAcentos(String texto) {
    const Map<String, String> acentos = {
      'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
      'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
      'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
      'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
      'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
      'ç': 'c',
      'Á': 'A', 'À': 'A', 'Ã': 'A', 'Â': 'A', 'Ä': 'A',
      'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
      'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I',
      'Ó': 'O', 'Ò': 'O', 'Õ': 'O', 'Ô': 'O', 'Ö': 'O',
      'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U',
      'Ç': 'C',
    };
    
    String resultado = texto;
    acentos.forEach((acentuado, semAcento) {
      resultado = resultado.replaceAll(acentuado, semAcento);
    });
    return resultado;
  }

  void _filtrarProdutos() {
    final query = _removeAcentos(_searchController.text.toLowerCase());

    if (query.isEmpty) {
      _carregarTodosProdutos();
      return;
    }

    final produtos = widget.categoriesProductsProvider.products;
    final categorias = widget.categoriesProductsProvider.categories;

    setState(() {
      _resultados = produtos
          .where((produto) {
            // Buscar por nome ou código do produto (ignorando acentos)
            final nomeSemAcentos = _removeAcentos(produto.name.toLowerCase());
            final codigoSemAcentos = produto.code != null
                ? _removeAcentos(produto.code!.toLowerCase())
                : '';
            
            final matchNome = nomeSemAcentos.contains(query);
            final matchCodigo = codigoSemAcentos.contains(query);

            return matchNome || matchCodigo;
          })
          .map((produto) {
            // Encontrar a categoria pai do produto
            final categoriaPai = categorias.firstWhere(
              (cat) => cat.id == produto.categoryId,
              orElse: () => categorias.first,
            );

            return {'produto': produto, 'categoria': categoriaPai};
          })
          .toList();
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
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Buscar Produto',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    'Busque por nome ou código do produto',
                    style: TextStyle(fontSize: 14, color: AppTheme.dark300),
                  ),
                ],
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
                decoration: InputDecoration(
                  hintText: 'Buscar item...',
                  hintStyle: TextStyle(color: AppTheme.dark300),
                  prefixIcon: const Icon(
                    PhosphorIcons.magnifyingGlass,
                    color: AppTheme.dark300,
                  ),
                  suffixIcon: GestureDetector(
                    onTap: _iniciarBuscaPorVoz,
                    child: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: CustomIcon(
                        iconPath: 'assets/icons/microfone.svg',
                        size: 16,
                        color: _isListening ? AppTheme.primary : AppTheme.dark300,
                      ),
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
                              size: 12,
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
                          size: 48,
                          color: AppTheme.dark300,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Nenhum item encontrado',
                          style: TextStyle(
                            fontSize: 16,
                            color: AppTheme.dark300,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Tente ajustar os filtros ou buscar por outro termo',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppTheme.dark400,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    itemCount: _resultados.length,
                    itemBuilder: (context, index) {
                      final item = _resultados[index];
                      final produto = item['produto'] as Product;
                      final categoria = item['categoria'] as Category;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        decoration: BoxDecoration(
                          color: AppTheme.dark800,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.dark700),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          leading: Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Icon(
                              PhosphorIcons.package,
                              color: AppTheme.primary,
                              size: 20,
                            ),
                          ),
                          title: Text(
                            produto.name,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (produto.code != null)
                                Text(
                                  'Código: ${produto.code}',
                                  style: TextStyle(
                                    color: AppTheme.dark300,
                                    fontSize: 12,
                                  ),
                                ),
                              Text(
                                'Categoria: ${categoria.name}',
                                style: TextStyle(
                                  color: AppTheme.primary,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                          onTap: () =>
                              widget.onProdutoSelecionado(produto, categoria),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
