import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:speech_to_text/speech_to_text.dart';
import '../theme/app_theme.dart';
import '../models/produto_pre_cadastro.dart';
import 'custom_icon.dart';
import 'modal_pre_cadastro.dart';

class BuscaProdutoModal extends StatefulWidget {
  final String titulo;
  final String hintText;
  final List<Map<String, dynamic>> produtos;
  final Function(Map<String, dynamic> produto) onProdutoSelecionado;
  final Widget Function(Map<String, dynamic> produto)? itemBuilder;
  final String Function(Map<String, dynamic> produto)? filtroFunction;
  final bool habilitarPreCadastro;
  final Function(ProdutoPreCadastro)? onPreCadastro;

  const BuscaProdutoModal({
    super.key,
    required this.titulo,
    required this.hintText,
    required this.produtos,
    required this.onProdutoSelecionado,
    this.itemBuilder,
    this.filtroFunction,
    this.habilitarPreCadastro = false,
    this.onPreCadastro,
  });

  @override
  State<BuscaProdutoModal> createState() => _BuscaProdutoModalState();
}

class _BuscaProdutoModalState extends State<BuscaProdutoModal> 
    with TickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  bool _isListening = false;
  List<Map<String, dynamic>> _resultados = [];
  
  // Speech to Text
  final SpeechToText _speechToText = SpeechToText();
  bool _speechEnabled = false;
  String _lastWords = '';
  
  // Animação de pulso
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _resultados = widget.produtos;
    _initSpeech();
    _initAnimations();
  }
  
  void _initAnimations() {
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );
    
    _pulseAnimation = Tween<double>(
      begin: 0.8,
      end: 1.3,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
  }
  
  @override
  void dispose() {
    _pulseController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }
  
  void _initSpeech() async {
    _speechEnabled = await _speechToText.initialize(
      onError: (error) {
        debugPrint('Erro no reconhecimento de voz: $error');
        setState(() {
          _isListening = false;
        });
      },
      onStatus: (status) {
        if (status == 'done' || status == 'notListening') {
          setState(() {
            _isListening = false;
          });
        }
      },
    );
  }

  void _filtrarProdutos() {
    final query = _searchController.text.toLowerCase();
    
    setState(() {
      _resultados = widget.produtos.where((produto) {
        // Se foi fornecida uma função de filtro customizada, use ela
        if (widget.filtroFunction != null) {
          return widget.filtroFunction!(produto).toLowerCase().contains(query);
        }
        
        // Filtro padrão: busca por 'nome' e 'codigo'
        return produto['nome']?.toString().toLowerCase().contains(query) == true ||
               produto['codigo']?.toString().toLowerCase().contains(query) == true;
      }).toList();
    });
  }

  void _iniciarBuscaPorVoz() async {
    if (!_speechEnabled) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Reconhecimento de voz não disponível'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (_isListening) {
      // Parar de ouvir
      _speechToText.stop();
      _pulseController.stop();
      setState(() {
        _isListening = false;
      });
    } else {
      // Começar a ouvir
      setState(() {
        _isListening = true;
        _lastWords = '';
      });
      
      // Iniciar animação de pulso
      _pulseController.repeat();
      
      await _speechToText.listen(
        onResult: (result) {
          setState(() {
            _lastWords = result.recognizedWords;
            if (result.finalResult) {
              _searchController.text = _lastWords;
              _filtrarProdutos();
            }
          });
        },
        listenFor: const Duration(seconds: 10),
        pauseFor: const Duration(seconds: 3),
        localeId: 'pt_BR', // Português Brasil
        partialResults: true,
      );
    }
  }

  void _abrirModalPreCadastro() {
    showDialog(
      context: context,
      builder: (context) => ModalPreCadastro(
        nomeSugerido: _searchController.text.trim().isNotEmpty 
            ? _searchController.text.trim() 
            : null,
        onSalvar: (preCadastro) {
          if (widget.onPreCadastro != null) {
            widget.onPreCadastro!(preCadastro);
          }
          // Fechar o modal de busca também
          Navigator.pop(context);
        },
      ),
    );
  }

  Widget _buildItemPadrao(Map<String, dynamic> produto) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: AppTheme.dark800,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.dark700),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppTheme.primary.withOpacity(0.2),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Icon(
            PhosphorIcons.package,
            color: AppTheme.primary,
            size: 20,
          ),
        ),
        title: Text(
          produto['nome'] ?? 'Produto',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: Text(
          'Código: ${produto['codigo'] ?? 'N/A'}',
          style: TextStyle(
            color: AppTheme.dark300,
            fontSize: 12,
          ),
        ),
        trailing: produto['unidade'] != null ? Text(
          produto['unidade'],
          style: TextStyle(
            color: AppTheme.dark300,
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ) : null,
        onTap: () {
          widget.onProdutoSelecionado(produto);
          Navigator.pop(context);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      maxChildSize: 0.9,
      minChildSize: 0.5,
      expand: false,
      builder: (context, scrollController) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Icon(
                  PhosphorIcons.magnifyingGlass,
                  color: AppTheme.primary,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Text(
                  widget.titulo,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
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
            
            const SizedBox(height: 20),
            
            // Campo de busca
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _searchController,
                  focusNode: _searchFocusNode,
                  enabled: true,
                  autofocus: false,
                  onChanged: (value) => _filtrarProdutos(),
                  decoration: InputDecoration(
                    hintText: widget.hintText,
                    hintStyle: TextStyle(color: AppTheme.dark300),
                    prefixIcon: const Icon(PhosphorIcons.magnifyingGlass, color: AppTheme.dark300),
                    suffixIcon: GestureDetector(
                      onTap: _iniciarBuscaPorVoz,
                      child: Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: CustomIcon(
                          iconPath: 'assets/icons/microfone.svg',
                          size: 16,
                          color: _isListening ? AppTheme.primary : AppTheme.dark300,
                        ),
                      ),
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(25),
                      borderSide: BorderSide(color: AppTheme.dark600),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(25),
                      borderSide: BorderSide(color: AppTheme.dark600),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(25),
                      borderSide: BorderSide(color: AppTheme.primary, width: 2),
                    ),
                    filled: true,
                    fillColor: AppTheme.dark800,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  ),
                  style: const TextStyle(color: Colors.white, fontSize: 16),
                ),
                
                // Indicador de reconhecimento de voz
                if (_isListening && _lastWords.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(top: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        AnimatedBuilder(
                          animation: _pulseAnimation,
                          builder: (context, child) {
                            return Transform.scale(
                              scale: _pulseAnimation.value,
                              child: Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: AppTheme.primary,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            );
                          },
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Ouvindo: "$_lastWords"',
                            style: TextStyle(
                              color: AppTheme.primary,
                              fontSize: 12,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            
            const SizedBox(height: 20),
            
            // Resultados da busca
            Expanded(
              child: _resultados.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            PhosphorIcons.magnifyingGlass,
                            size: 48,
                            color: AppTheme.dark300,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Nenhum item encontrado',
                            style: TextStyle(
                              fontSize: 16,
                              color: AppTheme.dark300,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Tente buscar por outro termo',
                            style: TextStyle(
                              fontSize: 14,
                              color: AppTheme.dark400,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          if (widget.habilitarPreCadastro) ...[
                            const SizedBox(height: 24),
                            ElevatedButton.icon(
                              onPressed: _abrirModalPreCadastro,
                              icon: Icon(PhosphorIcons.plus, size: 18),
                              label: const Text('Solicitar Cadastro'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(25),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    )
                  : ListView.builder(
                      itemCount: _resultados.length,
                      itemBuilder: (context, index) {
                        final produto = _resultados[index];
                        
                        // Se foi fornecido um itemBuilder customizado, use ele
                        if (widget.itemBuilder != null) {
                          return widget.itemBuilder!(produto);
                        }
                        
                        // Senão, use o item padrão
                        return _buildItemPadrao(produto);
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
