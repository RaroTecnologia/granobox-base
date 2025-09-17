import { useState, useEffect } from 'react'
import { 
  ArrowClockwise,
  Printer,
  Play,
  CheckCircle,
  XCircle
} from '@phosphor-icons/react'
import { toast } from 'react-hot-toast'

interface ImpressoraTabProps {
  theme: string
  user: any
}

export default function ImpressoraTab({ theme, user }: ImpressoraTabProps) {
  // Estados - Implementação direta como no control
  const [tagmentPrinters, setTagmentPrinters] = useState<any[]>([])
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false)
  const [tagmentConfig, setTagmentConfig] = useState<any>(null)
  const [testingPrinterId, setTestingPrinterId] = useState<string | null>(null)

  // Carregar configuração do localStorage
  useEffect(() => {
    if (user?.clientId) {
      const savedConfig = localStorage.getItem(`tagment_config_${user.clientId}`)
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig)
          setTagmentConfig(config)
        } catch (error) {
          console.error('Erro ao carregar configuração:', error)
        }
      } else {
        // Criar config automaticamente baseada na API Key do banco
        createConfigFromDatabase()
      }
    }
  }, [user?.clientId])

  // Criar configuração baseada nos dados do banco
  const createConfigFromDatabase = async () => {
    if (!user?.clientId) return

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
          const customerId = client.businessName ? 
            `gbx_${client.businessName.toLowerCase().replace(/\s+/g, '_')}` : 
            `gbx_client_${user.clientId}`
          
          const config = {
            customerId,
            apiKey: client.tagmentApiKey,
            isActive: true,
            configuredAt: new Date().toISOString()
          }
          
          localStorage.setItem(`tagment_config_${user.clientId}`, JSON.stringify(config))
          setTagmentConfig(config)
        }
      }
    } catch (error) {
      console.error('Erro ao criar configuração:', error)
    }
  }

  // Carregar impressoras - IGUAL ao control
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
        if (printers.length > 0) {
          toast.success(`${printers.length} impressoras encontradas`)
        }
      } else {
        console.error('Erro na resposta da API:', response.status)
        toast.error('Erro ao carregar impressoras')
      }
    } catch (error) {
      console.error('Erro ao carregar impressoras:', error)
      toast.error('Erro de conexão com Tagment')
    } finally {
      setIsLoadingPrinters(false)
    }
  }

  // Carregar automaticamente quando tiver configuração
  useEffect(() => {
    if (tagmentConfig?.apiKey) {
      loadTagmentPrinters(tagmentConfig.apiKey)
    }
  }, [tagmentConfig])

  const handleRefresh = () => {
    if (tagmentConfig?.apiKey) {
      loadTagmentPrinters(tagmentConfig.apiKey)
    } else {
      toast.error('Configuração Tagment não encontrada')
    }
  }

  const handleTestPrint = async (printer: any) => {
    if (!tagmentConfig?.apiKey) {
      toast.error('Configuração Tagment não encontrada')
      return
    }

    if (printer.status !== 'online') {
      toast.error(`Impressora ${printer.displayName} está offline`)
      return
    }

    setTestingPrinterId(printer.id)
    
    try {
      // Dados de teste baseados na documentação
      const testData = {
        templateId: '1c12926f-849b-4bd7-8a61-05036f39f443', // Template de validade GranoBox
        printerId: printer.id,
        data: {
          'NOME_DO_PRODUTO': 'TESTE DE IMPRESSÃO - GRANOBOX',
          'MARCA_VALOR': 'Sistema Granobox',
          'SIF_VALOR': '1234',
          'EMB_ORIGINAL_VALOR': new Date().toLocaleDateString('pt-BR'),
          'MANIPULACAO_VALOR': new Date().toLocaleDateString('pt-BR'),
          'VALIDADE_VALOR': new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'), // +3 dias
          'RQ13WS': `https://granobox.com.br/teste/${Date.now()}`
        }
      }

      console.log('🖨️ Enviando teste de impressão para:', printer.displayName)
      console.log('📄 Dados:', testData)

      // Usar o endpoint /v1/jobs/complete conforme documentação
      const response = await fetch('https://api.tagment.com.br/v1/jobs/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tagmentConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success(`Etiqueta enviada para ${printer.displayName}!`)
        console.log('✅ Resultado:', result.printResult?.message || 'Impressão enviada')
        console.log('📝 Job ID:', result.jobId)
      } else {
        toast.error(`Erro: ${result.message}`)
        console.error('❌ Erro na impressão:', result.message)
      }
      
    } catch (error: any) {
      console.error('❌ Erro no teste de impressão:', error)
      toast.error(`Erro: ${error.message || 'Falha na comunicação'}`)
    } finally {
      setTestingPrinterId(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Cabeçalho */}
      <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-6">
            <div>
              <h2 className="text-xl font-semibold">Impressoras Tagment</h2>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                {tagmentPrinters.length} impressora(s) encontrada(s)
              </p>
            </div>
            
            {/* Status Connection */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${tagmentConfig ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-300' : 'text-gray-700'}`}>
                <strong>Tagment:</strong> {tagmentConfig ? 'Conectado' : 'Não conectado'}
              </p>
            </div>
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
                'Configure a API Key do Tagment no painel de controle' :
                'Verifique se há impressoras cadastradas no Tagment'
              }
            </p>
            {tagmentConfig && (
              <button
                onClick={handleRefresh}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Tentar Novamente
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {tagmentPrinters.map((printer) => {
              const isTesting = testingPrinterId === printer.id
              
              return (
                <div 
                  key={printer.id} 
                  className={`border rounded-lg p-4 hover:border-gray-300 transition-colors ${
                    theme === 'dark' ? 'border-dark-600 bg-dark-700' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {printer.status === 'online' ? (
                        <CheckCircle size={24} className="text-green-500" />
                      ) : (
                        <XCircle size={24} className="text-red-500" />
                      )}
                      <div>
                        <h4 className={`font-medium text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {printer.displayName}
                        </h4>
                        <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-gray-600'}`}>
                          {printer.connection?.host}:{printer.connection?.port} • Status: {printer.status}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`text-xs ${theme === 'dark' ? 'text-dark-500' : 'text-gray-500'}`}>
                            Hoje: {printer.printsToday || 0} • Total: {printer.totalPrints || 0}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            printer.status === 'online' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {printer.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleTestPrint(printer)}
                        disabled={printer.status !== 'online' || isTesting}
                        className={`p-3 rounded-lg transition-colors ${
                          theme === 'dark' ? 'text-green-400 hover:bg-green-900/20' : 'text-green-600 hover:bg-green-50'
                        } disabled:opacity-50`}
                        title="Imprimir etiqueta de teste"
                      >
                        {isTesting ? (
                          <ArrowClockwise size={18} className="animate-spin" />
                        ) : (
                          <Play size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
