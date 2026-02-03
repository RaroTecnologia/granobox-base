import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../config/api_config.dart';
import '../theme/app_theme.dart';
import '../services/granobox_dot_service.dart';
import '../services/device_api_service.dart';
import '../services/auth_service.dart';

class DotsConfigScreen extends StatefulWidget {
  const DotsConfigScreen({super.key});

  @override
  State<DotsConfigScreen> createState() => _DotsConfigScreenState();
}

class _DotsConfigScreenState extends State<DotsConfigScreen> with SingleTickerProviderStateMixin {
  final GranoboxDotService _dotService = GranoboxDotService();
  final DeviceApiService _deviceApiService = DeviceApiService();
  final AuthService _authService = AuthService();
  
  List<BLEDotDevice> _availableDots = [];
  List<Map<String, dynamic>> _adoptedDots = [];
  
  bool _scanning = false;
  bool _loadingDots = false;
  bool _hasScanned = false;
  
  late TabController _tabController;
  int _currentTab = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      setState(() {
        _currentTab = _tabController.index;
      });
    });
    _loadAdoptedDots();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAdoptedDots() async {
    setState(() => _loadingDots = true);
    
    try {
      final authToken = await _authService.getAuthToken();
      if (authToken != null) {
        final dots = await _deviceApiService.getMyDevices(authToken);
        setState(() {
          _adoptedDots = dots;
        });
      }
    } catch (e) {
      print('❌ Erro ao carregar Dots: $e');
    } finally {
      setState(() => _loadingDots = false);
    }
  }

  Future<void> _startScan() async {
    if (_scanning) return;

    setState(() {
      _scanning = true;
      _availableDots = [];
      _hasScanned = false;
    });

    try {
      final dots = await _dotService.scanForDots();
      
      if (!mounted) return;
      
      setState(() {
        _availableDots = dots;
        _scanning = false;
        _hasScanned = true;
      });

      if (dots.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Nenhum Dot encontrado. Certifique-se que o Dot está ligado.'),
              backgroundColor: Colors.orange,
              duration: Duration(seconds: 3),
            ),
          );
        }
      }
    } catch (e) {
      if (!mounted) return;
      
      setState(() {
        _scanning = false;
        _hasScanned = true;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro: $e'),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 4),
        ),
      );
    }
  }

  Future<void> _configureDot(BLEDotDevice dot) async {
    final ssidController = TextEditingController();
    final passController = TextEditingController();
    final nameController = TextEditingController(text: dot.name);

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        title: Text(
          'Adotar ${dot.name}',
          style: const TextStyle(color: Colors.white),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Nome do Dot
              TextField(
                controller: nameController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Nome do Dot',
                  hintText: 'Dot da Entrada, Cozinha...',
                  labelStyle: TextStyle(color: Colors.white70),
                  hintStyle: TextStyle(color: Colors.white30),
                  enabledBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: Colors.white30),
                  ),
                  focusedBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.primary),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              // WiFi SSID
              TextField(
                controller: ssidController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Nome da Rede WiFi (SSID)',
                  hintText: 'MinhaRede2.4GHz',
                  labelStyle: TextStyle(color: Colors.white70),
                  hintStyle: TextStyle(color: Colors.white30),
                  enabledBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: Colors.white30),
                  ),
                  focusedBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.primary),
                  ),
                  helperText: 'Apenas redes 2.4GHz',
                  helperStyle: TextStyle(color: Colors.white30, fontSize: 11),
                ),
              ),
              const SizedBox(height: 16),
              // WiFi Password
              TextField(
                controller: passController,
                obscureText: true,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Senha WiFi',
                  labelStyle: TextStyle(color: Colors.white70),
                  enabledBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: Colors.white30),
                  ),
                  focusedBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.primary),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: Colors.blue, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'O Dot vai reiniciar após a configuração e conectar automaticamente',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.8),
                          fontSize: 11,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
            ),
            child: const Text('Adotar Dot'),
          ),
        ],
      ),
    );

    if (confirmed == true && ssidController.text.isNotEmpty) {
      if (!mounted) return;

      // Mostrar progresso
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          backgroundColor: AppTheme.dark800,
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(color: AppTheme.primary),
              const SizedBox(height: 20),
              Text(
                _adoptionStep,
                style: const TextStyle(color: Colors.white),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );

      try {
        // 1. Gerar API Key no backend (endpoint público)
        setState(() => _adoptionStep = 'Gerando API Key...');
        await Future.delayed(const Duration(milliseconds: 300));

        // Obter MAC address do dispositivo BLE (será usado como deviceId)
        final deviceId = dot.device.remoteId.toString();
        
        print('📱 Gerando API Key para device: $deviceId');
        final apiKey = await _deviceApiService.generateApiKey(
          deviceId: deviceId,
        );

        // 2. Enviar configuração via BLE para o Dot
        setState(() => _adoptionStep = 'Enviando configuração via BLE...');
        await Future.delayed(const Duration(milliseconds: 300));
        
        print('📡 Enviando configuração BLE...');
        final bleConfig = await _dotService.sendConfig(
          dot.device,
          ssidController.text,
          passController.text,
          ApiConfig.baseUrl,
          apiKey, // Usar API Key gerada no backend
        );

        print('✅ BLE Config enviada!');
        print('Device ID: ${bleConfig['deviceId']}');
        print('API Key: ${bleConfig['apiKey']}');

        // 3. Aguardar Dot conectar e autenticar
        setState(() => _adoptionStep = 'Aguardando Dot conectar (10-15s)...');
        await Future.delayed(const Duration(seconds: 12));

        // 4. Registrar o device no backend
        setState(() => _adoptionStep = 'Registrando Dot...');
        await Future.delayed(const Duration(milliseconds: 300));
        
        print('📝 Registrando device no backend...');
        final authToken = await _authService.getAuthToken();
        if (authToken == null) {
          throw Exception('Usuário não autenticado');
        }
        
        final deviceDbId = await _deviceApiService.registerDevice(
          deviceId: bleConfig['deviceId']!,
          apiKey: bleConfig['apiKey']!,
          authToken: authToken,
          name: nameController.text.trim().isEmpty ? null : nameController.text.trim(),
        );

        if (!mounted) return;
        Navigator.pop(context); // Fechar dialog de progresso

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Dot "${nameController.text.isNotEmpty ? nameController.text : dot.name}" adotado com sucesso!'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 3),
          ),
        );

        // Limpar lista de scan e recarregar Dots adotados
        setState(() {
          _availableDots = [];
          _hasScanned = false;
        });
        
        await _loadAdoptedDots();
        
        // Mudar para aba de Dots Adotados
        _tabController.animateTo(1);
        
      } catch (e) {
        if (!mounted) return;
        Navigator.pop(context); // Fechar dialog de progresso

        print('❌ Erro ao configurar Dot: $e');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  String _adoptionStep = 'Processando...';

  Future<void> _showDotDetails(Map<String, dynamic> dot) async {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        title: Text(
          dot['name'] ?? dot['deviceId'],
          style: const TextStyle(color: Colors.white),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Status
              _buildDetailRow(
                'Status',
                dot['status'] == 'active' ? '✅ Ativo' : '⚠️ Inativo',
                Colors.white,
              ),
              const SizedBox(height: 12),
              
              // Device ID
              _buildDetailRow('Device ID', dot['deviceId'], Colors.white70),
              IconButton(
                icon: const Icon(Icons.copy, color: AppTheme.primary, size: 18),
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: dot['deviceId']));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Device ID copiado!')),
                  );
                },
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
              const SizedBox(height: 12),
              
              // IP Address
              if (dot['lastIpAddress'] != null)
                _buildDetailRow('IP Address', dot['lastIpAddress'], Colors.white70),
              
              if (dot['lastIpAddress'] != null)
                const SizedBox(height: 12),
              
              // Último Acesso
              if (dot['lastSeenAt'] != null)
                _buildDetailRow(
                  'Último Acesso',
                  _formatLastSeen(dot['lastSeenAt']),
                  Colors.white70,
                ),
              
              if (dot['lastSeenAt'] != null)
                const SizedBox(height: 12),
              
              // Data de Criação
              _buildDetailRow(
                'Adotado em',
                _formatDate(dot['createdAt']),
                Colors.white70,
              ),
              
              const SizedBox(height: 20),
              const Divider(color: Colors.white24),
              const SizedBox(height: 12),
              
              // Botão de Atualização OTA
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.purple.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.purple.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.system_update, color: Colors.purple, size: 20),
                        const SizedBox(width: 8),
                        const Text(
                          'Atualização OTA',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Atualizar firmware remotamente (em breve)',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.6),
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.orange.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'EM DESENVOLVIMENTO',
                        style: TextStyle(
                          color: Colors.orange,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fechar'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withOpacity(0.5),
            fontSize: 11,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            color: color,
            fontSize: 14,
            fontFamily: label.contains('ID') || label.contains('IP') ? 'monospace' : null,
          ),
        ),
      ],
    );
  }

  String _formatLastSeen(String? dateStr) {
    if (dateStr == null) return 'Nunca';
    
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(date);
      
      if (diff.inMinutes < 1) return 'Agora mesmo';
      if (diff.inMinutes < 60) return '${diff.inMinutes} min atrás';
      if (diff.inHours < 24) return '${diff.inHours}h atrás';
      return '${diff.inDays} dias atrás';
    } catch (e) {
      return dateStr;
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '-';
    
    try {
      final date = DateTime.parse(dateStr);
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateStr;
    }
  }

  bool _isOnline(Map<String, dynamic> dot) {
    if (dot['lastSeenAt'] == null) return false;
    
    try {
      final lastSeen = DateTime.parse(dot['lastSeenAt']);
      final now = DateTime.now();
      return now.difference(lastSeen).inMinutes < 5;
    } catch (e) {
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      appBar: AppBar(
        backgroundColor: AppTheme.dark800,
        title: const Text('Gerenciar Dots'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _currentTab == 1 ? _loadAdoptedDots : null,
            tooltip: 'Atualizar',
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.primary,
          labelColor: AppTheme.primary,
          unselectedLabelColor: Colors.white60,
          tabs: const [
            Tab(text: 'Adotar Novo Dot', icon: Icon(Icons.add_circle_outline)),
            Tab(text: 'Meus Dots', icon: Icon(Icons.devices)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Adotar Novo Dot
          _buildAdoptionTab(),
          
          // Tab 2: Meus Dots
          _buildMyDotsTab(),
        ],
      ),
    );
  }

  Widget _buildAdoptionTab() {
    return Column(
      children: [
        // Header com botão de scan
        Container(
          padding: const EdgeInsets.all(16),
          color: AppTheme.dark800,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      _scanning 
                          ? 'Buscando Dots...' 
                          : _hasScanned && _availableDots.isEmpty
                              ? 'Nenhum Dot encontrado'
                              : _availableDots.isEmpty
                                  ? 'Ligue o Dot e clique em Buscar'
                                  : '${_availableDots.length} Dot(s) encontrado(s)',
                      style: TextStyle(
                        color: _scanning ? AppTheme.primary : Colors.white70,
                        fontSize: 15,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  ElevatedButton.icon(
                    onPressed: _scanning ? null : _startScan,
                    icon: _scanning
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.bluetooth_searching),
                    label: Text(_scanning ? 'Buscando...' : 'Buscar Dots'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _scanning ? Colors.grey : AppTheme.primary,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
              if (!_scanning && _availableDots.isEmpty && !_hasScanned) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.blue.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline, color: Colors.blue, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Ligue o Granobox Dot próximo a este dispositivo',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.8),
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),

        // Lista de Dots ou estado vazio
        Expanded(
          child: _availableDots.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _hasScanned ? Icons.bluetooth_disabled : Icons.bluetooth_searching,
                        size: 64,
                        color: Colors.white.withOpacity(0.3),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _hasScanned 
                            ? 'Nenhum Dot encontrado' 
                            : 'Busque por Dots disponíveis',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.7),
                          fontSize: 16,
                        ),
                      ),
                      if (_hasScanned) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Certifique-se que o Dot está ligado\ne próximo deste dispositivo',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.4),
                            fontSize: 14,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _availableDots.length,
                  itemBuilder: (context, index) {
                    final dot = _availableDots[index];
                    return Card(
                      color: AppTheme.dark800,
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(
                            Icons.circle,
                            color: AppTheme.primary,
                            size: 20,
                          ),
                        ),
                        title: Text(
                          dot.name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        subtitle: Text(
                          dot.id,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.5),
                            fontSize: 11,
                            fontFamily: 'monospace',
                          ),
                        ),
                        trailing: ElevatedButton(
                          onPressed: () => _configureDot(dot),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          ),
                          child: const Text('Adotar'),
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildMyDotsTab() {
    if (_loadingDots) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.primary),
      );
    }

    if (_adoptedDots.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.devices_other,
              size: 80,
              color: Colors.white24,
            ),
            const SizedBox(height: 20),
            Text(
              'Nenhum Dot Adotado',
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Adote seu primeiro Granobox Dot',
              style: TextStyle(
                color: Colors.white.withOpacity(0.4),
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => _tabController.animateTo(0),
              icon: const Icon(Icons.add),
              label: const Text('Adotar Dot'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadAdoptedDots,
      color: AppTheme.primary,
      backgroundColor: AppTheme.dark800,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _adoptedDots.length,
        itemBuilder: (context, index) {
          final dot = _adoptedDots[index];
          final isOnline = _isOnline(dot);
          final statusColor = isOnline ? Colors.green : Colors.orange;

          return Card(
            color: AppTheme.dark800,
            margin: const EdgeInsets.only(bottom: 12),
            child: InkWell(
              onTap: () => _showDotDetails(dot),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        // Indicador de status
                        Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: statusColor,
                            shape: BoxShape.circle,
                            boxShadow: isOnline
                                ? [
                                    BoxShadow(
                                      color: statusColor.withOpacity(0.5),
                                      blurRadius: 8,
                                      spreadRadius: 2,
                                    ),
                                  ]
                                : null,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            dot['name'] ?? dot['deviceId'],
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        Icon(
                          Icons.chevron_right,
                          color: Colors.white.withOpacity(0.3),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Icon(
                          Icons.fingerprint,
                          size: 14,
                          color: Colors.white.withOpacity(0.4),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          dot['deviceId'],
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.5),
                            fontSize: 11,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        // Status badge
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: statusColor.withOpacity(0.4)),
                          ),
                          child: Text(
                            isOnline ? 'Online' : 'Offline',
                            style: TextStyle(
                              color: statusColor,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Icon(
                          Icons.access_time,
                          size: 12,
                          color: Colors.white.withOpacity(0.4),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _formatLastSeen(dot['lastSeenAt']),
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.5),
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                    if (dot['lastIpAddress'] != null) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(
                            Icons.wifi,
                            size: 14,
                            color: Colors.white.withOpacity(0.4),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            dot['lastIpAddress'],
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.5),
                              fontSize: 11,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

