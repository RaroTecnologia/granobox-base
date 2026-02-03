// ignore_for_file: unused_field, unused_element

import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../models/print_result_models.dart';
import '../theme/app_theme.dart';

class PrintModal extends StatefulWidget {
  final String title;
  final String? subtitle;
  final Future<TagmentPrintResult> Function(Function(String)? onProgress)
  printFunction; // ⭐ Callback de progresso
  final VoidCallback? onSuccess;
  final VoidCallback? onError;

  const PrintModal({
    super.key,
    required this.title,
    this.subtitle,
    required this.printFunction,
    this.onSuccess,
    this.onError,
  });

  @override
  State<PrintModal> createState() => _PrintModalState();
}

class _PrintModalState extends State<PrintModal> with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _rotationAnimation;

  bool _isPrinting = false;
  TagmentPrintResult? _result;
  String? _errorMessage;
  // ⭐ Usar ValueNotifier para isolar updates de texto da animação
  final ValueNotifier<String> _currentStepNotifier = ValueNotifier('Preparando etiqueta...');
  String get _currentStep => _currentStepNotifier.value;
  set _currentStep(String value) => _currentStepNotifier.value = value;
  int _stepIndex = 0; // ⭐ NOVO: Índice do passo atual

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.elasticOut),
    );

    _rotationAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.linear),
    );

    _startPrinting();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _currentStepNotifier.dispose();
    super.dispose();
  }

  // ⭐ NOVO: Callback para atualizar progresso em tempo real
  void _updateProgress(String message) {
    if (!mounted || !_isPrinting) return;
    // Atualizar diretamente via ValueNotifier - não precisa de setState
    if (_currentStepNotifier.value != message) {
      print('🔄 [Modal] Atualizando progresso: "$message"');
      _currentStepNotifier.value = message;
    }
  }

  void _startPrinting() async {
    print('🖨️ Iniciando impressão...');

    setState(() {
      _isPrinting = true;
      _result = null;
      _errorMessage = null;
      _currentStep = 'Gerando etiqueta...';
    });

    _animationController.repeat();

    try {
      print('🖨️ Executando função de impressão...');
      final result = await widget.printFunction(
        _updateProgress,
      ); // ⭐ Passar callback

      print(
        '🖨️ Resultado recebido: success=${result.success}, message=${result.message}',
      );

      _animationController.stop();

      setState(() {
        _isPrinting = false;
        _result = result;
        _errorMessage =
            result.success ? null : _buildUnavailablePrinterMessage(result);
      });

      // Validar resultado corretamente
      if (result.success == true) {
        print('✅ Impressão enviada com sucesso!');

        // Fechar automaticamente após 2s em caso de sucesso
        if (mounted) {
          Future.delayed(const Duration(seconds: 2), () {
            if (!mounted) return;
            try {
              widget.onSuccess?.call();
              Navigator.of(context).pop(result);
            } catch (_) {}
          });
        }
      } else {
        print('❌ Impressão falhou: ${result.message}');

        // ✅ NOVO: Fechar automaticamente após 3s em caso de erro também
        if (mounted) {
          Future.delayed(const Duration(seconds: 3), () {
            if (!mounted) return;
            try {
              widget.onError?.call();
              Navigator.of(context).pop(result);
            } catch (_) {}
          });
        }
      }
    } catch (e) {
      print('🖨️ Erro durante impressão: $e');

      _animationController.stop();

      setState(() {
        _isPrinting = false;
        _errorMessage = 'Erro inesperado: $e';
      });

      // Não fechar automaticamente - deixar o usuário decidir quando fechar
    }
  }

  // ⭐ NOVO: Obter detalhes do erro de impressora do resultado
  _PrinterErrorInfo? _getPrinterErrorInfo(TagmentPrintResult result) {
    // Verificar errorDetails primeiro (onde o Edge-Pro salva)
    final errorDetails = result.errorDetails ?? {};
    final printResult = result.printResult ?? {};
    
    // Buscar printerStatus em ambos os lugares
    final printerStatus = 
        errorDetails['printerStatus'] ?? 
        printResult['printerStatus'] ?? 
        {};
    
    // Verificar campos diretos (formato do Edge-Pro)
    final paperOut = printerStatus['paperOut'] == true || 
                     errorDetails['printerPaperOut'] == true ||
                     printResult['printerPaperOut'] == true;
    final ribbonOut = printerStatus['ribbonOut'] == true || 
                      errorDetails['printerRibbonOut'] == true ||
                      printResult['printerRibbonOut'] == true;
    final headOpen = printerStatus['headOpen'] == true || 
                     printerStatus['coverOpen'] == true ||
                     errorDetails['printerHeadOpen'] == true ||
                     printResult['printerHeadOpen'] == true;
    final isPausedCode = (printerStatus['errorCode']?.toString().toUpperCase() ?? '').contains('PAUSED');
    final paused = printerStatus['paused'] == true ||
                   isPausedCode ||
                   errorDetails['printerPaused'] == true ||
                   printResult['printerPaused'] == true;
    final errorCode = printerStatus['errorCode']?.toString() ??
                      errorDetails['printerErrorCode']?.toString() ??
                      printResult['printerErrorCode']?.toString();
    final errorMessage = printerStatus['errorMessage']?.toString() ??
                         errorDetails['printerErrorMessage']?.toString() ??
                         printResult['printerErrorMessage']?.toString();
    
    // Também verificar na mensagem
    final message = result.message.toLowerCase();
    final hasPaperOut = paperOut || message.contains('papel') || message.contains('paper');
    final hasRibbonOut = ribbonOut || message.contains('ribbon') || message.contains('fita');
    final hasHeadOpen = headOpen || message.contains('tampa') || message.contains('head') || message.contains('cover');
    
    if (hasPaperOut || hasRibbonOut || hasHeadOpen || paused || errorCode != null) {
      return _PrinterErrorInfo(
        paperOut: hasPaperOut,
        ribbonOut: hasRibbonOut,
        headOpen: hasHeadOpen,
        paused: paused,
        errorCode: errorCode,
        errorMessage: errorMessage,
      );
    }
    
    return null;
  }

  String _getUserFriendlyMessage(TagmentPrintResult result) {
    final message = result.message.toLowerCase();
    final errorInfo = _getPrinterErrorInfo(result);
    
    // ⭐ Priorizar erros detectados do printerStatus
    if (errorInfo != null) {
      if (errorInfo.headOpen) {
        return 'Tampa aberta - feche a tampa da impressora';
      }
      if (errorInfo.paperOut) {
        return 'Sem etiqueta - recarregue a impressora';
      }
      if (errorInfo.ribbonOut) {
        return 'Sem ribbon - troque o ribbon da impressora';
      }
      if (errorInfo.paused) {
        return 'Impressora pausada - retome a impressão';
      }
      if (errorInfo.errorMessage != null) {
        return errorInfo.errorMessage!;
      }
      if (errorInfo.errorCode != null) {
        return 'Erro: ${errorInfo.errorCode}';
      }
    }

    // Verificar mensagens específicas de erro da impressora
    if (message.contains('tampa aberta') || message.contains('head open') || message.contains('cover open')) {
      return 'Tampa aberta - feche a tampa da impressora';
    }

    if (message.contains('papel') || message.contains('paper out')) {
      return 'Sem etiqueta - recarregue a impressora';
    }

    if (message.contains('ribbon')) {
      return 'Sem ribbon - troque o ribbon da impressora';
    }

    if (message.contains('websocket') || message.contains('print agent')) {
      return 'Impressora USB requer Print Agent conectado - verifique a conexão';
    }

    // Mensagens genéricas amigáveis
    if (message.contains('timeout')) {
      return 'Timeout - verifique a conexão da impressora';
    }

    if (message.contains('connection') || message.contains('conexão')) {
      return 'Erro de conexão - verifique a rede';
    }

    if (message.contains('unauthorized') || message.contains('401')) {
      return 'Erro de autorização - verifique as configurações';
    }
    
    if (message.contains('não conectado') || message.contains('not connected') || message.contains('offline')) {
      return 'Dispositivo offline - verifique a conexão';
    }

    // Retornar mensagem original se não conseguir identificar
    return result.message;
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: AppTheme.dark800,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.3),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Ícone animado
              SizedBox(width: 80, height: 80, child: _buildAnimatedIcon()),

              const SizedBox(height: 24),

              // Título
              Text(
                widget.title,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                textAlign: TextAlign.center,
              ),

              if (widget.subtitle != null) ...[
                const SizedBox(height: 8),
                Text(
                  widget.subtitle!,
                  style: TextStyle(fontSize: 14, color: AppTheme.dark300),
                  textAlign: TextAlign.center,
                ),
              ],

              const SizedBox(height: 24),

              // Status
              _buildStatus(),

              const SizedBox(height: 24),

              // ✅ REMOVIDO: Botão de fechar (fecha automaticamente em 2s para sucesso, 3s para erro)
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAnimatedIcon() {
    if (_isPrinting) {
      return Stack(
        alignment: Alignment.center,
        children: [
          // Spinner elegante ao redor
          SizedBox(
            width: 80,
            height: 80,
            child: CircularProgressIndicator(
              strokeWidth: 3,
              valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary),
            ),
          ),
          // Ícone da impressora estático no centro
          Container(
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            padding: const EdgeInsets.all(16),
            child: Icon(
              PhosphorIcons.printer,
              size: 32,
              color: AppTheme.primary,
            ),
          ),
        ],
      );
    } else if (_result != null) {
      return Container(
        decoration: BoxDecoration(
          color: _result!.success
              ? Colors.green.withOpacity(0.1)
              : Colors.red.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(
          _result!.success ? PhosphorIcons.checkCircle : PhosphorIcons.xCircle,
          size: 40,
          color: _result!.success ? Colors.green : Colors.red,
        ),
      );
    } else {
      return Container(
        decoration: BoxDecoration(
          color: AppTheme.dark700,
          shape: BoxShape.circle,
        ),
        child: const Icon(
          PhosphorIcons.printer,
          size: 40,
          color: AppTheme.dark300,
        ),
      );
    }
  }

  Widget _buildStatus() {
    if (_isPrinting) {
      return Column(
        children: [
          // ⭐ Usar ValueListenableBuilder para updates de texto independentes da animação
          ValueListenableBuilder<String>(
            valueListenable: _currentStepNotifier,
            builder: (context, step, _) {
              print('🎨 [Modal] Renderizando texto: "$step"');
              return Text(
                step,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.primary,
                ),
                textAlign: TextAlign.center,
              );
            },
          ),
          const SizedBox(height: 8),
          Text(
            'Aguarde um momento',
            style: TextStyle(fontSize: 14, color: AppTheme.dark300),
            textAlign: TextAlign.center,
          ),
        ],
      );
    } else if (_result != null) {
      final dynamic printerRaw =
          _result!.printResult?['printer'] ??
          _result!.printResult?['printerName'] ??
          _result!.printResult?['printerDisplayName'] ??
          _result!.errorDetails?['printer'] ??
          _result!.errorDetails?['printerName'] ??
          _result!.errorDetails?['printerDisplayName'];
      final String? printerName = printerRaw?.toString().isNotEmpty == true
          ? printerRaw.toString()
          : null;
      
      // ⭐ NOVO: Obter informações de erro da impressora
      final printerErrorInfo = !_result!.success ? _getPrinterErrorInfo(_result!) : null;
      
      return Column(
        children: [
          Text(
            _result!.success ? 'Sucesso!' : 'Erro na impressão',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: _result!.success ? Colors.green : Colors.red,
            ),
          ),
          const SizedBox(height: 8),
          if (printerName != null) ...[
            Text(
              'Impressora: $printerName',
              style: TextStyle(fontSize: 13, color: AppTheme.dark300),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
          ],
          if (_result!.success) ...[
            Text(
              _result!.message,
              style: const TextStyle(fontSize: 14, color: Colors.green),
              textAlign: TextAlign.center,
            ),
          ] else ...[
            // ⭐ NOVO: Mostrar chips visuais para erros de hardware
            if (printerErrorInfo != null && printerErrorInfo.hasHardwareError) ...[
              _buildPrinterErrorDetails(printerErrorInfo),
              const SizedBox(height: 12),
            ],
            Text(
              _errorMessage ??
                  'Impressora não está disponível. Verifique a conexão.',
              style: const TextStyle(fontSize: 14, color: Colors.redAccent),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      );
    } else {
      return const Text(
        'Preparando...',
        style: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: AppTheme.dark300,
        ),
      );
    }
  }

  String _buildUnavailablePrinterMessage(TagmentPrintResult result) {
    const defaultMessage =
        'Impressora não está disponível. Verifique a conexão.';
    final friendly = _getUserFriendlyMessage(result).trim();

    if (friendly.isEmpty) {
      return defaultMessage;
    }

    final normalized = friendly.toLowerCase();
    if (normalized.contains('impressora') || normalized.contains('printer') ||
        normalized.contains('tampa') || normalized.contains('etiqueta') ||
        normalized.contains('ribbon') || normalized.contains('pausada')) {
      return friendly;
    }

    return '$defaultMessage\n$friendly';
  }
  
  // ⭐ NOVO: Widget com ícones específicos para erros de impressora
  Widget _buildPrinterErrorDetails(_PrinterErrorInfo errorInfo) {
    final errors = <Widget>[];
    
    if (errorInfo.headOpen) {
      errors.add(_buildErrorChip(
        PhosphorIcons.warning,
        'Tampa aberta',
        Colors.orange,
      ));
    }
    if (errorInfo.paperOut) {
      errors.add(_buildErrorChip(
        PhosphorIcons.scroll,
        'Sem etiqueta',
        Colors.red,
      ));
    }
    if (errorInfo.ribbonOut) {
      errors.add(_buildErrorChip(
        PhosphorIcons.package,
        'Sem ribbon',
        Colors.red,
      ));
    }
    if (errorInfo.paused) {
      errors.add(_buildErrorChip(
        PhosphorIcons.pause,
        'Pausada',
        Colors.amber,
      ));
    }
    
    if (errors.isEmpty) return const SizedBox.shrink();
    
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        alignment: WrapAlignment.center,
        children: errors,
      ),
    );
  }
  
  Widget _buildErrorChip(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// ⭐ NOVO: Classe para informações de erro da impressora
class _PrinterErrorInfo {
  final bool paperOut;
  final bool ribbonOut;
  final bool headOpen;
  final bool paused;
  final String? errorCode;
  final String? errorMessage;
  
  _PrinterErrorInfo({
    this.paperOut = false,
    this.ribbonOut = false,
    this.headOpen = false,
    this.paused = false,
    this.errorCode,
    this.errorMessage,
  });
  
  bool get hasHardwareError => paperOut || ribbonOut || headOpen || paused;
}

/// Função helper para mostrar o modal de impressão
Future<TagmentPrintResult?> showPrintModal({
  required BuildContext context,
  required String title,
  String? subtitle,
  required Future<TagmentPrintResult> Function(Function(String)? onProgress)
  printFunction, // ⭐ Com callback
  VoidCallback? onSuccess,
  VoidCallback? onError,
}) {
  return showDialog<TagmentPrintResult>(
    context: context,
    barrierDismissible: false,
    builder: (context) => PrintModal(
      title: title,
      subtitle: subtitle,
      printFunction: printFunction,
      onSuccess: onSuccess,
      onError: onError,
    ),
  );
}
