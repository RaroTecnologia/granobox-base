import { api } from './api';

export interface TagmentPrinter {
  id: string;
  displayName: string;
  status: 'online' | 'offline' | 'error';
  connection: {
    host: string;
    port: number;
    protocol: string;
  };
  capabilities: {
    dpi: number;
    maxWidthMm: number;
    maxHeightMm: number;
    supportsZPL: boolean;
    supportsCutter: boolean;
    supportsColor: boolean;
  };
  externalPrinterRef: string;
  printsToday: number;
  totalPrints: number;
  lastSeenAt: string;
  isPrintAgent: boolean;
}

export interface TagmentPrintJob {
  id: string;
  printerId: string;
  template: any;
  data?: any;
  variables?: any;
  zpl?: string; // Gerado pelo Tagment
  priority?: 'low' | 'normal' | 'high';
  status: 'pending' | 'printing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface TagmentAgentStatus {
  isConnected: boolean;
  agentFingerprint: string;
  lastHeartbeat: string;
  printers: TagmentPrinter[];
}

class TagmentService {
  private baseURL = 'https://api.tagment.com.br';
  private token: string | null = null;
  private agentFingerprint: string | null = null;
  private isAgentDetected: boolean = false;
  private detectionInterval: NodeJS.Timeout | null = null;

  // Configurar token de autenticação
  setToken(token: string) {
    this.token = token;
  }

  // Configurar fingerprint do agente
  setAgentFingerprint(fingerprint: string) {
    this.agentFingerprint = fingerprint;
  }

  // Verificar se o Tagment Agent está ativo via API
  async detectAgent(): Promise<boolean> {
    try {
      // Verificar se temos token configurado
      if (!this.token) {
        console.log('Tagment Agent: Nenhum token configurado');
        this.isAgentDetected = false;
        return false;
      }

      // Verificar health check da API Tagment
      const response = await this.request('/v1/health');
      
      this.isAgentDetected = response?.success || false;
      console.log('Tagment API health check:', response);
      
      return this.isAgentDetected;
    } catch (error) {
      console.log('Tagment API não acessível:', error.message);
      this.isAgentDetected = false;
    }
    
    return false;
  }

  // Verificar status do agente periodicamente
  startAgentDetection(intervalMs: number = 30000) {
    this.stopAgentDetection();
    
    this.detectionInterval = setInterval(async () => {
      try {
        await this.detectAgent();
      } catch (error) {
        console.log('Erro na verificação do agente:', error);
      }
    }, intervalMs);
  }

  // Parar verificação automática
  stopAgentDetection() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
  }

  // Verificar se o agente está detectado
  isAgentRunning(): boolean {
    return this.isAgentDetected;
  }

  // Obter status completo do sistema
  async getSystemStatus() {
    const hasToken = !!this.token;
    const apiAccessible = hasToken ? await this.detectAgent() : false;
    
    return {
      agentDetected: apiAccessible, // API acessível = agente funcionando
      hasToken,
      isReady: apiAccessible && hasToken,
      status: hasToken 
        ? (apiAccessible ? 'ready' : 'needs_agent')
        : 'needs_token'
    };
  }

  // Fazer requisição HTTP para API Tagment
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Debug: log da requisição (remover em produção)
    // console.log('🔍 Tagment Request:', { url, method: options.method || 'GET', hasToken: !!this.token });

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Verificar se há conteúdo na resposta
      const text = await response.text();
      if (!text) {
        return { success: true, message: 'Empty response' };
      }

      return JSON.parse(text);
    } catch (error) {
      console.error('Tagment API Request Error:', error);
      throw error;
    }
  }

  // Autenticação
  async validateApiKey(apiKey: string) {
    const oldToken = this.token;
    this.setToken(apiKey);
    
    try {
      const info = await this.request('/v1/auth/info');
      return info;
    } catch (error) {
      this.token = oldToken;
      throw error;
    }
  }

  async getUserInfo() {
    return await this.request('/v1/auth/info');
  }

  // Gerenciamento de impressoras
  async getPrintersByCustomer(customerId: string): Promise<TagmentPrinter[]> {
    console.log('🔍 TagmentService.getPrintersByCustomer: Buscando para customerId:', customerId);
    console.log('🔍 Token configurado:', this.token ? `${this.token.substring(0, 10)}...` : 'NENHUM');
    console.log('🔍 URL da API:', `${this.baseURL}/v1/printers/customer/${customerId}`);
    
    try {
      const result = await this.request(`/v1/printers/customer/${customerId}`);
      console.log('🔍 Resposta da API Tagment (por customer):', result);
      return result;
    } catch (error) {
      console.error('❌ Erro na busca de impressoras por customer:', error);
      throw error;
    }
  }

  // Buscar todas as impressoras (mesmo endpoint do control)
  async getAllPrinters(): Promise<TagmentPrinter[]> {
    console.log('🔍 TagmentService.getAllPrinters: Iniciando busca...');
    console.log('🔍 Token configurado:', this.token ? `${this.token.substring(0, 10)}...` : 'NENHUM');
    console.log('🔍 URL da API:', `${this.baseURL}/v1/printers`);
    
    try {
      const result = await this.request('/v1/printers');
      console.log('🔍 Resposta da API Tagment:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro na busca de impressoras Tagment:', error);
      throw error;
    }
  }

  async registerPrinter(printerData: any, agentFingerprint: string) {
    return await this.request('/v1/printers/register', {
      method: 'POST',
      body: JSON.stringify({
        ...printerData,
        agentFingerprint
      })
    });
  }

  async updatePrinterHeartbeat(externalCustomerId: string, externalPrinterRef: string, agentFingerprint: string) {
    return await this.request('/v1/printers/heartbeat', {
      method: 'POST',
      body: JSON.stringify({
        externalCustomerId,
        externalPrinterRef,
        agentFingerprint
      })
    });
  }

  async updatePrinterStatus(printerId: string, status: string, errorMessage?: string) {
    return await this.request(`/v1/printers/${printerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        errorMessage
      })
    });
  }

  async registerPrint(printerId: string) {
    return await this.request(`/v1/printers/${printerId}/print`, {
      method: 'POST'
    });
  }

  async getPrintStats(printerId: string) {
    return await this.request(`/v1/printers/${printerId}/stats`);
  }

  async testPrinterConnection(printerId: string) {
    return await this.request(`/v1/printers/${printerId}/test`, {
      method: 'POST'
    });
  }

  async deletePrinter(printerId: string) {
    return await this.request(`/v1/printers/${printerId}`, {
      method: 'DELETE'
    });
  }

  // Jobs de impressão - processar template e gerar ZPL
  async createPrintJob(templateId: string, data: any, printerId?: string, priority: 'low' | 'normal' | 'high' = 'normal'): Promise<TagmentPrintJob> {
    const payload: any = {
      template: templateId,
      data
    };

    // Processar template e gerar ZPL
    const result = await this.request('/v1/templates/process', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    // Retornar no formato esperado
    return {
      id: `job_${Date.now()}`,
      printerId: printerId || '',
      template: templateId,
      data,
      zpl: result.zpl,
      priority,
      status: 'completed',
      createdAt: new Date().toISOString()
    };
  }

  // Métodos de jobs não disponíveis na API atual do Tagment
  // A API apenas processa templates e retorna ZPL
  async getPrintJobStatus(jobId: string): Promise<TagmentPrintJob | null> {
    console.log('⚠️ getPrintJobStatus não implementado na API Tagment');
    return null;
  }

  async getPrintJobs(printerId?: string, status?: string): Promise<TagmentPrintJob[]> {
    console.log('⚠️ getPrintJobs não implementado na API Tagment');
    return [];
  }

  // Status do agente - verificar se há agents conectados via WebSocket
  async getAgentStatus(): Promise<TagmentAgentStatus> {
    try {
      // Verificar se há agents conectados
      const agents = await this.request('/agents/connected');
      return {
        isConnected: agents.length > 0,
        connectedAgents: agents.length,
        lastSeen: new Date().toISOString()
      };
    } catch (error) {
      return {
        isConnected: false,
        connectedAgents: 0,
        lastSeen: null
      };
    }
  }

  // Novos endpoints WebSocket
  async getConnectedAgents(): Promise<{ agents: string[], agentsInfo: any[] }> {
    return await this.request('/agents/connected');
  }

  async sendTestJob(agentFingerprint: string): Promise<{ success: boolean, message: string }> {
    return await this.request(`/agents/test-print/${agentFingerprint}`, {
      method: 'POST'
    });
  }

  // Método para enviar job de teste via endpoint específico
  async sendCustomPrintJob(agentFingerprint: string, jobData: {
    printerId: string;
    zplData: string;
    priority?: 'low' | 'normal' | 'high';
    metadata?: any;
  }): Promise<{ success: boolean, message: string, jobId?: string }> {
    console.log('📤 Enviando job de teste via endpoint específico para agente:', agentFingerprint);
    
    try {
      // Usar o endpoint de teste que já funciona
      const response = await this.request(`/agents/test-print/${agentFingerprint}`, {
        method: 'POST'
      });

      console.log('✅ Job de teste enviado:', response);

      return {
        success: response.success || true,
        message: response.message || 'Job de teste enviado com sucesso',
        jobId: `test_${Date.now()}`
      };

    } catch (error: any) {
      console.error('❌ Erro ao enviar job de teste:', error);
      return {
        success: false,
        message: error.message || 'Erro ao enviar job de teste',
        jobId: undefined
      };
    }
  }

  // Gerar fingerprint do agente
  generateAgentFingerprint(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const userAgent = navigator.userAgent || 'web-agent';
    
    const hash = btoa(`${userAgent}-${timestamp}-${random}`).substring(0, 16);
    return `web_agent_${hash}`;
  }

  // Criar payload de impressora
  createPrinterPayload(localConfig: any, externalCustomerId: string, externalPrinterRef?: string) {
    return {
      externalCustomerId,
      externalPrinterRef: externalPrinterRef || `web_agent_${Date.now()}`,
      displayName: localConfig.name || 'Impressora Web',
      tags: localConfig.tags || ['web', 'agent'],
      connection: {
        host: localConfig.host || 'localhost',
        port: localConfig.port || 9100,
        protocol: localConfig.protocol || 'zpl',
        timeout: localConfig.timeout || 30000
      },
      capabilities: {
        dpi: localConfig.dpi || 203,
        maxWidthMm: localConfig.maxWidthMm || 104,
        maxHeightMm: localConfig.maxHeightMm || 150,
        supportsZPL: true,
        supportsCutter: localConfig.supportsCutter || false,
        supportsColor: localConfig.supportsColor || false
      },
      isPrintAgent: true,
      printAgentSettings: {
        autoConnect: localConfig.autoConnect !== false,
        debugMode: localConfig.debugMode || false,
        allowRemotePrinting: localConfig.allowRemotePrinting !== false,
        maxConcurrentJobs: localConfig.maxConcurrentJobs || 5
      }
    };
  }

  // Logout
  logout() {
    this.token = null;
    this.agentFingerprint = null;
  }
}

export const tagmentService = new TagmentService();
