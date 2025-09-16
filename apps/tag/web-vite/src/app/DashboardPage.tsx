import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useOperations } from '@/hooks/useOperations'
import { useLimits } from '@/hooks/useLimits'
import { useDashboard } from '@/hooks/useDashboard'
import { Tag, Plus, Printer, Package, ChartLine, Eye, Gear, Warning, XCircle, User, SignOut, CaretDown } from '@phosphor-icons/react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import FooterNavigation from '@/components/FooterNavigation'
import LimitsIndicator from '@/components/LimitsIndicator'

export default function DashboardPage() {
  const { theme } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { activeOperations, loadActiveOperations, isLoading: operationsLoading } = useOperations()
  const { canPrintLabels } = useLimits(user?.clientId)
  
  // Para usuários manager, usar o primeiro cliente disponível
  const clientId = user?.clientId || (user?.role === 'manager' ? '6621e831-5d1d-4801-8c33-b0f93446a3df' : undefined)
  
  const { dashboardData, loading: dashboardLoading, error: dashboardError, refreshDashboard } = useDashboard(clientId)
  
  const [showUserPopover, setShowUserPopover] = useState(false)
  const [showEstabelecimentosDropdown, setShowEstabelecimentosDropdown] = useState(false)
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null)

  // Carregar operações quando o componente montar
  useEffect(() => {
    if (user?.clientId) {
      loadActiveOperations(user.clientId);
    }
  }, [user?.clientId]);

  // Definir a primeira operação como selecionada quando as operações carregarem
  useEffect(() => {
    if (activeOperations.length > 0 && !selectedOperation) {
      setSelectedOperation(activeOperations[0].id);
    }
  }, [activeOperations, selectedOperation]);

  // Fechar popover quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.user-popover')) {
        setShowUserPopover(false)
      }
      if (!target.closest('.estabelecimentos-dropdown')) {
        setShowEstabelecimentosDropdown(false)
      }
    }

    if (showUserPopover || showEstabelecimentosDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserPopover, showEstabelecimentosDropdown])

  // Usar dados reais ou fallback para loading
  const stats = dashboardData?.stats || {
    totalLabels: 0,
    labelsToday: 0,
    labelsThisWeek: 0,
    labelsThisMonth: 0,
    expiring15Days: 0,
    expired: 0,
    score: 0,
    level: 'Bronze' as const,
    percentageExpired: 0,
    targetExpired: 0.2,
    pointsToNextLevel: 0,
    nextLevel: 'Prata'
  }

  const recentEtiquetas = dashboardData?.recentLabels || []

  const quickActions = [
    { icon: Plus, label: 'Nova Etiqueta', color: 'bg-primary', href: '/etiquetas/nova', requiresLabelLimit: true },
    { icon: Printer, label: 'Imprimir', color: 'bg-dark-700', href: '/imprimir', requiresLabelLimit: true },
    { icon: Package, label: 'Estoque', color: 'bg-dark-700', href: '/estoque' },
    { icon: ChartLine, label: 'Relatórios', color: 'bg-dark-700', href: '/relatorios' },
  ]

  // Converter operações para o formato esperado pelo dropdown
  const estabelecimentos = activeOperations.map(op => ({
    id: op.id,
    nome: op.name,
    tipo: 'Operação',
    ativo: op.status === 'active' && op.isActive
  }))
  
  const estabelecimentoAtivo = estabelecimentos.find(e => e.id === selectedOperation) || estabelecimentos[0]

  const usuario = {
    nome: user?.name || 'Usuário',
    iniciais: user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'
  }

  // Função para validar ações que requerem limite de etiquetas
  const handleActionClick = async (action: any) => {
    if (action.requiresLabelLimit && user?.clientId) {
      const canPrint = await canPrintLabels(1); // Verificar se pode imprimir pelo menos 1 etiqueta
      if (!canPrint) {
        toast.error('Limite de etiquetas atingido para este mês. Faça upgrade do seu plano.');
        return;
      }
    }
    
    // Se chegou até aqui, pode prosseguir com a ação
    window.location.href = action.href;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'}`}>
      {/* Header Fixo com Background Desfocado */}
      <header className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-b px-4 py-4 sticky top-0 z-10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Tag size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Granobox Tag</h1>
              <p className="text-primary text-sm">Smart Tag. Smart Food.</p>
            </div>
          </div>
          
          {/* Estabelecimento, Limites e Usuário */}
          <div className="flex items-center space-x-4">
            {/* Indicador de Limites */}
            {user?.clientId && (
              <LimitsIndicator clientId={user.clientId} compact={true} />
            )}
            
            {/* Nome do Estabelecimento com Dropdown */}
            <div className="relative hidden sm:block estabelecimentos-dropdown">
              <div 
                className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-dark-700/20 transition-colors"
                onClick={() => setShowEstabelecimentosDropdown(!showEstabelecimentosDropdown)}
              >
                <div className="text-right">
                  <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    {operationsLoading ? 'Carregando...' : (estabelecimentoAtivo?.nome || 'Nenhuma operação')}
                  </div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                    {estabelecimentoAtivo?.tipo || 'Operação'}
                  </div>
                </div>
                <CaretDown size={16} weight="duotone" className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} />
              </div>
              
              {/* Dropdown de Estabelecimentos */}
              {showEstabelecimentosDropdown && (
                <div className={`absolute right-0 top-12 w-64 rounded-xl border shadow-2xl z-50 ${
                  theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
                }`}>
                  <div className="p-2">
                    {estabelecimentos.length === 0 ? (
                      <div className={`p-4 text-center ${theme === 'dark' ? 'text-dark-400' : 'text-gray-500'}`}>
                        Nenhuma operação disponível
                      </div>
                    ) : (
                      estabelecimentos.map((estabelecimento) => (
                        <div
                          key={estabelecimento.id}
                          className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                            estabelecimento.id === selectedOperation
                              ? 'bg-primary/20 text-primary'
                              : theme === 'dark'
                              ? 'hover:bg-dark-700 text-dark-300'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                          onClick={() => {
                            setSelectedOperation(estabelecimento.id);
                            setShowEstabelecimentosDropdown(false);
                          }}
                        >
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">
                              {estabelecimento.nome.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{estabelecimento.nome}</div>
                            <div className="text-xs opacity-75">{estabelecimento.tipo}</div>
                          </div>
                          {estabelecimento.ativo && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Botão de Configurações */}
            <a 
              href="/configuracoes"
              className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'}`}
            >
              <Gear size={24} weight="duotone" className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} />
            </a>
            
            {/* Avatar do Usuário com Popover */}
            <div className="relative user-popover">
              <div 
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors shadow-lg"
                onClick={() => setShowUserPopover(!showUserPopover)}
              >
                <span className="text-white text-sm font-bold">{usuario.iniciais}</span>
              </div>
              
              {/* Popover do Usuário */}
              {showUserPopover && (
                <div className={`absolute right-0 top-12 w-64 rounded-xl border shadow-2xl z-50 ${
                  theme === 'dark' 
                    ? 'bg-dark-800 border-dark-700' 
                    : 'bg-white border-gray-200'
                }`}>
                  {/* Header do Popover */}
                  <div className={`p-4 border-b ${
                    theme === 'dark' ? 'border-dark-700' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{usuario.iniciais}</span>
                      </div>
                      <div>
                        <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {usuario.nome}
                        </div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-gray-500'}`}>
                          Administrador
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Opções do Usuário */}
                  <div className="p-2">
                    <a 
                      href="/perfil"
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        theme === 'dark' 
                          ? 'hover:bg-dark-700 text-dark-300' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <User size={20} weight="duotone" className={theme === 'dark' ? 'text-dark-400' : 'text-gray-600'} />
                      <span>Meu Perfil</span>
                    </a>
                    
                    <a 
                      href="/configuracoes"
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        theme === 'dark' 
                          ? 'hover:bg-dark-700 text-dark-300' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Gear size={20} weight="duotone" className={theme === 'dark' ? 'text-dark-400' : 'text-gray-600'} />
                      <span>Configurações</span>
                    </a>
                    
                    <div className={`border-t my-2 ${
                      theme === 'dark' ? 'border-dark-700' : 'border-gray-200'
                    }`}></div>
                    
                    <button 
                      onClick={() => {
                        logout();
                        toast.success('Logout realizado com sucesso!');
                        navigate('/login');
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                        theme === 'dark' 
                          ? 'hover:bg-red-900/20 text-red-400' 
                          : 'hover:bg-red-50 text-red-600'
                      }`}
                    >
                      <SignOut size={20} weight="duotone" />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="px-4 py-6 space-y-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-800' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Tag size={24} weight="duotone" className="text-primary" />
              </div>
              <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Ativas</span>
            </div>
            <div className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              {dashboardLoading ? '...' : stats.totalLabels}
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Etiquetas</div>
          </div>

          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-800' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <ChartLine size={24} weight="duotone" className="text-primary" />
              </div>
              <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Hoje</span>
            </div>
            <div className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              {dashboardLoading ? '...' : stats.labelsToday}
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Criadas</div>
          </div>

          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-800' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl relative overflow-hidden transition-all duration-300 ${
            stats.expiring15Days > 0 ? 'border-yellow-500/30' : ''
          }`}>
            {/* Indicador de alerta pulsante */}
            {stats.expiring15Days > 0 && (
              <div className="absolute top-2 right-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Warning size={24} weight="duotone" className="text-yellow-500" />
              </div>
              <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Vencendo</span>
            </div>
            <div className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              {dashboardLoading ? '...' : stats.expiring15Days}
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Em 15 dias</div>
          </div>

          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-800' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl relative overflow-hidden transition-all duration-300 ${
            stats.expired > 0 ? 'border-red-500/30' : ''
          }`}>
            {/* Indicador de alerta crítico pulsante */}
            {stats.expired > 0 && (
              <div className="absolute top-2 right-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <XCircle size={24} weight="duotone" className="text-red-500" />
              </div>
              <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Vencidas</span>
            </div>
            <div className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              {dashboardLoading ? '...' : stats.expired}
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Atenção!</div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-800' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
          <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => {
              const isPrimary = action.color === 'bg-primary';
              
              return (
                <button
                  key={index}
                  onClick={() => handleActionClick(action)}
                  className={`${
                    isPrimary 
                      ? 'bg-primary' 
                      : theme === 'dark' ? 'bg-dark-700' : 'bg-dark-500'
                  } rounded-2xl p-4 flex flex-col items-center justify-center transition-all duration-200 hover:scale-102 shadow-lg`}
                >
                  <action.icon size={32} weight="duotone" className="text-white mb-2" />
                  <span className="text-white text-sm font-medium text-center">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>


        {/* Etiquetas Recentes */}
        <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-800' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Etiquetas Recentes</h2>
            <button className="text-primary hover:text-primary-400 text-sm font-medium transition-colors">
              Ver Todas
            </button>
          </div>
          
          <div className="space-y-3">
            {dashboardLoading ? (
              <div className="text-center py-8">
                <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  Carregando etiquetas...
                </div>
              </div>
            ) : recentEtiquetas.length === 0 ? (
              <div className="text-center py-8">
                <Tag size={48} className={`mx-auto mb-2 ${theme === 'dark' ? 'text-dark-600' : 'text-gray-400'}`} />
                <p className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Nenhuma etiqueta criada ainda
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  Crie sua primeira etiqueta para começar
                </p>
              </div>
            ) : (
              recentEtiquetas.map((etiqueta) => (
                <div key={etiqueta.id} className={`flex items-center justify-between p-4 rounded-xl border ${
                  theme === 'dark' ? 'bg-dark-700 border-dark-800' : 'bg-light-100 border-light-300'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <Tag size={20} weight="duotone" className="text-primary" />
                    </div>
                    <div>
                      <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{etiqueta.name}</div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                        {etiqueta.type === 'validity' ? 'Validade' : 'Rótulo'} • <span className="font-mono font-semibold text-primary">{etiqueta.code}</span> • Qtd: {etiqueta.quantity}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      etiqueta.status === 'printed' 
                        ? 'bg-green-100 text-green-800' 
                        : etiqueta.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {etiqueta.status === 'printed' ? 'Impressa' : 
                       etiqueta.status === 'pending' ? 'Pendente' : 'Falhou'}
                    </div>
                    <button 
                      onClick={() => navigate(`/etiquetas`)}
                      className={`p-2 transition-colors ${
                        theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'
                      }`}
                    >
                      <Eye size={18} weight="duotone" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Resumo Semanal */}
        <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-800' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
          <h2 className={`text-lg font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Resumo Semanal</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                {dashboardLoading ? '...' : stats.labelsThisWeek}
              </div>
              <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Esta Semana</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                {dashboardLoading ? '...' : stats.labelsThisMonth}
              </div>
              <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Este Mês</div>
            </div>
          </div>
        </div>
      </main>


      {/* Footer Navigation */}
      <FooterNavigation />

      {/* Espaçamento para o bottom navigation */}
      <div className="h-24"></div>
    </div>
  )
}
