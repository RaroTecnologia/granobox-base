import React from 'react';
import { useTagment } from '../hooks/useTagment';
import { useTheme } from '../contexts/ThemeContext';
import { 
  WifiHigh, 
  WifiSlash, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowClockwise
} from '@phosphor-icons/react';

interface TagmentStatusProps {
  showDetails?: boolean;
  onConfigure?: () => void;
}

export default function TagmentStatus({ showDetails = false, onConfigure }: TagmentStatusProps) {
  const { systemStatus, isLoading } = useTagment();
  const { theme } = useTheme();

  const getStatusIcon = () => {
    if (isLoading) {
      return <ArrowClockwise size={20} className="animate-spin text-yellow-500" />;
    }

    switch (systemStatus.status) {
      case 'ready':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'needs_token':
        return <WifiSlash size={20} className="text-yellow-500" />;
      case 'needs_agent':
        return <XCircle size={20} className="text-red-500" />;
      default:
        return <Clock size={20} className="text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (systemStatus.status) {
      case 'ready':
        return 'Tagment Conectado';
      case 'needs_token':
        return 'Configurando...';
      case 'needs_agent':
        return 'Instale o Tagment Agent Print';
      default:
        return 'Verificando...';
    }
  };

  const getStatusColor = () => {
    switch (systemStatus.status) {
      case 'ready':
        return 'text-green-600';
      case 'needs_token':
        return 'text-yellow-600';
      case 'needs_agent':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

      const getStatusDescription = () => {
        switch (systemStatus.status) {
          case 'ready':
            return 'Sistema pronto para impressão via API Tagment';
          case 'needs_token':
            return 'Configurando automaticamente...';
          case 'needs_agent':
            return 'Tagment Agent Print não está ativo';
          default:
            return 'Verificando conexão...';
        }
      };

  // Debug info
  console.log('TagmentStatus - systemStatus:', systemStatus);
  console.log('TagmentStatus - isLoading:', isLoading);

  if (!showDetails) {
    return (
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border ${
      theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              {getStatusText()}
            </h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
              {getStatusDescription()}
            </p>
          </div>
        </div>
        
        {systemStatus.status === 'needs_agent' && onConfigure && (
          <button
            onClick={onConfigure}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Baixar Tagment</span>
          </button>
        )}
      </div>

      {showDetails && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>
              Agente detectado:
            </span>
            <span className={systemStatus.agentDetected ? 'text-green-600' : 'text-red-600'}>
              {systemStatus.agentDetected ? 'Sim' : 'Não'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>
              API Key configurada:
            </span>
            <span className={systemStatus.hasToken ? 'text-green-600' : 'text-red-600'}>
              {systemStatus.hasToken ? 'Sim' : 'Não'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>
              Sistema pronto:
            </span>
            <span className={systemStatus.isReady ? 'text-green-600' : 'text-red-600'}>
              {systemStatus.isReady ? 'Sim' : 'Não'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
