import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { FormInput } from '@/components/FormInput';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Envelope, Lock, Eye, EyeSlash, CheckCircle } from '@phosphor-icons/react';

interface AcceptInviteForm {
  password: string;
  confirmPassword: string;
}

const validationRules = {
  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      if (value.length < 8) {
        return 'Senha deve ter pelo menos 8 caracteres';
      }
      return null;
    }
  },
  confirmPassword: {
    required: true,
    custom: (value: string, allValues: AcceptInviteForm) => {
      if (value !== allValues.password) {
        return 'As senhas não coincidem';
      }
      return null;
    }
  }
}

export default function AcceptInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  
  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    getFieldProps
  } = useFormValidation<AcceptInviteForm>(
    { password: '', confirmPassword: '' },
    validationRules
  );

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      validateToken(tokenParam);
    } else {
      setIsValidatingToken(false);
      setIsValidToken(false);
    }
  }, [searchParams]);

  const validateToken = async (token: string) => {
    try {
      // Aqui você pode fazer uma chamada para a API para validar o token
      // Por enquanto, vamos assumir que o token é válido se existe
      setIsValidToken(true);
    } catch (error) {
      setIsValidToken(false);
      toast.error('Token de convite inválido ou expirado');
    } finally {
      setIsValidatingToken(false);
    }
  };

  const onSubmit = async (formData: AcceptInviteForm) => {
    if (!token) {
      toast.error('Token de convite não encontrado');
      return;
    }

    try {
      // Aqui você faria a chamada para a API para aceitar o convite
      // await api.post('/clients/accept-invite', {
      //   token,
      //   password: formData.password
      // });

      // Simular sucesso por enquanto
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Conta ativada com sucesso! Redirecionando...', {
        duration: 3000,
      });
      
      // Redirecionar para login
      setTimeout(() => navigate('/login'), 1000);
      
    } catch (error: any) {
      toast.error(error.message || 'Erro ao ativar conta. Tente novamente.', {
        duration: 5000,
      });
    }
  };

  const passwordField = getFieldProps('password');
  const confirmPasswordField = getFieldProps('confirmPassword');

  if (isValidatingToken) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'} flex flex-col`}>
        <header className="p-6">
          <div className="flex justify-end">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Validando convite...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'} flex flex-col`}>
        <header className="p-6">
          <div className="flex justify-end">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Convite Inválido</h1>
            <p className="text-gray-600 mb-6">
              Este convite é inválido ou expirou. Entre em contato conosco para solicitar um novo convite.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary-600 transition-colors"
            >
              Ir para Login
            </button>
          </div>
        </main>
      </div>
    );
  }

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
              Ativar Conta
            </h1>
            <p className="text-primary text-lg font-medium">Defina sua senha para começar</p>
          </div>

          {/* Formulário */}
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(onSubmit);
          }} className="space-y-6">
            
            <div className="space-y-2">
              <div className="relative">
                <FormInput
                  label="Nova Senha"
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

            <div className="space-y-2">
              <div className="relative">
                <FormInput
                  label="Confirmar Senha"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  icon={Lock}
                  value={confirmPasswordField.value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => confirmPasswordField.onChange(e.target.value)}
                  onBlur={confirmPasswordField.onBlur}
                  error={confirmPasswordField.error}
                  hasError={confirmPasswordField.hasError}
                />
                
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 ${
                    theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-dark-600 hover:text-dark-900'
                  } transition-colors`}
                >
                  {showConfirmPassword ? <EyeSlash size={20} weight="duotone" /> : <Eye size={20} weight="duotone" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary-600 disabled:bg-primary-400 text-white font-semibold py-3 px-6 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Ativando...' : 'Ativar Conta'}
            </button>
          </form>

          {/* Informações */}
          <div className="mt-6 text-center">
            <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
              Ao ativar sua conta, você concorda com nossos termos de uso.
            </p>
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
  );
}
