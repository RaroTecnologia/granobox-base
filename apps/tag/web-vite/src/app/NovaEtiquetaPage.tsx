import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Tag, 
  ArrowLeft,
  Package,
  Folder,
  Cube,
  ArrowRight,
  Printer,
  Check,
  X,
  CaretRight,
  CaretDown,
  HandWaving,
  Barcode,
  TrayArrowDown
} from '@phosphor-icons/react'
import FooterNavigation from '@/components/FooterNavigation'

interface Categoria {
  id: string
  nome: string
  count: number
  children?: Categoria[]
  level: number
  expanded?: boolean
}

export default function NovaEtiquetaPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme } = useTheme()
  
  // Estados do wizard
  const [step, setStep] = useState<'segmentos' | 'categorias' | 'produtos' | 'criacao-etiqueta' | 'confirmacao'>('segmentos')
  const [selectedSegmento, setSelectedSegmento] = useState<string | null>(null)
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<{ id: string; nome: string; codigo: string; unidade: string; foto?: string } | null>(null)
  const [quantidade, setQuantidade] = useState('1')
  const [isPrinting, setIsPrinting] = useState(false)

  // Estado do wizard para navegação
  const [wizardState, setWizardState] = useState({
    step: 'segmentos' as const,
    segmento: null as string | null,
    categoria: null as string | null,
    item: null as any,
    quantidade: '1'
  })

  // Sincronizar com hash da URL
  useEffect(() => {
    const hash = location.hash.slice(1) // Remove o #
    if (hash && ['segmentos', 'categorias', 'produtos', 'criacao-etiqueta', 'confirmacao'].includes(hash)) {
      setStep(hash as any)
    }
  }, [location.hash])

  // Atualizar hash da URL
  const updateWizardStep = (newStep: string, data?: any) => {
    console.log('Atualizando step para:', newStep, 'com dados:', data)
    setStep(newStep as any)
    window.history.pushState(null, '', `#${newStep}`)
    
    if (data) {
      setWizardState(prev => ({ ...prev, ...data, step: newStep }))
    }
  }

  // Mock data com estrutura hierárquica multinível
  const segmentos = [
    { id: 'materia-prima', nome: 'Matéria Prima', icon: TrayArrowDown, cor: 'bg-blue-500' },
    { id: 'manipulado', nome: 'Manipulado', icon: HandWaving, cor: 'bg-green-500' },
    { id: 'produto-final', nome: 'Produto Final', icon: Barcode, cor: 'bg-purple-500' }
  ]

  const categorias: Record<string, Categoria[]> = {
    'materia-prima': [
      {
        id: 'c1',
        nome: 'Farinhas',
        count: 8,
        level: 0,
        expanded: false,
        children: [
          {
            id: 'c1-1',
            nome: 'Farinhas de Cereais',
            count: 4,
            level: 1,
            expanded: false,
            children: [
              { id: 'c1-1-1', nome: 'Farinha de Trigo', count: 2, level: 2 },
              { id: 'c1-1-2', nome: 'Farinha de Milho', count: 1, level: 2 },
              { id: 'c1-1-3', nome: 'Farinha de Aveia', count: 1, level: 2 }
            ]
          },
          {
            id: 'c1-2',
            nome: 'Farinhas de Tubérculos',
            count: 3,
            level: 1,
            expanded: false,
            children: [
              { id: 'c1-2-1', nome: 'Farinha de Mandioca', count: 2, level: 2 },
              { id: 'c1-2-2', nome: 'Farinha de Batata', count: 1, level: 2 }
            ]
          },
          { id: 'c1-3', nome: 'Farinhas Especiais', count: 1, level: 1 }
        ]
      },
      {
        id: 'c2',
        nome: 'Açúcares',
        count: 5,
        level: 0,
        expanded: false,
        children: [
          { id: 'c2-1', nome: 'Açúcar Refinado', count: 2, level: 1 },
          { id: 'c2-2', nome: 'Açúcar Mascavo', count: 1, level: 1 },
          { id: 'c2-3', nome: 'Açúcar Demerara', count: 1, level: 1 },
          { id: 'c2-4', nome: 'Açúcar de Coco', count: 1, level: 1 }
        ]
      }
    ],
    'manipulado': [
      {
        id: 'c4',
        nome: 'Massas',
        count: 6,
        level: 0,
        expanded: false,
        children: [
          { id: 'c4-1', nome: 'Massas de Pão', count: 3, level: 1 },
          { id: 'c4-2', nome: 'Massas de Bolo', count: 2, level: 1 },
          { id: 'c4-3', nome: 'Massas de Biscoito', count: 1, level: 1 }
        ]
      },
      {
        id: 'c5',
        nome: 'Recheios',
        count: 4,
        level: 0,
        expanded: false,
        children: [
          { id: 'c5-1', nome: 'Recheios Doces', count: 2, level: 1 },
          { id: 'c5-2', nome: 'Recheios Salgados', count: 2, level: 1 }
        ]
      }
    ],
    'produto-final': [
      {
        id: 'c7',
        nome: 'Pães',
        count: 12,
        level: 0,
        expanded: false,
        children: [
          {
            id: 'c7-1',
            nome: 'Pães Tradicionais',
            count: 6,
            level: 1,
            expanded: false,
            children: [
              { id: 'c7-1-1', nome: 'Pão Francês', count: 2, level: 2 },
              { id: 'c7-1-2', nome: 'Pão de Leite', count: 2, level: 2 },
              { id: 'c7-1-3', nome: 'Pão de Forma', count: 2, level: 2 }
            ]
          },
          {
            id: 'c7-2',
            nome: 'Pães Especiais',
            count: 4,
            level: 1,
            expanded: false,
            children: [
              { id: 'c7-2-1', nome: 'Pão Integral', count: 2, level: 2 },
              { id: 'c7-2-2', nome: 'Pão de Centeio', count: 1, level: 2 },
              { id: 'c7-2-3', nome: 'Pão de Aveia', count: 1, level: 2 }
            ]
          }
        ]
      },
      {
        id: 'c8',
        nome: 'Doces',
        count: 5,
        level: 0,
        expanded: false,
        children: [
          { id: 'c8-1', nome: 'Bolos', count: 3, level: 1 },
          { id: 'c8-2', nome: 'Biscoitos', count: 2, level: 1 }
        ]
      }
    ]
  }

  const itens = {
    'c1-1-1': [
      { id: 'i1', nome: 'Farinha de Trigo Tipo 1', codigo: 'FT001', unidade: 'kg', foto: '/images/farinha-trigo.jpg' },
      { id: 'i2', nome: 'Farinha de Trigo Tipo 2', codigo: 'FT002', unidade: 'kg', foto: '/images/farinha-trigo-2.jpg' }
    ],
    'c1-1-2': [
      { id: 'i3', nome: 'Farinha de Milho Fino', codigo: 'FM001', unidade: 'kg', foto: '/images/farinha-milho.jpg' }
    ],
    'c7-1-1': [
      { id: 'i4', nome: 'Pão Francês Tradicional', codigo: 'PF001', unidade: 'un', foto: '/images/pao-frances.jpg' },
      { id: 'i5', nome: 'Pão Francês Especial', codigo: 'PF002', unidade: 'un', foto: '/images/pao-leite.jpg' }
    ]
  }

  const toggleCategoria = (categoriaId: string, segmentoId: string) => {
    // Em uma implementação real, isso seria feito via estado local ou API
    console.log('Toggle categoria:', categoriaId, 'em segmento:', segmentoId)
  }

  const handleSegmentoSelect = (segmentoId: string) => {
    setSelectedSegmento(segmentoId)
    updateWizardStep('categorias', { segmento: segmentoId })
  }

  const handleCategoriaSelect = (categoriaId: string) => {
    console.log('Categoria selecionada:', categoriaId)
    setSelectedCategoria(categoriaId)
    updateWizardStep('produtos', { categoria: categoriaId })
  }

  const handleItemSelect = (item: { id: string; nome: string; codigo: string; unidade: string; foto?: string }) => {
    setSelectedItem(item)
    updateWizardStep('criacao-etiqueta', { item })
  }

  const handleConfirmacao = () => {
    // Redirecionar para a página de preview com os dados
    const params = new URLSearchParams({
      nome: selectedItem?.nome || '',
      codigo: selectedItem?.codigo || '',
      segmento: segmentos.find(s => s.id === selectedSegmento)?.nome || '',
      categoria: categorias[selectedSegmento as keyof typeof categorias]?.find(c => c.id === selectedCategoria)?.nome || '',
      unidade: selectedItem?.unidade || '',
      quantidade: quantidade,
      dataValidade: '',
      observacoes: '',
      foto: selectedItem?.foto || ''
    })
    
    navigate(`/etiquetas/preview?${params.toString()}`)
  }

  const handlePrint = async () => {
    setIsPrinting(true)
    // Simular impressão
    setTimeout(() => {
      setIsPrinting(false)
      toast.success('Etiqueta impressa com sucesso!')
      // Redirecionar para etiquetas ou dashboard
      navigate('/etiquetas')
    }, 2000)
  }

  const resetFlow = () => {
    setStep('segmentos')
    setSelectedSegmento(null)
    setSelectedCategoria(null)
    setSelectedItem(null)
    setQuantidade('1')
    updateWizardStep('segmentos')
    setWizardState({
      step: 'segmentos',
      segmento: null,
      categoria: null,
      item: null,
      quantidade: '1'
    })
  }

  const renderCategoriaItem = (categoria: Categoria, segmentoId: string) => {
    const hasChildren = categoria.children && categoria.children.length > 0
    const isExpanded = categoria.expanded
    
    console.log('Renderizando categoria:', categoria.nome, 'com children:', hasChildren)

    return (
      <div key={categoria.id} className="space-y-3">
        <div
          className={`${theme === 'dark' ? 'bg-dark-800 border-dark-800' : 'bg-white border-light-200'} rounded-3xl p-6 border-2 hover:border-primary/50 transition-all cursor-pointer group hover:scale-102 ${
            hasChildren ? 'hover:bg-dark-750' : ''
          }`}
          onClick={() => {
            console.log('Clicou na categoria:', categoria.nome, 'hasChildren:', hasChildren)
            if (hasChildren) {
              toggleCategoria(categoria.id, segmentoId)
            } else {
              handleCategoriaSelect(categoria.id)
            }
          }}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Ícone da categoria */}
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform">
              <Folder size={32} weight="duotone" className="text-primary" />
            </div>
            
            {/* Informações da categoria */}
            <div>
              <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{categoria.nome}</h3>
              <p className={`text-lg ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>{categoria.count} itens disponíveis</p>
            </div>
            
            {/* Ícone de expansão ou seta para continuar */}
            {hasChildren ? (
              <div className="text-primary">
                {isExpanded ? (
                  <CaretDown size={24} weight="duotone" />
                ) : (
                  <CaretRight size={24} weight="duotone" />
                )}
              </div>
            ) : (
              <ArrowRight 
                size={24} 
                weight="duotone" 
                className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} group-hover:text-primary transition-colors`} 
              />
            )}
          </div>
        </div>
        
        {/* Subcategorias expandidas */}
        {hasChildren && isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-8">
            {categoria.children!.map(child => renderCategoriaItem(child, segmentoId))}
          </div>
        )}
      </div>
    )
  }

  const renderSegmentos = () => (
    <div className="text-center space-y-8 animate-fade-in-up">
      <div className="space-y-4 animate-fade-in-up animation-delay-100">
        <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Selecione o Segmento</h2>
        <p className={`text-lg ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Escolha o tipo de produto para imprimir a etiqueta</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {segmentos.map((segmento, index) => (
          <div
            key={segmento.id}
            className={`${theme === 'dark' ? 'bg-dark-800 border-dark-800' : 'bg-white border-light-200'} rounded-3xl p-8 border-2 hover:border-primary/50 transition-all cursor-pointer group hover:scale-102 flex flex-col items-center justify-center text-center animate-fade-in-up`}
            style={{ animationDelay: `${200 + index * 100}ms` }}
            onClick={() => handleSegmentoSelect(segmento.id)}
          >
            <div className={`w-20 h-20 ${segmento.cor} rounded-full flex items-center justify-center shadow-2xl mx-auto mb-6 group-hover:scale-110 transition-transform`}>
              <segmento.icon size={40} weight="duotone" className="text-white" />
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{segmento.nome}</h3>
            <ArrowRight 
              size={32} 
              weight="duotone" 
              className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} group-hover:text-primary transition-colors mx-auto mt-4`} 
            />
          </div>
        ))}
      </div>
    </div>
  )

  const renderCategorias = () => {
    console.log('Renderizando categorias para segmento:', selectedSegmento)
    const categoriasDoSegmento = categorias[selectedSegmento as keyof typeof categorias]
    console.log('Categorias encontradas:', categoriasDoSegmento)
    
    if (!categoriasDoSegmento) {
      console.log('Nenhuma categoria encontrada para o segmento:', selectedSegmento)
      return (
        <div className="text-center space-y-8 animate-fade-in-up">
          <div className="space-y-4 animate-fade-in-up animation-delay-100">
            <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Selecione a Categoria</h2>
            <p className={`text-lg ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
              {segmentos.find(s => s.id === selectedSegmento)?.nome}
              {selectedSegmento && ` (${selectedSegmento})`}
            </p>
          </div>
          
          <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-3xl p-8 border-2 border-red-500`}>
            <p className={`text-lg ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
              Erro: Nenhuma categoria encontrada para o segmento selecionado
            </p>
            <pre className="mt-4 text-sm text-gray-500">
              {JSON.stringify({ selectedSegmento, categorias: Object.keys(categorias) }, null, 2)}
            </pre>
          </div>
        </div>
      )
    }
    
    return (
      <div className="text-center space-y-8 animate-fade-in-up">
        <div className="space-y-4 animate-fade-in-up animation-delay-100">
          <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Selecione a Categoria</h2>
                      <p className={`text-lg ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
              {segmentos.find(s => s.id === selectedSegmento)?.nome}
              {selectedSegmento && ` (${selectedSegmento})`}
            </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {categoriasDoSegmento.map((categoria, index) => 
            <div key={categoria.id} style={{ animationDelay: `${200 + index * 100}ms` }}>
              {renderCategoriaItem(categoria, selectedSegmento!)}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderProdutos = () => (
    <div className="text-center space-y-8 animate-fade-in-up">
      <div className="space-y-4 animate-fade-in-up animation-delay-100">
        <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Selecione o Produto</h2>
        <p className={`text-lg ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
          {/* Encontrar o nome da categoria selecionada */}
          {(() => {
            const segmentoCategorias = categorias[selectedSegmento as keyof typeof categorias]
            const findCategoriaName = (cats: Categoria[], id: string): string | null => {
              for (const cat of cats) {
                if (cat.id === id) return cat.nome
                if (cat.children) {
                  const found = findCategoriaName(cat.children, id)
                  if (found) return found
                }
              }
              return null
            }
            return findCategoriaName(segmentoCategorias, selectedCategoria!) || 'Categoria'
          })()}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {itens[selectedCategoria as keyof typeof itens]?.map((item, index) => (
          <div
            key={item.id}
            className={`${theme === 'dark' ? 'bg-dark-800 border-dark-800' : 'bg-white border-light-200'} rounded-3xl p-8 border-2 hover:border-primary/50 transition-all cursor-pointer group hover:scale-105 animate-fade-in-up`}
            style={{ animationDelay: `${200 + index * 100}ms` }}
            onClick={() => handleItemSelect(item)}
          >
            {/* Foto do Item */}
            <div className={`w-24 h-24 rounded-2xl overflow-hidden ${theme === 'dark' ? 'bg-dark-700 border-dark-800' : 'bg-light-100 border-light-300'} border-2 shadow-2xl mx-auto mb-6 group-hover:scale-110 transition-transform`}>
              {item.foto ? (
                <>
                  <img 
                    src={item.foto} 
                    alt={item.nome}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback para ícone se a imagem falhar
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                  <div className="w-full h-full bg-primary/20 rounded-2xl flex items-center justify-center hidden">
                    <Cube size={40} weight="duotone" className="text-primary" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-primary/20 rounded-2xl flex items-center justify-center">
                  <Cube size={40} weight="duotone" className="text-primary" />
                </div>
              )}
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{item.nome}</h3>
            <p className={`text-lg ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Código: {item.codigo}</p>
            <p className={`text-lg ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Unidade: {item.unidade}</p>
            <ArrowRight 
              size={32} 
              weight="duotone" 
              className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} group-hover:text-primary transition-colors mx-auto mt-4`} 
            />
          </div>
        ))}
      </div>
    </div>
  )

  const renderCriacaoEtiqueta = () => (
    <div className="text-center space-y-8 max-w-4xl mx-auto animate-fade-in-up">
      <div className="space-y-4 animate-fade-in-up animation-delay-100">
        <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Criar Etiqueta</h2>
        <p className={`text-lg ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Configure os detalhes da etiqueta para impressão</p>
      </div>
      
      {/* Card de Configuração da Etiqueta */}
      <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-3xl p-8 border-2 border-primary/50 shadow-2xl animate-fade-in-up animation-delay-200`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Informações do Produto */}
          <div className="space-y-6">
            <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Produto Selecionado</h3>
            
            {/* Foto do Produto */}
            <div className="w-32 h-32 rounded-2xl overflow-hidden mx-auto">
              {selectedItem?.foto ? (
                <img 
                  src={selectedItem.foto} 
                  alt={selectedItem.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/20 rounded-2xl flex items-center justify-center">
                  <Cube size={48} weight="duotone" className="text-primary" />
                </div>
              )}
            </div>
            
            <div className="text-center">
              <h4 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{selectedItem?.nome}</h4>
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Código: {selectedItem?.codigo}</p>
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Unidade: {selectedItem?.unidade}</p>
            </div>
          </div>
          
          {/* Configurações da Etiqueta */}
          <div className="space-y-6">
            <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Configurações</h3>
            
            {/* Quantidade */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Quantidade de Etiquetas:</label>
              <input
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                min="1"
                className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'} border rounded-xl text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
              />
            </div>
            
            {/* Data de Validade */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Data de Validade:</label>
              <input
                type="date"
                className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'} border rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
              />
            </div>
            
            {/* Observações */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Observações:</label>
              <textarea
                rows={3}
                placeholder="Observações especiais para a etiqueta..."
                className={`w-full px-4 py-3 ${theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none`}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Botões de Ação */}
      <div className="flex justify-center space-x-6">
        <button
          onClick={() => updateWizardStep('produtos')}
          className={`px-8 py-4 ${theme === 'dark' ? 'bg-dark-700 hover:bg-dark-600' : 'bg-light-200 hover:bg-light-300'} text-white rounded-full font-medium transition-colors shadow-lg flex items-center space-x-3 animate-fade-in-up`}
          style={{ animationDelay: '300ms' }}
        >
          <ArrowLeft size={24} weight="duotone" />
          <span>Voltar</span>
        </button>
        
        <button
          onClick={() => updateWizardStep('confirmacao')}
          className="px-8 py-4 bg-primary hover:bg-primary-600 text-white rounded-full font-medium transition-colors shadow-lg flex items-center space-x-3 animate-fade-in-up"
          style={{ animationDelay: '400ms' }}
        >
          <ArrowRight size={24} weight="duotone" />
          <span>Continuar</span>
        </button>
      </div>
    </div>
  )

  const renderConfirmacao = () => (
    <div className="text-center space-y-8 max-w-2xl mx-auto animate-fade-in-up">
      <div className="space-y-4 animate-fade-in-up animation-delay-100">
        <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Confirmar Impressão</h2>
        <p className={`text-lg ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Revise os dados antes de imprimir</p>
      </div>
      
      {/* Card de Confirmação */}
      <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-3xl p-8 border-2 border-primary/50 shadow-2xl animate-fade-in-up animation-delay-200`}>
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center shadow-2xl mx-auto mb-6">
          <Cube size={48} weight="duotone" className="text-primary" />
        </div>
        
        <h3 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{selectedItem?.nome}</h3>
        
        <div className="space-y-4 text-left max-w-sm mx-auto">
          <div className="flex justify-between items-center">
            <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Código:</span>
            <span className={`font-mono text-lg ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{selectedItem?.codigo}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Segmento:</span>
            <span className={`${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{segmentos.find(s => s.id === selectedSegmento)?.nome}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Categoria:</span>
            <span className={`${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              {/* Encontrar o nome da categoria selecionada */}
              {(() => {
                const segmentoCategorias = categorias[selectedSegmento as keyof typeof categorias]
                const findCategoriaName = (cats: Categoria[], id: string): string | null => {
                  for (const cat of cats) {
                    if (cat.id === id) return cat.nome
                    if (cat.children) {
                      const found = findCategoriaName(cat.children, id)
                      if (found) return found
                    }
                  }
                  return null
                }
                return findCategoriaName(segmentoCategorias, selectedCategoria!) || 'Categoria'
              })()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Unidade:</span>
            <span className={`${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{selectedItem?.unidade}</span>
          </div>
        </div>

        {/* Quantidade */}
        <div className="mt-8 space-y-4">
          <label className={`block text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Quantidade:</label>
          <input
            type="number"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            min="1"
            className={`w-32 px-4 py-3 ${theme === 'dark' ? 'bg-dark-700 border-dark-800 text-white' : 'bg-light-100 border-light-300 text-dark-900'} border rounded-full text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all mx-auto`}
          />
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-center space-x-6">
        <button
          onClick={resetFlow}
          className={`px-8 py-4 ${theme === 'dark' ? 'bg-dark-700 hover:bg-dark-600' : 'bg-light-200 hover:bg-light-300'} text-white rounded-full font-medium transition-colors shadow-lg flex items-center space-x-3 animate-fade-in-up`}
          style={{ animationDelay: '300ms' }}
        >
          <X size={24} weight="duotone" />
          <span>Cancelar</span>
        </button>
        
        <button
          onClick={handleConfirmacao}
          className="px-8 py-4 bg-primary hover:bg-primary-600 text-white rounded-full font-medium transition-colors shadow-lg flex items-center space-x-3 animate-fade-in-up"
          style={{ animationDelay: '400ms' }}
        >
          <Check size={24} weight="duotone" />
          <span>Continuar</span>
        </button>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (step) {
      case 'categorias':
        return renderCategorias()
      case 'produtos':
        return renderProdutos()
      case 'criacao-etiqueta':
        return renderCriacaoEtiqueta()
      case 'confirmacao':
        return renderConfirmacao()
      default:
        return renderSegmentos()
    }
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'}`}>
      {/* Header Fixo */}
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b shadow-2xl ${
        theme === 'dark' ? 'bg-dark-950/95 border-dark-800' : 'bg-white/95 border-light-200'
      }`}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => {
                if (step === 'segmentos') {
                  // Se estiver na primeira etapa, volta para a página de etiquetas
                  navigate('/etiquetas')
                } else {
                  // Se estiver em qualquer outra etapa, volta para a etapa anterior
                  if (step === 'confirmacao') {
                    updateWizardStep('criacao-etiqueta')
                  } else if (step === 'criacao-etiqueta') {
                    updateWizardStep('produtos')
                  } else if (step === 'produtos') {
                    updateWizardStep('categorias')
                  } else if (step === 'categorias') {
                    updateWizardStep('segmentos')
                  }
                }
              }}
              className={`p-2 transition-colors ${theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'}`}
            >
              <ArrowLeft size={24} weight="duotone" />
            </button>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Tag size={24} weight="duotone" className="text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Nova Etiqueta</h1>
              <p className="text-primary text-sm">Fluxo de impressão simplificado</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="pt-32 px-6 py-6">
        {renderContent()}
      </main>

      {/* Footer Navigation */}
      <FooterNavigation />

      {/* Espaçamento para o bottom navigation */}
      <div className="h-24"></div>
    </div>
  )
}
