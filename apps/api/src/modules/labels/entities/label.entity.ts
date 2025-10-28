import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Product } from '../../products/entities/product.entity';
import { Operation } from '../../subscriptions/entities/operation.entity';

export enum LabelType {
  VALIDITY = 'validity',
  LABEL = 'label'
}

export enum ConservationType {
  AMBIENT = 'ambiente',
  REFRIGERATED = 'refrigerado',
  FROZEN = 'congelado',
  ORIGINAL_VALIDITY = 'validade_original' // ✅ NOVO: Para matérias-primas com validade original do fabricante
}

export enum LabelStatus {
  PENDING = 'pending',
  PRINTED = 'printed',
  FAILED = 'failed',
  CONSUMED = 'consumed'
}

@Entity('labels')
export class Label {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: LabelType,
    default: LabelType.VALIDITY
  })
  type: LabelType;

  @Column({
    type: 'enum',
    enum: ConservationType,
    nullable: true
  })
  conservationType: ConservationType;

  @Column({
    type: 'enum',
    enum: LabelStatus,
    default: LabelStatus.PENDING
  })
  status: LabelStatus;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  weight: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  unit: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  price: string;

  @Column({ type: 'date' })
  productionDate: Date;

  @Column({ type: 'date' })
  validityDate: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  manufacturingBatch: string;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column('uuid')
  clientId: string;

  @Column('uuid')
  productId: string;

  @Column({ type: 'uuid', nullable: true })
  storageLocationId: string;

  @Column({ type: 'uuid', nullable: true })
  receiptId: string;

  // ⭐ NOVO: Vínculo com operation
  @Column({ type: 'uuid', nullable: true })
  operationId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  // ⭐ NOVO: Relacionamento com operation
  @ManyToOne(() => Operation, { nullable: true })
  @JoinColumn({ name: 'operationId' })
  operation: Operation;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
