import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import '../models/iot_device.dart';
import '../theme/app_theme.dart';
import '../providers/tagment_printer_config_provider.dart';
import '../providers/tagment_print_provider.dart';
import '../providers/auth_provider.dart';
import '../models/tagment_printer_config_models.dart';
import '../widgets/print_modal.dart';
import '../services/granobox_printer_create_service.dart';

class EdgeGoPrintConfigScreen extends StatefulWidget {
  final IoTDevice edgeGoDevice;

  const EdgeGoPrintConfigScreen({
    super.key,
    required this.edgeGoDevice,
  });

  @override
  State<EdgeGoPrintConfigScreen> createState() => _EdgeGoPrintConfigScreenState();
}

class _EdgeGoPrintConfigScreenState extends State<EdgeGoPrintConfigScreen> {
  bool _isLoading = false;
  TagmentPrinterConfig? _currentConfig;
  
  // Controllers para offset e location
  final TextEditingController _offsetXController = TextEditingController();
  final TextEditingController _offsetYController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadCurrentConfig();
  }

  @override
  void dispose() {
    _offsetXController.dispose();
    _offsetYController.dispose();
    _locationController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _loadCurrentConfig() async {
    setState(() => _isLoading = true);
    
    try {
      final configProvider = context.read<TagmentPrinterConfigProvider>();
      await configProvider.loadConfig();
      
      // Buscar configuração existente
      _currentConfig = configProvider.config ?? const TagmentPrinterConfig();
      
      // ✅ CARREGAR IMPRESSORAS PRIMEIRO!
      final tagmentProvider = context.read<TagmentPrintProvider>();
      final authProvider = context.read<AuthProvider>();
      
      final token = await authProvider.authToken;
      final clientId = authProvider.user?.clientId;
      
      if (token != null && clientId != null) {
        print('🔄 Carregando impressoras antes de buscar configuração...');
        await tagmentProvider.carregarImpressoras(
          token: token,
          clientId: clientId,
          forceRefresh: true,
        );
        print('✅ Impressoras carregadas: ${tagmentProvider.impressoras.length}');
      }
      
      // Carregar offsets atuais da impressora (se existir)
      final printerInfo = tagmentProvider.impressoras.where(
        (p) => p.edgeAgentFingerprint == widget.edgeGoDevice.id,
      ).firstOrNull;
      
      if (printerInfo != null) {
        _offsetXController.text = printerInfo.offsetX?.toString() ?? '0';
        _offsetYController.text = printerInfo.offsetY?.toString() ?? '0';
        _locationController.text = printerInfo.location ?? '';
      } else {
        _offsetXController.text = '0';
        _offsetYController.text = '0';
        _locationController.text = '';
      }
      
      setState(() => _isLoading = false);
    } catch (e) {
      setState(() => _isLoading = false);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao carregar configuração: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      appBar: AppBar(
        backgroundColor: AppTheme.dark800,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(PhosphorIcons.arrowLeft, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Configurar Impressão',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              widget.edgeGoDevice.name,
              style: const TextStyle(
                color: AppTheme.dark300,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header com informações do Edge-Go
                  _buildDeviceInfoCard(),
                  
                  const SizedBox(height: 16),
                  
                  // Informações da impressora conectada
                  _buildPrinterInfoCard(),
                  
                  const SizedBox(height: 24),
                  
                  // Configuração da Impressora
                  _buildPrinterConfigCard(),
                  
                  const SizedBox(height: 32),
                  
                  // Botões de ação
                  Row(
                    children: [
                      // Botão de teste
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _testPrint,
                          icon: const Icon(PhosphorIcons.printer),
                          label: const Text('Testar'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppTheme.primary,
                            side: BorderSide(color: AppTheme.primary),
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
    );
  }

  Widget _buildDeviceInfoCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.dark800,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppTheme.primary.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              PhosphorIcons.cpu,
              color: AppTheme.primary,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        widget.edgeGoDevice.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(PhosphorIcons.pencilSimple, size: 18),
                      color: AppTheme.primary,
                      onPressed: _showRenameDialog,
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'ID: ${widget.edgeGoDevice.id}',
                  style: const TextStyle(
                    color: AppTheme.dark300,
                    fontSize: 12,
                    fontFamily: 'monospace',
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: widget.edgeGoDevice.isOnline ? Colors.green : Colors.red,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      widget.edgeGoDevice.isOnline ? 'Online' : 'Offline',
                      style: TextStyle(
                        color: widget.edgeGoDevice.isOnline ? Colors.green : Colors.red,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }



  Future<void> _showRenameDialog() async {
    _nameController.text = widget.edgeGoDevice.name;
    
    return showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        title: const Text(
          'Renomear Edge-Go',
          style: TextStyle(color: Colors.white),
        ),
        content: TextField(
          controller: _nameController,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            labelText: 'Novo Nome',
            labelStyle: const TextStyle(color: AppTheme.dark300),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: AppTheme.dark600),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: AppTheme.primary),
            ),
          ),
          autofocus: true,
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
            onPressed: () async {
              Navigator.pop(context);
              await _renameDevice();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
            ),
            child: const Text('Renomear'),
          ),
        ],
      ),
    );
  }

  Future<void> _renameDevice() async {
    final newName = _nameController.text.trim();
    
    if (newName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('O nome não pode ser vazio'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (newName == widget.edgeGoDevice.name) {
      return; // Nome não mudou
    }

    setState(() => _isLoading = true);

    try {
      final authProvider = context.read<AuthProvider>();
      final token = await authProvider.authToken;

      if (token == null) {
        throw Exception('Token não encontrado');
      }

      // Chamar API para renomear o device
      final service = GranoboxPrinterCreateService();
      await service.updateDeviceName(
        deviceId: widget.edgeGoDevice.id,
        newName: newName,
        authToken: token,
      );

      if (mounted) {
        // Atualizar o nome localmente
        widget.edgeGoDevice.name = newName;
        
        setState(() => _isLoading = false);
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Edge-Go renomeado para "$newName"'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao renomear: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _testPrint() async {
    try {
      final tagmentProvider = context.read<TagmentPrintProvider>();
      
      // Buscar impressora associada a este Edge-Go
      final printerInfo = tagmentProvider.impressoras.firstWhere(
        (p) => p.edgeAgentFingerprint == widget.edgeGoDevice.id,
        orElse: () => throw Exception('Impressora não encontrada para este Edge-Go'),
      );
      
      // Dados de teste
      final hoje = DateTime.now();
      final validade = hoje.add(const Duration(days: 7));
      
      final templateData = {
        'produto': 'TESTE IMPRESSÃO',
        'marca': 'GRANOBOX',
        'sif': 'SIF 1234',
        'conservacao': 'RESFRIADO',
        'data_producao': '${hoje.day.toString().padLeft(2, '0')}/${hoje.month.toString().padLeft(2, '0')}/${hoje.year}',
        'data_validade': '${validade.day.toString().padLeft(2, '0')}/${validade.month.toString().padLeft(2, '0')}/${validade.year}',
        'peso_liquido': '1,0 kg',
        'lote_industria': 'L${hoje.millisecondsSinceEpoch % 100000}',
        'data_vencimento_industria': '${validade.day.toString().padLeft(2, '0')}/${validade.month.toString().padLeft(2, '0')}/${validade.year}',
      };
      
      // Usar showPrintModal
      await showPrintModal(
        context: context,
        title: 'Teste de Impressão',
        subtitle: '${widget.edgeGoDevice.name} • ${printerInfo.displayName}',
        printFunction: (onProgress) => tagmentProvider.imprimirComTemplate(
          printer: printerInfo,
          templateId: 'validade_60x60',
          templateData: templateData,
          copies: 1,
          conservacao: 'RESFRIADO',
          onProgress: onProgress,
        ),
        onSuccess: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✅ Etiqueta de teste impressa com sucesso!'),
              backgroundColor: Colors.green,
            ),
          );
        },
        onError: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('❌ Erro na impressão'),
              backgroundColor: Colors.red,
            ),
          );
        },
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ Erro: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Widget _buildPrinterInfoCard() {
    // Usar o status do dispositivo IoT diretamente
    final deviceStatus = widget.edgeGoDevice.status;
    final isUsbConnected = deviceStatus?.usbConnected == true;
    
    debugPrint('🔍 [DEBUG] Status USB do dispositivo: $isUsbConnected');
    debugPrint('🔍 [DEBUG] Device status completo: ${deviceStatus?.toString()}');

    return Consumer<TagmentPrintProvider>(
      builder: (context, tagmentProvider, _) {
        // Buscar impressora associada a este Edge-Go (para informações adicionais)
        final printerInfo = tagmentProvider.impressoras.where(
          (p) => p.edgeAgentFingerprint == widget.edgeGoDevice.id,
        ).firstOrNull;

        // ⭐ Card de "impressora não detectada" removido - não precisamos dessa informação
        if (!isUsbConnected) {
          // Não mostrar nada quando USB não estiver conectada
          return const SizedBox.shrink();
        }

        // Impressora USB conectada - usar informações do dispositivo + dados do printerInfo se disponível
        final connection = printerInfo?.connection;
        final capabilities = printerInfo?.capabilities;

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.dark800,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: Colors.green.withOpacity(0.5), // USB conectada = verde
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header da impressora
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      PhosphorIcons.printer,
                      color: Colors.green,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          printerInfo?.displayName ?? 'Impressora USB',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: Colors.green,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'Conectada e pronta',
                              style: TextStyle(
                                color: Colors.green,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Informações técnicas
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.dark700,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    // Marca
                    if (printerInfo?.brand != null) ...[
                      _buildInfoRow(
                        icon: PhosphorIcons.factory,
                        label: 'Marca',
                        value: printerInfo!.brand!,
                      ),
                      const SizedBox(height: 8),
                    ],

                    // Modelo
                    if (printerInfo?.model != null) ...[
                      _buildInfoRow(
                        icon: PhosphorIcons.tag,
                        label: 'Modelo',
                        value: printerInfo!.model!,
                      ),
                      const SizedBox(height: 8),
                    ] else ...[
                      // Informação básica se não tiver dados detalhados
                      _buildInfoRow(
                        icon: PhosphorIcons.tag,
                        label: 'Modelo',
                        value: 'Detectando...',
                      ),
                      const SizedBox(height: 8),
                    ],

                    // Offset X
                    if (printerInfo?.offsetX != null) ...[
                      _buildInfoRow(
                        icon: PhosphorIcons.arrowsHorizontal,
                        label: 'Offset X',
                        value: '${printerInfo!.offsetX} mm',
                      ),
                      const SizedBox(height: 8),
                    ] else ...[
                      _buildInfoRow(
                        icon: PhosphorIcons.arrowsHorizontal,
                        label: 'Offset X',
                        value: '0 mm',
                      ),
                      const SizedBox(height: 8),
                    ],

                    // Offset Y
                    if (printerInfo?.offsetY != null) ...[
                      _buildInfoRow(
                        icon: PhosphorIcons.arrowsVertical,
                        label: 'Offset Y',
                        value: '${printerInfo!.offsetY} mm',
                      ),
                      const SizedBox(height: 8),
                    ] else ...[
                      _buildInfoRow(
                        icon: PhosphorIcons.arrowsVertical,
                        label: 'Offset Y',
                        value: '0 mm',
                      ),
                      const SizedBox(height: 8),
                    ],

                    // Interface
                    _buildInfoRow(
                      icon: PhosphorIcons.code,
                      label: 'Interface',
                      value: printerInfo?.interface?.toUpperCase() ?? 'USB',
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          color: AppTheme.dark300,
          size: 16,
        ),
        const SizedBox(width: 8),
        Text(
          '$label:',
          style: const TextStyle(
            color: AppTheme.dark300,
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontFamily: 'monospace',
            ),
          ),
        ),
      ],
    );
  }


  Widget _buildPrinterConfigCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.dark800,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppTheme.dark600,
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  PhosphorIcons.arrowsOutCardinal,
                  color: Colors.blue,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Configuração da Impressora',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'Localização e ajustes de posição',
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
          
          const SizedBox(height: 16),
          
          // Campo de localização
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Localização da Impressora',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _locationController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Ex: Produção, Expedição, Sala 1...',
                  hintStyle: const TextStyle(color: AppTheme.dark400),
                  filled: true,
                  fillColor: AppTheme.dark700,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Campos de offset
          Row(
            children: [
              // Offset X
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Offset X (mm)',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _offsetXController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: '0',
                        hintStyle: const TextStyle(color: AppTheme.dark400),
                        filled: true,
                        fillColor: AppTheme.dark700,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(width: 16),
              
              // Offset Y
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Offset Y (mm)',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _offsetYController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: '0',
                        hintStyle: const TextStyle(color: AppTheme.dark400),
                        filled: true,
                        fillColor: AppTheme.dark700,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Botão salvar offset
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _savePrinterConfiguration,
              icon: const Icon(PhosphorIcons.floppyDisk, size: 16),
              label: const Text('Salvar Configuração'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _savePrinterConfiguration() async {
    try {
      final offsetX = double.tryParse(_offsetXController.text) ?? 0.0;
      final offsetY = double.tryParse(_offsetYController.text) ?? 0.0;
      final location = _locationController.text.trim();
      
      print('🔧 GRANOBOX: Salvando configuração da impressora:');
      print('🔧 GRANOBOX: Offset X: $offsetX');
      print('🔧 GRANOBOX: Offset Y: $offsetY');
      print('🔧 GRANOBOX: Location: $location');
      
      // Buscar impressora associada a este Edge-Go
      final tagmentProvider = context.read<TagmentPrintProvider>();
      final authProvider = context.read<AuthProvider>();
      
      print('🔍 GRANOBOX: Buscando impressora para Edge-Go:');
      print('🔍 GRANOBOX: Edge-Go ID: ${widget.edgeGoDevice.id}');
      print('🔍 GRANOBOX: Edge-Go name: ${widget.edgeGoDevice.name}');
      print('🔍 GRANOBOX: Total de impressoras carregadas: ${tagmentProvider.impressoras.length}');
      
      // Mostrar info na tela também
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('🔍 Edge-Go: ${widget.edgeGoDevice.id} | Impressoras: ${tagmentProvider.impressoras.length}'),
          duration: const Duration(seconds: 3),
        ),
      );
      
      // Listar todas as impressoras e seus edgeAgentFingerprint
      for (var i = 0; i < tagmentProvider.impressoras.length; i++) {
        final p = tagmentProvider.impressoras[i];
        print('🔍 GRANOBOX: Impressora $i: ${p.displayName}');
        print('🔍 GRANOBOX:   - ID: ${p.id}');
        print('🔍 GRANOBOX:   - edgeAgentFingerprint: ${p.edgeAgentFingerprint}');
        print('🔍 GRANOBOX:   - isUSBPrinter: ${p.isUSBPrinter}');
        print('🔍 GRANOBOX:   - isEdgeGo: ${p.isEdgeGo}');
      }
      
      // Buscar impressora por ID do Edge-Go
      final printerInfo = tagmentProvider.impressoras.where(
        (p) => p.edgeAgentFingerprint == widget.edgeGoDevice.id,
      ).firstOrNull;
      
      print('🔍 GRANOBOX: Impressora encontrada: ${printerInfo?.displayName}');
      print('🔍 GRANOBOX: Impressora ID: ${printerInfo?.id}');
      
      // Mostrar resultado na tela
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(printerInfo != null 
            ? '✅ Impressora encontrada: ${printerInfo.displayName}' 
            : '❌ Nenhuma impressora encontrada para este Edge-Go'),
          backgroundColor: printerInfo != null ? Colors.green : Colors.red,
          duration: const Duration(seconds: 5),
        ),
      );
      
      if (printerInfo == null) {
        throw Exception('Impressora não encontrada para este Edge-Go');
      }
      
      final token = await authProvider.authToken;
      if (token == null) {
        throw Exception('Token de autenticação não encontrado');
      }
      
      // Atualizar impressora via API do Granobox
      final granoboxService = GranoboxPrinterCreateService();
      final success = await granoboxService.updatePrinter(
        token: token,
        printerId: printerInfo.id,
        location: location.isNotEmpty ? location : null,
        offsetX: offsetX,
        offsetY: offsetY,
      );
      
      if (success) {
        // Recarregar impressoras para refletir as mudanças
        final clientId = authProvider.user?.clientId;
        if (clientId != null) {
          await tagmentProvider.carregarImpressoras(
            token: token,
            clientId: clientId,
            forceRefresh: true,
          );
        }
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Configuração da impressora salva com sucesso!'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        throw Exception('Falha ao salvar na API');
      }
    } catch (e) {
      print('❌ GRANOBOX: Erro ao salvar configuração: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ Erro ao salvar configuração: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _saveConfiguration() async {
    // TODO: Implementar salvamento da configuração
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Configuração salva com sucesso!'),
        backgroundColor: Colors.green,
      ),
    );
  }
}
