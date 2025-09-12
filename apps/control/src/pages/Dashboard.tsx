import { 
  ChartLineUp, 
  Users, 
  Building,
  CreditCard,
  TrendUp,
  Wrench,
  GraduationCap,
  HeadsetIcon,
  Calendar,
  Clock,
  User
} from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

export function Dashboard() {
  // Mock data baseado no contexto real do GranoBox
  const stats = {
    totalClients: 847,
    activeClients: 723,
    prospects: 89,
    businessClients: 634,
    individualClients: 213,
    monthlyRevenue: 127450.80,
    equipmentRevenue: 45320.50,
    activeEquipment: 1247,
    supportTickets: {
      open: 12,
      resolved: 156,
      avgResolutionTime: 4.2, // horas
    },
    trainings: {
      completed: 89,
      scheduled: 23,
      completionRate: 94.5,
    },
    growthRate: 18.3,
  };

  const recentActivity = [
    {
      id: 1,
      type: 'client',
      message: 'Nova padaria ativada: Pão Dourado - Vila Madalena',
      time: '5 minutos atrás',
      icon: Building,
      color: 'text-blue-600',
    },
    {
      id: 2,
      type: 'equipment',
      message: 'Equipamento GB-T200 instalado no Restaurante Sabor & Arte',
      time: '23 minutos atrás',
      icon: Wrench,
      color: 'text-green-600',
    },
    {
      id: 3,
      type: 'support',
      message: 'Ticket #1247 resolvido - Problema na impressão',
      time: '1 hora atrás',
      icon: HeadsetIcon,
      color: 'text-purple-600',
    },
    {
      id: 4,
      type: 'training',
      message: 'Treinamento concluído: Hotel Estrela do Sul',
      time: '2 horas atrás',
      icon: GraduationCap,
      color: 'text-orange-600',
    },
    {
      id: 5,
      type: 'billing',
      message: 'Pagamento recebido: R$ 299,90 - Padaria Central',
      time: '3 horas atrás',
      icon: CreditCard,
      color: 'text-emerald-600',
    },
  ];

  const businessTypeStats = [
    { type: 'Padarias', count: 312, percentage: 49.2, color: 'bg-primary-100 text-primary-800' },
    { type: 'Restaurantes', count: 189, percentage: 29.8, color: 'bg-gray-100 text-gray-800' },
    { type: 'Hotéis', count: 78, percentage: 12.3, color: 'bg-gray-200 text-gray-800' },
    { type: 'Confeitarias', count: 55, percentage: 8.7, color: 'bg-gray-100 text-gray-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard GranoBox</h1>
        <p className="text-gray-600">
          Visão geral dos clientes, equipamentos e operações do GranoBox.
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients.toLocaleString()}</div>
            <p className="text-xs text-gray-600">
              <TrendUp className="inline h-3 w-3 mr-1" />
              +{stats.growthRate}% este mês
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <ChartLineUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-600">{stats.activeClients.toLocaleString()}</div>
            <p className="text-xs text-gray-600">
              {((stats.activeClients / stats.totalClients) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => window.location.href = '/billing'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <CreditCard className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-600">
              R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-600">
              <TrendUp className="inline h-3 w-3 mr-1" />
              +15.2% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipamentos Ativos</CardTitle>
            <Wrench className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEquipment.toLocaleString()}</div>
            <p className="text-xs text-gray-600">
              R$ {stats.equipmentRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em comodato
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client Types & Support Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tipos de Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building size={16} className="text-blue-600" />
                  <span className="text-sm">Pessoa Jurídica</span>
                </div>
                <span className="font-bold">{stats.businessClients}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-green-600" />
                  <span className="text-sm">Pessoa Física</span>
                </div>
                <span className="font-bold">{stats.individualClients}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-orange-600" />
                  <span className="text-sm">Prospects</span>
                </div>
                <span className="font-bold text-blue-600">{stats.prospects}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => window.location.href = '/support'}>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Suporte Técnico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Tickets Abertos</span>
                <span className="font-bold text-orange-600">{stats.supportTickets.open}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Resolvidos (mês)</span>
                <span className="font-bold text-green-600">{stats.supportTickets.resolved}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tempo Médio</span>
                <span className="font-bold">{stats.supportTickets.avgResolutionTime}h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Treinamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Concluídos (mês)</span>
                <span className="font-bold text-green-600">{stats.trainings.completed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Agendados</span>
                <span className="font-bold text-blue-600">{stats.trainings.scheduled}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Taxa de Conclusão</span>
                <span className="font-bold">{stats.trainings.completionRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Types Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Tipo de Estabelecimento</CardTitle>
          <CardDescription>
            Clientes pessoa jurídica por segmento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {businessTypeStats.map((stat) => (
              <div key={stat.type} className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stat.color} mb-2`}>
                  {stat.type}
                </div>
                <div className="text-2xl font-bold">{stat.count}</div>
                <div className="text-sm text-gray-600">{stat.percentage}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>
            Últimas atividades do sistema GranoBox
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg bg-gray-100 ${activity.color}`}>
                  <activity.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <Clock size={12} />
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}