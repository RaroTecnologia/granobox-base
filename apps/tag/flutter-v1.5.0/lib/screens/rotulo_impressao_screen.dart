import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../components/header_button.dart';
import '../components/dynamic_form_field.dart';
import '../providers/label_templates_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/categories_products_provider.dart';
import '../providers/print_provider.dart';
import '../models/label_template_models.dart';
import '../models/product_models.dart';
import '../widgets/print_modal.dart';

class RotuloImpressaoScreen extends StatefulWidget {
  const RotuloImpressaoScreen({super.key});

  @override
  State<RotuloImpressaoScreen> createState() => _RotuloImpressaoScreenState();
}

class _RotuloImpressaoScreenState extends State<RotuloImpressaoScreen> {
  // Estado da navegação
  String _currentStep = 'rotulos'; // rotulos, produtos (opcional), formulario
  LabelTemplate? _rotuloSelecionado;
  Product? _produtoSelecionado;
  Map<String, TextEditingController> _controllers = {};
  
  // Fila de impressão
  List<Map<String, dynamic>> _filaImpressao = [];

  @override
  void initState() {
    super.initState();
    _carregarRotulos();
  }

  @override
  void dispose() {
    _controllers.values.forEach((controller) => controller.dispose());
    super.dispose();
  }

  Future<void> _carregarRotulos() async {
    final auth = context.read<AuthProvider>();
    final templatesProvider = context.read<LabelTemplatesProvider>();
    
    final clientId = auth.user?.clientId;
    final token = await auth.authToken;

    if (clientId != null) {
      await templatesProvider.carregarRotulos(
        clientId: clientId,
        authToken: token,
      );
    }
  }

  void _selecionarRotulo(LabelTemplate rotulo) {
    setState(() {
      _rotuloSelecionado = rotulo;
      _currentStep = 'produtos';
    });
  }

  Future<void> _selecionarProduto(Product? produto) async {
    setState(() {
      _produtoSelecionado = produto;
    });

    final auth = context.read<AuthProvider>();
    final templatesProvider = context.read<LabelTemplatesProvider>();
    
    final clientId = auth.user?.clientId;
    final token = await auth.authToken;

    if (clientId != null && _rotuloSelecionado != null) {
      // Carregar schema com auto-fill do produto
      await templatesProvider.selecionarTemplate(
        templateId: _rotuloSelecionado!.id,
        clientId: clientId,
        productId: produto?.id,
        authToken: token,
      );

      // Criar controllers para cada campo
      _controllers.clear();
      if (templatesProvider.schemaAtual != null) {
        for (final field in templatesProvider.schemaAtual!.schema.fields) {
          final initialValue = templatesProvider.valoresFormulario[field.name];
          _controllers[field.name] = TextEditingController(
            text: initialValue?.toString() ?? '',
          );
        }
      }

      setState(() {
        _currentStep = 'formulario';
      });
    }
  }

  void _voltarPasso() {
    setState(() {
      if (_currentStep == 'formulario') {
        _currentStep = 'produtos';
        _produtoSelecionado = null;
      } else if (_currentStep == 'produtos') {
        _currentStep = 'rotulos';
        _rotuloSelecionado = null;
      }
    });
  }

  void _pularSelecaoProduto() {
    // Ir direto para formulário sem produto vinculado
    _selecionarProduto(null);
  }

  void _adicionarAFila() {
    final templatesProvider = context.read<LabelTemplatesProvider>();
    
    // Validar formulário
    final erros = templatesProvider.validarFormulario();
    if (erros.isNotEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(erros.values.first),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Adicionar à fila
    setState(() {
      _filaImpressao.add({
        'rotulo': _rotuloSelecionado,
        'produto': _produtoSelecionado,
        'dados': Map<String, dynamic>.from(templatesProvider.valoresFormulario),
        'timestamp': DateTime.now(),
      });
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Adicionado à fila de impressão (${_filaImpressao.length})'),
        backgroundColor: Colors.green,
        action: SnackBarAction(
          label: 'Ver Fila',
          onPressed: () => _mostrarFilaImpressao(),
        ),
      ),
    );

    // Voltar para seleção de rótulos
    templatesProvider.limparFormulario();
    setState(() {
      _currentStep = 'rotulos';
      _rotuloSelecionado = null;
      _produtoSelecionado = null;
    });
  }

  Future<void> _imprimirAgora() async {
    final templatesProvider = context.read<LabelTemplatesProvider>();
    
    // Validar formulário
    final erros = templatesProvider.validarFormulario();
    if (erros.isNotEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(erros.values.first),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Imprimir direto
    await _imprimirItem({
      'rotulo': _rotuloSelecionado,
      'produto': _produtoSelecionado,
      'dados': Map<String, dynamic>.from(templatesProvider.valoresFormulario),
      'timestamp': DateTime.now(),
    });

    // Limpar e voltar
    templatesProvider.limparFormulario();
    setState(() {
      _currentStep = 'rotulos';
      _rotuloSelecionado = null;
      _produtoSelecionado = null;
    });
  }

  Future<void> _imprimirItem(Map<String, dynamic> item) async {
    final auth = context.read<AuthProvider>();
    final tagmentProvider = context.read<PrintProvider>();
    
    final clientId = auth.user?.clientId;
    final token = await auth.authToken;
    
    // Configurar API Key se necessário
    if (tagmentProvider.apiKeyAtual == null || tagmentProvider.apiKeyAtual!.isEmpty) {
      if (clientId != null && token != null) {
        await tagmentProvider.configurarApiKeyDoCliente(clientId, token);
      }
    }

    // Atualizar impressoras do Granobox
    await tagmentProvider.carregarImpressoras(
      forceRefresh: true,
      token: token,
      clientId: clientId,
    ); // ⭐ Buscar do Granobox

    // Selecionar impressora de rótulo
    final printerInfo = await tagmentProvider.obterImpressoraRotulo();

    if (printerInfo == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Nenhuma impressora de rótulo disponível'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final rotulo = item['rotulo'] as LabelTemplate;
    final dados = item['dados'] as Map<String, dynamic>;

    // Imprimir
    await showPrintModal(
      context: context,
      title: 'Imprimindo Rótulo',
      subtitle: rotulo.name,
      printFunction: (onProgress) => tagmentProvider.imprimirComTemplate(
        printer: printerInfo,
        templateId: rotulo.tagmentTemplateId,
        templateData: dados,
        copies: 1,
        clientId: clientId,
        authToken: token,
        productId: _produtoSelecionado?.id,
        onProgress: onProgress,
      ),
      onSuccess: () {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Rótulo impresso com sucesso!'),
            backgroundColor: Colors.green,
          ),
        );
      },
      onError: () {},
    );
  }

  void _mostrarFilaImpressao() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.dark800,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _buildFilaModal(),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      color: AppTheme.dark900,
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
      child: Row(
        children: [
          if (_currentStep != 'rotulos')
            HeaderButton(
              iconPath: 'assets/icons/voltar.svg',
              onTap: _voltarPasso,
              size: 32,
              tooltip: 'Voltar',
            )
          else
            HeaderButton(
              iconPath: 'assets/icons/voltar.svg',
              onTap: () => Navigator.pop(context),
              size: 32,
              tooltip: 'Voltar',
            ),
          
          const SizedBox(width: 16),
          
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _produtoSelecionado != null 
                      ? _produtoSelecionado!.name 
                      : (_rotuloSelecionado != null ? _rotuloSelecionado!.name : 'Imprimir Rótulo'),
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  _getSubtitulo(),
                  style: TextStyle(
                    fontSize: 12,
                    color: AppTheme.dark300,
                  ),
                ),
              ],
            ),
          ),
          
          // Botão de fila
          if (_filaImpressao.isNotEmpty)
            GestureDetector(
              onTap: _mostrarFilaImpressao,
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(PhosphorIcons.printer, color: Colors.white, size: 20),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${_filaImpressao.length}',
                        style: TextStyle(
                          color: AppTheme.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _getSubtitulo() {
    switch (_currentStep) {
      case 'rotulos':
        return 'Selecione o tipo de rótulo';
      case 'produtos':
        return 'Vincular a um produto (opcional)';
      case 'formulario':
        return 'Preencha os campos';
      default:
        return '';
    }
  }

  Widget _buildContent() {
    switch (_currentStep) {
      case 'rotulos':
        return _buildRotulosStep();
      case 'produtos':
        return _buildProdutosStep();
      case 'formulario':
        return _buildFormularioStep();
      default:
        return Container();
    }
  }

  Widget _buildRotulosStep() {
    return Consumer<LabelTemplatesProvider>(
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
                  style: TextStyle(color: Colors.red),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _carregarRotulos,
                  child: const Text('Tentar Novamente'),
                ),
              ],
            ),
          );
        }

        if (!provider.hasTemplates) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(PhosphorIcons.fileX, size: 48, color: AppTheme.dark400),
                const SizedBox(height: 16),
                Text(
                  'Nenhum rótulo cadastrado',
                  style: TextStyle(color: AppTheme.dark300, fontSize: 16),
                ),
                const SizedBox(height: 8),
                Text(
                  'Cadastre rótulos nas configurações',
                  style: TextStyle(color: AppTheme.dark400, fontSize: 14),
                ),
              ],
            ),
          );
        }

        return Padding(
          padding: const EdgeInsets.all(20.0),
          child: ListView.builder(
            itemCount: provider.templates.length,
            itemBuilder: (context, index) {
              final rotulo = provider.templates[index];
              return _buildRotuloCard(rotulo);
            },
          ),
        );
      },
    );
  }

  Widget _buildRotuloCard(LabelTemplate rotulo) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: GestureDetector(
        onTap: () => _selecionarRotulo(rotulo),
        child: Container(
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
                      PhosphorIcons.tag,
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
                          rotulo.name,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        if (rotulo.description != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            rotulo.description!,
                            style: TextStyle(
                              fontSize: 14,
                              color: AppTheme.dark300,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  Icon(
                    PhosphorIcons.caretRight,
                    color: AppTheme.primary,
                    size: 20,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _buildInfoChip(
                    '${rotulo.fieldsSchema.fields.length} campos',
                    PhosphorIcons.textbox,
                  ),
                  _buildInfoChip(
                    '${rotulo.requiredFields.length} obrigatórios',
                    PhosphorIcons.asterisk,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoChip(String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.dark700,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppTheme.dark300),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: AppTheme.dark300,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProdutosStep() {
    return Consumer<CategoriesProductsProvider>(
      builder: (context, provider, child) {
        // Carregar produtos se necessário
        if (provider.products.isEmpty && !provider.isLoading) {
          Future.microtask(() async {
            final auth = context.read<AuthProvider>();
            final token = await auth.authToken;
            if (token != null) {
              provider.loadProducts(token: token);
            }
          });
        }

        if (provider.isLoading) {
          return Center(
            child: CircularProgressIndicator(color: AppTheme.primary),
          );
        }

        final produtosFinalizados = provider.products.where((p) => p.type == 'finished').toList();

        return Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            children: [
              // Opção de pular (não vincular a produto)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Icon(PhosphorIcons.info, color: AppTheme.primary, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Você pode pular esta etapa e preencher manualmente',
                        style: TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _pularSelecaoProduto,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.dark700,
                  padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: AppTheme.dark600),
                  ),
                ),
                child: const Text('Preencher manualmente'),
              ),
              const SizedBox(height: 24),
              const Divider(color: AppTheme.dark600),
              const SizedBox(height: 16),
              
              // Lista de produtos
              Expanded(
                child: produtosFinalizados.isEmpty
                    ? Center(
                        child: Text(
                          'Nenhum produto finalizado encontrado',
                          style: TextStyle(color: AppTheme.dark300),
                        ),
                      )
                    : GridView.builder(
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 1.8,
                        ),
                        itemCount: produtosFinalizados.length,
                        itemBuilder: (context, index) {
                          final produto = produtosFinalizados[index];
                          return _buildProdutoCard(produto);
                        },
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildProdutoCard(Product produto) {
    return GestureDetector(
      onTap: () => _selecionarProduto(produto),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.dark800,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.dark700),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              produto.name,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            if (produto.code != null) ...[
              const SizedBox(height: 4),
              Text(
                'Código: ${produto.code}',
                style: TextStyle(
                  fontSize: 11,
                  color: AppTheme.dark300,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildFormularioStep() {
    return Consumer<LabelTemplatesProvider>(
      builder: (context, provider, child) {
        if (provider.schemaAtual == null) {
          return Center(
            child: CircularProgressIndicator(color: AppTheme.primary),
          );
        }

        final schema = provider.schemaAtual!.schema;
        final fields = schema.orderedFields;

        return SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Info do produto vinculado removida daqui pois já existe no header
              
              // Campos obrigatórios
              if (schema.requiredFields.isNotEmpty) ...[
                Text(
                  'CAMPOS OBRIGATÓRIOS',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.dark400,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 12),
                ...schema.requiredFields.map((field) {
                  return DynamicFormField(
                    field: field,
                    initialValue: provider.valoresFormulario[field.name],
                    onChanged: (value) => provider.atualizarCampo(field.name, value),
                  );
                }),
                const SizedBox(height: 24),
              ],

              // Campos opcionais
              if (schema.optionalFields.isNotEmpty) ...[
                Text(
                  'CAMPOS OPCIONAIS',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.dark400,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 12),
                ...schema.optionalFields.map((field) {
                  return DynamicFormField(
                    field: field,
                    initialValue: provider.valoresFormulario[field.name],
                    onChanged: (value) => provider.atualizarCampo(field.name, value),
                  );
                }),
              ],

              const SizedBox(height: 100), // Espaço para botões fixos
            ],
          ),
        );
      },
    );
  }

  // Botões fixos do formulário (overlay)
  Widget? _buildBotoesFormulario() {
    if (_currentStep != 'formulario') return null;

    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppTheme.dark800,
          border: Border(
            top: BorderSide(color: AppTheme.dark700),
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _adicionarAFila,
                icon: Icon(PhosphorIcons.queue, size: 18),
                label: const Text('Adicionar à Fila'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.primary,
                  side: BorderSide(color: AppTheme.primary),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _imprimirAgora,
                icon: Icon(PhosphorIcons.printer, size: 18),
                label: const Text('Imprimir'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBreadcrumb() {
    if (_currentStep == 'rotulos') return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
      child: Row(
        children: [
          GestureDetector(
            onTap: () {
              setState(() {
                _currentStep = 'rotulos';
                _rotuloSelecionado = null;
                _produtoSelecionado = null;
              });
            },
            child: Text(
              'Rótulos',
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.primary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          if (_rotuloSelecionado != null) ...[
            Text(
              ' > ',
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.dark300,
                fontWeight: FontWeight.w500,
              ),
            ),
            Text(
              'Configurar',
              style: TextStyle(
                fontSize: 14,
                color: AppTheme.dark300,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                _buildHeader(),
                _buildBreadcrumb(),
                Expanded(
                  child: _buildContent(),
                ),
              ],
            ),
            if (_buildBotoesFormulario() != null) _buildBotoesFormulario()!,
          ],
        ),
      ),
    );
  }

  Widget _buildFilaModal() {
    return Container(
      padding: const EdgeInsets.all(24),
      height: MediaQuery.of(context).size.height * 0.7,
      child: Column(
        children: [
          // Handle
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppTheme.dark600,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          
          // Título
          Row(
            children: [
              Icon(PhosphorIcons.printer, color: AppTheme.primary, size: 24),
              const SizedBox(width: 12),
              Text(
                'Fila de Impressão (${_filaImpressao.length})',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Lista da fila
          Expanded(
            child: _filaImpressao.isEmpty
                ? Center(
                    child: Text(
                      'Fila vazia',
                      style: TextStyle(color: AppTheme.dark300),
                    ),
                  )
                : ListView.builder(
                    itemCount: _filaImpressao.length,
                    itemBuilder: (context, index) {
                      final item = _filaImpressao[index];
                      final rotulo = item['rotulo'] as LabelTemplate;
                      final produto = item['produto'] as Product?;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.dark700,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    rotulo.name,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 14,
                                    ),
                                  ),
                                  if (produto != null) ...[
                                    const SizedBox(height: 4),
                                    Text(
                                      produto.name,
                                      style: TextStyle(
                                        color: AppTheme.dark300,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            IconButton(
                              onPressed: () {
                                setState(() {
                                  _filaImpressao.removeAt(index);
                                });
                                Navigator.pop(context);
                                if (_filaImpressao.isNotEmpty) {
                                  _mostrarFilaImpressao();
                                }
                              },
                              icon: Icon(
                                PhosphorIcons.trash,
                                color: Colors.red,
                                size: 20,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),

          // Botões
          if (_filaImpressao.isNotEmpty) ...[
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      setState(() {
                        _filaImpressao.clear();
                      });
                      Navigator.pop(context);
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red,
                      side: const BorderSide(color: Colors.red),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Limpar Fila'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () async {
                      Navigator.pop(context);
                      await _processarFila();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Imprimir Tudo'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _processarFila() async {
    for (int i = 0; i < _filaImpressao.length; i++) {
      final item = _filaImpressao[i];
      
      try {
        await _imprimirItem(item);
        
        // Pequeno delay entre impressões
        if (i < _filaImpressao.length - 1) {
          await Future.delayed(const Duration(milliseconds: 500));
        }
      } catch (e) {
        print('❌ Erro ao imprimir item ${i + 1}: $e');
      }
    }

    // Limpar fila
    setState(() {
      _filaImpressao.clear();
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Fila processada com sucesso!'),
        backgroundColor: Colors.green,
      ),
    );
  }
}

