import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Tag, 
  ArrowLeft,
  Clock,
  Package
} from '@phosphor-icons/react'
import FooterNavigation from '@/components/FooterNavigation'

interface TipoEtiqueta {
  id: string
  nome: string
  descricao: string
  icon: React.ComponentType<any>
  cor: string
  rota: string
}

export default function NovaEtiquetaPage() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { user } = useAuth()
  
  
  // Tipos de etiqueta baseados no Flutter
  const tiposEtiqueta: TipoEtiqueta[] = [
    {
      id: 'validade',
      nome: 'Validade',
      descricao: 'Etiquetas para itens manipulados',
      icon: Clock,
      cor: 'bg-primary', // Verde (cor principal)
      rota: '/etiquetas/validade'
    },
    {
      id: 'rotulo',
      nome: 'Rótulo', 
      descricao: 'Etiquetas para embalagens de venda',
      icon: Package,
      cor: 'bg-purple-500', // Roxo
      rota: '/etiquetas/rotulo'
    }
  ]

  const handleTipoSelect = (tipo: TipoEtiqueta) => {
    // Navegar para a rota específica do tipo de etiqueta
    navigate(tipo.rota)
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
              onClick={() => navigate('/etiquetas')}
              className={`p-2 transition-colors ${theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'}`}
            >
              <ArrowLeft size={24} weight="duotone" />
            </button>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Tag size={24} weight="duotone" className="text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Nova Etiqueta</h1>
              <p className="text-primary text-sm">Selecione o tipo de etiqueta</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="pt-32 px-10 py-8">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          {/* Descrição */}
          <p className={`text-base ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
            Para imprimir a etiqueta
          </p>
          
          {/* Cards dos tipos de etiqueta */}
          <div className="flex flex-col items-center space-y-6">
            {tiposEtiqueta.map((tipo, index) => {
              // Tamanho maior para Validade (core da aplicação)
              const isValidade = tipo.id === 'validade'
              const cardWidth = isValidade ? 'w-80' : 'w-70'
              const cardPadding = isValidade ? 'p-10' : 'p-8'
              
              return (
                <div
                  key={tipo.id}
                  className={`${cardWidth} ${cardPadding} ${
                    theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
                  } rounded-2xl border-2 hover:border-primary/50 transition-all cursor-pointer group hover:scale-105 animate-fade-in-up`}
                  style={{ animationDelay: `${200 + index * 100}ms` }}
                  onClick={() => handleTipoSelect(tipo)}
                >
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Ícone do tipo */}
                    <div className={`w-16 h-16 ${tipo.cor} rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <tipo.icon size={32} className="text-white" />
                    </div>
                    
                    {/* Informações do tipo */}
                    <div>
                      <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                        {tipo.nome}
                      </h3>
                      <p className={`text-base ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                        {tipo.descricao}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <FooterNavigation />
      
      {/* Espaçamento para o bottom navigation */}
      <div className="h-24"></div>
    </div>
  )
}