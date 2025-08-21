'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  TagIcon, 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  PrinterIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface Etiqueta {
  id: string;
  nome: string;
  codigo: string;
  tipo: 'materia-prima' | 'manipulados' | 'produtos';
  dataCriacao: string;
  ativa: boolean;
}

export default function EtiquetasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');
  const [etiquetas] = useState<Etiqueta[]>([
    {
      id: '1',
      nome: 'Farinha de Trigo',
      codigo: 'A2B4C6',
      tipo: 'materia-prima',
      dataCriacao: '2024-12-20',
      ativa: true
    },
    {
      id: '2',
      nome: 'Pão Francês',
      codigo: 'H3K7M9',
      tipo: 'produtos',
      dataCriacao: '2024-12-19',
      ativa: true
    },
    {
      id: '3',
      nome: 'Massa de Pizza',
      codigo: 'D5F8J2',
      tipo: 'manipulados',
      dataCriacao: '2024-12-18',
      ativa: true
    }
  ]);

  const filteredEtiquetas = etiquetas.filter(etiqueta => {
    const matchesSearch = etiqueta.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         etiqueta.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'todos' || etiqueta.tipo === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'materia-prima': return 'Matéria Prima';
      case 'manipulados': return 'Manipulados';
      case 'produtos': return 'Produtos';
      default: return tipo;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'materia-prima': return 'bg-orange-100 text-orange-800';
      case 'manipulados': return 'bg-gray-100 text-gray-800';
      case 'produtos': return 'bg-black text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <Link href="/" className="flex items-center hover:text-orange-400 transition-colors">
                <TagIcon className="h-8 w-8 text-orange-500" />
                <span className="ml-2 text-xl font-semibold">Granobox</span>
              </Link>
            </div>
            <Link 
              href="/etiquetas/nova"
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold transition-colors shadow-lg hover:shadow-xl flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nova Etiqueta
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">Minhas Etiquetas</h1>
          <p className="text-xl text-gray-600">Gerencie todas as suas etiquetas em um só lugar</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar etiquetas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Filter by Type */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="todos">Todos os Tipos</option>
                <option value="materia-prima">Matéria Prima</option>
                <option value="manipulados">Manipulados</option>
                <option value="produtos">Produtos</option>
              </select>
            </div>

            {/* Quick Stats */}
            <div className="bg-orange-50 rounded-full px-6 py-3 flex items-center justify-center">
              <span className="text-orange-800 font-semibold">
                {filteredEtiquetas.length} etiqueta{filteredEtiquetas.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Etiquetas Grid */}
        {filteredEtiquetas.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-lg text-center">
            <TagIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma etiqueta encontrada</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== 'todos' 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando sua primeira etiqueta'
              }
            </p>
            <Link 
              href="/etiquetas/nova"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full font-semibold transition-colors shadow-lg hover:shadow-xl inline-flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Criar Primeira Etiqueta
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEtiquetas.map((etiqueta) => (
              <div key={etiqueta.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-orange-500">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-black mb-2">{etiqueta.nome}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTipoColor(etiqueta.tipo)}`}>
                        {getTipoLabel(etiqueta.tipo)}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {new Date(etiqueta.dataCriacao).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600 font-mono">{etiqueta.codigo}</div>
                    <div className="text-xs text-gray-500">Código</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button className="bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-full font-medium transition-colors shadow-md hover:shadow-lg flex items-center justify-center">
                    <PrinterIcon className="h-4 w-4 mr-2" />
                    Imprimir
                  </button>
                  <button className="bg-gray-800 hover:bg-gray-700 text-white py-3 px-4 rounded-full font-medium transition-colors shadow-md hover:shadow-lg flex items-center justify-center">
                    <EyeIcon className="h-4 w-4 mr-2" />
                    Visualizar
                  </button>
                </div>

                {/* Secondary Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <button className="text-gray-600 hover:text-orange-600 transition-colors p-2">
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button className="text-gray-600 hover:text-red-600 transition-colors p-2">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${etiqueta.ativa ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-xs text-gray-500">
                      {etiqueta.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions Bottom */}
        <div className="mt-12 bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-black mb-6 text-center">Ações em Lote</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button className="bg-orange-500 hover:bg-orange-600 text-white py-4 px-6 rounded-full text-lg font-semibold transition-colors shadow-lg hover:shadow-xl">
              🖨️ Imprimir Selecionadas
            </button>
            <button className="bg-gray-800 hover:bg-gray-700 text-white py-4 px-6 rounded-full text-lg font-semibold transition-colors shadow-lg hover:shadow-xl">
              📊 Exportar Relatório
            </button>
            <button className="bg-orange-500 hover:bg-orange-600 text-white py-4 px-6 rounded-full text-lg font-semibold transition-colors shadow-lg hover:shadow-xl">
              🏷️ Criar Lote
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
