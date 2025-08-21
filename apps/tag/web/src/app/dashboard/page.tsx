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

export default function DashboardPage() {
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
    <div className="min-h-screen bg-dark-900">
      {/* Header Fixo com Background Desfocado */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-dark-950/95 backdrop-blur-sm border-b border-dark-600 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Tag size={24} weight="duotone" className="text-white" />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">Granobox Tag</h1>
              <p className="text-primary text-sm">Smart Tag. Smart Food.</p>
            </div>
          </div>
          
          {/* Estabelecimento e Usuário */}
          <div className="flex items-center space-x-4">
            {/* Nome do Estabelecimento */}
            <div className="text-right hidden sm:block">
              <div className="text-white text-sm font-medium">{estabelecimento.nome}</div>
              <div className="text-dark-400 text-xs">{estabelecimento.tipo}</div>
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
          <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Tag size={24} weight="duotone" className="text-primary" />
              </div>
              <span className="text-dark-400 text-sm">Total</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalEtiquetas}</div>
            <div className="text-dark-400 text-sm">Etiquetas</div>
          </div>

          <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <ChartLine size={24} weight="duotone" className="text-primary" />
              </div>
              <span className="text-dark-400 text-sm">Hoje</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.etiquetasHoje}</div>
            <div className="text-dark-400 text-sm">Criadas</div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-xl">
          <h2 className="text-white text-lg font-semibold mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <a
                key={index}
                href={action.href}
                className={`${action.color} rounded-2xl p-4 flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 shadow-lg`}
              >
                <action.icon size={32} weight="duotone" className="text-white mb-2" />
                <span className="text-white text-sm font-medium text-center">{action.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Etiquetas Recentes */}
        <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-semibold">Etiquetas Recentes</h2>
            <button className="text-primary hover:text-primary-400 text-sm font-medium transition-colors">
              Ver Todas
            </button>
          </div>
          
          <div className="space-y-3">
            {recentEtiquetas.map((etiqueta) => (
              <div key={etiqueta.id} className="flex items-center justify-between p-4 bg-dark-700 rounded-xl border border-dark-600">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Tag size={20} weight="duotone" className="text-primary" />
                  </div>
                  <div>
                    <div className="text-white font-medium">{etiqueta.nome}</div>
                    <div className="text-dark-400 text-sm">{etiqueta.tipo} • {etiqueta.codigo}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-dark-400 hover:text-white transition-colors">
                    <Eye size={18} weight="duotone" />
                  </button>
                  <button className="p-2 text-dark-400 hover:text-white transition-colors">
                    <Printer size={18} weight="duotone" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumo Semanal */}
        <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-xl">
          <h2 className="text-white text-lg font-semibold mb-1">Resumo Semanal</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">{stats.etiquetasSemana}</div>
              <div className="text-dark-400 text-sm">Esta Semana</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">{stats.etiquetasMes}</div>
              <div className="text-dark-400 text-sm">Este Mês</div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation com Background Sólido */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-dark-950/95 backdrop-blur-sm border-t border-dark-600 shadow-2xl">
        <div className="flex justify-around items-center px-6 py-4">
          <a href="/dashboard" className="flex flex-col items-center space-y-1 text-primary">
            <ChartLine size={24} weight="duotone" />
            <span className="text-xs font-medium">Dash</span>
          </a>
          <a href="/etiquetas" className="flex flex-col items-center space-y-1 text-dark-400 hover:text-white transition-colors">
            <Tag size={24} weight="duotone" />
            <span className="text-xs font-medium">Etiquetas</span>
          </a>
          <a href="/cadastros" className="flex flex-col items-center space-y-1 text-dark-400 hover:text-white transition-colors">
            <Package size={24} weight="duotone" />
            <span className="text-xs font-medium">Cadastros</span>
          </a>
          <a href="/configuracoes" className="flex flex-col items-center space-y-1 text-dark-400 hover:text-white transition-colors">
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
