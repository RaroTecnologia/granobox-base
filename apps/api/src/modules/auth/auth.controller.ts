import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request } from 'express';

import { AuthService, AuthResponse } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fazer login no sistema' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            name: { type: 'string', example: 'João Silva' },
            email: { type: 'string', example: 'joao@granobox.com' },
            role: { type: 'string', example: 'admin' },
            status: { type: 'string', example: 'active' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas ou usuário inativo',
  })
  login(@Body() loginDto: LoginDto, @Req() request: Request): Promise<AuthResponse> {
    const ipAddress = request.ip || request.connection.remoteAddress;
    const userAgent = request.get('User-Agent');
    return this.authService.login(loginDto, ipAddress, userAgent);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar recuperação de senha' })
  @ApiResponse({
    status: 200,
    description: 'Email de recuperação enviado (se o email existir)',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Se o email existir, você receberá instruções para redefinir sua senha.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redefinir senha com token' })
  @ApiResponse({
    status: 200,
    description: 'Senha redefinida com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Senha redefinida com sucesso',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido, expirado ou senhas não coincidem',
  })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
