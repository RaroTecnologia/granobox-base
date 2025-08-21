import React, { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { useFormValidation } from '@/hooks/useFormValidation'
import { 
  Package, 
  ChartLine, 
  Warning, 
  Gear,
  Plus,
  MagnifyingGlass,
  Funnel,
  SortAscending,
  Eye,
  PencilSimple,
  Trash,
  CaretRight,
  CaretDown,
  HandWaving,
  Barcode,
  TrayArrowDown,
  Tag,
  User,
  Calendar,
  X
} from '@phosphor-icons/react'

interface Segmento {
  id: number
  nome: string
  descricao: string
  icone: string
  cor: string
  categorias: Categoria[]
}

interface Categoria {
  id: number
  nome: string
  descricao: string
  segmentoId: number
  parentId?: number
  nivel: number
  itens: Item[]
}

interface Item {
  id: number
  nome: string
  descricao: string
  categoriaId: number
  foto?: string
  codigo: string
  pesoVolume: string
  marca: string
  validadeAmbiente: number
  validadeRefrigerado: number
  validadeCongelado: number
  ingredientes: string
  precoVenda: number
  custoProducao: number
  observacoes: string
  ativo: boolean
}

export default function CadastrosPage() {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<'segmentos' | 'categorias' | 'itens'>('segmentos')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [showItemModal, setShowItemModal] = useState(false)
  const [itemFormData, setItemFormData] = useState({ nome: '', segmento: '' })
  const [formErrors, setFormErrors] = useState<{ nome?: string; segmento?: string }>({})
  const navigate = useNavigate()

  const handleItemSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', itemFormData)
    setFormErrors({})
    
    // Validação manual simples
    if (itemFormData.nome.trim() && itemFormData.segmento) {
      console.log('Validation passed, navigating...')
      // Simular criação do item e obter ID
      const newItemId = Math.floor(Math.random() * 1000) + 1
      const url = `/cadastro/item/${newItemId}?nome=${encodeURIComponent(itemFormData.nome)}&segmento=${encodeURIComponent(itemFormData.segmento)}`
      console.log('Navigating to:', url)
      navigate(url)
      setShowItemModal(false)
      setItemFormData({ nome: '', segmento: '' })
    } else {
      console.log('Validation failed - nome:', itemFormData.nome, 'segmento:', itemFormData.segmento)
      // Mostrar erros manuais
      const newErrors: { nome?: string; segmento?: string } = {}
      if (!itemFormData.nome.trim()) newErrors.nome = 'Nome do item é obrigatório'
      if (!itemFormData.segmento) newErrors.segmento = 'Segmento é obrigatório'
      setFormErrors(newErrors)
      console.log('Setting errors:', newErrors)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setItemFormData(prev => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando o usuário digita/seleciona
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Mock data
  const [segmentos, setSegmentos] = useState<Segmento[]>([
    {
      id: 1,
      nome: 'Manipulado',
      descricao: 'Produtos manipulados em farmácia',
      icone: 'HandWaving',
      cor: 'bg-primary',
      categorias: [
        {
          id: 1,
          nome: 'Medicamentos',
          descricao: 'Medicamentos manipulados',
          segmentoId: 1,
          nivel: 1,
          itens: [
            {
              id: 1,
              nome: 'Paracetamol 500mg',
              descricao: 'Analgésico e antitérmico',
              categoriaId: 1,
              codigo: 'MED-001',
              unidade: 'mg',
              preco: 15.50,
              ativo: true
            }
          ]
        },
        {
          id: 2,
          nome: 'Suplementos',
          descricao: 'Suplementos alimentares',
          segmentoId: 1,
          nivel: 1,
          itens: []
        }
      ]
    },
    {
      id: 2,
      nome: 'Produto Final',
      descricao: 'Produtos finais prontos para uso',
      icone: 'Barcode',
      cor: 'bg-primary',
      categorias: [
        {
          id: 3,
          nome: 'Cosméticos',
          descricao: 'Produtos cosméticos',
          segmentoId: 2,
          nivel: 1,
          itens: []
        }
      ]
    },
    {
      id: 3,
      nome: 'Matéria Prima',
      descricao: 'Matérias primas para manipulação',
      icone: 'TrayArrowDown',
      cor: 'bg-primary',
      categorias: [
        {
          id: 4,
          nome: 'Excipientes',
          descricao: 'Excipientes farmacêuticos',
          segmentoId: 3,
          nivel: 1,
          itens: []
        }
      ]
    }
  ])

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'HandWaving': return <HandWaving size={24} weight="duotone" />
      case 'Barcode': return <Barcode size={24} weight="duotone" />
      case 'TrayArrowDown': return <TrayArrowDown size={24} weight="duotone" />
      default: return <Package size={24} weight="duotone" />
    }
  }

  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const handleAddNew = (type: 'categoria' | 'item') => {
    // This function is no longer needed as the "Novo Item" button navigates directly
  }

  const renderSegmentos = () => (
    <div className="space-y-4">
      {segmentos.map((segmento) => (
        <div key={segmento.id} className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 ${segmento.cor} rounded-full flex items-center justify-center text-white`}>
                {getIconComponent(segmento.icone)}
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  {segmento.nome}
                </h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  {segmento.descricao}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-dark-700 text-dark-300' : 'bg-light-100 text-dark-600'}`}>
                {segmento.categorias.length} categorias
              </span>
            </div>
          </div>

          {/* Categorias do Segmento */}
          <div className="space-y-3">
            {segmento.categorias.map((categoria) => (
              <div key={categoria.id} className={`${theme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-light-50 border-light-200'} rounded-xl p-4 border`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                      <Tag size={16} weight="duotone" className="text-primary" />
                    </div>
                    <div>
                      <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                        {categoria.nome}
                      </h4>
                      <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                        {categoria.descricao}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-600'}`}>
                      {categoria.itens.length} itens
                    </span>
                    <button className="p-1 text-primary hover:bg-primary/10 rounded-full transition-colors">
                      <PencilSimple size={16} weight="duotone" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  const renderCategorias = () => (
    <div className="space-y-4">
      {segmentos.flatMap(segmento => 
        segmento.categorias.map(categoria => (
          <div key={categoria.id} className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <Tag size={24} weight="duotone" className="text-primary" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    {categoria.nome}
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                    {categoria.descricao}
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-dark-500' : 'text-dark-500'}`}>
                    Segmento: {segmentos.find(s => s.id === categoria.segmentoId)?.nome}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-sm px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-dark-700 text-dark-300' : 'bg-light-100 text-dark-600'}`}>
                  {categoria.itens.length} itens
                </span>
                <button className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
                  <PencilSimple size={20} weight="duotone" />
                </button>
                <button className="p-2 text-dark-400 hover:bg-dark-700 rounded-full transition-colors">
                  <Trash size={20} weight="duotone" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )

  const renderItens = () => (
    <div className="space-y-4">
      {segmentos.flatMap(segmento => 
        segmento.categorias.flatMap(categoria => 
          categoria.itens.map(item => (
            <div key={item.id} className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <Package size={24} weight="duotone" className="text-primary" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                      {item.nome}
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                      {item.descricao}
                    </p>
                    <p className={`text-xs ${theme === 'dark' ? 'text-dark-500' : 'text-dark-500'}`}>
                      {segmentos.find(s => s.id === categoria.segmentoId)?.nome} → {categoria.nome}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-dark-700 text-dark-300' : 'bg-light-100 text-dark-600'}`}>
                    {item.codigo}
                  </span>
                  <button className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
                    <PencilSimple size={20} weight="duotone" />
                  </button>
                  <button className="p-2 text-dark-400 hover:bg-dark-700 rounded-full transition-colors">
                    <Trash size={20} weight="duotone" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )
      )}
    </div>
  )

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900 text-white' : 'bg-light-50 text-dark-900'} pb-20`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-b px-4 py-4 sticky top-0 z-10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Package size={24} weight="duotone" className="text-primary" />
            </div>
            <h1 className="text-xl font-bold">Cadastros</h1>
          </div>
          <button
            onClick={() => setShowItemModal(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2"
          >
            <Plus size={16} weight="duotone" />
            <span>Novo Item</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="p-4 space-y-6">
        {/* Tabs */}
        <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-2 border shadow-xl`}>
          <div className="flex space-x-2">
            {[
              { key: 'segmentos', label: 'Segmentos', icon: Package },
              { key: 'categorias', label: 'Categorias', icon: Tag },
              { key: 'itens', label: 'Itens', icon: Package }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-primary text-white shadow-lg'
                    : `${theme === 'dark' ? 'text-dark-400 hover:text-white hover:bg-dark-700' : 'text-dark-600 hover:text-dark-900 hover:bg-light-100'}`
                }`}
              >
                <tab.icon size={20} weight="duotone" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Busca e Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlass 
              size={20} 
              weight="duotone" 
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`} 
            />
            <input
              type="text"
              placeholder={`Buscar ${activeTab === 'segmentos' ? 'segmentos' : activeTab === 'categorias' ? 'categorias' : 'itens'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-full border-2 transition-all duration-200 focus:outline-none ${
                theme === 'dark' 
                  ? 'bg-dark-800 border-dark-700 text-white focus:border-primary' 
                  : 'bg-white border-light-200 text-dark-900 focus:border-primary'
              }`}
            />
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="min-h-[400px]">
          {activeTab === 'segmentos' && renderSegmentos()}
          {activeTab === 'categorias' && renderCategorias()}
          {activeTab === 'itens' && renderItens()}
        </div>
      </main>

      {/* Modal de Novo Item */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-2xl max-w-md w-full`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Novo Item
              </h3>
              <button
                onClick={() => setShowItemModal(false)}
                className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'}`}
              >
                <X size={20} weight="duotone" className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} />
              </button>
            </div>

            <form onSubmit={handleItemSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Nome do Item
                </label>
                <input
                  type="text"
                  value={itemFormData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Ex: Pão de Queijo"
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary' 
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                />
                {formErrors.nome && <p className="text-xs text-red-500 mt-1">{formErrors.nome}</p>}
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Segmento
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'Manipulado', icon: HandWaving, color: 'bg-primary' },
                    { value: 'Produto Final', icon: Tag, color: 'bg-primary' },
                    { value: 'Matéria Prima', icon: Package, color: 'bg-primary' }
                  ].map((tipo) => (
                    <div
                      key={tipo.value}
                      onClick={() => handleInputChange('segmento', tipo.value)}
                      className={`cursor-pointer rounded-xl p-4 border-2 transition-all duration-200 ${
                        itemFormData.segmento === tipo.value
                          ? `${tipo.color} border-transparent text-white shadow-lg scale-105`
                          : `${theme === 'dark' ? 'bg-dark-700 border-dark-600 hover:border-primary' : 'bg-light-100 border-light-200 hover:border-primary'} hover:scale-102`
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2 text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          itemFormData.segmento === tipo.value ? 'bg-white/20' : 'bg-gray-100'
                        }`}>
                          <tipo.icon 
                            size={16} 
                            weight="duotone" 
                            className={itemFormData.segmento === tipo.value ? 'text-white' : 'text-gray-600'} 
                          />
                        </div>
                        <div className={`font-semibold text-xs ${itemFormData.segmento === tipo.value ? 'text-white' : theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                          {tipo.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {formErrors.segmento && <p className="text-xs text-red-500 mt-1">{formErrors.segmento}</p>}
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!itemFormData.nome.trim() || !itemFormData.segmento}
                  className="px-4 py-2 bg-primary hover:bg-primary-600 disabled:bg-gray-400 text-white rounded-full text-sm font-medium transition-colors disabled:cursor-not-allowed"
                >
                  Continuar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <nav className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-t fixed bottom-0 left-0 right-0 px-4 py-3`}>
        <div className="flex items-center justify-around">
          <a href="/dashboard" className={`flex flex-col items-center space-y-1 ${theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'} transition-colors`}>
            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
              <ChartLine size={16} weight="duotone" className="text-primary" />
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
              <Warning size={16} weight="duotone" className="text-primary" />
            </div>
            <span className="text-xs">Alertas</span>
          </a>
          <a href="/configuracoes" className={`flex flex-col items-center space-y-1 ${theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'} transition-colors`}>
            <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
              <Gear size={16} weight="duotone" className="text-primary" />
            </div>
            <span className="text-xs">Config</span>
          </a>
        </div>
      </nav>
    </div>
  )
}
