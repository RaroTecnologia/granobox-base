import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTagment } from '@/hooks/useTagment';
import { 
  CheckCircle, 
  XCircle, 
  Key, 
  Printer, 
  WifiHigh, 
  WifiSlash,
  Spinner,
  Info
} from '@phosphor-icons/react';
import { toast } from 'react-hot-toast';

interface TagmentIntegrationProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function TagmentIntegration({ onConnect, onDisconnect }: TagmentIntegrationProps) {
  const { theme } = useTheme();
  const { 
    isConnected, 
    isLoading, 
    printers, 
    initializeTagment, 
    disconnect 
  } = useTagment();
  
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      toast.error('Chave de API é obrigatória');
      return;
    }

    if (!apiKey.startsWith('tgm_')) {
      toast.error('Chave de API deve começar com "tgm_"');
      return;
    }

    try {
      await initializeTagment(apiKey);
      onConnect?.();
    } catch (error) {
      // Error já é tratado no hook
    }
  };

  const handleDisconnect = () => {
    disconnect();
    onDisconnect?.();
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return <Spinner size={20} className="animate-spin text-blue-500" />;
    }
    
    if (isConnected) {
      return <CheckCircle size={20} className="text-green-500" />;
    }
    
    return <XCircle size={20} className="text-red-500" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Conectando...';
    if (isConnected) return 'Conectado ao Tagment Agent Print';
    return 'Desconectado';
  };

  const getStatusColor = () => {
    if (isLoading) return 'text-blue-500';
    if (isConnected) return 'text-green-500';
    return 'text-red-500';
  };

  return (
    <div className={`p-6 rounded-xl border-2 ${
      theme === 'dark' 
        ? 'bg-dark-800 border-dark-700' 
        : 'bg-white border-light-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isConnected ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'
          }`}>
            <Printer size={20} className={isConnected ? 'text-green-600 dark:text-green-400' : 'text-gray-500'} />
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              Tagment Agent Print
            </h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
              Integração com sistema de impressão profissional
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Status das impressoras */}
      {isConnected && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <WifiHigh size={16} className="text-green-500" />
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              Impressoras Conectadas
            </span>
          </div>
          
          {printers.length > 0 ? (
            <div className="space-y-2">
              {printers.map((printer) => (
                <div key={printer.id} className={`flex items-center justify-between p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-dark-700' : 'bg-light-50'
                }`}>
                  <div>
                    <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                      {printer.displayName}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                      {printer.connection.host}:{printer.connection.port} • {printers.length} impressão(ões) hoje
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    printer.status === 'online' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {printer.status === 'online' ? 'Online' : 'Offline'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-dark-700' : 'bg-light-50'
            }`}>
              <div className="flex items-center space-x-2">
                <WifiSlash size={16} className="text-yellow-500" />
                <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  Nenhuma impressora registrada. Execute o Tagment Agent Desktop para registrar impressoras automaticamente.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Formulário de conexão */}
      {!isConnected && (
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              Chave de API Tagment
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="tgm_xxxxxxxxxxxxxxxx"
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  theme === 'dark' 
                    ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' 
                    : 'bg-white border-light-300 text-dark-900 placeholder-dark-500'
                }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 ${
                  theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-500 hover:text-dark-700'
                }`}
                disabled={isLoading}
              >
                <Key size={16} />
              </button>
            </div>
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
              Obtenha sua chave de API no painel do Tagment
            </p>
          </div>

          <button
            onClick={handleConnect}
            disabled={isLoading || !apiKey.trim()}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isLoading || !apiKey.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <Spinner size={16} className="animate-spin" />
                <span>Conectando...</span>
              </div>
            ) : (
              'Conectar ao Tagment Agent Print'
            )}
          </button>
        </div>
      )}

      {/* Botão de desconectar */}
      {isConnected && (
        <button
          onClick={handleDisconnect}
          className="w-full py-3 px-4 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          Desconectar
        </button>
      )}

      {/* Informações adicionais */}
      <div className={`mt-4 p-3 rounded-lg ${
        theme === 'dark' ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
      }`}>
        <div className="flex items-start space-x-2">
          <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className={`font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
              Como funciona:
            </p>
            <ul className={`mt-1 space-y-1 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
              <li>• Execute o Tagment Agent Desktop na máquina com impressora</li>
              <li>• Configure sua chave de API Tagment</li>
              <li>• As impressoras serão registradas automaticamente</li>
              <li>• Imprima etiquetas diretamente do navegador</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
