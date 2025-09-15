import { useState, useEffect } from 'react';
import { 
  Building, 
  Users, 
  Tag, 
  CheckCircle, 
  Warning, 
  XCircle,
  ArrowUp
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { subscriptionsService } from '../services/subscriptionsService';

interface PlanLimitsProps {
  clientId: string;
}

interface LimitsData {
  plan: {
    name: string;
    type: string;
    maxOperations: number;
    maxLabelsPerMonth: number;
    maxUsers: number;
  };
  usage: {
    operations: number;
    users: number;
    labelsThisMonth: number;
  };
  available: {
    operations: number;
    users: number;
    labelsThisMonth: number;
  };
}

export function PlanLimits({ clientId }: PlanLimitsProps) {
  const [limits, setLimits] = useState<LimitsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLimits();
  }, [clientId]);

  const loadLimits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await subscriptionsService.getClientLimits(clientId);
      setLimits(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar limites do plano';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getUsagePercentage = (used: number, max: number) => {
    return Math.round((used / max) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getUsageIcon = (percentage: number) => {
    if (percentage >= 90) return <XCircle size={16} className="text-red-600" />;
    if (percentage >= 70) return <Warning size={16} className="text-yellow-600" />;
    return <CheckCircle size={16} className="text-green-600" />;
  };

  const getPlanTypeLabel = (type: string) => {
    switch (type) {
      case 'basic':
        return 'Básico';
      case 'professional':
        return 'Profissional';
      case 'enterprise':
        return 'Enterprise';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <XCircle size={48} className="mx-auto text-red-500 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadLimits}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!limits) {
    return null;
  }

  const limitsData = [
    {
      icon: Building,
      label: 'Operações',
      used: limits.usage.operations,
      max: limits.plan.maxOperations,
      available: limits.available.operations,
    },
    {
      icon: Users,
      label: 'Usuários',
      used: limits.usage.users,
      max: limits.plan.maxUsers,
      available: limits.available.users,
    },
    {
      icon: Tag,
      label: 'Etiquetas/Mês',
      used: limits.usage.labelsThisMonth,
      max: limits.plan.maxLabelsPerMonth,
      available: limits.available.labelsThisMonth,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUp size={20} className="text-primary-600" />
          Limites do Plano - {limits.plan.name} ({getPlanTypeLabel(limits.plan.type)})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {limitsData.map((item, index) => {
          const percentage = getUsagePercentage(item.used, item.max);
          const colorClass = getUsageColor(percentage);
          const icon = getUsageIcon(percentage);

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <item.icon size={16} className="text-gray-600" />
                  <span className="font-medium text-gray-900">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {icon}
                  <span className="text-sm font-medium">
                    {item.used} / {item.max}
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    percentage >= 90 ? 'bg-red-500' :
                    percentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className={`px-2 py-1 rounded-full font-medium ${colorClass}`}>
                  {percentage}% usado
                </span>
                <span className="text-gray-600">
                  {item.available} disponível{item.available !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          );
        })}

        {/* Alertas */}
        {limitsData.some(item => getUsagePercentage(item.used, item.max) >= 90) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <XCircle size={16} className="text-red-600" />
              <span className="text-red-800 font-medium">Limite Crítico</span>
            </div>
            <p className="text-red-700 text-sm mt-1">
              Alguns limites estão próximos do máximo. Considere fazer upgrade do plano.
            </p>
          </div>
        )}

        {limitsData.some(item => getUsagePercentage(item.used, item.max) >= 70 && getUsagePercentage(item.used, item.max) < 90) && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Warning size={16} className="text-yellow-600" />
              <span className="text-yellow-800 font-medium">Atenção</span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              Alguns limites estão se aproximando do máximo permitido.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PlanLimitsProps {
  clientId: string;
}

interface LimitsData {
  plan: {
    name: string;
    type: string;
    maxOperations: number;
    maxLabelsPerMonth: number;
    maxUsers: number;
  };
  usage: {
    operations: number;
    users: number;
    labelsThisMonth: number;
  };
  available: {
    operations: number;
    users: number;
    labelsThisMonth: number;
  };
}


