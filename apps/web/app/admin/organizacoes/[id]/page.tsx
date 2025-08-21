'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon,
  CreditCardIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Organizacao {
  id: string
  nome: string
  razaoSocial?: string
  documento?: string
  email: string
  telefone?: string
  endereco?: any
  logo?: string
  dominio?: string
  ativo: boolean
  dataCadastro: string
  dataAtualizacao: string
  assinatura?: {
    id: string
    status: string
    dataInicio: string
    dataFim?: string
    valor: number
    moeda: string
    plano: {
      id: string
      nome: string
      preco: number
      periodo: string
      recursos: any
    }
  }
  _count?: {
    usuarios: number
    ingredientes: number
    receitas: number
    clientes: number
    pedidos: number
  }
}

export default function VisualizarOrganizacaoPage() {
  const router = useRouter()
  const params = useParams()
  const organizacaoId = params.id as string
  
  const [organizacao, setOrganizacao] = useState<Organizacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (organizacaoId) {
      fetchOrganizacao()
    }
  }, [organizacaoId])

  const fetchOrganizacao = async () => {
    try {
      const response = await fetch(`/api/admin/organizacoes/${organizacaoId}`)
      if (response.ok) {
        const data = await response.json()
        setOrganizacao(data)
      } else {
        toast.error('Organização não encontrada')
        router.push('/admin/organizacoes')
      }
    } catch (error) {
      console.error('Erro ao buscar organização:', error)
      toast.error('Erro ao carregar organização')
      router.push('/admin/organizacoes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta organização? Esta ação não pode ser desfeita.')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/organizacoes/${organizacaoId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir organização')
      }

      toast.success('Organização excluída com sucesso!')
      router.push('/admin/organizacoes')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir organização')
      console.error('Erro:', error)
    } finally {
      setDeleting(false)
    }
  }

  const formatDocumento = (documento: string) => {
    if (!documento) return '-'
    
    const numbers = documento.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Carregando organização...</p>
        </div>
      </div>
    )
  }

  if (!organizacao) {
    return (
      <div className="text-center py-12">
        <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Organização não encontrada</h3>
        <div className="mt-6">
          <Link
            href="/admin/organizacoes"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Voltar às Organizações
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/organizacoes"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{organizacao.nome}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Detalhes da organização
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href={`/admin/organizacoes/${organizacao.id}/editar`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Editar
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Excluindo...
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4 mr-2" />
                Excluir
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          organizacao.ativo 
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {organizacao.ativo ? (
            <>
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Ativa
            </>
          ) : (
            <>
              <XCircleIcon className="h-3 w-3 mr-1" />
              Inativa
            </>
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Básicas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados da Organização */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Informações da Organização
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                    Nome
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{organizacao.nome}</dd>
                </div>

                {organizacao.razaoSocial && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Razão Social</dt>
                    <dd className="mt-1 text-sm text-gray-900">{organizacao.razaoSocial}</dd>
                  </div>
                )}

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    CPF/CNPJ
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDocumento(organizacao.documento || '')}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    Email
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">{organizacao.email}</dd>
                </div>

                {organizacao.telefone && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-2" />
                      Telefone
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{organizacao.telefone}</dd>
                  </div>
                )}

                {organizacao.dominio && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Domínio</dt>
                    <dd className="mt-1 text-sm text-gray-900">{organizacao.dominio}.granobox.com</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Endereço */}
          {organizacao.endereco && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Endereço
                </h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  {organizacao.endereco.rua && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Rua</dt>
                      <dd className="mt-1 text-sm text-gray-900">{organizacao.endereco.rua}</dd>
                    </div>
                  )}

                  {organizacao.endereco.numero && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Número</dt>
                      <dd className="mt-1 text-sm text-gray-900">{organizacao.endereco.numero}</dd>
                    </div>
                  )}

                  {organizacao.endereco.complemento && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Complemento</dt>
                      <dd className="mt-1 text-sm text-gray-900">{organizacao.endereco.complemento}</dd>
                    </div>
                  )}

                  {organizacao.endereco.bairro && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Bairro</dt>
                      <dd className="mt-1 text-sm text-gray-900">{organizacao.endereco.bairro}</dd>
                    </div>
                  )}

                  {organizacao.endereco.cidade && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Cidade</dt>
                      <dd className="mt-1 text-sm text-gray-900">{organizacao.endereco.cidade}</dd>
                    </div>
                  )}

                  {organizacao.endereco.estado && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Estado</dt>
                      <dd className="mt-1 text-sm text-gray-900">{organizacao.endereco.estado}</dd>
                    </div>
                  )}

                  {organizacao.endereco.cep && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">CEP</dt>
                      <dd className="mt-1 text-sm text-gray-900">{organizacao.endereco.cep}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assinatura */}
          {organizacao.assinatura && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Assinatura
                </h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <CreditCardIcon className="h-4 w-4 mr-2" />
                      Plano
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">{organizacao.assinatura.plano.nome}</dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                      Valor
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatCurrency(organizacao.assinatura.valor, organizacao.assinatura.moeda)}/{organizacao.assinatura.plano.periodo}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        organizacao.assinatura.status === 'ativa' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {organizacao.assinatura.status === 'ativa' ? 'Ativa' : 'Inativa'}
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Início
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(organizacao.assinatura.dataInicio)}
                    </dd>
                  </div>

                  {organizacao.assinatura.dataFim && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Fim</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDate(organizacao.assinatura.dataFim)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}

          {/* Recursos do Plano */}
          {organizacao.assinatura?.plano?.recursos && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Recursos do Plano
                </h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Usuários
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {organizacao.assinatura.plano.recursos.usuarios} usuários
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Receitas</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {organizacao.assinatura.plano.recursos.receitas} receitas
                    </dd>
                  </div>

                  {organizacao.assinatura.plano.recursos.backup && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Backup</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Incluído
                        </span>
                      </dd>
                    </div>
                  )}

                  {organizacao.assinatura.plano.recursos.api && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">API</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Disponível
                        </span>
                      </dd>
                    </div>
                  )}

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Suporte</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">
                      {organizacao.assinatura.plano.recursos.suporte?.replace('_', ' ')}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Usuário Owner */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Usuário Owner
              </h3>
              <OwnerSection organizacaoId={organizacaoId} />
            </div>
          </div>

          {/* Datas */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Datas
              </h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Cadastro
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(organizacao.dataCadastro)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Última Atualização
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(organizacao.dataAtualizacao)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para gerenciar o usuário owner da organização
function OwnerSection({ organizacaoId }: { organizacaoId: string }) {
  const [owner, setOwner] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  })

  useEffect(() => {
    fetchOwner()
  }, [organizacaoId])

  const fetchOwner = async () => {
    try {
      const response = await fetch(`/api/admin/organizacoes/${organizacaoId}/owner`)
      if (response.ok) {
        const data = await response.json()
        setOwner(data.owner)
        if (data.owner) {
          setFormData({
            nome: data.owner.nome,
            email: data.owner.email,
            senha: '',
            confirmarSenha: ''
          })
        }
      }
    } catch (error) {
      console.error('Erro ao buscar owner:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.senha !== formData.confirmarSenha) {
      toast.error('As senhas não coincidem')
      return
    }

    if (formData.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setSubmitting(true)

    try {
      const url = owner 
        ? `/api/admin/organizacoes/${organizacaoId}/owner`
        : `/api/admin/organizacoes/${organizacaoId}/owner`
      
      const method = owner ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success(owner ? 'Owner atualizado com sucesso!' : 'Owner criado com sucesso!')
        setShowForm(false)
        await fetchOwner()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao salvar owner')
      }
    } catch (error) {
      console.error('Erro ao salvar owner:', error)
      toast.error('Erro ao salvar owner')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-sm text-gray-500">Carregando...</span>
      </div>
    )
  }

  if (showForm) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              Senha {owner ? '' : '*'}
            </label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={formData.senha}
              onChange={handleInputChange}
              required={!owner}
              minLength={6}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={owner ? 'Deixe em branco para manter a atual' : 'Mínimo 6 caracteres'}
            />
          </div>

          <div>
            <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700">
              Confirmar Senha {owner ? '' : '*'}
            </label>
            <input
              type="password"
              id="confirmarSenha"
              name="confirmarSenha"
              value={formData.confirmarSenha}
              onChange={handleInputChange}
              required={!owner}
              minLength={6}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={owner ? 'Deixe em branco para manter a atual' : 'Confirme a senha'}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : (owner ? 'Atualizar' : 'Criar')}
          </button>
        </div>
      </form>
    )
  }

  if (owner) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">{owner.nome}</h4>
              <p className="text-sm text-gray-500">{owner.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                Criado em {new Date(owner.dataCadastro).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Owner
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Editar Owner
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center py-6">
      <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum owner definido</h3>
      <p className="mt-1 text-sm text-gray-500">
        Esta organização ainda não possui um usuário owner.
      </p>
      <div className="mt-6">
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <UserIcon className="h-4 w-4 mr-2" />
          Criar Owner
        </button>
      </div>
    </div>
  )
} 