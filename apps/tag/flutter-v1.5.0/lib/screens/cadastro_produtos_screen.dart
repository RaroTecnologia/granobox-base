import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../components/header_button.dart';
import '../providers/categories_products_provider.dart';
import '../providers/auth_provider.dart';
import '../models/product_models.dart';

class CadastroProdutosScreen extends StatefulWidget {
  const CadastroProdutosScreen({super.key});

  @override
  State<CadastroProdutosScreen> createState() => _CadastroProdutosScreenState();
}

class _CadastroProdutosScreenState extends State<CadastroProdutosScreen> {
  final TextEditingController _searchController = TextEditingController();
  
  @override
  void initState() {
    super.initState();
    _carregarProdutos();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _carregarProdutos() async {
    final auth = context.read<AuthProvider>();
    final productsProvider = context.read<CategoriesProductsProvider>();
    
    final token = await auth.authToken;
    if (token != null) {
      await productsProvider.loadProducts(token: token);
    }
  }

  void _mostrarFormularioProduto({Product? produto}) {
    showDialog(
      context: context,
      builder: (context) => _FormularioProdutoDialog(produto: produto),
    );
  }

  Future<void> _confirmarDeletar(Product produto) async {
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        title: const Text('Confirmar Exclusão', style: TextStyle(color: Colors.white)),
        content: Text(
          'Tem certeza que deseja deletar o produto "${produto.name}"?',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Deletar'),
          ),
        ],
      ),
    );

    if (confirmar == true && mounted) {
      // TODO: Implementar deletar produto
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Funcionalidade de deletar será implementada em breve'),
          backgroundColor: Colors.orange,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              width: double.infinity,
              color: AppTheme.dark900,
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
              child: Row(
                children: [
                  HeaderButton(
                    iconPath: 'assets/icons/voltar.svg',
                    onTap: () => Navigator.pop(context),
                    size: 32,
                    tooltip: 'Voltar',
                  ),
                  const SizedBox(width: 16),
                  const Expanded(
                    child: Text(
                      'Produtos Cadastrados',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => _mostrarFormularioProduto(),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppTheme.primary,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        PhosphorIcons.plus,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Barra de busca
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: AppTheme.dark700,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: AppTheme.dark600,
                ),
              ),
              child: TextField(
                controller: _searchController,
                onChanged: (value) => setState(() {}),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                ),
                decoration: InputDecoration(
                  hintText: 'Buscar produtos...',
                  hintStyle: TextStyle(
                    color: AppTheme.dark400,
                    fontSize: 14,
                  ),
                  prefixIcon: Icon(
                    PhosphorIcons.magnifyingGlass,
                    color: AppTheme.dark400,
                    size: 18,
                  ),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? GestureDetector(
                          onTap: () {
                            _searchController.clear();
                            setState(() {});
                          },
                          child: Icon(
                            PhosphorIcons.x,
                            color: AppTheme.dark400,
                            size: 18,
                          ),
                        )
                      : null,
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  errorBorder: InputBorder.none,
                  focusedErrorBorder: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 4,
                    vertical: 12,
                  ),
                  isDense: true,
                ),
              ),
            ),

            // Lista de produtos
            Expanded(
              child: Consumer<CategoriesProductsProvider>(
                builder: (context, provider, child) {
                  if (provider.isLoading) {
                    return Center(
                      child: CircularProgressIndicator(color: AppTheme.primary),
                    );
                  }

                  if (provider.error != null) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(PhosphorIcons.warning, size: 48, color: Colors.red),
                          const SizedBox(height: 16),
                          Text(
                            provider.error!,
                            style: const TextStyle(color: Colors.red),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: _carregarProdutos,
                            child: const Text('Tentar Novamente'),
                          ),
                        ],
                      ),
                    );
                  }

                  if (provider.products.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(PhosphorIcons.package, size: 64, color: AppTheme.dark400),
                          const SizedBox(height: 16),
                          Text(
                            'Nenhum produto cadastrado',
                            style: TextStyle(
                              color: AppTheme.dark300,
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Clique no botão + para criar seu primeiro produto',
                            style: TextStyle(color: AppTheme.dark400, fontSize: 14),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    );
                  }

                  // Ordenar produtos alfabeticamente por nome
                  final produtosOrdenados = List<Product>.from(provider.products)
                    ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));

                  // Filtrar produtos pela busca
                  final searchText = _searchController.text.toLowerCase().trim();
                  final produtosFiltrados = searchText.isEmpty
                      ? produtosOrdenados
                      : produtosOrdenados.where((produto) {
                          final nome = produto.name.toLowerCase();
                          final codigo = (produto.code ?? '').toLowerCase();
                          final marca = (produto.brand ?? '').toLowerCase();
                          final sif = (produto.sif ?? '').toLowerCase();
                          
                          return nome.contains(searchText) ||
                                 codigo.contains(searchText) ||
                                 marca.contains(searchText) ||
                                 sif.contains(searchText);
                        }).toList();

                  // Se não encontrou produtos após filtro, mostrar mensagem
                  if (produtosFiltrados.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(PhosphorIcons.magnifyingGlass, size: 64, color: AppTheme.dark400),
                          const SizedBox(height: 16),
                          Text(
                            'Nenhum produto encontrado',
                            style: TextStyle(
                              color: AppTheme.dark300,
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Tente buscar com outros termos',
                            style: TextStyle(color: AppTheme.dark400, fontSize: 14),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: produtosFiltrados.length,
                    itemBuilder: (context, index) {
                      final produto = produtosFiltrados[index];
                      return _buildProdutoCard(produto);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProdutoCard(Product produto) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.dark800,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.dark700),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
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
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      produto.name,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    if (produto.code != null && produto.code!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Código: ${produto.code}',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppTheme.dark300,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Info chips
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (produto.type != null)
                _buildInfoChip(
                  produto.type == 'raw' ? 'Matéria-prima' :
                  produto.type == 'intermediate' ? 'Intermediário' : 'Finalizado',
                  PhosphorIcons.tag,
                  AppTheme.primary,
                ),
              if (produto.shelfLifeAmbient != null)
                _buildInfoChip(
                  'Validade: ${produto.shelfLifeAmbient} dias',
                  PhosphorIcons.calendar,
                  Colors.blue,
                ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Botões de ação
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _mostrarFormularioProduto(produto: produto),
                  icon: const Icon(PhosphorIcons.pencil, size: 16),
                  label: const Text('Editar'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.primary,
                    side: BorderSide(color: AppTheme.primary),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              OutlinedButton.icon(
                onPressed: () => _confirmarDeletar(produto),
                icon: const Icon(PhosphorIcons.trash, size: 16),
                label: const Text('Deletar'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red,
                  side: const BorderSide(color: Colors.red),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoChip(String label, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.dark700,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// Dialog para criar/editar produto
class _FormularioProdutoDialog extends StatefulWidget {
  final Product? produto;

  const _FormularioProdutoDialog({this.produto});

  @override
  State<_FormularioProdutoDialog> createState() => _FormularioProdutoDialogState();
}

class _FormularioProdutoDialogState extends State<_FormularioProdutoDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nomeController = TextEditingController();
  final _codigoController = TextEditingController();
  final _descricaoController = TextEditingController();
  final _shelfLifeAmbientController = TextEditingController();
  final _shelfLifeRefrigeratedController = TextEditingController();
  final _shelfLifeFrozenController = TextEditingController();
  
  String _tipoSelecionado = 'finished';

  @override
  void initState() {
    super.initState();
    if (widget.produto != null) {
      _nomeController.text = widget.produto!.name;
      _codigoController.text = widget.produto!.code ?? '';
      _descricaoController.text = widget.produto!.description ?? '';
      _tipoSelecionado = widget.produto!.type ?? 'finished';
      _shelfLifeAmbientController.text = widget.produto!.shelfLifeAmbient?.toString() ?? '';
      _shelfLifeRefrigeratedController.text = widget.produto!.shelfLifeRefrigerated?.toString() ?? '';
      _shelfLifeFrozenController.text = widget.produto!.shelfLifeFrozen?.toString() ?? '';
    }
  }

  @override
  void dispose() {
    _nomeController.dispose();
    _codigoController.dispose();
    _descricaoController.dispose();
    _shelfLifeAmbientController.dispose();
    _shelfLifeRefrigeratedController.dispose();
    _shelfLifeFrozenController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEdicao = widget.produto != null;

    return Dialog(
      backgroundColor: AppTheme.dark800,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        width: MediaQuery.of(context).size.width * 0.9,
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.8,
        ),
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isEdicao ? 'Editar Produto' : 'Novo Produto',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 20),

                // Nome
                Text(
                  'Nome do Produto *',
                  style: TextStyle(
                    color: AppTheme.primary,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _nomeController,
                  decoration: InputDecoration(
                    hintText: 'Ex: Paracetamol 500mg',
                    filled: true,
                    fillColor: AppTheme.dark700,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: AppTheme.dark600),
                    ),
                  ),
                  style: const TextStyle(color: Colors.white),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Nome é obrigatório';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 16),

                // Código
                Text(
                  'Código',
                  style: TextStyle(
                    color: AppTheme.dark300,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _codigoController,
                  decoration: InputDecoration(
                    hintText: 'Ex: MED-001',
                    filled: true,
                    fillColor: AppTheme.dark700,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: AppTheme.dark600),
                    ),
                  ),
                  style: const TextStyle(color: Colors.white),
                ),

                const SizedBox(height: 16),

                // Tipo
                Text(
                  'Tipo de Produto *',
                  style: TextStyle(
                    color: AppTheme.primary,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _tipoSelecionado,
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: AppTheme.dark700,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: AppTheme.dark600),
                    ),
                  ),
                  dropdownColor: AppTheme.dark700,
                  style: const TextStyle(color: Colors.white),
                  items: const [
                    DropdownMenuItem(value: 'raw', child: Text('Matéria-prima')),
                    DropdownMenuItem(value: 'intermediate', child: Text('Intermediário')),
                    DropdownMenuItem(value: 'finished', child: Text('Finalizado')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _tipoSelecionado = value!;
                    });
                  },
                ),

                const SizedBox(height: 16),

                // Validades
                Text(
                  'Validades (dias)',
                  style: TextStyle(
                    color: AppTheme.dark300,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _shelfLifeAmbientController,
                        decoration: InputDecoration(
                          labelText: 'Ambiente',
                          filled: true,
                          fillColor: AppTheme.dark700,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        style: const TextStyle(color: Colors.white),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextFormField(
                        controller: _shelfLifeRefrigeratedController,
                        decoration: InputDecoration(
                          labelText: 'Refrigerado',
                          filled: true,
                          fillColor: AppTheme.dark700,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        style: const TextStyle(color: Colors.white),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextFormField(
                        controller: _shelfLifeFrozenController,
                        decoration: InputDecoration(
                          labelText: 'Congelado',
                          filled: true,
                          fillColor: AppTheme.dark700,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        style: const TextStyle(color: Colors.white),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Descrição
                Text(
                  'Descrição',
                  style: TextStyle(
                    color: AppTheme.dark300,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _descricaoController,
                  decoration: InputDecoration(
                    hintText: 'Descreva o produto',
                    filled: true,
                    fillColor: AppTheme.dark700,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: AppTheme.dark600),
                    ),
                  ),
                  style: const TextStyle(color: Colors.white),
                  maxLines: 3,
                ),

                const SizedBox(height: 24),

                // Botões
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancelar'),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton(
                      onPressed: () {
                        if (_formKey.currentState!.validate()) {
                          // TODO: Salvar produto
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Funcionalidade de salvar será implementada em breve'),
                              backgroundColor: Colors.orange,
                            ),
                          );
                          Navigator.pop(context);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      ),
                      child: Text(isEdicao ? 'Salvar' : 'Criar'),
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
}

