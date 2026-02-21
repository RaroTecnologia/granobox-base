import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ClientUser } from '../../clients/entities/client-user.entity';
import { Sheet } from './sheet.entity';

export interface VersionChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

@Entity('sheet_versions')
export class SheetVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sheetId: string;

  @ManyToOne(() => Sheet, (sheet) => sheet.versions)
  @JoinColumn({ name: 'sheetId' })
  sheet: Sheet;

  @Column()
  version: number;

  @Column({ type: 'jsonb' })
  data: Record<string, unknown>;

  /** Snapshot dos SKUs nesta versão (usado na versão publicada para servir conteúdo "ao vivo" quando há rascunho). */
  @Column({ type: 'jsonb', nullable: true })
  skus: Record<string, unknown>[];

  @Column({ type: 'jsonb', nullable: true })
  changes: VersionChange[];

  @Column()
  createdBy: string;

  @ManyToOne(() => ClientUser)
  @JoinColumn({ name: 'createdBy' })
  createdByUser: ClientUser;

  @CreateDateColumn()
  createdAt: Date;
}
