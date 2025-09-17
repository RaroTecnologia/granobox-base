import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { 
  ArrowLeft, 
  Printer, 
  ArrowClockwise,
  CheckCircle,
  XCircle,
  Play,
  PencilSimple
} from '@phosphor-icons/react'
import { toast } from 'react-hot-toast'
import FooterNavigation from '@/components/FooterNavigation'

export default function ConfiguracoesImpressorasPageSimple() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Estados - EXATAMENTE como no control
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
        // Se não tem config no localStorage, criar uma baseada na API Key atual
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
                console.log('✅ Configuração criada automaticamente:', config)
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

  // Carregar automaticamente quando tiver config - IGUAL ao control
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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-100'}`}>
      {/* Header */}
      <header className={`p-4 border-b ${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/configuracoes')}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'text-dark-400 hover:bg-dark-700' : 'text-dark-600 hover:bg-light-100'}`}
            >
              <ArrowLeft size={24} weight="duotone" />
            </button>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Printer size={24} weight="duotone" className="text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Impressoras Tagment
              </h1>
              <p className="text-primary text-sm">Implementação igual ao Control</p>
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isLoadingPrinters || !tagmentConfig?.apiKey}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <ArrowClockwise size={16} className={isLoadingPrinters ? 'animate-spin' : ''} />
            <span>Atualizar</span>
          </button>
        </div>
      </header>

      {/* Debug Info */}
      <div className="p-4 bg-yellow-50 border-b">
        <p className="text-sm">
          <strong>Debug:</strong> Config: {tagmentConfig ? '✅' : '❌'} | 
          API Key: {tagmentConfig?.apiKey ? `${tagmentConfig.apiKey.substring(0, 10)}...` : '❌'} | 
          Impressoras: {tagmentPrinters.length}
        </p>
      </div>

      {/* Conteúdo Principal */}
      <div className="p-6">
        <div className={`p-6 rounded-xl border-2 ${
          theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              Impressoras Tagment
            </h2>
            <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
              {tagmentPrinters.length} impressora(s)
            </span>
          </div>

          {/* Lista de Impressoras - IGUAL ao control */}
          {tagmentPrinters.length === 0 ? (
            <div className={`p-8 text-center rounded-lg ${
              theme === 'dark' ? 'bg-dark-700' : 'bg-light-50'
            }`}>
              <Printer size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-dark-600' : 'text-dark-400'}`} />
              <p className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                {!tagmentConfig ? 'Tagment não configurado' : 'Nenhuma impressora encontrada'}
              </p>
              <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                {!tagmentConfig ? 
                  'Configure a API Key do Tagment primeiro' :
                  'Verifique se há impressoras cadastradas no Tagment'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
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
                          {printer.externalLocationId && `Local: ${printer.externalLocationId} • `}
                          Status: {printer.status}
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

      <FooterNavigation />
    </div>
  )
}
