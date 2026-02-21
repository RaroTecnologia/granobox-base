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

export type ShareAccessType = 'public' | 'email_restricted';
export type SharePermission = 'view' | 'comment' | 'edit' | 'approve';

@Entity('sheet_shares')
export class SheetShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sheetId: string;

  @ManyToOne(() => Sheet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sheetId' })
  sheet: Sheet;

  @Column()
  clientId: string;

  // Token único para acesso público (UUID curto ou nanoid)
  @Column({ unique: true })
  token: string;

  // Tipo de acesso
  @Column({ default: 'public' })
  accessType: ShareAccessType;

  // Permissão concedida
  @Column({ default: 'view' })
  permission: SharePermission;

  // Email restrito (se accessType = 'email_restricted')
  @Column({ nullable: true })
  allowedEmail: string;

  // Nome do convidado (para exibição)
  @Column({ nullable: true })
  guestName: string;

  // Mensagem personalizada (opcional)
  @Column({ type: 'text', nullable: true })
  message: string;

  // Expiração (null = sem expiração)
  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  // Ativo/revogado
  @Column({ default: true })
  active: boolean;

  // Quem criou o share
  @Column()
  createdBy: string;

  // Tracking de acesso
  @Column({ type: 'int', default: 0 })
  accessCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
