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
  CreditCard,
  Wrench,
  Plus,
  PencilSimple,
  Trash,
  WhatsappLogo,
  Users,
  Envelope,
  FileText,
  Printer,
  Copy,
  IdentificationCard,
  Package,
  GearSix
} from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useClient, useActivateClient, useDeactivateClient, useDeleteClient, useUpdateClient } from '../../hooks/useClients';
import { printersService } from '../../services/api';
import { useContactsByClient, useCreateContact, useUpdateContact, useSetPrimaryContact, useToggleActiveContact, useDeleteContact } from '../../hooks/useContacts';
import { useEquipmentByClient, useEquipmentStats, useUpdateEquipment } from '../../hooks/useEquipment';
import { templatesService } from '../../services/templates';
import { ContactForm } from '../../components/forms/ContactForm';
import { EquipmentLoanForm } from '../../components/forms/EquipmentLoanForm';
import { ClientUsersList } from '../../components/ClientUsersList';
import { useOperationsByClient } from '../../hooks/useOperations';
import { OperationFormModal } from '../../components/modals/OperationFormModal';
import { SendInviteModal } from '../../components/modals/SendInviteModal';
import { useOperatorsByClient } from '../../hooks/useOperators';
import { OperatorFormModal } from '../../components/modals/OperatorFormModal';
import { MaintenanceFormModal } from '../../components/modals/MaintenanceFormModal';
import { ClientPlanManager } from '../../components/ClientPlanManager';
import { PlanLimits } from '../../components/PlanLimits';
import { EdgeGoAvailabilityChart } from '../../components/EdgeGoAvailabilityChart';
import { PrintConfigForm } from '../../components/forms/PrintConfigForm';
import { ClientPublicTemplatesForm } from '../../components/forms/ClientPublicTemplatesForm';
import { useCreateMaintenance } from '../../hooks/useMaintenance';
import type { ApiClient, ApiContact, CreateContactRequest, ApiEquipment } from '../../types/api';

type TabType = 'overview' | 'business' | 'people' | 'assets' | 'printing';

type BusinessSubTab = 'plans';
type PeopleSubTab = 'contacts' | 'users' | 'operators';
type AssetsSubTab = 'equipment' | 'operations';
type PrintingSubTab = 'config' | 'public-templates';

const DEFAULT_SUB: Record<Exclude<TabType, 'overview'>, string> = {
  business: 'plans',
  people: 'contacts',
  assets: 'equipment',
  printing: 'config',
};

export function ClientDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [subTab, setSubTab] = useState<string>(DEFAULT_SUB.business);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<ApiContact | null>(null);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<ApiEquipment | null>(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedEquipmentForMaintenance, setSelectedEquipmentForMaintenance] = useState<ApiEquipment | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [logoUuid, setLogoUuid] = useState('');
  const [granoboxPrinters, setGranoboxPrinters] = useState<any[]>([]);
  const [isLoadingGranoboxPrinters, setIsLoadingGranoboxPrinters] = useState(false);

  const validTabs: TabType[] = ['overview', 'business', 'people', 'assets', 'printing'];

  const hashToMainAndSub = (hash: string): { tab: TabType; sub: string } => {
    if (validTabs.includes(hash as TabType)) return { tab: hash as TabType, sub: hash === 'overview' ? subTab : DEFAULT_SUB[hash as Exclude<TabType, 'overview'>] };
    const subToMain: Record<string, TabType> = {
      plans: 'business',
      contacts: 'people', users: 'people', operators: 'people',
      equipment: 'assets', operations: 'assets',
      'print-config': 'printing', config: 'printing', 'public-templates': 'printing',
    };
    const tab = subToMain[hash];
    if (tab) return { tab, sub: hash === 'print-config' ? 'config' : hash };
    return { tab: 'overview', sub: subTab };
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab !== 'overview') setSubTab(DEFAULT_SUB[tab]);
    window.history.replaceState(null, '', `${location.pathname}#${tab}`);
  };

  const handleSubTabChange = (newSubTab: string) => {
    setSubTab(newSubTab);
  };

  // Sincronizar aba e sub-aba com hash da URL
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    const { tab, sub } = hashToMainAndSub(hash);
    setActiveTab(tab);
    if (tab !== 'overview') setSubTab(sub);
  }, [location.hash]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = location.hash.replace('#', '');
      const { tab, sub } = hashToMainAndSub(hash);
      setActiveTab(tab);
      if (tab !== 'overview') setSubTab(sub);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Buscar cliente da API (declarado antes de efeitos que usam `client`)
  const { data: client, isLoading, error } = useClient(id!);

  // Buscar operadores para exibir contagem
  const { data: operatorsForStats = [] } = useOperatorsByClient(id!);

  // Carregar impressoras do Granobox quando estiver na aba impressão
  useEffect(() => {
    if ((activeTab === 'printing') && id) {
      loadGranoboxPrinters();
    }
  }, [activeTab, id]);

  // Carregar logo do cliente
  useEffect(() => {
    if (client?.tagmentLogoUuid) {
      setLogoUuid(client.tagmentLogoUuid);
    }
  }, [client?.tagmentLogoUuid]);

  // Função para navegar para uma aba específica de forma programática
  const navigateToTab = (tab: TabType, sub?: string) => {
    handleTabChange(tab);
    if (sub) setSubTab(sub);
    // Scroll suave para o topo das abas
    const tabsElement = document.querySelector('[data-tabs-container]');
    if (tabsElement) {
      tabsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const activateClientMutation = useActivateClient();
  const deactivateClientMutation = useDeactivateClient();
  const deleteClientMutation = useDeleteClient();
  const updateClientMutation = useUpdateClient();

  // Hooks para contatos
  const { data: contacts = [], isLoading: contactsLoading } = useContactsByClient(id!);
  const createContactMutation = useCreateContact();
  const updateContactMutation = useUpdateContact();
  const setPrimaryContactMutation = useSetPrimaryContact();
  const toggleActiveContactMutation = useToggleActiveContact();
  const deleteContactMutation = useDeleteContact();

  // Filtro por operação (equipamentos)
  const [selectedOperationIdEquipment, setSelectedOperationIdEquipment] = useState<string | undefined>(undefined);
  const { data: operationsForEquipment = [] } = useOperationsByClient(id!);
  // Hooks para equipamentos
  const { data: equipment = [], isLoading: equipmentLoading } = useEquipmentByClient(
    id!,
    selectedOperationIdEquipment,
  );
  const { data: equipmentStats } = useEquipmentStats(id!);
  const updateEquipmentMutation = useUpdateEquipment();
  
  // Hook para manutenções
  const createMaintenanceMutation = useCreateMaintenance();

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

  useEffect(() => {
    setLogoUuid((client as any)?.tagmentLogoUuid || '');
  }, [client?.tagmentLogoUuid]);

  const handleSaveLogoUuid = async () => {
    if (!id) return;
    try {
      await updateClientMutation.mutateAsync({ id, data: { tagmentLogoUuid: logoUuid.trim() } });
      alert('UUID do logo salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar UUID do logo:', error);
      alert('Erro ao salvar UUID do logo. Tente novamente.');
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
  const handleCreateEquipmentLoan = async (data: { equipmentId: string; loanStartDate: string; loanEndDate?: string; location?: string; notes?: string; operationId?: string }) => {
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
          ...((data.operationId ?? selectedOperationIdEquipment) && { operationId: data.operationId ?? selectedOperationIdEquipment }),
        },
      });
      
      setShowEquipmentForm(false);
      alert('Equipamento associado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao associar equipamento:', error);
      alert(`Erro ao associar equipamento: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
    }
  };

  const handleUpdateEquipmentLoan = async (data: { equipmentId: string; loanStartDate: string; loanEndDate?: string; location?: string; notes?: string; operationId?: string }) => {
    if (!editingEquipment) return;

    try {
      await updateEquipmentMutation.mutateAsync({
        id: editingEquipment.id,
        data: {
          loanStartDate: data.loanStartDate,
          loanEndDate: data.loanEndDate,
          location: data.location,
          notes: data.notes,
          ...(data.operationId !== undefined && { operationId: data.operationId }),
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

  // Funções para gerenciar manutenções
  const handleOpenMaintenanceModal = (equipment: ApiEquipment) => {
    setSelectedEquipmentForMaintenance(equipment);
    setShowMaintenanceModal(true);
  };

  const handleCreateMaintenance = async (data: any) => {
    try {
      await createMaintenanceMutation.mutateAsync(data);
      setShowMaintenanceModal(false);
      setSelectedEquipmentForMaintenance(null);
      alert('Manutenção registrada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao registrar manutenção:', error);
      alert(`Erro ao registrar manutenção: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
    }
  };


  // Carregar impressoras do Granobox
  const loadGranoboxPrinters = async () => {
    if (!id) return;
    
    setIsLoadingGranoboxPrinters(true);
    try {
      const printers = await printersService.getAll(id);
      setGranoboxPrinters(printers);
    } catch (error) {
      console.error('Erro ao carregar impressoras do Granobox:', error);
    } finally {
      setIsLoadingGranoboxPrinters(false);
    }
  };

  // Definir impressora como padrão para um tipo de uso
  const handleSetAsDefault = async (_printerId: string, usage: 'validity' | 'label') => {
    if (!id) return;
    
    try {
      // TODO: Implementar endpoint setAsDefault no backend
      // await printersService.setAsDefault(_printerId, usage);
      // Recarregar lista de impressoras para atualizar o estado
      await loadGranoboxPrinters();
      alert(`Funcionalidade em desenvolvimento. Impressora padrão para ${usage === 'validity' ? 'validade' : 'rótulo'}`);
    } catch (error: any) {
      console.error('Erro ao definir impressora como padrão:', error);
      alert(`Erro ao definir impressora como padrão: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
    }
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
      case 'doceria':
        return 'Doceria';
      case 'acougue':
        return 'Açougue';
      case 'sorveteria':
        return 'Sorveteria';
      case 'other':
        return 'Outro';
      default:
        return '-';
    }
  };

  const tabs: { id: TabType; label: string; icon: typeof User }[] = [
    { id: 'overview', label: 'Visão Geral', icon: User },
    { id: 'business', label: 'Negócio', icon: Package },
    { id: 'people', label: 'Pessoas', icon: Users },
    { id: 'assets', label: 'Ativos', icon: Wrench },
    { id: 'printing', label: 'Impressão', icon: Printer },
  ];

  const businessSubTabs: { id: BusinessSubTab; label: string }[] = [
    { id: 'plans', label: 'Planos' },
  ];
  const peopleSubTabs: { id: PeopleSubTab; label: string }[] = [
    { id: 'contacts', label: 'Contatos' },
    { id: 'users', label: 'Usuários' },
    { id: 'operators', label: 'Operadores' },
  ];
  const assetsSubTabs: { id: AssetsSubTab; label: string }[] = [
    { id: 'equipment', label: 'Equipamentos' },
    { id: 'operations', label: 'Operações' },
  ];
  const printingSubTabs: { id: PrintingSubTab; label: string }[] = [
    { id: 'config', label: 'Config. Impressão' },
    { id: 'public-templates', label: 'Templates públicos' },
  ];

  return (
    <div className="space-y-6">
      {/* Sticky summary bar: sempre visível, alinhado ao topo do conteúdo */}
      <div className="sticky top-0 z-10 -mx-page -mt-page flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-page py-4 shadow-erp">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/clients')}
            className="h-8 w-8 shrink-0"
            title="Voltar para Clientes"
          >
            <ArrowLeft size={16} />
          </Button>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-erp ${client.clientType === 'business' ? 'bg-blue-100 text-blue-600' : 'bg-primary-100 text-primary-600'}`}>
            {client.clientType === 'business' ? <Building size={22} /> : <User size={22} />}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-page-title text-gray-900">
              {client.businessName || (client.clientType === 'individual' ? client.fullName : client.legalName)}
            </h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-3">
              {client.businessName && (client.clientType === 'individual' ? client.fullName : client.legalName) && (
                <p className="text-sm text-gray-600">
                  {client.clientType === 'individual' ? client.fullName : client.legalName}
                </p>
              )}
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(client.status)}`}>
                {getStatusText(client.status)}
              </span>
              <span className="text-xs font-mono text-gray-500">
                {client.clientType === 'individual' ? (client.cpf ? formatCpf(client.cpf) : '') : (client.cnpj ? formatCnpj(client.cnpj) : '')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
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
          onClick={() => navigateToTab('assets', 'equipment')}
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
          onClick={() => navigateToTab('people', 'operators')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Operadores</p>
                <p className="text-2xl font-bold text-gray-900">{operatorsForStats.length}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <IdentificationCard size={20} className="text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mt-8" data-tabs-container>
        <nav className="-mb-px flex flex-wrap gap-1 sm:gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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

      {/* Sub-navegação quando a aba tem seções */}
      {activeTab === 'business' && (
        <div className="flex flex-wrap gap-2 pt-4">
          {businessSubTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSubTabChange(t.id)}
              className={`rounded-erp px-3 py-1.5 text-sm font-medium transition-colors ${
                subTab === t.id
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {activeTab === 'people' && (
        <div className="flex flex-wrap gap-2 pt-4">
          {peopleSubTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSubTabChange(t.id)}
              className={`rounded-erp px-3 py-1.5 text-sm font-medium transition-colors ${
                subTab === t.id
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {activeTab === 'assets' && (
        <div className="flex flex-wrap gap-2 pt-4">
          {assetsSubTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSubTabChange(t.id)}
              className={`rounded-erp px-3 py-1.5 text-sm font-medium transition-colors ${
                subTab === t.id
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {activeTab === 'printing' && (
        <div className="flex flex-wrap gap-2 pt-4">
          {printingSubTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleSubTabChange(t.id)}
              className={`rounded-erp px-3 py-1.5 text-sm font-medium transition-colors ${
                subTab === t.id
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'business' && subTab === 'plans' && client && (
        <ClientPlanManager clientId={client.id} />
      )}

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
                      ? new Date(client.activatedAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) 
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
                  {new Date(client.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Uso e Limites do Plano */}
          <PlanLimits clientId={client.id} />

          {/* Gráfico de Disponibilidade Edge-Go */}
          <EdgeGoAvailabilityChart clientId={client.id} />

          {/* Pedidos de suprimentos: link para a listagem central em Vendas */}
          <Card>
            <CardHeader>
              <CardTitle>Pedidos de suprimentos (etiquetas e ribbon)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Ver e gerenciar pedidos de etiquetas e ribbon deste cliente na listagem central.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate(`/label-orders?clientId=${client.id}`)}
              >
                <Package size={16} className="mr-2" />
                Ver listagem de pedidos
              </Button>
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

      {activeTab === 'people' && subTab === 'contacts' && (
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

      {activeTab === 'assets' && subTab === 'equipment' && (
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
                  initialData={editingEquipment || undefined}
                  operationId={selectedOperationIdEquipment}
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
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <CardTitle>Equipamentos em Comodato</CardTitle>
                  <div className="flex items-center gap-2">
                    {operationsForEquipment.length > 0 && (
                      <select
                        value={selectedOperationIdEquipment ?? ''}
                        onChange={(e) =>
                          setSelectedOperationIdEquipment(
                            e.target.value ? e.target.value : undefined,
                          )
                        }
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Todas as operações</option>
                        {operationsForEquipment.map((op) => (
                          <option key={op.id} value={op.id}>
                            {op.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <Button onClick={() => setShowEquipmentForm(true)}>
                      <Plus size={16} className="mr-2" />
                      Associar Equipamento
                    </Button>
                  </div>
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
                            <p><strong>Início do Comodato:</strong> {new Date(item.loanStartDate).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
                            {item.loanEndDate && (
                              <p><strong>Fim Previsto:</strong> {new Date(item.loanEndDate).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
                            )}
                            {item.returnDate && (
                              <p><strong>Data de Devolução:</strong> {new Date(item.returnDate).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
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
                          onClick={() => handleOpenMaintenanceModal(item)}
                          title="Registrar manutenção"
                          className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
                        >
                          <GearSix size={14} />
                        </Button>
                        
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

      {activeTab === 'people' && subTab === 'users' && (
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

  {activeTab === 'assets' && subTab === 'operations' && (
    <OperationsTab clientId={id!} />
  )}

      {activeTab === 'people' && subTab === 'operators' && (
        <OperatorsTab clientId={id!} />
      )}

      {activeTab === 'printing' && subTab === 'config' && id && (
        <PrintConfigForm clientId={id} />
      )}

      {activeTab === 'printing' && subTab === 'public-templates' && id && (
        <ClientPublicTemplatesForm clientId={id} />
      )}

          {/* Impressoras Granobox (Edge-Go) */}
          <Card>
            <CardHeader>
              <CardTitle>Impressoras Granobox</CardTitle>
              <p className="text-sm text-gray-600">
                Impressoras configuradas no Granobox (Edge-Go e TCP)
              </p>
            </CardHeader>
            <CardContent>
              {isLoadingGranoboxPrinters ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando impressoras...</p>
                </div>
              ) : granoboxPrinters.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {granoboxPrinters.length} impressora(s) configurada(s)
                    </span>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={loadGranoboxPrinters}
                    >
                      Atualizar
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    {granoboxPrinters.map((printer) => {
                      const hasValidity = printer.usage?.includes('validity');
                      const hasLabel = printer.usage?.includes('label');
                      // Nota: A API atualmente define isDefault como booleano simples
                      // Uma impressora pode ser padrão para um tipo de uso específico
                      // Por enquanto, verificamos se é padrão E tem o tipo de uso
                      const isDefaultValidity = printer.isDefault && hasValidity;
                      const isDefaultLabel = printer.isDefault && hasLabel;
                      
                      return (
                        <div 
                          key={printer.id} 
                          className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                printer.status === 'active' ? 'bg-green-500' : 
                                printer.status === 'inactive' ? 'bg-red-500' : 'bg-yellow-500'
                              }`}></div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900">{printer.name || printer.deviceId}</h4>
                                  {printer.isDefault && (
                                    <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                                      Padrão
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {printer.deviceId && `Edge-Go: ${printer.deviceId} • `}
                                  {printer.ip && `IP: ${printer.ip}:${printer.port} • `}
                                  Tipo: {printer.type} • Status: {printer.status}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Uso: {printer.usage?.join(', ') || 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex gap-2">
                            {hasValidity && (
                              <Button
                                size="sm"
                                variant={isDefaultValidity ? "default" : "outline"}
                                onClick={() => handleSetAsDefault(printer.id, 'validity')}
                                className={isDefaultValidity ? "bg-blue-600 hover:bg-blue-700" : ""}
                              >
                                {isDefaultValidity ? '✓ Padrão Validade' : 'Definir Padrão Validade'}
                              </Button>
                            )}
                            {hasLabel && (
                              <Button
                                size="sm"
                                variant={isDefaultLabel ? "default" : "outline"}
                                onClick={() => handleSetAsDefault(printer.id, 'label')}
                                className={isDefaultLabel ? "bg-blue-600 hover:bg-blue-700" : ""}
                              >
                                {isDefaultLabel ? '✓ Padrão Rótulo' : 'Definir Padrão Rótulo'}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Printer size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma Impressora Configurada
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Configure impressoras Edge-Go ou TCP no sistema
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}


      {/* Modal de convite */}
      <SendInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        clientId={id!}
        clientName={client?.businessName || client?.fullName || 'Cliente'}
      />

      {/* Modal de manutenção */}
      <MaintenanceFormModal
        isOpen={showMaintenanceModal}
        onClose={() => {
          setShowMaintenanceModal(false);
          setSelectedEquipmentForMaintenance(null);
        }}
        onSubmit={handleCreateMaintenance}
        equipment={selectedEquipmentForMaintenance || undefined}
        isSubmitting={createMaintenanceMutation.isPending}
      />
    </div>
  );
}

function OperationsTab({ clientId }: { clientId: string }) {
  const { data: operations = [], isLoading, error } = useOperationsByClient(clientId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Operações do Cliente</h3>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus size={16} className="mr-2" />
          Nova Operação
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Carregando operações...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">Erro ao carregar operações</div>
      ) : operations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Nenhuma operação cadastrada</div>
      ) : (
        <div className="space-y-3">
          {operations.map((op) => (
            <div key={op.id} className="border rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{op.name} <span className="text-sm text-gray-500">({op.type})</span></div>
                {op.description && <div className="text-sm text-gray-600">{op.description}</div>}
                <div className="text-xs text-gray-500 mt-1">Status: {op.status}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setEditing(op); setOpen(true); }}>Editar</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <OperationFormModal isOpen={open} onClose={() => setOpen(false)} clientId={clientId} initial={editing} />
    </div>
  );
}

function OperatorsTab({ clientId }: { clientId: string }) {
  const { data: operations = [] } = useOperationsByClient(clientId);
  const [selectedOperationId, setSelectedOperationId] = useState<string | undefined>(undefined);
  const { data: operators = [], isLoading, error } = useOperatorsByClient(
    clientId,
    selectedOperationId,
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const getAccessLevelLabel = (level: string) => {
    switch (level) {
      case 'basic':
        return 'Básico';
      case 'intermediate':
        return 'Intermediário';
      case 'advanced':
        return 'Avançado';
      default:
        return level;
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'basic':
        return 'bg-gray-100 text-gray-700';
      case 'intermediate':
        return 'bg-blue-100 text-blue-700';
      case 'advanced':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap justify-between items-center gap-4">
            <CardTitle>Operadores do Cliente</CardTitle>
            <div className="flex items-center gap-2">
              {operations.length > 0 && (
                <select
                  value={selectedOperationId ?? ''}
                  onChange={(e) =>
                    setSelectedOperationId(
                      e.target.value ? e.target.value : undefined,
                    )
                  }
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Todas as operações</option>
                  {operations.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.name}
                    </option>
                  ))}
                </select>
              )}
              <Button onClick={() => { setEditing(null); setOpen(true); }}>
                <Plus size={16} className="mr-2" />
                Novo Operador
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Carregando operadores...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">Erro ao carregar operadores</div>
          ) : operators.length === 0 ? (
            <div className="text-center py-12">
              <IdentificationCard size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2 text-gray-900">Nenhum operador cadastrado</h3>
              <p className="text-gray-500 mb-4">Adicione operadores para permitir o uso do sistema pelo cliente.</p>
              <Button onClick={() => { setEditing(null); setOpen(true); }}>
                <Plus size={16} className="mr-2" />
                Adicionar Primeiro Operador
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {operators.map((operator) => (
                <div 
                  key={operator.id} 
                  className={`border rounded-lg p-4 flex items-center justify-between ${
                    operator.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">{operator.name}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAccessLevelColor(operator.accessLevel)}`}>
                        {getAccessLevelLabel(operator.accessLevel)}
                      </span>
                      {!operator.isActive && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Inativo
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p><strong>PIN:</strong> ••••</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditing(operator); setOpen(true); }}
                      title="Editar operador"
                    >
                      <PencilSimple size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <OperatorFormModal 
        isOpen={open} 
        onClose={() => { setOpen(false); setEditing(null); }} 
        clientId={clientId} 
        initial={editing}
        operationId={selectedOperationId}
      />
    </div>
  );
}

