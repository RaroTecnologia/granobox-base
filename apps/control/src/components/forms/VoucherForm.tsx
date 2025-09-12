import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import type { CreateVoucherForm, Client } from '../../types';

interface VoucherFormProps {
  // Props para modal (opcional)
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  
  // Props para página
  onSubmit: (data: CreateVoucherForm) => void;
  onCancel?: () => void;
  initialData?: Partial<CreateVoucherForm>;
  showActions?: boolean;
  clients?: Client[];
}

export function VoucherForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onCancel, 
  initialData, 
  title = 'Novo Voucher',
  showActions = false,
  clients = []
}: VoucherFormProps) {
  const [formData, setFormData] = useState<CreateVoucherForm>({
    clientId: initialData?.clientId || '',
    code: initialData?.code || '',
    type: initialData?.type || 'percentage',
    value: initialData?.value || 0,
    description: initialData?.description || '',
    usageLimit: initialData?.usageLimit,
    expiresAt: initialData?.expiresAt,
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

    if (!formData.code.trim()) {
      newErrors.code = 'Código é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (formData.value <= 0) {
      newErrors.value = 'Valor deve ser maior que zero';
    }

    if (formData.type === 'percentage' && formData.value > 100) {
      newErrors.value = 'Porcentagem não pode ser maior que 100%';
    }

    if (formData.usageLimit && formData.usageLimit <= 0) {
      newErrors.usageLimit = 'Limite de uso deve ser maior que zero';
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

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    handleChange('code', code);
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
                    Salvar Voucher
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
        {/* Dados do Voucher */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Dados do Voucher</h3>
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
                Código do Voucher *
              </label>
              <div className="flex gap-2">
                <Input
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  placeholder="DESCONTO10"
                  className={errors.code ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateCode}
                  className="whitespace-nowrap"
                >
                  Gerar
                </Button>
              </div>
              {errors.code && (
                <p className="text-red-500 text-sm mt-1">{errors.code}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Desconto *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value as 'percentage' | 'fixed_amount' | 'free_shipping')}
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 transition-colors"
              >
                <option value="percentage">Porcentagem (%)</option>
                <option value="fixed_amount">Valor Fixo (R$)</option>
                <option value="free_shipping">Frete Grátis</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor *
              </label>
              <div className="relative">
                {formData.type === 'percentage' && (
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                )}
                {formData.type === 'fixed_amount' && (
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                )}
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => handleChange('value', parseFloat(e.target.value) || 0)}
                  placeholder={formData.type === 'percentage' ? '10' : '50.00'}
                  min="0"
                  max={formData.type === 'percentage' ? '100' : undefined}
                  step={formData.type === 'percentage' ? '1' : '0.01'}
                  className={`${errors.value ? 'border-red-500' : ''} ${
                    formData.type === 'fixed_amount' ? 'pl-8' : ''
                  } ${formData.type === 'percentage' ? 'pr-8' : ''}`}
                  disabled={formData.type === 'free_shipping'}
                />
              </div>
              {errors.value && (
                <p className="text-red-500 text-sm mt-1">{errors.value}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <Input
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descrição do voucher"
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Configurações Avançadas */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações (Opcional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limite de Uso
              </label>
              <Input
                type="number"
                value={formData.usageLimit || ''}
                onChange={(e) => handleChange('usageLimit', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Ilimitado"
                min="1"
                className={errors.usageLimit ? 'border-red-500' : ''}
              />
              {errors.usageLimit && (
                <p className="text-red-500 text-sm mt-1">{errors.usageLimit}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Deixe vazio para uso ilimitado
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Expiração
              </label>
              <Input
                type="date"
                value={formData.expiresAt ? formData.expiresAt.toISOString().split('T')[0] : ''}
                onChange={(e) => handleChange('expiresAt', e.target.value ? new Date(e.target.value) : undefined)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Deixe vazio para não expirar
              </p>
            </div>
          </div>
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
            Salvar Voucher
          </Button>
        </div>
      )}
    </form>
  );
}
