import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../services/printer_create_service.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/operations_provider.dart'; // ⭐ NOVO
import '../services/client_service.dart';
import '../theme/app_theme.dart';
import '../widgets/responsive_text.dart';
import '../models/operation_models.dart'; // ⭐ NOVO

class AdicionarImpressoraScreen extends StatefulWidget {
  // ⭐ REMOVIDO: apiKey (agora usa token JWT do Granobox)
  
  const AdicionarImpressoraScreen({
    Key? key,
  }) : super(key: key);

  @override
  State<AdicionarImpressoraScreen> createState() => _AdicionarImpressoraScreenState();
}

class _AdicionarImpressoraScreenState extends State<AdicionarImpressoraScreen> {
  late PrinterCreateService _createService;
  final ClientService _clientService = ClientService();
  
  final _formKey = GlobalKey<FormState>();
  
  // Controllers para os campos
  late TextEditingController _nomeController;
  late TextEditingController _hostController;
  late TextEditingController _portaController;
  late TextEditingController _offsetXController;
  late TextEditingController _offsetYController;
  late TextEditingController _dpiController;
  late TextEditingController _larguraController;
  late TextEditingController _alturaController;
  late TextEditingController _edgeIpController; // ✅ NOVO: IP do Edge
  late TextEditingController _edgePortController; // ✅ NOVO: Porta do Edge
  late TextEditingController _edgeFingerprintController; // ✅ NOVO: Fingerprint do Edge
  
  // Estados dos campos
  String _tipoConexao = 'tcp';
  String _protocolo = 'zpl';
  bool _suporteZPL = true;
  bool _suporteCortador = false;
  bool _suporteCor = false;
  bool _conexaoAutomatica = true;
  bool _modoDebug = false;
  bool _impressaoRemota = true;
  
  bool _isLoading = false;
  String? _error;
  String? _successMessage;
  String? _externalCustomerId;
  
  // ⭐ NOVO: Operação selecionada
  Operation? _selectedOperation;

  // Marca/Modelo (dropdowns)
  String? _selectedBrand;
  String? _selectedModel;
  final Map<String, List<String>> _brandModels = const {
    'Zebra': ['ZD230', 'ZD220'],
    'C3-TECH': ['IT-200'],
  };

  @override
  void initState() {
    super.initState();
    // ⭐ Serviço será inicializado após obter token
    _inicializarControllers();
    // Resolver e inicializar após primeiro frame
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await _initializeService();
      await _resolveExternalCustomerId();
    });
  }
  
  Future<void> _initializeService() async {
    try {
      final auth = context.read<AuthProvider>();
      final token = await auth.authToken;
      if (token == null) {
        print('❌ Token JWT não encontrado');
        setState(() {
          _error = 'Erro: Usuário não autenticado';
        });
        return;
      }
      _createService = PrinterCreateService(apiKey: token); // ⭐ Token JWT do Granobox
      print('✅ PrinterCreateService inicializado com token JWT');
    } catch (e) {
      print('❌ Erro ao inicializar serviço: $e');
      setState(() {
        _error = 'Erro ao inicializar: $e';
      });
    }
  }

  void _inicializarControllers() {
    _nomeController = TextEditingController();
    _hostController = TextEditingController();
    _portaController = TextEditingController(text: '9100');
    _offsetXController = TextEditingController(text: '0.0');
    _offsetYController = TextEditingController(text: '0.0');
    _dpiController = TextEditingController(text: '203');
    _larguraController = TextEditingController(text: '104');
    _alturaController = TextEditingController(text: '150');
    _edgeIpController = TextEditingController(); // ✅ NOVO
    _edgePortController = TextEditingController(text: '3001'); // ✅ NOVO: Porta padrão
    _edgeFingerprintController = TextEditingController(); // ✅ NOVO
    // Defaults de marca/modelo
    _selectedBrand = 'Zebra';
    _selectedModel = _brandModels[_selectedBrand!]!.first;
  }

  Future<void> _resolveExternalCustomerId() async {
    try {
      final auth = context.read<AuthProvider>();
      final clientId = auth.user?.clientId;
      final token = await auth.authToken;
      if (clientId == null || token == null) {
        print('❌ Não foi possível obter clientId/token para externalCustomerId');
        return;
      }
      final info = await _clientService.getClientInfo(clientId, token);
      String? customerId = info?['tagmentCustomerId'];
      if (customerId == null || customerId.toString().trim().isEmpty) {
        final sourceName = (info?['businessName'] ?? info?['legalName'] ?? '').toString();
        if (sourceName.isNotEmpty) {
          customerId = 'gbx_' + sourceName.toLowerCase().replaceAll(RegExp(r'\s+'), '_');
        } else {
          customerId = 'gbx_client_${clientId.substring(0, 8)}';
        }
      }
      setState(() {
        _externalCustomerId = customerId;
      });
      print('✅ externalCustomerId resolvido: $_externalCustomerId');
    } catch (e) {
      print('❌ Falha ao resolver externalCustomerId: $e');
    }
  }

  @override
  void dispose() {
    _nomeController.dispose();
    _hostController.dispose();
    _portaController.dispose();
    _offsetXController.dispose();
    _offsetYController.dispose();
    _dpiController.dispose();
    _larguraController.dispose();
    _alturaController.dispose();
    _edgeIpController.dispose();
    _edgePortController.dispose();
    _edgeFingerprintController.dispose();
    super.dispose();
  }

  Future<void> _criarImpressora() async {
    print('🚀 Iniciando criação de impressora...');
    print('🔍 Validando formulário...');
    
    if (!_formKey.currentState!.validate()) {
      print('❌ Validação do formulário falhou');
      return;
    }
    
    print('✅ Validação do formulário passou');

    setState(() {
      _isLoading = true;
      _error = null;
      _successMessage = null;
    });

    try {
      bool success = false;
      if (_externalCustomerId == null || _externalCustomerId!.trim().isEmpty) {
        // tentar resolver novamente
        await _resolveExternalCustomerId();
      }
      if (_externalCustomerId == null || _externalCustomerId!.trim().isEmpty) {
        setState(() {
          _error = 'Configuração Tagment incompleta: externalCustomerId indisponível.';
        });
        return;
      }
      
      if (_tipoConexao == 'edge') {
        // Obter clientId do AuthProvider
        final auth = context.read<AuthProvider>();
        final clientId = auth.user?.clientId;
        
        if (clientId == null) {
          throw Exception('ClientId não encontrado');
        }
        
        // ✅ NOVO: Criar impressora Edge ESP32
        success = await _createService.criarImpressoraEdge(
          displayName: _nomeController.text,
          externalCustomerId: _externalCustomerId!,
          clientId: clientId, // ⭐ OBRIGATÓRIO
          edgeIp: '', // ✅ IP será obtido dinamicamente
          edgePort: 3001, // ✅ Porta padrão
          edgeFingerprint: _edgeFingerprintController.text,
          operationId: _selectedOperation?.id, // ⭐ Vincular à operação
          brand: _selectedBrand,
          model: _selectedModel,
          dpi: int.tryParse(_dpiController.text),
          maxWidthMm: double.tryParse(_larguraController.text),
          maxHeightMm: double.tryParse(_alturaController.text),
          offsetX: double.tryParse(_offsetXController.text),
          offsetY: double.tryParse(_offsetYController.text),
        );
      } else if (_tipoConexao == 'tcp') {
        // Validar dados TCP
        final validationError = _createService.validarDadosTCP(
          displayName: _nomeController.text,
          host: _hostController.text,
          port: int.tryParse(_portaController.text),
        );
        
        if (validationError != null) {
          setState(() {
            _error = validationError;
          });
          return;
        }
        
        // Obter clientId do AuthProvider
        final auth = context.read<AuthProvider>();
        final clientId = auth.user?.clientId;
        
        if (clientId == null) {
          throw Exception('ClientId não encontrado');
        }
        
        success = await _createService.criarImpressoraTCP(
          displayName: _nomeController.text,
          host: _hostController.text,
          externalCustomerId: _externalCustomerId!,
          clientId: clientId, // ⭐ OBRIGATÓRIO
          operationId: _selectedOperation?.id, // ⭐ Vincular à operação
          port: int.tryParse(_portaController.text) ?? 9100,
          protocol: _protocolo,
          brand: _selectedBrand,
          model: _selectedModel,
          dpi: int.tryParse(_dpiController.text),
          maxWidthMm: double.tryParse(_larguraController.text),
          maxHeightMm: double.tryParse(_alturaController.text),
          supportsZPL: _suporteZPL,
          supportsCutter: _suporteCortador,
          supportsColor: _suporteCor,
          offsetX: double.tryParse(_offsetXController.text),
          offsetY: double.tryParse(_offsetYController.text),
          autoConnect: _conexaoAutomatica,
          debugMode: _modoDebug,
          allowRemotePrinting: _impressaoRemota,
        );
      } else {
        // ✅ Tipo de conexão inválido
        setState(() {
          _error = 'Tipo de conexão inválido. Escolha TCP/IP ou Edge ESP32.';
        });
        return;
      }

      if (success) {
        setState(() {
          _successMessage = 'Impressora criada com sucesso!';
        });

        // Voltar após 2 segundos
        Future.delayed(const Duration(seconds: 2), () {
          if (mounted) {
            Navigator.pop(context, true);
          }
        });
      } else {
        setState(() {
          _error = 'Erro ao criar impressora. Verifique os dados e tente novamente.';
        });
      }

    } catch (e) {
      setState(() {
        _error = 'Erro ao criar impressora: $e';
      });
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
          'Adicionar Impressora',
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
              onPressed: _criarImpressora,
              child: ResponsiveText(
                'Criar',
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppTheme.primary,
              ),
            ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
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
                    label: 'Nome da Impressora *',
                    hint: 'Ex: C3TECH - Validade',
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Nome é obrigatório';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  // Dropdowns de Marca e Modelo
                  _buildDropdown(
                    label: 'Marca',
                    value: _selectedBrand!,
                    items: const [
                      {'value': 'Zebra', 'label': 'Zebra'},
                      {'value': 'C3-TECH', 'label': 'C3-TECH'},
                    ],
                    onChanged: (value) {
                      if (value == null) return;
                      setState(() {
                        _selectedBrand = value;
                        final models = _brandModels[_selectedBrand!] ?? [];
                        _selectedModel = models.isNotEmpty ? models.first : null;
                      });
                    },
                  ),
                  const SizedBox(height: 16),
                  _buildDropdown(
                    label: 'Modelo',
                    value: _selectedModel ?? '',
                    items: (_brandModels[_selectedBrand!] ?? [])
                        .map((m) => {'value': m, 'label': m})
                        .toList(),
                    onChanged: (value) {
                      if (value == null) return;
                      setState(() {
                        _selectedModel = value;
                      });
                    },
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // ⭐ NOVO: Seleção de Operação
              _buildOperationSection(),

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
                      {'value': 'edge', 'label': 'Edge ESP32'},
                    ],
                    onChanged: (value) => setState(() => _tipoConexao = value!),
                  ),
                  const SizedBox(height: 16),
                  if (_tipoConexao == 'edge') ...[
                    _buildTextField(
                      controller: _edgeFingerprintController,
                      label: 'Fingerprint do Edge Agent *',
                      hint: 'Ex: 3646566d-ecbf-42c4-9c57-90dccf507ec5',
                      keyboardType: TextInputType.text,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Informe o Fingerprint do Edge';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(PhosphorIcons.info, color: AppTheme.primary, size: 20),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Edge ESP32 - Impressão HTTP Direta',
                                  style: TextStyle(
                                    color: AppTheme.primary,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'O IP do Edge é obtido automaticamente da API Tagment. Certifique-se de que o Edge Agent está online e registrado.',
                            style: TextStyle(
                              color: AppTheme.primary,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ] else if (_tipoConexao == 'tcp') ...[
                    _buildTextField(
                      controller: _hostController,
                      label: 'Endereço IP ou Hostname *',
                      hint: 'Ex: 192.168.1.100 ou impressora.local',
                      keyboardType: TextInputType.text,
                      validator: (value) {
                        print('🔍 Validando IP/Hostname: "$value"');
                        // Sem validação - aceita qualquer coisa
                        print('✅ Validação passou para: "$value"');
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    _buildTextField(
                      controller: _portaController,
                      label: 'Porta',
                      hint: 'Ex: 9100',
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value != null && value.isNotEmpty) {
                          final port = int.tryParse(value);
                          if (port == null || port < 1 || port > 65535) {
                            return 'Porta deve estar entre 1 e 65535';
                          }
                        }
                        return null;
                      },
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
                  ] else ...[
                    ResponsiveText(
                      'Para impressoras USB, certifique-se de que o dispositivo está conectado e reconhecido pelo sistema.',
                      fontSize: 14,
                      color: AppTheme.dark300,
                    ),
                  ],
                ],
              ),

              const SizedBox(height: 24),

              // Capacidades da Impressora
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
                  _buildSwitch(
                    label: 'Suporte a Cortador',
                    value: _suporteCortador,
                    onChanged: (value) => setState(() => _suporteCortador = value),
                  ),
                  _buildSwitch(
                    label: 'Suporte a Cores',
                    value: _suporteCor,
                    onChanged: (value) => setState(() => _suporteCor = value),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Configurações de Posicionamento
              _buildSection(
                title: 'Configurações de Posicionamento',
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

              const SizedBox(height: 24),

              // Configurações do Print Agent
              _buildSection(
                title: 'Configurações do Print Agent',
                icon: PhosphorIcons.robot,
                children: [
                  _buildSwitch(
                    label: 'Conexão Automática',
                    value: _conexaoAutomatica,
                    onChanged: (value) => setState(() => _conexaoAutomatica = value),
                  ),
                  _buildSwitch(
                    label: 'Modo Debug',
                    value: _modoDebug,
                    onChanged: (value) => setState(() => _modoDebug = value),
                  ),
                  _buildSwitch(
                    label: 'Impressão Remota',
                    value: _impressaoRemota,
                    onChanged: (value) => setState(() => _impressaoRemota = value),
                  ),
                ],
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  // ⭐ NOVO: Seção de seleção de operação
  Widget _buildOperationSection() {
    return Consumer<OperationsProvider>(
      builder: (context, operationsProvider, child) {
        final operations = operationsProvider.activeOperations;

        // Se não houver operações, não mostrar a seção
        if (operations.isEmpty) {
          return const SizedBox.shrink();
        }

        return _buildSection(
          title: 'Operação (opcional)',
          icon: PhosphorIcons.factory,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: AppTheme.dark700,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.dark600),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String?>(
                      value: _selectedOperation?.id,
                      isExpanded: true,
                      hint: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: ResponsiveText(
                          'Disponível para todas as operações',
                          fontSize: 14,
                          color: AppTheme.dark400,
                        ),
                      ),
                      dropdownColor: AppTheme.dark800,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      items: [
                        DropdownMenuItem<String?>(
                          value: null,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: ResponsiveText(
                              'Todas as operações (global)',
                              fontSize: 14,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        ...operations.map((op) => DropdownMenuItem<String?>(
                          value: op.id,
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: ResponsiveText(
                              op.name,
                              fontSize: 14,
                              color: Colors.white,
                            ),
                          ),
                        )),
                      ],
                      onChanged: (value) {
                        setState(() {
                          _selectedOperation = value == null
                              ? null
                              : operations.firstWhere((op) => op.id == value);
                        });
                      },
                    ),
                  ),
                ),
                if (_selectedOperation != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        Icon(PhosphorIcons.info, color: AppTheme.primary, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ResponsiveText(
                            'Esta impressora ficará visível apenas na operação "${_selectedOperation!.name}"',
                            fontSize: 12,
                            color: AppTheme.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ] else ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.green.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        Icon(PhosphorIcons.globeSimple, color: Colors.green, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ResponsiveText(
                            'Impressora global - disponível para todas as operações',
                            fontSize: 12,
                            color: Colors.green,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ],
        );
      },
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
    String? Function(String?)? validator,
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
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          validator: validator,
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
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.red),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.red),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdown({
    required String label,
    required String value,
    required List<Map<String, String>> items,
    required Function(String?) onChanged,
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
