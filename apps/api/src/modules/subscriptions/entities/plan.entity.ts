import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Subscription } from './subscription.entity';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['basic', 'professional', 'enterprise'],
    default: 'basic'
  })
  type: 'basic' | 'professional' | 'enterprise';

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'BRL' })
  currency: string;

  @Column({
    type: 'enum',
    enum: ['monthly', 'annual'],
    default: 'monthly'
  })
  period: 'monthly' | 'annual';

  @Column({ default: 1000 })
  maxOperations: number;

  @Column({ default: 1000 })
  maxLabelsPerMonth: number;

  @Column({ default: 5 })
  maxUsers: number;

  @Column({ default: false })
  hasSupport: boolean;

  @Column({ default: false })
  hasAdvancedAnalytics: boolean;

  @Column({ default: false })
  hasCustomBranding: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column('json', { nullable: true })
  features: Record<string, any>;

  @OneToMany(() => Subscription, subscription => subscription.plan)
  subscriptions: Subscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


