import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';

@Injectable()
export class GlobalAuthGuard implements CanActivate {
  constructor(
    private jwtAuthGuard: JwtAuthGuard,
    private permissionsGuard: PermissionsGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Primeiro verificar JWT
    const jwtResult = await this.jwtAuthGuard.canActivate(context);
    if (!jwtResult) {
      return false;
    }

    // Depois verificar permissões
    return this.permissionsGuard.canActivate(context);
  }
}
