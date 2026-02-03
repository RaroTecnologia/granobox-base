/// Modelos para impressoras do Granobox (100% independente do Tagment)
/// 
/// Este arquivo substitui a dependência do Tagment para impressoras,
/// mantendo apenas templates no Tagment.

/// Enum para modo de impressão (MQTT removido - usando apenas TCP e WebSocket)
enum PrintMode {
  tcp('tcp', 'TCP Direto', 'Conexão direta via rede'),
  websocket('websocket', 'WebSocket', 'Via WebSocket (Edge Agent)');

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

/// Enum para status da impressora
enum PrinterStatus {
  online('online', 'Online'),
  offline('offline', 'Offline'),
  error('error', 'Erro'),
  active('active', 'Ativa'),
  inactive('inactive', 'Inativa');

  const PrinterStatus(this.value, this.displayName);

  final String value;
  final String displayName;

  static PrinterStatus fromString(String value) {
    return PrinterStatus.values.firstWhere(
      (status) => status.value == value,
      orElse: () => PrinterStatus.offline,
    );
  }
}

/// Enum para tipo de uso da impressora
enum PrinterUsage {
  validity('validity', 'Validade'),
  label('label', 'Rótulo');

  const PrinterUsage(this.value, this.displayName);

  final String value;
  final String displayName;

  static PrinterUsage fromString(String value) {
    return PrinterUsage.values.firstWhere(
      (usage) => usage.value == value,
      orElse: () => PrinterUsage.validity,
    );
  }
}

/// Capabilities da impressora
class PrinterCapabilities {
  final int? dpi;
  final double? maxWidthMm;
  final double? maxHeightMm;
  final bool? supportsZPL;
  final bool? supportsCutter;
  final bool? supportsColor;

  const PrinterCapabilities({
    this.dpi,
    this.maxWidthMm,
    this.maxHeightMm,
    this.supportsZPL,
    this.supportsCutter,
    this.supportsColor,
  });

  factory PrinterCapabilities.fromJson(Map<String, dynamic> json) {
    return PrinterCapabilities(
      dpi: json['dpi'],
      maxWidthMm: json['maxWidthMm']?.toDouble(),
      maxHeightMm: json['maxHeightMm']?.toDouble(),
      supportsZPL: json['supportsZPL'],
      supportsCutter: json['supportsCutter'],
      supportsColor: json['supportsColor'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'dpi': dpi,
      'maxWidthMm': maxWidthMm,
      'maxHeightMm': maxHeightMm,
      'supportsZPL': supportsZPL,
      'supportsCutter': supportsCutter,
      'supportsColor': supportsColor,
    };
  }
}

/// Informações de conexão da impressora
class PrinterConnection {
  final String type; // 'tcp', 'edge'
  final String? host;
  final int? port;
  final String? protocol;
  final String? interface; // 'tcp', 'websocket', 'bluetooth', 'usb'
  final String? printMethod; // 'tcp' ou 'websocket'

  const PrinterConnection({
    required this.type,
    this.host,
    this.port,
    this.protocol,
    this.interface,
    this.printMethod,
  });

  factory PrinterConnection.fromJson(Map<String, dynamic> json) {
    return PrinterConnection(
      type: json['type'] ?? 'tcp',
      host: json['host'],
      port: json['port'],
      protocol: json['protocol'],
      interface: json['interface'],
      printMethod: json['printMethod'] ?? 'tcp',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'host': host,
      'port': port,
      'protocol': protocol,
      'interface': interface,
      'printMethod': printMethod,
    };
  }
}

/// Modelo principal da impressora do Granobox
class GranoboxPrinter {
  final String id;
  final String name;
  final String type; // 'tcp', 'edge', 'mqtt'
  final PrinterStatus status;
  final String? deviceId; // Para impressoras IoT (Edge-Go, Dot)
  final String? location;
  final List<String> usage; // ['validity', 'label']
  final bool isActive;
  final String? notes;
  
  // Conexão
  final PrinterConnection connection;
  
  // Capabilities
  final PrinterCapabilities? capabilities;
  
  // Offsets
  final double offsetX;
  final double offsetY;
  
  // Marca e modelo
  final String? brand;
  final String? model;
  
  // Relacionamentos
  final String? clientId;
  final String? operationId;
  final String? userId;
  
  // Timestamps
  final DateTime createdAt;
  final DateTime updatedAt;
  
  // Flags especiais
  final bool isUSBPrinter;

  const GranoboxPrinter({
    required this.id,
    required this.name,
    required this.type,
    required this.status,
    this.deviceId,
    this.location,
    this.usage = const ['validity'],
    this.isActive = true,
    this.notes,
    required this.connection,
    this.capabilities,
    this.offsetX = 0.0,
    this.offsetY = 0.0,
    this.brand,
    this.model,
    this.clientId,
    this.operationId,
    this.userId,
    required this.createdAt,
    required this.updatedAt,
    this.isUSBPrinter = false,
  });

  factory GranoboxPrinter.fromJson(Map<String, dynamic> json) {
    return GranoboxPrinter(
      id: json['id'],
      name: json['name'] ?? 'Impressora',
      type: json['type'] ?? 'tcp',
      status: PrinterStatus.fromString(json['status'] ?? 'offline'),
      deviceId: json['deviceId'],
      location: json['location'],
      usage: json['usage'] != null 
          ? List<String>.from(json['usage'])
          : ['validity'],
      isActive: json['isActive'] ?? true,
      notes: json['notes'],
      connection: PrinterConnection(
        type: json['type'] ?? 'tcp',
        host: json['ip'],
        port: json['port'],
        protocol: json['type'] ?? 'tcp',
        interface: json['interface'],
        printMethod: json['printMethod'] ?? 'tcp',
      ),
      capabilities: json['capabilities'] != null
          ? PrinterCapabilities.fromJson(json['capabilities'])
          : null,
      offsetX: json['offsetX']?.toDouble() ?? 0.0,
      offsetY: json['offsetY']?.toDouble() ?? 0.0,
      brand: json['brand'],
      model: json['model'],
      clientId: json['clientId'],
      operationId: json['operationId'],
      userId: json['userId'],
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null 
          ? DateTime.parse(json['updatedAt'])
          : DateTime.now(),
      isUSBPrinter: json['isUSBPrinter'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'status': status.value,
      'deviceId': deviceId,
      'location': location,
      'usage': usage,
      'isActive': isActive,
      'notes': notes,
      'ip': connection.host,
      'port': connection.port,
      'interface': connection.interface,
      'printMethod': connection.printMethod,
      'capabilities': capabilities?.toJson(),
      'offsetX': offsetX,
      'offsetY': offsetY,
      'brand': brand,
      'model': model,
      'clientId': clientId,
      'operationId': operationId,
      'userId': userId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'isUSBPrinter': isUSBPrinter,
    };
  }

  /// Verificar se está online
  bool get isOnline => status == PrinterStatus.online || status == PrinterStatus.active;

  /// Verificar se pode imprimir etiquetas de validade
  bool get canPrintValidity => usage.contains('validity');

  /// Verificar se pode imprimir rótulos
  bool get canPrintLabels => usage.contains('label');

  /// Verificar se é impressora Edge-Go (ESP32 com impressora USB)
  bool get isEdgeGo {
    return type == 'edge' || 
           deviceId != null && deviceId!.startsWith('edge-go') ||
           isUSBPrinter;
  }

  /// Verificar se é impressora TCP pura (não Edge-Go)
  bool get isTCPPrinter {
    return type == 'tcp' && connection.host != null && !isUSBPrinter;
  }

  /// Obter modo recomendado baseado no tipo de conexão
  PrintMode get recommendedMode {
    if (isUSBPrinter || isEdgeGo) {
      return PrintMode.websocket;
    } else {
      return PrintMode.tcp;
    }
  }

  /// Verificar se modo TCP está disponível
  bool get canUseTCP {
    return isTCPPrinter && connection.host != null && connection.port != null;
  }

  /// Verificar se modo WebSocket está disponível
  bool get canUseWebSocket {
    return isEdgeGo || isUSBPrinter || connection.printMethod == 'websocket' || connection.interface == 'websocket';
  }

  /// Criar cópia com alterações
  GranoboxPrinter copyWith({
    String? id,
    String? name,
    String? type,
    PrinterStatus? status,
    String? deviceId,
    String? location,
    List<String>? usage,
    bool? isActive,
    String? notes,
    PrinterConnection? connection,
    PrinterCapabilities? capabilities,
    double? offsetX,
    double? offsetY,
    String? brand,
    String? model,
    String? clientId,
    String? operationId,
    String? userId,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isUSBPrinter,
  }) {
    return GranoboxPrinter(
      id: id ?? this.id,
      name: name ?? this.name,
      type: type ?? this.type,
      status: status ?? this.status,
      deviceId: deviceId ?? this.deviceId,
      location: location ?? this.location,
      usage: usage ?? this.usage,
      isActive: isActive ?? this.isActive,
      notes: notes ?? this.notes,
      connection: connection ?? this.connection,
      capabilities: capabilities ?? this.capabilities,
      offsetX: offsetX ?? this.offsetX,
      offsetY: offsetY ?? this.offsetY,
      brand: brand ?? this.brand,
      model: model ?? this.model,
      clientId: clientId ?? this.clientId,
      operationId: operationId ?? this.operationId,
      userId: userId ?? this.userId,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isUSBPrinter: isUSBPrinter ?? this.isUSBPrinter,
    );
  }
}

/// Resultado da impressão
class PrintResult {
  final bool success;
  final String message;
  final String? jobId;
  final Map<String, dynamic>? details;
  final Map<String, dynamic>? errorDetails;

  const PrintResult._({
    required this.success,
    required this.message,
    this.jobId,
    this.details,
    this.errorDetails,
  });

  factory PrintResult.success(
    String message, {
    String? jobId,
    Map<String, dynamic>? details,
  }) {
    return PrintResult._(
      success: true,
      message: message,
      jobId: jobId,
      details: details,
    );
  }

  factory PrintResult.error(
    String message, {
    Map<String, dynamic>? errorDetails,
  }) {
    return PrintResult._(
      success: false,
      message: message,
      errorDetails: errorDetails,
    );
  }
}

/// Request para criar/atualizar impressora
class CreatePrinterRequest {
  final String name;
  final String type;
  final String? deviceId;
  final String? ip;
  final int? port;
  final String? location;
  final List<String>? usage;
  final bool? isActive;
  final String? notes;
  final String? interface;
  final String? printMethod;
  final bool? isUSBPrinter;
  final PrinterCapabilities? capabilities;
  final double? offsetX;
  final double? offsetY;
  final String? brand;
  final String? model;
  final String? operationId;

  const CreatePrinterRequest({
    required this.name,
    required this.type,
    this.deviceId,
    this.ip,
    this.port,
    this.location,
    this.usage,
    this.isActive,
    this.notes,
    this.interface,
    this.printMethod,
    this.isUSBPrinter,
    this.capabilities,
    this.offsetX,
    this.offsetY,
    this.brand,
    this.model,
    this.operationId,
  });

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'type': type,
      'deviceId': deviceId,
      'ip': ip,
      'port': port,
      'location': location,
      'usage': usage,
      'isActive': isActive,
      'notes': notes,
      'interface': interface,
      'printMethod': printMethod,
      'isUSBPrinter': isUSBPrinter,
      'capabilities': capabilities?.toJson(),
      'offsetX': offsetX,
      'offsetY': offsetY,
      'brand': brand,
      'model': model,
      'operationId': operationId,
    };
  }
}
