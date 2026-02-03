import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ClientUser,
  ClientUserStatus,
  ClientUserRole,
} from './entities/client-user.entity';
import { ClientUserOperation } from './entities/client-user-operation.entity';
import { Client } from './entities/client.entity';
import { SendInviteDto } from './dto/send-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { CreateClientUserDto } from './dto/create-client-user.dto';
import { UpdateClientUserDto } from './dto/update-client-user.dto';
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
    @InjectRepository(ClientUserOperation)
    private clientUserOperationsRepository: Repository<ClientUserOperation>,
    private emailService: EmailService,
    private jwtService: JwtService,
  ) {}

  async sendInvite(
    clientId: string,
    inviteData: SendInviteDto,
  ): Promise<{ message: string; inviteToken: string }> {
    // Verificar se o cliente existe
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Verificar se já existe um usuário com este email
    const existingUser = await this.clientUserRepository.findOne({
      where: { email: inviteData.email },
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
        inviteExpiresAt,
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

  async resendInvite(
    clientId: string,
    email: string,
  ): Promise<{ message: string; inviteToken: string }> {
    // Verificar cliente
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Encontrar usuário pendente por email
    const user = await this.clientUserRepository.findOne({
      where: { clientId, email },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado para este cliente');
    }

    if (user.status !== ClientUserStatus.PENDING) {
      throw new BadRequestException(
        'Apenas usuários pendentes podem receber reenvio de convite',
      );
    }

    // Gerar novo token e atualizar validade
    const inviteToken = randomBytes(32).toString('hex');
    const inviteExpiresAt = new Date();
    inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7);

    user.inviteToken = inviteToken;
    user.inviteExpiresAt = inviteExpiresAt;
    await this.clientUserRepository.save(user);

    // Enviar email
    try {
      await this.emailService.sendInviteEmail({
        to: email,
        clientName: client.businessName || client.fullName || 'Cliente',
        inviteToken,
        message: undefined,
        inviteExpiresAt,
      });
    } catch (error) {
      console.error('Erro ao reenviar email de convite:', error);
    }

    return { message: 'Convite reenviado com sucesso', inviteToken };
  }
  async acceptInvite(
    acceptData: AcceptInviteDto,
  ): Promise<{ message: string; user: ClientUser }> {
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

  async getAllClientUsers(): Promise<any[]> {
    // Lista TODOS os usuários de TODOS os clientes (apenas para Super Admin)
    const users = await this.clientUserRepository.find({
      relations: ['client'],
      select: [
        'id',
        'clientId',
        'name',
        'email',
        'role',
        'status',
        'isActive',
        'lastLoginAt',
        'createdAt',
        'updatedAt',
      ],
      order: {
        createdAt: 'DESC',
      },
    });
    
    // Adicionar informação do cliente
    return users.map(user => ({
      ...user,
      clientName: user.client?.businessName || user.client?.fullName || 'N/A',
    }));
  }

  async getClientUsers(clientId: string): Promise<ClientUser[]> {
    return this.clientUserRepository.find({
      where: { clientId },
      relations: ['operations', 'operations.operation'],
      select: [
        'id',
        'clientId',
        'name',
        'email',
        'role',
        'status',
        'isActive',
        'lastLoginAt',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async createClientUser(
    clientId: string,
    createData: CreateClientUserDto,
  ): Promise<ClientUser> {
    // Verificar se o cliente existe
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Verificar se já existe um usuário com este email
    const existingUser = await this.clientUserRepository.findOne({
      where: { email: createData.email },
    });

    if (existingUser) {
      throw new BadRequestException('Já existe um usuário com este email');
    }

    // ⭐ ATUALIZADO: Separar operationIds
    const { operationIds, ...userData } = createData;

    const clientUser = this.clientUserRepository.create({
      clientId,
      ...userData,
      status: ClientUserStatus.ACTIVE,
    });

    await clientUser.hashPassword();
    const savedUser = await this.clientUserRepository.save(clientUser);

    // ⭐ NOVO: Se operationIds foi fornecido, criar vínculos
    if (operationIds && operationIds.length > 0) {
      const operations = operationIds.map((operationId) =>
        this.clientUserOperationsRepository.create({
          clientUserId: savedUser.id,
          operationId,
        }),
      );
      await this.clientUserOperationsRepository.save(operations);
    }

    // Retornar usuário com operações
    return this.findUserById(savedUser.id);
  }

  // ⭐ NOVO: Buscar usuário por ID com operações
  async findUserById(userId: string): Promise<ClientUser> {
    const user = await this.clientUserRepository.findOne({
      where: { id: userId },
      relations: ['operations', 'operations.operation'],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  // ⭐ NOVO: Atualizar operações de um usuário
  async updateUserOperations(
    userId: string,
    operationIds: string[],
  ): Promise<ClientUser> {
    // Verificar se usuário existe
    const user = await this.clientUserRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Remover operações antigas
    await this.clientUserOperationsRepository.delete({ clientUserId: userId });

    // Adicionar novas operações
    if (operationIds && operationIds.length > 0) {
      const operations = operationIds.map((operationId) =>
        this.clientUserOperationsRepository.create({
          clientUserId: userId,
          operationId,
        }),
      );
      await this.clientUserOperationsRepository.save(operations);
    }

    return this.findUserById(userId);
  }

  async findUserByEmail(email: string): Promise<ClientUser | null> {
    return this.clientUserRepository.findOne({
      where: { email },
      relations: ['client', 'operations', 'operations.operation'],
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
      relations: ['client', 'operations', 'operations.operation'],
    });

    if (!user) {
      throw new BadRequestException('Credenciais inválidas');
    }

    if (user.status !== ClientUserStatus.ACTIVE) {
      throw new BadRequestException('Usuário não está ativo');
    }

    // Verificar senha (utilizando método da entidade)
    const isPasswordValid = await user.validatePassword(loginDto.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Credenciais inválidas');
    }

    // Atualizar último login
    user.lastLoginAt = new Date();
    await this.clientUserRepository.save(user);

    // ⭐ ATUALIZADO: Incluir operações no payload
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
      operationIds: user.getAllowedOperationIds(), // null = todas, ou array de IDs
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
        operations: user.operations, // ⭐ NOVO: Incluir operações
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  // ⭐ NOVO: Atualizar usuário do cliente
  async updateClientUser(
    clientId: string,
    userId: string,
    updateData: UpdateClientUserDto,
  ): Promise<ClientUser> {
    // Verificar se o usuário existe e pertence ao cliente
    const user = await this.clientUserRepository.findOne({
      where: { id: userId, clientId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado ou não pertence a este cliente');
    }

    // Se email está sendo atualizado, verificar se não está em uso por outro usuário
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.clientUserRepository.findOne({
        where: { email: updateData.email },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Email já está em uso por outro usuário');
      }
    }

    // Atualizar campos básicos
    if (updateData.name !== undefined) user.name = updateData.name;
    if (updateData.email !== undefined) user.email = updateData.email;
    if (updateData.role !== undefined) user.role = updateData.role;
    if (updateData.status !== undefined) user.status = updateData.status;

    // Atualizar senha se fornecida
    if (updateData.password) {
      user.password = updateData.password;
      await user.hashPassword();
    }

    // Salvar alterações
    await this.clientUserRepository.save(user);

    // Se operationIds foi fornecido, atualizar operações
    if (updateData.operationIds !== undefined) {
      await this.updateUserOperations(userId, updateData.operationIds);
    }

    // Retornar usuário atualizado com operações
    return this.findUserById(userId);
  }

  // ⭐ NOVO: Remover usuário do cliente
  async removeClientUser(clientId: string, userId: string): Promise<void> {
    // Verificar se o usuário existe e pertence ao cliente
    const user = await this.clientUserRepository.findOne({
      where: { id: userId, clientId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado ou não pertence a este cliente');
    }

    // Remover operações associadas
    await this.clientUserOperationsRepository.delete({ clientUserId: userId });

    // Remover usuário
    await this.clientUserRepository.remove(user);
  }
}