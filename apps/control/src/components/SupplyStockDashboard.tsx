import { useState, useEffect } from 'react';
import { ArrowClockwise, Warning, CheckCircle } from '@phosphor-icons/react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { supplyStockService, type StockSummary, type DailyUsageStat } from '../services/supplyStockService';
import toast from 'react-hot-toast';

interface SupplyStockDashboardProps {
  clientId: string;
}

function AlertBadge({ summary }: { summary: StockSummary }) {
  if (summary.isCritical) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
        <Warning size={12} weight="fill" />
        Critico
      </span>
    );
  }
  if (summary.isLowStock) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">
        <Warning size={12} weight="fill" />
        Baixo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
      <CheckCircle size={12} weight="fill" />
      OK
    </span>
  );
}

function DaysProgressBar({ days, minDays }: { days: number | null; minDays: number }) {
  if (days === null) {
    return <div className="h-2 w-full rounded-full bg-gray-200" />;
  }

  // Map days to percentage: 0 days = 0%, 2x minDays = 100%
  const maxDays = minDays * 2;
  const percent = Math.min(100, Math.max(0, (days / maxDays) * 100));

  let color = 'bg-green-500';
  if (days <= 3) color = 'bg-red-500';
  else if (days <= minDays) color = 'bg-yellow-500';

  return (
    <div className="h-2 w-full rounded-full bg-gray-200">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function MiniChart({ data }: { data: DailyUsageStat[] }) {
  if (data.length === 0) {
    return <div className="text-xs text-gray-400 py-4 text-center">Sem dados de consumo</div>;
  }

  const maxUsage = Math.max(...data.map((d) => d.labelsUsed), 1);
  const barWidth = Math.max(4, Math.floor(100 / data.length));

  return (
    <div className="flex items-end gap-px h-16 px-1">
      {data.map((d) => {
        const height = Math.max(2, (d.labelsUsed / maxUsage) * 100);
        return (
          <div
            key={d.date}
            className="bg-primary-400 rounded-t-sm hover:bg-primary-600 transition-colors"
            style={{ height: `${height}%`, width: `${barWidth}%`, minWidth: '3px' }}
            title={`${d.date}: ${d.labelsUsed} etiq.`}
          />
        );
      })}
    </div>
  );
}

export function SupplyStockDashboard({ clientId }: SupplyStockDashboardProps) {
  const [summaries, setSummaries] = useState<StockSummary[]>([]);
  const [dailyStats, setDailyStats] = useState<Record<string, DailyUsageStat[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedKit, setExpandedKit] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await supplyStockService.getClientStockSummary(clientId);
      setSummaries(data);

      // Load daily stats for each kit
      const stats: Record<string, DailyUsageStat[]> = {};
      for (const kit of data) {
        try {
          stats[kit.kitId] = await supplyStockService.getDailyStats(clientId, kit.kitId);
        } catch {
          stats[kit.kitId] = [];
        }
      }
      setDailyStats(stats);
    } catch {
      toast.error('Erro ao carregar estoque');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clientId]);

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Carregando estoque...</div>;
  }

  if (summaries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        Nenhum kit de suprimentos configurado para este cliente.
      </div>
    );
  }

  const kitColorMap: Record<string, string> = {
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    purple: 'border-l-purple-500',
    orange: 'border-l-orange-500',
    red: 'border-l-red-500',
    pink: 'border-l-pink-500',
    teal: 'border-l-teal-500',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Dashboard de Estoque</h3>
        <Button variant="outline" size="sm" onClick={loadData}>
          <ArrowClockwise size={16} className="mr-1" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaries.map((summary) => (
          <Card
            key={summary.kitId}
            className={`border-l-4 ${kitColorMap[summary.kitColor] || 'border-l-gray-500'} cursor-pointer hover:shadow-md transition-shadow`}
            onClick={() => setExpandedKit(expandedKit === summary.kitId ? null : summary.kitId)}
          >
            <CardContent className="pt-4">
              {/* Kit header */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{summary.kitName}</h4>
                <AlertBadge summary={summary} />
              </div>

              {/* Key metrics */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{summary.rollsInStock}</div>
                  <div className="text-xs text-gray-500">Rolos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {summary.estimatedDaysRemaining ?? '-'}
                  </div>
                  <div className="text-xs text-gray-500">Dias rest.</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {summary.avgDailyUsage > 0 ? Math.round(summary.avgDailyUsage) : '-'}
                  </div>
                  <div className="text-xs text-gray-500">Uso/dia</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-2">
                <DaysProgressBar days={summary.estimatedDaysRemaining} minDays={summary.minStockDays} />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Min: {summary.minStockDays} dias</span>
                  <span>Lead: {summary.leadTimeDays} dias</span>
                </div>
              </div>

              {/* Mini chart */}
              {dailyStats[summary.kitId] && (
                <div className="mt-3 border-t pt-2">
                  <div className="text-xs text-gray-500 mb-1">Consumo diario (30 dias)</div>
                  <MiniChart data={dailyStats[summary.kitId]} />
                </div>
              )}

              {/* Expanded: item details */}
              {expandedKit === summary.kitId && summary.items.length > 0 && (
                <div className="mt-3 border-t pt-3 space-y-2">
                  <div className="text-xs font-medium text-gray-500 uppercase">Itens do Kit</div>
                  {summary.items.map((item) => (
                    <div key={item.itemId} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div>
                        <span className="text-sm font-medium text-gray-800">{item.itemName}</span>
                        {item.isRibbon && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Ribbon</span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{item.rollsInStock} rolos</div>
                        <div className="text-xs text-gray-500">
                          {item.estimatedDaysRemaining !== null ? `${item.estimatedDaysRemaining} dias` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}

                  {summary.lastReplenishmentDate && (
                    <div className="text-xs text-gray-400 pt-1">
                      Ultima reposicao: {new Date(summary.lastReplenishmentDate).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
