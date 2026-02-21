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

export type TemplateType = 
  | 'rotulo'
  | 'contra_rotulo'
  | 'gargalo'
  | 'tampa'
  | 'caixa'
  | 'sleeve'
  | 'tag'
  | 'outro';

@Entity('sheet_templates')
export class SheetTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sheetId: string;

  @ManyToOne(() => Sheet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sheetId' })
  sheet: Sheet;

  @Column()
  studioTemplateId: string;

  @Column({ nullable: true })
  studioTemplateName: string;

  @Column({ nullable: true })
  studioTemplatePreview: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'rotulo',
  })
  type: TemplateType;

  @Column({ nullable: true })
  label: string;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ type: 'jsonb', nullable: true })
  fieldMappings: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  customData: Record<string, unknown>;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
