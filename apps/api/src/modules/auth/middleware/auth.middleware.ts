import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ClientUser, ClientUserStatus } from '../../clients/entities/client-user.entity';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ClientUser)
    private clientUserRepository: Repository<ClientUser>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Endpoints que não precisam de autenticação
    const publicEndpoints = ['/auth/login', '/auth/forgot-password', '/auth/reset-password', '/health'];
    
    if (publicEndpoints.includes(req.path)) {
      return next();
    }

    // Verificar se é endpoint de usuários (só sistema)
    if (req.path.startsWith('/users')) {
      const token = this.extractTokenFromHeader(req);
      
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
        const user = await this.userRepository.findOne({
          where: { id: payload.sub },
        });

        if (!user || user.status !== 'active') {
          throw new UnauthorizedException('Usuário não encontrado ou inativo');
        }

        req.user = user;
        next();
      } catch (error) {
        throw new UnauthorizedException('Token inválido');
      }
    } else {
      // Para outros endpoints, permitir ambos os tipos
      next();
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
