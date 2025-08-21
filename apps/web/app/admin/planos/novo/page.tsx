'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  CreditCardIcon,
  CheckIcon,
  XMarkIcon,
  UsersIcon,
  CogIcon,
  ShieldCheckIcon,
  WifiIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function NovoPlanoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    moeda: 'BRL',
    periodo: 'mensal',
    recursos: {
      usuarios: 1,
      receitas: 10,
      backup: false,
      suporte: 'email',
      api: false
    },
    ativo: true
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (name.startsWith('recursos.')) {
      const recursoField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        recursos: {
          ...prev.recursos,
          [recursoField]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                         type === 'number' ? parseInt(value) : value
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const dadosParaEnviar = {
        ...formData,
        preco: parseFloat(formData.preco)
      }

      const response = await fetch('/api/admin/planos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosParaEnviar),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar plano')
      }

      toast.success('Plano criado com sucesso!')
      router.push('/admin/planos')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar plano')
      console.error('Erro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/planos"
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Plano</h1>
          <p className="mt-1 text-sm text-gray-500">
            Crie um novo plano de assinatura
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
                  Nome do Plano *
                </label>
                <input
                  type="text"
                  name="nome"
                  id="nome"
                  required
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Ex: Básico, Profissional, Enterprise"
                />
              </div>

              <div>
                <label htmlFor="preco" className="block text-sm font-medium text-gray-700">
                  Preço *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">R$</span>
                  </div>
                  <input
                    type="number"
                    name="preco"
                    id="preco"
                    required
                    step="0.01"
                    min="0"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-12 pr-12 sm:text-sm border-gray-300 rounded-md"
                    value={formData.preco}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="moeda" className="block text-sm font-medium text-gray-700">
                  Moeda
                </label>
                <select
                  name="moeda"
                  id="moeda"
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={formData.moeda}
                  onChange={handleInputChange}
                >
                  <option value="BRL">Real (R$)</option>
                  <option value="USD">Dólar ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>

              <div>
                <label htmlFor="periodo" className="block text-sm font-medium text-gray-700">
                  Período
                </label>
                <select
                  name="periodo"
                  id="periodo"
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={formData.periodo}
                  onChange={handleInputChange}
                >
                  <option value="mensal">Mensal</option>
                  <option value="anual">Anual</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">
                  Descrição
                </label>
                <textarea
                  name="descricao"
                  id="descricao"
                  rows={3}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  placeholder="Descreva os benefícios e características do plano..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recursos */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recursos do Plano
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="recursos.usuarios" className="block text-sm font-medium text-gray-700">
                  Número de Usuários
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UsersIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="recursos.usuarios"
                    id="recursos.usuarios"
                    min="1"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.recursos.usuarios}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="recursos.receitas" className="block text-sm font-medium text-gray-700">
                  Limite de Receitas
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CogIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="recursos.receitas"
                    id="recursos.receitas"
                    min="1"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                    value={formData.recursos.receitas}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="recursos.suporte" className="block text-sm font-medium text-gray-700">
                  Tipo de Suporte
                </label>
                <select
                  name="recursos.suporte"
                  id="recursos.suporte"
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  value={formData.recursos.suporte}
                  onChange={handleInputChange}
                >
                  <option value="email">Email</option>
                  <option value="email_e_telefone">Email + Telefone</option>
                  <option value="dedicado">Suporte Dedicado</option>
                  <option value="sem_suporte">Sem Suporte</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="recursos.backup"
                      name="recursos.backup"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={formData.recursos.backup}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="recursos.backup" className="ml-2 block text-sm text-gray-900">
                      <div className="flex items-center">
                        <ShieldCheckIcon className="h-4 w-4 mr-1 text-green-500" />
                        Backup Automático
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="recursos.api"
                      name="recursos.api"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={formData.recursos.api}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="recursos.api" className="ml-2 block text-sm text-gray-900">
                      <div className="flex items-center">
                        <WifiIcon className="h-4 w-4 mr-1 text-blue-500" />
                        Acesso à API
                      </div>
                    </label>
                  </div>

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
                      Plano Ativo
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-3">
          <Link
            href="/admin/planos"
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
                Criar Plano
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
} 