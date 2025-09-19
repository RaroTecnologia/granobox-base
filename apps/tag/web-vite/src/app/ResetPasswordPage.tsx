import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeSlash, CheckCircle, XCircle, ArrowLeft } from '@phosphor-icons/react';
import { useTheme } from '@/contexts/ThemeContext';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';

export default function ResetPasswordPage() {
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      toast.error('Token de recuperação não encontrado');
      navigate('/login');
    }
  }, [searchParams, navigate]);

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);

    if (!minLength) return 'Senha deve ter no mínimo 8 caracteres';
    if (!hasLower) return 'Senha deve conter pelo menos uma letra minúscula';
    if (!hasUpper) return 'Senha deve conter pelo menos uma letra maiúscula';
    if (!hasNumber) return 'Senha deve conter pelo menos um número';
    if (!hasSpecial) return 'Senha deve conter pelo menos um caractere especial (@$!%*?&)';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: typeof errors = {};

    // Validar nova senha
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      newErrors.newPassword = passwordError;
    }

    // Validar confirmação
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword,
        confirmPassword,
      });
      
      setIsSuccess(true);
      toast.success('Senha redefinida com sucesso!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao redefinir senha';
      setErrors({ general: errorMessage });
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
              Senha Redefinida!
            </h1>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-dark-400' : 'text-dark-600'
            }`}>
              Sua senha foi alterada com sucesso
            </p>
          </div>

          {/* Success Message */}
          <div className="text-center mb-8">
            <p className={`mb-4 ${
              theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
            }`}>
              Agora você pode fazer login com sua nova senha.
            </p>
          </div>

          {/* Actions */}
          <Link
            to="/login"
            className={`w-full py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center ${
              theme === 'dark'
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            Fazer Login
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
            <Lock size={32} className="text-primary" />
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-dark-900'
          }`}>
            Redefinir Senha
          </h1>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-dark-400' : 'text-dark-600'
          }`}>
            Digite sua nova senha
          </p>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center text-red-700">
              <XCircle size={16} className="mr-2" />
              <span className="text-sm">{errors.general}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nova Senha */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
            }`}>
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrors(prev => ({ ...prev, newPassword: undefined }));
                }}
                placeholder="Digite sua nova senha"
                className={`w-full px-4 py-3 pl-12 pr-12 rounded-xl border transition-colors ${
                  errors.newPassword
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : theme === 'dark'
                    ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400 focus:border-primary focus:ring-primary/20'
                    : 'bg-white border-light-300 text-dark-900 placeholder-dark-400 focus:border-primary focus:ring-primary/20'
                } focus:outline-none focus:ring-4`}
                disabled={isLoading}
              />
              <Lock size={20} className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
                theme === 'dark' ? 'text-dark-400' : 'text-dark-500'
              }`} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
                  theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-500 hover:text-dark-700'
                }`}
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.newPassword && (
              <div className="flex items-center mt-2 text-red-500 text-sm">
                <XCircle size={16} className="mr-1" />
                {errors.newPassword}
              </div>
            )}
          </div>

          {/* Confirmar Senha */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
            }`}>
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                }}
                placeholder="Confirme sua nova senha"
                className={`w-full px-4 py-3 pl-12 pr-12 rounded-xl border transition-colors ${
                  errors.confirmPassword
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : theme === 'dark'
                    ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400 focus:border-primary focus:ring-primary/20'
                    : 'bg-white border-light-300 text-dark-900 placeholder-dark-400 focus:border-primary focus:ring-primary/20'
                } focus:outline-none focus:ring-4`}
                disabled={isLoading}
              />
              <Lock size={20} className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
                theme === 'dark' ? 'text-dark-400' : 'text-dark-500'
              }`} />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
                  theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-500 hover:text-dark-700'
                }`}
              >
                {showConfirmPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="flex items-center mt-2 text-red-500 text-sm">
                <XCircle size={16} className="mr-1" />
                {errors.confirmPassword}
              </div>
            )}
          </div>

          {/* Password Requirements */}
          <div className={`p-4 rounded-xl ${
            theme === 'dark' ? 'bg-dark-700' : 'bg-light-50'
          }`}>
            <p className={`text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-dark-300' : 'text-dark-700'
            }`}>
              A senha deve conter:
            </p>
            <ul className={`text-sm space-y-1 ${
              theme === 'dark' ? 'text-dark-400' : 'text-dark-600'
            }`}>
              <li>• No mínimo 8 caracteres</li>
              <li>• Pelo menos uma letra minúscula</li>
              <li>• Pelo menos uma letra maiúscula</li>
              <li>• Pelo menos um número</li>
              <li>• Pelo menos um caractere especial (@$!%*?&)</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-all ${
              isLoading
                ? 'bg-primary/50 cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 hover:shadow-lg'
            } text-white flex items-center justify-center`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Redefinindo...
              </>
            ) : (
              <>
                <Lock size={20} className="mr-2" />
                Redefinir Senha
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            to="/login"
            className={`inline-flex items-center text-sm font-medium transition-colors ${
              theme === 'dark'
                ? 'text-dark-400 hover:text-white'
                : 'text-dark-600 hover:text-dark-900'
            }`}
          >
            <ArrowLeft size={16} className="mr-1" />
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}








