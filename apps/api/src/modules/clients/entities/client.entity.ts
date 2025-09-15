import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Equipment } from '../../equipment/entities/equipment.entity';
import { ClientUser } from './client-user.entity';

export enum ClientType {
  INDIVIDUAL = 'individual', // Pessoa Física
  BUSINESS = 'business',     // Pessoa Jurídica
}

export enum ClientStatus {
  ACTIVE = 'active',
  PROSPECT = 'prospect',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled',
}

export enum BusinessType {
  BAKERY = 'bakery',
  RESTAURANT = 'restaurant',
  HOTEL = 'hotel',
  CONFECTIONERY = 'confectionery',
  SUPERMARKET = 'supermarket',
  OTHER = 'other',
}

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ClientType,
  })
  clientType: ClientType;

  @Column({
    type: 'enum',
    enum: ClientStatus,
    default: ClientStatus.PROSPECT,
  })
  status: ClientStatus;

  // Campos para Pessoa Física
  @Column({ nullable: true, length: 255 })
  fullName?: string;

  @Column({ nullable: true, length: 14 })
  cpf?: string;

  @Column({ nullable: true })
  birthDate?: Date;

  // Campos para Pessoa Jurídica
  @Column({ nullable: true, length: 255 })
  businessName?: string;

  @Column({ nullable: true, length: 255 })
  legalName?: string;

  @Column({ nullable: true, length: 18 })
  cnpj?: string;

  @Column({
    type: 'enum',
    enum: BusinessType,
    nullable: true,
  })
  businessType?: BusinessType;

  // Contato Principal
  @Column({ length: 255 })
  contactName: string;

  @Column({ length: 255 })
  contactEmail: string;

  @Column({ nullable: true, length: 20 })
  contactPhone?: string;

  @Column({ nullable: true, length: 20 })
  contactWhatsapp?: string;

  // Endereço
  @Column({ length: 10 })
  zipCode: string;

  @Column({ length: 255 })
  street: string;

  @Column({ length: 10 })
  number: string;

  @Column({ nullable: true, length: 100 })
  complement?: string;

  @Column({ length: 100 })
  neighborhood: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 2 })
  state: string;

  // Termos Comerciais
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  setupFee: number;

  @Column({ type: 'int', default: 30 })
  paymentTerms: number; // dias

  @Column({ default: false })
  isActive: boolean;

  @Column({ nullable: true })
  activatedAt?: Date;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos
  @OneToMany(() => Equipment, equipment => equipment.client)
  equipment: Equipment[];

  @OneToMany(() => ClientUser, user => user.client)
  users: ClientUser[];


  // @OneToMany(() => SupportTicket, ticket => ticket.client)
  // supportTickets: SupportTicket[];

  // @OneToMany(() => Invoice, invoice => invoice.client)
  // invoices: Invoice[];
}

