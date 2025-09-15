import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { MagnifyingGlass, Clock, Plus, Minus, House, Thermometer, Snowflake, ArrowLeft, ArrowRight, Printer } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import FooterNavigation from '@/components/FooterNavigation'

type Step = 'categorias' | 'subcategorias' | 'produtos' | 'configuracao'

export default function ValidadeSelecaoPage() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // Estados da navegação
  const [currentStep, setCurrentStep] = useState<Step>('categorias')
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<any>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Estados da configuração
  const [conservacao, setConservacao] = useState<'ambiente' | 'refrigerado' | 'congelado' | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [peso, setPeso] = useState('')
  const [unidade, setUnidade] = useState('KG')
  const [dataValidade, setDataValidade] = useState('')

  const unidades = ['KG', 'G', 'L', 'ML', 'UN']

  // Hooks para dados
  const clientId = user?.clientId || (user?.role === 'manager' ? '6621e831-5d1d-4801-8c33-b0f93446a3df' : undefined)
  const { categories, rootCategories, loading: categoriesLoading } = useCategories(clientId)
  const { products, loading: productsLoading } = useProducts(clientId)

  // Calcular subcategorias da categoria selecionada
  const subcategories = selectedCategory 
    ? categories.filter(cat => cat.parentId === selectedCategory.id)
    : []

  // Filtrar produtos da subcategoria selecionada
  const categoryProducts = selectedSubcategory 
    ? products.filter(product => 
        product.categoryId === selectedSubcategory.id && 
        (product.type === 'finished' || product.type === 'manipulated')
      ).filter(product => 
        searchTerm === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : []

  // Calcular data de validade automaticamente
  useEffect(() => {
    if (conservacao) {
      const hoje = new Date()
      let diasValidade = 0
      
      switch (conservacao) {
        case 'ambiente':
          diasValidade = 7
          break
        case 'refrigerado':
          diasValidade = 30
          break
        case 'congelado':
          diasValidade = 90
          break
      }
      
      const dataFutura = new Date(hoje.getTime() + (diasValidade * 24 * 60 * 60 * 1000))
      setDataValidade(dataFutura.toISOString().split('T')[0])
    }
  }, [conservacao])

  const getConservacaoInfo = (tipo: 'ambiente' | 'refrigerado' | 'congelado') => {
    const info = {
      ambiente: { icon: House, label: 'Ambiente', color: 'text-green-500', dias: '7 dias' },
      refrigerado: { icon: Thermometer, label: 'Refrigerado', color: 'text-blue-500', dias: '30 dias' },
      congelado: { icon: Snowflake, label: 'Congelado', color: 'text-cyan-500', dias: '90 dias' }
    }
    return info[tipo]
  }

  const handleBack = () => {
    if (currentStep === 'configuracao') {
      setCurrentStep('produtos')
      setSelectedProduct(null)
    } else if (currentStep === 'produtos') {
      setCurrentStep('subcategorias')
      setSelectedSubcategory(null)
    } else if (currentStep === 'subcategorias') {
      setCurrentStep('categorias')
      setSelectedCategory(null)
    } else {
      navigate('/etiquetas/nova')
    }
  }

  const handleSelectCategory = (category: any) => {
    setSelectedCategory(category)
    setSelectedSubcategory(null)
    setSelectedProduct(null)
    
    const hasSubcategories = categories.some(cat => cat.parentId === category.id)
    if (hasSubcategories) {
      setCurrentStep('subcategorias')
    } else {
      setSelectedSubcategory(category) // Simular subcategoria selecionada
      setCurrentStep('produtos')
    }
  }

  const handleSelectSubcategory = (subcategory: any) => {
    setSelectedSubcategory(subcategory)
    setSelectedProduct(null)
    setCurrentStep('produtos')
  }

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product)
    setCurrentStep('configuracao')
  }

  const handleAdicionarAFila = () => {
    if (!selectedProduct || !conservacao) {
      toast.error('Selecione um produto e tipo de conservação')
      return
    }

    const item = {
      id: Date.now(),
      produto: selectedProduct,
      quantidade,
      peso,
      unidade,
      conservacao,
      dataValidade,
      timestamp: new Date()
    }

    const filaAtual = JSON.parse(localStorage.getItem('filaValidadeEtiquetas') || '[]')
    filaAtual.push(item)
    localStorage.setItem('filaValidadeEtiquetas', JSON.stringify(filaAtual))

    toast.success('Produto adicionado à fila de impressão!')
    
    // Reset form
    setConservacao(null)
    setQuantidade(1)
    setPeso('')
    setUnidade('KG')
    setDataValidade('')
    setSelectedProduct(null)
    setCurrentStep('produtos')
  }

  const handleVerFila = () => {
    navigate('/etiquetas/validade/impressao')
  }

  const renderBreadcrumb = () => {
    if (currentStep === 'subcategorias' && selectedCategory) {
      return (
        <div className={`px-6 py-3 ${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-b`}>
          <div className="flex items-center space-x-2 text-sm">
            <button onClick={() => setCurrentStep('categorias')} className="text-primary hover:underline">
              Categorias
            </button>
            <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>/</span>
            <span className={theme === 'dark' ? 'text-white' : 'text-dark-900'}>{selectedCategory.name}</span>
          </div>
        </div>
      )
    }

    if (currentStep === 'produtos' && selectedCategory && selectedSubcategory) {
      const isDirectCategory = selectedCategory.id === selectedSubcategory.id
      if (isDirectCategory) {
        return (
          <div className={`px-6 py-3 ${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-b`}>
            <div className="flex items-center space-x-2 text-sm">
              <button onClick={() => setCurrentStep('categorias')} className="text-primary hover:underline">
                Categorias
              </button>
              <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>/</span>
              <span className={theme === 'dark' ? 'text-white' : 'text-dark-900'}>{selectedCategory.name}</span>
            </div>
          </div>
        )
      } else {
        return (
          <div className={`px-6 py-3 ${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-b`}>
            <div className="flex items-center space-x-2 text-sm">
              <button onClick={() => setCurrentStep('categorias')} className="text-primary hover:underline">
                Categorias
              </button>
              <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>/</span>
              <button onClick={() => setCurrentStep('subcategorias')} className="text-primary hover:underline">
                {selectedCategory.name}
              </button>
              <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>/</span>
              <span className={theme === 'dark' ? 'text-white' : 'text-dark-900'}>{selectedSubcategory.name}</span>
            </div>
          </div>
        )
      }
    }

    if (currentStep === 'configuracao' && selectedProduct) {
      const isDirectCategory = selectedCategory?.id === selectedSubcategory?.id
      if (isDirectCategory) {
        return (
          <div className={`px-6 py-3 ${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-b`}>
            <div className="flex items-center space-x-2 text-sm">
              <button onClick={() => setCurrentStep('categorias')} className="text-primary hover:underline">
                Categorias
              </button>
              <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>/</span>
              <button onClick={() => setCurrentStep('produtos')} className="text-primary hover:underline">
                {selectedCategory?.name}
              </button>
              <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>/</span>
              <span className={theme === 'dark' ? 'text-white' : 'text-dark-900'}>{selectedProduct.name}</span>
            </div>
          </div>
        )
      } else {
        return (
          <div className={`px-6 py-3 ${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-b`}>
            <div className="flex items-center space-x-2 text-sm">
              <button onClick={() => setCurrentStep('categorias')} className="text-primary hover:underline">
                Categorias
              </button>
              <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>/</span>
              <button onClick={() => setCurrentStep('subcategorias')} className="text-primary hover:underline">
                {selectedCategory?.name}
              </button>
              <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>/</span>
              <button onClick={() => setCurrentStep('produtos')} className="text-primary hover:underline">
                {selectedSubcategory?.name}
              </button>
              <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>/</span>
              <span className={theme === 'dark' ? 'text-white' : 'text-dark-900'}>{selectedProduct.name}</span>
            </div>
          </div>
        )
      }
    }

    return null
  }

  if (categoriesLoading || productsLoading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className={theme === 'dark' ? 'text-white' : 'text-dark-900'}>Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'}`}>
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 ${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-b`}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className={`p-2 ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'} rounded-lg transition-colors`}
            >
              <ArrowLeft size={24} weight="duotone" />
            </button>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Clock size={24} weight="duotone" className="text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Etiqueta de Validade
              </h1>
              <p className="text-primary text-sm">
                {currentStep === 'categorias' && 'Selecione uma categoria'}
                {currentStep === 'subcategorias' && 'Selecione uma subcategoria'}
                {currentStep === 'produtos' && 'Selecione um produto'}
                {currentStep === 'configuracao' && 'Configure a etiqueta'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleVerFila}
            className="flex items-center space-x-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Printer size={18} />
            <div className="bg-white text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {JSON.parse(localStorage.getItem('filaValidadeEtiquetas') || '[]').length}
            </div>
          </button>
        </div>
      </header>

      {/* Breadcrumb */}
      {renderBreadcrumb()}

      {/* Conteúdo Principal */}
      <main className="pt-32 px-6 py-8 pb-32">
        {/* Busca (apenas nas telas de produtos) */}
        {currentStep === 'produtos' && (
          <div className="mb-6 max-w-md mx-auto">
            <div className="relative">
              <MagnifyingGlass 
                size={20} 
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-500'}`} 
              />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 ${theme === 'dark' ? 'bg-dark-800 border-dark-600 text-white' : 'bg-white border-light-300 text-dark-900'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
              />
            </div>
          </div>
        )}

        {/* Conteúdo baseado no step atual */}
        {currentStep === 'categorias' && (
          <div className="max-w-4xl mx-auto">
            <h2 className={`text-xl font-semibold mb-6 text-center ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              Selecione uma Categoria
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rootCategories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => handleSelectCategory(category)}
                  className={`p-6 ${theme === 'dark' ? 'bg-dark-800 hover:bg-dark-700 border-dark-600' : 'bg-white hover:bg-light-50 border-light-200'} border rounded-xl cursor-pointer transition-all group`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                        {category.name}
                      </h3>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                        {categories.filter(cat => cat.parentId === category.id).length} subcategorias
                      </p>
                    </div>
                    <ArrowRight size={24} className="text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'subcategorias' && (
          <div className="max-w-4xl mx-auto">
            <h2 className={`text-xl font-semibold mb-6 text-center ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              Selecione uma Subcategoria
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subcategories.map((subcategory) => (
                <div
                  key={subcategory.id}
                  onClick={() => handleSelectSubcategory(subcategory)}
                  className={`p-6 ${theme === 'dark' ? 'bg-dark-800 hover:bg-dark-700 border-dark-600' : 'bg-white hover:bg-light-50 border-light-200'} border rounded-xl cursor-pointer transition-all group`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                        {subcategory.name}
                      </h3>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                        {products.filter(p => p.categoryId === subcategory.id).length} produtos
                      </p>
                    </div>
                    <ArrowRight size={24} className="text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'produtos' && (
          <div className="max-w-4xl mx-auto">
            <h2 className={`text-xl font-semibold mb-6 text-center ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              Selecione um Produto
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className={`p-6 ${theme === 'dark' ? 'bg-dark-800 hover:bg-dark-700 border-dark-600' : 'bg-white hover:bg-light-50 border-light-200'} border rounded-xl cursor-pointer transition-all group`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                        {product.name}
                      </h3>
                      {product.code && (
                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                          Código: {product.code}
                        </p>
                      )}
                    </div>
                    <ArrowRight size={24} className="text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tela de Configuração - Exatamente como no Flutter */}
        {currentStep === 'configuracao' && selectedProduct && (
          <div className="max-w-2xl mx-auto space-y-5">
            {/* Título do produto - Como no Flutter */}
            <div className="space-y-1">
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                {selectedProduct.name}
              </h2>
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                Código: {selectedProduct.code}
              </p>
            </div>

            {/* Tipo de Conservação - Exatamente como no Flutter */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                Tipo de Conservação
              </h3>
              <div className="flex space-x-5">
                {(['ambiente', 'refrigerado', 'congelado'] as const).map((tipo) => {
                  const info = getConservacaoInfo(tipo)
                  const Icon = info.icon
                  const isSelected = conservacao === tipo
                  
                  return (
                    <button
                      key={tipo}
                      onClick={() => setConservacao(tipo)}
                      className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/20'
                          : theme === 'dark'
                          ? 'border-dark-600 bg-dark-700'
                          : 'border-light-300 bg-light-50'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <Icon 
                          size={24} 
                          className={isSelected ? 'text-primary' : theme === 'dark' ? 'text-dark-300' : 'text-dark-600'} 
                        />
                        <span className={`text-xs font-semibold ${
                          isSelected 
                            ? 'text-primary' 
                            : theme === 'dark' ? 'text-white' : 'text-dark-900'
                        }`}>
                          {info.label}
                        </span>
                        <span className={`text-xs ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                          {info.dias}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Peso/Quantidade e Quantidade de Etiquetas - Como no Flutter */}
            <div className="flex space-x-4">
              {/* Peso/Quantidade - 50% da tela */}
              <div className={`flex-1 p-3 ${theme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-light-50 border-light-300'} border rounded-xl`}>
                <h4 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                  Peso/Quantidade (Opcional)
                </h4>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    placeholder="Ex: 500"
                    className={`flex-1 px-4 py-3 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-dark-800 border-dark-600 text-white placeholder-dark-400'
                        : 'bg-white border-light-300 text-dark-900 placeholder-dark-500'
                    } focus:ring-2 focus:ring-primary focus:border-primary`}
                  />
                  <select
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    className={`px-4 py-3 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-dark-800 border-dark-600 text-white'
                        : 'bg-white border-light-300 text-dark-900'
                    } focus:ring-2 focus:ring-primary focus:border-primary`}
                  >
                    {unidades.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantidade de Etiquetas - 50% da tela */}
              <div className={`flex-1 p-3 ${theme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-light-50 border-light-300'} border rounded-xl`}>
                <h4 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                  Quantidade de Etiquetas
                </h4>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                    className={`w-10 h-10 rounded-lg ${theme === 'dark' ? 'bg-dark-600' : 'bg-light-200'} flex items-center justify-center transition-colors`}
                  >
                    <Minus size={16} className={theme === 'dark' ? 'text-white' : 'text-dark-900'} />
                  </button>
                  <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    {quantidade}
                  </span>
                  <button
                    onClick={() => setQuantidade(quantidade + 1)}
                    className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center transition-colors"
                  >
                    <Plus size={16} className="text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Botão Adicionar à Fila - Como no Flutter */}
            <div className={`fixed bottom-20 left-0 right-0 p-5 ${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-t`}>
              <button
                onClick={handleAdicionarAFila}
                disabled={!selectedProduct || !conservacao}
                className={`w-full py-4 rounded-xl font-medium transition-all ${
                  !selectedProduct || !conservacao
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                Adicionar à Fila de Impressão
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      <FooterNavigation />
    </div>
  )
}