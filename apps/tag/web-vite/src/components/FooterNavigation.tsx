import { useTheme } from '@/contexts/ThemeContext'
import { ChartLine, Package, Warning, Gear, Tag } from '@phosphor-icons/react'

export default function FooterNavigation() {
  const { theme } = useTheme()

  return (
    <nav className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-t fixed bottom-0 left-0 right-0 px-4 py-3`}>
      <div className="flex items-center justify-around">
        <a 
          href="/dashboard" 
          className={`flex flex-col items-center space-y-1 ${theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'} transition-colors`}
        >
          <ChartLine size={28} weight="duotone" className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`} />
          <span className="text-xs">Dash</span>
        </a>
        
        <a 
          href="/etiquetas" 
          className={`flex flex-col items-center space-y-1 ${theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'} transition-colors`}
        >
          <Tag size={28} weight="duotone" className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`} />
          <span className="text-xs">Etiquetas</span>
        </a>
        
        <a 
          href="/cadastros" 
          className={`flex flex-col items-center space-y-1 ${theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'} transition-colors`}
        >
          <Package size={28} weight="duotone" className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`} />
          <span className="text-xs">Cadastros</span>
        </a>
        
        <a 
          href="/alertas" 
          className={`flex flex-col items-center space-y-1 ${theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'} transition-colors`}
        >
          <Warning size={28} weight="duotone" className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`} />
          <span className="text-xs">Alertas</span>
        </a>
        
        <a 
          href="/configuracoes" 
          className="flex flex-col items-center space-y-1 text-primary"
        >
          <Gear size={28} weight="duotone" className="text-primary" />
          <span className="text-xs">Config</span>
        </a>
      </div>
    </nav>
  )
}
