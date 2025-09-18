import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Client } from '../../clients/entities/client.entity';

export enum StorageLocationType {
  GELADEIRA = 'geladeira',
  FREEZER = 'freezer',
  PRATELEIRA = 'prateleira',
  ESTOQUE = 'estoque',
  BALCAO = 'balcao',
  OUTRO = 'outro'
}

@Entity('storage_locations')
export class StorageLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({
    type: 'enum',
    enum: StorageLocationType,
    default: StorageLocationType.PRATELEIRA
  })
  tipo: StorageLocationType;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  temperatura: number;

  @Column({ type: 'integer', nullable: true })
  capacidade: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  setor: string;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ type: 'uuid' })
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


