import { useState, useEffect, useCallback } from 'react';
import { alertsService, AlertsData, AlertProduct } from '@/services/alertsService';
import { toast } from 'react-hot-toast';

export function useAlerts(clientId?: string) {
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = useCallback(async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = await alertsService.getAlertsData(clientId);
      setAlertsData(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar alertas';
      setError(errorMessage);
      console.error('Erro ao carregar alertas:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const resolveAlert = useCallback(async (labelId: string) => {
    try {
      setLoading(true);
      await alertsService.resolveAlert(labelId);
      
      // Recarregar dados após resolver
      await loadAlerts();
      
      toast.success('Alerta resolvido com sucesso!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao resolver alerta';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Erro ao resolver alerta:', err);
    } finally {
      setLoading(false);
    }
  }, [loadAlerts]);

  const getAlertsByPriority = useCallback(async (priority: 'alta' | 'média' | 'baixa'): Promise<AlertProduct[]> => {
    if (!clientId) return [];

    try {
      return await alertsService.getAlertsByPriority(clientId, priority);
    } catch (err: any) {
      console.error('Erro ao buscar alertas por prioridade:', err);
      return [];
    }
  }, [clientId]);

  const getAlertsByConservation = useCallback(async (conservationType: 'ambiente' | 'refrigerado' | 'congelado'): Promise<AlertProduct[]> => {
    if (!clientId) return [];

    try {
      return await alertsService.getAlertsByConservation(clientId, conservationType);
    } catch (err: any) {
      console.error('Erro ao buscar alertas por conservação:', err);
      return [];
    }
  }, [clientId]);

  const refreshAlerts = useCallback(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Carregar alertas quando o componente montar ou clientId mudar
  useEffect(() => {
    if (clientId) {
      loadAlerts();
    }
  }, [clientId, loadAlerts]);

  return {
    alertsData,
    loading,
    error,
    loadAlerts,
    resolveAlert,
    getAlertsByPriority,
    getAlertsByConservation,
    refreshAlerts,
  };
}
