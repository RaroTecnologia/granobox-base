import { useTheme } from '@/contexts/ThemeContext'
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
  Gear 
} from '@phosphor-icons/react'
import { useState } from 'react'

export default function EtiquetasPage() {
  const { theme } = useTheme()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('recentes')
  const [showFiltersModal, setShowFiltersModal] = useState(false)
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

  // Dados mockados para demonstração
  const etiquetas = [
    {
      id: 1,
      codigo: 'ETQ-001',
      nome: 'Paracetamol 500mg',
      categoria: 'Medicamentos',
      segmento: 'Manipulado',
      status: 'ativa',
      dataCriacao: '2024-01-15',
      quantidade: 150,
      vencimento: '2025-01-15',
      prioridade: 'alta'
    },
    {
      id: 2,
      codigo: 'ETQ-002',
      nome: 'Dipirona 500mg',
      categoria: 'Medicamentos',
      segmento: 'Produto Final',
      status: 'ativa',
      dataCriacao: '2024-01-16',
      quantidade: 200,
      vencimento: '2025-01-16',
      prioridade: 'média'
    },
    {
      id: 3,
      codigo: 'ETQ-003',
      nome: 'Vitamina C 1000mg',
      categoria: 'Suplementos',
      segmento: 'Matéria Prima',
      status: 'inativa',
      dataCriacao: '2024-01-10',
      quantidade: 80,
      vencimento: '2024-12-10',
      prioridade: 'baixa'
    },
    {
      id: 4,
      codigo: 'ETQ-004',
      nome: 'Ibuprofeno 400mg',
      categoria: 'Medicamentos',
      segmento: 'Manipulado',
      status: 'ativa',
      dataCriacao: '2024-01-17',
      quantidade: 100,
      vencimento: '2025-01-17',
      prioridade: 'média'
    },
    {
      id: 5,
      codigo: 'ETQ-005',
      nome: 'Ômega 3 1000mg',
      categoria: 'Suplementos',
      segmento: 'Produto Final',
      status: 'ativa',
      dataCriacao: '2024-01-18',
      quantidade: 120,
      vencimento: '2025-01-18',
      prioridade: 'baixa'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-green-500/20 text-green-600 border-green-500/30'
      case 'inativa': return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
      case 'pendente': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativa': return <CheckCircle size={16} weight="duotone" />
      case 'inativa': return <Clock size={16} weight="duotone" />
      case 'pendente': return <Warning size={16} weight="duotone" />
      default: return <Clock size={16} weight="duotone" />
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
    const matchesSearch = etiqueta.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         etiqueta.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filtros avançados
    const matchesSegmento = advancedFilters.segmento.length === 0 || 
                           advancedFilters.segmento.includes(etiqueta.segmento)
    
    const matchesStatus = advancedFilters.status.length === 0 || 
                         advancedFilters.status.includes(etiqueta.status)
    
    const matchesCategoria = advancedFilters.categoria === '' || 
                            etiqueta.categoria === advancedFilters.categoria
    
    const matchesPrioridade = advancedFilters.prioridade === '' || 
                             etiqueta.prioridade === advancedFilters.prioridade
    
    const matchesDataCriacao = (!advancedFilters.dataCriacaoInicio || 
                               new Date(etiqueta.dataCriacao) >= new Date(advancedFilters.dataCriacaoInicio)) &&
                              (!advancedFilters.dataCriacaoFim || 
                               new Date(etiqueta.dataCriacao) <= new Date(advancedFilters.dataCriacaoFim))
    
    const matchesDataVencimento = (!advancedFilters.dataVencimentoInicio || 
                                  new Date(etiqueta.dataVencimento) >= new Date(advancedFilters.dataVencimentoInicio)) &&
                                 (!advancedFilters.dataVencimentoFim || 
                                  new Date(etiqueta.dataVencimento) <= new Date(advancedFilters.dataVencimentoFim))
    
    const matchesQuantidade = (!advancedFilters.quantidadeMin || 
                              etiqueta.quantidade >= parseInt(advancedFilters.quantidadeMin)) &&
                             (!advancedFilters.quantidadeMax || 
                              etiqueta.quantidade <= parseInt(advancedFilters.quantidadeMax))
    
    return matchesSearch && matchesSegmento && matchesStatus && 
           matchesCategoria && matchesPrioridade && matchesDataCriacao && 
           matchesDataVencimento && matchesQuantidade
  })

  const sortedEtiquetas = [...filteredEtiquetas].sort((a, b) => {
    switch (sortBy) {
      case 'recentes':
        return new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
      case 'antigas':
        return new Date(a.dataCriacao).getTime() - new Date(b.dataCriacao).getTime()
      case 'vencimento':
        return new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()
      case 'nome':
        return a.nome.localeCompare(b.nome)
      case 'prioridade':
        const prioridadeOrder = { 'alta': 3, 'média': 2, 'baixa': 1 }
        return prioridadeOrder[b.prioridade as keyof typeof prioridadeOrder] - prioridadeOrder[a.prioridade as keyof typeof prioridadeOrder]
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
            <h1 className="text-xl font-bold">Gerenciar Etiquetas</h1>
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
      <main className="p-4 space-y-6">
        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-4 border shadow-xl`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle size={20} weight="duotone" className="text-green-500" />
              </div>
              <div>
                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  {etiquetas.filter(e => e.status === 'ativa').length}
                </div>
                <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Ativas</div>
              </div>
            </div>
          </div>

          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-4 border shadow-xl`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Tag size={20} weight="duotone" className="text-blue-500" />
              </div>
              <div>
                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  {etiquetas.length}
                </div>
                <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Total</div>
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
              <option value="prioridade">Prioridade</option>
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
          {sortedEtiquetas.length > 0 ? (
            sortedEtiquetas.map((etiqueta) => {
              return (
                <EtiquetaPreview 
                  key={etiqueta.id} 
                  etiqueta={etiqueta}
                />
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { value: 'ativa', icon: CheckCircle, color: 'bg-green-500', description: 'Etiquetas ativas' },
                    { value: 'inativa', icon: Clock, color: 'bg-gray-500', description: 'Etiquetas inativas' },
                    { value: 'pendente', icon: Warning, color: 'bg-yellow-500', description: 'Etiquetas pendentes' }
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
              <Warning size={16} weight="duotone" className="text-primary" />
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