import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sheet } from './sheet.entity';

@Entity('sheet_skus')
export class SheetSku {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sheetId: string;

  @ManyToOne(() => Sheet, (sheet) => sheet.skus, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sheetId' })
  sheet: Sheet;

  @Column()
  sku: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  barcode: string; // EAN, UPC, Code128 etc.

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weight: number;

  @Column({ nullable: true })
  weightUnit: string; // g, kg, ml, l, un

  @Column({ type: 'int', nullable: true })
  quantity: number; // unidades por embalagem

  @Column({ nullable: true })
  baseId: string; // FK para Base (template de impressão)

  @Column({ nullable: true })
  baseName: string; // Cache do nome da base para exibição

  @Column({ nullable: true })
  basePreviewUrl: string; // Cache da preview da base

  /** Key no R2 do PNG mockup com variáveis preenchidas (inclui background). Exibição, não ZPL. */
  @Column({ type: 'varchar', length: 512, nullable: true })
  mockupR2Key: string;

  // ── Z64 Cache para impressão instantânea ──

  /** Z64 pré-renderizado (Canvas + variáveis → PNG → Z64). Pronto para injetar no ZPL. */
  @Column({ type: 'jsonb', nullable: true })
  cachedZ64Data: { z64: string; totalBytes: number; bytesPerRow: number } | null;

  /** Timestamp de quando o Z64 foi gerado. Comparado com template.updatedAt / sheet.updatedAt / sku.updatedAt. */
  @Column({ type: 'timestamptz', nullable: true })
  cachedZ64At: Date | null;

  /** ID do StudioTemplate usado para gerar o Z64 cacheado. */
  @Column({ type: 'uuid', nullable: true })
  cachedZ64TemplateId: string | null;

  /** Dados extras do SKU definidos pelo schema (skuFields). */
  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, unknown> | null;

  @Column({ type: 'int', default: 0 })
  stockQuantity: number;

  @Column({ type: 'int', default: 0 })
  minStockLevel: number;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ default: true })
  active: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
