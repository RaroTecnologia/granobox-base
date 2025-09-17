import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTagment } from '@/hooks/useTagment'
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

export default function ConfiguracoesImpressorasPageNew() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // Hook do Tagment - SIMPLES
  const { 
    isConnected: isTagmentConnected, 
    printers: tagmentPrinters, 
    reloadPrinters,
    isLoading
  } = useTagment()

  const [isTestingPrint, setIsTestingPrint] = useState<string | null>(null)

  // Debug simples
  console.log('📊 PÁGINA: tagmentPrinters:', tagmentPrinters?.length || 0, 'impressoras')

  const handleTestPrint = async (printer: any) => {
    setIsTestingPrint(printer.id)
    try {
      // Simular teste de impressão
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success(`Teste enviado para ${printer.displayName}!`)
    } catch (error) {
      toast.error('Erro no teste de impressão')
    } finally {
      setIsTestingPrint(null)
    }
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
              <p className="text-primary text-sm">Sistema simplificado - Fonte única</p>
            </div>
          </div>
          
          <button
            onClick={reloadPrinters}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <ArrowClockwise size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>Atualizar</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="p-6">
        <div className={`p-6 rounded-xl border-2 ${
          theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              Impressoras Disponíveis
            </h2>
            <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
              {tagmentPrinters?.length || 0} impressora(s)
            </span>
          </div>

          {/* Lista de Impressoras */}
          {!tagmentPrinters || tagmentPrinters.length === 0 ? (
            <div className={`p-8 text-center rounded-lg ${
              theme === 'dark' ? 'bg-dark-700' : 'bg-light-50'
            }`}>
              <Printer size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-dark-600' : 'text-dark-400'}`} />
              <p className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Nenhuma impressora encontrada
              </p>
              <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                {isTagmentConnected ? 
                  'Verifique se há impressoras cadastradas no Tagment' :
                  'Conectando ao Tagment...'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tagmentPrinters.map((printer) => {
                const isOnline = printer.status === 'online'
                const isTesting = isTestingPrint === printer.id
                
                return (
                  <div
                    key={printer.id}
                    className={`p-4 rounded-lg border ${
                      theme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-light-50 border-light-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isOnline ? (
                          <CheckCircle size={24} className="text-green-500" />
                        ) : (
                          <XCircle size={24} className="text-red-500" />
                        )}
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                              {printer.displayName || printer.name}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              isOnline 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {isOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                            {printer.connection ? 
                              `${printer.connection.host}:${printer.connection.port}` : 
                              `ID: ${printer.id.slice(0, 8)}`
                            }
                          </p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-dark-500' : 'text-dark-500'}`}>
                            Impressões hoje: {printer.printsToday || 0} • Total: {printer.totalPrints || 0}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTestPrint(printer)}
                          disabled={isTesting || !isOnline}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === 'dark' ? 'text-green-400 hover:bg-green-900/20' : 'text-green-600 hover:bg-green-50'
                          } disabled:opacity-50`}
                          title="Teste de impressão"
                        >
                          {isTesting ? (
                            <ArrowClockwise size={16} className="animate-spin" />
                          ) : (
                            <Play size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => toast.info('Configurações gerenciadas pelo Tagment')}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === 'dark' ? 'text-dark-400 hover:bg-dark-600' : 'text-dark-600 hover:bg-light-100'
                          }`}
                          title="Ver detalhes"
                        >
                          <PencilSimple size={16} />
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

      <FooterNavigation />
    </div>
  )
}
