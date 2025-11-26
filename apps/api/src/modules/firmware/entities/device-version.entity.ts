import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { FirmwareVersion } from './firmware-version.entity';

@Entity('device_versions')
export class DeviceVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  deviceId: string; // ID do dispositivo Edge-Go

  @Column({ type: 'uuid' })
  clientId: string; // ID do cliente

  @Column({ type: 'varchar', length: 20 })
  currentVersion: string; // Versão atual instalada

  @Column({ type: 'varchar', length: 20, nullable: true })
  targetVersion: string; // Versão alvo para atualização

  @Column({ type: 'varchar', length: 50, nullable: true })
  compileDate: string; // Data de compilação reportada pelo device

  @Column({ type: 'varchar', length: 50, nullable: true })
  compileTime: string; // Hora de compilação reportada pelo device

  @Column({ type: 'varchar', length: 20, nullable: true })
  idfVersion: string; // Versão ESP-IDF reportada pelo device

  @Column({ type: 'varchar', length: 20, nullable: true })
  chipModel: string; // Modelo do chip (esp32s3)

  @Column({ type: 'int', nullable: true })
  chipCores: number; // Número de cores do chip

  @Column({ type: 'int', nullable: true })
  chipRevision: number; // Revisão do chip

  @Column({ type: 'varchar', length: 20, nullable: true })
  runningPartition: string; // Partição em execução (ota_0, ota_1)

  @Column({ type: 'timestamp', nullable: true })
  lastVersionCheck: Date; // Última verificação de versão

  @Column({ type: 'timestamp', nullable: true })
  lastUpdateAttempt: Date; // Última tentativa de atualização

  @Column({ type: 'varchar', length: 50, nullable: true })
  lastUpdateStatus: string; // success, failed, in_progress

  @Column({ type: 'text', nullable: true })
  lastUpdateError: string; // Erro da última atualização (se houver)

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Metadados adicionais

  @ManyToOne(() => FirmwareVersion, { nullable: true })
  @JoinColumn({ name: 'firmware_version_id' })
  firmwareVersion: FirmwareVersion;

  @Column({ type: 'uuid', nullable: true })
  firmwareVersionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Método para verificar se precisa de atualização
  needsUpdate(latestVersion: string): boolean {
    return this.compareVersions(latestVersion, this.currentVersion) > 0;
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    
    return 0;
  }
}
