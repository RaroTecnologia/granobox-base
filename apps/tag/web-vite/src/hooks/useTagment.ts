import { useState, useEffect, useCallback } from 'react';
import { tagmentService, TagmentPrinter, TagmentPrintJob } from '../services/tagmentService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';
import websocketService, { AgentInfo, PrintJobUpdate, PrinterStatusUpdate } from '../services/websocketService';

export function useTagment() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printers, setPrinters] = useState<TagmentPrinter[]>([]);
  const [agentFingerprint, setAgentFingerprint] = useState<string | null>(null);
  const [printJobs, setPrintJobs] = useState<TagmentPrintJob[]>([]);
  const [systemStatus, setSystemStatus] = useState<{
    agentDetected: boolean;
    hasToken: boolean;
    isReady: boolean;
    status: 'ready' | 'needs_token' | 'needs_agent';
  }>({
    agentDetected: false,
    hasToken: false,
    isReady: false,
    status: 'needs_agent'
  });
  const [isAutoConfiguring, setIsAutoConfiguring] = useState(false);
  
  // Estados WebSocket
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [connectedAgents, setConnectedAgents] = useState<string[]>([]);
  const [agentsInfo, setAgentsInfo] = useState<AgentInfo[]>([]);
  const [jobStatus, setJobStatus] = useState<Record<string, PrintJobUpdate>>({});
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [printersLoaded, setPrintersLoaded] = useState(false);

  // Detectar status do sistema automaticamente
  const checkSystemStatus = useCallback(async () => {
    try {
      const status = await tagmentService.getSystemStatus();
      setSystemStatus(status);
      setIsConnected(status.isReady);
      return status;
    } catch (err: any) {
      console.error('Erro ao verificar status do sistema:', err);
      return null;
    }
  }, []);

  // Buscar API Key do cliente
  const fetchClientTagmentKey = useCallback(async () => {
    if (!user?.clientId) {
      console.log('fetchClientTagmentKey: user.clientId não encontrado');
      return null;
    }

    try {
      console.log('fetchClientTagmentKey: buscando API Key para cliente:', user.clientId);
      const response = await api.get(`/clients/${user.clientId}`);
      console.log('fetchClientTagmentKey: resposta da API:', response.data);
      return response.data.tagmentApiKey;
    } catch (error) {
      console.error('Erro ao buscar API Key do cliente:', error);
    }
    return null;
  }, [user?.clientId]);

  // Configurar automaticamente com API Key do cliente
  const autoConfigure = useCallback(async () => {
    if (!user?.clientId) {
      console.log('autoConfigure: user.clientId não encontrado');
      return false;
    }

    if (isAutoConfiguring) {
      console.log('autoConfigure: já está em execução, ignorando');
      return false;
    }

    try {
      console.log('autoConfigure: iniciando configuração automática');
      setIsAutoConfiguring(true);
      setIsLoading(true);
      setError(null);

      // Buscar API Key do cliente
      const clientApiKey = await fetchClientTagmentKey();
      
      if (!clientApiKey) {
        console.log('autoConfigure: Nenhuma API Key do Tagment configurada para este cliente');
        return false;
      }
      
      console.log('autoConfigure: API Key encontrada, configurando...');
      
      // Gerar fingerprint do agente
      const fingerprint = tagmentService.generateAgentFingerprint();
      tagmentService.setAgentFingerprint(fingerprint);
      setAgentFingerprint(fingerprint);

      // Configurar token com a API Key do cliente
      tagmentService.setToken(clientApiKey);

      // Salvar no localStorage
      localStorage.setItem('tagment_api_key', clientApiKey);
      localStorage.setItem('tagment_agent_fingerprint', fingerprint);

      setIsConnected(true);
      
      // Atualizar status do sistema imediatamente
      const newStatus = await tagmentService.getSystemStatus();
      setSystemStatus(newStatus);
      
      console.log('autoConfigure: configuração automática realizada com sucesso');
      // toast.success('Configuração automática realizada!'); // Removido - não é necessário mostrar ao usuário
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro na configuração automática';
      setError(errorMessage);
      console.error('Erro na configuração automática:', err);
      return false;
    } finally {
      setIsLoading(false);
      setIsAutoConfiguring(false);
    }
  }, [user?.clientId, fetchClientTagmentKey, isAutoConfiguring]);

  // Configurar WebSocket
  const setupWebSocket = useCallback((apiKey: string) => {
    console.log('🔌 Configurando WebSocket com API Key...');
    
    // Configurar callbacks
    websocketService.onConnectionChange = (connected: boolean) => {
      console.log('🔗 WebSocket status mudou:', connected);
      setIsWebSocketConnected(connected);
    };

    websocketService.onAgentConnected = (data: AgentInfo) => {
      console.log('✅ Agent conectado via WebSocket:', data);
      loadConnectedAgents();
    };

    websocketService.onAgentDisconnected = (data: AgentInfo) => {
      console.log('❌ Agent desconectado via WebSocket:', data);
      loadConnectedAgents();
    };

    websocketService.onPrintJobUpdated = (data: PrintJobUpdate) => {
      console.log('📄 Job atualizado via WebSocket:', data);
      
      // Atualizar status
      setJobStatus(prev => {
        const prevStatus = prev[data.jobId];
        const newStatus = { ...prev, [data.jobId]: data };
        
        // Notificar mudanças importantes
        if (prevStatus && prevStatus.status !== data.status) {
          if (data.status === 'completed') {
            toast.success(`✅ Job ${data.jobId.slice(-8)} concluído com sucesso!`);
          } else if (data.status === 'error') {
            toast.error(`❌ Erro no job ${data.jobId.slice(-8)}: ${data.error || 'Erro desconhecido'}`);
          } else if (data.status === 'printing') {
            toast.loading(`🖨️ Imprimindo job ${data.jobId.slice(-8)}...`);
          }
        }
        
        return newStatus;
      });
    };

    websocketService.onPrinterStatusUpdate = (data: PrinterStatusUpdate) => {
      console.log('🖨️ Status da impressora atualizado via WebSocket:', data);
    };

    websocketService.onError = (error: Error) => {
      console.error('❌ Erro WebSocket:', error);
      setError(error.message);
    };

    // Conectar
    websocketService.connect(apiKey);
  }, []);

  // Carregar agents conectados
  const loadConnectedAgents = useCallback(async () => {
    if (!systemStatus.hasToken) return;

    try {
      const response = await tagmentService.getConnectedAgents();
      setConnectedAgents(response.agents || []);
      setAgentsInfo(response.agentsInfo || []);
      console.log('📡 Agents conectados carregados:', response);
    } catch (err) {
      console.error('Erro ao carregar agents conectados:', err);
    }
  }, [systemStatus.hasToken]);

  // Enviar job de teste via WebSocket
  const sendTestJobWebSocket = useCallback(async (agentFingerprint: string) => {
    try {
      setError(null);
      const result = await tagmentService.sendTestJob(agentFingerprint);
      
      if (result.success) {
        toast.success('✅ Job de teste enviado via WebSocket!');
        return { success: true, message: result.message };
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      const errorMsg = 'Erro ao enviar job de teste: ' + err.message;
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, message: errorMsg };
    }
  }, []);

  // Enviar job customizado via WebSocket
  const sendCustomJobWebSocket = useCallback(async (agentFingerprint: string, jobData: {
    printerId: string;
    zplData: string;
    priority?: 'low' | 'normal' | 'high';
    metadata?: any;
  }) => {
    try {
      setError(null);
      const result = await tagmentService.sendCustomPrintJob(agentFingerprint, jobData);
      
      if (result.success) {
        toast.success('✅ Job customizado enviado via WebSocket!');
        return { success: true, message: result.message, jobId: result.jobId };
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      const errorMsg = 'Erro ao enviar job customizado: ' + err.message;
      setError(errorMsg);
      toast.error(errorMsg);
      return { success: false, message: errorMsg };
    }
  }, []);

  // Limpar jobs concluídos
  const clearCompletedJobs = useCallback(() => {
    const activeJobs = Object.fromEntries(
      Object.entries(jobStatus).filter(([_, status]) => 
        status.status === 'received' || status.status === 'printing'
      )
    );
    setJobStatus(activeJobs);
  }, [jobStatus]);

  // Inicializar integração com Tagment
  const initializeTagment = useCallback(async (apiKey: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validar API Key
      const userInfo = await tagmentService.validateApiKey(apiKey);
      
      // Gerar fingerprint do agente
      const fingerprint = tagmentService.generateAgentFingerprint();
      tagmentService.setAgentFingerprint(fingerprint);
      setAgentFingerprint(fingerprint);

      // Salvar no localStorage
      localStorage.setItem('tagment_api_key', apiKey);
      localStorage.setItem('tagment_agent_fingerprint', fingerprint);

      setIsConnected(true);
      toast.success('Conectado ao Tagment Agent Print!');
      
      return userInfo;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao conectar com Tagment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar impressoras do Tagment
  const loadPrinters = useCallback(async () => {
    if (!user?.clientId || !isConnected || isLoadingPrinters || printersLoaded) return;

    try {
      setIsLoadingPrinters(true);
      setError(null);

      const customerId = `gbx_${user.clientId}`;
      
      // Buscar impressoras do cliente específico
      let tagmentPrinters = await tagmentService.getPrintersByCustomer(customerId);
      
      // Se não encontrar impressoras específicas, buscar impressoras padrão
      if (tagmentPrinters.length === 0) {
        console.log('Nenhuma impressora encontrada para o cliente, buscando impressoras padrão...');
        tagmentPrinters = await tagmentService.getPrintersByCustomer('gbx_default');
        console.log('Impressoras padrão encontradas:', tagmentPrinters);
      }
      
      console.log('Impressoras finais carregadas:', tagmentPrinters);
      setPrinters(tagmentPrinters);
      setPrintersLoaded(true);
      return tagmentPrinters;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar impressoras';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoadingPrinters(false);
    }
  }, [user?.clientId, isConnected, isLoadingPrinters, printersLoaded]);

  // Registrar impressora no Tagment
  const registerPrinter = useCallback(async (printerData: any) => {
    if (!user?.clientId || !agentFingerprint) {
      throw new Error('Cliente ou fingerprint não encontrado');
    }

    try {
      setIsLoading(true);
      setError(null);

      const customerId = `gbx_${user.clientId}`;
      const payload = tagmentService.createPrinterPayload(printerData, customerId);
      
      const registeredPrinter = await tagmentService.registerPrinter(payload, agentFingerprint);
      
      // Atualizar lista local
      setPrinters(prev => [...prev, registeredPrinter]);
      
      toast.success('Impressora registrada no Tagment!');
      return registeredPrinter;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao registrar impressora';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user?.clientId, agentFingerprint]);

  // Testar conexão com impressora
  const testPrinter = useCallback(async (printerId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await tagmentService.testPrinterConnection(printerId);
      
      // Atualizar status da impressora localmente
      setPrinters(prev => prev.map(printer => 
        printer.id === printerId 
          ? { ...printer, status: result.success ? 'online' : 'offline' }
          : printer
      ));

      if (result.success) {
        toast.success('Conexão com impressora bem-sucedida!');
      } else {
        toast.error('Falha na conexão com impressora');
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao testar impressora';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enviar job de impressão - nova arquitetura WebSocket
  const sendPrintJob = useCallback(async (templateId: string, data: any, printerId?: string, priority: 'low' | 'normal' | 'high' = 'normal') => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🚀 Criando job de impressão via WebSocket...');
      console.log('Template ID:', templateId);
      console.log('Dados:', data);
      console.log('Impressora:', printerId);
      console.log('Prioridade:', priority);

      const printJob = await tagmentService.createPrintJob(templateId, data, printerId, priority);
      
        if (printJob) {
          console.log('✅ Job criado com sucesso:', printJob);
          console.log('📄 ZPL gerado:', printJob.zpl);
          
          // Adicionar à lista de jobs
          setPrintJobs(prev => [...prev, printJob]);
          
          toast.success('✅ ZPL gerado com sucesso! Template processado.');
          
          return printJob;
        }
      
      return null;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar job de impressão';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ Erro ao criar job:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enviar heartbeat para impressoras
  const sendHeartbeat = useCallback(async () => {
    if (!user?.clientId || !agentFingerprint || printers.length === 0) return;

    try {
      const customerId = `gbx_${user.clientId}`;
      
      // Enviar heartbeat para todas as impressoras que têm externalPrinterRef
      const promises = printers
        .filter(printer => printer.externalPrinterRef)
        .map(printer => 
          tagmentService.updatePrinterHeartbeat(
            customerId,
            printer.externalPrinterRef,
            agentFingerprint
          )
        );

      if (promises.length > 0) {
        await Promise.all(promises);
      }
    } catch (err: any) {
      console.error('Erro no heartbeat:', err);
    }
  }, [user?.clientId, agentFingerprint, printers]);

  // Carregar jobs de impressão
  const loadPrintJobs = useCallback(async (printerId?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const jobs = await tagmentService.getPrintJobs(printerId);
      setPrintJobs(jobs);
      return jobs;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar jobs de impressão';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verificar status do agente
  const checkAgentStatus = useCallback(async () => {
    try {
      const status = await tagmentService.getAgentStatus();
      setIsConnected(status.isConnected);
      return status;
    } catch (err: any) {
      console.error('Erro ao verificar status do agente:', err);
      setIsConnected(false);
      return null;
    }
  }, []);

  // Desconectar do Tagment
  const disconnect = useCallback(() => {
    tagmentService.logout();
    setIsConnected(false);
    setPrinters([]);
    setPrintJobs([]);
    setAgentFingerprint(null);
    
    // Limpar localStorage
    localStorage.removeItem('tagment_api_key');
    localStorage.removeItem('tagment_agent_fingerprint');
    
    toast.success('Desconectado do Tagment Agent Print');
  }, []);

  // Inicializar detecção automática
  useEffect(() => {
    const initializeDetection = async () => {
      // Verificar status do sistema
      await checkSystemStatus();
    };

    initializeDetection();
    
    // Iniciar verificação do agente apenas se WebSocket não estiver conectado
    if (!isWebSocketConnected) {
      tagmentService.startAgentDetection(30000);
    }
    
    return () => {
      tagmentService.stopAgentDetection();
    };
  }, [user?.clientId, checkSystemStatus, isWebSocketConnected]);

  // Atualizar status quando detectar mudanças (reduzido com WebSocket)
  useEffect(() => {
    // Se WebSocket está conectado, reduzir frequência do health check
    const intervalTime = isWebSocketConnected ? 120000 : 30000; // 2min vs 30s
    
    const interval = setInterval(async () => {
      // Só fazer health check se WebSocket não estiver conectado
      if (!isWebSocketConnected) {
        await checkSystemStatus();
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isWebSocketConnected, checkSystemStatus]);

  // Configuração automática quando status mudar
  useEffect(() => {
    const handleStatusChange = async () => {
      // Se não tem token, tentar configuração automática
      if (!systemStatus.hasToken && user?.clientId && !isLoading && !isAutoConfiguring) {
        console.log('Status mudou: tentando configuração automática');
        await autoConfigure();
      }
      
      // Se está pronto, carregar impressoras
      if (systemStatus.isReady && !isLoading && !isLoadingPrinters && !printersLoaded) {
        console.log('Status mudou: carregando impressoras');
        await loadPrinters();
      }
    };

    handleStatusChange();
  }, [systemStatus.hasToken, systemStatus.isReady, user?.clientId, isLoading, isAutoConfiguring, isLoadingPrinters, printersLoaded]);

  // Configurar WebSocket quando token estiver disponível
  useEffect(() => {
    if (systemStatus.hasToken && !isWebSocketConnected) {
      const apiKey = localStorage.getItem('tagment_api_key');
      if (apiKey) {
        console.log('🔌 Configurando WebSocket...');
        setupWebSocket(apiKey);
        loadConnectedAgents();
      }
    }

    // Cleanup ao desmontar
    return () => {
      if (isWebSocketConnected) {
        console.log('🔌 Desconectando WebSocket...');
        websocketService.disconnect();
      }
    };
  }, [systemStatus.hasToken, isWebSocketConnected, setupWebSocket, loadConnectedAgents]);

  // Enviar heartbeat periodicamente
  useEffect(() => {
    if (!isConnected) return;

    const heartbeatInterval = setInterval(() => {
      sendHeartbeat();
    }, 30000); // 30 segundos

    return () => clearInterval(heartbeatInterval);
  }, [isConnected, sendHeartbeat]);

  return {
    // Estado
    isConnected,
    isLoading,
    error,
    printers,
    printJobs,
    agentFingerprint,
    systemStatus,

    // Estados WebSocket
    isWebSocketConnected,
    connectedAgents,
    agentsInfo,
    jobStatus,

    // Ações
    initializeTagment,
    autoConfigure,
    checkSystemStatus,
    loadPrinters,
    registerPrinter,
    testPrinter,
    sendPrintJob,
    loadPrintJobs,
    checkAgentStatus,
    disconnect,
    sendHeartbeat,

    // Ações WebSocket
    loadConnectedAgents,
    sendTestJobWebSocket,
    sendCustomJobWebSocket,
    clearCompletedJobs,
  };
}
