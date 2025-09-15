import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionConfig, UserType } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissions = this.reflector.get<PermissionConfig>('permissions', context.getHandler());
    
    if (!permissions) {
      return true; // Se não há permissões definidas, permite acesso
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Verificar tipo de usuário
    const isSystemUser = !user.clientId;
    const isClientUser = !!user.clientId;

    switch (permissions.userType) {
      case UserType.SYSTEM:
        if (!isSystemUser) {
          throw new ForbiddenException('Acesso restrito a usuários do sistema');
        }
        break;
      
      case UserType.CLIENT:
        if (!isClientUser) {
          throw new ForbiddenException('Acesso restrito a usuários cliente');
        }
        break;
      
      case UserType.BOTH:
        // Ambos os tipos podem acessar
        break;
    }

    // Verificar roles específicas
    if (permissions.roles && permissions.roles.length > 0) {
      if (!permissions.roles.includes(user.role)) {
        throw new ForbiddenException('Permissão insuficiente');
      }
    }

    // Verificar se precisa de clientId
    if (permissions.requireClientId) {
      if (!user.clientId) {
        throw new ForbiddenException('ClientId é obrigatório para este recurso');
      }
    }

    return true;
  }
}
