import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { ReviewTextDto } from './dto/review-text.dto';
import { AnalyzeImageDto } from './dto/analyze-image.dto';
import { AnalyzeImportDto } from './dto/analyze-import.dto';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze-image')
  @ApiOperation({
    summary:
      'Analisa imagem(ns) de produto com IA (extrai nome, marca, SIF, validade, etc.)',
  })
  @ApiResponse({ status: 200, description: 'JSON estruturado com dados extraídos' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  @ApiResponse({ status: 403, description: 'Limite de IA do plano atingido' })
  @ApiResponse({ status: 503, description: 'IA não disponível ou erro no provedor' })
  async analyzeImage(@Body() dto: AnalyzeImageDto, @Request() req: any) {
    const clientId = req.user?.clientId;
    return this.aiService.analyzeImage(
      clientId,
      dto.image,
      dto.analysisType,
      dto.backImage,
      dto.customPrompt,
    );
  }

  @Post('analyze-import')
  @ApiOperation({
    summary:
      'Analisa lista de produtos para importação em lote (classificação, correção, sugestão de validades)',
  })
  @ApiResponse({ status: 200, description: 'Array de itens analisados pela IA' })
  @ApiResponse({ status: 403, description: 'Limite de IA do plano atingido' })
  @ApiResponse({ status: 503, description: 'IA não disponível ou erro no provedor' })
  async analyzeImport(@Body() dto: AnalyzeImportDto, @Request() req: any) {
    const clientId = req.user?.clientId;
    return this.aiService.analyzeImport(
      clientId,
      dto.products,
      dto.existingCategories,
    );
  }

  @Post('review-text')
  @ApiOperation({
    summary:
      'Revisão de texto por IA (gramática, ortografia, clareza em PT-BR). Retorna sugestão para aplicar.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sugestão de texto revisado',
    schema: {
      type: 'object',
      properties: {
        suggested: {
          type: 'string',
          description: 'Texto revisado sugerido',
        },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'IA não disponível ou erro no provedor' })
  reviewText(@Body() dto: ReviewTextDto) {
    return this.aiService.reviewText(dto.text);
  }
}
