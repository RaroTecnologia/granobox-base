import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { devicesService } from '../services/api';
import type { EdgeGoDevice } from '../types/api';
import type { AvailabilityHistory } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { ChartLineUp, ArrowRight } from '@phosphor-icons/react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface EdgeGoAvailabilityChartProps {
  clientId: string;
}

export function EdgeGoAvailabilityChart({ clientId }: EdgeGoAvailabilityChartProps) {
  const navigate = useNavigate();
  
  // Buscar dispositivos
  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ['edge-go-devices', clientId],
    queryFn: () => devicesService.getEdgeGoByClient(clientId),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar histórico de disponibilidade da API (últimas 24h com intervalos de 5 minutos)
  const { data: availabilityHistory, isLoading: availabilityLoading, error: availabilityError } = useQuery<AvailabilityHistory>({
    queryKey: ['edge-go-availability', clientId, '24h'],
    queryFn: () => devicesService.getEdgeGoAvailability(clientId, '24h', 5),
    enabled: !!clientId,
    refetchInterval: 60000, // Atualizar a cada 1 minuto
    retry: (failureCount, error: any) => {
      // Não tentar novamente se for erro 401 (autenticação/autorização)
      if (error?.response?.status === 401) {
        return false;
      }
      // Para outros erros, tentar apenas 1 vez
      return failureCount < 1;
    },
  });

  // Debug: log para verificar o que está retornando
  if (availabilityError) {
    const errorStatus = (availabilityError as any)?.response?.status;
    const errorMessage = (availabilityError as any)?.response?.data?.message || 'Erro desconhecido';
    console.warn('Erro ao buscar disponibilidade:', {
      status: errorStatus,
      message: errorMessage,
      error: availabilityError,
    });
  }
  if (availabilityHistory) {
    console.log('Dados de disponibilidade:', {
      intervals: availabilityHistory.intervals?.length || 0,
      totalDevices: availabilityHistory.totalDevices,
    });
  }

  // Calcular disponibilidade atual baseado no lastSeenAt (para status "Online Agora")
  const calculateAvailability = (device: EdgeGoDevice): number => {
    if (!device.lastSeenAt) return 0;
    
    let lastSeen = new Date(device.lastSeenAt);
    // CORREÇÃO: Aplicar mesma correção de 3 horas que aplicamos na exibição
    lastSeen = new Date(lastSeen.getTime() - (3 * 60 * 60 * 1000));
    
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
    
    // Se foi visto nos últimos 5 minutos, está online (100%)
    // Se foi visto entre 5-30 minutos, está parcialmente disponível (50%)
    // Se foi visto há mais de 30 minutos, está offline (0%)
    if (diffMinutes <= 5) return 100;
    if (diffMinutes <= 30) return 50;
    return 0;
  };

  // Gerar dados para o gráfico a partir dos dados históricos da API
  const generateChartData = () => {
    if (!availabilityHistory || !availabilityHistory.intervals || availabilityHistory.intervals.length === 0) {
      return [];
    }

    return availabilityHistory.intervals.map((interval) => {
      const intervalStart = new Date(interval.intervalStart);
      
      // Formatar label: mostrar hora e minuto no timezone local
      const label = intervalStart.toLocaleTimeString('pt-BR', { 
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      return {
        hora: label,
        disponibilidade: Math.round(interval.availability), // Já vem calculado pela API (0-100%)
        timestamp: intervalStart.getTime(),
      };
    });
  };

  const chartData = generateChartData();
  const avgAvailability = availabilityHistory && availabilityHistory.intervals && availabilityHistory.intervals.length > 0
    ? Math.round(
        availabilityHistory.intervals.reduce((sum: number, d: { availability: number }) => sum + d.availability, 0) / 
        availabilityHistory.intervals.length
      )
    : 0;

  const isLoading = devicesLoading || availabilityLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartLineUp size={20} />
            Disponibilidade Edge-Go
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (devices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartLineUp size={20} />
            Disponibilidade Edge-Go
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Nenhum dispositivo Edge-Go encontrado para este cliente.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ChartLineUp size={20} />
            Disponibilidade Edge-Go
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/clients/${clientId}/edge-go`)}
          >
            Ver Detalhes
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Dispositivos</p>
              <p className="text-2xl font-bold text-gray-900">{devices.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Média 24h</p>
              <p className="text-2xl font-bold text-primary-600">{avgAvailability}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Online Agora</p>
              <p className="text-2xl font-bold text-green-600">
                {devices.filter(d => calculateAvailability(d) > 0).length}
              </p>
            </div>
          </div>

          {/* Debug: mostrar erro se houver */}
          {availabilityError && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              ⚠️ Erro ao carregar histórico: {availabilityError instanceof Error ? availabilityError.message : 'Erro desconhecido'}
            </div>
          )}

          {/* Debug: mostrar erro se houver */}
          {availabilityError && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              ⚠️ Erro ao carregar histórico: {availabilityError instanceof Error ? availabilityError.message : 'Erro desconhecido'}
            </div>
          )}

          {/* Gráfico - Últimas 24 horas (intervalos de 5 minutos) */}
          {chartData.length > 0 ? (
            <div className="w-full" style={{ height: '192px', minHeight: '192px' }}>
              <ResponsiveContainer width="100%" height={192}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDisponibilidade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="hora" 
                  stroke="#6b7280"
                  fontSize={11}
                  tick={{ fill: '#6b7280' }}
                  interval={Math.floor(chartData.length / 12)} // Mostrar aproximadamente 12 labels
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tick={{ fill: '#6b7280' }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                  formatter={(value) => [`${typeof value === 'number' ? value : 0}%`, 'Disponibilidade']}
                />
                <Area 
                  type="monotone" 
                  dataKey="disponibilidade" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorDisponibilidade)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
              Sem dados para exibir
            </div>
          )}

          {/* Lista de dispositivos */}
          <div className="space-y-2 mt-4">
            <p className="text-sm font-medium text-gray-700">Dispositivos:</p>
            {devices.map((device) => {
              const availability = calculateAvailability(device);
              const statusColor = availability === 100 ? 'bg-green-500' : availability > 0 ? 'bg-yellow-500' : 'bg-red-500';
              const statusText = availability === 100 ? 'Online' : availability > 0 ? 'Parcial' : 'Offline';
              
              // Criar Date corretamente a partir do valor UTC que vem da API
              let lastSeenDate: Date | null = null;
              if (device.lastSeenAt) {
                if (device.lastSeenAt instanceof Date) {
                  lastSeenDate = device.lastSeenAt;
                } else {
                  // Se não for Date, tratar como string ou converter
                  const lastSeenValue: string | number | Date = device.lastSeenAt as any;
                  const dateStr = typeof lastSeenValue === 'string' 
                    ? (lastSeenValue.endsWith('Z') ? lastSeenValue : lastSeenValue + 'Z')
                    : String(lastSeenValue);
                  lastSeenDate = new Date(dateStr);
                }
              }
              
              return (
                <div key={device.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {device.name || device.deviceId}
                    </p>
                    {lastSeenDate && (
                      <p className="text-xs text-gray-500">
                        Último visto: {lastSeenDate.toLocaleString('pt-BR', { 
                          timeZone: 'America/Sao_Paulo',
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
                    <span className="text-sm text-gray-600">{statusText}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
