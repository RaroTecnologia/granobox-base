import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { 
  Package, 
  Plus,
  XCircle,
  ArrowLeft,
  Check,
  Warning,
  Spinner
} from '@phosphor-icons/react'
import { toast } from 'react-hot-toast'
import type { CreateProductRequest, UpdateProductRequest, ProductType } from '@/services/productsService'

export default function CadastroItemPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { theme } = useTheme()
  const { user } = useAuth()
  const isEditing = !!id
  
  // Hooks da API
  const { categories, isLoading: categoriesLoading } = useCategories(user?.clientId)
  const { getProductById, createProduct, updateProduct, isLoading: productsLoading } = useProducts(user?.clientId)

  // Estados do formulário
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    description: '',
    code: '',
    type: 'finished' as ProductType,
    brand: '',
    weight: undefined,
    weightUnit: 'g',
    salePrice: undefined,
    costPrice: undefined,
    currency: 'BRL',
    shelfLifeAmbient: undefined,
    shelfLifeRefrigerated: undefined,
    shelfLifeFrozen: undefined,
    ingredients: '',
    allergens: '',
    nutritionalInfo: '',
    notes: '',
    clientId: user?.clientId || '',
    categoryId: '',
    isActive: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Carregar produto para edição
  useEffect(() => {
    if (isEditing && id) {
      const product = getProductById(id)
      if (product) {
        setFormData({
          name: product.name,
          description: product.description || '',
          code: product.code,
          type: product.type,
          brand: product.brand || '',
          weight: product.weight,
          weightUnit: product.weightUnit || 'g',
          salePrice: product.salePrice,
          costPrice: product.costPrice,
          currency: product.currency,
          shelfLifeAmbient: product.shelfLifeAmbient,
          shelfLifeRefrigerated: product.shelfLifeRefrigerated,
          shelfLifeFrozen: product.shelfLifeFrozen,
          ingredients: product.ingredients || '',
          allergens: product.allergens || '',
          nutritionalInfo: product.nutritionalInfo || '',
          notes: product.notes || '',
          clientId: product.clientId,
          categoryId: product.categoryId,
          isActive: product.isActive,
        })
      }
    }
  }, [id, isEditing, getProductById])

  // Definir categoria padrão se vier da URL
  useEffect(() => {
    const categoryFromUrl = searchParams.get('categoryId')
    if (categoryFromUrl && !isEditing) {
      setFormData(prev => ({ ...prev, categoryId: categoryFromUrl }))
    }
  }, [searchParams, isEditing])

  const handleInputChange = (field: keyof CreateProductRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Código é obrigatório'
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Categoria é obrigatória'
    }

    if (formData.salePrice && formData.salePrice < 0) {
      newErrors.salePrice = 'Preço de venda deve ser positivo'
    }

    if (formData.costPrice && formData.costPrice < 0) {
      newErrors.costPrice = 'Preço de custo deve ser positivo'
    }

    if (formData.weight && formData.weight < 0) {
      newErrors.weight = 'Peso deve ser positivo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditing && id) {
        await updateProduct(id, formData as UpdateProductRequest)
        toast.success('Produto atualizado com sucesso!')
      } else {
        await createProduct(formData)
        toast.success('Produto criado com sucesso!')
      }
      
      navigate('/cadastros')
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error)
      toast.error(error.message || 'Erro ao salvar produto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = categoriesLoading || productsLoading

  if (!user?.clientId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Warning size={48} className="mx-auto text-yellow-500 mb-4" />
          <p className="text-lg">Acesso negado</p>
          <p className="text-sm text-gray-600">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-sm border-b ${
        theme === 'dark' 
          ? 'bg-dark-950/95 border-dark-800' 
          : 'bg-white/95 border-light-200'
      }`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/cadastros')}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-dark-700 text-dark-400 hover:text-white' 
                    : 'hover:bg-light-100 text-dark-600 hover:text-dark-900'
                }`}
              >
                <ArrowLeft size={20} />
              </button>
              
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Package size={24} weight="duotone" className="text-white" />
              </div>
              
              <div>
                <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  {isEditing ? 'Editar Produto' : 'Novo Produto'}
                </h1>
                <p className="text-primary text-sm">
                  {isEditing ? 'Atualize as informações do produto' : 'Cadastre um novo produto'}
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => navigate('/cadastros')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-dark-700 text-white hover:bg-dark-600'
                    : 'bg-light-200 text-dark-900 hover:bg-light-300'
                }`}
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                form="product-form"
                disabled={isSubmitting || isLoading}
                className="bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                {isSubmitting ? (
                  <Spinner size={20} className="animate-spin" />
                ) : (
                  <Check size={20} />
                )}
                <span>{isSubmitting ? 'Salvando...' : 'Salvar'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size={32} className="animate-spin text-primary" />
            <span className="ml-3 text-lg">Carregando...</span>
          </div>
        ) : (
          <form id="product-form" onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="grid gap-6">
              {/* Informações Básicas */}
              <div className={`p-6 rounded-lg border ${
                theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
              }`}>
                <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Informações Básicas
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Nome do Produto *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        errors.name
                          ? 'border-red-500 focus:border-red-500'
                          : theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="Ex: Pão Francês"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Código *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        errors.code
                          ? 'border-red-500 focus:border-red-500'
                          : theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="Ex: PF001"
                    />
                    {errors.code && (
                      <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Categoria *
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => handleInputChange('categoryId', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        errors.categoryId
                          ? 'border-red-500 focus:border-red-500'
                          : theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Tipo
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value as ProductType)}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                    >
                      <option value="raw_material">Matéria Prima</option>
                      <option value="semi_finished">Semi Acabado</option>
                      <option value="finished">Produto Final</option>
                      <option value="manipulated">Manipulado</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="Descrição detalhada do produto..."
                    />
                  </div>
                </div>
              </div>

              {/* Informações Comerciais */}
              <div className={`p-6 rounded-lg border ${
                theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
              }`}>
                <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Informações Comerciais
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Marca
                    </label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="Ex: Padaria do João"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Peso/Volume
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={formData.weight || ''}
                        onChange={(e) => handleInputChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                          errors.weight
                            ? 'border-red-500 focus:border-red-500'
                            : theme === 'dark'
                            ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                            : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                        } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                        placeholder="50"
                      />
                      <select
                        value={formData.weightUnit}
                        onChange={(e) => handleInputChange('weightUnit', e.target.value)}
                        className={`px-3 py-2 rounded-lg border transition-colors ${
                          theme === 'dark'
                            ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                            : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                        } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      >
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="ml">ml</option>
                        <option value="l">l</option>
                        <option value="un">un</option>
                      </select>
                    </div>
                    {errors.weight && (
                      <p className="text-red-500 text-sm mt-1">{errors.weight}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Preço de Venda (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.salePrice || ''}
                      onChange={(e) => handleInputChange('salePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        errors.salePrice
                          ? 'border-red-500 focus:border-red-500'
                          : theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="0,50"
                    />
                    {errors.salePrice && (
                      <p className="text-red-500 text-sm mt-1">{errors.salePrice}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Preço de Custo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costPrice || ''}
                      onChange={(e) => handleInputChange('costPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        errors.costPrice
                          ? 'border-red-500 focus:border-red-500'
                          : theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="0,30"
                    />
                    {errors.costPrice && (
                      <p className="text-red-500 text-sm mt-1">{errors.costPrice}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Validades */}
              <div className={`p-6 rounded-lg border ${
                theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
              }`}>
                <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Validades (em dias)
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Ambiente
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="9999"
                      value={formData.shelfLifeAmbient || ''}
                      onChange={(e) => handleInputChange('shelfLifeAmbient', e.target.value ? parseInt(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Refrigerado
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="9999"
                      value={formData.shelfLifeRefrigerated || ''}
                      onChange={(e) => handleInputChange('shelfLifeRefrigerated', e.target.value ? parseInt(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="3"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Congelado
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="9999"
                      value={formData.shelfLifeFrozen || ''}
                      onChange={(e) => handleInputChange('shelfLifeFrozen', e.target.value ? parseInt(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="30"
                    />
                  </div>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className={`p-6 rounded-lg border ${
                theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
              }`}>
                <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Informações Adicionais
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Ingredientes
                    </label>
                    <textarea
                      value={formData.ingredients}
                      onChange={(e) => handleInputChange('ingredients', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="Farinha de trigo, água, fermento, sal..."
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Alérgenos
                    </label>
                    <textarea
                      value={formData.allergens}
                      onChange={(e) => handleInputChange('allergens', e.target.value)}
                      rows={2}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="Contém glúten. Pode conter traços de..."
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Informações Nutricionais
                    </label>
                    <textarea
                      value={formData.nutritionalInfo}
                      onChange={(e) => handleInputChange('nutritionalInfo', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="Valor energético: 250 kcal por 100g..."
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Observações
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="Produto artesanal, produzido diariamente..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { 
  Package, 
  Plus,
  XCircle,
  ArrowLeft,
  Check,
  Warning,
  Spinner
} from '@phosphor-icons/react'
import { toast } from 'react-hot-toast'
import type { CreateProductRequest, UpdateProductRequest, ProductType } from '@/services/productsService'

export default function CadastroItemPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { theme } = useTheme()
  const { user } = useAuth()
  const isEditing = !!id
  
  // Hooks da API
  const { categories, isLoading: categoriesLoading } = useCategories(user?.clientId)
  const { getProductById, createProduct, updateProduct, isLoading: productsLoading } = useProducts(user?.clientId)

  // Estados do formulário
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    description: '',
    code: '',
    type: 'finished' as ProductType,
    brand: '',
    weight: undefined,
    weightUnit: 'g',
    salePrice: undefined,
    costPrice: undefined,
    currency: 'BRL',
    shelfLifeAmbient: undefined,
    shelfLifeRefrigerated: undefined,
    shelfLifeFrozen: undefined,
    ingredients: '',
    allergens: '',
    nutritionalInfo: '',
    notes: '',
    clientId: user?.clientId || '',
    categoryId: '',
    isActive: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Carregar produto para edição
  useEffect(() => {
    if (isEditing && id) {
      const product = getProductById(id)
      if (product) {
        setFormData({
          name: product.name,
          description: product.description || '',
          code: product.code,
          type: product.type,
          brand: product.brand || '',
          weight: product.weight,
          weightUnit: product.weightUnit || 'g',
          salePrice: product.salePrice,
          costPrice: product.costPrice,
          currency: product.currency,
          shelfLifeAmbient: product.shelfLifeAmbient,
          shelfLifeRefrigerated: product.shelfLifeRefrigerated,
          shelfLifeFrozen: product.shelfLifeFrozen,
          ingredients: product.ingredients || '',
          allergens: product.allergens || '',
          nutritionalInfo: product.nutritionalInfo || '',
          notes: product.notes || '',
          clientId: product.clientId,
          categoryId: product.categoryId,
          isActive: product.isActive,
        })
      }
    }
  }, [id, isEditing, getProductById])

  // Definir categoria padrão se vier da URL
  useEffect(() => {
    const categoryFromUrl = searchParams.get('categoryId')
    if (categoryFromUrl && !isEditing) {
      setFormData(prev => ({ ...prev, categoryId: categoryFromUrl }))
    }
  }, [searchParams, isEditing])

  const handleInputChange = (field: keyof CreateProductRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Código é obrigatório'
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Categoria é obrigatória'
    }

    if (formData.salePrice && formData.salePrice < 0) {
      newErrors.salePrice = 'Preço de venda deve ser positivo'
    }

    if (formData.costPrice && formData.costPrice < 0) {
      newErrors.costPrice = 'Preço de custo deve ser positivo'
    }

    if (formData.weight && formData.weight < 0) {
      newErrors.weight = 'Peso deve ser positivo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário')
      return
    }

    setIsSubmitting(true)

    try {
      if (isEditing && id) {
        await updateProduct(id, formData as UpdateProductRequest)
        toast.success('Produto atualizado com sucesso!')
      } else {
        await createProduct(formData)
        toast.success('Produto criado com sucesso!')
      }
      
      navigate('/cadastros')
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error)
      toast.error(error.message || 'Erro ao salvar produto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = categoriesLoading || productsLoading

  if (!user?.clientId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Warning size={48} className="mx-auto text-yellow-500 mb-4" />
          <p className="text-lg">Acesso negado</p>
          <p className="text-sm text-gray-600">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-sm border-b ${
        theme === 'dark' 
          ? 'bg-dark-950/95 border-dark-800' 
          : 'bg-white/95 border-light-200'
      }`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/cadastros')}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-dark-700 text-dark-400 hover:text-white' 
                    : 'hover:bg-light-100 text-dark-600 hover:text-dark-900'
                }`}
              >
                <ArrowLeft size={20} />
              </button>
              
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Package size={24} weight="duotone" className="text-white" />
              </div>
              
              <div>
                <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  {isEditing ? 'Editar Produto' : 'Novo Produto'}
                </h1>
                <p className="text-primary text-sm">
                  {isEditing ? 'Atualize as informações do produto' : 'Cadastre um novo produto'}
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => navigate('/cadastros')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-dark-700 text-white hover:bg-dark-600'
                    : 'bg-light-200 text-dark-900 hover:bg-light-300'
                }`}
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                form="product-form"
                disabled={isSubmitting || isLoading}
                className="bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                {isSubmitting ? (
                  <Spinner size={20} className="animate-spin" />
                ) : (
                  <Check size={20} />
                )}
                <span>{isSubmitting ? 'Salvando...' : 'Salvar'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size={32} className="animate-spin text-primary" />
            <span className="ml-3 text-lg">Carregando...</span>
          </div>
        ) : (
          <form id="product-form" onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="grid gap-6">
              {/* Informações Básicas */}
              <div className={`p-6 rounded-lg border ${
                theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
              }`}>
                <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Informações Básicas
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Nome do Produto *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        errors.name
                          ? 'border-red-500 focus:border-red-500'
                          : theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="Ex: Pão Francês"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Código *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        errors.code
                          ? 'border-red-500 focus:border-red-500'
                          : theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="Ex: PF001"
                    />
                    {errors.code && (
                      <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Categoria *
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => handleInputChange('categoryId', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        errors.categoryId
                          ? 'border-red-500 focus:border-red-500'
                          : theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Tipo
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value as ProductType)}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                    >
                      <option value="raw_material">Matéria Prima</option>
                      <option value="semi_finished">Semi Acabado</option>
                      <option value="finished">Produto Final</option>
                      <option value="manipulated">Manipulado</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="Descrição detalhada do produto..."
                    />
                  </div>
                </div>
              </div>

              {/* Informações Comerciais */}
              <div className={`p-6 rounded-lg border ${
                theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
              }`}>
                <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Informações Comerciais
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Marca
                    </label>
                    <input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="Ex: Padaria do João"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Peso/Volume
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={formData.weight || ''}
                        onChange={(e) => handleInputChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                          errors.weight
                            ? 'border-red-500 focus:border-red-500'
                            : theme === 'dark'
                            ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                            : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                        } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                        placeholder="50"
                      />
                      <select
                        value={formData.weightUnit}
                        onChange={(e) => handleInputChange('weightUnit', e.target.value)}
                        className={`px-3 py-2 rounded-lg border transition-colors ${
                          theme === 'dark'
                            ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                            : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                        } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      >
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="ml">ml</option>
                        <option value="l">l</option>
                        <option value="un">un</option>
                      </select>
                    </div>
                    {errors.weight && (
                      <p className="text-red-500 text-sm mt-1">{errors.weight}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Preço de Venda (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.salePrice || ''}
                      onChange={(e) => handleInputChange('salePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        errors.salePrice
                          ? 'border-red-500 focus:border-red-500'
                          : theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="0,50"
                    />
                    {errors.salePrice && (
                      <p className="text-red-500 text-sm mt-1">{errors.salePrice}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Preço de Custo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costPrice || ''}
                      onChange={(e) => handleInputChange('costPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        errors.costPrice
                          ? 'border-red-500 focus:border-red-500'
                          : theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="0,30"
                    />
                    {errors.costPrice && (
                      <p className="text-red-500 text-sm mt-1">{errors.costPrice}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Validades */}
              <div className={`p-6 rounded-lg border ${
                theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
              }`}>
                <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Validades (em dias)
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Ambiente
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="9999"
                      value={formData.shelfLifeAmbient || ''}
                      onChange={(e) => handleInputChange('shelfLifeAmbient', e.target.value ? parseInt(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="1"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Refrigerado
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="9999"
                      value={formData.shelfLifeRefrigerated || ''}
                      onChange={(e) => handleInputChange('shelfLifeRefrigerated', e.target.value ? parseInt(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="3"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Congelado
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="9999"
                      value={formData.shelfLifeFrozen || ''}
                      onChange={(e) => handleInputChange('shelfLifeFrozen', e.target.value ? parseInt(e.target.value) : undefined)}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="30"
                    />
                  </div>
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className={`p-6 rounded-lg border ${
                theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
              }`}>
                <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Informações Adicionais
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Ingredientes
                    </label>
                    <textarea
                      value={formData.ingredients}
                      onChange={(e) => handleInputChange('ingredients', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="Farinha de trigo, água, fermento, sal..."
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Alérgenos
                    </label>
                    <textarea
                      value={formData.allergens}
                      onChange={(e) => handleInputChange('allergens', e.target.value)}
                      rows={2}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="Contém glúten. Pode conter traços de..."
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Informações Nutricionais
                    </label>
                    <textarea
                      value={formData.nutritionalInfo}
                      onChange={(e) => handleInputChange('nutritionalInfo', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="Valor energético: 250 kcal por 100g..."
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Observações
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                      placeholder="Produto artesanal, produzido diariamente..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
