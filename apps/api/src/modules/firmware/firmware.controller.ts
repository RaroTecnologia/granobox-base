import { Controller, Get, Post, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FirmwareService, VersionCheckResult, FleetVersionSummary } from './firmware.service';
import { FirmwareVersion, FirmwareType, FirmwareStatus } from './entities/firmware-version.entity';
import { DeviceVersion } from './entities/device-version.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Firmware Management')
@Controller('firmware')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FirmwareController {
  private readonly logger = new Logger(FirmwareController.name);

  constructor(private readonly firmwareService: FirmwareService) {}

  // === ENDPOINTS DE VERSÕES DE FIRMWARE ===

  @Post('versions')
  @ApiOperation({ summary: 'Registrar nova versão de firmware' })
  @ApiResponse({ status: 201, description: 'Versão criada com sucesso.' })
  async createFirmwareVersion(@Body() data: {
    version: string;
    type: FirmwareType;
    status?: FirmwareStatus;
    description?: string;
    checksum: string;
    fileSize: number;
    downloadUrl?: string;
    gitCommit?: string;
    gitTag?: string;
    idfVersion?: string;
    chipTarget?: string;
    metadata?: Record<string, any>;
  }): Promise<FirmwareVersion> {
    this.logger.log(`📦 Registrando firmware ${data.type} v${data.version}`);
    return await this.firmwareService.createFirmwareVersion(data);
  }

  @Get('versions')
  @ApiOperation({ summary: 'Listar versões de firmware disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de versões.' })
  async getFirmwareVersions(
    @Query('type') type?: FirmwareType
  ): Promise<FirmwareVersion[]> {
    return await this.firmwareService.getAllFirmwareVersions(type);
  }

  @Get('versions/latest')
  @ApiOperation({ summary: 'Obter versão mais recente de firmware' })
  @ApiResponse({ status: 200, description: 'Versão mais recente.' })
  async getLatestFirmwareVersion(
    @Query('type') type: FirmwareType = FirmwareType.EDGE_GO_WS
  ): Promise<FirmwareVersion | null> {
    return await this.firmwareService.getLatestFirmwareVersion(type);
  }

  // === ENDPOINTS DE VERSÕES DOS DISPOSITIVOS ===

  @Get('devices/:deviceId/version')
  @ApiOperation({ summary: 'Obter versão atual de um dispositivo' })
  @ApiResponse({ status: 200, description: 'Informações de versão do dispositivo.' })
  async getDeviceVersion(
    @Param('deviceId') deviceId: string
  ): Promise<DeviceVersion | null> {
    return await this.firmwareService.getDeviceVersion(deviceId);
  }

  @Post('devices/:deviceId/version')
  @ApiOperation({ summary: 'Atualizar versão reportada por um dispositivo' })
  @ApiResponse({ status: 200, description: 'Versão atualizada com sucesso.' })
  async updateDeviceVersion(
    @Param('deviceId') deviceId: string,
    @Body() versionInfo: {
      clientId: string;
      currentVersion: string;
      compileDate?: string;
      compileTime?: string;
      idfVersion?: string;
      chipModel?: string;
      chipCores?: number;
      chipRevision?: number;
      runningPartition?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<DeviceVersion> {
    this.logger.log(`🔄 Atualizando versão do dispositivo ${deviceId}: v${versionInfo.currentVersion}`);
    return await this.firmwareService.updateDeviceVersion(deviceId, versionInfo.clientId, versionInfo);
  }

  @Get('devices/:deviceId/check-updates')
  @ApiOperation({ summary: 'Verificar se dispositivo precisa de atualização' })
  @ApiResponse({ status: 200, description: 'Resultado da verificação de atualização.' })
  async checkDeviceUpdates(
    @Param('deviceId') deviceId: string
  ): Promise<VersionCheckResult> {
    this.logger.log(`🔍 Verificando atualizações para dispositivo ${deviceId}`);
    return await this.firmwareService.checkForUpdates(deviceId);
  }

  // === ENDPOINTS DE MONITORAMENTO DA FROTA ===

  @Get('fleet/summary')
  @ApiOperation({ summary: 'Resumo das versões da frota de dispositivos' })
  @ApiResponse({ status: 200, description: 'Resumo das versões da frota.' })
  async getFleetVersionSummary(
    @Query('clientId') clientId?: string
  ): Promise<FleetVersionSummary> {
    return await this.firmwareService.getFleetVersionSummary(clientId);
  }

  @Get('fleet/outdated')
  @ApiOperation({ summary: 'Listar dispositivos que precisam de atualização' })
  @ApiResponse({ status: 200, description: 'Lista de dispositivos desatualizados.' })
  async getOutdatedDevices(
    @Query('clientId') clientId?: string
  ): Promise<DeviceVersion[]> {
    return await this.firmwareService.getDevicesNeedingUpdate(clientId);
  }

  // === ENDPOINTS DE CONTROLE DE ATUALIZAÇÕES ===

  @Post('devices/:deviceId/update-attempt')
  @ApiOperation({ summary: 'Registrar tentativa de atualização' })
  @ApiResponse({ status: 200, description: 'Tentativa registrada.' })
  async markUpdateAttempt(
    @Param('deviceId') deviceId: string,
    @Body() data: {
      targetVersion: string;
      status: 'in_progress' | 'success' | 'failed';
      error?: string;
    }
  ): Promise<{ success: boolean }> {
    this.logger.log(`📝 Registrando tentativa de atualização: ${deviceId} -> v${data.targetVersion} (${data.status})`);
    await this.firmwareService.markUpdateAttempt(deviceId, data.targetVersion, data.status, data.error);
    return { success: true };
  }
}
