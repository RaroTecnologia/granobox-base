import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ThemeToggle } from '@/components/ThemeToggle'
import { FormInput } from '@/components/FormInput'
import { useFormValidation } from '@/hooks/useFormValidation'
import { useTheme } from '@/contexts/ThemeContext'
import { Envelope, Lock, Eye, EyeSlash } from '@phosphor-icons/react'

interface LoginForm {
  email: string
  password: string
}

const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Email inválido'
      }
      return null
    }
  },
  password: {
    required: true,
    minLength: 6,
    custom: (value: string) => {
      if (value.length < 6) {
        return 'Senha deve ter pelo menos 6 caracteres'
      }
      return null
    }
  }
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [showPassword, setShowPassword] = useState(false)
  
  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldProps
  } = useFormValidation<LoginForm>(
    { email: '', password: '' },
    validationRules
  )

  const onSubmit = async (formData: LoginForm) => {
    try {
      // Simular login
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mostrar sucesso
      toast.success('Login realizado com sucesso! Redirecionando...', {
        duration: 3000,
      })
      
      // Redirecionar
      setTimeout(() => navigate('/dashboard'), 1000)
      
    } catch (error) {
      // Mostrar erro
      toast.error('Erro no login. Verifique suas credenciais e tente novamente.', {
        duration: 5000,
      })
    }
  }

  const emailField = getFieldProps('email')
  const passwordField = getFieldProps('password')

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'} flex flex-col`}>
      {/* Header com Toggle de Tema */}
      <header className="p-6">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-10 relative">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <span className="text-white text-2xl font-bold">GT</span>
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              Granobox Tag
            </h1>
            <p className="text-primary text-lg font-medium">Smart Tag. Smart Food.</p>
          </div>

          {/* Formulário de Login */}
          <form onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(onSubmit)
          }} className="space-y-6">
            
            <FormInput
              label="Email"
              type="text"
              placeholder="seu@email.com"
              icon={Envelope}
              value={emailField.value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => emailField.onChange(e.target.value)}
              onBlur={emailField.onBlur}
              error={emailField.error}
              hasError={emailField.hasError}
            />

            <div className="space-y-2">
              <div className="relative">
                <FormInput
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  icon={Lock}
                  value={passwordField.value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => passwordField.onChange(e.target.value)}
                  onBlur={passwordField.onBlur}
                  error={passwordField.error}
                  hasError={passwordField.hasError}
                />
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 ${
                    theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'
                  } transition-colors`}
                >
                  {showPassword ? <EyeSlash size={20} weight="duotone" /> : <Eye size={20} weight="duotone" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-600 disabled:bg-primary-400 text-white font-semibold py-3 px-6 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Links de Ajuda */}
          <div className="mt-6 text-center">
            <a href="#" className={`text-sm ${theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'} transition-colors`}>
              Esqueceu sua senha?
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`text-center py-6 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
        <p className="text-sm">
          © 2025 Wdezoito Tecnologia - CNPJ 26.058.346/0001-34. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  )
}
