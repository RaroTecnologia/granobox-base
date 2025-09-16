import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { MagnifyingGlass, Clock, Plus, Minus, House, Thermometer, Snowflake, ArrowLeft, ArrowRight, Printer, User, CaretDown } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import FooterNavigation from '@/components/FooterNavigation'
import { labelsService } from '@/services/labelsService'
import { useOperators, Operator } from '@/hooks/useOperators'

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
  const [dataManipulacao, setDataManipulacao] = useState(new Date().toISOString().split('T')[0])
  const [dataValidade, setDataValidade] = useState('')
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
  const [showOperatorModal, setShowOperatorModal] = useState(false)

  const unidades = ['KG', 'G', 'L', 'ML', 'UN']

  // Hooks para dados
  const clientId = user?.clientId || (user?.role === 'manager' ? '6621e831-5d1d-4801-8c33-b0f93446a3df' : undefined)
  const { categories, rootCategories, loading: categoriesLoading } = useCategories(clientId)
  const { products, loading: productsLoading } = useProducts(clientId)
  const { operators } = useOperators(clientId)

  // Debug dos produtos
  useEffect(() => {
    console.log('Produtos carregados:', products);
    console.log('ClientId:', clientId);
  }, [products, clientId]);

  // Carregar responsável salvo do localStorage
  useEffect(() => {
    const savedOperatorId = localStorage.getItem('selectedOperatorId');
    if (savedOperatorId && operators.length > 0) {
      const savedOperator = operators.find(op => op.id === savedOperatorId && op.isActive);
      if (savedOperator) {
        setSelectedOperator(savedOperator);
      }
    }
  }, [operators]);

  // Salvar responsável no localStorage quando selecionado
  useEffect(() => {
    if (selectedOperator) {
      localStorage.setItem('selectedOperatorId', selectedOperator.id);
    }
  }, [selectedOperator]);

  // Calcular subcategorias da categoria selecionada
  const subcategories = selectedCategory 
    ? categories.filter(cat => cat.parentId === selectedCategory.id)
    : []

  // Filtrar produtos da categoria/subcategoria selecionada
  const categoryProducts = selectedSubcategory 
    ? products.filter(product => 
        product.categoryId === selectedSubcategory.id && 
        (product.type === 'finished' || product.type === 'manipulated')
      ).filter(product => 
        searchTerm === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : selectedCategory && !categories.some(cat => cat.parentId === selectedCategory.id)
    ? products.filter(product => 
        product.categoryId === selectedCategory.id && 
        (product.type === 'finished' || product.type === 'manipulated')
      ).filter(product => 
        searchTerm === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : []

  // Calcular data de validade automaticamente baseada na data de manipulação
  useEffect(() => {
    if (conservacao && dataManipulacao) {
      const dataBase = new Date(dataManipulacao)
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
      
      const dataFutura = new Date(dataBase.getTime() + (diasValidade * 24 * 60 * 60 * 1000))
      setDataValidade(dataFutura.toISOString().split('T')[0])
    }
  }, [conservacao, dataManipulacao])

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
      // Para categorias sem subcategorias, ir direto para produtos
      setCurrentStep('produtos')
    }
  }

  const handleSelectSubcategory = (subcategory: any) => {
    setSelectedSubcategory(subcategory)
    setSelectedProduct(null)
    setCurrentStep('produtos')
  }

  const handleSelectProduct = (product: any) => {
    console.log('Produto selecionado:', product);
    console.log('ID do produto:', product?.id);
    setSelectedProduct(product)
    setCurrentStep('configuracao')
  }

  const handleAdicionarAFila = async () => {
    console.log('Validações:', {
      selectedProduct: !!selectedProduct,
      selectedProductId: selectedProduct?.id,
      conservacao: !!conservacao,
      selectedOperator: !!selectedOperator,
      userClientId: !!user?.clientId,
      dataValidade: !!dataValidade
    });

    if (!selectedProduct || !conservacao || !selectedOperator || !user?.clientId) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (!dataManipulacao) {
      toast.error('Selecione a data de manipulação')
      return
    }

    if (!dataValidade) {
      toast.error('Selecione o tipo de conservação para calcular a data de validade')
      return
    }

    if (!selectedProduct.id) {
      toast.error('Produto selecionado não possui ID válido')
      return
    }

    console.log('Dados da etiqueta:', {
      type: 'validity',
      conservationType: conservacao,
      quantity: quantidade,
      weight: peso || undefined,
      unit: unidade || undefined,
      productionDate: dataManipulacao,
      validityDate: dataValidade,
      clientId: user.clientId,
      productId: selectedProduct.id,
      notes: undefined,
      metadata: {
        conservacao,
        dataProducao: new Date().toLocaleDateString('pt-BR'),
      }
    });

    console.log('selectedProduct:', selectedProduct);
    console.log('user:', user);

    try {
      await labelsService.createLabel({
        type: 'validity',
        conservationType: conservacao,
        quantity: quantidade,
        weight: peso || undefined,
        unit: unidade || undefined,
        productionDate: dataManipulacao,
        validityDate: dataValidade,
        clientId: user.clientId,
        productId: selectedProduct.id,
        notes: undefined,
        metadata: {
          conservacao,
          dataProducao: new Date().toLocaleDateString('pt-BR'),
        }
      })

      toast.success('Produto adicionado à fila de impressão!')
      
      // Reset form (mantém responsável selecionado)
      setConservacao(null)
      setQuantidade(1)
      setPeso('')
      setUnidade('KG')
      setDataManipulacao(new Date().toISOString().split('T')[0])
      setDataValidade('')
      setSelectedProduct(null)
      setCurrentStep('produtos')
    } catch (error) {
      console.error('Erro ao adicionar etiqueta:', error);
      toast.error('Erro ao adicionar etiqueta à fila');
    }
  }

  const handleVerFila = () => {
    navigate('/etiquetas/validade/impressao')
  }

  const handleImprimirAgora = async () => {
    console.log('Validações:', {
      selectedProduct: !!selectedProduct,
      selectedProductId: selectedProduct?.id,
      conservacao: !!conservacao,
      selectedOperator: !!selectedOperator,
      userClientId: !!user?.clientId,
      dataValidade: !!dataValidade
    });

    if (!selectedProduct || !conservacao || !selectedOperator || !user?.clientId) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (!dataManipulacao) {
      toast.error('Selecione a data de manipulação')
      return
    }

    if (!dataValidade) {
      toast.error('Selecione o tipo de conservação para calcular a data de validade')
      return
    }

    if (!selectedProduct.id) {
      toast.error('Produto selecionado não possui ID válido')
      return
    }

    try {
      const label = await labelsService.createLabel({
        type: 'validity',
        conservationType: conservacao,
        quantity: quantidade,
        weight: peso || undefined,
        unit: unidade || undefined,
        productionDate: dataManipulacao,
        validityDate: dataValidade,
        clientId: user.clientId,
        productId: selectedProduct.id,
        notes: undefined,
        metadata: {
          conservacao,
          dataProducao: new Date(dataManipulacao).toLocaleDateString('pt-BR'),
        }
      })

      toast.success('Etiqueta criada! Redirecionando para impressão...')
      
      // Reset form (mantém responsável selecionado)
      setConservacao(null)
      setQuantidade(1)
      setPeso('')
      setUnidade('KG')
      setDataManipulacao(new Date().toISOString().split('T')[0])
      setDataValidade('')
      setSelectedProduct(null)
      setCurrentStep('produtos')

      // Redirecionar para impressão com a etiqueta específica
      navigate(`/etiquetas/validade/impressao?printNow=${label.id}`)
    } catch (error) {
      console.error('Erro ao criar etiqueta:', error);
      toast.error('Erro ao criar etiqueta para impressão');
    }
  }

  const renderBreadcrumb = () => {
    // Verificar se a categoria selecionada tem subcategorias
    const hasSubcategories = selectedCategory ? categories.some(cat => cat.parentId === selectedCategory.id) : false
    
    return (
      <div className="px-6 py-4">
        <div className="flex items-center space-x-2 text-sm">
          <button onClick={() => navigate('/etiquetas')} className="text-primary hover:underline">
            Etiquetas
          </button>
          <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>&gt;</span>
          <button onClick={() => navigate('/etiquetas/nova')} className="text-primary hover:underline">
            Nova Etiqueta
          </button>
          <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>&gt;</span>
          {currentStep === 'categorias' ? (
            <span className={theme === 'dark' ? 'text-white' : 'text-dark-900'}>Validade</span>
          ) : (
            <button onClick={() => setCurrentStep('categorias')} className="text-primary hover:underline">
              Validade
            </button>
          )}
          
          {/* Mostrar categoria sempre que selecionada */}
          {selectedCategory && (
            <>
              <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>&gt;</span>
              {(currentStep === 'subcategorias' || (currentStep === 'produtos' && !hasSubcategories)) ? (
                <span className={theme === 'dark' ? 'text-white' : 'text-dark-900'}>{selectedCategory.name}</span>
              ) : (
                <button onClick={() => setCurrentStep(hasSubcategories ? 'subcategorias' : 'produtos')} className="text-primary hover:underline">
                  {selectedCategory.name}
                </button>
              )}
            </>
          )}
          
          {/* Mostrar subcategoria apenas se existe */}
          {selectedSubcategory && currentStep !== 'subcategorias' && (
            <>
              <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>&gt;</span>
              {currentStep === 'produtos' ? (
                <span className={theme === 'dark' ? 'text-white' : 'text-dark-900'}>{selectedSubcategory.name}</span>
              ) : (
                <button onClick={() => setCurrentStep('produtos')} className="text-primary hover:underline">
                  {selectedSubcategory.name}
                </button>
              )}
            </>
          )}
          
          {/* Mostrar produto selecionado na configuração */}
          {selectedProduct && currentStep === 'configuracao' && (
            <>
              <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>&gt;</span>
              <span className={theme === 'dark' ? 'text-white' : 'text-dark-900'}>Configurar</span>
            </>
          )}
        </div>
      </div>
    )
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
      <div className="pt-20">
        {renderBreadcrumb()}
      </div>

      {/* Conteúdo Principal */}
      <main className="pt-4 px-6 py-4 pb-40">
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
          <div className="max-w-4xl mx-auto mt-8">
            <h2 className={`text-2xl font-semibold mb-10 text-center ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
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
          <div className="max-w-4xl mx-auto mt-8">
            <h2 className={`text-2xl font-semibold mb-10 text-center ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
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
          <div className="max-w-4xl mx-auto mt-8">
            <h2 className={`text-2xl font-semibold mb-10 text-center ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
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
          <div className="max-w-2xl mx-auto space-y-4 mb-8 mt-8">
            {/* Título do produto - Como no Flutter */}
            <div className="space-y-1">
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                {selectedProduct.name}
              </h2>
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                Código: {selectedProduct.code}
              </p>
            </div>

            {/* Responsável - Igual ao Flutter */}
            <div>
              <button
                onClick={() => setShowOperatorModal(true)}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedOperator
                    ? 'border-primary bg-primary/10'
                    : theme === 'dark'
                    ? 'border-dark-600 bg-dark-700'
                    : 'border-light-300 bg-light-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User 
                      size={20} 
                      className={selectedOperator ? 'text-primary' : theme === 'dark' ? 'text-dark-300' : 'text-dark-600'} 
                    />
                    <div className="text-left">
                      <div className={`font-semibold ${
                        selectedOperator 
                          ? 'text-primary' 
                          : theme === 'dark' ? 'text-primary' : 'text-primary'
                      }`}>
                        Responsável
                      </div>
                      <div className={`text-sm ${
                        selectedOperator 
                          ? theme === 'dark' ? 'text-white' : 'text-dark-900'
                          : theme === 'dark' ? 'text-dark-400' : 'text-dark-600'
                      }`}>
                        {selectedOperator ? selectedOperator.name : 'Selecione o responsável'}
                      </div>
                    </div>
                  </div>
                  <CaretDown 
                    size={16} 
                    className={selectedOperator ? 'text-primary' : theme === 'dark' ? 'text-dark-300' : 'text-dark-600'} 
                  />
                </div>
              </button>
            </div>

            {/* Data de Manipulação */}
            <div className={`p-3 ${theme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-light-50 border-light-300'} border rounded-xl`}>
              <h4 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                Data de Manipulação *
              </h4>
              <input
                type="date"
                value={dataManipulacao}
                onChange={(e) => setDataManipulacao(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-dark-800 border-dark-600 text-white'
                    : 'bg-white border-light-300 text-dark-900'
                } focus:ring-2 focus:ring-primary focus:border-primary`}
              />
            </div>

            {/* Data de Validade */}
            <div className={`p-3 ${theme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-light-50 border-light-300'} border rounded-xl`}>
              <h4 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                Data de Validade *
              </h4>
              <div className={`w-full px-4 py-3 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-dark-600 border-dark-500 text-dark-300'
                  : 'bg-gray-100 border-gray-300 text-gray-600'
              } cursor-not-allowed`}>
                {dataValidade ? new Date(dataValidade).toLocaleDateString('pt-BR') : 'Selecione o tipo de conservação'}
              </div>
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

            {/* Botões de Ação - Como no Flutter */}
            <div className={`fixed bottom-16 left-0 right-0 p-4 ${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-t shadow-lg`}>
              <div className="flex space-x-3">
                <button
                  onClick={handleAdicionarAFila}
                  disabled={!selectedProduct || !conservacao || !selectedOperator || !dataManipulacao || !dataValidade || !selectedProduct?.id}
                  className={`flex-1 py-4 rounded-xl font-medium transition-all border-2 flex items-center justify-center space-x-2 ${
                    !selectedProduct || !conservacao || !selectedOperator || !dataManipulacao || !dataValidade || !selectedProduct?.id
                      ? 'border-gray-300 text-gray-500 cursor-not-allowed'
                      : 'border-primary text-primary hover:bg-primary hover:text-white'
                  }`}
                >
                  <Plus size={20} />
                  <span>Adicionar à Fila</span>
                </button>
                <button
                  onClick={handleImprimirAgora}
                  disabled={!selectedProduct || !conservacao || !selectedOperator || !dataManipulacao || !dataValidade || !selectedProduct?.id}
                  className={`flex-1 py-4 rounded-xl font-medium transition-all flex items-center justify-center space-x-2 ${
                    !selectedProduct || !conservacao || !selectedOperator || !dataManipulacao || !dataValidade || !selectedProduct?.id
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  <Printer size={20} />
                  <span>Imprimir Agora</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Seleção de Responsável */}
      {showOperatorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Selecionar Responsável
              </h2>
              <button
                onClick={() => setShowOperatorModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-dark-700 text-dark-300' 
                    : 'hover:bg-light-100 text-dark-600'
                }`}
              >
                ×
              </button>
            </div>

            {operators.filter(op => op.isActive).length === 0 ? (
              <div className="text-center py-8">
                <User size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-dark-400' : 'text-light-400'}`} />
                <p className={`${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'} mb-4`}>
                  Nenhum operador cadastrado
                </p>
                <button
                  onClick={() => {
                    setShowOperatorModal(false)
                    navigate('/cadastro/operadores')
                  }}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Cadastrar Operadores
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {operators.filter(op => op.isActive).map((operator) => (
                  <button
                    key={operator.id}
                    onClick={() => {
                      setSelectedOperator(operator);
                      setShowOperatorModal(false);
                      toast.success(`Responsável selecionado: ${operator.name}`);
                    }}
                    className={`w-full p-4 rounded-xl border transition-colors text-left ${
                      selectedOperator?.id === operator.id
                        ? 'border-primary bg-primary/10'
                        : theme === 'dark'
                        ? 'border-dark-600 hover:border-dark-500'
                        : 'border-light-300 hover:border-light-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedOperator?.id === operator.id ? 'bg-primary text-white' : 'bg-green-100'
                        }`}>
                          <User size={20} className={selectedOperator?.id === operator.id ? 'text-white' : 'text-green-600'} />
                        </div>
                        <div>
                          <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                            {operator.name}
                          </h3>
                          {operator.department && (
                            <p className={`text-sm ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                              {operator.department}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {selectedOperator?.id === operator.id && (
                        <div className="text-primary">✓</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <FooterNavigation />
    </div>
  )
}