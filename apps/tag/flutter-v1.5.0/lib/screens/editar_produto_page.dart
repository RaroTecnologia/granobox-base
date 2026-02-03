import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../models/product_models.dart';
import '../providers/categories_products_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/storage_locations_provider.dart';
import '../providers/print_provider.dart'; // ⭐ NOVO: Para seleção de impressora
import '../components/storage_location_selector.dart';
import '../components/hierarchical_category_dropdown.dart';
import '../components/modal_cadastro_categoria.dart';
import '../models/category_models.dart';
import '../services/products_service.dart';

class EditarProdutoPage extends StatefulWidget {
  final Product produto;

  const EditarProdutoPage({Key? key, required this.produto}) : super(key: key);

  @override
  State<EditarProdutoPage> createState() => _EditarProdutoPageState();
}

class _EditarProdutoPageState extends State<EditarProdutoPage> {
  final _formKey = GlobalKey<FormState>();
  final _nomeController = TextEditingController();
  final _codigoController = TextEditingController();
  final _codigoBarrasController = TextEditingController();
  final _marcaController = TextEditingController();
  final _sifController = TextEditingController();
  String _unidadeSelecionada = 'KG';
  final _pesoController = TextEditingController();
  final _quantidadeController = TextEditingController();
  final _validadeAmbienteController = TextEditingController();
  final _validadeRefrigeradoController = TextEditingController();
  final _validadeCongeladoController = TextEditingController();

  String? _categoriaSelecionada;
  String? _tipoSelecionado;
  String? _localArmazenamentoSelecionado;
  String? _impressoraSelecionada; // ⭐ NOVO: Impressora padrão do produto
  final _templateController =
      TextEditingController(); // ⭐ Alterado: TextEditingController ao invés de String?
  bool _isLoading = false;

  // Toggles para controlar exibição na etiqueta
  bool _mostrarMarcaNaEtiqueta = false;
  bool _mostrarSifNaEtiqueta = false;
  bool _mostrarLoteIndustriaNaEtiqueta = false;
  bool _mostrarDataVencimentoNaEtiqueta = false;
  bool _produtoAtivo = true;
  bool _isLabelOnly = false; // Quando true, é só rótulo (sem código/rastreabilidade)
  bool _showTimeOnLabel = true; // Quando true, exibe hora na manipulação e validade

  final ProductsService _productsService = ProductsService();

  // Tipos de produto disponíveis
  final List<Map<String, dynamic>> tiposProduto = [
    {
      'id': 'raw_material',
      'nome': 'Matéria Prima',
      'icon': PhosphorIcons.circle,
    },
    {
      'id': 'manipulated',
      'nome': 'Manipulado',
      'icon': PhosphorIcons.cookingPot,
    },
    {'id': 'finished', 'nome': 'Produto Final', 'icon': PhosphorIcons.package},
  ];

  // Unidades disponíveis
  final List<String> unidadesDisponiveis = [
    'KG',
    'G',
    'L',
    'ML',
    'UN',
    'CX',
    'PCT',
  ];

  @override
  void initState() {
    super.initState();
    _preencherCampos();

    // Adicionar listeners para ativar toggles automaticamente
    _marcaController.addListener(_onMarcaChanged);
    _sifController.addListener(_onSifChanged);

    // Carregar locais de armazenamento
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _carregarLocaisArmazenamento();
    });
  }

  Future<void> _carregarLocaisArmazenamento() async {
    final storageProvider = context.read<StorageLocationsProvider>();

    print('🏠 [EDITAR] Carregando locais de armazenamento...');
    await storageProvider.loadStorageLocations(activeOnly: true);
    print(
      '🏠 [EDITAR] Locais carregados: ${storageProvider.storageLocations.length}',
    );
  }

  void _preencherCampos() {
    _nomeController.text = widget.produto.name;
    _codigoController.text = widget.produto.code ?? '';
    _codigoBarrasController.text =
        widget.produto.barcode ?? ''; // Carregar código de barras existente
    _marcaController.text = widget.produto.brand ?? '';
    _sifController.text = widget.produto.sif ?? '';
    // Normalizar unidade para maiúsculo e garantir que está na lista
    final unidadeProduto = (widget.produto.weightUnit ?? 'KG').toUpperCase();
    _unidadeSelecionada = unidadesDisponiveis.contains(unidadeProduto)
        ? unidadeProduto
        : 'KG';
    _pesoController.text = widget.produto.weight ?? '';
    _quantidadeController.text = widget.produto.quantity ?? '';
    _validadeAmbienteController.text =
        widget.produto.shelfLifeAmbient?.toString() ?? '';
    _validadeRefrigeradoController.text =
        widget.produto.shelfLifeRefrigerated?.toString() ?? '';
    _validadeCongeladoController.text =
        widget.produto.shelfLifeFrozen?.toString() ?? '';

    _categoriaSelecionada = widget.produto.categoryId;
    _tipoSelecionado = widget.produto.type;
    _localArmazenamentoSelecionado = widget.produto.defaultStorageLocationId;
    _impressoraSelecionada = widget.produto.defaultPrinterId; // ⭐ NOVO: Carregar impressora do produto
    _templateController.text = widget.produto.customTemplateId ?? '';

    // Carregar valores dos toggles
    _mostrarMarcaNaEtiqueta = widget.produto.showBrandOnLabel ?? false;
    _mostrarSifNaEtiqueta = widget.produto.showSifOnLabel ?? false;
    _mostrarLoteIndustriaNaEtiqueta =
        widget.produto.showManufacturingBatchOnLabel ?? false;
    _mostrarDataVencimentoNaEtiqueta =
        widget.produto.showExpiryDateOnLabel ?? false;
    _produtoAtivo = widget.produto.isActive;
    _isLabelOnly = widget.produto.isLabelOnly ?? false;
    _showTimeOnLabel = widget.produto.showTimeOnLabel ?? true;
  }

  void _onMarcaChanged() {
    // Ativa automaticamente quando usuário digita, mas permite desativar manualmente
    if (_marcaController.text.isNotEmpty && !_mostrarMarcaNaEtiqueta) {
      setState(() {
        _mostrarMarcaNaEtiqueta = true;
      });
    }
  }

  void _onSifChanged() {
    // Ativa automaticamente quando usuário digita, mas permite desativar manualmente
    if (_sifController.text.isNotEmpty && !_mostrarSifNaEtiqueta) {
      setState(() {
        _mostrarSifNaEtiqueta = true;
      });
    }
  }

  @override
  void dispose() {
    _marcaController.removeListener(_onMarcaChanged);
    _sifController.removeListener(_onSifChanged);
    _nomeController.dispose();
    _codigoController.dispose();
    _codigoBarrasController.dispose();
    _marcaController.dispose();
    _sifController.dispose();
    _pesoController.dispose();
    _quantidadeController.dispose();
    _validadeAmbienteController.dispose();
    _validadeRefrigeradoController.dispose();
    _validadeCongeladoController.dispose();
    _templateController.dispose();
    super.dispose();
  }

  /// Mostrar modal para criar nova categoria
  Future<void> _showCreateCategoryModal() async {
    final categoriesProvider = Provider.of<CategoriesProductsProvider>(
      context,
      listen: false,
    );
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
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
        categoriasDisponiveis: categoriesProvider.categories,
        onSalvar: (createRequest) async {
          final newCategory = await categoriesProvider.createCategory(
            createRequest,
            token: token,
          );

          if (newCategory != null) {
            // Atualizar o dropdown com a nova categoria
            setState(() {
              _categoriaSelecionada = newCategory.id;
            });
          }
        },
        onEditar: (updateRequest) async {
          // TODO: Implementar edição se necessário
        },
      ),
    );
  }

  Future<void> _salvarProduto() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final authProvider = context.read<AuthProvider>();
      final token = await authProvider.authToken;

      if (token == null) {
        _mostrarErro('Token de autenticação não encontrado');
        return;
      }

      print('🔍 DEBUG EDIÇÃO - Dados antes de atualizar:');
      print('  Nome: ${_nomeController.text.trim()}');
      print('  Código: ${_codigoController.text.trim()}');
      print('  Código de Barras: ${_codigoBarrasController.text.trim()}');
      print('  Categoria: $_categoriaSelecionada');
      print('  Tipo: $_tipoSelecionado');
      print('  Produto ID: ${widget.produto.id}');

      final updateRequest = UpdateProductRequest(
        name: _nomeController.text.trim(),
        code: _codigoController.text.trim().isEmpty
            ? null
            : _codigoController.text.trim(),
        barcode: _codigoBarrasController.text.trim().isEmpty
            ? null
            : _codigoBarrasController.text.trim(),
        brand: _marcaController.text.trim().isEmpty
            ? null
            : _marcaController.text.trim(),
        sif: _sifController.text.trim().isEmpty
            ? null
            : _sifController.text.trim(),
        showBrandOnLabel: _mostrarMarcaNaEtiqueta,
        showSifOnLabel: _mostrarSifNaEtiqueta,
        showManufacturingBatchOnLabel: _mostrarLoteIndustriaNaEtiqueta,
        showExpiryDateOnLabel: _mostrarDataVencimentoNaEtiqueta,
        weightUnit: _unidadeSelecionada,
        weight: _pesoController.text.trim().isEmpty
            ? null
            : _pesoController.text.trim(),
        quantity: _quantidadeController.text.trim().isEmpty
            ? null
            : _quantidadeController.text.trim(),
        defaultStorageLocationId: _localArmazenamentoSelecionado,
        customTemplateId: _templateController.text.trim().isEmpty
            ? null
            : _templateController.text.trim(),
        shelfLifeAmbient: _validadeAmbienteController.text.trim().isEmpty
            ? null
            : int.tryParse(_validadeAmbienteController.text.trim()),
        shelfLifeRefrigerated:
            _validadeRefrigeradoController.text.trim().isEmpty
            ? null
            : int.tryParse(_validadeRefrigeradoController.text.trim()),
        shelfLifeFrozen: _validadeCongeladoController.text.trim().isEmpty
            ? null
            : int.tryParse(_validadeCongeladoController.text.trim()),
        categoryId: _categoriaSelecionada!,
        type: _tipoSelecionado!,
        isActive: _produtoAtivo,
        isLabelOnly: _isLabelOnly,
        showTimeOnLabel: _showTimeOnLabel,
        defaultPrinterId: _impressoraSelecionada, // ⭐ NOVO: Incluir impressora selecionada
      );

      print('📤 Enviando update request para API...');
      final produtoAtualizado = await _productsService.updateProduct(
        widget.produto.id,
        updateRequest,
        token: token,
      );
      print('✅ Produto atualizado com sucesso: ${produtoAtualizado?.id}');

      if (produtoAtualizado != null) {
        // Atualizar o provider
        final authProvider = context.read<AuthProvider>();
        final clientId = authProvider.user?.clientId;
        final categoriesProvider = context.read<CategoriesProductsProvider>();
        await categoriesProvider.loadAll(
          token: token,
          clientId: clientId,
          forceRefresh: true,
        );

        if (mounted) {
          Navigator.of(context).pop(produtoAtualizado);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Produto atualizado com sucesso!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        _mostrarErro('Erro ao atualizar produto');
      }
    } catch (e, stackTrace) {
      print('❌ Erro ao editar produto: $e');
      print('📍 Stack trace: $stackTrace');
      _mostrarErro('Erro ao atualizar produto: ${e.toString()}');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _mostrarErro(String mensagem) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(mensagem), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      appBar: AppBar(
        title: const Text('Editar Produto'),
        backgroundColor: AppTheme.dark900,
        foregroundColor: Colors.white,
        toolbarHeight: 80,
        actions: [
          if (_isLoading)
            Container(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else
            Container(
              margin: const EdgeInsets.only(right: 16),
              child: ElevatedButton(
                onPressed: _salvarProduto,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 8,
                  ),
                ),
                child: const Text(
                  'Salvar',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
            ),
        ],
      ),
      body: Consumer<StorageLocationsProvider>(
        builder: (context, storageProvider, child) {
          return Form(
            key: _formKey,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Nome do produto
                  TextFormField(
                    controller: _nomeController,
                    decoration: InputDecoration(
                      labelText: 'Nome do Produto *',
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
                        borderSide: BorderSide(
                          color: AppTheme.primary,
                          width: 2,
                        ),
                      ),
                      filled: true,
                      fillColor: AppTheme.dark700,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 16,
                      ),
                    ),
                    style: TextStyle(color: Colors.white),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Nome do produto é obrigatório';
                      }
                      if (value.trim().length < 2) {
                        return 'Nome deve ter pelo menos 2 caracteres';
                      }
                      return null;
                    },
                  ),

                  const SizedBox(height: 16),

                  // Código do produto
                  TextFormField(
                    controller: _codigoController,
                    decoration: InputDecoration(
                      labelText: 'Código',
                      labelStyle: TextStyle(color: AppTheme.dark300),
                      hintText: 'Ex: PA001, MAN001, MP001',
                      hintStyle: TextStyle(color: AppTheme.dark400),
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
                        borderSide: BorderSide(
                          color: AppTheme.primary,
                          width: 2,
                        ),
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

                  // Código de Barras
                  TextFormField(
                    controller: _codigoBarrasController,
                    decoration: InputDecoration(
                      labelText: 'Código de Barras',
                      labelStyle: TextStyle(color: AppTheme.dark300),
                      hintText: 'Ex: 7891234567890',
                      hintStyle: TextStyle(color: AppTheme.dark400),
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
                        borderSide: BorderSide(
                          color: AppTheme.primary,
                          width: 2,
                        ),
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

                  // Marca (50%) + Toggle Mostrar na Etiqueta (50%)
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Campo de Marca (50%)
                      Expanded(
                        child: TextFormField(
                          controller: _marcaController,
                          decoration: InputDecoration(
                            labelText: 'Marca (opcional)',
                            labelStyle: TextStyle(color: AppTheme.dark300),
                            hintText: 'Ex: Nestlé',
                            hintStyle: TextStyle(color: AppTheme.dark400),
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
                              borderSide: BorderSide(
                                color: AppTheme.primary,
                                width: 2,
                              ),
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

                      // Toggle Mostrar Marca (50%)
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _mostrarMarcaNaEtiqueta =
                                  !_mostrarMarcaNaEtiqueta;
                            });
                          },
                          child: Container(
                            height: 56,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            decoration: BoxDecoration(
                              color: AppTheme.dark700,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: _mostrarMarcaNaEtiqueta
                                    ? AppTheme.primary
                                    : AppTheme.dark600,
                                width: 2,
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Row(
                                    children: [
                                      Icon(
                                        PhosphorIcons.tag,
                                        color: _mostrarMarcaNaEtiqueta
                                            ? AppTheme.primary
                                            : AppTheme.dark400,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 8),
                                      Flexible(
                                        child: Text(
                                          'Mostrar',
                                          style: TextStyle(
                                            color: _mostrarMarcaNaEtiqueta
                                                ? AppTheme.primary
                                                : AppTheme.dark300,
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Switch(
                                  value: _mostrarMarcaNaEtiqueta,
                                  onChanged: (value) {
                                    setState(() {
                                      _mostrarMarcaNaEtiqueta = value;
                                    });
                                  },
                                  activeColor: AppTheme.primary,
                                  activeTrackColor: AppTheme.primary
                                      .withOpacity(0.3),
                                  inactiveThumbColor: AppTheme.dark400,
                                  inactiveTrackColor: AppTheme.dark600,
                                  materialTapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // SIF (50%) + Toggle Mostrar na Etiqueta (50%)
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Campo de SIF (50%)
                      Expanded(
                        child: TextFormField(
                          controller: _sifController,
                          decoration: InputDecoration(
                            labelText: 'SIF (opcional)',
                            labelStyle: TextStyle(color: AppTheme.dark300),
                            hintText: 'Ex: SIF 12345',
                            hintStyle: TextStyle(color: AppTheme.dark400),
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
                              borderSide: BorderSide(
                                color: AppTheme.primary,
                                width: 2,
                              ),
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

                      // Toggle Mostrar SIF (50%)
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _mostrarSifNaEtiqueta = !_mostrarSifNaEtiqueta;
                            });
                          },
                          child: Container(
                            height: 56,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            decoration: BoxDecoration(
                              color: AppTheme.dark700,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: _mostrarSifNaEtiqueta
                                    ? AppTheme.primary
                                    : AppTheme.dark600,
                                width: 2,
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Row(
                                    children: [
                                      Icon(
                                        PhosphorIcons.shieldCheck,
                                        color: _mostrarSifNaEtiqueta
                                            ? AppTheme.primary
                                            : AppTheme.dark400,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 8),
                                      Flexible(
                                        child: Text(
                                          'Mostrar',
                                          style: TextStyle(
                                            color: _mostrarSifNaEtiqueta
                                                ? AppTheme.primary
                                                : AppTheme.dark300,
                                            fontSize: 14,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Switch(
                                  value: _mostrarSifNaEtiqueta,
                                  onChanged: (value) {
                                    setState(() {
                                      _mostrarSifNaEtiqueta = value;
                                    });
                                  },
                                  activeColor: AppTheme.primary,
                                  activeTrackColor: AppTheme.primary
                                      .withOpacity(0.3),
                                  inactiveThumbColor: AppTheme.dark400,
                                  inactiveTrackColor: AppTheme.dark600,
                                  materialTapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Toggles para Lote e Data de Vencimento
                  Row(
                    children: [
                      // Toggle Lote de Indústria
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _mostrarLoteIndustriaNaEtiqueta =
                                  !_mostrarLoteIndustriaNaEtiqueta;
                            });
                          },
                          child: Container(
                            height: 56,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            decoration: BoxDecoration(
                              color: AppTheme.dark700,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: _mostrarLoteIndustriaNaEtiqueta
                                    ? AppTheme.primary
                                    : AppTheme.dark600,
                                width: 2,
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Row(
                                    children: [
                                      Icon(
                                        PhosphorIcons.package,
                                        color: _mostrarLoteIndustriaNaEtiqueta
                                            ? AppTheme.primary
                                            : AppTheme.dark400,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 8),
                                      Flexible(
                                        child: Text(
                                          'Lote Indústria',
                                          style: TextStyle(
                                            color:
                                                _mostrarLoteIndustriaNaEtiqueta
                                                ? AppTheme.primary
                                                : AppTheme.dark300,
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Switch(
                                  value: _mostrarLoteIndustriaNaEtiqueta,
                                  onChanged: (value) {
                                    setState(() {
                                      _mostrarLoteIndustriaNaEtiqueta = value;
                                    });
                                  },
                                  activeColor: AppTheme.primary,
                                  activeTrackColor: AppTheme.primary
                                      .withOpacity(0.3),
                                  inactiveThumbColor: AppTheme.dark400,
                                  inactiveTrackColor: AppTheme.dark600,
                                  materialTapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(width: 12),

                      // Toggle Data de Vencimento
                      Expanded(
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _mostrarDataVencimentoNaEtiqueta =
                                  !_mostrarDataVencimentoNaEtiqueta;
                            });
                          },
                          child: Container(
                            height: 56,
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            decoration: BoxDecoration(
                              color: AppTheme.dark700,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: _mostrarDataVencimentoNaEtiqueta
                                    ? AppTheme.primary
                                    : AppTheme.dark600,
                                width: 2,
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Row(
                                    children: [
                                      Icon(
                                        PhosphorIcons.calendarBlank,
                                        color: _mostrarDataVencimentoNaEtiqueta
                                            ? AppTheme.primary
                                            : AppTheme.dark400,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 8),
                                      Flexible(
                                        child: Text(
                                          'Data Venc.',
                                          style: TextStyle(
                                            color:
                                                _mostrarDataVencimentoNaEtiqueta
                                                ? AppTheme.primary
                                                : AppTheme.dark300,
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Switch(
                                  value: _mostrarDataVencimentoNaEtiqueta,
                                  onChanged: (value) {
                                    setState(() {
                                      _mostrarDataVencimentoNaEtiqueta = value;
                                    });
                                  },
                                  activeColor: AppTheme.primary,
                                  activeTrackColor: AppTheme.primary
                                      .withOpacity(0.3),
                                  inactiveThumbColor: AppTheme.dark400,
                                  inactiveTrackColor: AppTheme.dark600,
                                  materialTapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Tipo de produto
                  Text(
                    'Tipo de Produto *',
                    style: TextStyle(
                      color: AppTheme.dark300,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 8),

                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: tiposProduto.map((tipo) {
                      final isSelected = _tipoSelecionado == tipo['id'];
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _tipoSelecionado = tipo['id'];
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppTheme.primary.withOpacity(0.2)
                                : AppTheme.dark700,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected
                                  ? AppTheme.primary
                                  : AppTheme.dark600,
                              width: 1,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                tipo['icon'],
                                color: isSelected
                                    ? AppTheme.primary
                                    : AppTheme.dark300,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                tipo['nome'],
                                style: TextStyle(
                                  color: isSelected
                                      ? AppTheme.primary
                                      : AppTheme.dark300,
                                  fontWeight: isSelected
                                      ? FontWeight.w600
                                      : FontWeight.w400,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 20),

                  // Categoria com hierarquia
                  Row(
                    children: [
                      Expanded(
                        child: HierarchicalCategoryDropdown(
                          selectedCategoryId: _categoriaSelecionada,
                          onChanged: (value) {
                            setState(() {
                              _categoriaSelecionada = value;
                            });
                          },
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Categoria é obrigatória';
                            }
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Container(
                        height: 56, // Mesma altura do dropdown
                        child: IconButton(
                          onPressed: _showCreateCategoryModal,
                          icon: Icon(PhosphorIcons.plus, color: Colors.green),
                          style: IconButton.styleFrom(
                            backgroundColor: Colors.green.withOpacity(0.1),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                              side: BorderSide(
                                color: Colors.green.withOpacity(0.3),
                                width: 1,
                              ),
                            ),
                          ),
                          tooltip: 'Criar nova categoria',
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // ⭐ NOVO: Impressora Padrão com visual melhorado
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Impressora Padrão',
                        style: TextStyle(
                          color: AppTheme.dark300,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      SizedBox(height: 8),
                      Consumer<PrintProvider>(
                        builder: (context, printProvider, child) {
                          // Opção "Nenhuma"
                          return Column(
                            children: [
                              // Card "Nenhuma"
                              GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _impressoraSelecionada = null;
                                  });
                                },
                                child: Container(
                                  padding: EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: AppTheme.dark700,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: _impressoraSelecionada == null
                                          ? AppTheme.primary
                                          : AppTheme.dark600,
                                      width: _impressoraSelecionada == null ? 2 : 1,
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 40,
                                        height: 40,
                                        decoration: BoxDecoration(
                                          color: _impressoraSelecionada == null
                                              ? AppTheme.primary.withOpacity(0.2)
                                              : AppTheme.dark600,
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Icon(
                                          PhosphorIcons.x,
                                          color: _impressoraSelecionada == null
                                              ? AppTheme.primary
                                              : AppTheme.dark400,
                                          size: 20,
                                        ),
                                      ),
                                      SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Usar regras gerais',
                                              style: TextStyle(
                                                color: _impressoraSelecionada == null
                                                    ? Colors.white
                                                    : AppTheme.dark300,
                                                fontSize: 14,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                            SizedBox(height: 2),
                                            Text(
                                              'Impressora da categoria ou tag',
                                              style: TextStyle(
                                                color: AppTheme.dark400,
                                                fontSize: 12,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      if (_impressoraSelecionada == null)
                                        Icon(
                                          PhosphorIcons.checkCircle,
                                          color: AppTheme.primary,
                                          size: 20,
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                              SizedBox(height: 12),
                              // Lista de impressoras
                              ...printProvider.impressoras.map((printer) {
                                final isSelected = _impressoraSelecionada == printer.id;
                                return Padding(
                                  padding: EdgeInsets.only(bottom: 12),
                                  child: GestureDetector(
                                    onTap: () {
                                      setState(() {
                                        _impressoraSelecionada = printer.id;
                                      });
                                    },
                                    child: Container(
                                      padding: EdgeInsets.all(16),
                                      decoration: BoxDecoration(
                                        color: AppTheme.dark700,
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                          color: isSelected
                                              ? AppTheme.primary
                                              : AppTheme.dark600,
                                          width: isSelected ? 2 : 1,
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          // Ícone da impressora com status
                                          Container(
                                            width: 40,
                                            height: 40,
                                            decoration: BoxDecoration(
                                              color: printer.isOnline
                                                  ? Colors.green.withOpacity(0.2)
                                                  : AppTheme.dark600,
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                            child: Icon(
                                              PhosphorIcons.printer,
                                              color: printer.isOnline
                                                  ? Colors.green
                                                  : AppTheme.dark400,
                                              size: 20,
                                            ),
                                          ),
                                          SizedBox(width: 12),
                                          // Informações da impressora
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  children: [
                                                    Expanded(
                                                      child: Text(
                                                        printer.displayName,
                                                        style: TextStyle(
                                                          color: isSelected
                                                              ? Colors.white
                                                              : AppTheme.dark300,
                                                          fontSize: 14,
                                                          fontWeight: FontWeight.w600,
                                                        ),
                                                        overflow: TextOverflow.ellipsis,
                                                      ),
                                                    ),
                                                    // Badge de status
                                                    Container(
                                                      padding: EdgeInsets.symmetric(
                                                        horizontal: 6,
                                                        vertical: 2,
                                                      ),
                                                      decoration: BoxDecoration(
                                                        color: printer.isOnline
                                                            ? Colors.green.withOpacity(0.2)
                                                            : Colors.orange.withOpacity(0.2),
                                                        borderRadius: BorderRadius.circular(4),
                                                      ),
                                                      child: Text(
                                                        printer.isOnline ? 'Online' : 'Offline',
                                                        style: TextStyle(
                                                          color: printer.isOnline
                                                              ? Colors.green
                                                              : Colors.orange,
                                                          fontSize: 10,
                                                          fontWeight: FontWeight.w600,
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                SizedBox(height: 4),
                                                // Informações adicionais
                                                if (printer.brand != null || printer.model != null)
                                                  Text(
                                                    [
                                                      printer.brand,
                                                      printer.model,
                                                    ].where((e) => e != null && e.isNotEmpty).join(' • '),
                                                    style: TextStyle(
                                                      color: AppTheme.dark400,
                                                      fontSize: 11,
                                                    ),
                                                    overflow: TextOverflow.ellipsis,
                                                  )
                                                else if (printer.location != null)
                                                  Text(
                                                    printer.location!,
                                                    style: TextStyle(
                                                      color: AppTheme.dark400,
                                                      fontSize: 11,
                                                    ),
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                              ],
                                            ),
                                          ),
                                          SizedBox(width: 8),
                                          // Check de seleção
                                          if (isSelected)
                                            Icon(
                                              PhosphorIcons.checkCircle,
                                              color: AppTheme.primary,
                                              size: 20,
                                            ),
                                        ],
                                      ),
                                    ),
                                  ),
                                );
                              }).toList(),
                            ],
                          );
                        },
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // Local de Armazenamento Padrão
                  Consumer<StorageLocationsProvider>(
                    builder: (context, storageProvider, child) {
                      return StorageLocationSelector(
                        selectedLocationId: _localArmazenamentoSelecionado,
                        locations: storageProvider.storageLocations,
                        onChanged: (locationId) {
                          setState(() {
                            _localArmazenamentoSelecionado = locationId;
                          });
                        },
                        label: 'Local de Armazenamento Padrão',
                        isRequired: false,
                      );
                    },
                  ),

                  // Template ID (só aparece quando Apenas Rótulo está ativo)
                  if (_isLabelOnly) ...[
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: _templateController,
                      decoration: InputDecoration(
                        labelText: 'Template ID *',
                        hintText: 'UUID do template do Tagment',
                        labelStyle: TextStyle(color: AppTheme.dark300),
                        hintStyle: TextStyle(color: AppTheme.dark400),
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
                          borderSide: BorderSide(
                            color: AppTheme.primary,
                            width: 2,
                          ),
                        ),
                        filled: true,
                        fillColor: AppTheme.dark700,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 16,
                        ),
                        prefixIcon: Icon(
                          PhosphorIcons.layout,
                          color: AppTheme.primary,
                          size: 20,
                        ),
                      ),
                      style: TextStyle(color: Colors.white),
                      validator: (value) {
                        if (_isLabelOnly && (value == null || value.isEmpty)) {
                          return 'Template ID é obrigatório para etiqueta personalizada';
                        }
                        return null;
                      },
                    ),
                  ],

                  const SizedBox(height: 20),

                  // Peso/Quantidade e Unidade em linha
                  Row(
                    children: [
                      // Peso/Quantidade
                      Expanded(
                        flex: 2,
                        child: TextFormField(
                          controller: _pesoController,
                          decoration: InputDecoration(
                            labelText: 'Peso/Quantidade',
                            labelStyle: TextStyle(color: AppTheme.dark300),
                            hintText: 'Ex: 500',
                            hintStyle: TextStyle(color: AppTheme.dark400),
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
                              borderSide: BorderSide(
                                color: AppTheme.primary,
                                width: 2,
                              ),
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
                      ),
                      const SizedBox(width: 12),
                      // Unidade
                      Expanded(
                        child: Container(
                          height: 56,
                          decoration: BoxDecoration(
                            color: AppTheme.dark700,
                            borderRadius: BorderRadius.circular(12),
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
                              items: unidadesDisponiveis.map((String unidade) {
                                return DropdownMenuItem<String>(
                                  value: unidade,
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                    ),
                                    child: Text(unidade),
                                  ),
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

                  const SizedBox(height: 20),

                  // Título da seção de validade
                  Text(
                    'Validade (dias)',
                    style: TextStyle(
                      color: AppTheme.dark300,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Validade com cards
                  Row(
                    children: [
                      // Ambiente
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.dark800,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.dark700),
                          ),
                          child: Column(
                            children: [
                              Icon(
                                PhosphorIcons.sun,
                                color: AppTheme.primary,
                                size: 24,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Ambiente',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 8),
                              TextFormField(
                                controller: _validadeAmbienteController,
                                textAlign: TextAlign.center,
                                keyboardType: TextInputType.number,
                                decoration: InputDecoration(
                                  hintText: 'Ex: 30',
                                  hintStyle: TextStyle(color: AppTheme.dark400),
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
                                      width: 2,
                                    ),
                                  ),
                                  filled: true,
                                  fillColor: AppTheme.dark700,
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 8,
                                  ),
                                ),
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Refrigerado
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.dark800,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.dark700),
                          ),
                          child: Column(
                            children: [
                              Icon(
                                PhosphorIcons.snowflake,
                                color: Colors.blue,
                                size: 24,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Refrigerado',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 8),
                              TextFormField(
                                controller: _validadeRefrigeradoController,
                                textAlign: TextAlign.center,
                                keyboardType: TextInputType.number,
                                decoration: InputDecoration(
                                  hintText: 'Ex: 7',
                                  hintStyle: TextStyle(color: AppTheme.dark400),
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
                                      width: 2,
                                    ),
                                  ),
                                  filled: true,
                                  fillColor: AppTheme.dark700,
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 8,
                                  ),
                                ),
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Congelado
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppTheme.dark800,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.dark700),
                          ),
                          child: Column(
                            children: [
                              Icon(
                                PhosphorIcons.snowflake,
                                color: Colors.cyan,
                                size: 24,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Congelado',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 8),
                              TextFormField(
                                controller: _validadeCongeladoController,
                                textAlign: TextAlign.center,
                                keyboardType: TextInputType.number,
                                decoration: InputDecoration(
                                  hintText: 'Ex: 90',
                                  hintStyle: TextStyle(color: AppTheme.dark400),
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
                                      width: 2,
                                    ),
                                  ),
                                  filled: true,
                                  fillColor: AppTheme.dark700,
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 8,
                                  ),
                                ),
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // ⭐ Switch: Apenas Rótulo (Etiqueta Personalizada)
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        _isLabelOnly = !_isLabelOnly;
                        if (!_isLabelOnly) {
                          _templateController.clear();
                        }
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.dark700,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _isLabelOnly ? Colors.orange : AppTheme.dark600,
                          width: 2,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Row(
                              children: [
                                Icon(
                                  PhosphorIcons.tag,
                                  color: _isLabelOnly ? Colors.orange : AppTheme.dark400,
                                  size: 24,
                                ),
                                const SizedBox(width: 12),
                                Flexible(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Etiqueta Personalizada',
                                        style: TextStyle(
                                          color: _isLabelOnly ? Colors.orange : Colors.white,
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      Text(
                                        'Rótulo sem rastreabilidade',
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
                          Switch(
                            value: _isLabelOnly,
                            onChanged: (value) {
                              setState(() {
                                _isLabelOnly = value;
                                if (!value) {
                                  _templateController.clear();
                                }
                              });
                            },
                            activeColor: Colors.orange,
                            activeTrackColor: Colors.orange.withOpacity(0.3),
                            inactiveThumbColor: AppTheme.dark400,
                            inactiveTrackColor: AppTheme.dark600,
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // ⭐ Switch: Exibir Hora na Etiqueta
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        _showTimeOnLabel = !_showTimeOnLabel;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.dark700,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _showTimeOnLabel ? AppTheme.primary : AppTheme.dark600,
                          width: 2,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Row(
                              children: [
                                Icon(
                                  PhosphorIcons.clock,
                                  color: _showTimeOnLabel ? AppTheme.primary : AppTheme.dark400,
                                  size: 24,
                                ),
                                const SizedBox(width: 12),
                                Flexible(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Exibir Hora na Etiqueta',
                                        style: TextStyle(
                                          color: _showTimeOnLabel ? AppTheme.primary : Colors.white,
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      Text(
                                        'Mostra horário na manipulação e validade',
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
                          Switch(
                            value: _showTimeOnLabel,
                            onChanged: (value) {
                              setState(() {
                                _showTimeOnLabel = value;
                              });
                            },
                            activeColor: AppTheme.primary,
                            activeTrackColor: AppTheme.primary.withOpacity(0.3),
                            inactiveThumbColor: AppTheme.dark400,
                            inactiveTrackColor: AppTheme.dark600,
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Status do Produto
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        _produtoAtivo = !_produtoAtivo;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.dark700,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _produtoAtivo ? Colors.green : Colors.red,
                          width: 2,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Row(
                              children: [
                                Icon(
                                  _produtoAtivo
                                      ? PhosphorIcons.checkCircle
                                      : PhosphorIcons.prohibit,
                                  color: _produtoAtivo
                                      ? Colors.green
                                      : Colors.red,
                                  size: 24,
                                ),
                                const SizedBox(width: 12),
                                Flexible(
                                  child: Text(
                                    'Status do Produto',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Row(
                            children: [
                              Text(
                                _produtoAtivo ? 'Ativo' : 'Inativo',
                                style: TextStyle(
                                  color: _produtoAtivo
                                      ? Colors.green
                                      : Colors.red,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Switch(
                                value: _produtoAtivo,
                                onChanged: (value) {
                                  setState(() {
                                    _produtoAtivo = value;
                                  });
                                },
                                activeColor: Colors.green,
                                activeTrackColor: Colors.green.withOpacity(0.3),
                                inactiveThumbColor: Colors.red,
                                inactiveTrackColor: Colors.red.withOpacity(0.3),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Espaço extra para evitar o footer do dispositivo
                  const SizedBox(height: 100),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
