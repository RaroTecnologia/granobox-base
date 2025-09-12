// Tipos que correspondem exatamente à API

export interface ApiClient {
  id: string;
  clientType: 'individual' | 'business';
  status: 'active' | 'prospect' | 'inactive' | 'suspended' | 'cancelled';
  
  // Campos para Pessoa Física
  fullName?: string;
  cpf?: string;
  birthDate?: string;
  
  // Campos para Pessoa Jurídica
  businessName?: string;
  legalName?: string;
  cnpj?: string;
  businessType?: 'bakery' | 'restaurant' | 'hotel' | 'confectionery' | 'supermarket' | 'other';
  
  // Contato Principal
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  
  // Endereço
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  
  // Termos Comerciais
  monthlyFee: number;
  setupFee: number;
  paymentTerms: number; // dias
  isActive: boolean;
  activatedAt?: string;
  notes?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientRequest {
  clientType: 'individual' | 'business';
  
  // Campos para Pessoa Física
  fullName?: string;
  cpf?: string;
  birthDate?: string;
  
  // Campos para Pessoa Jurídica
  businessName?: string;
  legalName?: string;
  cnpj?: string;
  businessType?: 'bakery' | 'restaurant' | 'hotel' | 'confectionery' | 'supermarket' | 'other';
  
  // Contato Principal
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  contactWhatsapp?: string;
  
  // Endereço
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  
  // Termos Comerciais
  monthlyFee?: number;
  setupFee?: number;
  paymentTerms?: number;
  notes?: string;
}

// Tipos para Contatos
export interface ApiContact {
  id: string;
  clientId: string;
  name: string;
  role?: string;
  type: 'commercial' | 'technical' | 'financial' | 'administrative' | 'other';
  email: string;
  phone?: string;
  whatsapp?: string;
  department?: string;
  isPrimary: boolean;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactRequest {
  clientId: string;
  name: string;
  role?: string;
  type: 'commercial' | 'technical' | 'financial' | 'administrative' | 'other';
  email: string;
  phone?: string;
  whatsapp?: string;
  department?: string;
  isPrimary?: boolean;
  notes?: string;
}

// Tipos para Equipamentos
export interface ApiEquipment {
  id: string;
  clientId: string;
  name: string;
  type: 'printer' | 'scale' | 'scanner' | 'tablet' | 'computer' | 'other';
  brand: string;
  model: string;
  serialNumber: string;
  patrimonyNumber?: string;
  status: 'active' | 'inactive' | 'maintenance' | 'returned' | 'lost' | 'damaged';
  condition: 'new' | 'good' | 'fair' | 'poor' | 'damaged';
  purchaseValue?: number;
  purchaseDate?: string;
  loanStartDate: string;
  loanEndDate?: string;
  returnDate?: string;
  location?: string;
  specifications?: string;
  accessories?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEquipmentRequest {
  clientId: string;
  name: string;
  type: 'printer' | 'scale' | 'scanner' | 'tablet' | 'computer' | 'other';
  brand: string;
  model: string;
  serialNumber: string;
  patrimonyNumber?: string;
  status?: 'active' | 'inactive' | 'maintenance' | 'returned' | 'lost' | 'damaged';
  condition?: 'new' | 'good' | 'fair' | 'poor' | 'damaged';
  purchaseValue?: number;
  purchaseDate?: string;
  loanStartDate: string;
  loanEndDate?: string;
  returnDate?: string;
  location?: string;
  specifications?: string;
  accessories?: string;
  notes?: string;
  isActive?: boolean;
}
