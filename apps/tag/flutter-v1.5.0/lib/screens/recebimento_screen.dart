import 'dart:io';
import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../theme/app_theme.dart';
import '../components/standard_header.dart';
import '../components/bottom_navigation.dart';
import '../components/camera_capture_modal.dart';
import '../services/openai_service.dart';
import 'main_screen.dart';
import '../providers/categories_products_provider.dart';
import '../providers/storage_locations_provider.dart';
import '../providers/auth_provider.dart';
import '../models/product_models.dart';
import '../models/storage_location_models.dart';
import '../services/rastreabilidade_service.dart';
import 'package:fluttertoast/fluttertoast.dart';

class RecebimentoScreen extends StatefulWidget {
  const RecebimentoScreen({super.key});

  @override
  State<RecebimentoScreen> createState() => _RecebimentoScreenState();
}

class _RecebimentoScreenState extends State<RecebimentoScreen> {
  final _formKey = GlobalKey<FormState>();
  final RastreabilidadeService _rastreabilidadeService = RastreabilidadeService();
  
  // Controllers
  final TextEditingController _productBarcodeController = TextEditingController();
  final TextEditingController _productNameController = TextEditingController();
  final TextEditingController _supplierNameController = TextEditingController();
  final TextEditingController _invoiceNumberController = TextEditingController();
  final TextEditingController _quantityController = TextEditingController(text: '1');
  final TextEditingController _batchNumberController = TextEditingController();
  final TextEditingController _temperatureController = TextEditingController();
  final TextEditingController _sifController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();
  
  // Estados
  String? _selectedProductId;
  Product? _selectedProduct;
  String? _selectedSupplierId;
  StorageLocation? _selectedLocation;
  String _condition = 'conforme';
  bool _generateLabels = false;
  bool _isSubmitting = false;
  
  DateTime? _productionDate;
  DateTime? _validityDate;
  
  // Autocomplete
  String _productSearch = '';
  String _supplierSearch = '';
  bool _showProductSuggestions = false;
  bool _showSupplierSuggestions = false;
  
  // Índice do footer
  int _footerIndex = 2;
  
  // Focus nodes
  final FocusNode _productBarcodeFocus = FocusNode();
  final FocusNode _productNameFocus = FocusNode();
  final FocusNode _supplierNameFocus = FocusNode();

  @override
  void initState() {
    super.initState();
    // Data de fabricação sem preencher por padrão
    _loadData();
    
  }

  Future<void> _loadData() async {
    final authProvider = context.read<AuthProvider>();
    final token = await authProvider.authToken;
    
    if (token != null) {
      // Carregar produtos (apenas matéria-prima)
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
  }

  @override
  void dispose() {
    _productBarcodeController.dispose();
    _productNameController.dispose();
    _supplierNameController.dispose();
    _invoiceNumberController.dispose();
    _quantityController.dispose();
    _batchNumberController.dispose();
    _temperatureController.dispose();
    _sifController.dispose();
    _notesController.dispose();
    _productBarcodeFocus.dispose();
    _productNameFocus.dispose();
    _supplierNameFocus.dispose();
    super.dispose();
  }

  // Normalizar string removendo acentos
  String _normalizeString(String text) {
    const Map<String, String> accents = {
      'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
      'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
      'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
      'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
      'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
      'ç': 'c', 'ñ': 'n',
      'Á': 'A', 'À': 'A', 'Ã': 'A', 'Â': 'A', 'Ä': 'A',
      'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
      'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I',
      'Ó': 'O', 'Ò': 'O', 'Õ': 'O', 'Ô': 'O', 'Ö': 'O',
      'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U',
      'Ç': 'C', 'Ñ': 'N',
    };
    
    String normalized = text;
    accents.forEach((accent, replacement) {
      normalized = normalized.replaceAll(accent, replacement);
    });
    return normalized;
  }

  int _parseQuantity(String value) {
    if (value.isEmpty) return 1;
    // Remover pontos, espaços e outros caracteres não numéricos
    final cleaned = value.replaceAll(RegExp(r'[^\d]'), '');
    return int.tryParse(cleaned) ?? 1;
  }

  // Filtrar produtos (apenas matéria-prima)
  List<Product> _getFilteredProducts(List<Product> allProducts) {
    // Permitir todos os tipos de produtos no recebimento
    if (_productSearch.isEmpty || _productSearch.trim().isEmpty) return [];
    
    final search = _normalizeString(_productSearch.toLowerCase().trim());
    print('🔍 DEBUG - Buscando produtos:');
    print('  Termo de busca: "$search" (normalizado)');
    print('  Total de produtos: ${allProducts.length}');
    
    final filtered = allProducts.where((product) {
      final normalizedName = _normalizeString(product.name.toLowerCase());
      final normalizedCode = product.code != null ? _normalizeString(product.code!.toLowerCase()) : null;
      final normalizedBarcode = product.barcode != null ? _normalizeString(product.barcode!.toLowerCase()) : null;
      
      final nameMatch = normalizedName.contains(search);
      final codeMatch = normalizedCode?.contains(search) ?? false;
      final barcodeMatch = normalizedBarcode?.contains(search) ?? false;
      
      if (nameMatch || codeMatch || barcodeMatch) {
        print('  ✅ Produto encontrado: ${product.name} (${product.type})');
      }
      
      return nameMatch || codeMatch || barcodeMatch;
    }).take(5).toList();
    
    print('  Produtos filtrados: ${filtered.length}');
    return filtered;
  }

  // Filtrar fornecedores (mock por enquanto)
  List<Map<String, dynamic>> _getFilteredSuppliers() {
    // TODO: Implementar busca real de fornecedores quando houver serviço
    if (_supplierSearch.isEmpty || _supplierSearch.trim().isEmpty) return [];
    
    final mockSuppliers = [
      {'id': '1', 'name': 'Fornecedor A', 'cnpj': '12.345.678/0001-90'},
      {'id': '2', 'name': 'Fornecedor B', 'cnpj': '98.765.432/0001-10'},
      {'id': '3', 'name': 'Distribuidora Central', 'cnpj': '11.222.333/0001-44'},
      {'id': '4', 'name': 'Atacadão Norte', 'cnpj': '55.666.777/0001-88'},
    ];
    
    final search = _supplierSearch.toLowerCase().trim();
    return mockSuppliers.where((s) {
      return s['name'].toString().toLowerCase().contains(search) ||
          (s['cnpj']?.toString().toLowerCase().contains(search) ?? false);
    }).take(5).toList();
  }


  void _handleSelectProduct(Product product) {
    setState(() {
      _selectedProduct = product;
      _selectedProductId = product.id;
      _productNameController.text = product.name;
      // Descrição removida
      _productSearch = product.name;
      _showProductSuggestions = false;
    });
  }

  void _handleSelectSupplier(Map<String, dynamic> supplier) {
    setState(() {
      _selectedSupplierId = supplier['id'];
      _supplierNameController.text = supplier['name'];
      _supplierSearch = supplier['name'];
      _showSupplierSuggestions = false;
    });
  }

  Future<void> _analyzeImageWithAI() async {
    // Abrir modal de câmera
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CameraCaptureModal(
          onCapture: (image) async {
            Navigator.pop(context); // Fechar modal de câmera
            await _processImageWithAI(image);
          },
          instructionMessage: 'Posicione as informações de fabricação, validade, SIF e lote dentro da moldura',
        ),
        fullscreenDialog: true,
      ),
    );
  }

  Future<void> _processImageWithAI(File image) async {

    // Mostrar loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(),
      ),
    );

    try {
      final openAiService = OpenAiService();
      final response = await openAiService.analyzeImageForReceipt(image);

      if (!mounted) return;
      Navigator.pop(context); // Fechar loading

      if (response.success && response.customData != null) {
        final data = response.customData as Map<String, dynamic>;
        
        setState(() {
          // Data de fabricação
          if (data['data_fabricacao'] != null && data['data_fabricacao'].toString().isNotEmpty) {
            final fabricacaoStr = data['data_fabricacao'].toString();
            final fabricacaoDate = _parseDate(fabricacaoStr);
            if (fabricacaoDate != null) {
              _productionDate = fabricacaoDate;
            }
          }
          
          // Data de validade
          if (data['data_validade'] != null && data['data_validade'].toString().isNotEmpty) {
            final validadeStr = data['data_validade'].toString();
            final validadeDate = _parseDate(validadeStr);
            if (validadeDate != null) {
              _validityDate = validadeDate;
            }
          }
          
          // SIF
          if (data['sif'] != null && data['sif'].toString().isNotEmpty) {
            _sifController.text = data['sif'].toString().trim();
          }
          
          // Lote
          if (data['lote'] != null && data['lote'].toString().isNotEmpty) {
            _batchNumberController.text = data['lote'].toString().trim();
          }
        });

        Fluttertoast.showToast(
          msg: 'Informações extraídas com sucesso!',
          backgroundColor: Colors.green,
          textColor: Colors.white,
        );
      } else {
        Fluttertoast.showToast(
          msg: response.error ?? 'Erro ao analisar imagem',
          backgroundColor: Colors.red,
          textColor: Colors.white,
        );
      }
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context); // Fechar loading se ainda estiver aberto
      
      Fluttertoast.showToast(
        msg: 'Erro ao processar imagem: ${e.toString()}',
        backgroundColor: Colors.red,
        textColor: Colors.white,
      );
    }
  }

  DateTime? _parseDate(String dateStr) {
    try {
      // Tentar formatos DD/MM/AAAA ou DD-MM-AAAA
      final formats = [
        RegExp(r'(\d{2})/(\d{2})/(\d{4})'),
        RegExp(r'(\d{2})-(\d{2})-(\d{4})'),
      ];

      for (var format in formats) {
        final match = format.firstMatch(dateStr);
        if (match != null) {
          final day = int.parse(match.group(1)!);
          final month = int.parse(match.group(2)!);
          final year = int.parse(match.group(3)!);
          return DateTime(year, month, day);
        }
      }
      
      return null;
    } catch (e) {
      print('Erro ao fazer parse da data: $e');
      return null;
    }
  }

  void _handleProductBarcodeSearch(String barcode) {
    print('🔍 DEBUG - Buscando produto por código de barras: "$barcode"');
    
    if (barcode.trim().isEmpty) {
      print('❌ Código de barras vazio');
      return;
    }
    
    final categoriesProvider = context.read<CategoriesProductsProvider>();
    final allProducts = categoriesProvider.products;
    
    print('📦 Total de produtos disponíveis: ${allProducts.length}');
    
    // Debug: Listar todos os produtos com seus códigos
    for (var product in allProducts) {
      print('  Produto: ${product.name}');
      print('    - code: "${product.code}"');
      print('    - barcode: "${product.barcode}"');
    }
    
    // Buscar produto pelo código de barras
    Product? foundProduct;
    
    try {
      foundProduct = allProducts.firstWhere(
        (p) {
          final codeMatch = p.code != null && p.code!.trim() == barcode.trim();
          final barcodeMatch = p.barcode != null && p.barcode!.trim() == barcode.trim();
          
          if (codeMatch || barcodeMatch) {
            print('✅ Match encontrado: ${p.name} (code: ${p.code}, barcode: ${p.barcode})');
          }
          
          return codeMatch || barcodeMatch;
        },
      );
    } catch (e) {
      print('❌ Nenhum produto encontrado para código: "$barcode"');
      
      Fluttertoast.showToast(
        msg: 'Produto não encontrado para este código de barras',
        backgroundColor: Colors.red,
        textColor: Colors.white,
      );
      return;
    }
    
    if (foundProduct != null) {
      setState(() {
        _selectedProduct = foundProduct;
        _selectedProductId = foundProduct!.id;
        _productNameController.text = foundProduct!.name;
        _productSearch = foundProduct!.name;
        _showProductSuggestions = false;
      });
      
      print('✅ Produto selecionado: ${foundProduct.name}');
      
      // Mensagem removida - é óbvio que o produto foi encontrado
    }
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_productNameController.text.isEmpty) {
      Fluttertoast.showToast(
        msg: 'Nome do produto é obrigatório',
        backgroundColor: Colors.red,
        textColor: Colors.white,
      );
      return;
    }
    
    // Validar que um produto cadastrado foi selecionado
    if (_selectedProduct == null || _selectedProductId == null) {
      Fluttertoast.showToast(
        msg: 'Selecione um produto cadastrado da lista',
        backgroundColor: Colors.red,
        textColor: Colors.white,
      );
      return;
    }

    // Validar que a data de validade foi preenchida
    if (_validityDate == null) {
      Fluttertoast.showToast(
        msg: 'Data de validade é obrigatória',
        backgroundColor: Colors.red,
        textColor: Colors.white,
      );
      return;
    }

    try {
      setState(() => _isSubmitting = true);

      final authProvider = context.read<AuthProvider>();
      final user = authProvider.user;
      
      // Validar se supplierId é um UUID válido (não enviar se for mockado)
      String? validSupplierId;
      if (_selectedSupplierId != null && _selectedSupplierId!.isNotEmpty) {
        // Verificar se é um UUID válido (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
        final uuidRegex = RegExp(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', caseSensitive: false);
        if (uuidRegex.hasMatch(_selectedSupplierId!)) {
          validSupplierId = _selectedSupplierId;
        }
      }
      
      final data = {
        if (validSupplierId != null) 'supplierId': validSupplierId,
        'supplierCode': _invoiceNumberController.text, // Número da nota fiscal
        'supplierName': _supplierNameController.text,
        'supplierCnpj': '', // Não usado mais
        if (_selectedProductId != null) 'productId': _selectedProductId,
        'productName': _productNameController.text,
        'productDescription': '', // Descrição removida
        'quantity': _parseQuantity(_quantityController.text),
        'unit': 'UN', // Sempre UN pois quantidade é de itens/etiquetas
        if (_productionDate != null) 'productionDate': _productionDate!.toIso8601String().split('T')[0],
        'validityDate': _validityDate!.toIso8601String().split('T')[0], // Obrigatório
        'temperature': _temperatureController.text.isNotEmpty ? double.tryParse(_temperatureController.text) : null,
        'sif': _sifController.text,
        'batchNumber': _batchNumberController.text,
        'condition': _condition,
        'notes': _notesController.text,
        'itemQuantity': _generateLabels ? _parseQuantity(_quantityController.text) : 1, // Quando generateLabels=true, sempre igual à quantity
        'generateLabels': _generateLabels,
        if (_selectedLocation != null) 'storageLocationId': _selectedLocation!.id,
      };

      print('📤 DEBUG - Enviando dados do recebimento para API:');
      print('  Dados: $data');
      
      final receipt = await _rastreabilidadeService.createRecebimento(data);
      
      print('✅ DEBUG - Recebimento criado com sucesso: ${receipt.toString()}');

      Fluttertoast.showToast(
        msg: 'Recebimento registrado com sucesso!',
        backgroundColor: AppTheme.primary,
        textColor: Colors.white,
      );

      // Se marcou para gerar etiquetas, redireciona
      if (_generateLabels) {
        // TODO: Navegar para tela de impressão
        Navigator.pop(context);
      } else {
        Navigator.pop(context);
      }
    } catch (e, stackTrace) {
      print('❌ DEBUG - Erro ao criar recebimento: $e');
      print('📍 DEBUG - Stack trace: $stackTrace');
      
      String errorMessage = e.toString();
      
      // Verificar se é erro de plano/recurso
      if (errorMessage.toLowerCase().contains('plano') || 
          errorMessage.toLowerCase().contains('plan') ||
          errorMessage.toLowerCase().contains('recurso') ||
          errorMessage.toLowerCase().contains('resource')) {
        errorMessage = 'Recurso não disponível no seu plano atual';
      }
      
      Fluttertoast.showToast(
        msg: 'Erro ao criar recebimento: $errorMessage',
        backgroundColor: Colors.red,
        textColor: Colors.white,
      );
    } finally {
      setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final productsProvider = context.watch<CategoriesProductsProvider>();
    final locationsProvider = context.watch<StorageLocationsProvider>();
    final authProvider = context.watch<AuthProvider>();
    
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            // Header
            StandardHeader(
              title: 'Novo Recebimento',
              subtitle: 'Registre a entrada de mercadoria',
              showBack: true,
              showSearch: false,
              showHome: false,
              iconColor: AppTheme.primary,
              showLeading: true,
              leadingIcon: PhosphorIcons.package,
            ),
            
            // Conteúdo
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),
                    
                    // Seção: Produto
                    _buildSection(
                      title: 'Produto (Matéria-Prima)',
                      icon: PhosphorIcons.package,
                      children: [
                        // Código de barras com câmera
                        _buildBarcodeField(),
                        const SizedBox(height: 16),
                        
                        // Autocomplete de Produto e Quantidade na mesma linha
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              flex: 3,
                              child: _buildProductAutocomplete(productsProvider),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              flex: 1,
                              child: _buildTextField(
                                label: 'Qtd *',
                                controller: _quantityController,
                                keyboardType: TextInputType.number,
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'Inválida';
                                  }
                                  final quantity = _parseQuantity(value);
                                  if (quantity < 1) {
                                    return 'Inválida';
                                  }
                                  return null;
                                },
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    
                    // Seção: Fornecedor
                    _buildSection(
                      title: 'Fornecedor',
                      icon: PhosphorIcons.buildings,
                      children: [
                        _buildSupplierAutocomplete(),
                        const SizedBox(height: 16),
                        _buildTextField(
                          label: 'Número da Nota Fiscal',
                          controller: _invoiceNumberController,
                          hint: 'Ex: 123456',
                          keyboardType: TextInputType.number,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    
                    // Seção: Informações do Produto
                    _buildSectionWithAI(
                      title: 'Informações do Produto',
                      icon: PhosphorIcons.calendar,
                      onAICapture: _analyzeImageWithAI,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: _buildDateField(
                                label: 'Data de Fabricação',
                                date: _productionDate,
                                onDateSelected: (date) {
                                  setState(() => _productionDate = date);
                                },
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildDateField(
                                label: 'Data de Validade',
                                date: _validityDate,
                                onDateSelected: (date) {
                                  setState(() => _validityDate = date);
                                },
                                required: true,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: _buildTextField(
                                label: 'Temperatura (°C)',
                                icon: PhosphorIcons.thermometer,
                                controller: _temperatureController,
                                keyboardType: TextInputType.number,
                                hint: 'Ex: -18',
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildTextField(
                                label: 'SIF',
                                icon: PhosphorIcons.fileText,
                                controller: _sifController,
                                hint: 'Número do SIF',
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _buildTextField(
                          label: 'Lote',
                          icon: PhosphorIcons.hash,
                          controller: _batchNumberController,
                          hint: 'Número do lote',
                        ),
                        const SizedBox(height: 16),
                        _buildLocationSelector(locationsProvider),
                      ],
                    ),
                    const SizedBox(height: 16),
                    
                    // Seção: Estado da Mercadoria
                    _buildSection(
                      title: 'Estado da Mercadoria',
                      children: [
                        _buildConditionRadio(),
                        const SizedBox(height: 16),
                        _buildTextField(
                          label: 'Observações',
                          controller: _notesController,
                          maxLines: 3,
                          hint: 'Descreva problemas encontrados ou observações importantes',
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    
                    // Seção: Etiquetagem
                    _buildSection(
                      title: 'Etiquetagem',
                      children: [
                        _buildLabelingCheckbox(),
                      ],
                    ),
                    const SizedBox(height: 32),
                    
                    // Botões
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _isSubmitting ? null : () => Navigator.pop(context),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.dark700,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text('Cancelar'),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _isSubmitting ? null : _handleSubmit,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primary,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: _isSubmitting
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                    ),
                                  )
                                : Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(PhosphorIcons.check, size: 20),
                                      const SizedBox(width: 8),
                                      const Text('Salvar Recebimento'),
                                    ],
                                  ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SafeArea(
            top: false,
            child: BottomNavigation(
              currentIndex: _footerIndex,
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
        ],
      ),
    );
  }

  Widget _buildSection({
    required String title,
    IconData? icon,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.dark800,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.dark600),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (icon != null) ...[
                Icon(icon, color: AppTheme.primary, size: 20),
                const SizedBox(width: 8),
              ],
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  Widget _buildSectionWithAI({
    required String title,
    IconData? icon,
    required VoidCallback onAICapture,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.dark800,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.dark600),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (icon != null) ...[
                Icon(icon, color: AppTheme.primary, size: 20),
                const SizedBox(width: 8),
              ],
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
              IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    PhosphorIcons.sparkle,
                    color: Colors.green,
                    size: 20,
                  ),
                ),
                onPressed: onAICapture,
                tooltip: 'Extrair com IA',
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    IconData? icon,
    String? hint,
    String? helperText,
    TextInputType? keyboardType,
    int? maxLines,
    int? maxLength,
    bool enabled = true,
    String? Function(String?)? validator,
    FocusNode? focusNode,
    void Function(String)? onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            if (icon != null) ...[
              Icon(icon, size: 16, color: AppTheme.dark300),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: TextStyle(
                color: AppTheme.dark300,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          focusNode: focusNode,
          enabled: enabled,
          keyboardType: keyboardType,
          maxLines: maxLines ?? 1,
          maxLength: maxLength,
          validator: validator,
          onChanged: onChanged,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: AppTheme.dark400),
            filled: true,
            fillColor: enabled ? AppTheme.dark800 : AppTheme.dark700,
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
              borderSide: BorderSide(color: AppTheme.primary, width: 2),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppTheme.dark500),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
        ),
        if (helperText != null) ...[
          const SizedBox(height: 4),
          Text(
            helperText,
            style: TextStyle(
              color: AppTheme.dark400,
              fontSize: 12,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildProductAutocomplete(CategoriesProductsProvider productsProvider) {
    final allProducts = productsProvider.products;
    final filteredProducts = _getFilteredProducts(allProducts);
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Nome do Produto * ${productsProvider.isLoading ? "(carregando...)" : ""}',
          style: TextStyle(
            color: AppTheme.dark300,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Stack(
          clipBehavior: Clip.none,
          children: [
            TextFormField(
              controller: _productNameController,
              focusNode: _productNameFocus,
              onChanged: (value) {
                setState(() {
                  _productSearch = value;
                  if (value.isEmpty) {
                    _selectedProduct = null;
                    _selectedProductId = null;
                    _showProductSuggestions = false;
                  } else {
                    final filtered = _getFilteredProducts(allProducts);
                    _showProductSuggestions = filtered.isNotEmpty;
                  }
                });
              },
              onTap: () {
                if (_productSearch.trim().isNotEmpty) {
                  final filtered = _getFilteredProducts(allProducts);
                  setState(() {
                    _showProductSuggestions = filtered.isNotEmpty;
                  });
                }
              },
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Nome do produto é obrigatório';
                }
                if (_selectedProduct == null || _selectedProductId == null) {
                  return 'Selecione um produto cadastrado da lista';
                }
                return null;
              },
              style: TextStyle(
                color: Colors.white,
              ),
              decoration: InputDecoration(
                hintText: 'Digite para buscar produto cadastrado...',
                hintStyle: TextStyle(color: AppTheme.dark400),
                prefixIcon: Icon(PhosphorIcons.magnifyingGlass, color: AppTheme.dark400, size: 18),
                suffixIcon: (_productNameController.text.isNotEmpty || _selectedProduct != null)
                    ? IconButton(
                        icon: Icon(PhosphorIcons.x, color: AppTheme.dark400, size: 18),
                        onPressed: () {
                          setState(() {
                            _selectedProduct = null;
                            _selectedProductId = null;
                            _productNameController.clear();
                            _productSearch = '';
                            _showProductSuggestions = false;
                          });
                        },
                      )
                    : null,
                filled: true,
                fillColor: _selectedProduct != null ? AppTheme.primary.withOpacity(0.1) : AppTheme.dark800,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: _selectedProduct != null ? AppTheme.primary : AppTheme.dark600,
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: _selectedProduct != null ? AppTheme.primary : AppTheme.dark600,
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: AppTheme.primary, width: 2),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ],
        ),
        // Sugestões de produtos fora do Stack
        if (_showProductSuggestions && filteredProducts.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 4),
            constraints: const BoxConstraints(maxHeight: 240),
            decoration: BoxDecoration(
              color: AppTheme.dark700,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.dark600),
            ),
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: filteredProducts.length,
              itemBuilder: (context, index) {
                      final product = filteredProducts[index];
                      final isSelected = _selectedProduct?.id == product.id;
                      
                      return InkWell(
                        onTap: () => _handleSelectProduct(product),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            border: Border(
                              bottom: BorderSide(
                                color: AppTheme.dark600,
                                width: index < filteredProducts.length - 1 ? 1 : 0,
                              ),
                            ),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      product.name,
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    if (product.barcode != null || product.brand != null)
                                      Text(
                                        [
                                          if (product.barcode != null) 'EAN: ${product.barcode}',
                                          if (product.brand != null) product.brand,
                                        ].join(' • '),
                                        style: TextStyle(
                                          color: AppTheme.dark400,
                                          fontSize: 12,
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                              Icon(
                                PhosphorIcons.check,
                                size: 16,
                                color: isSelected ? AppTheme.primary : Colors.transparent,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
            ),
          ),
        if (_selectedProduct != null) ...[
          const SizedBox(height: 8),
          if (_selectedProduct!.barcode != null || _selectedProduct!.brand != null)
            Text(
              [
                if (_selectedProduct!.barcode != null) 'EAN: ${_selectedProduct!.barcode}',
                if (_selectedProduct!.brand != null && _selectedProduct!.brand!.isNotEmpty) _selectedProduct!.brand!,
              ].join(' • '),
              style: TextStyle(
                color: AppTheme.dark400,
                fontSize: 12,
              ),
            ),
        ],
      ],
    );
  }

  Widget _buildSupplierAutocomplete() {
    return Builder(
      builder: (context) {
        final filteredSuppliers = _getFilteredSuppliers();
        
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Nome do Fornecedor',
              style: TextStyle(
                color: AppTheme.dark300,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Stack(
              clipBehavior: Clip.none,
              children: [
                TextFormField(
                  controller: _supplierNameController,
                  focusNode: _supplierNameFocus,
                  onChanged: (value) {
                    setState(() {
                      _supplierSearch = value;
                      if (value.isEmpty) {
                        _selectedSupplierId = null;
                        _showSupplierSuggestions = false;
                      } else {
                        final filtered = _getFilteredSuppliers();
                        _showSupplierSuggestions = filtered.isNotEmpty;
                      }
                    });
                  },
                  onTap: () {
                    if (_supplierSearch.trim().isNotEmpty) {
                      final filtered = _getFilteredSuppliers();
                      setState(() {
                        _showSupplierSuggestions = filtered.isNotEmpty;
                      });
                    }
                  },
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'Digite para buscar fornecedor cadastrado...',
                hintStyle: TextStyle(color: AppTheme.dark400),
                prefixIcon: Icon(PhosphorIcons.magnifyingGlass, color: AppTheme.dark400, size: 18),
                suffixIcon: (_supplierNameController.text.isNotEmpty || _selectedSupplierId != null)
                    ? IconButton(
                        icon: Icon(PhosphorIcons.x, color: AppTheme.dark400, size: 18),
                        onPressed: () {
                          setState(() {
                            _selectedSupplierId = null;
                            _supplierNameController.clear();
                            _invoiceNumberController.clear();
                            _supplierSearch = '';
                            _showSupplierSuggestions = false;
                          });
                        },
                      )
                    : null,
                filled: true,
                fillColor: _selectedSupplierId != null ? AppTheme.primary.withOpacity(0.1) : AppTheme.dark800,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: _selectedSupplierId != null ? AppTheme.primary : AppTheme.dark600,
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: _selectedSupplierId != null ? AppTheme.primary : AppTheme.dark600,
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(color: AppTheme.primary, width: 2),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ],
        ),
        // Sugestões de fornecedores fora do Stack
        if (_showSupplierSuggestions && filteredSuppliers.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 4),
            constraints: const BoxConstraints(maxHeight: 240),
            decoration: BoxDecoration(
              color: AppTheme.dark700,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.dark600),
            ),
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: filteredSuppliers.length,
              itemBuilder: (context, index) {
                      final supplier = filteredSuppliers[index];
                      final isSelected = _selectedSupplierId == supplier['id'];
                      
                      return InkWell(
                        onTap: () => _handleSelectSupplier(supplier),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            border: Border(
                              bottom: BorderSide(
                                color: AppTheme.dark600,
                                width: index < filteredSuppliers.length - 1 ? 1 : 0,
                              ),
                            ),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      supplier['name'],
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    if (supplier['cnpj'] != null)
                                      Text(
                                        'CNPJ: ${supplier['cnpj']}',
                                        style: TextStyle(
                                          color: AppTheme.dark400,
                                          fontSize: 12,
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                              Icon(
                                PhosphorIcons.check,
                                size: 16,
                                color: isSelected ? AppTheme.primary : Colors.transparent,
                              ),
                            ],
                          ),
                        ),
                      );
                    },
            ),
          ),
      ],
        );
      },
    );
  }

  Widget _buildDateField({
    required String label,
    required DateTime? date,
    required Function(DateTime) onDateSelected,
    bool required = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          required ? '$label *' : label,
          style: TextStyle(
            color: AppTheme.dark300,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: () async {
            final selected = await showDatePicker(
              context: context,
              initialDate: date ?? DateTime.now(),
              firstDate: DateTime.now().subtract(const Duration(days: 365)),
              lastDate: DateTime.now().add(const Duration(days: 365)),
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
            if (selected != null) {
              onDateSelected(selected);
            }
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppTheme.dark800,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.dark600),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    date != null
                        ? '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}'
                        : 'Selecione a data',
                    style: TextStyle(
                      color: date != null ? Colors.white : AppTheme.dark400,
                    ),
                  ),
                ),
                Icon(PhosphorIcons.calendar, color: AppTheme.dark400, size: 20),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLocationSelector(StorageLocationsProvider locationsProvider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Local de Armazenamento',
          style: TextStyle(
            color: AppTheme.dark300,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        InkWell(
          onTap: () => _showLocationModal(locationsProvider),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: _selectedLocation != null
                  ? AppTheme.primary.withOpacity(0.1)
                  : AppTheme.dark700,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _selectedLocation != null
                    ? AppTheme.primary
                    : AppTheme.dark600,
                width: 2,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  PhosphorIcons.mapPin,
                  color: _selectedLocation != null
                      ? AppTheme.primary
                      : AppTheme.dark300,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _selectedLocation?.nome ?? 'Nenhum local selecionado',
                        style: TextStyle(
                          color: _selectedLocation != null
                              ? AppTheme.primary
                              : AppTheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (_selectedLocation != null)
                        Text(
                          '${_selectedLocation!.tipo.toString().split('.').last}${_selectedLocation!.temperatura != null ? ' • ${_selectedLocation!.temperatura}°C' : ''}',
                          style: TextStyle(
                            color: AppTheme.dark400,
                            fontSize: 12,
                          ),
                        ),
                    ],
                  ),
                ),
                Icon(
                  PhosphorIcons.caretDown,
                  color: _selectedLocation != null
                      ? AppTheme.primary
                      : AppTheme.dark300,
                  size: 16,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _showLocationModal(StorageLocationsProvider locationsProvider) {
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
          maxHeight: MediaQuery.of(context).size.height * 0.9,
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
            // Opção "Sem local específico"
            InkWell(
              onTap: () {
                setState(() => _selectedLocation = null);
                Navigator.pop(context);
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _selectedLocation == null
                      ? AppTheme.primary.withOpacity(0.1)
                      : AppTheme.dark700,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: _selectedLocation == null
                        ? AppTheme.primary
                        : AppTheme.dark600,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: _selectedLocation == null
                            ? AppTheme.primary
                            : AppTheme.dark600,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Icon(
                        PhosphorIcons.mapPin,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Sem local específico',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            'Não especificar local',
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
            ),
            const SizedBox(height: 12),
            // Lista de locais
            if (locationsProvider.storageLocations.isEmpty)
              Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  children: [
                    Icon(PhosphorIcons.mapPin, size: 48, color: AppTheme.dark400),
                    const SizedBox(height: 16),
                    Text(
                      'Nenhum local cadastrado',
                      style: TextStyle(
                        color: AppTheme.dark300,
                      ),
                    ),
                  ],
                ),
              )
            else
              Expanded(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: locationsProvider.storageLocations.length,
                  itemBuilder: (context, index) {
                    final location = locationsProvider.storageLocations[index];
                    final isSelected = _selectedLocation?.id == location.id;
                    
                    return InkWell(
                      onTap: () {
                        setState(() => _selectedLocation = location);
                        Navigator.pop(context);
                      },
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppTheme.primary.withOpacity(0.1)
                              : AppTheme.dark700,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected
                                ? AppTheme.primary
                                : AppTheme.dark600,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppTheme.primary
                                    : AppTheme.dark600,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Icon(
                                PhosphorIcons.mapPin,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    location.nome,
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  Text(
                                    [
                                      location.tipo.toString().split('.').last,
                                      if (location.setor != null) location.setor!,
                                      if (location.temperatura != null)
                                        '${location.temperatura}°C',
                                    ].join(' • '),
                                    style: TextStyle(
                                      color: AppTheme.dark300,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (isSelected)
                              Icon(
                                PhosphorIcons.check,
                                color: AppTheme.primary,
                                size: 20,
                              ),
                          ],
                        ),
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

  Widget _buildConditionRadio() {
    return Column(
      children: [
        _buildConditionOption(
          value: 'conforme',
          label: 'Conforme (OK)',
          icon: PhosphorIcons.checkCircle,
          color: Colors.green,
        ),
        const SizedBox(height: 12),
        _buildConditionOption(
          value: 'parcial',
          label: 'Parcialmente Conforme',
          icon: PhosphorIcons.warningCircle,
          color: Colors.orange,
        ),
        const SizedBox(height: 12),
        _buildConditionOption(
          value: 'nao_conforme',
          label: 'Não Conforme',
          icon: PhosphorIcons.xCircle,
          color: Colors.red,
        ),
      ],
    );
  }

  Widget _buildConditionOption({
    required String value,
    required String label,
    required IconData icon,
    required Color color,
  }) {
    final isSelected = _condition == value;
    
    return InkWell(
      onTap: () => setState(() => _condition = value),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.primary.withOpacity(0.1)
              : AppTheme.dark700,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? AppTheme.primary
                : AppTheme.dark600,
            width: 2,
          ),
        ),
        child: Row(
          children: [
            Radio<String>(
              value: value,
              groupValue: _condition,
              onChanged: (val) => setState(() => _condition = val ?? 'conforme'),
              activeColor: AppTheme.primary,
            ),
            Icon(
              icon,
              color: isSelected ? AppTheme.primary : color,
              size: 20,
            ),
            const SizedBox(width: 12),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? AppTheme.primary : Colors.white,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLabelingCheckbox() {
    return InkWell(
      onTap: () {
        setState(() {
          _generateLabels = !_generateLabels;
          // Sincronizar quantidade de etiquetas com quantidade do recebimento
          // Quantidade de etiquetas = quantidade de itens (automático)
        });
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: _generateLabels
              ? AppTheme.primary.withOpacity(0.1)
              : AppTheme.dark700,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: _generateLabels
                ? AppTheme.primary
                : AppTheme.dark600,
            width: 2,
          ),
        ),
        child: Row(
          children: [
            Checkbox(
              value: _generateLabels,
              onChanged: (val) {
                setState(() {
                  _generateLabels = val ?? false;
                  // Sincronizar quantidade de etiquetas com quantidade do recebimento
                  // Quantidade de etiquetas = quantidade de itens (automático)
                });
              },
              activeColor: AppTheme.primary,
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Etiquetar itens agora',
                    style: TextStyle(
                      color: _generateLabels ? AppTheme.primary : Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    'Marque para imprimir etiquetas imediatamente após salvar',
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
    );
  }

  Widget _buildBarcodeField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(PhosphorIcons.barcode, size: 16, color: AppTheme.dark300),
            const SizedBox(width: 4),
            Text(
              'Código de Barras (Bipe aqui)',
              style: TextStyle(
                color: AppTheme.dark300,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: TextFormField(
                controller: _productBarcodeController,
                focusNode: _productBarcodeFocus,
                onChanged: (value) => _handleProductBarcodeSearch(value),
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Bipe o código de barras do produto',
                  hintStyle: TextStyle(color: AppTheme.dark400),
                  filled: true,
                  fillColor: AppTheme.dark800,
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
                    borderSide: BorderSide(color: AppTheme.primary, width: 2),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Botão da câmera
            Container(
              height: 48,
              width: 48,
              decoration: BoxDecoration(
                color: AppTheme.primary,
                borderRadius: BorderRadius.circular(12),
              ),
              child: IconButton(
                onPressed: _openBarcodeCamera,
                icon: Icon(
                  PhosphorIcons.barcode,
                  color: Colors.white,
                  size: 20,
                ),
                tooltip: 'Escanear código de barras',
              ),
            ),
          ],
        ),
      ],
    );
  }

  void _openBarcodeCamera() async {
    try {
      // Abrir leitor de código de barras
      await showModalBottomSheet<String>(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (context) => _BarcodeReaderModal(
          onBarcodeDetected: (barcode) {
            Navigator.pop(context);
            _productBarcodeController.text = barcode;
            _handleProductBarcodeSearch(barcode);
          },
        ),
      );
    } catch (e) {
      Fluttertoast.showToast(
        msg: 'Erro ao abrir leitor de código de barras: ${e.toString()}',
        backgroundColor: Colors.red,
        textColor: Colors.white,
      );
    }
  }

}

class _BarcodeReaderModal extends StatefulWidget {
  final Function(String) onBarcodeDetected;

  const _BarcodeReaderModal({
    required this.onBarcodeDetected,
  });

  @override
  State<_BarcodeReaderModal> createState() => _BarcodeReaderModalState();
}

class _BarcodeReaderModalState extends State<_BarcodeReaderModal> {
  final MobileScannerController controller = MobileScannerController();
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
      decoration: const BoxDecoration(
        color: Colors.black,
      ),
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
                  widget.onBarcodeDetected(barcode.rawValue!);
                }
              }
            },
          ),
          
          // Overlay apenas com as "quinas" do retângulo
          Center(
            child: SizedBox(
              width: 250,
              height: 150,
              child: Stack(
                children: [
                  // Canto superior esquerdo
                  Positioned(
                    top: 0,
                    left: 0,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(color: AppTheme.primary, width: 4),
                          left: BorderSide(color: AppTheme.primary, width: 4),
                        ),
                      ),
                    ),
                  ),
                  // Canto superior direito
                  Positioned(
                    top: 0,
                    right: 0,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        border: Border(
                          top: BorderSide(color: AppTheme.primary, width: 4),
                          right: BorderSide(color: AppTheme.primary, width: 4),
                        ),
                      ),
                    ),
                  ),
                  // Canto inferior esquerdo
                  Positioned(
                    bottom: 0,
                    left: 0,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(color: AppTheme.primary, width: 4),
                          left: BorderSide(color: AppTheme.primary, width: 4),
                        ),
                      ),
                    ),
                  ),
                  // Canto inferior direito
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 40,
                      height: 40,
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
          
          // Header preto sólido como componente IA
          SafeArea(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.black,
              ),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(
                      Icons.close,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                  Expanded(
                    child: Text(
                      'Escanear Código de Barras',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  // Espaço invisível para balancear o botão de fechar
                  SizedBox(width: 56), // Largura do IconButton
                ],
              ),
            ),
          ),
          
          // Instruções na parte inferior
          Positioned(
            bottom: 100,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                'Posicione o código de barras dentro do quadro',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
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

class QrScannerOverlayShape extends ShapeBorder {
  const QrScannerOverlayShape({
    this.borderColor = Colors.red,
    this.borderWidth = 3.0,
    this.overlayColor = const Color.fromRGBO(0, 0, 0, 80),
    this.borderRadius = 0,
    this.borderLength = 40,
    double? cutOutSize,
  }) : cutOutSize = cutOutSize ?? 250;

  final Color borderColor;
  final double borderWidth;
  final Color overlayColor;
  final double borderRadius;
  final double borderLength;
  final double cutOutSize;

  @override
  EdgeInsetsGeometry get dimensions => const EdgeInsets.all(10);

  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) {
    return Path()
      ..fillType = PathFillType.evenOdd
      ..addPath(getOuterPath(rect), Offset.zero);
  }

  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) {
    Path _getLeftTopPath(Rect rect) {
      return Path()
        ..moveTo(rect.left, rect.bottom)
        ..lineTo(rect.left, rect.top + borderRadius)
        ..quadraticBezierTo(rect.left, rect.top, rect.left + borderRadius, rect.top)
        ..lineTo(rect.right, rect.top);
    }

    Path _getRightTopPath(Rect rect) {
      return Path()
        ..moveTo(rect.left, rect.top)
        ..lineTo(rect.right - borderRadius, rect.top)
        ..quadraticBezierTo(rect.right, rect.top, rect.right, rect.top + borderRadius)
        ..lineTo(rect.right, rect.bottom);
    }

    Path _getRightBottomPath(Rect rect) {
      return Path()
        ..moveTo(rect.left, rect.bottom)
        ..lineTo(rect.right - borderRadius, rect.bottom)
        ..quadraticBezierTo(rect.right, rect.bottom, rect.right, rect.bottom - borderRadius)
        ..lineTo(rect.right, rect.top);
    }

    Path _getLeftBottomPath(Rect rect) {
      return Path()
        ..moveTo(rect.right, rect.bottom)
        ..lineTo(rect.left + borderRadius, rect.bottom)
        ..quadraticBezierTo(rect.left, rect.bottom, rect.left, rect.bottom - borderRadius)
        ..lineTo(rect.left, rect.top);
    }

    final width = rect.width;
    final borderWidthSize = width / 2;
    final height = rect.height;
    final borderHeightSize = height / 2;
    final cutOutWidth = cutOutSize < width ? cutOutSize : width - borderWidth;
    final cutOutHeight = cutOutSize < height ? cutOutSize : height - borderWidth;

    final cutOutRect = Rect.fromLTWH(
      rect.left + (width - cutOutWidth) / 2 + borderWidth,
      rect.top + (height - cutOutHeight) / 2 + borderWidth,
      cutOutWidth - borderWidth * 2,
      cutOutHeight - borderWidth * 2,
    );

    final cutOutRRect = RRect.fromRectAndRadius(
      cutOutRect,
      Radius.circular(borderRadius),
    );

    return Path()
      ..fillType = PathFillType.evenOdd
      ..addRect(rect)
      ..addRRect(cutOutRRect);
  }

  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {
    final width = rect.width;
    final borderWidthSize = width / 2;
    final height = rect.height;
    final borderHeightSize = height / 2;
    final cutOutWidth = cutOutSize < width ? cutOutSize : width - borderWidth;
    final cutOutHeight = cutOutSize < height ? cutOutSize : height - borderWidth;

    final cutOutRect = Rect.fromLTWH(
      rect.left + (width - cutOutWidth) / 2 + borderWidth,
      rect.top + (height - cutOutHeight) / 2 + borderWidth,
      cutOutWidth - borderWidth * 2,
      cutOutHeight - borderWidth * 2,
    );

    final cutOutRRect = RRect.fromRectAndRadius(
      cutOutRect,
      Radius.circular(borderRadius),
    );

    final backgroundPaint = Paint()
      ..color = overlayColor
      ..style = PaintingStyle.fill;

    final backgroundPath = Path()
      ..fillType = PathFillType.evenOdd
      ..addRect(rect)
      ..addRRect(cutOutRRect);

    canvas.drawPath(backgroundPath, backgroundPaint);

    // Draw the border
    final borderPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;

    final path = Path()
      ..moveTo(cutOutRect.left - borderLength, cutOutRect.top)
      ..lineTo(cutOutRect.left, cutOutRect.top)
      ..lineTo(cutOutRect.left, cutOutRect.top + borderLength)
      ..moveTo(cutOutRect.right + borderLength, cutOutRect.top)
      ..lineTo(cutOutRect.right, cutOutRect.top)
      ..lineTo(cutOutRect.right, cutOutRect.top + borderLength)
      ..moveTo(cutOutRect.right, cutOutRect.bottom - borderLength)
      ..lineTo(cutOutRect.right, cutOutRect.bottom)
      ..lineTo(cutOutRect.right - borderLength, cutOutRect.bottom)
      ..moveTo(cutOutRect.left + borderLength, cutOutRect.bottom)
      ..lineTo(cutOutRect.left, cutOutRect.bottom)
      ..lineTo(cutOutRect.left, cutOutRect.bottom - borderLength);

    canvas.drawPath(path, borderPaint);
  }

  @override
  ShapeBorder scale(double t) {
    return QrScannerOverlayShape(
      borderColor: borderColor,
      borderWidth: borderWidth,
      overlayColor: overlayColor,
    );
  }
}
