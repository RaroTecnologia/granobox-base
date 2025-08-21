'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  UserIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

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

interface Organizacao {
  id: string
  nome: string
  razaoSocial: string
}

interface Permissao {
  id: string
  nome: string
  descricao: string
}

interface FormData {
  nome: string
  email: string
  senha: string
  ativo: boolean
  organizacaoId: string
  permissoes: string[]
}

export default function EditarUsuarioPage() {
  const params = useParams()
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([])
  const [permissoes, setPermissoes] = useState<Permissao[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    senha: '',
    ativo: true,
    organizacaoId: '',
    permissoes: []
  })

  useEffect(() => {
    if (params.id) {
      fetchUsuario()
      fetchOrganizacoes()
      fetchPermissoes()
    }
  }, [params.id])

  const fetchUsuario = async () => {
    try {
      const response = await fetch(`/api/admin/usuarios/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setUsuario(data)
        setFormData({
          nome: data.nome,
          email: data.email,
          senha: '', // Não preencher senha por segurança
          ativo: data.ativo,
          organizacaoId: data.organizacao?.id || '',
          permissoes: data.permissoes?.map((p: any) => p.id) || []
        })
      } else {
        toast.error('Erro ao carregar usuário')
        router.push('/admin/usuarios')
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error)
      toast.error('Erro ao carregar usuário')
      router.push('/admin/usuarios')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrganizacoes = async () => {
    try {
      const response = await fetch('/api/admin/organizacoes')
      if (response.ok) {
        const data = await response.json()
        setOrganizacoes(data)
      }
    } catch (error) {
      console.error('Erro ao carregar organizações:', error)
    }
  }

  const fetchPermissoes = async () => {
    try {
      const response = await fetch('/api/admin/permissoes')
      if (response.ok) {
        const data = await response.json()
        setPermissoes(data)
      }
    } catch (error) {
      console.error('Erro ao carregar permissões:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handlePermissaoChange = (permissaoId: string) => {
    setFormData(prev => ({
      ...prev,
      permissoes: prev.permissoes.includes(permissaoId)
        ? prev.permissoes.filter(id => id !== permissaoId)
        : [...prev.permissoes, permissaoId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch(`/api/admin/usuarios/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organizacaoId: formData.organizacaoId || null
        }),
      })

      if (response.ok) {
        toast.success('Usuário atualizado com sucesso!')
        router.push('/admin/usuarios')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar usuário')
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      toast.error('Erro ao atualizar usuário')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/admin/usuarios/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Usuário excluído com sucesso!')
        router.push('/admin/usuarios')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao excluir usuário')
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      toast.error('Erro ao excluir usuário')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Carregando...</div>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Usuário não encontrado</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <Link
              href="/admin/usuarios"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Voltar
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Editar Usuário</h1>
          <p className="mt-1 text-sm text-gray-500">
            Atualize as informações do usuário
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={handleDelete}
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            <XCircleIcon className="h-4 w-4 mr-2" />
            Excluir
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Informações Básicas */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <UserIcon className="h-5 w-5 mr-2" />
                    Informações Básicas
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Dados pessoais do usuário
                  </p>
                </div>

                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    id="senha"
                    name="senha"
                    value={formData.senha}
                    onChange={handleInputChange}
                    placeholder="Deixe em branco para manter a senha atual"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Deixe em branco para manter a senha atual
                  </p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ativo"
                    name="ativo"
                    checked={formData.ativo}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
                    Usuário ativo
                  </label>
                </div>
              </div>

              {/* Organização e Permissões */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                    Organização
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Associação com organização
                  </p>
                </div>

                <div>
                  <label htmlFor="organizacaoId" className="block text-sm font-medium text-gray-700">
                    Organização
                  </label>
                  <select
                    id="organizacaoId"
                    name="organizacaoId"
                    value={formData.organizacaoId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Selecione uma organização</option>
                    {organizacoes.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.nome}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Deixe em branco para usuário do sistema
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <ShieldCheckIcon className="h-5 w-5 mr-2" />
                    Permissões
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Defina as permissões do usuário
                  </p>
                </div>

                <div className="space-y-3">
                  {permissoes.map((permissao) => (
                    <div key={permissao.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`permissao-${permissao.id}`}
                        checked={formData.permissoes.includes(permissao.id)}
                        onChange={() => handlePermissaoChange(permissao.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`permissao-${permissao.id}`} className="ml-2 block text-sm text-gray-900">
                        <div className="font-medium">{permissao.nome}</div>
                        <div className="text-gray-500">{permissao.descricao}</div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Link
            href="/admin/usuarios"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  )
} 