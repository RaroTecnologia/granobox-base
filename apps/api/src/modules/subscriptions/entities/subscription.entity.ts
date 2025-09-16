import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { Plan } from './plan.entity';
import { Operation } from './operation.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'cancelled', 'suspended', 'expired'],
    default: 'active'
  })
  status: 'active' | 'inactive' | 'cancelled' | 'suspended' | 'expired';

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'date', nullable: true })
  cancellationDate: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'BRL' })
  currency: string;

  @Column({ default: 1 })
  billingCycle: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: true })
  isActive: boolean;

  @Column('uuid')
  clientId: string;

  @Column('uuid')
  planId: string;

  @ManyToOne(() => Client, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @ManyToOne(() => Plan, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'planId' })
  plan: Plan;

  @OneToMany(() => Operation, operation => operation.subscription)
  operations: Operation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


