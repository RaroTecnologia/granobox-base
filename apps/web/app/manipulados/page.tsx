'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import { PlusIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, EyeIcon, TagIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { gerarCodigoEtiqueta, gerarCodigoLote, calcularDataValidadePadrao } from '@/lib/etiquetaUtils'

interface Manipulado {
  id: string
  nome: string
  descricao?: string
  categoria: string
  unidade: string
  quantidade: number
  estoqueMinimo: number
  custoUnitario: number
  conservacaoRecomendada: 'TEMPERATURA_AMBIENTE' | 'CONGELADO' | 'RESFRIADO'
  dataManipulacao: string
  validadeTemperaturaAmbiente?: number
  validadeRefrigerado?: number
  validadeCongelado?: number
  instrucoes?: string
  ativo: boolean
  dataCriacao: string
  receita?: {
    id: string
    nome: string
  }
  usuario?: {
    id: string
    nome: string
  }
}

export default function ManipuladosPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [manipulados, setManipulados] = useState<Manipulado[]>([])
  const [manipuladosFiltrados, setManipuladosFiltrados] = useState<Manipulado[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroStatus, setFiltroStatus] = useState('todos')

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchManipulados()
    }
  }, [isAuthenticated, authLoading])

  const fetchManipulados = async () => {
    try {
      const response = await fetch('/api/manipulados')
      if (response.ok) {
        const data = await response.json()
        setManipulados(data)
        setManipuladosFiltrados(data)
      } else {
        toast.error('Erro ao carregar manipulados')
      }
    } catch (error) {
      console.error('Erro ao carregar manipulados:', error)
      toast.error('Erro ao carregar manipulados')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar manipulados baseado na busca e filtros
  useEffect(() => {
    let filtrados = manipulados

    // Filtro por busca
    if (busca.trim()) {
      filtrados = filtrados.filter(manipulado =>
        manipulado.nome.toLowerCase().includes(busca.toLowerCase()) ||
        manipulado.categoria.toLowerCase().includes(busca.toLowerCase())
      )
    }

    // Filtro por categoria
    if (filtroCategoria !== 'todas') {
      filtrados = filtrados.filter(manipulado => manipulado.categoria === filtroCategoria)
    }

    // Filtro por status
    if (filtroStatus !== 'todos') {
      filtrados = filtrados.filter(manipulado => 
        filtroStatus === 'ativos' ? manipulado.ativo : !manipulado.ativo
      )
    }

    setManipuladosFiltrados(filtrados)
  }, [busca, filtroCategoria, filtroStatus, manipulados])

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este manipulado?')) {
      try {
        const response = await fetch(`/api/manipulados/${id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          setManipulados(prev => prev.filter(m => m.id !== id))
          toast.success('Manipulado excluído com sucesso')
        } else {
          toast.error('Erro ao excluir manipulado')
        }
      } catch (error) {
        console.error('Erro ao excluir manipulado:', error)
        toast.error('Erro ao excluir manipulado')
      }
    }
  }

  const handleGerarEtiqueta = (manipulado: Manipulado) => {
    // Criar dados da etiqueta para manipulados
    const etiquetaData = {
      nome: manipulado.nome,
      codigo: gerarCodigoEtiqueta(), // Código amigável de 6 caracteres
      descricao: manipulado.descricao || 'Produto manipulado',
      categoria: manipulado.categoria,
      unidade: manipulado.unidade,
      quantidade: manipulado.quantidade,
      processo: 'Manipulação',
      dataProducao: manipulado.dataManipulacao,
      dataValidade: calcularDataValidadePadrao(), // 1 ano padrão
      conservacao: manipulado.conservacaoRecomendada,
      lote: gerarCodigoLote(), // Lote com timestamp
      dataCriacao: new Date().toISOString().split('T')[0],
      ativa: true
    };

    // Salvar no localStorage temporariamente
    const etiquetasExistentes = JSON.parse(localStorage.getItem('etiquetasManipulados') || '[]');
    const novaEtiqueta = {
      id: `etiqueta-${Date.now()}`,
      ...etiquetaData
    };
    
    etiquetasExistentes.push(novaEtiqueta);
    localStorage.setItem('etiquetasManipulados', JSON.stringify(etiquetasExistentes));

    // Redirecionar para a página de etiquetas de manipulados
    const queryParams = new URLSearchParams({
      tipo: 'manipulados',
      etiquetaId: novaEtiqueta.id
    });
    
    window.location.href = `/etiquetas/manipulados?${queryParams.toString()}`;
  };

  const isEstoqueBaixo = (manipulado: Manipulado) => {
    return manipulado.quantidade <= manipulado.estoqueMinimo
  }

  const isVencendo = (manipulado: Manipulado) => {
    const hoje = new Date()
    const dataManipulacao = new Date(manipulado.dataManipulacao)
    
    // Calcular vencimento baseado na conservação recomendada
    let validadeEmMinutos = 0
    
    switch (manipulado.conservacaoRecomendada) {
      case 'TEMPERATURA_AMBIENTE':
        validadeEmMinutos = manipulado.validadeTemperaturaAmbiente || 0
        break
      case 'RESFRIADO':
        validadeEmMinutos = manipulado.validadeRefrigerado || 0
        break
      case 'CONGELADO':
        validadeEmMinutos = manipulado.validadeCongelado || 0
        break
      default:
        return false
    }
    
    if (validadeEmMinutos === 0) return false
    
    const vencimento = new Date(dataManipulacao.getTime() + (validadeEmMinutos * 60 * 1000))
    const diffTime = vencimento.getTime() - hoje.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays <= 3 && diffDays >= 0
  }

  const getStatusConservacaoLabel = (status: string) => {
    switch (status) {
      case 'TEMPERATURA_AMBIENTE':
        return 'Temperatura Ambiente'
      case 'CONGELADO':
        return 'Congelado'
      case 'RESFRIADO':
        return 'Refrigerado'
      default:
        return status
    }
  }

  const getStatusConservacaoColor = (status: string) => {
    switch (status) {
      case 'TEMPERATURA_AMBIENTE':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONGELADO':
        return 'bg-blue-100 text-blue-800'
      case 'RESFRIADO':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const categorias = Array.from(new Set(manipulados.map(m => m.categoria)))

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Carregando...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Faça login para acessar esta página</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Carregando manipulados...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Manipulados</h1>
            <Link
              href="/manipulados/novo"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Novo Manipulado
            </Link>
          </div>

          {/* Filtros */}
          <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Buscar por nome ou categoria..."
                />
              </div>
            </div>

            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todas">Todas as categorias</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Todos os status</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
          </div>

          {/* Alertas */}
          {manipuladosFiltrados.filter(isEstoqueBaixo).length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                <h3 className="text-sm font-medium text-red-800">
                  Manipulados com estoque baixo ({manipuladosFiltrados.filter(isEstoqueBaixo).length})
                </h3>
              </div>
            </div>
          )}

          {/* Lista de Manipulados */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {manipuladosFiltrados.map((manipulado) => (
                <li key={manipulado.id} className={`px-6 py-4 ${isEstoqueBaixo(manipulado) ? 'bg-red-50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {manipulado.nome}
                          </h3>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Categoria: {manipulado.categoria}</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusConservacaoColor(manipulado.conservacaoRecomendada)}`}>
                              {getStatusConservacaoLabel(manipulado.conservacaoRecomendada)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${isEstoqueBaixo(manipulado) ? 'text-red-600' : 'text-gray-900'}`}>
                            {manipulado.quantidade} {manipulado.unidade}
                          </div>
                          <div className="text-sm text-gray-500">
                            Mín: {manipulado.estoqueMinimo} {manipulado.unidade}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span>Manipulado: {new Date(manipulado.dataManipulacao).toLocaleDateString('pt-BR')}</span>
                          {(() => {
                            const dataManipulacao = new Date(manipulado.dataManipulacao)
                            let validadeEmMinutos = 0
                            
                            switch (manipulado.conservacaoRecomendada) {
                              case 'TEMPERATURA_AMBIENTE':
                                validadeEmMinutos = manipulado.validadeTemperaturaAmbiente || 0
                                break
                              case 'RESFRIADO':
                                validadeEmMinutos = manipulado.validadeRefrigerado || 0
                                break
                              case 'CONGELADO':
                                validadeEmMinutos = manipulado.validadeCongelado || 0
                                break
                            }
                            
                            if (validadeEmMinutos > 0) {
                              const vencimento = new Date(dataManipulacao.getTime() + (validadeEmMinutos * 60 * 1000))
                              return <span>Vencimento: {vencimento.toLocaleDateString('pt-BR')}</span>
                            }
                            return null
                          })()}
                        </div>
                        <div className="flex items-center space-x-2">
                          {isEstoqueBaixo(manipulado) && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              Estoque Baixo
                            </span>
                          )}
                          {isVencendo(manipulado) && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                              Vencendo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex items-center space-x-2">
                      <button
                        onClick={() => handleGerarEtiqueta(manipulado)}
                        className="text-green-600 hover:text-green-900"
                        title="Gerar Etiqueta"
                      >
                        <TagIcon className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/manipulados/${manipulado.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/manipulados/${manipulado.id}/editar`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(manipulado.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {manipuladosFiltrados.length === 0 && (
              <div className="text-center py-12">
                {busca || filtroCategoria !== 'todas' || filtroStatus !== 'todos' ? (
                  <>
                    <p className="text-gray-500 text-lg">Nenhum manipulado encontrado</p>
                    <p className="text-gray-400 mt-2">Tente ajustar os filtros de busca</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 text-lg">Nenhum manipulado cadastrado</p>
                    <p className="text-gray-400 mt-2">Comece adicionando seu primeiro manipulado!</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 