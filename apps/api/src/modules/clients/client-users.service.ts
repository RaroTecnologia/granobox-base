import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientUser, ClientUserStatus, ClientUserRole } from './entities/client-user.entity';
import { Client } from './entities/client.entity';
import { SendInviteDto } from './dto/send-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { CreateClientUserDto } from './dto/create-client-user.dto';
import { EmailService } from '../../email/email.service';
import { LoginDto } from '../auth/dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClientUsersService {
  constructor(
    @InjectRepository(ClientUser)
    private clientUserRepository: Repository<ClientUser>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    private emailService: EmailService,
    private jwtService: JwtService,
  ) {}

  async sendInvite(clientId: string, inviteData: SendInviteDto): Promise<{ message: string; inviteToken: string }> {
    // Verificar se o cliente existe
    const client = await this.clientRepository.findOne({ where: { id: clientId } });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Verificar se já existe um usuário com este email
    const existingUser = await this.clientUserRepository.findOne({
      where: { email: inviteData.email }
    });

    if (existingUser) {
      throw new BadRequestException('Já existe um usuário com este email');
    }

    // Gerar token de convite
    const inviteToken = randomBytes(32).toString('hex');
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7); // 7 dias para expirar

    // Criar usuário com status PENDING
    const clientUser = this.clientUserRepository.create({
      clientId,
      name: inviteData.name,
      email: inviteData.email,
      role: ClientUserRole.ADMIN, // Primeiro usuário sempre é admin
      status: ClientUserStatus.PENDING,
      inviteToken,
      inviteExpiresAt,
    });

    await this.clientUserRepository.save(clientUser);

    // Enviar email com o convite
    try {
      await this.emailService.sendInviteEmail({
        to: inviteData.email,
        clientName: client.businessName || client.fullName || 'Cliente',
        inviteToken,
        message: inviteData.message,
      });
    } catch (error) {
      console.error('Erro ao enviar email de convite:', error);
      // Não falhar o processo se o email não for enviado
    }

    return {
      message: 'Convite enviado com sucesso',
      inviteToken, // Em produção, não retornar o token
    };
  }

  async acceptInvite(acceptData: AcceptInviteDto): Promise<{ message: string; user: ClientUser }> {
    const user = await this.clientUserRepository.findOne({
      where: { inviteToken: acceptData.token },
      relations: ['client'],
    });

    if (!user) {
      throw new NotFoundException('Convite não encontrado');
    }

    if (!user.canAcceptInvite()) {
      throw new BadRequestException('Convite expirado ou inválido');
    }

    // Definir senha e ativar usuário
    user.password = acceptData.password;
    await user.hashPassword();
    user.status = ClientUserStatus.ACTIVE;
    user.inviteToken = undefined;
    user.inviteExpiresAt = undefined;

    await this.clientUserRepository.save(user);

    return {
      message: 'Convite aceito com sucesso',
      user,
    };
  }

  async getClientUsers(clientId: string): Promise<ClientUser[]> {
    return this.clientUserRepository.find({
      where: { clientId },
      select: ['id', 'name', 'email', 'role', 'status', 'lastLoginAt', 'createdAt'],
    });
  }

  async createClientUser(clientId: string, createData: CreateClientUserDto): Promise<ClientUser> {
    // Verificar se o cliente existe
    const client = await this.clientRepository.findOne({ where: { id: clientId } });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Verificar se já existe um usuário com este email
    const existingUser = await this.clientUserRepository.findOne({
      where: { email: createData.email }
    });

    if (existingUser) {
      throw new BadRequestException('Já existe um usuário com este email');
    }

    const clientUser = this.clientUserRepository.create({
      clientId,
      ...createData,
      status: ClientUserStatus.ACTIVE,
    });

    await clientUser.hashPassword();
    return this.clientUserRepository.save(clientUser);
  }

  async findUserByEmail(email: string): Promise<ClientUser | null> {
    return this.clientUserRepository.findOne({
      where: { email },
      relations: ['client'],
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.clientUserRepository.update(userId, {
      lastLoginAt: new Date(),
    });
  }

  async deactivateUser(userId: string): Promise<void> {
    await this.clientUserRepository.update(userId, {
      isActive: false,
    });
  }

  async activateUser(userId: string): Promise<void> {
    await this.clientUserRepository.update(userId, {
      isActive: true,
    });
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: any }> {
    const user = await this.clientUserRepository.findOne({
      where: { email: loginDto.email },
      relations: ['client'],
    });

    if (!user) {
      throw new BadRequestException('Credenciais inválidas');
    }

    if (user.status !== ClientUserStatus.ACTIVE) {
      throw new BadRequestException('Usuário não está ativo');
    }

    // Verificar senha
    if (!user.password) {
      throw new BadRequestException('Credenciais inválidas');
    }
    
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Credenciais inválidas');
    }

    // Atualizar último login
    user.lastLoginAt = new Date();
    await this.clientUserRepository.save(user);

    // Gerar JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
    };

    const accessToken = this.jwtService.sign(payload);

    // Remover senha do retorno
    const { password, ...userWithoutPassword } = user;

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        clientId: user.clientId,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
