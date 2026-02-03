import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../providers/granobox_printer_provider.dart';
import '../providers/auth_provider.dart';
import '../models/granobox_printer_models.dart';
import '../widgets/print_modal.dart';
import '../services/hybrid_granobox_print_service.dart';
import '../models/print_result_models.dart';
import 'editar_impressora_screen.dart'; // ⭐ NOVO: Para editar impressora

/// Tela de configuração de impressoras 100% Granobox
/// 
/// Esta tela substitui a dependência do Tagment para impressoras,
/// mantendo apenas templates no Tagment.
class GranoboxPrintersScreen extends StatefulWidget {
  const GranoboxPrintersScreen({super.key});

  @override
  State<GranoboxPrintersScreen> createState() => _GranoboxPrintersScreenState();
}

class _GranoboxPrintersScreenState extends State<GranoboxPrintersScreen> {
  final Set<String> _testingPrinters = <String>{};
  final HybridGranoboxPrintService _hybridService = HybridGranoboxPrintService();
  
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final printerProvider = context.read<GranoboxPrinterProvider>();
    final authProvider = context.read<AuthProvider>();
    
    final token = await authProvider.authToken;
    final clientId = authProvider.user?.clientId;
    
    if (token != null && clientId != null) {
      await printerProvider.loadPrinters(
        token: token,
        clientId: clientId,
        forceRefresh: true,
      );
    }
  }

  Future<void> _testPrinter(GranoboxPrinter printer) async {
    if (_testingPrinters.contains(printer.id)) return;
    
    setState(() {
      _testingPrinters.add(printer.id);
    });
    
    try {
      final authProvider = context.read<AuthProvider>();
      final token = await authProvider.authToken;
      
      if (token == null) {
        throw Exception('Token de autenticação não encontrado');
      }
      
      print('🧪 Testando impressora ${printer.name}');
      
      // Mostrar modal de impressão
      final result = await showPrintModal(
        context: context,
        title: 'Testando Impressora',
        subtitle: printer.name,
        printFunction: (onProgress) async {
          final printResult = await _hybridService.testPrinter(
            granoboxToken: token,
            printer: printer,
          );
          // Converter PrintResult para TagmentPrintResult
          if (printResult.success) {
            return TagmentPrintResult.success(
              printResult.message,
              printResult.jobId ?? '',
              printResult.details,
            );
          } else {
            return TagmentPrintResult.error(
              printResult.message,
              printResult.errorDetails,
            );
          }
        },
        onSuccess: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Teste enviado para ${printer.name} com sucesso!'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 2),
            ),
          );
        },
        onError: () {
          print('❌ Erro no teste da impressora ${printer.name}');
        },
      );
      
      print('🖨️ Resultado do teste: ${result?.success} - ${result?.message}');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao testar impressora: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _testingPrinters.remove(printer.id);
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      appBar: AppBar(
        backgroundColor: AppTheme.dark800,
        title: const Text(
          'Impressoras Granobox',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        leading: IconButton(
          icon: const Icon(PhosphorIcons.arrowLeft, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(PhosphorIcons.arrowClockwise, color: Colors.white),
            onPressed: _loadData,
            tooltip: 'Atualizar',
          ),
          IconButton(
            icon: const Icon(PhosphorIcons.plus, color: Colors.white),
            onPressed: _showAddPrinterDialog,
            tooltip: 'Adicionar Impressora',
          ),
        ],
      ),
      body: Consumer<GranoboxPrinterProvider>(
        builder: (context, printerProvider, child) {
          if (printerProvider.isLoading) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: AppTheme.primary),
                  SizedBox(height: 16),
                  Text(
                    'Carregando impressoras...',
                    style: TextStyle(color: AppTheme.dark300),
                  ),
                ],
              ),
            );
          }

          if (printerProvider.error != null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      PhosphorIcons.warning,
                      color: Colors.red,
                      size: 64,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Erro ao carregar impressoras',
                      style: TextStyle(
                        color: Colors.red,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      printerProvider.error!,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppTheme.dark300,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: _loadData,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Tentar Novamente'),
                    ),
                  ],
                ),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: _loadData,
            color: AppTheme.primary,
            backgroundColor: AppTheme.dark800,
            child: Column(
              children: [
                // Resumo das configurações
                _buildConfigSummary(printerProvider),
                
                // Lista de impressoras
                Expanded(
                  child: printerProvider.printers.isEmpty
                      ? _buildEmptyState()
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: printerProvider.printers.length,
                          itemBuilder: (context, index) {
                            final printer = printerProvider.printers[index];
                            return _buildPrinterCard(printer, printerProvider);
                          },
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildConfigSummary(GranoboxPrinterProvider provider) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.dark800,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.dark700),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                PhosphorIcons.chartBar,
                color: AppTheme.primary,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Resumo das Impressoras',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildSummaryItem(
                  'Total',
                  '${provider.printers.length}',
                  PhosphorIcons.printer,
                ),
              ),
              Expanded(
                child: _buildSummaryItem(
                  'Online',
                  '${provider.onlinePrinters.length}',
                  PhosphorIcons.wifiHigh,
                ),
              ),
              Expanded(
                child: _buildSummaryItem(
                  'TCP',
                  '${provider.tcpPrinters.length}',
                  PhosphorIcons.globe,
                ),
              ),
              Expanded(
                child: _buildSummaryItem(
                  'Edge',
                  '${provider.edgePrinters.length}',
                  PhosphorIcons.cpu,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(
          icon,
          color: AppTheme.dark300,
          size: 16,
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            color: AppTheme.dark300,
            fontSize: 10,
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            PhosphorIcons.printer,
            color: AppTheme.dark300,
            size: 64,
          ),
          const SizedBox(height: 16),
          Text(
            'Nenhuma impressora encontrada',
            style: TextStyle(
              color: AppTheme.dark300,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Adicione uma impressora para começar.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppTheme.dark300,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _showAddPrinterDialog,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
            ),
            icon: const Icon(PhosphorIcons.plus),
            label: const Text('Adicionar Impressora'),
          ),
        ],
      ),
    );
  }

  Widget _buildPrinterCard(GranoboxPrinter printer, GranoboxPrinterProvider provider) {
    final isOnline = printer.isOnline;
    
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.dark800,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isOnline ? Colors.green : Colors.red,
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header da impressora
          Row(
            children: [
              Icon(
                printer.isEdgeGo ? PhosphorIcons.cpu : PhosphorIcons.printer,
                color: isOnline ? Colors.green : Colors.red,
                size: 24,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      printer.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (printer.brand != null || printer.model != null)
                      Text(
                        '${printer.brand ?? ''} ${printer.model ?? ''}'.trim(),
                        style: TextStyle(
                          color: AppTheme.dark300,
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ),
              // Status e botões
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isOnline ? Colors.green : Colors.red,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      printer.status.displayName.toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Botões de configuração
                  Row(
                    children: [
                      // Botão Validade
                      _buildConfigButton(
                        icon: PhosphorIcons.clock,
                        isActive: provider.validityPrinterId == printer.id,
                        onTap: () => _toggleValidityPrinter(printer, provider),
                      ),
                      const SizedBox(width: 6),
                      // Botão Rótulo
                      _buildConfigButton(
                        icon: PhosphorIcons.tag,
                        isActive: provider.labelPrinterId == printer.id,
                        onTap: () => _toggleLabelPrinter(printer, provider),
                      ),
                      const SizedBox(width: 6),
                      // Botão de editar
                      GestureDetector(
                        onTap: () => _showEditPrinterDialog(printer),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.dark600,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: AppTheme.dark500,
                              width: 1,
                            ),
                          ),
                          child: Icon(
                            PhosphorIcons.pencil,
                            color: AppTheme.dark300,
                            size: 20,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      // Botão de teste
                      GestureDetector(
                        onTap: isOnline && !_testingPrinters.contains(printer.id)
                            ? () => _testPrinter(printer)
                            : null,
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isOnline && !_testingPrinters.contains(printer.id)
                                ? AppTheme.primary
                                : AppTheme.dark600,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: _testingPrinters.contains(printer.id)
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                  ),
                                )
                              : Icon(
                                  PhosphorIcons.play,
                                  color: isOnline ? Colors.white : AppTheme.dark300,
                                  size: 20,
                                ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          // Tipo e uso
          Wrap(
            spacing: 8,
            runSpacing: 4,
            children: [
              _buildChip(printer.type.toUpperCase(), AppTheme.primary),
              ...printer.usage.map((usage) => _buildChip(
                usage.toUpperCase(), 
                usage == 'validity' ? Colors.orange : Colors.blue,
              )),
            ],
          ),
          
          const SizedBox(height: 12),
          
          // Informações de conexão
          if (printer.connection.host != null) ...[
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.dark700,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    printer.isEdgeGo ? PhosphorIcons.cpu : PhosphorIcons.wifiHigh,
                    color: AppTheme.dark300,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${printer.connection.host}:${printer.connection.port}',
                    style: TextStyle(
                      color: AppTheme.dark300,
                      fontSize: 12,
                      fontFamily: 'monospace',
                    ),
                  ),
                  if (printer.deviceId != null) ...[
                    const SizedBox(width: 8),
                    Text(
                      '(${printer.deviceId})',
                      style: TextStyle(
                        color: AppTheme.dark400,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],

          // Informações de offset
          if (printer.offsetX != 0 || printer.offsetY != 0) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: AppTheme.primary.withOpacity(0.3),
                  width: 1,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    PhosphorIcons.sliders,
                    color: AppTheme.primary,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Offset: X=${printer.offsetX.toStringAsFixed(1)}mm, Y=${printer.offsetY.toStringAsFixed(1)}mm',
                    style: TextStyle(
                      color: AppTheme.primary,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildConfigButton({
    required IconData icon,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isActive ? AppTheme.primary : AppTheme.dark600,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isActive ? AppTheme.primary : AppTheme.dark500,
            width: 1,
          ),
        ),
        child: Icon(
          icon,
          color: isActive ? Colors.white : AppTheme.dark300,
          size: 18,
        ),
      ),
    );
  }

  void _toggleValidityPrinter(GranoboxPrinter printer, GranoboxPrinterProvider provider) {
    if (provider.validityPrinterId == printer.id) {
      provider.setValidityPrinter(null);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Impressora de validade removida'),
          backgroundColor: Colors.orange,
        ),
      );
    } else {
      provider.setValidityPrinter(printer.id);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${printer.name} definida como impressora de validade'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  void _toggleLabelPrinter(GranoboxPrinter printer, GranoboxPrinterProvider provider) {
    if (provider.labelPrinterId == printer.id) {
      provider.setLabelPrinter(null);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Impressora de rótulo removida'),
          backgroundColor: Colors.orange,
        ),
      );
    } else {
      provider.setLabelPrinter(printer.id);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${printer.name} definida como impressora de rótulo'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  void _showAddPrinterDialog() {
    // TODO: Implementar dialog para adicionar impressora
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Funcionalidade em desenvolvimento'),
        backgroundColor: Colors.orange,
      ),
    );
  }

  /// Converter GranoboxPrinter para PrinterInfo (para compatibilidade com EditarImpressoraScreen)
  PrinterInfo _convertToPrinterInfo(GranoboxPrinter printer) {
    return PrinterInfo(
      id: printer.id,
      displayName: printer.name,
      status: printer.status.value,
      printsToday: 0,
      totalPrints: 0,
      lastSeenAt: printer.updatedAt,
      tags: printer.usage,
      connection: {
        'type': printer.connection.type,
        'host': printer.connection.host,
        'port': printer.connection.port,
        'protocol': printer.connection.protocol,
        'interface': printer.connection.interface,
        'printMethod': printer.connection.printMethod,
      },
      capabilities: printer.capabilities?.toJson(),
      offsetX: printer.offsetX,
      offsetY: printer.offsetY,
      edgeAgentFingerprint: printer.deviceId,
      edgeIp: printer.connection.host,
      edgePort: printer.connection.port,
      operationId: printer.operationId,
      interface: printer.connection.interface,
      printMethod: printer.connection.printMethod,
      isUSBPrinterFromBackend: printer.isUSBPrinter,
      brand: printer.brand,
      model: printer.model,
      location: printer.location,
    );
  }

  void _showEditPrinterDialog(GranoboxPrinter printer) {
    // Converter para PrinterInfo e navegar para tela de edição
    final printerInfo = _convertToPrinterInfo(printer);
    
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => EditarImpressoraScreen(impressora: printerInfo),
      ),
    ).then((result) {
      // Se a impressora foi editada, recarregar a lista
      if (result == true) {
        _loadData();
      }
    });
  }
}
