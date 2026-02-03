import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../components/header_button.dart';
import '../components/standard_header.dart';
import '../providers/categories_products_provider.dart';
import '../providers/storage_locations_provider.dart';
import '../providers/auth_provider.dart';
import '../config/app_config.dart';
import '../components/modal_armazenamento.dart';
import '../components/modal_cadastro_categoria.dart';
import '../components/modal_editar_categoria.dart';
import '../models/category_models.dart';
import '../models/product_models.dart';
import '../models/storage_location_models.dart';
import '../widgets/responsive_text.dart';
import '../widgets/cache_indicator_widget.dart';
import 'main_screen.dart';
import 'cadastro_produto_page.dart';
import 'editar_produto_page.dart';
import 'cadastro_local_page.dart';

class CadastrosScreen extends StatefulWidget {
  const CadastrosScreen({Key? key}) : super(key: key);

  @override
  State<CadastrosScreen> createState() => _CadastrosScreenState();
}

class _CadastrosScreenState extends State<CadastrosScreen> with TickerProviderStateMixin, WidgetsBindingObserver {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _searchTerm = '';
  Set<String> _expandedCategories = <String>{};
  String? _selectedCategory;
  bool _hasLoadedInitialData = false;
  DateTime? _lastReloadTime;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _tabController = TabController(length: 3, vsync: this);
    _searchController.addListener(() {
      setState(() {
        _searchTerm = _searchController.text.toLowerCase();
      });
    });
    
    // Carregar dados da API
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await _loadData();
      _hasLoadedInitialData = true;
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    // Recarregar quando o app volta ao foreground
    if (state == AppLifecycleState.resumed && _hasLoadedInitialData && mounted) {
      _loadData(forceRefresh: true);
    }
  }


  /// Carregar dados com refresh
  Future<void> _loadData({bool forceRefresh = false}) async {
    if (!mounted) return;
    
    final authProvider = context.read<AuthProvider>();
    
    // Verificar se está autenticado antes de tentar carregar
    if (!authProvider.isAuthenticated) {
      print('❌ Usuário não autenticado, não é possível carregar dados');
      return;
    }
    
    final token = await authProvider.authToken;
    final clientId = authProvider.user?.clientId;
    
    print('🔐 Token obtido: ${token != null ? "✅ Presente" : "❌ Ausente"}');
    print('👤 ClientId: ${clientId ?? "❌ Ausente"}');
    print('🌐 URL da API: ${AppConfig.apiBaseUrl}');
    
    if (token != null && clientId != null && mounted) {
      try {
        await context.read<CategoriesProductsProvider>().loadAll(token: token, clientId: clientId, forceRefresh: forceRefresh);
        if (mounted) {
          await context.read<StorageLocationsProvider>().loadStorageLocations();
        }
      } catch (e) {
        print('❌ Erro ao carregar dados: $e');
        // Não mostrar erro aqui, o provider já trata
      }
    } else {
      print('❌ Token ou ClientId não encontrado, não é possível carregar dados');
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _toggleCategoryExpansion(String categoryId) {
    setState(() {
      if (_expandedCategories.contains(categoryId)) {
        _expandedCategories.remove(categoryId);
      } else {
        _expandedCategories.add(categoryId);
      }
    });
  }

  void _handleCategorySelect(String? categoryId) {
    setState(() {
      _selectedCategory = categoryId;
      // Mudar para a aba de produtos quando selecionar uma categoria
      _tabController.animateTo(1); // Índice 1 = aba de produtos
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      body: Column(
        children: [
          // Header padronizado
          StandardHeader(
            title: 'Cadastros',
            showBack: false,
            showSearch: true,
            showHome: true,
            iconColor: AppTheme.primary,
            showLeading: true,
            leadingIcon: PhosphorIcons.package,
            onSearch: _mostrarModalBusca,
            onHome: () {
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (context) => const MainScreen()),
                (route) => false,
              );
            },
          ),
          
          // Tabs
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
            child: Container(
              decoration: BoxDecoration(
                color: AppTheme.dark700,
                borderRadius: BorderRadius.circular(25),
              ),
              child: TabBar(
                controller: _tabController,
                indicator: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(25),
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                dividerColor: Colors.transparent,
                labelColor: Colors.white,
                unselectedLabelColor: AppTheme.dark300,
                labelStyle: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
                unselectedLabelStyle: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
                tabs: [
                  Tab(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(PhosphorIcons.tray, size: 18),
                        const SizedBox(width: 8),
                        const Text('Categorias'),
                      ],
                    ),
                  ),
                  Tab(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(PhosphorIcons.package, size: 18),
                        const SizedBox(width: 8),
                        const Text('Produtos'),
                      ],
                    ),
                  ),
                  Tab(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(PhosphorIcons.mapPin, size: 18),
                        const SizedBox(width: 8),
                        const Text('Locais'),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Conteúdo das tabs
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                SmartRefreshWidget(
                  onRefresh: () => _loadData(forceRefresh: true),
                  child: _buildCategoriasTab(),
                ),
                SmartRefreshWidget(
                  onRefresh: () => _loadData(forceRefresh: true),
                  child: _buildProdutosTab(),
                ),
                SmartRefreshWidget(
                  onRefresh: () => _loadData(forceRefresh: true),
                  child: _buildArmazenamentoTab(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }


  Widget _buildCategoriasTab() {
    return Consumer<CategoriesProductsProvider>(
      builder: (context, provider, child) {
        print('🏷️ _buildCategoriasTab - isLoading: ${provider.isLoading}, hasLoadedInitially: ${provider.hasLoadedInitially}, error: ${provider.error}');
        print('🏷️ Total categories: ${provider.categories.length}, root categories: ${provider.rootCategories.length}');
        
        return _buildCategoriasContent(provider);
      },
    );
  }

  Widget _buildCategoriasContent(CategoriesProductsProvider provider) {
    if (provider.isLoading && !provider.hasLoadedInitially) {
      return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary),
                ),
                SizedBox(height: 16),
                Text(
                  'Carregando categorias...',
                  style: TextStyle(color: AppTheme.dark300),
                ),
              ],
            ),
          );
        }

        if (provider.error != null) {
          print('❌ Erro nas categorias: ${provider.error}');
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  PhosphorIcons.warning,
                  color: Colors.red,
                  size: 48,
                ),
                const SizedBox(height: 16),
                Text(
                  'Erro ao carregar categorias',
                  style: TextStyle(
                    color: AppTheme.dark300,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  provider.error!,
                  style: TextStyle(
                    color: AppTheme.dark400,
                    fontSize: 14,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () async {
                    final authProvider = context.read<AuthProvider>();
                    final token = await authProvider.authToken;
                    final clientId = authProvider.user?.clientId;
                    if (clientId != null) {
                      provider.loadAll(token: token, clientId: clientId);
                    }
                  },
                  child: const Text('Tentar Novamente'),
                ),
              ],
            ),
          );
        }

        final rootCategories = provider.rootCategories;
        final filteredCategories = rootCategories.where((category) =>
          category.name.toLowerCase().contains(_searchTerm)
        ).toList();
        
        print('✅ Root categories: ${rootCategories.length}, filtered: ${filteredCategories.length}');
        print('🔍 Search term: "$_searchTerm"');
        print('📋 Root categories names: ${rootCategories.map((c) => c.name).toList()}');
        print('📋 Filtered categories names: ${filteredCategories.map((c) => c.name).toList()}');

        return SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              // Botão de criar categoria
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 16),
                child: ElevatedButton.icon(
                  onPressed: () => _mostrarModalCriarCategoria(provider),
                  icon: Icon(PhosphorIcons.plus, size: 20),
                  label: const Text('Nova Categoria'),
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
              
              // Opção "Todas as categorias"
              _buildCategoryCard(
                category: null,
                isSelected: _selectedCategory == null,
                productCount: provider.allProducts.length,
                onTap: () => _handleCategorySelect(null),
              ),
              
              const SizedBox(height: 16),
              
              if (filteredCategories.isEmpty)
                _buildEmptyState(
                  icon: PhosphorIcons.package,
                  title: 'Nenhuma categoria encontrada',
                  subtitle: _searchTerm.isNotEmpty
                    ? 'Tente ajustar sua busca'
                    : 'Comece criando sua primeira categoria',
                  onCreateButtonPressed: () => _mostrarModalCriarCategoria(provider),
                  createButtonLabel: 'Criar Primeira Categoria',
                )
              else
                ...filteredCategories.map((category) => 
                  _buildCategoryTree(category, provider, 0)
                ),
            ],
          ),
        );
  }

  Widget _buildProdutosTab() {
    return Consumer<CategoriesProductsProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading && !provider.hasLoadedInitially) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary),
                ),
                SizedBox(height: 16),
                Text(
                  'Carregando produtos...',
                  style: TextStyle(color: AppTheme.dark300),
                ),
              ],
            ),
          );
        }

        // Filtrar produtos por categoria selecionada ou mostrar todos
        // Na tela de administração, mostra TODOS (ativos e inativos)
        List<Product> filteredProducts;
        if (_selectedCategory != null) {
          filteredProducts = provider.allProducts
              .where((product) => product.categoryId == _selectedCategory!)
              .toList();
        } else {
          filteredProducts = provider.allProducts.where((product) =>
            product.name.toLowerCase().contains(_searchTerm) ||
            (product.code?.toLowerCase().contains(_searchTerm) ?? false)
          ).toList();
        }
        
        // Ordenar produtos alfabeticamente por nome
        filteredProducts.sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));

        return SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              // Botão de criar produto
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 16),
                child: ElevatedButton.icon(
                  onPressed: _navegarParaCriarProduto,
                  icon: Icon(PhosphorIcons.plus, size: 20),
                  label: const Text('Novo Produto'),
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
              
              // Indicador de filtro ativo
              if (_selectedCategory != null) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppTheme.primary.withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        PhosphorIcons.funnel,
                        color: AppTheme.primary,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Filtrado por categoria',
                              style: TextStyle(
                                color: AppTheme.primary,
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              provider.getCategoryById(_selectedCategory!)?.name ?? 'Categoria desconhecida',
                              style: TextStyle(
                                color: AppTheme.dark300,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                      TextButton.icon(
                        onPressed: () {
                          setState(() {
                            _selectedCategory = null;
                          });
                        },
                        icon: Icon(
                          PhosphorIcons.x,
                          size: 16,
                          color: AppTheme.primary,
                        ),
                        label: Text(
                          'Exibir Todos',
                          style: TextStyle(
                            color: AppTheme.primary,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              
              // Contador de produtos
              if (filteredProducts.isNotEmpty) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: AppTheme.dark800,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${filteredProducts.length} produto${filteredProducts.length != 1 ? 's' : ''} encontrado${filteredProducts.length != 1 ? 's' : ''}',
                    style: TextStyle(
                      color: AppTheme.dark300,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
              
              if (filteredProducts.isEmpty)
                _buildEmptyState(
                  icon: PhosphorIcons.package,
                  title: 'Nenhum produto encontrado',
                  subtitle: _searchTerm.isNotEmpty || _selectedCategory != null
                    ? 'Tente ajustar seus filtros'
                    : 'Comece criando seu primeiro produto',
                  onCreateButtonPressed: _navegarParaCriarProduto,
                  createButtonLabel: 'Criar Primeiro Produto',
                )
              else
                ...filteredProducts.map((product) => 
                  _buildProductCard(product)
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildArmazenamentoTab() {
    return Consumer<StorageLocationsProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary),
                ),
                SizedBox(height: 16),
                Text(
                  'Carregando locais de armazenamento...',
                  style: TextStyle(color: AppTheme.dark300),
                ),
              ],
            ),
          );
        }

        if (provider.error != null) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  PhosphorIcons.warning,
                  color: Colors.red,
                  size: 48,
                ),
                const SizedBox(height: 16),
                Text(
                  'Erro ao carregar locais',
                  style: TextStyle(
                    color: AppTheme.dark300,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  provider.error!,
                  style: TextStyle(
                    color: AppTheme.dark400,
                    fontSize: 14,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {
                    _loadData();
                  },
                  child: const Text('Tentar Novamente'),
                ),
              ],
            ),
          );
        }

        // Filtrar locais baseado na busca
        final filteredLocais = provider.storageLocations.where((local) =>
          local.nome.toLowerCase().contains(_searchTerm) ||
          (local.setor?.toLowerCase().contains(_searchTerm) ?? false) ||
          local.tipo.value.toLowerCase().contains(_searchTerm)
        ).toList();

        return SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              // Botão de adicionar novo local
              Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 20),
                child: ElevatedButton.icon(
                  onPressed: () {
                    _mostrarModalArmazenamento();
                  },
                  icon: const Icon(PhosphorIcons.plus, size: 20),
                  label: const Text('Adicionar Local de Armazenamento'),
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

              if (filteredLocais.isEmpty)
                _buildEmptyState(
                  icon: PhosphorIcons.mapPin,
                  title: 'Nenhum local encontrado',
                  subtitle: _searchTerm.isNotEmpty
                    ? 'Tente ajustar sua busca'
                    : 'Comece criando seu primeiro local de armazenamento',
                  onCreateButtonPressed: () => _mostrarModalArmazenamento(),
                  createButtonLabel: 'Criar Primeiro Local',
                )
              else
                ...filteredLocais.map((local) => _buildLocalArmazenamentoCard(local)),
            ],
          ),
        );
      },
    );
  }

  Widget _buildLocalArmazenamentoCard(StorageLocation local) {
    final tipoInfo = _getTipoLocalInfo(local.tipo.value);
    final isAtivo = local.ativo;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.dark700,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.dark600),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header do card
          Row(
            children: [
              // Ícone do tipo
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: tipoInfo['color'].withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Icon(
                  tipoInfo['icon'],
                  color: tipoInfo['color'],
                  size: 20,
                ),
              ),
              
              const SizedBox(width: 12),
              
              // Nome e status
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      local.nome,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: isAtivo ? Colors.green : Colors.red,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          isAtivo ? 'Ativo' : 'Inativo',
                          style: TextStyle(
                            color: isAtivo ? Colors.green : Colors.red,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              // Botões de ação
              Row(
                children: [
                  _buildActionIcon(PhosphorIcons.pencilSimple, () {
                    _mostrarModalArmazenamento(local);
                  }),
                  _buildActionIcon(PhosphorIcons.trash, () {
                    _showDeleteLocalDialog(local);
                  }, isDestructive: true),
                ],
              ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          // Informações do local
          Row(
            children: [
              Expanded(
                child: _buildInfoItem(
                  PhosphorIcons.mapPin,
                  'Setor',
                  local.setor ?? 'Não informado',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildInfoItem(
                  PhosphorIcons.thermometer,
                  'Temperatura',
                  local.temperatura != null ? '${local.temperatura}°C' : 'Ambiente',
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 8),
          
          Row(
            children: [
              Expanded(
                child: _buildInfoItem(
                  PhosphorIcons.package,
                  'Capacidade',
                  local.capacidade != null ? '${local.capacidade}L' : 'Não informada',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildInfoItem(
                  tipoInfo['icon'],
                  'Tipo',
                  tipoInfo['label'],
                ),
              ),
            ],
          ),
          
          // Descrição se existir
          if (local.descricao != null && local.descricao!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.dark600,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    PhosphorIcons.info,
                    color: AppTheme.dark300,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      local.descricao!,
                      style: TextStyle(
                        color: AppTheme.dark300,
                        fontSize: 14,
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

  Widget _buildInfoItem(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: AppTheme.dark600,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                icon,
                color: AppTheme.dark300,
                size: 14,
              ),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  color: AppTheme.dark300,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Map<String, dynamic> _getTipoLocalInfo(String tipo) {
    switch (tipo) {
      case 'geladeira':
        return {
          'label': 'Geladeira',
          'icon': PhosphorIcons.snowflake,
          'color': Colors.blue,
          'description': 'Refrigeração (0°C a 8°C)',
        };
      case 'freezer':
        return {
          'label': 'Freezer',
          'icon': PhosphorIcons.snowflake,
          'color': Colors.cyan,
          'description': 'Congelamento (-18°C ou menos)',
        };
      case 'prateleira':
        return {
          'label': 'Prateleira',
          'icon': PhosphorIcons.package,
          'color': Colors.amber,
          'description': 'Armazenamento ambiente',
        };
      case 'estoque':
        return {
          'label': 'Estoque',
          'icon': PhosphorIcons.house,
          'color': Colors.grey,
          'description': 'Área de estoque geral',
        };
      case 'balcao':
        return {
          'label': 'Balcão',
          'icon': PhosphorIcons.mapPin,
          'color': Colors.green,
          'description': 'Área de exposição/venda',
        };
      default:
        return {
          'label': 'Outro',
          'icon': PhosphorIcons.mapPin,
          'color': Colors.purple,
          'description': 'Outro tipo de local',
        };
    }
  }

  void _showDeleteLocalDialog(StorageLocation local) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        title: Text(
          'Excluir Local',
          style: TextStyle(color: Colors.white),
        ),
        content: Text(
          'Tem certeza que deseja excluir o local "${local.nome}"? Esta ação não pode ser desfeita.',
          style: TextStyle(color: AppTheme.dark300),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancelar', style: TextStyle(color: AppTheme.dark400)),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                await context.read<StorageLocationsProvider>().deleteStorageLocation(local.id);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Local "${local.nome}" excluído')),
                );
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Erro ao excluir local: $e')),
                );
              }
            },
            child: Text('Excluir', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryTree(Category category, CategoriesProductsProvider provider, int level) {
    final subcategories = provider.getSubcategories(category.id);
    final hasSubcategories = subcategories.isNotEmpty;
    final isExpanded = _expandedCategories.contains(category.id);
    final isSelected = _selectedCategory == category.id;
    // Na tela de administração, conta TODOS os produtos (ativos e inativos)
    final productCount = provider.allProducts
        .where((product) => product.categoryId == category.id)
        .length;

    return Column(
      children: [
        Container(
          margin: EdgeInsets.only(
            left: level * 20.0,
            bottom: 8,
          ),
          child: _buildCategoryCard(
            category: category,
            isSelected: isSelected,
            productCount: productCount,
            hasSubcategories: hasSubcategories,
            isExpanded: isExpanded,
            onTap: () => _handleCategorySelect(category.id),
            onExpandTap: hasSubcategories ? () => _toggleCategoryExpansion(category.id) : null,
          ),
        ),
        
        if (isExpanded && hasSubcategories)
          ...subcategories.map((subcategory) =>
            _buildCategoryTree(subcategory, provider, level + 1)
          ),
      ],
    );
  }

  Widget _buildCategoryCard({
    Category? category,
    required bool isSelected,
    required int productCount,
    bool hasSubcategories = false,
    bool isExpanded = false,
    required VoidCallback onTap,
    VoidCallback? onExpandTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary.withOpacity(0.2) : AppTheme.dark700,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppTheme.primary : AppTheme.dark600,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            if (hasSubcategories)
              GestureDetector(
                onTap: onExpandTap,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  margin: const EdgeInsets.only(right: 12),
                  decoration: BoxDecoration(
                    color: AppTheme.dark600,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Icon(
                    isExpanded ? PhosphorIcons.caretDown : PhosphorIcons.caretRight,
                    color: Colors.white,
                    size: 16,
                  ),
                ),
              ),
            
            Icon(
              category == null ? PhosphorIcons.package : PhosphorIcons.folder,
              color: isSelected ? AppTheme.primary : AppTheme.dark300,
              size: 20,
            ),
            const SizedBox(width: 12),
            
            Expanded(
              child: Text(
                category?.name ?? 'Todas as categorias',
                style: TextStyle(
                  color: isSelected ? AppTheme.primary : Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.dark600,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '$productCount produto${productCount != 1 ? 's' : ''}',
                style: TextStyle(
                  color: AppTheme.dark300,
                  fontSize: 12,
                ),
              ),
            ),
            
            if (category != null) ...[
              const SizedBox(width: 8),
              _buildActionIcon(PhosphorIcons.pencilSimple, () {
                _mostrarModalEditarCategoria(category);
              }),
              _buildActionIcon(PhosphorIcons.trash, () {
                // TODO: Excluir categoria
                _showDeleteCategoryDialog(category);
              }, isDestructive: true),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildProductCard(Product product) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppTheme.dark700,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.dark600),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => EditarProdutoPage(produto: product),
              ),
            );
          },
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Nome com badge ao lado
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Flexible(
                                child: Text(
                                  product.name,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 8),
                              // Badge de status compacto
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: product.isActive 
                                      ? Colors.green.withOpacity(0.2)
                                      : Colors.red.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(
                                    color: product.isActive ? Colors.green : Colors.red,
                                    width: 1,
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      product.isActive ? PhosphorIcons.checkCircle : PhosphorIcons.prohibit,
                                      color: product.isActive ? Colors.green : Colors.red,
                                      size: 10,
                                    ),
                                    const SizedBox(width: 3),
                                    Text(
                                      product.isActive ? 'Ativo' : 'Inativo',
                                      style: TextStyle(
                                        color: product.isActive ? Colors.green : Colors.red,
                                        fontSize: 9,
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: 0.3,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          if (product.code != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              'Código: ${product.code}',
                              style: TextStyle(
                                color: AppTheme.dark400,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    
                    Row(
                      children: [
                        _buildActionIcon(PhosphorIcons.pencilSimple, () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => EditarProdutoPage(produto: product),
                            ),
                          );
                        }),
                        _buildActionIcon(PhosphorIcons.trash, () {
                          // TODO: Excluir produto
                          _showDeleteProductDialog(product);
                        }, isDestructive: true),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActionIcon(IconData icon, VoidCallback onTap, {bool isDestructive = false}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        margin: const EdgeInsets.only(left: 4),
        decoration: BoxDecoration(
          color: isDestructive 
            ? Colors.red.withOpacity(0.1)
            : AppTheme.dark600,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Icon(
          icon,
          color: isDestructive ? Colors.red : AppTheme.dark300,
          size: 16,
        ),
      ),
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
    String? createButtonLabel,
    VoidCallback? onCreateButtonPressed,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: AppTheme.dark600,
              size: 48,
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: TextStyle(
                color: AppTheme.dark300,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: TextStyle(
                color: AppTheme.dark400,
                fontSize: 14,
              ),
              textAlign: TextAlign.center,
            ),
            if (onCreateButtonPressed != null) ...[
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: onCreateButtonPressed,
                icon: Icon(PhosphorIcons.plus, size: 20),
                label: Text(createButtonLabel ?? 'Criar'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _mostrarModalCriarCategoria(CategoriesProductsProvider provider) async {
    final authProvider = context.read<AuthProvider>();
    final token = await authProvider.authToken;
    
    if (token == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Erro: Token de autenticação não encontrado'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (context) => ModalCadastroCategoria(
        categoriasDisponiveis: provider.categories,
        onSalvar: (createRequest) async {
          await provider.createCategory(createRequest, token: token);
          // Recarregar a lista de categorias após criação
          print('🔄 Recarregando lista de categorias...');
          await provider.loadCategories(token: token);
          print('✅ Lista de categorias atualizada!');
        },
        onEditar: (updateRequest) async {
          // TODO: Implementar edição de categoria
        },
      ),
    );
  }

  void _navegarParaCriarProduto() async {
    print('🔄 Navegando para cadastro de produto...');
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CadastroProdutoPage(
          initialCategoryId: _selectedCategory, // Passa a categoria selecionada
        ),
      ),
    );
    
    print('✅ Retornou da tela de cadastro: $result');
    
    // Recarregar dados quando volta da tela de cadastro
    if (mounted) {
      print('🔄 Recarregando dados após cadastro de produto...');
      await _loadData(forceRefresh: true);
    }
  }

  void _showDeleteCategoryDialog(Category category) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        title: Text(
          'Excluir Categoria',
          style: TextStyle(color: Colors.white),
        ),
        content: Text(
          'Tem certeza que deseja excluir a categoria "${category.name}"? Esta ação não pode ser desfeita.',
          style: TextStyle(color: AppTheme.dark300),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancelar', style: TextStyle(color: AppTheme.dark400)),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                final success = await context.read<CategoriesProductsProvider>().deleteCategory(category.id);
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Categoria "${category.name}" excluída')),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Erro ao excluir categoria')),
                  );
                }
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Erro ao excluir categoria: $e')),
                );
              }
            },
            child: Text('Excluir', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _mostrarModalEditarCategoria(Category categoria) {
    showDialog(
      context: context,
      builder: (context) => ModalEditarCategoria(categoria: categoria),
    ).then((result) {
      if (result != null) {
        // Recarregar categorias após editar
        final authProvider = context.read<AuthProvider>();
        authProvider.authToken.then((token) {
          final clientId = authProvider.user?.clientId;
          if (token != null && clientId != null) {
            context.read<CategoriesProductsProvider>().loadAll(token: token, clientId: clientId, forceRefresh: true);
          }
        });
      }
    });
  }

  void _showDeleteProductDialog(Product product) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        title: Text(
          'Excluir Produto',
          style: TextStyle(color: Colors.white),
        ),
        content: Text(
          'Tem certeza que deseja excluir o produto "${product.name}"? Esta ação não pode ser desfeita.',
          style: TextStyle(color: AppTheme.dark300),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancelar', style: TextStyle(color: AppTheme.dark400)),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                final success = await context.read<CategoriesProductsProvider>().deleteProduct(product.id);
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Produto "${product.name}" excluído')),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Erro ao excluir produto')),
                  );
                }
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Erro ao excluir produto: $e')),
                );
              }
            },
            child: Text('Excluir', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _mostrarModalBusca() {
    final TextEditingController buscaController = TextEditingController();
    buscaController.text = _searchTerm;
    String searchQuery = _searchTerm;

    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setModalState) {
          return Dialog(
            backgroundColor: AppTheme.dark800,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: Container(
              constraints: BoxConstraints(
                maxWidth: 500,
                maxHeight: MediaQuery.of(context).size.height * 0.8,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Header do modal
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Row(
                      children: [
                        Icon(
                          PhosphorIcons.magnifyingGlass,
                          color: AppTheme.primary,
                          size: 24,
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Text(
                            'Buscar',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
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
                  ),
                  
                  // Campo de busca
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppTheme.dark700,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppTheme.dark600),
                      ),
                      child: TextField(
                        controller: buscaController,
                        autofocus: true,
                        style: const TextStyle(color: Colors.white, fontSize: 16),
                        decoration: InputDecoration(
                          hintText: 'Digite para buscar categorias ou produtos...',
                          hintStyle: TextStyle(color: AppTheme.dark400, fontSize: 14),
                          prefixIcon: Icon(
                            PhosphorIcons.magnifyingGlass,
                            color: AppTheme.primary,
                            size: 20,
                          ),
                          suffixIcon: searchQuery.isNotEmpty
                              ? IconButton(
                                  onPressed: () {
                                    buscaController.clear();
                                    setModalState(() {
                                      searchQuery = '';
                                    });
                                    setState(() {
                                      _searchTerm = '';
                                      _searchController.clear();
                                    });
                                  },
                                  icon: Icon(
                                    PhosphorIcons.x,
                                    color: AppTheme.dark400,
                                    size: 18,
                                  ),
                                )
                              : null,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        ),
                        onChanged: (value) {
                          setModalState(() {
                            searchQuery = value.toLowerCase();
                          });
                          setState(() {
                            _searchTerm = value.toLowerCase();
                            _searchController.text = value;
                          });
                        },
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Resultados da busca
                  Expanded(
                    child: Consumer<CategoriesProductsProvider>(
                      builder: (context, provider, child) {
                        if (searchQuery.isEmpty) {
                          return Center(
                            child: Padding(
                              padding: const EdgeInsets.all(32),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    PhosphorIcons.magnifyingGlass,
                                    color: AppTheme.dark600,
                                    size: 48,
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'Digite para buscar',
                                    style: TextStyle(
                                      color: AppTheme.dark300,
                                      fontSize: 16,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Busque por nome de categoria ou produto, ou código do produto.',
                                    style: TextStyle(
                                      color: AppTheme.dark400,
                                      fontSize: 14,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ],
                              ),
                            ),
                          );
                        }

                        // Filtrar categorias
                        final filteredCategories = provider.rootCategories
                            .where((category) => category.name.toLowerCase().contains(searchQuery))
                            .toList();

                        // Filtrar produtos
                        final filteredProducts = provider.allProducts
                            .where((product) =>
                                product.name.toLowerCase().contains(searchQuery) ||
                                (product.code?.toLowerCase().contains(searchQuery) ?? false))
                            .toList();

                        // Filtrar locais
                        final filteredLocais = context.read<StorageLocationsProvider>().storageLocations
                            .where((local) =>
                                local.nome.toLowerCase().contains(searchQuery) ||
                                (local.setor?.toLowerCase().contains(searchQuery) ?? false))
                            .toList();

                        final totalResults = filteredCategories.length + filteredProducts.length + filteredLocais.length;

                        if (totalResults == 0) {
                          return Center(
                            child: Padding(
                              padding: const EdgeInsets.all(32),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    PhosphorIcons.magnifyingGlass,
                                    color: AppTheme.dark600,
                                    size: 48,
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'Nenhum resultado encontrado',
                                    style: TextStyle(
                                      color: AppTheme.dark300,
                                      fontSize: 16,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Tente ajustar sua busca',
                                    style: TextStyle(
                                      color: AppTheme.dark400,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }

                        return ListView(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          children: [
                            // Categorias
                            if (filteredCategories.isNotEmpty) ...[
                              Padding(
                                padding: const EdgeInsets.only(bottom: 12, top: 8),
                                child: Row(
                                  children: [
                                    Icon(
                                      PhosphorIcons.tray,
                                      color: AppTheme.primary,
                                      size: 18,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Categorias (${filteredCategories.length})',
                                      style: TextStyle(
                                        color: AppTheme.primary,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              ...filteredCategories.map((category) => _buildSearchResultItem(
                                icon: PhosphorIcons.folder,
                                title: category.name,
                                subtitle: '${provider.allProducts.where((p) => p.categoryId == category.id).length} produtos',
                                onTap: () {
                                  setState(() {
                                    _selectedCategory = category.id;
                                    _tabController.animateTo(1);
                                  });
                                  Navigator.pop(context);
                                },
                              )),
                              const SizedBox(height: 16),
                            ],

                            // Produtos
                            if (filteredProducts.isNotEmpty) ...[
                              Padding(
                                padding: const EdgeInsets.only(bottom: 12, top: 8),
                                child: Row(
                                  children: [
                                    Icon(
                                      PhosphorIcons.package,
                                      color: AppTheme.primary,
                                      size: 18,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Produtos (${filteredProducts.length})',
                                      style: TextStyle(
                                        color: AppTheme.primary,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              ...filteredProducts.map((product) => _buildSearchResultItem(
                                icon: PhosphorIcons.package,
                                title: product.name,
                                subtitle: product.code ?? 'Sem código',
                                onTap: () {
                                  Navigator.pop(context);
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (context) => EditarProdutoPage(produto: product),
                                    ),
                                  );
                                },
                              )),
                              const SizedBox(height: 16),
                            ],

                            // Locais
                            if (filteredLocais.isNotEmpty) ...[
                              Padding(
                                padding: const EdgeInsets.only(bottom: 12, top: 8),
                                child: Row(
                                  children: [
                                    Icon(
                                      PhosphorIcons.mapPin,
                                      color: AppTheme.primary,
                                      size: 18,
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      'Locais (${filteredLocais.length})',
                                      style: TextStyle(
                                        color: AppTheme.primary,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              ...filteredLocais.map((local) => _buildSearchResultItem(
                                icon: PhosphorIcons.mapPin,
                                title: local.nome,
                                subtitle: local.setor ?? 'Sem setor',
                                onTap: () {
                                  Navigator.pop(context);
                                  _mostrarModalArmazenamento(local);
                                },
                              )),
                            ],
                          ],
                        );
                      },
                    ),
                  ),
                  
                  // Botão de limpar
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () {
                          buscaController.clear();
                          setModalState(() {
                            searchQuery = '';
                          });
                          setState(() {
                            _searchTerm = '';
                            _searchController.clear();
                          });
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.dark300,
                          side: BorderSide(color: AppTheme.dark600),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text(
                          'Limpar busca',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSearchResultItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppTheme.dark700,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.dark600),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Icon(
                  icon,
                  color: AppTheme.primary,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: TextStyle(
                          color: AppTheme.dark400,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                Icon(
                  PhosphorIcons.arrowRight,
                  color: AppTheme.dark400,
                  size: 16,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _mostrarModalArmazenamento([StorageLocation? local]) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => CadastroLocalPage(local: local),
      ),
    );
  }
}