import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useClients } from '../../hooks/useClients';
import type { CreateEquipmentRequest, ApiEquipment } from '../../types/api';

interface EquipmentFormData {
  clientId: string;
  name: string;
  type: 'printer' | 'scale' | 'scanner' | 'tablet' | 'computer' | 'other';
  brand: string;
  model: string;
  serialNumber: string;
  patrimonyNumber: string;
  status: 'active' | 'inactive' | 'maintenance' | 'returned' | 'lost' | 'damaged';
  condition: 'new' | 'good' | 'fair' | 'poor' | 'damaged';
  purchaseValue: string;
  purchaseDate: string;
  loanStartDate: string;
  loanEndDate: string;
  returnDate: string;
  location: string;
  specifications: string;
  accessories: string;
  notes: string;
}

interface EquipmentFormProps {
  clientId?: string;
  initialData?: Partial<ApiEquipment>;
  onSubmit: (data: CreateEquipmentRequest) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitText?: string;
}

const equipmentTypes = [
  { value: 'printer', label: 'Impressora' },
  { value: 'scale', label: 'Balança' },
  { value: 'scanner', label: 'Scanner' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'computer', label: 'Computador' },
  { value: 'other', label: 'Outro' },
] as const;

const equipmentStatuses = [
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'maintenance', label: 'Em Manutenção' },
  { value: 'returned', label: 'Devolvido' },
  { value: 'lost', label: 'Perdido' },
  { value: 'damaged', label: 'Danificado' },
] as const;

const equipmentConditions = [
  { value: 'new', label: 'Novo' },
  { value: 'good', label: 'Bom' },
  { value: 'fair', label: 'Regular' },
  { value: 'poor', label: 'Ruim' },
  { value: 'damaged', label: 'Danificado' },
] as const;

export function EquipmentForm({ 
  clientId, 
  initialData, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  submitText = 'Salvar Equipamento'
}: EquipmentFormProps) {
  const { data: clients = [] } = useClients();
  
  const [formData, setFormData] = useState<EquipmentFormData>({
    clientId: clientId || '',
    name: '',
    type: 'printer',
    brand: '',
    model: '',
    serialNumber: '',
    patrimonyNumber: '',
    status: 'active',
    condition: 'new',
    purchaseValue: '',
    purchaseDate: '',
    loanStartDate: new Date().toISOString().split('T')[0], // Data atual
    loanEndDate: '',
    returnDate: '',
    location: '',
    specifications: '',
    accessories: '',
    notes: '',
  });

  // Atualizar formData quando initialData mudar
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        clientId: initialData.clientId || clientId || '',
        name: initialData.name || '',
        type: initialData.type || 'printer',
        brand: initialData.brand || '',
        model: initialData.model || '',
        serialNumber: initialData.serialNumber || '',
        patrimonyNumber: initialData.patrimonyNumber || '',
        status: initialData.status || 'active',
        condition: initialData.condition || 'new',
        purchaseValue: initialData.purchaseValue ? initialData.purchaseValue.toFixed(2).replace('.', ',') : '',
        purchaseDate: initialData.purchaseDate ? initialData.purchaseDate.split('T')[0] : '',
        loanStartDate: initialData.loanStartDate ? initialData.loanStartDate.split('T')[0] : new Date().toISOString().split('T')[0],
        loanEndDate: initialData.loanEndDate ? initialData.loanEndDate.split('T')[0] : '',
        returnDate: initialData.returnDate ? initialData.returnDate.split('T')[0] : '',
        location: initialData.location || '',
        specifications: initialData.specifications || '',
        accessories: initialData.accessories || '',
        notes: initialData.notes || '',
      }));
    }
  }, [initialData, clientId]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Função para formatar valor monetário
  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Função para validar o formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Cliente só é obrigatório quando não há clientId fixo (contexto de inventário)
    if (!clientId && !formData.clientId) {
      newErrors.clientId = 'Cliente é obrigatório';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Marca é obrigatória';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Modelo é obrigatório';
    }

    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = 'Número de série é obrigatório';
    }

    if (!formData.loanStartDate) {
      newErrors.loanStartDate = 'Data de início do comodato é obrigatória';
    }

    // Validar datas
    if (formData.loanStartDate && formData.loanEndDate) {
      const startDate = new Date(formData.loanStartDate);
      const endDate = new Date(formData.loanEndDate);
      if (endDate <= startDate) {
        newErrors.loanEndDate = 'Data de fim deve ser posterior à data de início';
      }
    }

    if (formData.loanStartDate && formData.returnDate) {
      const startDate = new Date(formData.loanStartDate);
      const returnDate = new Date(formData.returnDate);
      if (returnDate < startDate) {
        newErrors.returnDate = 'Data de devolução deve ser posterior à data de início';
      }
    }

    if (formData.purchaseDate && formData.loanStartDate) {
      const purchaseDate = new Date(formData.purchaseDate);
      const loanDate = new Date(formData.loanStartDate);
      if (loanDate < purchaseDate) {
        newErrors.loanStartDate = 'Data de início do comodato deve ser posterior à data de compra';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para lidar com mudanças nos campos
  const handleChange = (field: keyof EquipmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Função para lidar com mudanças no valor monetário
  const handleCurrencyChange = (value: string) => {
    const formatted = formatCurrency(value);
    handleChange('purchaseValue', formatted);
  };

  // Função para submeter o formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Converter valor monetário para número
    const parseCurrency = (value: string): number | undefined => {
      if (!value) return undefined;
      const numbers = value.replace(/\D/g, '');
      return parseFloat(numbers) / 100;
    };

    const submitData: CreateEquipmentRequest = {
      clientId: formData.clientId,
      name: formData.name.trim(),
      type: formData.type,
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      serialNumber: formData.serialNumber.trim(),
      patrimonyNumber: formData.patrimonyNumber.trim() || undefined,
      status: formData.status,
      condition: formData.condition,
      purchaseValue: parseCurrency(formData.purchaseValue),
      purchaseDate: formData.purchaseDate || undefined,
      loanStartDate: formData.loanStartDate,
      loanEndDate: formData.loanEndDate || undefined,
      returnDate: formData.returnDate || undefined,
      location: formData.location.trim() || undefined,
      specifications: formData.specifications.trim() || undefined,
      accessories: formData.accessories.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    };

    onSubmit(submitData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? 'Editar Equipamento' : 'Novo Equipamento'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cliente */}
          {!clientId && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Cliente</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente *
                </label>
                <select
                  value={formData.clientId}
                  onChange={(e) => handleChange('clientId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.clientId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.document}
                    </option>
                  ))}
                </select>
                {errors.clientId && (
                  <p className="text-red-500 text-sm mt-1">{errors.clientId}</p>
                )}
              </div>
            </div>
          )}

          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome/Descrição *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex: Impressora Térmica Zebra"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Equipamento *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value as EquipmentFormData['type'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {equipmentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca *
                </label>
                <Input
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  placeholder="Ex: Zebra, Epson, HP"
                  className={errors.brand ? 'border-red-500' : ''}
                />
                {errors.brand && (
                  <p className="text-red-500 text-sm mt-1">{errors.brand}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modelo *
                </label>
                <Input
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  placeholder="Ex: ZD220, L3150"
                  className={errors.model ? 'border-red-500' : ''}
                />
                {errors.model && (
                  <p className="text-red-500 text-sm mt-1">{errors.model}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Série *
                </label>
                <Input
                  value={formData.serialNumber}
                  onChange={(e) => handleChange('serialNumber', e.target.value.toUpperCase())}
                  placeholder="Ex: ZBR123456789"
                  className={errors.serialNumber ? 'border-red-500' : ''}
                />
                {errors.serialNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.serialNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número do Patrimônio
                </label>
                <Input
                  value={formData.patrimonyNumber}
                  onChange={(e) => handleChange('patrimonyNumber', e.target.value.toUpperCase())}
                  placeholder="Ex: PAT001234"
                />
              </div>
            </div>
          </div>

          {/* Status e Condição */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Status e Condição</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value as EquipmentFormData['status'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {equipmentStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condição
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => handleChange('condition', e.target.value as EquipmentFormData['condition'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {equipmentConditions.map((condition) => (
                    <option key={condition.value} value={condition.value}>
                      {condition.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Informações Financeiras */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informações Financeiras</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor de Compra
                </label>
                <Input
                  value={formData.purchaseValue}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Compra
                </label>
                <Input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleChange('purchaseDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Datas do Comodato */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Comodato</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Início do Comodato *
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
                  Fim Previsto
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Devolução
                </label>
                <Input
                  type="date"
                  value={formData.returnDate}
                  onChange={(e) => handleChange('returnDate', e.target.value)}
                  className={errors.returnDate ? 'border-red-500' : ''}
                />
                {errors.returnDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.returnDate}</p>
                )}
              </div>
            </div>
          </div>

          {/* Localização */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localização
            </label>
            <Input
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Ex: Loja Principal - Balcão 1"
            />
          </div>

          {/* Especificações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Especificações Técnicas
            </label>
            <textarea
              value={formData.specifications}
              onChange={(e) => handleChange('specifications', e.target.value)}
              placeholder="Descreva as especificações técnicas do equipamento"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Acessórios */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Acessórios Incluídos
            </label>
            <textarea
              value={formData.accessories}
              onChange={(e) => handleChange('accessories', e.target.value)}
              placeholder="Liste os acessórios incluídos com o equipamento"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Observações adicionais sobre o equipamento"
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
              {isSubmitting ? 'Salvando...' : submitText}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
