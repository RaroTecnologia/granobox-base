import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { InventoryEquipmentForm } from '../../components/forms/InventoryEquipmentForm';
import { useEquipment, useUpdateEquipment } from '../../hooks/useEquipment';
import type { CreateEquipmentRequest } from '../../types/api';

export function EditEquipment() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: equipment, isLoading, error } = useEquipment(id!);
  const updateEquipmentMutation = useUpdateEquipment();

  const handleSubmit = async (data: Omit<CreateEquipmentRequest, 'clientId' | 'loanStartDate' | 'status'>) => {
    if (!id) return;
    
    setIsSubmitting(true);
    try {
      // Para equipamentos de inventário, mantemos os dados de comodato existentes
      const updateData = {
        ...data,
        // Não atualizamos clientId, loanStartDate ou status aqui
        // Esses campos são gerenciados na aba do cliente
      };
      await updateEquipmentMutation.mutateAsync({ id, data: updateData });
      navigate('/equipment');
    } catch (error) {
      console.error('Erro ao atualizar equipamento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/equipment');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
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
            <h1 className="text-2xl font-bold text-gray-900">Editar Equipamento</h1>
            <p className="text-gray-600">Carregando informações do equipamento...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="space-y-6">
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
            <h1 className="text-2xl font-bold text-gray-900">Equipamento não encontrado</h1>
            <p className="text-red-600">Não foi possível carregar as informações do equipamento.</p>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Editar Equipamento</h1>
          <p className="text-gray-600">Edite as informações do equipamento {equipment.name}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Equipamento</CardTitle>
        </CardHeader>
        <CardContent>
          <InventoryEquipmentForm
            initialData={equipment}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            submitText="Salvar Alterações"
            equipmentId={id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
