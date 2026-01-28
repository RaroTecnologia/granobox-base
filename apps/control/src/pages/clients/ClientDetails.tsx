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
import { LabelOrdersTab } from '../../components/LabelOrdersTab';
import { LabelOrdersDashboard } from '../../components/LabelOrdersDashboard';
import { useCreateMaintenance } from '../../hooks/useMaintenance';
import type { ApiClient, ApiContact, CreateContactRequest, ApiEquipment } from '../../types/api';

type TabType = 'overview' | 'contacts' | 'equipment' | 'users' | 'operations' | 'tagment' | 'operators' | 'plans' | 'label-orders';

export function ClientDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<ApiContact | null>(null);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<ApiEquipment | null>(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedEquipmentForMaintenance, setSelectedEquipmentForMaintenance] = useState<ApiEquipment | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTagmentConfigModal, setShowTagmentConfigModal] = useState(false);
  const [showTagmentSuccessModal, setShowTagmentSuccessModal] = useState(false);
  const [showTagmentErrorModal, setShowTagmentErrorModal] = useState(false);
  const [tagmentApiKey, setTagmentApiKey] = useState('');
  const [isValidatingApiKey, setIsValidatingApiKey] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [tagmentConfig, setTagmentConfig] = useState<any>(null);
  const [configurationResult, setConfigurationResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [tagmentPrinters, setTagmentPrinters] = useState<any[]>([]);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [tagmentTemplates, setTagmentTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [defaultValidityTemplate, setDefaultValidityTemplate] = useState('');
  const [logoUuid, setLogoUuid] = useState('');
  const [granoboxPrinters, setGranoboxPrinters] = useState<any[]>([]);
  const [isLoadingGranoboxPrinters, setIsLoadingGranoboxPrinters] = useState(false);

  // Função para obter a aba do hash da URL
  const getTabFromHash = (): TabType => {
    const hash = location.hash.replace('#', '');
    const validTabs: TabType[] = ['overview', 'contacts', 'equipment', 'users', 'operations', 'tagment', 'operators', 'plans'];
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

  // Buscar cliente da API (declarado antes de efeitos que usam `client`)
  const { data: client, isLoading, error } = useClient(id!);

  // Buscar operadores para exibir contagem
  const { data: operatorsForStats = [] } = useOperatorsByClient(id!);

  // Carregar configuração Tagment salva
  useEffect(() => {
    if (id) {
      const savedConfig = localStorage.getItem(`tagment_config_${id}`);
      if (savedConfig) {
        try {
          setTagmentConfig(JSON.parse(savedConfig));
        } catch (error) {
          console.error('Erro ao carregar configuração Tagment:', error);
        }
      }
    }
  }, [id]);

  // Funções auxiliares para carregamento automático
  const loadTagmentTemplates = async (apiKey: string) => {
    setIsLoadingTemplates(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_TAGMENT_API_URL || 'https://api.tagment.com.br'}/v1/templates`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const templates = await response.json();
        setTagmentTemplates(templates);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const loadTagmentPrinters = async (apiKey: string) => {
    setIsLoadingPrinters(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_TAGMENT_API_URL || 'https://api.tagment.com.br'}/v1/printers`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const printers = await response.json();
        setTagmentPrinters(printers);
      }
    } catch (error) {
      console.error('Erro ao carregar impressoras:', error);
    } finally {
      setIsLoadingPrinters(false);
    }
  };

  // Carregar dados do Tagment automaticamente quando configuração estiver disponível
  useEffect(() => {
    if (tagmentConfig?.apiKey && activeTab === 'tagment') {
      // Carregar templates e impressoras automaticamente
      loadTagmentTemplates(tagmentConfig.apiKey);
      loadTagmentPrinters(tagmentConfig.apiKey);
    }
  }, [tagmentConfig, activeTab]);

  // Carregar impressoras do Granobox quando estiver na aba tagment
  useEffect(() => {
    if (activeTab === 'tagment' && id) {
      loadGranoboxPrinters();
    }
  }, [activeTab, id]);

  // Carregar template padrão de validade quando estiver na aba tagment
  useEffect(() => {
    const loadDefaultTemplate = async () => {
    if (activeTab === 'tagment' && id) {
        try {
          const association = await templatesService.getDefaultTemplate(id, 'etiqueta_validade');
          if (association?.templateId) {
            setDefaultValidityTemplate(association.templateId);
          }
        } catch (error) {
          console.error('Erro ao carregar template padrão:', error);
    }
      }
    };
    loadDefaultTemplate();
  }, [activeTab, id]);

  // Carregar logo do cliente quando estiver na aba tagment
  useEffect(() => {
    if (activeTab === 'tagment' && client?.tagmentLogoUuid) {
      setLogoUuid(client.tagmentLogoUuid);
    }
  }, [activeTab, client?.tagmentLogoUuid]);

  // Popular configuração Tagment a partir do cliente carregado
  useEffect(() => {
    if (client?.tagmentApiKey) {
      const customerId = client.businessName
        ? `gbx_${client.businessName.toLowerCase().replace(/\s+/g, '_')}`
        : (id ? `gbx_client_${id}` : '');
      setTagmentConfig({
        customerId,
        apiKey: client.tagmentApiKey,
        isActive: true,
        configuredAt: client.updatedAt || new Date().toISOString(),
      });
    }
  }, [client, id]);

  // Função para navegar para uma aba específica de forma programática
  const navigateToTab = (tab: TabType) => {
    handleTabChange(tab);
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

  // Hooks para equipamentos
  const { data: equipment = [], isLoading: equipmentLoading } = useEquipmentByClient(id!);
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
      alert('Equipamento associado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao associar equipamento:', error);
      alert(`Erro ao associar equipamento: ${error.response?.data?.message || error.message || 'Erro desconhecido'}`);
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

  // Função para copiar API Key
  const handleCopyApiKey = async () => {
    if (!tagmentConfig?.apiKey) return;
    
    try {
      await navigator.clipboard.writeText(tagmentConfig.apiKey);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar API Key:', err);
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = tagmentConfig.apiKey;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Funções para Tagment
  const handleConfigureTagmentApiKey = async () => {
    if (!tagmentApiKey.trim()) {
      setErrorMessage('Por favor, insira uma API Key válida');
      setShowTagmentErrorModal(true);
      return;
    }

    // Validação básica de formato
    if (!tagmentApiKey.startsWith('tgm_') || tagmentApiKey.length < 10) {
      setErrorMessage('Formato de API Key inválido. Deve começar com "tgm_" e ter pelo menos 10 caracteres.');
      setShowTagmentErrorModal(true);
      return;
    }

    setIsValidatingApiKey(true);
    
    try {
      // Persistir no backend (clients.update) para que apps consumam via API
      const customerId = client?.businessName ? `gbx_${client.businessName.toLowerCase().replace(/\s+/g, '_')}` : `gbx_client_${id}`;
      if (!id) throw new Error('ID do cliente não encontrado');
      await updateClientMutation.mutateAsync({
        id: id as string,
        // types não expõem tagmentCustomerId; usar any para enviar ambos
        data: { tagmentApiKey: tagmentApiKey.trim(), tagmentCustomerId: customerId } as any,
      });

      // Atualizar estado local / exibir sucesso
      const newConfig = {
        customerId,
        apiKey: tagmentApiKey.trim(),
        isActive: true,
        configuredAt: new Date().toISOString(),
      };
      setTagmentConfig(newConfig);
      setConfigurationResult(newConfig);

      setShowTagmentConfigModal(false);
      setShowTagmentSuccessModal(true);
      setTagmentApiKey('');

      if (activeTab === 'tagment') {
        loadTagmentTemplates(newConfig.apiKey);
        loadTagmentPrinters(newConfig.apiKey);
      }
      
    } catch (error) {
      console.error('Erro ao configurar API Key:', error);
      setErrorMessage('Erro inesperado ao configurar API Key. Tente novamente.');
      setShowTagmentErrorModal(true);
    } finally {
      setIsValidatingApiKey(false);
    }
  };

  const handleListTagmentPrinters = async () => {
    if (!tagmentConfig?.apiKey) {
      setErrorMessage('API Key não configurada');
      setShowTagmentErrorModal(true);
      return;
    }

    try {
      await loadTagmentPrinters(tagmentConfig.apiKey);
    } catch (error) {
      setErrorMessage(`Erro ao conectar com Tagment: ${(error as Error).message}`);
      setShowTagmentErrorModal(true);
    }
  };

  const handleSyncTagmentTemplates = async () => {
    if (!tagmentConfig?.apiKey) {
      setErrorMessage('API Key não configurada');
      setShowTagmentErrorModal(true);
      return;
    }

    try {
      await loadTagmentTemplates(tagmentConfig.apiKey);
    } catch (error) {
      setErrorMessage(`Erro ao sincronizar templates: ${(error as Error).message}`);
      setShowTagmentErrorModal(true);
    }
  };

  const handleSaveDefaultTemplate = async () => {
    if (!id || !defaultValidityTemplate.trim()) return;
    
    try {
      // Chamar API para salvar template padrão de validade
      await templatesService.setDefaultTemplate(id, 'etiqueta_validade', defaultValidityTemplate.trim());
      
      alert('Template padrão de validade salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar template padrão:', error);
      alert('Erro ao salvar template padrão. Tente novamente.');
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
      case 'other':
        return 'Outro';
      default:
        return '-';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: User },
    { id: 'plans', label: 'Planos', icon: Package },
    { id: 'contacts', label: 'Contatos', icon: EnvelopeSimple },
    { id: 'equipment', label: 'Equipamentos', icon: Wrench },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'operations', label: 'Operações', icon: Wrench },
    { id: 'operators', label: 'Operadores', icon: IdentificationCard },
    { id: 'tagment', label: 'Tagment', icon: Printer },
    { id: 'label-orders', label: 'Pedidos de Etiquetas', icon: Package },
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
          onClick={() => navigateToTab('operators')}
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
      {activeTab === 'plans' && client && (
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

          {/* Pedidos de Etiquetas - Dashboard */}
          <LabelOrdersDashboard clientId={client.id} />

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
                  initialData={editingEquipment || undefined}
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

  {activeTab === 'operations' && (
    <OperationsTab clientId={id!} />
  )}

      {activeTab === 'operators' && (
        <OperatorsTab clientId={id!} />
      )}

      {activeTab === 'label-orders' && id && (
        <LabelOrdersTab clientId={id} />
      )}

      {activeTab === 'tagment' && (
        <div className="space-y-6">
          {/* Configuração da API Key */}
          <Card>
            <CardHeader>
              <CardTitle>Configuração da API</CardTitle>
              <p className="text-sm text-gray-600">
                Configure a integração com a API Tagment para impressão de etiquetas
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status da Integração */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Status da Integração</h4>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${tagmentConfig ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-sm text-gray-600">
                      {tagmentConfig ? 'Configurado' : 'Não configurado'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>• Customer ID: {tagmentConfig?.customerId || (client?.businessName ? `gbx_${client.businessName.toLowerCase().replace(/\s+/g, '_')}` : 'Não definido')}</p>
                    <div className="flex items-center gap-2">
                      <p>• API Key: {tagmentConfig ? `${tagmentConfig.apiKey.substring(0, 10)}...` : 'Não configurada'}</p>
                      {tagmentConfig && (
                        <button
                          onClick={handleCopyApiKey}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                          title="Copiar API Key completa"
                        >
                          <Copy size={12} />
                          {copySuccess ? 'Copiado!' : 'Copiar'}
                        </button>
                      )}
                    </div>
                    <p>• Status: {tagmentConfig ? 'Conectado' : 'Desconectado'}</p>
                    <p>• Templates: {tagmentTemplates.length} disponível(is)</p>
                    <p>• Impressoras: {tagmentPrinters.length} conectada(s)</p>
                    {tagmentConfig && (
                      <p>• Configurado em: {new Date(tagmentConfig.configuredAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
                    )}
                  </div>
                </div>

                {/* Configuração */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Configuração</h4>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => setShowTagmentConfigModal(true)}
                      className="w-full"
                    >
                      <Wrench size={16} className="mr-2" />
                      Configurar API Key
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        if (tagmentConfig) {
                          alert(`Testando conexão com Tagment...\n\nCustomer ID: ${tagmentConfig.customerId}\nAPI Key: ${tagmentConfig.apiKey.substring(0, 10)}...`);
                        }
                      }}
                      className="w-full"
                      disabled={!tagmentConfig}
                    >
                      <Printer size={16} className="mr-2" />
                      Testar Conexão
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Templates Tagment */}
          <Card>
            <CardHeader>
              <CardTitle>Templates de Impressão</CardTitle>
              <p className="text-sm text-gray-600">
                Templates Tagment associados para cada tipo de etiqueta
              </p>
            </CardHeader>
            <CardContent>
              {/* Configuração do Template Padrão de Validade */}
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-3">Template Padrão de Validade</h4>
                <p className="text-sm text-green-800 mb-4">
                  Configure o template padrão que será usado para etiquetas de validade quando o produto não tiver template customizado.
                </p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-green-900 mb-1">
                      UUID do Template
                    </label>
                    <input
                      type="text"
                      value={defaultValidityTemplate}
                      onChange={(e) => setDefaultValidityTemplate(e.target.value)}
                      placeholder="Cole aqui o UUID do template de validade"
                      className="w-full px-3 py-2 border border-green-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleSaveDefaultTemplate}
                      disabled={!defaultValidityTemplate.trim()}
                      className="px-4 py-2"
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              {defaultValidityTemplate && (
                  <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-800">
                    <strong>Preview:</strong> {defaultValidityTemplate}
                  </div>
                )}
              <div className="mt-6">
                <h5 className="font-medium text-green-900 mb-2">Logo do Cliente</h5>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-green-900 mb-1">
                      UUID do Logo
                    </label>
                    <input
                      type="text"
                      value={logoUuid}
                      onChange={(e) => setLogoUuid(e.target.value)}
                      placeholder="Cole aqui o UUID do logo do cliente"
                      className="w-full px-3 py-2 border border-green-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleSaveLogoUuid}
                      disabled={!logoUuid.trim() || updateClientMutation.isPending}
                      className="px-4 py-2"
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              </div>
              </div>

              {isLoadingTemplates ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Sincronizando templates...</p>
                </div>
              ) : tagmentTemplates.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {tagmentTemplates.length} template(s) disponível(is)
                    </span>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={handleSyncTagmentTemplates}
                    >
                      Atualizar
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    {tagmentTemplates.map((template) => (
                      <div 
                        key={template.id} 
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{template.name}</h4>
                            <p className="text-sm text-gray-600">{template.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              ID: {template.id}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {template.type || 'Template'}
                            </span>
                            {template.size && (
                              <p className="text-xs text-gray-500 mt-1">
                                {template.size.w}x{template.size.h} {template.size.unit}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {tagmentConfig ? 'Nenhum Template Encontrado' : 'Configure a API Key'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {tagmentConfig ? 
                      'Nenhum template foi encontrado na sua conta Tagment' : 
                      'Configure a API Key primeiro para carregar os templates disponíveis'
                    }
                  </p>
                  <Button 
                    onClick={handleSyncTagmentTemplates}
                    disabled={!tagmentConfig || isLoadingTemplates}
                    className={!tagmentConfig ? "opacity-50" : ""}
                  >
                    <FileText size={16} className="mr-2" />
                    {isLoadingTemplates ? 'Sincronizando...' : 'Sincronizar Templates'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Impressoras Tagment */}
          <Card>
            <CardHeader>
              <CardTitle>Impressoras Conectadas</CardTitle>
              <p className="text-sm text-gray-600">
                Impressoras gerenciadas pelo Print Agent via Tagment
              </p>
            </CardHeader>
            <CardContent>
              {isLoadingPrinters ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando impressoras...</p>
                </div>
              ) : tagmentPrinters.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {tagmentPrinters.length} impressora(s) encontrada(s)
                    </span>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={handleListTagmentPrinters}
                    >
                      Atualizar
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    {tagmentPrinters.map((printer) => (
                      <div 
                        key={printer.id} 
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${
                              printer.status === 'online' ? 'bg-green-500' : 
                              printer.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}></div>
                            <div>
                              <h4 className="font-medium text-gray-900">{printer.displayName}</h4>
                              <p className="text-sm text-gray-600">
                                {printer.externalLocationId && `Local: ${printer.externalLocationId} • `}
                                Status: {printer.status}
                              </p>
                            </div>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>Hoje: {printer.printsToday || 0}</p>
                            <p>Total: {printer.totalPrints || 0}</p>
                          </div>
                        </div>
                        
                        {printer.lastSeenAt && (
                          <p className="text-xs text-gray-400 mt-2">
                            Última atividade: {(() => {
                              const dateStr = printer.lastSeenAt.toString();
                              const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
                              return date.toLocaleString('pt-BR', { 
                                timeZone: 'America/Sao_Paulo',
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              });
                            })()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Printer size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {tagmentConfig ? 'Nenhuma Impressora Conectada' : 'Configure a API Key'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {tagmentConfig ? 
                      'Nenhuma impressora foi encontrada para este cliente' : 
                      'Configure a API Key e Print Agent para ver as impressoras'
                    }
                  </p>
                  <Button 
                    onClick={handleListTagmentPrinters}
                    disabled={!tagmentConfig || isLoadingPrinters}
                    className={!tagmentConfig ? "opacity-50" : ""}
                  >
                    <Printer size={16} className="mr-2" />
                    {isLoadingPrinters ? 'Carregando...' : 'Listar Impressoras'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

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


      {/* Modal de configuração Tagment */}
      {showTagmentConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Configurar API Key Tagment</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key Tagment
                </label>
                <input
                  type="text"
                  value={tagmentApiKey}
                  onChange={(e) => setTagmentApiKey(e.target.value)}
                  placeholder="tgm_..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: tgm_ seguido de 64 caracteres
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <h4 className="text-sm font-medium text-blue-900 mb-1">Customer ID</h4>
                <p className="text-sm text-blue-700">
                  {client?.businessName ? `gbx_${client.businessName.toLowerCase().replace(/\s+/g, '_')}` : `gbx_client_${id}`}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Este será o ID usado no Tagment para identificar o cliente
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowTagmentConfigModal(false);
                  setTagmentApiKey('');
                }}
                disabled={isValidatingApiKey}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleConfigureTagmentApiKey}
                disabled={isValidatingApiKey || !tagmentApiKey.trim()}
              >
                {isValidatingApiKey ? 'Validando...' : 'Configurar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de sucesso Tagment */}
      {showTagmentSuccessModal && configurationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-xl font-semibold mb-2 text-gray-900">
                API Key Configurada!
              </h2>
              
              <p className="text-gray-600 mb-6">
                A integração com Tagment foi configurada com sucesso.
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-left mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Detalhes da Configuração:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Customer ID:</strong> {configurationResult.customerId}</p>
                  <p><strong>API Key:</strong> {configurationResult.apiKey.substring(0, 10)}...</p>
                  <p><strong>Status:</strong> Ativo</p>
                  <p><strong>Configurado em:</strong> {new Date(configurationResult.configuredAt).toLocaleString('pt-BR')}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Próximos passos:</strong> Agora você pode sincronizar templates e listar impressoras conectadas.
                </p>
              </div>

              <Button 
                onClick={() => {
                  setShowTagmentSuccessModal(false);
                  setConfigurationResult(null);
                }}
                className="w-full"
              >
                Entendi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de erro Tagment */}
      {showTagmentErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              
              <h2 className="text-xl font-semibold mb-2 text-gray-900">
                Erro na Configuração
              </h2>
              
              <p className="text-gray-600 mb-6">
                {errorMessage}
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Dica:</strong> Verifique se a API Key está no formato correto: tgm_seguido_de_64_caracteres
                </p>
              </div>

              <Button 
                onClick={() => {
                  setShowTagmentErrorModal(false);
                  setErrorMessage('');
                }}
                variant="outline"
                className="w-full"
              >
                Tentar Novamente
              </Button>
            </div>
          </div>
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
  const { data: operators = [], isLoading, error } = useOperatorsByClient(clientId);
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
          <div className="flex justify-between items-center">
            <CardTitle>Operadores do Cliente</CardTitle>
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus size={16} className="mr-2" />
              Novo Operador
            </Button>
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
      />
    </div>
  );
}

