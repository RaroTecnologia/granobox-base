import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../components/standard_header.dart';
import '../components/bottom_navigation.dart';
import '../providers/auth_provider.dart';
import '../services/rastreabilidade_service.dart';
import 'main_screen.dart';

class RecebimentosListScreen extends StatefulWidget {
  const RecebimentosListScreen({super.key});

  @override
  State<RecebimentosListScreen> createState() => _RecebimentosListScreenState();
}

class _RecebimentosListScreenState extends State<RecebimentosListScreen> {
  final RastreabilidadeService _rastreabilidadeService = RastreabilidadeService();
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  List<Map<String, dynamic>> _recebimentos = [];
  List<Map<String, dynamic>> _recebimentosFiltrados = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _error;
  String _searchTerm = '';
  
  // Paginação
  int _currentPage = 1;
  int _limit = 20;
  int _total = 0;
  int _totalPages = 0;
  bool _hasMore = true;
  
  // Filtros
  String _filtroStatus = 'todos'; // todos, conforme, parcial, nao_conforme
  DateTime? _filtroDataInicio;
  DateTime? _filtroDataFim;

  @override
  void initState() {
    super.initState();
    _loadRecebimentos();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent * 0.8) {
      // Carregar mais quando chegar a 80% do scroll
      if (!_isLoadingMore && _hasMore) {
        _loadMoreRecebimentos();
      }
    }
  }

  Future<void> _loadRecebimentos({bool reset = true}) async {
    if (reset) {
      setState(() {
        _isLoading = true;
        _error = null;
        _currentPage = 1;
        _recebimentos = [];
        _hasMore = true;
      });
    }

    try {
      final result = await _rastreabilidadeService.listRecebimentosPaginated(
        page: _currentPage,
        limit: _limit,
        search: _searchTerm.isNotEmpty ? _searchTerm : null,
      );

      final data = (result['data'] as List<dynamic>)
          .map((json) => json as Map<String, dynamic>)
          .toList();
      
      final meta = result['meta'] as Map<String, dynamic>;

      setState(() {
        if (reset) {
          _recebimentos = data;
        } else {
          _recebimentos.addAll(data);
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

  Future<void> _loadMoreRecebimentos() async {
    if (_isLoadingMore || !_hasMore) return;

    setState(() {
      _isLoadingMore = true;
      _currentPage++;
    });

    await _loadRecebimentos(reset: false);
  }

  void _aplicarFiltros() {
    var filtrados = List<Map<String, dynamic>>.from(_recebimentos);

    // Busca de texto agora é feita no servidor, não precisa filtrar localmente

    // Filtro por status (aplicado localmente)
    if (_filtroStatus != 'todos') {
      filtrados = filtrados.where((r) => r['condition'] == _filtroStatus).toList();
    }

    // Filtro por data (aplicado localmente)
    if (_filtroDataInicio != null) {
      filtrados = filtrados.where((r) {
        final createdAt = DateTime.tryParse(r['createdAt'] ?? '');
        if (createdAt == null) return false;
        return createdAt.isAfter(_filtroDataInicio!.subtract(const Duration(days: 1)));
      }).toList();
    }

    if (_filtroDataFim != null) {
      filtrados = filtrados.where((r) {
        final createdAt = DateTime.tryParse(r['createdAt'] ?? '');
        if (createdAt == null) return false;
        return createdAt.isBefore(_filtroDataFim!.add(const Duration(days: 1)));
      }).toList();
    }

    // Ordenar por data (mais recente primeiro) - já vem ordenado do servidor, mas mantemos para garantir
    filtrados.sort((a, b) {
      final dateA = DateTime.tryParse(a['createdAt'] ?? '') ?? DateTime(1900);
      final dateB = DateTime.tryParse(b['createdAt'] ?? '') ?? DateTime(1900);
      return dateB.compareTo(dateA);
    });

    setState(() {
      _recebimentosFiltrados = filtrados;
    });
  }

  void _mostrarFiltros() {
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

              // Status
              Text(
                'Condição',
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
                    value: 'todos',
                    selected: _filtroStatus == 'todos',
                    onSelected: (v) => setModalState(() => _filtroStatus = 'todos'),
                  ),
                  _buildFilterChip(
                    label: 'Conforme',
                    value: 'conforme',
                    selected: _filtroStatus == 'conforme',
                    onSelected: (v) => setModalState(() => _filtroStatus = 'conforme'),
                    color: Colors.green,
                  ),
                  _buildFilterChip(
                    label: 'Parcial',
                    value: 'parcial',
                    selected: _filtroStatus == 'parcial',
                    onSelected: (v) => setModalState(() => _filtroStatus = 'parcial'),
                    color: Colors.orange,
                  ),
                  _buildFilterChip(
                    label: 'Não Conforme',
                    value: 'nao_conforme',
                    selected: _filtroStatus == 'nao_conforme',
                    onSelected: (v) => setModalState(() => _filtroStatus = 'nao_conforme'),
                    color: Colors.red,
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Data
              Text(
                'Período',
                style: TextStyle(
                  color: AppTheme.dark300,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: _buildDateFilterButton(
                      label: 'Data Início',
                      date: _filtroDataInicio,
                      onTap: () async {
                        final date = await showDatePicker(
                          context: context,
                          initialDate: _filtroDataInicio ?? DateTime.now(),
                          firstDate: DateTime.now().subtract(const Duration(days: 365)),
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
                        if (date != null) {
                          setModalState(() => _filtroDataInicio = date);
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildDateFilterButton(
                      label: 'Data Fim',
                      date: _filtroDataFim,
                      onTap: () async {
                        final date = await showDatePicker(
                          context: context,
                          initialDate: _filtroDataFim ?? DateTime.now(),
                          firstDate: DateTime.now().subtract(const Duration(days: 365)),
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
                        if (date != null) {
                          setModalState(() => _filtroDataFim = date);
                        }
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Botões
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        setModalState(() {
                          _filtroStatus = 'todos';
                          _filtroDataInicio = null;
                          _filtroDataFim = null;
                        });
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.dark300,
                        side: BorderSide(color: AppTheme.dark600),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
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
                        _loadRecebimentos(); // Recarregar com filtros
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
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
    required String value,
    required bool selected,
    required Function(bool) onSelected,
    Color? color,
  }) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: onSelected,
      backgroundColor: AppTheme.dark700,
      selectedColor: (color ?? AppTheme.primary).withOpacity(0.2),
      checkmarkColor: color ?? AppTheme.primary,
      labelStyle: TextStyle(
        color: selected ? (color ?? AppTheme.primary) : AppTheme.dark300,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(
          color: selected ? (color ?? AppTheme.primary) : AppTheme.dark600,
        ),
      ),
    );
  }

  Widget _buildDateFilterButton({
    required String label,
    required DateTime? date,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: AppTheme.dark700,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: date != null ? AppTheme.primary : AppTheme.dark600),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                date != null
                    ? DateFormat('dd/MM/yyyy').format(date)
                    : label,
                style: TextStyle(
                  color: date != null ? Colors.white : AppTheme.dark400,
                ),
              ),
            ),
            Icon(
              PhosphorIcons.calendar,
              color: date != null ? AppTheme.primary : AppTheme.dark400,
              size: 18,
            ),
          ],
        ),
      ),
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
            title: 'Recebimentos',
            subtitle: '${_recebimentosFiltrados.length} registros',
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
                        hintText: 'Buscar por produto, fornecedor, lote ou nota fiscal...',
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
                        setState(() => _searchTerm = value);
                        // Debounce: recarregar após 500ms sem digitar
                        Future.delayed(const Duration(milliseconds: 500), () {
                          if (_searchController.text == value) {
                            _loadRecebimentos();
                          }
                        });
                      },
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  decoration: BoxDecoration(
                    color: (_filtroStatus != 'todos' || _filtroDataInicio != null || _filtroDataFim != null)
                        ? AppTheme.primary.withOpacity(0.2)
                        : AppTheme.dark800,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: (_filtroStatus != 'todos' || _filtroDataInicio != null || _filtroDataFim != null)
                          ? AppTheme.primary
                          : AppTheme.dark600,
                    ),
                  ),
                  child: IconButton(
                    onPressed: _mostrarFiltros,
                    icon: Icon(
                      PhosphorIcons.funnelSimple,
                      color: (_filtroStatus != 'todos' || _filtroDataInicio != null || _filtroDataFim != null)
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
                    : _recebimentosFiltrados.isEmpty
                        ? _buildEmptyState()
                        : RefreshIndicator(
                            onRefresh: () => _loadRecebimentos(),
                            color: AppTheme.primary,
                            child: ListView.builder(
                              controller: _scrollController,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: _recebimentosFiltrados.length + (_isLoadingMore ? 1 : 0),
                              itemBuilder: (context, index) {
                                if (index == _recebimentosFiltrados.length) {
                                  // Indicador de carregamento no final
                                  return const Padding(
                                    padding: EdgeInsets.all(16.0),
                                    child: Center(
                                      child: CircularProgressIndicator(color: AppTheme.primary),
                                    ),
                                  );
                                }
                                return _buildRecebimentoCard(_recebimentosFiltrados[index]);
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
            Text(
              'Erro ao carregar recebimentos',
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
              onPressed: _loadRecebimentos,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
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
              _searchTerm.isNotEmpty || _filtroStatus != 'todos'
                  ? 'Nenhum recebimento encontrado'
                  : 'Nenhum recebimento registrado',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _searchTerm.isNotEmpty || _filtroStatus != 'todos'
                  ? 'Tente ajustar os filtros'
                  : 'Registre o primeiro recebimento de mercadoria',
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

  Widget _buildRecebimentoCard(Map<String, dynamic> recebimento) {
    final productName = recebimento['productName'] ?? 'Produto não informado';
    final supplierName = recebimento['supplierName'] ?? 'Fornecedor não informado';
    final quantityValue = recebimento['quantity'];
    final quantity = quantityValue is num ? quantityValue.toDouble() : (double.tryParse(quantityValue?.toString() ?? '0') ?? 0);
    final unit = recebimento['unit'] ?? 'UN';
    final condition = recebimento['condition'] ?? 'conforme';
    final batchNumber = recebimento['batchNumber'];
    final invoiceNumber = recebimento['invoiceNumber'] ?? recebimento['supplierCode'];
    final createdAt = DateTime.tryParse(recebimento['createdAt'] ?? '');
    final temperature = recebimento['temperature'];

    Color conditionColor;
    IconData conditionIcon;
    String conditionLabel;

    switch (condition) {
      case 'conforme':
        conditionColor = Colors.green;
        conditionIcon = PhosphorIcons.checkCircle;
        conditionLabel = 'Conforme';
        break;
      case 'parcial':
        conditionColor = Colors.orange;
        conditionIcon = PhosphorIcons.warningCircle;
        conditionLabel = 'Parcial';
        break;
      case 'nao_conforme':
        conditionColor = Colors.red;
        conditionIcon = PhosphorIcons.xCircle;
        conditionLabel = 'Não Conforme';
        break;
      default:
        conditionColor = AppTheme.dark400;
        conditionIcon = PhosphorIcons.question;
        conditionLabel = 'Desconhecido';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.dark800,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.dark600),
      ),
      child: InkWell(
        onTap: () => _mostrarDetalhes(recebimento),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header do card
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
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
                          productName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          supplierName,
                          style: TextStyle(
                            color: AppTheme.dark300,
                            fontSize: 13,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: conditionColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: conditionColor.withOpacity(0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(conditionIcon, color: conditionColor, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          conditionLabel,
                          style: TextStyle(
                            color: conditionColor,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(color: AppTheme.dark600, height: 1),
              const SizedBox(height: 12),

              // Informações
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _buildInfoItem(
                    icon: PhosphorIcons.stack,
                    label: 'Quantidade',
                    value: '${quantity.toStringAsFixed(0)} $unit',
                  ),
                  if (invoiceNumber != null && invoiceNumber.toString().isNotEmpty)
                    _buildInfoItem(
                      icon: PhosphorIcons.receipt,
                      label: 'Nota Fiscal',
                      value: invoiceNumber.toString(),
                    ),
                  if (batchNumber != null && batchNumber.toString().isNotEmpty)
                    _buildInfoItem(
                      icon: PhosphorIcons.hash,
                      label: 'Lote',
                      value: batchNumber.toString(),
                    ),
                  if (temperature != null)
                    _buildInfoItem(
                      icon: PhosphorIcons.thermometer,
                      label: 'Temp.',
                      value: '${temperature}°C',
                    ),
                  if (createdAt != null)
                    _buildInfoItem(
                      icon: PhosphorIcons.calendar,
                      label: 'Data',
                      value: DateFormat('dd/MM/yy').format(createdAt),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.dark700,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: AppTheme.dark400, size: 14),
          const SizedBox(width: 4),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: AppTheme.dark400,
                    fontSize: 10,
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _mostrarDetalhes(Map<String, dynamic> recebimento) {
    final productName = recebimento['productName'] ?? 'Produto não informado';
    final productDescription = recebimento['productDescription'];
    final supplierName = recebimento['supplierName'] ?? 'Fornecedor não informado';
    final supplierCnpj = recebimento['supplierCnpj'];
    final invoiceNumber = recebimento['invoiceNumber'] ?? recebimento['supplierCode'];
    final quantityValue = recebimento['quantity'];
    final quantity = quantityValue is num ? quantityValue.toDouble() : (double.tryParse(quantityValue?.toString() ?? '0') ?? 0);
    final unit = recebimento['unit'] ?? 'UN';
    final condition = recebimento['condition'] ?? 'conforme';
    final batchNumber = recebimento['batchNumber'];
    final temperature = recebimento['temperature'];
    final notes = recebimento['notes'];
    final productionDate = DateTime.tryParse(recebimento['productionDate'] ?? '');
    final validityDate = DateTime.tryParse(recebimento['validityDate'] ?? '');
    final createdAt = DateTime.tryParse(recebimento['createdAt'] ?? '');

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
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        PhosphorIcons.package,
                        color: AppTheme.primary,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Detalhes do Recebimento',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(PhosphorIcons.x, color: AppTheme.dark300),
                ),
              ],
            ),
            const SizedBox(height: 20),

            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Produto
                    _buildDetailSection(
                      title: 'Produto',
                      icon: PhosphorIcons.package,
                      children: [
                        _buildDetailRow('Nome', productName),
                        if (productDescription != null && productDescription.toString().isNotEmpty)
                          _buildDetailRow('Descrição', productDescription),
                        _buildDetailRow('Quantidade', '${quantity.toStringAsFixed(0)} $unit'),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Fornecedor
                    _buildDetailSection(
                      title: 'Fornecedor',
                      icon: PhosphorIcons.buildings,
                      children: [
                        _buildDetailRow('Nome', supplierName),
                        if (supplierCnpj != null && supplierCnpj.toString().isNotEmpty)
                          _buildDetailRow('CNPJ', supplierCnpj),
                        if (invoiceNumber != null && invoiceNumber.toString().isNotEmpty)
                          _buildDetailRow('Nota Fiscal', invoiceNumber.toString()),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Datas e Lote
                    _buildDetailSection(
                      title: 'Informações Adicionais',
                      icon: PhosphorIcons.info,
                      children: [
                        if (batchNumber != null && batchNumber.toString().isNotEmpty)
                          _buildDetailRow('Lote', batchNumber),
                        if (temperature != null)
                          _buildDetailRow('Temperatura', '${temperature}°C'),
                        if (productionDate != null)
                          _buildDetailRow('Data Fabricação', DateFormat('dd/MM/yyyy').format(productionDate)),
                        if (validityDate != null)
                          _buildDetailRow('Data Validade', DateFormat('dd/MM/yyyy').format(validityDate)),
                        if (createdAt != null)
                          _buildDetailRow('Registrado em', DateFormat('dd/MM/yyyy HH:mm').format(createdAt)),
                      ],
                    ),

                    if (notes != null && notes.toString().isNotEmpty) ...[
                      const SizedBox(height: 16),
                      _buildDetailSection(
                        title: 'Observações',
                        icon: PhosphorIcons.notepad,
                        children: [
                          Text(
                            notes,
                            style: TextStyle(
                              color: AppTheme.dark300,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailSection({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.dark700,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: AppTheme.primary, size: 18),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                color: AppTheme.dark400,
                fontSize: 14,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

