import { api } from './api';
import { labelsService, Label } from './labelsService';
import { alertsService } from './alertsService';

export interface DashboardStats {
  totalLabels: number;
  labelsToday: number;
  labelsThisWeek: number;
  labelsThisMonth: number;
  expiring15Days: number;
  expired: number;
  score: number;
  level: 'Bronze' | 'Prata' | 'Ouro' | 'Diamante';
  percentageExpired: number;
  targetExpired: number;
  pointsToNextLevel: number;
  nextLevel: string;
}

export interface RecentLabel {
  id: string;
  name: string;
  type: 'validity' | 'label';
  code: string;
  date: string;
  productName: string;
  quantity: number;
  status: 'pending' | 'printed' | 'failed';
}

export interface DashboardData {
  stats: DashboardStats;
  recentLabels: RecentLabel[];
  weeklyStats: {
    thisWeek: number;
    thisMonth: number;
  };
}

class DashboardService {
  private isToday(date: string): boolean {
    const today = new Date();
    const checkDate = new Date(date);
    return (
      checkDate.getDate() === today.getDate() &&
      checkDate.getMonth() === today.getMonth() &&
      checkDate.getFullYear() === today.getFullYear()
    );
  }

  private isThisWeek(date: string): boolean {
    const today = new Date();
    const checkDate = new Date(date);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    return checkDate >= startOfWeek && checkDate <= today;
  }

  private isThisMonth(date: string): boolean {
    const today = new Date();
    const checkDate = new Date(date);
    return (
      checkDate.getMonth() === today.getMonth() &&
      checkDate.getFullYear() === today.getFullYear()
    );
  }

  private calculateDaysToExpiration(validityDate: string): number {
    const today = new Date();
    const expiration = new Date(validityDate);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  private convertLabelToRecentLabel(label: Label): RecentLabel {
    return {
      id: label.id,
      name: label.product.name,
      type: label.type,
      code: label.product.code,
      date: label.createdAt,
      productName: label.product.name,
      quantity: label.quantity,
      status: label.status
    };
  }

  async getDashboardData(clientId: string): Promise<DashboardData> {
    try {
      // Buscar todas as etiquetas do cliente
      const allLabels = await labelsService.getAllLabels(clientId);
      
      // Buscar dados de alertas para score e níveis
      const alertsData = await alertsService.getAlertsData(clientId);

      // Filtrar etiquetas ativas (impressas e não usadas)
      const activeLabels = allLabels.filter(label => 
        label.status === 'printed' && !label.metadata?.isUsed
      );

      // Calcular estatísticas
      const totalLabels = activeLabels.length;
      
      // Etiquetas criadas hoje
      const labelsToday = allLabels.filter(label => 
        this.isToday(label.createdAt)
      ).length;

      // Etiquetas criadas esta semana
      const labelsThisWeek = allLabels.filter(label => 
        this.isThisWeek(label.createdAt)
      ).length;

      // Etiquetas criadas este mês
      const labelsThisMonth = allLabels.filter(label => 
        this.isThisMonth(label.createdAt)
      ).length;

      // Produtos vencendo em 15 dias (para compatibilidade com o dashboard atual)
      const expiring15Days = activeLabels.filter(label => {
        if (label.type !== 'validity') return false;
        const daysToExpiration = this.calculateDaysToExpiration(label.validityDate);
        return daysToExpiration >= 0 && daysToExpiration <= 15;
      }).length;

      // Produtos vencidos
      const expired = activeLabels.filter(label => {
        if (label.type !== 'validity') return false;
        const daysToExpiration = this.calculateDaysToExpiration(label.validityDate);
        return daysToExpiration < 0;
      }).length;

      // Etiquetas recentes (últimas 10)
      const recentLabels = allLabels
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map(label => this.convertLabelToRecentLabel(label));

      // Usar dados dos alertas para score e níveis
      const stats: DashboardStats = {
        totalLabels,
        labelsToday,
        labelsThisWeek,
        labelsThisMonth,
        expiring15Days,
        expired,
        score: alertsData.kpis.score,
        level: alertsData.kpis.level,
        percentageExpired: alertsData.kpis.percentageExpired,
        targetExpired: alertsData.kpis.targetExpired,
        pointsToNextLevel: alertsData.kpis.pointsToNextLevel,
        nextLevel: alertsData.kpis.nextLevel
      };

      const weeklyStats = {
        thisWeek: labelsThisWeek,
        thisMonth: labelsThisMonth
      };

      return {
        stats,
        recentLabels,
        weeklyStats
      };
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  }

  // Método para buscar estatísticas rápidas (sem etiquetas recentes)
  async getQuickStats(clientId: string): Promise<DashboardStats> {
    const data = await this.getDashboardData(clientId);
    return data.stats;
  }

  // Método para buscar apenas etiquetas recentes
  async getRecentLabels(clientId: string, limit: number = 10): Promise<RecentLabel[]> {
    try {
      const allLabels = await labelsService.getAllLabels(clientId);
      
      return allLabels
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)
        .map(label => this.convertLabelToRecentLabel(label));
    } catch (error) {
      console.error('Erro ao buscar etiquetas recentes:', error);
      throw error;
    }
  }

  // Método para buscar estatísticas por período
  async getStatsByPeriod(clientId: string, period: 'today' | 'week' | 'month'): Promise<number> {
    try {
      const allLabels = await labelsService.getAllLabels(clientId);
      
      switch (period) {
        case 'today':
          return allLabels.filter(label => this.isToday(label.createdAt)).length;
        case 'week':
          return allLabels.filter(label => this.isThisWeek(label.createdAt)).length;
        case 'month':
          return allLabels.filter(label => this.isThisMonth(label.createdAt)).length;
        default:
          return 0;
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas por período:', error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
