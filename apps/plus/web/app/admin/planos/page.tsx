'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  EyeIcon,
  CurrencyDollarIcon,
  UsersIcon,
  CogIcon
} from '@heroicons/react/24/outline'

interface Plano {
  id: string
  nome: string
  descricao?: string
  preco: number
  moeda: string
  periodo: string
  recursos: {
    usuarios: number
    receitas: number
    backup: boolean
    suporte: string
    api?: boolean
  }
  ativo: boolean
  dataCriacao: string
}

export default function PlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')

  useEffect(() => {
    fetchPlanos()
  }, [])

  const fetchPlanos = async () => {
    try {
      const response = await fetch('/api/admin/planos')
      if (response.ok) {
        const data = await response.json()
        setPlanos(data)
      } else {
        console.error('Erro ao buscar planos')
      }
    } catch (error) {
      console.error('Erro ao buscar planos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPlanos = planos.filter(plano => {
    const matchesSearch = plano.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plano.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'todos' || 
                         (filterStatus === 'ativos' && plano.ativo) ||
                         (filterStatus === 'inativos' && !plano.ativo)
    
    return matchesSearch && matchesStatus
  })

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(price)
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planos de Assinatura</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie os planos disponíveis para as organizações
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/planos/novo"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Novo Plano
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Buscar
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="ativos">Ativos</option>
                <option value="inativos">Inativos</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Planos */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Carregando planos...</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredPlanos.map((plano) => (
              <li key={plano.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <CreditCardIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {plano.nome}
                          </p>
                          {plano.ativo ? (
                            <CheckCircleIcon className="ml-2 h-4 w-4 text-green-400" />
                          ) : (
                            <XCircleIcon className="ml-2 h-4 w-4 text-red-400" />
                          )}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <p>{plano.descricao}</p>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          <p className="font-medium">{formatPrice(plano.preco, plano.moeda)}</p>
                          <span className="mx-2">•</span>
                          <p className="capitalize">{plano.periodo}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {/* Recursos */}
                      <div className="hidden sm:flex items-center space-x-3 text-sm text-gray-500">
                        <div className="flex items-center">
                          <UsersIcon className="h-4 w-4 mr-1" />
                          <span>{plano.recursos.usuarios} usuários</span>
                        </div>
                        <div className="flex items-center">
                          <CogIcon className="h-4 w-4 mr-1" />
                          <span>{plano.recursos.receitas} receitas</span>
                        </div>
                        {plano.recursos.backup && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Backup
                          </span>
                        )}
                        {plano.recursos.api && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            API
                          </span>
                        )}
                      </div>
                      
                      {/* Ações */}
                      <div className="flex items-center space-x-1">
                        <Link
                          href={`/admin/planos/${plano.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/planos/${plano.id}/editar`}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        Criado em {new Date(plano.dataCriacao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        plano.ativo 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {plano.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        
        {!loading && filteredPlanos.length === 0 && (
          <div className="text-center py-12">
            <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhum plano encontrado
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'todos' 
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando seu primeiro plano de assinatura.'
              }
            </p>
            {!searchTerm && filterStatus === 'todos' && (
              <div className="mt-6">
                <Link
                  href="/admin/planos/novo"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Novo Plano
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Estatísticas */}
      {!loading && planos.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCardIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Planos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">{planos.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Planos Ativos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {planos.filter(p => p.ativo).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Preço Médio
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatPrice(
                        planos.reduce((acc, p) => acc + p.preco, 0) / planos.length,
                        'BRL'
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 