import { useTheme } from '@/contexts/ThemeContext'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  fullScreen?: boolean
  className?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  text = 'Carregando...', 
  fullScreen = false,
  className = ''
}: LoadingSpinnerProps) {
  const { theme } = useTheme()

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg', 
    xl: 'text-xl'
  }

  const containerClasses = fullScreen 
    ? `fixed inset-0 flex items-center justify-center z-50 ${theme === 'dark' ? 'bg-dark-900/80' : 'bg-white/80'} backdrop-blur-sm`
    : 'flex flex-col items-center justify-center p-8'

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div className={`${sizeClasses[size]} animate-spin`}>
          <svg 
            className="w-full h-full text-primary" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>

        {/* Texto */}
        {text && (
          <p className={`${textSizeClasses[size]} font-medium ${
            theme === 'dark' ? 'text-white' : 'text-dark-900'
          } text-center`}>
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

// Componente específico para loading de página inteira
export function PageLoading({ text = 'Carregando página...' }: { text?: string }) {
  return <LoadingSpinner size="lg" text={text} fullScreen />
}

// Componente específico para loading de seção
export function SectionLoading({ text = 'Carregando...', size = 'md' as const }: { 
  text?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  return <LoadingSpinner size={size} text={text} />
}

// Componente específico para loading inline (sem texto)
export function InlineLoading({ size = 'sm' as const }: { size?: 'sm' | 'md' }) {
  return <LoadingSpinner size={size} text="" />
}
