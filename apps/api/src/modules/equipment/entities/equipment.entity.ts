import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';

export enum EquipmentType {
  PRINTER = 'printer',
  SCALE = 'scale',
  SCANNER = 'scanner',
  TABLET = 'tablet',
  COMPUTER = 'computer',
  OTHER = 'other',
}

export enum EquipmentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  RETURNED = 'returned',
  LOST = 'lost',
  DAMAGED = 'damaged',
}

export enum EquipmentCondition {
  NEW = 'new',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  DAMAGED = 'damaged',
}

@Entity('equipment')
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @ManyToOne(() => Client, (client) => client.equipment, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'enum', enum: EquipmentType })
  type: EquipmentType;

  @Column({ length: 100 })
  brand: string;

  @Column({ length: 100 })
  model: string;

  @Column({ unique: true, length: 100 })
  serialNumber: string;

  @Column({ nullable: true, length: 50 })
  patrimonyNumber?: string;

  @Column({ type: 'enum', enum: EquipmentStatus, default: EquipmentStatus.ACTIVE })
  status: EquipmentStatus;

  @Column({ type: 'enum', enum: EquipmentCondition, default: EquipmentCondition.NEW })
  condition: EquipmentCondition;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  purchaseValue?: number;

  @Column({ type: 'date', nullable: true })
  purchaseDate?: Date;

  @Column({ type: 'date' })
  loanStartDate: Date;

  @Column({ type: 'date', nullable: true })
  loanEndDate?: Date;

  @Column({ type: 'date', nullable: true })
  returnDate?: Date;

  @Column({ nullable: true, length: 255 })
  location?: string;

  @Column({ nullable: true, type: 'text' })
  specifications?: string;

  @Column({ nullable: true, type: 'text' })
  accessories?: string;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @Column({ type: 'json', nullable: true })
  photos?: string[];

  @Column({ nullable: true, length: 500 })
  invoiceUrl?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeFields() {
    if (this.name) {
      this.name = this.name.trim();
    }
    if (this.brand) {
      this.brand = this.brand.trim();
    }
    if (this.model) {
      this.model = this.model.trim();
    }
    if (this.serialNumber) {
      this.serialNumber = this.serialNumber.trim().toUpperCase();
    }
    if (this.patrimonyNumber) {
      this.patrimonyNumber = this.patrimonyNumber.trim().toUpperCase();
    }
    if (this.location) {
      this.location = this.location.trim();
    }
  }
}
