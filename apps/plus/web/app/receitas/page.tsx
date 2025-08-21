'use client'

import { useState, useEffect } from 'react'
import Navigation from '@/components/Navigation'
import { PlusIcon, PencilIcon, TrashIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface Ingrediente {
  id: string
  nome: string
  unidade: string
  custoUnitario: number
}

interface ItemReceita {
  ingredienteId: string
  quantidade: number
  ingrediente?: Ingrediente
  isIngredienteBase?: boolean // Para marcar farinhas no sistema de porcentagem
}

interface EtapaReceita {
  id?: string;
  receitaId?: string;
  nome: string;
  ordem: number;
  descricao?: string;
  tempoMin?: number;
  tempoMax?: number;
  temperatura?: number;
  umidade?: number;
  observacoes?: string;
}

interface Receita {
  id: string
  nome: string
  descricao: string
  categoria: string
  rendimento: number
  tempoPreparo: number
  custoTotal: number
  precoVenda: number
  instrucoes: string
  tamanhoForma?: string
  pesoUnitario?: number
  ativo: boolean
  ingredientes: ItemReceita[]
  etapas: EtapaReceita[]
  sistemaCalculo?: 'peso' | 'porcentagem'
  pesoTotalBase?: number
}

const categorias = [
  { value: 'paes', label: 'Pães' },
  { value: 'doces', label: 'Doces' },
  { value: 'salgados', label: 'Salgados' },
  { value: 'bebidas', label: 'Bebidas' }
]

export default function ReceitasPage() {
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [ingredientesDisponiveis, setIngredientesDisponiveis] = useState<Ingrediente[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [editandoReceita, setEditandoReceita] = useState<Receita | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [receitaParaExcluir, setReceitaParaExcluir] = useState<Receita | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  
  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'paes',
    descricao: '',
    rendimento: 1,
    tempoPreparo: 0,
    precoVenda: 0,
    instrucoes: '',
    tamanhoForma: '',
    pesoUnitario: 0,
    ingredientes: [] as ItemReceita[],
    etapas: [] as EtapaReceita[]
  })

  const [sistemaCalculo, setSistemaCalculo] = useState<'peso' | 'porcentagem'>('peso')
  const [pesoTotalBase, setPesoTotalBase] = useState<number>(1000) // Peso total das farinhas (100%)

  const carregarDados = async () => {
    try {
      const [receitasRes, ingredientesRes] = await Promise.all([
        fetch('/api/receitas'),
        fetch('/api/ingredientes')
      ])

      if (receitasRes.ok) {
        const receitasData = await receitasRes.json()
        setReceitas(receitasData)
      }

      if (ingredientesRes.ok) {
        const ingredientesData = await ingredientesRes.json()
        setIngredientesDisponiveis(ingredientesData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const loadingToast = toast.loading(editandoReceita ? 'Atualizando receita...' : 'Criando receita...')

    try {
      let custoTotal = 0
      
      if (sistemaCalculo === 'peso') {
        custoTotal = formData.ingredientes.reduce((total, item) => {
          const ingrediente = ingredientesDisponiveis.find(i => i.id === item.ingredienteId)
          return total + (ingrediente ? ingrediente.custoUnitario * item.quantidade : 0)
        }, 0)
      } else {
        // Sistema de porcentagem - soma das farinhas = 100%
        const ingredientesBase = formData.ingredientes.filter(item => item.isIngredienteBase)
        const totalPorcentagemBase = ingredientesBase.reduce((total, item) => total + item.quantidade, 0)
        
        if (totalPorcentagemBase > 0) {
          custoTotal = formData.ingredientes.reduce((total, item) => {
            const ingrediente = ingredientesDisponiveis.find(i => i.id === item.ingredienteId)
            if (!ingrediente) return total
            
            let pesoReal = 0
            if (item.isIngredienteBase) {
              // Ingrediente base: sua porcentagem do peso total base
              pesoReal = pesoTotalBase * (item.quantidade / totalPorcentagemBase)
            } else {
              // Outros ingredientes: porcentagem do peso total base
              pesoReal = pesoTotalBase * (item.quantidade / 100)
            }
            
            return total + (ingrediente.custoUnitario * pesoReal)
          }, 0)
        }
      }

      const receitaData = {
        ...formData,
        custoTotal,
        ativo: true,
        tamanhoForma: formData.tamanhoForma || null,
        pesoUnitario: formData.pesoUnitario || null,
        sistemaCalculo,
        pesoTotalBase: sistemaCalculo === 'porcentagem' ? pesoTotalBase : null
      }

      let response
      if (editandoReceita) {
        // Editando receita existente
        response = await fetch(`/api/receitas/${editandoReceita.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(receitaData),
        })
      } else {
        // Criando nova receita
        response = await fetch('/api/receitas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(receitaData),
        })
      }

      if (response.ok) {
        setShowForm(false)
        resetForm()
        setEditandoReceita(null)
        await carregarDados()
        toast.success(editandoReceita ? 'Receita atualizada com sucesso!' : 'Receita criada com sucesso!', {
          id: loadingToast
        })
      } else {
        const error = await response.json()
        toast.error(error.error || `Erro ao ${editandoReceita ? 'atualizar' : 'salvar'} receita`, {
          id: loadingToast
        })
      }
    } catch (error) {
      console.error('Erro ao salvar receita:', error)
      toast.error('Erro ao salvar receita', {
        id: loadingToast
      })
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      categoria: 'paes',
      descricao: '',
      rendimento: 1,
      tempoPreparo: 0,
      precoVenda: 0,
      instrucoes: '',
      tamanhoForma: '',
      pesoUnitario: 0,
      ingredientes: [],
      etapas: []
    })
    setSistemaCalculo('peso')
    setPesoTotalBase(1000)
    setEditandoReceita(null)
  }

  const adicionarIngrediente = () => {
    if (ingredientesDisponiveis.length > 0) {
      const novoIngrediente: ItemReceita = {
        ingredienteId: ingredientesDisponiveis[0].id,
        quantidade: sistemaCalculo === 'porcentagem' ? 0 : 1,
        isIngredienteBase: false
      }
      
      setFormData(prev => ({
        ...prev,
        ingredientes: [...prev.ingredientes, novoIngrediente]
      }))
      
      toast.success('Ingrediente adicionado à receita!')
    } else {
      toast.error('Nenhum ingrediente disponível. Cadastre ingredientes primeiro.')
    }
  }

  const removerIngrediente = (index: number) => {
    const ingrediente = ingredientesDisponiveis.find(i => i.id === formData.ingredientes[index].ingredienteId)
    
    setFormData(prev => ({
      ...prev,
      ingredientes: prev.ingredientes.filter((_, i) => i !== index)
    }))
    
    toast.success(`${ingrediente?.nome || 'Ingrediente'} removido da receita`)
  }

  const atualizarIngrediente = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      ingredientes: prev.ingredientes.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const adicionarEtapa = () => {
    const novaEtapa: EtapaReceita = {
      nome: '',
      ordem: formData.etapas.length + 1,
      descricao: '',
      tempoMin: undefined,
      tempoMax: undefined,
      temperatura: undefined,
      umidade: undefined,
      observacoes: ''
    }
    
    setFormData(prev => ({
      ...prev,
      etapas: [...prev.etapas, novaEtapa]
    }))
  }

  const removerEtapa = (index: number) => {
    setFormData(prev => ({
      ...prev,
      etapas: prev.etapas.filter((_, i) => i !== index).map((etapa, i) => ({
        ...etapa,
        ordem: i + 1
      }))
    }))
  }

  const atualizarEtapa = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      etapas: prev.etapas.map((etapa, i) => 
        i === index ? { ...etapa, [field]: value } : etapa
      )
    }))
  }

  const moverEtapa = (index: number, direcao: 'cima' | 'baixo') => {
    if (
      (direcao === 'cima' && index === 0) || 
      (direcao === 'baixo' && index === formData.etapas.length - 1)
    ) {
      return
    }

    const novaOrdem = direcao === 'cima' ? index - 1 : index + 1
    const etapas = [...formData.etapas]
    const etapaAtual = etapas[index]
    const etapaDestino = etapas[novaOrdem]

    etapas[index] = { ...etapaDestino, ordem: index + 1 }
    etapas[novaOrdem] = { ...etapaAtual, ordem: novaOrdem + 1 }

    setFormData(prev => ({
      ...prev,
      etapas
    }))
  }

  const iniciarEdicao = (receita: Receita) => {
    setEditandoReceita(receita)
    setFormData({
      nome: receita.nome,
      categoria: receita.categoria,
      descricao: receita.descricao,
      rendimento: receita.rendimento,
      tempoPreparo: receita.tempoPreparo,
      precoVenda: receita.precoVenda,
      instrucoes: receita.instrucoes,
      tamanhoForma: receita.tamanhoForma || '',
      pesoUnitario: receita.pesoUnitario || 0,
      ingredientes: receita.ingredientes.map(item => ({
        ingredienteId: item.ingredienteId,
        quantidade: item.quantidade,
        isIngredienteBase: item.isIngredienteBase || false
      })),
      etapas: receita.etapas.map(etapa => ({
        ...etapa,
        id: etapa.id,
        receitaId: receita.id
      }))
    })
    
    // Definir sistema de cálculo e peso total base
    setSistemaCalculo(receita.sistemaCalculo || 'peso')
    if (receita.pesoTotalBase) {
      setPesoTotalBase(receita.pesoTotalBase)
    } else {
      // Fallback para receitas antigas que não têm pesoTotalBase salvo
      const temIngredientesBase = receita.ingredientes.some(item => item.isIngredienteBase)
      if (temIngredientesBase) {
        setPesoTotalBase(1000)
      } else {
        setPesoTotalBase(1000)
      }
    }
    
    setShowForm(true)
  }

  const iniciarExclusao = (receita: Receita) => {
    setReceitaParaExcluir(receita)
    setShowDeleteModal(true)
  }

  const confirmarExclusao = async () => {
    if (!receitaParaExcluir) return
    
    setExcluindo(true)
    const loadingToast = toast.loading('Excluindo receita...')
    
    try {
      const response = await fetch(`/api/receitas/${receitaParaExcluir.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setShowDeleteModal(false)
        setReceitaParaExcluir(null)
        await carregarDados() // Recarregar a lista
        toast.success('Receita excluída com sucesso!', {
          id: loadingToast
        })
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao excluir receita', {
          id: loadingToast
        })
      }
    } catch (error) {
      console.error('Erro ao excluir receita:', error)
      toast.error('Erro ao excluir receita', {
        id: loadingToast
      })
    } finally {
      setExcluindo(false)
    }
  }

  const cancelarExclusao = () => {
    setShowDeleteModal(false)
    setReceitaParaExcluir(null)
  }

  // Função para converter peso para a unidade do ingrediente
  const converterPesoParaUnidade = (pesoGramas: number, unidade: string) => {
    switch (unidade.toLowerCase()) {
      case 'kg':
        return pesoGramas / 1000
      case 'g':
        return pesoGramas
      case 'l':
        return pesoGramas / 1000 // Assumindo densidade da água (1g/ml)
      case 'ml':
        return pesoGramas // Assumindo densidade da água (1g/ml)
      case 'unidade':
      case 'pacote':
      case 'caixa':
        return pesoGramas // Para unidades discretas, usar o valor direto
      default:
        return pesoGramas
    }
  }

  const calcularCustoTotal = () => {
    if (sistemaCalculo === 'peso') {
      return formData.ingredientes.reduce((total, item) => {
        const ingrediente = ingredientesDisponiveis.find(i => i.id === item.ingredienteId)
        return total + (ingrediente ? ingrediente.custoUnitario * item.quantidade : 0)
      }, 0)
    } else {
      // Sistema de porcentagem - soma das farinhas = 100%
      const ingredientesBase = formData.ingredientes.filter(item => item.isIngredienteBase)
      const totalPorcentagemBase = ingredientesBase.reduce((total, item) => total + item.quantidade, 0)
      
      if (totalPorcentagemBase === 0) return 0
      
      return formData.ingredientes.reduce((total, item) => {
        const ingrediente = ingredientesDisponiveis.find(i => i.id === item.ingredienteId)
        if (!ingrediente) return total
        
        let pesoRealGramas = 0
        if (item.isIngredienteBase) {
          // Ingrediente base: sua porcentagem do peso total base
          pesoRealGramas = pesoTotalBase * (item.quantidade / totalPorcentagemBase)
        } else {
          // Outros ingredientes: porcentagem do peso total base
          pesoRealGramas = pesoTotalBase * (item.quantidade / 100)
        }
        
        // Converter para a unidade do ingrediente
        const quantidadeNaUnidade = converterPesoParaUnidade(pesoRealGramas, ingrediente.unidade)
        
        return total + (ingrediente.custoUnitario * quantidadeNaUnidade)
      }, 0)
    }
  }

  const obterPesoReal = (item: ItemReceita) => {
    if (sistemaCalculo === 'peso') {
      return item.quantidade
    } else {
      const ingredientesBase = formData.ingredientes.filter(i => i.isIngredienteBase)
      const totalPorcentagemBase = ingredientesBase.reduce((total, i) => total + i.quantidade, 0)
      
      if (totalPorcentagemBase === 0) return 0
      
      if (item.isIngredienteBase) {
        // Ingrediente base: sua porcentagem do peso total base
        return pesoTotalBase * (item.quantidade / totalPorcentagemBase)
      } else {
        // Outros ingredientes: porcentagem do peso total base
        return pesoTotalBase * (item.quantidade / 100)
      }
    }
  }

  // Função para obter o custo individual de um item
  const obterCustoItem = (item: ItemReceita) => {
    const ingrediente = ingredientesDisponiveis.find(i => i.id === item.ingredienteId)
    if (!ingrediente) return 0

    if (sistemaCalculo === 'peso') {
      return ingrediente.custoUnitario * item.quantidade
    } else {
      const pesoRealGramas = obterPesoReal(item)
      const quantidadeNaUnidade = converterPesoParaUnidade(pesoRealGramas, ingrediente.unidade)
      return ingrediente.custoUnitario * quantidadeNaUnidade
    }
  }

  const receitasFiltradas = filtroCategoria 
    ? receitas.filter(receita => receita.categoria === filtroCategoria)
    : receitas

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
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Receitas</h1>
              <p className="mt-2 text-gray-600">Gerencie suas receitas e produtos</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Nova Receita
            </button>
          </div>

          {/* Filtros */}
          <div className="mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setFiltroCategoria('')}
                className={`px-4 py-2 rounded-lg ${!filtroCategoria ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Todas
              </button>
              {categorias.map(categoria => (
                <button
                  key={categoria.value}
                  onClick={() => setFiltroCategoria(categoria.value)}
                  className={`px-4 py-2 rounded-lg ${filtroCategoria === categoria.value ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  {categoria.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Receitas */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {receitasFiltradas.map((receita) => (
              <div key={receita.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{receita.nome}</h3>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-1">
                      {categorias.find(c => c.value === receita.categoria)?.label}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => iniciarEdicao(receita)}
                      className="text-gray-400 hover:text-blue-600"
                      title="Editar receita"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => iniciarExclusao(receita)}
                      className="text-gray-400 hover:text-red-600"
                      title="Excluir receita"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{receita.descricao}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    <span>{receita.tempoPreparo} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                    <span>R$ {receita.precoVenda.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="grid grid-cols-2 gap-2">
                      <p>Rendimento: {receita.rendimento} unidade(s)</p>
                      <p>Custo: R$ {receita.custoTotal.toFixed(2)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <p>Margem: {((receita.precoVenda - receita.custoTotal) / receita.precoVenda * 100).toFixed(1)}%</p>
                      {receita.pesoUnitario && (
                        <p>Peso: {receita.pesoUnitario}g/un</p>
                      )}
                    </div>
                    {receita.tamanhoForma && (
                      <p className="text-xs text-gray-500">Forma: {receita.tamanhoForma}</p>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <a
                      href={`/receitas/${receita.id}`}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Ver Detalhes e Etapas
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {receitasFiltradas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Nenhuma receita encontrada</p>
              <p className="text-gray-400 mt-2">Comece criando sua primeira receita!</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal do Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editandoReceita ? 'Editar Receita' : 'Nova Receita'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Receita *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    required
                    value={formData.categoria}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categorias.map(categoria => (
                      <option key={categoria.value} value={categoria.value}>
                        {categoria.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rendimento (unidades)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.rendimento}
                    onChange={(e) => setFormData(prev => ({ ...prev, rendimento: parseInt(e.target.value) || 1 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Quantas unidades esta receita produz"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo de Preparo (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.tempoPreparo}
                    onChange={(e) => setFormData(prev => ({ ...prev, tempoPreparo: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço de Venda *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.precoVenda}
                    onChange={(e) => setFormData(prev => ({ ...prev, precoVenda: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamanho da Forma
                  </label>
                  <input
                    type="text"
                    value={formData.tamanhoForma}
                    onChange={(e) => setFormData(prev => ({ ...prev, tamanhoForma: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: 30x20cm, Forma grande, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Peso Unitário (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.pesoUnitario}
                    onChange={(e) => setFormData(prev => ({ ...prev, pesoUnitario: parseFloat(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Peso de cada unidade"
                  />
                </div>
              </div>

              {/* Informações para Produção */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">📋 Informações para Plano de Produção</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Rendimento:</strong> Quantas unidades esta receita produz (ex: 12 pães, 1 bolo, etc.)</p>
                  <p><strong>Tamanho da Forma:</strong> Especificação da forma utilizada (ex: 30x20cm, forma grande, etc.)</p>
                  <p><strong>Peso Unitário:</strong> Peso individual de cada unidade produzida (importante para calcular peso total da produção)</p>
                </div>
              </div>

              {/* Sistema de Cálculo */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Sistema de Cálculo</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de Cálculo
                    </label>
                    <select
                      value={sistemaCalculo}
                      onChange={(e) => setSistemaCalculo(e.target.value as 'peso' | 'porcentagem')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="peso">Peso Absoluto (gramas/kg)</option>
                      <option value="porcentagem">Porcentagem do Padeiro (%)</option>
                    </select>
                  </div>
                  
                  {sistemaCalculo === 'porcentagem' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Peso Total das Farinhas (gramas)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="999999999"
                        step="1"
                        value={pesoTotalBase}
                        onChange={(e) => setPesoTotalBase(parseFloat(e.target.value) || 1000)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="1000"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Este é o peso total que representa 100%. A soma de todas as farinhas deve totalizar 100%.
                      </p>
                    </div>
                  )}
                </div>
                
                {sistemaCalculo === 'porcentagem' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-blue-900 mb-2">💡 Sistema de Porcentagem do Padeiro</h4>
                    <p className="text-sm text-blue-700">
                      No sistema de porcentagem, a <strong>soma de todas as farinhas</strong> representa 100%. 
                      Os outros ingredientes são expressos como porcentagem do peso total das farinhas.
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      <strong>Exemplo:</strong> Se você tem 700g de farinha de trigo (70%) + 300g de farinha integral (30%) = 1000g total (100%), 
                      e o açúcar é 20%, então o açúcar pesará 200g.
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      <strong>Marque as farinhas como "Ingrediente Base"</strong> para que sejam consideradas na soma dos 100%.
                    </p>
                  </div>
                )}
              </div>

              {/* Ingredientes */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Ingredientes
                  </label>
                  <button
                    type="button"
                    onClick={adicionarIngrediente}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    + Adicionar
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.ingredientes.map((item, index) => {
                    const ingrediente = ingredientesDisponiveis.find(i => i.id === item.ingredienteId)
                    const pesoReal = obterPesoReal(item)
                    
                    return (
                      <div key={index} className={`border rounded-lg p-3 ${item.isIngredienteBase ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                        <div className="flex gap-3 items-center mb-2">
                          <select
                            value={item.ingredienteId}
                            onChange={(e) => atualizarIngrediente(index, 'ingredienteId', e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {ingredientesDisponiveis.map(ingrediente => (
                              <option key={ingrediente.id} value={ingrediente.id}>
                                {ingrediente.nome} ({ingrediente.unidade})
                              </option>
                            ))}
                          </select>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantidade}
                              onChange={(e) => atualizarIngrediente(index, 'quantidade', parseFloat(e.target.value) || 0)}
                              className="w-24 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={sistemaCalculo === 'porcentagem' ? '%' : 'Qtd'}
                            />
                            <span className="text-sm text-gray-500 min-w-[20px]">
                              {sistemaCalculo === 'porcentagem' ? '%' : ingrediente?.unidade || ''}
                            </span>
                          </div>
                          
                          {sistemaCalculo === 'porcentagem' && (
                            <label className="flex items-center gap-1 text-xs">
                              <input
                                type="checkbox"
                                checked={item.isIngredienteBase || false}
                                onChange={(e) => atualizarIngrediente(index, 'isIngredienteBase', e.target.checked)}
                                className="rounded"
                              />
                              <span className="text-blue-700 font-medium">Base</span>
                            </label>
                          )}
                          
                          <button
                            type="button"
                            onClick={() => removerIngrediente(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                        
                        {sistemaCalculo === 'porcentagem' && (
                          <div className="text-xs text-gray-600 flex justify-between">
                            <span>
                              {item.isIngredienteBase ? 
                                `Ingrediente Base (${item.quantidade}% do total)` : 
                                `${item.quantidade}% das farinhas base`
                              }
                            </span>
                            <span>
                              Peso real: {pesoReal.toFixed(1)}g
                            </span>
                          </div>
                        )}
                        
                        {ingrediente && (
                          <div className="text-xs text-gray-500 mt-1">
                            Custo: R$ {obterCustoItem(item).toFixed(2)}
                            {sistemaCalculo === 'porcentagem' && (
                              <span className="ml-2 text-gray-400">
                                ({converterPesoParaUnidade(pesoReal, ingrediente.unidade).toFixed(2)} {ingrediente.unidade})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                
                {formData.ingredientes.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-700">
                        Custo Total: R$ {calcularCustoTotal().toFixed(2)}
                      </p>
                      {sistemaCalculo === 'porcentagem' && (
                        <p className="text-xs text-gray-500">
                          Peso total: {formData.ingredientes.reduce((total, item) => total + obterPesoReal(item), 0).toFixed(1)}g
                        </p>
                      )}
                    </div>
                    
                    {sistemaCalculo === 'porcentagem' && (
                      <div className="mt-2 text-xs text-gray-600">
                        {(() => {
                          const ingredientesBase = formData.ingredientes.filter(item => item.isIngredienteBase)
                          const totalPorcentagemBase = ingredientesBase.reduce((total, item) => total + item.quantidade, 0)
                          
                          if (ingredientesBase.length > 0) {
                            return (
                              <div>
                                <p className="font-medium">Ingredientes Base (Total: {totalPorcentagemBase}%):</p>
                                {ingredientesBase.map((item, idx) => {
                                  const ingrediente = ingredientesDisponiveis.find(i => i.id === item.ingredienteId)
                                  const pesoReal = obterPesoReal(item)
                                  const quantidadeNaUnidade = converterPesoParaUnidade(pesoReal, ingrediente?.unidade || 'g')
                                  const custo = obterCustoItem(item)
                                  return (
                                    <p key={idx}>
                                      • {ingrediente?.nome}: {item.quantidade}% = {pesoReal.toFixed(1)}g 
                                      ({quantidadeNaUnidade.toFixed(3)} {ingrediente?.unidade}) 
                                      = R$ {custo.toFixed(2)}
                                    </p>
                                  )
                                })}
                                {totalPorcentagemBase !== 100 && (
                                  <p className="text-orange-600 font-medium">
                                    ⚠️ Atenção: Total dos ingredientes base deve ser 100% (atual: {totalPorcentagemBase}%)
                                  </p>
                                )}
                              </div>
                            )
                          } else {
                            return <p className="text-orange-600">⚠️ Marque pelo menos um ingrediente como "Base" (farinha)</p>
                          }
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Etapas da Receita */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Etapas da Receita</h3>
                  <button
                    type="button"
                    onClick={adicionarEtapa}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Adicionar Etapa
                  </button>
                </div>

                {formData.etapas.map((etapa, index) => (
                  <div key={index} className="border rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium">Etapa {etapa.ordem}</h4>
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={() => moverEtapa(index, 'cima')}
                          disabled={index === 0}
                          className="bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 disabled:opacity-50"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moverEtapa(index, 'baixo')}
                          disabled={index === formData.etapas.length - 1}
                          className="bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 disabled:opacity-50"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removerEtapa(index)}
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          Remover
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome da Etapa
                        </label>
                        <input
                          type="text"
                          value={etapa.nome}
                          onChange={(e) => atualizarEtapa(index, 'nome', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          placeholder="Ex: Pré-fermento, Massa Principal, Recheio"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descrição
                        </label>
                        <textarea
                          value={etapa.descricao}
                          onChange={(e) => atualizarEtapa(index, 'descricao', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          rows={2}
                          placeholder="Descreva esta etapa..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tempo Mínimo (min)
                        </label>
                        <input
                          type="number"
                          value={etapa.tempoMin || ''}
                          onChange={(e) => atualizarEtapa(index, 'tempoMin', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tempo Máximo (min)
                        </label>
                        <input
                          type="number"
                          value={etapa.tempoMax || ''}
                          onChange={(e) => atualizarEtapa(index, 'tempoMax', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Temperatura (°C)
                        </label>
                        <input
                          type="number"
                          value={etapa.temperatura || ''}
                          onChange={(e) => atualizarEtapa(index, 'temperatura', e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          step="0.1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Umidade (%)
                        </label>
                        <input
                          type="number"
                          value={etapa.umidade || ''}
                          onChange={(e) => atualizarEtapa(index, 'umidade', e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Observações
                        </label>
                        <textarea
                          value={etapa.observacoes || ''}
                          onChange={(e) => atualizarEtapa(index, 'observacoes', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          rows={2}
                          placeholder="Observações adicionais..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Instruções */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instruções de Preparo
                </label>
                <textarea
                  value={formData.instrucoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, instrucoes: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descreva o passo a passo para preparar esta receita..."
                />
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting 
                    ? (editandoReceita ? 'Atualizando...' : 'Salvando...') 
                    : (editandoReceita ? 'Atualizar Receita' : 'Salvar Receita')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && receitaParaExcluir && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Excluir Receita
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Tem certeza que deseja excluir a receita <strong>"{receitaParaExcluir.nome}"</strong>?
                </p>
                <p className="text-xs text-red-600 mb-6">
                  Esta ação não pode ser desfeita. A receita será removida permanentemente.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={cancelarExclusao}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  disabled={excluindo}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarExclusao}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  disabled={excluindo}
                >
                  {excluindo ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="h-4 w-4" />
                      Excluir
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 