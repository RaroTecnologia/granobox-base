import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Sheet } from './sheet.entity';

@Entity('sheet_groups')
export class SheetGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  /** Ordem de exibição (menor = primeiro) */
  @Column({ type: 'int', default: 0 })
  order: number;

  @Column()
  clientId: string;

  @OneToMany(() => Sheet, (sheet) => sheet.group)
  sheets: Sheet[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
