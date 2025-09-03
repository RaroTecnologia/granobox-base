import 'dart:math';

/// Serviço para converter comandos ZPL para CPCL
class ZplToCpclConverter {
  static const String _defaultFont = '0';
  static const String _defaultFontSize = '8';
  
  /// Converte um comando ZPL para CPCL
  static String convert(String zpl) {
    try {
      // Remover espaços em branco e quebras de linha
      zpl = zpl.replaceAll(RegExp(r'\s+'), ' ');
      
      // Verificar se é um comando ZPL válido
      if (!zpl.contains('^XA') || !zpl.contains('^XZ')) {
        throw Exception('Comando ZPL inválido: deve conter ^XA e ^XZ');
      }
      
      // Inicializar CPCL
      String cpcl = '! 0 200 200 210 1\n';
      
      // Processar comandos ZPL
      cpcl += _processZplCommands(zpl);
      
      // Finalizar CPCL
      cpcl += 'FORM\n';
      cpcl += 'PRINT\n';
      
      return cpcl;
    } catch (e) {
      print('❌ [Converter] Erro ao converter ZPL para CPCL: $e');
      // Retornar CPCL de fallback
      return _generateFallbackCpcl();
    }
  }
  
  /// Processa os comandos ZPL e converte para CPCL
  static String _processZplCommands(String zpl) {
    String cpcl = '';
    
    // Extrair comandos entre ^XA e ^XZ
    final startIndex = zpl.indexOf('^XA');
    final endIndex = zpl.indexOf('^XZ');
    
    if (startIndex == -1 || endIndex == -1) {
      throw Exception('Comandos ZPL malformados');
    }
    
    final commands = zpl.substring(startIndex + 3, endIndex);
    
    // Dividir em comandos individuais
    final commandList = commands.split('^');
    
    for (String command in commandList) {
      if (command.trim().isEmpty) continue;
      
      try {
        final converted = _convertSingleCommand(command.trim());
        if (converted.isNotEmpty) {
          cpcl += converted + '\n';
        }
      } catch (e) {
        print('⚠️ [Converter] Erro ao converter comando: $command - $e');
        // Continuar com o próximo comando
      }
    }
    
    return cpcl;
  }
  
  /// Converte um comando ZPL individual para CPCL
  static String _convertSingleCommand(String command) {
    if (command.startsWith('FO')) {
      return _convertPosition(command);
    } else if (command.startsWith('A')) {
      return _convertFont(command);
    } else if (command.startsWith('FD')) {
      return _convertText(command);
    } else if (command.startsWith('BY')) {
      return _convertBarcodeWidth(command);
    } else if (command.startsWith('BC')) {
      return _convertBarcode(command);
    } else if (command.startsWith('CW')) {
      return _convertCustomFont(command);
    } else if (command.startsWith('CI')) {
      return _convertEncoding(command);
    } else if (command.startsWith('FS')) {
      return ''; // FS é ignorado no CPCL
    }
    
    return ''; // Comando não reconhecido
  }
  
  /// Converte posicionamento (^FO)
  static String _convertPosition(String command) {
    // ^FOx,y - Field Origin
    final match = RegExp(r'FO(\d+),(\d+)').firstMatch(command);
    if (match != null) {
      final x = int.parse(match.group(1)!);
      final y = int.parse(match.group(2)!);
      // CPCL usa coordenadas em pontos (1/72 polegada)
      return 'CENTER\nT 0 0 0 0 ${x * 2} ${y * 2}';
    }
    return '';
  }
  
  /// Converte fonte (^A)
  static String _convertFont(String command) {
    // ^Af,h,w - Font
    final match = RegExp(r'A(\w)(\d+),(\d+)').firstMatch(command);
    if (match != null) {
      final font = match.group(1)!;
      final height = int.parse(match.group(2)!);
      final width = int.parse(match.group(3)!);
      
      // Mapear fonte ZPL para CPCL
      String cpclFont = _mapZplFontToCpcl(font);
      String cpclSize = _mapZplSizeToCpcl(height, width);
      
      return 'F $cpclFont $cpclSize';
    }
    return '';
  }
  
  /// Converte texto (^FD)
  static String _convertText(String command) {
    // ^FDtext - Field Data
    final match = RegExp(r'FD(.+)').firstMatch(command);
    if (match != null) {
      final text = match.group(1)!;
      // Escapar caracteres especiais do CPCL
      final escapedText = _escapeCpclText(text);
      return escapedText;
    }
    return '';
  }
  
  /// Converte largura do código de barras (^BY)
  static String _convertBarcodeWidth(String command) {
    // ^BYw - Barcode Width
    final match = RegExp(r'BY(\d+)').firstMatch(command);
    if (match != null) {
      final width = int.parse(match.group(1)!);
      // Armazenar para uso no código de barras
      return '!<${width * 2}'; // Largura em pontos CPCL
    }
    return '';
  }
  
  /// Converte código de barras (^BC)
  static String _convertBarcode(String command) {
    // ^BCh,w,e,m - Barcode Code 128
    final match = RegExp(r'BC(\w),(\d+),(\w),(\w),(\w)').firstMatch(command);
    if (match != null) {
      final orientation = match.group(1)!;
      final height = int.parse(match.group(2)!);
      final checkDigit = match.group(3)!;
      final mode = match.group(4)!;
      final format = match.group(5)!;
      
      // CPCL usa B para códigos de barras
      return 'B 128 1 1 ${height * 2}';
    }
    return '';
  }
  
  /// Converte fonte customizada (^CW)
  static String _convertCustomFont(String command) {
    // ^CWd:e - Custom Font
    // No CPCL, usamos fontes padrão
    return '';
  }
  
  /// Converte encoding (^CI)
  static String _convertEncoding(String command) {
    // ^CI - Character Set
    // CPCL tem encoding próprio, ignorar
    return '';
  }
  
  /// Mapeia fonte ZPL para CPCL
  static String _mapZplFontToCpcl(String zplFont) {
    switch (zplFont) {
      case '0':
        return '0'; // Fonte padrão
      case 'N':
        return '1'; // Fonte normal
      case 'B':
        return '2'; // Fonte bold
      case 'I':
        return '3'; // Fonte italic
      default:
        return '0'; // Fonte padrão como fallback
    }
  }
  
  /// Mapeia tamanho ZPL para CPCL
  static String _mapZplSizeToCpcl(int height, int width) {
    // ZPL usa pontos (1/72 polegada), CPCL também
    // Converter para tamanho CPCL apropriado
    final size = max(height, width);
    
    if (size <= 10) return '8';
    if (size <= 15) return '10';
    if (size <= 20) return '12';
    if (size <= 25) return '14';
    if (size <= 30) return '16';
    if (size <= 40) return '20';
    if (size <= 50) return '24';
    if (size <= 60) return '30';
    if (size <= 80) return '40';
    return '50'; // Tamanho máximo
  }
  
  /// Escapa texto para CPCL
  static String _escapeCpclText(String text) {
    // CPCL tem caracteres especiais que precisam ser escapados
    return text
        .replaceAll('\\', '\\\\')
        .replaceAll('"', '\\"')
        .replaceAll('\n', '\\n')
        .replaceAll('\r', '\\r')
        .replaceAll('\t', '\\t');
  }
  
  /// Gera CPCL de fallback em caso de erro
  static String _generateFallbackCpcl() {
    return '''! 0 200 200 210 1
CENTER
T 0 0 0 0 100 100
F 0 12
ERRO NA CONVERSAO
FORM
PRINT''';
  }
  
  /// Converte etiqueta específica do Granobox para CPCL
  static String convertGranoboxTag({
    required String productName,
    required String barcode,
    required DateTime expiryDate,
    bool useCustomFont = false,
  }) {
    try {
      // Gerar CPCL diretamente para evitar problemas de conversão
      String cpcl = '! 0 200 200 400 1\n';
      
      // Cabeçalho
      cpcl += 'CENTER\n';
      cpcl += 'T 0 0 0 0 100 50\n';
      cpcl += 'F 0 20\n';
      cpcl += 'GRANOBOX TAG\n';
      
      // Nome do produto
      cpcl += 'T 0 0 0 0 100 100\n';
      cpcl += 'F 0 16\n';
      cpcl += '$productName\n';
      
      // Código de barras
      if (barcode.isNotEmpty) {
        cpcl += 'CENTER\n';
        cpcl += 'B 128 1 1 80 100 150\n';
        cpcl += '$barcode\n';
      }
      
      // Data de validade
      final dateStr = '${expiryDate.day.toString().padLeft(2, '0')}/${expiryDate.month.toString().padLeft(2, '0')}/${expiryDate.year}';
      cpcl += 'T 0 0 0 0 100 250\n';
      cpcl += 'F 0 12\n';
      cpcl += 'Validade: $dateStr\n';
      
      // Data de impressão
      final now = DateTime.now();
      final printDateStr = '${now.day.toString().padLeft(2, '0')}/${now.month.toString().padLeft(2, '0')}/${now.year}';
      cpcl += 'T 0 0 0 0 100 280\n';
      cpcl += 'F 0 10\n';
      cpcl += 'Impresso em: $printDateStr\n';
      
      // Finalizar
      cpcl += 'FORM\n';
      cpcl += 'PRINT\n';
      
      return cpcl;
    } catch (e) {
      print('❌ [Converter] Erro ao gerar CPCL do Granobox: $e');
      return _generateFallbackCpcl();
    }
  }
  
  /// Converte etiqueta de teste para CPCL
  static String convertTestLabel() {
    try {
      final now = DateTime.now();
      final dateStr = '${now.day.toString().padLeft(2, '0')}/${now.month.toString().padLeft(2, '0')}/${now.year}';
      final timeStr = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';
      
      String cpcl = '! 0 200 200 300 1\n';
      cpcl += 'CENTER\n';
      cpcl += 'T 0 0 0 0 100 50\n';
      cpcl += 'F 0 20\n';
      cpcl += 'GRANOBOX TAG\n';
      cpcl += 'T 0 0 0 0 100 100\n';
      cpcl += 'F 0 16\n';
      cpcl += 'Teste de Impressao\n';
      cpcl += 'T 0 0 0 0 100 150\n';
      cpcl += 'F 0 12\n';
      cpcl += 'Data: $dateStr\n';
      cpcl += 'T 0 0 0 0 100 180\n';
      cpcl += 'F 0 12\n';
      cpcl += 'Hora: $timeStr\n';
      cpcl += 'FORM\n';
      cpcl += 'PRINT\n';
      
      return cpcl;
    } catch (e) {
      print('❌ [Converter] Erro ao gerar CPCL de teste: $e');
      return _generateFallbackCpcl();
    }
  }
}

