import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Client } from './client.entity';

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

  @Column({ type: 'enum', enum: ClientUserStatus, default: ClientUserStatus.PENDING })
  status: ClientUserStatus;

  @Column({ nullable: true, length: 500 })
  inviteToken?: string;

  @Column({ nullable: true, type: 'timestamp with time zone' })
  inviteExpiresAt?: Date;

  @Column({ nullable: true, type: 'timestamp with time zone' })
  lastLoginAt?: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ nullable: true, length: 255 })
  resetPasswordToken?: string;

  @Column({ nullable: true, type: 'timestamp with time zone' })
  resetPasswordExpiresAt?: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
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
    // TODO: Implementar hash de senha
    // if (this.password) {
    //   this.password = await bcrypt.hash(this.password, 10);
    // }
  }

  async validatePassword(password: string): Promise<boolean> {
    // TODO: Implementar validação de senha
    // if (!this.password) return false;
    // return bcrypt.compare(password, this.password);
    return true;
  }

  isInviteExpired(): boolean {
    if (!this.inviteExpiresAt) return false;
    return new Date() > this.inviteExpiresAt;
  }

  canAcceptInvite(): boolean {
    return this.status === ClientUserStatus.PENDING && 
           !this.isInviteExpired() && 
           this.isActive;
  }
}

