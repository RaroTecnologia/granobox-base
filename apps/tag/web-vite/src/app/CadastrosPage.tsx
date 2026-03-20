import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { labelsService } from '@/services/labelsService'
import { SectionLoading, PageLoading } from '@/components/LoadingSpinner'
import { ConfirmationModal } from '@/components/ConfirmationModal'
import { toast } from 'react-hot-toast'
import {
  Package,
  Warning,
  Plus,
  MagnifyingGlass,
  Eye,
  PencilSimple,
  Trash,
  CaretRight,
  CaretDown,
  TrayArrowDown,
  Spinner,
  MapPin,
  UploadSimple
} from '@phosphor-icons/react'
import FooterNavigation from '@/components/FooterNavigation'
import type { Category } from '@/services/categoriesService'
import type { Product, ProductType } from '@/services/productsService'
import { productsService } from '@/services/productsService'

export default function CadastrosPage() {
  const { theme } = useTheme()
  const { user, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'categorias' | 'produtos'>('categorias')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null)
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null)

  // Para usuários manager, usar o primeiro cliente disponível
  const clientId = user?.clientId || (user?.role === 'manager' ? '6621e831-5d1d-4801-8c33-b0f93446a3df' : undefined)

  // Hooks da API
  const { 
    categories, 
    rootCategories, 
    loading: categoriesLoading, 
    error: categoriesError,
    getCategoriesByParent,
    getCategoryById,
    deleteCategory 
  } = useCategories()

  const { 
    products, 
    loading: productsLoading, 
    error: productsError,
    applyFilters,
    getProductsByCategory,
    deleteProduct 
  } = useProducts()

  // Estados de loading e erro
  const isLoading = authLoading || categoriesLoading || productsLoading
  const error = categoriesError || productsError

  // Filtrar produtos por categoria selecionada
  const filteredProducts = selectedCategory 
    ? getProductsByCategory(selectedCategory)
    : products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code?.toLowerCase().includes(searchTerm.toLowerCase())
      )


  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId)
    if (categoryId) {
      applyFilters({ categoryId })
    } else {
      applyFilters({})
    }
  }

  const getProductTypeLabel = (type: ProductType): string => {
    return productsService.getProductTypeLabel(type)
  }

  const getProductTypeColor = (type: ProductType): string => {
    return productsService.getProductTypeColor(type)
  }

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    const categoryProducts = getProductsByCategory(categoryId)
    
    // Verificar se a categoria tem produtos
    if (categoryProducts.length > 0) {
      toast.error(`Não é possível excluir a categoria "${categoryName}" pois ela contém ${categoryProducts.length} produto(s). Remova os produtos primeiro.`)
      return
    }

    // Verificar se a categoria tem subcategorias
    const subcategories = getCategoriesByParent(categoryId)
    if (subcategories.length > 0) {
      toast.error(`Não é possível excluir a categoria "${categoryName}" pois ela contém ${subcategories.length} subcategoria(s). Remova as subcategorias primeiro.`)
      return
    }

    // Mostrar modal de confirmação
    setCategoryToDelete({ id: categoryId, name: categoryName })
    setShowDeleteModal(true)
  }

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return

    try {
      await deleteCategory(categoryToDelete.id)
      
      // Se a categoria excluída estava selecionada, limpar seleção
      if (selectedCategory === categoryToDelete.id) {
        setSelectedCategory(null)
      }
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
    }
  }

  const handleDeleteProduct = async (productId: string, productName: string) => {
    try {
      // Verificar se o produto tem etiquetas ativas
      if (clientId) {
        const allLabels = await labelsService.getAllLabels(clientId)
        const productLabels = allLabels.filter(label => 
          label.productId === productId && 
          label.status !== 'failed' && 
          !label.metadata?.isUsed
        )
        
        if (productLabels.length > 0) {
          toast.error(`Não é possível excluir o produto "${productName}" pois ele possui ${productLabels.length} etiqueta(s) ativa(s). Dê baixa nas etiquetas primeiro.`)
          return
        }
      }

      // Mostrar modal de confirmação
      setProductToDelete({ id: productId, name: productName })
      setShowDeleteProductModal(true)
    } catch (error) {
      console.error('Erro ao verificar etiquetas do produto:', error)
      toast.error('Erro ao verificar etiquetas do produto. Tente novamente.')
    }
  }

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return

    try {
      await deleteProduct(productToDelete.id)
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
    }
  }

  const renderCategoryTree = (parentCategories: Category[], level: number = 0) => {
    return parentCategories.map((category) => {
      const subcategories = getCategoriesByParent(category.id)
      const hasSubcategories = subcategories.length > 0
      const isExpanded = expandedCategories.has(category.id)
      const isSelected = selectedCategory === category.id
      const categoryProducts = getProductsByCategory(category.id)

      return (
        <div key={category.id} className="mb-2">
          <div 
            className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
              isSelected
                ? theme === 'dark' 
                  ? 'bg-primary/20 border-primary text-primary' 
                  : 'bg-primary/10 border-primary text-primary'
                : theme === 'dark'
                ? 'bg-dark-700 border-dark-600 hover:bg-dark-600'
                : 'bg-white border-light-200 hover:bg-light-50'
            }`}
            style={{ marginLeft: `${level * 20}px` }}
            onClick={() => handleCategorySelect(category.id)}
          >
             <div className="flex items-center space-x-3">
               {hasSubcategories && (
                 <button
                   onClick={(e) => {
                     e.stopPropagation()
                     toggleCategoryExpansion(category.id)
                   }}
                   className="p-1 rounded hover:bg-black/10"
                 >
                   {isExpanded ? (
                     <CaretDown size={16} weight="bold" />
                   ) : (
                     <CaretRight size={16} weight="bold" />
                   )}
                 </button>
               )}
               
               <div>
                 <h3 className="font-medium">{category.name}</h3>
               </div>
             </div>

            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-100 text-dark-600'
              }`}>
                {categoryProducts.length} {categoryProducts.length === 1 ? 'produto' : 'produtos'}
              </span>
              
              <div className="flex space-x-1">
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCategorySelect(category.id)
                    setActiveTab('produtos')
                  }}
                  className={`p-1 rounded hover:bg-blue-100 text-blue-600 hover:text-blue-700 ${
                    theme === 'dark' ? 'hover:bg-blue-900/20' : ''
                  }`}
                  title="Ver produtos desta categoria"
                >
                  <Eye size={16} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/cadastro/item?categoryId=${category.id}`)
                  }}
                  className={`p-1 rounded hover:bg-green-100 text-green-600 hover:text-green-700 ${
                    theme === 'dark' ? 'hover:bg-green-900/20' : ''
                  }`}
                  title="Adicionar produto nesta categoria"
                >
                  <Plus size={16} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/cadastro/categoria/${category.id}`)
                  }}
                  className={`p-1 rounded hover:bg-black/10 ${
                    theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'
                  }`}
                  title="Editar categoria"
                >
                  <PencilSimple size={16} />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteCategory(category.id, category.name)
                  }}
                  className="p-1 rounded hover:bg-red-100 text-red-600 hover:text-red-700"
                  title="Excluir categoria"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
          </div>

          {isExpanded && hasSubcategories && (
            <div className="mt-2">
              {renderCategoryTree(subcategories, level + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  const renderProductCard = (product: Product) => (
    <div 
      key={product.id}
      className={`p-4 rounded-lg border transition-all ${
        theme === 'dark' 
          ? 'bg-dark-700 border-dark-600 hover:bg-dark-600' 
          : 'bg-white border-light-200 hover:bg-light-50'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              {product.name}
            </h3>
            <span 
              className="text-xs px-2 py-1 rounded-full text-white font-medium"
              style={{ backgroundColor: getProductTypeColor(product.type) }}
            >
              {getProductTypeLabel(product.type)}
            </span>
          </div>
          
          <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} mb-2`}>
            Código: {product.code}
          </p>
          
          {product.description && (
            <p className={`text-sm ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'} mb-2`}>
              {product.description}
            </p>
          )}

          <div className="flex items-center space-x-4 text-sm">
            {product.salePrice && (
              <span className={`${theme === 'dark' ? 'text-green-400' : 'text-green-600'} font-medium`}>
                {productsService.formatPrice(product.salePrice, product.currency)}
              </span>
            )}
            
            {product.weight && product.weightUnit && (
              <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                {productsService.formatWeight(product.weight, product.weightUnit)}
              </span>
            )}
            
            {product.brand && (
              <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                {product.brand}
              </span>
            )}
          </div>
        </div>

        <div className="flex space-x-1 ml-4">
          <button 
            onClick={() => navigate(`/etiqueta/${product.id}`)}
            className={`p-2 rounded hover:bg-black/10 ${
              theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'
            }`}
            title="Ver detalhes"
          >
            <Eye size={16} />
          </button>
          <button 
            onClick={() => navigate(`/cadastro/item/${product.id}`)}
            className={`p-2 rounded hover:bg-black/10 ${
              theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'
            }`}
            title="Editar"
          >
            <PencilSimple size={16} />
          </button>
          <button 
            onClick={() => {
              handleDeleteProduct(product.id, product.name)
            }}
            className="p-2 rounded hover:bg-red-100 text-red-600 hover:text-red-700"
            title="Excluir"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>

      {/* Informações de validade */}
      {(product.shelfLifeAmbient || product.shelfLifeRefrigerated || product.shelfLifeFrozen) && (
        <div className="border-t pt-3 mt-3">
          <div className="grid grid-cols-3 gap-2 text-xs">
            {product.shelfLifeAmbient && (
              <div className={`text-center p-2 rounded ${
                theme === 'dark' ? 'bg-dark-600' : 'bg-light-100'
              }`}>
                <div className={`${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                  Ambiente
                </div>
                <div className="font-medium">
                  {productsService.getShelfLifeText(product.shelfLifeAmbient)}
                </div>
              </div>
            )}
            
            {product.shelfLifeRefrigerated && (
              <div className={`text-center p-2 rounded ${
                theme === 'dark' ? 'bg-dark-600' : 'bg-light-100'
              }`}>
                <div className={`${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                  Refrigerado
                </div>
                <div className="font-medium">
                  {productsService.getShelfLifeText(product.shelfLifeRefrigerated)}
                </div>
              </div>
            )}
            
            {product.shelfLifeFrozen && (
              <div className={`text-center p-2 rounded ${
                theme === 'dark' ? 'bg-dark-600' : 'bg-light-100'
              }`}>
                <div className={`${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                  Congelado
                </div>
                <div className="font-medium">
                  {productsService.getShelfLifeText(product.shelfLifeFrozen)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  // Mostrar loading enquanto carrega autenticação
  if (authLoading) {
    return <PageLoading text="Carregando..." />
  }

  // Verificar se usuário está logado
  if (!clientId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Warning size={48} className="mx-auto text-yellow-500 mb-4" />
          <p className="text-lg">Acesso negado</p>
          <p className="text-sm text-gray-600">Você precisa estar logado para acessar esta página.</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Fazer Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'}`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-b px-4 py-4 sticky top-0 z-10`}>
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <Package size={24} weight="duotone" className="text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Cadastros</h1>
                <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  Gerencie categorias e produtos
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/cadastros/importacao')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors border ${
                  theme === 'dark'
                    ? 'border-primary text-primary hover:bg-primary/10'
                    : 'border-primary text-primary hover:bg-primary/10'
                }`}
              >
                <UploadSimple size={20} />
                <span>Importar</span>
              </button>

              <button
                onClick={() => navigate('/cadastro/categoria')}
                className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus size={20} />
                <span>Categoria</span>
              </button>

              <button
                onClick={() => navigate('/cadastro/item')}
                className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus size={20} />
                <span>Produto</span>
              </button>

              <button
                onClick={() => navigate('/cadastro/locais')}
                className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus size={20} />
                <span>Armazenamento</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Tabs de Navegação */}
      <div className="px-4 py-4">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('categorias')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'categorias'
                ? 'bg-primary text-white shadow-lg'
                : theme === 'dark' 
                  ? 'bg-dark-700 text-dark-300 hover:bg-dark-600' 
                  : 'bg-light-100 text-dark-600 hover:bg-light-200'
            }`}
          >
            <TrayArrowDown size={18} />
            <span>Categorias</span>
          </button>
          <button
            onClick={() => setActiveTab('produtos')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'produtos'
                ? 'bg-primary text-white shadow-lg'
                : theme === 'dark' 
                  ? 'bg-dark-700 text-dark-300 hover:bg-dark-600' 
                  : 'bg-light-100 text-dark-600 hover:bg-light-200'
            }`}
          >
            <Package size={18} />
            <span>Produtos</span>
          </button>
        </div>
        
        {/* Search */}
        <div className="relative mt-4">
          <MagnifyingGlass size={20} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
            theme === 'dark' ? 'text-dark-400' : 'text-dark-500'
          }`} />
          <input
            type="text"
            placeholder={`Buscar ${activeTab === 'categorias' ? 'categorias' : 'produtos'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
              theme === 'dark'
                ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400 focus:border-primary'
                : 'bg-white border-light-300 text-dark-900 placeholder-dark-500 focus:border-primary'
            } focus:outline-none focus:ring-2 focus:ring-primary/20`}
          />
        </div>
      </div>

      {/* Content */}
      <main className="px-4 py-6 pb-24">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-700">
              <Warning size={20} className="mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <SectionLoading text="Carregando dados..." size="lg" />
        ) : (
          <>
            {activeTab === 'categorias' && (
              <div className="space-y-4">
                {/* Filtro "Todas as categorias" */}
                <div 
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedCategory === null
                      ? theme === 'dark' 
                        ? 'bg-primary/20 border-primary text-primary' 
                        : 'bg-primary/10 border-primary text-primary'
                      : theme === 'dark'
                      ? 'bg-dark-700 border-dark-600 hover:bg-dark-600'
                      : 'bg-white border-light-200 hover:bg-light-50'
                  }`}
                  onClick={() => handleCategorySelect(null)}
                >
                  <div className="flex items-center space-x-3">
                    <Package size={20} weight="duotone" />
                    <span className="font-medium">Todas as categorias</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-100 text-dark-600'
                  }`}>
                    {products.length} {products.length === 1 ? 'produto' : 'produtos'}
                  </span>
                </div>

                 {categoriesLoading ? (
                   <SectionLoading text="Carregando categorias..." size="lg" />
                 ) : rootCategories.filter(cat => 
                   cat.name.toLowerCase().includes(searchTerm.toLowerCase())
                 ).length === 0 ? (
                   <div className="text-center py-12">
                     <Package size={48} className={`mx-auto mb-4 ${
                       theme === 'dark' ? 'text-dark-600' : 'text-dark-400'
                     }`} />
                     <p className={`text-lg mb-2 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                       Nenhuma categoria encontrada
                     </p>
                     <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                       {searchTerm ? 'Tente ajustar sua busca' : 'Comece criando sua primeira categoria'}
                     </p>
                   </div>
                 ) : (
                   renderCategoryTree(rootCategories.filter(cat => 
                     cat.name.toLowerCase().includes(searchTerm.toLowerCase())
                   ))
                 )}
              </div>
            )}

            {activeTab === 'produtos' && (
              <div className="space-y-4">
                {productsLoading ? (
                  <SectionLoading text="Carregando produtos..." size="lg" />
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package size={48} className={`mx-auto mb-4 ${
                      theme === 'dark' ? 'text-dark-600' : 'text-dark-400'
                    }`} />
                    <p className={`text-lg mb-2 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                      Nenhum produto encontrado
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                      {searchTerm || selectedCategory ? 'Tente ajustar seus filtros' : 'Comece criando seu primeiro produto'}
                    </p>
                    <button
                      onClick={() => navigate('/cadastro/item')}
                      className="mt-4 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
                    >
                      <Plus size={20} />
                      <span>Criar Primeiro Produto</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredProducts.map(renderProductCard)}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal de Confirmação de Exclusão - Categoria */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setCategoryToDelete(null)
        }}
        onConfirm={confirmDeleteCategory}
        title="Excluir Categoria"
        message="Esta ação não pode ser desfeita. Todos os dados relacionados a esta categoria serão perdidos permanentemente."
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        type="danger"
        itemName={categoryToDelete?.name}
      />

      {/* Modal de Confirmação de Exclusão - Produto */}
      <ConfirmationModal
        isOpen={showDeleteProductModal}
        onClose={() => {
          setShowDeleteProductModal(false)
          setProductToDelete(null)
        }}
        onConfirm={confirmDeleteProduct}
        title="Excluir Produto"
        message="Esta ação não pode ser desfeita. O produto será removido permanentemente do sistema. Etiquetas já impressas não serão afetadas."
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        type="danger"
        itemName={productToDelete?.name}
      />

      <FooterNavigation />
    </div>
  )
}
