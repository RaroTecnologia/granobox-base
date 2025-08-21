'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  EyeIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

interface Usuario {
  id: string
  nome: string
  email: string
  ativo: boolean
  dataCadastro: string
  organizacao?: {
    id: string
    nome: string
  }
  permissoes?: {
    id: string
    nome: string
    descricao: string
  }[]
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterOrganizacao, setFilterOrganizacao] = useState('todas')


  useEffect(() => {
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    try {
      const response = await fetch('/api/admin/usuarios')
      if (response.ok) {
        const data = await response.json()
        setUsuarios(data)
      } else {
        console.error('Erro ao buscar usuários')
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'todos' || 
                         (filterStatus === 'ativos' && usuario.ativo) ||
                         (filterStatus === 'inativos' && !usuario.ativo)
    
    
    return matchesSearch && matchesStatus
  })



  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários Granobox</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie os usuários da equipe Granobox e administradores do sistema
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/admin/usuarios/novo"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Novo Usuário
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
                  placeholder="Nome ou email"
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

        {loading ? (
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-2 text-sm text-gray-500">Carregando usuários...</span>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredUsuarios.map((usuario) => (
              <li key={usuario.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {usuario.nome}
                        </p>
                        {usuario.ativo ? (
                          <CheckCircleIcon className="ml-2 h-4 w-4 text-green-400" />
                        ) : (
                          <XCircleIcon className="ml-2 h-4 w-4 text-red-400" />
                        )}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <p>{usuario.email}</p>
                        {usuario.organizacao && (
                          <>
                            <span className="mx-2">•</span>
                            <div className="flex items-center">
                              <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                              <p>{usuario.organizacao.nome}</p>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <p>Cadastrado em {new Date(usuario.dataCadastro).toLocaleDateString('pt-BR')}</p>
                        {usuario.permissoes && usuario.permissoes.length > 0 && (
                          <>
                            <span className="mx-2">•</span>
                            <p>{usuario.permissoes.length} permissão{usuario.permissoes.length > 1 ? 'ões' : ''}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <Link
                        href={`/admin/usuarios/${usuario.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/usuarios/${usuario.id}/editar`}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        
        {!loading && filteredUsuarios.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhum usuário encontrado
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'todos' || filterOrganizacao !== 'todas'
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece cadastrando seu primeiro usuário.'
              }
            </p>
            {!searchTerm && filterStatus === 'todos' && filterOrganizacao === 'todas' && (
              <div className="mt-6">
                <Link
                  href="/admin/usuarios/novo"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 