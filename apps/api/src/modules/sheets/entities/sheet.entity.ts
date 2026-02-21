import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { ClientUser } from '../../clients/entities/client-user.entity';
import { SheetSchema } from './schema.entity';
import { SheetVersion } from './sheet-version.entity';
import { SheetApproval } from './sheet-approval.entity';
import { SheetSku } from './sheet-sku.entity';
import { SheetGroup } from './sheet-group.entity';

export type SheetStatus =
  | 'draft' // Rascunho
  | 'pending_review' // Aguardando revisão
  | 'in_review' // Em revisão
  | 'changes_requested' // Alterações solicitadas
  | 'approved' // Aprovado
  | 'active'; // Ativo/Em produção

@Entity('sheets')
export class Sheet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  sku: string;

  @Column()
  schemaId: string;

  @ManyToOne(() => SheetSchema)
  @JoinColumn({ name: 'schemaId' })
  schema: SheetSchema;

  @Column({ type: 'jsonb' })
  data: Record<string, unknown>;

  @Column({ default: 'draft' })
  status: SheetStatus;

  @Column({ default: 1 })
  version: number;

  /** Quando preenchido, indica qual versão está "publicada" (ativa). Usado quando há rascunho em cima da ficha ativa. */
  @Column({ nullable: true })
  publishedVersionId: string;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ nullable: true })
  templateId: string;

  @Column({ nullable: true })
  groupId: string;

  @ManyToOne(() => SheetGroup, (g) => g.sheets, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'groupId' })
  group: SheetGroup;

  @Column()
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column()
  createdBy: string;

  @ManyToOne(() => ClientUser)
  @JoinColumn({ name: 'createdBy' })
  createdByUser: ClientUser;

  @Column({ nullable: true })
  updatedBy: string;

  @ManyToOne(() => ClientUser)
  @JoinColumn({ name: 'updatedBy' })
  updatedByUser: ClientUser;

  @OneToMany(() => SheetVersion, (version) => version.sheet)
  versions: SheetVersion[];

  @OneToMany(() => SheetApproval, (approval) => approval.sheet)
  approvals: SheetApproval[];

  @OneToMany(() => SheetSku, (sku) => sku.sheet, { cascade: true })
  skus: SheetSku[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
