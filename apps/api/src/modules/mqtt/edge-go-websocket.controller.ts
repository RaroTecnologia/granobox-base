import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EdgeGoWebSocketGateway } from './edge-go-websocket.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Edge-Go WebSocket')
@Controller('edge-go-ws')
export class EdgeGoWebSocketController {
  private readonly logger = new Logger(EdgeGoWebSocketController.name);

  constructor(
    private readonly edgeGoWebSocketGateway: EdgeGoWebSocketGateway,
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
    summary: 'Verificar status de dispositivo Edge-Go',
    description: 'Verifica se um dispositivo Edge-Go específico está conectado via WebSocket',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do dispositivo',
    schema: {
      properties: {
        deviceId: { type: 'string', example: 'edge-go-d7e2b4' },
        connected: { type: 'boolean', example: true },
        protocol: { type: 'string', example: 'websocket' },
        timestamp: { type: 'string', example: '2025-11-01T10:30:00.000Z' },
      },
    },
  })
  getDeviceStatus(@Param('deviceId') deviceId: string) {
    const connected = this.edgeGoWebSocketGateway.isDeviceConnected(deviceId);
    
    return {
      deviceId,
      connected,
      protocol: 'websocket',
      timestamp: new Date().toISOString(),
    };
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
  @ApiOperation({ summary: 'Verificar versão do firmware do Edge-Go' })
  @ApiResponse({ status: 200, description: 'Informações de versão obtidas.' })
  @ApiResponse({ status: 404, description: 'Edge-Go não encontrado ou desconectado.' })
  async getFirmwareVersion(@Param('deviceId') deviceId: string) {
    this.logger.log(`📋 Verificando versão do firmware para Edge-Go: ${deviceId}`);
    
    try {
      const result = await this.edgeGoWebSocketGateway.checkFirmwareVersion(deviceId, 10000);
      
      return {
        deviceId,
        timestamp: new Date().toISOString(),
        ...result
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao verificar versão ${deviceId}: ${error.message}`);
      return {
        deviceId,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Post('device/:deviceId/ota')
  @ApiOperation({ summary: 'Iniciar atualização OTA do firmware' })
  @ApiResponse({ status: 200, description: 'OTA iniciado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Erro na validação dos dados.' })
  @ApiResponse({ status: 404, description: 'Edge-Go não encontrado ou desconectado.' })
  async startOta(
    @Param('deviceId') deviceId: string,
    @Body() otaData: { 
      version: string; 
      firmware: string; // base64 encoded firmware
      checksum: string; 
    }
  ) {
    this.logger.log(`🔄 Iniciando OTA para Edge-Go: ${deviceId} -> ${otaData.version}`);
    
    try {
      // Validar dados
      if (!otaData.version || !otaData.firmware || !otaData.checksum) {
        return {
          success: false,
          error: 'Dados obrigatórios: version, firmware, checksum',
          deviceId,
          timestamp: new Date().toISOString()
        };
      }

      // Decodificar firmware base64
      const firmwareBuffer = Buffer.from(otaData.firmware, 'base64');
      
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
            'Fallback para MQTT bloqueado',
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
      port: 8081,
      path: '/edge-go-ws',
      description: 'WebSocket puro para Edge-Go (contorna firewall)',
      features: [
        'WebSocket puro (não Socket.IO)',
        'Porta 8080 dedicada',
        'Protocolo JSON simples',
        'Fallback para MQTT bloqueado',
        'Suporte a múltiplos dispositivos',
        'Heartbeat automático',
        'Reconexão automática',
        'Logs detalhados',
      ],
      endpoints: {
        websocket: 'ws://localhost:8081/edge-go-ws',
        stats: '/edge-go-ws/stats',
        deviceStatus: '/edge-go-ws/device/:deviceId/status',
        sendJob: '/edge-go-ws/device/:deviceId/print',
      },
    };
  }
}
