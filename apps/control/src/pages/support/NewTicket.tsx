import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, HeadsetIcon, User, Building } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import type { CreateTicketForm, Client } from '../../types';

// Mock data de clientes para seleção
const mockClients: Client[] = [
  {
    id: '1',
    clientType: 'business',
    name: 'Padaria Pão Dourado',
    legalName: 'João Silva Panificação LTDA',
    email: 'contato@paodourado.com.br',
    phone: '(11) 3456-7890',
    document: '12.345.678/0001-90',
    businessType: 'bakery',
    address: {
      street: 'Rua das Palmeiras',
      number: '456',
      complement: '',
      neighborhood: 'Vila Madalena',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05435-020',
      country: 'Brasil',
    },
    contacts: [],
    status: 'active',
    loanedEquipment: [],
    supportHistory: [],
    trainings: [],
    contractType: 'monthly',
    monthlyFee: 149.90,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    clientType: 'business',
    name: 'Restaurante Sabor & Arte',
    legalName: 'Sabor & Arte Gastronomia S.A.',
    email: 'gerencia@saborearte.com.br',
    phone: '(11) 2345-6789',
    document: '23.456.789/0001-12',
    businessType: 'restaurant',
    address: {
      street: 'Avenida Paulista',
      number: '1578',
      complement: 'Loja 12',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-200',
      country: 'Brasil',
    },
    contacts: [],
    status: 'active',
    loanedEquipment: [],
    supportHistory: [],
    trainings: [],
    contractType: 'annual',
    monthlyFee: 199.90,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    clientType: 'individual',
    name: 'Carlos Eduardo Mendes',
    email: 'carlos.chef@gmail.com',
    phone: '(11) 99555-4444',
    document: '123.456.789-01',
    address: {
      street: 'Rua dos Jardins',
      number: '89',
      complement: 'Apto 45',
      neighborhood: 'Jardins',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      country: 'Brasil',
    },
    contacts: [],
    status: 'active',
    loanedEquipment: [],
    supportHistory: [],
    trainings: [],
    contractType: 'monthly',
    monthlyFee: 79.90,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function NewTicket() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Pegar clientId se veio do state (ex: da página de detalhes do cliente)
  const preSelectedClientId = location.state?.clientId;

  const [formData, setFormData] = useState<CreateTicketForm>({
    clientId: preSelectedClientId || '',
    title: '',
    description: '',
    priority: 'medium',
    category: 'technical',
    assignedTo: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof CreateTicketForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Cliente é obrigatório';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.priority) {
      newErrors.priority = 'Prioridade é obrigatória';
    }

    if (!formData.category) {
      newErrors.category = 'Categoria é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Enviar dados para API
      console.log('Criando ticket:', formData);
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirecionar para listagem de tickets
      navigate('/support');
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClient = mockClients.find(client => client.id === formData.clientId);

  const getBusinessTypeText = (type?: Client['businessType']) => {
    switch (type) {
      case 'restaurant':
        return 'Restaurante';
      case 'bakery':
        return 'Padaria';
      case 'hotel':
        return 'Hotel';
      case 'confectionery':
        return 'Confeitaria';
      case 'other':
        return 'Outro';
      default:
        return 'PF';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/support')}
          className="h-8 w-8"
        >
          <ArrowLeft size={16} />
        </Button>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <HeadsetIcon size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Novo Ticket de Suporte</h1>
            <p className="text-gray-600">
              Crie um novo ticket para registrar uma solicitação de suporte.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Ticket</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seleção de Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => handleChange('clientId', e.target.value)}
                className={`w-full h-10 px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:border-primary-500 ${
                  errors.clientId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione um cliente</option>
                {mockClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {getBusinessTypeText(client.businessType)}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="text-red-500 text-sm mt-1">{errors.clientId}</p>
              )}
            </div>

            {/* Informações do Cliente Selecionado */}
            {selectedClient && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded ${selectedClient.clientType === 'business' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    {selectedClient.clientType === 'business' ? (
                      <Building size={16} className="text-blue-600" />
                    ) : (
                      <User size={16} className="text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{selectedClient.name}</p>
                    {selectedClient.legalName && (
                      <p className="text-sm text-gray-600">{selectedClient.legalName}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Email: {selectedClient.email}</p>
                    <p className="text-gray-600">Telefone: {selectedClient.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tipo: {getBusinessTypeText(selectedClient.businessType)}</p>
                    <p className="text-gray-600">Status: {selectedClient.status === 'active' ? 'Ativo' : selectedClient.status}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <Input
                type="text"
                placeholder="Ex: Problema na impressão de etiquetas"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <textarea
                placeholder="Descreva detalhadamente o problema ou solicitação..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:border-primary-500 resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
            </div>

            {/* Prioridade e Categoria */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridade *
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  className={`w-full h-10 px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:border-primary-500 ${
                    errors.priority ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
                {errors.priority && (
                  <p className="text-red-500 text-sm mt-1">{errors.priority}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className={`w-full h-10 px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:border-primary-500 ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="technical">Técnico</option>
                  <option value="commercial">Comercial</option>
                  <option value="training">Treinamento</option>
                  <option value="equipment">Equipamento</option>
                  <option value="other">Outro</option>
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                )}
              </div>
            </div>

            {/* Responsável */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsável (Opcional)
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => handleChange('assignedTo', e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
              >
                <option value="">Atribuir automaticamente</option>
                <option value="Carlos Mendes">Carlos Mendes</option>
                <option value="Ana Costa">Ana Costa</option>
                <option value="Pedro Silva">Pedro Silva</option>
                <option value="Maria Santos">Maria Santos</option>
              </select>
            </div>

            {/* Botões */}
            <div className="flex items-center gap-4 pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? 'Criando...' : 'Criar Ticket'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/support')}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
