/// Enum para modo de impressão
enum PrintMode {
  tcp('tcp', 'TCP Direto', 'Conexão direta via rede'),
  edge('edge', 'Edge Agent', 'Via Edge Agent');

  const PrintMode(this.value, this.displayName, this.description);

  final String value;
  final String displayName;
  final String description;

  static PrintMode fromString(String value) {
    return PrintMode.values.firstWhere(
      (mode) => mode.value == value,
      orElse: () => PrintMode.tcp,
    );
  }
}

/// Classe para resultado da impressão
class TagmentPrintResult {
  final bool success;
  final String message;
  final String? jobId;
  final Map<String, dynamic>? printResult;
  final Map<String, dynamic>? errorDetails;

  TagmentPrintResult._({
    required this.success,
    required this.message,
    this.jobId,
    this.printResult,
    this.errorDetails,
  });

  factory TagmentPrintResult.success(
    String message,
    String jobId,
    Map<String, dynamic>? printResult,
  ) {
    return TagmentPrintResult._(
      success: true,
      message: message,
      jobId: jobId,
      printResult: printResult,
    );
  }

  factory TagmentPrintResult.error(
    String message,
    Map<String, dynamic>? errorDetails,
  ) {
    return TagmentPrintResult._(
      success: false,
      message: message,
      errorDetails: errorDetails,
    );
  }
}

/// Classe para informações da impressora
class PrinterInfo {
  final String id;
  final String displayName;
  final String status;
  final String? externalLocationId;
  final int printsToday;
  final int totalPrints;
  final DateTime? lastSeenAt;
  final String? errorMessage;
  final List<String>? tags;
  final Map<String, dynamic>? connection;
  final Map<String, dynamic>? capabilities;
  final double? offsetX;
  final double? offsetY;
  final String? edgeAgentFingerprint; // ✅ NOVO: Fingerprint do Edge Agent
  final String? edgeIp; // ✅ NOVO: IP do Edge para impressão direta
  final int? edgePort; // ✅ NOVO: Porta do Edge (padrão: 3001)
  final String? operationId; // ✅ NOVO: ID da operação vinculada
  final String?
  interface; // ✅ NOVO: Interface de comunicação ('tcp', 'websocket', 'bluetooth', 'usb')
  final String? printMethod; // ✅ NOVO: Método de impressão ('tcp' ou 'websocket')
  final bool?
  isUSBPrinterFromBackend; // ✅ NOVO: Flag do backend indicando se é USB
  final String? brand; // ✅ NOVO: Marca da impressora
  final String? model; // ✅ NOVO: Modelo da impressora
  final String? location; // ✅ NOVO: Localização da impressora
  final bool? isDefault; // ✅ NOVO: Impressora padrão para o tipo de uso

  PrinterInfo({
    required this.id,
    required this.displayName,
    required this.status,
    this.externalLocationId,
    required this.printsToday,
    required this.totalPrints,
    this.lastSeenAt,
    this.errorMessage,
    this.tags,
    this.connection,
    this.capabilities,
    this.offsetX,
    this.offsetY,
    this.edgeAgentFingerprint, // ✅ NOVO
    this.edgeIp, // ✅ NOVO
    this.edgePort, // ✅ NOVO
    this.operationId, // ✅ NOVO
    this.interface, // ✅ NOVO
    this.printMethod, // ✅ NOVO
    this.isUSBPrinterFromBackend, // ✅ NOVO
    this.brand, // ✅ NOVO
    this.model, // ✅ NOVO
    this.location, // ✅ NOVO
    this.isDefault, // ✅ NOVO
  });

  factory PrinterInfo.fromJson(Map<String, dynamic> json) {
    return PrinterInfo(
      id: json['id'],
      displayName: json['displayName'],
      status: json['status'],
      externalLocationId: json['externalLocationId'],
      printsToday: json['printsToday'] ?? 0,
      totalPrints: json['totalPrints'] ?? 0,
      lastSeenAt: json['lastSeenAt'] != null
          ? DateTime.parse(json['lastSeenAt'])
          : null,
      errorMessage: json['errorMessage'],
      tags: json['tags'] != null ? List<String>.from(json['tags']) : null,
      connection: json['connection'],
      capabilities: json['capabilities'],
      offsetX: json['offsetX'] != null
          ? double.tryParse(json['offsetX'].toString())
          : null,
      offsetY: json['offsetY'] != null
          ? double.tryParse(json['offsetY'].toString())
          : null,
      edgeAgentFingerprint: json['edgeAgentFingerprint'], // ✅ NOVO
      edgeIp: json['edgeIp'], // ✅ NOVO
      edgePort: json['edgePort'], // ✅ NOVO
      operationId: json['operationId'], // ✅ NOVO
      interface: json['interface'], // ✅ NOVO: Interface de comunicação
      printMethod: json['printMethod'] ?? 'tcp', // ✅ NOVO (padrão: tcp)
      isUSBPrinterFromBackend: json['isUSBPrinter'], // ✅ NOVO: Flag do backend
      brand: json['brand'], // ✅ NOVO: Marca da impressora
      model: json['model'], // ✅ NOVO: Modelo da impressora
      location: json['location'], // ✅ NOVO: Localização da impressora
      isDefault: json['isDefault'], // ✅ NOVO: Impressora padrão
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'displayName': displayName,
      'status': status,
      'externalLocationId': externalLocationId,
      'printsToday': printsToday,
      'totalPrints': totalPrints,
      'lastSeenAt': lastSeenAt?.toIso8601String(),
      'errorMessage': errorMessage,
      'tags': tags,
      'connection': connection,
      'capabilities': capabilities,
      'offsetX': offsetX,
      'offsetY': offsetY,
      'edgeAgentFingerprint': edgeAgentFingerprint, // ✅ NOVO
      'edgeIp': edgeIp, // ✅ NOVO
      'edgePort': edgePort, // ✅ NOVO
      'operationId': operationId, // ✅ NOVO
      'interface': interface, // ✅ NOVO
      'printMethod': printMethod, // ✅ NOVO
      'brand': brand, // ✅ NOVO
      'model': model, // ✅ NOVO
      'location': location, // ✅ NOVO
    };
  }

  /// Verificar se é impressora de validade
  /// REMOVIDO: Agora todas as impressoras podem imprimir qualquer tipo de etiqueta
  bool get isValidadePrinter {
    return true; // Sempre true - todas as impressoras podem imprimir etiquetas de validade
  }

  /// Verificar se está online
  bool get isOnline => status == 'online' || status == 'active';

  /// Obter IP da impressora do campo connection
  String? get ip {
    if (connection != null && connection!['host'] != null) {
      return connection!['host'] as String;
    }
    return null;
  }

  /// Verificar se é impressora USB
  bool get isUSBPrinter {
    // ⭐ PRIORIZAR o valor enviado pelo backend
    if (isUSBPrinterFromBackend != null) {
      return isUSBPrinterFromBackend!;
    }

    if (edgeAgentFingerprint != null && edgeAgentFingerprint!.isNotEmpty) {
      return true;
    }

    // ⭐ FALLBACK: Tentar deduzir do connection
    if (connection != null) {
      final type = connection!['type']?.toString().toLowerCase();
      final interface = connection!['interface']?.toString().toLowerCase();
      final isUSB =
          type == 'usb' ||
          type == 'edge' ||
          interface == 'usb' ||
          interface == 'edge' ||
          (ip == null && connection!['port'] == null);
      print('🔍 DEBUG isUSBPrinter para ${displayName}:');
      print('   - type: $type');
      print('   - interface: $interface');
      print('   - ip: $ip');
      print('   - port: ${connection!['port']}');
      print('   - isUSB: $isUSB');
      return isUSB;
    }
    print('🔍 DEBUG isUSBPrinter para ${displayName}: connection é null');
    return false;
  }

  /// Verificar se é impressora Edge-Go (ESP32 com impressora USB)
  bool get isEdgeGo {
    if (connection != null) {
      final type = connection!['type']?.toString().toLowerCase();
      return type == 'edge-go' ||
          type == 'edge' ||
          edgeAgentFingerprint != null;
    }
    return edgeAgentFingerprint != null;
  }

  /// Verificar se é impressora TCP pura (não Edge-Go)
  bool get isTCPPrinter {
    return ip != null && !isUSBPrinter && !isEdgeGo;
  }

  /// Obter modo recomendado baseado no tipo de conexão
  PrintMode get recommendedMode {
    final mode = isUSBPrinter ? PrintMode.edge : PrintMode.tcp;
    print('🔍 DEBUG recommendedMode para ${displayName}:');
    print('   - isUSBPrinter: $isUSBPrinter');
    print('   - recommendedMode: ${mode.displayName}');
    return mode;
  }

  /// Verificar se modo TCP está disponível
  bool get canUseTCP {
    return isTCPPrinter; // USB não pode usar TCP direto
  }
}

/// Status da API Key
class ApiKeyStatus {
  final bool isValid;
  final String? error;
  final String? tier;
  final int? remainingRequests;
  final List<String>? features;

  ApiKeyStatus._({
    required this.isValid,
    this.error,
    this.tier,
    this.remainingRequests,
    this.features,
  });

  factory ApiKeyStatus.fromJson(Map<String, dynamic> json) {
    return ApiKeyStatus._(
      isValid: json['isValid'] ?? false,
      tier: json['tier'],
      remainingRequests: json['remainingRequests'],
      features: json['features'] != null
          ? List<String>.from(json['features'])
          : null,
    );
  }

  factory ApiKeyStatus.error(String error) {
    return ApiKeyStatus._(isValid: false, error: error);
  }
}

/// Status da impressora com detalhes TCP
class PrinterStatus {
  final bool online;
  final bool paperOut;
  final bool ribbonOut;
  final bool coverOpen;
  final int? temperature;
  final String? errorCode;
  final String? errorMessage;
  final String? rawResponse;

  PrinterStatus({
    required this.online,
    required this.paperOut,
    required this.ribbonOut,
    required this.coverOpen,
    this.temperature,
    this.errorCode,
    this.errorMessage,
    this.rawResponse,
  });

  factory PrinterStatus.fromJson(Map<String, dynamic> json) {
    return PrinterStatus(
      online: json['online'] ?? false,
      paperOut: json['paperOut'] ?? false,
      ribbonOut: json['ribbonOut'] ?? false,
      coverOpen: json['coverOpen'] ?? false,
      temperature: json['temperature'],
      errorCode: json['errorCode'],
      errorMessage: json['errorMessage'],
      rawResponse: json['rawResponse'],
    );
  }

  /// Verificar se há erros críticos
  bool get hasCriticalErrors =>
      paperOut || ribbonOut || coverOpen || errorCode != null;

  /// Obter mensagem de erro amigável
  String? get friendlyErrorMessage {
    if (paperOut) return 'Papel acabou - recarregue a impressora';
    if (ribbonOut) return 'Fita acabou - troque a fita da impressora';
    if (coverOpen) return 'Tampa aberta - feche a tampa da impressora';
    if (errorCode != null) return errorMessage ?? 'Erro da impressora';
    return null;
  }
}

/// Resultado detalhado da impressão
class PrintResult {
  final bool success;
  final String message;
  final String method;
  final DateTime timestamp;
  final PrinterStatus? printerStatus;
  final bool actuallyPrinted;
  final int bytesSent;

  PrintResult({
    required this.success,
    required this.message,
    required this.method,
    required this.timestamp,
    this.printerStatus,
    required this.actuallyPrinted,
    required this.bytesSent,
  });

  factory PrintResult.fromJson(Map<String, dynamic> json) {
    return PrintResult(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      method: json['method'] ?? '',
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
      printerStatus: json['printerStatus'] != null
          ? PrinterStatus.fromJson(json['printerStatus'])
          : null,
      actuallyPrinted: json['actuallyPrinted'] ?? false,
      bytesSent: json['bytesSent'] ?? 0,
    );
  }
}
