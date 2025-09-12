import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Receipt, 
  CreditCard, 
  Calendar, 
  CheckCircle,
  PencilSimple,
  User,
  Building,
  Download,
  EnvelopeSimple,
  Phone,
  MapPin,
  CurrencyDollar,
  Clock,
  Warning,
  Copy
} from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import type { Invoice, Client } from '../../types';

// Mock data - mesma fatura da listagem
const mockInvoice: Invoice = {
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
    contacts: [
      {
        id: 'c1',
        name: 'João Silva',
        role: 'Proprietário',
        email: 'joao@paodourado.com.br',
        phone: '(11) 99999-1111',
        isPrimary: true,
      }
    ],
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
  notes: 'Pagamento processado automaticamente via cartão de crédito cadastrado.'
};

export function InvoiceDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // TODO: Buscar fatura da API usando o ID
  const invoice = mockInvoice;

  if (!invoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/billing')}
            className="h-8 w-8"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fatura não encontrada</h1>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800';
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
        return 'Cartão de Crédito';
      case 'pix':
        return 'PIX';
      case 'boleto':
        return 'Boleto Bancário';
      case 'bank_transfer':
        return 'Transferência Bancária';
      default:
        return 'Não definido';
    }
  };

  const getItemTypeText = (type: string) => {
    switch (type) {
      case 'subscription':
        return 'Assinatura';
      case 'equipment':
        return 'Equipamento';
      case 'setup':
        return 'Configuração';
      case 'training':
        return 'Treinamento';
      case 'other':
        return 'Outro';
      default:
        return 'Item';
    }
  };

  const handleDownload = () => {
    // TODO: Implementar download da fatura
    console.log('Baixando fatura:', invoice.invoiceNumber);
  };

  const handleSendEmail = () => {
    // TODO: Implementar envio por email
    console.log('Enviando fatura por email para:', invoice.client.email);
  };

  const handleCopyLink = () => {
    // TODO: Implementar cópia do link
    const link = `${window.location.origin}/billing/${invoice.id}`;
    navigator.clipboard.writeText(link);
    console.log('Link copiado:', link);
  };

  const handleMarkAsPaid = () => {
    // TODO: Implementar marcação como pago
    console.log('Marcando fatura como paga:', invoice.id);
  };

  const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
  const tax = 0; // Sem impostos por enquanto
  const total = subtotal + tax;

  const daysOverdue = invoice.status === 'overdue' 
    ? Math.floor((new Date().getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/billing')}
            className="h-8 w-8"
          >
            <ArrowLeft size={16} />
          </Button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Receipt size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Fatura {invoice.invoiceNumber}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                  {getStatusText(invoice.status)}
                </span>
                {invoice.status === 'overdue' && (
                  <span className="text-sm text-red-600 font-medium">
                    {daysOverdue} {daysOverdue === 1 ? 'dia' : 'dias'} em atraso
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download size={16} className="mr-2" />
            Baixar PDF
          </Button>
          <Button variant="outline" onClick={handleCopyLink}>
            <Copy size={16} className="mr-2" />
            Copiar Link
          </Button>
          {invoice.status !== 'paid' && (
            <Button onClick={handleMarkAsPaid}>
              <CheckCircle size={16} className="mr-2" />
              Marcar como Pago
            </Button>
          )}
          <Button onClick={() => navigate(`/billing/${invoice.id}/edit`)}>
            <PencilSimple size={16} className="mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Alert para faturas vencidas */}
      {invoice.status === 'overdue' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Warning className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Fatura Vencida</p>
                <p className="text-sm text-red-700">
                  Esta fatura está vencida há {daysOverdue} {daysOverdue === 1 ? 'dia' : 'dias'}. 
                  Entre em contato com o cliente para regularizar o pagamento.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CurrencyDollar size={16} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-lg font-bold">
                  R$ {invoice.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Vencimento</p>
                <p className="text-lg font-bold">
                  {invoice.dueDate.toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Método de Pagamento</p>
                <p className="text-lg font-bold">
                  {getPaymentMethodText(invoice.paymentMethod)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock size={16} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {invoice.paidDate ? 'Data do Pagamento' : 'Criada em'}
                </p>
                <p className="text-lg font-bold">
                  {invoice.paidDate 
                    ? invoice.paidDate.toLocaleDateString('pt-BR')
                    : invoice.createdAt.toLocaleDateString('pt-BR')
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Detalhes da Fatura */}
        <div className="lg:col-span-2 space-y-6">
          {/* Itens da Fatura */}
          <Card>
            <CardHeader>
              <CardTitle>Itens da Fatura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Descrição</th>
                      <th className="text-center py-2 font-medium">Qtd</th>
                      <th className="text-right py-2 font-medium">Valor Unit.</th>
                      <th className="text-right py-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3">
                          <div>
                            <p className="font-medium">{item.description}</p>
                            <p className="text-sm text-gray-600">
                              {getItemTypeText(item.type)}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 text-center">{item.quantity}</td>
                        <td className="py-3 text-right">
                          R$ {item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-right font-medium">
                          R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-b">
                      <td colSpan={3} className="py-2 text-right font-medium">Subtotal:</td>
                      <td className="py-2 text-right font-medium">
                        R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {tax > 0 && (
                      <tr className="border-b">
                        <td colSpan={3} className="py-2 text-right font-medium">Impostos:</td>
                        <td className="py-2 text-right font-medium">
                          R$ {tax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={3} className="py-3 text-right text-lg font-bold">Total:</td>
                      <td className="py-3 text-right text-lg font-bold text-primary-600">
                        R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Informações de Pagamento */}
          {invoice.stripeInvoiceId && (
            <Card>
              <CardHeader>
                <CardTitle>Informações de Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">ID Stripe:</span>
                  <span className="font-mono text-sm">{invoice.stripeInvoiceId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Método:</span>
                  <span className="text-sm">{getPaymentMethodText(invoice.paymentMethod)}</span>
                </div>
                {invoice.paidDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Processado em:</span>
                    <span className="text-sm">
                      {invoice.paidDate.toLocaleDateString('pt-BR')} às {invoice.paidDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Informações do Cliente */}
        <div className="space-y-6">
          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {invoice.client.clientType === 'business' ? (
                  <Building size={16} className="text-blue-600" />
                ) : (
                  <User size={16} className="text-green-600" />
                )}
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-gray-900">{invoice.client.name}</p>
                {invoice.client.legalName && (
                  <p className="text-sm text-gray-600">{invoice.client.legalName}</p>
                )}
                <p className="text-sm text-gray-600">{invoice.client.document}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <EnvelopeSimple size={14} className="text-gray-400" />
                  <span className="text-sm">{invoice.client.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  <span className="text-sm">{invoice.client.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-gray-400 mt-0.5" />
                  <div className="text-sm">
                    <p>{invoice.client.address.street}, {invoice.client.address.number}</p>
                    <p>{invoice.client.address.neighborhood}</p>
                    <p>{invoice.client.address.city} - {invoice.client.address.state}</p>
                    <p>{invoice.client.address.zipCode}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate(`/clients/${invoice.client.id}`)}
                >
                  Ver Perfil do Cliente
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleSendEmail}
              >
                <EnvelopeSimple size={16} className="mr-2" />
                Enviar por Email
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleDownload}
              >
                <Download size={16} className="mr-2" />
                Baixar PDF
              </Button>

              {invoice.status === 'draft' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  Enviar Fatura
                </Button>
              )}

              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleMarkAsPaid}
                >
                  <CheckCircle size={16} className="mr-2" />
                  Marcar como Pago
                </Button>
              )}

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/billing/new', { 
                  state: { clientId: invoice.client.id } 
                })}
              >
                Nova Fatura para Cliente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
