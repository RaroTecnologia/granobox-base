import { useState, useEffect, useCallback } from 'react';
import { dashboardService, DashboardData, DashboardStats, RecentLabel } from '@/services/dashboardService';
import { toast } from 'react-hot-toast';

export function useDashboard(clientId?: string) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = await dashboardService.getDashboardData(clientId);
      setDashboardData(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar dados do dashboard';
      setError(errorMessage);
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const loadQuickStats = useCallback(async (): Promise<DashboardStats | null> => {
    if (!clientId) return null;

    try {
      return await dashboardService.getQuickStats(clientId);
    } catch (err: any) {
      console.error('Erro ao carregar estatísticas rápidas:', err);
      return null;
    }
  }, [clientId]);

  const loadRecentLabels = useCallback(async (limit: number = 10): Promise<RecentLabel[]> => {
    if (!clientId) return [];

    try {
      return await dashboardService.getRecentLabels(clientId, limit);
    } catch (err: any) {
      console.error('Erro ao carregar etiquetas recentes:', err);
      return [];
    }
  }, [clientId]);

  const getStatsByPeriod = useCallback(async (period: 'today' | 'week' | 'month'): Promise<number> => {
    if (!clientId) return 0;

    try {
      return await dashboardService.getStatsByPeriod(clientId, period);
    } catch (err: any) {
      console.error('Erro ao carregar estatísticas por período:', err);
      return 0;
    }
  }, [clientId]);

  const refreshDashboard = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Carregar dados quando o componente montar ou clientId mudar
  useEffect(() => {
    if (clientId) {
      loadDashboardData();
    }
  }, [clientId, loadDashboardData]);

  // Auto-refresh a cada 5 minutos
  useEffect(() => {
    if (!clientId) return;

    const interval = setInterval(() => {
      loadDashboardData();
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [clientId, loadDashboardData]);

  return {
    dashboardData,
    loading,
    error,
    loadDashboardData,
    loadQuickStats,
    loadRecentLabels,
    getStatsByPeriod,
    refreshDashboard,
  };
}
