import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../components/standard_header.dart';
import '../components/bottom_navigation.dart';
import '../providers/auth_provider.dart';
import '../providers/categories_products_provider.dart';
import '../providers/storage_locations_provider.dart';
import '../providers/operator_session_provider.dart';
import '../models/product_models.dart';
import '../models/storage_location_models.dart';
import '../services/rastreabilidade_service.dart';
import 'main_screen.dart';

class ContagemEstoqueScreen extends StatefulWidget {
  const ContagemEstoqueScreen({super.key});

  @override
  State<ContagemEstoqueScreen> createState() => _ContagemEstoqueScreenState();
}

class _ContagemEstoqueScreenState extends State<ContagemEstoqueScreen> {
  // Lista de contagens realizadas
  final Map<String, ContagemItem> _contagens = {};
  
  // Controle de busca
  final TextEditingController _searchController = TextEditingController();
  String _searchTerm = '';
  
  // Local de armazenamento selecionado
  StorageLocation? _selectedLocation;
  
  // Loading
  bool _isLoading = true;
  bool _isSaving = false;
  
  // Service
  final RastreabilidadeService _rastreabilidadeService = RastreabilidadeService();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    final authProvider = context.read<AuthProvider>();
    final token = await authProvider.authToken;
    
    if (token != null) {
      // Carregar produtos
      final productsProvider = context.read<CategoriesProductsProvider>();
      if (productsProvider.products.isEmpty) {
        await productsProvider.loadProducts(token: token);
      }
      
      // Carregar locais de armazenamento
      final locationsProvider = context.read<StorageLocationsProvider>();
      if (locationsProvider.storageLocations.isEmpty) {
        await locationsProvider.loadStorageLocations(activeOnly: true, token: token);
      }
    }
    
    setState(() => _isLoading = false);
  }

  List<Product> _getProdutosFiltrados(List<Product> produtos) {
    if (_searchTerm.isEmpty) return produtos;
    
    final search = _searchTerm.toLowerCase();
    return produtos.where((p) {
      return p.name.toLowerCase().contains(search) ||
          (p.code?.toLowerCase().contains(search) ?? false) ||
          (p.barcode?.toLowerCase().contains(search) ?? false);
    }).toList();
  }

  void _abrirScanner() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _ScannerModal(
        onCodeDetected: _processarCodigo,
        onClose: () => Navigator.pop(context),
      ),
    );
  }

  void _processarCodigo(String codigo) {
    Navigator.pop(context); // Fechar scanner
    
    final productsProvider = context.read<CategoriesProductsProvider>();
    final produtos = productsProvider.products;
    
    // Buscar produto pelo código
    Product? produtoEncontrado;
    try {
      produtoEncontrado = produtos.firstWhere(
        (p) => p.code == codigo || p.barcode == codigo,
      );
    } catch (e) {
      _mostrarErro('Produto não encontrado para o código: $codigo');
      return;
    }
    
    if (produtoEncontrado != null) {
      _abrirModalContagem(produtoEncontrado);
    }
  }

  void _abrirModalContagem(Product produto) {
    final contagemExistente = _contagens[produto.id];
    final controller = TextEditingController(
      text: contagemExistente?.quantidade.toString() ?? '',
    );
    
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.dark800,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Container(
          padding: const EdgeInsets.all(20),
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
                          produto.name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (produto.code != null)
                          Text(
                            'Código: ${produto.code}',
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
              const SizedBox(height: 24),
              
              // Campo de quantidade
              Text(
                'Quantidade Contada',
                style: TextStyle(
                  color: AppTheme.dark300,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  // Botão diminuir
                  Container(
                    decoration: BoxDecoration(
                      color: AppTheme.dark700,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: IconButton(
                      onPressed: () {
                        final atual = int.tryParse(controller.text) ?? 0;
                        if (atual > 0) {
                          controller.text = (atual - 1).toString();
                        }
                      },
                      icon: Icon(PhosphorIcons.minus, color: Colors.white),
                    ),
                  ),
                  const SizedBox(width: 12),
                  
                  // Campo de texto
                  Expanded(
                    child: TextField(
                      controller: controller,
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: AppTheme.dark700,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 16,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  
                  // Botão aumentar
                  Container(
                    decoration: BoxDecoration(
                      color: AppTheme.dark700,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: IconButton(
                      onPressed: () {
                        final atual = int.tryParse(controller.text) ?? 0;
                        controller.text = (atual + 1).toString();
                      },
                      icon: Icon(PhosphorIcons.plus, color: Colors.white),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              
              // Botões de ação
              Row(
                children: [
                  if (contagemExistente != null)
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          setState(() {
                            _contagens.remove(produto.id);
                          });
                          Navigator.pop(context);
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red,
                          side: const BorderSide(color: Colors.red),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text('Remover'),
                      ),
                    ),
                  if (contagemExistente != null) const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        final quantidade = int.tryParse(controller.text);
                        if (quantidade == null || quantidade < 0) {
                          _mostrarErro('Quantidade inválida');
                          return;
                        }
                        
                        setState(() {
                          _contagens[produto.id] = ContagemItem(
                            productId: produto.id,
                            productName: produto.name,
                            productCode: produto.code,
                            quantidade: quantidade,
                            contadoEm: DateTime.now(),
                          );
                        });
                        
                        Navigator.pop(context);
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text('Salvar'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  void _mostrarSucesso(String mensagem) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(PhosphorIcons.checkCircle, color: Colors.white, size: 20),
            const SizedBox(width: 8),
            Expanded(child: Text(mensagem)),
          ],
        ),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _mostrarErro(String mensagem) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(PhosphorIcons.xCircle, color: Colors.white, size: 20),
            const SizedBox(width: 8),
            Expanded(child: Text(mensagem)),
          ],
        ),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _limparContagem() {
    if (_contagens.isEmpty) return;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Limpar Contagem',
          style: TextStyle(color: Colors.white),
        ),
        content: const Text(
          'Tem certeza que deseja limpar todas as contagens?',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancelar', style: TextStyle(color: AppTheme.dark300)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() => _contagens.clear());
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Limpar'),
          ),
        ],
      ),
    );
  }

  void _finalizarContagem() {
    if (_contagens.isEmpty) {
      _mostrarErro('Nenhum produto foi contado');
      return;
    }

    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.dark800,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _ResumoContagemModal(
        contagens: _contagens.values.toList(),
        selectedLocation: _selectedLocation,
        onConfirm: () {
          Navigator.pop(context);
          _salvarContagem();
        },
      ),
    );
  }

  Future<void> _salvarContagem() async {
    if (_contagens.isEmpty) {
      _mostrarErro('Nenhum produto foi contado');
      return;
    }

    setState(() => _isSaving = true);

    try {
      final authProvider = context.read<AuthProvider>();
      final user = authProvider.user;
      
      if (user == null || user.id == null) {
        throw Exception('Usuário não autenticado');
      }

      // Obter operador da sessão (se disponível)
      final operatorSessionProvider = context.read<OperatorSessionProvider>();
      final currentOperator = operatorSessionProvider.currentOperator;

      // Preparar itens para envio
      final items = _contagens.values.map((contagem) {
        final item = {
          'productId': contagem.productId,
          'quantity': contagem.quantidade,
          'unit': 'UN',
          'countDate': contagem.contadoEm.toIso8601String().split('T')[0],
        };
        
        // Adicionar operatorId apenas se houver operador na sessão
        if (currentOperator != null && currentOperator.id != null) {
          item['operatorId'] = currentOperator.id;
        }
        
        // Adicionar storageLocationId apenas se houver local selecionado (opcional)
        if (_selectedLocation != null) {
          item['storageLocationId'] = _selectedLocation!.id;
        }
        return item;
      }).toList();

      // Salvar no backend
      await _rastreabilidadeService.createContagens(items);

      setState(() {
        _contagens.clear();
        _isSaving = false;
      });

      _mostrarSucesso('${items.length} contagem(ns) salva(s) com sucesso!');
      
      // Opcional: navegar de volta após salvar
      // Navigator.pop(context);
    } catch (e) {
      setState(() => _isSaving = false);
      _mostrarErro('Erro ao salvar contagem: ${e.toString()}');
    }
  }

  void _mostrarSeletorLocal() {
    final locationsProvider = context.read<StorageLocationsProvider>();
    
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
          maxHeight: MediaQuery.of(context).size.height * 0.7,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Selecionar Local',
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
            const SizedBox(height: 16),
            
            // Opção "Todos os locais"
            _buildLocalOption(
              nome: 'Todos os locais',
              descricao: 'Contagem geral',
              isSelected: _selectedLocation == null,
              onTap: () {
                setState(() => _selectedLocation = null);
                Navigator.pop(context);
              },
            ),
            const SizedBox(height: 8),
            
            // Lista de locais
            Expanded(
              child: ListView.builder(
                itemCount: locationsProvider.storageLocations.length,
                itemBuilder: (context, index) {
                  final location = locationsProvider.storageLocations[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _buildLocalOption(
                      nome: location.nome,
                      descricao: '${location.tipo.toString().split('.').last}${location.temperatura != null ? ' • ${location.temperatura}°C' : ''}',
                      isSelected: _selectedLocation?.id == location.id,
                      onTap: () {
                        setState(() => _selectedLocation = location);
                        Navigator.pop(context);
                      },
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLocalOption({
    required String nome,
    required String descricao,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary.withOpacity(0.1) : AppTheme.dark700,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? AppTheme.primary : AppTheme.dark600,
          ),
        ),
        child: Row(
          children: [
            Icon(
              PhosphorIcons.mapPin,
              color: isSelected ? AppTheme.primary : AppTheme.dark400,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    nome,
                    style: TextStyle(
                      color: isSelected ? AppTheme.primary : Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    descricao,
                    style: TextStyle(
                      color: AppTheme.dark400,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(PhosphorIcons.check, color: AppTheme.primary, size: 20),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final productsProvider = context.watch<CategoriesProductsProvider>();
    final produtos = _getProdutosFiltrados(productsProvider.products);
    
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      body: Column(
        children: [
          // Header
          StandardHeader(
            title: 'Contagem de Estoque',
            subtitle: _selectedLocation?.nome ?? 'Todos os locais',
            showBack: true,
            showSearch: false,
            showHome: false,
            iconColor: AppTheme.primary,
            showLeading: true,
            leadingIcon: PhosphorIcons.clipboardText,
          ),

          // Estatísticas e Local
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.dark800,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppTheme.dark600),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    children: [
                      Text(
                        '${_contagens.length}',
                        style: const TextStyle(
                          color: AppTheme.primary,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Produtos Contados',
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
                  child: InkWell(
                    onTap: _mostrarSeletorLocal,
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(PhosphorIcons.mapPin, color: AppTheme.primary, size: 18),
                            const SizedBox(width: 4),
                            Icon(PhosphorIcons.caretDown, color: AppTheme.dark400, size: 12),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _selectedLocation?.nome ?? 'Todos',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          'Local',
                          style: TextStyle(
                            color: AppTheme.dark400,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Barra de busca e scan
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
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
                        setState(() => _searchTerm = value);
                      },
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  decoration: BoxDecoration(
                    color: AppTheme.primary,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: IconButton(
                    onPressed: _abrirScanner,
                    icon: Icon(PhosphorIcons.scan, color: Colors.white),
                    tooltip: 'Escanear código',
                  ),
                ),
                if (_contagens.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: AppTheme.dark800,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.dark600),
                    ),
                    child: IconButton(
                      onPressed: _limparContagem,
                      icon: Icon(PhosphorIcons.trash, color: Colors.red),
                      tooltip: 'Limpar',
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Lista de produtos
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: AppTheme.primary),
                  )
                : produtos.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: produtos.length,
                        itemBuilder: (context, index) {
                          final produto = produtos[index];
                          final contagem = _contagens[produto.id];
                          return _buildProdutoCard(produto, contagem);
                        },
                      ),
          ),

          // Botão finalizar
          if (_contagens.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              child: ElevatedButton(
                onPressed: _finalizarContagem,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 56),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(PhosphorIcons.checkCircle, size: 20),
                    const SizedBox(width: 8),
                    Text('Finalizar Contagem (${_contagens.length} produtos)'),
                  ],
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
              _searchTerm.isNotEmpty
                  ? 'Nenhum produto encontrado'
                  : 'Nenhum produto cadastrado',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _searchTerm.isNotEmpty
                  ? 'Tente buscar por outro termo'
                  : 'Cadastre produtos para realizar a contagem',
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

  Widget _buildProdutoCard(Product produto, ContagemItem? contagem) {
    final foiContado = contagem != null;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: foiContado ? AppTheme.primary.withOpacity(0.1) : AppTheme.dark800,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: foiContado ? AppTheme.primary : AppTheme.dark600,
        ),
      ),
      child: ListTile(
        onTap: () => _abrirModalContagem(produto),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: foiContado 
                ? AppTheme.primary.withOpacity(0.2) 
                : AppTheme.dark700,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            foiContado ? PhosphorIcons.checkCircle : PhosphorIcons.package,
            color: foiContado ? AppTheme.primary : AppTheme.dark400,
            size: 24,
          ),
        ),
        title: Text(
          produto.name,
          style: TextStyle(
            color: foiContado ? AppTheme.primary : Colors.white,
            fontWeight: FontWeight.w600,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Row(
          children: [
            if (produto.code != null) ...[
              Text(
                produto.code!,
                style: TextStyle(
                  color: AppTheme.dark400,
                  fontSize: 12,
                ),
              ),
              if (produto.brand != null) ...[
                Text(
                  ' • ',
                  style: TextStyle(color: AppTheme.dark400, fontSize: 12),
                ),
              ],
            ],
            if (produto.brand != null)
              Flexible(
                child: Text(
                  produto.brand!,
                  style: TextStyle(
                    color: AppTheme.dark400,
                    fontSize: 12,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
          ],
        ),
        trailing: foiContado
            ? Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${contagem.quantidade}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              )
            : Icon(
                PhosphorIcons.caretRight,
                color: AppTheme.dark400,
                size: 20,
              ),
      ),
    );
  }
}

// Modelo de contagem
class ContagemItem {
  final String productId;
  final String productName;
  final String? productCode;
  final int quantidade;
  final DateTime contadoEm;

  ContagemItem({
    required this.productId,
    required this.productName,
    this.productCode,
    required this.quantidade,
    required this.contadoEm,
  });
}

// Modal do Scanner
class _ScannerModal extends StatefulWidget {
  final Function(String) onCodeDetected;
  final VoidCallback onClose;

  const _ScannerModal({
    required this.onCodeDetected,
    required this.onClose,
  });

  @override
  State<_ScannerModal> createState() => _ScannerModalState();
}

class _ScannerModalState extends State<_ScannerModal> {
  final MobileScannerController controller = MobileScannerController();
  bool _torchEnabled = false;
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
      decoration: const BoxDecoration(color: Colors.black),
      child: Stack(
        children: [
          // Scanner
          MobileScanner(
            controller: controller,
            onDetect: (capture) {
              if (_isDetected) return;
              
              final List<Barcode> barcodes = capture.barcodes;
              if (barcodes.isNotEmpty) {
                final barcode = barcodes.first;
                if (barcode.rawValue != null) {
                  _isDetected = true;
                  widget.onCodeDetected(barcode.rawValue!);
                }
              }
            },
          ),

          // Overlay com as quinas
          Center(
            child: SizedBox(
              width: 280,
              height: 280,
              child: Stack(
                children: [
                  Positioned(
                    top: 0,
                    left: 0,
                    child: Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(color: AppTheme.primary, width: 4),
                          left: BorderSide(color: AppTheme.primary, width: 4),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 0,
                    right: 0,
                    child: Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(color: AppTheme.primary, width: 4),
                          right: BorderSide(color: AppTheme.primary, width: 4),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    left: 0,
                    child: Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(color: AppTheme.primary, width: 4),
                          left: BorderSide(color: AppTheme.primary, width: 4),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 50,
                      height: 50,
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

          // Header
          SafeArea(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(color: Colors.black),
              child: Row(
                children: [
                  IconButton(
                    onPressed: widget.onClose,
                    icon: const Icon(Icons.close, color: Colors.white, size: 28),
                  ),
                  const Expanded(
                    child: Text(
                      'Escanear Produto',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      setState(() => _torchEnabled = !_torchEnabled);
                      controller.toggleTorch();
                    },
                    icon: Icon(
                      _torchEnabled ? PhosphorIcons.lightningFill : PhosphorIcons.lightning,
                      color: _torchEnabled ? Colors.yellow : Colors.white,
                      size: 24,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Instruções
          Positioned(
            bottom: 120,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                'Escaneie o código de barras do produto',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  backgroundColor: Colors.black.withOpacity(0.7),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Modal de Resumo da Contagem
class _ResumoContagemModal extends StatelessWidget {
  final List<ContagemItem> contagens;
  final StorageLocation? selectedLocation;
  final VoidCallback onConfirm;

  const _ResumoContagemModal({
    required this.contagens,
    required this.selectedLocation,
    required this.onConfirm,
  });

  @override
  Widget build(BuildContext context) {
    final totalItens = contagens.fold<int>(0, (sum, c) => sum + c.quantidade);
    final contagensOrdenadas = List<ContagemItem>.from(contagens)
      ..sort((a, b) => a.productName.compareTo(b.productName));

    return Container(
      padding: const EdgeInsets.all(20),
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.8,
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
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      PhosphorIcons.clipboardText,
                      color: AppTheme.primary,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Resumo da Contagem',
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

          // Estatísticas
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
                        '${contagens.length}',
                        style: const TextStyle(
                          color: AppTheme.primary,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Produtos',
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
                        '$totalItens',
                        style: const TextStyle(
                          color: AppTheme.primary,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Total de Itens',
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
          const SizedBox(height: 16),

          if (selectedLocation != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.dark700,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(PhosphorIcons.mapPin, color: AppTheme.primary, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    'Local: ${selectedLocation!.nome}',
                    style: const TextStyle(color: Colors.white),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Lista de contagens
          const Text(
            'Produtos Contados',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          
          Expanded(
            child: ListView.builder(
              itemCount: contagensOrdenadas.length,
              itemBuilder: (context, index) {
                final contagem = contagensOrdenadas[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.dark700,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              contagem.productName,
                              style: const TextStyle(color: Colors.white),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (contagem.productCode != null)
                              Text(
                                contagem.productCode!,
                                style: TextStyle(
                                  color: AppTheme.dark400,
                                  fontSize: 12,
                                ),
                              ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '${contagem.quantidade}',
                          style: const TextStyle(
                            color: AppTheme.primary,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 16),

          // Botão confirmar
          ElevatedButton(
            onPressed: onConfirm,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              minimumSize: const Size(double.infinity, 56),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(PhosphorIcons.checkCircle, size: 20),
                const SizedBox(width: 8),
                const Text('Confirmar e Salvar'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
