import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ClientForm } from '../../components/forms/ClientForm';
import { useClient, useUpdateClient } from '../../hooks/useClients';
import type { CreateClientForm } from '../../types';
import type { CreateClientRequest } from '../../types/api';

export function EditClient() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Buscar cliente da API
  const { data: client, isLoading, error } = useClient(id!);
  const updateClientMutation = useUpdateClient();

  const handleSubmit = async (data: CreateClientForm) => {
    if (!id) return;
    
    try {
      // Função para limpar números (remover formatação)
      const cleanNumbers = (str: string) => str.replace(/\D/g, '');
      
      // Validar se endereço está completo
      if (!data.address?.zipCode || !data.address?.street || !data.address?.number || 
          !data.address?.neighborhood || !data.address?.city || !data.address?.state) {
        alert('Por favor, preencha todos os campos obrigatórios do endereço.');
        return;
      }
      
      // Converter dados do formulário para o formato da API
      const apiData: Partial<CreateClientRequest> = {
        clientType: data.clientType,
        fullName: data.clientType === 'individual' ? data.name : undefined,
        legalName: data.clientType === 'business' ? data.name : undefined,
        businessName: data.legalName || undefined,
        cpf: data.clientType === 'individual' ? cleanNumbers(data.document) : undefined,
        cnpj: data.clientType === 'business' ? cleanNumbers(data.document) : undefined,
        contactEmail: data.email,
        contactPhone: data.phone ? cleanNumbers(data.phone) : undefined,
        contactWhatsapp: data.whatsapp ? cleanNumbers(data.whatsapp) : (data.phone ? cleanNumbers(data.phone) : undefined),
        businessType: data.businessType,
        contractType: data.contractType,
        monthlyFee: data.monthlyFee,
        setupFee: data.setupFee,
        paymentTerms: data.paymentTerms,
        assignedSalesperson: data.assignedSalesperson,
        notes: data.notes,
        // Endereço
        street: data.address.street,
        number: data.address.number,
        complement: data.address.complement || undefined,
        neighborhood: data.address.neighborhood,
        city: data.address.city,
        state: data.address.state.toUpperCase(),
        zipCode: cleanNumbers(data.address.zipCode),
        // Contato principal (apenas para PJ)
        contactName: data.primaryContact?.name,
        contactRole: data.primaryContact?.role,
        contactPersonalEmail: data.primaryContact?.email,
        contactPersonalPhone: data.primaryContact?.phone ? cleanNumbers(data.primaryContact.phone) : undefined,
      };

      await updateClientMutation.mutateAsync({ id, data: apiData });
      
      navigate('/clients', { 
        state: { 
          message: 'Cliente atualizado com sucesso!',
          type: 'success' 
        }
      });
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error);
      alert(error?.response?.data?.message || 'Erro ao atualizar cliente. Tente novamente.');
    }
  };

  const handleCancel = () => {
    navigate('/clients');
  };

  // Estados de loading e erro
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/clients')}
            className="h-8 w-8"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Carregando...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/clients')}
            className="h-8 w-8"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cliente não encontrado</h1>
            <p className="text-gray-600">
              O cliente solicitado não foi encontrado ou você não tem permissão para acessá-lo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Funções de formatação
  const formatCpf = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCnpj = (cnpj: string) => {
    const numbers = cnpj.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatPhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numbers.length === 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  const formatCep = (cep: string) => {
    const numbers = cep.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  // Converter dados da API para o formato do formulário
  const initialData: CreateClientForm = {
    clientType: client.clientType,
    name: client.clientType === 'individual' ? (client.fullName || '') : (client.legalName || ''),
    document: client.clientType === 'individual' 
      ? (client.cpf ? formatCpf(client.cpf) : '') 
      : (client.cnpj ? formatCnpj(client.cnpj) : ''),
    email: client.contactEmail || '',
    phone: client.contactPhone ? formatPhone(client.contactPhone) : '',
    whatsapp: client.contactWhatsapp ? formatPhone(client.contactWhatsapp) : '',
    legalName: client.businessName || '', // Nome fantasia
    businessType: client.businessType || 'restaurant',
    contractType: client.contractType || 'monthly',
    monthlyFee: client.monthlyFee || 0,
    setupFee: client.setupFee || 0,
    paymentTerms: client.paymentTerms || 30,
    assignedSalesperson: client.assignedSalesperson || '',
    notes: client.notes || '',
    address: {
      street: client.street || '',
      number: client.number || '',
      complement: client.complement || '',
      neighborhood: client.neighborhood || '',
      city: client.city || '',
      state: client.state || '',
      zipCode: client.zipCode ? formatCep(client.zipCode) : '',
      country: 'Brasil', // Campo fixo, não vem da API
    },
    primaryContact: client.contactName ? {
      name: client.contactName,
      role: client.contactRole || '',
      email: client.contactPersonalEmail || '',
      phone: client.contactPersonalPhone ? formatPhone(client.contactPersonalPhone) : '',
    } : undefined,
  };

  return (
    <div className="space-y-6">
      {/* Header com navegação */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/clients')}
          className="h-8 w-8"
        >
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Cliente</h1>
          <p className="text-gray-600">
            Atualize os dados do cliente {initialData.name}.
          </p>
        </div>
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            initialData={initialData}
            isLoading={updateClientMutation.isPending}
            showActions={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
