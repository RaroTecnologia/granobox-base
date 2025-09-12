import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { VoucherForm } from '../../components/forms/VoucherForm';
import type { CreateVoucherForm, Client } from '../../types';

// Mock data - em produção viria da API
const mockVoucher = {
  id: '1',
  clientId: '1',
  code: 'DESCONTO10',
  type: 'percentage' as const,
  value: 10,
  description: 'Desconto de 10% para cliente especial',
  usageLimit: 5,
  expiresAt: new Date('2024-12-31'),
};

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

export function EditVoucher() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // TODO: Buscar voucher da API usando o ID
  const voucher = mockVoucher;

  const handleSubmit = (data: CreateVoucherForm) => {
    // TODO: Integrar com API
    console.log('Atualizando voucher:', { id, ...data });
    
    // Simular sucesso e voltar para lista
    navigate('/vouchers', { 
      state: { 
        message: 'Voucher atualizado com sucesso!',
        type: 'success' 
      }
    });
  };

  const handleCancel = () => {
    navigate('/vouchers');
  };

  if (!voucher) {
    return (
      <div className="space-y-6">
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
            <h1 className="text-3xl font-bold tracking-tight">Voucher não encontrado</h1>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Editar Voucher</h1>
          <p className="text-gray-600">
            Atualize os dados do voucher {voucher.code}.
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
            initialData={{
              clientId: voucher.clientId,
              code: voucher.code,
              type: voucher.type,
              value: voucher.value,
              description: voucher.description,
              usageLimit: voucher.usageLimit,
              expiresAt: voucher.expiresAt,
            }}
            showActions={true}
            clients={mockClients}
          />
        </CardContent>
      </Card>
    </div>
  );
}
