import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ClientUser } from '../../clients/entities/client-user.entity';
import { Client } from '../../clients/entities/client.entity';

export enum PrinterStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  ERROR = 'error'
}

export enum PrinterUsage {
  VALIDITY = 'validity',
  LABEL = 'label'
}

@Entity('printers')
export class Printer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Referência ao Tagment (apenas ID)
  @Column({ type: 'varchar', length: 255, unique: true })
  tagmentId: string;

  // Metadados específicos do Granobox
  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({
    type: 'text',
    array: true,
    default: ['validity']
  })
  usage: string[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Relacionamentos
  @Column({ type: 'uuid' })
  clientId: string;

  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @ManyToOne(() => ClientUser, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdById' })
  createdBy: ClientUser;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
