import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import '../models/print_result_models.dart';
import '../services/granobox_printer_edit_service.dart';
import '../providers/auth_provider.dart';
import '../providers/operations_provider.dart';
import '../models/operation_models.dart';
import '../theme/app_theme.dart';
import '../widgets/responsive_text.dart';
import '../providers/print_provider.dart'; // ⭐ NOVO: Para recarregar impressoras

class EditarImpressoraScreen extends StatefulWidget {
  final PrinterInfo impressora;
  
  const EditarImpressoraScreen({
    Key? key,
    required this.impressora,
  }) : super(key: key);

  @override
  State<EditarImpressoraScreen> createState() => _EditarImpressoraScreenState();
}

class _EditarImpressoraScreenState extends State<EditarImpressoraScreen> {
  final GranoboxPrinterEditService _editService = GranoboxPrinterEditService();
  
  // Controllers para os campos
  late TextEditingController _nomeController;
  late TextEditingController _locationController; // ⭐ NOVO: Localização
  late TextEditingController _hostController;
  late TextEditingController _portaController;
  late TextEditingController _offsetXController;
  late TextEditingController _offsetYController;
  late TextEditingController _dpiController;
  late TextEditingController _larguraController;
  late TextEditingController _alturaController;
  
  // Estados dos campos
  String _tipoConexao = 'tcp';
  String _protocolo = 'zpl';
  String _metodoImpressao = 'direct'; // ✅ Método de impressão (sempre 'direct' para TCP, 'websocket' para Edge)
  String _status = 'online';
  bool _suporteZPL = true;
  String _marca = '';
  String _modelo = '';
  String? _operationId;
  
  bool _isLoading = false;
  String? _error;
  String? _successMessage;

  @override
  void initState() {
    super.initState();
    _inicializarControllers();
  }

  void _inicializarControllers() {
    print('🔍 [DEBUG] Inicializando controladores...');
    print('🔍 Impressora: ${widget.impressora.displayName}');
    print('🔍 Brand do objeto: ${widget.impressora.brand}');
    print('🔍 Model do objeto: ${widget.impressora.model}');
    
    _nomeController = TextEditingController(text: widget.impressora.displayName);
    _locationController = TextEditingController(text: widget.impressora.location ?? ''); // ⭐ NOVO: Localização
    
    // Marca e Modelo (agora como dropdowns)
    _marca = _extrairMarca(widget.impressora);
    _modelo = _extrairModelo(widget.impressora);
    
    print('🔍 Marca extraída: $_marca');
    print('🔍 Modelo extraído: $_modelo');
    
    // Configurações de conexão
    final connection = widget.impressora.connection;
    print('🔍 Connection: $connection');
    
    _hostController = TextEditingController(text: connection?['host'] ?? '');
    _portaController = TextEditingController(text: (connection?['port'] ?? 9100).toString());
    
    print('🔍 Host: ${connection?['host']}');
    print('🔍 Port: ${connection?['port']}');
    
    // ✅ Converter tipo do backend para valor do dropdown
    // Backend: 'tcp', 'edge', 'tagment' → Dropdown: 'tcp', 'edge'
    final typeFromBackend = connection?['type'] ?? 'tcp';
    if (typeFromBackend == 'edge' || widget.impressora.isUSBPrinter) {
      _tipoConexao = 'edge'; // Edge-Go são tratados como "Edge" na UI
    } else {
      _tipoConexao = 'tcp'; // Padrão: tcp
    }
    
    print('🔍 Tipo de conexão: $_tipoConexao');
    
    // ✅ Corrigir protocol: se for "tcp", mapear para "zpl" (padrão)
    final protocolFromDb = connection?['protocol'] ?? 'zpl';
    _protocolo = (protocolFromDb == 'tcp' || protocolFromDb == null) ? 'zpl' : protocolFromDb;
    
    // ✅ Converter printMethod do backend para o valor do dropdown
    final printMethodFromBackend = widget.impressora.printMethod ?? 'tcp';
    _metodoImpressao = printMethodFromBackend == 'tcp' ? 'direct' : printMethodFromBackend;
    
    print('🔍 Protocolo: $_protocolo');
    print('🔍 Método de impressão: $_metodoImpressao');
    
    // Offsets
    _offsetXController = TextEditingController(text: widget.impressora.offsetX?.toString() ?? '0.0');
    _offsetYController = TextEditingController(text: widget.impressora.offsetY?.toString() ?? '0.0');
    
    print('🔍 Offset X: ${widget.impressora.offsetX}');
    print('🔍 Offset Y: ${widget.impressora.offsetY}');
    
    // Capacidades
    final capabilities = widget.impressora.capabilities;
    _dpiController = TextEditingController(text: (capabilities?['dpi'] ?? 203).toString());
    _larguraController = TextEditingController(text: (capabilities?['maxWidthMm'] ?? 104).toString());
    _alturaController = TextEditingController(text: (capabilities?['maxHeightMm'] ?? 150).toString());
    
    _suporteZPL = capabilities?['supportsZPL'] ?? true;
    
    _status = widget.impressora.status;
    
    // Operação vinculada
    _operationId = widget.impressora.operationId;
  }

  String _extrairMarca(PrinterInfo impressora) {
    // ✅ Priorizar campo brand do banco
    if (impressora.brand != null && impressora.brand!.isNotEmpty) {
      return impressora.brand!.toUpperCase();
    }
    
    // Fallback: tentar extrair do nome
    final nome = impressora.displayName.toLowerCase();
    if (nome.contains('zebra')) return 'ZEBRA';
    if (nome.contains('c3tech') || nome.contains('c3-tech')) return 'C3-TECH';
    return '';
  }

  String _extrairModelo(PrinterInfo impressora) {
    // ✅ Priorizar campo model do banco
    if (impressora.model != null && impressora.model!.isNotEmpty) {
      return impressora.model!.toUpperCase();
    }
    
    // Fallback: tentar extrair do nome
    final nome = impressora.displayName.toUpperCase();
    if (nome.contains('IT-200') || nome.contains('IT200')) return 'IT-200';
    if (nome.contains('ZD-220') || nome.contains('ZD220')) return 'ZD-220';
    return '';
  }
  
  // Modelos disponíveis por marca
  List<String> _getModelosPorMarca(String marca) {
    switch (marca) {
      case 'C3-TECH':
        return ['IT-200'];
      case 'ZEBRA':
        return ['ZD-220'];
      default:
        return [];
    }
  }

  @override
  void dispose() {
    _nomeController.dispose();
    _locationController.dispose(); // ⭐ NOVO: Localização
    _hostController.dispose();
    _portaController.dispose();
    _offsetXController.dispose();
    _offsetYController.dispose();
    _dpiController.dispose();
    _larguraController.dispose();
    _alturaController.dispose();
    super.dispose();
  }

  Future<void> _salvarConfiguracoes() async {
    print('🚀 ========== INÍCIO SALVAR CONFIGURAÇÕES ==========');
    print('🚀 Impressora ID: ${widget.impressora.id}');
    
    setState(() {
      _isLoading = true;
      _error = null;
      _successMessage = null;
    });

    try {
      // Obter token de autenticação
      print('🔑 Obtendo token de autenticação...');
      final auth = context.read<AuthProvider>();
      final token = await auth.authToken;
      
      print('🔑 Token obtido: ${token != null ? "SIM" : "NÃO"}');
      
      if (token == null) {
        throw Exception('Token de autenticação não disponível');
      }

      print('💾 Salvando todas as configurações...');

      // Preparar capabilities
      final capabilities = {
        'dpi': int.tryParse(_dpiController.text) ?? 203,
        'maxWidthMm': double.tryParse(_larguraController.text) ?? 104.0,
        'maxHeightMm': double.tryParse(_alturaController.text) ?? 150.0,
        'supportsZPL': _suporteZPL,
        'supportsCutter': false,
        'supportsColor': false,
      };

      print('📍 Offset X do controller: ${_offsetXController.text}');
      print('📍 Offset Y do controller: ${_offsetYController.text}');
      print('🏷️ Marca: "$_marca" (isEmpty: ${_marca.isEmpty})');
      print('🏷️ Modelo: "$_modelo" (isEmpty: ${_modelo.isEmpty})');
      print('🏢 Operation ID: $_operationId');

      final brandToSend = _marca.isNotEmpty ? _marca : null;
      final modelToSend = _modelo.isNotEmpty ? _modelo : null;
      
      // ✅ Converter método de impressão para o backend
      // ✅ Edge-Go e Edge-Pro usam WebSocket
      String printMethodToSend;
      if (_tipoConexao == 'edge') {
        // Para devices Edge, sempre usar WebSocket
        printMethodToSend = 'websocket';
      } else {
        // TCP: sempre usa TCP direto
        printMethodToSend = 'tcp';
      }
      
      // ✅ Converter tipo do dropdown de volta para o backend
      // Dropdown: 'tcp', 'edge' → Backend: 'tcp', 'edge'
      String typeToSend = _tipoConexao; // Agora é 1:1, não precisa converter
      
      print('📤 Brand a enviar: $brandToSend');
      print('📤 Model a enviar: $modelToSend');
      print('📤 OperationId a enviar: $_operationId');
      print('📤 PrintMethod a enviar: $printMethodToSend');
      print('📤 Type a enviar: $typeToSend');

      // Atualizar TUDO de uma vez no Granobox
      final success = await _editService.atualizarImpressora(
        printerId: widget.impressora.id,
        authToken: token,
        name: _nomeController.text.trim(),
        location: _locationController.text.trim().isNotEmpty ? _locationController.text.trim() : null, // ⭐ NOVO: Localização
        brand: brandToSend,
        model: modelToSend,
        type: typeToSend, // ✅ Convertido para 'edge' se for USB
        printMethod: printMethodToSend, // ✅ Convertido para 'tcp' ou 'websocket'
        ip: _hostController.text.isNotEmpty ? _hostController.text : null,
        port: int.tryParse(_portaController.text),
        capabilities: capabilities,
        offsetX: double.tryParse(_offsetXController.text) ?? 0.0,
        offsetY: double.tryParse(_offsetYController.text) ?? 0.0,
        operationId: _operationId,
      );

      if (!success) {
        throw Exception('Falha ao salvar no servidor');
      }

      setState(() {
        _successMessage = 'Configurações salvas com sucesso!';
      });

      print('✅ Todas as configurações salvas!');

      // ⭐ NOVO: Recarregar impressoras no PrintProvider para refletir mudanças
      try {
        final tagmentPrintProvider = Provider.of<PrintProvider>(context, listen: false);
        await tagmentPrintProvider.forcarAtualizacaoImpressoras();
        print('✅ Lista de impressoras recarregada no provider');
      } catch (e) {
        print('⚠️ Erro ao recarregar impressoras no provider: $e');
        // Não bloquear o sucesso da edição se o recarregamento falhar
      }

      // Voltar após 2 segundos
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          Navigator.pop(context, true);
        }
      });

    } catch (e) {
      setState(() {
        _error = 'Erro ao salvar configurações: $e';
      });
      print('❌ Erro ao salvar: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      appBar: AppBar(
        backgroundColor: AppTheme.dark900,
        title: ResponsiveText(
          'Editar Impressora',
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
        leading: IconButton(
          icon: const Icon(PhosphorIcons.arrowLeft, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary),
                ),
              ),
            )
          else
            TextButton(
              onPressed: () {
                print('🔘 BOTÃO SALVAR CLICADO!');
                _salvarConfiguracoes();
              },
              child: ResponsiveText(
                'Salvar',
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppTheme.primary,
              ),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Mensagens de feedback
            if (_error != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red),
                ),
                child: Row(
                  children: [
                    const Icon(PhosphorIcons.warning, color: Colors.red, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _error!,
                        style: const TextStyle(color: Colors.red, fontSize: 14),
                      ),
                    ),
                  ],
                ),
              ),
            
            if (_successMessage != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green),
                ),
                child: Row(
                  children: [
                    const Icon(PhosphorIcons.check, color: Colors.green, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _successMessage!,
                        style: const TextStyle(color: Colors.green, fontSize: 14),
                      ),
                    ),
                  ],
                ),
              ),

            // Configurações Básicas
            _buildSection(
              title: 'Configurações Básicas',
              icon: PhosphorIcons.gear,
              children: [
                _buildTextField(
                  controller: _nomeController,
                  label: 'Nome da Impressora',
                  hint: 'Ex: C3TECH - Validade',
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _locationController,
                  label: 'Localização da Impressora',
                  hint: 'Ex: Produção, Expedição, Sala 1...',
                ),
                const SizedBox(height: 16),
                _buildDropdown(
                  label: 'Marca',
                  value: _marca.isEmpty ? null : _marca,
                  items: const [
                    {'value': '', 'label': 'Selecione...'},
                    {'value': 'C3-TECH', 'label': 'C3-TECH'},
                    {'value': 'ZEBRA', 'label': 'ZEBRA'},
                  ],
                  onChanged: (value) {
                    setState(() {
                      _marca = value ?? '';
                      // Resetar modelo ao trocar de marca
                      _modelo = '';
                    });
                  },
                ),
                const SizedBox(height: 16),
                _buildDropdown(
                  label: 'Modelo',
                  value: _modelo.isEmpty ? null : _modelo,
                  items: [
                    {'value': '', 'label': 'Selecione...'},
                    ..._getModelosPorMarca(_marca).map((m) => {'value': m, 'label': m}),
                  ],
                  onChanged: _marca.isEmpty 
                    ? null 
                    : (value) => setState(() => _modelo = value ?? ''),
                ),
                const SizedBox(height: 16),
                // Operação vinculada
                Consumer<OperationsProvider>(
                  builder: (context, opsProvider, _) {
                    final operations = opsProvider.operations;
                    
                    return _buildDropdown(
                      label: 'Operação',
                      value: _operationId,
                      items: [
                        {'value': '', 'label': 'Todas as operações'},
                        ...operations.map((op) => {
                          'value': op.id,
                          'label': op.name,
                        }),
                      ],
                      onChanged: (value) {
                        setState(() {
                          _operationId = value?.isEmpty == true ? null : value;
                        });
                      },
                    );
                  },
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Configurações de Conexão
            _buildSection(
              title: 'Configurações de Conexão',
              icon: PhosphorIcons.wifiHigh,
              children: [
                _buildDropdown(
                  label: 'Tipo de Conexão',
                  value: _tipoConexao,
                  items: const [
                    {'value': 'tcp', 'label': 'TCP/IP'},
                    {'value': 'edge', 'label': 'Edge'},
                  ],
                  onChanged: (value) => setState(() => _tipoConexao = value!),
                ),
                const SizedBox(height: 16),
                if (_tipoConexao == 'tcp') ...[
                  _buildTextField(
                    controller: _hostController,
                    label: 'Endereço IP ou Hostname',
                    hint: 'Ex: 192.168.1.100 ou impressora.local',
                    keyboardType: TextInputType.text,
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    controller: _portaController,
                    label: 'Porta',
                    hint: 'Ex: 9100',
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 16),
                  _buildDropdown(
                    label: 'Protocolo',
                    value: _protocolo,
                    items: const [
                      {'value': 'zpl', 'label': 'ZPL'},
                      {'value': 'epcl', 'label': 'EPCL'},
                      {'value': 'auto', 'label': 'AUTO'},
                    ],
                    onChanged: (value) => setState(() => _protocolo = value!),
                  ),
                  const SizedBox(height: 16),
                  
                  // ✅ Método de Impressão
                  if (_tipoConexao == 'tcp')
                    // TCP: sempre usa TCP direto
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
                              'TCP: Usa conexão TCP direta',
                              style: TextStyle(color: AppTheme.dark300, fontSize: 14),
                            ),
                          ),
                        ],
                      ),
                    ),
                  
                  if (_tipoConexao == 'edge')
                    // Edge: sempre usa WebSocket (não tem escolha)
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
                              'Este dispositivo usa WebSocket para comunicação.',
                              style: TextStyle(
                                color: AppTheme.dark300,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ],
            ),

            const SizedBox(height: 24),

            // Capacidades da Impressora (simplificado - sem cortador e cores)
            _buildSection(
              title: 'Capacidades da Impressora',
              icon: PhosphorIcons.printer,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _buildTextField(
                        controller: _dpiController,
                        label: 'DPI',
                        hint: 'Ex: 203',
                        keyboardType: TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildTextField(
                        controller: _larguraController,
                        label: 'Largura (mm)',
                        hint: 'Ex: 104',
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildTextField(
                  controller: _alturaController,
                  label: 'Altura (mm)',
                  hint: 'Ex: 150',
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 16),
                _buildSwitch(
                  label: 'Suporte a ZPL',
                  value: _suporteZPL,
                  onChanged: (value) => setState(() => _suporteZPL = value),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Configurações de Posicionamento
            _buildSection(
              title: 'Ajustes de Posicionamento',
              icon: PhosphorIcons.target,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _buildTextField(
                        controller: _offsetXController,
                        label: 'Offset X (mm)',
                        hint: 'Ex: 0.0',
                        keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildTextField(
                        controller: _offsetYController,
                        label: 'Offset Y (mm)',
                        hint: 'Ex: 0.0',
                        keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                      ),
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      width: double.infinity,
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
              Icon(icon, color: AppTheme.primary, size: 20),
              const SizedBox(width: 8),
              ResponsiveText(
                title,
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    String? hint,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ResponsiveText(
          label,
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: AppTheme.dark300,
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          style: const TextStyle(color: Colors.white, fontSize: 16),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: AppTheme.dark400, fontSize: 14),
            filled: true,
            fillColor: AppTheme.dark700,
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
              borderSide: BorderSide(color: AppTheme.primary),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdown({
    required String label,
    String? value,
    required List<Map<String, String>> items,
    Function(String?)? onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ResponsiveText(
          label,
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: AppTheme.dark300,
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: AppTheme.dark700,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppTheme.dark600),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              dropdownColor: AppTheme.dark800,
              style: const TextStyle(color: Colors.white, fontSize: 16),
              items: items.map((item) {
                return DropdownMenuItem<String>(
                  value: item['value'],
                  child: Text(item['label']!),
                );
              }).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSwitch({
    required String label,
    required bool value,
    required Function(bool) onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          ResponsiveText(
            label,
            fontSize: 14,
            color: Colors.white,
          ),
          Switch(
            value: value,
            onChanged: onChanged,
            activeColor: AppTheme.primary,
            activeTrackColor: AppTheme.primary.withOpacity(0.3),
            inactiveThumbColor: AppTheme.dark400,
            inactiveTrackColor: AppTheme.dark600,
          ),
        ],
      ),
    );
  }
}
