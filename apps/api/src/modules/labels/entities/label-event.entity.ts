import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Label } from './label.entity';

export enum LabelEventType {
  CREATED = 'created',
  PRINTED = 'printed',
  USED = 'used',
  UPDATED = 'updated',
  ARCHIVED = 'archived',
  VIEWED = 'viewed',
}

@Entity('label_events')
export class LabelEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  labelId: string;

  @Column({
    type: 'enum',
    enum: LabelEventType,
  })
  type: LabelEventType;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Label, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'labelId' })
  label: Label;
}

