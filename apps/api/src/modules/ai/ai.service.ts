import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnalysisType } from './dto/analyze-image.dto';
import { LimitsService } from '../limits/limits.service';

const SYSTEM_PROMPT = `Você é um revisor ortográfico em português do Brasil para rótulos/etiquetas.
Regras:
- Corrija APENAS erros de gramática, ortografia e pontuação.
- NÃO altere: números, unidades (g, mg, ml, %, kcal), tabela nutricional, endereços, e-mails, telefones, CNPJ, códigos.
- Mantenha cada linha e quebra de linha como está.
- Devolva SOMENTE o texto revisado, sem prefixos. Se não houver nada a corrigir, devolva o texto exatamente igual.`;

/* ── Prompts de análise de imagem (migrados do Flutter openai_service.dart) ── */

const PROMPT_PRODUCT_SINGLE = `Analise esta imagem de um produto alimentício e extraia as seguintes informações:
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
- Para o SIF, procure por "SIF" seguido de números no rótulo`;

const PROMPT_PRODUCT_DUAL = `Analise estas duas imagens de um produto alimentício (frente e verso) e extraia as seguintes informações:

IMAGEM 1: Frente do produto
IMAGEM 2: Verso do produto

Extraia:
- Nome do produto (da frente)
- Marca (se visível)
- Número SIF (Serviço de Inspeção Federal) se estiver disponível - APENAS OS NÚMEROS, sem o texto "SIF"
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

NOTA: Código de barras NÃO deve ser extraído pela IA; o usuário usa o leitor de câmera no app. Sempre retorne null para "barcode".

Retorne APENAS um JSON válido com esta estrutura exata:
{
  "product_name": "nome do produto ou null",
  "brand": "marca ou null",
  "sif": "APENAS números do SIF (ex: 12345) ou null",
  "barcode": null,
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
- Para peso, retorne o número e a unidade separadamente
- Para data de validade e prazos em dias, procure cuidadosamente em ambas as imagens
- Para instruções de conservação, mantenha o texto original exatamente como está no rótulo`;

const PROMPT_RECEIPT = `Analise esta imagem de um produto alimentício (embalagem, rótulo, etiqueta) e extraia as seguintes informações:

1. DATA DE FABRICAÇÃO: Procure por "fabricado em", "fabricação", "produzido em", "data de fabricação", "manufacturing date", "MFG", etc. Retorne a data exatamente como aparece (ex: 06/01/2027 ou 06/01/27).
2. DATA DE VALIDADE: Procure por "validade", "válido até", "vence em", "vencimento", "use até", "consumir até", "exp", "best before", "BB", etc. Retorne a data exatamente como aparece (ex: 15/03/2027 ou 15/03/27).
3. SIF: Procure por "SIF" seguido de números (ex: SIF 12345) - retorne APENAS OS NÚMEROS, sem o texto "SIF".
4. LOTE: Procure por números de lote, códigos de lote (ex: L20251015-003, Lote 123, Batch 456, L: ..., etc.).

REGRAS:
- Datas: aceite DD/MM/AAAA, DD/MM/AA, DD-MM-AAAA ou DD.MM.AAAA. Retorne exatamente o que estiver na imagem.
- SIF: apenas os dígitos.
- Se não encontrar alguma informação, use string vazia "".
- Retorne somente um JSON válido, sem texto antes ou depois.

Exemplo de resposta:
{
  "data_fabricacao": "06/01/2027",
  "data_validade": "15/03/2027",
  "sif": "12345",
  "lote": "L20250106"
}`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly limitsService: LimitsService,
  ) {}

  /** Retorna a instância do OpenAI client (lazy import). */
  private async getOpenAiClient() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey?.trim()) {
      this.logger.warn('OPENAI_API_KEY não configurada');
      throw new ServiceUnavailableException(
        'IA não disponível (OPENAI_API_KEY não configurada)',
      );
    }
    const OpenAI = (await import('openai')).default;
    return new OpenAI({ apiKey });
  }

  private getModel(): string {
    return this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
  }

  /* ────────────────── analyze-image ────────────────── */

  async analyzeImage(
    clientId: string,
    image: string,
    analysisType: AnalysisType,
    backImage?: string,
    customPrompt?: string,
  ): Promise<Record<string, any>> {
    // Validações específicas por tipo
    if (analysisType === AnalysisType.PRODUCT_DUAL && !backImage) {
      throw new BadRequestException(
        'Segunda imagem (backImage) é obrigatória para análise product-dual',
      );
    }
    if (analysisType === AnalysisType.CUSTOM && !customPrompt?.trim()) {
      throw new BadRequestException(
        'customPrompt é obrigatório para análise do tipo custom',
      );
    }

    // Checar limites de IA do plano
    await this.checkAiLimits(clientId);

    // Montar mensagens para OpenAI
    const messages = this.buildMessages(
      image,
      analysisType,
      backImage,
      customPrompt,
    );

    try {
      const openai = await this.getOpenAiClient();
      const completion = await openai.chat.completions.create({
        model: this.getModel(),
        messages,
        max_tokens: analysisType === AnalysisType.PRODUCT_DUAL ? 600 : 500,
        temperature: 0.1,
      });

      const content = completion.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new ServiceUnavailableException(
          'IA não retornou conteúdo na resposta',
        );
      }

      // Extrair JSON da resposta
      const parsed = this.extractJson(content);

      // Registrar uso de IA
      await this.limitsService.recordAiUsage(clientId);

      return parsed;
    } catch (err) {
      if (
        err instanceof BadRequestException ||
        err instanceof ForbiddenException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`OpenAI analyze-image [${analysisType}]: ${msg}`);
      throw new ServiceUnavailableException(
        `Falha na análise por IA: ${msg.slice(0, 120)}`,
      );
    }
  }

  /** Verifica se o cliente ainda tem cota de IA no mês. */
  private async checkAiLimits(clientId: string): Promise<void> {
    try {
      const limits = await this.limitsService.getClientLimits(clientId);
      const max = limits.plan.maxAiPerMonth;
      if (max > 0 && limits.usage.aiThisMonth >= max) {
        throw new ForbiddenException(
          `Limite de análises por IA atingido (${max}/mês). Faça upgrade do plano para continuar.`,
        );
      }
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      // Se não conseguir verificar limites, permite (fail-open)
      this.logger.warn(`Não foi possível verificar limites de IA: ${err}`);
    }
  }

  /** Monta o array de mensagens da OpenAI conforme o tipo de análise. */
  private buildMessages(
    image: string,
    analysisType: AnalysisType,
    backImage?: string,
    customPrompt?: string,
  ): any[] {
    const prompt = this.getPromptForType(analysisType, customPrompt);
    const imageUrl = `data:image/jpeg;base64,${image}`;

    const contentParts: any[] = [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: imageUrl } },
    ];

    if (analysisType === AnalysisType.PRODUCT_DUAL && backImage) {
      contentParts.push({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${backImage}` },
      });
    }

    return [{ role: 'user', content: contentParts }];
  }

  private getPromptForType(
    type: AnalysisType,
    customPrompt?: string,
  ): string {
    switch (type) {
      case AnalysisType.PRODUCT_SINGLE:
        return PROMPT_PRODUCT_SINGLE;
      case AnalysisType.PRODUCT_DUAL:
        return PROMPT_PRODUCT_DUAL;
      case AnalysisType.RECEIPT:
        return PROMPT_RECEIPT;
      case AnalysisType.CUSTOM:
        return customPrompt!;
    }
  }

  /** Extrai JSON de uma string que pode conter texto extra. */
  private extractJson(content: string): Record<string, any> {
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start === -1 || end === -1) {
      throw new ServiceUnavailableException(
        'Resposta da IA não contém JSON válido',
      );
    }
    try {
      return JSON.parse(content.substring(start, end + 1));
    } catch {
      throw new ServiceUnavailableException(
        'Falha ao interpretar resposta da IA',
      );
    }
  }

  /* ────────────────── analyze-import (importação em lote) ────────────────── */

  async analyzeImport(
    clientId: string,
    products: Array<{
      name: string;
      category?: string;
      subcategory?: string;
      brand?: string;
      type?: string;
      shelfLifeAmbient?: number;
      shelfLifeRefrigerated?: number;
      shelfLifeFrozen?: number;
      ingredients?: string;
      allergens?: string;
    }>,
    existingCategories?: Array<{ id: string; name: string; parentId?: string }>,
  ): Promise<any[]> {
    const CHUNK_SIZE = 30;
    const chunks: typeof products[] = [];
    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
      chunks.push(products.slice(i, i + CHUNK_SIZE));
    }

    const allResults: any[] = [];
    const openai = await this.getOpenAiClient();

    const categoriesList = existingCategories?.length
      ? existingCategories
          .map(
            (c) =>
              `- "${c.name}" (id: ${c.id}${c.parentId ? `, subcategoria de ${c.parentId}` : ''})`,
          )
          .join('\n')
      : 'Nenhuma categoria existente.';

    const systemPrompt = `Você é um assistente especializado em classificação de produtos alimentícios no Brasil.

Categorias existentes do cliente:
${categoriesList}

Para cada produto da lista, retorne um JSON com:
1. "originalName": nome original exatamente como recebido
2. "correctedName": nome corrigido em português BR (maiúsculas corretas, acentos, ortografia). Se não precisar de correção, igual ao original.
3. "nameWasCorrected": boolean, true se o nome foi alterado
4. "suggestedCategory": { "existingId": "uuid" } se encaixa numa categoria existente, OU { "newName": "Nome da Categoria" } se precisa criar nova
5. "suggestedSubcategory": null ou { "existingId": "uuid" } ou { "newName": "Nome" }
6. "shelfLifeAmbient": número de dias (validade ambiente) - sugerir com base em padrões ANVISA se não fornecido
7. "shelfLifeRefrigerated": número de dias (validade refrigerado) - sugerir se aplicável
8. "shelfLifeFrozen": número de dias (validade congelado) - sugerir se aplicável
9. "type": tipo do produto ("finished", "raw_material", "packaging", "cleaning", "other")
10. "confidence": "high", "medium" ou "low"

Regras:
- PRIORIZE categorias existentes. Só sugira nova categoria se nenhuma existente se encaixa.
- Para validades, use referências ANVISA/boas práticas. Se já fornecido pelo usuário, mantenha.
- Normalize nomes: primeira letra maiúscula, corrigir erros óbvios, manter nomes de marcas.
- Retorne APENAS um JSON válido: { "items": [...] }`;

    for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
      const chunk = chunks[chunkIdx];

      // Checar limites antes de cada chunk
      await this.checkAiLimits(clientId);

      const userMessage = JSON.stringify(
        chunk.map((p, idx) => ({
          index: chunkIdx * CHUNK_SIZE + idx,
          ...p,
        })),
      );

      try {
        // Usa modelo maior (gpt-4o) para importação — é operação pontual, vale a qualidade
        const importModel =
          this.configService.get<string>('OPENAI_IMPORT_MODEL') || 'gpt-4o';
        const completion = await openai.chat.completions.create({
          model: importModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 4096,
          temperature: 0.1,
          response_format: { type: 'json_object' },
        });

        const content = completion.choices?.[0]?.message?.content?.trim();
        if (!content) {
          throw new ServiceUnavailableException(
            'IA não retornou conteúdo na resposta',
          );
        }

        const parsed = JSON.parse(content);
        const items = parsed.items || parsed.products || [];
        allResults.push(...items);

        // Registrar uso de IA por chunk
        await this.limitsService.recordAiUsage(clientId);
      } catch (err) {
        if (
          err instanceof BadRequestException ||
          err instanceof ForbiddenException ||
          err instanceof ServiceUnavailableException
        ) {
          throw err;
        }
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `OpenAI analyze-import chunk ${chunkIdx + 1}/${chunks.length}: ${msg}`,
        );
        throw new ServiceUnavailableException(
          `Falha na análise por IA (lote ${chunkIdx + 1}): ${msg.slice(0, 120)}`,
        );
      }
    }

    return allResults;
  }

  /* ────────────────── review-text (existente) ────────────────── */

  async reviewText(text: string): Promise<{ suggested: string | null }> {
    const normalize = (s: string) => s.trim().replace(/\s+/g, ' ');

    try {
      const openai = await this.getOpenAiClient();
      const completion = await openai.chat.completions.create({
        model: this.getModel(),
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        max_tokens: 4096,
        temperature: 0.2,
      });

      const content = completion.choices?.[0]?.message?.content?.trim();
      if (!content || normalize(content) === normalize(text)) {
        return { suggested: null };
      }
      return { suggested: content };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`OpenAI review-text: ${msg}`);
      throw new ServiceUnavailableException(
        `Falha na revisão por IA: ${msg.slice(0, 100)}`,
      );
    }
  }
}
