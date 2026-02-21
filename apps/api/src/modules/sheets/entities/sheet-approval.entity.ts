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

export type ApprovalStage =
  | 'technical_review' // Revisão técnica
  | 'quality_review' // Revisão de qualidade
  | 'regulatory_review' // Revisão regulatória
  | 'final_approval' // Aprovação final
  | 'print_approval'; // Aprovação para impressão (flexo)

export type ApprovalStatus =
  | 'pending'
  | 'in_progress'
  | 'approved'
  | 'rejected'
  | 'skipped';

@Entity('sheet_approvals')
export class SheetApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sheetId: string;

  @ManyToOne(() => Sheet, (sheet) => sheet.approvals)
  @JoinColumn({ name: 'sheetId' })
  sheet: Sheet;

  @Column()
  stage: ApprovalStage;

  @Column({ default: 1 })
  order: number;

  @Column({ default: 'pending' })
  status: ApprovalStatus;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ nullable: true })
  assignedTo: string;

  @ManyToOne(() => ClientUser)
  @JoinColumn({ name: 'assignedTo' })
  assignedUser: ClientUser;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ nullable: true })
  completedAt: Date;

  @Column({ nullable: true })
  completedBy: string;

  @ManyToOne(() => ClientUser)
  @JoinColumn({ name: 'completedBy' })
  completedByUser: ClientUser;

  @CreateDateColumn()
  createdAt: Date;
}
