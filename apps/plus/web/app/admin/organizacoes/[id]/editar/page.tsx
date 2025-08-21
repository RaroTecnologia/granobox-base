'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  BuildingOfficeIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon
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
    plano: {
      id: string
      nome: string
      preco: number
    }
  }
}

interface Plano {
  id: string
  nome: string
  preco: number
  moeda: string
  periodo: string
  recursos: any
  ativo: boolean
}

export default function EditarOrganizacaoPage() {
  const router = useRouter()
  const params = useParams()
  const organizacaoId = params.id as string
  
  const [isLoading, setIsLoading] = useState(false)
  const [loadingOrganizacao, setLoadingOrganizacao] = useState(true)
  const [loadingPlanos, setLoadingPlanos] = useState(true)
  const [organizacao, setOrganizacao] = useState<Organizacao | null>(null)
  const [planos, setPlanos] = useState<Plano[]>([])
  const [formData, setFormData] = useState({
    nome: '',
    razaoSocial: '',
    documento: '',
    email: '',
    telefone: '',
    endereco: {
      cep: '',
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: ''
    },
    ativo: true,
    planoId: ''
  })

  useEffect(() => {
    if (organizacaoId) {
      fetchOrganizacao()
      fetchPlanos()
    }
  }, [organizacaoId])

  const fetchOrganizacao = async () => {
    try {
      const response = await fetch(`/api/admin/organizacoes/${organizacaoId}`)
      if (response.ok) {
        const data = await response.json()
        setOrganizacao(data)
        setFormData({
          nome: data.nome,
          razaoSocial: data.razaoSocial || '',
          documento: data.documento || '',
          email: data.email,
          telefone: data.telefone || '',
          endereco: data.endereco || {
            cep: '',
            rua: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: ''
          },
          ativo: data.ativo,
          planoId: data.assinatura?.plano?.id || ''
        })
      } else {
        toast.error('Organização não encontrada')
        router.push('/admin/organizacoes')
      }
    } catch (error) {
      console.error('Erro ao buscar organização:', error)
      toast.error('Erro ao carregar organização')
      router.push('/admin/organizacoes')
    } finally {
      setLoadingOrganizacao(false)
    }
  }

  const fetchPlanos = async () => {
    try {
      const response = await fetch('/api/admin/planos')
      if (response.ok) {
        const data = await response.json()
        setPlanos(data.filter((plano: Plano) => plano.ativo))
      }
    } catch (error) {
      console.error('Erro ao buscar planos:', error)
    } finally {
      setLoadingPlanos(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (name.startsWith('endereco.')) {
      const enderecoField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          [enderecoField]: value
        }
      }))
    } else if (name === 'ativo') {
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

  const formatDocumento = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Formata como CPF ou CNPJ baseado no tamanho
    if (numbers.length <= 11) {
      // Formata como CPF: 000.000.000-00
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    } else {
      // Formata como CNPJ: 00.000.000/0000-00
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    }
  }

  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDocumento(e.target.value)
    setFormData(prev => ({
      ...prev,
      documento: formatted
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const dadosParaEnviar = {
        ...formData,
        // Remove formatação do documento para salvar apenas números
        documento: formData.documento.replace(/\D/g, '')
      }

      const response = await fetch(`/api/admin/organizacoes/${organizacaoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosParaEnviar),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar organização')
      }

      toast.success('Organização atualizada com sucesso!')
      router.push('/admin/organizacoes')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar organização')
      console.error('Erro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingOrganizacao) {
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
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/organizacoes"
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Organização</h1>
          <p className="mt-1 text-sm text-gray-500">
            Atualize as informações da organização "{organizacao.nome}"
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
                  Nome da Organização *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="nome"
                    id="nome"
                    required
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.nome}
                    onChange={handleInputChange}
                    placeholder="Nome da organização"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="razaoSocial" className="block text-sm font-medium text-gray-700">
                  Razão Social
                </label>
                <input
                  type="text"
                  name="razaoSocial"
                  id="razaoSocial"
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={formData.razaoSocial}
                  onChange={handleInputChange}
                  placeholder="Razão social (se diferente do nome)"
                />
              </div>

              <div>
                <label htmlFor="documento" className="block text-sm font-medium text-gray-700">
                  CPF ou CNPJ
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="documento"
                    id="documento"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.documento}
                    onChange={handleDocumentoChange}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Digite apenas números, a formatação será aplicada automaticamente
                </p>
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
                    placeholder="contato@organizacao.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="telefone"
                    id="telefone"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="planoId" className="block text-sm font-medium text-gray-700">
                  Plano de Assinatura
                </label>
                <select
                  name="planoId"
                  id="planoId"
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={formData.planoId}
                  onChange={handleInputChange}
                >
                  <option value="">Selecione um plano</option>
                  {planos.map((plano) => (
                    <option key={plano.id} value={plano.id}>
                      {plano.nome} - R$ {plano.preco.toFixed(2)}/{plano.periodo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Endereço
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="endereco.cep" className="block text-sm font-medium text-gray-700">
                  CEP
                </label>
                <input
                  type="text"
                  name="endereco.cep"
                  id="endereco.cep"
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={formData.endereco.cep}
                  onChange={handleInputChange}
                  placeholder="00000-000"
                />
              </div>

                             <div>
                 <label htmlFor="endereco.rua" className="block text-sm font-medium text-gray-700">
                   Rua
                 </label>
                 <input
                   type="text"
                   name="endereco.rua"
                   id="endereco.rua"
                   className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                   value={formData.endereco.rua}
                   onChange={handleInputChange}
                   placeholder="Rua, Avenida, etc."
                 />
               </div>

              <div>
                <label htmlFor="endereco.numero" className="block text-sm font-medium text-gray-700">
                  Número
                </label>
                <input
                  type="text"
                  name="endereco.numero"
                  id="endereco.numero"
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={formData.endereco.numero}
                  onChange={handleInputChange}
                  placeholder="123"
                />
              </div>

              <div>
                <label htmlFor="endereco.complemento" className="block text-sm font-medium text-gray-700">
                  Complemento
                </label>
                <input
                  type="text"
                  name="endereco.complemento"
                  id="endereco.complemento"
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={formData.endereco.complemento}
                  onChange={handleInputChange}
                  placeholder="Apto, Sala, etc."
                />
              </div>

              <div>
                <label htmlFor="endereco.bairro" className="block text-sm font-medium text-gray-700">
                  Bairro
                </label>
                <input
                  type="text"
                  name="endereco.bairro"
                  id="endereco.bairro"
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={formData.endereco.bairro}
                  onChange={handleInputChange}
                  placeholder="Nome do bairro"
                />
              </div>

              <div>
                <label htmlFor="endereco.cidade" className="block text-sm font-medium text-gray-700">
                  Cidade
                </label>
                <input
                  type="text"
                  name="endereco.cidade"
                  id="endereco.cidade"
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={formData.endereco.cidade}
                  onChange={handleInputChange}
                  placeholder="Nome da cidade"
                />
              </div>

              <div>
                <label htmlFor="endereco.estado" className="block text-sm font-medium text-gray-700">
                  Estado
                </label>
                <select
                  name="endereco.estado"
                  id="endereco.estado"
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={formData.endereco.estado}
                  onChange={handleInputChange}
                >
                  <option value="">Selecione o estado</option>
                  <option value="AC">Acre</option>
                  <option value="AL">Alagoas</option>
                  <option value="AP">Amapá</option>
                  <option value="AM">Amazonas</option>
                  <option value="BA">Bahia</option>
                  <option value="CE">Ceará</option>
                  <option value="DF">Distrito Federal</option>
                  <option value="ES">Espírito Santo</option>
                  <option value="GO">Goiás</option>
                  <option value="MA">Maranhão</option>
                  <option value="MT">Mato Grosso</option>
                  <option value="MS">Mato Grosso do Sul</option>
                  <option value="MG">Minas Gerais</option>
                  <option value="PA">Pará</option>
                  <option value="PB">Paraíba</option>
                  <option value="PR">Paraná</option>
                  <option value="PE">Pernambuco</option>
                  <option value="PI">Piauí</option>
                  <option value="RJ">Rio de Janeiro</option>
                  <option value="RN">Rio Grande do Norte</option>
                  <option value="RS">Rio Grande do Sul</option>
                  <option value="RO">Rondônia</option>
                  <option value="RR">Roraima</option>
                  <option value="SC">Santa Catarina</option>
                  <option value="SP">São Paulo</option>
                  <option value="SE">Sergipe</option>
                  <option value="TO">Tocantins</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Status da Organização
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
                Organização Ativa
              </label>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Organizações inativas não podem acessar o sistema
            </p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-3">
          <Link
            href="/admin/organizacoes"
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
                Salvando...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
} 