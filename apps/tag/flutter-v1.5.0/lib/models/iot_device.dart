/// Modelo unificado para dispositivos IoT (Edge-Go e Dot)
class IoTDevice {
  final String id;              // Fingerprint/MAC ou device_id (ex: "80:B5:4E:D7:E3:38" ou "edge-go-d7e2b4")
  final String name;            // Nome BLE (ex: "Edge-Go 80:B5:4E:D7:E3:38" ou "edge-go-d7e2b4")
  final IoTDeviceType type;     // edge-go ou dot
  final String? localName;      // Nome customizado (ex: "Expedição")
  final bool isOnline;          // Online/Offline
  final int? rssi;              // Sinal BLE (-32 = perto, -80 = longe)
  final IoTDeviceStatus? status; // Status detalhado
  final DateTime? lastSeen;     // Última vez visto
  final bool isAdopted;         // ⭐ Se já foi adotado pelo usuário
  final String? macAddress;     // ⭐ NOVO: MAC address do BLE (sempre disponível para dispositivos BLE)
  
  IoTDevice({
    required this.id,
    required this.name,
    required this.type,
    this.localName,
    this.isOnline = false,
    this.rssi,
    this.status,
    this.lastSeen,
    this.isAdopted = false,      // ⭐ Padrão: não adotado
    this.macAddress,             // ⭐ NOVO
  });
  
  /// Display name: prioriza localName, senão usa name
  String get displayName => localName?.isNotEmpty == true ? localName! : name;
  
  /// Ícone baseado no tipo
  String get icon {
    switch (type) {
      case IoTDeviceType.edgeGo:
        return '🖨️';
      case IoTDeviceType.edgePro:
        return '🖨️';
      case IoTDeviceType.dot:
        return '📱';
    }
  }
  
  /// Cor do status
  String get statusColor {
    if (!isOnline) return '⚪';
    if (rssi != null && rssi! > -50) return '🟢'; // Perto
    if (rssi != null && rssi! > -70) return '🟡'; // Médio
    return '🔴'; // Longe ou sem sinal
  }
  
  /// Descrição da proximidade
  String get proximityDescription {
    if (rssi == null) return 'Desconhecido';
    if (rssi! > -50) return 'Muito perto';
    if (rssi! > -70) return 'Próximo';
    if (rssi! > -85) return 'Distante';
    return 'Muito distante';
  }
}

enum IoTDeviceType {
  edgeGo,
  edgePro,
  dot,
}

/// Converte string para IoTDeviceType
IoTDeviceType iotDeviceTypeFromString(String type) {
  switch (type.toLowerCase()) {
    case 'edge-go':
      return IoTDeviceType.edgeGo;
    case 'edge-pro':
      return IoTDeviceType.edgePro;
    case 'dot':
      return IoTDeviceType.dot;
    default:
      return IoTDeviceType.edgeGo; // Padrão
  }
}

/// Converte IoTDeviceType para string
String iotDeviceTypeToString(IoTDeviceType type) {
  switch (type) {
    case IoTDeviceType.edgeGo:
      return 'edge-go';
    case IoTDeviceType.edgePro:
      return 'edge-pro';
    case IoTDeviceType.dot:
      return 'dot';
  }
}

/// Status detalhado do dispositivo
class IoTDeviceStatus {
  // WiFi
  final String? wifiSsid;
  final bool? wifiConnected;
  final String? ipAddress;  // ⭐ IP principal (prioriza LAN se disponível)
  
  // ⭐ LAN (Ethernet) - Edge-Pro
  final bool? lanConnected;
  final String? lanIP;
  
  // Hardware específico
  final bool? usbConnected;      // Edge-Go: impressora
  final bool? scannerConnected;  // Dot: scanner
  
  // Backend
  final bool? backendAuthenticated;
  final bool? mqttConnected;  // ⭐ NOVO: Status MQTT
  
  // Sistema
  final int? freeMemory;
  final int? uptime;
  
  IoTDeviceStatus({
    this.wifiSsid,
    this.wifiConnected,
    this.ipAddress,
    this.lanConnected,  // ⭐ NOVO
    this.lanIP,         // ⭐ NOVO
    this.usbConnected,
    this.scannerConnected,
    this.backendAuthenticated,
    this.mqttConnected,  // ⭐ NOVO
    this.freeMemory,
    this.uptime,
  });
  
  factory IoTDeviceStatus.fromJson(Map<String, dynamic> json) {
    // Helper para converter string "true"/"false" para bool
    bool? parseBool(dynamic value) {
      if (value == null) return null;
      if (value is bool) return value;
      if (value is String) return value.toLowerCase() == 'true';
      return null;
    }
    
    // ⭐ Priorizar IP da LAN se disponível, senão usar WiFi
    final lanIP = json['lan']?['ip'] as String?;
    final wifiIP = json['wifi']?['ip'] as String?;
    final primaryIP = lanIP ?? wifiIP;
    
    return IoTDeviceStatus(
      wifiSsid: json['wifi']?['ssid'],
      wifiConnected: parseBool(json['wifi']?['connected']),  // ⭐ Parse correto
      ipAddress: primaryIP,  // ⭐ IP principal (prioriza LAN)
      lanConnected: parseBool(json['lan']?['connected']),      // ⭐ NOVO: Parse LAN
      lanIP: lanIP,                                          // ⭐ NOVO
      usbConnected: parseBool(json['usb']?['connected']),    // ⭐ Parse correto
      scannerConnected: parseBool(json['scanner']?['connected']),
      backendAuthenticated: parseBool(json['backend']?['authenticated']), // ⭐ Parse correto
      mqttConnected: parseBool(json['mqtt']?['connected']),  // ⭐ NOVO: Parse MQTT
      freeMemory: json['memory'],
      uptime: json['uptime'],
    );
  }
  
  String formatMemory() {
    if (freeMemory == null) return 'N/A';
    if (freeMemory! > 1024 * 1024) {
      return '${(freeMemory! / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(freeMemory! / 1024).toStringAsFixed(0)} KB';
  }
  
  String formatUptime() {
    if (uptime == null) return 'N/A';
    final duration = Duration(milliseconds: uptime!);
    if (duration.inHours > 0) {
      return '${duration.inHours}h ${duration.inMinutes % 60}m';
    }
    return '${duration.inMinutes}m';
  }
}


