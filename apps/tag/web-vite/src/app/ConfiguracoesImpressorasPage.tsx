import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTagment } from '@/hooks/useTagment'
import { printersService, GranoboxPrinter } from '@/services/printersService'
import { 
  ArrowLeft, 
  Printer, 
  PencilSimple, 
  WifiHigh, 
  WifiSlash, 
  ArrowClockwise,
  Download,
  CheckCircle,
  XCircle,
  Key,
  Play
} from '@phosphor-icons/react'
import { toast } from 'react-hot-toast'
import FooterNavigation from '@/components/FooterNavigation'
import { TagmentIntegration } from '@/components/TagmentIntegration'


export default function ConfiguracoesImpressorasPage() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { 
    isConnected: isTagmentConnected, 
    printers: tagmentPrinters, 
    loadPrinters,
    sendPrintJob,
    // Estados WebSocket
    isWebSocketConnected,
    connectedAgents,
    agentsInfo,
    jobStatus,
    // Ações WebSocket
    loadConnectedAgents,
    sendTestJobWebSocket,
    sendCustomJobWebSocket
  } = useTagment()
  
  // Debug: log das impressoras do Tagment
  useEffect(() => {
    console.log('ConfiguracoesImpressorasPage - tagmentPrinters:', tagmentPrinters);
  }, [tagmentPrinters]);

  // Carregar impressoras do Granobox na inicialização
  useEffect(() => {
    loadGranoboxPrinters();
  }, [user?.clientId]);
  
  const [granoboxPrinters, setGranoboxPrinters] = useState<GranoboxPrinter[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showTagmentIntegration, setShowTagmentIntegration] = useState(false)
  const [editingPrinter, setEditingPrinter] = useState<GranoboxPrinter | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Estados do formulário
  const [formData, setFormData] = useState({
    location: '',
    usage: [] as string[],
    notes: '',
    isActive: true
  })

  // Carregar impressoras do Granobox
  const loadGranoboxPrinters = async () => {
    if (!user?.clientId) return

    try {
      setIsLoading(true)
      console.log('Carregando impressoras do Granobox para cliente:', user.clientId);
      const response = await printersService.getPrinters(user.clientId)
      console.log('Impressoras carregadas do Granobox:', response);
      setGranoboxPrinters(response)
    } catch (error) {
      console.error('Erro ao carregar impressoras:', error)
      toast.error('Erro ao carregar impressoras')
    } finally {
      setIsLoading(false)
    }
  }

  // Sincronizar com Tagment
  const syncWithTagment = async () => {
    if (!isTagmentConnected || !user?.clientId || !user?.id) {
      toast.error('Conecte-se ao Tagment primeiro')
      return
    }

    try {
      setIsLoading(true)
      
      console.log('Iniciando sincronização com Tagment...');
      console.log('Impressoras do Tagment:', tagmentPrinters);
      
      // Primeiro, vamos simular a sincronização com as impressoras do Tagment
      if (tagmentPrinters.length > 0) {
        console.log(`Encontradas ${tagmentPrinters.length} impressoras no Tagment`);
        
        // Verificar quais impressoras já existem no Granobox
        const existingPrinters = await printersService.getPrinters(user.clientId);
        const existingTagmentIds = existingPrinters.map(p => p.tagmentId);
        
        // Criar apenas impressoras que não existem
        const newPrinters = tagmentPrinters.filter(tp => !existingTagmentIds.includes(tp.id));
        
        console.log(`Impressoras existentes: ${existingPrinters.length}`);
        console.log(`Impressoras novas para criar: ${newPrinters.length}`);
        
        for (const tagmentPrinter of newPrinters) {
          try {
            console.log('Criando impressora no Granobox:', tagmentPrinter.name);
            await printersService.createPrinter({
              tagmentId: tagmentPrinter.id,
              location: 'Não definida',
              usage: ['validity'],
              isActive: true,
              clientId: user.clientId,
              createdById: user.id
            })
            console.log('Impressora criada com sucesso:', tagmentPrinter.name);
          } catch (error) {
            console.error('Erro ao criar impressora:', tagmentPrinter.name, error);
          }
        }
        
        // Log das impressoras que já existiam
        const existingFromTagment = tagmentPrinters.filter(tp => existingTagmentIds.includes(tp.id));
        existingFromTagment.forEach(tp => {
          console.log('Impressora já existe:', tp.name, tp.id);
        });
      } else {
        console.log('Nenhuma impressora encontrada no Tagment');
      }
      
      toast.success('Impressoras sincronizadas com Tagment!')
      await loadGranoboxPrinters()
    } catch (error) {
      console.error('Erro ao sincronizar:', error)
      toast.error('Erro ao sincronizar impressoras')
    } finally {
      setIsLoading(false)
    }
  }

  // Salvar impressora
  const savePrinter = async () => {
    if (!editingPrinter) return

    try {
      setIsLoading(true)
      await printersService.updatePrinter(editingPrinter.id, formData)
      
      toast.success('Impressora atualizada!')
      setEditingPrinter(null)
      setShowForm(false)
      await loadGranoboxPrinters()
    } catch (error) {
      console.error('Erro ao salvar impressora:', error)
      toast.error('Erro ao salvar impressora')
    } finally {
      setIsLoading(false)
    }
  }

  // Teste de impressão
  const testPrint = async (printer: GranoboxPrinter) => {
    try {
      setIsLoading(true)
      
      console.log('🖨️ Iniciando teste de impressão...')
      console.log('Agentes conectados:', connectedAgents.length)
      
      // Verificar se há agentes conectados
      if (connectedAgents.length === 0) {
        toast.error('Nenhum Print Agent conectado. Conecte o Tagment Agent primeiro.');
        return;
      }

      // Buscar dados da impressora no Tagment
      const tagmentPrinter = tagmentPrinters.find(tp => tp.id === printer.tagmentId);
      
      if (!tagmentPrinter) {
        toast.error('Impressora não encontrada no Tagment')
        return
      }

      console.log('🎯 Impressora alvo:', tagmentPrinter.displayName || tagmentPrinter.name);
      
      // Dados de teste baseados no template do Tagment
      const testData = {
        NOME_DO_PRODUTO: 'TESTE DE IMPRESSÃO - GRANOBOX',
        MARCA_VALOR: 'Sistema Granobox',
        QR_CODE: `https://granobox.com.br/teste/${Date.now()}`
      }

      // Template ID real do Tagment
      const testTemplateId = '1c12926f-849b-4bd7-8a61-05036f39f443';
      
      // Primeiro, gerar o ZPL via API
      console.log('📄 Gerando ZPL via API...');
      const zplResult = await sendPrintJob(testTemplateId, testData, undefined, 'high');
      
      if (!zplResult || !zplResult.zpl) {
        toast.error('❌ Falha ao gerar ZPL para teste');
        return;
      }

      console.log('✅ ZPL gerado com sucesso');
      
      // Usar o nome da impressora para o WebSocket
      const printerIdentifier = tagmentPrinter.name || tagmentPrinter.displayName || 'default';
      
      // Enviar via WebSocket para o primeiro agente conectado
      const agentFingerprint = connectedAgents[0];
      console.log('📡 Enviando via WebSocket para:', printerIdentifier);
      
      const wsResult = await sendCustomJobWebSocket(agentFingerprint, {
        printerId: printerIdentifier,
        zplData: zplResult.zpl,
        priority: 'high',
        metadata: {
          testJob: true,
          printerName: tagmentPrinter.displayName || tagmentPrinter.name,
          clientId: user?.clientId
        }
      });
      
      if (wsResult.success) {
        toast.success(`✅ Teste enviado para ${tagmentPrinter.displayName || tagmentPrinter.name}!`);
        console.log('✅ Job de teste enviado via WebSocket:', wsResult.jobId);
      } else {
        toast.error('❌ Falha ao enviar teste via WebSocket: ' + wsResult.message);
      }
      
    } catch (error) {
      console.error('Erro no teste de impressão:', error)
      toast.error('Erro no teste de impressão: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setIsLoading(false)
    }
  }


  // Inicializar
  useEffect(() => {
    loadGranoboxPrinters()
  }, [user?.clientId])

  // Carregar impressoras do Tagment quando conectar
  useEffect(() => {
    if (isTagmentConnected) {
      loadPrinters()
    }
  }, [isTagmentConnected, loadPrinters])

  const getUsageLabel = (usage: string[]) => {
    return usage.map(u => u === 'validity' ? 'Validade' : 'Rótulo').join(', ')
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? 
      <CheckCircle size={16} className="text-green-500" /> : 
      <XCircle size={16} className="text-red-500" />
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'}`}>
      {/* Header Fixo */}
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b shadow-2xl ${
        theme === 'dark' ? 'bg-dark-950/95 border-dark-800' : 'bg-white/95 border-light-200'
      }`}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigate('/configuracoes')}
              className={`p-2 transition-colors ${theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'}`}
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
              <p className="text-primary text-sm">Sincronize e configure impressoras via Tagment Agent</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isTagmentConnected ? (
              <button
                onClick={syncWithTagment}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <ArrowClockwise size={16} className={isLoading ? 'animate-spin' : ''} />
                <span>Sincronizar Impressoras</span>
              </button>
            ) : (
              <button
                onClick={() => setShowTagmentIntegration(true)}
                className="px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-lg transition-colors flex items-center space-x-2"
              >
                <Key size={16} />
                <span>Configurar API Key Tagment</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="pt-32 px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Status da Conexão Tagment */}
          <div className={`p-6 rounded-xl border-2 ${
            theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {isTagmentConnected ? (
                  <WifiHigh size={24} className="text-green-500" />
                ) : (
                  <WifiSlash size={24} className="text-red-500" />
                )}
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Status Tagment Agent
                </h2>
              </div>
              
            </div>
            
            <div className="flex items-center space-x-2">
              {isTagmentConnected ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : (
                <XCircle size={20} className="text-red-500" />
              )}
              <span className={`text-sm font-medium ${
                isTagmentConnected ? 'text-green-600' : 'text-red-600'
              }`}>
                {isTagmentConnected ? 'Conectado ao Tagment Agent' : 'Desconectado do Tagment Agent'}
              </span>
            </div>

            {!isTagmentConnected && (
              <div className={`mt-4 p-4 rounded-lg ${
                theme === 'dark' ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-start space-x-3">
                  <Key size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className={`font-medium ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}`}>
                      Como configurar:
                    </h3>
                    <ol className={`mt-2 space-y-1 text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                      <li>1. Baixe o Tagment Agent Desktop</li>
                      <li>2. Configure sua API Key Tagment no agent</li>
                      <li>3. Adicione suas impressoras no agent</li>
                      <li>4. Configure a API Key aqui no web app</li>
                      <li>5. Sincronize as impressoras automaticamente</li>
                    </ol>
                    <a 
                      href="https://tagment.com.br/downloads" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center mt-3 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Download size={16} className="mr-2" />
                      Baixar Tagment Agent Desktop
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status WebSocket e Agents Conectados */}
          {isTagmentConnected && (
            <div className={`p-6 rounded-xl border-2 ${
              theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {isWebSocketConnected ? (
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  ) : (
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  )}
                  <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    WebSocket Tagment
                  </h2>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={loadConnectedAgents}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Atualizar
                  </button>
                  <button
                    onClick={() => {
                      console.log('🔄 Forçando reconexão WebSocket...');
                      window.location.reload();
                    }}
                    className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                  >
                    Reconectar
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isWebSocketConnected ? 'text-green-500' : 'text-red-500'}`}>
                    {isWebSocketConnected ? '🟢' : '🔴'}
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    WebSocket: {isWebSocketConnected ? 'Conectado' : 'Desconectado'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    {connectedAgents.length}
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Agents Conectados
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    {Object.keys(jobStatus).length}
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Jobs Ativos
                  </div>
                </div>
              </div>

              {/* Lista de Agents */}
              {agentsInfo.length > 0 && (
                <div className="space-y-2">
                  <h3 className={`text-md font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    Print Agents Conectados:
                  </h3>
                  {agentsInfo.map((agent) => (
                    <div key={agent.socketId} className={`p-3 rounded-lg border ${
                      theme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                            🖨️ {agent.agentFingerprint}
                          </div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            Tenant: {agent.tenantId} • Conectado: {new Date(agent.connectedAt).toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => sendTestJobWebSocket(agent.agentFingerprint)}
                          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                          🧪 Teste WebSocket
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lista de Impressoras */}
          <div className={`p-6 rounded-xl border-2 ${
            theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Impressoras Configuradas
              </h2>
              <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                {granoboxPrinters.length} impressora(s)
              </span>
            </div>

            {granoboxPrinters.length === 0 ? (
              <div className={`p-8 text-center rounded-lg ${
                theme === 'dark' ? 'bg-dark-700' : 'bg-light-50'
              }`}>
                <Key size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-dark-600' : 'text-dark-400'}`} />
                <p className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Nenhuma impressora sincronizada
                </p>
                <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  Configure sua API Key Tagment e sincronize suas impressoras
                </p>
                {!isTagmentConnected && (
                  <button
                    onClick={() => setShowTagmentIntegration(true)}
                    className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <Key size={16} />
                    <span>Configurar API Key</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {granoboxPrinters.map((printer) => (
                  <div
                    key={printer.id}
                    className={`p-4 rounded-lg border ${
                      theme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-light-50 border-light-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(printer.isActive)}
                        <div>
                          <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                            {(() => {
                              // Buscar nome da impressora no Tagment
                              const tagmentPrinter = tagmentPrinters.find(tp => tp.id === printer.tagmentId);
                              return tagmentPrinter?.displayName || tagmentPrinter?.name || `Impressora ${printer.tagmentId.slice(0, 8)}`;
                            })()}
                          </h3>
                          <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                            {(() => {
                              const tagmentPrinter = tagmentPrinters.find(tp => tp.id === printer.tagmentId);
                              const connection = tagmentPrinter?.connection;
                              return connection ? 
                                `${connection.host}:${connection.port} • ${printer.location}` : 
                                `ID: ${printer.tagmentId.slice(0, 8)} • ${printer.location}`;
                            })()}
                          </p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-dark-500' : 'text-dark-500'}`}>
                            Uso: {getUsageLabel(printer.usage)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => testPrint(printer)}
                          disabled={isLoading}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === 'dark' ? 'text-green-400 hover:bg-green-900/20' : 'text-green-600 hover:bg-green-50'
                          } disabled:opacity-50`}
                          title="Teste de impressão"
                        >
                          <Play size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingPrinter(printer)
                            setFormData({
                              location: printer.location,
                              usage: printer.usage,
                              notes: printer.notes || '',
                              isActive: printer.isActive
                            })
                            setShowForm(true)
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === 'dark' ? 'text-dark-400 hover:bg-dark-600' : 'text-dark-600 hover:bg-light-100'
                          }`}
                          title="Editar configurações da impressora"
                        >
                          <PencilSimple size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <FooterNavigation />
      
      {/* Modal de Edição de Impressora */}
      {showForm && editingPrinter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-xl shadow-xl ${
            theme === 'dark' ? 'bg-dark-800' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Editar Impressora
              </h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingPrinter(null)
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Nome da impressora (readonly) */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Impressora
                </label>
                <div className={`p-3 rounded-lg border ${
                  theme === 'dark' ? 'bg-dark-700 border-dark-600 text-dark-300' : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                  {(() => {
                    const tagmentPrinter = tagmentPrinters.find(tp => tp.id === editingPrinter.tagmentId);
                    return tagmentPrinter?.displayName || tagmentPrinter?.name || `Impressora ${editingPrinter.tagmentId.slice(0, 8)}`;
                  })()}
                </div>
              </div>

              {/* Localização */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Localização
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className={`w-full p-3 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' 
                      : 'bg-white border-gray-200 text-dark-900 placeholder-gray-400'
                  } focus:ring-2 focus:ring-primary focus:border-transparent`}
                  placeholder="Ex: Cozinha, Balcão, Estoque..."
                />
              </div>

              {/* Uso */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Uso da Impressora
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.usage.includes('validity')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, usage: [...formData.usage.filter(u => u !== 'validity'), 'validity'] })
                        } else {
                          setFormData({ ...formData, usage: formData.usage.filter(u => u !== 'validity') })
                        }
                      }}
                      className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className={theme === 'dark' ? 'text-white' : 'text-dark-900'}>
                      Etiquetas de Validade
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.usage.includes('label')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, usage: [...formData.usage.filter(u => u !== 'label'), 'label'] })
                        } else {
                          setFormData({ ...formData, usage: formData.usage.filter(u => u !== 'label') })
                        }
                      }}
                      className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <span className={theme === 'dark' ? 'text-white' : 'text-dark-900'}>
                      Rótulos de Produto
                    </span>
                  </label>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Observações (opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className={`w-full p-3 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' 
                      : 'bg-white border-gray-200 text-dark-900 placeholder-gray-400'
                  } focus:ring-2 focus:ring-primary focus:border-transparent`}
                  placeholder="Observações sobre a impressora..."
                />
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className={theme === 'dark' ? 'text-white' : 'text-dark-900'}>
                    Impressora ativa
                  </span>
                </label>
              </div>
            </div>

            {/* Botões */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingPrinter(null)
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'text-dark-300 hover:bg-dark-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={savePrinter}
                disabled={isLoading || formData.usage.length === 0}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Integração Tagment */}
      {showTagmentIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-dark-900 dark:text-white">
                  Integração Tagment Agent Print
                </h2>
                <button
                  onClick={() => setShowTagmentIntegration(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle size={24} />
                </button>
              </div>
              
              <TagmentIntegration 
                onConnect={() => {
                  setShowTagmentIntegration(false)
                  loadGranoboxPrinters()
                }}
                onDisconnect={() => {
                  setShowTagmentIntegration(false)
                  loadGranoboxPrinters()
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
