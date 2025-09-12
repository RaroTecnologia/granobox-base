import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { InventoryEquipmentForm } from '../../components/forms/InventoryEquipmentForm';
import { useCreateEquipment } from '../../hooks/useEquipment';
import type { CreateEquipmentRequest } from '../../types/api';

export function NewEquipment() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createEquipmentMutation = useCreateEquipment();

  const handleSubmit = async (data: Omit<CreateEquipmentRequest, 'clientId' | 'loanStartDate' | 'status'>) => {
    setIsSubmitting(true);
    try {
      // Para equipamentos de inventário, não há cliente nem data de empréstimo
      const equipmentData: CreateEquipmentRequest = {
        ...data,
        clientId: '', // Será null no backend para equipamentos em estoque
        loanStartDate: new Date().toISOString().split('T')[0], // Data atual como placeholder
        status: 'inactive', // Equipamentos novos ficam inativos até serem emprestados
      };
      const newEquipment = await createEquipmentMutation.mutateAsync(equipmentData);
      
      // Redirecionar para a página de edição para permitir upload de arquivos
      navigate(`/equipment/${newEquipment.id}/edit`);
    } catch (error) {
      console.error('Erro ao criar equipamento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/equipment');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/equipment')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Adicionar ao Inventário</h1>
          <p className="text-gray-600">Cadastre um novo equipamento no patrimônio</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Equipamento</CardTitle>
        </CardHeader>
        <CardContent>
          <InventoryEquipmentForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            submitText="Adicionar ao Inventário"
          />
        </CardContent>
      </Card>
    </div>
  );
}
