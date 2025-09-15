import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientUsersService } from './client-users.service';
import { SendInviteDto } from './dto/send-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { CreateClientUserDto } from './dto/create-client-user.dto';
import { ClientUser } from './entities/client-user.entity';
import { LoginDto } from '../auth/dto/login.dto';

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
}
