'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  BuildingOffice2Icon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function NovaOrganizacaoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    razaoSocial: '',
    documento: '', // CPF ou CNPJ
    email: '',
    telefone: '',
    endereco: {
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    },
    dominio: '',
    planoId: ''
  })

  const [planos, setPlanos] = useState<any[]>([])
  const [loadingPlanos, setLoadingPlanos] = useState(true)

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
      setLoadingPlanos(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name.startsWith('endereco.')) {
      const enderecoField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          [enderecoField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Buscar o valor do plano selecionado
      const planoSelecionado = planos.find(p => p.id === formData.planoId)
      
      const dadosParaEnviar = {
        ...formData,
        valor: planoSelecionado?.preco || 0
      }

      const response = await fetch('/api/admin/organizacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosParaEnviar),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao cadastrar organização')
      }

      toast.success('Organização cadastrada com sucesso!')
      router.push('/admin/organizacoes')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao cadastrar organização')
      console.error('Erro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDocumento = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    
    // Se tem 11 dígitos, é CPF
    if (numbers.length <= 11) {
      return numbers.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
    }
    
    // Se tem 14 dígitos, é CNPJ
    if (numbers.length <= 14) {
      return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    }
    
    return value
  }

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/^(\d{5})(\d{3})$/, '$1-$2')
  }

  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDocumento(e.target.value)
    setFormData(prev => ({ ...prev, documento: formatted }))
  }

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value)
    setFormData(prev => ({
      ...prev,
      endereco: { ...prev.endereco, cep: formatted }
    }))
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
          <h1 className="text-2xl font-bold text-gray-900">Nova Organização</h1>
          <p className="mt-1 text-sm text-gray-500">
            Cadastre uma nova organização cliente do Granobox
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
                  Nome Fantasia *
                </label>
                <input
                  type="text"
                  name="nome"
                  id="nome"
                  required
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={formData.nome}
                  onChange={handleInputChange}
                />
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
                />
              </div>

              <div>
                <label htmlFor="documento" className="block text-sm font-medium text-gray-700">
                  CPF ou CNPJ *
                </label>
                <input
                  type="text"
                  name="documento"
                  id="documento"
                  required
                  maxLength={18}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={formData.documento}
                  onChange={handleDocumentoChange}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Digite apenas os números, o formato será aplicado automaticamente
                </p>
              </div>

              <div>
                <label htmlFor="dominio" className="block text-sm font-medium text-gray-700">
                  Domínio *
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    name="dominio"
                    id="dominio"
                    required
                    className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-l-md"
                    value={formData.dominio}
                    onChange={handleInputChange}
                    placeholder="minha-padaria"
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    .granobox.com
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <input
                  type="tel"
                  name="telefone"
                  id="telefone"
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                />
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
              <div className="sm:col-span-2">
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
                  <option value="">Selecione...</option>
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

              <div>
                <label htmlFor="endereco.cep" className="block text-sm font-medium text-gray-700">
                  CEP
                </label>
                <input
                  type="text"
                  name="endereco.cep"
                  id="endereco.cep"
                  maxLength={9}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={formData.endereco.cep}
                  onChange={handleCEPChange}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Plano de Assinatura */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Plano de Assinatura
            </h3>
            {loadingPlanos ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Carregando planos...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {planos.map((plano) => (
                <div
                  key={plano.id}
                  className={`relative rounded-lg border p-4 cursor-pointer ${
                    formData.planoId === plano.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, planoId: plano.id }))}
                >
                  {formData.planoId === plano.id && (
                    <div className="absolute top-2 right-2">
                      <CheckIcon className="h-5 w-5 text-indigo-600" />
                    </div>
                  )}
                  <div className="text-center">
                    <h4 className="text-lg font-medium text-gray-900">{plano.nome}</h4>
                    <p className="text-2xl font-bold text-indigo-600">R$ {plano.preco}</p>
                    <p className="text-sm text-gray-500 mt-1">{plano.descricao}</p>
                                     </div>
                 </div>
               ))}
             </div>
           )}
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
                Cadastrando...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Cadastrar Organização
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
} 