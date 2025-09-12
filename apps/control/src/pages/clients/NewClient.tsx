import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ClientForm } from '../../components/forms/ClientForm';
import { useCreateClient } from '../../hooks/useClients';
import type { CreateClientForm } from '../../types';
import type { CreateClientRequest } from '../../types/api';

export function NewClient() {
  const navigate = useNavigate();
  const createClientMutation = useCreateClient();

  const handleSubmit = async (data: CreateClientForm) => {
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
      const apiData: CreateClientRequest = {
        clientType: data.clientType,
        
        // Dados PF
        fullName: data.clientType === 'individual' ? data.name : undefined,
        cpf: data.clientType === 'individual' ? cleanNumbers(data.document) : undefined,
        
        // Dados PJ
        legalName: data.clientType === 'business' ? data.name : undefined, // Razão social
        cnpj: data.clientType === 'business' ? cleanNumbers(data.document) : undefined,
        
        // Nome fantasia (para ambos PF e PJ)
        businessName: data.legalName || undefined,
        businessType: data.businessType,
        
        // Contato principal
        contactName: data.primaryContact?.name || data.name,
        contactEmail: data.email,
        contactPhone: data.phone ? cleanNumbers(data.phone) : undefined,
        contactWhatsapp: data.whatsapp ? cleanNumbers(data.whatsapp) : (data.phone ? cleanNumbers(data.phone) : undefined),
        
        // Endereço (todos obrigatórios)
        zipCode: cleanNumbers(data.address.zipCode),
        street: data.address.street,
        number: data.address.number,
        complement: data.address.complement,
        neighborhood: data.address.neighborhood,
        city: data.address.city,
        state: data.address.state.toUpperCase(), // Garantir que seja maiúsculo
        
        // Termos comerciais
        monthlyFee: data.monthlyFee || 0,
        setupFee: data.setupFee || 0,
        paymentTerms: data.paymentTerms || 30,
        notes: data.notes,
      };

      await createClientMutation.mutateAsync(apiData);
      
      navigate('/clients', { 
        state: { 
          message: 'Cliente criado com sucesso!',
          type: 'success' 
        }
      });
    } catch (error: any) {
      console.error('Erro ao criar cliente:', error);
      
      // Mostrar mensagem de erro específica da API
      let errorMessage = 'Erro ao criar cliente. Tente novamente.';
      
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(', ');
        } else {
          errorMessage = error.response.data.message;
        }
      }
      
      alert(errorMessage);
    }
  };

  const handleCancel = () => {
    navigate('/clients');
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
          <h1 className="text-3xl font-bold tracking-tight">Novo Cliente</h1>
          <p className="text-gray-600">
            Preencha os dados abaixo para cadastrar um novo cliente.
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
            showActions={true}
            isLoading={createClientMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
