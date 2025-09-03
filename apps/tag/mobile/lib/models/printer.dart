enum PrinterType {
  tcp,
  bluetooth,
}

enum ConnectionStatus {
  disconnected,
  connecting,
  connected,
  error,
}

enum PrinterLanguage {
  zpl,    // Zebra Programming Language
  cpcl,   // Comtec Printer Control Language
  auto,   // Detecção automática
}

class Printer {
  final String id;
  final String name;
  final PrinterType type;
  final String address; // IP para TCP, MAC para Bluetooth
  final int? port; // Apenas para TCP
  final bool isDefault;
  final DateTime createdAt;
  final ConnectionStatus connectionStatus;
  final DateTime? lastConnectedAt;
  final String? lastError;
  final PrinterLanguage language; // Nova propriedade para linguagem da impressora

  Printer({
    required this.id,
    required this.name,
    required this.type,
    required this.address,
    this.port,
    this.isDefault = false,
    DateTime? createdAt,
    this.connectionStatus = ConnectionStatus.disconnected,
    this.lastConnectedAt,
    this.lastError,
    this.language = PrinterLanguage.auto, // Padrão é detecção automática
  }) : createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type.name,
      'address': address,
      'port': port,
      'isDefault': isDefault,
      'createdAt': createdAt.toIso8601String(),
      'connectionStatus': connectionStatus.name,
      'lastConnectedAt': lastConnectedAt?.toIso8601String(),
      'lastError': lastError,
      'language': language.name, // Incluir linguagem no JSON
    };
  }

  factory Printer.fromJson(Map<String, dynamic> json) {
    return Printer(
      id: json['id'],
      name: json['name'],
      type: PrinterType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => PrinterType.tcp,
      ),
      address: json['address'],
      port: json['port'],
      isDefault: json['isDefault'] ?? false,
      createdAt: DateTime.parse(json['createdAt']),
      connectionStatus: ConnectionStatus.values.firstWhere(
        (e) => e.name == (json['connectionStatus'] ?? 'disconnected'),
        orElse: () => ConnectionStatus.disconnected,
      ),
      lastConnectedAt: json['lastConnectedAt'] != null ? DateTime.parse(json['lastConnectedAt']) : null,
      lastError: json['lastError'],
      language: PrinterLanguage.values.firstWhere( // Converter linguagem do JSON
        (e) => e.name == (json['language'] ?? 'auto'),
        orElse: () => PrinterLanguage.auto,
      ),
    );
  }

  Printer copyWith({
    String? id,
    String? name,
    PrinterType? type,
    String? address,
    int? port,
    bool? isDefault,
    DateTime? createdAt,
    ConnectionStatus? connectionStatus,
    DateTime? lastConnectedAt,
    String? lastError,
    PrinterLanguage? language, // Incluir linguagem no copyWith
  }) {
    return Printer(
      id: id ?? this.id,
      name: name ?? this.name,
      type: type ?? this.type,
      address: address ?? this.address,
      port: port ?? this.port,
      isDefault: isDefault ?? this.isDefault,
      createdAt: createdAt ?? this.createdAt,
      connectionStatus: connectionStatus ?? this.connectionStatus,
      lastConnectedAt: lastConnectedAt ?? this.lastConnectedAt,
      lastError: lastError ?? this.lastError,
      language: language ?? this.language, // Incluir linguagem
    );
  }

  @override
  String toString() {
    return 'Printer(id: $id, name: $name, type: $type, address: $address, port: $port, isDefault: $isDefault, status: $connectionStatus, language: $language)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Printer &&
        other.id == id &&
        other.name == name &&
        other.type == type &&
        other.address == address &&
        other.port == port &&
        other.isDefault == isDefault &&
        other.language == language; // Incluir linguagem na comparação
  }

  @override
  int get hashCode {
    return id.hashCode ^
        name.hashCode ^
        type.hashCode ^
        address.hashCode ^
        port.hashCode ^
        isDefault.hashCode ^
        language.hashCode; // Incluir linguagem no hashCode
  }
}
