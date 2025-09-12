import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import type { CreateContactRequest } from '../../types/api';

interface ContactFormData {
  name: string;
  role: string;
  type: 'commercial' | 'technical' | 'financial' | 'administrative' | 'other';
  email: string;
  phone: string;
  whatsapp: string;
  department: string;
  isPrimary: boolean;
  notes: string;
}

interface ContactFormProps {
  clientId: string;
  initialData?: Partial<ContactFormData>;
  onSubmit: (data: CreateContactRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const contactTypes = [
  { value: 'commercial', label: 'Comercial' },
  { value: 'technical', label: 'Técnico' },
  { value: 'financial', label: 'Financeiro' },
  { value: 'administrative', label: 'Administrativo' },
  { value: 'other', label: 'Outro' },
] as const;

export function ContactForm({ 
  clientId, 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    role: '',
    type: 'commercial',
    email: '',
    phone: '',
    whatsapp: '',
    department: '',
    isPrimary: false,
    notes: '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Função para formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  // Função para validar o formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = 'Telefone inválido';
    }

    if (formData.whatsapp && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.whatsapp)) {
      newErrors.whatsapp = 'WhatsApp inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para lidar com mudanças nos campos
  const handleChange = (field: keyof ContactFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Função para lidar com mudanças nos campos de telefone
  const handlePhoneChange = (field: 'phone' | 'whatsapp', value: string) => {
    const formatted = formatPhone(value);
    handleChange(field, formatted);
  };

  // Função para copiar telefone para WhatsApp
  const copyPhoneToWhatsapp = () => {
    if (formData.phone) {
      handleChange('whatsapp', formData.phone);
    }
  };

  // Função para submeter o formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Limpar números dos telefones
    const cleanNumbers = (phone: string) => phone.replace(/\D/g, '');

    const submitData: CreateContactRequest = {
      clientId,
      name: formData.name.trim(),
      role: formData.role.trim() || undefined,
      type: formData.type,
      email: formData.email.trim(),
      phone: formData.phone ? cleanNumbers(formData.phone) : undefined,
      whatsapp: formData.whatsapp ? cleanNumbers(formData.whatsapp) : undefined,
      department: formData.department.trim() || undefined,
      isPrimary: formData.isPrimary,
      notes: formData.notes.trim() || undefined,
    };

    onSubmit(submitData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? 'Editar Contato' : 'Novo Contato'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nome completo do contato"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Cargo e Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cargo
              </label>
              <Input
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                placeholder="Ex: Gerente Comercial"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Contato *
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value as ContactFormData['type'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {contactTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="email@exemplo.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Telefone e WhatsApp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => handlePhoneChange('phone', e.target.value)}
                placeholder="(00) 00000-0000"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  WhatsApp
                </label>
                {formData.phone && (
                  <button
                    type="button"
                    onClick={copyPhoneToWhatsapp}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Copiar telefone
                  </button>
                )}
              </div>
              <Input
                value={formData.whatsapp}
                onChange={(e) => handlePhoneChange('whatsapp', e.target.value)}
                placeholder="(00) 00000-0000"
                className={errors.whatsapp ? 'border-red-500' : ''}
              />
              {errors.whatsapp && (
                <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>
              )}
            </div>
          </div>

          {/* Departamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Departamento
            </label>
            <Input
              value={formData.department}
              onChange={(e) => handleChange('department', e.target.value)}
              placeholder="Ex: Vendas, Suporte, Financeiro"
            />
          </div>

          {/* Contato Principal */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPrimary"
              checked={formData.isPrimary}
              onChange={(e) => handleChange('isPrimary', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isPrimary" className="ml-2 block text-sm text-gray-700">
              Definir como contato principal
            </label>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Observações adicionais sobre o contato"
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
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar Contato'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
