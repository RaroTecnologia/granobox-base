import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Package, 
  Plus,
  XCircle
} from '@phosphor-icons/react'

interface Segmento {
  id: number
  nome: string
  categorias: Categoria[]
}

interface Categoria {
  id: number
  nome: string
  segmentoId: number
}

interface Item {
  id?: number
  categoriaId: string
  nome: string
  segmento: string
  descricao: string
  codigo: string
  pesoVolume: string
  marca: string
  validadeAmbiente: string
  validadeRefrigerado: string
  validadeCongelado: string
  ingredientes: string
  precoVenda: string
  custoProducao: string
  observacoes: string
}

export default function CadastroItemPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { theme } = useTheme()
  const isEditing = !!id
  
  const [formData, setFormData] = useState<Item>({
    categoriaId: '',
    nome: '',
    segmento: '',
    descricao: '',
    codigo: '',
    pesoVolume: '',
    marca: '',
    validadeAmbiente: '',
    validadeRefrigerado: '',
    validadeCongelado: '',
    ingredientes: '',
    precoVenda: '',
    custoProducao: '',
    observacoes: ''
  })

  // Mock data para segmentos e categorias
  const segmentos: Segmento[] = [
    {
      id: 1,
      nome: 'Manipulado',
      categorias: [
        { id: 1, nome: 'Pães e Massas', segmentoId: 1 },
        { id: 2, nome: 'Doces e Confeitos', segmentoId: 1 },
        { id: 3, nome: 'Salgados', segmentoId: 1 }
      ]
    },
    {
      id: 2,
      nome: 'Produto Final',
      categorias: [
        { id: 4, nome: 'Bebidas', segmentoId: 2 },
        { id: 5, nome: 'Snacks', segmentoId: 2 }
      ]
    },
    {
      id: 3,
      nome: 'Matéria Prima',
      categorias: [
        { id: 6, nome: 'Farinhas', segmentoId: 3 },
        { id: 7, nome: 'Açúcares', segmentoId: 3 }
      ]
    }
  ]

  // Preencher dados iniciais se for edição ou se vierem parâmetros
  useEffect(() => {
    if (isEditing) {
      // Aqui você carregaria os dados do item para edição
      console.log('Editando item:', id)
    } else {
      // Preencher com parâmetros da URL se existirem
      const nome = searchParams.get('nome')
      const segmento = searchParams.get('segmento')
      
      if (nome) {
        setFormData(prev => ({ ...prev, nome }))
      }
      
      if (segmento) {
        setFormData(prev => ({ ...prev, segmento }))
        // Encontrar categoria baseada no segmento
        const segmentoEncontrado = segmentos.find(s => s.nome.toLowerCase().includes(segmento.toLowerCase()))
        if (segmentoEncontrado && segmentoEncontrado.categorias.length > 0) {
          setFormData(prev => ({ ...prev, categoriaId: segmentoEncontrado.categorias[0].id.toString() }))
        }
      }
    }
  }, [id, searchParams, isEditing])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log(isEditing ? 'Atualizando item:' : 'Salvando novo item:', formData)
    // Aqui você implementaria a lógica de salvamento/atualização
    navigate('/cadastros')
  }

  const categoriasDisponiveis = segmentos.flatMap(s => s.categorias)

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900 text-white' : 'bg-light-50 text-dark-900'} pb-20`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-b px-4 py-4 sticky top-0 z-10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/cadastros')}
              className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'}`}
            >
              <XCircle size={24} weight="duotone" />
            </button>
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Package size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{isEditing ? 'Editar Item' : 'Novo Item'}</h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                {isEditing ? 'Editar produto alimentício existente' : `Cadastro de produto alimentício - ${searchParams.get('segmento') || 'Tipo não selecionado'}`}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-primary hover:bg-primary-600 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <Plus size={16} weight="duotone" />
            <span>{isEditing ? 'Atualizar Item' : 'Salvar Item'}</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="p-4 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
            <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              Informações Básicas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Ex: Pão de Queijo"
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Segmento *
                </label>
                <select
                  value={formData.segmento || ''}
                  onChange={(e) => handleInputChange('segmento', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                >
                  <option value="">Selecione um segmento</option>
                  <option value="Manipulado">Manipulado</option>
                  <option value="Produto Final">Produto Final</option>
                  <option value="Matéria Prima">Matéria Prima</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Categoria *
                </label>
                <select
                  value={formData.categoriaId}
                  onChange={(e) => handleInputChange('categoriaId', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                >
                  <option value="">Selecione uma categoria</option>
                  {segmentos.map(segmento => 
                    segmento.categorias.map(categoria => (
                      <option key={categoria.id} value={categoria.id}>
                        {segmento.nome} - {categoria.nome}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  placeholder="Ex: Pão de Queijo, Bolo de Chocolate"
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Identificação e Medidas */}
          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
            <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              Identificação e Medidas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Código do Produto *
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => handleInputChange('codigo', e.target.value)}
                  placeholder="Ex: PAO-001, BOLO-002"
                  required
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Peso/Volume *
                </label>
                <input
                  type="text"
                  value={formData.pesoVolume}
                  onChange={(e) => handleInputChange('pesoVolume', e.target.value)}
                  placeholder="Ex: 100g, 500ml, 1kg"
                  required
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Marca/Fabricante *
                </label>
                <input
                  type="text"
                  value={formData.marca}
                  onChange={(e) => handleInputChange('marca', e.target.value)}
                  placeholder="Ex: Padaria Central"
                  required
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Conservação e Validade */}
          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
            <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              Conservação e Validade
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Ambiente/Seco (dias)
                </label>
                <input
                  type="number"
                  value={formData.validadeAmbiente}
                  onChange={(e) => handleInputChange('validadeAmbiente', e.target.value)}
                  placeholder="0"
                  min="0"
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Refrigerado (dias)
                </label>
                <input
                  type="number"
                  value={formData.validadeRefrigerado}
                  onChange={(e) => handleInputChange('validadeRefrigerado', e.target.value)}
                  placeholder="0"
                  min="0"
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Congelado (dias)
                </label>
                <input
                  type="number"
                  value={formData.validadeCongelado}
                  onChange={(e) => handleInputChange('validadeCongelado', e.target.value)}
                  placeholder="0"
                  min="0"
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                />
              </div>
            </div>
            
            <div className="mt-3 text-xs text-gray-500">
              * Validade em dias para cada tipo de conservação
            </div>
          </div>

          {/* Ingredientes e Observações */}
          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
            <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              Ingredientes e Observações
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Ingredientes Principais
                </label>
                <textarea
                  value={formData.ingredientes}
                  onChange={(e) => handleInputChange('ingredientes', e.target.value)}
                  placeholder="Liste os ingredientes principais (separados por vírgula)..."
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Observações Especiais
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Alergênicos, restrições, modo de preparo..."
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Informações Financeiras */}
          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
            <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              Informações Financeiras
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Preço de Venda *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precoVenda}
                  onChange={(e) => handleInputChange('precoVenda', e.target.value)}
                  placeholder="0.00"
                  required
                  min="0"
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Custo de Produção
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.custoProducao}
                  onChange={(e) => handleInputChange('custoProducao', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                />
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* Footer Navigation */}
      <nav className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-t fixed bottom-0 left-0 right-0 px-4 py-3`}>
        <div className="flex items-center justify-around">
          <a href="/dashboard" className={`flex flex-col items-center space-y-1 ${theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'} transition-colors`}>
            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
              <Package size={16} weight="duotone" className="text-primary" />
            </div>
            <span className="text-xs">Dash</span>
          </a>
          <a href="/etiquetas" className={`flex flex-col items-center space-y-1 ${theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'} transition-colors`}>
            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
              <Package size={16} weight="duotone" className="text-primary" />
            </div>
            <span className="text-xs">Etiquetas</span>
          </a>
          <a href="/cadastros" className={`flex flex-col items-center space-y-1 text-primary`}>
            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
              <Package size={16} weight="duotone" className="text-primary" />
            </div>
            <span className="text-xs">Cadastros</span>
          </a>
          <a href="/alertas" className={`flex flex-col items-center space-y-1 ${theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'} transition-colors`}>
            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
              <Package size={16} weight="duotone" className="text-primary" />
            </div>
            <span className="text-xs">Alertas</span>
          </a>
          <a href="/configuracoes" className={`flex flex-col items-center space-y-1 ${theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'} transition-colors`}>
            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
              <Package size={16} weight="duotone" className="text-primary" />
            </div>
            <span className="text-xs">Config</span>
          </a>
        </div>
      </nav>
    </div>
  )
}
