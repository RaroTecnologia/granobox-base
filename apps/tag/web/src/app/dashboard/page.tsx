'use client'

import { 
  Tag, 
  Plus, 
  MagnifyingGlass, 
  Funnel, 
  Printer, 
  Pencil, 
  Trash, 
  Eye,
  ChartLine,
  Package,
  Gear,
  Bell
} from '@phosphor-icons/react'
import { useTheme } from '@/contexts/ThemeContext'
import { ThemeToggle } from '@/components/ThemeToggle'

export default function DashboardPage() {
  const { theme } = useTheme()
  // Dados mockados para demonstração
  const estabelecimento = {
    nome: 'Padaria do João',
    tipo: 'Padaria'
  }

  const usuario = {
    nome: 'João Silva',
    email: 'joao@padaria.com',
    iniciais: 'JS'
  }

  const stats = {
    totalEtiquetas: 1247,
    etiquetasHoje: 23,
    etiquetasSemana: 156,
    etiquetasMes: 892
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
            {/* Toggle de Tema */}
            <ThemeToggle />
            
            {/* Nome do Estabelecimento */}
            <div className="text-right hidden sm:block">
              <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{estabelecimento.nome}</div>
              <div className={`text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>{estabelecimento.tipo}</div>
            </div>
            
            {/* Avatar do Usuário */}
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors shadow-lg">
              <span className="text-white text-sm font-bold">{usuario.iniciais}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal com padding-top para o header fixo */}
      <main className="pt-32 px-6 py-6 space-y-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-800' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl `}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Tag size={24} weight="duotone" className="text-primary" />
              </div>
              <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Total</span>
            </div>
            <div className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{stats.totalEtiquetas}</div>
            <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Etiquetas</div>
          </div>

          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-800' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl `}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <ChartLine size={24} weight="duotone" className="text-primary" />
              </div>
              <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Hoje</span>
            </div>
            <div className={`text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{stats.etiquetasHoje}</div>
            <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Criadas</div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-800' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl `}>
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

        {/* Etiquetas Recentes */}
        <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-800' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl `}>
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
        <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-800' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl `}>
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

      {/* Bottom Navigation com Background Sólido */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 backdrop-blur-sm border-t shadow-2xl ${
        theme === 'dark' ? 'bg-dark-950/95 border-dark-800' : 'bg-white/95 border-light-200'
      }`}>
        <div className="flex justify-around items-center px-6 py-4">
          <a href="/dashboard" className="flex flex-col items-center space-y-1 text-primary">
            <ChartLine size={24} weight="duotone" />
            <span className="text-xs font-medium">Dash</span>
          </a>
          <a href="/etiquetas" className={`flex flex-col items-center space-y-1 transition-colors ${
            theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'
          }`}>
            <Tag size={24} weight="duotone" />
            <span className="text-xs font-medium">Etiquetas</span>
          </a>
          <a href="/cadastros" className={`flex flex-col items-center space-y-1 transition-colors ${
            theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'
          }`}>
            <Package size={24} weight="duotone" />
            <span className="text-xs font-medium">Cadastros</span>
          </a>
          <a href="/configuracoes" className={`flex flex-col items-center space-y-1 transition-colors ${
            theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'
          }`}>
            <Gear size={24} weight="duotone" />
            <span className="text-xs font-medium">Config</span>
          </a>
        </div>
      </nav>

      {/* Espaçamento para o bottom navigation */}
      <div className="h-24"></div>
    </div>
  )
}
