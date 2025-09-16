import { api } from './api';
import { labelsService, Label } from './labelsService';

export interface AlertProduct {
  id: string;
  name: string;
  code: string;
  category: string;
  validityDate: string;
  quantity: number;
  weight?: string;
  unit?: string;
  conservationType?: 'ambiente' | 'refrigerado' | 'congelado';
  daysToExpiration: number;
  priority: 'alta' | 'média' | 'baixa';
  labelId: string;
  isUsed: boolean;
}

export interface AlertsKPIs {
  totalProducts: number;
  expired: number;
  expiring7Days: number;
  expiring30Days: number;
  percentageExpired: number;
  percentageExpiring7Days: number;
  targetExpired: number; // Meta: máximo % vencidos
  targetExpiring7Days: number; // Meta: máximo % vencendo em 7 dias
  score: number; // Score de 0-100 baseado na gestão
  level: 'Bronze' | 'Prata' | 'Ouro' | 'Diamante';
  nextLevel: string;
  pointsToNextLevel: number;
}

export interface AlertsData {
  expired: AlertProduct[];
  expiring7Days: AlertProduct[];
  expiring30Days: AlertProduct[];
  kpis: AlertsKPIs;
}

class AlertsService {
  private calculateDaysToExpiration(validityDate: string): number {
    const today = new Date();
    const expiration = new Date(validityDate);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  private calculatePriority(daysToExpiration: number, quantity: number): 'alta' | 'média' | 'baixa' {
    if (daysToExpiration < 0) {
      // Vencido - prioridade baseada na quantidade
      return quantity > 100 ? 'alta' : 'média';
    } else if (daysToExpiration <= 3) {
      // Vencendo em 3 dias ou menos
      return 'alta';
    } else if (daysToExpiration <= 7) {
      // Vencendo em 7 dias
      return quantity > 50 ? 'média' : 'baixa';
    } else {
      // Vencendo em 30 dias
      return 'baixa';
    }
  }

  private calculateScore(kpis: Partial<AlertsKPIs>): number {
    let score = 100;
    
    // Penalizar produtos vencidos (peso maior)
    if (kpis.percentageExpired! > kpis.targetExpired!) {
      const excess = kpis.percentageExpired! - kpis.targetExpired!;
      score -= excess * 30; // 30 pontos por % acima da meta
    }
    
    // Penalizar produtos vencendo em 7 dias
    if (kpis.percentageExpiring7Days! > kpis.targetExpiring7Days!) {
      const excess = kpis.percentageExpiring7Days! - kpis.targetExpiring7Days!;
      score -= excess * 15; // 15 pontos por % acima da meta
    }
    
    // Bonificar boa gestão
    if (kpis.percentageExpired! === 0) {
      score += 10; // Bônus por zero vencidos
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private calculateLevel(score: number): { level: 'Bronze' | 'Prata' | 'Ouro' | 'Diamante'; nextLevel: string; pointsToNextLevel: number } {
    if (score >= 90) {
      return { level: 'Diamante', nextLevel: 'Diamante', pointsToNextLevel: 0 };
    } else if (score >= 75) {
      return { level: 'Ouro', nextLevel: 'Diamante', pointsToNextLevel: 90 - score };
    } else if (score >= 60) {
      return { level: 'Prata', nextLevel: 'Ouro', pointsToNextLevel: 75 - score };
    } else {
      return { level: 'Bronze', nextLevel: 'Prata', pointsToNextLevel: 60 - score };
    }
  }

  private convertLabelToAlertProduct(label: Label): AlertProduct {
    const daysToExpiration = this.calculateDaysToExpiration(label.validityDate);
    const priority = this.calculatePriority(daysToExpiration, label.quantity);
    const isUsed = label.metadata?.isUsed || false;

    return {
      id: label.product.id,
      name: label.product.name,
      code: label.product.code,
      category: 'Produto', // Podemos melhorar isso buscando a categoria real
      validityDate: label.validityDate,
      quantity: label.quantity,
      weight: label.weight,
      unit: label.unit,
      conservationType: label.conservationType,
      daysToExpiration,
      priority,
      labelId: label.id,
      isUsed
    };
  }

  async getAlertsData(clientId: string): Promise<AlertsData> {
    try {
      // Buscar todas as etiquetas do cliente
      const allLabels = await labelsService.getAllLabels(clientId);
      
      // Filtrar apenas etiquetas de validade que não foram usadas e que foram impressas
      const validityLabels = allLabels.filter(label => 
        label.type === 'validity' && 
        !label.metadata?.isUsed && 
        label.status === 'printed'
      );

      // Converter para AlertProduct
      const alertProducts = validityLabels.map(label => this.convertLabelToAlertProduct(label));

      // Separar por categorias de vencimento
      const expired = alertProducts.filter(product => product.daysToExpiration < 0);
      const expiring7Days = alertProducts.filter(product => 
        product.daysToExpiration >= 0 && product.daysToExpiration <= 7
      );
      const expiring30Days = alertProducts.filter(product => 
        product.daysToExpiration > 7 && product.daysToExpiration <= 30
      );

      // Calcular KPIs
      const totalProducts = alertProducts.length;
      const percentageExpired = totalProducts > 0 ? (expired.length / totalProducts) * 100 : 0;
      const percentageExpiring7Days = totalProducts > 0 ? (expiring7Days.length / totalProducts) * 100 : 0;
      
      // Metas (configuráveis)
      const targetExpired = 0.2; // 0.2%
      const targetExpiring7Days = 0.5; // 0.5%

      const partialKpis = {
        totalProducts,
        expired: expired.length,
        expiring7Days: expiring7Days.length,
        expiring30Days: expiring30Days.length,
        percentageExpired,
        percentageExpiring7Days,
        targetExpired,
        targetExpiring7Days
      };

      const score = this.calculateScore(partialKpis);
      const levelInfo = this.calculateLevel(score);

      const kpis: AlertsKPIs = {
        ...partialKpis,
        score,
        level: levelInfo.level,
        nextLevel: levelInfo.nextLevel,
        pointsToNextLevel: levelInfo.pointsToNextLevel
      };

      return {
        expired,
        expiring7Days,
        expiring30Days,
        kpis
      };
    } catch (error) {
      console.error('Erro ao buscar dados de alertas:', error);
      throw error;
    }
  }

  // Método para marcar um produto como resolvido (dar baixa na etiqueta)
  async resolveAlert(labelId: string): Promise<void> {
    try {
      await labelsService.markAsUsed(labelId);
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
      throw error;
    }
  }

  // Método para buscar alertas por prioridade
  async getAlertsByPriority(clientId: string, priority: 'alta' | 'média' | 'baixa'): Promise<AlertProduct[]> {
    const alertsData = await this.getAlertsData(clientId);
    const allAlerts = [
      ...alertsData.expired,
      ...alertsData.expiring7Days,
      ...alertsData.expiring30Days
    ];
    
    return allAlerts.filter(alert => alert.priority === priority);
  }

  // Método para buscar alertas por tipo de conservação
  async getAlertsByConservation(clientId: string, conservationType: 'ambiente' | 'refrigerado' | 'congelado'): Promise<AlertProduct[]> {
    const alertsData = await this.getAlertsData(clientId);
    const allAlerts = [
      ...alertsData.expired,
      ...alertsData.expiring7Days,
      ...alertsData.expiring30Days
    ];
    
    return allAlerts.filter(alert => alert.conservationType === conservationType);
  }
}

export const alertsService = new AlertsService();
