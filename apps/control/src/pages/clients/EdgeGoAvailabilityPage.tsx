import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { devicesService } from '../../services/api';
import type { EdgeGoDevice } from '../../types/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ChartLineUp, ArrowLeft, Calendar } from '@phosphor-icons/react';
import { useClient } from '../../hooks/useClients';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

type PeriodType = '24h' | '7d' | '30d';

// Helper para garantir conversão correta de data UTC para Date object
const parseDateUTC = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  
  let isoString: string;
  
  // Se já for Date object, usar toISOString() para garantir UTC
  if (dateValue instanceof Date) {
    isoString = dateValue.toISOString();
  } else if (typeof dateValue === 'string') {
    // Garantir que seja tratada como UTC
    let dateStr = dateValue.trim();
    
    // Se não tem timezone, assumir UTC
    if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.match(/-\d{2}:\d{2}$/)) {
      dateStr = dateStr + 'Z';
    }
    
    // Criar Date temporário para obter ISO string
    const tempDate = new Date(dateStr);
    if (isNaN(tempDate.getTime())) {
      console.warn('Não foi possível parsear data:', dateValue);
      return null;
    }
    isoString = tempDate.toISOString();
  } else {
    console.warn('Tipo de data não suportado:', typeof dateValue, dateValue);
    return null;
  }
  
  // Parsear a ISO string e criar Date usando componentes UTC explicitamente
  // Formato: 2025-11-19T22:20:07.247Z
  const match = isoString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?Z$/);
  if (match) {
    const [, year, month, day, hour, minute, second, millisecond] = match;
    return new Date(Date.UTC(
      parseInt(year, 10),
      parseInt(month, 10) - 1, // Month é 0-indexed
      parseInt(day, 10),
      parseInt(hour, 10),
      parseInt(minute, 10),
      parseInt(second, 10),
      millisecond ? parseInt(millisecond, 10) : 0
    ));
  }
  
  // Fallback: criar Date normalmente (deve funcionar se a string estiver correta)
  return new Date(isoString);
};

export function EdgeGoAvailabilityPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<PeriodType>('7d');
  
  const { data: client, isLoading: clientLoading, error: clientError } = useClient(id || '');
  const { data: devices = [], isLoading: devicesLoading, error: devicesError } = useQuery({
    queryKey: ['edge-go-devices', id],
    queryFn: () => devicesService.getEdgeGoByClient(id!),
    enabled: !!id,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Buscar histórico de disponibilidade da API
  const { data: availabilityHistory, isLoading: availabilityLoading } = useQuery({
    queryKey: ['edge-go-availability', id, period],
    queryFn: () => {
      const intervalMinutes = period === '24h' ? 5 : period === '7d' ? 60 : 24 * 60;
      return devicesService.getEdgeGoAvailability(id!, period, intervalMinutes);
    },
    enabled: !!id,
    refetchInterval: 60000, // Atualizar a cada 1 minuto
  });

  // Calcular disponibilidade baseado no lastSeenAt
  const calculateAvailability = (device: EdgeGoDevice): number => {
    if (!device.lastSeenAt) return 0;
    
    let lastSeen = parseDateUTC(device.lastSeenAt);
    if (!lastSeen) return 0;
    
    // CORREÇÃO: Aplicar mesma correção de 3 horas que aplicamos na exibição
    // O backend está salvando horário local como UTC, então precisamos subtrair 3h
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
    if (!availabilityHistory || !availabilityHistory.intervals) {
      return [];
    }

    return availabilityHistory.intervals.map((interval) => {
      const intervalStart = new Date(interval.intervalStart);
      
      let label = '';
      if (period === '24h') {
        label = intervalStart.toLocaleTimeString('pt-BR', { 
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else if (period === '7d') {
        label = intervalStart.toLocaleDateString('pt-BR', { 
          timeZone: 'America/Sao_Paulo',
          day: '2-digit', 
          month: '2-digit' 
        }) + ' ' +
        intervalStart.toLocaleTimeString('pt-BR', { 
          timeZone: 'America/Sao_Paulo',
          hour: '2-digit' 
        });
      } else {
        label = intervalStart.toLocaleDateString('pt-BR', { 
          timeZone: 'America/Sao_Paulo',
          day: '2-digit', 
          month: '2-digit' 
        });
      }
      
      return {
        label,
        disponibilidade: Math.round(interval.availability),
        timestamp: intervalStart.getTime(),
        date: intervalStart,
      };
    });
  };

  const chartData = generateChartData();
  const avgAvailability = availabilityHistory && availabilityHistory.intervals.length > 0
    ? Math.round(
        availabilityHistory.intervals.reduce((sum, d) => sum + d.availability, 0) / 
        availabilityHistory.intervals.length
      )
    : chartData.length > 0
    ? Math.round(chartData.reduce((sum, d) => sum + d.disponibilidade, 0) / chartData.length)
    : 0;

  const onlineNow = devices.filter(d => calculateAvailability(d) > 0).length;
  const offlineNow = devices.length - onlineNow;

  if (!id) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/clients')}
            className="h-8 w-8"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ID do cliente não encontrado</h1>
          </div>
        </div>
      </div>
    );
  }

  if (clientLoading || devicesLoading || availabilityLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/clients/${id}`)}
            className="h-8 w-8"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Carregando...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (clientError || devicesError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/clients/${id}`)}
            className="h-8 w-8"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Erro ao carregar dados</h1>
            <p className="text-gray-600">{client?.businessName || client?.fullName}</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-500">
              <p className="font-medium">Erro ao carregar dispositivos Edge-Go</p>
              <p className="text-sm mt-2">
                {devicesError instanceof Error ? devicesError.message : 'Erro desconhecido'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/clients/${id}`)}
            className="h-8 w-8"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Disponibilidade Edge-Go</h1>
            <p className="text-gray-600">{client?.businessName || client?.fullName || 'Cliente'}</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Status dos Dispositivos</CardTitle>
          </CardHeader>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="mb-4">
                <ChartLineUp size={48} className="mx-auto text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum dispositivo Edge-Go encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                Este cliente ainda não possui dispositivos Edge-Go cadastrados ou conectados.
              </p>
              <p className="text-sm text-gray-500">
                Cliente ID: {id}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/clients/${id}`)}
            className="h-8 w-8"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Disponibilidade Edge-Go</h1>
            <p className="text-gray-600">{client?.businessName || client?.fullName}</p>
          </div>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total de Dispositivos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{devices.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Online Agora</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{onlineNow}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Offline Agora</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{offlineNow}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Média do Período</p>
              <p className="text-3xl font-bold text-primary-600 mt-2">{avgAvailability}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ChartLineUp size={20} />
              Gráfico de Disponibilidade
            </CardTitle>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              <div className="flex gap-2">
                {(['24h', '7d', '30d'] as PeriodType[]).map((p) => (
                  <Button
                    key={p}
                    variant={period === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPeriod(p)}
                  >
                    {p === '24h' ? '24 Horas' : p === '7d' ? '7 Dias' : '30 Dias'}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Período: {period === '24h' ? 'Últimas 24 horas (intervalos de 5 minutos)' : period === '7d' ? 'Últimos 7 dias (intervalos de 1 hora)' : 'Últimos 30 dias (intervalos diários)'}
            </div>
            
            {/* Gráfico Recharts */}
            {chartData.length > 0 ? (
              <div className="w-full" style={{ height: '400px', minHeight: '400px' }}>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart 
                    data={chartData} 
                    margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
                  >
                    <defs>
                      <linearGradient id="colorDisponibilidade" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="label" 
                      stroke="#6b7280"
                      fontSize={11}
                      tick={{ fill: '#6b7280' }}
                      angle={period === '30d' ? -45 : period === '7d' ? -30 : -45}
                      textAnchor="end"
                      height={60}
                      interval={period === '24h' ? Math.floor(chartData.length / 12) : period === '7d' ? Math.floor(chartData.length / 12) : Math.floor(chartData.length / 10)}
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
                        padding: '8px 12px'
                      }}
                      formatter={(value) => [`${typeof value === 'number' ? value : 0}%`, 'Disponibilidade']}
                      labelStyle={{ color: '#374151', fontWeight: 600 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="disponibilidade" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorDisponibilidade)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-500">
                Sem dados para exibir no gráfico
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista Detalhada de Dispositivos */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos Dispositivos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {devices.map((device) => {
              const availability = calculateAvailability(device);
              const statusColor = availability === 100 ? 'bg-green-500' : availability > 0 ? 'bg-yellow-500' : 'bg-red-500';
              const statusText = availability === 100 ? 'Online' : availability > 0 ? 'Parcial' : 'Offline';
              
              // Usar helper para garantir conversão correta
              const lastSeenDate = parseDateUTC(device.lastSeenAt);
              
              const diffMinutes = lastSeenDate 
                ? Math.round((Date.now() - lastSeenDate.getTime()) / (1000 * 60))
                : null;
              
              return (
                <div key={device.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full ${statusColor}`}></span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {device.name || device.deviceId}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">{device.deviceId}</p>
                      </div>
                    </div>
                    {device.lastSeenAt && lastSeenDate && (
                      <div className="mt-2 text-xs text-gray-600">
                        <p>
                          Último visto: {(() => {
                            // CORREÇÃO TEMPORÁRIA: O backend está salvando horário local como UTC
                            // Subtrair 3 horas para compensar (UTC-3 = São Paulo)
                            const correctedDate = new Date(lastSeenDate.getTime() - (3 * 60 * 60 * 1000));
                            
                            const formatter = new Intl.DateTimeFormat('pt-BR', {
                              timeZone: 'America/Sao_Paulo',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            });
                            return formatter.format(correctedDate);
                          })()}
                        </p>
                        {diffMinutes !== null && diffMinutes >= 0 && (
                          <p>
                            {diffMinutes < 60 
                              ? `Há ${diffMinutes} minuto(s)` 
                              : diffMinutes < 1440
                              ? `Há ${Math.round(diffMinutes / 60)} hora(s)`
                              : `Há ${Math.round(diffMinutes / 1440)} dia(s)`
                            }
                          </p>
                        )}
                        {device.lastIpAddress && (
                          <p>IP: {device.lastIpAddress}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      availability === 100 
                        ? 'bg-green-100 text-green-800' 
                        : availability > 0 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {statusText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

