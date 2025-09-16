import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useAlerts } from '@/hooks/useAlerts'
import { SectionLoading } from '@/components/LoadingSpinner'
import { 
  Warning, 
  XCircle, 
  CheckCircle, 
  Clock, 
  Package,
  ArrowRight,
  Thermometer,
  House,
  Snowflake
} from '@phosphor-icons/react'
import FooterNavigation from '@/components/FooterNavigation'

export default function AlertasPage() {
  const { theme } = useTheme()
  const { user } = useAuth()
  
  // Para usuários manager, usar o primeiro cliente disponível
  const clientId = user?.clientId || (user?.role === 'manager' ? '6621e831-5d1d-4801-8c33-b0f93446a3df' : undefined)
  
  const { alertsData, loading, error, resolveAlert, refreshAlerts } = useAlerts(clientId)

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-500 text-white'
      case 'média': return 'bg-yellow-500 text-white'
      case 'baixa': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
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

  const getConservationIcon = (conservationType?: string) => {
    switch (conservationType) {
      case 'refrigerado': return <Thermometer size={16} weight="duotone" className="text-blue-500" />
      case 'congelado': return <Snowflake size={16} weight="duotone" className="text-cyan-500" />
      case 'ambiente': 
      default: return <House size={16} weight="duotone" className="text-green-500" />
    }
  }

  const getConservationText = (conservationType?: string) => {
    switch (conservationType) {
      case 'refrigerado': return 'Refrigerado'
      case 'congelado': return 'Congelado'
      case 'ambiente':
      default: return 'Ambiente'
    }
  }

  const handleResolveAlert = async (labelId: string) => {
    try {
      await resolveAlert(labelId)
    } catch (error) {
      console.error('Erro ao resolver alerta:', error)
    }
  }

  // Mostrar loading se não há dados ainda
  if (loading && !alertsData) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900 text-white' : 'bg-light-50 text-dark-900'}`}>
        <SectionLoading text="Carregando alertas..." size="xl" />
      </div>
    )
  }

  // Mostrar erro se não conseguiu carregar
  if (error && !alertsData) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900 text-white' : 'bg-light-50 text-dark-900'}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Warning size={48} className="mx-auto text-red-500 mb-4" />
            <p className="text-lg mb-2">Erro ao carregar alertas</p>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button
              onClick={refreshAlerts}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Se não há dados, mostrar estado vazio
  if (!alertsData) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900 text-white' : 'bg-light-50 text-dark-900'}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Package size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-lg">Nenhum alerta encontrado</p>
            <p className="text-sm text-gray-600">Não há produtos vencidos ou vencendo</p>
          </div>
        </div>
      </div>
    )
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
            <div>
              <h1 className="text-xl font-bold">Alertas</h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                Produtos próximos ao vencimento
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="p-4 space-y-6 pb-24">

        {/* Alertas Críticos - Vencidos */}
        <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <XCircle size={24} weight="duotone" className="text-red-500" />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Produtos Vencidos</h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Ação imediata necessária</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-red-500/20 text-red-600 rounded-full text-sm font-medium">
              {alertsData.expired.length} produtos
            </span>
          </div>

          <div className="space-y-3">
            {alertsData.expired.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="mx-auto text-green-500 mb-2" />
                <p className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Nenhum produto vencido!
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  Excelente gestão de estoque
                </p>
              </div>
            ) : (
              alertsData.expired.map((produto) => (
                <div key={produto.labelId} className="flex items-center justify-between p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                      <Package size={20} weight="duotone" className="text-red-500" />
                    </div>
                    <div>
                      <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{produto.name}</div>
                      <div className="flex items-center space-x-4 text-sm flex-wrap">
                        <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} whitespace-nowrap`}>{produto.category}</span>
                        <span className={`${theme === 'dark' ? 'text-red-400' : 'text-red-600'} whitespace-nowrap`}>
                          Venceu há {Math.abs(produto.daysToExpiration)} dias
                        </span>
                        <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} whitespace-nowrap`}>
                          Qtd: {produto.quantity}
                        </span>
                        <div className="flex items-center space-x-1">
                          {getConservationIcon(produto.conservationType)}
                          <span className={`text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                            {getConservationText(produto.conservationType)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getPrioridadeColor(produto.priority)}`}>
                      {produto.priority}
                    </span>
                    <button 
                      onClick={() => handleResolveAlert(produto.labelId)}
                      disabled={loading}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2"
                    >
                      <span>Resolver</span>
                      <ArrowRight size={16} weight="duotone" />
                    </button>
                  </div>
                </div>
              ))
            )}
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
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Vencendo em 7 dias</h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>Use antes do vencimento</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-600 rounded-full text-sm font-medium">
              {alertsData.expiring7Days.length} produtos
            </span>
          </div>

          <div className="space-y-3">
            {alertsData.expiring7Days.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="mx-auto text-green-500 mb-2" />
                <p className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Nenhum produto vencendo em 7 dias
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  Controle preventivo em dia
                </p>
              </div>
            ) : (
              alertsData.expiring7Days.map((produto) => (
                <div key={produto.labelId} className="flex items-center justify-between p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <Package size={20} weight="duotone" className="text-yellow-500" />
                    </div>
                    <div>
                      <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{produto.name}</div>
                      <div className="flex items-center space-x-4 text-sm flex-wrap">
                        <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} whitespace-nowrap`}>{produto.category}</span>
                        <span className={`${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'} whitespace-nowrap`}>
                          Vence em {produto.daysToExpiration} dias
                        </span>
                        <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} whitespace-nowrap`}>
                          Qtd: {produto.quantity}
                        </span>
                        <div className="flex items-center space-x-1">
                          {getConservationIcon(produto.conservationType)}
                          <span className={`text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                            {getConservationText(produto.conservationType)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getPrioridadeColor(produto.priority)}`}>
                      {produto.priority}
                    </span>
                    <button 
                      onClick={() => handleResolveAlert(produto.labelId)}
                      disabled={loading}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2"
                    >
                      <span>Renovar</span>
                      <ArrowRight size={16} weight="duotone" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alertas de Monitoramento - Vencendo em 30 dias */}
        <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-500/20 rounded-full flex items-center justify-center">
                <Clock size={24} weight="duotone" className="text-gray-500" />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Vencendo em 30 dias</h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Monitoramento preventivo</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-gray-500/20 text-gray-600 rounded-full text-sm font-medium">
              {alertsData.expiring30Days.length} produtos
            </span>
          </div>

          <div className="space-y-3">
            {alertsData.expiring30Days.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={48} className="mx-auto text-green-500 mb-2" />
                <p className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Nenhum produto vencendo em 30 dias
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  Planejamento de longo prazo em ordem
                </p>
              </div>
            ) : (
              alertsData.expiring30Days.map((produto) => (
                <div key={produto.labelId} className="flex items-center justify-between p-4 bg-gray-500/10 rounded-xl border border-gray-500/20">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-500/20 rounded-full flex items-center justify-center">
                      <Package size={20} weight="duotone" className="text-gray-500" />
                    </div>
                    <div>
                      <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{produto.name}</div>
                      <div className="flex items-center space-x-4 text-sm flex-wrap">
                        <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} whitespace-nowrap`}>{produto.category}</span>
                        <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} whitespace-nowrap`}>
                          Vence em {produto.daysToExpiration} dias
                        </span>
                        <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} whitespace-nowrap`}>
                          Qtd: {produto.quantity}
                        </span>
                        <div className="flex items-center space-x-1">
                          {getConservationIcon(produto.conservationType)}
                          <span className={`text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                            {getConservationText(produto.conservationType)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getPrioridadeColor(produto.priority)}`}>
                      {produto.priority}
                    </span>
                    <button 
                      onClick={() => handleResolveAlert(produto.labelId)}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2"
                    >
                      <span>Monitorar</span>
                      <ArrowRight size={16} weight="duotone" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <FooterNavigation />
    </div>
  )
}
