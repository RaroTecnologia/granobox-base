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
import { Sheet } from './sheet.entity';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'image'
  | 'nutrient';

export interface SchemaField {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  defaultValue?: unknown;
  section?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  /** Para type='nutrient': unidade (kcal, g, mg) */
  unit?: string;
  /** Para type='nutrient': valor diário de referência para % VD. 0 ou omitido = não exibe % VD (ex: gorduras trans) */
  vdReference?: number;
}

@Entity('sheet_schemas')
export class SheetSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  fields: SchemaField[];

  /** Campos extras configuráveis para cada variação de SKU (mesma estrutura de SchemaField). */
  @Column({ type: 'jsonb', nullable: true })
  skuFields: SchemaField[] | null;

  @Column()
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @OneToMany(() => Sheet, (sheet) => sheet.schema)
  sheets: Sheet[];

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
