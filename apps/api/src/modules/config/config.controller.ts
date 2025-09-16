import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { ConfigService } from './config.service';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
import { UpdatePrinterConfigDto } from './dto/update-printer-config.dto';
import { UpdateNotificationConfigDto } from './dto/update-notification-config.dto';

@ApiTags('Config')
@ApiBearerAuth()
@Controller('system')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('config')
  @ApiOperation({ summary: 'Obter configurações do sistema' })
  @ApiResponse({
    status: 200,
    description: 'Configurações do sistema',
  })
  getSystemConfig() {
    return this.configService.getSystemConfig();
  }

  @Patch('config')
  @ApiOperation({ summary: 'Atualizar configurações do sistema' })
  @ApiResponse({
    status: 200,
    description: 'Configurações atualizadas com sucesso',
  })
  updateSystemConfig(@Body() updateSystemConfigDto: UpdateSystemConfigDto) {
    return this.configService.updateSystemConfig(updateSystemConfigDto);
  }

  @Post('upload-logo')
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de logo' })
  @ApiResponse({
    status: 200,
    description: 'Logo carregada com sucesso',
  })
  uploadLogo(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: 'colorida' | 'monocromatica',
  ) {
    return this.configService.uploadLogo(file, type);
  }
}

@Controller('printer')
export class PrinterController {
  constructor(private readonly configService: ConfigService) {}

  @Get('config')
  @ApiOperation({ summary: 'Obter configurações da impressora' })
  @ApiResponse({
    status: 200,
    description: 'Configurações da impressora',
  })
  getPrinterConfig() {
    return this.configService.getPrinterConfig();
  }

  @Patch('config')
  @ApiOperation({ summary: 'Atualizar configurações da impressora' })
  @ApiResponse({
    status: 200,
    description: 'Configurações da impressora atualizadas com sucesso',
  })
  updatePrinterConfig(@Body() updatePrinterConfigDto: UpdatePrinterConfigDto) {
    return this.configService.updatePrinterConfig(updatePrinterConfigDto);
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Testar impressora' })
  @ApiResponse({
    status: 200,
    description: 'Teste da impressora realizado',
  })
  testPrinter() {
    return this.configService.testPrinter();
  }
}

@Controller('notifications')
export class NotificationController {
  constructor(private readonly configService: ConfigService) {}

  @Get('config')
  @ApiOperation({ summary: 'Obter configurações de notificação' })
  @ApiResponse({
    status: 200,
    description: 'Configurações de notificação',
  })
  getNotificationConfig() {
    return this.configService.getNotificationConfig();
  }

  @Patch('config')
  @ApiOperation({ summary: 'Atualizar configurações de notificação' })
  @ApiResponse({
    status: 200,
    description: 'Configurações de notificação atualizadas com sucesso',
  })
  updateNotificationConfig(@Body() updateNotificationConfigDto: UpdateNotificationConfigDto) {
    return this.configService.updateNotificationConfig(updateNotificationConfigDto);
  }
}





