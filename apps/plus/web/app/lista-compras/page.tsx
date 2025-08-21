'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import { PlusIcon, TrashIcon, CheckIcon, DocumentIcon, ShoppingCartIcon, ShareIcon, PencilIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { Ingrediente } from '@/types'

interface ItemListaCompras {
  id: string
  ingredienteId: string
  nome: string
  quantidade: number
  unidade: string
  comprado: boolean
  observacoes?: string
  adicionadoEm: string
  ingrediente?: Ingrediente
}

export default function ListaComprasPage() {
  const [itens, setItens] = useState<ItemListaCompras[]>([])
  const [ingredientesDisponiveis, setIngredientesDisponiveis] = useState<Ingrediente[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editandoQuantidade, setEditandoQuantidade] = useState<string | null>(null)
  const [novaQuantidade, setNovaQuantidade] = useState<number>(0)
  const [formData, setFormData] = useState({
    ingredienteId: '',
    quantidade: 1,
    observacoes: ''
  })

  // Carregar dados
  const carregarDados = async () => {
    try {
      const [ingredientesRes, listaRes] = await Promise.all([
        fetch('/api/ingredientes'),
        fetch('/api/lista-compras')
      ])

      if (ingredientesRes.ok) {
        const ingredientesData = await ingredientesRes.json()
        setIngredientesDisponiveis(ingredientesData)
      }

      if (listaRes.ok) {
        const listaData = await listaRes.json()
        setItens(listaData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const adicionarItem = async () => {
    if (!formData.ingredienteId) {
      toast.error('Selecione um ingrediente')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/lista-compras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredienteId: formData.ingredienteId,
          quantidade: formData.quantidade,
          observacoes: formData.observacoes
        }),
      })

      if (response.ok) {
        await carregarDados()
        setFormData({
          ingredienteId: '',
          quantidade: 1,
          observacoes: ''
        })
        setShowForm(false)
        toast.success('Item adicionado à lista!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao adicionar item')
      }
    } catch (error) {
      console.error('Erro ao adicionar item:', error)
      toast.error('Erro ao adicionar item')
    } finally {
      setSubmitting(false)
    }
  }

  const removerItem = async (id: string) => {
    try {
      const response = await fetch(`/api/lista-compras?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await carregarDados()
        toast.success('Item removido da lista!')
      } else {
        toast.error('Erro ao remover item')
      }
    } catch (error) {
      console.error('Erro ao remover item:', error)
      toast.error('Erro ao remover item')
    }
  }

  const marcarComoComprado = async (id: string, comprado: boolean) => {
    try {
      const response = await fetch('/api/lista-compras', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          comprado: !comprado
        }),
      })

      if (response.ok) {
        await carregarDados()
        toast.success(comprado ? 'Item desmarcado' : 'Item marcado como comprado!')
      } else {
        toast.error('Erro ao atualizar item')
      }
    } catch (error) {
      console.error('Erro ao atualizar item:', error)
      toast.error('Erro ao atualizar item')
    }
  }

  const iniciarEdicaoQuantidade = (id: string, quantidadeAtual: number) => {
    setEditandoQuantidade(id)
    setNovaQuantidade(quantidadeAtual)
  }

  const cancelarEdicaoQuantidade = () => {
    setEditandoQuantidade(null)
    setNovaQuantidade(0)
  }

  const salvarQuantidade = async (id: string) => {
    if (novaQuantidade <= 0) {
      toast.error('Quantidade deve ser maior que zero')
      return
    }

    try {
      const response = await fetch('/api/lista-compras', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          quantidade: novaQuantidade
        }),
      })

      if (response.ok) {
        await carregarDados()
        setEditandoQuantidade(null)
        setNovaQuantidade(0)
        toast.success('Quantidade atualizada!')
      } else {
        toast.error('Erro ao atualizar quantidade')
      }
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error)
      toast.error('Erro ao atualizar quantidade')
    }
  }

  const limparLista = async () => {
    if (confirm('Tem certeza que deseja limpar toda a lista?')) {
      try {
        const response = await fetch('/api/lista-compras/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'limpar' }),
        })

        if (response.ok) {
          await carregarDados()
          toast.success('Lista limpa!')
        } else {
          toast.error('Erro ao limpar lista')
        }
      } catch (error) {
        console.error('Erro ao limpar lista:', error)
        toast.error('Erro ao limpar lista')
      }
    }
  }

  const gerarListaIngredientesEmFalta = async () => {
    try {
      const response = await fetch('/api/lista-compras/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'gerar-estoque-baixo' }),
      })

      if (response.ok) {
        const result = await response.json()
        await carregarDados()
        toast.success(result.message)
      } else {
        toast.error('Erro ao gerar lista')
      }
    } catch (error) {
      console.error('Erro ao gerar lista:', error)
      toast.error('Erro ao gerar lista')
    }
  }

  const handleCompartilhar = async () => {
    const url = `${window.location.origin}/lista-compras/compartilhar`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Lista de Compras - Granobox',
          text: 'Confira minha lista de compras',
          url: url,
        });
      } catch (error) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      // Fallback para navegadores que não suportam Web Share API
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copiado para a área de transferência!');
      } catch (error) {
        // Fallback final
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success('Link copiado para a área de transferência!');
      }
    }
  }

  const itensNaoComprados = itens.filter(item => !item.comprado)
  const itensComprados = itens.filter(item => item.comprado)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <ShoppingCartIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-semibold text-gray-900">Lista de Compras</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCompartilhar}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ShareIcon className="h-5 w-5 mr-2" />
                Compartilhar
              </button>
              <button
                onClick={gerarListaIngredientesEmFalta}
                className="inline-flex items-center px-4 py-2 border border-orange-300 rounded-md shadow-sm text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100"
              >
                <DocumentIcon className="h-5 w-5 mr-2" />
                Gerar por Estoque Baixo
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Adicionar Item
              </button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingCartIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Itens
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {itens.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Comprados
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {itensComprados.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold">!</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pendentes
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {itensNaoComprados.length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Itens Pendentes */}
          {itensNaoComprados.length > 0 && (
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Itens Pendentes</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {itensNaoComprados.map((item) => (
                  <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <button
                        onClick={() => marcarComoComprado(item.id, item.comprado)}
                        className="mr-4 p-1 rounded-full border-2 border-gray-300 hover:border-green-500 hover:bg-green-50"
                      >
                        <div className="w-4 h-4"></div>
                      </button>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {item.nome || item.ingrediente?.nome}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500">Quantidade:</span>
                          {editandoQuantidade === item.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={novaQuantidade}
                                onChange={(e) => setNovaQuantidade(parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    salvarQuantidade(item.id)
                                  } else if (e.key === 'Escape') {
                                    cancelarEdicaoQuantidade()
                                  }
                                }}
                              />
                              <span className="text-sm text-gray-500">{item.unidade || item.ingrediente?.unidade}</span>
                              <button
                                onClick={() => salvarQuantidade(item.id)}
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                ✓
                              </button>
                              <button
                                onClick={cancelarEdicaoQuantidade}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => iniciarEdicaoQuantidade(item.id, item.quantidade)}
                              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded"
                            >
                              <span>{item.quantidade} {item.unidade || item.ingrediente?.unidade}</span>
                              <PencilIcon className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        {item.observacoes && (
                          <p className="text-xs text-gray-400 mt-1">{item.observacoes}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removerItem(item.id)}
                      className="ml-4 text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de Itens Comprados */}
          {itensComprados.length > 0 && (
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Itens Comprados</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {itensComprados.map((item) => (
                  <div key={item.id} className="px-6 py-4 flex items-center justify-between opacity-60">
                    <div className="flex items-center flex-1">
                      <button
                        onClick={() => marcarComoComprado(item.id, item.comprado)}
                        className="mr-4 p-1 rounded-full border-2 border-green-500 bg-green-500 hover:bg-green-600"
                      >
                        <CheckIcon className="w-4 h-4 text-white" />
                      </button>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 line-through">
                          {item.nome || item.ingrediente?.nome}
                        </h3>
                        <p className="text-sm text-gray-500 line-through">
                          Quantidade: {item.quantidade} {item.unidade || item.ingrediente?.unidade}
                        </p>
                        {item.observacoes && (
                          <p className="text-xs text-gray-400 mt-1">{item.observacoes}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removerItem(item.id)}
                      className="ml-4 text-red-600 hover:text-red-800"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista Vazia */}
          {itens.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum item na lista</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece adicionando itens à sua lista de compras.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Adicionar Primeiro Item
                </button>
              </div>
            </div>
          )}

          {/* Botão Limpar Lista */}
          {itens.length > 0 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={limparLista}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Limpar Lista
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Adicionar Item */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Adicionar Item</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingrediente
                </label>
                <select
                  value={formData.ingredienteId}
                  onChange={(e) => setFormData(prev => ({ ...prev, ingredienteId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={submitting}
                >
                  <option value="">Selecione um ingrediente</option>
                  {ingredientesDisponiveis.map(ingrediente => (
                    <option key={ingrediente.id} value={ingrediente.id}>
                      {ingrediente.nome} ({ingrediente.unidade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.quantidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantidade: parseFloat(e.target.value) || 1 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações (opcional)
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Marca específica, urgente, etc."
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                onClick={adicionarItem}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 