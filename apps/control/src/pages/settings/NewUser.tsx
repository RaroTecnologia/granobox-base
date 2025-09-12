import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User as UserIcon, Shield, EnvelopeSimple, Phone, Building } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import type { CreateUserForm, Permission } from '../../types';

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

export function NewUser() {
  const navigate = useNavigate();
  
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
      console.log('Criando usuário:', formData);
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirecionar para configurações
      navigate('/settings');
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
    } finally {
      setIsSubmitting(false);
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
            <h1 className="text-3xl font-bold tracking-tight">Novo Usuário</h1>
            <p className="text-gray-600">
              Crie um novo usuário para acessar o sistema GranoBox Control.
            </p>
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

                {/* Botões */}
                <div className="flex items-center gap-4 pt-6">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-[120px]"
                  >
                    {isSubmitting ? 'Criando...' : 'Criar Usuário'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/settings')}
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
