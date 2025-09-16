// services/websocketService.ts
import { io, Socket } from 'socket.io-client';

export interface AgentInfo {
  socketId: string;
  agentFingerprint: string;
  tenantId: string;
  connectedAt: string;
  lastSeen: string;
}

export interface PrintJobUpdate {
  jobId: string;
  status: 'received' | 'printing' | 'completed' | 'error';
  agentFingerprint: string;
  updatedAt: string;
  error?: string;
  printedAt?: string;
}

export interface PrinterStatusUpdate {
  printerId: string;
  status: 'online' | 'offline' | 'error' | 'testing' | 'printing';
  agentFingerprint: string;
  tenantId: string;
}

class GranoboxWebSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private apiKey: string | null = null;

  // Callbacks
  public onConnectionChange: ((connected: boolean) => void) | null = null;
  public onAgentConnected: ((data: AgentInfo) => void) | null = null;
  public onAgentDisconnected: ((data: AgentInfo) => void) | null = null;
  public onPrintJobUpdated: ((data: PrintJobUpdate) => void) | null = null;
  public onPrinterStatusUpdate: ((data: PrinterStatusUpdate) => void) | null = null;
  public onError: ((error: Error) => void) | null = null;

  /**
   * Conectar ao WebSocket
   * @param apiKey - API Key do Tagment (formato: tgm_...)
   */
  connect(apiKey: string): void {
    this.apiKey = apiKey;
    
    console.log('🔌 Conectando ao WebSocket Tagment...');
    
    this.socket = io('https://api.tagment.com.br/agents', {
      auth: { token: apiKey },
      query: { token: apiKey },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Conexão
    this.socket.on('connect', () => {
      console.log('🔗 WebSocket conectado ao Tagment');
      this.isConnected = true;
      this.onConnectionChange?.(true);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('🔌 WebSocket desconectado:', reason);
      this.isConnected = false;
      this.onConnectionChange?.(false);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ Erro de conexão WebSocket:', error);
      this.onError?.(error);
    });

    // Eventos de agents
    this.socket.on('agent-connected', (data: AgentInfo) => {
      console.log('✅ Agent conectado:', data);
      this.onAgentConnected?.(data);
    });

    this.socket.on('agent-disconnected', (data: AgentInfo) => {
      console.log('❌ Agent desconectado:', data);
      this.onAgentDisconnected?.(data);
    });

    // Eventos de jobs
    this.socket.on('print-job-updated', (data: PrintJobUpdate) => {
      console.log('📄 Status do job atualizado:', data);
      this.onPrintJobUpdated?.(data);
    });

    // Eventos de impressoras
    this.socket.on('printer-status-update', (data: PrinterStatusUpdate) => {
      console.log('🖨️ Status da impressora atualizado:', data);
      this.onPrinterStatusUpdate?.(data);
    });
  }

  /**
   * Desconectar WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Desconectando WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Verificar se está conectado
   */
  isWebSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Obter informações da conexão
   */
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null,
      hasApiKey: !!this.apiKey
    };
  }

  /**
   * Enviar job de impressão via WebSocket
   */
  sendPrintJob(jobData: {
    agentFingerprint: string;
    printerId: string;
    zplData: string;
    priority?: 'low' | 'normal' | 'high';
    metadata?: any;
  }): Promise<{ success: boolean, message: string, jobId?: string }> {
    return new Promise((resolve) => {
      if (!this.socket || !this.isConnected) {
        resolve({
          success: false,
          message: 'WebSocket não conectado'
        });
        return;
      }

      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('📤 Enviando job via WebSocket:', {
        jobId,
        agentFingerprint: jobData.agentFingerprint,
        printerId: jobData.printerId,
        priority: jobData.priority || 'normal'
      });

      // Enviar job via WebSocket (formato correto baseado na API do Tagment)
      const printJobPayload = {
        id: jobId,
        printerId: jobData.printerId,
        zplData: jobData.zplData,
        priority: jobData.priority || 'normal',
        createdAt: new Date().toISOString(),
        metadata: {
          ...jobData.metadata,
          agentFingerprint: jobData.agentFingerprint
        }
      };
      
      console.log('📤 Payload do job:', printJobPayload);
      this.socket.emit('print-job', printJobPayload);

      // Aguardar confirmação ou timeout
      const timeout = setTimeout(() => {
        resolve({
          success: true,
          message: 'Job enviado (timeout na confirmação)',
          jobId
        });
      }, 5000);

      // Escutar resposta do job (baseado na API real do Tagment)
      const jobResponseHandler = (response: any) => {
        console.log('📥 Resposta do job recebida:', response);
        if (response.jobId === jobId || response.id === jobId) {
          clearTimeout(timeout);
          this.socket?.off('print-job-updated', jobResponseHandler);
          
          resolve({
            success: response.status !== 'error',
            message: response.error || response.message || `Job ${response.status || 'processado'}`,
            jobId: response.jobId || response.id
          });
        }
      };

      // Escutar tanto print-job-updated quanto print-job-status
      this.socket.on('print-job-updated', jobResponseHandler);
      this.socket.on('print-job-status', jobResponseHandler);
    });
  }
}

export default new GranoboxWebSocketService();
