'use client'

import { 
  Tag, 
  Plus, 
  Package,
  Folder,
  Cube,
  ArrowRight,
  PencilSimple,
  Trash,
  Eye,
  CaretRight,
  CaretDown,
  HandWaving,
  Barcode,
  TrayArrowDown,
  Camera
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

export default function CadastrosPage() {
  const [activeTab, setActiveTab] = useState('segmentos')
  const [selectedSegmento, setSelectedSegmento] = useState<string | null>(null)
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null)

  // Mock data com estrutura hierárquica multinível
  const segmentos = [
    { id: 'materia-prima', nome: 'Matéria Prima', icon: TrayArrowDown, cor: 'bg-blue-500', count: 15 },
    { id: 'manipulado', nome: 'Manipulado', icon: HandWaving, cor: 'bg-green-500', count: 12 },
    { id: 'produto-final', nome: 'Produto Final', icon: Barcode, cor: 'bg-purple-500', count: 20 }
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
    const segmentoCategorias = categorias[segmentoId]
    const toggleExpanded = (cats: Categoria[]): Categoria[] => {
      return cats.map(cat => {
        if (cat.id === categoriaId) {
          return { ...cat, expanded: !cat.expanded }
        }
        if (cat.children) {
          return { ...cat, children: toggleExpanded(cat.children) }
        }
        return cat
      })
    }
    
    // Atualizar o estado (em uma implementação real, isso seria feito via API)
    console.log('Toggle categoria:', categoriaId, 'em segmento:', segmentoId)
  }

  const renderCategoriaItem = (categoria: Categoria, segmentoId: string) => {
    const hasChildren = categoria.children && categoria.children.length > 0
    const isExpanded = categoria.expanded

    return (
      <div key={categoria.id} className="space-y-2">
        <div
          className={`bg-dark-800 rounded-2xl p-4 border border-dark-700 shadow-xl hover:border-primary/50 transition-all cursor-pointer group ${
            hasChildren ? 'hover:bg-dark-750' : ''
          }`}
          onClick={() => {
            if (hasChildren) {
              toggleCategoria(categoria.id, segmentoId)
            } else {
              setSelectedCategoria(categoria.id)
            }
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Indentação baseada no nível */}
              <div className="flex space-x-2">
                {Array.from({ length: categoria.level }, (_, i) => (
                  <div key={i} className="w-1 h-6 bg-dark-600 rounded-full"></div>
                ))}
              </div>
              
              {/* Ícone de expansão */}
              {hasChildren && (
                <div className="text-primary">
                  {isExpanded ? (
                    <CaretDown size={20} weight="duotone" />
                  ) : (
                    <CaretRight size={20} weight="duotone" />
                  )}
                </div>
              )}
              
              {/* Ícone da categoria */}
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <Folder size={20} weight="duotone" className="text-primary" />
              </div>
              
              {/* Informações da categoria */}
              <div>
                <h3 className="text-white font-medium">{categoria.nome}</h3>
                <p className="text-dark-400 text-sm">{categoria.count} itens</p>
              </div>
            </div>
            
            {/* Botões de ação */}
            <div className="flex items-center space-x-2">
              {hasChildren ? (
                <span className="text-dark-400 text-sm">
                  {isExpanded ? 'Recolher' : 'Expandir'}
                </span>
              ) : (
                <>
                  <button 
                    className="p-2 text-dark-400 hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Ver itens
                    }}
                  >
                    <Eye size={16} weight="duotone" />
                  </button>
                  <button 
                    className="p-2 text-dark-400 hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Editar categoria
                    }}
                  >
                    <PencilSimple size={16} weight="duotone" />
                  </button>
                  <button 
                    className="p-2 text-dark-400 hover:text-red-400 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Deletar categoria
                    }}
                  >
                    <Trash size={16} weight="duotone" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Subcategorias expandidas */}
        {hasChildren && isExpanded && (
          <div className="ml-8 space-y-2">
            {categoria.children!.map(child => renderCategoriaItem(child, segmentoId))}
          </div>
        )}
      </div>
    )
  }

  const renderSegmentos = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-white text-xl font-semibold">Segmentos do Sistema</h2>
        <button className="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-full font-medium transition-colors shadow-lg flex items-center space-x-2">
          <Plus size={20} weight="duotone" />
          <span>Novo Segmento</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {segmentos.map((segmento) => (
          <div
            key={segmento.id}
            className="bg-dark-800 rounded-2xl p-6 border border-dark-700 shadow-xl hover:border-primary/50 transition-all cursor-pointer group"
            onClick={() => setSelectedSegmento(segmento.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${segmento.cor} rounded-full flex items-center justify-center shadow-lg`}>
                <segmento.icon size={28} weight="duotone" className="text-white" />
              </div>
              <ArrowRight 
                size={20} 
                weight="duotone" 
                className="text-dark-400 group-hover:text-primary transition-colors" 
              />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">{segmento.nome}</h3>
            <p className="text-dark-400 text-sm">{segmento.count} categorias</p>
          </div>
        ))}
      </div>
    </div>
  )

  const renderCategorias = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-4 mb-6">
        <button 
          onClick={() => setSelectedSegmento(null)}
          className="text-dark-400 hover:text-white transition-colors"
        >
          ← Voltar aos Segmentos
        </button>
        <div className="w-px h-6 bg-dark-600"></div>
        <span className="text-white font-medium">
          {segmentos.find(s => s.id === selectedSegmento)?.nome}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-white text-xl font-semibold">Categorias Hierárquicas</h2>
        <button className="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-full font-medium transition-colors shadow-lg flex items-center space-x-2">
          <Plus size={20} weight="duotone" />
          <span>Nova Categoria</span>
        </button>
      </div>
      
      <div className="space-y-3">
        {categorias[selectedSegmento as keyof typeof categorias]?.map((categoria) => 
          renderCategoriaItem(categoria, selectedSegmento!)
        )}
      </div>
    </div>
  )

  const renderItens = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-4 mb-6">
        <button 
          onClick={() => setSelectedCategoria(null)}
          className="text-dark-400 hover:text-white transition-colors"
        >
          ← Voltar às Categorias
        </button>
        <div className="w-px h-6 bg-dark-600"></div>
        <span className="text-white font-medium">
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
        <h2 className="text-white text-xl font-semibold">Itens</h2>
        <button className="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-full font-medium transition-colors shadow-lg flex items-center space-x-2">
          <Plus size={20} weight="duotone" />
          <span>Novo Item</span>
        </button>
      </div>
      
      <div className="space-y-3">
        {itens[selectedCategoria as keyof typeof itens]?.map((item) => (
          <div
            key={item.id}
            className="bg-dark-800 rounded-2xl p-4 border border-dark-700 shadow-lg hover:border-primary/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Foto do Item */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-dark-700 border border-dark-600">
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
                      <div className="w-full h-full bg-primary/20 rounded-xl flex items-center justify-center hidden">
                        <Cube size={24} weight="duotone" className="text-primary" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-primary/20 rounded-xl flex items-center justify-center">
                      <Cube size={24} weight="duotone" className="text-primary" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-medium">{item.nome}</h3>
                  <p className="text-dark-400 text-sm">Código: {item.codigo} • {item.unidade}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-dark-400 hover:text-primary transition-colors" title="Ver detalhes">
                  <Eye size={20} weight="duotone" />
                </button>
                <button className="p-2 text-dark-400 hover:text-primary transition-colors" title="Editar item">
                  <PencilSimple size={20} weight="duotone" />
                </button>
                <button className="p-2 text-dark-400 hover:text-primary transition-colors" title="Upload foto">
                  <Camera size={20} weight="duotone" />
                </button>
                <button className="p-2 text-dark-400 hover:text-red-400 transition-colors" title="Excluir item">
                  <Trash size={20} weight="duotone" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderContent = () => {
    if (selectedCategoria) {
      return renderItens()
    }
    if (selectedSegmento) {
      return renderCategorias()
    }
    return renderSegmentos()
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header Fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-dark-950/95 backdrop-blur-sm border-b border-dark-600 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Tag size={24} weight="duotone" className="text-white" />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">Cadastros</h1>
              <p className="text-primary text-sm">Gerencie segmentos, categorias e itens</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="pt-32 px-6 py-6">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-dark-950/95 backdrop-blur-sm border-t border-dark-600 shadow-2xl">
        <div className="flex justify-around items-center px-6 py-4">
          <a href="/dashboard" className="flex flex-col items-center space-y-1 text-dark-400 hover:text-white transition-colors">
            <Tag size={24} weight="duotone" />
            <span className="text-xs font-medium">Dash</span>
          </a>
          <a href="/etiquetas" className="flex flex-col items-center space-y-1 text-dark-400 hover:text-white transition-colors">
            <Tag size={24} weight="duotone" />
            <span className="text-xs font-medium">Etiquetas</span>
          </a>
          <a href="/cadastros" className="flex flex-col items-center space-y-1 text-primary">
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
