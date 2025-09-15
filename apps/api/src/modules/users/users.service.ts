import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmailService } from '../../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar se o email já existe
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'name', 'role', 'status'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Se está alterando o email, verificar se não existe outro usuário com esse email
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email já está em uso');
      }
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    
    // Não permitir excluir administradores
    if (user.role === UserRole.ADMIN) {
      throw new ConflictException('Não é possível excluir um administrador');
    }

    await this.usersRepository.remove(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      lastLogin: new Date(),
    });
  }

  async toggleStatus(id: string): Promise<User> {
    const user = await this.findOne(id);
    
    // Não permitir desativar administradores
    if (user.role === UserRole.ADMIN && user.status === UserStatus.ACTIVE) {
      throw new ConflictException('Não é possível desativar um administrador');
    }

    const newStatus = user.status === UserStatus.ACTIVE 
      ? UserStatus.INACTIVE 
      : UserStatus.ACTIVE;

    user.status = newStatus;
    return this.usersRepository.save(user);
  }

  async resetPassword(id: string): Promise<{ message: string }> {
    const user = await this.findOne(id);

    // Gerar nova senha aleatória
    const newPassword = this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha no banco
    await this.usersRepository.update(id, {
      password: hashedPassword,
    });

    // Enviar email com nova senha
    try {
      await this.emailService.sendNewPasswordEmail({
        to: user.email,
        userName: user.name,
        newPassword,
      });
    } catch (error) {
      console.error('Erro ao enviar email de reset de senha:', error);
      throw new Error('Senha foi resetada, mas houve erro ao enviar o email');
    }

    return {
      message: 'Senha resetada com sucesso. Email enviado com a nova senha.',
    };
  }

  async getProfile(): Promise<User> {
    // Por enquanto, vamos retornar o primeiro usuário como exemplo
    // Em uma implementação real, isso viria do token JWT
    const user = await this.usersRepository.findOne({
      where: { email: 'tiagolevorato@treslados.group' },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async updateProfile(updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.getProfile();

    // Se está alterando o email, verificar se não existe outro usuário com esse email
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email já está em uso');
      }
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.getProfile();

    // Verificar se a senha atual está correta
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha no banco
    await this.usersRepository.update(user.id, {
      password: hashedNewPassword,
    });

    return {
      message: 'Senha alterada com sucesso',
    };
  }

  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Garantir pelo menos um caractere de cada tipo
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Maiúscula
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Minúscula
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Número
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Símbolo
    
    // Preencher o resto aleatoriamente
    for (let i = 4; i < 12; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Embaralhar a senha
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

