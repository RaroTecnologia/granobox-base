'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface Organizacao {
  id: string
  nome: string
  razaoSocial?: string
  documento?: string
  email: string
  telefone?: string
  dominio?: string
  ativo: boolean
  dataCadastro: string
  assinatura?: {
    status: string
    plano: {
      nome: string
    }
  }
}

export default function OrganizacoesPage() {
  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')

  useEffect(() => {
    fetchOrganizacoes()
  }, [])

  const fetchOrganizacoes = async () => {
    try {
      const response = await fetch('/api/admin/organizacoes')
      if (response.ok) {
        const data = await response.json()
        setOrganizacoes(data)
      } else {
        console.error('Erro ao buscar organizações')
      }
    } catch (error) {
      console.error('Erro ao buscar organizações:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrganizacoes = organizacoes.filter(org => {
    const matchesSearch = org.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.documento?.includes(searchTerm)
    
    const matchesStatus = filterStatus === 'todos' || 
                         (filterStatus === 'ativas' && org.ativo) ||
                         (filterStatus === 'inativas' && !org.ativo)
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizações</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie as organizações clientes do Granobox
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/organizacoes/nova"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nova Organização
          </Link>
        </div>
      </div>

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
                  placeholder="Nome, email ou documento..."
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
                <option value="todos">Todas</option>
                <option value="ativas">Ativas</option>
                <option value="inativas">Inativas</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Carregando organizações...</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredOrganizacoes.map((org) => (
              <li key={org.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <BuildingOffice2Icon className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-indigo-600 truncate">
                            {org.nome}
                          </p>
                          {org.ativo ? (
                            <CheckCircleIcon className="ml-2 h-4 w-4 text-green-400" />
                          ) : (
                            <XCircleIcon className="ml-2 h-4 w-4 text-red-400" />
                          )}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <p>{org.email}</p>
                          {org.telefone && (
                            <>
                              <span className="mx-2">•</span>
                              <p>{org.telefone}</p>
                            </>
                          )}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <p>Documento: {org.documento}</p>
                          <span className="mx-2">•</span>
                          <p>Domínio: {org.dominio}.granobox.com</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {org.assinatura && (
                        <>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            org.assinatura.status === 'ativa' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {org.assinatura.status}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {org.assinatura.plano.nome}
                          </span>
                        </>
                      )}
                      <div className="flex items-center space-x-1">
                        <Link
                          href={`/admin/organizacoes/${org.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/organizacoes/${org.id}/editar`}
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
                        Cadastrada em {new Date(org.dataCadastro).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        
        {!loading && filteredOrganizacoes.length === 0 && (
          <div className="text-center py-12">
            <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhuma organização encontrada
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'todos' 
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece cadastrando sua primeira organização.'
              }
            </p>
            {!searchTerm && filterStatus === 'todos' && (
              <div className="mt-6">
                <Link
                  href="/admin/organizacoes/nova"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Nova Organização
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 