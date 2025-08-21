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
  Bell,
  SortAscending,
  SortDescending
} from '@phosphor-icons/react'
import { useState } from 'react'

export default function EtiquetasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('todos')
  const [sortBy, setSortBy] = useState('data')
  const [sortOrder, setSortOrder] = useState('desc')

  // Dados mockados para demonstração
  const etiquetas = [
    { 
      id: 1, 
      nome: 'Pão Francês', 
      tipo: 'Produto Final', 
      codigo: 'PF12A3', 
      data: '2025-01-21',
      quantidade: 50,
      unidade: 'un',
      status: 'ativa'
    },
    { 
      id: 2, 
      nome: 'Farinha de Trigo', 
      tipo: 'Matéria Prima', 
      codigo: 'MP45B6', 
      data: '2025-01-21',
      quantidade: 25,
      unidade: 'kg',
      status: 'ativa'
    },
    { 
      id: 3, 
      nome: 'Bolo de Chocolate', 
      tipo: 'Manipulado', 
      codigo: 'MN78C9', 
      data: '2025-01-20',
      quantidade: 12,
      unidade: 'un',
      status: 'ativa'
    },
    { 
      id: 4, 
      nome: 'Ovos', 
      tipo: 'Matéria Prima', 
      codigo: 'MP12D4', 
      data: '2025-01-20',
      quantidade: 100,
      unidade: 'un',
      status: 'inativa'
    },
    { 
      id: 5, 
      nome: 'Leite Integral', 
      tipo: 'Matéria Prima', 
      codigo: 'MP34E7', 
      data: '2025-01-19',
      quantidade: 20,
      unidade: 'L',
      status: 'ativa'
    },
    { 
      id: 6, 
      nome: 'Croissant', 
      tipo: 'Produto Final', 
      codigo: 'PF56F8', 
      data: '2025-01-19',
      quantidade: 30,
      unidade: 'un',
      status: 'ativa'
    }
  ]

  const tipos = [
    { value: 'todos', label: 'Todos os Tipos', count: etiquetas.length },
    { value: 'materia-prima', label: 'Matéria Prima', count: etiquetas.filter(e => e.tipo === 'Matéria Prima').length },
    { value: 'manipulado', label: 'Manipulado', count: etiquetas.filter(e => e.tipo === 'Manipulado').length },
    { value: 'produto-final', label: 'Produto Final', count: etiquetas.filter(e => e.tipo === 'Produto Final').length }
  ]

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Matéria Prima': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'Manipulado': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'Produto Final': return 'bg-green-500/20 text-green-400 border-green-500/30'
              default: return 'bg-dark-500/20 text-dark-400 border-dark-500/30'
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'ativa' 
      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
      : 'bg-red-500/20 text-red-400 border-red-500/30'
  }

  const filteredEtiquetas = etiquetas.filter(etiqueta => {
    const matchesSearch = etiqueta.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         etiqueta.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'todos' || 
                       etiqueta.tipo.toLowerCase().replace(' ', '-') === filterType
    return matchesSearch && matchesType
  })

  const sortedEtiquetas = [...filteredEtiquetas].sort((a, b) => {
    if (sortBy === 'data') {
      return sortOrder === 'desc' 
        ? new Date(b.data).getTime() - new Date(a.data).getTime()
        : new Date(a.data).getTime() - new Date(b.data).getTime()
    }
    if (sortBy === 'nome') {
      return sortOrder === 'desc' 
        ? b.nome.localeCompare(a.nome)
        : a.nome.localeCompare(b.nome)
    }
    return 0
  })

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
              <h1 className="text-white text-xl font-bold">Etiquetas</h1>
              <p className="text-primary text-sm">Gerencie suas etiquetas</p>
            </div>
          </div>
          
          {/* Botão Nova Etiqueta */}
          <button className="bg-primary hover:bg-primary-600 text-white px-6 py-2 rounded-full font-medium transition-colors shadow-lg flex items-center space-x-2">
            <Plus size={20} weight="duotone" />
            <span>Nova Etiqueta</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="pt-32 px-6 py-6 space-y-6">
        {/* Filtros e Busca */}
        <div className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-xl">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <MagnifyingGlass 
                size={20} 
                weight="duotone" 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" 
              />
              <input
                type="text"
                placeholder="Buscar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-dark-700 border border-dark-600 rounded-full text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Filtro por Tipo */}
            <div className="flex gap-2">
              {tipos.map((tipo) => (
                <button
                  key={tipo.value}
                  onClick={() => setFilterType(tipo.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filterType === tipo.value
                      ? 'bg-primary text-white'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  }`}
                >
                  {tipo.label} ({tipo.count})
                </button>
              ))}
            </div>
          </div>

          {/* Ordenação */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-700">
            <div className="flex items-center space-x-4">
              <span className="text-dark-400 text-sm">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-dark-700 border border-dark-600 rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="data">Data</option>
                <option value="nome">Nome</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="p-2 text-dark-400 hover:text-white transition-colors"
              >
                {sortOrder === 'desc' ? (
                  <SortDescending size={20} weight="duotone" />
                ) : (
                  <SortAscending size={20} weight="duotone" />
                )}
              </button>
            </div>
            <span className="text-dark-400 text-sm">
              {filteredEtiquetas.length} etiqueta{filteredEtiquetas.length !== 1 ? 's' : ''} encontrada{filteredEtiquetas.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Lista de Etiquetas */}
        <div className="space-y-3">
          {sortedEtiquetas.map((etiqueta) => (
            <div key={etiqueta.id} className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-xl hover:border-dark-600 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <Tag size={24} weight="duotone" className="text-primary" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-white text-lg font-semibold">{etiqueta.nome}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTipoColor(etiqueta.tipo)}`}>
                        {etiqueta.tipo}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(etiqueta.status)}`}>
                        {etiqueta.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-dark-400">
                      <span><strong>Código:</strong> {etiqueta.codigo}</span>
                      <span><strong>Quantidade:</strong> {etiqueta.quantidade} {etiqueta.unidade}</span>
                      <span><strong>Data:</strong> {etiqueta.data}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-3 text-dark-400 hover:text-white hover:bg-dark-700 rounded-full transition-all">
                    <Eye size={18} weight="duotone" />
                  </button>
                  <button className="p-3 text-dark-400 hover:text-white hover:bg-dark-700 rounded-full transition-all">
                    <Printer size={18} weight="duotone" />
                  </button>
                  <button className="p-3 text-dark-400 hover:text-white hover:bg-dark-700 rounded-full transition-all">
                    <Pencil size={18} weight="duotone" />
                  </button>
                  <button className="p-3 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full transition-all">
                    <Trash size={18} weight="duotone" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Estado Vazio */}
        {sortedEtiquetas.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag size={48} weight="duotone" className="text-dark-400" />
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">Nenhuma etiqueta encontrada</h3>
            <p className="text-dark-400 mb-6">Tente ajustar os filtros ou criar uma nova etiqueta</p>
            <button className="bg-primary hover:bg-primary-600 text-white px-8 py-3 rounded-full font-medium transition-colors shadow-lg flex items-center space-x-2 mx-auto">
              <Plus size={20} weight="duotone" />
              <span>Criar Primeira Etiqueta</span>
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-dark-950/95 backdrop-blur-sm border-t border-dark-600 shadow-2xl">
        <div className="flex justify-around items-center px-6 py-4">
          <a href="/dashboard" className="flex flex-col items-center space-y-1 text-dark-400 hover:text-white transition-colors">
            <ChartLine size={24} weight="duotone" />
            <span className="text-xs font-medium">Dash</span>
          </a>
          <a href="/etiquetas" className="flex flex-col items-center space-y-1 text-primary">
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
