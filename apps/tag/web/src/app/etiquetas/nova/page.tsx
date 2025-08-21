'use client'

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
import { useState } from 'react'

interface Categoria {
  id: string
  nome: string
  count: number
  children?: Categoria[]
  level: number
  expanded?: boolean
}

export default function NovaEtiquetaPage() {
  const [step, setStep] = useState<'segmentos' | 'categorias' | 'itens' | 'confirmacao'>('segmentos')
  const [selectedSegmento, setSelectedSegmento] = useState<string | null>(null)
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<{ id: string; nome: string; codigo: string; unidade: string; foto?: string } | null>(null)
  const [quantidade, setQuantidade] = useState('1')
  const [isPrinting, setIsPrinting] = useState(false)

  // Mock data com estrutura hierárquica multinível (igual ao cadastros)
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
      },
      {
        id: 'c3',
        nome: 'Óleos e Gorduras',
        count: 6,
        level: 0,
        expanded: false,
        children: [
          {
            id: 'c3-1',
            nome: 'Óleos Vegetais',
            count: 3,
            level: 1,
            children: [
              { id: 'c3-1-1', nome: 'Óleo de Soja', count: 1, level: 2 },
              { id: 'c3-1-2', nome: 'Óleo de Milho', count: 1, level: 2 },
              { id: 'c3-1-3', nome: 'Óleo de Girassol', count: 1, level: 2 }
            ]
          },
          { id: 'c3-2', nome: 'Manteigas', count: 2, level: 1 },
          { id: 'c3-3', nome: 'Margarinas', count: 1, level: 1 }
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
      },
      {
        id: 'c6',
        nome: 'Coberturas',
        count: 2,
        level: 0,
        expanded: false,
        children: [
          { id: 'c6-1', nome: 'Coberturas de Chocolate', count: 1, level: 1 },
          { id: 'c6-2', nome: 'Coberturas de Frutas', count: 1, level: 1 }
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
          },
          { id: 'c7-3', nome: 'Pães de Festa', count: 2, level: 1 }
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
      },
      {
        id: 'c9',
        nome: 'Salgados',
        count: 3,
        level: 0,
        expanded: false,
        children: [
          { id: 'c9-1', nome: 'Empadas', count: 2, level: 1 },
          { id: 'c9-2', nome: 'Coxinhas', count: 1, level: 1 }
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
    setStep('categorias')
  }

  const handleCategoriaSelect = (categoriaId: string) => {
    setSelectedCategoria(categoriaId)
    setStep('itens')
  }

  const handleItemSelect = (item: { id: string; nome: string; codigo: string; unidade: string; foto?: string }) => {
    setSelectedItem(item)
    setStep('confirmacao')
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
    
    window.location.href = `/etiquetas/preview?${params.toString()}`
  }

  const handlePrint = async () => {
    setIsPrinting(true)
    // Simular impressão
    setTimeout(() => {
      setIsPrinting(false)
      // Redirecionar para etiquetas ou dashboard
      window.location.href = '/etiquetas'
    }, 2000)
  }

  const resetFlow = () => {
    setStep('segmentos')
    setSelectedSegmento(null)
    setSelectedCategoria(null)
    setSelectedItem(null)
    setQuantidade('1')
  }

  const renderCategoriaItem = (categoria: Categoria, segmentoId: string) => {
    const hasChildren = categoria.children && categoria.children.length > 0
    const isExpanded = categoria.expanded

    return (
      <div key={categoria.id} className="space-y-3">
        <div
          className={`bg-dark-800 rounded-3xl p-6 border-2 border-dark-700 hover:border-primary/50 transition-all cursor-pointer group hover:scale-102 ${
            hasChildren ? 'hover:bg-dark-750' : ''
          }`}
          onClick={() => {
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
              <h3 className="text-white text-xl font-bold mb-2">{categoria.nome}</h3>
              <p className="text-dark-400 text-lg">{categoria.count} itens disponíveis</p>
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
                className="text-dark-400 group-hover:text-primary transition-colors" 
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
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <h2 className="text-white text-3xl font-bold">Selecione o Segmento</h2>
        <p className="text-dark-400 text-lg">Escolha o tipo de produto para imprimir a etiqueta</p>
      </div>
      
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {segmentos.map((segmento) => (
          <div
            key={segmento.id}
            className="bg-dark-800 rounded-3xl p-8 border-2 border-dark-700 hover:border-primary/50 transition-all cursor-pointer group hover:scale-102 flex flex-col items-center justify-center text-center"
            onClick={() => handleSegmentoSelect(segmento.id)}
          >
            <div className={`w-20 h-20 ${segmento.cor} rounded-full flex items-center justify-center shadow-2xl mx-auto mb-6 group-hover:scale-110 transition-transform`}>
              <segmento.icon size={40} weight="duotone" className="text-white" />
            </div>
            <h3 className="text-white text-2xl font-bold mb-2">{segmento.nome}</h3>
            <ArrowRight 
              size={32} 
              weight="duotone" 
              className="text-dark-400 group-hover:text-primary transition-colors mx-auto mt-4" 
            />
          </div>
        ))}
      </div>
    </div>
  )

  const renderCategorias = () => (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <button 
          onClick={() => setStep('segmentos')}
          className="text-dark-400 hover:text-white transition-colors text-lg flex items-center space-x-2 mx-auto"
        >
          <ArrowLeft size={20} weight="duotone" />
          <span>Voltar aos Segmentos</span>
        </button>
        <h2 className="text-white text-3xl font-bold">Selecione a Categoria</h2>
        <p className="text-dark-400 text-lg">
          {segmentos.find(s => s.id === selectedSegmento)?.nome}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {categorias[selectedSegmento as keyof typeof categorias]?.map((categoria) => 
          renderCategoriaItem(categoria, selectedSegmento!)
        )}
      </div>
    </div>
  )

  const renderItens = () => (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <button 
          onClick={() => setStep('categorias')}
          className="text-dark-400 hover:text-white transition-colors text-lg flex items-center space-x-2 mx-auto"
        >
          <ArrowLeft size={20} weight="duotone" />
          <span>Voltar às Categorias</span>
        </button>
        <h2 className="text-white text-3xl font-bold">Selecione o Item</h2>
        <p className="text-dark-400 text-lg">
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
        {itens[selectedCategoria as keyof typeof itens]?.map((item) => (
          <div
            key={item.id}
            className="bg-dark-800 rounded-3xl p-8 border-2 border-dark-700 hover:border-primary/50 transition-all cursor-pointer group hover:scale-105"
            onClick={() => handleItemSelect(item)}
          >
            {/* Foto do Item */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-dark-700 border-2 border-dark-600 shadow-2xl mx-auto mb-6 group-hover:scale-110 transition-transform">
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
            <h3 className="text-white text-2xl font-bold mb-2">{item.nome}</h3>
            <p className="text-dark-400 text-lg">Código: {item.codigo}</p>
            <p className="text-dark-400 text-lg">Unidade: {item.unidade}</p>
            <ArrowRight 
              size={32} 
              weight="duotone" 
              className="text-dark-400 group-hover:text-primary transition-colors mx-auto mt-4" 
            />
          </div>
        ))}
      </div>
    </div>
  )

  const renderConfirmacao = () => (
    <div className="text-center space-y-8 max-w-2xl mx-auto">
      <div className="space-y-4">
        <button 
          onClick={() => setStep('itens')}
          className="text-dark-400 hover:text-white transition-colors text-lg flex items-center space-x-2 mx-auto"
        >
          <ArrowLeft size={20} weight="duotone" />
          <span>Voltar aos Itens</span>
        </button>
        <h2 className="text-white text-3xl font-bold">Confirmar Impressão</h2>
        <p className="text-dark-400 text-lg">Revise os dados antes de imprimir</p>
      </div>
      
      {/* Card de Confirmação */}
      <div className="bg-dark-800 rounded-3xl p-8 border-2 border-primary/50 shadow-2xl">
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center shadow-2xl mx-auto mb-6">
          <Cube size={48} weight="duotone" className="text-primary" />
        </div>
        
        <h3 className="text-white text-2xl font-bold mb-4">{selectedItem?.nome}</h3>
        
        <div className="space-y-4 text-left max-w-sm mx-auto">
          <div className="flex justify-between items-center">
            <span className="text-dark-400">Código:</span>
            <span className="text-white font-mono text-lg">{selectedItem?.codigo}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-dark-400">Segmento:</span>
            <span className="text-white">{segmentos.find(s => s.id === selectedSegmento)?.nome}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-dark-400">Categoria:</span>
            <span className="text-white">
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
            <span className="text-dark-400">Unidade:</span>
            <span className="text-white">{selectedItem?.unidade}</span>
          </div>
        </div>

        {/* Quantidade */}
        <div className="mt-8 space-y-4">
          <label className="block text-white text-lg font-medium">Quantidade:</label>
          <input
            type="number"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            min="1"
            className="w-32 px-4 py-3 bg-dark-700 border border-dark-600 rounded-full text-white text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all mx-auto"
          />
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-center space-x-6">
        <button
          onClick={resetFlow}
          className="px-8 py-4 bg-dark-700 hover:bg-dark-600 text-white rounded-full font-medium transition-colors shadow-lg flex items-center space-x-3"
        >
          <X size={24} weight="duotone" />
          <span>Cancelar</span>
        </button>
        
        <button
          onClick={handleConfirmacao}
          className="px-8 py-4 bg-primary hover:bg-primary-600 text-white rounded-full font-medium transition-colors shadow-lg flex items-center space-x-3"
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
      case 'itens':
        return renderItens()
      case 'confirmacao':
        return renderConfirmacao()
      default:
        return renderSegmentos()
    }
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header Fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-dark-950/95 backdrop-blur-sm border-b border-dark-600 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <a href="/etiquetas" className="p-2 text-dark-400 hover:text-white transition-colors">
              <ArrowLeft size={24} weight="duotone" />
            </a>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Tag size={24} weight="duotone" className="text-white" />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">Nova Etiqueta</h1>
              <p className="text-primary text-sm">Fluxo de impressão simplificado</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="pt-32 px-6 py-6">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-dark-950/95 backdrop-blur-sm border-t border-dark-600 shadow-2xl">
        <div className="flex justify-around items-center px-6 py-4">
          <a href="/dashboard" className="flex flex-col items-center space-y-1 text-dark-400 hover:text-white transition-colors">
            <Tag size={24} weight="duotone" />
            <span className="text-xs font-medium">Dash</span>
          </a>
          <a href="/etiquetas" className="flex flex-col items-center space-y-1 text-primary">
            <Tag size={24} weight="duotone" />
            <span className="text-xs font-medium">Etiquetas</span>
          </a>
          <a href="/cadastros" className="flex flex-col items-center space-y-1 text-dark-400 hover:text-white transition-colors">
            <Tag size={24} weight="duotone" />
            <span className="text-xs font-medium">Cadastros</span>
          </a>
          <a href="/configuracoes" className="flex flex-col items-center space-y-1 text-dark-400 hover:text-white transition-colors">
            <Tag size={24} weight="duotone" />
            <span className="text-xs font-medium">Config</span>
          </a>
        </div>
      </nav>

      {/* Espaçamento para o bottom navigation */}
      <div className="h-24"></div>
    </div>
  )
}
