import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  MagnifyingGlass, 
  Gear, 
  Users, 
  Shield, 
  Bell,
  Palette,
  Database,
  Key,
  Eye,
  PencilSimple,
  Trash,
  User as UserIcon,
  EnvelopeSimple,
  Phone,
  Calendar,
  Crown,
  UserCheck,
  UserMinus,
  Clock
} from '@phosphor-icons/react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import type { User } from '../types';

// Mock data de usuários
const mockUsers: User[] = [
  {
    id: 'user_1',
    name: 'Ana Costa',
    email: 'ana.costa@granobox.com.br',
    avatar: undefined,
    role: 'admin',
    status: 'active',
    department: 'management',
    phone: '(11) 99999-0001',
    permissions: [],
    lastLogin: new Date('2024-01-28T09:30:00'),
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-01-28'),
    createdBy: 'system'
  },
  {
    id: 'user_2',
    name: 'Carlos Mendes',
    email: 'carlos.mendes@granobox.com.br',
    avatar: undefined,
    role: 'support',
    status: 'active',
    department: 'support',
    phone: '(11) 99999-0002',
    permissions: [],
    lastLogin: new Date('2024-01-28T14:15:00'),
    createdAt: new Date('2023-02-20'),
    updatedAt: new Date('2024-01-28'),
    createdBy: 'user_1'
  },
  {
    id: 'user_3',
    name: 'Fernanda Silva',
    email: 'fernanda.silva@granobox.com.br',
    avatar: undefined,
    role: 'sales',
    status: 'active',
    department: 'sales',
    phone: '(11) 99999-0003',
    permissions: [],
    lastLogin: new Date('2024-01-27T16:45:00'),
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2024-01-27'),
    createdBy: 'user_1'
  },
  {
    id: 'user_4',
    name: 'Pedro Santos',
    email: 'pedro.santos@granobox.com.br',
    avatar: undefined,
    role: 'manager',
    status: 'active',
    department: 'operations',
    phone: '(11) 99999-0004',
    permissions: [],
    lastLogin: new Date('2024-01-28T11:20:00'),
    createdAt: new Date('2023-04-05'),
    updatedAt: new Date('2024-01-28'),
    createdBy: 'user_1'
  },
  {
    id: 'user_5',
    name: 'Maria Oliveira',
    email: 'maria.oliveira@granobox.com.br',
    avatar: undefined,
    role: 'viewer',
    status: 'inactive',
    department: 'finance',
    phone: '(11) 99999-0005',
    permissions: [],
    lastLogin: new Date('2024-01-20T10:00:00'),
    createdAt: new Date('2023-05-15'),
    updatedAt: new Date('2024-01-25'),
    createdBy: 'user_1'
  },
  {
    id: 'user_6',
    name: 'João Ferreira',
    email: 'joao.ferreira@granobox.com.br',
    avatar: undefined,
    role: 'sales',
    status: 'pending',
    department: 'sales',
    phone: '(11) 99999-0006',
    permissions: [],
    lastLogin: undefined,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
    createdBy: 'user_1'
  }
];

type SettingsTab = 'users' | 'roles' | 'notifications' | 'appearance' | 'integrations' | 'security';

export function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState(mockUsers);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'active':
        return 'bg-primary-100 text-primary-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-warning-100 text-warning-800';
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
        return 'text-gray-900 bg-gray-200'; // Admin em destaque
      case 'manager':
        return 'text-primary-700 bg-primary-100';
      case 'support':
        return 'text-gray-700 bg-gray-100';
      case 'sales':
        return 'text-primary-600 bg-primary-50';
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

  const handleViewUser = (user: User) => {
    navigate(`/settings/users/${user.id}`);
  };

  const handleEditUser = (user: User) => {
    navigate(`/settings/users/${user.id}/edit`);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      setUsers(prev => prev.filter(user => user.id !== userId));
    }
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ));
  };

  const tabs = [
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'roles', label: 'Roles & Permissões', icon: Shield },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'integrations', label: 'Integrações', icon: Database },
    { id: 'security', label: 'Segurança', icon: Key },
  ];

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    pendingUsers: users.filter(u => u.status === 'pending').length,
    inactiveUsers: users.filter(u => u.status === 'inactive').length,
    adminUsers: users.filter(u => u.role === 'admin').length,
    onlineUsers: users.filter(u => u.lastLogin && 
      (new Date().getTime() - u.lastLogin.getTime()) < 24 * 60 * 60 * 1000
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-gray-600">
            Gerencie usuários, permissões e configurações do sistema.
          </p>
        </div>
        {activeTab === 'users' && (
          <Button onClick={() => navigate('/settings/users/new')}>
            <Plus size={16} className="mr-2" />
            Novo Usuário
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SettingsTab)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Users Tab Content */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-gray-600">
                  Todos os usuários cadastrados
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                <UserCheck className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary-600">{stats.activeUsers}</div>
                <p className="text-xs text-gray-600">
                  {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% do total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning-600">{stats.pendingUsers}</div>
                <p className="text-xs text-gray-600">
                  Aguardando ativação
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Online (24h)</CardTitle>
                <Crown className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary-600">{stats.onlineUsers}</div>
                <p className="text-xs text-gray-600">
                  Logaram nas últimas 24h
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>
                Use os filtros abaixo para encontrar usuários específicos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1 max-w-sm">
                  <MagnifyingGlass 
                    size={16} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" 
                  />
                  <Input
                    placeholder="Buscar por nome, email, departamento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="pending">Pendente</option>
                </select>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                >
                  <option value="all">Todas as Roles</option>
                  <option value="admin">Administrador</option>
                  <option value="manager">Gerente</option>
                  <option value="support">Suporte</option>
                  <option value="sales">Vendas</option>
                  <option value="viewer">Visualizador</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Usuários ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Usuário</th>
                      <th className="text-left py-3 px-4 font-medium">Role</th>
                      <th className="text-left py-3 px-4 font-medium">Departamento</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Último Login</th>
                      <th className="text-left py-3 px-4 font-medium">Criado em</th>
                      <th className="text-right py-3 px-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-full">
                              <UserIcon size={16} className="text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-gray-600">{user.email}</div>
                              {user.phone && (
                                <div className="text-sm text-gray-500">{user.phone}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {getRoleText(user.role)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {getDepartmentText(user.department)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                            {getStatusText(user.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {user.lastLogin ? (
                            <div>
                              <div>{user.lastLogin.toLocaleDateString('pt-BR')}</div>
                              <div className="text-xs text-gray-500">
                                {user.lastLogin.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Nunca</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} className="text-gray-400" />
                            {user.createdAt.toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewUser(user)}
                              className="h-8 w-8"
                              title="Ver detalhes"
                            >
                              <Eye size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditUser(user)}
                              className="h-8 w-8"
                              title="Editar usuário"
                            >
                              <PencilSimple size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleStatus(user.id)}
                              className={`h-8 w-8 ${user.status === 'active' ? 'text-danger-600 hover:text-danger-700 hover:bg-danger-50' : 'text-primary-600 hover:text-primary-700 hover:bg-primary-50'}`}
                              title={user.status === 'active' ? 'Desativar usuário' : 'Ativar usuário'}
                            >
                              {user.status === 'active' ? <UserMinus size={14} /> : <UserCheck size={14} />}
                            </Button>
                            {user.role !== 'admin' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(user.id)}
                                className="h-8 w-8 text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                                title="Excluir usuário"
                              >
                                <Trash size={14} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Users className="mx-auto h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                      ? 'Nenhum usuário encontrado' 
                      : 'Nenhum usuário cadastrado'
                    }
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || statusFilter !== 'all' || roleFilter !== 'all'
                      ? 'Tente ajustar os filtros de busca.'
                      : 'Comece adicionando o primeiro usuário ao sistema.'
                    }
                  </p>
                  {!searchTerm && statusFilter === 'all' && roleFilter === 'all' && (
                    <Button onClick={() => navigate('/settings/users/new')}>
                      Adicionar Primeiro Usuário
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Other Tabs Placeholder */}
      {activeTab !== 'users' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gear size={20} />
              {tabs.find(tab => tab.id === activeTab)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Gear className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Em Desenvolvimento
              </h3>
              <p className="text-gray-500">
                Esta seção estará disponível em breve.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}