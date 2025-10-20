import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Label } from '../../labels/entities/label.entity';
import { ProductReceiptItem } from './product-receipt-item.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';

export type ReceiptStatus = 'pending' | 'received' | 'rejected' | 'cancelled';

@Entity('product_receipts')
export class ProductReceipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clientId: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ type: 'uuid', nullable: true })
  supplierId: string; // Referência ao fornecedor cadastrado (opcional)

  @ManyToOne(() => Supplier, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;

  @Column({ type: 'varchar', length: 50, nullable: true })
  supplierCode: string; // Código de barras do fornecedor

  @Column({ type: 'varchar', length: 200, nullable: true })
  supplierName: string;

  @Column({ type: 'varchar', length: 18, nullable: true })
  supplierCnpj: string; // CNPJ do fornecedor

  @Column({ type: 'varchar', length: 200 })
  productName: string;

  @Column({ type: 'text', nullable: true })
  productDescription: string;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantity: number;

  @Column({ type: 'varchar', length: 10, default: 'kg' })
  unit: string;

  @Column({ type: 'date' })
  productionDate: Date;

  @Column({ type: 'date' })
  validityDate: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  temperature: number; // Temperatura no recebimento

  @Column({ type: 'varchar', length: 50, nullable: true })
  batchNumber: string; // Lote de fabricação do fornecedor

  @Column({
    type: 'enum',
    enum: ['pending', 'received', 'rejected', 'cancelled'],
    default: 'pending'
  })
  status: ReceiptStatus;

  @Column({ type: 'varchar', length: 20, nullable: true })
  condition: string; // 'conforme', 'nao_conforme', 'parcial'

  @Column({ type: 'boolean', default: false })
  labelsGenerated: boolean; // Se já gerou etiquetas

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos
  @OneToMany(() => ProductReceiptItem, item => item.receipt)
  items: ProductReceiptItem[];
}
