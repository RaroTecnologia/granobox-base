import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientUsersService } from './client-users.service';
import { SendInviteDto } from './dto/send-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { CreateClientUserDto } from './dto/create-client-user.dto';
import { UpdateClientUserDto } from './dto/update-client-user.dto';
import { ClientUser } from './entities/client-user.entity';
import { LoginDto } from '../auth/dto/login.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Client Users')
@Controller('clients')
export class ClientUsersController {
  constructor(private readonly clientUsersService: ClientUsersService) {}

  @Post(':id/invite')
  @ApiOperation({ summary: 'Enviar convite para usuário master do cliente' })
  @ApiParam({ name: 'id', description: 'ID do cliente' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sendInvite(
    @Param('id') clientId: string,
    @Body() inviteData: SendInviteDto,
  ) {
    return this.clientUsersService.sendInvite(clientId, inviteData);
  }

  @Post(':id/resend-invite')
  @ApiOperation({ summary: 'Reenviar convite para um usuário pendente' })
  @ApiParam({ name: 'id', description: 'ID do cliente' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async resendInvite(
    @Param('id') clientId: string,
    @Body() body: { email: string },
  ) {
    return this.clientUsersService.resendInvite(clientId, body.email);
  }

  @Post('accept-invite')
  @ApiOperation({ summary: 'Aceitar convite e definir senha' })
  @ApiResponse({ status: 200, description: 'Convite aceito com sucesso' })
  @ApiResponse({ status: 400, description: 'Convite inválido ou expirado' })
  @ApiResponse({ status: 404, description: 'Convite não encontrado' })
  @HttpCode(HttpStatus.OK)
  async acceptInvite(@Body() acceptData: AcceptInviteDto) {
    return this.clientUsersService.acceptInvite(acceptData);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login de usuário cliente' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  @HttpCode(HttpStatus.OK)
  async clientLogin(@Body() loginData: LoginDto) {
    return this.clientUsersService.login(loginData);
  }

  @Get('all-users')
  @ApiOperation({ summary: 'Listar TODOS os usuários de clientes (apenas usuários do sistema)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getAllClientUsers(@CurrentUser() user: User): Promise<any[]> {
    console.log('👥 GET /clients/all-users');
    console.log('   user.email:', user['email']);
    console.log('   user.role:', user['role']);
    console.log('   user.clientId:', user['clientId']);
    
    // Usuários do SISTEMA (sem clientId) podem listar TODOS
    if (!user['clientId']) {
      console.log('🔓 Usuário do SISTEMA - listando TODOS os client_users');
      return this.clientUsersService.getAllClientUsers();
    } else {
      // ClientUser vê apenas do seu cliente
      console.log('🔒 Cliente - listando apenas do seu clientId:', user['clientId']);
      return this.clientUsersService.getClientUsers(user['clientId']);
    }
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Listar usuários do cliente' })
  @ApiParam({ name: 'id', description: 'ID do cliente' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getClientUsers(@Param('id') clientId: string): Promise<ClientUser[]> {
    return this.clientUsersService.getClientUsers(clientId);
  }

  @Post(':id/users')
  @ApiOperation({ summary: 'Criar novo usuário para o cliente' })
  @ApiParam({ name: 'id', description: 'ID do cliente' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createClientUser(
    @Param('id') clientId: string,
    @Body() createData: CreateClientUserDto,
  ): Promise<ClientUser> {
    return this.clientUsersService.createClientUser(clientId, createData);
  }

  @Patch(':id/users/:userId')
  @ApiOperation({ summary: 'Atualizar usuário do cliente' })
  @ApiParam({ name: 'id', description: 'ID do cliente' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updateClientUser(
    @Param('id') clientId: string,
    @Param('userId') userId: string,
    @Body() updateData: UpdateClientUserDto,
  ): Promise<ClientUser> {
    return this.clientUsersService.updateClientUser(clientId, userId, updateData);
  }

  @Delete(':id/users/:userId')
  @ApiOperation({ summary: 'Remover usuário do cliente' })
  @ApiParam({ name: 'id', description: 'ID do cliente' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeClientUser(
    @Param('id') clientId: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    return this.clientUsersService.removeClientUser(clientId, userId);
  }

  @Patch(':id/users/:userId/activate')
  @ApiOperation({ summary: 'Ativar usuário do cliente' })
  @ApiParam({ name: 'id', description: 'ID do cliente' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async activateClientUser(
    @Param('id') clientId: string,
    @Param('userId') userId: string,
  ): Promise<{ message: string }> {
    await this.clientUsersService.activateUser(userId);
    return { message: 'Usuário ativado com sucesso' };
  }

  @Patch(':id/users/:userId/deactivate')
  @ApiOperation({ summary: 'Inativar usuário do cliente' })
  @ApiParam({ name: 'id', description: 'ID do cliente' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deactivateClientUser(
    @Param('id') clientId: string,
    @Param('userId') userId: string,
  ): Promise<{ message: string }> {
    await this.clientUsersService.deactivateUser(userId);
    return { message: 'Usuário inativado com sucesso' };
  }
}