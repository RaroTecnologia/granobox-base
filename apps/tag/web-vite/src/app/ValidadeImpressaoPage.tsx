import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { Printer, ArrowLeft, Trash, CheckCircle, Clock, House, Thermometer, Snowflake, Square, Warning, Tag, WifiHigh, WifiSlash, X, User, UserSwitch } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import FooterNavigation from '@/components/FooterNavigation'
import { labelsService, Label } from '@/services/labelsService'
import { useTagment } from '@/hooks/useTagment'
import { TagmentIntegration } from '@/components/TagmentIntegration'
import TagmentStatus from '@/components/TagmentStatus'
import { useOperators, Operator } from '@/hooks/useOperators'

export default function ValidadeImpressaoPage() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { 
    isConnected: isTagmentConnected, 
    printers: tagmentPrinters, 
    sendPrintJob,
    systemStatus,
    // Estados WebSocket
    isWebSocketConnected,
    connectedAgents,
    agentsInfo,
    jobStatus,
    // Ações WebSocket
    sendCustomJobWebSocket,
    clearCompletedJobs
  } = useTagment()
  
  const [filaItens, setFilaItens] = useState<Label[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null)
  const [showTagmentIntegration, setShowTagmentIntegration] = useState(false)
  
  // Estados para operador
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
  const [showOperatorModal, setShowOperatorModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  
  // Para usuários manager, usar o primeiro cliente disponível
  const clientId = user?.clientId || (user?.role === 'manager' ? '6621e831-5d1d-4801-8c33-b0f93446a3df' : undefined)
  
  // Hook de operadores
  const { operators, validatePin, authenticateOperator } = useOperators(clientId)

  // Carregar etiquetas da API
  useEffect(() => {
    const loadLabels = async () => {
      if (!user?.clientId) return;
      
      try {
        setIsLoading(true);
        const labels = await labelsService.getPendingLabels(user.clientId);
        setFilaItens(labels);
      } catch (error) {
        console.error('Erro ao carregar etiquetas:', error);
        toast.error('Erro ao carregar etiquetas');
      } finally {
        setIsLoading(false);
      }
    };

    loadLabels();
  }, [user?.clientId])

  // Funções para gerenciar operadores
  const handleOperatorSelect = (operator: Operator) => {
    setSelectedOperator(operator)
    setShowOperatorModal(false)
    setPinInput('')
    setPinError(false)
    toast.success(`Operador selecionado: ${operator.name}`)
  }

  const handlePinValidation = async (operator: Operator) => {
    if (pinInput.length !== 4) {
      setPinError(true)
      return
    }

    const isValid = await validatePin(operator.id, pinInput)
    if (isValid) {
      handleOperatorSelect(operator)
    } else {
      setPinError(true)
      setPinInput('')
      toast.error('PIN incorreto')
    }
  }

  const showOperatorSelection = () => {
    setShowOperatorModal(true)
    setPinInput('')
    setPinError(false)
  }

  const removerItem = async (id: string) => {
    try {
      await labelsService.deleteLabel(id);
      setFilaItens(prev => prev.filter(item => item.id !== id));
      toast.success('Etiqueta removida da fila');
    } catch (error) {
      console.error('Erro ao remover etiqueta:', error);
      toast.error('Erro ao remover etiqueta');
    }
  }

  const limparFila = async () => {
    try {
      const deletePromises = filaItens.map(item => labelsService.deleteLabel(item.id));
      await Promise.all(deletePromises);
      setFilaItens([]);
      toast.success('Fila limpa');
    } catch (error) {
      console.error('Erro ao limpar fila:', error);
      toast.error('Erro ao limpar fila');
    }
  }

  const processarFila = async () => {
    if (filaItens.length === 0) {
      toast.error('Nenhum item na fila para processar')
      return
    }

    // Prioridade 1: WebSocket (tempo real)
    if (isWebSocketConnected && connectedAgents.length > 0) {
      console.log('🚀 Usando impressão via WebSocket');
      await processarFilaComWebSocket();
      return;
    }

    // Prioridade 2: Tagment REST API
    if (systemStatus.isReady && selectedPrinter) {
      console.log('📡 Usando impressão via Tagment REST');
      await processarFilaComTagment();
      return;
    }

    // Fallback: processar via API local
    console.log('💾 Usando impressão local');
    await processarFilaLocal();
  }

  const processarFilaComWebSocket = async () => {
    if (connectedAgents.length === 0) {
      toast.error('Nenhum Print Agent conectado');
      return;
    }

    setIsProcessing(true);

    try {
      const agentFingerprint = connectedAgents[0]; // Usar o primeiro agent disponível
      console.log('🖨️ Enviando jobs via WebSocket para agent:', agentFingerprint);

      let successCount = 0;
      let errorCount = 0;

      // Processar cada etiqueta
      for (const item of filaItens) {
        try {
          // Gerar ZPL para a etiqueta
          const zplResponse = await labelsService.generateZPLForLabel(item.id);
          
          if (zplResponse.zpl) {
            // Enviar via WebSocket
            const result = await sendCustomJobWebSocket(agentFingerprint, {
              printerId: 'default', // Usar impressora padrão do agent
              zplData: zplResponse.zpl,
              priority: 'high',
              metadata: {
                labelId: item.id,
                labelType: 'validity',
                productName: item.product?.name || 'Produto',
                clientId: user?.clientId
              }
            });

            if (result.success) {
              console.log('✅ Job WebSocket enviado:', result.jobId);
              successCount++;
            } else {
              console.error('❌ Erro no job WebSocket:', result.message);
              errorCount++;
            }
          } else {
            console.error('❌ Erro ao gerar ZPL para etiqueta:', item.id);
            errorCount++;
          }
        } catch (error) {
          console.error('❌ Erro ao processar etiqueta:', item.id, error);
          errorCount++;
        }
      }

      // Marcar como impressas se pelo menos uma foi enviada
      if (successCount > 0) {
        const ids = filaItens.map(item => item.id);
        await labelsService.markAsPrinted(ids);
        setFilaItens([]);
      }

      // Feedback para o usuário
      if (successCount > 0 && errorCount === 0) {
        toast.success(`🚀 ${successCount} etiqueta(s) enviada(s) via WebSocket!`);
      } else if (successCount > 0 && errorCount > 0) {
        toast.success(`🚀 ${successCount} enviadas, ${errorCount} com erro via WebSocket`);
      } else {
        toast.error('❌ Erro ao enviar etiquetas via WebSocket');
      }

    } catch (error) {
      console.error('Erro ao processar fila via WebSocket:', error);
      toast.error('Erro ao processar fila via WebSocket');
    } finally {
      setIsProcessing(false);
    }
  }

  const processarFilaComTagment = async () => {
    if (!selectedPrinter) {
      toast.error('Selecione uma impressora');
      return;
    }

    setIsProcessing(true);

    try {
      const ids = filaItens.map(item => item.id);
      
      // Enviar jobs de impressão via Tagment
      for (const id of ids) {
        await labelsService.printLabelWithTagment(id, selectedPrinter);
      }
      
      // Marcar como impressas na API local
      await labelsService.markAsPrinted(ids);
      
      // Atualizar estado local
      setFilaItens([]);
      
      toast.success(`${filaItens.length} etiqueta(s) enviada(s) para impressão via Tagment!`);
    } catch (error) {
      console.error('Erro ao processar fila via Tagment:', error);
      toast.error('Erro ao processar fila de impressão via Tagment');
    } finally {
      setIsProcessing(false);
    }
  }

  const processarFilaLocal = async () => {
    console.log('Processando fila local...');
    setIsProcessing(true);

    try {
      // Marcar todas as etiquetas como impressas
      const ids = filaItens.map(item => item.id);
      console.log('IDs das etiquetas:', ids);
      
      await labelsService.markAsPrinted(ids);
      console.log('Etiquetas marcadas como impressas');
      
      // Atualizar estado local
      setFilaItens([]);
      
      toast.success(`${filaItens.length} etiqueta(s) enviada(s) para impressão!`);
    } catch (error) {
      console.error('Erro ao processar fila de impressão:', error);
      toast.error('Erro ao processar fila de impressão');
    } finally {
      setIsProcessing(false);
    }
  }

  const getConservacaoInfo = (tipo?: 'ambiente' | 'refrigerado' | 'congelado') => {
    const info = {
      ambiente: { icon: House, label: 'Ambiente', color: 'text-green-500' },
      refrigerado: { icon: Thermometer, label: 'Refrigerado', color: 'text-blue-500' },
      congelado: { icon: Snowflake, label: 'Congelado', color: 'text-cyan-500' }
    }
    return info[tipo || 'ambiente'] || info.ambiente
  }

  // Função para criar card de informação (igual ao Flutter)
  const buildInfoCard = (title: string, value: string, icon: any, color: string) => {
    const IconComponent = icon
    return (
      <div className={`p-4 ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-200'} rounded-xl`}>
        <div className="flex flex-col items-center text-center space-y-2">
          <IconComponent size={24} className={color} />
          <span className={`text-xs ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
            {title}
          </span>
          <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
            {value}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'}`}>
      {/* Conteúdo Principal - Exatamente como no Flutter */}
      <main className="pt-5 px-5 pb-32">
        {/* Título da tela - Como no Flutter */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Printer size={28} className="text-primary" />
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              Impressão
            </h1>
          </div>
          
          {/* Responsável */}
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
              Responsável:
            </span>
            <button
              onClick={showOperatorSelection}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                selectedOperator
                  ? 'bg-primary text-white border-primary'
                  : theme === 'dark'
                  ? 'border-dark-600 text-dark-300 hover:border-dark-500'
                  : 'border-light-300 text-dark-600 hover:border-dark-400'
              }`}
            >
              <User size={16} />
              <span className="font-medium">
                {selectedOperator ? selectedOperator.name : 'Selecionar'}
              </span>
              <UserSwitch size={14} />
            </button>
          </div>
        </div>

        {/* Status WebSocket */}
        {isWebSocketConnected && (
          <div className={`p-4 rounded-xl mb-6 border-2 ${
            connectedAgents.length > 0 
              ? 'bg-green-600 border-green-700' 
              : 'bg-yellow-600 border-yellow-700'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  connectedAgents.length > 0 ? 'bg-white animate-pulse' : 'bg-white'
                }`}></div>
                <div>
                  <div className="font-semibold text-white">
                    🚀 WebSocket Ativo
                  </div>
                  <div className="text-sm text-white/90">
                    {connectedAgents.length > 0 
                      ? `${connectedAgents.length} Print Agent(s) conectado(s) - Impressão em tempo real`
                      : 'WebSocket conectado, aguardando Print Agents'
                    }
                  </div>
                </div>
              </div>
              {Object.keys(jobStatus).length > 0 && (
                <div className="text-sm font-medium text-white">
                  {Object.keys(jobStatus).length} job(s) ativo(s)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Jobs em Tempo Real */}
        {Object.keys(jobStatus).length > 0 && (
          <div className={`p-4 rounded-xl mb-6 border-2 ${
            theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                📊 Jobs de Impressão em Tempo Real
              </h3>
              <button
                onClick={() => {
                  clearCompletedJobs();
                  toast.success('Jobs concluídos removidos');
                }}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Limpar Concluídos
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(jobStatus).map(([jobId, status]) => (
                <div key={jobId} className={`p-3 rounded-lg border ${
                  theme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        status.status === 'completed' ? 'bg-green-500' :
                        status.status === 'error' ? 'bg-red-500' :
                        status.status === 'printing' ? 'bg-blue-500 animate-pulse' :
                        'bg-yellow-500'
                      }`}></div>
                      <div>
                        <div className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                          Job {jobId.slice(-8)}
                        </div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          Agent: {status.agentFingerprint?.slice(-8)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        status.status === 'completed' ? 'text-green-600' :
                        status.status === 'error' ? 'text-red-600' :
                        status.status === 'printing' ? 'text-blue-600' :
                        'text-yellow-600'
                      }`}>
                        {status.status === 'completed' && '✅ Concluído'}
                        {status.status === 'error' && '❌ Erro'}
                        {status.status === 'printing' && '🖨️ Imprimindo'}
                        {status.status === 'received' && '📥 Recebido'}
                      </div>
                      {status.error && (
                        <div className="text-xs text-red-500 mt-1">
                          {status.error}
                        </div>
                      )}
                      {status.printedAt && (
                        <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(status.printedAt).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status da Impressora - Exatamente como no Flutter */}
        <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
          Status da Impressora
        </h2>

        <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border rounded-2xl p-5 mb-6`}>
          {/* Status principal */}
          <div className="flex items-center space-x-4 mb-5">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle size={24} className="text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Impressora Conectada
              </h3>
              <p className={`${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                Zebra ZD420
              </p>
            </div>
          </div>

          {/* Informações da impressora */}
          <div className="grid grid-cols-2 gap-3">
            {buildInfoCard('Papel', 'Disponível', Square, 'text-blue-500')}
            {buildInfoCard('Temperatura', 'Normal', Warning, 'text-orange-500')}
          </div>
        </div>

        {/* Fila de Impressão - Exatamente como no Flutter */}
        <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
          Fila de Impressão
        </h2>

        {/* Lista da fila */}
        <div className="space-y-3">
          {filaItens.length === 0 ? (
            // Estado vazio
            <div className="text-center py-12">
              <Clock size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-dark-600' : 'text-dark-400'}`} />
              <p className={`text-lg ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                Nenhuma etiqueta na fila
              </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-500' : 'text-dark-500'} mt-2`}>
                Adicione produtos para começar a imprimir
              </p>
              <button
                onClick={() => navigate('/etiquetas/validade')}
                className="mt-4 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Adicionar Produtos
              </button>
            </div>
          ) : (
            // Lista de itens - Como no Flutter
            <>
              {filaItens.map((item, index) => {
                const conservacaoInfo = getConservacaoInfo(item.conservationType)
                const ConservacaoIcon = conservacaoInfo.icon
                
                return (
                  <div
                    key={item.id}
                    className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border rounded-2xl p-4 mb-3`}
                  >
                    <div className="flex items-center space-x-4">
                      {/* Ícone da etiqueta */}
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Tag size={24} className="text-primary" />
                      </div>
                      
                      {/* Informações do item */}
                      <div className="flex-1">
                        <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                          Etiqueta {index + 1}
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                          {item.product.name} - {item.quantity} unidade(s)
                        </p>
                        {item.weight && (
                          <p className={`text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-dark-500'}`}>
                            {item.weight} {item.unit}
                          </p>
                        )}
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center space-x-1">
                            <ConservacaoIcon size={14} className={conservacaoInfo.color} />
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                              {conservacaoInfo.label}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/20 px-2 py-1 rounded-md">
                              <Clock size={14} className="text-green-600 dark:text-green-400" />
                              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                Prod: {new Date(item.productionDate).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded-md">
                              <Warning size={14} className="text-orange-600 dark:text-orange-400" />
                              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                Val: {new Date(item.validityDate).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status */}
                      <div className="bg-primary/20 px-2 py-1 rounded-xl">
                        <span className="text-primary text-xs font-semibold">
                          {item.status === 'pending' ? 'Pendente' : item.status === 'printed' ? 'Impresso' : 'Falhou'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {/* Seleção de impressora (se Tagment pronto) */}
              {systemStatus.isReady && tagmentPrinters.length > 0 && (
                <div className="mb-6">
                  <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    Selecionar Impressora
                  </label>
                  <select
                    value={selectedPrinter || ''}
                    onChange={(e) => setSelectedPrinter(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      theme === 'dark' 
                        ? 'bg-dark-700 border-dark-600 text-white' 
                        : 'bg-white border-light-300 text-dark-900'
                    }`}
                  >
                    <option value="">Selecione uma impressora</option>
                    {tagmentPrinters.map((printer) => (
                      <option key={printer.id} value={printer.id}>
                        {printer.displayName} - {printer.connection.host}:{printer.connection.port} ({printer.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status da integração Tagment */}
              <div className="mb-6">
                <TagmentStatus 
                  showDetails={true}
                  onConfigure={() => setShowTagmentIntegration(true)}
                />
              </div>
              
              {/* Botões de ação */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={limparFila}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                >
                  Limpar Fila
                </button>
                <button
                  onClick={() => {
                    console.log('Botão de impressão clicado!');
                    processarFila();
                  }}
                  disabled={isProcessing || (isTagmentConnected && !selectedPrinter)}
                  className={`flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2 ${
                    isProcessing || (isTagmentConnected && !selectedPrinter) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <Printer size={20} />
                      <span>
                        {isWebSocketConnected && connectedAgents.length > 0 
                          ? `🚀 Imprimir via WebSocket (${filaItens.length})` 
                          : isTagmentConnected 
                            ? `📡 Imprimir via Tagment (${filaItens.length})` 
                            : `💾 Imprimir Local (${filaItens.length})`
                        }
                      </span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer Navigation */}
      <FooterNavigation />
      
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
                  <X size={24} />
                </button>
              </div>
              
              <TagmentIntegration 
                onConnect={() => setShowTagmentIntegration(false)}
                onDisconnect={() => setShowTagmentIntegration(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seleção de Operador */}
      {showOperatorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Selecionar Responsável
              </h2>
              <button
                onClick={() => setShowOperatorModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-dark-700 text-dark-300' 
                    : 'hover:bg-light-100 text-dark-600'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            {operators.length === 0 ? (
              <div className="text-center py-8">
                <User size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-dark-400' : 'text-light-400'}`} />
                <p className={`${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'} mb-4`}>
                  Nenhum operador cadastrado
                </p>
                <button
                  onClick={() => {
                    setShowOperatorModal(false)
                    navigate('/cadastro/operadores')
                  }}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Cadastrar Operadores
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {operators.filter(op => op.isActive).map((operator) => (
                  <div
                    key={operator.id}
                    className={`p-4 rounded-xl border transition-colors ${
                      selectedOperator?.id === operator.id
                        ? 'border-primary bg-primary/10'
                        : theme === 'dark'
                        ? 'border-dark-600 hover:border-dark-500'
                        : 'border-light-300 hover:border-light-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedOperator?.id === operator.id ? 'bg-primary text-white' : 'bg-green-100'
                        }`}>
                          <User size={20} className={selectedOperator?.id === operator.id ? 'text-white' : 'text-green-600'} />
                        </div>
                        <div>
                          <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                            {operator.name}
                          </h3>
                          {operator.department && (
                            <p className={`text-sm ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                              {operator.department}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {selectedOperator?.id === operator.id ? (
                        <CheckCircle size={24} className="text-primary" />
                      ) : (
                        <button
                          onClick={() => {
                            // Se não há PIN ou é o mesmo operador, seleciona direto
                            if (!operator.pin || selectedOperator?.id === operator.id) {
                              handleOperatorSelect(operator)
                            } else {
                              // Mostrar input de PIN
                              const pinModal = document.createElement('div')
                              pinModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4'
                              pinModal.innerHTML = `
                                <div class="${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-sm">
                                  <h3 class="text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'} mb-4">
                                    PIN de ${operator.name}
                                  </h3>
                                  <p class="text-sm ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'} mb-4">
                                    Digite o PIN de 4 dígitos:
                                  </p>
                                  <input
                                    type="password"
                                    id="pinInput"
                                    maxlength="4"
                                    class="w-full px-3 py-2 rounded-lg border text-center text-lg font-mono ${
                                      theme === 'dark'
                                        ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                                        : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                                    } focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="0000"
                                  />
                                  <div class="flex space-x-3 mt-6">
                                    <button
                                      id="cancelPin"
                                      class="flex-1 px-4 py-2 rounded-lg border ${
                                        theme === 'dark'
                                          ? 'border-dark-600 text-dark-300 hover:bg-dark-700'
                                          : 'border-light-300 text-dark-600 hover:bg-light-50'
                                      }"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      id="confirmPin"
                                      class="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
                                    >
                                      Confirmar
                                    </button>
                                  </div>
                                </div>
                              `
                              
                              document.body.appendChild(pinModal)
                              
                              const pinInputEl = pinModal.querySelector('#pinInput') as HTMLInputElement
                              const cancelBtn = pinModal.querySelector('#cancelPin')
                              const confirmBtn = pinModal.querySelector('#confirmPin')
                              
                              pinInputEl.focus()
                              
                              const cleanup = () => {
                                document.body.removeChild(pinModal)
                              }
                              
                              cancelBtn?.addEventListener('click', cleanup)
                              
                              confirmBtn?.addEventListener('click', async () => {
                                const pin = pinInputEl.value
                                if (pin.length === 4) {
                                  const isValid = await validatePin(operator.id, pin)
                                  if (isValid) {
                                    handleOperatorSelect(operator)
                                    cleanup()
                                  } else {
                                    pinInputEl.value = ''
                                    pinInputEl.style.borderColor = 'red'
                                    toast.error('PIN incorreto')
                                  }
                                }
                              })
                              
                              pinInputEl.addEventListener('input', (e) => {
                                const target = e.target as HTMLInputElement
                                target.value = target.value.replace(/\D/g, '').slice(0, 4)
                                target.style.borderColor = ''
                              })
                            }
                          }}
                          className="bg-primary text-white px-3 py-1 rounded-lg text-sm hover:bg-primary/90 transition-colors"
                        >
                          Selecionar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
