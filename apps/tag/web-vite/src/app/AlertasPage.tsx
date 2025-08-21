import { useTheme } from '@/contexts/ThemeContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { 
  Warning, 
  XCircle, 
  CheckCircle, 
  Clock, 
  Trophy, 
  Target, 
  ChartLine,
  Calendar,
  Package,
  ArrowRight
} from '@phosphor-icons/react'
import FooterNavigation from '@/components/FooterNavigation'

export default function AlertasPage() {
  const { theme } = useTheme()

  // Dados mockados para demonstração
  const alertas = {
    vencidas: [
      { id: 1, nome: 'Paracetamol 500mg', categoria: 'Medicamentos', vencimento: '2024-01-15', quantidade: 150, prioridade: 'alta' },
      { id: 2, nome: 'Dipirona 500mg', categoria: 'Medicamentos', vencimento: '2024-01-18', quantidade: 200, prioridade: 'alta' },
      { id: 3, nome: 'Ibuprofeno 400mg', categoria: 'Medicamentos', vencimento: '2024-01-20', quantidade: 100, prioridade: 'média' },
      { id: 4, nome: 'Vitamina C 1000mg', categoria: 'Suplementos', vencimento: '2024-01-22', quantidade: 80, prioridade: 'média' },
      { id: 5, nome: 'Ômega 3 1000mg', categoria: 'Suplementos', vencimento: '2024-01-25', quantidade: 120, prioridade: 'baixa' }
    ],
    vencendo7dias: [
      { id: 6, nome: 'Aspirina 100mg', categoria: 'Medicamentos', vencimento: '2024-01-30', quantidade: 300, prioridade: 'média' },
      { id: 7, nome: 'Vitamina D 2000UI', categoria: 'Suplementos', vencimento: '2024-02-01', quantidade: 150, prioridade: 'média' },
      { id: 8, nome: 'Magnésio 400mg', categoria: 'Suplementos', vencimento: '2024-02-03', quantidade: 200, prioridade: 'baixa' }
    ],
    vencendo30dias: [
      { id: 9, nome: 'Zinc 15mg', categoria: 'Suplementos', vencimento: '2024-02-15', quantidade: 180, prioridade: 'baixa' },
      { id: 10, nome: 'Vitamina B12 1000mcg', categoria: 'Suplementos', vencimento: '2024-02-20', quantidade: 120, prioridade: 'baixa' }
    ]
  }

  const kpis = {
    totalProdutos: 1247,
    vencidos: 5,
    vencendo7dias: 8,
    vencendo30dias: 10,
    percentualVencidos: 0.4,
    percentualVencendo7dias: 0.6,
    metaVencidos: 0.2, // Meta: máximo 0.2% vencidos
    metaVencendo7dias: 0.5, // Meta: máximo 0.5% vencendo em 7 dias
    score: 85, // Score de 0-100 baseado na gestão
    nivel: 'Prata', // Bronze, Prata, Ouro, Diamante
    proximoNivel: 'Ouro',
    pontosParaProximoNivel: 15
  }

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-500 text-white'
      case 'média': return 'bg-yellow-500 text-white'
      case 'baixa': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getPrioridadeIcon = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return <XCircle size={16} weight="duotone" />
      case 'média': return <Warning size={16} weight="duotone" />
      case 'baixa': return <Clock size={16} weight="duotone" />
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

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900 text-white' : 'bg-light-50 text-dark-900'}`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-b px-4 py-4 sticky top-0 z-10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
              <Warning size={24} weight="duotone" className="text-red-500" />
            </div>
            <h1 className="text-xl font-bold">Alertas de Vencimento</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="p-4 space-y-6">
        {/* KPIs Gamificados */}
        <div className="grid grid-cols-2 gap-4">
          {/* Score Geral */}
          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                <Trophy size={24} weight="duotone" className="text-white" />
              </div>
              <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Score</span>
            </div>
            <div className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{kpis.score}</div>
            <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Nível {kpis.nivel}</div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Próximo nível</span>
                <span>{kpis.pontosParaProximoNivel} pts</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((100 - kpis.pontosParaProximoNivel) / 100) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Meta de Vencidos */}
          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <Target size={24} weight="duotone" className="text-white" />
              </div>
              <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Meta</span>
            </div>
            <div className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              {(kpis.percentualVencidos * 100).toFixed(1)}%
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
              Vencidos (Meta: {(kpis.metaVencidos * 100).toFixed(1)}%)
            </div>
            <div className="mt-3">
              <div className="flex items-center space-x-2">
                {kpis.percentualVencidos <= kpis.metaVencidos ? (
                  <CheckCircle size={16} weight="duotone" className="text-green-500" />
                ) : (
                  <XCircle size={16} weight="duotone" className="text-red-500" />
                )}
                <span className={`text-xs ${kpis.percentualVencidos <= kpis.metaVencidos ? 'text-green-500' : 'text-red-500'}`}>
                  {kpis.percentualVencidos <= kpis.metaVencidos ? 'Meta atingida!' : 'Meta não atingida'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas Críticos - Vencidos */}
        <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <XCircle size={24} weight="duotone" className="text-red-500" />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>🚨 Produtos Vencidos</h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Ação imediata necessária</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-red-500/20 text-red-600 rounded-full text-sm font-medium">
              {alertas.vencidas.length} produtos
            </span>
          </div>

          <div className="space-y-3">
            {alertas.vencidas.map((produto) => (
              <div key={produto.id} className="flex items-center justify-between p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                    <Package size={20} weight="duotone" className="text-red-500" />
                  </div>
                  <div>
                    <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{produto.nome}</div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>{produto.categoria}</span>
                      <span className={`${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                        Venceu há {Math.abs(calcularDiasVencimento(produto.vencimento))} dias
                      </span>
                      <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                        Qtd: {produto.quantidade}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadeColor(produto.prioridade)}`}>
                    {getPrioridadeIcon(produto.prioridade)}
                    <span className="ml-1">{produto.prioridade}</span>
                  </span>
                  <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2">
                    <span>Resolver</span>
                    <ArrowRight size={16} weight="duotone" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas de Atenção - Vencendo em 7 dias */}
        <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Warning size={24} weight="duotone" className="text-yellow-500" />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>⚠️ Vencendo em 7 dias</h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>Planeje a renovação</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-600 rounded-full text-sm font-medium">
              {alertas.vencendo7dias.length} produtos
            </span>
          </div>

          <div className="space-y-3">
            {alertas.vencendo7dias.map((produto) => (
              <div key={produto.id} className="flex items-center justify-between p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <Package size={20} weight="duotone" className="text-yellow-500" />
                  </div>
                  <div>
                    <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{produto.nome}</div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>{produto.categoria}</span>
                      <span className={`${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                        Vence em {calcularDiasVencimento(produto.vencimento)} dias
                      </span>
                      <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                        Qtd: {produto.quantidade}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadeColor(produto.prioridade)}`}>
                    {getPrioridadeIcon(produto.prioridade)}
                    <span className="ml-1">{produto.prioridade}</span>
                  </span>
                  <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2">
                    <span>Renovar</span>
                    <ArrowRight size={16} weight="duotone" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas de Monitoramento - Vencendo em 30 dias */}
        <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Clock size={24} weight="duotone" className="text-blue-500" />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>📅 Vencendo em 30 dias</h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Monitoramento preventivo</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-600 rounded-full text-sm font-medium">
              {alertas.vencendo30dias.length} produtos
            </span>
          </div>

          <div className="space-y-3">
            {alertas.vencendo30dias.map((produto) => (
              <div key={produto.id} className="flex items-center justify-between p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Package size={20} weight="duotone" className="text-blue-500" />
                  </div>
                  <div>
                    <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{produto.nome}</div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>{produto.categoria}</span>
                      <span className={`${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                        Vence em {calcularDiasVencimento(produto.vencimento)} dias
                      </span>
                      <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                        Qtd: {produto.quantidade}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadeColor(produto.prioridade)}`}>
                    {getPrioridadeIcon(produto.prioridade)}
                    <span className="ml-1">{produto.prioridade}</span>
                  </span>
                  <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2">
                    <span>Monitorar</span>
                    <ArrowRight size={16} weight="duotone" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <FooterNavigation />
    </div>
  )
}
