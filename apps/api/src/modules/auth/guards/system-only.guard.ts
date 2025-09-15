import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class SystemOnlyGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('jwt.secret'),
      });

      // Verificar se é usuário do sistema (não tem clientId)
      if (payload.clientId) {
        throw new ForbiddenException('Acesso restrito a usuários do sistema');
      }

      // Buscar usuário do sistema
      const user = await this.usersService.findOne(payload.sub);

      if (!user || user.status !== 'active') {
        throw new UnauthorizedException('Usuário não encontrado ou inativo');
      }

      // Adicionar usuário à requisição
      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token inválido');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
