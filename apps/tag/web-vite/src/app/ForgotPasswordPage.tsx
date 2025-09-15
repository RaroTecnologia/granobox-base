import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Envelope, CheckCircle, XCircle } from '@phosphor-icons/react';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email deve ter um formato válido');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setIsSuccess(true);
      toast.success('Instruções enviadas para seu email!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao enviar email de recuperação';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${
        theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'
      }`}>
        <div className={`w-full max-w-md ${
          theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
        } rounded-2xl border shadow-2xl p-8`}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h1 className={`text-2xl font-bold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-dark-900'
            }`}>
              Email Enviado!
            </h1>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-dark-400' : 'text-dark-600'
            }`}>
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </p>
          </div>

          {/* Back to Login */}
          <Link
            to="/login"
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 ${
              theme === 'dark' 
                ? 'bg-dark-700 hover:bg-dark-600 text-white border-dark-600' 
                : 'bg-light-100 hover:bg-light-200 text-dark-900 border-light-300'
            } border rounded-xl transition-colors font-medium`}
          >
            <ArrowLeft size={20} />
            <span>Voltar ao login</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${
      theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'
    }`}>
      <div className={`w-full max-w-md ${
        theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
      } rounded-2xl border shadow-2xl p-8`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Envelope size={32} className="text-primary" />
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-dark-900'
          }`}>
            Esqueceu sua senha?
          </h1>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-dark-400' : 'text-dark-600'
          }`}>
            Digite seu email e enviaremos instruções para redefinir sua senha.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
            }`}>
              Email
            </label>
            <div className="relative">
              <Envelope 
                size={20} 
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
                  theme === 'dark' ? 'text-dark-400' : 'text-dark-500'
                }`} 
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="seu@email.com"
                className={`w-full pl-12 pr-4 py-3 ${
                  theme === 'dark'
                    ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400'
                    : 'bg-light-50 border-light-300 text-dark-900 placeholder-dark-500'
                } border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                  error ? 'border-red-500 focus:ring-red-500' : ''
                }`}
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="flex items-center space-x-2 mt-2 text-red-500">
                <XCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
              isLoading || !email.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Enviando...</span>
              </div>
            ) : (
              'Enviar instruções'
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-8 text-center">
          <Link
            to="/login"
            className={`inline-flex items-center space-x-2 text-sm ${
              theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'
            } transition-colors`}
          >
            <ArrowLeft size={16} />
            <span>Voltar ao login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}