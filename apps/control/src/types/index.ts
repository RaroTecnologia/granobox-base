// Tipos para Cliente (PF ou PJ)
export interface Client {
  id: string;
  
  // Tipo de cliente
  clientType: 'individual' | 'business'; // PF ou PJ
  
  // Dados básicos (comuns)
  name: string; // Nome completo (PF) ou Nome fantasia (PJ)
  email: string;
  phone: string;
  document: string; // CPF ou CNPJ
  address: Address;
  
  // Dados específicos PJ
  legalName?: string; // Razão social (apenas PJ)
  businessType?: 'restaurant' | 'bakery' | 'hotel' | 'confectionery' | 'other'; // apenas PJ
  
  // Contatos (principalmente PJ, mas PF pode ter contatos adicionais)
  contacts: Contact[];
  
  // Status e ativação
  status: 'prospect' | 'active' | 'inactive' | 'suspended' | 'cancelled';
  activationDate?: Date;
  
  // Produtos em comodato
  loanedEquipment: LoanedEquipment[];
  
  // Suporte e treinamentos
  supportHistory: SupportTicket[];
  trainings: Training[];
  
  // Dados comerciais
  contractType: 'monthly' | 'annual' | 'trial' | 'custom';
  monthlyFee: number;
  paymentMethod?: 'card' | 'pix' | 'boleto' | 'bank_transfer';
  
  // Dados do Stripe
  stripeCustomerId?: string;
  
  // Metadados
  notes?: string;
  tags: string[];
  assignedSalesperson?: string;
  
  // Datas
  createdAt: Date;
  updatedAt: Date;
  lastContactDate?: Date;
}

export interface Address {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// Contatos do estabelecimento
export interface Contact {
  id: string;
  name: string;
  role: string; // Gerente, Chef, Proprietário, etc.
  email?: string;
  phone?: string;
  isPrimary: boolean;
}

// Equipamentos em comodato
export interface LoanedEquipment {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  loanDate: Date;
  returnDate?: Date;
  status: 'active' | 'returned' | 'maintenance' | 'lost';
  monthlyFee: number;
  notes?: string;
}

// Tickets de suporte
export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: 'technical' | 'commercial' | 'training' | 'equipment' | 'other';
  assignedTo?: string;
  createdAt: Date;
  resolvedAt?: Date;
  notes: string[];
}

// Treinamentos
export interface Training {
  id: string;
  title: string;
  type: 'onboarding' | 'advanced' | 'maintenance' | 'update' | 'custom';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  scheduledDate: Date;
  completedDate?: Date;
  trainer?: string;
  attendees: string[]; // IDs dos contatos que participaram
  duration: number; // em minutos
  notes?: string;
  materials?: string[]; // Links para materiais
}

// Cobrança e Pagamentos
export interface Invoice {
  id: string;
  clientId: string;
  client: Client;
  invoiceNumber: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  items: InvoiceItem[];
  stripeInvoiceId?: string;
  paymentMethod?: 'card' | 'pix' | 'boleto' | 'bank_transfer';
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type: 'subscription' | 'equipment' | 'setup' | 'training' | 'other';
}

export interface Payment {
  id: string;
  invoiceId: string;
  clientId: string;
  amount: number;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  method: 'card' | 'pix' | 'boleto' | 'bank_transfer';
  createdAt: Date;
  processedAt?: Date;
  stripePaymentId?: string;
  failureReason?: string;
}

export interface Subscription {
  id: string;
  clientId: string;
  client: Client;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing';
  plan: 'monthly' | 'annual' | 'trial' | 'custom';
  amount: number;
  startDate: Date;
  endDate?: Date;
  nextBillingDate: Date;
  stripeSubscriptionId?: string;
  equipmentFees: number;
  totalAmount: number;
}

// Formulários
export interface CreateTicketForm {
  clientId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'commercial' | 'training' | 'equipment' | 'other';
  assignedTo?: string;
}

export interface CreateInvoiceForm {
  clientId: string;
  dueDate: Date;
  items: Omit<InvoiceItem, 'id' | 'total'>[];
  notes?: string;
}

// Usuários e Configurações
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'support' | 'sales' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  permissions: Permission[];
  department?: 'sales' | 'support' | 'finance' | 'operations' | 'management';
  phone?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: 'clients' | 'equipment' | 'support' | 'billing' | 'vouchers' | 'reports' | 'settings' | 'all';
  actions: ('create' | 'read' | 'update' | 'delete' | 'export')[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserForm {
  name: string;
  email: string;
  role: User['role'];
  department?: User['department'];
  phone?: string;
  permissions?: string[];
}

// Tipos para Voucher
export interface Voucher {
  id: string;
  clientId: string;
  client?: Client;
  code: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number; // Porcentagem ou valor fixo
  description: string;
  status: 'active' | 'used' | 'expired' | 'cancelled';
  usageLimit?: number;
  usageCount: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  usedAt?: Date;
}

// Tipos para Cobrança
export interface Billing {
  id: string;
  clientId: string;
  client?: Client;
  amount: number;
  currency: 'BRL';
  description: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
  paymentMethod?: 'card' | 'pix' | 'boleto';
  // Dados do Stripe
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  // Datas
  dueDate?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para Mensageria
export interface Message {
  id: string;
  clientId: string;
  client?: Client;
  type: 'email' | 'whatsapp' | 'sms';
  subject?: string; // Para email
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  // Metadados
  templateId?: string;
  variables?: Record<string, any>;
  // Dados de entrega
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para Templates de Mensagem
export interface MessageTemplate {
  id: string;
  name: string;
  type: 'email' | 'whatsapp' | 'sms';
  subject?: string; // Para email
  content: string;
  variables: string[]; // Lista de variáveis disponíveis
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para Dashboard/Analytics
export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalVouchers: number;
  usedVouchers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingBillings: number;
  messagesSent: number;
}

// Tipos para API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tipos para Forms
export interface CreateClientForm {
  // Tipo de cliente
  clientType: 'individual' | 'business';
  
  // Dados básicos (comuns)
  name: string; // Nome completo (PF) ou Nome fantasia (PJ)
  document: string; // CPF ou CNPJ
  email: string;
  phone?: string; // Telefone (opcional)
  whatsapp?: string; // WhatsApp (opcional)
  address?: Address; // Opcional para permitir formulários parciais
  
  // Dados específicos PJ
  legalName?: string; // Razão social (apenas PJ)
  businessType?: 'restaurant' | 'bakery' | 'hotel' | 'confectionery' | 'other';
  
  // Contato principal (opcional para PF, obrigatório para PJ)
  primaryContact?: {
    name: string;
    role: string;
    email?: string;
    phone?: string;
  };
  
  // Dados comerciais
  contractType?: 'monthly' | 'annual' | 'trial' | 'custom';
  monthlyFee?: number;
  setupFee?: number; // Taxa de instalação
  paymentTerms?: number; // Prazo de pagamento em dias
  
  // Vendedor responsável
  assignedSalesperson?: string;
  
  // Observações
  notes?: string;
}

export interface CreateVoucherForm {
  clientId: string;
  code: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  description: string;
  usageLimit?: number;
  expiresAt?: Date;
}

export interface CreateBillingForm {
  clientId: string;
  amount: number;
  description: string;
  dueDate?: Date;
  paymentMethod?: 'card' | 'pix' | 'boleto';
}

export interface SendMessageForm {
  clientId: string;
  type: 'email' | 'whatsapp' | 'sms';
  templateId?: string;
  subject?: string;
  content: string;
  variables?: Record<string, any>;
}

// Export template types
export * from './templates';
