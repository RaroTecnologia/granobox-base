import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Logger,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { EdgeGoWebSocketGateway } from './edge-go-websocket.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from '../../upload/upload.service';
import { PrintJobsService } from '../edge/services/print-jobs.service';
import { CreatePrintJobDto, PrintJobResponseDto } from './dto/print-job.dto';
import { PrintJobStatus } from '../edge/entities/print-job.entity';

@ApiTags('Edge-Go WebSocket')
@Controller('edge-go-ws')
export class EdgeGoWebSocketController {
  private readonly logger = new Logger(EdgeGoWebSocketController.name);

  constructor(
    private readonly edgeGoWebSocketGateway: EdgeGoWebSocketGateway,
    private readonly uploadService: UploadService,
    private readonly printJobsService: PrintJobsService,
  ) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Estatísticas do WebSocket Gateway',
    description: 'Retorna informações sobre dispositivos Edge-Go conectados via WebSocket',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas do gateway',
    schema: {
      properties: {
        totalConnections: { type: 'number', example: 5 },
        registeredDevices: { type: 'number', example: 4 },
        devices: {
          type: 'array',
          items: {
            properties: {
              deviceId: { type: 'string', example: 'edge-go-d7e2b4' },
              clientId: { type: 'string', example: 'client-123' },
              connectedAt: { type: 'string', example: '2025-11-01T10:30:00.000Z' },
              lastSeen: { type: 'string', example: '2025-11-01T10:35:00.000Z' },
              registered: { type: 'boolean', example: true },
            },
          },
        },
      },
    },
  })
  getStats() {
    return this.edgeGoWebSocketGateway.getStats();
  }

  @Get('device/:deviceId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verifica se um dispositivo Edge-Go está conectado',
    description: 'Retorna informações sobre a conexão de um dispositivo específico',
  })
  @ApiParam({
    name: 'deviceId',
    description: 'ID do dispositivo (ex: edge-go-d7e2b4)',
    example: 'edge-go-d7e2b4',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do dispositivo',
    schema: {
      properties: {
        deviceId: { type: 'string', example: 'edge-go-d7e2b4' },
        connected: { type: 'boolean', example: true },
        deviceInfo: {
          type: 'object',
          nullable: true,
          properties: {
            clientId: { type: 'string', example: 'client-123' },
            connectedAt: { type: 'string', example: '2025-11-01T10:30:00.000Z' },
            lastSeen: { type: 'string', example: '2025-11-01T10:35:00.000Z' },
            registered: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  getDeviceStatus(@Param('deviceId') deviceId: string) {
    const connected = this.edgeGoWebSocketGateway.isDeviceConnected(deviceId);
    const deviceInfo = this.edgeGoWebSocketGateway.getDeviceInfo(deviceId);

    return {
      deviceId,
      connected,
      deviceInfo,
    };
  }

  @Get('firmware/list')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar firmwares disponíveis no R2' })
  @ApiResponse({ status: 200, description: 'Lista de firmwares retornada com sucesso.' })
  async listFirmwares() {
    this.logger.log('📋 Listando firmwares do R2...');

    try {
      // Listar firmwares de ambas as plataformas
      const [edgeGoFiles, edgeProFiles] = await Promise.all([
        this.uploadService.listFiles('firmware/edge-go'),
        this.uploadService.listFiles('firmware/edge-pro'),
      ]);
      
      const firmwares = [
        ...edgeGoFiles.map(file => {
          // Priorizar versão dos metadados, senão tentar extrair do nome do arquivo
          let version = file.metadata?.version || null;
          if (!version) {
            const versionMatch = file.name.match(/(\d+\.\d+\.\d+)/);
            version = versionMatch ? versionMatch[1] : null;
          }

          return {
            name: file.name,
            url: file.url,
            key: file.key,
            size: file.size,
            version,
            platform: 'edge-go' as const,
            uploadedAt: file.lastModified,
          };
        }),
        ...edgeProFiles.map(file => {
          // Priorizar versão dos metadados, senão tentar extrair do nome do arquivo
          let version = file.metadata?.version || null;
          if (!version) {
            const versionMatch = file.name.match(/(\d+\.\d+\.\d+)/);
            version = versionMatch ? versionMatch[1] : null;
          }

          return {
            name: file.name,
            url: file.url,
            key: file.key,
            size: file.size,
            version,
            platform: 'edge-pro' as const,
            uploadedAt: file.lastModified,
          };
        }),
      ];

      // Ordenar por data (mais recente primeiro)
      firmwares.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );

      this.logger.log(`✅ Encontrados ${firmwares.length} firmwares (${edgeGoFiles.length} Edge-Go, ${edgeProFiles.length} Edge-Pro)`);

      return {
        success: true,
        firmwares,
        count: firmwares.length,
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao listar firmwares: ${error.message}`);
      throw new BadRequestException(`Erro ao listar firmwares: ${error.message}`);
    }
  }

  @Post('firmware/upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('firmware', {
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB (aumentado para Edge-Pro)
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de firmware para R2' })
  @ApiResponse({ status: 200, description: 'Firmware enviado com sucesso.' })
  async uploadFirmware(
    @UploadedFile() file: Express.Multer.File,
    @Body('version') version?: string,
    @Body('platform') platform?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo de firmware não fornecido');
    }

    // Validar plataforma
    const validPlatforms = ['edge-go', 'edge-pro'];
    const firmwarePlatform = (platform || 'edge-go') as 'edge-go' | 'edge-pro';
    
    if (!validPlatforms.includes(firmwarePlatform)) {
      throw new BadRequestException(`Plataforma inválida. Use: ${validPlatforms.join(', ')}`);
    }

    this.logger.log(`📤 Upload de firmware ${firmwarePlatform}: ${file.originalname} (${file.size} bytes)`);

    try {
      // Determinar caminho baseado na plataforma
      const firmwarePath = `firmware/${firmwarePlatform}`;
      const fileName = file.originalname || `firmware-${firmwarePlatform}-${version || 'unknown'}.${firmwarePlatform === 'edge-go' ? 'bin' : ''}`;

      const result = await this.uploadService.uploadBuffer(
        file.buffer,
        firmwarePath,
        fileName,
        'application/octet-stream',
        { 
          version: version || null,
          platform: firmwarePlatform,
        },
      );

      this.logger.log(`✅ Firmware ${firmwarePlatform} enviado: ${result.url}`);

      return {
        success: true,
        url: result.url,
        key: result.key,
        size: file.size,
        version: version || null,
        platform: firmwarePlatform,
        name: fileName,
        uploadedAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao fazer upload: ${error.message}`);
      throw new BadRequestException(`Erro ao fazer upload: ${error.message}`);
    }
  }

  @Post('device/:deviceId/print')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enviar job de impressão via WebSocket',
    description: 'Envia um job de impressão para um dispositivo Edge-Go específico via WebSocket',
  })
  @ApiResponse({
    status: 200,
    description: 'Job enviado com sucesso',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        deviceId: { type: 'string', example: 'edge-go-d7e2b4' },
        jobId: { type: 'string', example: 'job-123' },
        protocol: { type: 'string', example: 'websocket' },
        timestamp: { type: 'string', example: '2025-11-01T10:30:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Dispositivo não conectado',
    schema: {
      properties: {
        success: { type: 'boolean', example: false },
        error: { type: 'string', example: 'Device not connected' },
        deviceId: { type: 'string', example: 'edge-go-d7e2b4' },
      },
    },
  })
  async sendPrintJob(
    @Param('deviceId') deviceId: string,
    @Body() printJob: any,
  ) {
    try {
      // Adicionar jobId se não existir
      if (!printJob.jobId) {
        printJob.jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // 🎯 VALIDAÇÃO PRÉ-IMPRESSÃO: Verificar se impressora está pronta
      this.logger.log(`📍 Verificando status da impressora antes de enviar job ${printJob.jobId}`);
      const printerStatus = await this.edgeGoWebSocketGateway.pingPrinter(deviceId, 8000);
      
      if (printerStatus.status !== 'ready') {
        this.logger.warn(`❌ Impressora não está pronta: ${printerStatus.status} - ${printerStatus.error || 'Sem detalhes'}`);
        
        return {
          success: false,
          error: `Impressora não está pronta: ${printerStatus.status}`,
          printerStatus: printerStatus.status,
          details: printerStatus.details,
          deviceId,
          jobId: printJob.jobId,
          protocol: 'websocket',
          timestamp: new Date().toISOString(),
        };
      }

      this.logger.log(`✅ Impressora pronta, enviando job ${printJob.jobId}`);
      const success = await this.edgeGoWebSocketGateway.sendPrintJob(deviceId, printJob);
      
      if (success) {
        this.logger.log(`✅ Job enviado via WebSocket: ${deviceId} -> ${printJob.jobId}`);
        
        return {
          success: true,
          deviceId,
          jobId: printJob.jobId,
          protocol: 'websocket',
          timestamp: new Date().toISOString(),
        };
      } else {
        this.logger.warn(`❌ Falha ao enviar job via WebSocket: ${deviceId}`);
        
        return {
          success: false,
          error: 'Device not connected',
          deviceId,
          protocol: 'websocket',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar job via WebSocket: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        deviceId,
        protocol: 'websocket',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('device/:deviceId/ping-printer')
  @ApiOperation({ summary: 'Verificar status da impressora antes de imprimir' })
  @ApiResponse({ status: 200, description: 'Status da impressora obtido.' })
  @ApiResponse({ status: 404, description: 'Edge-Go não encontrado ou desconectado.' })
  async pingPrinter(@Param('deviceId') deviceId: string) {
    this.logger.log(`📍 Verificando status da impressora para Edge-Go: ${deviceId}`);
    
    try {
      const result = await this.edgeGoWebSocketGateway.pingPrinter(deviceId, 10000);
      
      return {
        deviceId,
        timestamp: new Date().toISOString(),
        ...result
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao verificar impressora ${deviceId}: ${error.message}`);
      return {
        deviceId,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('device/:deviceId/version')
  @ApiOperation({ summary: 'Verificar versão do firmware do Edge-Go via WebSocket' })
  @ApiResponse({ status: 200, description: 'Informações de versão obtidas via WebSocket.' })
  @ApiResponse({ status: 404, description: 'Edge-Go não encontrado ou desconectado.' })
  async getFirmwareVersion(@Param('deviceId') deviceId: string) {
    this.logger.log(`📋 Verificando versão do firmware via WebSocket para Edge-Go: ${deviceId}`);
    
    try {
      const result = await this.edgeGoWebSocketGateway.checkFirmwareVersion(deviceId, 10000);
      
      return {
        deviceId,
        timestamp: new Date().toISOString(),
        source: 'websocket',
        ...result
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao verificar versão via WebSocket ${deviceId}: ${error.message}`);
      return {
        deviceId,
        error: error.message,
        source: 'websocket',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('device/:deviceId/version/cached')
  @ApiOperation({ summary: 'Obter versão do firmware do Edge-Go do banco de dados (mais rápido)' })
  @ApiResponse({ status: 200, description: 'Versão obtida do banco de dados.' })
  @ApiResponse({ status: 404, description: 'Dispositivo não encontrado no banco.' })
  async getCachedFirmwareVersion(@Param('deviceId') deviceId: string) {
    this.logger.log(`📋 Consultando versão cached para Edge-Go: ${deviceId}`);
    
    try {
      // Injetar FirmwareService seria melhor, mas por simplicidade vamos usar o gateway
      // que já tem acesso ao FirmwareService
      const deviceVersion = await this.edgeGoWebSocketGateway['firmwareService'].getDeviceVersion(deviceId);
      
      if (!deviceVersion) {
        return {
          deviceId,
          error: 'Dispositivo não encontrado no registro de versões',
          source: 'database',
          timestamp: new Date().toISOString()
        };
      }

      // Verificar se precisa de atualização
      const updateCheck = await this.edgeGoWebSocketGateway['firmwareService'].checkForUpdates(deviceId);
      
      return {
        deviceId,
        currentVersion: deviceVersion.currentVersion,
        lastReported: deviceVersion.lastVersionCheck,
        needsUpdate: updateCheck.needsUpdate,
        latestVersion: updateCheck.latestVersion,
        updateAvailable: updateCheck.updateAvailable,
        deviceInfo: {
          compileDate: deviceVersion.compileDate,
          compileTime: deviceVersion.compileTime,
          idfVersion: deviceVersion.idfVersion,
          chipModel: deviceVersion.chipModel,
          chipCores: deviceVersion.chipCores,
          chipRevision: deviceVersion.chipRevision,
          runningPartition: deviceVersion.runningPartition,
        },
        updateHistory: {
          lastUpdateAttempt: deviceVersion.lastUpdateAttempt,
          lastUpdateStatus: deviceVersion.lastUpdateStatus,
          lastUpdateError: deviceVersion.lastUpdateError,
          targetVersion: deviceVersion.targetVersion,
        },
        metadata: deviceVersion.metadata,
        source: 'database',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao consultar versão cached ${deviceId}: ${error.message}`);
      return {
        deviceId,
        error: error.message,
        source: 'database',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('device/:deviceId/version/refresh')
  @ApiOperation({ summary: 'Forçar atualização da versão via WebSocket' })
  @ApiResponse({ status: 200, description: 'Verificação de versão solicitada.' })
  @ApiResponse({ status: 404, description: 'Edge-Go não conectado.' })
  async refreshFirmwareVersion(@Param('deviceId') deviceId: string) {
    this.logger.log(`🔄 Forçando refresh da versão para Edge-Go: ${deviceId}`);
    
    try {
      // Solicitar versão via WebSocket
      const result = await this.edgeGoWebSocketGateway.checkFirmwareVersion(deviceId, 15000);
      
      if (result.error) {
        return {
          deviceId,
          success: false,
          error: result.error,
          timestamp: new Date().toISOString()
        };
      }

      // Aguardar um pouco para o processamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Buscar versão atualizada do banco
      const deviceVersion = await this.edgeGoWebSocketGateway['firmwareService'].getDeviceVersion(deviceId);
      const updateCheck = await this.edgeGoWebSocketGateway['firmwareService'].checkForUpdates(deviceId);
      
      return {
        deviceId,
        success: true,
        currentVersion: result.current_version,
        needsUpdate: updateCheck.needsUpdate,
        latestVersion: updateCheck.latestVersion,
        refreshedAt: new Date().toISOString(),
        deviceInfo: {
          compileDate: result.compile_date,
          compileTime: result.compile_time,
          idfVersion: result.idf_version,
          chipModel: result.chip_model,
          chipCores: result.chip_cores,
          chipRevision: result.chip_revision,
          runningPartition: result.running_partition,
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao refresh versão ${deviceId}: ${error.message}`);
      return {
        deviceId,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('device/:deviceId/ota')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Iniciar atualização OTA do firmware' })
  @ApiResponse({ status: 200, description: 'OTA iniciado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Erro na validação dos dados.' })
  @ApiResponse({ status: 404, description: 'Edge-Go não encontrado ou desconectado.' })
  async startOta(
    @Param('deviceId') deviceId: string,
    @Body() otaData: { 
      version: string; 
      firmware?: string; // base64 encoded firmware (deprecated, usar firmwareUrl)
      firmwareUrl?: string; // URL do firmware no R2
      checksum: string; 
    }
  ) {
    this.logger.log(`🔄 Iniciando OTA para Edge-Go: ${deviceId} -> ${otaData.version}`);
    
    try {
      // Validar dados
      if (!otaData.version || !otaData.checksum) {
        return {
          success: false,
          error: 'Dados obrigatórios: version, checksum e (firmware ou firmwareUrl)',
          deviceId,
          timestamp: new Date().toISOString()
        };
      }

      let firmwareBuffer: Buffer;

      // Se tiver URL, baixar do R2
      if (otaData.firmwareUrl) {
        this.logger.log(`📥 Baixando firmware do R2: ${otaData.firmwareUrl}`);
        try {
          const response = await fetch(otaData.firmwareUrl);
          if (!response.ok) {
            throw new Error(`Erro ao baixar firmware: ${response.statusText}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          firmwareBuffer = Buffer.from(arrayBuffer);
          this.logger.log(`✅ Firmware baixado: ${firmwareBuffer.length} bytes`);
        } catch (error) {
          return {
            success: false,
            error: `Erro ao baixar firmware do R2: ${error.message}`,
            deviceId,
            timestamp: new Date().toISOString()
          };
        }
      } else if (otaData.firmware) {
        // Fallback: decodificar firmware base64 (deprecated)
        this.logger.warn(`⚠️ Usando firmware base64 (deprecated, usar firmwareUrl)`);
        firmwareBuffer = Buffer.from(otaData.firmware, 'base64');
      } else {
        return {
          success: false,
          error: 'Forneça firmwareUrl ou firmware (base64)',
          deviceId,
          timestamp: new Date().toISOString()
        };
      }
      
      if (firmwareBuffer.length === 0) {
        return {
          success: false,
          error: 'Firmware inválido ou vazio',
          deviceId,
          timestamp: new Date().toISOString()
        };
      }

      // Iniciar OTA com callbacks
      const result = await this.edgeGoWebSocketGateway.startOta(
        deviceId,
        firmwareBuffer,
        otaData.version,
        otaData.checksum,
        (progress) => {
          this.logger.debug(`📊 OTA ${deviceId}: ${progress}%`);
        },
        (success, error) => {
          if (success) {
            this.logger.log(`🎉 OTA concluído com sucesso para ${deviceId}`);
          } else {
            this.logger.error(`❌ OTA falhou para ${deviceId}: ${error}`);
          }
        }
      );

      return {
        ...result,
        deviceId,
        version: otaData.version,
        firmwareSize: firmwareBuffer.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Erro no OTA ${deviceId}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        deviceId,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('device/:deviceId/ota/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter status atual do OTA' })
  @ApiResponse({ status: 200, description: 'Status do OTA.' })
  async getOtaStatus(@Param('deviceId') deviceId: string) {
    const status = this.edgeGoWebSocketGateway.getOtaStatus(deviceId);
    
    return {
      deviceId,
      ...status,
      startedAt: status.startedAt?.toISOString(),
      timestamp: new Date().toISOString()
    };
  }

  @Delete('device/:deviceId/ota')
  @ApiOperation({ summary: 'Cancelar atualização OTA em progresso' })
  @ApiResponse({ status: 200, description: 'OTA cancelado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Nenhuma sessão OTA ativa.' })
  async cancelOta(@Param('deviceId') deviceId: string) {
    this.logger.log(`⚠️ Cancelando OTA para Edge-Go: ${deviceId}`);
    
    try {
      const result = await this.edgeGoWebSocketGateway.cancelOta(deviceId);
      
      return {
        ...result,
        deviceId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao cancelar OTA ${deviceId}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        deviceId,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('info')
  @ApiOperation({
    summary: 'Informações do WebSocket Gateway',
    description: 'Retorna informações sobre o gateway WebSocket para Edge-Go',
  })
  @ApiResponse({
    status: 200,
    description: 'Informações do gateway',
    schema: {
      properties: {
        name: { type: 'string', example: 'Edge-Go WebSocket Gateway' },
        version: { type: 'string', example: '1.0.0' },
        protocol: { type: 'string', example: 'websocket-pure' },
        port: { type: 'number', example: 8080 },
        path: { type: 'string', example: '/edge-go-ws' },
        description: { type: 'string', example: 'WebSocket puro para Edge-Go (contorna firewall)' },
        features: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'WebSocket puro (não Socket.IO)',
            'Porta 8080 dedicada',
            'Protocolo JSON simples',
            'WebSocket puro (sem MQTT)',
            'Suporte a múltiplos dispositivos',
          ],
        },
      },
    },
  })
  getInfo() {
    return {
      name: 'Edge-Go WebSocket Gateway',
      version: '1.0.0',
      protocol: 'websocket-pure',
      port: process.env.NODE_ENV === 'production' ? 8080 : 8081,
      path: '/edge-go-ws',
      description: 'WebSocket puro para Edge-Go (contorna firewall)',
      features: [
        'WebSocket puro (não Socket.IO)',
        'Porta 8080 dedicada',
        'Protocolo JSON simples',
        'WebSocket puro (sem MQTT)',
        'Suporte a múltiplos dispositivos',
        'Heartbeat automático',
        'Reconexão automática',
        'Logs detalhados',
      ],
      endpoints: {
        websocket: process.env.NODE_ENV === 'production' 
          ? 'wss://ws.granobox.com.br/edge-go-ws'
          : `ws://localhost:${process.env.NODE_ENV === 'production' ? 8080 : 8081}/edge-go-ws`,
        stats: '/edge-go-ws/stats',
        deviceStatus: '/edge-go-ws/device/:deviceId/status',
        sendJob: '/edge-go-ws/device/:deviceId/print',
        print: '/edge-go-ws/print', // ⭐ NOVO: Endpoint principal de impressão
      },
    };
  }

  @Post('print')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Envia job de impressão via WebSocket para Edge-Go',
    description: 'Envia um job de impressão para um dispositivo Edge-Go conectado via WebSocket',
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

      this.logger.log(`📡 [Edge-Go Print] Job recebido: printerId=${deviceFingerprint}, labels=${createPrintJobDto.labels?.length || 0}`);

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
            source: 'edge-go-ws',
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

  @Post('device/:deviceId/reboot')
  @ApiOperation({
    summary: 'Reiniciar Edge-Go remotamente via WebSocket',
    description: 'Envia comando de reboot para o dispositivo Edge-Go via WebSocket. O dispositivo irá reiniciar em ~2 segundos.',
  })
  @ApiParam({
    name: 'deviceId',
    description: 'ID do dispositivo Edge-Go (ex: edge-go-bd1a14)',
    example: 'edge-go-bd1a14',
  })
  @ApiResponse({
    status: 200,
    description: 'Comando de reboot enviado com sucesso',
    schema: {
      example: {
        success: true,
        deviceId: 'edge-go-bd1a14',
        message: 'Comando de reboot enviado. Dispositivo irá reiniciar em ~2 segundos.',
        timestamp: '2025-12-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Edge-Go não encontrado ou não conectado',
  })
  async rebootDevice(
    @Param('deviceId') deviceId: string,
  ): Promise<{ success: boolean; deviceId: string; message: string; timestamp: string }> {
    this.logger.warn(`🔄 [REBOOT] Recebida requisição de reboot para: ${deviceId}`);

    // Verificar se o device está conectado
    const success = await this.edgeGoWebSocketGateway.sendRebootCommand(deviceId);

    if (!success) {
      throw new NotFoundException(
        `Edge-Go ${deviceId} não está conectado via WebSocket ou não foi encontrado`,
      );
    }

    return {
      success: true,
      deviceId,
      message: 'Comando de reboot enviado. Dispositivo irá reiniciar em ~2 segundos.',
      timestamp: new Date().toISOString(),
    };
  }
}
