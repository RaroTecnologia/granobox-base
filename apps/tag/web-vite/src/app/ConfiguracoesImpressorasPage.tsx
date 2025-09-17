import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTagment } from '@/hooks/useTagment'
import { printersService, GranoboxPrinter } from '@/services/printersService'
import { TagmentPrinter } from '@/services/tagmentService'
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
  const tagmentHook = useTagment()
  const { 
    isConnected: isTagmentConnected, 
    printers: tagmentPrinters, 
    loadPrinters,
    reloadPrinters
  } = tagmentHook

  // Debug completo do hook
  useEffect(() => {
    console.log('🔍 DEBUG COMPLETO DO HOOK useTagment:');
    console.log('  - tagmentHook completo:', tagmentHook);
    console.log('  - isTagmentConnected:', isTagmentConnected);
    console.log('  - tagmentPrinters:', tagmentPrinters);
    console.log('  - tagmentPrinters.length:', tagmentPrinters?.length);
    console.log('  - typeof tagmentPrinters:', typeof tagmentPrinters);
    console.log('  - Array.isArray(tagmentPrinters):', Array.isArray(tagmentPrinters));
    
    // Forçar re-render se necessário
    if (tagmentPrinters && tagmentPrinters.length > 0) {
      console.log('🔄 FORÇANDO RE-RENDER - Impressoras encontradas!');
    }
  }, [tagmentHook, isTagmentConnected, tagmentPrinters]);
  
  // Debug: log das impressoras do Tagment
  useEffect(() => {
    console.log('🖼️ ConfiguracoesImpressorasPage - tagmentPrinters:', tagmentPrinters);
    console.log('🖼️ Quantidade de impressoras:', tagmentPrinters.length);
    console.log('🖼️ isTagmentConnected:', isTagmentConnected);
    tagmentPrinters.forEach((printer, index) => {
      console.log(`🖼️ Impressora ${index + 1}:`, {
        id: printer.id,
        name: printer.name,
        displayName: printer.displayName,
        status: printer.status
      });
    });
  }, [tagmentPrinters]);
  
  // Função de debug para testar API
  const debugApi = async () => {
    if (!user?.clientId) {
      console.log('🐛 DEBUG: Usuário ou clientId não encontrado');
      return;
    }
    
    try {
      console.log('🐛 DEBUG: === INICIANDO TESTES COMPLETOS DA API ===');
      
      // Teste 1: Buscar dados do cliente
      console.log('🐛 DEBUG: 1. Testando endpoint /clients/' + user.clientId);
      const response = await fetch(`http://localhost:3001/clients/${user.clientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🐛 DEBUG: Status da resposta:', response.status);
      
      if (!response.ok) {
        console.log('🐛 DEBUG: Erro na resposta:', await response.text());
        return;
      }

      const client = await response.json();
      console.log('🐛 DEBUG: Dados do cliente:', client);
      
      const apiKey = client.tagmentApiKey;
      console.log('🐛 DEBUG: 2. API Key encontrada:', !!apiKey, apiKey ? `(${apiKey.substring(0, 10)}...)` : '');
      
      if (!apiKey) {
        console.log('🐛 DEBUG: ❌ Sem API Key - não é possível testar Tagment');
        return;
      }

      // Teste 2: Auth info
      console.log('🐛 DEBUG: 3. Testando autenticação Tagment...');
      const authResponse = await fetch('https://api.tagment.com.br/v1/auth/info', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const authData = await authResponse.json();
      console.log('🐛 DEBUG: Auth info:', authData);

      // Teste 3: Endpoint /v1/printers
      console.log('🐛 DEBUG: 4. Testando /v1/printers...');
      const printersResponse = await fetch('https://api.tagment.com.br/v1/printers', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      const printersData = await printersResponse.json();
      console.log('🐛 DEBUG: Resposta /v1/printers:', printersData);

      // Teste 4: Se há customerId, testar endpoint específico
      if (client.tagmentCustomerId) {
        console.log('🐛 DEBUG: 5. Testando por customerId:', client.tagmentCustomerId);
        const customerResponse = await fetch(`https://api.tagment.com.br/v1/printers/customer/${client.tagmentCustomerId}`, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const customerData = await customerResponse.json();
        console.log('🐛 DEBUG: Resposta por customer:', customerData);
      } else {
        console.log('🐛 DEBUG: 5. ⚠️ Cliente não tem tagmentCustomerId configurado');
      }

      // Teste 5: Forçar reload das impressoras
      console.log('🐛 DEBUG: 6. Forçando reload das impressoras...');
      await reloadPrinters();

      console.log('🐛 DEBUG: === TESTES CONCLUÍDOS ===');
      
    } catch (error) {
      console.error('🐛 DEBUG: Erro na requisição:', error);
    }
  };

  // REMOVIDO: Não vamos mais carregar impressoras locais
  // Agora usamos apenas impressoras do Tagment como fonte única
  // useEffect(() => {
  //   console.log('🔄 useEffect 1: Carregando impressoras locais do Granobox...');
  //   loadGranoboxPrinters();
  // }, [user?.clientId]);
  
  const [granoboxPrinters, setGranoboxPrinters] = useState<GranoboxPrinter[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showTagmentIntegration, setShowTagmentIntegration] = useState(false)
  const [displayPrinters, setDisplayPrinters] = useState<TagmentPrinter[]>([])

  // Sincronizar displayPrinters com tagmentPrinters
  useEffect(() => {
    console.log('🔄 SINCRONIZANDO displayPrinters com tagmentPrinters');
    console.log('  - tagmentPrinters:', tagmentPrinters);
    console.log('  - tagmentPrinters.length:', tagmentPrinters.length);
    console.log('  - Array.isArray(tagmentPrinters):', Array.isArray(tagmentPrinters));
    
    if (tagmentPrinters && tagmentPrinters.length > 0) {
      console.log('  - ✅ Atualizando displayPrinters com', tagmentPrinters.length, 'impressoras');
      setDisplayPrinters([...tagmentPrinters]);
    } else {
      console.log('  - ⚠️ tagmentPrinters vazio, mantendo displayPrinters atual');
      setDisplayPrinters([]);
    }
  }, [tagmentPrinters]);
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
      console.log('🏪 Carregando impressoras locais do Granobox para cliente:', user.clientId);
      const response = await printersService.getPrinters(user.clientId)
      console.log('🏪 Impressoras locais carregadas do Granobox:', response.length, 'impressoras:', response);
      setGranoboxPrinters(response)
      
      // Log detalhado de cada impressora
      response.forEach((printer, index) => {
        console.log(`🏪 Impressora local ${index + 1}:`, {
          id: printer.id,
          tagmentId: printer.tagmentId,
          location: printer.location,
          isActive: printer.isActive,
          usage: printer.usage,
          createdAt: printer.createdAt,
          updatedAt: printer.updatedAt
        });
      });
      
      // Resumo final
      console.log('📊 RESUMO FINAL:');
      console.log(`   • Impressoras locais (Granobox): ${response.length}`);
      console.log(`   • Impressoras Tagment: ${tagmentPrinters.length}`);
      console.log(`   • Interface vai mostrar: ${response.length} impressora(s) local(is)`);
    } catch (error) {
      console.error('❌ Erro ao carregar impressoras locais:', error)
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

  // Teste de impressão direta no Tagment (Nova Arquitetura)
  const testPrintTagment = async (printer: TagmentPrinter) => {
    try {
      setIsLoading(true)
      
      console.log('🖨️ NOVA ARQUITETURA: Teste de impressão Tagment direto...')
      console.log('🎯 Impressora:', printer.displayName || printer.id)
      
      // Verificar se há agentes conectados
      if (connectedAgents.length === 0) {
        toast.error('Nenhum Print Agent conectado. Conecte o Tagment Agent primeiro.');
        return;
      }

      // Verificar se a impressora está online
      if (printer.status !== 'online') {
        toast.error(`Impressora ${printer.displayName} está ${printer.status}. Verifique a conexão.`);
        return;
      }
      
      // Dados de teste
      const testData = {
        NOME_DO_PRODUTO: 'TESTE DE IMPRESSÃO - GRANOBOX',
        MARCA_VALOR: 'Sistema Granobox (Nova Arquitetura)',
        QR_CODE: `https://granobox.com.br/teste/${Date.now()}`
      };

      console.log('📄 Dados do teste:', testData);
      
      // Template ID real do Tagment
      const testTemplateId = '1c12926f-849b-4bd7-8a61-05036f39f443';
      
      // Gerar ZPL via API
      console.log('📄 Gerando ZPL via API...');
      const zplResult = await sendPrintJob(testTemplateId, testData, undefined, 'high');
      
      if (!zplResult || !zplResult.zpl) {
        toast.error('❌ Falha ao gerar ZPL para teste');
        return;
      }

      console.log('✅ ZPL gerado com sucesso');
      
      // Usar o nome da impressora para o WebSocket
      const printerIdentifier = printer.displayName || printer.externalPrinterRef || 'default';
      
      // Enviar via WebSocket para o primeiro agente conectado
      const agentFingerprint = connectedAgents[0];
      console.log('📡 Enviando via WebSocket para:', printerIdentifier);
      
      const wsResult = await sendCustomJobWebSocket(agentFingerprint, {
        printerId: printerIdentifier,
        zplData: zplResult.zpl,
        priority: 'high',
        metadata: {
          testJob: true,
          printerName: printer.displayName,
          clientId: user?.clientId,
          architecture: 'tagment_only'
        }
      });
      
      if (wsResult.success) {
        toast.success(`✅ Teste enviado para ${printer.displayName}!`);
        console.log('✅ Job de teste enviado via WebSocket:', wsResult.jobId);
      } else {
        toast.error('❌ Falha ao enviar teste via WebSocket: ' + wsResult.message);
      }
      
    } catch (error: any) {
      console.error('❌ Erro no teste de impressão:', error)
      toast.error(`Erro no teste: ${error.message || 'Erro desconhecido'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Inicializar (REMOVIDO - DUPLICADO)
  // useEffect(() => {
  //   console.log('🔄 useEffect 2 (DUPLICADO): Carregando impressoras locais do Granobox...');
  //   loadGranoboxPrinters()
  // }, [user?.clientId])

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
              <p className="text-primary text-sm">Gerenciamento direto via Tagment - Fonte única de dados</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isTagmentConnected ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={reloadPrinters}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <ArrowClockwise size={16} className={isLoading ? 'animate-spin' : ''} />
                  <span>Atualizar Lista</span>
                </button>
                    <button
                      onClick={debugApi}
                      className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                    >
                      Debug API
                    </button>
                    <button
                      onClick={() => {
                        console.log('🧹 Limpando cache e forçando reload...');
                        localStorage.removeItem('tagment_api_key');
                        window.location.reload();
                      }}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                      Limpar Cache
                    </button>
                    <button
                      onClick={() => {
                        console.log('🔧 TESTE FORÇADO - Dados atuais:');
                        console.log('  - tagmentPrinters:', tagmentPrinters);
                        console.log('  - displayPrinters:', displayPrinters);
                        console.log('  - isTagmentConnected:', isTagmentConnected);
                        
                        // Forçar atualização
                        if (tagmentPrinters.length > 0) {
                          console.log('🔧 Forçando atualização de displayPrinters...');
                          setDisplayPrinters([...tagmentPrinters]);
                        }
                      }}
                      className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                    >
                      Teste Render
                    </button>
              </div>
            ) : (
              <button
                onClick={() => setShowTagmentIntegration(true)}
                className="px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-lg transition-colors flex items-center space-x-2"
              >
                <Key size={16} />
                <span>Conectar ao Tagment</span>
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

          {/* Explicação da nova arquitetura */}
          <div className={`mx-6 mb-4 p-4 rounded-lg border ${
            theme === 'dark' ? 'bg-green-900/20 border-green-700/50' : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-start space-x-3">
              <div className="text-green-500 mt-1">✨</div>
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-green-200' : 'text-green-700'}`}>
                  <strong>Nova Arquitetura - Tagment como Fonte Única:</strong>
                </p>
                <ul className={`text-xs mt-1 space-y-1 ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}>
                  <li>• <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800 mr-1">Online</span> Impressora conectada e pronta para uso</li>
                  <li>• <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-800 mr-1">Offline</span> Impressora desconectada ou com problemas</li>
                  <li>• Dados sempre sincronizados com o sistema Tagment</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Lista de Impressoras */}
          <div className={`p-6 rounded-xl border-2 ${
            theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Impressoras Tagment
              </h2>
              <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                {displayPrinters.length} impressora(s)
              </span>
            </div>

            {displayPrinters.length === 0 ? (
              <div className={`p-8 text-center rounded-lg ${
                theme === 'dark' ? 'bg-dark-700' : 'bg-light-50'
              }`}>
                <Printer size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-dark-600' : 'text-dark-400'}`} />
                <p className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Nenhuma impressora encontrada no Tagment
                </p>
                <p className={`text-sm mt-2 mb-4 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  {isTagmentConnected ? 
                    'A API do Tagment não retornou impressoras. Verifique se há impressoras cadastradas na sua conta.' :
                    'Conecte-se ao Tagment para visualizar suas impressoras'
                  }
                </p>
                {isTagmentConnected ? (
                  <div className="flex flex-col items-center space-y-2">
                    <button
                      onClick={reloadPrinters}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                    >
                      <ArrowClockwise size={16} />
                      <span>Recarregar</span>
                    </button>
                    <button
                      onClick={debugApi}
                      className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                    >
                      Debug API
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowTagmentIntegration(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <Key size={16} />
                    <span>Conectar ao Tagment</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {displayPrinters.map((printer, index) => {
                  console.log(`🖼️ RENDERIZAÇÃO: Renderizando impressora ${index + 1}:`, printer.name || printer.displayName);
                  const isOnline = printer.status === 'online';
                  
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
                                {printer.displayName || `Impressora ${printer.id.slice(0, 8)}`}
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
                            onClick={() => testPrintTagment(printer)}
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
                              // TODO: Implementar configurações específicas da impressora Tagment
                              toast.info('Configurações da impressora são gerenciadas pelo Tagment')
                            }}
                            className={`p-2 rounded-lg transition-colors ${
                              theme === 'dark' ? 'text-dark-400 hover:bg-dark-600' : 'text-dark-600 hover:bg-light-100'
                            }`}
                            title="Ver detalhes da impressora"
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

        {/* Impressoras Tagment Disponíveis */}
        {isTagmentConnected && tagmentPrinters.length > 0 && (
          <div className={`mx-6 mb-6 p-6 rounded-xl border ${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Impressoras Tagment Disponíveis
              </h2>
              <div className="flex items-center space-x-3">
                <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  {tagmentPrinters.length} impressora(s) encontrada(s)
                </span>
                <button
                  onClick={() => reloadPrinters()}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center space-x-1"
                >
                  <ArrowClockwise size={14} />
                  <span>Recarregar</span>
                </button>
                <button
                  onClick={debugApi}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Debug API
                </button>
              </div>
            </div>
            
            <div className="grid gap-3">
              {tagmentPrinters.map((tagmentPrinter) => {
                // Verificar se já está configurada no GranoBox
                const isConfigured = granoboxPrinters.some(gp => gp.tagmentId === tagmentPrinter.id);
                
                return (
                  <div
                    key={tagmentPrinter.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isConfigured 
                        ? theme === 'dark' ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'
                        : theme === 'dark' ? 'bg-dark-700 border-dark-600 hover:border-dark-500' : 'bg-light-50 border-light-200 hover:border-light-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          tagmentPrinter.status === 'online' ? 'bg-green-500' : 
                          tagmentPrinter.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                        <div>
                          <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                            {tagmentPrinter.displayName || tagmentPrinter.name}
                          </h3>
                          <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                            {tagmentPrinter.connection ? 
                              `${tagmentPrinter.connection.host}:${tagmentPrinter.connection.port}` : 
                              `ID: ${tagmentPrinter.id.slice(0, 8)}`
                            }
                          </p>
                          <p className={`text-xs ${theme === 'dark' ? 'text-dark-500' : 'text-dark-500'}`}>
                            Status: {tagmentPrinter.status} • Hoje: {tagmentPrinter.printsToday || 0} impressões
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {isConfigured ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Configurada
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              // Pré-preencher formulário com dados da impressora Tagment
                              setFormData({
                                location: tagmentPrinter.externalLocationId || '',
                                usage: ['validity'], // Padrão para validade
                                notes: `Sincronizada do Tagment: ${tagmentPrinter.displayName || tagmentPrinter.name}`,
                                isActive: tagmentPrinter.status === 'online'
                              });
                              setEditingPrinter({
                                id: '',
                                tagmentId: tagmentPrinter.id,
                                location: tagmentPrinter.externalLocationId || '',
                                usage: ['validity'],
                                isActive: tagmentPrinter.status === 'online',
                                notes: '',
                                clientId: user?.clientId || '',
                                createdAt: '',
                                updatedAt: ''
                              });
                              setShowForm(true);
                            }}
                            className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                          >
                            + Configurar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
