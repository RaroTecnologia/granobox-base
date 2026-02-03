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
  String _selectedStatus = '';
  
  // Dados da operação e operador
  String _operacaoAtual = 'Manu';
  String _operadorAtual = 'Gustavo L';

  // Dados mockados para demonstração (igual ao web-vite)
  final List<Map<String, dynamic>> etiquetas = [
    {
      'id': 'ETQ-001',
      'code': 'ABC123',
      'product': {
        'name': 'Massa Pão Brioche',
        'code': 'MAN001'
      },
      'quantity': 5,
      'unit': 'KG',
      'productionDate': '2025-09-19',
      'validityDate': '2025-09-26',
      'status': 'printed',
      'createdAt': '2025-09-19T14:30:00Z',
      'metadata': {
        'isUsed': false,
        'conservacao': 'ambiente'
      }
    },
    {
      'id': 'ETQ-002', 
      'code': 'DEF456',
      'product': {
        'name': 'Pão Integral',
        'code': '002F'
      },
      'quantity': 10,
      'unit': 'UN',
      'productionDate': '2025-09-19',
      'validityDate': '2025-10-19',
      'status': 'printed',
      'createdAt': '2025-09-19T15:45:00Z',
      'metadata': {
        'isUsed': true,
        'usedAt': '2025-09-20T10:15:00Z',
        'conservacao': 'refrigerado'
      }
    },
    {
      'id': 'ETQ-003',
      'code': 'GHI789', 
      'product': {
        'name': 'Bolo de Chocolate',
        'code': 'BOL001'
      },
      'quantity': 2,
      'unit': 'UN',
      'productionDate': '2025-09-18',
      'validityDate': '2025-12-18',
      'status': 'pending',
      'createdAt': '2025-09-18T16:20:00Z',
      'metadata': {
        'isUsed': false,
        'conservacao': 'congelado'
      }
    },
  ];

  List<Map<String, dynamic>> get filteredEtiquetas {
    var filtered = etiquetas.where((etiqueta) {
      if (_searchController.text.isNotEmpty) {
        return etiqueta['product']['name'].toString().toLowerCase().contains(_searchController.text.toLowerCase()) ||
               etiqueta['code'].toString().toLowerCase().contains(_searchController.text.toLowerCase()) ||
               etiqueta['id'].toString().toLowerCase().contains(_searchController.text.toLowerCase());
      }
      return true;
    }).toList();
    
    // Filtro por status
    if (_selectedStatus.isNotEmpty) {
      filtered = filtered.where((etiqueta) {
        if (_selectedStatus == 'used') {
          return etiqueta['metadata']['isUsed'] == true;
        } else if (_selectedStatus == 'printed') {
          return etiqueta['status'] == 'printed' && etiqueta['metadata']['isUsed'] == false;
        } else {
          return etiqueta['status'] == _selectedStatus && etiqueta['metadata']['isUsed'] == false;
        }
      }).toList();
    }
    
    // Ordenação
    switch (_sortBy) {
      case 'recentes':
        filtered.sort((a, b) => DateTime.parse(b['createdAt']).compareTo(DateTime.parse(a['createdAt'])));
        break;
      case 'antigas':
        filtered.sort((a, b) => DateTime.parse(a['createdAt']).compareTo(DateTime.parse(b['createdAt'])));
        break;
      case 'nome':
        filtered.sort((a, b) => a['product']['name'].toString().compareTo(b['product']['name'].toString()));
        break;
      case 'vencimento':
        filtered.sort((a, b) => DateTime.parse(a['validityDate']).compareTo(DateTime.parse(b['validityDate'])));
        break;
    }
    
    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      body: Column(
        children: [
          // Header (mantido igual ao original)
          Container(
            color: AppTheme.dark800,
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
            child: SafeArea(
              bottom: false,
              child: Column(
                children: [
                  // Header principal
                  Row(
                    children: [
                      // Botão voltar
                    HeaderButton(
                      iconPath: 'assets/icons/voltar.svg',
                        onTap: () => Navigator.pop(context),
                      size: 32,
                      color: Colors.white,
                        tooltip: 'Voltar',
                      ),
                      const SizedBox(width: 16),
                      
                      // Ícone e título
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Icon(
                          PhosphorIcons.tag,
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
                              'Controle de Etiquetas',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            Text(
                              'Gerencie suas etiquetas impressas',
                              style: TextStyle(
                                fontSize: 14,
                                color: AppTheme.dark400,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Barra de busca e filtros
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 40,
                          decoration: BoxDecoration(
                            color: AppTheme.dark700,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppTheme.dark600),
                          ),
                          child: TextField(
                            controller: _searchController,
                            onChanged: (value) => setState(() {}),
                            style: const TextStyle(color: Colors.white, fontSize: 14),
                            decoration: InputDecoration(
                              hintText: 'Buscar etiquetas...',
                              hintStyle: TextStyle(color: AppTheme.dark400, fontSize: 14),
                              prefixIcon: Icon(
                                PhosphorIcons.magnifyingGlass,
                                color: AppTheme.dark400,
                                size: 16,
                              ),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              isDense: true,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      _buildFilterButton(),
                    ],
                  ),
                ],
              ),
            ),
          ),
          
          // Conteúdo principal - Cards redesenhados
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: filteredEtiquetas.isEmpty
                  ? _buildEmptyState()
                  : GridView.builder(
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 1,
                        childAspectRatio: 2.5,
                        mainAxisSpacing: 12,
                      ),
                      itemCount: filteredEtiquetas.length,
                      itemBuilder: (context, index) {
                        final etiqueta = filteredEtiquetas[index];
                        return _buildEtiquetaCard(etiqueta);
                      },
                    ),
            ),
          ),
        ],
      ),
      
      // Botão fixo no footer (mantido igual ao original)
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

  Widget _buildEtiquetaCard(Map<String, dynamic> etiqueta) {
    final isUsed = etiqueta['metadata']['isUsed'] == true;
    final diasVencimento = _calcularDiasVencimento(etiqueta['validityDate']);
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.dark800,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.dark700),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header do Card
          Row(
            children: [
              // Status badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _getStatusColor(etiqueta).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _getStatusColor(etiqueta)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _getStatusIcon(etiqueta),
                      size: 12,
                      color: _getStatusColor(etiqueta),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _getStatusText(etiqueta),
                      style: TextStyle(
                        fontSize: 10,
                        color: _getStatusColor(etiqueta),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              
              const Spacer(),
              
              // Botão de ação
              _buildActionButton(etiqueta),
            ],
          ),
          
          const SizedBox(height: 12),
          
          // Informações do Produto
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      etiqueta['product']['name'],
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      etiqueta['code'],
                      style: TextStyle(
                        fontSize: 12,
                        fontFamily: 'monospace',
                        color: AppTheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Detalhes laterais
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  _buildDetailRow('Quantidade:', '${etiqueta['quantity']} ${etiqueta['unit']}'),
                  _buildDetailRow('Produção:', _formatarData(etiqueta['productionDate'])),
                  _buildDetailRow('Validade:', _formatarData(etiqueta['validityDate'])),
                  if (!isUsed)
                    _buildDetailRow('Vencimento:', _getVencimentoText(diasVencimento), 
                      color: _getVencimentoColor(diasVencimento)),
                  if (isUsed && etiqueta['metadata']['usedAt'] != null)
                    _buildDetailRow('Baixa:', _formatarData(etiqueta['metadata']['usedAt']), 
                      color: Colors.green),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              color: AppTheme.dark400,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 10,
              color: color ?? Colors.white,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(Map<String, dynamic> etiqueta) {
    final isUsed = etiqueta['metadata']['isUsed'] == true;
    
    if (etiqueta['status'] == 'pending') {
      return Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppTheme.primary,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          PhosphorIcons.printer,
          size: 16,
          color: Colors.white,
        ),
      );
    } else if (isUsed) {
      return Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.green,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          PhosphorIcons.eye,
          size: 16,
          color: Colors.white,
        ),
      );
    } else {
      return Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.blue,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          PhosphorIcons.qrCode,
          size: 16,
          color: Colors.white,
        ),
      );
    }
  }

  Widget _buildFilterButton() {
    return GestureDetector(
      onTap: _mostrarFiltros,
      child: Container(
        height: 40,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: AppTheme.primary,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              PhosphorIcons.funnel,
              color: Colors.white,
              size: 16,
            ),
            const SizedBox(width: 6),
            Text(
              'Filtros',
              style: TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            PhosphorIcons.tag,
            size: 64,
            color: AppTheme.dark600,
          ),
          const SizedBox(height: 16),
          Text(
            'Nenhuma etiqueta encontrada',
            style: TextStyle(
              fontSize: 18,
              color: AppTheme.dark300,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tente ajustar os filtros ou criar uma nova etiqueta',
            style: TextStyle(
              fontSize: 14,
              color: AppTheme.dark400,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  // Funções auxiliares
  Color _getStatusColor(Map<String, dynamic> etiqueta) {
    final isUsed = etiqueta['metadata']['isUsed'] == true;
    if (isUsed) return Colors.green;
    
    switch (etiqueta['status']) {
      case 'pending':
        return Colors.orange;
      case 'printed':
        return Colors.blue;
      default:
        return AppTheme.dark400;
    }
  }

  IconData _getStatusIcon(Map<String, dynamic> etiqueta) {
    final isUsed = etiqueta['metadata']['isUsed'] == true;
    if (isUsed) return PhosphorIcons.checkCircle;
    
    switch (etiqueta['status']) {
      case 'pending':
        return PhosphorIcons.clock;
      case 'printed':
        return PhosphorIcons.printer;
      default:
        return PhosphorIcons.question;
    }
  }

  String _getStatusText(Map<String, dynamic> etiqueta) {
    final isUsed = etiqueta['metadata']['isUsed'] == true;
    if (isUsed) return 'Utilizada';
    
    switch (etiqueta['status']) {
      case 'pending':
        return 'Pendente';
      case 'printed':
        return 'Impressa';
      default:
        return 'Desconhecido';
    }
  }

  int _calcularDiasVencimento(String dataValidade) {
    final agora = DateTime.now();
    // Normalizar para meia-noite para comparar apenas as datas
    final hoje = DateTime(agora.year, agora.month, agora.day);
    final vencimento = DateTime.parse(dataValidade);
    // Normalizar a data de vencimento para meia-noite
    final vencimentoNormalizado = DateTime(vencimento.year, vencimento.month, vencimento.day);
    final diferenca = vencimentoNormalizado.difference(hoje).inDays;
    return diferenca;
  }

  Color _getVencimentoColor(int dias) {
    if (dias < 0) return Colors.red;
    if (dias <= 7) return Colors.orange;
    if (dias <= 30) return Colors.yellow;
    return Colors.green;
  }

  String _getVencimentoText(int dias) {
    if (dias < 0) return 'Venceu há ${dias.abs()} dias';
    if (dias == 0) return 'Vence hoje';
    if (dias == 1) return 'Vence amanhã';
    return 'Vence em $dias dias';
  }

  String _formatarData(String data) {
    final date = DateTime.parse(data);
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
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
        height: MediaQuery.of(context).size.height * 0.6,
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
                  'Filtros',
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
            
            // Filtros de status
            Wrap(
              spacing: 8,
              children: [
                _buildStatusFilter('Todas', ''),
                _buildStatusFilter('Pendentes', 'pending'),
                _buildStatusFilter('Impressas', 'printed'),
                _buildStatusFilter('Utilizadas', 'used'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusFilter(String label, String value) {
    final isSelected = _selectedStatus == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedStatus = value;
        });
        Navigator.pop(context);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary : AppTheme.dark700,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppTheme.primary : AppTheme.dark600,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppTheme.dark300,
            fontSize: 14,
            fontWeight: FontWeight.w600,
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
                onSuffixIconTap: () {
                  Navigator.pop(context);
                  _mostrarScannerQR(codigoController);
                },
              ),
              
              const SizedBox(height: 24),
              
              // Botões
              Row(
                children: [
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
                      onPressed: () {
                        if (codigoController.text.isNotEmpty) {
                          _processarBaixaEtiqueta(codigoController.text);
                          Navigator.pop(context);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Confirmar',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
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

  void _mostrarScannerQR(TextEditingController controller) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          height: 400,
          decoration: BoxDecoration(
            color: AppTheme.dark800,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Icon(
                      PhosphorIcons.qrCode,
                      color: AppTheme.primary,
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        'Escaneie o QR Code',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(PhosphorIcons.x, color: Colors.white),
                    ),
                  ],
                ),
              ),
              
              // Scanner
              Expanded(
                child: Container(
                  margin: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.primary),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: MobileScanner(
                      onDetect: (capture) {
                        final List<Barcode> barcodes = capture.barcodes;
                        for (final barcode in barcodes) {
                          if (barcode.rawValue != null) {
                            controller.text = barcode.rawValue!;
                            Navigator.pop(context);
                            _processarBaixaEtiqueta(barcode.rawValue!);
                            break;
                          }
                        }
                      },
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _processarBaixaEtiqueta(String codigo) {
    // TODO: Implementar lógica de baixa da etiqueta
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Baixa realizada para etiqueta: $codigo'),
        backgroundColor: Colors.green,
      ),
    );
  }
}

