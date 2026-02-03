import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductReceipt } from './product-receipt.entity';
import { Label } from '../../labels/entities/label.entity';

export type ItemStatus =
  | 'created'
  | 'labelled'
  | 'stored'
  | 'used'
  | 'expired'
  | 'discarded';

@Entity('product_receipt_items')
export class ProductReceiptItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  receiptId: string;

  @ManyToOne(() => ProductReceipt, (receipt) => receipt.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'receiptId' })
  receipt: ProductReceipt;

  @Column({ type: 'varchar', length: 20, unique: true })
  labelCode: string; // Código único da etiqueta gerada

  @Column('uuid', { nullable: true })
  labelId: string;

  @ManyToOne(() => Label, { nullable: true })
  @JoinColumn({ name: 'labelId' })
  label: Label;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;

  @Column({ type: 'varchar', length: 10 })
  unit: string;

  @Column({
    type: 'enum',
    enum: ['created', 'labelled', 'stored', 'used', 'expired', 'discarded'],
    default: 'created',
  })
  status: ItemStatus;

  @Column({ type: 'uuid', nullable: true })
  parentItemId: string; // Para hierarquia (produto pai -> porções -> pratos)

  @ManyToOne(() => ProductReceiptItem, { nullable: true })
  @JoinColumn({ name: 'parentItemId' })
  parentItem: ProductReceiptItem;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
