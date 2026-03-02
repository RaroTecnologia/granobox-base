import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Printer } from '../../printers/entities/printer.entity';
import { Operation } from '../../subscriptions/entities/operation.entity';
import { LabelSku } from '../../label-orders/entities/label-sku.entity';

export enum SupplyRollType {
  LABEL = 'label',
  RIBBON = 'ribbon',
}

export enum SupplyRollStatus {
  /** Em estoque Granobox — QR impresso e colado na embalagem */
  IN_STOCK = 'in_stock',
  /** Associado a um cliente (separação de pedido) */
  ASSIGNED = 'assigned',
  /** Instalado em uma impressora do cliente */
  INSTALLED = 'installed',
  /** Esgotado / substituído */
  DEPLETED = 'depleted',
}

/**
 * Rolo físico de etiqueta ou ribbon.
 *
 * O `id` (UUID) é o conteúdo do QR code colado na embalagem.
 * Ciclo de vida: in_stock → assigned → installed → depleted
 *
 * Ver: docs/SUPPLY_ROLL_TRACKING.md
 */
@Entity('supply_rolls')
@Index(['clientId', 'status'])
@Index(['printerId', 'status'])
@Index(['skuId'])
@Index(['batchCode'])
@Index(['shortCode'], { unique: true })
export class SupplyRoll {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Código curto para QR compacto. Formato: GBR-A3K7M9 */
  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  shortCode: string | null;

  // ── Tipo e SKU ──

  @Column({ type: 'enum', enum: SupplyRollType })
  type: SupplyRollType;

  @Column({ type: 'uuid' })
  skuId: string;

  @ManyToOne(() => LabelSku, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'skuId' })
  sku: LabelSku;

  // ── Status ──

  @Column({
    type: 'enum',
    enum: SupplyRollStatus,
    default: SupplyRollStatus.IN_STOCK,
  })
  status: SupplyRollStatus;

  // ── Vínculos (preenchidos ao longo do ciclo de vida) ──

  @Column({ type: 'uuid', nullable: true })
  clientId: string | null;

  @ManyToOne(() => Client, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ type: 'uuid', nullable: true })
  printerId: string | null;

  @ManyToOne(() => Printer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'printerId' })
  printer: Printer;

  @Column({ type: 'uuid', nullable: true })
  operationId: string | null;

  @ManyToOne(() => Operation, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'operationId' })
  operation: Operation;

  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  // ── Recebimento (NF fornecedor) ──

  @Column({ type: 'varchar', length: 100, nullable: true })
  supplierInvoice: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  receivedAt: Date | null;

  // ── Lote de impressão de QR codes ──

  @Column({ type: 'varchar', length: 50, nullable: true })
  batchCode: string | null;

  // ── Timestamps do ciclo de vida ──

  @Column({ type: 'timestamptz', nullable: true })
  assignedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  installedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  depletedAt: Date | null;

  // ── Contadores de uso (incrementados a cada impressão) ──

  /** Etiquetas impressas desde a instalação */
  @Column({ type: 'int', default: 0 })
  printsSinceInstall: number;

  /** Metros de ribbon usados desde a instalação (só para type=ribbon) */
  @Column({ type: 'float', default: 0 })
  ribbonUsedMetersSinceInstall: number;

  // ── Metadata ──

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
