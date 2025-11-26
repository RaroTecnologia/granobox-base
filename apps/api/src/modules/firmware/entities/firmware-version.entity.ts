import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum FirmwareType {
  EDGE_GO = 'edge-go',
  EDGE_GO_WS = 'edge-go-ws',
  EDGE_PRO = 'edge-pro',
}

export enum FirmwareStatus {
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  STABLE = 'stable',
  DEPRECATED = 'deprecated',
}

@Entity('firmware_versions')
export class FirmwareVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  version: string; // Ex: "1.2.3"

  @Column({ type: 'enum', enum: FirmwareType })
  type: FirmwareType;

  @Column({ type: 'enum', enum: FirmwareStatus, default: FirmwareStatus.DEVELOPMENT })
  status: FirmwareStatus;

  @Column({ type: 'text', nullable: true })
  description: string; // Changelog/descrição da versão

  @Column({ type: 'varchar', length: 64 })
  checksum: string; // SHA256 do firmware

  @Column({ type: 'int' })
  fileSize: number; // Tamanho do arquivo em bytes

  @Column({ type: 'varchar', length: 255, nullable: true })
  downloadUrl: string; // URL para download do firmware

  @Column({ type: 'varchar', length: 50, nullable: true })
  gitCommit: string; // Hash do commit Git

  @Column({ type: 'varchar', length: 50, nullable: true })
  gitTag: string; // Tag Git (ex: v1.2.3)

  @Column({ type: 'varchar', length: 20, nullable: true })
  idfVersion: string; // Versão do ESP-IDF usada

  @Column({ type: 'varchar', length: 20, nullable: true })
  chipTarget: string; // Ex: esp32s3

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Metadados adicionais

  @Column({ type: 'boolean', default: false })
  isLatest: boolean; // Marca se é a versão mais recente

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // Se está disponível para download

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Método para comparar versões semanticamente
  isNewerThan(otherVersion: string): boolean {
    return this.compareVersions(this.version, otherVersion) > 0;
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
