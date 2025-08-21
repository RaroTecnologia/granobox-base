import { forwardRef } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Warning } from '@phosphor-icons/react'

interface FormInputProps {
  label?: string
  error?: string
  hasError?: boolean
  icon?: React.ComponentType<any>
  className?: string
  [key: string]: any
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, hasError, icon: Icon, className = '', ...props }, ref) => {
    const { theme } = useTheme()

    const inputClasses = `
      w-full pl-10 pr-4 py-3 rounded-full border-2 transition-all duration-200 focus:outline-none
      ${theme === 'dark' 
        ? 'bg-dark-800 border-dark-800 text-white focus:border-primary' 
        : 'bg-white border-light-200 text-dark-900 focus:border-primary'
      }
      ${hasError 
        ? 'border-red-500 focus:border-red-500' 
        : ''
      }
      ${className}
    `.trim()

    const labelClasses = `
      block text-sm font-medium mb-2 transition-colors
      ${theme === 'dark' ? 'text-white' : 'text-dark-900'}
      ${hasError ? 'text-red-500' : ''}
    `.trim()

    const iconClasses = `
      absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors
      ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}
      ${hasError ? 'text-red-500' : ''}
    `.trim()

    return (
      <div className="space-y-2">
        {label && (
          <label className={labelClasses}>
            {label}
          </label>
        )}
        
        <div className="relative">
          {Icon && (
            <Icon size={20} weight="duotone" className={iconClasses} />
          )}
          
          <input
            ref={ref}
            className={inputClasses}
            {...props}
          />
          
          {hasError && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Warning size={20} weight="duotone" className="text-red-500" />
            </div>
          )}
        </div>
        
        {hasError && error && (
          <div className="flex items-center space-x-2 text-red-500 text-sm">
            <Warning size={16} weight="duotone" />
            <span>{error}</span>
          </div>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'
