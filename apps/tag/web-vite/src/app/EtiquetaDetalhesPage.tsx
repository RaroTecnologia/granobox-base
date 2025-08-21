import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { EtiquetaPreview } from '@/components/EtiquetaPreview'
import { 
  ArrowLeft, 
  Printer, 
  Archive, 
  Eye, 
  Clock, 
  CheckCircle, 
  Warning, 
  Package, 
  Tag, 
  Calendar,
  User,
  FileText,
  Trash,
  ChartLine,
  Warning as WarningIcon,
  Gear
} from '@phosphor-icons/react'

interface Etiqueta {
  id: number
  codigo: string
  nome: string
  categoria: string
  segmento: string
  status: string
  dataCriacao: string
  quantidade: number
  vencimento: string
  prioridade: string
}

interface HistoricoItem {
  id: number
  tipo: 'criacao' | 'impressao' | 'consulta' | 'alteracao' | 'arquivamento'
  data: string
  usuario: string
  descricao: string
  detalhes?: string
}

export default function EtiquetaDetalhesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [etiqueta, setEtiqueta] = useState<Etiqueta | null>(null)
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [showArquivarModal, setShowArquivarModal] = useState(false)
  const [motivoArquivamento, setMotivoArquivamento] = useState('')

  // Mock data para a etiqueta
  useEffect(() => {
    if (id) {
      const mockEtiqueta: Etiqueta = {
        id: parseInt(id),
        codigo: `ETQ-${id.padStart(3, '0')}`,
        nome: 'Paracetamol 500mg Comprimido',
        categoria: 'Medicamentos',
        segmento: 'Manipulado',
        status: 'ativa',
        dataCriacao: '2024-01-15',
        quantidade: 150,
        vencimento: '2025-01-15',
        prioridade: 'alta'
      }
      setEtiqueta(mockEtiqueta)

      // Mock data para o histórico
      const mockHistorico: HistoricoItem[] = [
        {
          id: 1,
          tipo: 'criacao',
          data: '2024-01-15 09:30',
          usuario: 'Dr. Silva',
          descricao: 'Etiqueta criada',
          detalhes: 'Etiqueta criada para lote de produção #2024-001'
        },
        {
          id: 2,
          tipo: 'impressao',
          data: '2024-01-15 10:15',
          usuario: 'Técnico João',
          descricao: 'Etiqueta impressa',
          detalhes: '50 unidades impressas para aplicação inicial'
        },
        {
          id: 3,
          tipo: 'consulta',
          data: '2024-01-16 14:20',
          usuario: 'Farmacêutica Maria',
          descricao: 'Consulta realizada',
          detalhes: 'Verificação de validade e quantidade em estoque'
        },
        {
          id: 4,
          tipo: 'alteracao',
          data: '2024-01-17 11:45',
          usuario: 'Dr. Silva',
          descricao: 'Quantidade atualizada',
          detalhes: 'Quantidade alterada de 150 para 120 unidades'
        },
        {
          id: 5,
          tipo: 'impressao',
          data: '2024-01-18 08:30',
          usuario: 'Técnico Pedro',
          descricao: 'Etiqueta reimpressa',
          detalhes: '30 unidades adicionais impressas'
        }
      ]
      setHistorico(mockHistorico)
    }
  }, [id])

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'criacao': return <Package size={20} weight="duotone" className="text-primary" />
      case 'impressao': return <Printer size={20} weight="duotone" className="text-primary" />
      case 'consulta': return <Eye size={20} weight="duotone" className="text-primary" />
      case 'alteracao': return <FileText size={20} weight="duotone" className="text-primary" />
      case 'arquivamento': return <Archive size={20} weight="duotone" className="text-primary" />
      default: return <Clock size={20} weight="duotone" className="text-primary" />
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'criacao': return 'bg-primary/20 text-primary border-primary/30'
      case 'impressao': return 'bg-primary/20 text-primary border-primary/30'
      case 'consulta': return 'bg-primary/20 text-primary border-primary/30'
      case 'alteracao': return 'bg-primary/20 text-primary border-primary/30'
      case 'arquivamento': return 'bg-primary/20 text-primary border-primary/30'
      default: return 'bg-primary/20 text-primary border-primary/30'
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR')
  }

  const handleArquivar = () => {
    if (motivoArquivamento.trim()) {
      // Aqui você implementaria a lógica de arquivamento
      console.log('Arquivando etiqueta:', motivoArquivamento)
      setShowArquivarModal(false)
      setMotivoArquivamento('')
      // Redirecionar para a lista de etiquetas
      navigate('/etiquetas')
    }
  }

  if (!etiqueta) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900 text-white' : 'bg-light-50 text-dark-900'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
            <Clock size={32} weight="duotone" className="text-primary" />
          </div>
          <p className="text-lg">Carregando etiqueta...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900 text-white' : 'bg-light-50 text-dark-900'} pb-20`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-b px-4 py-4 sticky top-0 z-10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/etiquetas')}
              className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'}`}
            >
              <ArrowLeft size={24} weight="duotone" />
            </button>
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Tag size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{etiqueta.codigo}</h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                {etiqueta.nome}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2">
              <Printer size={16} weight="duotone" />
              <span>Imprimir</span>
            </button>
            <button 
              onClick={() => setShowArquivarModal(true)}
              className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <Archive size={16} weight="duotone" />
              <span>Arquivar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="p-4 space-y-6">
        {/* Preview da Etiqueta */}
        <div className="flex justify-center">
          <EtiquetaPreview etiqueta={etiqueta} />
        </div>

        {/* Informações Detalhadas */}
        <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
          <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
            Informações da Etiqueta
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Package size={20} weight="duotone" className="text-primary" />
                </div>
                <div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Segmento</div>
                  <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{etiqueta.segmento}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Tag size={20} weight="duotone" className="text-primary" />
                </div>
                <div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Categoria</div>
                  <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{etiqueta.categoria}</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Calendar size={20} weight="duotone" className="text-primary" />
                </div>
                <div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Data de Criação</div>
                  <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    {formatarData(etiqueta.dataCriacao)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <User size={20} weight="duotone" className="text-primary" />
                </div>
                <div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Quantidade</div>
                  <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    {etiqueta.quantidade} unidades
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Histórico */}
        <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
          <h2 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
            Histórico de Atividades
          </h2>
          
          <div className="relative">
            {/* Linha da Timeline */}
            <div className={`absolute left-6 top-0 bottom-0 w-0.5 ${theme === 'dark' ? 'bg-dark-600' : 'bg-gray-300'}`}></div>
            
            <div className="space-y-6">
              {historico.map((item, index) => (
                <div key={item.id} className="relative flex items-start">
                  {/* Círculo da Timeline */}
                  <div className={`absolute left-5 w-3 h-3 rounded-full border-2 ${theme === 'dark' ? 'bg-dark-800 border-primary' : 'bg-white border-primary'} z-10`}></div>
                  
                  {/* Conteúdo da Timeline */}
                  <div className="ml-12 flex-1">
                    <div className={`p-4 rounded-xl border-2 ${getTipoColor(item.tipo)}`}>
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {getTipoIcon(item.tipo)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className={`font-semibold capitalize ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                              {item.descricao}
                            </div>
                            <div className={`text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                              {formatarData(item.data)}
                            </div>
                          </div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                            <strong>Usuário:</strong> {item.usuario}
                          </div>
                          {item.detalhes && (
                            <div className={`text-sm mt-2 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                              {item.detalhes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Arquivamento */}
      {showArquivarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-2xl max-w-md w-full`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Arquivar Etiqueta
              </h3>
              <button
                onClick={() => setShowArquivarModal(false)}
                className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'}`}
              >
                <Trash size={20} weight="duotone" className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} />
              </button>
            </div>

            <div className="mb-6">
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} mb-4`}>
                Esta ação irá arquivar a etiqueta {etiqueta.codigo}. 
                Etiquetas arquivadas não podem ser editadas ou impressas.
              </p>
              
              <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Motivo do Arquivamento
              </label>
              <textarea
                value={motivoArquivamento}
                onChange={(e) => setMotivoArquivamento(e.target.value)}
                placeholder="Descreva o motivo do arquivamento..."
                rows={3}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                  theme === 'dark' 
                    ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                    : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                }`}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowArquivarModal(false)}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleArquivar}
                disabled={!motivoArquivamento.trim()}
                className="px-4 py-2 bg-primary hover:bg-primary-600 disabled:bg-dark-400 text-white rounded-xl text-sm font-medium transition-colors disabled:cursor-not-allowed"
              >
                Arquivar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <nav className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-t fixed bottom-0 left-0 right-0 px-4 py-3`}>
        <div className="flex items-center justify-around">
          <a href="/dashboard" className={`flex flex-col items-center space-y-1 ${theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'} transition-colors`}>
            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
              <ChartLine size={16} weight="duotone" className="text-primary" />
            </div>
            <span className="text-xs">Dash</span>
          </a>
          <a href="/etiquetas" className={`flex flex-col items-center space-y-1 text-primary`}>
            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
              <Package size={16} weight="duotone" className="text-primary" />
            </div>
            <span className="text-xs">Etiquetas</span>
          </a>
          <a href="/cadastros" className={`flex flex-col items-center space-y-1 ${theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'} transition-colors`}>
            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
              <Package size={16} weight="duotone" className="text-primary" />
            </div>
            <span className="text-xs">Cadastros</span>
          </a>
          <a href="/alertas" className={`flex flex-col items-center space-y-1 ${theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'} transition-colors`}>
            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
              <WarningIcon size={16} weight="duotone" className="text-primary" />
            </div>
            <span className="text-xs">Alertas</span>
          </a>
          <a href="/configuracoes" className={`flex flex-col items-center space-y-1 ${theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'} transition-colors`}>
            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
              <Gear size={16} weight="duotone" className="text-primary" />
            </div>
            <span className="text-xs">Config</span>
          </a>
        </div>
      </nav>
    </div>
  )
}
