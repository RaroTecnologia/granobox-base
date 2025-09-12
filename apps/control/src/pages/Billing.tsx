import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  MagnifyingGlass, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  PencilSimple,
  User,
  Building,
  Calendar,
  CurrencyDollar,
  Download,
  Receipt,
  TrendUp,
  Warning
} from '@phosphor-icons/react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import type { Invoice, Client } from '../types';

// Mock data de faturas
const mockInvoices: Invoice[] = [
  {
    id: 'inv_001',
    clientId: '1',
    client: {
      id: '1',
      clientType: 'business',
      name: 'Padaria Pão Dourado',
      legalName: 'João Silva Panificação LTDA',
      email: 'contato@paodourado.com.br',
      phone: '(11) 3456-7890',
      document: '12.345.678/0001-90',
      businessType: 'bakery',
      address: {
        street: 'Rua das Palmeiras',
        number: '456',
        complement: '',
        neighborhood: 'Vila Madalena',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '05435-020',
        country: 'Brasil',
      },
      contacts: [],
      status: 'active',
      loanedEquipment: [],
      supportHistory: [],
      trainings: [],
      contractType: 'monthly',
      monthlyFee: 149.90,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    invoiceNumber: 'GB-2024-001',
    amount: 199.90,
    status: 'paid',
    dueDate: new Date('2024-02-01'),
    paidDate: new Date('2024-01-28'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-28'),
    items: [
      {
        id: 'item_1',
        description: 'Assinatura Mensal GranoBox',
        quantity: 1,
        unitPrice: 149.90,
        total: 149.90,
        type: 'subscription'
      },
      {
        id: 'item_2',
        description: 'Impressora Térmica (Comodato)',
        quantity: 1,
        unitPrice: 50.00,
        total: 50.00,
        type: 'equipment'
      }
    ],
    stripeInvoiceId: 'in_1234567890',
    paymentMethod: 'card',
    notes: 'Pagamento processado automaticamente via cartão'
  },
  {
    id: 'inv_002',
    clientId: '2',
    client: {
      id: '2',
      clientType: 'business',
      name: 'Restaurante Sabor & Arte',
      legalName: 'Sabor & Arte Gastronomia S.A.',
      email: 'gerencia@saborearte.com.br',
      phone: '(11) 2345-6789',
      document: '23.456.789/0001-12',
      businessType: 'restaurant',
      address: {
        street: 'Avenida Paulista',
        number: '1578',
        complement: 'Loja 12',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-200',
        country: 'Brasil',
      },
      contacts: [],
      status: 'active',
      loanedEquipment: [],
      supportHistory: [],
      trainings: [],
      contractType: 'annual',
      monthlyFee: 199.90,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    invoiceNumber: 'GB-2024-002',
    amount: 279.90,
    status: 'overdue',
    dueDate: new Date('2024-01-25'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-26'),
    items: [
      {
        id: 'item_3',
        description: 'Assinatura Mensal GranoBox Premium',
        quantity: 1,
        unitPrice: 199.90,
        total: 199.90,
        type: 'subscription'
      },
      {
        id: 'item_4',
        description: 'Impressora Térmica (Comodato)',
        quantity: 1,
        unitPrice: 50.00,
        total: 50.00,
        type: 'equipment'
      },
      {
        id: 'item_5',
        description: 'Tablet GranoBox (Comodato)',
        quantity: 1,
        unitPrice: 30.00,
        total: 30.00,
        type: 'equipment'
      }
    ],
    stripeInvoiceId: 'in_0987654321',
    paymentMethod: 'pix'
  },
  {
    id: 'inv_003',
    clientId: '3',
    client: {
      id: '3',
      clientType: 'individual',
      name: 'Carlos Eduardo Mendes',
      email: 'carlos.chef@gmail.com',
      phone: '(11) 99555-4444',
      document: '123.456.789-01',
      address: {
        street: 'Rua dos Jardins',
        number: '89',
        complement: 'Apto 45',
        neighborhood: 'Jardins',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        country: 'Brasil',
      },
      contacts: [],
      status: 'active',
      loanedEquipment: [],
      supportHistory: [],
      trainings: [],
      contractType: 'monthly',
      monthlyFee: 79.90,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    invoiceNumber: 'GB-2024-003',
    amount: 109.90,
    status: 'sent',
    dueDate: new Date('2024-02-05'),
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    items: [
      {
        id: 'item_6',
        description: 'Assinatura Mensal GranoBox Individual',
        quantity: 1,
        unitPrice: 79.90,
        total: 79.90,
        type: 'subscription'
      },
      {
        id: 'item_7',
        description: 'Impressora Portátil (Comodato)',
        quantity: 1,
        unitPrice: 30.00,
        total: 30.00,
        type: 'equipment'
      }
    ],
    stripeInvoiceId: 'in_1122334455',
    paymentMethod: 'card'
  },
  {
    id: 'inv_004',
    clientId: '1',
    client: {
      id: '1',
      clientType: 'business',
      name: 'Padaria Pão Dourado',
      legalName: 'João Silva Panificação LTDA',
      email: 'contato@paodourado.com.br',
      phone: '(11) 3456-7890',
      document: '12.345.678/0001-90',
      businessType: 'bakery',
      address: {
        street: 'Rua das Palmeiras',
        number: '456',
        complement: '',
        neighborhood: 'Vila Madalena',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '05435-020',
        country: 'Brasil',
      },
      contacts: [],
      status: 'active',
      loanedEquipment: [],
      supportHistory: [],
      trainings: [],
      contractType: 'monthly',
      monthlyFee: 149.90,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    invoiceNumber: 'GB-2024-004',
    amount: 350.00,
    status: 'draft',
    dueDate: new Date('2024-02-15'),
    createdAt: new Date('2024-01-28'),
    updatedAt: new Date('2024-01-28'),
    items: [
      {
        id: 'item_8',
        description: 'Assinatura Mensal GranoBox',
        quantity: 1,
        unitPrice: 149.90,
        total: 149.90,
        type: 'subscription'
      },
      {
        id: 'item_9',
        description: 'Impressora Térmica (Comodato)',
        quantity: 1,
        unitPrice: 50.00,
        total: 50.00,
        type: 'equipment'
      },
      {
        id: 'item_10',
        description: 'Treinamento Avançado',
        quantity: 2,
        unitPrice: 75.00,
        total: 150.00,
        type: 'training'
      }
    ]
  }
];

export function Billing() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState(mockInvoices);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-primary-100 text-primary-800';
      case 'sent':
        return 'bg-gray-100 text-gray-800';
      case 'overdue':
        return 'bg-warning-100 text-warning-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-danger-100 text-danger-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'sent':
        return 'Enviado';
      case 'overdue':
        return 'Vencido';
      case 'draft':
        return 'Rascunho';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconhecido';
    }
  };

  const getPaymentMethodText = (method?: Invoice['paymentMethod']) => {
    switch (method) {
      case 'card':
        return 'Cartão';
      case 'pix':
        return 'PIX';
      case 'boleto':
        return 'Boleto';
      case 'bank_transfer':
        return 'Transferência';
      default:
        return 'Não definido';
    }
  };

  const getBusinessTypeText = (type?: Client['businessType']) => {
    switch (type) {
      case 'restaurant':
        return 'Restaurante';
      case 'bakery':
        return 'Padaria';
      case 'hotel':
        return 'Hotel';
      case 'confectionery':
        return 'Confeitaria';
      case 'other':
        return 'Outro';
      default:
        return 'PF';
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    navigate(`/billing/${invoice.id}`);
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    // TODO: Implementar download da fatura
    console.log('Baixando fatura:', invoice.invoiceNumber);
  };

  const stats = {
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter(i => i.status === 'paid').length,
    overdueInvoices: invoices.filter(i => i.status === 'overdue').length,
    draftInvoices: invoices.filter(i => i.status === 'draft').length,
    totalRevenue: invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount, 0),
    pendingRevenue: invoices
      .filter(i => i.status === 'sent' || i.status === 'overdue')
      .reduce((sum, i) => sum + i.amount, 0),
    monthlyRecurring: invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => {
        const subscriptionItems = i.items.filter(item => item.type === 'subscription');
        return sum + subscriptionItems.reduce((itemSum, item) => itemSum + item.total, 0);
      }, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cobrança</h1>
          <p className="text-gray-600">
            Gerencie faturas, pagamentos e assinaturas dos clientes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download size={16} className="mr-2" />
            Exportar
          </Button>
          <Button onClick={() => navigate('/billing/new')}>
            <Plus size={16} className="mr-2" />
            Nova Fatura
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <CurrencyDollar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-600">
              R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-600">
              {stats.paidInvoices} faturas pagas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Pendente</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning-600">
              R$ {stats.pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-600">
              {invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length} faturas pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturas Vencidas</CardTitle>
            <Warning className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning-600">{stats.overdueInvoices}</div>
            <p className="text-xs text-gray-600">
              Requer atenção imediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Recorrente</CardTitle>
            <TrendUp className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-600">
              R$ {stats.monthlyRecurring.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-600">
              Assinaturas mensais
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar faturas específicas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <MagnifyingGlass 
                size={16} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" 
              />
              <Input
                placeholder="Buscar por número, cliente..."
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
              <option value="draft">Rascunho</option>
              <option value="sent">Enviado</option>
              <option value="paid">Pago</option>
              <option value="overdue">Vencido</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Faturas ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Fatura</th>
                  <th className="text-left py-3 px-4 font-medium">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium">Valor</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Vencimento</th>
                  <th className="text-left py-3 px-4 font-medium">Pagamento</th>
                  <th className="text-right py-3 px-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{invoice.invoiceNumber}</div>
                        <div className="text-sm text-gray-600">
                          Criada em {invoice.createdAt.toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-1 rounded ${invoice.client.clientType === 'business' ? 'bg-blue-100' : 'bg-green-100'}`}>
                          {invoice.client.clientType === 'business' ? (
                            <Building size={12} className="text-blue-600" />
                          ) : (
                            <User size={12} className="text-green-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{invoice.client.name}</div>
                          <div className="text-sm text-gray-600">
                            {getBusinessTypeText(invoice.client.businessType)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">
                        R$ {invoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-gray-600">
                        {invoice.items.length} {invoice.items.length === 1 ? 'item' : 'itens'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400" />
                        {invoice.dueDate.toLocaleDateString('pt-BR')}
                      </div>
                      {invoice.paidDate && (
                        <div className="text-xs text-green-600">
                          Pago em {invoice.paidDate.toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {invoice.paymentMethod ? (
                        <div className="flex items-center gap-1">
                          <CreditCard size={12} className="text-gray-400" />
                          {getPaymentMethodText(invoice.paymentMethod)}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewInvoice(invoice)}
                          className="h-8 w-8"
                          title="Ver detalhes"
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadInvoice(invoice)}
                          className="h-8 w-8"
                          title="Baixar fatura"
                        >
                          <Download size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/billing/${invoice.id}/edit`)}
                          className="h-8 w-8"
                          title="Editar fatura"
                        >
                          <PencilSimple size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Receipt className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Nenhuma fatura encontrada' 
                  : 'Nenhuma fatura cadastrada'
                }
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando sua primeira fatura.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => navigate('/billing/new')}>
                  Criar Primeira Fatura
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}