import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MagnifyingGlass, Wrench, Building, User, MapPin, PencilSimple } from '@phosphor-icons/react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAllEquipment, useEquipmentStats } from '../hooks/useEquipment';
import type { ApiEquipment } from '../types/api';

export function Equipment() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Hooks da API
  const { data: equipment = [], isLoading, error } = useAllEquipment();
  const { data: stats } = useEquipmentStats();

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: ApiEquipment['status']) => {
    switch (status) {
      case 'active':
        return 'bg-primary-100 text-primary-800';
      case 'maintenance':
        return 'bg-warning-100 text-warning-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-600';
      case 'returned':
        return 'bg-gray-100 text-gray-600';
      case 'lost':
        return 'bg-red-100 text-red-800';
      case 'damaged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: ApiEquipment['status']) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'maintenance':
        return 'Manutenção';
      case 'inactive':
        return 'Inativo';
      case 'returned':
        return 'Devolvido';
      case 'lost':
        return 'Perdido';
      case 'damaged':
        return 'Danificado';
      default:
        return 'Desconhecido';
    }
  };

  // Calcular receita mensal estimada (baseada no valor de compra dos equipamentos ativos)
  const monthlyRevenue = equipment
    .filter(item => item.status === 'active' && item.purchaseValue)
    .reduce((sum, item) => sum + (item.purchaseValue || 0) * 0.1, 0); // 10% do valor como estimativa mensal

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventário de Equipamentos</h1>
          <p className="text-gray-600">Gerencie o patrimônio e ciclo de vida dos equipamentos</p>
        </div>
        <Button onClick={() => navigate('/equipment/new')}>
          <Plus size={16} className="mr-2" />
          Adicionar ao Inventário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total no Inventário</CardTitle>
            <Wrench className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-gray-600">
              Equipamentos no patrimônio
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Comodato</CardTitle>
            <Wrench className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-600">{stats?.active || 0}</div>
            <p className="text-xs text-gray-600">
              {stats?.total ? ((stats.active / stats.total) * 100).toFixed(1) : 0}% emprestados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
            <Wrench className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning-600">{stats?.maintenance || 0}</div>
            <p className="text-xs text-gray-600">
              Equipamentos em reparo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disponíveis</CardTitle>
            <Wrench className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-600">
              {(stats?.total || 0) - (stats?.active || 0) - (stats?.maintenance || 0)}
            </div>
            <p className="text-xs text-gray-600">
              Prontos para empréstimo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar equipamentos específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Buscar por nome, modelo, série ou marca..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="maintenance">Manutenção</option>
              <option value="inactive">Inativo</option>
              <option value="returned">Devolvido</option>
              <option value="lost">Perdido</option>
              <option value="damaged">Danificado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Equipment List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Equipamentos ({filteredEquipment.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Carregando equipamentos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">Erro ao carregar equipamentos</p>
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum equipamento encontrado
              </h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Ainda não há equipamentos cadastrados no sistema.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Equipamento</th>
                    <th className="text-left py-3 px-4 font-medium">Marca/Modelo</th>
                    <th className="text-left py-3 px-4 font-medium">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Condição</th>
                    <th className="text-left py-3 px-4 font-medium">Valor</th>
                    <th className="text-left py-3 px-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEquipment.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-600">
                            S/N: {item.serialNumber}
                          </div>
                          {item.patrimonyNumber && (
                            <div className="text-sm text-gray-500">
                              Patrimônio: {item.patrimonyNumber}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{item.brand}</div>
                          <div className="text-sm text-gray-600">{item.model}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600 capitalize">
                          {item.type === 'printer' && 'Impressora'}
                          {item.type === 'scale' && 'Balança'}
                          {item.type === 'scanner' && 'Scanner'}
                          {item.type === 'tablet' && 'Tablet'}
                          {item.type === 'computer' && 'Computador'}
                          {item.type === 'other' && 'Outro'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {getStatusText(item.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600 capitalize">
                          {item.condition === 'new' && 'Novo'}
                          {item.condition === 'good' && 'Bom'}
                          {item.condition === 'fair' && 'Regular'}
                          {item.condition === 'poor' && 'Ruim'}
                          {item.condition === 'damaged' && 'Danificado'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div>
                          {item.purchaseValue ? (
                            <div className="font-medium">
                              R$ {item.purchaseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          ) : (
                            <span className="text-gray-400">Não informado</span>
                          )}
                          {item.purchaseDate && (
                            <div className="text-gray-500 text-xs">
                              Compra: {new Date(item.purchaseDate).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/equipment/${item.id}/edit`)}
                          className="flex items-center gap-2"
                        >
                          <PencilSimple size={14} />
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}