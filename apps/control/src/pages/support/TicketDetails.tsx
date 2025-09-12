import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  HeadsetIcon, 
  Clock, 
  CheckCircle, 
  XCircle,
  PencilSimple,
  User,
  Building,
  Calendar,
  Flag,
  Plus,
  ChatCircle,
  Phone,
  EnvelopeSimple
} from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import type { SupportTicket, Client } from '../../types';

// Mock data - mesmo ticket da listagem
const mockTicket: SupportTicket & { client: Client } = {
  id: 's1',
  title: 'Problema na impressão de etiquetas',
  description: 'Etiquetas saindo com qualidade ruim, texto borrado e códigos de barras ilegíveis. O problema começou após a última atualização do sistema na semana passada.',
  priority: 'high',
  status: 'resolved',
  category: 'technical',
  assignedTo: 'Carlos Mendes',
  createdAt: new Date('2024-01-25'),
  resolvedAt: new Date('2024-01-25'),
  notes: [
    'Cliente relatou problema após atualização do sistema',
    'Identificado problema no driver da impressora',
    'Realizada limpeza do cabeçote da impressora',
    'Atualizado driver para versão mais recente',
    'Problema resolvido com sucesso'
  ],
  client: {
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
    contacts: [
      {
        id: 'c1',
        name: 'João Silva',
        role: 'Proprietário',
        email: 'joao@paodourado.com.br',
        phone: '(11) 99999-1111',
        isPrimary: true,
      }
    ],
    status: 'active',
    loanedEquipment: [],
    supportHistory: [],
    trainings: [],
    contractType: 'monthly',
    monthlyFee: 149.90,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
};

export function TicketDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [newNote, setNewNote] = useState('');

  // TODO: Buscar ticket da API usando o ID
  const ticket = mockTicket;

  if (!ticket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/support')}
            className="h-8 w-8"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ticket não encontrado</h1>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return 'Aberto';
      case 'in_progress':
        return 'Em Andamento';
      case 'resolved':
        return 'Resolvido';
      case 'closed':
        return 'Fechado';
      default:
        return 'Desconhecido';
    }
  };

  const getPriorityColor = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityText = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'Urgente';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
      default:
        return 'Desconhecida';
    }
  };

  const getCategoryText = (category: SupportTicket['category']) => {
    switch (category) {
      case 'technical':
        return 'Técnico';
      case 'commercial':
        return 'Comercial';
      case 'training':
        return 'Treinamento';
      case 'equipment':
        return 'Equipamento';
      case 'other':
        return 'Outro';
      default:
        return 'Desconhecida';
    }
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      // TODO: Adicionar nota via API
      console.log('Adicionando nota:', newNote);
      setNewNote('');
    }
  };

  const handleStatusChange = (newStatus: SupportTicket['status']) => {
    // TODO: Atualizar status via API
    console.log('Alterando status para:', newStatus);
  };

  const resolutionTime = ticket.resolvedAt && ticket.createdAt 
    ? Math.round((ticket.resolvedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60))
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              <h1 className="text-3xl font-bold tracking-tight">
                Ticket #{ticket.id.toUpperCase()}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                  {getStatusText(ticket.status)}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                  <Flag size={12} className="mr-1" />
                  {getPriorityText(ticket.priority)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
            <Button 
              variant="outline"
              onClick={() => handleStatusChange('resolved')}
            >
              <CheckCircle size={16} className="mr-2" />
              Marcar como Resolvido
            </Button>
          )}
          <Button onClick={() => navigate(`/support/${ticket.id}/edit`)}>
            <PencilSimple size={16} className="mr-2" />
            Editar Ticket
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Criado em</p>
                <p className="text-lg font-bold">
                  {ticket.createdAt.toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Responsável</p>
                <p className="text-lg font-bold">{ticket.assignedTo || 'Não atribuído'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock size={16} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tempo de Resolução</p>
                <p className="text-lg font-bold">
                  {resolutionTime ? `${resolutionTime}h` : 'Em andamento'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ChatCircle size={16} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Categoria</p>
                <p className="text-lg font-bold">{getCategoryText(ticket.category)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Detalhes do Ticket */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descrição */}
          <Card>
            <CardHeader>
              <CardTitle>{ticket.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Histórico de Notas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Histórico de Atividades</CardTitle>
              <span className="text-sm text-gray-500">
                {ticket.notes.length} {ticket.notes.length === 1 ? 'nota' : 'notas'}
              </span>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ticket.notes.map((note, index) => (
                  <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-1 bg-blue-100 rounded-full mt-1">
                      <User size={12} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{ticket.assignedTo}</span>
                        <span className="text-xs text-gray-500">
                          {ticket.createdAt.toLocaleDateString('pt-BR')} às {ticket.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{note}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Adicionar Nova Nota */}
              {ticket.status !== 'closed' && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Adicionar uma nota..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
                      />
                    </div>
                    <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                      <Plus size={16} className="mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Informações do Cliente */}
        <div className="space-y-6">
          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {ticket.client.clientType === 'business' ? (
                  <Building size={16} className="text-blue-600" />
                ) : (
                  <User size={16} className="text-green-600" />
                )}
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-gray-900">{ticket.client.name}</p>
                {ticket.client.legalName && (
                  <p className="text-sm text-gray-600">{ticket.client.legalName}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <EnvelopeSimple size={14} className="text-gray-400" />
                  <span className="text-sm">{ticket.client.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  <span className="text-sm">{ticket.client.phone}</span>
                </div>
              </div>

              <div className="pt-3 border-t">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate(`/clients/${ticket.client.id}`)}
                >
                  Ver Perfil do Cliente
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contatos do Cliente */}
          {ticket.client.contacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Contatos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ticket.client.contacts.map((contact) => (
                    <div key={contact.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{contact.name}</p>
                        {contact.isPrimary && (
                          <span className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{contact.role}</p>
                      {contact.email && (
                        <p className="text-xs text-gray-600">{contact.email}</p>
                      )}
                      {contact.phone && (
                        <p className="text-xs text-gray-600">{contact.phone}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ticket.status === 'open' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleStatusChange('in_progress')}
                >
                  Iniciar Atendimento
                </Button>
              )}
              
              {ticket.status === 'in_progress' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleStatusChange('resolved')}
                >
                  Marcar como Resolvido
                </Button>
              )}

              {ticket.status === 'resolved' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleStatusChange('closed')}
                >
                  Fechar Ticket
                </Button>
              )}

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/support/new', { 
                  state: { clientId: ticket.client.id } 
                })}
              >
                Novo Ticket para Cliente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
