import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../theme/app_theme.dart';
import '../models/print_result_models.dart';
import '../services/tagment_printer_update_service.dart';

class PrinterOffsetModal extends StatefulWidget {
  final PrinterInfo printer;
  final String apiKey;

  const PrinterOffsetModal({
    Key? key,
    required this.printer,
    required this.apiKey,
  }) : super(key: key);

  @override
  State<PrinterOffsetModal> createState() => _PrinterOffsetModalState();
}

class _PrinterOffsetModalState extends State<PrinterOffsetModal> {
  late TextEditingController _offsetXController;
  late TextEditingController _offsetYController;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _offsetXController = TextEditingController(
      text: (widget.printer.offsetX ?? 0.0).toString(),
    );
    _offsetYController = TextEditingController(
      text: (widget.printer.offsetY ?? 0.0).toString(),
    );
  }

  @override
  void dispose() {
    _offsetXController.dispose();
    _offsetYController.dispose();
    super.dispose();
  }

  Future<void> _salvarOffsets() async {
    if (_isLoading) return;

    final offsetX = double.tryParse(_offsetXController.text);
    final offsetY = double.tryParse(_offsetYController.text);

    if (offsetX == null || offsetY == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Valores de offset inválidos'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final service = TagmentPrinterUpdateService();
      final success = await service.updatePrinterOffsets(
        printerId: widget.printer.id,
        apiKey: widget.apiKey,
        offsetX: offsetX,
        offsetY: offsetY,
      );

      if (success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Offsets atualizados com sucesso!'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context, true); // Retorna true para indicar sucesso
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Erro ao atualizar offsets'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _resetarOffsets() {
    _offsetXController.text = '0';
    _offsetYController.text = '0';
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: AppTheme.dark800,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    PhosphorIcons.sliders,
                    color: AppTheme.primary,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Configurações Avançadas',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        widget.printer.displayName,
                        style: TextStyle(
                          fontSize: 14,
                          color: AppTheme.dark300,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(
                    PhosphorIcons.x,
                    color: AppTheme.dark300,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Explicação
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.dark700,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        PhosphorIcons.info,
                        color: AppTheme.primary,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Corretores de Offset',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Ajuste a posição da impressão em milímetros. Use valores positivos para mover para a direita/baixo e negativos para esquerda/cima.',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppTheme.dark300,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Campos de offset
            Row(
              children: [
                // Offset X
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Offset X (Horizontal)',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _offsetXController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(RegExp(r'^-?\d*\.?\d*')),
                        ],
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          hintText: '0.0',
                          hintStyle: TextStyle(color: AppTheme.dark300),
                          suffixText: 'mm',
                          suffixStyle: TextStyle(color: AppTheme.dark300),
                          filled: true,
                          fillColor: AppTheme.dark700,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                // Offset Y
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Offset Y (Vertical)',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _offsetYController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(RegExp(r'^-?\d*\.?\d*')),
                        ],
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          hintText: '0.0',
                          hintStyle: TextStyle(color: AppTheme.dark300),
                          suffixText: 'mm',
                          suffixStyle: TextStyle(color: AppTheme.dark300),
                          filled: true,
                          fillColor: AppTheme.dark700,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Botões
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isLoading ? null : _resetarOffsets,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.dark300,
                      side: BorderSide(color: AppTheme.dark600),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: const Text('Resetar'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _salvarOffsets,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text('Salvar'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
