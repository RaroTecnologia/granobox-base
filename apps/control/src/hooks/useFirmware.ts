import { useState } from 'react';
import { api } from '../services/api';

export type Platform = 'edge-go' | 'edge-pro';

export interface Firmware {
  id?: string;
  name: string;
  version: string;
  url: string;
  key: string;
  size: number;
  checksum?: string;
  uploadedAt: string;
  uploadedBy?: string;
  platform?: Platform; // Tipo de dispositivo (edge-go ou edge-pro)
}

export interface Device {
  deviceId: string;
  name: string;
  currentVersion?: string;
  status: 'online' | 'offline';
  lastSeen: string;
  clientId?: string;
  clientName?: string;
  operationId?: string;
  operationName?: string;
  platform?: Platform; // Tipo de dispositivo (edge-go ou edge-pro)
}

export interface WsDeviceInfo {
  deviceId: string;
  registered: boolean;
  lastSeen: string;
  version?: string;
}

export interface OtaStatus {
  deviceId: string;
  status: 'pending' | 'in_progress' | 'success' | 'failed';
  progress?: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export function useFirmware() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Listar firmwares disponíveis no R2
   */
  const listFirmwares = async (): Promise<Firmware[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/edge-go-ws/firmware/list');
      
      setIsLoading(false);
      return response.data.firmwares || [];
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao listar firmwares';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };

  /**
   * Fazer upload de um firmware para o R2
   */
  const uploadFirmware = async (file: File, version: string, platform: Platform): Promise<Firmware> => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('firmware', file);
      formData.append('version', version);
      formData.append('platform', platform);

      const response = await api.post('/edge-go-ws/firmware/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsLoading(false);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao fazer upload do firmware';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };

  /**
   * Listar dispositivos Edge-Go disponíveis
   */
  const listDevices = async (): Promise<Device[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Buscar dispositivos do banco (com info de cliente/operação)
      const devicesResponse = await api.get('/devices');
      const dbDevices = devicesResponse.data.filter(
        (d: any) => d.deviceId?.startsWith('edge-go-') || d.deviceId?.startsWith('edge-pro-')
      );

      // Buscar status de conexão via WebSocket
      const statsResponse = await api.get('/edge-go-ws/stats');
      const connectedDevices = new Map<string, WsDeviceInfo>(
        statsResponse.data.devices.map((d: any) => [d.deviceId, d])
      );

      const devices: Device[] = dbDevices.map((d: any) => {
        const wsInfo = connectedDevices.get(d.deviceId);
        
        // Detectar plataforma baseado no deviceId
        const platform: Platform = d.deviceId?.startsWith('edge-pro-') 
          ? 'edge-pro' 
          : d.deviceId?.startsWith('edge-go-') 
            ? 'edge-go' 
            : 'edge-go'; // Default para edge-go

        return {
          deviceId: d.deviceId,
          name: d.name || d.deviceId,
          status: wsInfo?.registered ? 'online' : 'offline',
          lastSeen: wsInfo?.lastSeen || d.lastSeenAt || d.updatedAt,
          currentVersion: d.version || 'Desconhecida',
          clientId: d.clientId,
          clientName: d.client?.name || d.client?.tradingName,
          operationId: d.operationId,
          operationName: d.operation?.name,
          platform,
        };
      });

      setIsLoading(false);
      return devices;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao listar dispositivos';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };

  /**
   * Iniciar OTA para um ou mais dispositivos
   */
  const startOta = async (
    deviceIds: string[],
    firmwareUrl: string,
    version: string,
    checksum: string
  ): Promise<Record<string, OtaStatus>> => {
    setIsLoading(true);
    setError(null);

    try {
      const results: Record<string, OtaStatus> = {};

      // Iniciar OTA para cada dispositivo
      for (const deviceId of deviceIds) {
        try {
          const response = await api.post(`/edge-go-ws/device/${deviceId}/ota`, {
            version,
            firmwareUrl,
            checksum,
          });

          results[deviceId] = {
            deviceId,
            status: response.data.success ? 'in_progress' : 'failed',
            error: response.data.error,
            startedAt: new Date().toISOString(),
          };
        } catch (err: any) {
          results[deviceId] = {
            deviceId,
            status: 'failed',
            error: err.response?.data?.message || 'Erro ao iniciar OTA',
          };
        }
      }

      setIsLoading(false);
      return results;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao iniciar OTA';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };

  /**
   * Obter status atual do OTA
   */
  const getOtaStatus = async (deviceId: string): Promise<OtaStatus | null> => {
    try {
      const response = await api.get(`/edge-go-ws/device/${deviceId}/ota/status`);
      const data = response.data;
      
      if (!data.active) {
        return null;
      }

      return {
        deviceId,
        status: 'in_progress',
        progress: data.progress || 0,
        startedAt: data.startedAt,
      };
    } catch (err: any) {
      // Se não houver OTA ativo, retornar null
      return null;
    }
  };

  /**
   * Cancelar OTA em andamento
   */
  const cancelOta = async (deviceId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.delete(`/edge-go-ws/device/${deviceId}/ota`);
      setIsLoading(false);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao cancelar OTA';
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };

  return {
    isLoading,
    error,
    listFirmwares,
    uploadFirmware,
    listDevices,
    startOta,
    getOtaStatus,
    cancelOta,
  };
}

