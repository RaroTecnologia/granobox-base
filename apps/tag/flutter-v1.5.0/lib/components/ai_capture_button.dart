import 'dart:io';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../services/openai_service.dart';
import 'camera_capture_modal.dart';

/// Botão reutilizável de captura com IA
/// Abre uma câmera, captura foto e extrai informações com OpenAI
class AiCaptureButton extends StatefulWidget {
  final String tooltip;
  final Function(Map<String, String>) onDataExtracted;
  final List<String> fieldsToExtract; // Ex: ['lote', 'data_vencimento']

  const AiCaptureButton({
    Key? key,
    required this.tooltip,
    required this.onDataExtracted,
    required this.fieldsToExtract,
  }) : super(key: key);

  @override
  State<AiCaptureButton> createState() => _AiCaptureButtonState();
}

class _AiCaptureButtonState extends State<AiCaptureButton> {
  bool _isAnalyzing = false;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: Colors.green.withOpacity(0.15),
          borderRadius: BorderRadius.circular(8),
        ),
        child: _isAnalyzing
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
                ),
              )
            : Icon(
                PhosphorIcons.sparkle,
                color: Colors.green,
                size: 20,
              ),
      ),
      tooltip: widget.tooltip,
      onPressed: _isAnalyzing ? null : () => _showCaptureModal(context),
    );
  }

  void _showCaptureModal(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CameraCaptureModal(
          onCapture: (image) async {
            Navigator.pop(context); // Fechar modal de câmera
            await _analyzeImageWithAI(context, image);
          },
          instructionMessage: 'Posicione o lote e validade dentro da moldura',
        ),
        fullscreenDialog: true,
      ),
    );
  }

  Future<void> _analyzeImageWithAI(BuildContext context, File image) async {
    // Usar setState para controlar loading (como no cadastro)
    setState(() {
      _isAnalyzing = true;
    });

    try {
      final openAiService = OpenAiService();
      
      // Análise específica baseada nos campos solicitados
      final prompt = _buildPrompt();
      
      print('🤖 Iniciando análise de IA...');
      
      // Adicionar timeout de 15 segundos
      final response = await openAiService.analyzeImageWithCustomPrompt(image, prompt)
          .timeout(
            Duration(seconds: 15),
            onTimeout: () {
              print('⏰ Timeout na análise de IA');
              throw TimeoutException('A análise demorou muito para ser concluída', Duration(seconds: 15));
            },
          );
      
      print('🤖 Resposta da IA recebida: ${response.success}');

      if (response.success && response.customData != null) {
        // Extrair dados do response
        final extractedData = _parseResponse(response.customData!);
        
        // Verificar se extraiu algum dado
        final hasData = extractedData.values.any((value) => value.isNotEmpty);
        
        if (hasData) {
          // Chamar callback com os dados extraídos
          widget.onDataExtracted(extractedData);
          
          // Mostrar feedback de sucesso
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Dados extraídos com sucesso!'),
              backgroundColor: Colors.green,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Nenhum dado relevante encontrado na imagem'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(response.error ?? 'Erro ao analisar imagem'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      print('Erro na análise de IA: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erro ao processar imagem: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isAnalyzing = false;
      });
    }
  }

  String _buildPrompt() {
    return '''
Analise esta imagem de um produto alimentício e extraia as seguintes informações:

1. LOTE: Procure por números de lote, códigos de lote, ou identificadores de lote (ex: L20251015-003, Lote 123, Batch 456, etc.)
2. DATA DE VENCIMENTO: Procure por data de vencimento, data de validade, "vence em", "válido até", "vencimento", "validade", etc. (formato DD/MM/AAAA)

IMPORTANTE:
- Para LOTE: Procure por códigos alfanuméricos que identifiquem o lote de fabricação
- Para DATA DE VENCIMENTO: Procure por datas no formato DD/MM/AAAA ou DD-MM-AAAA
- Se não encontrar, retorne string vazia ""
- Seja preciso e extraia exatamente o que vê na imagem

Retorne APENAS um JSON válido no formato:
{
  "lote": "código do lote encontrado ou string vazia",
  "data_vencimento": "data no formato DD/MM/AAAA ou string vazia"
}
''';
  }

  Map<String, String> _parseResponse(dynamic responseData) {
    try {
      final Map<String, dynamic> data = responseData as Map<String, dynamic>;
      
      return {
        'lote': data['lote']?.toString() ?? '',
        'data_vencimento': data['data_vencimento']?.toString() ?? '',
      };
    } catch (e) {
      print('Erro ao fazer parse da resposta: $e');
      return {
        'lote': '',
        'data_vencimento': '',
      };
    }
  }
}