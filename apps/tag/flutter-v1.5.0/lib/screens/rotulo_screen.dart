import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../theme/app_theme.dart';
import '../components/custom_icon.dart';
import '../components/header_button.dart';

class RotuloScreen extends StatefulWidget {
  const RotuloScreen({super.key});

  @override
  State<RotuloScreen> createState() => _RotuloScreenState();
}

class _RotuloScreenState extends State<RotuloScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedCategoria = '';
  List<Map<String, dynamic>> _carrinho = [];

  // Dados mockados para demonstração
  final List<Map<String, dynamic>> produtosProntos = [
    {
      'id': 1,
      'nome': 'Paracetamol 500mg',
      'categoria': 'Medicamentos',
      'dataFabricacao': DateTime.now().subtract(const Duration(days: 30)),
      'diasDeValidade': 5, // 5 dias de validade
      'variacoes': [
        {'id': '1-500', 'nome': '500mg', 'quantidade': 100, 'preco': 12.50},
        {'id': '1-1000', 'nome': '1000mg', 'quantidade': 50, 'preco': 18.90},
      ],
    },
    {
      'id': 2,
      'nome': 'Dipirona 500mg',
      'categoria': 'Medicamentos',
      'dataFabricacao': DateTime.now().subtract(const Duration(days: 15)),
      'diasDeValidade': 7, // 7 dias de validade
      'variacoes': [
        {'id': '2-500', 'nome': '500mg', 'quantidade': 200, 'preco': 8.75},
        {'id': '2-1000', 'nome': '1000mg', 'quantidade': 150, 'preco': 14.20},
      ],
    },
    {
      'id': 3,
      'nome': 'Vitamina C 1000mg',
      'categoria': 'Suplementos',
      'dataFabricacao': DateTime.now().subtract(const Duration(days: 45)),
      'diasDeValidade': 10, // 10 dias de validade
      'variacoes': [
        {'id': '3-1000', 'nome': '1000mg', 'quantidade': 80, 'preco': 25.90},
        {'id': '3-2000', 'nome': '2000mg', 'quantidade': 40, 'preco': 45.80},
      ],
    },
    {
      'id': 4,
      'nome': 'Ômega 3 1000mg',
      'categoria': 'Suplementos',
      'dataFabricacao': DateTime.now().subtract(const Duration(days: 20)),
      'diasDeValidade': 15, // 15 dias de validade
      'variacoes': [
        {'id': '4-1000', 'nome': '1000mg', 'quantidade': 120, 'preco': 45.80},
        {'id': '4-2000', 'nome': '2000mg', 'quantidade': 60, 'preco': 78.50},
      ],
    },
  ];

  List<Map<String, dynamic>> get filteredProdutos {
    List<Map<String, dynamic>> filtered = produtosProntos;
    
    // Filtro por busca
    if (_searchController.text.isNotEmpty) {
      filtered = filtered.where((produto) {
        return produto['nome'].toString().toLowerCase().contains(_searchController.text.toLowerCase()) ||
               produto['categoria'].toString().toLowerCase().contains(_searchController.text.toLowerCase());
      }).toList();
    }
    
    // Filtro por categoria
    if (_selectedCategoria.isNotEmpty) {
      filtered = filtered.where((produto) => produto['categoria'] == _selectedCategoria).toList();
    }
    
    return filtered;
  }

  String formatarData(DateTime data) {
    return '${data.day.toString().padLeft(2, '0')}/${data.month.toString().padLeft(2, '0')}/${data.year}';
  }

  void _adicionarAoCarrinho(Map<String, dynamic> variacao, Map<String, dynamic> produto, int quantidade) {
    setState(() {
      _carrinho.add({
        'produto': produto,
        'variacao': variacao,
        'quantidade': quantidade,
        'timestamp': DateTime.now(),
      });
    });
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${quantidade}x ${produto['nome']} ${variacao['nome']} adicionado à fila'),
        backgroundColor: AppTheme.primary,
        action: SnackBarAction(
          label: 'Ver Fila',
          onPressed: () => _mostrarFilaImpressao(),
        ),
      ),
    );
  }

  void _imprimirAgora(Map<String, dynamic> variacao, Map<String, dynamic> produto, int quantidade) {
    // TODO: Implementar impressão imediata
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Imprimindo ${quantidade}x ${produto['nome']} ${variacao['nome']}'),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _mostrarFilaImpressao() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.dark800,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
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
                Icon(
                  PhosphorIcons.printer,
                  color: AppTheme.primary,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Text(
                  'Fila de Impressão (${_carrinho.length})',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            
            // Lista da fila de impressão
            if (_carrinho.isEmpty)
              const Text(
                'Fila de impressão vazia',
                style: TextStyle(
                  color: AppTheme.dark300,
                  fontSize: 16,
                ),
              )
            else
              Expanded(
                child: ListView.builder(
                  itemCount: _carrinho.length,
                  itemBuilder: (context, index) {
                    final item = _carrinho[index];
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
                                  '${item['produto']['nome']} ${item['variacao']['nome']}',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Text(
                                  'Qtd: ${item['quantidade']}',
                                  style: TextStyle(
                                    color: AppTheme.dark300,
                                    fontSize: 14,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () {
                              setState(() {
                                _carrinho.removeAt(index);
                              });
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
            
            // Botões de ação
            if (_carrinho.isNotEmpty) ...[
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        // Mostrar modal de confirmação antes de limpar
                        showDialog(
                          context: context,
                          builder: (context) => AlertDialog(
                            backgroundColor: AppTheme.dark800,
                            title: const Text(
                              'Confirmar Limpeza',
                              style: TextStyle(color: Colors.white),
                            ),
                            content: Text(
                              'Tem certeza que deseja limpar toda a fila de impressão?\n\nEsta ação não pode ser desfeita.',
                              style: TextStyle(color: AppTheme.dark300),
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context),
                                child: const Text(
                                  'Cancelar',
                                  style: TextStyle(color: AppTheme.dark300),
                                ),
                              ),
                              ElevatedButton(
                                onPressed: () {
                                  setState(() {
                                    _carrinho.clear();
                                  });
                                  Navigator.pop(context); // Fecha modal de confirmação
                                  Navigator.pop(context); // Fecha modal da fila
                                  
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Fila de impressão limpa com sucesso'),
                                      backgroundColor: Colors.green,
                                    ),
                                  );
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.red,
                                  foregroundColor: Colors.white,
                                ),
                                child: const Text('Confirmar'),
                              ),
                            ],
                          ),
                        );
                      },
                      child: const Text('Limpar Fila'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: BorderSide(color: Colors.red),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        // TODO: Implementar impressão em lote
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Imprimindo ${_carrinho.length} itens da fila'),
                            backgroundColor: AppTheme.primary,
                          ),
                        );
                        Navigator.pop(context);
                      },
                      child: const Text('Imprimir Tudo'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _mostrarModalVariacoes(Map<String, dynamic> produto) {
    // Estado para controlar as quantidades de cada variação
    Map<String, int> quantidades = {};
    
    // Estado para controlar a data de produção e validade
    DateTime dataProducao = DateTime.now();
    DateTime dataValidade = DateTime.now().add(Duration(days: produto['diasDeValidade']));
    
    // Estado para mostrar confirmação de item adicionado
    String? itemConfirmado;
    
    // Inicializar quantidade 1 para cada variação
    for (var variacao in produto['variacoes']) {
      quantidades[variacao['id']] = 1;
    }
    
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.dark800,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) {
          void incrementarQuantidade(String variacaoId) {
            setState(() {
              quantidades[variacaoId] = (quantidades[variacaoId] ?? 1) + 1;
            });
          }
          
          void decrementarQuantidade(String variacaoId) {
            if ((quantidades[variacaoId] ?? 1) > 1) {
              setState(() {
                quantidades[variacaoId] = (quantidades[variacaoId] ?? 1) - 1;
              });
            }
          }
          
          Future<void> _selecionarDataProducao() async {
            final DateTime? dataSelecionada = await showDatePicker(
              context: context,
              initialDate: dataProducao,
              firstDate: DateTime.now().subtract(const Duration(days: 365)),
              lastDate: DateTime.now(),
              locale: const Locale('pt', 'BR'),
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
            
            if (dataSelecionada != null) {
              setState(() {
                dataProducao = dataSelecionada;
                // Calcular automaticamente a data de validade
                dataValidade = dataSelecionada.add(Duration(days: produto['diasDeValidade']));
              });
            }
          }
          
          Future<void> _selecionarDataValidade() async {
            final DateTime? dataSelecionada = await showDatePicker(
              context: context,
              initialDate: dataValidade,
              firstDate: dataProducao,
              lastDate: dataProducao.add(const Duration(days: 365)),
              locale: const Locale('pt', 'BR'),
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
            
            if (dataSelecionada != null) {
              setState(() {
                dataValidade = dataSelecionada;
              });
            }
          }
          
          return Container(
            padding: const EdgeInsets.all(24),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Header
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
                  Text(
                    produto['nome'],
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Selecione a variação, quantidade e datas',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.dark300,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  
                  // Confirmação visual de item adicionado
                  if (itemConfirmado != null) ...[
                    const SizedBox(height: 16),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.green),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            PhosphorIcons.checkCircle,
                            color: Colors.green,
                            size: 20,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              itemConfirmado!,
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.green,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  
                  const SizedBox(height: 24),
                  
                  // Data de Produção
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.dark700,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.dark600),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Data de Produção',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.dark300,
                          ),
                        ),
                        const SizedBox(height: 12),
                        GestureDetector(
                          onTap: _selecionarDataProducao,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: AppTheme.dark600,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppTheme.primary),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  PhosphorIcons.calendar,
                                  color: AppTheme.primary,
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  '${dataProducao.day.toString().padLeft(2, '0')}/${dataProducao.month.toString().padLeft(2, '0')}/${dataProducao.year}',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.white,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const Spacer(),
                                Icon(
                                  PhosphorIcons.caretDown,
                                  color: AppTheme.primary,
                                  size: 16,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Data de Validade
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.dark700,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.primary),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              'Data de Validade',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.primary,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppTheme.primary.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '${produto['diasDeValidade']} dias',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        GestureDetector(
                          onTap: _selecionarDataValidade,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: AppTheme.dark600,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppTheme.primary),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  PhosphorIcons.calendar,
                                  color: AppTheme.primary,
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  '${dataValidade.day.toString().padLeft(2, '0')}/${dataValidade.month.toString().padLeft(2, '0')}/${dataValidade.year}',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.white,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const Spacer(),
                                Icon(
                                  PhosphorIcons.caretDown,
                                  color: AppTheme.primary,
                                  size: 16,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 20),
                  
                  // Variações
                  ...produto['variacoes'].map<Widget>((variacao) {
                    final variacaoId = variacao['id'];
                    final quantidade = quantidades[variacaoId] ?? 1;
                    
                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppTheme.dark700,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.dark600),
                      ),
                      child: Column(
                        children: [
                          // Nome da variação
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  variacao['nome'],
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          
                          const SizedBox(height: 16),
                          
                          // Seletor de quantidade
                          Row(
                            children: [
                              Expanded(
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    IconButton(
                                      onPressed: () => decrementarQuantidade(variacaoId),
                                      icon: Icon(
                                        PhosphorIcons.minus,
                                        color: quantidade > 1 ? AppTheme.primary : AppTheme.dark400,
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                                      decoration: BoxDecoration(
                                        color: AppTheme.dark600,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        quantidade.toString(),
                                        style: TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                    IconButton(
                                      onPressed: () => incrementarQuantidade(variacaoId),
                                      icon: Icon(
                                        PhosphorIcons.plus,
                                        color: AppTheme.primary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          
                          const SizedBox(height: 16),
                          
                          // Botões de ação
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () {
                                    _adicionarAoCarrinho(variacao, produto, quantidade);
                                    // Mostrar confirmação visual
                                    setState(() {
                                      itemConfirmado = '${variacao['nome']} adicionado à fila!';
                                    });
                                    // Limpar confirmação após 2 segundos
                                    Future.delayed(const Duration(seconds: 2), () {
                                      if (mounted) {
                                        setState(() {
                                          itemConfirmado = null;
                                        });
                                      }
                                    });
                                  },
                                  icon: const Icon(PhosphorIcons.printer, size: 16),
                                  label: const Text('Adicionar à Fila'),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppTheme.primary,
                                    side: BorderSide(color: AppTheme.primary),
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: () {
                                    _imprimirAgora(variacao, produto, quantidade);
                                    // Mostrar confirmação visual
                                    setState(() {
                                      itemConfirmado = '${variacao['nome']} enviado para impressão!';
                                    });
                                    // Limpar confirmação após 2 segundos
                                    Future.delayed(const Duration(seconds: 2), () {
                                      if (mounted) {
                                        setState(() {
                                          itemConfirmado = null;
                                        });
                                      }
                                    });
                                  },
                                  icon: const Icon(PhosphorIcons.printer, size: 16),
                                  label: const Text('Imprimir Agora'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.primary,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      body: SafeArea(
        child: Column(
          children: [
            // Header com botão voltar e título
            Container(
              width: double.infinity,
              color: AppTheme.dark900,
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
              child: Row(
                children: [
                  // Botão voltar sem fundo
                  HeaderButton(
                    iconPath: 'assets/icons/voltar.svg',
                    onTap: () => Navigator.pop(context),
                    size: 32,
                    tooltip: 'Voltar',
                  ),
                  
                  const SizedBox(width: 16),
                  
                  // Título
                  const Expanded(
                    child: Text(
                      'Rótulo',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  
                  // Ícone de impressora (fila) sem fundo
                  HeaderButton(
                    iconPath: 'assets/icons/impressora.svg',
                    onTap: _mostrarFilaImpressao,
                    size: 32,
                    tooltip: 'Fila de Impressão',
                  ),
                ],
              ),
            ),

            // Lista de produtos
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Busca e filtros
                    Column(
                      children: [
                        // Campo de Busca
                        TextField(
                          controller: _searchController,
                          onChanged: (value) => setState(() {}),
                          decoration: InputDecoration(
                            hintText: 'Buscar produtos...',
                            prefixIcon: const Icon(PhosphorIcons.magnifyingGlass, color: AppTheme.dark300),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(25),
                            ),
                            filled: true,
                            fillColor: AppTheme.dark800,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                          ),
                        ),

                        const SizedBox(height: 16),

                        // Filtro por categoria
                        DropdownButtonFormField<String>(
                          value: _selectedCategoria.isEmpty ? null : _selectedCategoria,
                          decoration: InputDecoration(
                            hintText: 'Categoria',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(25),
                            ),
                            filled: true,
                            fillColor: AppTheme.dark800,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                          ),
                          items: [
                            const DropdownMenuItem(value: '', child: Text('Todas as categorias')),
                            ...produtosProntos.map((produto) => produto['categoria']).toSet().map((categoria) => 
                              DropdownMenuItem(value: categoria, child: Text(categoria))
                            ),
                          ],
                          onChanged: (value) {
                            setState(() {
                              _selectedCategoria = value ?? '';
                            });
                          },
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    Text(
                      'Produtos Encontrados (${filteredProdutos.length})',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.dark300,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Expanded(
                      child: ListView.builder(
                        itemCount: filteredProdutos.length,
                        itemBuilder: (context, index) {
                          final produto = filteredProdutos[index];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            child: GestureDetector(
                              onTap: () => _mostrarModalVariacoes(produto),
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
                                    // Nome do produto
                                    Text(
                                      produto['nome'],
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                    
                                    const SizedBox(height: 12),
                                    
                                    // Categoria
                                    Row(
                                      children: [
                                        Icon(
                                          PhosphorIcons.tag,
                                          size: 16,
                                          color: AppTheme.dark300,
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          produto['categoria'],
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: AppTheme.dark300,
                                          ),
                                        ),
                                      ],
                                    ),
                                    
                                    const SizedBox(height: 12),
                                    
                                    // Variações disponíveis
                                    Text(
                                      '${produto['variacoes'].length} variações disponíveis',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: AppTheme.primary,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
