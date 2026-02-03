import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../models/product_models.dart';
import '../models/category_models.dart';
import '../providers/auth_provider.dart';
import '../providers/categories_products_provider.dart';
import 'hierarchical_category_dropdown.dart';

class ModalCadastroProduto extends StatefulWidget {
  final Product? produto; // null para criar, preenchido para editar
  final List<Category> categorias;
  final Function(CreateProductRequest) onSalvar;
  final Function(UpdateProductRequest)? onEditar;
  final bool embedded; // quando true, usa conteúdo sem Dialog (para BottomSheet)

  const ModalCadastroProduto({
    super.key,
    this.produto,
    required this.categorias,
    required this.onSalvar,
    this.onEditar,
    this.embedded = false,
  });

  @override
  State<ModalCadastroProduto> createState() => _ModalCadastroProdutoState();
}

class _ModalCadastroProdutoState extends State<ModalCadastroProduto> {
  final _formKey = GlobalKey<FormState>();
  final _nomeController = TextEditingController();
  final _codigoController = TextEditingController();
  final _descricaoController = TextEditingController();
  final _marcaController = TextEditingController();
  final _unidadeController = TextEditingController();
  final _pesoController = TextEditingController();
  final _quantidadeController = TextEditingController();
  final _ingredientesController = TextEditingController();
  final _alergenosController = TextEditingController();
  final _infoNutricionalController = TextEditingController();
  final _observacoesController = TextEditingController();
  final _validadeAmbienteController = TextEditingController();
  final _validadeRefrigeradoController = TextEditingController();
  final _validadeCongeladoController = TextEditingController();
  
  bool _isLoading = false;
  bool _isEditando = false;
  bool _isLabelOnly = false; // ⭐ NOVO: Quando true, é só rótulo (sem código/rastreabilidade)
  bool _showTimeOnLabel = true; // ⭐ NOVO: Quando true, exibe hora na manipulação e validade
  String? _categoriaSelecionada;
  String? _tipoSelecionado;

  // Tipos de produto disponíveis
  final List<Map<String, dynamic>> tiposProduto = [
    {'id': 'raw_material', 'nome': 'Matéria Prima', 'icon': PhosphorIcons.circle},
    {'id': 'manipulated', 'nome': 'Manipulado', 'icon': PhosphorIcons.cookingPot},
    {'id': 'finished', 'nome': 'Produto Final', 'icon': PhosphorIcons.package},
  ];

  // Unidades disponíveis
  final List<String> unidadesDisponiveis = ['KG', 'G', 'L', 'ML', 'UN', 'CX', 'PCT'];

  @override
  void initState() {
    super.initState();
    _isEditando = widget.produto != null;
    
    if (_isEditando) {
      _nomeController.text = widget.produto!.name;
      _codigoController.text = widget.produto!.code ?? '';
      _descricaoController.text = widget.produto!.description ?? '';
      _marcaController.text = widget.produto!.brand ?? '';
      _unidadeController.text = widget.produto!.weightUnit ?? 'KG';
      _pesoController.text = widget.produto!.weight ?? '';
      _quantidadeController.text = widget.produto!.quantity ?? '';
      _categoriaSelecionada = widget.produto!.categoryId;
      _tipoSelecionado = widget.produto!.type;
      _validadeAmbienteController.text = widget.produto!.shelfLifeAmbient?.toString() ?? '';
      _validadeRefrigeradoController.text = widget.produto!.shelfLifeRefrigerated?.toString() ?? '';
      _validadeCongeladoController.text = widget.produto!.shelfLifeFrozen?.toString() ?? '';
      _isLabelOnly = widget.produto!.isLabelOnly ?? false; // ⭐ NOVO
      _showTimeOnLabel = widget.produto!.showTimeOnLabel ?? true; // ⭐ NOVO
      // Note: These fields don't exist in the current Product model
      // _ingredientesController.text = widget.produto!.ingredients ?? '';
      // _alergenosController.text = widget.produto!.allergens ?? '';
      // _infoNutricionalController.text = widget.produto!.nutritionalInfo ?? '';
      // _observacoesController.text = widget.produto!.notes ?? '';
    } else {
      _unidadeController.text = 'KG'; // Valor padrão
    }
  }

  @override
  void dispose() {
    _nomeController.dispose();
    _codigoController.dispose();
    _descricaoController.dispose();
    _marcaController.dispose();
    _unidadeController.dispose();
    _pesoController.dispose();
    _quantidadeController.dispose();
    _ingredientesController.dispose();
    _alergenosController.dispose();
    _infoNutricionalController.dispose();
    _observacoesController.dispose();
    _validadeAmbienteController.dispose();
    _validadeRefrigeradoController.dispose();
    _validadeCongeladoController.dispose();
    super.dispose();
  }

  void _salvarProduto() async {
    if (_formKey.currentState!.validate()) {
      if (_categoriaSelecionada == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Selecione uma categoria'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      if (_tipoSelecionado == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Selecione um tipo de produto'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      setState(() {
        _isLoading = true;
      });

      try {
        if (_isEditando) {
          // Editar produto existente
          final updateRequest = UpdateProductRequest(
            name: _nomeController.text.trim(),
            code: _codigoController.text.trim().isEmpty 
                ? null 
                : _codigoController.text.trim(),
            brand: _marcaController.text.trim().isEmpty 
                ? null 
                : _marcaController.text.trim(),
            weightUnit: _unidadeController.text.trim(),
            weight: _pesoController.text.trim().isEmpty 
                ? null 
                : _pesoController.text.trim(),
            quantity: _quantidadeController.text.trim().isEmpty 
                ? null 
                : _quantidadeController.text.trim(),
            categoryId: _categoriaSelecionada!,
            type: _tipoSelecionado!,
            isLabelOnly: _isLabelOnly, // ⭐ NOVO
            showTimeOnLabel: _showTimeOnLabel, // ⭐ NOVO
          );
          
          if (widget.onEditar != null) {
            await widget.onEditar!(updateRequest);
          }
        } else {
          // Criar novo produto
          final authProvider = context.read<AuthProvider>();
          final clientId = authProvider.user?.clientId;
          
          if (clientId == null || clientId.isEmpty) {
            throw Exception('ClientId não encontrado. Faça login novamente.');
          }
          
          final createRequest = CreateProductRequest(
            name: _nomeController.text.trim(),
            code: _codigoController.text.trim().isEmpty 
                ? null 
                : _codigoController.text.trim(),
            clientId: clientId,
            categoryId: _categoriaSelecionada!,
            type: _tipoSelecionado!,
            brand: _marcaController.text.trim().isEmpty 
                ? null 
                : _marcaController.text.trim(),
            weightUnit: _unidadeController.text.trim(),
            weight: _pesoController.text.trim().isEmpty 
                ? null 
                : _pesoController.text.trim(),
            quantity: _quantidadeController.text.trim().isEmpty 
                ? null 
                : _quantidadeController.text.trim(),
            currency: 'BRL', // Moeda padrão
            shelfLifeAmbient: _validadeAmbienteController.text.trim().isEmpty 
                ? null 
                : int.tryParse(_validadeAmbienteController.text.trim()),
            shelfLifeRefrigerated: _validadeRefrigeradoController.text.trim().isEmpty 
                ? null 
                : int.tryParse(_validadeRefrigeradoController.text.trim()),
            shelfLifeFrozen: _validadeCongeladoController.text.trim().isEmpty 
                ? null 
                : int.tryParse(_validadeCongeladoController.text.trim()),
            isLabelOnly: _isLabelOnly, // ⭐ NOVO
            showTimeOnLabel: _showTimeOnLabel, // ⭐ NOVO
          );
          
          await widget.onSalvar(createRequest);
          
          // Recarregar a lista de produtos após criação
          print('🔄 Recarregando lista de produtos...');
          final provider = context.read<CategoriesProductsProvider>();
          final authProvider2 = context.read<AuthProvider>();
          final token = await authProvider2.authToken;
          if (token != null) {
            await provider.loadProducts(token: token);
            print('✅ Lista de produtos atualizada!');
          }
        }

        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                _isEditando 
                    ? 'Produto atualizado com sucesso!' 
                    : 'Produto criado com sucesso!',
              ),
              backgroundColor: Colors.green,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Erro ao salvar produto: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } finally {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final content = Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      _isEditando ? PhosphorIcons.pencil : PhosphorIcons.plus,
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
                          _isEditando ? 'Editar Produto' : 'Novo Produto',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          _isEditando 
                              ? 'Atualize as informações do produto'
                              : 'Cadastre um novo produto no sistema',
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
                    icon: Icon(
                      PhosphorIcons.x,
                      color: AppTheme.dark300,
                      size: 24,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Formulário
              Form(
                key: _formKey,
                child: Column(
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
                          borderSide: BorderSide(color: AppTheme.primary, width: 2),
                        ),
                        filled: true,
                        fillColor: AppTheme.dark700,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
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
                    
                    const SizedBox(height: 12),
                    
                    // Código e Marca (linha)
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _codigoController,
                            decoration: InputDecoration(
                              labelText: 'Código',
                              labelStyle: TextStyle(color: AppTheme.dark300),
                              hintText: 'Ex: PROD001',
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
                                borderSide: BorderSide(color: AppTheme.primary, width: 2),
                              ),
                              filled: true,
                              fillColor: AppTheme.dark700,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                            ),
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: TextFormField(
                            controller: _marcaController,
                            decoration: InputDecoration(
                              labelText: 'Marca',
                              labelStyle: TextStyle(color: AppTheme.dark300),
                              hintText: 'Ex: GranoBox',
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
                                borderSide: BorderSide(color: AppTheme.primary, width: 2),
                              ),
                              filled: true,
                              fillColor: AppTheme.dark700,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                            ),
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 12),
                    
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
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: isSelected 
                                  ? AppTheme.primary.withOpacity(0.2)
                                  : AppTheme.dark700,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isSelected 
                                    ? AppTheme.primary 
                                    : AppTheme.dark600,
                                width: isSelected ? 2 : 1,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  tipo['icon'],
                                  color: isSelected ? AppTheme.primary : AppTheme.dark300,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  tipo['nome'],
                                  style: TextStyle(
                                    color: isSelected ? AppTheme.primary : AppTheme.dark300,
                                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    
                    const SizedBox(height: 12),
                    
                    // ⭐ NOVO: Opção de Rótulo (sem rastreabilidade)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _isLabelOnly 
                            ? Colors.orange.withOpacity(0.1) 
                            : AppTheme.dark700,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _isLabelOnly 
                              ? Colors.orange 
                              : AppTheme.dark600,
                          width: _isLabelOnly ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            PhosphorIcons.tag,
                            color: _isLabelOnly ? Colors.orange : AppTheme.dark300,
                            size: 24,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Apenas Rótulo',
                                  style: TextStyle(
                                    color: _isLabelOnly ? Colors.orange : Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Text(
                                  'Sem código de rastreabilidade e controle de vencimento',
                                  style: TextStyle(
                                    color: AppTheme.dark300,
                                    fontSize: 12,
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
                              });
                            },
                            activeColor: Colors.orange,
                            activeTrackColor: Colors.orange.withOpacity(0.3),
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 12),
                    
                    // ⭐ NOVO: Opção de exibir hora na etiqueta
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _showTimeOnLabel 
                            ? AppTheme.primary.withOpacity(0.1) 
                            : AppTheme.dark700,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _showTimeOnLabel 
                              ? AppTheme.primary 
                              : AppTheme.dark600,
                          width: _showTimeOnLabel ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            PhosphorIcons.clock,
                            color: _showTimeOnLabel ? AppTheme.primary : AppTheme.dark300,
                            size: 24,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
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
                                  'Mostra horário junto com a data de manipulação e validade',
                                  style: TextStyle(
                                    color: AppTheme.dark300,
                                    fontSize: 12,
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
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 12),
                    
                    // Categoria com hierarquia
                    HierarchicalCategoryDropdown(
                      selectedCategoryId: _categoriaSelecionada,
                      onChanged: (value) {
                        setState(() {
                          _categoriaSelecionada = value;
                        });
                      },
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Selecione uma categoria';
                        }
                        return null;
                      },
                    ),
                    
                    const SizedBox(height: 12),
                    
                    // Peso/Quantidade e Unidade (linha)
                    Row(
                      children: [
                        Expanded(
                          flex: 3,
                          child: TextFormField(
                            controller: _pesoController,
                            keyboardType: TextInputType.numberWithOptions(decimal: true),
                            decoration: InputDecoration(
                              labelText: 'Peso/Quantidade',
                              labelStyle: TextStyle(color: AppTheme.dark300),
                              hintText: 'Ex: 1.5',
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
                                borderSide: BorderSide(color: AppTheme.primary, width: 2),
                              ),
                              filled: true,
                              fillColor: AppTheme.dark700,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                            ),
                            style: TextStyle(color: Colors.white),
                            validator: (value) {
                              if (value != null && value.isNotEmpty) {
                                final peso = double.tryParse(value);
                                if (peso == null || peso <= 0) {
                                  return 'Peso deve ser um número válido';
                                }
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          flex: 2,
                          child: DropdownButtonFormField<String>(
                            value: _unidadeController.text,
                            decoration: InputDecoration(
                              labelText: 'Unidade *',
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
                                borderSide: BorderSide(color: AppTheme.primary, width: 2),
                              ),
                              filled: true,
                              fillColor: AppTheme.dark700,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                            ),
                            dropdownColor: AppTheme.dark700,
                            style: TextStyle(color: Colors.white),
                            items: unidadesDisponiveis.map((unidade) {
                              return DropdownMenuItem<String>(
                                value: unidade,
                                child: Text(unidade),
                              );
                            }).toList(),
                            onChanged: (value) {
                              setState(() {
                                _unidadeController.text = value!;
                              });
                            },
                          ),
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 12),
                    
                    // Quantidade (porção sugerida)
                    TextFormField(
                      controller: _quantidadeController,
                      keyboardType: TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText: 'Quantidade/Porção (opcional)',
                        labelStyle: TextStyle(color: AppTheme.dark300),
                        hintText: 'Ex: 200 (para 200g de mussarela)',
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
                          borderSide: BorderSide(color: AppTheme.primary, width: 2),
                        ),
                        filled: true,
                        fillColor: AppTheme.dark700,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      ),
                      style: TextStyle(color: Colors.white),
                      validator: (value) {
                        if (value != null && value.isNotEmpty) {
                          final quantidade = double.tryParse(value);
                          if (quantidade == null || quantidade <= 0) {
                            return 'Quantidade deve ser um número válido';
                          }
                        }
                        return null;
                      },
                    ),
                    
                    const SizedBox(height: 12),
                    
                    // Descrição
                    TextFormField(
                      controller: _descricaoController,
                      maxLines: 3,
                      decoration: InputDecoration(
                        labelText: 'Descrição (opcional)',
                        labelStyle: TextStyle(color: AppTheme.dark300),
                        hintText: 'Ex: Produto de alta qualidade...',
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
                          borderSide: BorderSide(color: AppTheme.primary, width: 2),
                        ),
                        filled: true,
                        fillColor: AppTheme.dark700,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      ),
                      style: TextStyle(color: Colors.white),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 12),
              
              // Seção de Validades
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.dark700,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.transparent),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Validades (em dias)',
                      style: TextStyle(
                        color: AppTheme.dark300,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 12),
                    
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _validadeAmbienteController,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: 'Ambiente',
                              labelStyle: TextStyle(color: AppTheme.dark300),
                              hintText: '1',
                              hintStyle: TextStyle(color: AppTheme.dark400),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide(color: AppTheme.dark600),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide(color: AppTheme.dark600),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide(color: AppTheme.primary, width: 2),
                              ),
                              filled: true,
                              fillColor: AppTheme.dark800,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                            ),
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: _validadeRefrigeradoController,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: 'Refrigerado',
                              labelStyle: TextStyle(color: AppTheme.dark300),
                              hintText: '3',
                              hintStyle: TextStyle(color: AppTheme.dark400),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide(color: AppTheme.dark600),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide(color: AppTheme.dark600),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide(color: AppTheme.primary, width: 2),
                              ),
                              filled: true,
                              fillColor: AppTheme.dark800,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                            ),
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: _validadeCongeladoController,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: 'Congelado',
                              labelStyle: TextStyle(color: AppTheme.dark300),
                              hintText: '30',
                              hintStyle: TextStyle(color: AppTheme.dark400),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide(color: AppTheme.dark600),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide(color: AppTheme.dark600),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: BorderSide(color: AppTheme.primary, width: 2),
                              ),
                              filled: true,
                              fillColor: AppTheme.dark800,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                            ),
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 12),
              
              // Seção de Informações Adicionais
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.dark700,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.transparent),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Informações Adicionais',
                      style: TextStyle(
                        color: AppTheme.dark300,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 12),
                    
                    // Ingredientes
                    TextFormField(
                      controller: _ingredientesController,
                      maxLines: 3,
                      decoration: InputDecoration(
                        labelText: 'Ingredientes (opcional)',
                        labelStyle: TextStyle(color: AppTheme.dark300),
                        hintText: 'Farinha de trigo, água, fermento, sal...',
                        hintStyle: TextStyle(color: AppTheme.dark400),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: AppTheme.dark600),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: AppTheme.dark600),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: AppTheme.primary, width: 2),
                        ),
                        filled: true,
                        fillColor: AppTheme.dark800,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      ),
                      style: TextStyle(color: Colors.white),
                    ),
                    
                    const SizedBox(height: 8),
                    
                    // Alérgenos
                    TextFormField(
                      controller: _alergenosController,
                      maxLines: 2,
                      decoration: InputDecoration(
                        labelText: 'Alérgenos (opcional)',
                        labelStyle: TextStyle(color: AppTheme.dark300),
                        hintText: 'Contém glúten. Pode conter traços de...',
                        hintStyle: TextStyle(color: AppTheme.dark400),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: AppTheme.dark600),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: AppTheme.dark600),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: AppTheme.primary, width: 2),
                        ),
                        filled: true,
                        fillColor: AppTheme.dark800,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      ),
                      style: TextStyle(color: Colors.white),
                    ),
                    
                    const SizedBox(height: 8),
                    
                    // Informações Nutricionais
                    TextFormField(
                      controller: _infoNutricionalController,
                      maxLines: 3,
                      decoration: InputDecoration(
                        labelText: 'Informações Nutricionais (opcional)',
                        labelStyle: TextStyle(color: AppTheme.dark300),
                        hintText: 'Valor energético: 250 kcal por 100g...',
                        hintStyle: TextStyle(color: AppTheme.dark400),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: AppTheme.dark600),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: AppTheme.dark600),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: AppTheme.primary, width: 2),
                        ),
                        filled: true,
                        fillColor: AppTheme.dark800,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      ),
                      style: TextStyle(color: Colors.white),
                    ),
                    
                    const SizedBox(height: 8),
                    
                    // Observações
                    TextFormField(
                      controller: _observacoesController,
                      maxLines: 3,
                      decoration: InputDecoration(
                        labelText: 'Observações (opcional)',
                        labelStyle: TextStyle(color: AppTheme.dark300),
                        hintText: 'Produto artesanal, produzido diariamente...',
                        hintStyle: TextStyle(color: AppTheme.dark400),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: AppTheme.dark600),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: AppTheme.dark600),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide(color: AppTheme.primary, width: 2),
                        ),
                        filled: true,
                        fillColor: AppTheme.dark800,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      ),
                      style: TextStyle(color: Colors.white),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Botões
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isLoading ? null : () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: AppTheme.dark600),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Cancelar',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _salvarProduto,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isLoading
                          ? SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : Text(
                              _isEditando ? 'Atualizar' : 'Criar',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      )
    ;

    if (widget.embedded) {
      return content;
    }

    return Dialog(
      backgroundColor: AppTheme.dark800,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: content,
    );
  }
}
