import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

/// Serviço para criação de novas impressoras via API Granobox
class PrinterCreateService {
  final String apiKey; // Token JWT do Granobox
  
  PrinterCreateService({required this.apiKey});
  
  /// Criar nova impressora TCP
  Future<bool> criarImpressoraTCP({
    required String displayName,
    required String host,
    required String externalCustomerId,
    required String clientId, // ⭐ OBRIGATÓRIO: ClientId para filtro
    String? operationId, // ⭐ NOVO: Operação vinculada
    int port = 9100,
    String protocol = 'zpl',
    int timeout = 30000,
    String? brand,
    String? model,
    String? thermalType,
    List<String>? tags,
    int? dpi,
    double? maxWidthMm,
    double? maxHeightMm,
    bool supportsZPL = true,
    bool supportsCutter = false,
    bool supportsColor = false,
    double? offsetX,
    double? offsetY,
    bool autoConnect = true,
    bool debugMode = false,
    bool allowRemotePrinting = true,
    int? maxConcurrentJobs,
  }) async {
    try {
      print('🔧 Criando nova impressora TCP: $displayName');
      print('   🌐 Host: $host:$port');
      print('   📡 Protocolo: $protocol');
      
      // ⭐ Formato do Granobox (diferente do Tagment)
      final Map<String, dynamic> data = {
        'name': displayName,
        'type': 'tcp',
        'ip': host,
        'port': port,
        'clientId': clientId, // ⭐ OBRIGATÓRIO
        if (brand != null) 'brand': brand,
        if (model != null) 'model': model,
        if (operationId != null) 'operationId': operationId,
        'capabilities': {
          'dpi': dpi ?? 203,
          'maxWidthMm': maxWidthMm ?? 104,
          'maxHeightMm': maxHeightMm ?? 150,
          'supportsZPL': supportsZPL,
          'supportsCutter': supportsCutter,
          'supportsColor': supportsColor,
        },
        'usage': tags ?? ['validity'],
        'offsetX': offsetX ?? 0,
        'offsetY': offsetY ?? 0,
        'isActive': true,
      };
      
      print('📊 Dados da impressora: $data');
      
      return await _fazerRequisicao(data);
    } catch (e) {
      print('❌ Erro ao criar impressora TCP: $e');
      rethrow;
    }
  }
  
  /// Criar nova impressora USB
  Future<bool> criarImpressoraUSB({
    required String displayName,
    required String externalCustomerId,
    String? devicePath,
    String? cupsName,
    String? cupsUri,
    int usbTimeout = 30000,
    String? brand,
    String? model,
    String? thermalType,
    List<String>? tags,
    int? dpi,
    double? maxWidthMm,
    double? maxHeightMm,
    bool supportsZPL = true,
    bool supportsCutter = false,
    bool supportsColor = false,
    double? offsetX,
    double? offsetY,
    bool autoConnect = true,
    bool debugMode = false,
    bool allowRemotePrinting = true,
    int? maxConcurrentJobs,
  }) async {
    try {
      print('🔧 Criando nova impressora USB: $displayName');
      print('   🔌 Device Path: $devicePath');
      print('   🖨️ CUPS Name: $cupsName');
      
      final Map<String, dynamic> data = {
        'displayName': displayName,
        'externalCustomerId': externalCustomerId,
        'externalPrinterRef': 'printer_${displayName.toLowerCase().replaceAll(' ', '_')}_${DateTime.now().millisecondsSinceEpoch}',
        if (brand != null) 'brand': brand,
        if (model != null) 'model': model,
        if (thermalType != null) 'thermalType': thermalType,
        'connection': {
          'type': 'usb',
          if (devicePath != null) 'devicePath': devicePath,
          if (cupsName != null) 'cupsName': cupsName,
          if (cupsUri != null) 'cupsUri': cupsUri,
          'usbTimeout': usbTimeout,
        },
        'capabilities': {
          'dpi': dpi ?? 203,
          'maxWidthMm': maxWidthMm ?? 104,
          'maxHeightMm': maxHeightMm ?? 150,
          'supportsZPL': supportsZPL,
          'supportsCutter': supportsCutter,
          'supportsColor': supportsColor,
        },
        'printAgent': {
          'autoConnect': autoConnect,
          'debugMode': debugMode,
          'allowRemotePrinting': allowRemotePrinting,
          if (maxConcurrentJobs != null) 'maxConcurrentJobs': maxConcurrentJobs,
        },
        'tags': tags ?? ['usb', 'edge-agent'],
        'offsetX': offsetX ?? 0,
        'offsetY': offsetY ?? 0,
        'status': 'offline',
      };
      
      print('📊 Dados da impressora: $data');
      
      return await _fazerRequisicao(data);
    } catch (e) {
      print('❌ Erro ao criar impressora USB: $e');
      rethrow;
    }
  }
  
  /// ✅ NOVO: Criar impressora Edge ESP32
  Future<bool> criarImpressoraEdge({
    required String displayName,
    required String externalCustomerId,
    required String clientId, // ⭐ OBRIGATÓRIO
    required String edgeIp,
    int edgePort = 3001,
    String? edgeFingerprint,
    String? operationId,
    String? brand,
    String? model,
    List<String>? tags,
    int? dpi,
    double? maxWidthMm,
    double? maxHeightMm,
    double? offsetX,
    double? offsetY,
  }) async {
    try {
      print('🔧 Criando nova impressora Edge ESP32: $displayName');
      print('   🌐 Edge IP: $edgeIp:$edgePort');
      
      // ⭐ Formato do Granobox
      final Map<String, dynamic> data = {
        'name': displayName,
        'type': 'edge-go',
        'ip': edgeIp,
        'port': edgePort,
        'clientId': clientId, // ⭐ OBRIGATÓRIO
        if (brand != null) 'brand': brand,
        if (model != null) 'model': model,
        if (operationId != null) 'operationId': operationId,
        if (edgeFingerprint != null) 'deviceId': edgeFingerprint,
        'capabilities': {
          'dpi': dpi ?? 203,
          'maxWidthMm': maxWidthMm ?? 60,
          'maxHeightMm': maxHeightMm ?? 60,
          'supportsZPL': true,
          'supportsCutter': false,
          'supportsColor': false,
        },
        'usage': tags ?? ['validity'],
        'offsetX': offsetX ?? 0,
        'offsetY': offsetY ?? 0,
        'isActive': true,
      };
      
      print('📊 Dados da impressora Edge: $data');
      
      return await _fazerRequisicao(data);
    } catch (e) {
      print('❌ Erro ao criar impressora Edge: $e');
      rethrow;
    }
  }
  
  /// Criar impressora com configuração completa
  Future<bool> criarImpressoraCompleta({
    required String displayName,
    required String tipoConexao,
    required String externalCustomerId,
    // Configurações de conexão
    String? host,
    int? port,
    String? protocol,
    int? timeout,
    String? devicePath,
    String? cupsName,
    String? cupsUri,
    int? usbTimeout,
    // Configurações básicas
    String? brand,
    String? model,
    String? thermalType,
    List<String>? tags,
    // Capacidades
    int? dpi,
    double? maxWidthMm,
    double? maxHeightMm,
    bool? supportsZPL,
    bool? supportsCutter,
    bool? supportsColor,
    // Posicionamento
    double? offsetX,
    double? offsetY,
    // Print Agent
    bool? autoConnect,
    bool? debugMode,
    bool? allowRemotePrinting,
    int? maxConcurrentJobs,
  }) async {
    try {
      print('🔧 Criando impressora completa: $displayName');
      print('   🔌 Tipo: $tipoConexao');
      
      final Map<String, dynamic> data = {
        'displayName': displayName,
        'externalCustomerId': externalCustomerId,
        'connection': _buildConnectionConfig(
          tipoConexao: tipoConexao,
          host: host,
          port: port,
          protocol: protocol,
          timeout: timeout,
          devicePath: devicePath,
          cupsName: cupsName,
          cupsUri: cupsUri,
          usbTimeout: usbTimeout,
        ),
        'capabilities': _buildCapabilitiesConfig(
          dpi: dpi,
          maxWidthMm: maxWidthMm,
          maxHeightMm: maxHeightMm,
          supportsZPL: supportsZPL,
          supportsCutter: supportsCutter,
          supportsColor: supportsColor,
        ),
        'printAgent': _buildPrintAgentConfig(
          autoConnect: autoConnect,
          debugMode: debugMode,
          allowRemotePrinting: allowRemotePrinting,
          maxConcurrentJobs: maxConcurrentJobs,
        ),
        'status': 'offline',
      };
      
      // Adicionar campos opcionais
      if (brand != null) data['brand'] = brand;
      if (model != null) data['model'] = model;
      if (thermalType != null) data['thermalType'] = thermalType;
      if (tags != null) data['tags'] = tags;
      if (offsetX != null) data['offsetX'] = offsetX;
      if (offsetY != null) data['offsetY'] = offsetY;
      
      print('📊 Configuração completa: $data');
      
      return await _fazerRequisicao(data);
    } catch (e) {
      print('❌ Erro ao criar impressora completa: $e');
      rethrow;
    }
  }
  
  /// Construir configuração de conexão
  Map<String, dynamic> _buildConnectionConfig({
    required String tipoConexao,
    String? host,
    int? port,
    String? protocol,
    int? timeout,
    String? devicePath,
    String? cupsName,
    String? cupsUri,
    int? usbTimeout,
  }) {
    final Map<String, dynamic> connection = {'type': tipoConexao};
    
    if (tipoConexao == 'tcp') {
      if (host != null) connection['host'] = host;
      if (port != null) connection['port'] = port;
      if (protocol != null) connection['protocol'] = protocol;
      if (timeout != null) connection['timeout'] = timeout;
    } else if (tipoConexao == 'usb') {
      if (devicePath != null) connection['devicePath'] = devicePath;
      if (cupsName != null) connection['cupsName'] = cupsName;
      if (cupsUri != null) connection['cupsUri'] = cupsUri;
      if (usbTimeout != null) connection['usbTimeout'] = usbTimeout;
    }
    
    return connection;
  }
  
  /// Construir configuração de capacidades
  Map<String, dynamic> _buildCapabilitiesConfig({
    int? dpi,
    double? maxWidthMm,
    double? maxHeightMm,
    bool? supportsZPL,
    bool? supportsCutter,
    bool? supportsColor,
  }) {
    final Map<String, dynamic> capabilities = {};
    
    if (dpi != null) capabilities['dpi'] = dpi;
    if (maxWidthMm != null) capabilities['maxWidthMm'] = maxWidthMm;
    if (maxHeightMm != null) capabilities['maxHeightMm'] = maxHeightMm;
    if (supportsZPL != null) capabilities['supportsZPL'] = supportsZPL;
    if (supportsCutter != null) capabilities['supportsCutter'] = supportsCutter;
    if (supportsColor != null) capabilities['supportsColor'] = supportsColor;
    
    return capabilities;
  }
  
  /// Construir configuração do Print Agent
  Map<String, dynamic> _buildPrintAgentConfig({
    bool? autoConnect,
    bool? debugMode,
    bool? allowRemotePrinting,
    int? maxConcurrentJobs,
  }) {
    final Map<String, dynamic> printAgent = {};
    
    if (autoConnect != null) printAgent['autoConnect'] = autoConnect;
    if (debugMode != null) printAgent['debugMode'] = debugMode;
    if (allowRemotePrinting != null) printAgent['allowRemotePrinting'] = allowRemotePrinting;
    if (maxConcurrentJobs != null) printAgent['maxConcurrentJobs'] = maxConcurrentJobs;
    
    return printAgent;
  }
  
  /// Fazer requisição POST para a API Granobox
  Future<bool> _fazerRequisicao(Map<String, dynamic> data) async {
    try {
      print('📡 Enviando requisição POST para criar impressora no Granobox');
      
      final response = await http.post(
        Uri.parse(ApiConfig.printersUrl),
        headers: {
          'Authorization': 'Bearer $apiKey',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(data),
      );
      
      print('📊 Status da resposta: ${response.statusCode}');
      print('📄 Body da resposta: ${response.body}');
      
      if (response.statusCode == 201 || response.statusCode == 200) {
        print('✅ Impressora criada com sucesso');
        return true;
      } else if (response.statusCode == 409 || response.statusCode == 400) {
        // Conflito ou dados inválidos
        print('❌ Erro de validação: ${response.statusCode} - ${response.body}');
        
        String errorMessage = 'Erro ao criar impressora';
        try {
          final errorData = jsonDecode(response.body);
          errorMessage = errorData['message'] ?? errorData['error'] ?? errorMessage;
        } catch (_) {
          // Se não conseguir parsear, usar mensagem padrão
        }
        
        throw Exception(errorMessage);
      } else if (response.statusCode == 500) {
        print('❌ Erro interno no servidor: ${response.body}');
        
        // Mensagens específicas para erros comuns
        if (response.body.contains('duplicate') || response.body.contains('already exists')) {
          throw Exception('Esta impressora já está registrada. Verifique se ela já está associada a outro cliente.');
        }
        
        throw Exception('Erro interno do servidor. Tente novamente mais tarde.');
      } else {
        print('❌ Erro na API: ${response.statusCode} - ${response.body}');
        throw Exception('Erro ${response.statusCode}: Não foi possível criar a impressora');
      }
    } catch (e) {
      print('❌ Erro na requisição: $e');
      rethrow;
    }
  }
  
  /// Validar dados obrigatórios para TCP
  String? validarDadosTCP({
    required String displayName,
    required String host,
    int? port,
  }) {
    if (displayName.trim().isEmpty) {
      return 'Nome da impressora é obrigatório';
    }
    
    if (host.trim().isEmpty) {
      return 'Endereço IP é obrigatório';
    }
    
    // Sem validação de formato - aceita qualquer coisa
    print('🔍 Validando host no service: "${host.trim()}"');
    print('✅ Validação do service passou para: "${host.trim()}"');
    
    if (port != null && (port < 1 || port > 65535)) {
      return 'Porta deve estar entre 1 e 65535';
    }
    
    return null;
  }
  
  /// Validar dados obrigatórios para USB
  String? validarDadosUSB({
    required String displayName,
  }) {
    if (displayName.trim().isEmpty) {
      return 'Nome da impressora é obrigatório';
    }
    
    return null;
  }
}
