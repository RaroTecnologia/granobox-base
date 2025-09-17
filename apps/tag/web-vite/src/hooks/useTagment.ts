import { useState, useEffect, useCallback } from 'react';
import { tagmentService, TagmentPrinter } from '../services/tagmentService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';

export function useTagment() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printers, setPrinters] = useState<TagmentPrinter[]>([]);
  const [systemStatus, setSystemStatus] = useState<{
    hasToken: boolean;
    isReady: boolean;
    status: 'ready' | 'needs_token';
  }>({
    hasToken: false,
    isReady: false,
    status: 'needs_token'
  });
  const [isAutoConfiguring, setIsAutoConfiguring] = useState(false);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [printersLoaded, setPrintersLoaded] = useState(false);

  // Detectar status do sistema automaticamente
  const checkSystemStatus = useCallback(async () => {
    try {
      const hasToken = !!localStorage.getItem('tagment_api_key');
      const status = {
        hasToken,
        isReady: hasToken,
        status: hasToken ? 'ready' as const : 'needs_token' as const
      };
      setSystemStatus(status);
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
      console.log('fetchClientTagmentKey: URL completa:', `/clients/${user.clientId}`);
      
      // Verificar se há token de autenticação
      const authToken = localStorage.getItem('auth_token');
      console.log('fetchClientTagmentKey: Token de autenticação:', authToken ? `Presente (${authToken.substring(0, 20)}...)` : 'AUSENTE');
      
      const response = await api.get(`/clients/${user.clientId}`);
      console.log('fetchClientTagmentKey: resposta da API:', response.data);
      console.log('fetchClientTagmentKey: tagmentApiKey encontrada:', response.data.tagmentApiKey ? 'SIM' : 'NÃO');
      
      return response.data.tagmentApiKey;
    } catch (error) {
      console.error('fetchClientTagmentKey: Erro detalhado ao buscar API Key:', error);
      console.error('fetchClientTagmentKey: Status do erro:', error.response?.status);
      console.error('fetchClientTagmentKey: Dados do erro:', error.response?.data);
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
      console.log('autoConfigure: já está configurando, pulando...');
      return false;
    }

    try {
      console.log('autoConfigure: iniciando configuração automática');
      setIsAutoConfiguring(true);
      setIsLoading(true);
      setError(null);

      // Buscar API Key do cliente
      console.log('autoConfigure: Chamando fetchClientTagmentKey...');
      const clientApiKey = await fetchClientTagmentKey();
      console.log('autoConfigure: Resultado fetchClientTagmentKey:', clientApiKey ? `API Key encontrada (${clientApiKey.substring(0, 10)}...)` : 'Nenhuma API Key');
      
      if (!clientApiKey) {
        console.log('autoConfigure: Nenhuma API Key do Tagment configurada para este cliente');
        
        // Verificar se há uma API Key no localStorage (configurada no control)
        const localStorageKey = localStorage.getItem('tagment_api_key');
        if (localStorageKey) {
          console.log('autoConfigure: Encontrada API Key no localStorage, usando como fallback');
          // Usar a API Key do localStorage
          tagmentService.setToken(localStorageKey);
          console.log('🔑 Token do localStorage configurado no tagmentService:', `${localStorageKey.substring(0, 10)}...`);
          
          // Atualizar status do sistema
          const newStatus = {
            hasToken: true,
            isReady: true,
            status: 'ready' as const
          };
          setSystemStatus(newStatus);
          
          return true;
        }
        
        return false;
      }
      
      console.log('autoConfigure: API Key encontrada, configurando...');
      
      // Configurar token com a API Key do cliente
      tagmentService.setToken(clientApiKey);
      console.log('🔑 Token configurado no tagmentService:', `${clientApiKey.substring(0, 10)}...`);

      // Salvar no localStorage
      localStorage.setItem('tagment_api_key', clientApiKey);
      console.log('💾 Token salvo no localStorage');

      // Atualizar status do sistema imediatamente
      const newStatus = {
        hasToken: true,
        isReady: true,
        status: 'ready' as const
      };
      setSystemStatus(newStatus);
      
      console.log('autoConfigure: configuração automática realizada com sucesso');
      
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

  // Carregar impressoras do Tagment
  const loadPrinters = useCallback(async (forceReload = false) => {
    console.log('🔍 loadPrinters: Verificando condições...', {
      hasClientId: !!user?.clientId,
      hasToken: systemStatus.hasToken,
      isLoadingPrinters,
      printersLoaded,
      forceReload
    });
    
    // Só precisa ter token, não precisa de WebSocket para listar impressoras
    if (!user?.clientId || !systemStatus.hasToken || isLoadingPrinters) {
      console.log('🔍 loadPrinters: Condições não atendidas, saindo...');
      return;
    }

    // Se já carregou e não é force reload, pular
    if (printersLoaded && !forceReload) {
      console.log('🔍 loadPrinters: Impressoras já carregadas, use reloadPrinters() para forçar');
      return;
    }

    try {
      setIsLoadingPrinters(true);
      setError(null);

      console.log('🔍 Carregando todas as impressoras do Tagment via API...');
      
      // Tentar buscar todas as impressoras primeiro
      let tagmentPrinters = await tagmentService.getAllPrinters();
      console.log(`✅ Encontradas ${tagmentPrinters.length} impressoras no Tagment (getAllPrinters):`, tagmentPrinters);
      
      // Se não encontrou impressoras, tentar buscar por customerId se tivermos um
      if (tagmentPrinters.length === 0) {
        try {
          // Buscar dados do cliente para obter customerId
          const response = await api.get(`/clients/${user.clientId}`);
          const client = response.data;
          
          if (client.tagmentCustomerId) {
            console.log('🔍 Tentando buscar impressoras por customerId:', client.tagmentCustomerId);
            const printersByCustomer = await tagmentService.getPrintersByCustomer(client.tagmentCustomerId);
            console.log(`✅ Encontradas ${printersByCustomer.length} impressoras por customerId:`, printersByCustomer);
            tagmentPrinters = printersByCustomer;
          }
        } catch (customerError) {
          console.log('⚠️ Erro ao buscar por customerId:', customerError.message);
        }
      }
      setPrinters(tagmentPrinters);
      setPrintersLoaded(true);
      return tagmentPrinters;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar impressoras';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ Erro ao carregar impressoras:', err);
      throw err;
    } finally {
      setIsLoadingPrinters(false);
    }
  }, [user?.clientId, systemStatus.hasToken, isLoadingPrinters, printersLoaded]);

  // Forçar recarregamento das impressoras
  const reloadPrinters = useCallback(async () => {
    console.log('🔄 Forçando recarregamento das impressoras...');
    setPrintersLoaded(false);
    return await loadPrinters(true);
  }, [loadPrinters]);

  // Inicializar Tagment com API Key manual
  const initializeTagment = useCallback(async (apiKey: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validar API Key
      await tagmentService.validateApiKey(apiKey);
      
      // Salvar no localStorage
      localStorage.setItem('tagment_api_key', apiKey);
      
      // Atualizar status
      const newStatus = {
        hasToken: true,
        isReady: true,
        status: 'ready' as const
      };
      setSystemStatus(newStatus);
      
      toast.success('✅ Conectado ao Tagment com sucesso!');
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao conectar com Tagment';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Desconectar
  const disconnect = useCallback(() => {
    localStorage.removeItem('tagment_api_key');
    tagmentService.setToken('');
    setPrinters([]);
    setPrintersLoaded(false);
    setSystemStatus({
      hasToken: false,
      isReady: false,
      status: 'needs_token'
    });
    toast.success('Desconectado do Tagment');
  }, []);

  // Verificar status inicial
  useEffect(() => {
    checkSystemStatus();
  }, [checkSystemStatus]);

  // Configuração automática quando status mudar
  useEffect(() => {
    console.log('🔄 useEffect statusChange: Verificando condições...', {
      hasToken: systemStatus.hasToken,
      isReady: systemStatus.isReady,
      hasClientId: !!user?.clientId,
      isLoading,
      isAutoConfiguring,
      isLoadingPrinters,
      printersLoaded
    });
    
    const handleStatusChange = async () => {
      // Se não tem token, tentar configuração automática
      if (!systemStatus.hasToken && user?.clientId && !isLoading && !isAutoConfiguring) {
        console.log('🔄 Status mudou: tentando configuração automática');
        await autoConfigure();
      }
      
      // Se tem token, carregar impressoras (não precisa esperar WebSocket)
      if (systemStatus.hasToken && !isLoading && !isLoadingPrinters && !printersLoaded) {
        console.log('🔄 Status mudou: carregando impressoras via API');
        await loadPrinters();
      }
    };

    handleStatusChange();
  }, [systemStatus.hasToken, systemStatus.isReady, user?.clientId, isLoading, isAutoConfiguring, isLoadingPrinters, printersLoaded, autoConfigure, loadPrinters]);

  return {
    // Estados
    isConnected: systemStatus.hasToken, // Para listar impressoras só precisa de token
    isLoading,
    error,
    printers,
    systemStatus,

    // Ações
    initializeTagment,
    autoConfigure,
    checkSystemStatus,
    loadPrinters,
    reloadPrinters,
    disconnect,
  };
}