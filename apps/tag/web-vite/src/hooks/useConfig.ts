import { useState, useEffect } from 'react';
import { configService, UserProfile, SystemConfig, PrinterConfig, NotificationConfig, UpdateUserProfileRequest } from '../services/configService';
import { toast } from 'react-hot-toast';

export const useConfig = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig | null>(null);
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar perfil do usuário
  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const profile = await configService.getUserProfile();
      setUserProfile(profile);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar perfil do usuário';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar perfil do usuário
  const updateUserProfile = async (data: UpdateUserProfileRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedProfile = await configService.updateUserProfile(data);
      setUserProfile(updatedProfile);
      toast.success('Perfil atualizado com sucesso!');
      return updatedProfile;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao atualizar perfil';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Alterar senha
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await configService.changePassword({ currentPassword, newPassword });
      toast.success('Senha alterada com sucesso!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao alterar senha';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar configurações do sistema
  const loadSystemConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const config = await configService.getSystemConfig();
      setSystemConfig(config);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar configurações do sistema';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar configurações do sistema
  const updateSystemConfig = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedConfig = await configService.updateSystemConfig(data);
      setSystemConfig(updatedConfig);
      toast.success('Configurações do sistema atualizadas com sucesso!');
      return updatedConfig;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao atualizar configurações do sistema';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar configurações da impressora
  const loadPrinterConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const config = await configService.getPrinterConfig();
      setPrinterConfig(config);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar configurações da impressora';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar configurações da impressora
  const updatePrinterConfig = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedConfig = await configService.updatePrinterConfig(data);
      setPrinterConfig(updatedConfig);
      toast.success('Configurações da impressora atualizadas com sucesso!');
      return updatedConfig;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao atualizar configurações da impressora';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Testar impressora
  const testPrinter = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await configService.testPrinter();
      toast.success(result.message);
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao testar impressora';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar configurações de notificação
  const loadNotificationConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const config = await configService.getNotificationConfig();
      setNotificationConfig(config);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar configurações de notificação';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar configurações de notificação
  const updateNotificationConfig = async (data: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedConfig = await configService.updateNotificationConfig(data);
      setNotificationConfig(updatedConfig);
      toast.success('Configurações de notificação atualizadas com sucesso!');
      return updatedConfig;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao atualizar configurações de notificação';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Upload de logo
  const uploadLogo = async (type: 'colorida' | 'monocromatica', file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await configService.uploadLogo(type, file);
      toast.success('Logo carregada com sucesso!');
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar logo';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // Estados
    userProfile,
    systemConfig,
    printerConfig,
    notificationConfig,
    isLoading,
    error,

    // Ações
    loadUserProfile,
    updateUserProfile,
    changePassword,
    loadSystemConfig,
    updateSystemConfig,
    loadPrinterConfig,
    updatePrinterConfig,
    testPrinter,
    loadNotificationConfig,
    updateNotificationConfig,
    uploadLogo,
  };
};
