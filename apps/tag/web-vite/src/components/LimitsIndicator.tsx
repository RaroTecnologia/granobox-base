import { useState } from 'react';
import { Warning, XCircle, CheckCircle, Info, X } from '@phosphor-icons/react';
import { useLimits } from '../hooks/useLimits';

interface LimitsIndicatorProps {
  clientId: string;
  compact?: boolean;
}

export default function LimitsIndicator({ clientId, compact = true }: LimitsIndicatorProps) {
  const { limits, isLoading, error } = useLimits(clientId);
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading || error || !limits) {
    return null;
  }

  const { plan, usage, available } = limits;

  const limitsData = [
    {
      label: 'Operações',
      used: usage.operations,
      max: plan.maxOperations,
      available: available.operations,
      icon: '🏢',
    },
    {
      label: 'Etiquetas/Mês',
      used: usage.labelsThisMonth,
      max: plan.maxLabelsPerMonth,
      available: available.labelsThisMonth,
      icon: '🏷️',
    },
    {
      label: 'Usuários',
      used: usage.users,
      max: plan.maxUsers,
      available: available.users,
      icon: '👥',
    },
  ];

  const getStatusColor = (used: number, max: number) => {
    const percentage = (used / max) * 100;
    if (percentage >= 90) return 'text-red-500 bg-red-100';
    if (percentage >= 70) return 'text-yellow-500 bg-yellow-100';
    return 'text-green-500 bg-green-100';
  };

  const getStatusIcon = (used: number, max: number) => {
    const percentage = (used / max) * 100;
    if (percentage >= 90) return <XCircle size={16} className="text-red-500" />;
    if (percentage >= 70) return <Warning size={16} className="text-yellow-500" />;
    return <CheckCircle size={16} className="text-green-500" />;
  };

  const hasWarnings = limitsData.some(item => (item.used / item.max) * 100 >= 70);

  if (compact && !isExpanded) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsExpanded(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            hasWarnings 
              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
              : 'bg-green-100 text-green-800 hover:bg-green-200'
          }`}
        >
          {hasWarnings ? (
            <Warning size={16} className="text-yellow-600" />
          ) : (
            <CheckCircle size={16} className="text-green-600" />
          )}
          <span>Plano {plan.name}</span>
          <Info size={14} className="opacity-60" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Limites do Plano {plan.name}
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Plano {plan.type === 'basic' ? 'Básico' : plan.type === 'professional' ? 'Profissional' : 'Enterprise'}
          </p>
        </div>

        <div className="p-4 space-y-4">
          {limitsData.map((item, index) => {
            const percentage = Math.round((item.used / item.max) * 100);
            const colorClass = getStatusColor(item.used, item.max);
            const icon = getStatusIcon(item.used, item.max);

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
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
          {limitsData.some(item => (item.used / item.max) * 100 >= 90) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle size={16} className="text-red-600" />
                <span className="text-red-800 font-medium">Limite Crítico</span>
              </div>
              <p className="text-red-700 text-sm mt-1">
                Alguns limites estão próximos do máximo. Entre em contato para fazer upgrade do plano.
              </p>
            </div>
          )}

          {limitsData.some(item => {
            const percentage = (item.used / item.max) * 100;
            return percentage >= 70 && percentage < 90;
          }) && (
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
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setIsExpanded(false)}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
