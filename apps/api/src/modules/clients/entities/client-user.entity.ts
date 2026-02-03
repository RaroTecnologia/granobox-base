import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Client } from './client.entity';
import { ClientUserOperation } from './client-user-operation.entity';
import * as bcrypt from 'bcrypt';

export enum ClientUserRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
}

export enum ClientUserStatus {
  PENDING = 'pending', // Aguardando aceitar convite
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('client_users')
export class ClientUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clientId: string;

  @ManyToOne(() => Client, (client) => client.users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ nullable: true, length: 255 })
  password?: string;

  @Column({ type: 'enum', enum: ClientUserRole, default: ClientUserRole.ADMIN })
  role: ClientUserRole;

  @Column({
    type: 'enum',
    enum: ClientUserStatus,
    default: ClientUserStatus.PENDING,
  })
  status: ClientUserStatus;

  @Column({ nullable: true, length: 500 })
  inviteToken?: string;

  @Column({ nullable: true, type: 'timestamp with time zone' })
  inviteExpiresAt?: Date;

  @Column({ nullable: true, type: 'timestamp with time zone' })
  lastLoginAt?: Date;

  @Column({ default: true })
  isActive: boolean;

  // ⭐ NOVO: Relacionamento com operações
  @OneToMany(() => ClientUserOperation, (relation) => relation.clientUser, {
    eager: true,
  })
  operations: ClientUserOperation[];

  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @Column({ nullable: true, length: 255 })
  resetPasswordToken?: string;

  @Column({ nullable: true, type: 'timestamp with time zone' })
  resetPasswordExpiresAt?: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeFields() {
    if (this.name) {
      this.name = this.name.trim();
    }
    if (this.email) {
      this.email = this.email.trim().toLowerCase();
    }
  }

  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
  }

  isInviteExpired(): boolean {
    if (!this.inviteExpiresAt) return false;
    return new Date() > this.inviteExpiresAt;
  }

  canAcceptInvite(): boolean {
    return (
      this.status === ClientUserStatus.PENDING &&
      !this.isInviteExpired() &&
      this.isActive
    );
  }

  // ⭐ NOVO: Métodos helpers para operações
  hasAccessToOperation(operationId: string): boolean {
    // Se não tem operações específicas, tem acesso a todas
    if (!this.operations || this.operations.length === 0) {
      return true;
    }
    // Verificar se tem acesso à operação específica
    return this.operations.some((op) => op.operationId === operationId);
  }

  getAllowedOperationIds(): string[] | null {
    if (!this.operations || this.operations.length === 0) {
      return null; // Acesso a todas
    }
    return this.operations.map((op) => op.operationId);
  }
}
