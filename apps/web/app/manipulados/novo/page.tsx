'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

interface Receita {
  id: string
  nome: string
}

export default function NovoManipuladoPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    lote: '',
    unidade: 'kg',
    quantidade: 0,
    estoqueMinimo: 0,
    custoUnitario: 0,
    statusConservacao: 'TEMPERATURA_AMBIENTE' as 'TEMPERATURA_AMBIENTE' | 'CONGELADO' | 'RESFRIADO',
    dataManipulacao: new Date().toISOString().split('T')[0],
    dataValidade1: '',
    dataValidade2: '',
    dataValidade3: '',
    localArmazenamento: '',
    instrucoes: '',
    receitaId: '',
    ativo: true
  })

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchReceitas()
    }
  }, [isAuthenticated, authLoading])

  const fetchReceitas = async () => {
    try {
      const response = await fetch('/api/receitas')
      if (response.ok) {
        const data = await response.json()
        setReceitas(data)
      }
    } catch (error) {
      console.error('Erro ao carregar receitas:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/manipulados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          receitaId: formData.receitaId || null
        })
      })

      if (response.ok) {
        toast.success('Manipulado criado com sucesso!')
        router.push('/manipulados')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar manipulado')
      }
    } catch (error) {
      console.error('Erro ao criar manipulado:', error)
      toast.error('Erro ao criar manipulado')
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
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
                <h1 className="text-2xl font-semibold text-gray-900">Novo Manipulado</h1>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Cadastre um novo produto manipulado
            </p>
          </div>

          {/* Form */}
          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              {/* Informações Básicas */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                      Nome *
                    </label>
                    <input
                      type="text"
                      id="nome"
                      name="nome"
                      required
                      value={formData.nome}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: Massa de bolo"
                    />
                  </div>

                  <div>
                    <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">
                      Categoria *
                    </label>
                    <select
                      id="categoria"
                      name="categoria"
                      required
                      value={formData.categoria}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione uma categoria</option>
                      <option value="massa">Massa</option>
                      <option value="creme">Creme</option>
                      <option value="calda">Calda</option>
                      <option value="pasta">Pasta</option>
                      <option value="recheio">Recheio</option>
                      <option value="cobertura">Cobertura</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="lote" className="block text-sm font-medium text-gray-700">
                      Número do Lote *
                    </label>
                    <input
                      type="text"
                      id="lote"
                      name="lote"
                      required
                      value={formData.lote}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: LOTE001"
                    />
                  </div>

                  <div>
                    <label htmlFor="unidade" className="block text-sm font-medium text-gray-700">
                      Unidade
                    </label>
                    <select
                      id="unidade"
                      name="unidade"
                      value={formData.unidade}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="kg">Quilogramas (kg)</option>
                      <option value="g">Gramas (g)</option>
                      <option value="l">Litros (L)</option>
                      <option value="ml">Mililitros (ml)</option>
                      <option value="un">Unidades (un)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="quantidade" className="block text-sm font-medium text-gray-700">
                      Quantidade Inicial
                    </label>
                    <input
                      type="number"
                      id="quantidade"
                      name="quantidade"
                      step="0.01"
                      min="0"
                      value={formData.quantidade}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label htmlFor="estoqueMinimo" className="block text-sm font-medium text-gray-700">
                      Estoque Mínimo
                    </label>
                    <input
                      type="number"
                      id="estoqueMinimo"
                      name="estoqueMinimo"
                      step="0.01"
                      min="0"
                      value={formData.estoqueMinimo}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">
                    Descrição
                  </label>
                  <textarea
                    id="descricao"
                    name="descricao"
                    rows={3}
                    value={formData.descricao}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descrição detalhada do manipulado..."
                  />
                </div>
              </div>

              {/* Conservação e Armazenamento */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Conservação e Armazenamento</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="statusConservacao" className="block text-sm font-medium text-gray-700">
                      Status de Conservação *
                    </label>
                    <select
                      id="statusConservacao"
                      name="statusConservacao"
                      required
                      value={formData.statusConservacao}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="TEMPERATURA_AMBIENTE">Temperatura Ambiente</option>
                      <option value="RESFRIADO">Refrigerado</option>
                      <option value="CONGELADO">Congelado</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="localArmazenamento" className="block text-sm font-medium text-gray-700">
                      Local de Armazenamento
                    </label>
                    <input
                      type="text"
                      id="localArmazenamento"
                      name="localArmazenamento"
                      value={formData.localArmazenamento}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: Geladeira 1, Freezer 2"
                    />
                  </div>

                  <div>
                    <label htmlFor="dataManipulacao" className="block text-sm font-medium text-gray-700">
                      Data de Manipulação *
                    </label>
                    <input
                      type="date"
                      id="dataManipulacao"
                      name="dataManipulacao"
                      required
                      value={formData.dataManipulacao}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="receitaId" className="block text-sm font-medium text-gray-700">
                      Receita Base (Opcional)
                    </label>
                    <select
                      id="receitaId"
                      name="receitaId"
                      value={formData.receitaId}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sem receita base</option>
                      {receitas.map(receita => (
                        <option key={receita.id} value={receita.id}>
                          {receita.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Datas de Validade */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Datas de Validade (Opcional)</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label htmlFor="dataValidade1" className="block text-sm font-medium text-gray-700">
                      Primeira Data de Validade
                    </label>
                    <input
                      type="date"
                      id="dataValidade1"
                      name="dataValidade1"
                      value={formData.dataValidade1}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="dataValidade2" className="block text-sm font-medium text-gray-700">
                      Segunda Data de Validade
                    </label>
                    <input
                      type="date"
                      id="dataValidade2"
                      name="dataValidade2"
                      value={formData.dataValidade2}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="dataValidade3" className="block text-sm font-medium text-gray-700">
                      Terceira Data de Validade
                    </label>
                    <input
                      type="date"
                      id="dataValidade3"
                      name="dataValidade3"
                      value={formData.dataValidade3}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Instruções */}
              <div>
                <label htmlFor="instrucoes" className="block text-sm font-medium text-gray-700">
                  Instruções de Uso
                </label>
                <textarea
                  id="instrucoes"
                  name="instrucoes"
                  rows={4}
                  value={formData.instrucoes}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Instruções de uso, conservação ou observações importantes..."
                />
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Manipulado ativo</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Link
                  href="/manipulados"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Criando...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Criar Manipulado
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
} 