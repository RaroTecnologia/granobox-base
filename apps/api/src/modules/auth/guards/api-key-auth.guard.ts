import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device, DeviceStatus } from '../../devices/entities/device.entity';

/**
 * Guard para autenticar dispositivos IoT via API Key (Bearer token)
 * 
 * Uso:
 * @UseGuards(ApiKeyAuthGuard)
 * 
 * Header esperado:
 * Authorization: Bearer dot_8813BF02_...
 */
@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    console.log('🔑 ApiKeyAuthGuard - Authorization header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Header Authorization inválido ou ausente');
      throw new UnauthorizedException('API Key não fornecida');
    }

    const apiKey = authHeader.substring(7); // Remove "Bearer "
    console.log('🔍 Validando API Key:', apiKey);

    // Buscar device pela API Key
    console.log('🔍 Buscando device no banco...');
    const device = await this.deviceRepository.findOne({
      where: { apiKey },
      relations: ['user'],
    });

    console.log('🔍 Device encontrado?', !!device);
    if (device) {
      console.log('📱 Device ID:', device.deviceId);
      console.log('📱 Device status:', device.status);
    }

    if (!device) {
      console.log('❌ API Key inválida - device não encontrado');
      console.log('❌ API Key buscada:', apiKey);
      throw new UnauthorizedException('API Key inválida');
    }

    if (device.status !== DeviceStatus.ACTIVE) {
      console.log('❌ Device inativo ou suspenso');
      throw new UnauthorizedException('Device está inativo');
    }

    console.log('✅ Device autenticado:', device.deviceId);

    // Atualizar último acesso
    await this.deviceRepository.update(device.id, {
      lastSeenAt: new Date(),
      lastIpAddress: request.ip,
      userAgent: request.get('User-Agent'),
    });

    // Adicionar device ao request para usar nos controllers
    request.device = device;
    request.user = device.user; // Compatibilidade com JWT

    return true;
  }
}

