import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:intl/intl.dart';

import '../providers/auth_provider.dart';
import '../providers/operators_provider.dart';
import '../providers/labels_provider.dart'; // ✅ NOVO
import '../services/labels_service.dart';
import '../models/label_history_models.dart';

class EtiquetaHistoricoScreen extends StatefulWidget {
  final String labelId;
  final String labelCode;

  const EtiquetaHistoricoScreen({
    super.key,
    required this.labelId,
    required this.labelCode,
  });

  @override
  State<EtiquetaHistoricoScreen> createState() => _EtiquetaHistoricoScreenState();
}

class _EtiquetaHistoricoScreenState extends State<EtiquetaHistoricoScreen> {
  final LabelsService _labelsService = LabelsService();
  List<LabelHistoryEvent> _historico = [];
  Map<String, dynamic>? _labelData; // ✅ NOVO: Dados completos da etiqueta
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _carregarHistorico();
    _carregarDadosEtiqueta(); // ✅ NOVO
  }

  Future<void> _carregarHistorico() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final auth = context.read<AuthProvider>();
      final token = await auth.authToken;

      final historyData = await _labelsService.getLabelHistory(widget.labelId, authToken: token);
      
      setState(() {
        _historico = historyData
            .map((json) => LabelHistoryEvent.fromJson(json))
            .toList();
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar histórico';
        _loading = false;
      });
      print('❌ Erro ao carregar histórico: $e');
    }
  }

  // ✅ NOVO: Carregar dados completos da etiqueta
  Future<void> _carregarDadosEtiqueta() async {
    try {
      final labelsProvider = context.read<LabelsProvider>();
      
      // Buscar a etiqueta na lista do provider
      final etiqueta = labelsProvider.etiquetas.firstWhere(
        (e) => e['id'] == widget.labelId,
        orElse: () => <String, dynamic>{},
      );

      if (etiqueta.isNotEmpty) {
        setState(() {
          _labelData = etiqueta;
        });
      }
    } catch (e) {
      print('❌ Erro ao carregar dados da etiqueta: $e');
    }
  }

  String _formatarData(DateTime data) {
    return DateFormat('dd/MM/yyyy HH:mm').format(data);
  }

  String _formatarDataRelativa(DateTime data) {
    final now = DateTime.now();
    final diff = now.difference(data);

    if (diff.inMinutes < 1) {
      return 'Agora';
    } else if (diff.inMinutes < 60) {
      return 'Há ${diff.inMinutes}min';
    } else if (diff.inHours < 24) {
      return 'Há ${diff.inHours}h';
    } else if (diff.inDays == 1) {
      return 'Ontem';
    } else if (diff.inDays < 7) {
      return 'Há ${diff.inDays} dias';
    } else {
      return DateFormat('dd/MM').format(data);
    }
  }

  String? _obterConservacao(Map<String, dynamic>? metadata) {
    if (metadata == null) return null;
    final conservacao = metadata['conservacao'] ?? metadata['conservationType'];
    switch (conservacao) {
      case 'ambiente':
        return 'Ambiente';
      case 'refrigerado':
        return 'Refrigerado';
      case 'congelado':
        return 'Congelado';
      case 'validade_original':
        return 'Validade Original';
      default:
        return null;
    }
  }

  IconData _getTipoIcon(String tipoVisual) {
    switch (tipoVisual) {
      case 'criacao':
        return PhosphorIcons.package;
      case 'impressao':
        return PhosphorIcons.printer;
      case 'baixada':
        return PhosphorIcons.checkCircle; // ⭐ Ícone verde para baixadas
      case 'consulta':
        return PhosphorIcons.eye;
      case 'alteracao':
        return PhosphorIcons.fileText;
      case 'arquivamento':
        return PhosphorIcons.archive;
      default:
        return PhosphorIcons.clock;
    }
  }

  Color _getTipoColor(String tipoVisual) {
    switch (tipoVisual) {
      case 'criacao':
        return Colors.green;
      case 'impressao':
        return Colors.blue;
      case 'baixada':
        return Colors.green; // ⭐ Verde para baixadas
      case 'consulta':
        return Colors.purple;
      case 'alteracao':
        return Colors.orange;
      case 'arquivamento':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final operatorsProvider = context.watch<OperatorsProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFF1A1A1A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1F1F1F),
        elevation: 0,
        leading: IconButton(
          icon: Icon(PhosphorIcons.arrowLeft, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Histórico da Etiqueta',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: false,
      ),
      body: _loading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF10B981)),
              ),
            )
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        PhosphorIcons.warningCircle,
                        size: 64,
                        color: Colors.red.shade400,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _error!,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        onPressed: _carregarHistorico,
                        icon: Icon(PhosphorIcons.arrowClockwise),
                        label: const Text('Tentar Novamente'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF10B981),
                        ),
                      ),
                    ],
                  ),
                )
              : _historico.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            PhosphorIcons.clockCounterClockwise,
                            size: 64,
                            color: const Color(0xFF6B7280),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'Nenhum evento registrado',
                            style: TextStyle(
                              color: Color(0xFF9CA3AF),
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    )
                  : SafeArea(
                      bottom: true,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _historico.length + 1, // +1 para o card mockup
                        separatorBuilder: (context, index) => const SizedBox(height: 16),
                        itemBuilder: (context, index) {
                          // Primeiro item: Card mockup da etiqueta
                          if (index == 0) {
                            return _buildLabelMockupCard();
                          }
                          
                          // Demais itens: eventos (-1 porque adicionamos o mockup)
                          final evento = _historico[index - 1];
                        final tipoColor = _getTipoColor(evento.tipoVisual);
                        final tipoIcon = _getTipoIcon(evento.tipoVisual);

                        // Buscar nome do operador
                        String operadorNome = '—';
                        if (evento.userId != null) {
                          final operador = operatorsProvider.operators
                              .where((op) => op.id == evento.userId)
                              .firstOrNull;
                          if (operador != null) {
                            operadorNome = operador.name;
                          }
                        }

                        // Extrair informações úteis
                        final conservacao = _obterConservacao(evento.metadata);
                        final produto = evento.metadata?['produto'] ?? evento.metadata?['nome_produto'];
                        final responsavel = evento.metadata?['responsavel'];

                        return Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFF2A2A2A),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: tipoColor.withOpacity(0.3),
                              width: 2,
                            ),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Header com ícone e tipo
                                Row(
                                  children: [
                                    Container(
                                      width: 48,
                                      height: 48,
                                      decoration: BoxDecoration(
                                        color: tipoColor.withOpacity(0.15),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Icon(
                                        tipoIcon,
                                        color: tipoColor,
                                        size: 24,
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            evento.tipoTraduzido,
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 20,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            _formatarDataRelativa(evento.createdAt),
                                            style: TextStyle(
                                              color: tipoColor.withOpacity(0.8),
                                              fontSize: 14,
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                
                                const SizedBox(height: 16),
                                
                                // Informações principais
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF1F1F1F),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    children: [
                                      // Data completa
                                      _buildInfoRow(
                                        PhosphorIcons.calendar,
                                        'Data/Hora',
                                        _formatarData(evento.createdAt),
                                      ),
                                      
                                      // Operador
                                      const SizedBox(height: 12),
                                      _buildInfoRow(
                                        PhosphorIcons.user,
                                        'Operador',
                                        operadorNome,
                                      ),
                                      
                                      // Conservação (se houver)
                                      if (conservacao != null) ...[
                                        const SizedBox(height: 12),
                                        _buildInfoRow(
                                          PhosphorIcons.thermometer,
                                          'Conservação',
                                          conservacao,
                                        ),
                                      ],
                                      
                                      // Produto (se houver)
                                      if (produto != null) ...[
                                        const SizedBox(height: 12),
                                        _buildInfoRow(
                                          PhosphorIcons.package,
                                          'Produto',
                                          produto.toString(),
                                        ),
                                      ],
                                      
                                      // Responsável (se houver e diferente do operador)
                                      if (responsavel != null && responsavel != operadorNome) ...[
                                        const SizedBox(height: 12),
                                        _buildInfoRow(
                                          PhosphorIcons.userCircle,
                                          'Responsável',
                                          responsavel.toString(),
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                        },
                      ),
                    ),
    );
  }

  Widget _buildLabelMockupCard() {
    if (_labelData == null) {
      // Card simples quando não tem dados
      return Container(
        decoration: BoxDecoration(
          color: const Color(0xFF2A2A2A),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF10B981), width: 2),
        ),
        padding: const EdgeInsets.all(20),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(PhosphorIcons.barcode, color: Color(0xFF10B981), size: 32),
            const SizedBox(width: 16),
            Text(
              widget.labelCode,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.bold,
                letterSpacing: 2,
              ),
            ),
          ],
        ),
      );
    }

    // Extrair dados da etiqueta
    final metadata = Map<String, dynamic>.from(_labelData!['metadata'] ?? {});
    final productName = _labelData!['product']?['name'] ?? metadata['produto'] ?? metadata['nome_produto'] ?? 'Produto';
    final conservacao = _obterConservacao(metadata);
    
    // ✅ CORRIGIDO: Pegar peso/quantidade do PRODUTO (metadata), não quantidade de etiquetas
    final pesoQtd = metadata['peso'] ?? metadata['quantidade'] ?? _labelData!['weight'] ?? _labelData!['quantity'] ?? '';
    final unidade = (metadata['unidade'] ?? _labelData!['unit'] ?? '').toString().toUpperCase();
    
    final validadeStr = _labelData!['validityDate']?.toString() ?? '';
    final manipulacaoStr = _labelData!['productionDate']?.toString() ?? '';
    final responsavel = metadata['responsavel'] ?? '—';
    
    // Formatar datas
    String validade = '—';
    String manipulacao = '—';
    try {
      if (validadeStr.isNotEmpty) {
        final validadeDate = DateTime.parse(validadeStr);
        validade = DateFormat('dd/MM/yyyy').format(validadeDate);
      }
      if (manipulacaoStr.isNotEmpty) {
        final manipulacaoDate = DateTime.parse(manipulacaoStr);
        manipulacao = DateFormat('dd/MM/yyyy').format(manipulacaoDate);
      }
    } catch (e) {
      print('Erro ao formatar datas: $e');
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF10B981), width: 3),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF10B981).withOpacity(0.2),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header com código
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                widget.labelCode,
                style: const TextStyle(
                  color: Colors.black,
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 3,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          const Divider(height: 1, color: Colors.black26),
          const SizedBox(height: 16),
          
          // Produto
          _buildMockupRow('Produto', productName, PhosphorIcons.package),
          const SizedBox(height: 12),
          
          // Conservação
          if (conservacao != null) ...[
            _buildMockupRow('Conservação', conservacao, PhosphorIcons.thermometer),
            const SizedBox(height: 12),
          ],
          
          // Peso/Quantidade
          if (pesoQtd.toString().isNotEmpty && pesoQtd.toString() != 'null' && pesoQtd.toString() != '') ...[
            _buildMockupRow('Peso/Qtd', '${pesoQtd.toString()} $unidade', PhosphorIcons.scales),
            const SizedBox(height: 12),
          ],
          
          // Manipulação
          _buildMockupRow('Manipulação', manipulacao, PhosphorIcons.calendar),
          const SizedBox(height: 12),
          
          // Validade
          _buildMockupRow('Validade', validade, PhosphorIcons.calendarX),
          const SizedBox(height: 12),
          
          // Responsável
          _buildMockupRow('Responsável', responsavel, PhosphorIcons.userCircle),
        ],
      ),
    );
  }

  Widget _buildMockupRow(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: const Color(0xFF10B981)),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: Colors.black54,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  color: Colors.black,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(
          icon,
          size: 18,
          color: const Color(0xFF10B981),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: Color(0xFF9CA3AF),
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

