import { useTheme } from '@/contexts/ThemeContext'
import { Warning, X, Trash, CheckCircle } from '@phosphor-icons/react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
  itemName?: string
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  itemName
}: ConfirmationModalProps) {
  const { theme } = useTheme()

  if (!isOpen) return null

  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <Trash size={48} className="text-red-500" />,
          confirmButtonClass: 'bg-red-500 hover:bg-red-600 focus:ring-red-500',
          iconBgClass: 'bg-red-100 dark:bg-red-900/20'
        }
      case 'warning':
        return {
          icon: <Warning size={48} className="text-yellow-500" />,
          confirmButtonClass: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500',
          iconBgClass: 'bg-yellow-100 dark:bg-yellow-900/20'
        }
      case 'info':
        return {
          icon: <CheckCircle size={48} className="text-blue-500" />,
          confirmButtonClass: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500',
          iconBgClass: 'bg-blue-100 dark:bg-blue-900/20'
        }
    }
  }

  const typeConfig = getTypeConfig()

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${
        theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
      } rounded-2xl p-6 border shadow-2xl max-w-md w-full transform transition-all duration-200 scale-100`}>
        
        {/* Header com botão fechar */}
        <div className="flex justify-end mb-4">
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'
            }`}
          >
            <X size={20} weight="duotone" className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="text-center space-y-6">
          {/* Ícone */}
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${typeConfig.iconBgClass}`}>
            {typeConfig.icon}
          </div>

          {/* Título */}
          <div>
            <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              {title}
            </h3>
            
            {/* Nome do item destacado */}
            {itemName && (
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${
                theme === 'dark' ? 'bg-dark-700 text-white' : 'bg-gray-100 text-dark-900'
              }`}>
                "{itemName}"
              </div>
            )}
            
            {/* Mensagem */}
            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
              {message}
            </p>
          </div>

          {/* Botões */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                theme === 'dark' 
                  ? 'bg-dark-700 hover:bg-dark-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-dark-900'
              }`}
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                typeConfig.confirmButtonClass
              } ${theme === 'dark' ? 'focus:ring-offset-dark-800' : 'focus:ring-offset-white'}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook para usar o modal de confirmação
export function useConfirmation() {
  const showConfirmation = (options: Omit<ConfirmationModalProps, 'isOpen' | 'onClose'>) => {
    return new Promise<boolean>((resolve) => {
      const modal = document.createElement('div')
      document.body.appendChild(modal)

      const cleanup = () => {
        document.body.removeChild(modal)
      }

      const handleConfirm = () => {
        resolve(true)
        cleanup()
      }

      const handleCancel = () => {
        resolve(false)
        cleanup()
      }

      // Renderizar o modal (isso seria melhor com um context, mas para simplicidade...)
      // Por agora, vamos usar o componente diretamente na página
    })
  }

  return { showConfirmation }
}
