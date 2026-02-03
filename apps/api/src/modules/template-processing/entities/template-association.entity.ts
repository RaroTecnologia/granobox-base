import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';

export enum LabelType {
  PRODUTO_MANIPULADO = 'produto_manipulado',
  PRODUTO_PRONTO = 'produto_pronto',
  RECEBIMENTO = 'recebimento',
  ETIQUETA_VALIDADE = 'etiqueta_validade',
}

@Entity('template_associations')
export class TemplateAssociation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  templateId: string; // ID do template no Tagment

  @Column({ type: 'varchar', length: 100 })
  templateName: string; // Nome do template

  @Column({
    type: 'enum',
    enum: LabelType,
  })
  labelType: LabelType;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  templateData: Record<string, any>; // Dados do template do Tagment

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ type: 'uuid' })
  clientId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
