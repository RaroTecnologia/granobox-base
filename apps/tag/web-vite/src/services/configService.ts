import { api } from './api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  department?: string;
  phone?: string;
}

export interface UpdateUserProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SystemConfig {
  id: string;
  businessName: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  logoColorida?: string;
  logoMonocromatica?: string;
}

export interface UpdateSystemConfigRequest {
  businessName?: string;
  cnpj?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoColorida?: string;
  logoMonocromatica?: string;
}

export interface PrinterConfig {
  id: string;
  name: string;
  ip: string;
  port: string;
  model: string;
  isActive: boolean;
}

export interface UpdatePrinterConfigRequest {
  name?: string;
  ip?: string;
  port?: string;
  model?: string;
  isActive?: boolean;
}

export interface NotificationConfig {
  email: boolean;
  push: boolean;
  sound: boolean;
  expirationDays: number;
}

export interface UpdateNotificationConfigRequest {
  email?: boolean;
  push?: boolean;
  sound?: boolean;
  expirationDays?: number;
}

export const configService = {
  // Perfil do usuário
  async getUserProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfile>('/users/profile');
    return response.data;
  },

  async updateUserProfile(data: UpdateUserProfileRequest): Promise<UserProfile> {
    const response = await api.patch<UserProfile>('/users/profile', data);
    return response.data;
  },

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/users/change-password', data);
    return response.data;
  },

  // Configurações do sistema
  async getSystemConfig(): Promise<SystemConfig> {
    const response = await api.get<SystemConfig>('/system/config');
    return response.data;
  },

  async updateSystemConfig(data: UpdateSystemConfigRequest): Promise<SystemConfig> {
    const response = await api.patch<SystemConfig>('/system/config', data);
    return response.data;
  },

  // Configurações da impressora
  async getPrinterConfig(): Promise<PrinterConfig> {
    const response = await api.get<PrinterConfig>('/printer/config');
    return response.data;
  },

  async updatePrinterConfig(data: UpdatePrinterConfigRequest): Promise<PrinterConfig> {
    const response = await api.patch<PrinterConfig>('/printer/config', data);
    return response.data;
  },

  async testPrinter(): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/printer/test');
    return response.data;
  },

  // Configurações de notificação
  async getNotificationConfig(): Promise<NotificationConfig> {
    const response = await api.get<NotificationConfig>('/notifications/config');
    return response.data;
  },

  async updateNotificationConfig(data: UpdateNotificationConfigRequest): Promise<NotificationConfig> {
    const response = await api.patch<NotificationConfig>('/notifications/config', data);
    return response.data;
  },

  // Upload de logos
  async uploadLogo(type: 'colorida' | 'monocromatica', file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    formData.append('type', type);

    const response = await api.post<{ url: string }>('/system/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Backup
  async createBackup(): Promise<{ message: string; downloadUrl: string }> {
    const response = await api.post<{ message: string; downloadUrl: string }>('/backup/create');
    return response.data;
  },

  async getBackupHistory(): Promise<Array<{
    id: string;
    name: string;
    size: string;
    createdAt: string;
    downloadUrl: string;
  }>> {
    const response = await api.get<Array<{
      id: string;
      name: string;
      size: string;
      createdAt: string;
      downloadUrl: string;
    }>>('/backup/history');
    return response.data;
  },

  async restoreBackup(file: File): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('backup', file);

    const response = await api.post<{ message: string }>('/backup/restore', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  department?: string;
  phone?: string;
}

export interface UpdateUserProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SystemConfig {
  id: string;
  businessName: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  logoColorida?: string;
  logoMonocromatica?: string;
}

export interface UpdateSystemConfigRequest {
  businessName?: string;
  cnpj?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoColorida?: string;
  logoMonocromatica?: string;
}

export interface PrinterConfig {
  id: string;
  name: string;
  ip: string;
  port: string;
  model: string;
  isActive: boolean;
}

export interface UpdatePrinterConfigRequest {
  name?: string;
  ip?: string;
  port?: string;
  model?: string;
  isActive?: boolean;
}

export interface NotificationConfig {
  email: boolean;
  push: boolean;
  sound: boolean;
  expirationDays: number;
}

export interface UpdateNotificationConfigRequest {
  email?: boolean;
  push?: boolean;
  sound?: boolean;
  expirationDays?: number;
}

