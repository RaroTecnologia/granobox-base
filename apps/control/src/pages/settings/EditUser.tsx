import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User as UserIcon, Shield, EnvelopeSimple, Phone, Building } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import type { User, Permission, CreateUserForm } from '../../types';

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

// Mock data de permissões disponíveis
const mockPermissions: Permission[] = [
  {
    id: 'perm_clients_all',
    name: 'Gerenciar Clientes',
    description: 'Criar, editar, visualizar e excluir clientes',
    module: 'clients',
    actions: ['create', 'read', 'update', 'delete']
  },
  {
    id: 'perm_clients_read',
    name: 'Visualizar Clientes',
    description: 'Apenas visualizar informações dos clientes',
    module: 'clients',
    actions: ['read']
  },
  {
    id: 'perm_equipment_all',
    name: 'Gerenciar Equipamentos',
    description: 'Controle completo sobre equipamentos em comodato',
    module: 'equipment',
    actions: ['create', 'read', 'update', 'delete']
  },
  {
    id: 'perm_support_all',
    name: 'Gerenciar Suporte',
    description: 'Criar, editar e resolver tickets de suporte',
    module: 'support',
    actions: ['create', 'read', 'update', 'delete']
  },
  {
    id: 'perm_billing_all',
    name: 'Gerenciar Cobrança',
    description: 'Controle completo sobre faturas e pagamentos',
    module: 'billing',
    actions: ['create', 'read', 'update', 'delete', 'export']
  },
  {
    id: 'perm_billing_read',
    name: 'Visualizar Cobrança',
    description: 'Apenas visualizar faturas e relatórios financeiros',
    module: 'billing',
    actions: ['read', 'export']
  },
  {
    id: 'perm_reports_all',
    name: 'Acessar Relatórios',
    description: 'Visualizar e exportar todos os relatórios',
    module: 'reports',
    actions: ['read', 'export']
  },
  {
    id: 'perm_settings_all',
    name: 'Gerenciar Configurações',
    description: 'Controle completo sobre configurações do sistema',
    module: 'settings',
    actions: ['create', 'read', 'update', 'delete']
  }
];

export function EditUser() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // TODO: Buscar usuário da API usando o ID
  const user = mockUser;

  const [formData, setFormData] = useState<CreateUserForm>({
    name: '',
    email: '',
    role: 'viewer',
    department: undefined,
    phone: '',
    permissions: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregar dados do usuário quando o componente montar
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone || '',
        permissions: user.permissions.map(p => p.id)
      });
    }
  }, [user]);

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

  const handleChange = (field: keyof CreateUserForm, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handlePermissionToggle = (permissionId: string) => {
    const currentPermissions = formData.permissions || [];
    const isSelected = currentPermissions.includes(permissionId);
    
    if (isSelected) {
      handleChange('permissions', currentPermissions.filter(id => id !== permissionId));
    } else {
      handleChange('permissions', [...currentPermissions, permissionId]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.role) {
      newErrors.role = 'Role é obrigatória';
    }

    if (formData.phone && !/^[\d\s\(\)\-\+]+$/.test(formData.phone)) {
      newErrors.phone = 'Telefone inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Enviar dados para API
      console.log('Atualizando usuário:', { id: user.id, ...formData });
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirecionar para detalhes do usuário
      navigate(`/settings/users/${user.id}`);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const getRoleText = (role: string) => {
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

  const getDepartmentText = (department: string) => {
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

  const selectedPermissions = formData.permissions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/settings/users/${user.id}`)}
          className="h-8 w-8"
        >
          <ArrowLeft size={16} />
        </Button>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <UserIcon size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Usuário</h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-gray-600">{user.name}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                {getStatusText(user.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Informações Básicas */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Nome e Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <Input
                      type="text"
                      placeholder="Ex: João Silva"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <Input
                      type="email"
                      placeholder="joao@granobox.com.br"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Role e Departamento */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleChange('role', e.target.value)}
                      className={`w-full h-10 px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:border-primary-500 ${
                        errors.role ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={user.role === 'admin'} // Não permitir alterar role de admin
                    >
                      <option value="viewer">Visualizador</option>
                      <option value="sales">Vendas</option>
                      <option value="support">Suporte</option>
                      <option value="manager">Gerente</option>
                      <option value="admin">Administrador</option>
                    </select>
                    {errors.role && (
                      <p className="text-red-500 text-sm mt-1">{errors.role}</p>
                    )}
                    {user.role === 'admin' && (
                      <p className="text-yellow-600 text-sm mt-1">
                        Role de administrador não pode ser alterada
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Departamento
                    </label>
                    <select
                      value={formData.department || ''}
                      onChange={(e) => handleChange('department', e.target.value || undefined)}
                      className="w-full h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
                    >
                      <option value="">Selecione um departamento</option>
                      <option value="sales">Vendas</option>
                      <option value="support">Suporte</option>
                      <option value="finance">Financeiro</option>
                      <option value="operations">Operações</option>
                      <option value="management">Gestão</option>
                    </select>
                  </div>
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <Input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Informações do Sistema */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Informações do Sistema</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">ID do Usuário:</span>
                      <span className="ml-2 font-mono">{user.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {getStatusText(user.status)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Criado em:</span>
                      <span className="ml-2">{user.createdAt.toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Último login:</span>
                      <span className="ml-2">
                        {user.lastLogin?.toLocaleDateString('pt-BR') || 'Nunca'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex items-center gap-4 pt-6">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/settings/users/${user.id}`)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Preview e Permissões */}
          <div className="space-y-6">
            {/* Preview do Usuário */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <UserIcon size={16} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{formData.name || 'Nome do usuário'}</p>
                      <p className="text-sm text-gray-600">{formData.email || 'email@exemplo.com'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-gray-400" />
                      <span className="text-sm">{getRoleText(formData.role)}</span>
                    </div>
                    
                    {formData.department && (
                      <div className="flex items-center gap-2">
                        <Building size={14} className="text-gray-400" />
                        <span className="text-sm">{getDepartmentText(formData.department)}</span>
                      </div>
                    )}
                    
                    {formData.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400" />
                        <span className="text-sm">{formData.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Permissões Personalizadas */}
            <Card>
              <CardHeader>
                <CardTitle>Permissões Personalizadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    Selecione permissões específicas além das padrão da role.
                  </p>
                  
                  {mockPermissions.map((permission) => (
                    <div key={permission.id} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={permission.id}
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={() => handlePermissionToggle(permission.id)}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <label htmlFor={permission.id} className="text-sm font-medium text-gray-900 cursor-pointer">
                          {permission.name}
                        </label>
                        <p className="text-xs text-gray-600">{permission.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                            {getModuleText(permission.module)}
                          </span>
                          <div className="flex gap-1">
                            {permission.actions.map((action) => (
                              <span key={action} className="px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                {getActionText(action)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
