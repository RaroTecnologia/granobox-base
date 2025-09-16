import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { EtiquetaPreview } from '@/components/EtiquetaPreview'
import { 
  Plus, 
  MagnifyingGlass, 
  Funnel, 
  SortAscending, 
  Eye, 
  Printer, 
  PencilSimple, 
  Trash, 
  Calendar, 
  Package as PackageIcon, 
  Clock, 
  CheckCircle, 
  X, 
  Warning, 
  Info, 
  Tag, 
  Package, 
  ChartLine, 
  Gear,
  QrCode,
  CheckSquare,
  Snowflake
} from '@phosphor-icons/react'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import FooterNavigation from '@/components/FooterNavigation'
import { labelsService, Label } from '@/services/labelsService'

export default function EtiquetasPage() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('recentes')
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<Label | null>(null)
  const [etiquetas, setEtiquetas] = useState<Label[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [advancedFilters, setAdvancedFilters] = useState({
    segmento: [] as string[],
    categoria: '',
    prioridade: '',
    status: [] as string[],
    dataCriacaoInicio: '',
    dataCriacaoFim: '',
    dataVencimentoInicio: '',
    dataVencimentoFim: '',
    quantidadeMin: '',
    quantidadeMax: ''
  })

  // Carregar etiquetas da API
  useEffect(() => {
    const loadLabels = async () => {
      if (!user?.clientId) return;
      
      try {
        setIsLoading(true);
        // Carregar todas as etiquetas (impressas e não impressas)
        const allLabels = await labelsService.getAllLabels(user.clientId);
        setEtiquetas(allLabels);
      } catch (error) {
        console.error('Erro ao carregar etiquetas:', error);
        toast.error('Erro ao carregar etiquetas');
      } finally {
        setIsLoading(false);
      }
    };

    loadLabels();
  }, [user?.clientId]);

  // Função para dar baixa na etiqueta via QR Code
  const handleLowStock = async (labelId: string) => {
    try {
      const updatedLabel = await labelsService.markAsUsed(labelId);
      
      // Atualizar a lista local
      setEtiquetas(prev => prev.map(label => 
        label.id === labelId 
          ? updatedLabel
          : label
      ));
      
      toast.success('✅ Baixa realizada com sucesso!');
      setShowQrModal(false);
      setSelectedLabel(null);
    } catch (error) {
      console.error('Erro ao dar baixa:', error);
      toast.error('Erro ao dar baixa na etiqueta');
    }
  };

  // Função para verificar se a etiqueta foi usada via metadata
  const isLabelUsed = (label: Label) => {
    return label.metadata?.isUsed === true;
  };

  const getStatusColor = (label: Label) => {
    if (isLabelUsed(label)) return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
    
    switch (label.status) {
      case 'printed': return 'bg-green-500/20 text-green-600 border-green-500/30'
      case 'pending': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
      case 'failed': return 'bg-red-500/20 text-red-600 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    }
  }

  const getStatusIcon = (label: Label) => {
    if (isLabelUsed(label)) return <CheckSquare size={16} weight="duotone" />;
    
    switch (label.status) {
      case 'printed': return <CheckCircle size={16} weight="duotone" />
      case 'pending': return <Clock size={16} weight="duotone" />
      case 'failed': return <Warning size={16} weight="duotone" />
      default: return <Clock size={16} weight="duotone" />
    }
  }

  const getStatusText = (label: Label) => {
    if (isLabelUsed(label)) return 'Utilizada';
    
    switch (label.status) {
      case 'printed': return 'Impressa'
      case 'pending': return 'Pendente'
      case 'failed': return 'Falhou'
      default: return label.status
    }
  }

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-500/20 text-red-600 border-red-500/30'
      case 'média': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
      case 'baixa': return 'bg-blue-500/20 text-blue-600 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    }
  }

  const getSegmentoIcon = (segmento: string) => {
    switch (segmento) {
      case 'Manipulado': return <PackageIcon size={16} weight="duotone" />
      case 'Produto Final': return <Tag size={16} weight="duotone" />
      case 'Matéria Prima': return <Package size={16} weight="duotone" />
      default: return <Package size={16} weight="duotone" />
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const calcularDiasVencimento = (data: string) => {
    const hoje = new Date()
    const vencimento = new Date(data)
    const diffTime = vencimento.getTime() - hoje.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getVencimentoColor = (dias: number) => {
    if (dias < 0) return 'text-red-500'
    if (dias <= 30) return 'text-yellow-500'
    if (dias <= 90) return 'text-blue-500'
    return 'text-green-500'
  }

  const getVencimentoText = (dias: number) => {
    if (dias < 0) return `Venceu há ${Math.abs(dias)} dias`
    if (dias === 0) return 'Vence hoje'
    if (dias === 1) return 'Vence amanhã'
    return `Vence em ${dias} dias`
  }

  // Verifica se há filtros ativos
  const hasActiveFilters = () => {
    return searchTerm !== '' || 
           advancedFilters.segmento.length > 0 || 
           advancedFilters.status.length > 0 || 
           advancedFilters.categoria !== '' || 
           advancedFilters.prioridade !== '' || 
           advancedFilters.dataCriacaoInicio !== '' || 
           advancedFilters.dataCriacaoFim !== '' || 
           advancedFilters.dataVencimentoInicio !== '' || 
           advancedFilters.dataVencimentoFim !== '' || 
           advancedFilters.quantidadeMin !== '' || 
           advancedFilters.quantidadeMax !== ''
  }

  // Filtros aplicados
  const filteredEtiquetas = etiquetas.filter(etiqueta => {
    const matchesSearch = etiqueta.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         etiqueta.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtro de status considerando etiquetas usadas
    let matchesStatus = true;
    if (advancedFilters.status.length > 0) {
      const isUsed = isLabelUsed(etiqueta);
      matchesStatus = advancedFilters.status.some(status => {
        if (status === 'used') return isUsed;
        if (status === 'printed') return etiqueta.status === 'printed' && !isUsed;
        return etiqueta.status === status && !isUsed;
      });
    }
    
    const matchesDataCriacao = (!advancedFilters.dataCriacaoInicio || 
                               new Date(etiqueta.createdAt) >= new Date(advancedFilters.dataCriacaoInicio)) &&
                              (!advancedFilters.dataCriacaoFim || 
                               new Date(etiqueta.createdAt) <= new Date(advancedFilters.dataCriacaoFim))
    
    const matchesDataVencimento = (!advancedFilters.dataVencimentoInicio || 
                                  new Date(etiqueta.validityDate) >= new Date(advancedFilters.dataVencimentoInicio)) &&
                                 (!advancedFilters.dataVencimentoFim || 
                                  new Date(etiqueta.validityDate) <= new Date(advancedFilters.dataVencimentoFim))
    
    const matchesQuantidade = (!advancedFilters.quantidadeMin || 
                              etiqueta.quantity >= parseInt(advancedFilters.quantidadeMin)) &&
                             (!advancedFilters.quantidadeMax || 
                              etiqueta.quantity <= parseInt(advancedFilters.quantidadeMax))
    
    return matchesSearch && matchesStatus && matchesDataCriacao && 
           matchesDataVencimento && matchesQuantidade
  })

  const sortedEtiquetas = [...filteredEtiquetas].sort((a, b) => {
    switch (sortBy) {
      case 'recentes':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'antigas':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'vencimento':
        return new Date(a.validityDate).getTime() - new Date(b.validityDate).getTime()
      case 'nome':
        return a.product.name.localeCompare(b.product.name)
      case 'status':
        return a.status.localeCompare(b.status)
      default:
        return 0
    }
  })

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900 text-white' : 'bg-light-50 text-dark-900'}`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-b px-4 py-4 sticky top-0 z-10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Tag size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Controle de Etiquetas</h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                Gerencie suas etiquetas de validade
              </p>
            </div>
          </div>
          <a 
            href="/etiquetas/nova"
            className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <Plus size={16} weight="duotone" />
            <span>Nova Etiqueta</span>
          </a>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="p-4 space-y-6 pb-24">
        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-3 gap-4">
          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-4 border shadow-xl`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle size={20} weight="duotone" className="text-green-500" />
              </div>
              <div>
                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  {etiquetas.filter(e => e.status === 'printed' && !isLabelUsed(e)).length}
                </div>
                <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Impressas</div>
              </div>
            </div>
          </div>

          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-4 border shadow-xl`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <CheckSquare size={20} weight="duotone" className="text-blue-500" />
              </div>
              <div>
                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  {etiquetas.filter(e => isLabelUsed(e)).length}
                </div>
                <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Utilizadas</div>
              </div>
            </div>
          </div>

          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-4 border shadow-xl`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <Tag size={20} weight="duotone" className="text-primary" />
              </div>
              <div>
                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  {etiquetas.length}
                </div>
                <div className={`text-sm text-primary flex items-center justify-center space-x-1`}>
                  <Calendar size={16} weight="duotone" />
                  <span>Total</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Busca */}
          <div className="flex-1 relative">
            <MagnifyingGlass 
              size={20} 
              weight="duotone" 
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`} 
            />
            <input
              type="text"
              placeholder="Buscar etiquetas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-full border-2 transition-all duration-200 focus:outline-none ${
                theme === 'dark' 
                  ? 'bg-dark-800 border-dark-700 text-white focus:border-primary' 
                  : 'bg-white border-light-200 text-dark-900 focus:border-primary'
              }`}
            />
          </div>

          {/* Ordenação */}
          <div className="relative">
            <SortAscending 
              size={20} 
              weight="duotone" 
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`} 
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`pl-10 pr-8 py-3 rounded-full border-2 transition-all duration-200 focus:outline-none appearance-none ${
                theme === 'dark' 
                  ? 'bg-dark-800 border-dark-700 text-white focus:border-primary' 
                  : 'bg-white border-light-200 text-dark-900 focus:border-primary'
              }`}
            >
              <option value="recentes">Mais Recentes</option>
              <option value="antigas">Mais Antigas</option>
              <option value="nome">Nome A-Z</option>
              <option value="vencimento">Vencimento</option>
              <option value="status">Status</option>
            </select>
          </div>

          {/* Botão Filtros Avançados */}
          <button
            onClick={() => setShowFiltersModal(true)}
            className="px-6 py-3 bg-primary hover:bg-primary-600 text-white rounded-full text-sm font-semibold transition-colors flex items-center space-x-2"
          >
            <Funnel size={20} weight="duotone" />
            <span>Filtros</span>
          </button>
        </div>

        {/* Lista de Etiquetas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 justify-items-center">
          {isLoading ? (
            // Loading state
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className={`text-lg ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                Carregando etiquetas...
              </p>
            </div>
          ) : sortedEtiquetas.length > 0 ? (
            sortedEtiquetas.map((etiqueta) => {
              const diasVencimento = calcularDiasVencimento(etiqueta.validityDate);
              
              return (
                <div
                  key={etiqueta.id}
                  className={`w-full max-w-sm ${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-4 border shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105`}
                >
                  {/* Header do Card */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`px-3 py-1 rounded-full border text-xs font-semibold ${getStatusColor(etiqueta)}`}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(etiqueta)}
                        <span>{getStatusText(etiqueta)}</span>
                      </div>
                    </div>
                    
                    {(etiqueta.status === 'printed' || isLabelUsed(etiqueta)) && (
                      <button
                        onClick={() => {
                          setSelectedLabel(etiqueta);
                          setShowQrModal(true);
                        }}
                        className={`p-2 text-white rounded-full transition-colors ${
                          isLabelUsed(etiqueta) 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                        title={isLabelUsed(etiqueta) ? 'Ver detalhes da baixa' : 'Dar baixa via QR Code'}
                      >
                        {isLabelUsed(etiqueta) ? (
                          <Eye size={16} weight="duotone" />
                        ) : (
                          <QrCode size={16} weight="duotone" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Informações do Produto */}
                  <div className="mb-4">
                    <h3 className={`text-lg font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                      {etiqueta.product.name}
                    </h3>
                    <p className={`text-sm font-mono font-semibold ${theme === 'dark' ? 'text-primary' : 'text-primary'}`}>
                      {etiqueta.code}
                    </p>
                  </div>

                  {/* Detalhes */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                        Quantidade:
                      </span>
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                        {etiqueta.quantity} {etiqueta.unit || 'UN'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                        Produção:
                      </span>
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                        {formatarData(etiqueta.productionDate)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                        Validade:
                      </span>
                      <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                        {formatarData(etiqueta.validityDate)}
                      </span>
                    </div>
                    
                    {/* Só mostra vencimento se a etiqueta não foi utilizada */}
                    {!isLabelUsed(etiqueta) && (
                      <div className="flex justify-between items-center">
                        <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                          Vencimento:
                        </span>
                        <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                          {getVencimentoText(diasVencimento)}
                        </span>
                      </div>
                    )}

                    {/* Data de Baixa - só mostra se foi utilizada */}
                    {isLabelUsed(etiqueta) && etiqueta.metadata?.usedAt && (
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-dark-600">
                        <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                          Baixa realizada:
                        </span>
                        <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                          {formatarData(etiqueta.metadata.usedAt)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Conservação */}
                  {etiqueta.conservationType && (
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                        Conservação:
                      </span>
                      <div className="flex items-center space-x-1">
                        <Clock size={16} className="text-green-500" />
                        <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                          {etiqueta.conservationType === 'ambiente' ? 'Ambiente' :
                           etiqueta.conservationType === 'refrigerado' ? 'Refrigerado' : 'Congelado'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-8 border shadow-xl text-center col-span-full`}>
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
                <Tag size={32} weight="duotone" className="text-primary" />
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Nenhuma etiqueta encontrada
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                {hasActiveFilters()
                  ? 'Tente ajustar os filtros ou termos de busca'
                  : 'Crie sua primeira etiqueta para começar'
                }
              </p>
              {!hasActiveFilters() && (
                <a 
                  href="/etiquetas/nova"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-primary hover:bg-primary-600 text-white rounded-full text-sm font-semibold transition-colors"
                >
                  <Plus size={20} weight="duotone" />
                  <span>Criar Etiqueta</span>
                </a>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Filtros Avançados */}
      {showFiltersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-8">
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Filtros</h3>
              <button 
                onClick={() => setShowFiltersModal(false)}
                className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'}`}
              >
                <X size={20} weight="duotone" className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} />
              </button>
            </div>
            
            <div className="space-y-8">
              {/* Segmento - Cards Selecionáveis */}
              <div>
                <label className={`block text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Segmento
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { value: 'Manipulado', icon: PackageIcon, color: 'bg-blue-500', description: 'Produtos manipulados' },
                    { value: 'Produto Final', icon: Tag, color: 'bg-green-500', description: 'Produtos finais' },
                    { value: 'Matéria Prima', icon: Package, color: 'bg-orange-500', description: 'Matérias primas' }
                  ].map((segmento) => (
                    <div
                      key={segmento.value}
                      onClick={() => setAdvancedFilters({
                        ...advancedFilters, 
                        segmento: advancedFilters.segmento.includes(segmento.value) ? advancedFilters.segmento.filter(s => s !== segmento.value) : [...advancedFilters.segmento, segmento.value]
                      })}
                      className={`cursor-pointer rounded-xl p-4 border-2 transition-all duration-200 ${
                        advancedFilters.segmento.includes(segmento.value)
                          ? `${segmento.color} border-transparent text-white shadow-lg scale-105`
                          : `${theme === 'dark' ? 'bg-dark-700 border-dark-600 hover:border-primary' : 'bg-light-100 border-light-200 hover:border-primary'} hover:scale-102`
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          advancedFilters.segmento.includes(segmento.value) ? 'bg-white/20' : 'bg-gray-100'
                        }`}>
                          <segmento.icon 
                            size={20} 
                            weight="duotone" 
                            className={advancedFilters.segmento.includes(segmento.value) ? 'text-white' : 'text-gray-600'} 
                          />
                        </div>
                        <div>
                          <div className={`font-semibold ${advancedFilters.segmento.includes(segmento.value) ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                            {segmento.value}
                          </div>
                          <div className={`text-xs ${advancedFilters.segmento.includes(segmento.value) ? 'text-white/80' : theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                            {segmento.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status - Cards Selecionáveis */}
              <div>
                <label className={`block text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Status
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {[
                    { value: 'printed', icon: CheckCircle, color: 'bg-green-500', description: 'Etiquetas impressas' },
                    { value: 'used', icon: CheckSquare, color: 'bg-blue-500', description: 'Etiquetas utilizadas' },
                    { value: 'pending', icon: Clock, color: 'bg-yellow-500', description: 'Etiquetas pendentes' },
                    { value: 'failed', icon: Warning, color: 'bg-red-500', description: 'Etiquetas com falha' }
                  ].map((status) => (
                    <div
                      key={status.value}
                      onClick={() => setAdvancedFilters({
                        ...advancedFilters, 
                        status: advancedFilters.status.includes(status.value) ? advancedFilters.status.filter(s => s !== status.value) : [...advancedFilters.status, status.value]
                      })}
                      className={`cursor-pointer rounded-xl p-4 border-2 transition-all duration-200 ${
                        advancedFilters.status.includes(status.value)
                          ? `${status.color} border-transparent text-white shadow-lg scale-105`
                          : `${theme === 'dark' ? 'bg-dark-700 border-dark-600 hover:border-primary' : 'bg-light-100 border-light-200 hover:border-primary'} hover:scale-102`
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          advancedFilters.status.includes(status.value) ? 'bg-white/20' : 'bg-gray-100'
                        }`}>
                          <status.icon 
                            size={20} 
                            weight="duotone" 
                            className={advancedFilters.status.includes(status.value) ? 'text-white' : 'text-gray-600'} 
                          />
                        </div>
                        <div>
                          <div className={`font-semibold capitalize ${advancedFilters.status.includes(status.value) ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                            {status.value}
                          </div>
                          <div className={`text-xs ${advancedFilters.status.includes(status.value) ? 'text-white/80' : theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                            {status.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Outros Filtros em Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Categoria */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    Categoria
                  </label>
                  <select
                    value={advancedFilters.categoria}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, categoria: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                      theme === 'dark' 
                        ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                        : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                    }`}
                  >
                    <option value="">Todas as categorias</option>
                    <option value="Medicamentos">Medicamentos</option>
                    <option value="Suplementos">Suplementos</option>
                    <option value="Cosméticos">Cosméticos</option>
                  </select>
                </div>

                {/* Prioridade */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    Prioridade
                  </label>
                  <select
                    value={advancedFilters.prioridade}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, prioridade: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                      theme === 'dark' 
                        ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                        : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                    }`}
                  >
                    <option value="">Todas as prioridades</option>
                    <option value="alta">Alta</option>
                    <option value="média">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>

                {/* Data de Criação - Início */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    Data de Criação - Início
                  </label>
                  <input
                    type="date"
                    value={advancedFilters.dataCriacaoInicio}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, dataCriacaoInicio: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                      theme === 'dark' 
                        ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                        : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                    }`}
                  />
                </div>

                {/* Data de Criação - Fim */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    Data de Criação - Fim
                  </label>
                  <input
                    type="date"
                    value={advancedFilters.dataCriacaoFim}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, dataCriacaoFim: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                      theme === 'dark' 
                        ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                        : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                    }`}
                  />
                </div>

                {/* Data de Vencimento - Início */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    Data de Vencimento - Início
                  </label>
                  <input
                    type="date"
                    value={advancedFilters.dataVencimentoInicio}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, dataVencimentoInicio: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                      theme === 'dark' 
                        ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                        : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                    }`}
                  />
                </div>

                {/* Data de Vencimento - Fim */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    Data de Vencimento - Fim
                  </label>
                  <input
                    type="date"
                    value={advancedFilters.dataVencimentoFim}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, dataVencimentoFim: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                      theme === 'dark' 
                        ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                        : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                    }`}
                  />
                </div>

                {/* Quantidade Mínima */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    Quantidade Mínima
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={advancedFilters.quantidadeMin}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, quantidadeMin: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                      theme === 'dark' 
                        ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                        : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                    }`}
                  />
                </div>

                {/* Quantidade Máxima */}
                <div>
                  <label className={`block text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    Quantidade Máxima
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={advancedFilters.quantidadeMax}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, quantidadeMax: e.target.value})}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                      theme === 'dark' 
                        ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                        : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setAdvancedFilters({
                    segmento: [],
                    categoria: '',
                    prioridade: '',
                    status: [],
                    dataCriacaoInicio: '',
                    dataCriacaoFim: '',
                    dataVencimentoInicio: '',
                    dataVencimentoFim: '',
                    quantidadeMin: '',
                    quantidadeMax: ''
                  })
                }}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Limpar Filtros
              </button>
              <button
                onClick={() => setShowFiltersModal(false)}
                className="px-6 py-3 bg-primary hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de QR Code para dar baixa */}
      {showQrModal && selectedLabel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-2xl max-w-md w-full`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                {isLabelUsed(selectedLabel) ? 'Etiqueta Utilizada' : 'Dar Baixa na Etiqueta'}
              </h3>
              <button 
                onClick={() => {
                  setShowQrModal(false);
                  setSelectedLabel(null);
                }}
                className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'}`}
              >
                <X size={20} weight="duotone" className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} />
              </button>
            </div>
            
            <div className="text-center space-y-4">
              {/* Informações da Etiqueta */}
              <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-gray-50'}`}>
                <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  {selectedLabel.product.name}
                </h4>
                <div className="space-y-1 text-sm">
                  <p className={theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}>
                    <strong>ID:</strong> {selectedLabel.id.slice(0, 8)}...
                  </p>
                  <p className={theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}>
                    <strong>Quantidade:</strong> {selectedLabel.quantity} {selectedLabel.unit || 'UN'}
                  </p>
                  <p className={theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}>
                    <strong>Validade:</strong> {formatarData(selectedLabel.validityDate)}
                  </p>
                  {isLabelUsed(selectedLabel) && selectedLabel.metadata?.usedAt && (
                    <p className={theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}>
                      <strong>Baixa realizada:</strong> {formatarData(selectedLabel.metadata.usedAt)}
                    </p>
                  )}
                </div>
              </div>

              {/* QR Code Placeholder - só mostra se não foi utilizada */}
              {!isLabelUsed(selectedLabel) && (
                <div className={`p-8 rounded-xl border-2 border-dashed ${theme === 'dark' ? 'border-dark-600' : 'border-gray-300'}`}>
                  <QrCode size={64} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-dark-400' : 'text-gray-400'}`} />
                  <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-gray-600'}`}>
                    Escaneie o QR Code da etiqueta física
                  </p>
                  <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-dark-500' : 'text-gray-500'}`}>
                    Ou clique no botão abaixo para confirmar manualmente
                  </p>
                </div>
              )}

              {/* Botões */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowQrModal(false);
                    setSelectedLabel(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {isLabelUsed(selectedLabel) ? 'Fechar' : 'Cancelar'}
                </button>
                {!isLabelUsed(selectedLabel) && (
                  <button
                    onClick={() => handleLowStock(selectedLabel.id)}
                    className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center space-x-2"
                  >
                    <CheckSquare size={16} />
                    <span>Confirmar Baixa</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <FooterNavigation />
    </div>
  )
}