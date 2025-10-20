import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LimitsService } from '../../limits/limits.service';
import { RastreabilidadeFeature } from '../decorators/require-rastreabilidade-feature.decorator';

@Injectable()
export class RastreabilidadeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private limitsService: LimitsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.get<RastreabilidadeFeature>(
      'rastreabilidadeFeature',
      context.getHandler(),
    );

    if (!requiredFeature) {
      return true; // Se não há feature definida, permite acesso
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.clientId) {
      throw new ForbiddenException('ClientId é obrigatório para recursos de rastreabilidade');
    }

    try {
      const limits = await this.limitsService.getClientLimits(user.clientId);
      
      if (!limits[requiredFeature]) {
        const planName = this.getPlanNameForFeature(requiredFeature);
        throw new ForbiddenException(
          `Recurso ${requiredFeature} não está disponível no seu plano atual. ` +
          `Este recurso está disponível no plano ${planName}.`
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Erro ao verificar permissões de rastreabilidade');
    }
  }

  private getPlanNameForFeature(feature: string): string {
    switch (feature) {
      case 'recebimentoQR':
      case 'porcionamento':
      case 'controleTemperatura':
      case 'movimentacaoEstoque':
        return 'Professional';
      case 'rastreabilidadeCompleta':
      case 'relatoriosANVISA':
      case 'integracaoFornecedores':
      case 'hierarquiaEtiquetas':
        return 'Enterprise';
      default:
        return 'Premium';
    }
  }
}
