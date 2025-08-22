import { useTheme } from '@/contexts/ThemeContext'
import { Tag, Plus, Printer, Package, ChartLine, Eye, Gear, Warning, XCircle, Info, Trophy, Target, User, SignOut, CaretDown } from '@phosphor-icons/react'
import { useState, useEffect } from 'react'
import FooterNavigation from '@/components/FooterNavigation'

export default function DashboardPage() {
  const { theme, toggleTheme } = useTheme()
  const [showModal, setShowModal] = useState(false)
  const [showUserPopover, setShowUserPopover] = useState(false)
  const [showEstabelecimentosDropdown, setShowEstabelecimentosDropdown] = useState(false)

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

  const stats = {
    totalEtiquetas: 1247,
    etiquetasHoje: 23,
    etiquetasSemana: 156,
    etiquetasMes: 642,
    vencendo15dias: 12,
    vencidas: 5,
    score: 85,
    nivel: 'Prata',
    percentualVencidos: 0.4,
    metaVencidos: 0.2,
    pontosParaProximoNivel: 15,
    proximoNivel: 'Ouro'
  }

  const recentEtiquetas = [
    { id: 1, nome: 'Pão Francês', tipo: 'Produto Final', codigo: 'PF12A3', data: '2025-01-21' },
    { id: 2, nome: 'Farinha de Trigo', tipo: 'Matéria Prima', codigo: 'MP45B6', data: '2025-01-21' },
    { id: 3, nome: 'Bolo de Chocolate', tipo: 'Manipulado', codigo: 'MN78C9', data: '2025-01-20' },
    { id: 4, nome: 'Ovos', tipo: 'Matéria Prima', codigo: 'MP12D4', data: '2025-01-20' },
  ]

  const quickActions = [
    { icon: Plus, label: 'Nova Etiqueta', color: 'bg-primary', href: '/etiquetas/nova' },
    { icon: Printer, label: 'Imprimir', color: 'bg-dark-700', href: '/imprimir' },
    { icon: Package, label: 'Estoque', color: 'bg-dark-700', href: '/estoque' },
    { icon: ChartLine, label: 'Relatórios', color: 'bg-dark-700', href: '/relatorios' },
  ]

  const estabelecimentos = [
    { id: 1, nome: 'Padaria Central', tipo: 'Padaria', ativo: true },
    { id: 2, nome: 'Restaurante Sabor & Arte', tipo: 'Restaurante', ativo: false },
    { id: 3, nome: 'Confeitaria Doce Lar', tipo: 'Confeitaria', ativo: false },
    { id: 4, nome: 'Mercearia Familiar', tipo: 'Mercearia', ativo: false }
  ]
  
  const estabelecimentoAtivo = estabelecimentos.find(e => e.ativo) || estabelecimentos[0]

  const usuario = {
    nome: 'João Silva',
    iniciais: 'JS'
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'}`}>
      {/* Header Fixo com Background Desfocado */}
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b shadow-2xl ${
        theme === 'dark' 
          ? 'bg-dark-950/95 border-dark-800' 
          : 'bg-white/95 border-light-200'
      }`}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Tag size={24} weight="duotone" className="text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Granobox Tag</h1>
              <p className="text-primary text-sm">Smart Tag. Smart Food.</p>
            </div>
          </div>
          
          {/* Estabelecimento e Usuário */}
          <div className="flex items-center space-x-4">
            {/* Nome do Estabelecimento com Dropdown */}
            <div className="relative hidden sm:block estabelecimentos-dropdown">
              <div 
                className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-dark-700/20 transition-colors"
                onClick={() => setShowEstabelecimentosDropdown(!showEstabelecimentosDropdown)}
              >
                <div className="text-right">
                  <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    {estabelecimentoAtivo.nome}
                  </div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                    {estabelecimentoAtivo.tipo}
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
                    {estabelecimentos.map((estabelecimento) => (
                      <div
                        key={estabelecimento.id}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                          estabelecimento.ativo
                            ? 'bg-primary/20 text-primary'
                            : theme === 'dark'
                            ? 'hover:bg-dark-700 text-dark-300'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                        onClick={() => {
                          // Aqui você implementaria a lógica de troca de estabelecimento
                          setShowEstabelecimentosDropdown(false)
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
                    ))}
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
                    
                    <button className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      theme === 'dark' 
                        ? 'hover:bg-red-900/20 text-red-400' 
                        : 'hover:bg-red-50 text-red-600'
                    }`}>
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

      {/* Conteúdo Principal com padding-top para o header fixo */}
      <main className="pt-32 px-6 py-6 space-y-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-800' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Tag size={24} weight="duotone" className="text-primary" />
              </div>
              <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Ativas</span>
            </div>
            <div className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{stats.totalEtiquetas}</div>
            <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Etiquetas</div>
          </div>

          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-800' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <ChartLine size={24} weight="duotone" className="text-primary" />
              </div>
              <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Hoje</span>
            </div>
            <div className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{stats.etiquetasHoje}</div>
            <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Criadas</div>
          </div>

          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-800' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl relative overflow-hidden transition-all duration-300 ${
            stats.vencendo15dias > 0 ? 'border-yellow-500/30' : ''
          }`}>
            {/* Indicador de alerta pulsante */}
            {stats.vencendo15dias > 0 && (
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
            <div className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{stats.vencendo15dias}</div>
            <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Em 15 dias</div>
          </div>

          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-800' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl relative overflow-hidden transition-all duration-300 ${
            stats.vencidas > 0 ? 'border-red-500/30' : ''
          }`}>
            {/* Indicador de alerta crítico pulsante */}
            {stats.vencidas > 0 && (
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
            <div className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{stats.vencidas}</div>
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
                <a
                  key={index}
                  href={action.href}
                  className={`${
                    isPrimary 
                      ? 'bg-primary' 
                      : theme === 'dark' ? 'bg-dark-700' : 'bg-dark-500'
                  } rounded-2xl p-4 flex flex-col items-center justify-center transition-all duration-200 hover:scale-102 shadow-lg`}
                >
                  <action.icon size={32} weight="duotone" className="text-white mb-2" />
                  <span className="text-white text-sm font-medium text-center">{action.label}</span>
                </a>
              );
            })}
          </div>
        </div>

        {/* KPIs Gamificados */}
        <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Performance & Metas</h2>
            <button 
              onClick={() => setShowModal(true)}
              className="p-3 text-primary hover:text-primary-600 transition-colors flex items-center justify-center"
              title="Ver Detalhes"
            >
              <Info size={20} weight="duotone" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Score de Qualidade */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{stats.score}</span>
              </div>
              <div className={`text-lg font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Score</div>
              <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Nível {stats.nivel}</div>
            </div>

            {/* Meta de Vencidos */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{Math.round(stats.percentualVencidos * 100)}%</span>
              </div>
              <div className={`text-lg font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Vencidos</div>
              <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                Meta: {Math.round(stats.metaVencidos * 100)}%
              </div>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Progresso para próximo nível</span>
              <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>{stats.pontosParaProximoNivel} pts</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${((100 - stats.pontosParaProximoNivel) / 100) * 100}%` }}
              ></div>
            </div>
            <div className="text-center mt-2">
              <span className={`text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                Próximo: {stats.proximoNivel}
              </span>
            </div>
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
            {recentEtiquetas.map((etiqueta) => (
              <div key={etiqueta.id} className={`flex items-center justify-between p-4 rounded-xl border ${
                theme === 'dark' ? 'bg-dark-700 border-dark-800' : 'bg-light-100 border-light-300'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Tag size={20} weight="duotone" className="text-primary" />
                  </div>
                  <div>
                    <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{etiqueta.nome}</div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>{etiqueta.tipo} • {etiqueta.codigo}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className={`p-2 transition-colors ${
                    theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'
                  }`}>
                    <Eye size={18} weight="duotone" />
                  </button>
                  <button className={`p-2 transition-colors ${
                    theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'
                  }`}>
                    <Printer size={18} weight="duotone" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo Semanal */}
        <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-800' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
          <h2 className={`text-lg font-semibold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Resumo Semanal</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{stats.etiquetasSemana}</div>
              <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Esta Semana</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{stats.etiquetasMes}</div>
              <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Este Mês</div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Explicativo */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-2xl max-w-md w-full`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Como funciona o Score?</h3>
              <button 
                onClick={() => setShowModal(false)}
                className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'}`}
              >
                <XCircle size={20} weight="duotone" className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className={`font-medium mb-2 flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  <Trophy size={20} weight="duotone" className="text-yellow-500" />
                  <span>Score de Qualidade</span>
                </h4>
                <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  O score é calculado com base na gestão eficiente do estoque. Quanto menor a taxa de produtos vencidos e melhor o planejamento, maior será sua pontuação.
                </p>
              </div>
              
              <div>
                <h4 className={`font-medium mb-2 flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  <ChartLine size={20} weight="duotone" className="text-green-500" />
                  <span>Taxa de Vencidos</span>
                </h4>
                <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  Representa a porcentagem de produtos que vencem antes de serem utilizados. A meta é manter essa taxa abaixo de 0.2% para um score alto.
                </p>
              </div>
              
              <div>
                <h4 className={`font-medium mb-2 flex items-center space-x-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  <Target size={20} weight="duotone" className="text-blue-500" />
                  <span>Níveis de Conquista</span>
                </h4>
                <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  <strong>Bronze:</strong> 0-50 pts | <strong>Prata:</strong> 51-75 pts | <strong>Ouro:</strong> 76-90 pts | <strong>Diamante:</strong> 91-100 pts
                </p>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-full px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-full text-sm font-medium transition-colors"
                >
                  Entendi!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <FooterNavigation />

      {/* Espaçamento para o bottom navigation */}
      <div className="h-24"></div>
    </div>
  )
}
