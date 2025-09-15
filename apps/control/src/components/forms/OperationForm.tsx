import { useState, useEffect } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useCep } from '../../hooks/useCep';
import type { Operation, CreateOperationRequest, UpdateOperationRequest } from '../../services/subscriptionsService';

interface OperationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateOperationRequest | UpdateOperationRequest) => Promise<void>;
  operation?: Operation | null;
  clientId: string;
  subscriptionId?: string;
  isLoading?: boolean;
}

export function OperationForm({
  isOpen,
  onClose,
  onSubmit,
  operation,
  clientId,
  subscriptionId,
  isLoading = false
}: OperationFormProps) {
  // Hook para busca de CEP
  const { addressData, isLoading: isLoadingCep, error: cepError, searchCep } = useCep();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'pending' as const,
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    notes: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (operation) {
      setFormData({
        name: operation.type || '',
        description: operation.description || '',
        status: operation.status as 'pending' | 'completed' | 'failed' | 'cancelled',
        zipCode: operation.metadata?.address?.zipCode || '',
        street: operation.metadata?.address?.street || '',
        number: operation.metadata?.address?.number || '',
        complement: operation.metadata?.address?.complement || '',
        neighborhood: operation.metadata?.address?.neighborhood || '',
        city: operation.metadata?.address?.city || '',
        state: operation.metadata?.address?.state || '',
        notes: operation.metadata?.notes || '',
        isActive: operation.metadata?.isActive ?? true,
      });
    } else {
      // Reset form for new operation
      setFormData({
        name: '',
        description: '',
        status: 'pending',
        zipCode: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        notes: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [operation, isOpen]);

  // Preenche automaticamente os campos de endereço quando o CEP é encontrado
  useEffect(() => {
    if (addressData) {
      setFormData(prev => ({
        ...prev,
        street: addressData.street,
        neighborhood: addressData.neighborhood,
        city: addressData.city,
        state: addressData.state,
      }));
    }
  }, [addressData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome da operação é obrigatório';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'CEP é obrigatório';
    } else if (!/^\d{5}-?\d{3}$/.test(formData.zipCode)) {
      newErrors.zipCode = 'CEP deve ter o formato 00000-000';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'Rua é obrigatória';
    }

    if (!formData.number.trim()) {
      newErrors.number = 'Número é obrigatório';
    }

    if (!formData.neighborhood.trim()) {
      newErrors.neighborhood = 'Bairro é obrigatório';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Cidade é obrigatória';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'Estado é obrigatório';
    } else if (formData.state.length !== 2) {
      newErrors.state = 'Estado deve ter 2 caracteres (ex: SP)';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const submitData = {
        clientId: String(clientId),
        subscriptionId,
        type: formData.name.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status,
        metadata: {
          address: {
            zipCode: formData.zipCode.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2'),
            street: formData.street.trim(),
            number: formData.number.trim(),
            complement: formData.complement.trim() || undefined,
            neighborhood: formData.neighborhood.trim(),
            city: formData.city.trim(),
            state: formData.state.trim().toUpperCase(),
          },
          notes: formData.notes.trim() || undefined,
          isActive: formData.isActive,
        },
      };

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar operação:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Função especial para lidar com mudança do CEP
  const handleCepChange = async (value: string) => {
    // Formata o CEP
    const formattedCep = value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
    handleInputChange('zipCode', formattedCep);

    // Se o CEP tem 8 dígitos, busca automaticamente
    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      await searchCep(cleanCep);
    }
  };

  const statusOptions = [
    { value: 'pending', label: 'Pendente' },
    { value: 'completed', label: 'Concluída' },
    { value: 'failed', label: 'Falhou' },
    { value: 'cancelled', label: 'Cancelada' },
  ];

  const stateOptions = [
    { value: 'AC', label: 'Acre' },
    { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' },
    { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' },
    { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' },
    { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' },
    { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' },
    { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' },
    { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {operation ? 'Editar Operação' : 'Nova Operação'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Operação *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Padaria Central"
                  className={errors.name ? 'border-red-500' : ''}
                  disabled={isLoading}
                  required
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className={`w-full h-10 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.status ? 'border-red-500' : 'border-gray-300'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isLoading}
                  required
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.status && (
                  <p className="text-red-500 text-sm mt-1">{errors.status}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição (Opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={2}
                placeholder="Descrição da operação..."
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Endereço</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP * {isLoadingCep && <span className="text-primary-600 text-xs">(buscando...)</span>}
                </label>
                <Input
                  value={formData.zipCode}
                  onChange={(e) => handleCepChange(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                  className={errors.zipCode || cepError ? 'border-red-500' : ''}
                  disabled={isLoading || isLoadingCep}
                  required
                />
                {errors.zipCode && (
                  <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>
                )}
                {cepError && (
                  <p className="text-red-500 text-sm mt-1">{cepError}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rua *
                </label>
                <Input
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  placeholder="Nome da rua"
                  className={errors.street ? 'border-red-500' : ''}
                  disabled={isLoading}
                  required
                />
                {errors.street && (
                  <p className="text-red-500 text-sm mt-1">{errors.street}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número *
                </label>
                <Input
                  value={formData.number}
                  onChange={(e) => handleInputChange('number', e.target.value)}
                  placeholder="123"
                  className={errors.number ? 'border-red-500' : ''}
                  disabled={isLoading}
                  required
                />
                {errors.number && (
                  <p className="text-red-500 text-sm mt-1">{errors.number}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Complemento (Opcional)
                </label>
                <Input
                  value={formData.complement}
                  onChange={(e) => handleInputChange('complement', e.target.value)}
                  placeholder="Apto 45"
                  className={errors.complement ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.complement && (
                  <p className="text-red-500 text-sm mt-1">{errors.complement}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bairro *
                </label>
                <Input
                  value={formData.neighborhood}
                  onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                  placeholder="Centro"
                  className={errors.neighborhood ? 'border-red-500' : ''}
                  disabled={isLoading}
                  required
                />
                {errors.neighborhood && (
                  <p className="text-red-500 text-sm mt-1">{errors.neighborhood}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade *
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="São Paulo"
                  className={errors.city ? 'border-red-500' : ''}
                  disabled={isLoading}
                  required
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado *
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className={`w-full h-10 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.state ? 'border-red-500' : 'border-gray-300'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isLoading}
                  required
                >
                  <option value="">Selecione um estado</option>
                  {stateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                )}
              </div>
            </div>
          </div>


          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Operação ativa
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações (Opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              placeholder="Observações sobre a operação..."
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.notes ? 'border-red-500' : 'border-gray-300'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoading}
            />
            {errors.notes && (
              <p className="text-red-500 text-sm mt-1">{errors.notes}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : (operation ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface OperationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateOperationRequest | UpdateOperationRequest) => Promise<void>;
  operation?: Operation | null;
  clientId: string;
  subscriptionId?: string;
  isLoading?: boolean;
}

