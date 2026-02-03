import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../models/product_models.dart';
import '../models/template_models.dart';
import '../providers/auth_provider.dart';
import '../providers/print_provider.dart';
import '../providers/categories_products_provider.dart'; // ⭐ NOVO
import '../services/templates_service.dart';
import '../theme/app_theme.dart';
import '../components/header_button.dart';
import '../widgets/connectivity_status_widget.dart';
import '../widgets/print_modal.dart'; // ⭐ NOVO: Para usar o modal completo
import 'main_screen.dart';

/// Tela para geração de etiquetas personalizadas baseadas em templates do Tagment
class EtiquetaPersonalizadaScreen extends StatefulWidget {
  final Product product;
  final String templateId;

  const EtiquetaPersonalizadaScreen({
    super.key,
    required this.product,
    required this.templateId,
  });

  @override
  State<EtiquetaPersonalizadaScreen> createState() =>
      _EtiquetaPersonalizadaScreenState();
}

class _EtiquetaPersonalizadaScreenState
    extends State<EtiquetaPersonalizadaScreen> {
  final _formKey = GlobalKey<FormState>();
  final _templatesService = TemplatesService();
  
  Template? _template;
  bool _isLoading = true;
  String? _error;
  int _quantidade = 1;
  
  // Controladores dinâmicos para os campos do template
  final Map<String, TextEditingController> _controllers = {};
  final Map<String, FocusNode> _focusNodes = {}; // ⭐ NOVO: FocusNodes para focar após reset
  
  // Campos especiais (igual à tela de validade)
  DateTime _dataManipulacao = DateTime.now();
  DateTime? _dataValidade;
  String? _conservacaoSelecionada;
  
  @override
  void initState() {
    super.initState();
    _carregarTemplate();
  }
  
  @override
  void dispose() {
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    for (final focusNode in _focusNodes.values) {
      focusNode.dispose();
    }
    super.dispose();
  }

  Future<void> _carregarTemplate() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final printProvider = Provider.of<PrintProvider>(context, listen: false);
      final token = await authProvider.authToken;
      final tagmentApiKey = printProvider.apiKeyAtual;

      if (token == null) {
        setState(() {
          _error = 'Token não disponível';
          _isLoading = false;
        });
        return;
      }

      final template = await _templatesService.getTemplateById(
        widget.templateId,
        token: token,
        tagmentApiKey: tagmentApiKey,
      );

      if (template == null) {
        setState(() {
          _error = 'Template não encontrado';
          _isLoading = false;
        });
        return;
      }

      // Extrair variáveis e criar controladores
      final variables = template.extractVariables();
      for (final variable in variables) {
        _controllers[variable] = TextEditingController(
          text: _getDefaultValue(variable),
        );
        _focusNodes[variable] = FocusNode(); // ⭐ NOVO: Criar FocusNode para cada campo
      }

      setState(() {
        _template = template;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar template: $e';
        _isLoading = false;
      });
    }
  }

  /// Formata data para exibição (DD/MM/AAAA)
  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }
  
  /// Retorna valor padrão para variáveis conhecidas
  /// Preenche automaticamente com dados do produto cadastrado
  String _getDefaultValue(String variable) {
    final lowerVar = variable.toLowerCase();
    
    // Nome do produto - usando mesma lógica de _isHiddenField para consistência
    // Captura variações como nome_do_produto, produto_nome_completo, etc.
    if (lowerVar.contains('produto') || lowerVar.contains('product')) {
      if (lowerVar.contains('nome') || lowerVar.contains('name')) {
        return widget.product.name;
      }
      if (lowerVar == 'produto' || lowerVar == 'product') {
        return widget.product.name;
      }
    }
    if (lowerVar == 'nome' || lowerVar == 'name') {
      return widget.product.name;
    }
    
    // Data de Manipulação
    if (lowerVar == 'manipulacao' || 
        lowerVar == 'data_manipulacao' ||
        lowerVar == 'manipulation_date') {
      return _formatDate(_dataManipulacao);
    }
    
    // Data de Validade
    if (lowerVar == 'validade' || 
        lowerVar == 'data_validade' ||
        lowerVar == 'validity_date' ||
        lowerVar == 'vencimento') {
      return _dataValidade != null ? _formatDate(_dataValidade!) : '';
    }
    
    // Conservação
    if (lowerVar == 'conservacao' || 
        lowerVar == 'conservation' ||
        lowerVar == 'tipo_conservacao') {
      return _conservacaoSelecionada ?? '';
    }
    
    // Marca
    if ((lowerVar == 'marca' || lowerVar == 'brand') && 
        widget.product.brand != null && widget.product.brand!.isNotEmpty) {
      return widget.product.brand!;
    }
    
    // SIF/Código
    if ((lowerVar == 'sif' || lowerVar == 'codigo' || lowerVar == 'code') && 
        widget.product.sif != null && widget.product.sif!.isNotEmpty) {
      return widget.product.sif!;
    }
    
    // Peso
    if ((lowerVar == 'peso' || lowerVar == 'weight') && 
        widget.product.weight != null && widget.product.weight!.isNotEmpty) {
      return widget.product.weight!;
    }
    
    // Unidade
    if ((lowerVar == 'unidade' || lowerVar == 'unit') && 
        widget.product.weightUnit != null && widget.product.weightUnit!.isNotEmpty) {
      return widget.product.weightUnit!;
    }
    
    // Descrição
    if ((lowerVar == 'descricao' || lowerVar == 'description') && 
        widget.product.description != null && widget.product.description!.isNotEmpty) {
      return widget.product.description!;
    }
    
    return '';
  }
  
  /// Verifica se uma variável deve ser preenchida automaticamente e não editável
  bool _isAutoFilled(String variable) {
    final lowerVar = variable.toLowerCase();
    // Mesma lógica de _isHiddenField - campos de nome do produto são auto-preenchidos
    if (lowerVar.contains('produto') || lowerVar.contains('product')) {
      if (lowerVar.contains('nome') || lowerVar.contains('name')) {
        return true;
      }
      if (lowerVar == 'produto' || lowerVar == 'product') {
        return true;
      }
    }
    return false;
  }
  
  /// Verifica se uma variável deve ser ocultada da tela (mas ainda enviada na impressão)
  bool _isHiddenField(String variable) {
    final lowerVar = variable.toLowerCase();
    
    // Ocultar campos de nome do produto (já sabemos qual é, não faz sentido exibir)
    // Usando contains() para capturar variações como nome_do_produto, produto_nome_completo, etc.
    
    // Se contém "produto" ou "product", verificar se é relacionado a nome
    if (lowerVar.contains('produto') || lowerVar.contains('product')) {
      // É um campo relacionado ao produto (ex: nome_produto, produto_nome, product_name)
      // Se também contém "nome" ou "name", ocultar
      if (lowerVar.contains('nome') || lowerVar.contains('name')) {
        return true;
      }
      // Se é apenas "produto" ou "product" sozinho, ocultar também
      if (lowerVar == 'produto' || lowerVar == 'product') {
        return true;
      }
    }
    
    // Se é exatamente "nome" ou "name" (sem outras palavras)
    if (lowerVar == 'nome' || lowerVar == 'name') {
      return true;
    }
    
    return false;
  }
  
  /// Verifica se uma variável é um campo especial (data/conservação)
  bool _isSpecialField(String variable) {
    final lowerVar = variable.toLowerCase();
    return lowerVar == 'manipulacao' || 
           lowerVar == 'data_manipulacao' ||
           lowerVar == 'manipulation_date' ||
           lowerVar == 'validade' || 
           lowerVar == 'data_validade' ||
           lowerVar == 'validity_date' ||
           lowerVar == 'vencimento' ||
           lowerVar == 'conservacao' || 
           lowerVar == 'conservation' ||
           lowerVar == 'tipo_conservacao';
  }
  
  /// Retorna o tipo do campo especial
  String _getSpecialFieldType(String variable) {
    final lowerVar = variable.toLowerCase();
    if (lowerVar == 'manipulacao' || lowerVar == 'data_manipulacao' || lowerVar == 'manipulation_date') {
      return 'manipulacao';
    }
    if (lowerVar == 'validade' || lowerVar == 'data_validade' || lowerVar == 'validity_date' || lowerVar == 'vencimento') {
      return 'validade';
    }
    if (lowerVar == 'conservacao' || lowerVar == 'conservation' || lowerVar == 'tipo_conservacao') {
      return 'conservacao';
    }
    return '';
  }

  /// Foca no primeiro campo editável após resetar o formulário
  void _focusFirstEditableField() {
    if (_template == null) return;
    
    final variables = _template!.extractVariables();
    
    // Encontrar o primeiro campo que seja:
    // - Não oculto
    // - Não auto-preenchido
    // - Não especial (data/conservação)
    // - Tenha um FocusNode
    for (final variable in variables) {
      if (!_isHiddenField(variable) && 
          !_isAutoFilled(variable) && 
          !_isSpecialField(variable) &&
          _focusNodes[variable] != null) {
        // Aguardar um frame para garantir que o widget está montado
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _focusNodes[variable]?.requestFocus();
        });
        break;
      }
    }
  }

  Future<void> _imprimir() async {
    if (!_formKey.currentState!.validate()) return;

    // ⭐ CORRIGIDO: Abrir modal PRIMEIRO, processar tudo DENTRO (igual ao fluxo de validade)
    await showPrintModal(
      context: context,
      title: 'Imprimindo Etiqueta',
      subtitle: widget.product.name,
      printFunction: (onProgress) async {
        // ⭐ Toda a lógica acontece DENTRO do modal (igual ao fluxo de validade)
        // ⭐ CORRIGIDO: Usar o contexto do widget pai (não do modal) para acessar providers
        final printProvider = Provider.of<PrintProvider>(
          context,
          listen: false,
        );
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        
        // Obter auth info
        final clientId = authProvider.user?.clientId;
        final authToken = await authProvider.authToken;

        if (authToken == null) {
          throw Exception('Token de autenticação não encontrado');
        }

        // Obter categoria para usar a impressora configurada
        final categoriesProvider = Provider.of<CategoriesProductsProvider>(
          context,
          listen: false,
        );
        final category = widget.product.categoryId != null
            ? categoriesProvider.getCategoryById(widget.product.categoryId!)
            : null;

        print('🖨️ [EtiquetaPersonalizadaScreen] Buscando impressora:');
        print('   Produto: ${widget.product.name}');
        print('   Produto defaultPrinterId: ${widget.product.defaultPrinterId}');
        print('   Categoria: ${category?.name}');
        print('   Categoria defaultPrinterId: ${category?.defaultPrinterId}');

        // Selecionar impressora (mesma lógica da tela de validade)
        final printerInfo = await printProvider.obterImpressoraValidade(
          null,
          defaultPrinterId: widget.product.defaultPrinterId,
          categoryDefaultPrinterId: category?.defaultPrinterId,
        );
        
        print('   ✅ Impressora selecionada: ${printerInfo?.displayName} (ID: ${printerInfo?.id})');
        
        if (printerInfo == null) {
          throw Exception('Nenhuma impressora online encontrada');
        }

        // Montar dados para impressão
        final Map<String, dynamic> data = {};
        for (final entry in _controllers.entries) {
          data[entry.key] = entry.value.text;
        }

        // Usar imprimirComTemplate diretamente para ter TagmentPrintResult
        return await printProvider.imprimirComTemplate(
          printer: printerInfo,
          templateId: widget.templateId,
          templateData: data,
          copies: _quantidade,
          clientId: clientId,
          authToken: authToken,
          isLabelOnly: true, // Não criar registros de rastreabilidade
          onProgress: onProgress,
        );
      },
      onSuccess: () {
        // Limpar campos após impressão bem-sucedida, exceto os preenchidos automaticamente
        _controllers.forEach((key, controller) {
          if (_getDefaultValue(key).isEmpty) {
            controller.clear();
          }
        });
        setState(() {
          _quantidade = 1;
          _dataManipulacao = DateTime.now();
          _dataValidade = null;
          _conservacaoSelecionada = null;
        });
        // ⭐ NOVO: Focar no primeiro campo editável após resetar
        _focusFirstEditableField();
      },
      onError: () {
        // Não fechar a tela em caso de erro, deixar o usuário tentar novamente
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return ConnectivityBanner(
      child: Scaffold(
        backgroundColor: AppTheme.dark900,
        body: SafeArea(
          child: Column(
            children: [
              // Header fixo (igual à tela de validade)
              Container(
                width: double.infinity,
                color: AppTheme.dark900,
                padding: const EdgeInsets.symmetric(
                  horizontal: 20.0,
                  vertical: 10.0,
                ),
                child: Row(
                  children: [
                    // Botão voltar
                    HeaderButton(
                      iconPath: 'assets/icons/voltar.svg',
                      onTap: () => Navigator.pop(context),
                      size: 32,
                      color: AppTheme.primary,
                      tooltip: 'Voltar',
                    ),
                    const SizedBox(width: 16),
                    // Título dinâmico com nome do produto
                    Expanded(
                      child: Text(
                        widget.product.name,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    // Botão Home
                    HeaderButton(
                      icon: PhosphorIcons.house,
                      onTap: () {
                        Navigator.of(context).pushAndRemoveUntil(
                          MaterialPageRoute(
                            builder: (context) => const MainScreen(),
                          ),
                          (route) => false,
                        );
                      },
                      size: 32,
                      color: AppTheme.primary,
                      tooltip: 'Início',
                    ),
                  ],
                ),
              ),
              
              // Breadcrumb (igual à tela de validade)
              _buildBreadcrumb(),
              
              // Body com scroll
              Expanded(child: _buildBody()),
              
              // Footer com quantidade e botão imprimir
              if (_template != null) _buildBottomBar(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBreadcrumb() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Breadcrumb de navegação
          Row(
            children: [
              GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Text(
                  'Categorias',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppTheme.primary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
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
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: AppTheme.primary),
            SizedBox(height: 16),
            Text(
              'Carregando template...',
              style: TextStyle(color: AppTheme.dark300),
            ),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                PhosphorIcons.warningCircle,
                size: 64,
                color: Colors.red,
              ),
              SizedBox(height: 16),
              Text(
                _error!,
                style: TextStyle(color: Colors.red, fontSize: 16),
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: _carregarTemplate,
                icon: Icon(PhosphorIcons.arrowClockwise),
                label: Text('Tentar novamente'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
      );
    }

    final variables = _template!.extractVariables();
    
    if (variables.isEmpty) {
      return Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                PhosphorIcons.info,
                size: 64,
                color: AppTheme.primary,
              ),
              SizedBox(height: 16),
              Text(
                'Este template não possui campos personalizáveis.',
                style: TextStyle(color: AppTheme.dark300, fontSize: 16),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return Form(
      key: _formKey,
      child: SingleChildScrollView(
        padding: EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Info do template
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.dark700,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Icon(PhosphorIcons.layout, color: AppTheme.primary, size: 24),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _template!.name,
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        if (_template!.description != null)
                          Text(
                            _template!.description!,
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
            
            SizedBox(height: 24),
            
            Text(
              'Preencha os campos',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            
            SizedBox(height: 16),
            
            // Campos dinâmicos
            ...variables.map((variable) => _buildDynamicField(variable)),
            
            SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildDynamicField(String variable) {
    // Ocultar campos que não fazem sentido exibir (ex: nome do produto)
    if (_isHiddenField(variable)) {
      return SizedBox.shrink();
    }
    
    // Verificar se é um campo especial
    if (_isSpecialField(variable)) {
      return _buildSpecialField(variable);
    }
    
    // Formatar label amigável
    final label = _formatLabel(variable);
    final isAutoFilled = _isAutoFilled(variable);
    final hasValue = _controllers[variable]?.text.isNotEmpty ?? false;
    
    return Padding(
      padding: EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: _controllers[variable],
        focusNode: _focusNodes[variable], // ⭐ NOVO: Adicionar FocusNode
        enabled: !isAutoFilled, // Desabilitar campos auto-preenchidos
        decoration: InputDecoration(
          labelText: isAutoFilled && hasValue ? '$label (automático)' : label,
          labelStyle: TextStyle(
            color: isAutoFilled ? AppTheme.primary : AppTheme.dark300,
          ),
          hintText: isAutoFilled ? null : 'Digite $label',
          hintStyle: TextStyle(color: AppTheme.dark400),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: isAutoFilled ? AppTheme.primary : AppTheme.dark600,
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(
              color: isAutoFilled ? AppTheme.primary : AppTheme.dark600,
            ),
          ),
          disabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: AppTheme.primary),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: AppTheme.primary, width: 2),
          ),
          filled: true,
          fillColor: isAutoFilled ? AppTheme.dark800 : AppTheme.dark700,
          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          prefixIcon: Icon(
            _getIconForVariable(variable),
            color: AppTheme.primary,
            size: 20,
          ),
          suffixIcon: isAutoFilled && hasValue
              ? Icon(PhosphorIcons.checkCircle, color: AppTheme.primary, size: 20)
              : null,
        ),
        style: TextStyle(
          color: isAutoFilled ? AppTheme.dark300 : Colors.white,
        ),
        validator: (value) {
          // Campos obrigatórios baseados na variável (exceto auto-preenchidos)
          if (!isAutoFilled && _isRequired(variable) && (value == null || value.isEmpty)) {
            return '$label é obrigatório';
          }
          return null;
        },
      ),
    );
  }
  
  Widget _buildSpecialField(String variable) {
    final fieldType = _getSpecialFieldType(variable);
    
    if (fieldType == 'manipulacao') {
      return _buildDateField(
        label: 'Data de Manipulação',
        value: _dataManipulacao,
        variable: variable,
        onTap: () => _selecionarData(isManipulacao: true),
        editable: true,
      );
    }
    
    if (fieldType == 'validade') {
      // Data de validade é somente leitura (calculada automaticamente)
      return _buildDateField(
        label: 'Data de Validade',
        value: _dataValidade,
        variable: variable,
        onTap: null, // Não permite edição
        editable: false,
      );
    }
    
    if (fieldType == 'conservacao') {
      return _buildConservacaoField(variable);
    }
    
    return SizedBox.shrink();
  }
  
  Widget _buildDateField({
    required String label,
    required DateTime? value,
    required String variable,
    VoidCallback? onTap,
    bool editable = true,
  }) {
    return Padding(
      padding: EdgeInsets.only(bottom: 16),
      child: GestureDetector(
        onTap: editable ? onTap : null,
        child: Container(
          width: double.infinity,
          padding: EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: editable ? AppTheme.dark700 : AppTheme.dark800,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.primary),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(PhosphorIcons.calendar, color: AppTheme.primary, size: 20),
                  SizedBox(width: 20),
                  Expanded(
                    child: Text(
                      label,
                      style: TextStyle(
                        fontSize: 16,
                        color: AppTheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  if (editable)
                    Icon(PhosphorIcons.caretDown, color: AppTheme.dark300, size: 20)
                  else if (value != null)
                    Icon(PhosphorIcons.checkCircle, color: AppTheme.primary, size: 20),
                ],
              ),
              SizedBox(height: 8),
              Text(
                value != null ? _formatDate(value) : (editable ? 'Selecione uma data' : 'Selecione a conservação'),
                style: TextStyle(
                  fontSize: 18,
                  color: value != null ? Colors.white : AppTheme.dark400,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  /// Retorna as opções de conservação disponíveis com seus dias
  List<Map<String, dynamic>> _getOpcoesConservacao() {
    final product = widget.product;
    final opcoes = <Map<String, dynamic>>[];
    
    // Ambiente
    opcoes.add({
      'nome': 'Ambiente',
      'dias': product.shelfLifeAmbient,
      'disponivel': product.shelfLifeAmbient != null && product.shelfLifeAmbient! > 0,
      'icon': PhosphorIcons.house,
    });
    
    // Refrigerado
    opcoes.add({
      'nome': 'Refrigerado',
      'dias': product.shelfLifeRefrigerated,
      'disponivel': product.shelfLifeRefrigerated != null && product.shelfLifeRefrigerated! > 0,
      'icon': PhosphorIcons.thermometerCold,
    });
    
    // Congelado
    opcoes.add({
      'nome': 'Congelado',
      'dias': product.shelfLifeFrozen,
      'disponivel': product.shelfLifeFrozen != null && product.shelfLifeFrozen! > 0,
      'icon': PhosphorIcons.snowflake,
    });
    
    return opcoes;
  }
  
  /// Inicializa a conservação se só tiver uma opção disponível
  void _inicializarConservacaoSeNecessario(String variable) {
    if (_conservacaoSelecionada != null) return;
    
    final opcoes = _getOpcoesConservacao();
    final disponiveis = opcoes.where((o) => o['disponivel'] == true).toList();
    
    // Se só tiver uma opção disponível, selecionar automaticamente
    if (disponiveis.length == 1) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        setState(() {
          _conservacaoSelecionada = disponiveis.first['nome'];
          _controllers[variable]?.text = disponiveis.first['nome'];
          _calcularDataValidade();
        });
      });
    }
  }
  
  Widget _buildConservacaoField(String variable) {
    final opcoes = _getOpcoesConservacao();
    
    // Verificar se deve inicializar automaticamente
    _inicializarConservacaoSeNecessario(variable);
    
    return Padding(
      padding: EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Tipo de Conservação',
            style: TextStyle(
              fontSize: 14,
              color: AppTheme.dark300,
            ),
          ),
          SizedBox(height: 8),
          Row(
            children: opcoes.map((opcao) {
              final nome = opcao['nome'] as String;
              final dias = opcao['dias'] as int?;
              final disponivel = opcao['disponivel'] as bool;
              final icon = opcao['icon'] as IconData;
              final isSelected = _conservacaoSelecionada == nome;
              final isLast = opcao == opcoes.last;
              
              return Expanded(
                child: GestureDetector(
                  onTap: disponivel ? () {
                    setState(() {
                      _conservacaoSelecionada = nome;
                      _controllers[variable]?.text = nome;
                      _calcularDataValidade();
                    });
                  } : null,
                  child: Container(
                    margin: EdgeInsets.only(right: isLast ? 0 : 8),
                    padding: EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: isSelected 
                          ? AppTheme.primary.withOpacity(0.2) 
                          : disponivel 
                              ? AppTheme.dark700 
                              : AppTheme.dark800,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected 
                            ? AppTheme.primary 
                            : disponivel 
                                ? AppTheme.dark600 
                                : AppTheme.dark700,
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Column(
                      children: [
                        Icon(
                          icon,
                          color: isSelected 
                              ? AppTheme.primary 
                              : disponivel 
                                  ? AppTheme.dark300 
                                  : AppTheme.dark500,
                          size: 24,
                        ),
                        SizedBox(height: 4),
                        Text(
                          nome,
                          style: TextStyle(
                            fontSize: 12,
                            color: isSelected 
                                ? AppTheme.primary 
                                : disponivel 
                                    ? AppTheme.dark300 
                                    : AppTheme.dark500,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          disponivel ? '$dias dias' : 'Não disponível',
                          style: TextStyle(
                            fontSize: 10,
                            color: isSelected 
                                ? AppTheme.primary 
                                : disponivel 
                                    ? AppTheme.dark400 
                                    : AppTheme.dark600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
  
  Future<void> _selecionarData({required bool isManipulacao}) async {
    final hoje = DateTime.now();
    
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isManipulacao ? _dataManipulacao : (_dataValidade ?? hoje),
      firstDate: DateTime(2020),
      // Data de manipulação: só passado ou hoje (nunca futuro)
      lastDate: isManipulacao ? hoje : DateTime(2030),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.dark(
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
    
    if (picked != null) {
      setState(() {
        if (isManipulacao) {
          _dataManipulacao = picked;
          // Atualizar controllers que usam manipulação
          for (final entry in _controllers.entries) {
            if (_getSpecialFieldType(entry.key) == 'manipulacao') {
              entry.value.text = _formatDate(picked);
            }
          }
          // Recalcular data de validade baseada na nova data de manipulação
          _calcularDataValidade();
        }
      });
    }
  }
  
  void _calcularDataValidade() {
    if (_conservacaoSelecionada == null) return;
    
    // Usar validade do produto se disponível
    int diasValidade = 7; // padrão
    
    final product = widget.product;
    if (_conservacaoSelecionada == 'Ambiente' && product.shelfLifeAmbient != null) {
      diasValidade = product.shelfLifeAmbient!;
    } else if (_conservacaoSelecionada == 'Refrigerado' && product.shelfLifeRefrigerated != null) {
      diasValidade = product.shelfLifeRefrigerated!;
    } else if (_conservacaoSelecionada == 'Congelado' && product.shelfLifeFrozen != null) {
      diasValidade = product.shelfLifeFrozen!;
    }
    
    setState(() {
      _dataValidade = _dataManipulacao.add(Duration(days: diasValidade));
      // Atualizar controllers que usam validade
      for (final entry in _controllers.entries) {
        if (_getSpecialFieldType(entry.key) == 'validade') {
          entry.value.text = _formatDate(_dataValidade!);
        }
      }
    });
  }

  String _formatLabel(String variable) {
    // Converter snake_case para Title Case
    return variable
        .replaceAll('_', ' ')
        .split(' ')
        .map((word) => word.isNotEmpty
            ? '${word[0].toUpperCase()}${word.substring(1).toLowerCase()}'
            : '')
        .join(' ');
  }

  IconData _getIconForVariable(String variable) {
    final lowerVar = variable.toLowerCase();
    
    if (lowerVar.contains('nome') || lowerVar.contains('name')) {
      return PhosphorIcons.textT;
    }
    if (lowerVar.contains('paciente') || lowerVar.contains('patient')) {
      return PhosphorIcons.user;
    }
    if (lowerVar.contains('leito') || lowerVar.contains('bed')) {
      return PhosphorIcons.bed;
    }
    if (lowerVar.contains('data') || lowerVar.contains('date')) {
      return PhosphorIcons.calendar;
    }
    if (lowerVar.contains('hora') || lowerVar.contains('time')) {
      return PhosphorIcons.clock;
    }
    if (lowerVar.contains('formula')) {
      return PhosphorIcons.flask;
    }
    if (lowerVar.contains('volume') || lowerVar.contains('ml')) {
      return PhosphorIcons.drop;
    }
    if (lowerVar.contains('peso') || lowerVar.contains('weight')) {
      return PhosphorIcons.scales;
    }
    if (lowerVar.contains('lote') || lowerVar.contains('batch')) {
      return PhosphorIcons.barcode;
    }
    
    return PhosphorIcons.textAa;
  }

  bool _isRequired(String variable) {
    final lowerVar = variable.toLowerCase();
    // Definir quais campos são obrigatórios
    return lowerVar.contains('nome') || 
           lowerVar.contains('name') ||
           lowerVar.contains('paciente');
  }

  void _incrementarQuantidade() {
    setState(() {
      _quantidade++;
    });
  }

  void _decrementarQuantidade() {
    if (_quantidade > 1) {
      setState(() {
        _quantidade--;
      });
    }
  }

  Widget _buildBottomBar() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.dark800,
        border: Border(top: BorderSide(color: AppTheme.dark700)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Linha: Quantidade + Botão Imprimir
          Row(
            children: [
              // Seletor de Quantidade de Etiquetas - Flex menor para dar mais espaço ao botão
              Expanded(
                flex: 2, // Reduzido de flex padrão para dar mais espaço ao botão
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: AppTheme.dark700,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.dark600),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Botão -
                      GestureDetector(
                        onTap: _decrementarQuantidade,
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: AppTheme.dark600,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            PhosphorIcons.minus,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Campo de texto
                      SizedBox(
                        width: 40,
                        child: Text(
                          '$_quantidade',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Botão +
                      GestureDetector(
                        onTap: _incrementarQuantidade,
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: AppTheme.primary,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            PhosphorIcons.plus,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Botão Imprimir - Flex maior para ter mais espaço
              Expanded(
                flex: 3, // Aumentado para dar mais espaço ao botão
                child: ElevatedButton.icon(
                  onPressed: _imprimir,
                  icon: const Icon(PhosphorIcons.printer, size: 18),
                  label: const Text(
                    'Imprimir',
                    style: TextStyle(fontSize: 14),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
