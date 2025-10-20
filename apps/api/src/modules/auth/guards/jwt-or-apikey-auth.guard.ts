import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device, DeviceStatus } from '../../devices/entities/device.entity';
import { Client } from '../../clients/entities/client.entity';

/**
 * Guard híbrido que aceita JWT OU API Key
 * 
 * - Se tiver JWT válido → passa
 * - Se tiver API Key válida → passa (dot_ ou tgm_)
 * - Se nenhum dos dois → 401
 */
@Injectable()
export class JwtOrApiKeyAuthGuard extends AuthGuard('jwt') {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // Se não tem header, rejeitar
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const token = authHeader.substring(7);

    // ✅ Verificar se é API Key (começa com 'dot_')
    if (token.startsWith('dot_')) {
      console.log('🔑 API Key detectada no guard');
      
      const device = await this.deviceRepository.findOne({
        where: { apiKey: token },
        relations: ['user'],
      });

      if (!device) {
        console.log('❌ API Key inválida');
        throw new UnauthorizedException('API Key inválida');
      }

      if (device.status !== DeviceStatus.ACTIVE) {
        console.log('❌ Device inativo');
        throw new UnauthorizedException('Device inativo');
      }

      console.log('✅ Device autenticado:', device.deviceId);

      // Atualizar último acesso
      await this.deviceRepository.update(device.id, {
        lastSeenAt: new Date(),
        lastIpAddress: request.ip,
        userAgent: request.get('User-Agent'),
      });

      // Adicionar device ao request
      request.device = device;
      request.user = device.user;

      return true;
    }

    // ✅ Se não é API Key, tentar validar como JWT
    console.log('🔐 JWT detectado, validando...');
    return super.canActivate(context) as Promise<boolean>;
  }
}



