import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Logger,
  Request,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MqttService } from './mqtt.service';
import { CreatePrintJobDto, PrintJobResponseDto } from './dto/print-job.dto';
import { PrintJobsService } from '../edge/services/print-jobs.service';
import { PrintJobStatus } from '../edge/entities/print-job.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EdgeGoWebSocketGateway } from './edge-go-websocket.gateway';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('MQTT Printing')
@Controller('mqtt')
export class MqttController {
  private readonly logger = new Logger(MqttController.name);

  constructor(
    private readonly mqttService: MqttService,
    private readonly printJobsService: PrintJobsService,
    private readonly edgeGoWebSocketGateway: EdgeGoWebSocketGateway,
  ) {}

  @Post('print')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Envia job de impressão via MQTT',
    description:
      'Publica um job de impressão em um tópico MQTT para ser consumido pela impressora edge',
  })
  @ApiResponse({
    status: 201,
    description: 'Job de impressão enviado com sucesso',
    type: PrintJobResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 500, description: 'Erro ao enviar job' })
  async createPrintJob(
    @Body() createPrintJobDto: CreatePrintJobDto,
    @Request() req,
  ): Promise<PrintJobResponseDto> {
    let jobIdForError: string | null = null;
    try {
      if (!createPrintJobDto.labels?.length) {
        throw new BadRequestException(
          'É necessário informar ao menos uma etiqueta',
        );
      }

      const deviceFingerprint = createPrintJobDto.printerId;
      const timestamp = new Date().toISOString();

      this.logger.log(`📡 [MQTT Print] Job recebido: printerId=${deviceFingerprint}, labels=${createPrintJobDto.labels?.length || 0}`);

      const copies =
        createPrintJobDto.printConfig?.copies ?? createPrintJobDto.labels.length;

      const job = await this.printJobsService.createJob(
        {
          deviceFingerprint,
          printerId: deviceFingerprint,
          copies,
          priority: 'normal',
          metadata: {
            labels: createPrintJobDto.labels,
            templateId: createPrintJobDto.templateId,
            printConfig: createPrintJobDto.printConfig,
            source: 'mqtt',
          },
        },
        req.user?.sub,
        req.user?.clientId,
      );
      jobIdForError = job.jobId;

      const jobData = {
        jobId: job.jobId,
        timestamp,
        printerId: deviceFingerprint,
        labels: createPrintJobDto.labels,
        templateId: createPrintJobDto.templateId,
        printConfig: createPrintJobDto.printConfig || {},
      };

      this.logger.log(`📡 [WebSocket Print] Enviando job para Edge-Go: ${deviceFingerprint}`);
      this.logger.log(`📦 [WebSocket Print] Job data: ${JSON.stringify({ jobId: jobData.jobId, printerId: jobData.printerId, labelCount: jobData.labels?.length || 0 })}`);

      // Envia via WebSocket
      const success = await this.edgeGoWebSocketGateway.sendPrintJob(deviceFingerprint, jobData);
      
      if (!success) {
        this.logger.error(`❌ [WebSocket Print] Falha ao enviar job para ${deviceFingerprint} - device offline ou impressora não pronta`);
        throw new BadRequestException(`Edge-Go ${deviceFingerprint} não está conectado ou impressora não está pronta`);
      }
      
      this.logger.log(`✅ [WebSocket Print] Job enviado com sucesso via WebSocket para: ${deviceFingerprint}`);

      await this.printJobsService.markAsProcessing(job.jobId);
      this.printJobsService.scheduleTimeout(
        job.jobId,
        10_000,
        'Timeout aguardando confirmação do Edge-Go',
      );

      this.logger.log(
        `Job de impressão ${job.jobId} enviado para impressora ${deviceFingerprint} - ${createPrintJobDto.labels.length} etiqueta(s)`,
      );

      return {
        jobId: job.jobId,
        printerId: deviceFingerprint,
        labelCount: createPrintJobDto.labels.length,
        transport: 'websocket',
        timestamp,
        status: 'processing',
        message: `Job enviado via WebSocket. ${createPrintJobDto.labels.length} etiqueta(s) aguardando confirmação.`,
      };
    } catch (error) {
      if (jobIdForError) {
        await this.printJobsService.updateJobStatus(
          jobIdForError,
          PrintJobStatus.ERROR,
          error.message,
        );
      }
      this.logger.error(`Erro ao criar job de impressão: ${error.message}`);
      throw error;
    }
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Obtém estatísticas do broker MQTT',
    description:
      'Retorna informações sobre clientes conectados e subscrições ativas',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas do broker',
    schema: {
      properties: {
        clients: { type: 'number', example: 5 },
        subscriptions: { type: 'number', example: 12 },
      },
    },
  })
  getStats() {
    return this.mqttService.getStats();
  }

  @Post('ping')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verifica status de dispositivo Edge-Go via MQTT ping',
    description: 'Envia um ping MQTT e aguarda resposta para verificar se o dispositivo está online',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do dispositivo verificado',
    schema: {
      properties: {
        deviceId: { type: 'string', example: 'edge-go-d7e2b4' },
        online: { type: 'boolean', example: true },
        responseTime: { type: 'number', example: 150 },
        timestamp: { type: 'string', example: '2025-11-01T10:30:00.000Z' },
      },
    },
  })
  async pingDevice(@Body() body: { deviceId: string; timeout?: number }) {
    const { deviceId, timeout = 5000 } = body;
    
    try {
      this.logger.log(`🏓 Enviando ping MQTT para dispositivo: ${deviceId}`);
      
      const startTime = Date.now();
      const pingId = uuidv4();
      const topic = `granobox/device/${deviceId}/ping`;
      
      // Enviar ping
      await this.mqttService.publish({
        topic,
        payload: {
          pingId,
          timestamp: new Date().toISOString(),
          type: 'ping',
        },
      });
      
      // Aguardar resposta (simulado por enquanto)
      // TODO: Implementar listener para resposta real
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const responseTime = Date.now() - startTime;
      const isOnline = responseTime < timeout;
      
      this.logger.log(`🏓 Ping ${deviceId}: ${isOnline ? 'ONLINE' : 'TIMEOUT'} (${responseTime}ms)`);
      
      return {
        deviceId,
        online: isOnline,
        responseTime: isOnline ? responseTime : null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`❌ Erro no ping MQTT ${deviceId}: ${error.message}`);
      return {
        deviceId,
        online: false,
        responseTime: null,
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  @Get('test/publish/:printerId')
  @ApiOperation({
    summary: 'Endpoint de teste para publicar mensagem MQTT',
    description:
      'Envia uma mensagem de teste para uma impressora específica (apenas para desenvolvimento)',
  })
  @ApiResponse({ status: 200, description: 'Mensagem de teste enviada' })
  async testPublish(@Param('printerId') printerId: string) {
    const testMessage = {
      jobId: uuidv4(),
      timestamp: new Date().toISOString(),
      printerId,
      labels: [
        {
          produto: 'Produto Teste',
          lote: 'TESTE-001',
          validade: '2025-12-31',
          fabricacao: '2025-01-01',
        },
      ],
    };

    const topic = `granobox/printer/${printerId}/jobs`;

    await this.mqttService.publish({
      topic,
      payload: testMessage,
      qos: 1,
    });

    return {
      success: true,
      message: 'Mensagem de teste publicada',
      topic,
      payload: testMessage,
    };
  }
}
