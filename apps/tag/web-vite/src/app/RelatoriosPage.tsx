import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  FileText, 
  ChartLine, 
  Package, 
  Warning, 
  Calendar, 
  Users, 
  Printer, 
  Download,
  ArrowLeft,
  MagnifyingGlass,
  Funnel
} from '@phosphor-icons/react'
import { toast } from 'react-hot-toast'
import FooterNavigation from '@/components/FooterNavigation'

interface Relatorio {
  id: string
  titulo: string
  descricao: string
  icone: React.ReactNode
  categoria: 'etiquetas' | 'cadastros' | 'operacional' | 'analitico'
  frequencia: 'diario' | 'semanal' | 'mensal' | 'sob-demanda'
  ultimaGeracao?: string
  proximaGeracao?: string
  status: 'disponivel' | 'gerando' | 'erro'
}

export default function RelatoriosPage() {
  const { theme } = useTheme()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('todas')
  const [selectedFrequency, setSelectedFrequency] = useState<string>('todas')

  const relatorios: Relatorio[] = [
    {
      id: 'etiquetas-geradas',
      titulo: 'Etiquetas Geradas',
      descricao: 'Relatório detalhado de todas as etiquetas criadas e impressas',
      icone: <Package size={32} weight="duotone" />,
      categoria: 'etiquetas',
      frequencia: 'diario',
      ultimaGeracao: '2024-01-15 08:30',
      proximaGeracao: '2024-01-16 08:30',
      status: 'disponivel'
    },
    {
      id: 'produtividade-impressao',
      titulo: 'Produtividade de Impressão',
      descricao: 'Métricas de eficiência e volume de impressão por período',
      icone: <Printer size={32} weight="duotone" />,
      categoria: 'operacional',
      frequencia: 'semanal',
      ultimaGeracao: '2024-01-14 18:00',
      proximaGeracao: '2024-01-21 18:00',
      status: 'disponivel'
    },
    {
      id: 'inventario-produtos',
      titulo: 'Inventário de Produtos',
      descricao: 'Status atual do cadastro de produtos e categorias',
      icone: <Package size={32} weight="duotone" />,
      categoria: 'cadastros',
      frequencia: 'mensal',
      ultimaGeracao: '2024-01-01 00:00',
      proximaGeracao: '2024-02-01 00:00',
      status: 'disponivel'
    },
    {
      id: 'alertas-expiracao',
      titulo: 'Alertas de Expiração',
      descricao: 'Relatório de produtos próximos ao vencimento',
      icone: <Warning size={32} weight="duotone" />,
      categoria: 'operacional',
      frequencia: 'diario',
      ultimaGeracao: '2024-01-15 06:00',
      proximaGeracao: '2024-01-16 06:00',
      status: 'disponivel'
    },
    {
      id: 'desempenho-usuarios',
      titulo: 'Desempenho de Usuários',
      descricao: 'Estatísticas de uso e produtividade por usuário',
      icone: <Users size={32} weight="duotone" />,
      categoria: 'analitico',
      frequencia: 'semanal',
      ultimaGeracao: '2024-01-14 18:00',
      proximaGeracao: '2024-01-21 18:00',
      status: 'disponivel'
    },
    {
      id: 'tendencias-producao',
      titulo: 'Tendências de Produção',
      descricao: 'Análise de padrões e sazonalidade na produção',
      icone: <ChartLine size={32} weight="duotone" />,
      categoria: 'analitico',
      frequencia: 'mensal',
      ultimaGeracao: '2024-01-01 00:00',
      proximaGeracao: '2024-02-01 00:00',
      status: 'disponivel'
    },
    {
      id: 'consumo-materiais',
      titulo: 'Consumo de Materiais',
      descricao: 'Controle de estoque e consumo de matéria-prima',
      icone: <Package size={32} weight="duotone" />,
      categoria: 'operacional',
      frequencia: 'semanal',
      ultimaGeracao: '2024-01-14 18:00',
      proximaGeracao: '2024-01-21 18:00',
      status: 'gerando'
    },
    {
      id: 'auditoria-sistema',
      titulo: 'Auditoria do Sistema',
      descricao: 'Log de atividades e alterações no sistema',
      icone: <FileText size={32} weight="duotone" />,
      categoria: 'analitico',
      frequencia: 'mensal',
      ultimaGeracao: '2024-01-01 00:00',
      proximaGeracao: '2024-02-01 00:00',
      status: 'disponivel'
    },
    {
      id: 'consumiveis-sistema',
      titulo: 'Consumíveis do Sistema',
      descricao: 'Controle de estoque de etiquetas, ribbons, suporte e manutenção da impressora',
      icone: <Printer size={32} weight="duotone" />,
      categoria: 'operacional',
      frequencia: 'semanal',
      ultimaGeracao: '2024-01-14 18:00',
      proximaGeracao: '2024-01-21 18:00',
      status: 'disponivel'
    }
  ]

  const categorias = [
    { id: 'todas', nome: 'Todas', cor: 'bg-gray-500' },
    { id: 'etiquetas', nome: 'Etiquetas', cor: 'bg-primary' },
    { id: 'cadastros', nome: 'Cadastros', cor: 'bg-dark-600' },
    { id: 'operacional', nome: 'Operacional', cor: 'bg-green-600' },
    { id: 'analitico', nome: 'Analítico', cor: 'bg-gray-600' }
  ]

  const frequencias = [
    { id: 'todas', nome: 'Todas' },
    { id: 'diario', nome: 'Diário' },
    { id: 'semanal', nome: 'Semanal' },
    { id: 'mensal', nome: 'Mensal' },
    { id: 'sob-demanda', nome: 'Sob Demanda' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'bg-green-500'
      case 'gerando':
        return 'bg-yellow-500'
      case 'erro':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'Disponível'
      case 'gerando':
        return 'Gerando...'
      case 'erro':
        return 'Erro'
      default:
        return 'Desconhecido'
    }
  }

  const getFrequencyText = (frequencia: string) => {
    switch (frequencia) {
      case 'diario':
        return 'Diário'
      case 'semanal':
        return 'Semanal'
      case 'mensal':
        return 'Mensal'
      case 'sob-demanda':
        return 'Sob Demanda'
      default:
        return frequencia
    }
  }

  const filteredRelatorios = relatorios.filter(relatorio => {
    const matchesSearch = relatorio.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         relatorio.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'todas' || relatorio.categoria === selectedCategory
    const matchesFrequency = selectedFrequency === 'todas' || relatorio.frequencia === selectedFrequency
    
    return matchesSearch && matchesCategory && matchesFrequency
  })

  const handleGerarRelatorio = (relatorio: Relatorio) => {
    if (relatorio.status === 'gerando') {
      toast.error('Relatório já está sendo gerado!')
      return
    }
    
    toast.success(`Gerando relatório: ${relatorio.titulo}`)
    // Aqui você implementaria a lógica de geração do relatório
  }

  const handleDownloadRelatorio = (relatorio: Relatorio) => {
    if (relatorio.status !== 'disponivel') {
      toast.error('Relatório não está disponível para download!')
      return
    }
    
    toast.success(`Baixando relatório: ${relatorio.titulo}`)
    // Aqui você implementaria a lógica de download do relatório
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900 text-white' : 'bg-light-50 text-dark-900'} pb-20`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-b px-4 py-4 sticky top-0 z-10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <a 
              href="/dashboard"
              className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'}`}
            >
              <ArrowLeft size={24} weight="duotone" className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} />
            </a>
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <FileText size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Relatórios</h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                Acesse e gere relatórios do sistema
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="px-4 py-6 space-y-6">
        {/* Filtros e Busca */}
        <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 border shadow-xl`}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlass 
                  size={20} 
                  weight="duotone" 
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`} 
                />
                <input
                  type="text"
                  placeholder="Buscar relatórios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                    theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                  }`}
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                  theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                }`}
              >
                {categorias.map(categoria => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
              </select>

              <select
                value={selectedFrequency}
                onChange={(e) => setSelectedFrequency(e.target.value)}
                className={`px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                  theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                }`}
              >
                {frequencias.map(frequencia => (
                  <option key={frequencia.id} value={frequencia.id}>
                    {frequencia.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Cards dos Relatórios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRelatorios.map(relatorio => (
            <div 
              key={relatorio.id}
              className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-300`}
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  {relatorio.icone}
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(relatorio.status)}`}>
                  {getStatusText(relatorio.status)}
                </div>
              </div>

              {/* Conteúdo do Card */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">{relatorio.titulo}</h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} mb-3`}>
                  {relatorio.descricao}
                </p>
                
                {/* Categoria e Frequência */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${categorias.find(c => c.id === relatorio.categoria)?.cor}`}>
                    {categorias.find(c => c.id === relatorio.categoria)?.nome}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-dark-700 text-dark-300' : 'bg-light-200 text-dark-700'}`}>
                    {getFrequencyText(relatorio.frequencia)}
                  </span>
                </div>

                {/* Informações de Geração */}
                {relatorio.ultimaGeracao && (
                  <div className={`text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                    <div>Última geração: {relatorio.ultimaGeracao}</div>
                    {relatorio.proximaGeracao && (
                      <div>Próxima: {relatorio.proximaGeracao}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleGerarRelatorio(relatorio)}
                  disabled={relatorio.status === 'gerando'}
                  className={`flex-1 px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2 ${
                    relatorio.status === 'gerando'
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-primary hover:bg-primary-600 text-white'
                  }`}
                >
                  <ChartLine size={16} weight="duotone" />
                  <span>{relatorio.status === 'gerando' ? 'Gerando...' : 'Gerar'}</span>
                </button>
                
                <button
                  onClick={() => handleDownloadRelatorio(relatorio)}
                  disabled={relatorio.status !== 'disponivel'}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center ${
                    relatorio.status === 'disponivel'
                      ? 'bg-dark-600 hover:bg-dark-500 text-white'
                      : 'bg-gray-400 text-white cursor-not-allowed'
                  }`}
                >
                  <Download size={16} weight="duotone" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Estado Vazio */}
        {filteredRelatorios.length === 0 && (
          <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-12 border shadow-xl text-center`}>
            <FileText size={64} weight="duotone" className={`mx-auto mb-4 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`} />
            <h3 className="text-lg font-semibold mb-2">Nenhum relatório encontrado</h3>
            <p className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
              Tente ajustar os filtros ou a busca para encontrar o que procura.
            </p>
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      <FooterNavigation />
    </div>
  )
}
