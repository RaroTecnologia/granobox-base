import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../components/standard_header.dart';
import '../services/rastreabilidade_service.dart';

class ContagensListScreen extends StatefulWidget {
  const ContagensListScreen({super.key});

  @override
  State<ContagensListScreen> createState() => _ContagensListScreenState();
}

class _ContagensListScreenState extends State<ContagensListScreen> {
  final RastreabilidadeService _rastreabilidadeService = RastreabilidadeService();
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  List<Map<String, dynamic>> _contagens = [];
  List<Map<String, dynamic>> _contagensFiltradas = [];
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

  @override
  void initState() {
    super.initState();
    _loadContagens();
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
      if (!_isLoadingMore && _hasMore) {
        _loadMoreContagens();
      }
    }
  }

  Future<void> _loadContagens({bool reset = true}) async {
    if (reset) {
      setState(() {
        _isLoading = true;
        _error = null;
        _currentPage = 1;
        _contagens = [];
        _hasMore = true;
      });
    }

    try {
      final result = await _rastreabilidadeService.listContagensPaginated(
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
          _contagens = data;
        } else {
          _contagens.addAll(data);
        }
        _total = meta['total'] as int;
        _totalPages = meta['totalPages'] as int;
        _hasMore = meta['hasNextPage'] as bool;
        _contagensFiltradas = List.from(_contagens);
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

  Future<void> _loadMoreContagens() async {
    if (_isLoadingMore || !_hasMore) return;

    setState(() {
      _isLoadingMore = true;
      _currentPage++;
    });

    await _loadContagens(reset: false);
  }

  Widget _buildContagemCard(Map<String, dynamic> contagem) {
    final productName = contagem['productName'] ?? 'Produto desconhecido';
    final productCode = contagem['productCode'];
    final quantity = contagem['quantity'] ?? 0;
    final unit = contagem['unit'] ?? 'UN';
    final countDate = contagem['countDate'] != null
        ? DateTime.tryParse(contagem['countDate'].toString())
        : null;
    final createdAt = contagem['createdAt'] != null
        ? DateTime.tryParse(contagem['createdAt'].toString())
        : null;
    final operatorName = contagem['operatorName'] ?? 'Operador desconhecido';
    final storageLocationName = contagem['storageLocationName'] ?? 'Local desconhecido';
    final id = contagem['id'] ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.dark800,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.dark700),
      ),
      child: InkWell(
        onTap: () => _mostrarDetalhes(contagem),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header com produto
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        productName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (productCode != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Código: $productCode',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppTheme.dark400,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '$quantity $unit',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Informações
            _buildInfoItem(
              icon: PhosphorIcons.calendar,
              label: 'Data da Contagem',
              value: countDate != null
                  ? DateFormat('dd/MM/yyyy').format(countDate)
                  : (createdAt != null
                      ? DateFormat('dd/MM/yyyy').format(createdAt)
                      : 'N/A'),
            ),
            const SizedBox(height: 8),
            _buildInfoItem(
              icon: PhosphorIcons.user,
              label: 'Operador',
              value: operatorName,
            ),
            const SizedBox(height: 8),
            _buildInfoItem(
              icon: PhosphorIcons.mapPin,
              label: 'Local',
              value: storageLocationName,
            ),
            const SizedBox(height: 8),
            _buildInfoItem(
              icon: PhosphorIcons.hash,
              label: 'ID',
              value: id.length >= 8 ? id.substring(0, 8) : id,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppTheme.dark400),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: TextStyle(
            fontSize: 12,
            color: AppTheme.dark400,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 12,
              color: Colors.white,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  void _mostrarDetalhes(Map<String, dynamic> contagem) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.dark800,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Detalhes da Contagem',
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
            _buildDetailItem('Produto', contagem['productName'] ?? 'N/A'),
            if (contagem['productCode'] != null)
              _buildDetailItem('Código', contagem['productCode']),
            _buildDetailItem(
              'Quantidade',
              '${contagem['quantity'] ?? 0} ${contagem['unit'] ?? 'UN'}',
            ),
            if (contagem['countDate'] != null)
              _buildDetailItem(
                'Data da Contagem',
                DateFormat('dd/MM/yyyy').format(
                  DateTime.tryParse(contagem['countDate'].toString()) ?? DateTime.now(),
                ),
              ),
            if (contagem['createdAt'] != null)
              _buildDetailItem(
                'Data de Registro',
                DateFormat('dd/MM/yyyy HH:mm').format(
                  DateTime.tryParse(contagem['createdAt'].toString()) ?? DateTime.now(),
                ),
              ),
            _buildDetailItem('Operador', contagem['operatorName'] ?? 'N/A'),
            _buildDetailItem('Local', contagem['storageLocationName'] ?? 'N/A'),
            _buildDetailItem('ID', contagem['id'] ?? 'N/A'),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: AppTheme.dark400,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(PhosphorIcons.warning, color: Colors.red, size: 48),
          const SizedBox(height: 16),
          Text(
            'Erro ao carregar contagens',
            style: TextStyle(color: AppTheme.dark300, fontSize: 16),
          ),
          const SizedBox(height: 8),
          Text(
            _error ?? 'Erro desconhecido',
            style: TextStyle(color: AppTheme.dark400, fontSize: 12),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => _loadContagens(),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
            ),
            child: const Text('Tentar novamente'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(PhosphorIcons.clipboardText, color: AppTheme.dark400, size: 64),
          const SizedBox(height: 16),
          Text(
            'Nenhuma contagem encontrada',
            style: TextStyle(color: AppTheme.dark300, fontSize: 16),
          ),
          const SizedBox(height: 8),
          Text(
            _searchTerm.isNotEmpty
                ? 'Tente ajustar os filtros de busca'
                : 'As contagens de estoque aparecerão aqui',
            style: TextStyle(color: AppTheme.dark400, fontSize: 12),
            textAlign: TextAlign.center,
          ),
        ],
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
            title: 'Contagens de Estoque',
            subtitle: '${_contagensFiltradas.length} registros',
            showBack: true,
            showSearch: false,
            showHome: false,
            iconColor: AppTheme.primary,
            showLeading: true,
            leadingIcon: PhosphorIcons.clipboardText,
          ),

          // Barra de busca
          Container(
            padding: const EdgeInsets.all(16),
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
                  hintText: 'Buscar por produto, operador ou local...',
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
                      _loadContagens();
                    }
                  });
                },
              ),
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
                    : _contagensFiltradas.isEmpty
                        ? _buildEmptyState()
                        : RefreshIndicator(
                            onRefresh: () => _loadContagens(),
                            color: AppTheme.primary,
                            child: ListView.builder(
                              controller: _scrollController,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: _contagensFiltradas.length + (_isLoadingMore ? 1 : 0),
                              itemBuilder: (context, index) {
                                if (index == _contagensFiltradas.length) {
                                  return const Padding(
                                    padding: EdgeInsets.all(16.0),
                                    child: Center(
                                      child: CircularProgressIndicator(color: AppTheme.primary),
                                    ),
                                  );
                                }
                                return _buildContagemCard(_contagensFiltradas[index]);
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}
