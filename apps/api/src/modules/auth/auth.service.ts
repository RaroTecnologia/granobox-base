import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { UsersService } from '../users/users.service';
import { User, UserStatus } from '../users/entities/user.entity';
import { ClientUser, ClientUserStatus } from '../clients/entities/client-user.entity';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../../email/email.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  clientId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: string;
    status: string;
    department?: string;
    phone?: string;
    lastLogin?: Date;
    createdBy?: string;
    clientId?: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private auditService: AuditService,
    private emailService: EmailService,
    @InjectRepository(ClientUser)
    private clientUserRepository: Repository<ClientUser>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    // Primeiro, tentar login como usuário do sistema
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (user) {
      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Usuário não está ativo');
      }

      // Atualizar último login
      await this.usersService.updateLastLogin(user.id);

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const access_token = this.jwtService.sign(payload);

      // Log de auditoria para usuário do sistema
      this.auditService.logLogin(user.id, user.email, 'system', undefined, ipAddress, userAgent);

      // Remover senha do retorno
      const { password, ...userWithoutPassword } = user;

      return {
        access_token,
        user: userWithoutPassword,
      };
    }

    // Se não encontrou usuário do sistema, tentar como usuário cliente
    const clientUser = await this.clientUserRepository.findOne({
      where: { email: loginDto.email },
      relations: ['client'],
    });

    if (!clientUser) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (clientUser.status !== ClientUserStatus.ACTIVE) {
      throw new UnauthorizedException('Usuário não está ativo');
    }

    // Verificar senha
    if (!clientUser.password) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    
    const isPasswordValid = await bcrypt.compare(loginDto.password, clientUser.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Atualizar último login
    clientUser.lastLoginAt = new Date();
    await this.clientUserRepository.save(clientUser);

    // Gerar JWT
    const payload = {
      sub: clientUser.id,
      email: clientUser.email,
      role: clientUser.role,
      clientId: clientUser.clientId,
    };

    const access_token = this.jwtService.sign(payload);

    // Log de auditoria para usuário cliente
    this.auditService.logLogin(clientUser.id, clientUser.email, 'client', clientUser.clientId, ipAddress, userAgent);

    // Remover senha do retorno
    const { password, ...userWithoutPassword } = clientUser;

    return {
      access_token,
      user: {
        id: clientUser.id,
        email: clientUser.email,
        name: clientUser.name,
        role: clientUser.role,
        clientId: clientUser.clientId,
        status: clientUser.status,
        lastLogin: clientUser.lastLoginAt,
        createdAt: clientUser.createdAt,
        updatedAt: clientUser.updatedAt,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    
    if (user && await user.validatePassword(password)) {
      return user;
    }
    
    return null;
  }

  async validateJwtPayload(payload: JwtPayload): Promise<any> {
    // Se tem clientId, é usuário cliente
    if (payload.clientId) {
      const clientUser = await this.clientUserRepository.findOne({
        where: { id: payload.sub },
        relations: ['client'],
      });
      
      if (clientUser && clientUser.status === ClientUserStatus.ACTIVE) {
        return {
          id: clientUser.id,
          email: clientUser.email,
          name: clientUser.name,
          role: clientUser.role,
          clientId: clientUser.clientId,
          status: clientUser.status,
          lastLogin: clientUser.lastLoginAt,
          createdAt: clientUser.createdAt,
          updatedAt: clientUser.updatedAt,
        };
      }
    } else {
      // Usuário do sistema
      const user = await this.usersService.findOne(payload.sub);
      
      if (user && user.status === UserStatus.ACTIVE) {
        return user;
      }
    }
    
    return null;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    // Primeiro, tentar encontrar como usuário do sistema
    const systemUser = await this.userRepository.findOne({ where: { email } });
    
    if (systemUser) {
      // Gerar token de reset
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Expira em 1 hora

      // Salvar token no usuário do sistema
      systemUser.resetPasswordToken = resetToken;
      systemUser.resetPasswordExpiresAt = resetTokenExpiry;
      await this.userRepository.save(systemUser);

      // Enviar email
      try {
        await this.emailService.sendPasswordResetEmail(
          email,
          systemUser.name,
          resetToken
        );
      } catch (error) {
        console.error('Erro ao enviar email de recuperação:', error);
        // Não falhar se o email não for enviado
      }

      return { message: 'Se o email existir, você receberá instruções para redefinir sua senha.' };
    }

    // Se não encontrou usuário do sistema, tentar como usuário cliente
    const clientUser = await this.clientUserRepository.findOne({ 
      where: { email },
      relations: ['client']
    });

    if (clientUser) {
      // Gerar token de reset
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Expira em 1 hora

      // Salvar token no usuário cliente
      clientUser.resetPasswordToken = resetToken;
      clientUser.resetPasswordExpiresAt = resetTokenExpiry;
      await this.clientUserRepository.save(clientUser);

      // Enviar email
      try {
        await this.emailService.sendPasswordResetEmail(
          email,
          clientUser.name,
          resetToken
        );
      } catch (error) {
        console.error('Erro ao enviar email de recuperação:', error);
        // Não falhar se o email não for enviado
      }

      return { message: 'Se o email existir, você receberá instruções para redefinir sua senha.' };
    }

    // Se não encontrou nenhum usuário, retornar sucesso (por segurança)
    return { message: 'Se o email existir, você receberá instruções para redefinir sua senha.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword, confirmPassword } = resetPasswordDto;

    // Validar se as senhas coincidem
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('As senhas não coincidem');
    }

    // Buscar usuário do sistema pelo token
    const systemUser = await this.userRepository.findOne({
      where: {
        resetPasswordToken: token,
      },
    });

    if (systemUser) {
      // Verificar se o token não expirou
      if (!systemUser.resetPasswordExpiresAt || systemUser.resetPasswordExpiresAt < new Date()) {
        throw new BadRequestException('Token inválido ou expirado');
      }

      // Atualizar senha e limpar token (o hash será feito automaticamente pela entidade)
      systemUser.password = newPassword;
      systemUser.resetPasswordToken = undefined;
      systemUser.resetPasswordExpiresAt = undefined;

      await this.userRepository.save(systemUser);
      return { message: 'Senha redefinida com sucesso' };
    }

    // Se não encontrou usuário do sistema, buscar como usuário cliente
    const clientUser = await this.clientUserRepository.findOne({
      where: {
        resetPasswordToken: token,
      },
    });

    if (clientUser) {
      // Verificar se o token não expirou
      if (!clientUser.resetPasswordExpiresAt || clientUser.resetPasswordExpiresAt < new Date()) {
        throw new BadRequestException('Token inválido ou expirado');
      }

      // Hash da nova senha (ClientUser não faz hash automático)
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Atualizar senha e limpar token
      clientUser.password = hashedPassword;
      clientUser.resetPasswordToken = undefined;
      clientUser.resetPasswordExpiresAt = undefined;

      await this.clientUserRepository.save(clientUser);
      return { message: 'Senha redefinida com sucesso' };
    }

    throw new BadRequestException('Token inválido ou expirado');
  }
}

