import 'dart:async';
import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../components/standard_header.dart';
import '../components/bottom_navigation.dart';
import '../providers/auth_provider.dart';
import '../providers/labels_provider.dart';
import '../providers/categories_products_provider.dart';
import '../providers/storage_locations_provider.dart';
import '../models/product_models.dart';
import '../models/storage_location_models.dart';
import '../services/rastreabilidade_service.dart';
import 'main_screen.dart';

class EstoqueScreen extends StatefulWidget {
  const EstoqueScreen({super.key});

  @override
  State<EstoqueScreen> createState() => _EstoqueScreenState();
}

class _EstoqueScreenState extends State<EstoqueScreen> {
  final RastreabilidadeService _rastreabilidadeService = RastreabilidadeService();
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  List<EstoqueItem> _itensEstoque = [];
  List<EstoqueItem> _itensFiltrados = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _error;
  String _searchTerm = '';
  Timer? _searchDebounce;
  
  // Paginação
  int _currentPage = 1;
  int _limit = 50;
  int _total = 0;
  int _totalPages = 0;
  bool _hasMore = true;
  
  // Filtros
  StorageLocation? _filtroLocal;
  String _filtroTipo = 'todos'; // todos, com_etiqueta, sem_etiqueta
  bool _filtroProximoVencimento = false;

  @override
  void initState() {
    super.initState();
    _loadEstoque();
    _scrollController.addListener(_onScroll);
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    _searchDebounce?.cancel();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent * 0.8) {
      // Carregar mais quando chegar a 80% do scroll
      if (!_isLoadingMore && _hasMore && !_isLoading) {
        _loadMoreEstoque();
      }
    }
  }

  Future<void> _loadEstoque({bool reset = true}) async {
    if (reset) {
      setState(() {
        _isLoading = true;
        _error = null;
        _currentPage = 1;
        _itensEstoque = [];
        _hasMore = true;
      });
    }

    try {
      // Buscar estoque processado diretamente do backend
      final result = await _rastreabilidadeService.getEstoque(
        search: _searchTerm.isEmpty ? null : _searchTerm,
        page: _currentPage,
        limit: _limit,
      );
      
      final data = (result['data'] as List<dynamic>)
          .map((item) {
            return EstoqueItem(
              productId: item['productId'] as String,
              productName: item['productName'] as String,
              productCode: item['productCode'] as String?,
              productType: item['productType'] as String,
              quantidadeEtiquetas: (item['quantidadeEtiquetas'] as int?) ?? 0,
              quantidadeSemEtiqueta: (item['quantidadeSemEtiqueta'] as int?) ?? 0,
              quantidadeContagem: (item['quantidadeContagem'] as int?) ?? 0,
          quantidadeProximoVencimento: (item['quantidadeProximoVencimento'] as int?) ?? 0,
          etiquetas: (item['etiquetas'] as List?)?.map((e) => e as Map<String, dynamic>).toList() ?? [],
          recebimentosSemEtiqueta: (item['recebimentosSemEtiqueta'] as List?)?.map((r) => r as Map<String, dynamic>).toList() ?? [],
          contagens: (item['contagens'] as List?)?.map((c) => c as Map<String, dynamic>).toList() ?? [],
            );
          })
          .toList();
      
      final meta = result['meta'] as Map<String, dynamic>;
      
      print('📊 DEBUG - Itens de estoque recebidos: ${data.length} (página $_currentPage de ${meta['totalPages']})');
      
      setState(() {
        if (reset) {
          _itensEstoque = data;
        } else {
          _itensEstoque.addAll(data);
        }
        _total = meta['total'] as int;
        _totalPages = meta['totalPages'] as int;
        _hasMore = meta['hasNextPage'] as bool;
        _aplicarFiltros();
        _isLoading = false;
        _isLoadingMore = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
        _isLoadingMore = false;
      });
    }
  }

  Future<void> _loadMoreEstoque() async {
    if (_isLoadingMore || !_hasMore) return;
    
    setState(() {
      _isLoadingMore = true;
      _currentPage++;
    });

    await _loadEstoque(reset: false);
  }

  // Método removido - processamento agora é feito no backend via endpoint /estoque
  void _processarEstoque_OLD(
    List<Product> produtos,
    List<Map<String, dynamic>> etiquetas,
    List<Map<String, dynamic>> recebimentos,
  ) {
    final Map<String, EstoqueItem> estoqueMap = {};

    // Agrupar etiquetas por produto (apenas etiquetas ativas: pending ou printed)
    for (final etiqueta in etiquetas) {
      // Tenta obter productId de duas formas: direto ou dentro de product
      final productId = etiqueta['productId'] as String? ?? 
                       etiqueta['product']?['id'] as String?;
      final status = etiqueta['status'] as String?;
      
      // Considera apenas etiquetas ativas (pending ou printed, não consumed ou failed)
      if (productId == null || productId.isEmpty) {
        print('⚠️ DEBUG - Etiqueta sem productId: ${etiqueta['code'] ?? 'sem código'}');
        continue;
      }
      if (status == null) {
        print('⚠️ DEBUG - Etiqueta sem status: ${etiqueta['code'] ?? 'sem código'}');
        continue;
      }
      if (status == 'consumed' || status == 'failed') continue;

      if (!estoqueMap.containsKey(productId)) {
        final produto = produtos.firstWhere(
          (p) => p.id == productId,
          orElse: () => Product(
            id: productId,
            name: etiqueta['productName'] ?? 'Produto desconhecido',
            clientId: '',
            categoryId: '',
            type: 'raw_material',
            isActive: true,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          ),
        );
        
        estoqueMap[productId] = EstoqueItem(
          productId: productId,
          productName: produto.name,
          productCode: produto.code,
          productType: produto.type,
          quantidadeEtiquetas: 0,
          quantidadeSemEtiqueta: 0,
          quantidadeContagem: 0,
          etiquetas: [],
          recebimentosSemEtiqueta: [],
          contagens: [],
        );
      }

      estoqueMap[productId]!.quantidadeEtiquetas++;
      estoqueMap[productId]!.etiquetas.add(etiqueta);
      
      // Verificar vencimento próximo (7 dias)
      final validityDate = DateTime.tryParse(etiqueta['validityDate'] ?? '');
      if (validityDate != null) {
        final diasRestantes = validityDate.difference(DateTime.now()).inDays;
        if (diasRestantes >= 0 && diasRestantes <= 7) {
          estoqueMap[productId]!.quantidadeProximoVencimento++;
        }
      }
    }

    // Verificar recebimentos que NÃO geraram etiquetas ou que geraram mas não foram impressas
    // Criar um mapa de recebimentos que já têm etiquetas impressas
    final recebimentosComEtiquetasImpressas = <String>{};
    for (final etiqueta in etiquetas) {
      // Tenta obter receiptId de duas formas: direto ou dentro de metadata/receipt
      final receiptId = etiqueta['receiptId'] as String? ?? 
                       etiqueta['metadata']?['receiptId'] as String?;
      final status = etiqueta['status'] as String?;
      // Se a etiqueta está vinculada a um recebimento e foi impressa, marca o recebimento
      if (receiptId != null && receiptId.isNotEmpty && status == 'printed') {
        recebimentosComEtiquetasImpressas.add(receiptId);
      }
    }
    
    print('📊 DEBUG - Recebimentos com etiquetas impressas: ${recebimentosComEtiquetasImpressas.length}');

    // Adicionar recebimentos sem etiqueta impressa
    for (final recebimento in recebimentos) {
      final receiptId = recebimento['id'] as String?;
      
      // Pula recebimentos que já têm etiquetas impressas (evita duplicação)
      if (receiptId != null && recebimentosComEtiquetasImpressas.contains(receiptId)) {
        continue;
      }
      
      // Pula se gerou etiquetas automaticamente (já deve ter etiquetas)
      if (recebimento['generateLabels'] == true) {
        // Verifica se realmente tem etiquetas impressas
        if (receiptId != null && !recebimentosComEtiquetasImpressas.contains(receiptId)) {
          // Se generateLabels=true mas não tem etiquetas impressas, ainda pode adicionar
          // (caso a impressão tenha falhado ou não foi concluída)
        } else {
          continue;
        }
      }
      
      final productName = recebimento['productName'] as String?;
      if (productName == null) continue;

      // Tentar encontrar produto correspondente usando productId se disponível
      Product? produto;
      final productIdFromReceipt = recebimento['productId'] as String?;
      
      if (productIdFromReceipt != null) {
        try {
          produto = produtos.firstWhere((p) => p.id == productIdFromReceipt);
        } catch (e) {
          // Se não encontrar pelo ID, tenta pelo nome
          try {
            produto = produtos.firstWhere(
              (p) => p.name.toLowerCase() == productName.toLowerCase(),
            );
          } catch (e2) {
            // Criar produto temporário se não encontrar
            produto = Product(
              id: productIdFromReceipt,
              name: productName,
              clientId: '',
              categoryId: '',
              type: 'raw_material',
              isActive: true,
              createdAt: DateTime.now(),
              updatedAt: DateTime.now(),
            );
          }
        }
      } else {
        // Tenta encontrar pelo nome se não tiver productId
        try {
          produto = produtos.firstWhere(
            (p) => p.name.toLowerCase() == productName.toLowerCase(),
          );
        } catch (e) {
          // Criar produto temporário se não encontrar
          produto = Product(
            id: 'temp_${productName.hashCode}',
            name: productName,
            clientId: '',
            categoryId: '',
            type: 'raw_material',
            isActive: true,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          );
        }
      }

      final productId = produto.id;
      final quantityValue = recebimento['quantity'];
      final quantidade = quantityValue is int 
          ? quantityValue 
          : (quantityValue is String ? int.tryParse(quantityValue) ?? 0 : 0);

      if (!estoqueMap.containsKey(productId)) {
        estoqueMap[productId] = EstoqueItem(
          productId: productId,
          productName: produto.name,
          productCode: produto.code,
          productType: produto.type,
          quantidadeEtiquetas: 0,
          quantidadeSemEtiqueta: 0,
          quantidadeContagem: 0,
          etiquetas: [],
          recebimentosSemEtiqueta: [],
          contagens: [],
        );
      }

      estoqueMap[productId]!.quantidadeSemEtiqueta += quantidade;
      estoqueMap[productId]!.recebimentosSemEtiqueta.add(recebimento);
    }

    // Filtrar apenas produtos com etiquetas ativas OU recebimentos sem etiqueta impressa
    _itensEstoque = estoqueMap.values
        .where((item) => item.quantidadeEtiquetas > 0 || item.recebimentosSemEtiqueta.isNotEmpty)
        .toList()
      ..sort((a, b) => a.productName.compareTo(b.productName));
    
    print('✅ DEBUG _processarEstoque - Finalizado:');
    print('  Itens de estoque criados: ${_itensEstoque.length}');
    for (final item in _itensEstoque) {
      print('    - ${item.productName}: ${item.quantidadeEtiquetas} etiquetas, ${item.quantidadeSemEtiqueta} sem etiqueta');
    }
  }

  void _aplicarFiltros() {
    // Os filtros de tipo e vencimento são aplicados localmente
    // A busca já é feita no backend via parâmetro search
    var filtrados = List<EstoqueItem>.from(_itensEstoque);

    // Filtro por tipo (aplicado localmente)
    if (_filtroTipo == 'com_etiqueta') {
      filtrados = filtrados.where((item) => item.quantidadeEtiquetas > 0).toList();
    } else if (_filtroTipo == 'sem_etiqueta') {
      filtrados = filtrados.where((item) => item.quantidadeSemEtiqueta > 0).toList();
    }

    // Filtro por vencimento próximo (aplicado localmente)
    if (_filtroProximoVencimento) {
      filtrados = filtrados.where((item) => item.quantidadeProximoVencimento > 0).toList();
    }

    setState(() {
      _itensFiltrados = filtrados;
    });
  }

  void _onSearchChanged() {
    // Recarregar quando o termo de busca mudar (com debounce)
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 500), () {
      final currentSearch = _searchController.text;
      if (currentSearch != _searchTerm) {
        setState(() {
          _searchTerm = currentSearch;
        });
        _loadEstoque(reset: true);
      }
    });
  }

  void _mostrarFiltros() {
    final locationsProvider = context.read<StorageLocationsProvider>();
    
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.dark800,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Filtros',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(PhosphorIcons.x, color: AppTheme.dark300),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Tipo
              Text(
                'Tipo de Estoque',
                style: TextStyle(
                  color: AppTheme.dark300,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  _buildFilterChip(
                    label: 'Todos',
                    selected: _filtroTipo == 'todos',
                    onSelected: (v) => setModalState(() => _filtroTipo = 'todos'),
                  ),
                  _buildFilterChip(
                    label: 'Com Etiqueta',
                    selected: _filtroTipo == 'com_etiqueta',
                    onSelected: (v) => setModalState(() => _filtroTipo = 'com_etiqueta'),
                  ),
                  _buildFilterChip(
                    label: 'Sem Etiqueta',
                    selected: _filtroTipo == 'sem_etiqueta',
                    onSelected: (v) => setModalState(() => _filtroTipo = 'sem_etiqueta'),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Vencimento
              CheckboxListTile(
                value: _filtroProximoVencimento,
                onChanged: (v) => setModalState(() => _filtroProximoVencimento = v ?? false),
                title: const Text(
                  'Próximo ao vencimento',
                  style: TextStyle(color: Colors.white),
                ),
                subtitle: Text(
                  'Produtos com validade em até 7 dias',
                  style: TextStyle(color: AppTheme.dark400, fontSize: 12),
                ),
                activeColor: AppTheme.primary,
                contentPadding: EdgeInsets.zero,
              ),
              const SizedBox(height: 24),

              // Botões
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        setModalState(() {
                          _filtroTipo = 'todos';
                          _filtroLocal = null;
                          _filtroProximoVencimento = false;
                        });
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.dark300,
                        side: BorderSide(color: AppTheme.dark600),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text('Limpar'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        _aplicarFiltros();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text('Aplicar'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChip({
    required String label,
    required bool selected,
    required Function(bool) onSelected,
  }) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: onSelected,
      backgroundColor: AppTheme.dark700,
      selectedColor: AppTheme.primary.withOpacity(0.2),
      checkmarkColor: AppTheme.primary,
      labelStyle: TextStyle(
        color: selected ? AppTheme.primary : AppTheme.dark300,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(
          color: selected ? AppTheme.primary : AppTheme.dark600,
        ),
      ),
    );
  }

  void _mostrarDetalhesEstoque(EstoqueItem item) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.dark800,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.85,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    PhosphorIcons.package,
                    color: AppTheme.primary,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.productName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (item.productCode != null)
                        Text(
                          'Código: ${item.productCode}',
                          style: TextStyle(
                            color: AppTheme.dark400,
                            fontSize: 13,
                          ),
                        ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(PhosphorIcons.x, color: AppTheme.dark300),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Resumo - 3 colunas: Etiquetas, Contagem, Recebimento
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.dark700,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      children: [
                        Text(
                          '${item.quantidadeEtiquetas}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Etiquetas',
                          style: TextStyle(
                            color: AppTheme.dark400,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(width: 1, height: 40, color: AppTheme.dark600),
                  Expanded(
                    child: Column(
                      children: [
                        Text(
                          '${item.quantidadeContagem}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Contagem',
                          style: TextStyle(
                            color: AppTheme.dark400,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(width: 1, height: 40, color: AppTheme.dark600),
                  Expanded(
                    child: Column(
                      children: [
                        Text(
                          '${item.quantidadeSemEtiqueta}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Recebimento',
                          style: TextStyle(
                            color: AppTheme.dark400,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Abas
            DefaultTabController(
              length: _getTabCount(item),
              child: Column(
                children: [
                  TabBar(
                    indicatorColor: AppTheme.primary,
                    labelColor: AppTheme.primary,
                    unselectedLabelColor: AppTheme.dark400,
                    tabs: _buildTabs(item),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 400,
                    child: TabBarView(
                      children: _buildTabViews(item),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEtiquetasList(List<Map<String, dynamic>> etiquetas) {
    if (etiquetas.isEmpty) {
      return Center(
        child: Text(
          'Nenhuma etiqueta',
          style: TextStyle(color: AppTheme.dark400),
        ),
      );
    }

    return ListView.builder(
      itemCount: etiquetas.length,
      itemBuilder: (context, index) {
        final etiqueta = etiquetas[index];
        final code = etiqueta['code'] ?? '';
        final validityDate = DateTime.tryParse(etiqueta['validityDate'] ?? '');
        
        // Verificar status de vencimento
        String? statusVencimento;
        Color? corStatus;
        Color? corBorda;
        
        if (validityDate != null) {
          final hoje = DateTime.now();
          final diasRestantes = validityDate.difference(hoje).inDays;
          
          if (diasRestantes < 0) {
            // Vencido
            statusVencimento = 'Vencido';
            corStatus = Colors.red;
            corBorda = Colors.red;
          } else if (diasRestantes <= 7) {
            // Próximo ao vencimento
            statusVencimento = 'Próximo ao vencimento';
            corStatus = Colors.orange;
            corBorda = Colors.orange;
          }
        }
        
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppTheme.dark700,
            borderRadius: BorderRadius.circular(8),
            border: corBorda != null ? Border.all(color: corBorda, width: 1.5) : null,
          ),
          child: Row(
            children: [
              Icon(
                PhosphorIcons.tag,
                color: corStatus ?? AppTheme.primary,
                size: 18,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            code,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        if (statusVencimento != null)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: corStatus!.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              statusVencimento,
                              style: TextStyle(
                                color: corStatus,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                      ],
                    ),
                    if (validityDate != null)
                      Text(
                        'Validade: ${DateFormat('dd/MM/yyyy').format(validityDate)}',
                        style: TextStyle(
                          color: corStatus ?? AppTheme.dark400,
                          fontSize: 12,
                          fontWeight: corStatus != null ? FontWeight.w500 : FontWeight.normal,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  int _getTabCount(EstoqueItem item) {
    int count = 1; // Sempre tem Etiquetas
    if (item.quantidadeSemEtiqueta > 0) count++;
    if (item.quantidadeContagem > 0) count++;
    return count;
  }

  List<Tab> _buildTabs(EstoqueItem item) {
    final tabs = <Tab>[
      Tab(text: 'Etiquetas (${item.quantidadeEtiquetas})'),
    ];
    if (item.quantidadeSemEtiqueta > 0) {
      tabs.add(Tab(text: 'Lotes (${item.recebimentosSemEtiqueta.length})'));
    }
    if (item.quantidadeContagem > 0) {
      tabs.add(Tab(text: 'Contagens (${item.contagens.length})'));
    }
    return tabs;
  }

  List<Widget> _buildTabViews(EstoqueItem item) {
    final views = <Widget>[
      // Lista de etiquetas
      _buildEtiquetasList(item.etiquetas),
    ];
    if (item.quantidadeSemEtiqueta > 0) {
      views.add(_buildRecebimentosList(item.recebimentosSemEtiqueta));
    }
    if (item.quantidadeContagem > 0) {
      views.add(_buildContagensList(item.contagens));
    }
    return views;
  }

  Widget _buildRecebimentosList(List<Map<String, dynamic>> recebimentos) {
    if (recebimentos.isEmpty) {
      return Center(
        child: Text(
          'Nenhum lote',
          style: TextStyle(color: AppTheme.dark400),
        ),
      );
    }

    return ListView.builder(
      itemCount: recebimentos.length,
      itemBuilder: (context, index) {
        final recebimento = recebimentos[index];
        final quantityValue = recebimento['quantity'];
        final quantidade = quantityValue is int 
            ? quantityValue 
            : (quantityValue is String ? int.tryParse(quantityValue) ?? 0 : 0);
        final unit = recebimento['unit'] ?? 'UN';
        final supplierName = recebimento['supplierName'] ?? '';
        final createdAt = DateTime.tryParse(recebimento['createdAt'] ?? '');
        
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppTheme.dark700,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Icon(PhosphorIcons.package, color: AppTheme.primary, size: 18),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$quantidade $unit',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    if (supplierName.isNotEmpty)
                      Text(
                        supplierName,
                        style: TextStyle(
                          color: AppTheme.dark400,
                          fontSize: 12,
                        ),
                      ),
                    if (createdAt != null)
                      Text(
                        DateFormat('dd/MM/yyyy').format(createdAt),
                        style: TextStyle(
                          color: AppTheme.dark400,
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildContagensList(List<Map<String, dynamic>> contagens) {
    if (contagens.isEmpty) {
      return Center(
        child: Text(
          'Nenhuma contagem',
          style: TextStyle(color: AppTheme.dark400),
        ),
      );
    }

    return ListView.builder(
      itemCount: contagens.length,
      itemBuilder: (context, index) {
        final contagem = contagens[index];
        final id = contagem['id'] ?? '';
        final quantity = contagem['quantity'] ?? 0;
        final countDate = contagem['countDate'] != null
            ? DateTime.tryParse(contagem['countDate'].toString())
            : null;
        final createdAt = contagem['createdAt'] != null
            ? DateTime.tryParse(contagem['createdAt'].toString())
            : null;
        
        // Usar countDate se disponível, senão createdAt
        final dataContagem = countDate ?? createdAt;
        
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppTheme.dark700,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              Icon(PhosphorIcons.clipboardText, color: AppTheme.primary, size: 18),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Contagem #${id.length >= 8 ? id.substring(0, 8) : id}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        Text(
                          'Qtd: ${quantity is num ? quantity.toStringAsFixed(0) : quantity.toString()}',
                          style: TextStyle(
                            color: AppTheme.primary,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    if (dataContagem != null)
                      Text(
                        'Data: ${DateFormat('dd/MM/yyyy').format(dataContagem)}',
                        style: TextStyle(
                          color: AppTheme.dark400,
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      body: Column(
        children: [
          // Header
          StandardHeader(
            title: 'Estoque',
            subtitle: '${_itensFiltrados.length} produtos',
            showBack: true,
            showSearch: false,
            showHome: false,
            iconColor: AppTheme.primary,
            showLeading: true,
            leadingIcon: PhosphorIcons.package,
          ),

          // Barra de busca e filtros
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppTheme.dark800,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.dark600),
                    ),
                    child: TextField(
                      controller: _searchController,
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: 'Buscar produto...',
                        hintStyle: TextStyle(color: AppTheme.dark400),
                        prefixIcon: Icon(
                          PhosphorIcons.magnifyingGlass,
                          color: AppTheme.dark400,
                          size: 20,
                        ),
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                      ),
                      onChanged: (value) {
                        // A busca será feita no backend via _onSearchChanged
                      },
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  decoration: BoxDecoration(
                    color: (_filtroTipo != 'todos' || _filtroProximoVencimento)
                        ? AppTheme.primary.withOpacity(0.2)
                        : AppTheme.dark800,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: (_filtroTipo != 'todos' || _filtroProximoVencimento)
                          ? AppTheme.primary
                          : AppTheme.dark600,
                    ),
                  ),
                  child: IconButton(
                    onPressed: _mostrarFiltros,
                    icon: Icon(
                      PhosphorIcons.funnelSimple,
                      color: (_filtroTipo != 'todos' || _filtroProximoVencimento)
                          ? AppTheme.primary
                          : AppTheme.dark400,
                    ),
                    tooltip: 'Filtros',
                  ),
                ),
              ],
            ),
          ),

          // Conteúdo
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: AppTheme.primary),
                  )
                : _error != null
                    ? _buildErrorState()
                    : _itensFiltrados.isEmpty
                        ? _buildEmptyState()
                        : RefreshIndicator(
                            onRefresh: _loadEstoque,
                            color: AppTheme.primary,
                            child: ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: _itensFiltrados.length,
                              itemBuilder: (context, index) {
                                return _buildEstoqueCard(_itensFiltrados[index]);
                              },
                            ),
                          ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: BottomNavigation(
          currentIndex: 2,
          onTap: (index) {
            Navigator.of(context).pushAndRemoveUntil(
              MaterialPageRoute(
                builder: (context) => MainScreen(initialIndex: index),
              ),
              (route) => false,
            );
          },
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              PhosphorIcons.warning,
              size: 64,
              color: Colors.red.withOpacity(0.7),
            ),
            const SizedBox(height: 16),
            const Text(
              'Erro ao carregar estoque',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _error ?? 'Erro desconhecido',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppTheme.dark300,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _loadEstoque,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              icon: Icon(PhosphorIcons.arrowClockwise),
              label: const Text('Tentar Novamente'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              PhosphorIcons.package,
              size: 64,
              color: AppTheme.dark400,
            ),
            const SizedBox(height: 16),
            Text(
              _searchTerm.isNotEmpty || _filtroTipo != 'todos'
                  ? 'Nenhum produto encontrado'
                  : 'Estoque vazio',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _searchTerm.isNotEmpty || _filtroTipo != 'todos'
                  ? 'Tente ajustar os filtros'
                  : 'Registre recebimentos ou crie etiquetas',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppTheme.dark300,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEstoqueCard(EstoqueItem item) {
    final temVencimentoProximo = item.quantidadeProximoVencimento > 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.dark800,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: temVencimentoProximo ? Colors.orange : AppTheme.dark600,
        ),
      ),
      child: InkWell(
        onTap: () => _mostrarDetalhesEstoque(item),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              // Ícone
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  PhosphorIcons.package,
                  color: AppTheme.primary,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),

              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.productName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        if (item.productCode != null) ...[
                          Text(
                            item.productCode!,
                            style: TextStyle(
                              color: AppTheme.dark400,
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(width: 8),
                        ],
                        if (item.quantidadeEtiquetas > 0) ...[
                          Icon(PhosphorIcons.tag, color: AppTheme.dark400, size: 12),
                          const SizedBox(width: 4),
                          Text(
                            '${item.quantidadeEtiquetas}',
                            style: TextStyle(
                              color: AppTheme.dark400,
                              fontSize: 12,
                            ),
                          ),
                        ],
                        if (item.quantidadeSemEtiqueta > 0) ...[
                          const SizedBox(width: 8),
                          Icon(PhosphorIcons.package, color: AppTheme.dark400, size: 12),
                          const SizedBox(width: 4),
                          Text(
                            '${item.quantidadeSemEtiqueta}',
                            style: TextStyle(
                              color: AppTheme.dark400,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (temVencimentoProximo)
                      Container(
                        margin: const EdgeInsets.only(top: 4),
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.orange.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(PhosphorIcons.warning, color: Colors.orange, size: 12),
                            const SizedBox(width: 4),
                            Text(
                              '${item.quantidadeProximoVencimento} próximo(s) ao vencimento',
                              style: const TextStyle(
                                color: Colors.orange,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),

              // Apenas Total na listagem
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${item.quantidadeTotal}',
                    style: const TextStyle(
                      color: AppTheme.primary,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    'Total',
                    style: TextStyle(
                      color: AppTheme.dark400,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 8),
              Icon(
                PhosphorIcons.caretRight,
                color: AppTheme.dark400,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Modelo de item de estoque
class EstoqueItem {
  final String productId;
  final String productName;
  final String? productCode;
  final String productType;
  int quantidadeEtiquetas;
  int quantidadeSemEtiqueta;
  int quantidadeContagem;
  int quantidadeProximoVencimento;
  final List<Map<String, dynamic>> etiquetas;
  final List<Map<String, dynamic>> recebimentosSemEtiqueta;
  final List<Map<String, dynamic>> contagens;

  EstoqueItem({
    required this.productId,
    required this.productName,
    this.productCode,
    required this.productType,
    required this.quantidadeEtiquetas,
    required this.quantidadeSemEtiqueta,
    required this.quantidadeContagem,
    required this.etiquetas,
    required this.recebimentosSemEtiqueta,
    required this.contagens,
    this.quantidadeProximoVencimento = 0,
  });

  int get quantidadeTotal => quantidadeEtiquetas + quantidadeSemEtiqueta + quantidadeContagem;
}

