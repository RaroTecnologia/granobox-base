import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building, 
  User, 
  Phone, 
  EnvelopeSimple, 
  MapPin,
  Calendar,
  CalendarBlank,
  CreditCard,
  Wrench,
  HeadsetIcon,
  GraduationCap,
  Plus,
  PencilSimple,
  Trash,
  WhatsappLogo,
  Users,
  Envelope,
  FileText,
  Receipt
} from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useClient, useActivateClient, useDeactivateClient, useDeleteClient } from '../../hooks/useClients';
import { useContactsByClient, useCreateContact, useUpdateContact, useSetPrimaryContact, useToggleActiveContact, useDeleteContact } from '../../hooks/useContacts';
import { useEquipmentByClient, useEquipmentStats, useCreateEquipment, useUpdateEquipment, useUpdateEquipmentStatus, useToggleActiveEquipment, useDeleteEquipment } from '../../hooks/useEquipment';
import { ContactForm } from '../../components/forms/ContactForm';
import { EquipmentLoanForm } from '../../components/forms/EquipmentLoanForm';
import { ClientUsersList } from '../../components/ClientUsersList';
import { SendInviteModal } from '../../components/modals/SendInviteModal';
import ClientSubscriptions from '../../components/ClientSubscriptions';
import type { ApiClient, ApiContact, CreateContactRequest, ApiEquipment, CreateEquipmentRequest } from '../../types/api';

type TabType = 'overview' | 'contacts' | 'equipment' | 'users' | 'subscriptions' | 'templates' | 'support' | 'training';

export function ClientDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<ApiContact | null>(null);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<ApiEquipment | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Função para obter a aba do hash da URL
  const getTabFromHash = (): TabType => {
    const hash = location.hash.replace('#', '');
    const validTabs: TabType[] = ['overview', 'contacts', 'equipment', 'users', 'subscriptions', 'templates', 'support', 'training'];
    return validTabs.includes(hash as TabType) ? (hash as TabType) : 'overview';
  };

  // Função para atualizar a aba e o hash da URL
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Atualizar o hash da URL sem recarregar a página
    window.history.replaceState(null, '', `${location.pathname}#${tab}`);
  };

  // Sincronizar aba com hash da URL na inicialização e mudanças de hash
  useEffect(() => {
    const tabFromHash = getTabFromHash();
    setActiveTab(tabFromHash);
  }, [location.hash]);

  // Listener para mudanças no hash (navegação do browser)
  useEffect(() => {
    const handleHashChange = () => {
      const tabFromHash = getTabFromHash();
      setActiveTab(tabFromHash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Função para navegar para uma aba específica de forma programática
  const navigateToTab = (tab: TabType) => {
    handleTabChange(tab);
    // Scroll suave para o topo das abas
    const tabsElement = document.querySelector('[data-tabs-container]');
    if (tabsElement) {
      tabsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Buscar cliente da API
  const { data: client, isLoading, error } = useClient(id!);
  const activateClientMutation = useActivateClient();
  const deactivateClientMutation = useDeactivateClient();
  const deleteClientMutation = useDeleteClient();

  // Hooks para contatos
  const { data: contacts = [], isLoading: contactsLoading } = useContactsByClient(id!);
  const createContactMutation = useCreateContact();
  const updateContactMutation = useUpdateContact();
  const setPrimaryContactMutation = useSetPrimaryContact();
  const toggleActiveContactMutation = useToggleActiveContact();
  const deleteContactMutation = useDeleteContact();

  // Hooks para equipamentos
  const { data: equipment = [], isLoading: equipmentLoading } = useEquipmentByClient(id!);
  const { data: equipmentStats } = useEquipmentStats(id!);
  const createEquipmentMutation = useCreateEquipment();
  const updateEquipmentMutation = useUpdateEquipment();
  // const updateEquipmentStatusMutation = useUpdateEquipmentStatus();
  // const toggleActiveEquipmentMutation = useToggleActiveEquipment();
  const deleteEquipmentMutation = useDeleteEquipment();

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

  // Funções para gerenciar contatos
  const handleCreateContact = async (data: CreateContactRequest) => {
    try {
      await createContactMutation.mutateAsync(data);
      setShowContactForm(false);
    } catch (error) {
      console.error('Erro ao criar contato:', error);
    }
  };

  const handleUpdateContact = async (data: CreateContactRequest) => {
    if (!editingContact) return;
    
    try {
      await updateContactMutation.mutateAsync({
        id: editingContact.id,
        data,
      });
      setEditingContact(null);
      setShowContactForm(false);
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
    }
  };

  const handleSetPrimary = async (contactId: string) => {
    try {
      await setPrimaryContactMutation.mutateAsync(contactId);
    } catch (error) {
      console.error('Erro ao definir contato principal:', error);
    }
  };

  const handleToggleActive = async (contactId: string) => {
    try {
      await toggleActiveContactMutation.mutateAsync(contactId);
    } catch (error) {
      console.error('Erro ao alterar status do contato:', error);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) return;
    
    try {
      await deleteContactMutation.mutateAsync(contactId);
    } catch (error) {
      console.error('Erro ao excluir contato:', error);
    }
  };

  const handleEditContact = (contact: ApiContact) => {
    setEditingContact(contact);
    setShowContactForm(true);
  };

  const handleCancelContactForm = () => {
    setShowContactForm(false);
    setEditingContact(null);
  };

  // Funções para gerenciar equipamentos (comodato)
  const handleCreateEquipmentLoan = async (data: { equipmentId: string; loanStartDate: string; loanEndDate?: string; location?: string; notes?: string }) => {
    try {
      // Atualizar o equipamento para associá-lo ao cliente
      await updateEquipmentMutation.mutateAsync({
        id: data.equipmentId,
        data: {
          clientId: id!,
          loanStartDate: data.loanStartDate,
          loanEndDate: data.loanEndDate,
          location: data.location,
          notes: data.notes,
          status: 'active', // Equipamento fica ativo quando emprestado
        },
      });
      setShowEquipmentForm(false);
    } catch (error) {
      console.error('Erro ao associar equipamento:', error);
    }
  };

  const handleUpdateEquipmentLoan = async (data: { equipmentId: string; loanStartDate: string; loanEndDate?: string; location?: string; notes?: string }) => {
    if (!editingEquipment) return;

    try {
      await updateEquipmentMutation.mutateAsync({
        id: editingEquipment.id,
        data: {
          loanStartDate: data.loanStartDate,
          loanEndDate: data.loanEndDate,
          location: data.location,
          notes: data.notes,
        },
      });
      setEditingEquipment(null);
      setShowEquipmentForm(false);
    } catch (error) {
      console.error('Erro ao atualizar comodato:', error);
    }
  };

  // Funções comentadas para uso futuro
  // const handleUpdateEquipmentStatus = async (equipmentId: string, status: ApiEquipment['status']) => {
  //   try {
  //     await updateEquipmentStatusMutation.mutateAsync({ id: equipmentId, status });
  //   } catch (error) {
  //     console.error('Erro ao alterar status do equipamento:', error);
  //   }
  // };

  // const handleToggleActiveEquipment = async (equipmentId: string) => {
  //   try {
  //     await toggleActiveEquipmentMutation.mutateAsync(equipmentId);
  //   } catch (error) {
  //     console.error('Erro ao alterar status ativo do equipamento:', error);
  //   }
  // };

  const handleReturnEquipment = async (equipmentId: string) => {
    if (!confirm('Tem certeza que deseja devolver este equipamento?')) return;

    try {
      await updateEquipmentMutation.mutateAsync({
        id: equipmentId,
        data: {
          status: 'returned',
          returnDate: new Date().toISOString().split('T')[0],
          clientId: '', // Remove associação com cliente
        },
      });
    } catch (error) {
      console.error('Erro ao devolver equipamento:', error);
    }
  };

  const handleDeleteEquipment = async (equipmentId: string) => {
    if (!confirm('Tem certeza que deseja remover este equipamento do comodato?')) return;

    try {
      // Remove associação mas não deleta o equipamento do inventário
      await updateEquipmentMutation.mutateAsync({
        id: equipmentId,
        data: {
          status: 'inactive',
          clientId: '', // Remove associação com cliente
        },
      });
    } catch (error) {
      console.error('Erro ao remover equipamento:', error);
    }
  };

  const handleEditEquipment = (equipment: ApiEquipment) => {
    setEditingEquipment(equipment);
    setShowEquipmentForm(true);
  };

  const handleCancelEquipmentForm = () => {
    setShowEquipmentForm(false);
    setEditingEquipment(null);
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

  const getStatusColor = (status: ApiClient['status']) => {
    switch (status) {
      case 'active':
        return 'bg-primary-100 text-primary-800';
      case 'prospect':
        return 'bg-gray-100 text-gray-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-warning-100 text-warning-800';
      case 'cancelled':
        return 'bg-danger-100 text-danger-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: ApiClient['status']) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'prospect':
        return 'Prospect';
      case 'inactive':
        return 'Inativo';
      case 'suspended':
        return 'Suspenso';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconhecido';
    }
  };

  const getBusinessTypeText = (type?: ApiClient['businessType']) => {
    switch (type) {
      case 'restaurant':
        return 'Restaurante';
      case 'bakery':
        return 'Padaria';
      case 'hotel':
        return 'Hotel';
      case 'confectionery':
        return 'Confeitaria';
      case 'supermarket':
        return 'Supermercado';
      case 'other':
        return 'Outro';
      default:
        return '-';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: User },
    { id: 'contacts', label: 'Contatos', icon: EnvelopeSimple },
    { id: 'equipment', label: 'Equipamentos', icon: Wrench },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'subscriptions', label: 'Assinaturas', icon: Receipt },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'support', label: 'Suporte', icon: HeadsetIcon },
    { id: 'training', label: 'Treinamentos', icon: GraduationCap },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/clients')}
            className="h-8 w-8"
          >
            <ArrowLeft size={16} />
          </Button>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${client.clientType === 'business' ? 'bg-blue-100' : 'bg-green-100'}`}>
              {client.clientType === 'business' ? (
                <Building size={24} className="text-blue-600" />
              ) : (
                <User size={24} className="text-green-600" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {client.businessName || (client.clientType === 'individual' ? client.fullName : client.legalName)}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                {client.businessName && client.clientType === 'individual' && client.fullName && (
                  <p className="text-gray-600">{client.fullName}</p>
                )}
                {client.businessName && client.clientType === 'business' && client.legalName && (
                  <p className="text-gray-600">{client.legalName}</p>
                )}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                  {getStatusText(client.status)}
                </span>
                <span className="text-sm text-gray-500 font-mono">
                  {client.clientType === 'individual' 
                    ? (client.cpf ? formatCpf(client.cpf) : '') 
                    : (client.cnpj ? formatCnpj(client.cnpj) : '')
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/clients/${client.id}/edit`)}>
            <PencilSimple size={16} className="mr-2" />
            Editar Cliente
          </Button>
          
          {client.status === 'active' ? (
            <Button 
              variant="outline" 
              onClick={async () => {
                if (confirm('Tem certeza que deseja desativar este cliente?')) {
                  try {
                    await deactivateClientMutation.mutateAsync(client.id);
                  } catch (error) {
                    alert('Erro ao desativar cliente');
                  }
                }
              }}
              disabled={deactivateClientMutation.isPending}
            >
              Desativar
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={async () => {
                if (confirm('Tem certeza que deseja ativar este cliente?')) {
                  try {
                    await activateClientMutation.mutateAsync(client.id);
                  } catch (error) {
                    alert('Erro ao ativar cliente');
                  }
                }
              }}
              disabled={activateClientMutation.isPending}
            >
              Ativar
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={async () => {
              if (confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
                try {
                  await deleteClientMutation.mutateAsync(client.id);
                  navigate('/clients', {
                    state: {
                      message: 'Cliente excluído com sucesso!',
                      type: 'success'
                    }
                  });
                } catch (error) {
                  alert('Erro ao excluir cliente');
                }
              }
            }}
            disabled={deleteClientMutation.isPending}
            className="text-danger-600 hover:text-danger-700 border-danger-300 hover:border-danger-400"
          >
            <Trash size={16} className="mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Mensal</p>
                <p className="text-2xl font-bold text-primary-600">
                  R$ {client.monthlyFee ? Number(client.monthlyFee).toFixed(2) : '0,00'}
                </p>
              </div>
              <div className="p-3 bg-primary-100 rounded-full">
                <CreditCard size={20} className="text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigateToTab('equipment')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Equipamentos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {equipmentStats?.total || 0}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <Wrench size={20} className="text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigateToTab('support')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tickets Suporte</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <HeadsetIcon size={20} className="text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigateToTab('training')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Treinamentos</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <GraduationCap size={20} className="text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mt-8" data-tabs-container>
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as TabType)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <EnvelopeSimple size={16} className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{client.contactEmail}</p>
                </div>
              </div>
              
              {client.contactPhone && (
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="font-medium">{formatPhone(client.contactPhone)}</p>
                  </div>
                </div>
              )}

              {client.contactWhatsapp && (
                <div className="flex items-center gap-3">
                  <WhatsappLogo size={16} className="text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">WhatsApp</p>
                    <p className="font-medium">{formatPhone(client.contactWhatsapp)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Endereço</p>
                  <p className="font-medium">
                    {client.street}, {client.number}
                    {client.complement && `, ${client.complement}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {client.neighborhood}, {client.city} - {client.state}
                  </p>
                  <p className="text-sm text-gray-600">{formatCep(client.zipCode)}</p>
                </div>
              </div>

              {client.businessType && (
                <div className="flex items-center gap-3">
                  <Building size={16} className="text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Tipo de Estabelecimento</p>
                    <p className="font-medium">{getBusinessTypeText(client.businessType)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Data de Ativação</p>
                  <p className="font-medium">
                    {client.activatedAt 
                      ? new Date(client.activatedAt).toLocaleDateString('pt-BR') 
                      : 'Não ativado'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Dados Comerciais */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Comerciais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Valor Mensal</p>
                <p className="font-medium">R$ {client.monthlyFee ? Number(client.monthlyFee).toFixed(2) : '0,00'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Taxa de Instalação</p>
                <p className="font-medium">R$ {client.setupFee ? Number(client.setupFee).toFixed(2) : '0,00'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Prazo de Pagamento</p>
                <p className="font-medium">{client.paymentTerms || 30} dias</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Cliente desde</p>
                <p className="font-medium">
                  {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'contacts' && (
        <div className="space-y-6">
          {/* Formulário de contato */}
          {showContactForm && (
            <ContactForm
              clientId={id!}
              initialData={editingContact ? {
                name: editingContact.name,
                role: editingContact.role || '',
                type: editingContact.type,
                email: editingContact.email,
                phone: editingContact.phone ? formatPhone(editingContact.phone) : '',
                whatsapp: editingContact.whatsapp ? formatPhone(editingContact.whatsapp) : '',
                department: editingContact.department || '',
                isPrimary: editingContact.isPrimary,
                notes: editingContact.notes || '',
              } : undefined}
              onSubmit={editingContact ? handleUpdateContact : handleCreateContact}
              onCancel={handleCancelContactForm}
              isLoading={createContactMutation.isPending || updateContactMutation.isPending}
            />
          )}

          {/* Lista de contatos */}
          {!showContactForm && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Contatos do Cliente</CardTitle>
                  <Button onClick={() => setShowContactForm(true)}>
                    <Plus size={16} className="mr-2" />
                    Adicionar Contato
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {contactsLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Carregando contatos...</p>
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <EnvelopeSimple size={48} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Nenhum contato cadastrado</h3>
                    <p className="mb-4">Adicione o primeiro contato para este cliente.</p>
                    <Button onClick={() => setShowContactForm(true)}>
                      <Plus size={16} className="mr-2" />
                      Adicionar Primeiro Contato
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`border rounded-lg p-4 ${
                          contact.isPrimary 
                            ? 'bg-primary-50 border-primary-200' 
                            : contact.isActive 
                              ? 'bg-white border-gray-200' 
                              : 'bg-gray-50 border-gray-200 opacity-75'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">{contact.name}</h4>
                              {contact.isPrimary && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                  Principal
                                </span>
                              )}
                              {!contact.isActive && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                  Inativo
                                </span>
                              )}
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                                {contact.type === 'commercial' && 'Comercial'}
                                {contact.type === 'technical' && 'Técnico'}
                                {contact.type === 'financial' && 'Financeiro'}
                                {contact.type === 'administrative' && 'Administrativo'}
                                {contact.type === 'other' && 'Outro'}
                              </span>
                            </div>
                            
                            {contact.role && (
                              <p className="text-sm text-gray-600 mb-2">{contact.role}</p>
                            )}
                            
                            {contact.department && (
                              <p className="text-sm text-gray-500 mb-2">Departamento: {contact.department}</p>
                            )}
                            
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <EnvelopeSimple size={14} />
                                {contact.email}
                              </div>
                              {contact.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone size={14} />
                                  {formatPhone(contact.phone)}
                                </div>
                              )}
                              {contact.whatsapp && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <WhatsappLogo size={14} />
                                  {formatPhone(contact.whatsapp)}
                                </div>
                              )}
                            </div>

                            {contact.notes && (
                              <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                                <strong>Observações:</strong> {contact.notes}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            {!contact.isPrimary && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetPrimary(contact.id)}
                                disabled={setPrimaryContactMutation.isPending}
                              >
                                Tornar Principal
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleActive(contact.id)}
                              disabled={toggleActiveContactMutation.isPending}
                            >
                              {contact.isActive ? 'Desativar' : 'Ativar'}
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditContact(contact)}
                            >
                              <PencilSimple size={14} />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteContact(contact.id)}
                              disabled={deleteContactMutation.isPending}
                              className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                            >
                              <Trash size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'equipment' && (
        <div className="space-y-6">
          {/* Formulário de equipamento */}
          {showEquipmentForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingEquipment ? 'Editar Comodato' : 'Associar Equipamento'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EquipmentLoanForm
                  clientId={id!}
                  initialData={editingEquipment}
                  onSubmit={editingEquipment ? handleUpdateEquipmentLoan : handleCreateEquipmentLoan}
                  onCancel={handleCancelEquipmentForm}
                  isSubmitting={updateEquipmentMutation.isPending}
                  submitText={editingEquipment ? 'Salvar Alterações' : 'Associar Equipamento'}
                />
              </CardContent>
            </Card>
          )}

          {/* Lista de equipamentos */}
          {!showEquipmentForm && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Equipamentos em Comodato</CardTitle>
                  <Button onClick={() => setShowEquipmentForm(true)}>
                    <Plus size={16} className="mr-2" />
                    Associar Equipamento
                  </Button>
                </div>
              </CardHeader>
          <CardContent>
            {equipmentLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Carregando equipamentos...</p>
              </div>
            ) : equipment.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Wrench size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Nenhum equipamento cadastrado</h3>
                <p className="mb-4">Este cliente ainda não possui equipamentos em comodato.</p>
                <Button onClick={() => setShowEquipmentForm(true)}>
                  <Plus size={16} className="mr-2" />
                  Adicionar Primeiro Equipamento
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Estatísticas resumidas */}
                {equipmentStats && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-lg font-semibold text-gray-900">{equipmentStats.total}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Ativos</p>
                      <p className="text-lg font-semibold text-primary-600">{equipmentStats.active}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Manutenção</p>
                      <p className="text-lg font-semibold text-warning-600">{equipmentStats.maintenance}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Inativos</p>
                      <p className="text-lg font-semibold text-gray-600">{equipmentStats.inactive}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Devolvidos</p>
                      <p className="text-lg font-semibold text-gray-500">{equipmentStats.returned}</p>
                    </div>
                  </div>
                )}

                {/* Lista de equipamentos */}
                {equipment.map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-4 ${
                      item.status === 'active' 
                        ? 'bg-white border-gray-200' 
                        : item.status === 'maintenance'
                          ? 'bg-warning-50 border-warning-200'
                          : item.status === 'returned'
                            ? 'bg-gray-50 border-gray-200 opacity-75'
                            : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === 'active' ? 'bg-primary-100 text-primary-800' :
                            item.status === 'maintenance' ? 'bg-warning-100 text-warning-800' :
                            item.status === 'inactive' ? 'bg-gray-100 text-gray-600' :
                            item.status === 'returned' ? 'bg-gray-100 text-gray-600' :
                            item.status === 'lost' ? 'bg-red-100 text-red-800' :
                            item.status === 'damaged' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {item.status === 'active' && 'Ativo'}
                            {item.status === 'maintenance' && 'Manutenção'}
                            {item.status === 'inactive' && 'Inativo'}
                            {item.status === 'returned' && 'Devolvido'}
                            {item.status === 'lost' && 'Perdido'}
                            {item.status === 'damaged' && 'Danificado'}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                            {item.type === 'printer' && 'Impressora'}
                            {item.type === 'scale' && 'Balança'}
                            {item.type === 'scanner' && 'Scanner'}
                            {item.type === 'tablet' && 'Tablet'}
                            {item.type === 'computer' && 'Computador'}
                            {item.type === 'other' && 'Outro'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <p><strong>Marca:</strong> {item.brand}</p>
                            <p><strong>Modelo:</strong> {item.model}</p>
                            <p><strong>Série:</strong> {item.serialNumber}</p>
                            {item.patrimonyNumber && (
                              <p><strong>Patrimônio:</strong> {item.patrimonyNumber}</p>
                            )}
                          </div>
                          <div>
                            <p><strong>Início do Comodato:</strong> {new Date(item.loanStartDate).toLocaleDateString('pt-BR')}</p>
                            {item.loanEndDate && (
                              <p><strong>Fim Previsto:</strong> {new Date(item.loanEndDate).toLocaleDateString('pt-BR')}</p>
                            )}
                            {item.returnDate && (
                              <p><strong>Data de Devolução:</strong> {new Date(item.returnDate).toLocaleDateString('pt-BR')}</p>
                            )}
                            {item.location && (
                              <p><strong>Localização:</strong> {item.location}</p>
                            )}
                          </div>
                        </div>

                        {item.notes && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                            <strong>Observações:</strong> {item.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditEquipment(item)}
                          title="Editar comodato"
                        >
                          <PencilSimple size={14} />
                        </Button>
                        
                        {item.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReturnEquipment(item.id)}
                            disabled={updateEquipmentMutation.isPending}
                            className="text-warning-600 hover:text-warning-700 border-warning-200 hover:border-warning-300"
                            title="Devolver equipamento"
                          >
                            <ArrowLeft size={14} />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteEquipment(item.id)}
                          disabled={updateEquipmentMutation.isPending}
                          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          title="Remover do comodato"
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Lista de usuários */}
          <ClientUsersList clientId={id!} />
          
          {/* Botão para enviar convite */}
          <div className="flex justify-end">
            <Button onClick={() => setShowInviteModal(true)}>
              <Envelope size={16} className="mr-2" />
              Enviar Convite
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <ClientSubscriptions clientId={id!} />
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Associações de Templates</CardTitle>
              <p className="text-sm text-gray-600">
                Configure quais templates usar para cada tipo de etiqueta deste cliente
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Gerenciar Templates
                </h3>
                <p className="text-gray-600 mb-4">
                  Configure as associações de templates para este cliente
                </p>
                <Button onClick={() => navigate(`/templates/associations/${id}`)}>
                  <FileText size={16} className="mr-2" />
                  Gerenciar Templates
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'support' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Histórico de Suporte</CardTitle>
            <Button size="sm" onClick={() => navigate('/support/new')}>
              <Plus size={16} className="mr-2" />
              Novo Ticket
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <HeadsetIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum ticket de suporte
              </h3>
              <p className="text-gray-500 mb-4">
                Este cliente ainda não possui tickets de suporte registrados.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Tipos de suporte disponíveis:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Suporte técnico (configuração, problemas)</li>
                  <li>• Dúvidas sobre o sistema</li>
                  <li>• Solicitações de treinamento</li>
                  <li>• Problemas com equipamentos</li>
                </ul>
              </div>
              <Button onClick={() => navigate('/support/new')}>
                <Plus size={16} className="mr-2" />
                Criar Primeiro Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'training' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Histórico de Treinamentos</CardTitle>
            <Button size="sm" disabled>
              <Plus size={16} className="mr-2" />
              Agendar Treinamento
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Módulo em Desenvolvimento
              </h3>
              <p className="text-gray-500 mb-4">
                O sistema de agendamento de treinamentos estará disponível em breve.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h4 className="font-medium text-gray-900 mb-2">Tipos de treinamento planejados:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Treinamento inicial (onboarding)</li>
                  <li>• Treinamento avançado de funcionalidades</li>
                  <li>• Treinamento para novos funcionários</li>
                  <li>• Workshops de melhores práticas</li>
                  <li>• Suporte técnico especializado</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de convite */}
      <SendInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        clientId={id!}
        clientName={client?.businessName || client?.fullName || 'Cliente'}
      />
    </div>
  );
}
