import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/ai_label_models.dart';

/// Serviço para integração com OpenAI Vision API
class OpenAiService {
  static const String _baseUrl = 'https://api.openai.com/v1';
  
  /// Analisa uma imagem e extrai informações para etiqueta
  Future<OpenAiResponse> analyzeImage(File imageFile) async {
    try {
      // Converter imagem para base64
      final bytes = await imageFile.readAsBytes();
      final base64Image = base64Encode(bytes);
      
      // Preparar prompt para OpenAI
      final prompt = '''
Analise esta imagem de um produto alimentício e extraia as seguintes informações:
- Nome do produto
- Marca (se visível)
- Número SIF (Serviço de Inspeção Federal) se estiver disponível no rótulo
- Observações relevantes sobre o produto

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "product_name": "nome do produto ou null",
  "brand": "marca ou null", 
  "sif": "número SIF ou null",
  "observations": "observações relevantes ou null"
}

IMPORTANTE: 
- Se não conseguir identificar alguma informação, use null
- Retorne apenas o JSON, sem texto adicional antes ou depois
- O nome do produto é obrigatório
- Para o SIF, procure por "SIF" seguido de números no rótulo
''';

      // Fazer requisição para OpenAI
      final response = await http.post(
        Uri.parse('$_baseUrl/chat/completions'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${AppConfig.openAiApiKey}',
        },
        body: jsonEncode({
          'model': AppConfig.openAiModel,
          'messages': [
            {
              'role': 'user',
              'content': [
                {
                  'type': 'text',
                  'text': prompt,
                },
                {
                  'type': 'image_url',
                  'image_url': {
                    'url': 'data:image/jpeg;base64,$base64Image',
                  },
                },
              ],
            },
          ],
          'max_tokens': 500,
          'temperature': 0.1, // Baixa temperatura para respostas mais precisas
        }),
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final content = jsonResponse['choices'][0]['message']['content'] as String;
        
        // Tentar extrair JSON da resposta
        final cleanedContent = _extractJson(content);
        final labelData = AiLabelData.fromJson(jsonDecode(cleanedContent));
        
        if (labelData.isEmpty) {
          return OpenAiResponse.error(
            'Não foi possível extrair informações da imagem. Tente tirar uma foto mais nítida do produto.'
          );
        }
        
        return OpenAiResponse.success(labelData);
      } else {
        final error = jsonDecode(response.body);
        return OpenAiResponse.error(
          error['error']?['message'] ?? 'Erro ao analisar imagem'
        );
      }
    } catch (e) {
      print('Erro no OpenAI Service: $e');
      return OpenAiResponse.error(
        'Erro ao processar imagem: ${e.toString()}'
      );
    }
  }
  
  /// Analisa duas imagens (frente e verso) para extrair informações, especialmente data de validade
  Future<OpenAiResponse> analyzeImagesForValidity(File frenteImage, File versoImage) async {
    try {
      // Converter imagens para base64
      final frenteBytes = await frenteImage.readAsBytes();
      final versoBytes = await versoImage.readAsBytes();
      final frenteBase64 = base64Encode(frenteBytes);
      final versoBase64 = base64Encode(versoBytes);
      
      // Preparar prompt para OpenAI focado em data de validade
      final prompt = '''
Analise estas duas imagens de um produto alimentício (frente e verso) e extraia as seguintes informações:

IMAGEM 1: Frente do produto
IMAGEM 2: Verso do produto

Extraia:
- Nome do produto (da frente)
- Marca (se visível)
- Número SIF (Serviço de Inspeção Federal) se estiver disponível - APENAS OS NÚMEROS, sem o texto "SIF"
- Código de barras (EAN-13, UPC ou outro código de barras visível)
- Peso/Quantidade (procure por "500g", "1kg", "200ml", "1L", etc.) - APENAS O NÚMERO, sem a unidade
- Data de validade (procure por "validade", "válido até", "expira em", "use até", etc.)
- Observações relevantes sobre o produto
- Instruções de conservação/armazenamento (ex: "manter refrigerado entre 1°C e 5°C", "conservar em local fresco e seco", "após aberto consumir em até 3 dias")
- Prazo de validade em dias (quando mencionado) para: temperatura ambiente, refrigerado e congelado

IMPORTANTE para peso/quantidade:
- Procure por indicações de peso/volume como "500g", "1kg", "200ml", "1L", "250g", etc.
- Geralmente está em destaque na frente da embalagem
- Retorne o número E a unidade no formato correto:
  * Para "500g" → número: "500", unidade: "G"
  * Para "1kg" → número: "1", unidade: "KG"
  * Para "200ml" → número: "200", unidade: "ML"
  * Para "1L" → número: "1", unidade: "L"
- Unidades aceitas: KG, G, L, ML, UN (unidade), CX (caixa), PCT (pacote)

IMPORTANTE para data de validade:
- Procure por datas no formato DD/MM/AAAA, DD/MM/AA, ou DD-MM-AAAA
- Procure por textos como "validade", "válido até", "expira em", "use até", "consumir até"
- Se encontrar múltiplas datas, priorize a data de validade (não fabricação)
- Se a data estiver em formato diferente, converta para DD/MM/AAAA

IMPORTANTE para conservação:
- Leia textos como "conservar sob refrigeração", "manter congelado", "consumir em até X dias", "após aberto, consumir em Y dias"
- Se mencionar mais de um cenário, retorne cada prazo separadamente
- Caso não haja informação para um cenário, retorne null
- Para tempos descritos em texto (ex: "sete dias"), converta para número inteiro de dias
- Mantenha o texto original do rótulo em "storage_instructions" (não traduza)

IMPORTANTE para código de barras:
- Procure por códigos de barras (geralmente 13 dígitos para EAN-13, 12 para UPC)
- O código pode estar abaixo ou ao lado da imagem do código de barras
- Retorne APENAS os números, sem espaços ou traços

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "product_name": "nome do produto ou null",
  "brand": "marca ou null", 
  "sif": "APENAS números do SIF (ex: 12345) ou null",
  "barcode": "código de barras (apenas números) ou null",
  "weight": "peso/quantidade (apenas número) ou null",
  "weight_unit": "unidade (KG, G, L, ML, UN, CX ou PCT) ou null",
  "data_validade": "data no formato DD/MM/AAAA ou null",
  "observations": "observações relevantes ou null",
  "storage_instructions": "texto completo das instruções de conservação ou null",
  "shelf_life_days": {
    "ambient": número inteiro de dias em temperatura ambiente ou null,
    "refrigerated": número inteiro de dias sob refrigeração ou null,
    "frozen": número inteiro de dias congelado ou null
  }
}

IMPORTANTE: 
- Se não conseguir identificar alguma informação, use null
- Retorne apenas o JSON, sem texto adicional antes ou depois
- O nome do produto é obrigatório
- Para o SIF, retorne APENAS OS NÚMEROS (ex: se encontrar "SIF 12345", retorne apenas "12345")
- Para código de barras, retorne APENAS OS NÚMEROS sem espaços
- Para peso, retorne o número e a unidade separadamente
- Para data de validade e prazos em dias, procure cuidadosamente em ambas as imagens
- Para instruções de conservação, mantenha o texto original exatamente como está no rótulo
''';

      // Fazer requisição para OpenAI
      final response = await http.post(
        Uri.parse('$_baseUrl/chat/completions'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${AppConfig.openAiApiKey}',
        },
        body: jsonEncode({
          'model': AppConfig.openAiModel,
          'messages': [
            {
              'role': 'user',
              'content': [
                {
                  'type': 'text',
                  'text': prompt,
                },
                {
                  'type': 'image_url',
                  'image_url': {
                    'url': 'data:image/jpeg;base64,$frenteBase64',
                  },
                },
                {
                  'type': 'image_url',
                  'image_url': {
                    'url': 'data:image/jpeg;base64,$versoBase64',
                  },
                },
              ],
            },
          ],
          'max_tokens': 600,
          'temperature': 0.1, // Baixa temperatura para respostas mais precisas
        }),
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final content = jsonResponse['choices'][0]['message']['content'] as String;
        
        // Tentar extrair JSON da resposta
        final cleanedContent = _extractJson(content);
        final labelData = AiLabelData.fromJson(jsonDecode(cleanedContent));
        
        if (labelData.isEmpty) {
          return OpenAiResponse.error(
            'Não foi possível extrair informações das imagens. Tente tirar fotos mais nítidas do produto.'
          );
        }
        
        return OpenAiResponse.success(labelData);
      } else {
        final error = jsonDecode(response.body);
        return OpenAiResponse.error(
          error['error']?['message'] ?? 'Erro ao analisar imagens'
        );
      }
    } catch (e) {
      print('Erro no OpenAI Service (análise de validade): $e');
      return OpenAiResponse.error(
        'Erro ao processar imagens: ${e.toString()}'
      );
    }
  }
  
  /// Analisa uma imagem com um prompt personalizado
  Future<OpenAiResponse> analyzeImageWithCustomPrompt(File imageFile, String customPrompt) async {
    try {
      // Converter imagem para base64
      final bytes = await imageFile.readAsBytes();
      final base64Image = base64Encode(bytes);

      // Fazer requisição para OpenAI
      final response = await http.post(
        Uri.parse('$_baseUrl/chat/completions'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${AppConfig.openAiApiKey}',
        },
        body: jsonEncode({
          'model': AppConfig.openAiModel,
          'messages': [
            {
              'role': 'user',
              'content': [
                {
                  'type': 'text',
                  'text': customPrompt,
                },
                {
                  'type': 'image_url',
                  'image_url': {
                    'url': 'data:image/jpeg;base64,$base64Image',
                  },
                },
              ],
            },
          ],
          'max_tokens': 500,
          'temperature': 0.1, // Baixa temperatura para respostas mais precisas
        }),
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final content = jsonResponse['choices'][0]['message']['content'] as String;
        
        // Tentar extrair JSON da resposta
        final cleanedContent = _extractJson(content);
        final data = jsonDecode(cleanedContent);
        
        return OpenAiResponse.successCustom(data);
      } else {
        final error = jsonDecode(response.body);
        return OpenAiResponse.error(
          error['error']?['message'] ?? 'Erro ao analisar imagem'
        );
      }
    } catch (e) {
      print('Erro no OpenAI Service (custom prompt): $e');
      return OpenAiResponse.error(
        'Erro ao processar imagem: ${e.toString()}'
      );
    }
  }
  
  /// Analisa uma imagem para extrair data de fabricação, data de validade, SIF e lote
  Future<OpenAiResponse> analyzeImageForReceipt(File imageFile) async {
    try {
      // Converter imagem para base64
      final bytes = await imageFile.readAsBytes();
      final base64Image = base64Encode(bytes);

      // Preparar prompt específico para recebimento
      final prompt = '''
Analise esta imagem de um produto alimentício e extraia as seguintes informações:

1. DATA DE FABRICAÇÃO: Procure por "fabricado em", "fabricação", "produzido em", "data de fabricação", etc. (formato DD/MM/AAAA)
2. DATA DE VALIDADE: Procure por "validade", "válido até", "vence em", "vencimento", "use até", "consumir até", etc. (formato DD/MM/AAAA)
3. SIF: Procure por "SIF" seguido de números (ex: SIF 12345) - retorne APENAS OS NÚMEROS, sem o texto "SIF"
4. LOTE: Procure por números de lote, códigos de lote, ou identificadores de lote (ex: L20251015-003, Lote 123, Batch 456, etc.)

IMPORTANTE:
- Para DATA DE FABRICAÇÃO: Procure por datas no formato DD/MM/AAAA ou DD-MM-AAAA
- Para DATA DE VALIDADE: Procure por datas no formato DD/MM/AAAA ou DD-MM-AAAA
- Para SIF: Retorne APENAS OS NÚMEROS (ex: se encontrar "SIF 12345", retorne apenas "12345")
- Para LOTE: Procure por códigos alfanuméricos que identifiquem o lote de fabricação
- Se não encontrar alguma informação, retorne string vazia ""
- Seja preciso e extraia exatamente o que vê na imagem

Retorne APENAS um JSON válido no formato:
{
  "data_fabricacao": "data no formato DD/MM/AAAA ou string vazia",
  "data_validade": "data no formato DD/MM/AAAA ou string vazia",
  "sif": "número do SIF (apenas números) ou string vazia",
  "lote": "código do lote encontrado ou string vazia"
}
''';

      // Fazer requisição para OpenAI
      final response = await http.post(
        Uri.parse('$_baseUrl/chat/completions'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${AppConfig.openAiApiKey}',
        },
        body: jsonEncode({
          'model': AppConfig.openAiModel,
          'messages': [
            {
              'role': 'user',
              'content': [
                {
                  'type': 'text',
                  'text': prompt,
                },
                {
                  'type': 'image_url',
                  'image_url': {
                    'url': 'data:image/jpeg;base64,$base64Image',
                  },
                },
              ],
            },
          ],
          'max_tokens': 500,
          'temperature': 0.1, // Baixa temperatura para respostas mais precisas
        }),
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final content = jsonResponse['choices'][0]['message']['content'] as String;
        
        // Tentar extrair JSON da resposta
        final cleanedContent = _extractJson(content);
        final data = jsonDecode(cleanedContent);
        
        return OpenAiResponse.successCustom(data);
      } else {
        final error = jsonDecode(response.body);
        return OpenAiResponse.error(
          error['error']?['message'] ?? 'Erro ao analisar imagem'
        );
      }
    } catch (e) {
      print('Erro no OpenAI Service (análise de recebimento): $e');
      return OpenAiResponse.error(
        'Erro ao processar imagem: ${e.toString()}'
      );
    }
  }
  
  /// Extrai JSON de uma string que pode conter texto adicional
  String _extractJson(String content) {
    // Procurar por { e } para extrair o JSON
    final startIndex = content.indexOf('{');
    final endIndex = content.lastIndexOf('}');
    
    if (startIndex != -1 && endIndex != -1) {
      return content.substring(startIndex, endIndex + 1);
    }
    
    return content;
  }
}

