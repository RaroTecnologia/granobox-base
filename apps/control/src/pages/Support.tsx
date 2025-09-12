import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  MagnifyingGlass, 
  HeadsetIcon, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  PencilSimple,
  User,
  Building,
  Calendar,
  Flag
} from '@phosphor-icons/react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import type { SupportTicket, Client } from '../types';

// Mock data de tickets
const mockTickets: (SupportTicket & { client: Client })[] = [
  {
    id: 's1',
    title: 'Problema na impressão de etiquetas',
    description: 'Etiquetas saindo com qualidade ruim, texto borrado e códigos de barras ilegíveis',
    priority: 'high',
    status: 'resolved',
    category: 'technical',
    assignedTo: 'Carlos Mendes',
    createdAt: new Date('2024-01-25'),
    resolvedAt: new Date('2024-01-25'),
    notes: [
      'Cliente relatou problema após atualização do sistema',
      'Identificado problema no driver da impressora',
      'Problema resolvido com limpeza do cabeçote e atualização do driver'
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
    }
  },
  {
    id: 's2',
    title: 'Solicitação de treinamento adicional',
    description: 'Cliente solicita treinamento para novos funcionários sobre uso do sistema',
    priority: 'medium',
    status: 'in_progress',
    category: 'training',
    assignedTo: 'Ana Costa',
    createdAt: new Date('2024-01-26'),
    notes: [
      'Cliente contratou 3 novos funcionários',
      'Agendamento para próxima semana',
      'Treinamento será presencial'
    ],
    client: {
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
    }
  },
  {
    id: 's3',
    title: 'Sistema não conecta com a impressora',
    description: 'Após queda de energia, o sistema não consegue mais se conectar com a impressora térmica',
    priority: 'urgent',
    status: 'open',
    category: 'technical',
    assignedTo: 'Pedro Silva',
    createdAt: new Date('2024-01-27'),
    notes: [
      'Cliente relatou queda de energia ontem à noite',
      'Impressora liga normalmente mas não comunica',
      'Verificar configurações de rede'
    ],
    client: {
      id: '4',
      clientType: 'business',
      name: 'Hotel Estrela do Sul',
      legalName: 'Estrela do Sul Hotelaria LTDA',
      email: 'compras@estreladosul.com.br',
      phone: '(11) 4567-8901',
      document: '34.567.890/0001-23',
      businessType: 'hotel',
      address: {
        street: 'Rua Augusta',
        number: '2500',
        complement: '',
        neighborhood: 'Consolação',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01412-100',
        country: 'Brasil',
      },
      contacts: [],
      status: 'active',
      loanedEquipment: [],
      supportHistory: [],
      trainings: [],
      contractType: 'trial',
      monthlyFee: 0,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  },
  {
    id: 's4',
    title: 'Dúvida sobre configuração de produtos',
    description: 'Como configurar produtos com múltiplas validades no sistema',
    priority: 'low',
    status: 'resolved',
    category: 'commercial',
    assignedTo: 'Ana Costa',
    createdAt: new Date('2024-01-24'),
    resolvedAt: new Date('2024-01-24'),
    notes: [
      'Cliente tinha dúvidas sobre configuração de lotes',
      'Explicado processo via telefone',
      'Enviado manual por email'
    ],
    client: {
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
    }
  },
  {
    id: 's5',
    title: 'Equipamento com defeito',
    description: 'Impressora apresenta erro constante e não imprime',
    priority: 'high',
    status: 'in_progress',
    category: 'equipment',
    assignedTo: 'Carlos Mendes',
    createdAt: new Date('2024-01-27'),
    notes: [
      'Cliente relatou erro E001 na impressora',
      'Agendada visita técnica para amanhã',
      'Possível necessidade de troca do equipamento'
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
    }
  },
];

export function Support() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [tickets, setTickets] = useState(mockTickets);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const getStatusColor = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return 'bg-warning-100 text-warning-800';
      case 'in_progress':
        return 'bg-gray-100 text-gray-800';
      case 'resolved':
        return 'bg-primary-100 text-primary-800';
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
        return 'text-danger-600';
      case 'high':
        return 'text-warning-600';
      case 'medium':
        return 'text-gray-600';
      case 'low':
        return 'text-primary-600';
      default:
        return 'text-gray-600';
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

  const handleViewTicket = (ticket: SupportTicket & { client: Client }) => {
    navigate(`/support/${ticket.id}`);
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length,
    avgResolutionTime: 4.2, // horas - calculado
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suporte Técnico</h1>
          <p className="text-gray-600">
            Gerencie tickets de suporte e solicitações dos clientes.
          </p>
        </div>
        <Button onClick={() => navigate('/support/new')}>
          <Plus size={16} className="mr-2" />
          Novo Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tickets</CardTitle>
            <HeadsetIcon className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-600">
              Todos os tickets cadastrados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Abertos</CardTitle>
            <XCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning-600">{stats.open + stats.inProgress}</div>
            <p className="text-xs text-gray-600">
              {stats.open} abertos • {stats.inProgress} em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Resolvidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary-600">{stats.resolved}</div>
            <p className="text-xs text-gray-600">
              {((stats.resolved / stats.total) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResolutionTime}h</div>
            <p className="text-xs text-gray-600">
              Tempo de resolução
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar tickets específicos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <MagnifyingGlass 
                size={16} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" 
              />
              <Input
                placeholder="Buscar por título, cliente, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="all">Todos os Status</option>
              <option value="open">Aberto</option>
              <option value="in_progress">Em Andamento</option>
              <option value="resolved">Resolvido</option>
              <option value="closed">Fechado</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500"
            >
              <option value="all">Todas as Categorias</option>
              <option value="technical">Técnico</option>
              <option value="commercial">Comercial</option>
              <option value="training">Treinamento</option>
              <option value="equipment">Equipamento</option>
              <option value="other">Outro</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Tickets ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Ticket</th>
                  <th className="text-left py-3 px-4 font-medium">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium">Categoria</th>
                  <th className="text-left py-3 px-4 font-medium">Prioridade</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Responsável</th>
                  <th className="text-left py-3 px-4 font-medium">Criado</th>
                  <th className="text-right py-3 px-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">#{ticket.id.toUpperCase()}</div>
                        <div className="text-sm text-gray-900 font-medium">{ticket.title}</div>
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {ticket.description}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-1 rounded ${ticket.client.clientType === 'business' ? 'bg-blue-100' : 'bg-green-100'}`}>
                          {ticket.client.clientType === 'business' ? (
                            <Building size={12} className="text-blue-600" />
                          ) : (
                            <User size={12} className="text-green-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{ticket.client.name}</div>
                          <div className="text-sm text-gray-600">
                            {getBusinessTypeText(ticket.client.businessType)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {getCategoryText(ticket.category)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Flag size={12} className={getPriorityColor(ticket.priority)} />
                        <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                          {getPriorityText(ticket.priority)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusText(ticket.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {ticket.assignedTo || 'Não atribuído'}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-gray-400" />
                        {ticket.createdAt.toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewTicket(ticket)}
                          className="h-8 w-8"
                          title="Ver detalhes"
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/support/${ticket.id}/edit`)}
                          className="h-8 w-8"
                          title="Editar ticket"
                        >
                          <PencilSimple size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTickets.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <HeadsetIcon className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Nenhum ticket encontrado' 
                  : 'Nenhum ticket cadastrado'
                }
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando o primeiro ticket de suporte.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && categoryFilter === 'all' && (
                <Button onClick={() => navigate('/support/new')}>
                  Criar Primeiro Ticket
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
