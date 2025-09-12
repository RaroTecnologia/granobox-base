import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useAllEquipment } from '../../hooks/useEquipment';
import type { CreateEquipmentRequest, ApiEquipment } from '../../types/api';

interface EquipmentLoanFormData {
  equipmentId: string;
  loanStartDate: string;
  loanEndDate: string;
  location: string;
  notes: string;
}

interface EquipmentLoanFormProps {
  clientId: string;
  initialData?: Partial<ApiEquipment>;
  onSubmit: (data: { equipmentId: string; loanStartDate: string; loanEndDate?: string; location?: string; notes?: string }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitText?: string;
}

export function EquipmentLoanForm({ 
  clientId,
  initialData, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  submitText = 'Associar Equipamento'
}: EquipmentLoanFormProps) {
  
  // Buscar equipamentos disponíveis (sem cliente associado ou inativos)
  const { data: allEquipment = [] } = useAllEquipment();
  const availableEquipment = allEquipment.filter(eq => 
    !eq.clientId || eq.status === 'inactive' || eq.status === 'returned'
  );
  
  const [formData, setFormData] = useState<EquipmentLoanFormData>({
    equipmentId: '',
    loanStartDate: new Date().toISOString().split('T')[0],
    loanEndDate: '',
    location: '',
    notes: '',
  });

  // Atualizar formData quando initialData mudar (para edição)
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        equipmentId: initialData.id || '',
        loanStartDate: initialData.loanStartDate ? initialData.loanStartDate.split('T')[0] : new Date().toISOString().split('T')[0],
        loanEndDate: initialData.loanEndDate ? initialData.loanEndDate.split('T')[0] : '',
        location: initialData.location || '',
        notes: initialData.notes || '',
      }));
    }
  }, [initialData]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Função para validar o formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.equipmentId) {
      newErrors.equipmentId = 'Equipamento é obrigatório';
    }

    if (!formData.loanStartDate) {
      newErrors.loanStartDate = 'Data de início é obrigatória';
    }

    // Validar datas
    if (formData.loanStartDate && formData.loanEndDate) {
      const startDate = new Date(formData.loanStartDate);
      const endDate = new Date(formData.loanEndDate);
      if (endDate <= startDate) {
        newErrors.loanEndDate = 'Data de fim deve ser posterior à data de início';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para lidar com mudanças nos campos
  const handleChange = (field: keyof EquipmentLoanFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Função para submeter o formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      equipmentId: formData.equipmentId,
      loanStartDate: formData.loanStartDate,
      loanEndDate: formData.loanEndDate || undefined,
      location: formData.location.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    };

    onSubmit(submitData);
  };

  // Encontrar equipamento selecionado para mostrar detalhes
  const selectedEquipment = allEquipment.find(eq => eq.id === formData.equipmentId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seleção de Equipamento */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Selecionar Equipamento</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Equipamento Disponível *
          </label>
          <select
            value={formData.equipmentId}
            onChange={(e) => handleChange('equipmentId', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.equipmentId ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={!!initialData} // Não permite trocar equipamento na edição
          >
            <option value="">Selecione um equipamento</option>
            {availableEquipment.map((equipment) => (
              <option key={equipment.id} value={equipment.id}>
                {equipment.name} - {equipment.brand} {equipment.model} (S/N: {equipment.serialNumber})
              </option>
            ))}
          </select>
          {errors.equipmentId && (
            <p className="text-red-500 text-sm mt-1">{errors.equipmentId}</p>
          )}
        </div>

        {/* Detalhes do equipamento selecionado */}
        {selectedEquipment && (
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-900 mb-2">Detalhes do Equipamento</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Tipo:</span>
                <span className="ml-2 capitalize">
                  {selectedEquipment.type === 'printer' && 'Impressora'}
                  {selectedEquipment.type === 'scale' && 'Balança'}
                  {selectedEquipment.type === 'scanner' && 'Scanner'}
                  {selectedEquipment.type === 'tablet' && 'Tablet'}
                  {selectedEquipment.type === 'computer' && 'Computador'}
                  {selectedEquipment.type === 'other' && 'Outro'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Condição:</span>
                <span className="ml-2 capitalize">
                  {selectedEquipment.condition === 'new' && 'Novo'}
                  {selectedEquipment.condition === 'good' && 'Bom'}
                  {selectedEquipment.condition === 'fair' && 'Regular'}
                  {selectedEquipment.condition === 'poor' && 'Ruim'}
                  {selectedEquipment.condition === 'damaged' && 'Danificado'}
                </span>
              </div>
              {selectedEquipment.patrimonyNumber && (
                <div>
                  <span className="text-gray-600">Patrimônio:</span>
                  <span className="ml-2">{selectedEquipment.patrimonyNumber}</span>
                </div>
              )}
              {selectedEquipment.purchaseValue && (
                <div>
                  <span className="text-gray-600">Valor:</span>
                  <span className="ml-2">
                    R$ {selectedEquipment.purchaseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Datas do Comodato */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Período do Comodato</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Início *
            </label>
            <Input
              type="date"
              value={formData.loanStartDate}
              onChange={(e) => handleChange('loanStartDate', e.target.value)}
              className={errors.loanStartDate ? 'border-red-500' : ''}
            />
            {errors.loanStartDate && (
              <p className="text-red-500 text-sm mt-1">{errors.loanStartDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Fim Prevista
            </label>
            <Input
              type="date"
              value={formData.loanEndDate}
              onChange={(e) => handleChange('loanEndDate', e.target.value)}
              className={errors.loanEndDate ? 'border-red-500' : ''}
            />
            {errors.loanEndDate && (
              <p className="text-red-500 text-sm mt-1">{errors.loanEndDate}</p>
            )}
          </div>
        </div>
      </div>

      {/* Localização no Cliente */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Localização no Cliente
        </label>
        <Input
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="Ex: Balcão principal, Cozinha, Escritório"
        />
      </div>

      {/* Observações */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observações do Comodato
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Observações específicas sobre este comodato"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Botões */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processando...' : submitText}
        </Button>
      </div>
    </form>
  );
}
