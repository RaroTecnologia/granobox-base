import { useState, useEffect } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Plan, Subscription, CreateSubscriptionRequest, UpdateSubscriptionRequest } from '../../services/subscriptionsService';

interface SubscriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSubscriptionRequest | UpdateSubscriptionRequest) => Promise<void>;
  subscription?: Subscription | null;
  plans: Plan[];
  clientId: string;
  isLoading?: boolean;
}

export function SubscriptionForm({
  isOpen,
  onClose,
  onSubmit,
  subscription,
  plans,
  clientId,
  isLoading = false
}: SubscriptionFormProps) {
  const [formData, setFormData] = useState({
    planId: '',
    status: 'active' as const,
    startDate: '',
    endDate: '',
    price: '',
    currency: 'BRL',
    billingCycle: '30',
    notes: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (subscription) {
      setFormData({
        planId: subscription.planId,
        status: subscription.status as 'active' | 'inactive' | 'cancelled' | 'suspended' | 'expired',
        startDate: subscription.startDate.split('T')[0], // Convert to YYYY-MM-DD format
        endDate: subscription.endDate ? subscription.endDate.split('T')[0] : '',
        price: subscription.price.toString(),
        currency: subscription.currency,
        billingCycle: subscription.billingCycle.toString(),
        notes: subscription.notes || '',
        isActive: subscription.isActive,
      });
    } else {
      // Reset form for new subscription
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        planId: '',
        status: 'active',
        startDate: today,
        endDate: '',
        price: '',
        currency: 'BRL',
        billingCycle: '30',
        notes: '',
        isActive: true,
      });
    }
    setErrors({});
  }, [subscription, isOpen]);

  // Update price when plan changes
  useEffect(() => {
    if (formData.planId && !subscription) {
      const selectedPlan = plans.find(p => p.id === formData.planId);
      if (selectedPlan) {
        setFormData(prev => ({
          ...prev,
          price: selectedPlan.price.toString(),
          currency: selectedPlan.currency,
        }));
      }
    }
  }, [formData.planId, plans, subscription]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.planId) {
      newErrors.planId = 'Plano é obrigatório';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Data de início é obrigatória';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Preço deve ser maior que zero';
    }

    if (!formData.billingCycle || parseInt(formData.billingCycle) <= 0) {
      newErrors.billingCycle = 'Ciclo de cobrança deve ser maior que zero';
    }

    if (formData.endDate && formData.startDate && formData.endDate <= formData.startDate) {
      newErrors.endDate = 'Data de fim deve ser posterior à data de início';
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
        clientId,
        planId: formData.planId,
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        price: parseFloat(formData.price),
        currency: formData.currency,
        billingCycle: parseInt(formData.billingCycle),
        notes: formData.notes || undefined,
        isActive: formData.isActive,
      };

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar assinatura:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const statusOptions = [
    { value: 'active', label: 'Ativa' },
    { value: 'inactive', label: 'Inativa' },
    { value: 'suspended', label: 'Suspensa' },
    { value: 'cancelled', label: 'Cancelada' },
    { value: 'expired', label: 'Expirada' },
  ];

  const planOptions = plans.map(plan => ({
    value: plan.id,
    label: `${plan.name} - ${new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: plan.currency,
    }).format(plan.price)}/${plan.period === 'monthly' ? 'mês' : 'ano'}`,
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {subscription ? 'Editar Assinatura' : 'Nova Assinatura'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plano *
              </label>
              <select
                value={formData.planId}
                onChange={(e) => handleInputChange('planId', e.target.value)}
                className={`w-full h-10 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.planId ? 'border-red-500' : 'border-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoading}
                required
              >
                <option value="">Selecione um plano</option>
                {planOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.planId && (
                <p className="text-red-500 text-sm mt-1">{errors.planId}</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Início *
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={errors.startDate ? 'border-red-500' : ''}
                disabled={isLoading}
                required
              />
              {errors.startDate && (
                <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Fim (Opcional)
              </label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className={errors.endDate ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.endDate && (
                <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className={errors.price ? 'border-red-500' : ''}
                disabled={isLoading}
                required
              />
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Moeda *
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className={`w-full h-10 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.currency ? 'border-red-500' : 'border-gray-300'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isLoading}
                required
              >
                <option value="BRL">Real (BRL)</option>
                <option value="USD">Dólar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
              {errors.currency && (
                <p className="text-red-500 text-sm mt-1">{errors.currency}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciclo de Cobrança (dias) *
              </label>
              <Input
                type="number"
                min="1"
                value={formData.billingCycle}
                onChange={(e) => handleInputChange('billingCycle', e.target.value)}
                className={errors.billingCycle ? 'border-red-500' : ''}
                disabled={isLoading}
                required
              />
              {errors.billingCycle && (
                <p className="text-red-500 text-sm mt-1">{errors.billingCycle}</p>
              )}
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
              Assinatura ativa
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
              {isLoading ? 'Salvando...' : (subscription ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SubscriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSubscriptionRequest | UpdateSubscriptionRequest) => Promise<void>;
  subscription?: Subscription | null;
  plans: Plan[];
  clientId: string;
  isLoading?: boolean;
}

