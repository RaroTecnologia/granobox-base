import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { V15Service } from './v1-5.service';
import { PrintLabelDto, PrintLabelResponseDto } from './dto/print-label.dto';

@ApiTags('v1.5 - Printing')
@Controller('v1.5')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class V15Controller {
  private readonly logger = new Logger(V15Controller.name);

  constructor(private readonly v15Service: V15Service) {}

  @Post('print-label')
  @ApiOperation({
    summary: 'Imprimir etiqueta (v1.5)',
    description: `
      Endpoint simplificado para impressão de etiquetas.
      
      O backend processa o template (Tagment) e envia o ZPL para o Edge-Go.
      
      **Tipos de etiqueta:**
      - \`validity\`: Etiqueta rastreável (cria registros no banco, cada uma com código único)
      - \`label\`: Etiqueta genérica (não rastreável, todas iguais)
      
      **Para labelType=validity:**
      - Cada cópia gera um código/QR Code único
      - Registros criados na tabela \`labels\`
      - Campo \`metadata\` é obrigatório (productId, validityDate)
      
      **Para labelType=label:**
      - Todas as cópias são idênticas
      - Não cria registros no banco
      - Usa comando ZPL ^PQ para múltiplas cópias
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Etiqueta(s) enviada(s) para impressão com sucesso',
    type: PrintLabelResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou impressora offline',
  })
  @ApiResponse({
    status: 404,
    description: 'Impressora não encontrada',
  })
  async printLabel(
    @Body() dto: PrintLabelDto,
    @Request() req,
  ): Promise<PrintLabelResponseDto> {
    this.logger.log(
      `📋 [v1.5/print-label] Request from user ${req.user.email}`,
    );
    this.logger.log(`   Label type: ${dto.labelType}`);
    this.logger.log(`   Copies: ${dto.copies}`);
    this.logger.log(`   Printer ID: ${dto.printerId}`);

    return this.v15Service.printLabel(
      dto,
      req.user.sub,
      req.user.clientId,
    );
  }
}


