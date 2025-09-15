import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  SUPPORT = 'support',
  SALES = 'sales',
  VIEWER = 'viewer',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
}

export enum UserDepartment {
  SALES = 'sales',
  SUPPORT = 'support',
  FINANCE = 'finance',
  OPERATIONS = 'operations',
  MANAGEMENT = 'management',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true, length: 500 })
  avatar?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VIEWER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Column({
    type: 'enum',
    enum: UserDepartment,
    nullable: true,
  })
  department?: UserDepartment;

  @Column({ nullable: true, length: 20 })
  phone?: string;

  @Column({ nullable: true })
  lastLogin?: Date;

  @Column({ nullable: true, length: 36 })
  createdBy?: string;

  @Column({ nullable: true, length: 255 })
  resetPasswordToken?: string;

  @Column({ nullable: true })
  resetPasswordExpiresAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

