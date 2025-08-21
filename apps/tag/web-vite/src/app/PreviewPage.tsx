import { useTheme } from '@/contexts/ThemeContext'
import { Eye } from '@phosphor-icons/react'

export default function PreviewPage() {
  const { theme } = useTheme()

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'} flex items-center justify-center`}>
      <div className="text-center">
        <Eye size={64} weight="duotone" className="text-primary mx-auto mb-4" />
        <h1 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
          Preview da Etiqueta
        </h1>
        <p className={`${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
          Em desenvolvimento...
        </p>
      </div>
    </div>
  )
}
