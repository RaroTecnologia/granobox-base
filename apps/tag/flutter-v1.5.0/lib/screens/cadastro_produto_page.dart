import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'package:camera/camera.dart';
import 'package:collection/collection.dart'; // Para firstWhereOrNull
import '../theme/app_theme.dart';
import '../providers/auth_provider.dart';
import '../providers/categories_products_provider.dart';
import '../providers/storage_locations_provider.dart';
import '../providers/print_provider.dart'; // ⭐ NOVO
import '../models/product_models.dart';
import '../models/category_models.dart';
import '../components/hierarchical_category_dropdown.dart';
import '../components/storage_location_selector.dart';
import '../components/modal_cadastro_categoria.dart';
import '../services/products_service.dart';
import '../services/openai_service.dart';
import 'main_screen.dart';

class CadastroProdutoPage extends StatefulWidget {
  final String? initialCategoryId;
  final String? aiProductName;
  final String? aiBrand;
  final String? aiSif;
  final String? aiBarcode;
  final String? aiObservations;
  final String? aiWeight;
  final String? aiWeightUnit;
  final File? aiFrenteImage;
  final File? aiVersoImage;
  final bool createdByAI;

  const CadastroProdutoPage({
    Key? key,
    this.initialCategoryId,
    this.aiProductName,
    this.aiBrand,
    this.aiSif,
    this.aiBarcode,
    this.aiObservations,
    this.aiWeight,
    this.aiWeightUnit,
    this.aiFrenteImage,
    this.aiVersoImage,
    this.createdByAI = false,
  }) : super(key: key);

  @override
  State<CadastroProdutoPage> createState() => _CadastroProdutoPageState();
}

class _CadastroProdutoPageState extends State<CadastroProdutoPage> {
  final _formKey = GlobalKey<FormState>();
  final _nomeController = TextEditingController();
  final _codigoController = TextEditingController();
  final _marcaController = TextEditingController();
  final _sifController = TextEditingController();
  final _pesoController = TextEditingController();
  final _validadeController = TextEditingController();
  final _validadeRefrigeradoController = TextEditingController();
  final _validadeCongeladoController = TextEditingController();
  final _observacoesController = TextEditingController();
  final _codigoBarrasController = TextEditingController();

  String? _categoriaSelecionada;
  String? _localArmazenamentoSelecionado;
  String _unidadeSelecionada = 'KG';
  String _tipoSelecionado = 'finished';
  final _templateController =
      TextEditingController(); // ⭐ Alterado: TextEditingController ao invés de String?
  String? _impressoraSelecionada; // ⭐ NOVO: Impressora padrão do produto
  bool _isEtiquetaPersonalizada = false; // 🏷️ NOVO: Toggle para etiqueta personalizada
  bool _isLoading = false;
  
  // NOTA: Os helpers de categoria foram movidos para dentro do Builder
  // para garantir que o contexto esteja correto durante a validação

  // Modo IA
  final ImagePicker _imagePicker = ImagePicker();
  final OpenAiService _openAiService = OpenAiService();
  File? _frenteImage;
  File? _versoImage;
  bool _isAnalyzingAI = false;

  // Toggles para controlar exibição na etiqueta
  bool _mostrarMarcaNaEtiqueta = false;
  bool _mostrarSifNaEtiqueta = false;
  bool _mostrarLoteIndustriaNaEtiqueta = false;
  bool _mostrarDataVencimentoNaEtiqueta = false;
  bool _produtoAtivo = true; // Produtos são ativos por padrão
  // _isLabelOnly foi substituído por _isEtiquetaPersonalizada (linha 74)
  bool _showTimeOnLabel = true; // Quando true, exibe hora na manipulação e validade

  // Lista de unidades disponíveis
  final List<String> unidadesDisponiveis = [
    'KG',
    'G',
    'L',
    'ML',
    'UN',
    'CX',
    'PCT',
  ];

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

  @override
  void initState() {
    super.initState();

    // Se foi passada uma categoria inicial, seleciona ela
    if (widget.initialCategoryId != null) {
      _categoriaSelecionada = widget.initialCategoryId;
    }

    // Preencher campos com dados da IA (se disponíveis)
    if (widget.createdByAI) {
      _nomeController.text = widget.aiProductName ?? '';
      _marcaController.text = widget.aiBrand ?? '';
      _sifController.text = widget.aiSif ?? '';
      _codigoController.text = widget.aiBarcode ?? '';

      // Preencher peso e unidade
      if (widget.aiWeight != null && widget.aiWeight!.isNotEmpty) {
        _pesoController.text = widget.aiWeight!;
      }
      if (widget.aiWeightUnit != null && widget.aiWeightUnit!.isNotEmpty) {
        final unit = widget.aiWeightUnit!.toUpperCase();
        if (['KG', 'G', 'L', 'ML', 'UN'].contains(unit)) {
          _unidadeSelecionada = unit;
        }
      }

      // Definir imagens capturadas pela IA
      if (widget.aiFrenteImage != null) {
        _frenteImage = widget.aiFrenteImage;
      }
      if (widget.aiVersoImage != null) {
        _versoImage = widget.aiVersoImage;
      }

      print('🤖 Produto pré-preenchido pela IA');
    }

    // Adicionar listeners para ativar toggles automaticamente
    _marcaController.addListener(_onMarcaChanged);
    _sifController.addListener(_onSifChanged);

    // Carregar impressoras disponíveis após o primeiro frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
    _loadPrinters();
    });
  }

  Future<void> _loadPrinters() async {
    final auth = context.read<AuthProvider>();
    final printProvider = context.read<PrintProvider>();
    final token = await auth.authToken;

    if (token != null && printProvider.impressoras.isEmpty) {
      await printProvider.carregarImpressoras(
        forceRefresh: true,
        token: token,
        clientId: auth.user?.clientId,
      );
    }
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
    _marcaController.dispose();
    _sifController.dispose();
    _pesoController.dispose();
    _validadeController.dispose();
    _validadeRefrigeradoController.dispose();
    _validadeCongeladoController.dispose();
    _observacoesController.dispose();
    _codigoBarrasController.dispose();
    _templateController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    print('🔧 DEBUG: CadastroProdutoPage.build() INICIADO');
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      appBar: AppBar(
        backgroundColor: AppTheme.dark900,
        title: const Text(
          'Novo Produto',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        toolbarHeight: 80,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (_isLoading || _isAnalyzingAI)
            Container(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else ...[
            // Botão IA
            Container(
              margin: const EdgeInsets.only(right: 8),
              child: IconButton(
                onPressed: _showAiModal,
                icon: Icon(
                  PhosphorIcons.sparkle,
                  color: Colors.green,
                  size: 24,
                ),
                tooltip: 'Preencher com IA',
                style: IconButton.styleFrom(
                  backgroundColor: Colors.green.withOpacity(0.1),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
            // Botão Salvar
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
        ],
      ),
      body: Consumer<StorageLocationsProvider>(
        builder: (context, storageProvider, child) {
          print('🔧 DEBUG: Consumer<StorageLocationsProvider> builder CHAMADO');
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
                      hintText: 'Ex: PRD001, MAN001, MP001',
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

                  // Código de Barras
                  TextFormField(
                    controller: _codigoBarrasController,
                    decoration: InputDecoration(
                      labelText: 'Código de Barras (opcional)',
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
                      prefixIcon: Icon(
                        PhosphorIcons.barcode,
                        color: AppTheme.primary,
                        size: 20,
                      ),
                    ),
                    style: TextStyle(color: Colors.white),
                    keyboardType: TextInputType.number,
                  ),

                  const SizedBox(height: 16),

                  // Observações
                  TextFormField(
                    controller: _observacoesController,
                    decoration: InputDecoration(
                      labelText: 'Observações (opcional)',
                      labelStyle: TextStyle(color: AppTheme.dark300),
                      hintText: 'Ex: Manter refrigerado, Produto sensível',
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
                        PhosphorIcons.notepad,
                        color: AppTheme.primary,
                        size: 20,
                      ),
                    ),
                    style: TextStyle(color: Colors.white),
                    maxLines: 3,
                    minLines: 2,
                  ),

                  const SizedBox(height: 20),

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

                  const SizedBox(height: 20),

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
                            _tipoSelecionado = tipo['id'] as String;
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
                                tipo['icon'] as IconData,
                                color: isSelected
                                    ? AppTheme.primary
                                    : AppTheme.dark300,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                tipo['nome'] as String,
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

                  // Local de Armazenamento Padrão
                  StorageLocationSelector(
                    selectedLocationId: _localArmazenamentoSelecionado,
                    locations: storageProvider.storageLocations,
                    onChanged: (locationId) {
                      setState(() {
                        _localArmazenamentoSelecionado = locationId;
                      });
                    },
                    label: 'Local de Armazenamento Padrão',
                    isRequired: false,
                  ),

                  const SizedBox(height: 20),

                  // 🏷️ Toggle Etiqueta Personalizada
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        _isEtiquetaPersonalizada = !_isEtiquetaPersonalizada;
                        if (!_isEtiquetaPersonalizada) {
                          _templateController.clear();
                        }
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: _isEtiquetaPersonalizada
                            ? AppTheme.primary.withOpacity(0.1)
                            : AppTheme.dark700,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _isEtiquetaPersonalizada
                              ? AppTheme.primary
                              : AppTheme.dark600,
                          width: 2,
                        ),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Row(
                              children: [
                                Icon(
                                  PhosphorIcons.tag,
                                  color: _isEtiquetaPersonalizada
                                      ? AppTheme.primary
                                      : AppTheme.dark400,
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
                                          color: _isEtiquetaPersonalizada
                                              ? AppTheme.primary
                                              : Colors.white,
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      Text(
                                        'Rótulo sem rastreabilidade',
                                        style: TextStyle(
                                          color: AppTheme.dark300,
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
                            value: _isEtiquetaPersonalizada,
                            onChanged: (value) {
                              setState(() {
                                _isEtiquetaPersonalizada = value;
                                if (!value) {
                                  _templateController.clear();
                                }
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

                  // Template ID (só aparece quando Etiqueta Personalizada está ativa)
                  if (_isEtiquetaPersonalizada) ...[
                    const SizedBox(height: 16),
                    
                    // 🆕 Usar Builder para calcular se categoria tem template dentro do contexto correto
                    Builder(builder: (context) {
                      final categoriesProvider = context.read<CategoriesProductsProvider>();
                      final categoria = _categoriaSelecionada != null 
                          ? categoriesProvider.categories.firstWhereOrNull((c) => c.id == _categoriaSelecionada)
                          : null;
                      final categoriaTemTemplate = categoria?.defaultTemplateId != null && 
                                                   categoria!.defaultTemplateId!.isNotEmpty;
                      
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Mostrar info se a categoria já tem template
                          if (categoriaTemTemplate) ...[
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppTheme.primary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    PhosphorIcons.info,
                                    color: AppTheme.primary,
                                    size: 20,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'A categoria já possui um template configurado. '
                                      'Deixe vazio para usar o template da categoria.',
                                      style: TextStyle(
                                        color: AppTheme.primary,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 12),
                          ],
                          
                          TextFormField(
                            controller: _templateController,
                            decoration: InputDecoration(
                              labelText: categoriaTemTemplate 
                                  ? 'Template ID (opcional - sobrescreve categoria)' 
                                  : 'Template ID *',
                              hintText: categoriaTemTemplate 
                                  ? 'Deixe vazio para usar: ${categoria?.defaultTemplateId?.substring(0, 8)}...'
                                  : 'UUID do template do Tagment',
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
                              // Mostrar ícone de herança quando categoria tem template
                              suffixIcon: categoriaTemTemplate && _templateController.text.isEmpty
                                  ? Tooltip(
                                      message: 'Usando template da categoria',
                                      child: Icon(
                                        PhosphorIcons.arrowBendDownLeft,
                                        color: AppTheme.primary,
                                        size: 20,
                                      ),
                                    )
                                  : null,
                            ),
                            style: TextStyle(color: Colors.white),
                            validator: (value) {
                              // Se a categoria tem template, o campo não é obrigatório
                              if (_isEtiquetaPersonalizada && 
                                  !categoriaTemTemplate && 
                                  (value == null || value.isEmpty)) {
                                return 'Template ID é obrigatório (ou configure na categoria)';
                              }
                              return null;
                            },
                          ),
                        ],
                      );
                    }),
                  ],

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
                                controller: _validadeController,
                                textAlign: TextAlign.center,
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
                                keyboardType: TextInputType.number,
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
                                color: Colors.cyan,
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
                                keyboardType: TextInputType.number,
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
                                keyboardType: TextInputType.number,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
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
                  const SizedBox(height: 50),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  /// Mostrar modal de IA
  void _showAiModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.dark800,
      isScrollControlled: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
            ),
            child: Container(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header
                  Row(
                    children: [
                      Icon(
                        PhosphorIcons.sparkle,
                        color: Colors.green,
                        size: 24,
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Modo IA',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              'Preencher dados com fotos',
                              style: TextStyle(
                                color: AppTheme.dark300,
                                fontSize: 14,
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

                  SizedBox(height: 24),

                  // Card informativo
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.green.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          PhosphorIcons.lightbulb,
                          color: Colors.green,
                          size: 20,
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Tire fotos da frente e verso do produto para extrair automaticamente nome, marca, SIF e data de validade',
                            style: TextStyle(
                              color: Colors.green[200],
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  SizedBox(height: 24),

                  // Botões de captura
                  Row(
                    children: [
                      // Frente
                      Expanded(
                        child: _buildCaptureCard(
                          'Frente',
                          PhosphorIcons.imageSquare,
                          _frenteImage,
                          () => _capturePhoto('frente', setModalState),
                        ),
                      ),
                      SizedBox(width: 12),
                      // Verso
                      Expanded(
                        child: _buildCaptureCard(
                          'Verso',
                          PhosphorIcons.imageSquare,
                          _versoImage,
                          () => _capturePhoto('verso', setModalState),
                        ),
                      ),
                    ],
                  ),

                  SizedBox(height: 24),

                  // Botão de análise
                  ElevatedButton(
                    onPressed: (_frenteImage != null && _versoImage != null)
                        ? () {
                            Navigator.pop(context);
                            _analyzeImagesWithAI();
                          }
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: AppTheme.dark600,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(PhosphorIcons.sparkle, size: 20),
                        SizedBox(width: 8),
                        Text(
                          'Analisar com IA',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),

                  SizedBox(height: 16),

                  // Espaçamento extra no final
                  SizedBox(height: 32),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCaptureCard(
    String label,
    IconData icon,
    File? image,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 140,
        decoration: BoxDecoration(
          color: AppTheme.dark700,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: image != null ? Colors.green : AppTheme.dark600,
            width: image != null ? 2 : 1,
          ),
        ),
        child: image != null
            ? ClipRRect(
                borderRadius: BorderRadius.circular(11),
                child: Stack(
                  children: [
                    Image.file(
                      image,
                      fit: BoxFit.cover,
                      width: double.infinity,
                      height: double.infinity,
                    ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: Colors.green,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Icon(
                          PhosphorIcons.check,
                          color: Colors.white,
                          size: 16,
                        ),
                      ),
                    ),
                  ],
                ),
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, color: AppTheme.dark400, size: 40),
                  SizedBox(height: 8),
                  Text(
                    label,
                    style: TextStyle(
                      color: AppTheme.dark300,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Toque para capturar',
                    style: TextStyle(color: AppTheme.dark400, fontSize: 12),
                  ),
                ],
              ),
      ),
    );
  }

  Future<void> _capturePhoto(String side, StateSetter setModalState) async {
    // Abrir direto a câmera para frente e verso
    _openCameraModal(side, setModalState);
  }

  void _openCameraModal(String side, StateSetter setModalState) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => _CameraCaptureModal(
          onCapture: (image) {
            setState(() {
              if (side == 'frente') {
                _frenteImage = image;
              } else {
                _versoImage = image;
              }
            });
            setModalState(() {
              if (side == 'frente') {
                _frenteImage = image;
              } else {
                _versoImage = image;
              }
            });
            Navigator.pop(context);
          },
          instructionMessage: 'Posicione o rótulo dentro da moldura',
        ),
        fullscreenDialog: true,
      ),
    );
  }

  /// Converter texto para Title Case (primeira letra de cada palavra maiúscula)
  String _toTitleCase(String text) {
    if (text.isEmpty) return text;

    return text
        .split(' ')
        .map((word) {
          if (word.isEmpty) return word;

          // Palavras pequenas que não devem ser capitalizadas (exceto no início)
          final lowercaseWords = [
            'de',
            'da',
            'do',
            'das',
            'dos',
            'e',
            'ou',
            'com',
            'sem',
            'para',
          ];

          if (lowercaseWords.contains(word.toLowerCase()) &&
              text.split(' ').first != word) {
            return word.toLowerCase();
          }

          return word[0].toUpperCase() + word.substring(1).toLowerCase();
        })
        .join(' ');
  }

  /// Normalizar SIF (extrair apenas números)
  String _normalizeSif(String sif) {
    String normalized = sif.trim().toUpperCase();

    // Remover o texto "SIF" se existir
    normalized = normalized.replaceAll('SIF', '').trim();

    // Remover espaços e manter apenas números
    normalized = normalized.replaceAll(RegExp(r'[^\d]'), '');

    return normalized;
  }

  /// Normalizar código de barras (extrair apenas números)
  String _normalizeBarcode(String barcode) {
    // Remover espaços, traços e manter apenas números
    return barcode.trim().replaceAll(RegExp(r'[^\d]'), '');
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

  Future<void> _analyzeImagesWithAI() async {
    if (_frenteImage == null || _versoImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('É necessário capturar ambas as fotos'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isAnalyzingAI = true;
    });

    try {
      final response = await _openAiService.analyzeImagesForValidity(
        _frenteImage!,
        _versoImage!,
      );

      if (response.success && response.data != null) {
        final data = response.data!;

        // Preencher os campos automaticamente com normalização
        setState(() {
          if (data.productName != null) {
            _nomeController.text = _toTitleCase(data.productName!.trim());
          }
          if (data.brand != null) {
            _marcaController.text = _toTitleCase(data.brand!.trim());
          }
          if (data.sif != null) {
            _sifController.text = _normalizeSif(data.sif!);
          }
          if (data.barcode != null) {
            _codigoBarrasController.text = _normalizeBarcode(data.barcode!);
          }
          if (data.weight != null && data.weight!.isNotEmpty) {
            _pesoController.text = data.weight!.trim();
          }
          if (data.weightUnit != null && data.weightUnit!.isNotEmpty) {
            final unit = data.weightUnit!.trim().toUpperCase();
            // Verificar se a unidade está na lista de unidades disponíveis
            if (unidadesDisponiveis.contains(unit)) {
              _unidadeSelecionada = unit;
            }
          }
          if (data.observations != null && data.observations!.isNotEmpty) {
            _observacoesController.text = data.observations!.trim();
          }
          if (data.storageInstructions != null &&
              data.storageInstructions!.isNotEmpty) {
            if (_observacoesController.text.trim().isEmpty) {
              _observacoesController.text = data.storageInstructions!.trim();
            } else if (!_observacoesController.text.contains(
              data.storageInstructions!.trim(),
            )) {
              _observacoesController.text =
                  '${_observacoesController.text.trim()}\n${data.storageInstructions!.trim()}'
                      .trim();
            }
          }
          if (data.shelfLifeAmbientDays != null &&
              data.shelfLifeAmbientDays! > 0) {
            _validadeController.text = data.shelfLifeAmbientDays!.toString();
          }
          if (data.shelfLifeRefrigeratedDays != null &&
              data.shelfLifeRefrigeratedDays! > 0) {
            _validadeRefrigeradoController.text = data
                .shelfLifeRefrigeratedDays!
                .toString();
          }
          if (data.shelfLifeFrozenDays != null &&
              data.shelfLifeFrozenDays! > 0) {
            _validadeCongeladoController.text = data.shelfLifeFrozenDays!
                .toString();
          }
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Dados extraídos e normalizados com sucesso!'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response.error ?? 'Erro ao analisar imagens'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao processar imagens: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isAnalyzingAI = false;
        _frenteImage = null;
        _versoImage = null;
      });
    }
  }

  Future<void> _salvarProduto() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final authProvider = context.read<AuthProvider>();
      final token = await authProvider.authToken;
      final clientId = authProvider.user?.clientId;

      if (token == null || clientId == null || clientId.isEmpty) {
        throw Exception('Token ou clientId não encontrado');
      }

      print('🔍 DEBUG - Dados antes de criar request:');
      print('  Nome: ${_nomeController.text.trim()}');
      print('  Código: ${_codigoController.text.trim()}');
      print('  Código de Barras: ${_codigoBarrasController.text.trim()}');
      print('  Categoria: $_categoriaSelecionada');
      print('  Tipo: $_tipoSelecionado');
      print('  ClientId: $clientId');

      final request = CreateProductRequest(
        name: _nomeController.text.trim(),
        code: _codigoController.text.trim().isEmpty
            ? null
            : _codigoController.text.trim(),
        brand: _marcaController.text.trim().isEmpty
            ? null
            : _marcaController.text.trim(),
        sif: _sifController.text.trim().isEmpty
            ? null
            : _sifController.text.trim(),
        categoryId: _categoriaSelecionada ?? 'temp-category',
        type: _tipoSelecionado,
        weight: _pesoController.text.trim().isEmpty
            ? null
            : _pesoController.text.trim(),
        weightUnit: _unidadeSelecionada,
        defaultStorageLocationId: _localArmazenamentoSelecionado,
        customTemplateId: _templateController.text.trim().isEmpty
            ? null
            : _templateController.text.trim(),
        defaultPrinterId: _impressoraSelecionada, // ⭐ NOVO
        clientId: clientId,
        currency: 'BRL',
        shelfLifeAmbient: _validadeController.text.trim().isEmpty
            ? null
            : int.tryParse(_validadeController.text.trim()),
        shelfLifeRefrigerated:
            _validadeRefrigeradoController.text.trim().isEmpty
            ? null
            : int.tryParse(_validadeRefrigeradoController.text.trim()),
        shelfLifeFrozen: _validadeCongeladoController.text.trim().isEmpty
            ? null
            : int.tryParse(_validadeCongeladoController.text.trim()),
        showBrandOnLabel: _mostrarMarcaNaEtiqueta,
        showSifOnLabel: _mostrarSifNaEtiqueta,
        showManufacturingBatchOnLabel: _mostrarLoteIndustriaNaEtiqueta,
        showExpiryDateOnLabel: _mostrarDataVencimentoNaEtiqueta,
        isActive: _produtoAtivo,
        isLabelOnly: _isEtiquetaPersonalizada,
        showTimeOnLabel: _showTimeOnLabel,
        observations: _observacoesController.text.trim().isEmpty
            ? null
            : _observacoesController.text.trim(),
        barcode: _codigoBarrasController.text.trim().isEmpty
            ? null
            : _codigoBarrasController.text.trim(),
      );

      print('📤 Enviando request para API...');
      final product = await ProductsService().createProduct(
        request,
        token: token,
      );
      print('✅ Produto criado com sucesso: ${product?.id}');

      if (product != null) {
        // Recarregar a lista de produtos
        final categoriesProvider = context.read<CategoriesProductsProvider>();
        await categoriesProvider.loadProducts();

        // Mostrar mensagem de sucesso
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Produto cadastrado com sucesso!'),
            backgroundColor: Colors.green,
          ),
        );

        // Voltar para a tela anterior
        Navigator.pop(context);
      }
    } catch (e, stackTrace) {
      print('❌ Erro ao salvar produto: $e');
      print('📍 Stack trace: $stackTrace');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao salvar produto: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
}

/// Modal personalizado para captura de foto com câmera
class _CameraCaptureModal extends StatefulWidget {
  final Function(File) onCapture;
  final String? instructionMessage;

  const _CameraCaptureModal({required this.onCapture, this.instructionMessage});

  @override
  State<_CameraCaptureModal> createState() => _CameraCaptureModalState();
}

class _CameraCaptureModalState extends State<_CameraCaptureModal> {
  CameraController? _cameraController;
  bool _isInitialized = false;
  bool _isCapturing = false;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isNotEmpty) {
        _cameraController = CameraController(
          cameras.first,
          ResolutionPreset.high,
          enableAudio: false,
        );

        await _cameraController!.initialize();
        setState(() {
          _isInitialized = true;
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao inicializar câmera: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _capturePhoto() async {
    if (_cameraController == null || _isCapturing) return;

    setState(() {
      _isCapturing = true;
    });

    try {
      final XFile image = await _cameraController!.takePicture();
      widget.onCapture(File(image.path));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao capturar foto: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isCapturing = false;
      });
    }
  }

  Widget _buildCornerGuide({
    bool topLeft = false,
    bool topRight = false,
    bool bottomLeft = false,
    bool bottomRight = false,
  }) {
    return SizedBox(
      width: 50,
      height: 50,
      child: CustomPaint(
        painter: _CornerGuidePainter(
          topLeft: topLeft,
          topRight: topRight,
          bottomLeft: bottomLeft,
          bottomRight: bottomRight,
        ),
      ),
    );
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        leading: IconButton(
          icon: Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text('Capturar Foto', style: TextStyle(color: Colors.white)),
        centerTitle: true,
      ),
      body: _isInitialized && _cameraController != null
          ? Stack(
              children: [
                // Preview da câmera
                Positioned.fill(
                  child: FittedBox(
                    fit: BoxFit.cover,
                    child: SizedBox(
                      width: _cameraController!.value.previewSize!.height,
                      height: _cameraController!.value.previewSize!.width,
                      child: CameraPreview(_cameraController!),
                    ),
                  ),
                ),

                // Overlay com moldura e guias em L nos cantos
                Positioned.fill(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 40,
                      vertical: 80,
                    ),
                    child: Stack(
                      children: [
                        // Canto Superior Esquerdo
                        Positioned(
                          top: 0,
                          left: 0,
                          child: _buildCornerGuide(topLeft: true),
                        ),
                        // Canto Superior Direito
                        Positioned(
                          top: 0,
                          right: 0,
                          child: _buildCornerGuide(topRight: true),
                        ),
                        // Canto Inferior Esquerdo
                        Positioned(
                          bottom: 0,
                          left: 0,
                          child: _buildCornerGuide(bottomLeft: true),
                        ),
                        // Canto Inferior Direito
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: _buildCornerGuide(bottomRight: true),
                        ),

                        // Instruções (posição customizável)
                        if (widget.instructionMessage != null)
                          Positioned(
                            top: 20,
                            left: 20,
                            right: 20,
                            child: Container(
                              padding: EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.7),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    PhosphorIcons.camera,
                                    color: Colors.green,
                                    size: 32,
                                  ),
                                  SizedBox(height: 8),
                                  Text(
                                    widget.instructionMessage!,
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 16,
                                      fontWeight: FontWeight.w500,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            )
          : Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: Colors.green),
                  SizedBox(height: 16),
                  Text(
                    'Inicializando câmera...',
                    style: TextStyle(color: Colors.white),
                  ),
                ],
              ),
            ),
      bottomNavigationBar: Container(
        padding: EdgeInsets.all(20),
        color: Colors.black,
        child: SafeArea(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.green,
                  border: Border.all(color: Colors.white, width: 4),
                ),
                child: IconButton(
                  onPressed: _isCapturing ? null : _capturePhoto,
                  icon: _isCapturing
                      ? SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Colors.white,
                            ),
                          ),
                        )
                      : Icon(
                          PhosphorIcons.camera,
                          color: Colors.white,
                          size: 32,
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Painter para desenhar os cantos em "L" da moldura
class _CornerGuidePainter extends CustomPainter {
  final bool topLeft;
  final bool topRight;
  final bool bottomLeft;
  final bool bottomRight;

  _CornerGuidePainter({
    this.topLeft = false,
    this.topRight = false,
    this.bottomLeft = false,
    this.bottomRight = false,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.green
      ..strokeWidth = 4
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();

    if (topLeft) {
      // Linha horizontal (topo)
      path.moveTo(0, 0);
      path.lineTo(size.width, 0);
      // Linha vertical (esquerda)
      path.moveTo(0, 0);
      path.lineTo(0, size.height);
    } else if (topRight) {
      // Linha horizontal (topo)
      path.moveTo(0, 0);
      path.lineTo(size.width, 0);
      // Linha vertical (direita)
      path.moveTo(size.width, 0);
      path.lineTo(size.width, size.height);
    } else if (bottomLeft) {
      // Linha horizontal (baixo)
      path.moveTo(0, size.height);
      path.lineTo(size.width, size.height);
      // Linha vertical (esquerda)
      path.moveTo(0, 0);
      path.lineTo(0, size.height);
    } else if (bottomRight) {
      // Linha horizontal (baixo)
      path.moveTo(0, size.height);
      path.lineTo(size.width, size.height);
      // Linha vertical (direita)
      path.moveTo(size.width, 0);
      path.lineTo(size.width, size.height);
    }

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
