import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  User as UserIcon, 
  Shield, 
  Calendar, 
  Clock,
  PencilSimple,
  EnvelopeSimple,
  Phone,
  Building,
  Crown,
  UserCheck,
  UserMinus,
  Key,
  Lightning,
  CheckCircle,
  XCircle
} from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import type { User, Permission } from '../../types';

// Mock data - mesmo usuário da listagem
const mockUser: User = {
  id: 'user_2',
  name: 'Carlos Mendes',
  email: 'carlos.mendes@granobox.com.br',
  avatar: undefined,
  role: 'support',
  status: 'active',
  department: 'support',
  phone: '(11) 99999-0002',
  permissions: [
    {
      id: 'perm_1',
      name: 'Gerenciar Tickets',
      description: 'Criar, editar e resolver tickets de suporte',
      module: 'support',
      actions: ['create', 'read', 'update']
    },
    {
      id: 'perm_2',
      name: 'Visualizar Clientes',
      description: 'Acessar informações dos clientes',
      module: 'clients',
      actions: ['read']
    },
    {
      id: 'perm_3',
      name: 'Gerenciar Equipamentos',
      description: 'Visualizar e atualizar status de equipamentos',
      module: 'equipment',
      actions: ['read', 'update']
    }
  ],
  lastLogin: new Date('2024-01-28T14:15:00'),
  createdAt: new Date('2023-02-20'),
  updatedAt: new Date('2024-01-28'),
  createdBy: 'user_1'
};

// Mock data de atividades recentes
const mockActivities = [
  {
    id: 'act_1',
    type: 'ticket_resolved',
    description: 'Resolveu ticket #S003 - Sistema não conecta com impressora',
    timestamp: new Date('2024-01-28T14:30:00'),
    module: 'support'
  },
  {
    id: 'act_2',
    type: 'client_updated',
    description: 'Atualizou informações do cliente Padaria Pão Dourado',
    timestamp: new Date('2024-01-28T11:15:00'),
    module: 'clients'
  },
  {
    id: 'act_3',
    type: 'equipment_maintenance',
    description: 'Marcou impressora GB-T200-003 para manutenção',
    timestamp: new Date('2024-01-27T16:45:00'),
    module: 'equipment'
  },
  {
    id: 'act_4',
    type: 'ticket_created',
    description: 'Criou ticket #S005 - Solicitação de treinamento',
    timestamp: new Date('2024-01-27T09:30:00'),
    module: 'support'
  },
  {
    id: 'act_5',
    type: 'login',
    description: 'Fez login no sistema',
    timestamp: new Date('2024-01-28T08:00:00'),
    module: 'system'
  }
];

export function UserDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // TODO: Buscar usuário da API usando o ID
  const user = mockUser;

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            className="h-8 w-8"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Usuário não encontrado</h1>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'inactive':
        return 'Inativo';
      case 'pending':
        return 'Pendente';
      default:
        return 'Desconhecido';
    }
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'text-red-600 bg-red-100';
      case 'manager':
        return 'text-purple-600 bg-purple-100';
      case 'support':
        return 'text-blue-600 bg-blue-100';
      case 'sales':
        return 'text-green-600 bg-green-100';
      case 'viewer':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleText = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'manager':
        return 'Gerente';
      case 'support':
        return 'Suporte';
      case 'sales':
        return 'Vendas';
      case 'viewer':
        return 'Visualizador';
      default:
        return 'Desconhecido';
    }
  };

  const getDepartmentText = (department?: User['department']) => {
    switch (department) {
      case 'sales':
        return 'Vendas';
      case 'support':
        return 'Suporte';
      case 'finance':
        return 'Financeiro';
      case 'operations':
        return 'Operações';
      case 'management':
        return 'Gestão';
      default:
        return 'Não definido';
    }
  };

  const getModuleText = (module: string) => {
    switch (module) {
      case 'clients':
        return 'Clientes';
      case 'equipment':
        return 'Equipamentos';
      case 'support':
        return 'Suporte';
      case 'billing':
        return 'Cobrança';
      case 'vouchers':
        return 'Vouchers';
      case 'reports':
        return 'Relatórios';
      case 'settings':
        return 'Configurações';
      case 'system':
        return 'Sistema';
      default:
        return module;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'create':
        return 'Criar';
      case 'read':
        return 'Visualizar';
      case 'update':
        return 'Editar';
      case 'delete':
        return 'Excluir';
      case 'export':
        return 'Exportar';
      default:
        return action;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'ticket_resolved':
      case 'ticket_created':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'client_updated':
        return <UserIcon size={16} className="text-blue-600" />;
      case 'equipment_maintenance':
        return <Lightning size={16} className="text-orange-600" />;
      case 'login':
        return <Clock size={16} className="text-gray-600" />;
      default:
        return <Lightning size={16} className="text-gray-600" />;
    }
  };

  const handleToggleStatus = () => {
    // TODO: Implementar toggle de status via API
    console.log('Alterando status do usuário:', user.id);
  };

  const handleResetPassword = () => {
    // TODO: Implementar reset de senha via API
    console.log('Resetando senha do usuário:', user.id);
  };

  const daysSinceCreated = Math.floor((new Date().getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceLastLogin = user.lastLogin 
    ? Math.floor((new Date().getTime() - user.lastLogin.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            className="h-8 w-8"
          >
            <ArrowLeft size={16} />
          </Button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserIcon size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                  {getStatusText(user.status)}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                  {getRoleText(user.role)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleResetPassword}>
            <Key size={16} className="mr-2" />
            Resetar Senha
          </Button>
          <Button 
            variant="outline" 
            onClick={handleToggleStatus}
            className={user.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
          >
            {user.status === 'active' ? (
              <>
                <UserMinus size={16} className="mr-2" />
                Desativar
              </>
            ) : (
              <>
                <UserCheck size={16} className="mr-2" />
                Ativar
              </>
            )}
          </Button>
          <Button onClick={() => navigate(`/settings/users/${user.id}/edit`)}>
            <PencilSimple size={16} className="mr-2" />
            Editar Usuário
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Membro há</p>
                <p className="text-lg font-bold">
                  {daysSinceCreated} {daysSinceCreated === 1 ? 'dia' : 'dias'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock size={16} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Último Login</p>
                <p className="text-lg font-bold">
                  {daysSinceLastLogin !== null 
                    ? `${daysSinceLastLogin} ${daysSinceLastLogin === 1 ? 'dia' : 'dias'} atrás`
                    : 'Nunca'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Permissões</p>
                <p className="text-lg font-bold">{user.permissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Building size={16} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Departamento</p>
                <p className="text-lg font-bold">{getDepartmentText(user.department)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informações Pessoais */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Nome Completo</label>
                  <p className="text-gray-900">{user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Role</label>
                  <p className="text-gray-900">{getRoleText(user.role)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <div className="flex items-center gap-2">
                    <EnvelopeSimple size={16} className="text-gray-400" />
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Telefone</label>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <p className="text-gray-900">{user.phone || 'Não informado'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Departamento</label>
                  <p className="text-gray-900">{getDepartmentText(user.department)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                    {getStatusText(user.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Criado em</label>
                  <p className="text-gray-900">{user.createdAt.toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Última Atualização</label>
                  <p className="text-gray-900">{user.updatedAt.toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissões */}
          <Card>
            <CardHeader>
              <CardTitle>Permissões do Usuário</CardTitle>
            </CardHeader>
            <CardContent>
              {user.permissions.length > 0 ? (
                <div className="space-y-4">
                  {user.permissions.map((permission) => (
                    <div key={permission.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{permission.name}</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {getModuleText(permission.module)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{permission.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {permission.actions.map((action) => (
                          <span key={action} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {getActionText(action)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma permissão específica
                  </h3>
                  <p className="text-gray-500">
                    Este usuário herda permissões padrão da sua role.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Atividade Recente */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="p-1 rounded-full bg-gray-100 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {activity.timestamp.toLocaleDateString('pt-BR')} às {activity.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {getModuleText(activity.module)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">ID do Usuário:</span>
                <span className="font-mono text-sm">{user.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Criado por:</span>
                <span className="text-sm">{user.createdBy || 'Sistema'}</span>
              </div>
              {user.lastLogin && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Último Login:</span>
                  <span className="text-sm">
                    {user.lastLogin.toLocaleDateString('pt-BR')} às {user.lastLogin.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => navigate(`/settings/users/${user.id}/edit`)}
              >
                <PencilSimple size={16} className="mr-2" />
                Editar Usuário
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleResetPassword}
              >
                <Key size={16} className="mr-2" />
                Resetar Senha
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                className={`w-full ${user.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                onClick={handleToggleStatus}
              >
                {user.status === 'active' ? (
                  <>
                    <UserMinus size={16} className="mr-2" />
                    Desativar Usuário
                  </>
                ) : (
                  <>
                    <UserCheck size={16} className="mr-2" />
                    Ativar Usuário
                  </>
                )}
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/settings/users/new')}
              >
                <Crown size={16} className="mr-2" />
                Criar Novo Usuário
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
