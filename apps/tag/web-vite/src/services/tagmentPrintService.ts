import { api } from './api';

export interface TagmentPrintRequest {
  templateId: string;
  data: Record<string, any>;
  printerId?: string;
}

export interface TagmentPrintResponse {
  success: boolean;
  message: string;
  jobId?: string;
  printResult?: {
    success: boolean;
    message: string;
  };
}

class TagmentPrintService {
  private baseURL = 'https://api.tagment.com.br';
  
  // Método para configurar API Key temporariamente (para teste)
  setTemporaryConfig(clientId: string, apiKey: string, customerId: string) {
    const config = {
      apiKey,
      customerId,
      isActive: true,
      configuredAt: new Date().toISOString()
    };
    
    localStorage.setItem(`tagment_config_${clientId}`, JSON.stringify(config));
    console.log('Configuração Tagment temporária salva:', { clientId, customerId, apiKey: `${apiKey.substring(0, 10)}...` });
  }

  // Obter configuração Tagment do cliente
  private async getClientTagmentConfig(clientId: string): Promise<{ 
    apiKey: string; 
    customerId: string; 
    sif?: string; 
    brand?: string 
  } | null> {
    try {
      // Buscar configuração diretamente do cliente
      const response = await api.get(`/clients/${clientId}`);
      const client = response.data;
      
      if (client.tagmentApiKey) {
        return {
          apiKey: client.tagmentApiKey,
          customerId: client.tagmentCustomerId || `gbx_${client.businessName?.toLowerCase().replace(/\s+/g, '_') || 'client'}`,
          sif: client.tagmentSif,
          brand: client.tagmentBrand
        };
      }
      
      console.log('Cliente não possui configuração Tagment');
      return null;
    } catch (error) {
      console.log('Erro ao buscar cliente, tentando localStorage...');
      
      // Fallback: buscar do localStorage (configuração feita no apps/control)
      const savedConfig = localStorage.getItem(`tagment_config_${clientId}`);
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          return {
            apiKey: config.apiKey,
            customerId: config.customerId,
            sif: config.sif,
            brand: config.brand
          };
        } catch (parseError) {
          console.error('Erro ao parsear configuração do localStorage:', parseError);
        }
      }
      
      console.error('Nenhuma configuração Tagment encontrada');
      return null;
    }
  }

  // Obter impressoras disponíveis para o cliente
  async getAvailablePrinters(clientId: string): Promise<any[]> {
    const config = await this.getClientTagmentConfig(clientId);
    
    if (!config?.apiKey) {
      throw new Error('Configuração Tagment não encontrada para este cliente');
    }

    try {
      const response = await fetch(`${this.baseURL}/v1/printers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const printers = await response.json();
      console.log(`📋 TagmentPrintService: Encontradas ${printers.length} impressoras`);
      return printers;
    } catch (error) {
      console.error('Erro ao listar impressoras:', error);
      throw error;
    }
  }

  // Obter templates disponíveis para o cliente
  async getAvailableTemplates(clientId: string): Promise<any[]> {
    const config = await this.getClientTagmentConfig(clientId);
    
    if (!config?.apiKey) {
      throw new Error('Configuração Tagment não encontrada para este cliente');
    }

    try {
      const response = await fetch(`${this.baseURL}/v1/templates`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao listar templates:', error);
      throw error;
    }
  }

  // Imprimir etiqueta usando API Tagment
  async printLabel(clientId: string, printRequest: TagmentPrintRequest): Promise<TagmentPrintResponse> {
    const config = await this.getClientTagmentConfig(clientId);
    
    if (!config?.apiKey) {
      throw new Error('Configuração Tagment não encontrada para este cliente');
    }

    try {
      console.log('🖨️ Enviando job de impressão para Tagment:', {
        templateId: printRequest.templateId,
        data: printRequest.data,
        printerId: printRequest.printerId
      });

      const response = await fetch(`${this.baseURL}/v1/jobs/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          templateId: printRequest.templateId,
          data: printRequest.data,
          printerId: printRequest.printerId
        })
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('✅ Resposta da impressão:', result);
      
      return {
        success: result.success || true,
        message: result.message || 'Etiqueta enviada para impressão',
        jobId: result.jobId,
        printResult: result.printResult
      };

    } catch (error) {
      console.error('❌ Erro ao imprimir etiqueta:', error);
      return {
        success: false,
        message: error.message || 'Erro ao enviar etiqueta para impressão'
      };
    }
  }

  // Obter template padrão para etiquetas de validade
  async getValidityTemplate(clientId: string): Promise<string | null> {
    try {
      const templates = await this.getAvailableTemplates(clientId);
      
      // Procurar template específico do GranoBox (conforme documentação)
      const granoboxTemplate = templates.find(t => 
        t.id === '1c12926f-849b-4bd7-8a61-05036f39f443' ||
        t.name?.toLowerCase().includes('validade') ||
        t.name?.toLowerCase().includes('granobox')
      );

      return granoboxTemplate?.id || templates[0]?.id || null;
    } catch (error) {
      console.error('Erro ao buscar template de validade:', error);
      return null;
    }
  }

  // Obter impressora configurada no GranoBox para um tipo específico
  async getConfiguredPrinter(clientId: string, usage: 'validity' | 'label'): Promise<string | null> {
    try {
      // Buscar impressoras configuradas no GranoBox
      const response = await api.get(`/printers`, { params: { clientId } });
      const granoboxPrinters = response.data;
      
      // Filtrar impressoras ativas para o uso específico
      const targetPrinters = granoboxPrinters.filter(p => 
        p.isActive && p.usage.includes(usage)
      );
      
      if (targetPrinters.length === 0) {
        console.log(`Nenhuma impressora configurada para ${usage}`);
        return null;
      }

      // Pegar a primeira impressora configurada
      const configuredPrinter = targetPrinters[0];
      
      // Verificar se a impressora do Tagment está online
      const tagmentPrinters = await this.getAvailablePrinters(clientId);
      const tagmentPrinter = tagmentPrinters.find(p => p.id === configuredPrinter.tagmentId);
      
      if (!tagmentPrinter) {
        throw new Error(`Impressora ${configuredPrinter.tagmentId} não encontrada no Tagment`);
      }
      
      if (tagmentPrinter.status !== 'online') {
        throw new Error(`Impressora ${tagmentPrinter.displayName} está offline`);
      }
      
      return tagmentPrinter.id;
      
    } catch (error) {
      console.error(`Erro ao buscar impressora para ${usage}:`, error);
      throw error;
    }
  }

  // Obter impressora padrão para etiquetas de validade
  async getValidityPrinter(clientId: string, locationId?: string): Promise<string | null> {
    try {
      // Primeiro, tentar buscar impressora configurada no GranoBox
      return await this.getConfiguredPrinter(clientId, 'validity');
    } catch (error) {
      console.log('Fallback: buscando qualquer impressora online...', error.message);
      
      // Fallback: buscar qualquer impressora online
      try {
        const printers = await this.getAvailablePrinters(clientId);
        const onlinePrinters = printers.filter(p => p.status === 'online');
        
        if (onlinePrinters.length === 0) {
          throw new Error('Nenhuma impressora online disponível');
        }

        return onlinePrinters[0].id;
      } catch (fallbackError) {
        console.error('Erro no fallback de impressora:', fallbackError);
        throw fallbackError;
      }
    }
  }

  // Imprimir etiqueta de validade (método específico)
  async printValidityLabel(clientId: string, labelData: {
    productName: string;
    brand?: string;
    sif?: string;
    originalPackingDate?: string;
    manipulationDate: string;
    validityDate: string;
    weight?: string;
    code?: string;
    storageLocation?: string;
  }, printerId?: string): Promise<TagmentPrintResponse> {
    
    try {
      // Buscar configuração do cliente
      const config = await this.getClientTagmentConfig(clientId);
      if (!config) {
        throw new Error('Configuração Tagment não encontrada para este cliente');
      }

      // Buscar template e impressora se não especificados
      const templateId = await this.getValidityTemplate(clientId);
      const targetPrinterId = printerId || await this.getValidityPrinter(clientId);

      if (!templateId) {
        throw new Error('Nenhum template de validade configurado');
      }

      if (!targetPrinterId) {
        throw new Error('Nenhuma impressora disponível');
      }

      // Mapear dados para o formato do template Tagment usando dados do cliente
      const templateData = {
        NOME_DO_PRODUTO: labelData.productName,
        MARCA_VALOR: labelData.brand || config.brand || 'GranoBox',
        SIF_VALOR: labelData.sif || config.sif || '12345',
        EMB_ORIGINAL_VALOR: labelData.originalPackingDate || labelData.manipulationDate,
        MANIPULACAO_VALOR: labelData.manipulationDate,
        VALIDADE_VALOR: labelData.validityDate,
        PESO_VALOR: labelData.weight || '',
        CODIGO_VALOR: labelData.code || '',
        LOCAL_VALOR: labelData.storageLocation || ''
      };

      return await this.printLabel(clientId, {
        templateId,
        data: templateData,
        printerId: targetPrinterId
      });

    } catch (error) {
      console.error('Erro ao imprimir etiqueta de validade:', error);
      return {
        success: false,
        message: error.message || 'Erro ao imprimir etiqueta de validade'
      };
    }
  }
}

export const tagmentPrintService = new TagmentPrintService();
