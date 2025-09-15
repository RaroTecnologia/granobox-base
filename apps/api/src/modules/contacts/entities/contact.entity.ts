import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Client } from '../../clients/entities/client.entity';

export enum ContactType {
  COMMERCIAL = 'commercial',
  TECHNICAL = 'technical',
  FINANCIAL = 'financial',
  ADMINISTRATIVE = 'administrative',
  OTHER = 'other',
}

@Entity('contacts')
export class Contact {
  @ApiProperty({
    description: 'ID único do contato',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'ID do cliente',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column()
  clientId: string;

  @ApiProperty({
    description: 'Nome completo do contato',
    example: 'João Silva Santos',
  })
  @Column({ length: 255 })
  name: string;

  @ApiProperty({
    description: 'Cargo ou função do contato',
    example: 'Gerente Comercial',
  })
  @Column({ length: 100, nullable: true })
  role?: string;

  @ApiProperty({
    description: 'Tipo de contato',
    enum: ContactType,
    example: ContactType.COMMERCIAL,
  })
  @Column({
    type: 'enum',
    enum: ContactType,
    default: ContactType.COMMERCIAL,
  })
  type: ContactType;

  @ApiProperty({
    description: 'Email principal do contato',
    example: 'joao@empresa.com.br',
  })
  @Column({ length: 255 })
  email: string;

  @ApiProperty({
    description: 'Telefone do contato',
    example: '11999999999',
  })
  @Column({ length: 20, nullable: true })
  phone?: string;

  @ApiProperty({
    description: 'WhatsApp do contato',
    example: '11888888888',
  })
  @Column({ length: 20, nullable: true })
  whatsapp?: string;

  @ApiProperty({
    description: 'Departamento do contato',
    example: 'Vendas',
  })
  @Column({ length: 100, nullable: true })
  department?: string;

  @ApiProperty({
    description: 'Se é o contato principal do cliente',
    example: false,
  })
  @Column({ default: false })
  isPrimary: boolean;

  @ApiProperty({
    description: 'Se o contato está ativo',
    example: true,
  })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Observações sobre o contato',
    example: 'Responsável por aprovações de compras',
  })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:30:00Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-01-20T15:45:00Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos
  @ManyToOne(() => Client, (client) => client.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clientId' })
  client: Client;
}
