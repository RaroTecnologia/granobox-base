'use client'

import { 
  Tag, 
  ArrowLeft,
  Printer,
  Plus,
  Clock,
  Check,
  X,
  Trash,
  Play,
  Pause,
  Queue,
  Eye,
  Cube
} from '@phosphor-icons/react'
import { useState, useEffect } from 'react'

interface EtiquetaFila {
  id: string
  nome: string
  codigo: string
  segmento: string
  categoria: string
  quantidade: string
  unidade: string
  dataValidade: string
  observacoes: string
  foto?: string
  timestamp: Date
  status: 'pendente' | 'imprimindo' | 'concluida' | 'erro'
  prioridade: 'baixa' | 'normal' | 'alta'
}

export default function FilaImpressaoPage() {
  const [fila, setFila] = useState<EtiquetaFila[]>([])
  const [isPrinting, setIsPrinting] = useState(false)
  const [printQueue, setPrintQueue] = useState(false)
  const [selectedEtiqueta, setSelectedEtiqueta] = useState<EtiquetaFila | null>(null)

  // Carregar fila do localStorage
  useEffect(() => {
    const filaSalva = localStorage.getItem('filaImpressao')
    if (filaSalva) {
      try {
        const filaParsed = JSON.parse(filaSalva)
        // Converter timestamps de volta para Date objects
        const filaComTimestamps = filaParsed.map((item: { timestamp: string; [key: string]: unknown }) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
        setFila(filaComTimestamps)
      } catch (error) {
        console.error('Erro ao carregar fila:', error)
        setFila([])
      }
    }
  }, [])

  const handlePrintQueue = async () => {
    setIsPrinting(true)
    setPrintQueue(true)
    
    // Simular impressão da fila
    for (let i = 0; i < fila.length; i++) {
      const etiqueta = fila[i]
      
      // Atualizar status para imprimindo
      setFila(prev => {
        const novaFila = prev.map(e => 
          e.id === etiqueta.id ? { ...e, status: 'imprimindo' as const } : e
        )
        localStorage.setItem('filaImpressao', JSON.stringify(novaFila))
        return novaFila
      })
      
      // Simular tempo de impressão (2 segundos por etiqueta)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Atualizar status para concluída
      setFila(prev => {
        const novaFila = prev.map(e => 
          e.id === etiqueta.id ? { ...e, status: 'concluida' as const } : e
        )
        localStorage.setItem('filaImpressao', JSON.stringify(novaFila))
        return novaFila
      })
    }
    
    setIsPrinting(false)
    setPrintQueue(false)
    
    // Limpar fila após 3 segundos
    setTimeout(() => {
      setFila([])
    }, 3000)
  }

  const handlePrintSingle = async (etiqueta: EtiquetaFila) => {
    setFila(prev => {
              const novaFila = prev.map(e => 
          e.id === etiqueta.id ? { ...e, status: 'imprimindo' as const } : e
        )
      localStorage.setItem('filaImpressao', JSON.stringify(novaFila))
      return novaFila
    })
    
    // Simular impressão (2 segundos)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Remover da fila
    setFila(prev => {
      const novaFila = prev.filter(e => e.id !== etiqueta.id)
      localStorage.setItem('filaImpressao', JSON.stringify(novaFila))
      return novaFila
    })
  }

  const handleRemoveFromQueue = (id: string) => {
    setFila(prev => {
      const novaFila = prev.filter(e => e.id !== id)
      localStorage.setItem('filaImpressao', JSON.stringify(novaFila))
      return novaFila
    })
  }

  const handleChangePriority = (id: string, prioridade: 'baixa' | 'normal' | 'alta') => {
    setFila(prev => {
      const novaFila = prev.map(e => 
        e.id === id ? { ...e, prioridade } : e
      )
      localStorage.setItem('filaImpressao', JSON.stringify(novaFila))
      return novaFila
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'text-yellow-400'
      case 'imprimindo': return 'text-blue-400'
      case 'concluida': return 'text-green-400'
      case 'erro': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return <Clock size={20} weight="duotone" />
      case 'imprimindo': return <Printer size={20} weight="duotone" />
      case 'concluida': return <Check size={20} weight="duotone" />
      case 'erro': return <X size={20} weight="duotone" />
      default: return <Clock size={20} weight="duotone" />
    }
  }

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'baixa': return 'bg-gray-500'
      case 'normal': return 'bg-blue-500'
      case 'alta': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return 'Agora'
    if (minutes === 1) return '1 min atrás'
    return `${minutes} min atrás`
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header Fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-dark-950/95 backdrop-blur-sm border-b border-dark-600 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <a href="/etiquetas" className="p-2 text-dark-400 hover:text-white transition-colors">
              <ArrowLeft size={24} weight="duotone" />
            </a>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Queue size={24} weight="duotone" className="text-white" />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">Fila de Impressão</h1>
              <p className="text-primary text-sm">Gerencie suas etiquetas para impressão</p>
            </div>
          </div>
          
          {/* Botão Imprimir Fila */}
          <button
            onClick={handlePrintQueue}
            disabled={isPrinting || fila.length === 0}
            className="bg-primary hover:bg-primary-600 disabled:bg-primary-700 text-white px-6 py-2 rounded-full font-medium transition-colors shadow-lg flex items-center space-x-2"
          >
            {isPrinting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Imprimindo...</span>
              </>
            ) : (
              <>
                <Printer size={20} weight="duotone" />
                <span>Imprimir Fila ({fila.length})</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="pt-32 px-6 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Estatísticas da Fila */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Queue size={24} weight="duotone" className="text-blue-400" />
                </div>
                <div>
                  <p className="text-dark-400 text-sm">Total na Fila</p>
                  <p className="text-white text-2xl font-bold">{fila.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Clock size={24} weight="duotone" className="text-yellow-400" />
                </div>
                <div>
                  <p className="text-dark-400 text-sm">Pendentes</p>
                  <p className="text-white text-2xl font-bold">
                    {fila.filter(e => e.status === 'pendente').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Printer size={24} weight="duotone" className="text-blue-400" />
                </div>
                <div>
                  <p className="text-dark-400 text-sm">Imprimindo</p>
                  <p className="text-white text-2xl font-bold">
                    {fila.filter(e => e.status === 'imprimindo').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check size={24} weight="duotone" className="text-green-400" />
                </div>
                <div>
                  <p className="text-dark-400 text-sm">Concluídas</p>
                  <p className="text-white text-2xl font-bold">
                    {fila.filter(e => e.status === 'concluida').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista da Fila */}
          <div className="bg-dark-800 rounded-3xl p-8 border border-dark-700 shadow-2xl">
            <h2 className="text-white text-2xl font-bold mb-6 flex items-center space-x-3">
              <Queue size={28} weight="duotone" className="text-primary" />
              <span>Etiquetas na Fila</span>
            </h2>
            
            {fila.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Queue size={48} weight="duotone" className="text-dark-400" />
                </div>
                <h3 className="text-white text-xl font-semibold mb-2">Fila Vazia</h3>
                <p className="text-dark-400">Nenhuma etiqueta aguardando impressão</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fila.map((etiqueta) => (
                  <div
                    key={etiqueta.id}
                    className="bg-dark-700 rounded-2xl p-6 border border-dark-600 hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Status */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStatusColor(etiqueta.status)}`}>
                          {getStatusIcon(etiqueta.status)}
                        </div>
                        
                        {/* Foto do Item */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-dark-600 border border-dark-500">
                          {etiqueta.foto ? (
                            <>
                              <img 
                                src={etiqueta.foto} 
                                alt={etiqueta.nome}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  target.nextElementSibling?.classList.remove('hidden')
                                }}
                              />
                              <div className="w-full h-full bg-primary/20 rounded-xl flex items-center justify-center hidden">
                                <Cube size={24} weight="duotone" className="text-primary" />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full bg-primary/20 rounded-xl flex items-center justify-center">
                              <Cube size={24} weight="duotone" className="text-primary" />
                            </div>
                          )}
                        </div>
                        
                        {/* Informações da Etiqueta */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-white font-semibold">{etiqueta.nome}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getPriorityColor(etiqueta.prioridade)}`}>
                              {etiqueta.prioridade}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-dark-400">Código:</span>
                              <span className="text-white ml-2 font-mono">{etiqueta.codigo}</span>
                            </div>
                            <div>
                              <span className="text-dark-400">Quantidade:</span>
                              <span className="text-white ml-2">{etiqueta.quantidade} {etiqueta.unidade}</span>
                            </div>
                            <div>
                              <span className="text-dark-400">Categoria:</span>
                              <span className="text-white ml-2">{etiqueta.categoria}</span>
                            </div>
                            <div>
                              <span className="text-dark-400">Adicionada:</span>
                              <span className="text-white ml-2">{formatTimestamp(etiqueta.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Ações */}
                      <div className="flex items-center space-x-2">
                        {etiqueta.status === 'pendente' && (
                          <>
                            <button
                              onClick={() => handlePrintSingle(etiqueta)}
                              className="p-2 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                              title="Imprimir Agora"
                            >
                              <Play size={20} weight="duotone" />
                            </button>
                            
                            <select
                              value={etiqueta.prioridade}
                              onChange={(e) => handleChangePriority(etiqueta.id, e.target.value as 'baixa' | 'normal' | 'alta')}
                              className="px-3 py-1 bg-dark-600 border border-dark-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="baixa">Baixa</option>
                              <option value="normal">Normal</option>
                              <option value="alta">Alta</option>
                            </select>
                          </>
                        )}
                        
                        <button
                          onClick={() => handleRemoveFromQueue(etiqueta.id)}
                          className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                          title="Remover da Fila"
                        >
                          <Trash size={20} weight="duotone" />
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-dark-950/95 backdrop-blur-sm border-t border-dark-600 shadow-2xl">
        <div className="flex justify-around items-center px-6 py-4">
          <a href="/dashboard" className="flex flex-col items-center space-y-1 text-dark-400 hover:text-white transition-colors">
            <Tag size={24} weight="duotone" />
            <span className="text-xs font-medium">Dash</span>
          </a>
          <a href="/etiquetas" className="flex flex-col items-center space-y-1 text-primary">
            <Tag size={24} weight="duotone" />
            <span className="text-xs font-medium">Etiquetas</span>
          </a>
          <a href="/cadastros" className="flex flex-col items-center space-y-1 text-dark-400 hover:text-white transition-colors">
            <Tag size={24} weight="duotone" />
            <span className="text-xs font-medium">Cadastros</span>
          </a>
          <a href="/configuracoes" className="flex flex-col items-center space-y-1 text-dark-400 hover:text-white transition-colors">
            <Tag size={24} weight="duotone" />
            <span className="text-xs font-medium">Config</span>
          </a>
        </div>
      </nav>

      {/* Espaçamento para o bottom navigation */}
      <div className="h-24"></div>
    </div>
  )
}
