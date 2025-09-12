import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import type { CreateBillingForm, Client } from '../../types';

interface BillingFormProps {
  // Props para modal (opcional)
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  
  // Props para página
  onSubmit: (data: CreateBillingForm) => void;
  onCancel?: () => void;
  initialData?: Partial<CreateBillingForm>;
  showActions?: boolean;
  clients?: Client[];
}

export function BillingForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onCancel, 
  initialData, 
  title = 'Nova Cobrança',
  showActions = false,
  clients = []
}: BillingFormProps) {
  const [formData, setFormData] = useState<CreateBillingForm>({
    clientId: initialData?.clientId || '',
    amount: initialData?.amount || 0,
    description: initialData?.description || '',
    dueDate: initialData?.dueDate,
    paymentMethod: initialData?.paymentMethod,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string | number | Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId.trim()) {
      newErrors.clientId = 'Cliente é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
      
      // Se for modal, fechar
      if (onClose) {
        onClose();
      }
    }
  };

  // Se for modal e não estiver aberto, não renderizar
  if (isOpen === false) return null;

  // Renderizar como modal
  if (isOpen === true) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-bold">{title}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X size={16} />
              </Button>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Conteúdo do formulário */}
                {renderFormContent()}

                {/* Botões para modal */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Criar Cobrança
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Renderizar como página (sem modal)
  function renderFormContent() {
    return (
      <>
        {/* Dados da Cobrança */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Dados da Cobrança</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => handleChange('clientId', e.target.value)}
                className={`w-full h-10 px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:border-primary-500 transition-colors ${
                  errors.clientId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione um cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.email}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="text-red-500 text-sm mt-1">{errors.clientId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  className={`pl-8 ${errors.amount ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <Input
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descrição da cobrança"
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Vencimento
              </label>
              <Input
                type="date"
                value={formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : ''}
                onChange={(e) => handleChange('dueDate', e.target.value ? new Date(e.target.value) : undefined)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Deixe vazio para cobrança imediata
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pagamento
              </label>
              <select
                value={formData.paymentMethod || ''}
                onChange={(e) => handleChange('paymentMethod', e.target.value as 'card' | 'pix' | 'boleto' | undefined)}
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="">Selecione um método</option>
                <option value="card">Cartão de Crédito</option>
                <option value="pix">PIX</option>
                <option value="boleto">Boleto</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Deixe vazio para permitir qualquer método
              </p>
            </div>
          </div>
        </div>

        {/* Informações do Stripe */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            💳 Integração com Stripe
          </h4>
          <p className="text-sm text-blue-700">
            Esta cobrança será processada através do Stripe. O cliente receberá um link de pagamento por email.
          </p>
        </div>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {renderFormContent()}

      {/* Botões para página */}
      {showActions && (
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button type="submit">
            Criar Cobrança
          </Button>
        </div>
      )}
    </form>
  );
}
