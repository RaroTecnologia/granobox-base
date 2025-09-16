import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useCategories } from '@/hooks/useCategories'
import { 
  TrayArrowDown, 
  ArrowLeft,
  Check,
  Warning,
  Spinner
} from '@phosphor-icons/react'
import { toast } from 'react-hot-toast'
import type { CreateCategoryRequest, UpdateCategoryRequest } from '@/services/categoriesService'

export default function CadastroCategoriaPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { user, isLoading: authLoading } = useAuth()
  const isEditing = !!id
  
  // Para usuários manager, usar o primeiro cliente disponível
  const clientId = user?.clientId || (user?.role === 'manager' ? '6621e831-5d1d-4801-8c33-b0f93446a3df' : undefined)

  // Hooks da API
  const { 
    categories, 
    getCategoryById, 
    createCategory, 
    updateCategory, 
    loading: categoriesLoading 
  } = useCategories(clientId)

  // Estados do formulário
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    clientId: clientId || '',
    parentId: undefined,
    isActive: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Carregar categoria para edição
  useEffect(() => {
    if (isEditing && id) {
      const category = getCategoryById(id)
      if (category) {
        setFormData({
          name: category.name,
          clientId: category.clientId,
          parentId: category.parentId,
          isActive: category.isActive,
        })
      }
    }
  }, [id, isEditing]) // Removido getCategoryById das dependências

  const handleInputChange = (field: keyof CreateCategoryRequest, value: any) => {
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
        await updateCategory(id, formData as UpdateCategoryRequest)
        toast.success('Categoria atualizada com sucesso!')
      } else {
        await createCategory(formData)
        toast.success('Categoria criada com sucesso!')
      }
      
      navigate('/cadastros')
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error)
      toast.error(error.message || 'Erro ao salvar categoria')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = authLoading || categoriesLoading

  // Mostrar loading enquanto carrega autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size={48} className="animate-spin text-primary mb-4" />
          <p className="text-lg">Carregando...</p>
        </div>
      </div>
    )
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

  // Categorias disponíveis para ser pai (excluindo a própria categoria se estiver editando)
  const availableParentCategories = categories.filter(cat => 
    cat.id !== id && !cat.parentId // Apenas categorias raiz podem ser pais
  )

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
                <TrayArrowDown size={24} weight="duotone" className="text-white" />
              </div>
              
              <div>
                <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
                </h1>
                <p className="text-primary text-sm">
                  {isEditing ? 'Atualize as informações da categoria' : 'Cadastre uma nova categoria'}
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
                form="category-form"
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
          <form id="category-form" onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="grid gap-6">
              {/* Informações Básicas */}
              <div className={`p-6 rounded-lg border ${
                theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
              }`}>
                <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Informações Básicas
                </h2>
                
                <div className="grid gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Nome da Categoria *
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
                      placeholder="Ex: Padaria"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
                    }`}>
                      Categoria Pai
                    </label>
                    <select
                      value={formData.parentId || ''}
                      onChange={(e) => handleInputChange('parentId', e.target.value || undefined)}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                          : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                      } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                    >
                      <option value="">Categoria raiz</option>
                      {availableParentCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
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