import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FirmwareVersion, FirmwareType, FirmwareStatus } from './entities/firmware-version.entity';
import { DeviceVersion } from './entities/device-version.entity';

export interface VersionCheckResult {
  deviceId: string;
  currentVersion: string;
  latestVersion: string;
  needsUpdate: boolean;
  updateAvailable?: FirmwareVersion;
  lastCheck: Date;
}

export interface FleetVersionSummary {
  totalDevices: number;
  upToDate: number;
  needsUpdate: number;
  versions: Array<{
    version: string;
    count: number;
    percentage: number;
  }>;
}

@Injectable()
export class FirmwareService {
  private readonly logger = new Logger(FirmwareService.name);

  constructor(
    @InjectRepository(FirmwareVersion)
    private firmwareVersionRepository: Repository<FirmwareVersion>,
    @InjectRepository(DeviceVersion)
    private deviceVersionRepository: Repository<DeviceVersion>,
  ) {}

  // === GERENCIAMENTO DE VERSÕES DE FIRMWARE ===

  async createFirmwareVersion(data: {
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
    this.logger.log(`📦 Criando nova versão de firmware: ${data.type} v${data.version}`);

    // Desmarcar versão anterior como latest se esta for stable
    if (data.status === FirmwareStatus.STABLE) {
      await this.firmwareVersionRepository.update(
        { type: data.type, isLatest: true },
        { isLatest: false }
      );
    }

    const firmwareVersion = this.firmwareVersionRepository.create({
      ...data,
      isLatest: data.status === FirmwareStatus.STABLE,
    });

    return await this.firmwareVersionRepository.save(firmwareVersion);
  }

  async getLatestFirmwareVersion(type: FirmwareType): Promise<FirmwareVersion | null> {
    return await this.firmwareVersionRepository.findOne({
      where: {
        type,
        status: FirmwareStatus.STABLE,
        isActive: true,
        isLatest: true,
      },
    });
  }

  async getAllFirmwareVersions(type?: FirmwareType): Promise<FirmwareVersion[]> {
    const where: any = { isActive: true };
    if (type) {
      where.type = type;
    }

    return await this.firmwareVersionRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  // === GERENCIAMENTO DE VERSÕES DOS DISPOSITIVOS ===

  async updateDeviceVersion(
    deviceId: string,
    clientId: string,
    versionInfo: {
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
    this.logger.debug(`🔄 Atualizando versão do dispositivo ${deviceId}: v${versionInfo.currentVersion}`);

    let deviceVersion = await this.deviceVersionRepository.findOne({
      where: { deviceId },
    });

    if (!deviceVersion) {
      deviceVersion = this.deviceVersionRepository.create({
        deviceId,
        clientId,
        ...versionInfo,
        lastVersionCheck: new Date(),
      });
    } else {
      Object.assign(deviceVersion, {
        ...versionInfo,
        lastVersionCheck: new Date(),
      });
    }

    return await this.deviceVersionRepository.save(deviceVersion);
  }

  async checkForUpdates(deviceId: string): Promise<VersionCheckResult> {
    const deviceVersion = await this.deviceVersionRepository.findOne({
      where: { deviceId },
    });

    if (!deviceVersion) {
      throw new Error(`Dispositivo ${deviceId} não encontrado no registro de versões`);
    }

    // Assumir que é Edge-Go-WS baseado no contexto
    const latestFirmware = await this.getLatestFirmwareVersion(FirmwareType.EDGE_GO_WS);
    
    if (!latestFirmware) {
      throw new Error('Nenhuma versão estável de firmware encontrada');
    }

    const needsUpdate = deviceVersion.needsUpdate(latestFirmware.version);

    // Atualizar timestamp da última verificação
    deviceVersion.lastVersionCheck = new Date();
    await this.deviceVersionRepository.save(deviceVersion);

    return {
      deviceId,
      currentVersion: deviceVersion.currentVersion,
      latestVersion: latestFirmware.version,
      needsUpdate,
      updateAvailable: needsUpdate ? latestFirmware : undefined,
      lastCheck: new Date(),
    };
  }

  async getDeviceVersion(deviceId: string): Promise<DeviceVersion | null> {
    return await this.deviceVersionRepository.findOne({
      where: { deviceId },
      relations: ['firmwareVersion'],
    });
  }

  async getFleetVersionSummary(clientId?: string): Promise<FleetVersionSummary> {
    const where: any = {};
    if (clientId) {
      where.clientId = clientId;
    }

    const devices = await this.deviceVersionRepository.find({ where });
    const totalDevices = devices.length;

    if (totalDevices === 0) {
      return {
        totalDevices: 0,
        upToDate: 0,
        needsUpdate: 0,
        versions: [],
      };
    }

    const latestFirmware = await this.getLatestFirmwareVersion(FirmwareType.EDGE_GO_WS);
    const latestVersion = latestFirmware?.version || '0.0.0';

    let upToDate = 0;
    let needsUpdate = 0;
    const versionCounts: Record<string, number> = {};

    for (const device of devices) {
      const version = device.currentVersion;
      versionCounts[version] = (versionCounts[version] || 0) + 1;

      if (device.needsUpdate(latestVersion)) {
        needsUpdate++;
      } else {
        upToDate++;
      }
    }

    const versions = Object.entries(versionCounts)
      .map(([version, count]) => ({
        version,
        count,
        percentage: Math.round((count / totalDevices) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalDevices,
      upToDate,
      needsUpdate,
      versions,
    };
  }

  // === UTILITÁRIOS ===

  async markUpdateAttempt(
    deviceId: string,
    targetVersion: string,
    status: 'in_progress' | 'success' | 'failed',
    error?: string
  ): Promise<void> {
    const deviceVersion = await this.deviceVersionRepository.findOne({
      where: { deviceId },
    });

    if (deviceVersion) {
      deviceVersion.targetVersion = targetVersion;
      deviceVersion.lastUpdateAttempt = new Date();
      deviceVersion.lastUpdateStatus = status;
      deviceVersion.lastUpdateError = error || null;

      // Se sucesso, atualizar versão atual
      if (status === 'success') {
        deviceVersion.currentVersion = targetVersion;
        deviceVersion.targetVersion = null;
      }

      await this.deviceVersionRepository.save(deviceVersion);
    }
  }

  async getDevicesNeedingUpdate(clientId?: string): Promise<DeviceVersion[]> {
    const latestFirmware = await this.getLatestFirmwareVersion(FirmwareType.EDGE_GO_WS);
    if (!latestFirmware) {
      return [];
    }

    const where: any = {};
    if (clientId) {
      where.clientId = clientId;
    }

    const devices = await this.deviceVersionRepository.find({ where });
    
    return devices.filter(device => 
      device.needsUpdate(latestFirmware.version)
    );
  }
}
