'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  UserIcon,
  CheckIcon,
  XMarkIcon,
  EnvelopeIcon,
  LockClosedIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Organizacao {
  id: string
  nome: string
}

interface Permissao {
  id: string
  nome: string
  descricao: string
}

export default function NovoUsuarioPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([])
  const [permissoes, setPermissoes] = useState<Permissao[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    organizacaoId: '',
    ativo: true,
    permissoes: [] as string[]
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Buscar apenas a organização Granobox
      const orgResponse = await fetch('/api/admin/organizacoes')
      if (orgResponse.ok) {
        const orgData = await orgResponse.json()
        const granoboxOrg = orgData.find((org: Organizacao) => org.nome === 'Granobox')
        setOrganizacoes(granoboxOrg ? [granoboxOrg] : [])
      }

      // Buscar permissões
      const permResponse = await fetch('/api/admin/permissoes')
      if (permResponse.ok) {
        const permData = await permResponse.json()
        setPermissoes(permData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (name === 'ativo') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
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
    setIsLoading(true)

    // Validações
    if (formData.senha !== formData.confirmarSenha) {
      toast.error('As senhas não coincidem')
      setIsLoading(false)
      return
    }

    if (formData.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      setIsLoading(false)
      return
    }

    try {
      const dadosParaEnviar = {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        organizacaoId: formData.organizacaoId || null,
        ativo: formData.ativo,
        permissoes: formData.permissoes
      }

      const response = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosParaEnviar),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar usuário')
      }

      toast.success('Usuário criado com sucesso!')
      router.push('/admin/usuarios')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar usuário')
      console.error('Erro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/usuarios"
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Usuário Granobox</h1>
          <p className="mt-1 text-sm text-gray-500">
            Cadastre um novo usuário da equipe Granobox ou administrador do sistema
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informações Básicas */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Informações Básicas
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                  Nome Completo *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="nome"
                    id="nome"
                    required
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.nome}
                    onChange={handleInputChange}
                    placeholder="Nome completo do usuário"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="usuario@exemplo.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                  Senha *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="senha"
                    id="senha"
                    required
                    minLength={6}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.senha}
                    onChange={handleInputChange}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700">
                  Confirmar Senha *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="confirmarSenha"
                    id="confirmarSenha"
                    required
                    minLength={6}
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.confirmarSenha}
                    onChange={handleInputChange}
                    placeholder="Confirme a senha"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="organizacaoId" className="block text-sm font-medium text-gray-700">
                  Organização
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="organizacaoId"
                    id="organizacaoId"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.organizacaoId}
                    onChange={handleInputChange}
                  >
                    <option value="">Administrador do Sistema (sem organização)</option>
                    {organizacoes.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.nome} (Equipe Granobox)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Permissões */}
        {permissoes.length > 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Permissões
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {permissoes.map((permissao) => (
                  <div key={permissao.id} className="flex items-center">
                    <input
                      id={`permissao-${permissao.id}`}
                      name="permissoes"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={formData.permissoes.includes(permissao.id)}
                      onChange={() => handlePermissaoChange(permissao.id)}
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
        )}

        {/* Status */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Status do Usuário
            </h3>
            <div className="flex items-center">
              <input
                id="ativo"
                name="ativo"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={formData.ativo}
                onChange={handleInputChange}
              />
              <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
                Usuário Ativo
              </label>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Usuários inativos não podem acessar o sistema
            </p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-3">
          <Link
            href="/admin/usuarios"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <XMarkIcon className="h-4 w-4 mr-2" />
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Criando...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Criar Usuário
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
} 