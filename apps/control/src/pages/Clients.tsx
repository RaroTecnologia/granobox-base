import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MagnifyingGlass, PencilSimple, Trash, Building, User, Eye } from '@phosphor-icons/react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useClients, useDeleteClient } from '../hooks/useClients';
import type { ApiClient } from '../types/api';

export function Clients() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Hooks da API
  const { data: clients = [], isLoading, error } = useClients();
  const deleteClientMutation = useDeleteClient();

  const filteredClients = clients.filter(client => {
    // Nome principal para busca
    const mainName = client.clientType === 'individual' ? client.fullName : client.legalName;
    const businessName = client.businessName; // Nome fantasia
    const document = client.clientType === 'individual' ? client.cpf : client.cnpj;
    
    const matchesSearch = 
      (mainName && mainName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (businessName && businessName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      client.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (document && document.includes(searchTerm)) ||
      (client.legalName && client.legalName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesType = typeFilter === 'all' || client.clientType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: ApiClient['status']) => {
    switch (status) {
      case 'active':
        return 'bg-primary-100 text-primary-800';
      case 'prospect':
        return 'bg-gray-100 text-gray-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-warning-100 text-warning-800';
      case 'cancelled':
        return 'bg-danger-100 text-danger-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: ApiClient['status']) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'prospect':
        return 'Prospect';
      case 'inactive':
        return 'Inativo';
      case 'suspended':
        return 'Suspenso';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getBusinessTypeText = (type?: ApiClient['businessType']) => {
    switch (type) {
      case 'bakery':
        return 'Padaria';
      case 'restaurant':
        return 'Restaurante';
      case 'hotel':
        return 'Hotel';
      case 'confectionery':
        return 'Confeitaria';
      case 'supermarket':
        return 'Supermercado';
      case 'other':
        return 'Outro';
      default:
        return '-';
    }
  };

  const handleViewClient = (client: ApiClient) => {
    navigate(`/clients/${client.id}`);
  };

  const handleEditClient = (client: ApiClient) => {
    navigate(`/clients/${client.id}/edit`);
  };

  const handleDeleteClient = async (clientId: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await deleteClientMutation.mutateAsync(clientId);
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        // TODO: Mostrar toast de erro
      }
    }
  };

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    prospects: clients.filter(c => c.status === 'prospect').length,
    business: clients.filter(c => c.clientType === 'business').length,
    individual: clients.filter(c => c.clientType === 'individual').length,
    monthlyRevenue: clients
      .filter(c => c.status === 'active')
      .reduce((sum, c) => sum + c.monthlyFee, 0),
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-gray-600">
              Gerencie estabelecimentos e clientes pessoa física do GranoBox.
            </p>
          </div>
          <Button onClick={() => navigate('/clients/new')}>
            <Plus size={16} className="mr-2" />
            Novo Cliente
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando clientes...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-gray-600">
              Gerencie estabelecimentos e clientes pessoa física do GranoBox.
            </p>
          </div>
          <Button onClick={() => navigate('/clients/new')}>
            <Plus size={16} className="mr-2" />
            Novo Cliente
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-danger-600">Erro ao carregar clientes</p>
            <p className="text-gray-500 mt-2">Tente recarregar a página</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-gray-600">
            Gerencie estabelecimentos e clientes pessoa física do GranoBox.
          </p>
        </div>
        <Button onClick={() => navigate('/clients/new')}>
          <Plus size={16} className="mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <User className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-600">
              {stats.business} PJ • {stats.individual} PF
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Building className="h-4 w-4 text-primary-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-600">{stats.active}</div>
            <p className="text-xs text-gray-600">
              {((stats.active / stats.total) * 100 || 0).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prospects</CardTitle>
            <Eye className="h-4 w-4 text-warning-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning-600">{stats.prospects}</div>
            <p className="text-xs text-gray-600">
              Potenciais clientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <Building className="h-4 w-4 text-primary-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-600">
              R$ {stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-600">
              Clientes ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar clientes específicos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Buscar por nome, email ou documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="prospect">Prospect</option>
                <option value="inactive">Inativo</option>
                <option value="suspended">Suspenso</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div className="w-full sm:w-48">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Todos os tipos</option>
                <option value="business">Pessoa Jurídica</option>
                <option value="individual">Pessoa Física</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Contato</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Mensalidade</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${client.clientType === 'business' ? 'bg-blue-100' : 'bg-green-100'}`}>
                          {client.clientType === 'business' ? (
                            <Building size={16} className="text-blue-600" />
                          ) : (
                            <User size={16} className="text-green-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {client.businessName || (client.clientType === 'individual' ? client.fullName : client.legalName)}
                          </div>
                          {client.businessName && client.clientType === 'individual' && client.fullName && (
                            <div className="text-sm text-gray-600">{client.fullName}</div>
                          )}
                          {client.businessName && client.clientType === 'business' && client.legalName && (
                            <div className="text-sm text-gray-600">{client.legalName}</div>
                          )}
                          <div className="text-sm text-gray-500 font-mono">
                            {client.clientType === 'individual' ? client.cpf : client.cnpj}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div>
                        <div className="font-medium">
                          {client.clientType === 'business' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                        </div>
                        {client.businessType && (
                          <div className="text-gray-600">
                            {getBusinessTypeText(client.businessType)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div>
                        <div>{client.contactEmail}</div>
                        <div className="text-gray-600">{client.contactPhone}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                        {getStatusText(client.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="font-medium">
                        R$ {client.monthlyFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewClient(client)}
                          className="h-8 w-8"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClient(client)}
                          className="h-8 w-8"
                        >
                          <PencilSimple size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClient(client.id)}
                          className="h-8 w-8 text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum cliente encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Tente ajustar os filtros para encontrar clientes.'
                  : 'Comece criando um novo cliente.'}
              </p>
              {(!searchTerm && statusFilter === 'all' && typeFilter === 'all') && (
                <div className="mt-6">
                  <Button onClick={() => navigate('/clients/new')}>
                    <Plus size={16} className="mr-2" />
                    Novo Cliente
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}