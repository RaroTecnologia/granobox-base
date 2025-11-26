import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { WebSocketServer } from 'ws';
import { PrintJobsService } from '../edge/services/print-jobs.service';
import { PrintJobStatus } from '../edge/entities/print-job.entity';
import { DevicesService } from '../devices/devices.service';
import { FirmwareService } from '../firmware/firmware.service';

interface EdgeGoMessage {
  type: 'register' | 'heartbeat' | 'print_ack' | 'ping' | 'pong' | 'printer_status' | 
        'version_info' | 'ota_ready' | 'ota_chunk_ack' | 'ota_success' | 'ota_error';
  deviceId?: string;
  clientId?: string;
  data?: any;
  timestamp?: string;
  requestId?: string;
  status?: string;
  details?: any;
  // OTA specific fields
  current_version?: string;
  compile_date?: string;
  compile_time?: string;
  idf_version?: string;
  chip_model?: string;
  chip_cores?: number;
  chip_revision?: number;
  running_partition?: string;
  sequence?: number;
  bytes_received?: number;
  progress?: number;
  message?: string;
}

interface EdgeGoConnection {
  ws: any;
  deviceId: string;
  clientId: string;
  connectedAt: Date;
  lastSeen: Date;
  registered: boolean;
}

interface OtaSession {
  deviceId: string;
  firmwareBuffer: Buffer;
  totalSize: number;
  chunkSize: number;
  currentChunk: number;
  totalChunks: number;
  version: string;
  checksum: string;
  startTime: Date;
  onProgress?: (progress: number) => void;
  onComplete?: (success: boolean, error?: string) => void;
}

@Injectable()
export class EdgeGoWebSocketGateway implements OnModuleInit, OnModuleDestroy {
  private server: WebSocketServer;

  private readonly logger = new Logger(EdgeGoWebSocketGateway.name);
  private connectedDevices = new Map<string, EdgeGoConnection>();
  private devicesByFingerprint = new Map<string, string>(); // deviceId -> connectionId
  private pendingPings = new Map<string, (response: any) => void>(); // requestId -> callback
  private pendingVersionChecks = new Map<string, (response: any) => void>(); // deviceId -> callback
  private activeOtaSessions = new Map<string, OtaSession>(); // deviceId -> OTA session

  constructor(
    private readonly printJobsService: PrintJobsService,
    private readonly devicesService: DevicesService,
    private readonly firmwareService: FirmwareService,
  ) {}

  onModuleInit() {
    this.startWebSocketServer();
  }

  onModuleDestroy() {
    if (this.server) {
      this.server.close();
    }
  }

  private startWebSocketServer() {
    this.server = new WebSocketServer({ 
      port: 8081,
      path: '/edge-go-ws'
    });

    this.logger.log('🚀 Edge-Go WebSocket Gateway inicializado na porta 8081');
    this.logger.log('📡 Path: /edge-go-ws (porta 8081)');
    this.logger.log('🔧 Protocolo: WebSocket puro (não Socket.IO)');

    this.server.on('connection', (ws) => {
      this.handleConnection(ws);
    });

    this.server.on('error', (error) => {
      this.logger.error(`❌ Erro no servidor WebSocket: ${error.message}`);
    });
  }

  private handleConnection(client: any) {
    const connectionId = this.generateConnectionId();
    client.connectionId = connectionId;
    
    this.logger.log(`🔌 Edge-Go conectado: ${connectionId}`);
    
    // Configurar handlers de mensagem
    client.on('message', (data: Buffer) => {
      try {
        const message = data.toString();
        this.handleMessage(client, message);
      } catch (error) {
        this.logger.error(`❌ Erro ao processar mensagem: ${error.message}`);
      }
    });

    client.on('error', (error: Error) => {
      this.logger.error(`❌ Erro WebSocket ${connectionId}: ${error.message}`);
    });

    client.on('close', () => {
      this.handleDisconnect(client);
    });

    // Timeout para registro (30 segundos)
    setTimeout(() => {
      const connection = this.connectedDevices.get(connectionId);
      if (connection && !connection.registered) {
        this.logger.warn(`⏰ Timeout de registro para ${connectionId}, desconectando`);
        client.close();
      }
    }, 30000);
  }

  private handleDisconnect(client: any) {
    const connectionId = client.connectionId;
    const connection = this.connectedDevices.get(connectionId);
    
    if (connection) {
      this.logger.log(`🔌 Edge-Go desconectado: ${connection.deviceId} (${connectionId})`);
      this.devicesByFingerprint.delete(connection.deviceId);
      this.connectedDevices.delete(connectionId);
    } else {
      this.logger.log(`🔌 Conexão desconectada: ${connectionId}`);
    }
  }

  private handleMessage(client: any, message: string) {
    try {
      const msg: EdgeGoMessage = JSON.parse(message);
      const connectionId = client.connectionId;
      
      this.logger.debug(`📨 Mensagem de ${connectionId}: ${msg.type}`);
      
      switch (msg.type) {
        case 'register':
          this.handleRegister(client, msg);
          break;
        case 'heartbeat':
          this.handleHeartbeat(client, msg);
          break;
        case 'print_ack':
          this.handlePrintAck(client, msg);
          break;
        case 'ping':
          this.handlePing(client, msg);
          break;
        case 'printer_status':
          this.handlePrinterStatus(client, msg);
          break;
        case 'version_info':
          this.handleVersionInfo(client, msg);
          break;
        case 'ota_ready':
          this.handleOtaReady(client, msg);
          break;
        case 'ota_chunk_ack':
          this.handleOtaChunkAck(client, msg);
          break;
        case 'ota_success':
          this.handleOtaSuccess(client, msg);
          break;
        case 'ota_error':
          this.handleOtaError(client, msg);
          break;
        default:
          this.logger.warn(`❓ Tipo de mensagem desconhecido: ${msg.type}`);
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao processar mensagem JSON: ${error.message}`);
      this.sendError(client, 'invalid_json', 'Formato JSON inválido');
    }
  }

  private handleRegister(client: any, msg: EdgeGoMessage) {
    const { deviceId, clientId, data } = msg;
    const connectionId = client.connectionId;
    
    this.logger.debug(`🔍 Dados recebidos no register:`, {
      deviceId,
      clientId,
      data,
      fullMessage: JSON.stringify(msg)
    });
    
    if (!deviceId || !clientId) {
      this.logger.error(`❌ Campos obrigatórios ausentes - deviceId: ${deviceId}, clientId: ${clientId}`);
      this.sendError(client, 'missing_fields', 'deviceId e clientId são obrigatórios');
      return;
    }

    // Verificar se já existe uma conexão para este dispositivo
    const existingConnectionId = this.devicesByFingerprint.get(deviceId);
    if (existingConnectionId && existingConnectionId !== connectionId) {
      const existingConnection = this.connectedDevices.get(existingConnectionId);
      if (existingConnection) {
        this.logger.log(`🔄 Desconectando sessão anterior de ${deviceId}`);
        this.sendToClient(existingConnection.ws, {
          type: 'duplicate_connection',
          message: 'Nova conexão detectada. Desconectando sessão anterior.',
        });
        existingConnection.ws.close();
      }
    }

    // Registrar nova conexão
    const connection: EdgeGoConnection = {
      ws: client,
      deviceId,
      clientId,
      connectedAt: new Date(),
      lastSeen: new Date(),
      registered: true,
    };

    this.connectedDevices.set(connectionId, connection);
    this.devicesByFingerprint.set(deviceId, connectionId);

    // Confirmar registro
    this.sendToClient(client, {
      type: 'register_ack',
      deviceId,
      status: 'success',
      timestamp: new Date().toISOString(),
      serverInfo: {
        version: '1.0.0',
        protocol: 'websocket-pure',
      },
    });

    this.logger.log(`✅ Edge-Go registrado: ${deviceId} (${connectionId})`);
    this.logger.log(`📊 Dispositivos conectados: ${this.connectedDevices.size}`);
  }

  private async handleHeartbeat(client: any, msg: EdgeGoMessage) {
    const connectionId = client.connectionId;
    const connection = this.connectedDevices.get(connectionId);
    
    if (!connection) {
      this.sendError(client, 'not_registered', 'Dispositivo não registrado');
      return;
    }

    connection.lastSeen = new Date();
    
    this.logger.debug(`💓 Heartbeat de ${connection.deviceId}: ${JSON.stringify(msg.data)}`);
    
    // Responder heartbeat
    this.sendToClient(client, {
      type: 'heartbeat_ack',
      timestamp: new Date().toISOString(),
      serverTime: Date.now(),
    });

    // Salvar heartbeat no banco de dados (buscar clientId real do dispositivo)
    await this.saveHeartbeatMetrics(connection.deviceId, msg.data);
  }

  private async handlePrintAck(client: any, msg: EdgeGoMessage) {
    const connectionId = client.connectionId;
    const connection = this.connectedDevices.get(connectionId);
    
    if (!connection) {
      this.sendError(client, 'not_registered', 'Dispositivo não registrado');
      return;
    }

    const { jobId, status, error } = msg.data || {};
    
    if (!jobId) {
      this.sendError(client, 'missing_job_id', 'jobId é obrigatório');
      return;
    }

    this.logger.log(`✅ Print ACK de ${connection.deviceId}: Job ${jobId} - ${status}`);

    try {
      // Atualizar status do job no banco
      let jobStatus: PrintJobStatus;
      switch (status) {
        case 'success':
          jobStatus = PrintJobStatus.SUCCESS;
          break;
        case 'error':
          jobStatus = PrintJobStatus.ERROR;
          break;
        case 'processing':
          jobStatus = PrintJobStatus.PROCESSING;
          break;
        default:
          jobStatus = PrintJobStatus.ERROR;
      }

      await this.printJobsService.updateJobStatus(jobId, jobStatus, error);
      
      // Confirmar recebimento do ACK
      this.sendToClient(client, {
        type: 'print_ack_received',
        jobId,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar status do job ${jobId}: ${error.message}`);
      this.sendError(client, 'job_update_failed', 'Erro ao atualizar status do job');
    }
  }

  private handlePing(client: any, msg: EdgeGoMessage) {
    const connectionId = client.connectionId;
    const connection = this.connectedDevices.get(connectionId);
    
    if (connection) {
      connection.lastSeen = new Date();
    }
    
    // Responder pong
    this.sendToClient(client, {
      type: 'pong',
      timestamp: new Date().toISOString(),
    });
    
    this.logger.debug(`🏓 Ping/Pong com ${connection?.deviceId || connectionId}`);
  }

  private handlePrinterStatus(client: any, msg: any) {
    const connectionId = client.connectionId;
    const connection = this.connectedDevices.get(connectionId);
    
    if (!connection) {
      this.logger.warn(`❌ Conexão ${connectionId} não encontrada para printer_status`);
      return;
    }

    const { requestId, status, details } = msg;
    
    if (!requestId) {
      this.logger.warn(`❌ printer_status sem requestId de ${connection.deviceId}`);
      return;
    }

    this.logger.log(`📍 Status da impressora recebido de ${connection.deviceId}: ${status} (${requestId})`);
    
    // Buscar callback pendente
    const callback = this.pendingPings.get(requestId);
    if (callback) {
      this.pendingPings.delete(requestId);
      
      // Chamar callback com a resposta
      callback({
        status,
        details,
        deviceId: connection.deviceId
      });
    } else {
      this.logger.warn(`❌ Callback não encontrado para requestId: ${requestId}`);
    }
  }

  private async handleVersionInfo(client: any, msg: EdgeGoMessage) {
    const connectionId = client.connectionId;
    const connection = this.connectedDevices.get(connectionId);
    
    if (!connection) {
      this.logger.warn(`❌ Conexão ${connectionId} não encontrada para version_info`);
      return;
    }

    this.logger.log(`📋 Informações de versão recebidas de ${connection.deviceId}:`);
    this.logger.log(`   - Versão atual: ${msg.current_version}`);
    this.logger.log(`   - Chip: ${msg.chip_model} (${msg.chip_cores} cores, rev ${msg.chip_revision})`);
    this.logger.log(`   - Partição: ${msg.running_partition}`);
    this.logger.log(`   - IDF: ${msg.idf_version}`);
    this.logger.log(`   - Compilado: ${msg.compile_date} ${msg.compile_time}`);

    // 🆕 SALVAR VERSÃO NO BANCO DE DADOS
    try {
      await this.firmwareService.updateDeviceVersion(
        connection.deviceId,
        connection.clientId,
        {
          currentVersion: msg.current_version || '0.0.0',
          compileDate: msg.compile_date,
          compileTime: msg.compile_time,
          idfVersion: msg.idf_version,
          chipModel: msg.chip_model,
          chipCores: msg.chip_cores,
          chipRevision: msg.chip_revision,
          runningPartition: msg.running_partition,
          metadata: {
            lastReported: new Date().toISOString(),
            reportedVia: 'websocket'
          }
        }
      );
      this.logger.log(`✅ Versão do dispositivo ${connection.deviceId} salva no banco`);

      // 🔍 VERIFICAR SE PRECISA DE ATUALIZAÇÃO
      try {
        const updateCheck = await this.firmwareService.checkForUpdates(connection.deviceId);
        if (updateCheck.needsUpdate) {
          this.logger.log(`🔄 Dispositivo ${connection.deviceId} precisa de atualização: ${updateCheck.currentVersion} -> ${updateCheck.latestVersion}`);
          
          // Opcional: Notificar o dispositivo sobre atualização disponível
          // this.sendToClient(client, {
          //   type: 'update_available',
          //   latestVersion: updateCheck.latestVersion,
          //   currentVersion: updateCheck.currentVersion
          // });
        } else {
          this.logger.log(`✅ Dispositivo ${connection.deviceId} está atualizado (v${updateCheck.currentVersion})`);
        }
      } catch (updateError) {
        this.logger.warn(`⚠️ Erro ao verificar atualizações para ${connection.deviceId}: ${updateError.message}`);
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao salvar versão do dispositivo ${connection.deviceId}: ${error.message}`);
    }

    // Buscar callback pendente
    const callback = this.pendingVersionChecks.get(connection.deviceId);
    if (callback) {
      this.pendingVersionChecks.delete(connection.deviceId);
      callback({
        current_version: msg.current_version,
        compile_date: msg.compile_date,
        compile_time: msg.compile_time,
        idf_version: msg.idf_version,
        chip_model: msg.chip_model,
        chip_cores: msg.chip_cores,
        chip_revision: msg.chip_revision,
        running_partition: msg.running_partition
      });
    }
  }

  private handleOtaReady(client: any, msg: EdgeGoMessage) {
    const connectionId = client.connectionId;
    const connection = this.connectedDevices.get(connectionId);
    
    if (!connection) {
      this.logger.warn(`❌ Conexão ${connectionId} não encontrada para ota_ready`);
      return;
    }

    this.logger.log(`✅ Edge-Go ${connection.deviceId} pronto para receber OTA`);
    
    // Iniciar envio de chunks
    const otaSession = this.activeOtaSessions.get(connection.deviceId);
    if (otaSession) {
      this.startOtaChunkTransfer(connection.deviceId);
    }
  }

  private handleOtaChunkAck(client: any, msg: EdgeGoMessage) {
    const connectionId = client.connectionId;
    const connection = this.connectedDevices.get(connectionId);
    
    if (!connection) {
      this.logger.warn(`❌ Conexão ${connectionId} não encontrada para ota_chunk_ack`);
      return;
    }

    const otaSession = this.activeOtaSessions.get(connection.deviceId);
    if (!otaSession) {
      this.logger.warn(`❌ Sessão OTA não encontrada para ${connection.deviceId}`);
      return;
    }

    this.logger.debug(`📦 Chunk ${msg.sequence} confirmado (${msg.progress}%)`);
    
    // Callback de progresso
    if (otaSession.onProgress) {
      otaSession.onProgress(msg.progress || 0);
    }

    // Enviar próximo chunk
    if (otaSession.currentChunk < otaSession.totalChunks) {
      setTimeout(() => this.sendNextOtaChunk(connection.deviceId), 100); // 100ms delay
    } else {
      // Todos os chunks enviados, finalizar OTA
      this.finishOta(connection.deviceId);
    }
  }

  private handleOtaSuccess(client: any, msg: EdgeGoMessage) {
    const connectionId = client.connectionId;
    const connection = this.connectedDevices.get(connectionId);
    
    if (!connection) {
      return;
    }

    this.logger.log(`🎉 OTA concluído com sucesso para ${connection.deviceId}`);
    
    const otaSession = this.activeOtaSessions.get(connection.deviceId);
    if (otaSession && otaSession.onComplete) {
      otaSession.onComplete(true);
    }
    
    this.activeOtaSessions.delete(connection.deviceId);
  }

  private handleOtaError(client: any, msg: EdgeGoMessage) {
    const connectionId = client.connectionId;
    const connection = this.connectedDevices.get(connectionId);
    
    if (!connection) {
      return;
    }

    this.logger.error(`❌ Erro no OTA para ${connection.deviceId}: ${msg.message}`);
    
    const otaSession = this.activeOtaSessions.get(connection.deviceId);
    if (otaSession && otaSession.onComplete) {
      otaSession.onComplete(false, msg.message);
    }
    
    this.activeOtaSessions.delete(connection.deviceId);
  }

  // Método público para enviar job de impressão
  async sendPrintJob(deviceId: string, printJob: any): Promise<boolean> {
    this.logger.debug(`🔍 [DEBUG] Tentando enviar job para deviceId: ${deviceId}`);
    this.logger.debug(`🔍 [DEBUG] Devices conectados: ${Array.from(this.devicesByFingerprint.keys()).join(', ')}`);
    
    const connectionId = this.devicesByFingerprint.get(deviceId);
    
    if (!connectionId) {
      this.logger.warn(`❌ Device ${deviceId} não conectado via WebSocket`);
      this.logger.warn(`❌ Devices disponíveis: ${Array.from(this.devicesByFingerprint.keys()).join(', ')}`);
      return false;
    }

    const connection = this.connectedDevices.get(connectionId);
    if (!connection) {
      this.logger.warn(`❌ Conexão ${connectionId} não encontrada`);
      return false;
    }

    try {
      this.sendToClient(connection.ws, {
        type: 'print_job',
        data: printJob,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`📤 Job de impressão enviado para ${deviceId}: ${printJob.jobId}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar job para ${deviceId}: ${error.message}`);
      return false;
    }
  }

  // Método para verificar status da impressora antes de imprimir
  async pingPrinter(deviceId: string, timeoutMs: number = 10000): Promise<{
    status: 'ready' | 'busy' | 'offline' | 'error';
    details?: any;
    error?: string;
  }> {
    const connectionId = this.devicesByFingerprint.get(deviceId);
    
    if (!connectionId) {
      return {
        status: 'offline',
        error: 'Edge-Go não conectado via WebSocket'
      };
    }

    const connection = this.connectedDevices.get(connectionId);
    if (!connection) {
      return {
        status: 'offline', 
        error: 'Conexão WebSocket não encontrada'
      };
    }

    const requestId = `ping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise((resolve) => {
      // Configurar timeout
      const timeout = setTimeout(() => {
        this.pendingPings.delete(requestId);
        resolve({
          status: 'error',
          error: 'Timeout - Edge-Go não respondeu ao ping da impressora'
        });
      }, timeoutMs);

      // Armazenar callback para quando a resposta chegar
      this.pendingPings.set(requestId, (response) => {
        clearTimeout(timeout);
        resolve(response);
      });

      // Enviar ping
      try {
        this.sendToClient(connection.ws, {
          type: 'ping_printer',
          requestId,
          timestamp: new Date().toISOString()
        });

        this.logger.log(`📍 Ping da impressora enviado para ${deviceId} (${requestId})`);
      } catch (error) {
        clearTimeout(timeout);
        this.pendingPings.delete(requestId);
        resolve({
          status: 'error',
          error: `Erro ao enviar ping: ${error.message}`
        });
      }
    });
  }

  // Método público para verificar se dispositivo está conectado
  isDeviceConnected(deviceId: string): boolean {
    const connectionId = this.devicesByFingerprint.get(deviceId);
    return connectionId ? this.connectedDevices.has(connectionId) : false;
  }

  // === MÉTODOS OTA (Over-The-Air) ===

  // Método para verificar versão do firmware
  async checkFirmwareVersion(deviceId: string, timeoutMs: number = 10000): Promise<any> {
    const connectionId = this.devicesByFingerprint.get(deviceId);
    
    if (!connectionId) {
      return {
        error: 'Edge-Go não conectado via WebSocket'
      };
    }

    const connection = this.connectedDevices.get(connectionId);
    if (!connection) {
      return {
        error: 'Conexão WebSocket não encontrada'
      };
    }

    return new Promise((resolve) => {
      // Configurar timeout
      const timeout = setTimeout(() => {
        this.pendingVersionChecks.delete(deviceId);
        resolve({
          error: 'Timeout - Edge-Go não respondeu à verificação de versão'
        });
      }, timeoutMs);

      // Armazenar callback para quando a resposta chegar
      this.pendingVersionChecks.set(deviceId, (response) => {
        clearTimeout(timeout);
        resolve(response);
      });

      // Enviar comando de verificação de versão
      try {
        this.sendToClient(connection.ws, {
          type: 'version_check',
          timestamp: new Date().toISOString()
        });

        this.logger.log(`📋 Verificação de versão enviada para ${deviceId}`);
      } catch (error) {
        clearTimeout(timeout);
        this.pendingVersionChecks.delete(deviceId);
        resolve({
          error: `Erro ao enviar verificação de versão: ${error.message}`
        });
      }
    });
  }

  // Método para iniciar OTA
  async startOta(
    deviceId: string, 
    firmwareBuffer: Buffer, 
    version: string, 
    checksum: string,
    onProgress?: (progress: number) => void,
    onComplete?: (success: boolean, error?: string) => void
  ): Promise<{ success: boolean; error?: string }> {
    const connectionId = this.devicesByFingerprint.get(deviceId);
    
    if (!connectionId) {
      return {
        success: false,
        error: 'Edge-Go não conectado via WebSocket'
      };
    }

    const connection = this.connectedDevices.get(connectionId);
    if (!connection) {
      return {
        success: false,
        error: 'Conexão WebSocket não encontrada'
      };
    }

    // Verificar se já há uma sessão OTA ativa
    if (this.activeOtaSessions.has(deviceId)) {
      return {
        success: false,
        error: 'OTA já está em progresso para este dispositivo'
      };
    }

    const chunkSize = 4096; // 4KB por chunk
    const totalChunks = Math.ceil(firmwareBuffer.length / chunkSize);

    // Criar sessão OTA
    const otaSession: OtaSession = {
      deviceId,
      firmwareBuffer,
      totalSize: firmwareBuffer.length,
      chunkSize,
      currentChunk: 0,
      totalChunks,
      version,
      checksum,
      startTime: new Date(),
      onProgress,
      onComplete
    };

    this.activeOtaSessions.set(deviceId, otaSession);

    try {
      // Enviar comando de início de OTA
      this.sendToClient(connection.ws, {
        type: 'ota_start',
        version,
        size: firmwareBuffer.length,
        checksum,
        timestamp: new Date().toISOString()
      });

      this.logger.log(`🔄 OTA iniciado para ${deviceId}: ${version} (${firmwareBuffer.length} bytes, ${totalChunks} chunks)`);
      
      return { success: true };
    } catch (error) {
      this.activeOtaSessions.delete(deviceId);
      return {
        success: false,
        error: `Erro ao iniciar OTA: ${error.message}`
      };
    }
  }

  private startOtaChunkTransfer(deviceId: string) {
    const otaSession = this.activeOtaSessions.get(deviceId);
    if (!otaSession) {
      return;
    }

    this.logger.log(`📦 Iniciando transferência de chunks para ${deviceId}`);
    this.sendNextOtaChunk(deviceId);
  }

  private sendNextOtaChunk(deviceId: string) {
    const otaSession = this.activeOtaSessions.get(deviceId);
    if (!otaSession) {
      return;
    }

    const connectionId = this.devicesByFingerprint.get(deviceId);
    const connection = connectionId ? this.connectedDevices.get(connectionId) : null;
    
    if (!connection) {
      this.logger.error(`❌ Conexão perdida durante OTA para ${deviceId}`);
      this.activeOtaSessions.delete(deviceId);
      return;
    }

    const startOffset = otaSession.currentChunk * otaSession.chunkSize;
    const endOffset = Math.min(startOffset + otaSession.chunkSize, otaSession.totalSize);
    const chunkData = otaSession.firmwareBuffer.subarray(startOffset, endOffset);
    const base64Data = chunkData.toString('base64');

    try {
      this.sendToClient(connection.ws, {
        type: 'ota_chunk',
        sequence: otaSession.currentChunk,
        data: base64Data,
        timestamp: new Date().toISOString()
      });

      otaSession.currentChunk++;
      
      this.logger.debug(`📤 Chunk ${otaSession.currentChunk}/${otaSession.totalChunks} enviado (${chunkData.length} bytes)`);
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar chunk ${otaSession.currentChunk}: ${error.message}`);
      this.activeOtaSessions.delete(deviceId);
      
      if (otaSession.onComplete) {
        otaSession.onComplete(false, `Erro ao enviar chunk: ${error.message}`);
      }
    }
  }

  private finishOta(deviceId: string) {
    const otaSession = this.activeOtaSessions.get(deviceId);
    if (!otaSession) {
      return;
    }

    const connectionId = this.devicesByFingerprint.get(deviceId);
    const connection = connectionId ? this.connectedDevices.get(connectionId) : null;
    
    if (!connection) {
      this.logger.error(`❌ Conexão perdida durante finalização OTA para ${deviceId}`);
      this.activeOtaSessions.delete(deviceId);
      return;
    }

    try {
      this.sendToClient(connection.ws, {
        type: 'ota_finish',
        timestamp: new Date().toISOString()
      });

      this.logger.log(`✅ Comando de finalização OTA enviado para ${deviceId}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao finalizar OTA para ${deviceId}: ${error.message}`);
      this.activeOtaSessions.delete(deviceId);
      
      if (otaSession.onComplete) {
        otaSession.onComplete(false, `Erro ao finalizar OTA: ${error.message}`);
      }
    }
  }

  // Método para cancelar OTA
  async cancelOta(deviceId: string): Promise<{ success: boolean; error?: string }> {
    const otaSession = this.activeOtaSessions.get(deviceId);
    if (!otaSession) {
      return {
        success: false,
        error: 'Nenhuma sessão OTA ativa para este dispositivo'
      };
    }

    this.activeOtaSessions.delete(deviceId);
    
    if (otaSession.onComplete) {
      otaSession.onComplete(false, 'OTA cancelado pelo usuário');
    }

    this.logger.log(`⚠️ OTA cancelado para ${deviceId}`);
    
    return { success: true };
  }

  // Método público para obter estatísticas
  getStats() {
    const connections = Array.from(this.connectedDevices.values());
    
    return {
      totalConnections: connections.length,
      registeredDevices: connections.filter(c => c.registered).length,
      devices: connections.map(c => ({
        deviceId: c.deviceId,
        clientId: c.clientId,
        connectedAt: c.connectedAt,
        lastSeen: c.lastSeen,
        registered: c.registered,
      })),
    };
  }

  private sendToClient(client: any, message: any) {
    try {
      if (client.readyState === 1) { // WebSocket.OPEN
        const jsonMessage = JSON.stringify(message);
        client.send(jsonMessage);
        this.logger.debug(`📤 Enviado: ${message.type}`);
      } else {
        this.logger.warn(`❌ WebSocket não está aberto (readyState: ${client.readyState})`);
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao enviar mensagem: ${error.message}`);
    }
  }

  private sendError(client: any, code: string, message: string) {
    this.sendToClient(client, {
      type: 'error',
      error: {
        code,
        message,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private generateConnectionId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Salvar métricas de heartbeat no banco de dados
   */
  private async saveHeartbeatMetrics(deviceId: string, data: any) {
    try {
      // Buscar o dispositivo no banco para obter o clientId real
      const device = await this.devicesService.findByDeviceId(deviceId);
      if (!device) {
        this.logger.warn(`⚠️ Dispositivo ${deviceId} não encontrado no banco - heartbeat não salvo`);
        return;
      }

      // Extrair dados do heartbeat
      const heartbeatData = {
        timestamp: new Date(),
        status: 'online',
        ipAddress: data?.ip || null,
        memoryUsage: data?.freeHeap ? Math.round((1 - data.freeHeap / (8 * 1024 * 1024)) * 100) : null, // % usado
        uptimeSeconds: data?.uptime || null,
        metadata: {
          freeHeap: data?.freeHeap,
          version: data?.version,
          platform: data?.platform,
          rssi: data?.rssi,
          ...data
        }
      };

      await this.devicesService.saveHeartbeat(deviceId, device.clientId, heartbeatData);
      
      this.logger.debug(`💾 Heartbeat salvo: ${deviceId} (cliente: ${device.clientId})`);
    } catch (error) {
      this.logger.error(`❌ Erro ao salvar heartbeat de ${deviceId}: ${error.message}`);
    }
  }
}
