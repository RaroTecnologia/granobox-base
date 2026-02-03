import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/print_result_models.dart';

/// Serviço para gerenciar preferências de modo de impressão
class PrinterModeService {
  static const String _preferencesKey = 'printer_modes';
  static PrinterModeService? _instance;
  
  PrinterModeService._();
  
  static PrinterModeService get instance {
    _instance ??= PrinterModeService._();
    return _instance!;
  }
  
  /// Salvar modo preferido para uma impressora
  Future<void> savePrinterMode(String printerId, PrintMode mode) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final existing = await _getAllModes();
      existing[printerId] = mode.value;
      
      await prefs.setString(_preferencesKey, jsonEncode(existing));
      print('✅ Modo ${mode.displayName} salvo para impressora $printerId');
    } catch (e) {
      print('❌ Erro ao salvar modo da impressora: $e');
    }
  }
  
  /// Obter modo preferido para uma impressora
  Future<PrintMode> getPrinterMode(String printerId, PrinterInfo printerInfo) async {
    try {
      final modes = await _getAllModes();
      final savedMode = modes[printerId];
      
      if (savedMode != null) {
        return PrintMode.fromString(savedMode);
      }
      
      // Retornar modo recomendado se não há preferência salva
      return printerInfo.recommendedMode;
    } catch (e) {
      print('❌ Erro ao obter modo da impressora: $e');
      return printerInfo.recommendedMode;
    }
  }
  
  /// Obter todos os modos salvos
  Future<Map<String, String>> _getAllModes() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final data = prefs.getString(_preferencesKey);
      
      if (data != null) {
        final Map<String, dynamic> decoded = jsonDecode(data);
        return decoded.map((key, value) => MapEntry(key, value.toString()));
      }
      
      return <String, String>{};
    } catch (e) {
      print('❌ Erro ao carregar modos salvos: $e');
      return <String, String>{};
    }
  }
  
  /// Obter status de cada modo para uma impressora
  Future<Map<PrintMode, PrinterModeStatus>> getPrinterModeStatus(
    PrinterInfo printerInfo
  ) async {
    final currentMode = await getPrinterMode(printerInfo.id, printerInfo);
    
    return {
      PrintMode.tcp: PrinterModeStatus(
        mode: PrintMode.tcp,
        available: printerInfo.canUseTCP,
        recommended: printerInfo.recommendedMode == PrintMode.tcp,
        current: currentMode == PrintMode.tcp,
        online: printerInfo.isTCPPrinter && printerInfo.isOnline,
        reason: printerInfo.canUseTCP 
          ? 'Conexão direta via rede local'
          : 'Não disponível para impressoras USB',
      ),
      PrintMode.edge: PrinterModeStatus(
        mode: PrintMode.edge,
        available: true, // Edge sempre disponível
        recommended: printerInfo.recommendedMode == PrintMode.edge,
        current: currentMode == PrintMode.edge,
        online: printerInfo.isOnline, // Se impressora está online no Edge
        reason: printerInfo.isUSBPrinter 
          ? 'Único modo disponível para USB'
          : 'Via Edge Agent - mais estável',
      ),
    };
  }
  
  /// Limpar preferências de uma impressora
  Future<void> clearPrinterMode(String printerId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final existing = await _getAllModes();
      existing.remove(printerId);
      
      await prefs.setString(_preferencesKey, jsonEncode(existing));
      print('✅ Preferência removida para impressora $printerId');
    } catch (e) {
      print('❌ Erro ao limpar modo da impressora: $e');
    }
  }
  
  /// Limpar todas as preferências
  Future<void> clearAllModes() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_preferencesKey);
      print('✅ Todas as preferências de modo removidas');
    } catch (e) {
      print('❌ Erro ao limpar todas as preferências: $e');
    }
  }
}

/// Status de um modo de impressão para uma impressora
class PrinterModeStatus {
  final PrintMode mode;
  final bool available;
  final bool recommended;
  final bool current;
  final bool online;
  final String reason;
  
  const PrinterModeStatus({
    required this.mode,
    required this.available,
    required this.recommended,
    required this.current,
    required this.online,
    required this.reason,
  });
  
  /// Ícone para representar o modo
  String get icon {
    switch (mode) {
      case PrintMode.tcp:
        return '🌐'; // Rede
      case PrintMode.edge:
        return '☁️'; // Cloud/Edge
    }
  }
  
  /// Cor do status
  String get statusColor {
    if (!available) return 'gray';
    if (online) return 'green';
    return 'orange';
  }
  
  /// Texto do status
  String get statusText {
    if (!available) return 'Indisponível';
    if (online) return 'Online';
    return 'Offline';
  }
}
