import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  User, 
  PencilSimple, 
  FloppyDisk, 
  X, 
  Sun, 
  Moon, 
  Lock, 
  Eye, 
  EyeSlash,
  ArrowLeft
} from '@phosphor-icons/react'
import { toast } from 'react-hot-toast'
import FooterNavigation from '@/components/FooterNavigation'

export default function PerfilPage() {
  const { theme, toggleTheme } = useTheme()
  const [editMode, setEditMode] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Estados para informações do usuário
  const [userInfo, setUserInfo] = useState({
    nome: 'João Silva',
    email: 'joao@granoboxtag.com.br',
    cargo: 'Administrador',
    telefone: '(11) 88888-8888',
    empresa: 'Granobox Tag',
    departamento: 'TI',
    dataAdmissao: '2024-01-15'
  })

  // Estados para alteração de senha
  const [passwordData, setPasswordData] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  })

  // Estados para preferências
  const [preferences, setPreferences] = useState({
    notificacoesEmail: true,
    notificacoesPush: true,
    relatoriosAutomaticos: false,
    idioma: 'pt-BR'
  })

  const handleSave = () => {
    setEditMode(false)
    toast.success('Perfil atualizado com sucesso!')
  }

  const handleCancel = () => {
    setEditMode(false)
    toast.error('Alterações canceladas')
  }

  const handlePasswordChange = () => {
    if (passwordData.novaSenha !== passwordData.confirmarSenha) {
      toast.error('As senhas não coincidem!')
      return
    }
    
    if (passwordData.novaSenha.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres!')
      return
    }

    // Aqui você implementaria a lógica de alteração de senha
    toast.success('Senha alterada com sucesso!')
    setPasswordData({
      senhaAtual: '',
      novaSenha: '',
      confirmarSenha: ''
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setUserInfo(prev => ({ ...prev, [field]: value }))
  }

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }))
  }

  const handlePreferenceChange = (field: string, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900 text-white' : 'bg-light-50 text-dark-900'} pb-20`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-b px-4 py-4 sticky top-0 z-10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <a 
              href="/dashboard"
              className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'}`}
            >
              <ArrowLeft size={24} weight="duotone" className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} />
            </a>
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <User size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Meu Perfil</h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                Gerencie suas informações pessoais
              </p>
            </div>
          </div>
          
          {/* Botão de Editar/Salvar */}
          <div className="flex items-center space-x-3">
            {editMode ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <X size={16} weight="duotone" />
                  <span>Cancelar</span>
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <FloppyDisk size={16} weight="duotone" />
                  <span>Salvar</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2"
              >
                <PencilSimple size={16} weight="duotone" />
                <span>Editar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="px-4 py-6 space-y-6">
        {/* Informações Pessoais */}
        <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 border shadow-xl`}>
          <h2 className="text-lg font-semibold mb-6">Informações Pessoais</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Nome Completo</label>
              {editMode ? (
                <input
                  type="text"
                  value={userInfo.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                    theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                  }`}
                />
              ) : (
                <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                  {userInfo.nome}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              {editMode ? (
                <input
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                    theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                  }`}
                />
              ) : (
                <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                  {userInfo.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cargo</label>
              {editMode ? (
                <input
                  type="text"
                  value={userInfo.cargo}
                  onChange={(e) => handleInputChange('cargo', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                    theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                  }`}
                />
              ) : (
                <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                  {userInfo.cargo}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Telefone</label>
              {editMode ? (
                <input
                  type="text"
                  value={userInfo.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                    theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                  }`}
                />
              ) : (
                <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                  {userInfo.telefone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Empresa</label>
              <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                {userInfo.empresa}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Departamento</label>
              <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                {userInfo.departamento}
              </p>
            </div>
          </div>
        </div>

        {/* Alterar Senha */}
        <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 border shadow-xl`}>
          <h2 className="text-lg font-semibold mb-6">Alterar Senha</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Senha Atual</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.senhaAtual}
                  onChange={(e) => handlePasswordInputChange('senhaAtual', e.target.value)}
                  placeholder="Digite sua senha atual"
                  className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                    theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showCurrentPassword ? (
                    <EyeSlash size={20} weight="duotone" className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} />
                  ) : (
                    <Eye size={20} weight="duotone" className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nova Senha</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.novaSenha}
                  onChange={(e) => handlePasswordInputChange('novaSenha', e.target.value)}
                  placeholder="Digite a nova senha"
                  className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                    theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showNewPassword ? (
                    <EyeSlash size={20} weight="duotone" className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} />
                  ) : (
                    <Eye size={20} weight="duotone" className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirmar Nova Senha</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmarSenha}
                  onChange={(e) => handlePasswordInputChange('confirmarSenha', e.target.value)}
                  placeholder="Confirme a nova senha"
                  className={`w-full px-4 py-3 pr-12 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                    theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeSlash size={20} weight="duotone" className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} />
                  ) : (
                    <Eye size={20} weight="duotone" className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={handlePasswordChange}
              className="w-full px-4 py-3 bg-primary hover:bg-primary-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Lock size={20} weight="duotone" />
              <span>Alterar Senha</span>
            </button>
          </div>
        </div>

        {/* Preferências */}
        <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 border shadow-xl`}>
          <h2 className="text-lg font-semibold mb-6">Preferências</h2>
          
          <div className="space-y-4">
            {/* Toggle de Tema */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {theme === 'dark' ? (
                  <Sun size={20} weight="duotone" className="text-yellow-400" />
                ) : (
                  <Moon size={20} weight="duotone" className="text-dark-600" />
                )}
                <span>Modo {theme === 'dark' ? 'Escuro' : 'Claro'}</span>
              </div>
              <button
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full transition-colors ${
                  theme === 'dark' ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Notificações por Email */}
            <div className="flex items-center justify-between">
              <span>Notificações por Email</span>
              <button
                onClick={() => handlePreferenceChange('notificacoesEmail', !preferences.notificacoesEmail)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  preferences.notificacoesEmail ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  preferences.notificacoesEmail ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Notificações Push */}
            <div className="flex items-center justify-between">
              <span>Notificações Push</span>
              <button
                onClick={() => handlePreferenceChange('notificacoesPush', !preferences.notificacoesPush)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  preferences.notificacoesPush ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  preferences.notificacoesPush ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Relatórios Automáticos */}
            <div className="flex items-center justify-between">
              <span>Relatórios Automáticos</span>
              <button
                onClick={() => handlePreferenceChange('relatoriosAutomaticos', !preferences.relatoriosAutomaticos)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  preferences.relatoriosAutomaticos ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  preferences.relatoriosAutomaticos ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <FooterNavigation />
    </div>
  )
}
