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
import { SheetSchema } from './schema.entity';

export type ApprovalStageType =
  | 'technical_review'
  | 'quality_review'
  | 'regulatory_review'
  | 'final_approval'
  | 'print_approval'
  | 'custom';

@Entity('approval_workflows')
export class ApprovalWorkflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ nullable: true })
  schemaId: string;

  @ManyToOne(() => SheetSchema, { nullable: true })
  @JoinColumn({ name: 'schemaId' })
  schema: SheetSchema;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => ApprovalWorkflowStage, (stage) => stage.workflow, { cascade: true })
  stages: ApprovalWorkflowStage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('approval_workflow_stages')
export class ApprovalWorkflowStage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workflowId: string;

  @ManyToOne(() => ApprovalWorkflow, (workflow) => workflow.stages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow: ApprovalWorkflow;

  @Column()
  name: string;

  @Column()
  stageType: ApprovalStageType;

  @Column()
  order: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  assignedToUserId: string;

  @Column({ nullable: true })
  assignedToRole: string;

  @Column({ default: true })
  required: boolean;

  @Column({ default: false })
  autoApprove: boolean;

  @Column({ type: 'int', nullable: true })
  deadlineDays: number;

  @CreateDateColumn()
  createdAt: Date;
}
