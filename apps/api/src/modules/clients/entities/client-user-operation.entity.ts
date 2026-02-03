import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ClientUser } from './client-user.entity';
import { Operation } from '../../subscriptions/entities/operation.entity';

@Entity('client_user_operations')
export class ClientUserOperation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  clientUserId: string;

  @ManyToOne(() => ClientUser, (user) => user.operations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clientUserId' })
  clientUser: ClientUser;

  @Column('uuid')
  operationId: string;

  @ManyToOne(() => Operation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'operationId' })
  operation: Operation;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
