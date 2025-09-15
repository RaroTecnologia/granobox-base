import { Injectable } from '@nestjs/common';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
import { UpdatePrinterConfigDto } from './dto/update-printer-config.dto';
import { UpdateNotificationConfigDto } from './dto/update-notification-config.dto';

@Injectable()
export class ConfigService {
  // Configurações mock por enquanto
  private systemConfig = {
    id: '1',
    businessName: 'Granobox Tag',
    cnpj: '12.345.678/0001-90',
    address: 'Rua das Etiquetas, 123',
    phone: '(11) 99999-9999',
    email: 'contato@granoboxtag.com.br',
    logoColorida: null as string | null,
    logoMonocromatica: null as string | null,
  };

  private printerConfig = {
    id: '1',
    name: 'Impressora Principal',
    ip: '192.168.1.100',
    port: '9100',
    model: 'Zebra ZT230',
    isActive: true,
  };

  private notificationConfig = {
    email: true,
    push: true,
    sound: false,
    expirationDays: 7,
  };

  getSystemConfig() {
    return this.systemConfig;
  }

  updateSystemConfig(updateSystemConfigDto: UpdateSystemConfigDto) {
    this.systemConfig = { ...this.systemConfig, ...updateSystemConfigDto };
    return this.systemConfig;
  }

  getPrinterConfig() {
    return this.printerConfig;
  }

  updatePrinterConfig(updatePrinterConfigDto: UpdatePrinterConfigDto) {
    this.printerConfig = { ...this.printerConfig, ...updatePrinterConfigDto };
    return this.printerConfig;
  }

  testPrinter() {
    // Simular teste da impressora
    return { message: 'Impressora funcionando perfeitamente!' };
  }

  getNotificationConfig() {
    return this.notificationConfig;
  }

  updateNotificationConfig(updateNotificationConfigDto: UpdateNotificationConfigDto) {
    this.notificationConfig = { ...this.notificationConfig, ...updateNotificationConfigDto };
    return this.notificationConfig;
  }

  uploadLogo(file: Express.Multer.File, type: 'colorida' | 'monocromatica') {
    // Simular upload de logo
    const logoUrl = `https://example.com/logos/${type}-${Date.now()}.${file.originalname.split('.').pop()}`;
    
    if (type === 'colorida') {
      this.systemConfig.logoColorida = logoUrl;
    } else {
      this.systemConfig.logoMonocromatica = logoUrl;
    }

    return { url: logoUrl };
  }
}

