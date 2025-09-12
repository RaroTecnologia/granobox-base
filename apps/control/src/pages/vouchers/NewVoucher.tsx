import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { VoucherForm } from '../../components/forms/VoucherForm';
import type { CreateVoucherForm, Client } from '../../types';

// Mock clients - em produção viria da API
const mockClients: Client[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 99999-9999',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    totalVouchers: 2,
    totalSpent: 150.00,
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@email.com',
    phone: '(11) 88888-8888',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    totalVouchers: 1,
    totalSpent: 200.00,
  },
];

export function NewVoucher() {
  const navigate = useNavigate();

  const handleSubmit = (data: CreateVoucherForm) => {
    // TODO: Integrar com API
    console.log('Criando voucher:', data);
    
    // Simular sucesso e voltar para lista
    navigate('/vouchers', { 
      state: { 
        message: 'Voucher criado com sucesso!',
        type: 'success' 
      }
    });
  };

  const handleCancel = () => {
    navigate('/vouchers');
  };

  return (
    <div className="space-y-6">
      {/* Header com navegação */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/vouchers')}
          className="h-8 w-8"
        >
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Voucher</h1>
          <p className="text-gray-600">
            Preencha os dados abaixo para criar um novo voucher de desconto.
          </p>
        </div>
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Voucher</CardTitle>
        </CardHeader>
        <CardContent>
          <VoucherForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            showActions={true}
            clients={mockClients}
          />
        </CardContent>
      </Card>
    </div>
  );
}
