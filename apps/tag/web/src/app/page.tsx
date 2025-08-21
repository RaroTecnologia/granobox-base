'use client'

import { useState } from 'react'
import { Eye, EyeSlash, Envelope, Lock, User } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simular login
    setTimeout(() => {
      setIsLoading(false)
      // Redirecionar para o dashboard
      router.push('/dashboard')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Conteúdo Principal */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-primary rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl">
              <User size={40} weight="duotone" className="text-white" />
            </div>
            <h1 className="text-white text-3xl font-bold mb-2">Granobox Tag</h1>
            <p className="text-primary text-lg font-medium mb-1">Smart Tag. Smart Food.</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-3">
                Email
              </label>
              <div className="relative">
                <Envelope 
                  size={24} 
                  weight="duotone" 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-400" 
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-4 py-4 bg-dark-800 border border-dark-700 rounded-full text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white mb-3">
                Senha
              </label>
              <div className="relative">
                <Lock 
                  size={24} 
                  weight="duotone" 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dark-400" 
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-14 py-4 bg-dark-800 border border-dark-700 rounded-full text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeSlash size={24} weight="duotone" />
                  ) : (
                    <Eye size={24} weight="duotone" />
                  )}
                </button>
              </div>
            </div>

            {/* Botão de Login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-600 disabled:bg-primary-700 text-white font-semibold py-4 px-6 rounded-full transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed text-lg shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-8 text-center space-y-3">
            <a href="#" className="text-primary hover:text-primary-400 text-base transition-colors font-medium">
              Esqueceu a senha?
            </a>
            <div className="pt-2">
              <a 
                href="/dashboard" 
                className="text-dark-400 hover:text-white text-sm transition-colors underline"
              >
                Acessar Dashboard (Dev)
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Full-Width */}
      <footer className="w-full bg-dark-800 border-t border-dark-700 py-4 px-6">
        <div className="flex justify-between items-center text-sm max-w-6xl mx-auto">
          <div className="text-dark-300 leading-relaxed">
            © 2025 Wdezoito Tecnologia.<br />
            Todos os direitos reservados.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-dark-300 hover:text-white transition-colors underline">
              Termos
            </a>
            <a href="#" className="text-dark-300 hover:text-white transition-colors underline">
              Privacidade
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
