import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../components/form_input.dart';
import '../components/custom_icon.dart';
import '../components/header_button.dart';
import '../theme/app_theme.dart';

class EtiquetasScreen extends StatefulWidget {
  const EtiquetasScreen({super.key});

  @override
  State<EtiquetasScreen> createState() => _EtiquetasScreenState();
}

class _EtiquetasScreenState extends State<EtiquetasScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _sortBy = 'recentes';
  String _selectedTipo = '';
  String _selectedResponsavel = '';
  String _selectedConservacao = '';
  String _selectedStatus = '';
  
  // Dados da operação e operador
  String _operacaoAtual = 'Manu';
  String _operadorAtual = 'Gustavo L';

  // Dados mockados para demonstração
  final List<Map<String, dynamic>> etiquetas = [
    {
      'id': 1,
      'codigo': 'ETQ-001',
      'nome': 'Paracetamol 500mg',
      'categoria': 'Medicamentos',
      'segmento': 'Manipulado',
      'status': 'ativa',
      'dataCriacao': '2024-01-15',
      'quantidade': 150,
      'vencimento': '2025-01-15',
      'prioridade': 'alta'
    },
    {
      'id': 2,
      'codigo': 'ETQ-002',
      'nome': 'Dipirona 500mg',
      'categoria': 'Medicamentos',
      'segmento': 'Produto Final',
      'responsavel': 'João Silva',
      'conservacao': 'Seco',
      'status': 'ativa',
      'dataCriacao': '2024-01-16',
      'vencimento': '2025-01-16',
      'prioridade': 'média'
    },
    {
      'id': 3,
      'codigo': 'ETQ-003',
      'nome': 'Vitamina C 1000mg',
      'categoria': 'Suplementos',
      'segmento': 'Matéria Prima',
      'status': 'inativa',
      'dataCriacao': '2024-01-10',
      'quantidade': 80,
      'vencimento': '2024-12-10',
      'prioridade': 'baixa'
    },
    {
      'id': 4,
      'codigo': 'ETQ-004',
      'nome': 'Ibuprofeno 400mg',
      'categoria': 'Medicamentos',
      'segmento': 'Manipulado',
      'status': 'ativa',
      'dataCriacao': '2024-01-17',
      'quantidade': 100,
      'vencimento': '2025-01-17',
      'prioridade': 'média'
    },
    {
      'id': 5,
      'codigo': 'ETQ-005',
      'nome': 'Ômega 3 1000mg',
      'categoria': 'Suplementos',
      'segmento': 'Produto Final',
      'status': 'ativa',
      'dataCriacao': '2024-01-18',
      'quantidade': 120,
      'vencimento': '2025-01-18',
      'prioridade': 'baixa'
    }
  ];

  List<Map<String, dynamic>> get filteredEtiquetas {
    List<Map<String, dynamic>> filtered = etiquetas;
    
    // Filtro por busca
    if (_searchController.text.isNotEmpty) {
      filtered = filtered.where((etiqueta) {
        return etiqueta['nome'].toString().toLowerCase().contains(_searchController.text.toLowerCase()) ||
               etiqueta['codigo'].toString().toLowerCase().contains(_searchController.text.toLowerCase());
      }).toList();
    }
    
    // Filtro por tipo
    if (_selectedTipo.isNotEmpty) {
      filtered = filtered.where((etiqueta) => etiqueta['segmento'] == _selectedTipo).toList();
    }
    
    // Filtro por responsável
    if (_selectedResponsavel.isNotEmpty) {
      filtered = filtered.where((etiqueta) => etiqueta['responsavel'] == _selectedResponsavel).toList();
    }
    
    // Filtro por conservação
    if (_selectedConservacao.isNotEmpty) {
      filtered = filtered.where((etiqueta) => etiqueta['conservacao'] == _selectedConservacao).toList();
    }
    
    // Filtro por status
    if (_selectedStatus.isNotEmpty) {
      filtered = filtered.where((etiqueta) => etiqueta['status'] == _selectedStatus).toList();
    }
    
    // Ordenação
    switch (_sortBy) {
      case 'recentes':
        filtered.sort((a, b) => DateTime.parse(b['dataCriacao']).compareTo(DateTime.parse(a['dataCriacao'])));
        break;
      case 'antigas':
        filtered.sort((a, b) => DateTime.parse(a['dataCriacao']).compareTo(DateTime.parse(b['dataCriacao'])));
        break;
      case 'nome':
        filtered.sort((a, b) => a['nome'].toString().compareTo(b['nome'].toString()));
        break;
      case 'vencimento':
        filtered.sort((a, b) => DateTime.parse(a['vencimento']).compareTo(DateTime.parse(b['vencimento'])));
        break;
    }
    
    return filtered;
  }

  void _mostrarFiltros() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.dark800,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.8,
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Header
            Row(
              children: [
                Icon(
                  PhosphorIcons.funnel,
                  color: AppTheme.primary,
                  size: 28,
                ),
                const SizedBox(width: 12),
                const Text(
                  'Filtros e Busca',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(PhosphorIcons.x, color: Colors.white),
                ),
              ],
            ),
            const SizedBox(height: 20),
            
            // Conteúdo dos filtros
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    // Campo de Busca
                    TextField(
                      controller: _searchController,
                      onChanged: (value) => setState(() {}),
                      decoration: InputDecoration(
                        hintText: 'Buscar etiquetas...',
                        prefixIcon: const Icon(PhosphorIcons.magnifyingGlass, color: AppTheme.dark300),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        filled: true,
                        fillColor: AppTheme.dark700,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                      ),
                    ),
                    
                    const SizedBox(height: 20),
                    
                    // Filtro por segmento
                    DropdownButtonFormField<String>(
                      value: _selectedTipo.isEmpty ? null : _selectedTipo,
                      decoration: InputDecoration(
                        hintText: 'Segmento',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        filled: true,
                        fillColor: AppTheme.dark700,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                      ),
                      style: const TextStyle(color: Colors.white),
                      dropdownColor: AppTheme.dark700,
                      items: const [
                        DropdownMenuItem(value: 'Manipulado', child: Text('Manipulado')),
                        DropdownMenuItem(value: 'Produto Final', child: Text('Produto Final')),
                        DropdownMenuItem(value: 'Matéria Prima', child: Text('Matéria Prima')),
                      ],
                      onChanged: (value) {
                        setState(() {
                          _selectedTipo = value ?? '';
                        });
                      },
                    ),
                    
                    const SizedBox(height: 20),
                    
                    // Filtro por Responsável
                    DropdownButtonFormField<String>(
                      value: _selectedResponsavel.isEmpty ? null : _selectedResponsavel,
                      decoration: InputDecoration(
                        hintText: 'Responsável',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        filled: true,
                        fillColor: AppTheme.dark700,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                      ),
                      style: const TextStyle(color: Colors.white),
                      dropdownColor: AppTheme.dark700,
                      items: const [
                        DropdownMenuItem(value: '', child: Text('Todos os responsáveis')),
                        DropdownMenuItem(value: 'João Silva', child: Text('João Silva')),
                        DropdownMenuItem(value: 'Maria Santos', child: Text('Maria Santos')),
                        DropdownMenuItem(value: 'Pedro Costa', child: Text('Pedro Costa')),
                      ],
                      onChanged: (value) {
                        setState(() {
                          _selectedResponsavel = value ?? '';
                        });
                      },
                    ),
                    
                    const SizedBox(height: 20),
                    
                    // Filtro por Conservação
                    DropdownButtonFormField<String>(
                      value: _selectedConservacao.isEmpty ? null : _selectedConservacao,
                      decoration: InputDecoration(
                        hintText: 'Tipo de Conservação',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        filled: true,
                        fillColor: AppTheme.dark700,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                      ),
                      style: const TextStyle(color: Colors.white),
                      dropdownColor: AppTheme.dark700,
                      items: const [
                        DropdownMenuItem(value: '', child: Text('Todos os tipos')),
                        DropdownMenuItem(value: 'Seco', child: Text('Seco')),
                        DropdownMenuItem(value: 'Resfriado', child: Text('Resfriado')),
                        DropdownMenuItem(value: 'Congelado', child: Text('Congelado')),
                      ],
                      onChanged: (value) {
                        setState(() {
                          _selectedConservacao = value ?? '';
                        });
                      },
                    ),
                    
                    const SizedBox(height: 20),
                    
                    // Filtro por Status
                    DropdownButtonFormField<String>(
                      value: _selectedStatus.isEmpty ? null : _selectedStatus,
                      decoration: InputDecoration(
                        hintText: 'Status',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        filled: true,
                        fillColor: AppTheme.dark700,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                      ),
                      style: const TextStyle(color: Colors.white),
                      dropdownColor: AppTheme.dark700,
                      items: const [
                        DropdownMenuItem(value: '', child: Text('Todos os status')),
                        DropdownMenuItem(value: 'ativa', child: Text('Ativa')),
                        DropdownMenuItem(value: 'vencida', child: Text('Vencida')),
                        DropdownMenuItem(value: 'baixada', child: Text('Baixada')),
                      ],
                      onChanged: (value) {
                        setState(() {
                          _selectedStatus = value ?? '';
                        });
                      },
                    ),
                  ],
                ),
              ),
            ),
            
            // Botões de ação
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      setState(() {
                        _searchController.clear();
                        _selectedTipo = '';
                        _selectedResponsavel = '';
                        _selectedConservacao = '';
                        _selectedStatus = '';
                      });
                      Navigator.pop(context);
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.primary,
                      side: BorderSide(color: AppTheme.primary),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text('Limpar Filtros'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      setState(() {}); // Atualizar a lista filtrada
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text('Aplicar Filtros'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color getStatusColor(String status) {
    switch (status) {
      case 'ativa':
        return Colors.green;
      case 'inativa':
        return Colors.grey;
      case 'pendente':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  String formatarData(String data) {
    final date = DateTime.parse(data);
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      appBar: AppBar(
        backgroundColor: AppTheme.dark900,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            CustomIcon(
              iconPath: 'assets/icons/controle.svg',
              size: 28,
              color: AppTheme.primary,
            ),
            const SizedBox(width: 16),
            const Text(
              'Controle de Etiquetas',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const Spacer(),
            // Ícone de busca
            HeaderButton(
              icon: PhosphorIcons.magnifyingGlass,
              onTap: _mostrarModalBusca,
              size: 32,
              tooltip: 'Buscar',
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // Conteúdo principal ocupando toda a view
          Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 20), // Espaço maior na parte superior
                    // Cards de estatísticas com clique para filtrar
                    Row(
                      children: [
                        // Card: Ativas
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                _selectedStatus = 'ativa';
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppTheme.dark800,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: _selectedStatus == 'ativa' 
                                    ? Colors.green 
                                    : AppTheme.dark700,
                                  width: _selectedStatus == 'ativa' ? 2 : 1,
                                ),
                              ),
                              child: Column(
                                children: [
                                  // Linha superior: ícone à esquerda, número à direita
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      CustomIcon(
                                        iconPath: 'assets/icons/ativas.svg',
                                        size: 32,
                                        color: Colors.green,
                                      ),
                                      const Text(
                                        '142',
                                        style: TextStyle(
                                          fontSize: 22,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  // Linha inferior: label alinhado à esquerda
                                  const Align(
                                    alignment: Alignment.centerLeft,
                                    child: Text(
                                      'Ativas',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: AppTheme.dark300,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        
                        const SizedBox(width: 8),
                        
                        // Card: Vencidas
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                _selectedStatus = 'vencida';
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppTheme.dark800,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: _selectedStatus == 'vencida' 
                                    ? Colors.red 
                                    : AppTheme.dark700,
                                  width: _selectedStatus == 'vencida' ? 2 : 1,
                                ),
                              ),
                              child: Column(
                                children: [
                                  // Linha superior: ícone à esquerda, número à direita
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      CustomIcon(
                                        iconPath: 'assets/icons/vencida.svg',
                                        size: 32,
                                        color: Colors.red,
                                      ),
                                      const Text(
                                        '14',
                                        style: TextStyle(
                                          fontSize: 22,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  // Linha inferior: label alinhado à esquerda
                                  const Align(
                                    alignment: Alignment.centerLeft,
                                    child: Text(
                                      'Vencidas',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: AppTheme.dark300,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        
                        const SizedBox(width: 8),
                        
                        // Card: Alertas
                        Expanded(
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                _selectedStatus = 'pendente';
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppTheme.dark800,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: _selectedStatus == 'pendente' 
                                    ? Colors.orange 
                                    : AppTheme.dark700,
                                  width: _selectedStatus == 'pendente' ? 2 : 1,
                                ),
                              ),
                              child: Column(
                                children: [
                                  // Linha superior: ícone à esquerda, número à direita
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      CustomIcon(
                                        iconPath: 'assets/icons/alertas.svg',
                                        size: 32,
                                        color: Colors.orange,
                                      ),
                                      const Text(
                                        '8',
                                        style: TextStyle(
                                          fontSize: 22,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  // Linha inferior: label alinhado à esquerda
                                  const Align(
                                    alignment: Alignment.centerLeft,
                                    child: Text(
                                      'Alertas',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: AppTheme.dark300,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    // Botão para limpar filtro se algum estiver ativo
                    if (_selectedStatus.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedStatus = '';
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppTheme.primary),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  PhosphorIcons.x,
                                  size: 14,
                                  color: AppTheme.primary,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  'Limpar filtro',
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
                      ),
                    ],

                    const SizedBox(height: 24),
                    
                    // Lista de etiquetas em 2 colunas
                    Expanded(
                      child: GridView.builder(
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.8,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                        itemCount: filteredEtiquetas.length,
                        itemBuilder: (context, index) {
                          final etiqueta = filteredEtiquetas[index];
                          return Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppTheme.dark800,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppTheme.dark700),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Status indicator
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: etiqueta['status'] == 'ativa' 
                                          ? Colors.green.withOpacity(0.2)
                                          : Colors.red.withOpacity(0.2),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                          color: etiqueta['status'] == 'ativa' 
                                            ? Colors.green 
                                            : Colors.red,
                                          width: 1,
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            etiqueta['status'] == 'ativa' 
                                              ? PhosphorIcons.checkCircle 
                                              : PhosphorIcons.xCircle,
                                            size: 12,
                                            color: etiqueta['status'] == 'ativa' 
                                              ? Colors.green 
                                              : Colors.red,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            etiqueta['status'] == 'ativa' ? 'Ativa' : 'Vencida',
                                            style: TextStyle(
                                              fontSize: 10,
                                              color: etiqueta['status'] == 'ativa' 
                                                ? Colors.green 
                                                : Colors.red,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Icon(
                                      PhosphorIcons.tag,
                                      size: 16,
                                      color: AppTheme.dark300,
                                    ),
                                  ],
                                ),
                                
                                const SizedBox(height: 12),
                                
                                // Nome do produto
                                Expanded(
                                  child: Text(
                                    etiqueta['nome'],
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                    maxLines: 3,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                
                                const SizedBox(height: 8),
                                
                                // Data de vencimento
                                Row(
                                  children: [
                                    Icon(
                                      PhosphorIcons.calendar,
                                      size: 12,
                                      color: AppTheme.dark300,
                                    ),
                                    const SizedBox(width: 4),
                                    Expanded(
                                      child: Text(
                                        'Venc: ${etiqueta['vencimento']}',
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: AppTheme.dark300,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                                
                                const SizedBox(height: 4),
                                
                                // Segmento
                                Text(
                                  etiqueta['segmento'],
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: AppTheme.dark300,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
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
      // Botão fixo no footer para baixar etiqueta
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
        decoration: BoxDecoration(
          color: AppTheme.dark900,
        ),
        child: ElevatedButton.icon(
            onPressed: _mostrarModalBaixarEtiqueta,
            icon: const Icon(PhosphorIcons.fileX, size: 24),
            label: const Text(
              'Baixar Etiqueta',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
        ),
      ),
    );
  }

  void _mostrarModalBaixarEtiqueta() {
    final TextEditingController codigoController = TextEditingController();
    
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => Dialog(
        backgroundColor: AppTheme.dark800,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        child: Container(
          padding: const EdgeInsets.all(24),
          constraints: const BoxConstraints(maxWidth: 400),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Ícone grande de QR Code
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(60),
                  border: Border.all(
                    color: AppTheme.primary.withOpacity(0.3),
                    width: 2,
                  ),
                ),
                child: Icon(
                  PhosphorIcons.qrCode,
                  size: 60,
                  color: AppTheme.primary,
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Título
              const Text(
                'Baixar Etiqueta',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 12),
              
              // Texto explicativo
              Text(
                'Escaneie o QR Code da etiqueta ou digite o código manualmente',
                style: TextStyle(
                  fontSize: 16,
                  color: AppTheme.dark300,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 32),
              
              // Campo de código com ícone de câmera
              FormInput(
                controller: codigoController,
                hintText: 'Digite o código da etiqueta...',
                suffixIcon: PhosphorIcons.camera,
                onSuffixIconTap: () => _abrirCamera(codigoController),
                onChanged: (value) {
                  // Atualizar em tempo real se necessário
                },
              ),
              
              const SizedBox(height: 24),
              
              // Botões de ação
              Row(
                children: [
                  // Botão Cancelar
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppTheme.dark300,
                        side: BorderSide(color: AppTheme.dark600),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Cancelar'),
                    ),
                  ),
                  
                  const SizedBox(width: 16),
                  
                  // Botão Dar Baixa
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        if (codigoController.text.trim().isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Digite o código da etiqueta ou escaneie o QR Code'),
                              backgroundColor: Colors.red,
                            ),
                          );
                          return;
                        }
                        
                        // TODO: Implementar dar baixa na etiqueta
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Dando baixa na etiqueta: ${codigoController.text}'),
                            backgroundColor: AppTheme.primary,
                          ),
                        );
                        
                        Navigator.pop(context);
                      },
                      icon: const Icon(PhosphorIcons.fileX, size: 18),
                      label: const Text('Dar Baixa'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.dark900,
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
        ),
      ),
    );
  }

  void _abrirCamera(TextEditingController codigoController) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => _CameraQRScreen(
          onCodeScanned: (String code) {
            codigoController.text = code;
            Navigator.of(context).pop();
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('QR Code lido: $code'),
                backgroundColor: AppTheme.primary,
              ),
            );
          },
        ),
      ),
    );
  }

  void _mostrarModalBusca() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.dark900,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle do modal
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppTheme.dark600,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              
              // Título
              const Text(
                'Buscar Etiquetas',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 20),
              
              // Campo de busca
              FormInput(
                controller: _searchController,
                hintText: 'Digite o nome ou código da etiqueta...',
                onChanged: (value) {
                  setState(() {});
                },
              ),
              const SizedBox(height: 20),
              
              // Lista de resultados
              Expanded(
                child: _buildListaResultados(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildListaResultados() {
    final query = _searchController.text.toLowerCase();
    final resultados = etiquetas.where((etiqueta) {
      return etiqueta['nome'].toString().toLowerCase().contains(query) ||
             etiqueta['codigo'].toString().toLowerCase().contains(query);
    }).toList();

    if (query.isEmpty) {
      return const Center(
        child: Text(
          'Digite algo para buscar...',
          style: TextStyle(
            color: AppTheme.dark300,
            fontSize: 16,
          ),
        ),
      );
    }

    if (resultados.isEmpty) {
      return const Center(
        child: Text(
          'Nenhuma etiqueta encontrada',
          style: TextStyle(
            color: AppTheme.dark300,
            fontSize: 16,
          ),
        ),
      );
    }

    return ListView.builder(
      itemCount: resultados.length,
      itemBuilder: (context, index) {
        final etiqueta = resultados[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.dark700,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.dark600),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      etiqueta['nome'],
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: etiqueta['status'] == 'ativa' 
                          ? Colors.green.withOpacity(0.2)
                          : Colors.red.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: etiqueta['status'] == 'ativa' 
                            ? Colors.green 
                            : Colors.red,
                      ),
                    ),
                    child: Text(
                      etiqueta['status'].toUpperCase(),
                      style: TextStyle(
                        color: etiqueta['status'] == 'ativa' 
                            ? Colors.green 
                            : Colors.red,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Código: ${etiqueta['codigo']}',
                style: TextStyle(
                  color: AppTheme.dark300,
                  fontSize: 14,
                ),
              ),
              Text(
                'Categoria: ${etiqueta['categoria']}',
                style: TextStyle(
                  color: AppTheme.dark300,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}

class _CameraQRScreen extends StatefulWidget {
  final Function(String) onCodeScanned;

  const _CameraQRScreen({required this.onCodeScanned});

  @override
  State<_CameraQRScreen> createState() => _CameraQRScreenState();
}

class _CameraQRScreenState extends State<_CameraQRScreen> {
  bool _isScanning = true;
  final MobileScannerController controller = MobileScannerController();

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text(
          'Escaneie o QR Code',
          style: TextStyle(color: Colors.white),
        ),
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: controller,
            onDetect: (BarcodeCapture capture) {
              if (_isScanning && capture.barcodes.isNotEmpty) {
                final String? code = capture.barcodes.first.rawValue;
                if (code != null && code.isNotEmpty) {
                  setState(() {
                    _isScanning = false;
                  });
                  widget.onCodeScanned(code);
                }
              }
            },
          ),
          // Overlay com área de foco
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(
                  color: AppTheme.primary,
                  width: 3,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          // Instruções
          Positioned(
            bottom: 100,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(20),
              child: const Text(
                'Posicione o QR Code dentro da área destacada',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
