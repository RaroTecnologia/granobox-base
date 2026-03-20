import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Category } from './category.entity';
import { Operation } from '../../subscriptions/entities/operation.entity'; // ⭐ NOVO

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  code: string;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sif: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  weight: string;

  @Column({ nullable: true })
  weightUnit: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  quantity: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice: number;

  @Column()
  currency: string;

  @Column({ type: 'int', nullable: true })
  shelfLifeAmbient: number;

  @Column({ type: 'int', nullable: true })
  shelfLifeRefrigerated: number;

  @Column({ type: 'int', nullable: true })
  shelfLifeFrozen: number;

  @Column({ type: 'text', nullable: true })
  ingredients: string;

  @Column({ type: 'text', nullable: true })
  allergens: string;

  @Column({ type: 'text', nullable: true })
  nutritionalInfo: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  observations: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  barcode: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  showBrandOnLabel: boolean;

  @Column({ type: 'boolean', default: false })
  showSifOnLabel: boolean;

  @Column({ type: 'boolean', default: false })
  showManufacturingBatchOnLabel: boolean;

  @Column({ type: 'boolean', default: false })
  showExpiryDateOnLabel: boolean;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column('uuid')
  clientId: string;

  // ⭐ NOVO: Vínculo com operation
  @Column({ type: 'uuid', nullable: true })
  operationId: string;

  @ManyToOne(() => Operation, { nullable: true })
  @JoinColumn({ name: 'operationId' })
  operation: Operation;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column('uuid', { nullable: true })
  categoryId: string;

  @Column('uuid', { nullable: true })
  defaultStorageLocationId: string;

  @Column('uuid', { nullable: true })
  customTemplateId: string;

  // ⭐ NOVO: Impressora padrão para este produto
  @Column('uuid', { nullable: true })
  defaultPrinterId: string;

  // ⭐ NOVO: Quando true, impressão é só rótulo (sem código/rastreabilidade)
  @Column({ type: 'boolean', default: false, nullable: true })
  isLabelOnly: boolean;

  // ⭐ NOVO: Quando true, exibe hora na manipulação e validade
  @Column({ type: 'boolean', default: true, nullable: true })
  showTimeOnLabel: boolean;

  // Produto exige controle de rastreabilidade (inclui em relatórios de rastreabilidade de alimentos, etc.)
  @Column({ type: 'boolean', default: false, nullable: true })
  rastreabilidade: boolean;

  /** Quando true, etiqueta de validade exibe "INDETERMINADA" no lugar da data (ex.: bebidas destiladas) */
  @Column({ type: 'boolean', default: false, nullable: true })
  validityIndeterminate: boolean;

  @Column('uuid', { nullable: true })
  importBatchId: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
