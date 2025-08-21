'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { ArrowLeftIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon, CalendarIcon, MapPinIcon, UserIcon, CubeIcon, PrinterIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

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
  movimentacoes: Movimentacao[]
}

interface Movimentacao {
  id: string
  tipo: string
  quantidade: number
  quantidadeAnterior: number
  quantidadeNova: number
  motivo: string
  dataMovimento: string
  observacoes?: string
  usuario?: {
    id: string
    nome: string
  }
}

export default function ManipuladoDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [manipulado, setManipulado] = useState<Manipulado | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated && !authLoading && params.id) {
      fetchManipulado()
    }
  }, [isAuthenticated, authLoading, params.id])

  const fetchManipulado = async () => {
    try {
      const response = await fetch(`/api/manipulados/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setManipulado(data)
      } else {
        toast.error('Erro ao carregar manipulado')
        router.push('/manipulados')
      }
    } catch (error) {
      console.error('Erro ao carregar manipulado:', error)
      toast.error('Erro ao carregar manipulado')
      router.push('/manipulados')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!manipulado) return

    if (confirm('Tem certeza que deseja excluir este manipulado?')) {
      try {
        const response = await fetch(`/api/manipulados/${manipulado.id}`, {
          method: 'DELETE',
        })
        
        if (response.ok) {
          toast.success('Manipulado excluído com sucesso!')
          router.push('/manipulados')
        } else {
          const error = await response.json()
          toast.error(error.error || 'Erro ao excluir manipulado')
        }
      } catch (error) {
        console.error('Erro ao excluir manipulado:', error)
        toast.error('Erro ao excluir manipulado')
      }
    }
  }

  const isEstoqueBaixo = () => {
    return manipulado ? manipulado.quantidade <= manipulado.estoqueMinimo : false
  }

  const isVencendo = () => {
    if (!manipulado) return false
    
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

  const getTipoMovimentacaoLabel = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return 'Entrada'
      case 'saida':
        return 'Saída'
      case 'ajuste':
        return 'Ajuste'
      case 'vencimento':
        return 'Vencimento'
      case 'transferencia':
        return 'Transferência'
      default:
        return tipo
    }
  }

  const getTipoMovimentacaoColor = (tipo: string) => {
    switch (tipo) {
      case 'entrada':
        return 'bg-green-100 text-green-800'
      case 'saida':
        return 'bg-red-100 text-red-800'
      case 'ajuste':
        return 'bg-blue-100 text-blue-800'
      case 'vencimento':
        return 'bg-orange-100 text-orange-800'
      case 'transferencia':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

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
          <div className="text-lg text-gray-600">Carregando manipulado...</div>
        </div>
      </div>
    )
  }

  if (!manipulado) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Manipulado não encontrado</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link
                  href="/manipulados"
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <h1 className="text-2xl font-semibold text-gray-900">{manipulado.nome}</h1>
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  href={`/manipulados/${manipulado.id}/editar`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Editar
                </Link>
                <Link
                  href={`/manipulados/${manipulado.id}/etiqueta`}
                  className="inline-flex items-center px-3 py-2 border border-indigo-300 rounded-md text-sm font-medium text-indigo-700 hover:bg-indigo-50"
                >
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Etiqueta
                </Link>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Excluir
                </button>
              </div>
            </div>
          </div>

          {/* Alertas */}
          {(isEstoqueBaixo() || isVencendo()) && (
            <div className="mb-6 space-y-3">
              {isEstoqueBaixo() && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                    <h3 className="text-sm font-medium text-red-800">
                      Estoque baixo! Quantidade atual: {manipulado.quantidade} {manipulado.unidade}
                    </h3>
                  </div>
                </div>
              )}
              {isVencendo() && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-2" />
                    <h3 className="text-sm font-medium text-orange-800">
                      Produto vencendo em breve!
                    </h3>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informações Principais */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informações Básicas */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Informações Básicas
                  </h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Nome</dt>
                      <dd className="mt-1 text-sm text-gray-900">{manipulado.nome}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Categoria</dt>
                      <dd className="mt-1 text-sm text-gray-900 capitalize">{manipulado.categoria}</dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Unidade</dt>
                      <dd className="mt-1 text-sm text-gray-900">{manipulado.unidade}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Quantidade Atual</dt>
                      <dd className={`mt-1 text-sm font-semibold ${isEstoqueBaixo() ? 'text-red-600' : 'text-gray-900'}`}>
                        {manipulado.quantidade} {manipulado.unidade}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Estoque Mínimo</dt>
                      <dd className="mt-1 text-sm text-gray-900">{manipulado.estoqueMinimo} {manipulado.unidade}</dd>
                    </div>
                    {manipulado.descricao && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Descrição</dt>
                        <dd className="mt-1 text-sm text-gray-900">{manipulado.descricao}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {/* Conservação e Validade */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Conservação e Validade
                  </h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Conservação Recomendada</dt>
                      <dd className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusConservacaoColor(manipulado.conservacaoRecomendada)}`}>
                          {getStatusConservacaoLabel(manipulado.conservacaoRecomendada)}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Data de Manipulação</dt>
                      <dd className="mt-1 text-sm text-gray-900 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {new Date(manipulado.dataManipulacao).toLocaleDateString('pt-BR')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Manipulado por</dt>
                      <dd className="mt-1 text-sm text-gray-900 flex items-center">
                        <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {manipulado.usuario?.nome || 'Não especificado'}
                      </dd>
                    </div>
                    {manipulado.receita && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Receita Base</dt>
                        <dd className="mt-1 text-sm text-gray-900 flex items-center">
                          <CubeIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {manipulado.receita.nome}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {/* Validade por Temperatura */}
              {(manipulado.validadeTemperaturaAmbiente || manipulado.validadeRefrigerado || manipulado.validadeCongelado) && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Validade por Temperatura
                    </h3>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
                      {manipulado.validadeTemperaturaAmbiente && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Temperatura Ambiente</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {manipulado.validadeTemperaturaAmbiente} minutos
                          </dd>
                        </div>
                      )}
                      {manipulado.validadeRefrigerado && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Refrigerado</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {manipulado.validadeRefrigerado} minutos
                          </dd>
                        </div>
                      )}
                      {manipulado.validadeCongelado && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Congelado</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {manipulado.validadeCongelado} minutos
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              )}

              {/* Instruções */}
              {manipulado.instrucoes && (
                <div className="bg-white shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Instruções de Uso
                    </h3>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{manipulado.instrucoes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Movimentações */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Movimentações
                  </h3>
                  <div className="space-y-4">
                    {manipulado.movimentacoes.length > 0 ? (
                      manipulado.movimentacoes.map((movimentacao) => (
                        <div key={movimentacao.id} className="border-l-4 border-gray-200 pl-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {getTipoMovimentacaoLabel(movimentacao.tipo)}
                              </p>
                              <p className="text-sm text-gray-500">{movimentacao.motivo}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(movimentacao.dataMovimento).toLocaleDateString('pt-BR')} às{' '}
                                {new Date(movimentacao.dataMovimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-semibold ${movimentacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                {movimentacao.tipo === 'entrada' ? '+' : '-'}{movimentacao.quantidade} {manipulado.unidade}
                              </p>
                              <p className="text-xs text-gray-500">
                                Estoque: {movimentacao.quantidadeNova} {manipulado.unidade}
                              </p>
                            </div>
                          </div>
                          {movimentacao.observacoes && (
                            <p className="text-xs text-gray-500 mt-1">{movimentacao.observacoes}</p>
                          )}
                          {movimentacao.usuario && (
                            <p className="text-xs text-gray-400 mt-1">
                              Por: {movimentacao.usuario.nome}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Nenhuma movimentação registrada</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 