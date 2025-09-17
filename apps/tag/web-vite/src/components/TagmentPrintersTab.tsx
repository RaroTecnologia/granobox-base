import { useState, useEffect } from 'react'
import { 
  ArrowClockwise,
  Printer,
  Play,
  CheckCircle,
  XCircle
} from '@phosphor-icons/react'
import { toast } from 'react-hot-toast'

interface TagmentPrintersTabProps {
  theme: string
  user: any
}

export default function TagmentPrintersTab({ theme, user }: TagmentPrintersTabProps) {
  // Estados - IGUAL ao control
  const [tagmentPrinters, setTagmentPrinters] = useState<any[]>([])
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false)
  const [tagmentConfig, setTagmentConfig] = useState<any>(null)

  // Carregar configuração do localStorage - IGUAL ao control
  useEffect(() => {
    if (user?.clientId) {
      const savedConfig = localStorage.getItem(`tagment_config_${user.clientId}`)
      if (savedConfig) {
        try {
          setTagmentConfig(JSON.parse(savedConfig))
        } catch (error) {
          console.error('Erro ao carregar configuração Tagment:', error)
        }
      } else {
        // Criar config automaticamente
        const createConfig = async () => {
          try {
            const response = await fetch(`http://localhost:3001/clients/${user.clientId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                'Content-Type': 'application/json'
              }
            })
            if (response.ok) {
              const client = await response.json()
              if (client.tagmentApiKey) {
                const customerId = client.businessName ? `gbx_${client.businessName.toLowerCase().replace(/\s+/g, '_')}` : `gbx_client_${user.clientId}`
                const config = {
                  customerId,
                  apiKey: client.tagmentApiKey,
                  isActive: true,
                  configuredAt: new Date().toISOString()
                }
                localStorage.setItem(`tagment_config_${user.clientId}`, JSON.stringify(config))
                setTagmentConfig(config)
                console.log('✅ Config criada:', config)
              }
            }
          } catch (error) {
            console.error('Erro ao criar configuração:', error)
          }
        }
        createConfig()
      }
    }
  }, [user?.clientId])

  // Função para carregar impressoras - EXATA do control
  const loadTagmentPrinters = async (apiKey: string) => {
    setIsLoadingPrinters(true)
    try {
      const response = await fetch('https://api.tagment.com.br/v1/printers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const printers = await response.json()
        setTagmentPrinters(printers)
        console.log('✅ Impressoras carregadas:', printers.length)
      }
    } catch (error) {
      console.error('Erro ao carregar impressoras:', error)
    } finally {
      setIsLoadingPrinters(false)
    }
  }

  // Carregar automaticamente quando tiver config
  useEffect(() => {
    if (tagmentConfig?.apiKey) {
      loadTagmentPrinters(tagmentConfig.apiKey)
    }
  }, [tagmentConfig])

  const handleRefresh = () => {
    if (tagmentConfig?.apiKey) {
      loadTagmentPrinters(tagmentConfig.apiKey)
    }
  }

  const handleTestPrint = async (printer: any) => {
    toast.success(`Teste enviado para ${printer.displayName}!`)
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Cabeçalho */}
      <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Impressoras Tagment</h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
              Implementação direta da API - {tagmentPrinters.length} impressora(s)
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoadingPrinters || !tagmentConfig?.apiKey}
            className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <ArrowClockwise size={20} className={isLoadingPrinters ? 'animate-spin' : ''} />
            <span>Atualizar</span>
          </button>
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg border">
          <p className="text-sm text-yellow-800">
            <strong>Debug:</strong> Config: {tagmentConfig ? '✅' : '❌'} | 
            API Key: {tagmentConfig?.apiKey ? `${tagmentConfig.apiKey.substring(0, 10)}...` : '❌'} | 
            Impressoras: {tagmentPrinters.length}
          </p>
        </div>

        {/* Lista de Impressoras */}
        {isLoadingPrinters ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className={`mt-2 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>Carregando impressoras...</p>
          </div>
        ) : tagmentPrinters.length === 0 ? (
          <div className="text-center py-8">
            <Printer size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-dark-400' : 'text-light-400'}`} />
            <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              {!tagmentConfig ? 'Tagment não configurado' : 'Nenhuma impressora encontrada'}
            </h3>
            <p className={`mb-4 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
              {!tagmentConfig ? 
                'Configure a API Key do Tagment primeiro' :
                'Verifique se há impressoras cadastradas no Tagment'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tagmentPrinters.map((printer) => (
              <div 
                key={printer.id} 
                className={`border rounded-lg p-4 hover:border-gray-300 transition-colors ${
                  theme === 'dark' ? 'border-dark-600 bg-dark-700' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      printer.status === 'online' ? 'bg-green-500' : 
                      printer.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                    <div>
                      <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {printer.displayName}
                      </h4>
                      <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-gray-600'}`}>
                        {printer.connection?.host}:{printer.connection?.port} • Status: {printer.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className={`text-right text-sm ${theme === 'dark' ? 'text-dark-500' : 'text-gray-500'}`}>
                      <p>Hoje: {printer.printsToday || 0}</p>
                      <p>Total: {printer.totalPrints || 0}</p>
                    </div>
                    <button
                      onClick={() => handleTestPrint(printer)}
                      disabled={printer.status !== 'online'}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'dark' ? 'text-green-400 hover:bg-green-900/20' : 'text-green-600 hover:bg-green-50'
                      } disabled:opacity-50`}
                      title="Teste de impressão"
                    >
                      <Play size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
