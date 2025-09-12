import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MagnifyingGlass, PencilSimple, Trash, Ticket } from '@phosphor-icons/react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import type { Voucher } from '../types';

// Mock data
const mockVouchers: Voucher[] = [
  {
    id: '1',
    clientId: '1',
    code: 'DESCONTO20',
    type: 'percentage',
    value: 20,
    description: 'Desconto de 20% para cliente fidelidade',
    status: 'active',
    usageLimit: 5,
    usageCount: 2,
    expiresAt: new Date('2024-12-31'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    clientId: '2',
    code: 'FRETE-GRATIS',
    type: 'free_shipping',
    value: 0,
    description: 'Frete grátis para primeira compra',
    status: 'used',
    usageLimit: 1,
    usageCount: 1,
    expiresAt: new Date('2024-06-30'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-12'),
    usedAt: new Date('2024-01-12'),
  },
  {
    id: '3',
    clientId: '3',
    code: '50REAIS',
    type: 'fixed_amount',
    value: 50,
    description: 'R$ 50 de desconto',
    status: 'expired',
    usageLimit: 1,
    usageCount: 0,
    expiresAt: new Date('2024-01-31'),
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
];

export function Vouchers() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [vouchers, setVouchers] = useState<Voucher[]>(mockVouchers);

  const filteredVouchers = vouchers.filter(voucher =>
    voucher.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voucher.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Voucher['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'used':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Voucher['status']) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'used':
        return 'Usado';
      case 'expired':
        return 'Expirado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconhecido';
    }
  };

  const getTypeText = (type: Voucher['type']) => {
    switch (type) {
      case 'percentage':
        return 'Porcentagem';
      case 'fixed_amount':
        return 'Valor Fixo';
      case 'free_shipping':
        return 'Frete Grátis';
      default:
        return 'Desconhecido';
    }
  };

  const formatValue = (voucher: Voucher) => {
    switch (voucher.type) {
      case 'percentage':
        return `${voucher.value}%`;
      case 'fixed_amount':
        return `R$ ${voucher.value.toFixed(2)}`;
      case 'free_shipping':
        return 'Frete Grátis';
      default:
        return '-';
    }
  };

  const handleEditVoucher = (voucher: Voucher) => {
    navigate(`/vouchers/${voucher.id}/edit`);
  };

  const handleDeleteVoucher = (voucherId: string) => {
    if (confirm('Tem certeza que deseja excluir este voucher?')) {
      setVouchers(prev => prev.filter(voucher => voucher.id !== voucherId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vouchers</h1>
          <p className="text-gray-600">
            Gerencie vouchers de desconto e promoções para seus clientes.
          </p>
        </div>
        <Button onClick={() => navigate('/vouchers/new')}>
          <Plus size={16} className="mr-2" />
          Novo Voucher
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vouchers</CardTitle>
            <Ticket className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vouchers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vouchers Ativos</CardTitle>
            <Ticket className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vouchers.filter(v => v.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vouchers Utilizados</CardTitle>
            <Ticket className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vouchers.filter(v => v.status === 'used').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Uso</CardTitle>
            <Ticket className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vouchers.length > 0 ? Math.round((vouchers.filter(v => v.status === 'used').length / vouchers.length) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar vouchers específicos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <MagnifyingGlass 
                size={16} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" 
              />
              <Input
                placeholder="Buscar por código ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              Filtros Avançados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vouchers List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Vouchers ({filteredVouchers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Código</th>
                  <th className="text-left py-3 px-4 font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium">Valor</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Uso</th>
                  <th className="text-left py-3 px-4 font-medium">Expira em</th>
                  <th className="text-right py-3 px-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredVouchers.map((voucher) => (
                  <tr key={voucher.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium font-mono">{voucher.code}</div>
                        <div className="text-sm text-gray-600">
                          {voucher.description}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {getTypeText(voucher.type)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium">
                      {formatValue(voucher)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(voucher.status)}`}>
                        {getStatusText(voucher.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {voucher.usageCount}/{voucher.usageLimit || '∞'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {voucher.expiresAt ? voucher.expiresAt.toLocaleDateString('pt-BR') : 'Sem expiração'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditVoucher(voucher)}
                          className="h-8 w-8"
                        >
                          <PencilSimple size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteVoucher(voucher.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
