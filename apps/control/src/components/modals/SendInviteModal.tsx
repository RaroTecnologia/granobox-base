import { useState } from 'react';
import { X, Envelope, User, ChatText } from '@phosphor-icons/react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useSendClientInvite } from '../../hooks/useClientInvites';

interface SendInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
}

export function SendInviteModal({ isOpen, onClose, clientId, clientName }: SendInviteModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    message: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const sendInviteMutation = useSendClientInvite();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
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
      await sendInviteMutation.mutateAsync({
        clientId,
        inviteData: {
          email: formData.email.trim(),
          name: formData.name.trim(),
          message: formData.message.trim() || undefined,
        },
      });

      // Reset form and close modal
      setFormData({ email: '', name: '', message: '' });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      style={{ top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: 0 }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Enviar Convite</h2>
            <p className="text-sm text-gray-600">Convidar usuário master para {clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Usuário Master *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: João Silva"
                className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <div className="relative">
              <Envelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Ex: joao@restaurante.com"
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem Personalizada (opcional)
            </label>
            <div className="relative">
              <ChatText className="absolute left-3 top-3 text-gray-400" size={16} />
              <textarea
                value={formData.message}
                onChange={(e) => handleChange('message', e.target.value)}
                placeholder="Ex: Bem-vindo à plataforma Granobox!"
                rows={3}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={sendInviteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={sendInviteMutation.isPending}
            >
              {sendInviteMutation.isPending ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
