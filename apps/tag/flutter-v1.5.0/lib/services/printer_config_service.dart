import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/print_result_models.dart';
import 'tagment_printer_config_service.dart';

/// Modelo para configuração local de impressoras
class LocalPrinterConfig {
  final String id;
  final String nome;
  final String ip;
  final int porta;
  final bool isValidadePrinter;
  final bool isRotuloPrinter;
  final double offsetX;
  final double offsetY;
  final DateTime? lastSeen;
  final String status; // 'online', 'offline', 'testing'

  const LocalPrinterConfig({
    required this.id,
    required this.nome,
    required this.ip,
    required this.porta,
    this.isValidadePrinter = false,
    this.isRotuloPrinter = false,
    this.offsetX = 0.0,
    this.offsetY = 0.0,
    this.lastSeen,
    this.status = 'offline',
  });

  factory LocalPrinterConfig.fromJson(Map<String, dynamic> json) {
    return LocalPrinterConfig(
      id: json['id'] as String,
      nome: json['nome'] as String,
      ip: json['ip'] as String,
      porta: json['porta'] as int? ?? 9100,
      isValidadePrinter: json['isValidadePrinter'] as bool? ?? false,
      isRotuloPrinter: json['isRotuloPrinter'] as bool? ?? false,
      offsetX: (json['offsetX'] as num?)?.toDouble() ?? 0.0,
      offsetY: (json['offsetY'] as num?)?.toDouble() ?? 0.0,
      lastSeen: json['lastSeen'] != null ? DateTime.parse(json['lastSeen']) : null,
      status: json['status'] as String? ?? 'offline',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nome': nome,
      'ip': ip,
      'porta': porta,
      'isValidadePrinter': isValidadePrinter,
      'isRotuloPrinter': isRotuloPrinter,
      'offsetX': offsetX,
      'offsetY': offsetY,
      'lastSeen': lastSeen?.toIso8601String(),
      'status': status,
    };
  }

  LocalPrinterConfig copyWith({
    String? id,
    String? nome,
    String? ip,
    int? porta,
    bool? isValidadePrinter,
    bool? isRotuloPrinter,
    double? offsetX,
    double? offsetY,
    DateTime? lastSeen,
    String? status,
  }) {
    return LocalPrinterConfig(
      id: id ?? this.id,
      nome: nome ?? this.nome,
      ip: ip ?? this.ip,
      porta: porta ?? this.porta,
      isValidadePrinter: isValidadePrinter ?? this.isValidadePrinter,
      isRotuloPrinter: isRotuloPrinter ?? this.isRotuloPrinter,
      offsetX: offsetX ?? this.offsetX,
      offsetY: offsetY ?? this.offsetY,
      lastSeen: lastSeen ?? this.lastSeen,
      status: status ?? this.status,
    );
  }

  @override
  String toString() {
    return 'LocalPrinterConfig(id: $id, nome: $nome, ip: $ip:$porta, validade: $isValidadePrinter, rotulo: $isRotuloPrinter, status: $status)';
  }
}

/// Serviço para gerenciar configurações de impressoras locais
class PrinterConfigService {
  static const String _keyPrinters = 'local_printers_config';
  static const String _keySelectedValidade = 'selected_validade_printer';
  static const String _keySelectedRotulo = 'selected_rotulo_printer';
  
  final TagmentPrinterConfigService _tagmentConfigService;
  
  PrinterConfigService(this._tagmentConfigService);

  /// Obter todas as impressoras configuradas localmente
  Future<List<LocalPrinterConfig>> getLocalPrinters() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final printersJson = prefs.getString(_keyPrinters);
      
      if (printersJson == null) return [];
      
      final List<dynamic> printersList = jsonDecode(printersJson);
      return printersList
          .map((json) => LocalPrinterConfig.fromJson(json))
          .toList();
    } catch (e) {
      print('❌ Erro ao carregar impressoras locais: $e');
      return [];
    }
  }

  /// Salvar lista de impressoras locais
  Future<bool> saveLocalPrinters(List<LocalPrinterConfig> printers) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final printersJson = jsonEncode(printers.map((p) => p.toJson()).toList());
      return await prefs.setString(_keyPrinters, printersJson);
    } catch (e) {
      print('❌ Erro ao salvar impressoras locais: $e');
      return false;
    }
  }

  /// Adicionar nova impressora
  Future<bool> addPrinter(LocalPrinterConfig printer) async {
    final printers = await getLocalPrinters();
    
    // Verificar se já existe impressora com mesmo IP
    if (printers.any((p) => p.ip == printer.ip && p.porta == printer.porta)) {
      throw Exception('Já existe uma impressora configurada para ${printer.ip}:${printer.porta}');
    }
    
    printers.add(printer);
    return await saveLocalPrinters(printers);
  }

  /// Atualizar impressora existente
  Future<bool> updatePrinter(LocalPrinterConfig updatedPrinter) async {
    final printers = await getLocalPrinters();
    final index = printers.indexWhere((p) => p.id == updatedPrinter.id);
    
    if (index == -1) {
      throw Exception('Impressora não encontrada');
    }
    
    printers[index] = updatedPrinter;
    return await saveLocalPrinters(printers);
  }

  /// Remover impressora
  Future<bool> removePrinter(String printerId) async {
    final printers = await getLocalPrinters();
    printers.removeWhere((p) => p.id == printerId);
    return await saveLocalPrinters(printers);
  }

  /// Obter impressora por ID
  Future<LocalPrinterConfig?> getPrinterById(String printerId) async {
    final printers = await getLocalPrinters();
    try {
      return printers.firstWhere((p) => p.id == printerId);
    } catch (e) {
      return null;
    }
  }

  /// Obter impressoras configuradas para validade
  Future<List<LocalPrinterConfig>> getValidadePrinters() async {
    final printers = await getLocalPrinters();
    return printers.where((p) => p.isValidadePrinter).toList();
  }

  /// Obter impressoras configuradas para rótulo
  Future<List<LocalPrinterConfig>> getRotuloPrinters() async {
    final printers = await getLocalPrinters();
    return printers.where((p) => p.isRotuloPrinter).toList();
  }

  /// Obter impressora preferida para validade
  Future<LocalPrinterConfig?> getPreferredValidadePrinter() async {
    final validadePrinters = await getValidadePrinters();
    
    if (validadePrinters.isEmpty) return null;
    
    // Priorizar impressoras online
    final onlinePrinters = validadePrinters.where((p) => p.status == 'online').toList();
    if (onlinePrinters.isNotEmpty) {
      return onlinePrinters.first;
    }
    
    // Fallback: primeira configurada
    return validadePrinters.first;
  }

  /// Obter impressora preferida para rótulo
  Future<LocalPrinterConfig?> getPreferredRotuloPrinter() async {
    final rotuloPrinters = await getRotuloPrinters();
    
    if (rotuloPrinters.isEmpty) return null;
    
    // Priorizar impressoras online
    final onlinePrinters = rotuloPrinters.where((p) => p.status == 'online').toList();
    if (onlinePrinters.isNotEmpty) {
      return onlinePrinters.first;
    }
    
    // Fallback: primeira configurada
    return rotuloPrinters.first;
  }

  /// Configurar impressora para validade
  Future<bool> setValidadePrinter(String printerId, bool isValidade) async {
    final printer = await getPrinterById(printerId);
    if (printer == null) return false;
    
    final updatedPrinter = printer.copyWith(isValidadePrinter: isValidade);
    return await updatePrinter(updatedPrinter);
  }

  /// Configurar impressora para rótulo
  Future<bool> setRotuloPrinter(String printerId, bool isRotulo) async {
    final printer = await getPrinterById(printerId);
    if (printer == null) return false;
    
    final updatedPrinter = printer.copyWith(isRotuloPrinter: isRotulo);
    return await updatePrinter(updatedPrinter);
  }

  /// Atualizar status de uma impressora
  Future<bool> updatePrinterStatus(String printerId, String status) async {
    final printer = await getPrinterById(printerId);
    if (printer == null) return false;
    
    final updatedPrinter = printer.copyWith(
      status: status,
      lastSeen: DateTime.now(),
    );
    
    return await updatePrinter(updatedPrinter);
  }

  /// Testar conectividade de uma impressora
  Future<bool> testPrinterConnection(String printerId) async {
    final printer = await getPrinterById(printerId);
    if (printer == null) return false;
    
    // Atualizar status para 'testing'
    await updatePrinterStatus(printerId, 'testing');
    
    try {
      // Simular teste de conexão (você pode integrar com o TCP client)
      await Future.delayed(Duration(seconds: 2));
      
      // Por enquanto, simular sucesso
      await updatePrinterStatus(printerId, 'online');
      return true;
    } catch (e) {
      await updatePrinterStatus(printerId, 'offline');
      return false;
    }
  }

  /// Sincronizar configurações com API Tagment (se necessário)
  Future<void> syncWithTagmentAPI(String authToken) async {
    try {
      // Obter configuração atual da API Tagment
      final tagmentConfig = await _tagmentConfigService.getTagmentPrinterConfig(authToken);
      
      if (tagmentConfig == null) return;
      
      // Aqui você pode implementar lógica de sincronização se necessário
      // Por exemplo, marcar impressoras baseado nos IDs da API Tagment
      
      print('✅ Sincronização com API Tagment concluída');
    } catch (e) {
      print('❌ Erro na sincronização com API Tagment: $e');
    }
  }

  /// Gerar ID único para nova impressora
  String generatePrinterId() {
    return 'printer_${DateTime.now().millisecondsSinceEpoch}_${DateTime.now().microsecond}';
  }

  /// Validar configuração de impressora
  bool validatePrinterConfig(LocalPrinterConfig printer) {
    // Validar IP
    final ipRegex = RegExp(r'^(\d{1,3}\.){3}\d{1,3}$');
    if (!ipRegex.hasMatch(printer.ip)) {
      return false;
    }
    
    // Validar porta
    if (printer.porta < 1 || printer.porta > 65535) {
      return false;
    }
    
    // Validar nome
    if (printer.nome.trim().isEmpty) {
      return false;
    }
    
    return true;
  }

  /// Obter estatísticas das impressoras
  Future<Map<String, dynamic>> getPrintersStats() async {
    final printers = await getLocalPrinters();
    
    return {
      'total': printers.length,
      'online': printers.where((p) => p.status == 'online').length,
      'offline': printers.where((p) => p.status == 'offline').length,
      'validadeConfigured': printers.where((p) => p.isValidadePrinter).length,
      'rotuloConfigured': printers.where((p) => p.isRotuloPrinter).length,
    };
  }
}

