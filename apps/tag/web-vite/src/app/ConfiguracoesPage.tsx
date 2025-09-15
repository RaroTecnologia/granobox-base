import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useConfig } from '@/hooks/useConfig'
import { usePrinters } from '@/hooks/usePrinters'
import { 
  Gear, 
  Printer, 
  User, 
  Shield, 
  Database, 
  Sun, 
  Moon, 
  Bell, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  Download,
  Upload,
  Trash,
  Plus,
  PencilSimple,
  FloppyDisk,
  X,
  Warning,
  ArrowClockwise
} from '@phosphor-icons/react'
import { toast } from 'react-hot-toast'
import FooterNavigation from '@/components/FooterNavigation'

export default function ConfiguracoesPage() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const { 
    userProfile, 
    systemConfig, 
    printerConfig, 
    notificationConfig,
    isLoading,
    loadUserProfile,
    updateUserProfile,
    changePassword,
    loadSystemConfig,
    updateSystemConfig,
    loadPrinterConfig,
    updatePrinterConfig,
    testPrinter,
    loadNotificationConfig,
    updateNotificationConfig,
    uploadLogo
  } = useConfig()
  
  const { printers, loadPrinters } = usePrinters()
  
  const [activeTab, setActiveTab] = useState<'impressora' | 'sistema' | 'usuario' | 'usuarios' | 'backup'>('impressora')
  const [editMode, setEditMode] = useState<string | null>(null)
  
  // Estados para formulários
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Estado para formulário de edição do usuário
  const [userEditForm, setUserEditForm] = useState({
    name: '',
    email: '',
    role: '',
    phone: ''
  })

  // Carregar dados quando o componente montar
  useEffect(() => {
    if (user) {
      loadUserProfile()
      loadSystemConfig()
      loadPrinterConfig()
      loadNotificationConfig()
      loadPrinters()
    }
  }, [user])

  // Popular formulário de edição quando o perfil for carregado
  useEffect(() => {
    if (userProfile) {
      setUserEditForm({
        name: userProfile.name || '',
        email: userProfile.email || '',
        role: userProfile.role || '',
        phone: userProfile.phone ? formatPhone(userProfile.phone) : ''
      })
    }
  }, [userProfile])
  
  // Estados para configurações
  const [impressoraConfig, setImpressoraConfig] = useState({
    nome: 'Impressora Principal',
    ip: '192.168.1.100',
    porta: '9100',
    modelo: 'Zebra ZT230',
    ativa: true
  })
  
  const [sistemaConfig, setSistemaConfig] = useState({
    nomeEmpresa: 'Granobox Tag',
    cnpj: '12.345.678/0001-90',
    endereco: 'Rua das Etiquetas, 123',
    telefone: '(11) 99999-9999',
    email: 'contato@granoboxtag.com.br',
    logoColorida: null as string | null,
    logoMonocromatica: null as string | null
  })
  
  const [usuarioConfig, setUsuarioConfig] = useState({
    nome: 'Usuário Admin',
    email: 'admin@granoboxtag.com.br',
    cargo: 'Administrador',
    telefone: '(11) 88888-8888'
  })
  
  const [notificacoes, setNotificacoes] = useState({
    email: true,
    push: true,
    som: false,
    vencimento: 7
  })

  // Estados para gerenciamento de usuários
  const [usuarios, setUsuarios] = useState([
    {
      id: 1,
      nome: 'Admin Sistema',
      email: 'admin@granoboxtag.com.br',
      cargo: 'Administrador',
      nivel: 'admin',
      ativo: true,
      criadoEm: '2025-01-15',
      ultimoAcesso: '2025-08-21'
    },
    {
      id: 2,
      nome: 'João Silva',
      email: 'joao@granoboxtag.com.br',
      cargo: 'Operador',
      nivel: 'operador',
      ativo: true,
      criadoEm: '2025-02-10',
      ultimoAcesso: '2025-08-20'
    },
    {
      id: 3,
      nome: 'Maria Santos',
      email: 'maria@granoboxtag.com.br',
      cargo: 'Supervisor',
      nivel: 'supervisor',
      ativo: true,
      criadoEm: '2025-03-05',
      ultimoAcesso: '2025-08-19'
    },
    {
      id: 4,
      nome: 'Carlos Oliveira',
      email: 'carlos@granoboxtag.com.br',
      cargo: 'Operador',
      nivel: 'operador',
      ativo: false,
      criadoEm: '2025-01-20',
      ultimoAcesso: '2025-07-15'
    }
  ])

  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [userFormData, setUserFormData] = useState({
    nome: '',
    email: '',
    cargo: '',
    nivel: 'operador',
    senha: '',
    confirmarSenha: ''
  })

  const handleSave = async (section: string) => {
    try {
      switch (section) {
        case 'usuario':
          await updateUserProfile({
            name: userEditForm.name,
            email: userEditForm.email,
            phone: userEditForm.phone,
            role: userEditForm.role
          })
          break
        case 'sistema':
          if (systemConfig) {
            await updateSystemConfig({
              businessName: systemConfig.businessName,
              cnpj: systemConfig.cnpj,
              address: systemConfig.address,
              phone: systemConfig.phone,
              email: systemConfig.email
            })
          }
          break
        case 'impressora':
          if (printerConfig) {
            await updatePrinterConfig({
              name: printerConfig.name,
              ip: printerConfig.ip,
              port: printerConfig.port,
              model: printerConfig.model,
              isActive: printerConfig.isActive
            })
          }
          break
        default:
          toast.success('Configurações salvas com sucesso!')
      }
      setEditMode(null)
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
    }
  }

  const handleCancel = () => {
    setEditMode(null)
    // Resetar formulário de edição para os valores originais
    if (userProfile) {
      setUserEditForm({
        name: userProfile.name || '',
        email: userProfile.email || '',
        role: userProfile.role || '',
        phone: userProfile.phone ? formatPhone(userProfile.phone) : ''
      })
    }
    toast.error('Alterações canceladas')
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('As senhas não coincidem!')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres!')
      return
    }

    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
    }
  }

  // Função para aplicar máscara de telefone
  const formatPhone = (value: string) => {
    // Remove todos os caracteres não numéricos
    const numbers = value.replace(/\D/g, '')
    
    // Aplica a máscara baseada no tamanho
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    } else if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
    }
  }

  // Função para lidar com mudança no telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setUserEditForm(prev => ({ ...prev, phone: formatted }))
  }

  // Funções para upload de logos
  const handleLogoUpload = (tipo: 'colorida' | 'monocromatica', file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error('Arquivo muito grande. Máximo 5MB.')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Apenas arquivos de imagem são permitidos.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (tipo === 'colorida') {
        setSistemaConfig(prev => ({ ...prev, logoColorida: result }))
        toast.success('Logo colorida atualizada!')
      } else {
        setSistemaConfig(prev => ({ ...prev, logoMonocromatica: result }))
        toast.success('Logo monocromática atualizada!')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleLogoRemove = (tipo: 'colorida' | 'monocromatica') => {
    if (tipo === 'colorida') {
      setSistemaConfig(prev => ({ ...prev, logoColorida: null }))
      toast.success('Logo colorida removida!')
    } else {
      setSistemaConfig(prev => ({ ...prev, logoMonocromatica: null }))
      toast.success('Logo monocromática removida!')
    }
  }

  const testarImpressora = async () => {
    try {
      await testPrinter()
    } catch (error) {
      console.error('Erro ao testar impressora:', error)
    }
  }

  // Funções para gerenciamento de usuários
  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (userFormData.senha !== userFormData.confirmarSenha) {
      toast.error('As senhas não coincidem!')
      return
    }

    if (editingUser) {
      // Editar usuário existente
      setUsuarios(prev => prev.map(user => 
        user.id === editingUser.id 
          ? { ...user, ...userFormData, id: editingUser.id }
          : user
      ))
      toast.success('Usuário atualizado com sucesso!')
    } else {
      // Criar novo usuário
      const newUser = {
        id: Math.max(...usuarios.map(u => u.id)) + 1,
        ...userFormData,
        ativo: true,
        criadoEm: new Date().toISOString().split('T')[0],
        ultimoAcesso: 'Nunca'
      }
      setUsuarios(prev => [...prev, newUser])
      toast.success('Usuário criado com sucesso!')
    }

    setShowUserModal(false)
    setEditingUser(null)
    setUserFormData({
      nome: '',
      email: '',
      cargo: '',
      nivel: 'operador',
      senha: '',
      confirmarSenha: ''
    })
  }

  const handleEditUser = (user: any) => {
    setEditingUser(user)
    setUserFormData({
      nome: user.nome,
      email: user.email,
      cargo: user.cargo,
      nivel: user.nivel,
      senha: '',
      confirmarSenha: ''
    })
    setShowUserModal(true)
  }

  const handleToggleUserStatus = (userId: number) => {
    setUsuarios(prev => prev.map(user =>
      user.id === userId ? { ...user, ativo: !user.ativo } : user
    ))
    const user = usuarios.find(u => u.id === userId)
    toast.success(`Usuário ${user?.ativo ? 'desativado' : 'ativado'} com sucesso!`)
  }

  const handleDeleteUser = (userId: number) => {
    if (userId === 1) {
      toast.error('Não é possível excluir o administrador principal!')
      return
    }
    setUsuarios(prev => prev.filter(user => user.id !== userId))
    toast.success('Usuário excluído com sucesso!')
  }

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'admin':
        return 'bg-primary text-white'
      case 'supervisor':
        return 'bg-primary text-white'
      case 'operador':
        return 'bg-primary text-white'
      default:
        return 'bg-primary text-white'
    }
  }

  const getNivelLabel = (nivel: string) => {
    switch (nivel) {
      case 'admin':
        return 'Administrador'
      case 'supervisor':
        return 'Supervisor'
      case 'operador':
        return 'Operador'
      default:
        return 'Não definido'
    }
  }

  const tabs = [
    { id: 'impressora', label: 'Impressoras', icon: Printer },
    { id: 'sistema', label: 'Sistema', icon: Gear },
    { id: 'usuario', label: 'Usuário', icon: User },
    { id: 'usuarios', label: 'Usuários', icon: User },
    { id: 'backup', label: 'Backup', icon: Database }
  ]

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900 text-white' : 'bg-light-50 text-dark-900'} pb-20`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-b px-4 py-4 sticky top-0 z-10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Gear size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Configurações</h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                Gerencie as configurações do sistema
              </p>
            </div>
          </div>
          
          {/* Toggle de Tema */}
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'}`}
          >
            {theme === 'dark' ? (
              <Sun size={24} weight="duotone" className="text-yellow-400" />
            ) : (
              <Moon size={24} weight="duotone" className="text-dark-600" />
            )}
          </button>
        </div>
      </header>

      {/* Tabs de Navegação */}
      <div className="px-4 py-4">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg'
                  : `${theme === 'dark' ? 'bg-dark-700 text-dark-300 hover:bg-dark-600' : 'bg-light-100 text-dark-600 hover:bg-light-200'}`
              }`}
            >
              <tab.icon size={16} weight="duotone" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      <main className="px-4 pb-4">
        {/* Tab Impressora */}
        {activeTab === 'impressora' && (
          <div className="space-y-6 animate-fade-in-up">

            {/* Lista de Impressoras */}
            <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 border shadow-xl`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Impressoras Configuradas</h2>
                <button
                  onClick={() => navigate('/adicionar-impressora')}
                  className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Adicionar</span>
                </button>
              </div>

              <div className="space-y-4">
                {printers.length === 0 ? (
                  <div className="text-center py-8">
                    <Printer size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Nenhuma impressora configurada</p>
                    <p className="text-sm text-gray-400 mt-2">Clique em "Adicionar" para criar sua primeira impressora</p>
                  </div>
                ) : (
                  printers.map((printer) => {
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'online': return 'bg-green-500'
                        case 'offline': return 'bg-red-500'
                        case 'connecting': return 'bg-yellow-500'
                        default: return 'bg-gray-500'
                      }
                    }

                    const getStatusText = (status: string) => {
                      switch (status) {
                        case 'online': return 'Online'
                        case 'offline': return 'Offline'
                        case 'connecting': return 'Conectando'
                        default: return 'Desconhecido'
                      }
                    }

                    const getStatusTextColor = (status: string) => {
                      switch (status) {
                        case 'online': return 'text-green-600'
                        case 'offline': return 'text-red-600'
                        case 'connecting': return 'text-yellow-600'
                        default: return 'text-gray-600'
                      }
                    }

                    return (
                      <div key={printer.id} className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-light-50 border-light-300'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-2 h-2 ${getStatusColor(printer.status)} rounded-full`}></div>
                            <div>
                              <p className="font-medium">{printer.name}</p>
                              <p className="text-sm text-gray-500">
                                {printer.ip}:{printer.port} - {printer.model}
                                {printer.location && ` (${printer.location})`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${getStatusTextColor(printer.status)}`}>
                              {getStatusText(printer.status)}
                            </span>
                            <button 
                              onClick={() => navigate(`/configurar-impressora/${printer.id}`)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <PencilSimple size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Estatísticas */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className={`p-3 rounded-lg text-center ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                  <p className="text-2xl font-bold text-green-600">
                    {printers.filter(p => p.status === 'online').length}
                  </p>
                  <p className="text-sm text-gray-500">Online</p>
                </div>
                <div className={`p-3 rounded-lg text-center ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                  <p className="text-2xl font-bold text-red-600">
                    {printers.filter(p => p.status === 'offline').length}
                  </p>
                  <p className="text-sm text-gray-500">Offline</p>
                </div>
                <div className={`p-3 rounded-lg text-center ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                  <p className="text-2xl font-bold text-blue-600">{printers.length}</p>
                  <p className="text-sm text-gray-500">Total</p>
                </div>
              </div>

              {/* Botões de Ação */}
              {editMode === 'impressora' && (
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleSave('impressora')}
                    className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-full text-sm font-medium transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Sistema */}
        {activeTab === 'sistema' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 border shadow-xl`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Informações da Empresa</h2>
                <button
                  onClick={() => setEditMode('sistema')}
                  disabled={isLoading}
                  className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <PencilSimple size={16} weight="duotone" />
                  <span>Editar</span>
                </button>
              </div>

              {isLoading && !systemConfig ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Carregando configurações...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome da Empresa</label>
                    {editMode === 'sistema' ? (
                      <input
                        type="text"
                        value={systemConfig?.businessName || ''}
                        onChange={(e) => setSystemConfig(prev => prev ? { ...prev, businessName: e.target.value } : null)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                          theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                        }`}
                      />
                    ) : (
                      <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                        {systemConfig?.businessName || 'Carregando...'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">CNPJ</label>
                    {editMode === 'sistema' ? (
                      <input
                        type="text"
                        value={systemConfig?.cnpj || ''}
                        onChange={(e) => setSystemConfig(prev => prev ? { ...prev, cnpj: e.target.value } : null)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                          theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                        }`}
                      />
                    ) : (
                      <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                        {systemConfig?.cnpj || 'Carregando...'}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Endereço</label>
                    {editMode === 'sistema' ? (
                      <input
                        type="text"
                        value={systemConfig?.address || ''}
                        onChange={(e) => setSystemConfig(prev => prev ? { ...prev, address: e.target.value } : null)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                          theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                        }`}
                      />
                    ) : (
                      <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                        {systemConfig?.address || 'Carregando...'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Telefone</label>
                    {editMode === 'sistema' ? (
                      <input
                        type="text"
                        value={systemConfig?.phone || ''}
                        onChange={(e) => setSystemConfig(prev => prev ? { ...prev, phone: e.target.value } : null)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                          theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                        }`}
                      />
                    ) : (
                      <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                        {systemConfig?.phone || 'Carregando...'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    {editMode === 'sistema' ? (
                      <input
                        type="email"
                        value={systemConfig?.email || ''}
                        onChange={(e) => setSystemConfig(prev => prev ? { ...prev, email: e.target.value } : null)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                          theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                        }`}
                      />
                    ) : (
                      <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                        {systemConfig?.email || 'Carregando...'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              {editMode === 'sistema' && (
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleSave('sistema')}
                    disabled={isLoading}
                    className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              )}
            </div>

            {/* Seção de Logos */}
            <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 border shadow-xl`}>
              <h3 className="text-lg font-semibold mb-4">Logos da Empresa</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Colorida */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Logo Colorida</h4>
                    <span className="text-xs text-primary">Para relatórios e interface</span>
                  </div>
                  
                  <div className="space-y-3">
                    {sistemaConfig.logoColorida ? (
                      <div className="relative">
                        <img 
                          src={sistemaConfig.logoColorida} 
                          alt="Logo Colorida"
                          className="w-full h-32 object-contain rounded-xl border-2 border-dashed border-gray-300"
                        />
                        <button
                          onClick={() => handleLogoRemove('colorida')}
                          className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                          title="Remover logo"
                        >
                          <X size={16} weight="duotone" />
                        </button>
                      </div>
                    ) : (
                      <div className={`w-full h-32 border-2 border-dashed rounded-xl flex items-center justify-center ${
                        theme === 'dark' ? 'border-dark-600 bg-dark-700' : 'border-gray-300 bg-gray-50'
                      }`}>
                        <div className="text-center">
                          <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                            theme === 'dark' ? 'bg-dark-600' : 'bg-gray-200'
                          }`}>
                            <Upload size={24} weight="duotone" className="text-primary" />
                          </div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-gray-500'}`}>
                            Nenhuma logo carregada
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleLogoUpload('colorida', file)
                        }}
                        className="hidden"
                      />
                      <div className={`w-full px-4 py-3 text-center rounded-xl cursor-pointer transition-colors ${
                        sistemaConfig.logoColorida
                          ? 'bg-primary hover:bg-primary-600 text-white'
                          : `${theme === 'dark' ? 'bg-dark-700 hover:bg-dark-600' : 'bg-gray-100 hover:bg-gray-200'} text-primary`
                      }`}>
                        {sistemaConfig.logoColorida ? 'Alterar Logo' : 'Carregar Logo'}
                      </div>
                    </label>
                    
                    <p className={`text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-gray-500'}`}>
                      PNG, JPG ou SVG • Máximo 5MB • Recomendado: 300x100px
                    </p>
                  </div>
                </div>

                {/* Logo Monocromática */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Logo Monocromática</h4>
                    <span className="text-xs text-primary">Para impressão de etiquetas</span>
                  </div>
                  
                  <div className="space-y-3">
                    {sistemaConfig.logoMonocromatica ? (
                      <div className="relative">
                        <img 
                          src={sistemaConfig.logoMonocromatica} 
                          alt="Logo Monocromática"
                          className="w-full h-32 object-contain rounded-xl border-2 border-dashed border-gray-300"
                        />
                        <button
                          onClick={() => handleLogoRemove('monocromatica')}
                          className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                          title="Remover logo"
                        >
                          <X size={16} weight="duotone" />
                        </button>
                      </div>
                    ) : (
                      <div className={`w-full h-32 border-2 border-dashed rounded-xl flex items-center justify-center ${
                        theme === 'dark' ? 'border-dark-600 bg-dark-700' : 'border-gray-300 bg-gray-50'
                      }`}>
                        <div className="text-center">
                          <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                            theme === 'dark' ? 'bg-dark-600' : 'bg-gray-200'
                          }`}>
                            <Upload size={24} weight="duotone" className="text-primary" />
                          </div>
                          <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-gray-500'}`}>
                            Nenhuma logo carregada
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleLogoUpload('monocromatica', file)
                        }}
                        className="hidden"
                      />
                      <div className={`w-full px-4 py-3 text-center rounded-xl cursor-pointer transition-colors ${
                        sistemaConfig.logoMonocromatica
                          ? 'bg-primary hover:bg-primary-600 text-white'
                          : `${theme === 'dark' ? 'bg-dark-700 hover:bg-dark-600' : 'bg-gray-100 hover:bg-gray-200'} text-primary`
                      }`}>
                        {sistemaConfig.logoMonocromatica ? 'Alterar Logo' : 'Carregar Logo'}
                      </div>
                    </label>
                    
                    <p className={`text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-gray-500'}`}>
                      PNG, JPG ou SVG • Máximo 5MB • Recomendado: 300x100px • Preto e branco
                    </p>
                  </div>
                </div>
              </div>

              {/* Informações sobre as logos */}
              <div className={`mt-6 p-4 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-gray-50'}`}>
                <h5 className="font-medium mb-2">Sobre as Logos</h5>
                <ul className={`text-sm space-y-1 ${theme === 'dark' ? 'text-dark-300' : 'text-gray-600'}`}>
                  <li>• <strong>Logo Colorida:</strong> Usada em relatórios, dashboard e interface do sistema</li>
                  <li>• <strong>Logo Monocromática:</strong> Usada na impressão de etiquetas (preto e branco)</li>
                  <li>• Formatos aceitos: PNG, JPG, SVG</li>
                  <li>• Tamanho máximo: 5MB por arquivo</li>
                  <li>• Dimensões recomendadas: 300x100px para melhor qualidade</li>
                </ul>
              </div>
            </div>

            {/* Configurações de Notificações */}
            <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 border shadow-xl`}>
              <h3 className="text-lg font-semibold mb-4">Notificações</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell size={20} weight="duotone" className="text-primary" />
                    <span>Notificações por Email</span>
                  </div>
                  <button
                    onClick={() => setNotificacoes(prev => ({ ...prev, email: !prev.email }))}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      notificacoes.email ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      notificacoes.email ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell size={20} weight="duotone" className="text-primary" />
                    <span>Notificações Push</span>
                  </div>
                  <button
                    onClick={() => setNotificacoes(prev => ({ ...prev, push: !prev.push }))}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      notificacoes.push ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      notificacoes.push ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell size={20} weight="duotone" className="text-primary" />
                    <span>Som de Notificação</span>
                  </div>
                  <button
                    onClick={() => setNotificacoes(prev => ({ ...prev, som: !prev.som }))}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      notificacoes.som ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      notificacoes.som ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Warning size={20} weight="duotone" className="text-primary" />
                    <span>Alerta de Vencimento (dias)</span>
                  </div>
                  <input
                    type="number"
                    value={notificacoes.vencimento}
                    onChange={(e) => setNotificacoes(prev => ({ ...prev, vencimento: parseInt(e.target.value) || 7 }))}
                    min="1"
                    max="30"
                    className={`w-20 px-3 py-2 rounded-xl border-2 text-center ${
                      theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Usuário */}
        {activeTab === 'usuario' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 border shadow-xl`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Perfil do Usuário</h2>
                <button
                  onClick={() => setEditMode('usuario')}
                  disabled={isLoading}
                  className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <PencilSimple size={16} weight="duotone" />
                  <span>Editar</span>
                </button>
              </div>

              {isLoading && !userProfile ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Carregando perfil...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome Completo</label>
                    {editMode === 'usuario' ? (
                      <input
                        type="text"
                        value={userEditForm.name}
                        onChange={(e) => setUserEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                          theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                        }`}
                      />
                    ) : (
                      <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                        {userProfile?.name || 'Carregando...'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    {editMode === 'usuario' ? (
                      <input
                        type="email"
                        value={userEditForm.email}
                        onChange={(e) => setUserEditForm(prev => ({ ...prev, email: e.target.value }))}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                          theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                        }`}
                      />
                    ) : (
                      <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                        {userProfile?.email || 'Carregando...'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Perfil</label>
                    {editMode === 'usuario' ? (
                      <select
                        value={userEditForm.role}
                        onChange={(e) => setUserEditForm(prev => ({ ...prev, role: e.target.value }))}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                          theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                        }`}
                      >
                        <option value="admin">Administrador</option>
                        <option value="manager">Gerente</option>
                        <option value="support">Suporte</option>
                        <option value="sales">Vendas</option>
                        <option value="viewer">Visualizador</option>
                      </select>
                    ) : (
                      <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                        {userProfile?.role === 'admin' && 'Administrador'}
                        {userProfile?.role === 'manager' && 'Gerente'}
                        {userProfile?.role === 'support' && 'Suporte'}
                        {userProfile?.role === 'sales' && 'Vendas'}
                        {userProfile?.role === 'viewer' && 'Visualizador'}
                        {!userProfile?.role && 'Carregando...'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Telefone</label>
                    {editMode === 'usuario' ? (
                      <input
                        type="text"
                        value={userEditForm.phone}
                        onChange={handlePhoneChange}
                        placeholder="(11) 99999-9999"
                        maxLength={15}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                          theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                        }`}
                      />
                    ) : (
                      <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                        {userProfile?.phone || 'Não informado'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              {editMode === 'usuario' && (
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleSave('usuario')}
                    disabled={isLoading}
                    className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              )}
            </div>

            {/* Alterar Senha */}
            <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 border shadow-xl`}>
              <h3 className="text-lg font-semibold mb-4">Alterar Senha</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Senha Atual</label>
                  <input
                    type="password"
                    placeholder="Digite sua senha atual"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                      theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nova Senha</label>
                  <input
                    type="password"
                    placeholder="Digite a nova senha"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                      theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    placeholder="Confirme a nova senha"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                      theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                    }`}
                  />
                </div>
                <button 
                  onClick={handleChangePassword}
                  disabled={isLoading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="w-full px-4 py-3 bg-primary hover:bg-primary-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Usuários */}
        {activeTab === 'usuarios' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Cabeçalho com botão de adicionar */}
            <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 border shadow-xl`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Gerenciamento de Usuários</h2>
                  <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                    Gerencie usuários e seus níveis de acesso
                  </p>
                </div>
                <button
                  onClick={() => setShowUserModal(true)}
                  className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <Plus size={16} weight="duotone" />
                  <span>Novo Usuário</span>
                </button>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className={`${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'} rounded-xl p-4`}>
                  <div className="text-2xl font-bold text-primary">{usuarios.length}</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Total</div>
                </div>
                <div className={`${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'} rounded-xl p-4`}>
                  <div className="text-2xl font-bold text-primary">{usuarios.filter(u => u.ativo).length}</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Ativos</div>
                </div>
                <div className={`${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'} rounded-xl p-4`}>
                  <div className="text-2xl font-bold text-primary">{usuarios.filter(u => u.nivel === 'admin').length}</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Admins</div>
                </div>
                <div className={`${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'} rounded-xl p-4`}>
                  <div className="text-2xl font-bold text-primary">{usuarios.filter(u => u.nivel === 'operador').length}</div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>Operadores</div>
                </div>
              </div>

              {/* Lista de usuários */}
              <div className="space-y-3">
                {usuarios.map((usuario) => (
                  <div
                    key={usuario.id}
                    className={`${theme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-light-100 border-light-200'} rounded-xl p-4 border transition-all hover:shadow-lg`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                          <User size={24} weight="duotone" className="text-primary" />
                        </div>
                        
                        {/* Informações do usuário */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                              {usuario.nome}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNivelColor(usuario.nivel)}`}>
                              {getNivelLabel(usuario.nivel)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              usuario.ativo 
                                ? 'bg-primary/20 text-primary' 
                                : 'bg-dark-400 text-dark-300'
                            }`}>
                              {usuario.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} mt-1`}>
                            <span>{usuario.email}</span> • <span>{usuario.cargo}</span>
                          </div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-dark-500' : 'text-dark-500'} mt-1`}>
                            Criado em {new Date(usuario.criadoEm).toLocaleDateString('pt-BR')} • Último acesso: {usuario.ultimoAcesso !== 'Nunca' ? new Date(usuario.ultimoAcesso).toLocaleDateString('pt-BR') : 'Nunca'}
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditUser(usuario)}
                          className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-dark-600' : 'hover:bg-light-200'}`}
                          title="Editar usuário"
                        >
                          <PencilSimple size={16} weight="duotone" className="text-primary" />
                        </button>
                        
                        <button
                          onClick={() => handleToggleUserStatus(usuario.id)}
                          className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-dark-600' : 'hover:bg-light-200'}`}
                          title={usuario.ativo ? 'Desativar usuário' : 'Ativar usuário'}
                        >
                          {usuario.ativo ? (
                            <XCircle size={16} weight="duotone" className="text-primary" />
                          ) : (
                            <CheckCircle size={16} weight="duotone" className="text-primary" />
                          )}
                        </button>

                        {usuario.id !== 1 && (
                          <button
                            onClick={() => handleDeleteUser(usuario.id)}
                            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-dark-600' : 'hover:bg-light-200'}`}
                            title="Excluir usuário"
                          >
                            <Trash size={16} weight="duotone" className="text-primary" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seção de Permissões por Nível */}
            <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 border shadow-xl`}>
              <h3 className="text-lg font-semibold mb-4">Níveis de Acesso e Permissões</h3>
              
              <div className="space-y-4">
                {/* Administrador */}
                <div className={`${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'} rounded-xl p-4`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="px-3 py-1 bg-primary text-white rounded-full text-sm font-medium">
                      Administrador
                    </span>
                    <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                      Acesso total ao sistema
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>✓ Criar etiquetas</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>✓ Gerenciar usuários</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>✓ Configurações</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>✓ Relatórios</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>✓ Backup</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>✓ Cadastros</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>✓ Impressoras</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>✓ Alertas</span>
                  </div>
                </div>

                {/* Supervisor */}
                <div className={`${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'} rounded-xl p-4`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="px-3 py-1 bg-primary text-white rounded-full text-sm font-medium">
                      Supervisor
                    </span>
                    <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                      Acesso limitado a operações e relatórios
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>✓ Criar etiquetas</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>✗ Gerenciar usuários</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>~ Configurações</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>✓ Relatórios</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>✗ Backup</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>✓ Cadastros</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>~ Impressoras</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>✓ Alertas</span>
                  </div>
                </div>

                {/* Operador */}
                <div className={`${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'} rounded-xl p-4`}>
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="px-3 py-1 bg-primary text-white rounded-full text-sm font-medium">
                      Operador
                    </span>
                    <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                      Acesso básico para operações diárias
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>✓ Criar etiquetas</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>✗ Gerenciar usuários</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>✗ Configurações</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>~ Relatórios</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>✗ Backup</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>~ Cadastros</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>✗ Impressoras</span>
                    <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-700'}`}>✓ Alertas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Backup */}
        {activeTab === 'backup' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 border shadow-xl`}>
              <h2 className="text-xl font-semibold mb-6">Backup e Restauração</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Backup */}
                <div className={`${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'} rounded-xl p-6`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <Download size={24} weight="duotone" className="text-primary" />
                    <h3 className="text-lg font-semibold">Criar Backup</h3>
                  </div>
                  <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                    Faça backup de todos os dados do sistema
                  </p>
                  <button className="w-full px-4 py-3 bg-primary hover:bg-primary-600 text-white rounded-xl font-medium transition-colors">
                    Criar Backup
                  </button>
                </div>

                {/* Restauração */}
                <div className={`${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'} rounded-xl p-6`}>
                  <div className="flex items-center space-x-3 mb-4">
                    <Upload size={24} weight="duotone" className="text-primary" />
                    <h3 className="text-lg font-semibold">Restaurar Backup</h3>
                  </div>
                  <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                    Restaure dados de um backup anterior
                  </p>
                  <button className="w-full px-4 py-3 bg-dark-600 hover:bg-dark-500 text-white rounded-xl font-medium transition-colors">
                    Restaurar
                  </button>
                </div>
              </div>

              {/* Histórico de Backups */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Histórico de Backups</h3>
                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-4 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                    <div className="flex items-center space-x-3">
                      <Database size={20} weight="duotone" className="text-primary" />
                      <div>
                        <p className="font-medium">Backup Completo</p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                          21/08/2025 às 14:30
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-green-600 font-medium">2.5 MB</span>
                      <button className="p-2 hover:bg-dark-600 rounded-full transition-colors">
                        <Download size={16} weight="duotone" />
                      </button>
                      <button className="p-2 hover:bg-red-600 rounded-full transition-colors text-red-400">
                        <Trash size={16} weight="duotone" />
                      </button>
                    </div>
                  </div>

                  <div className={`flex items-center justify-between p-4 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                    <div className="flex items-center space-x-3">
                      <Database size={20} weight="duotone" className="text-primary" />
                      <div>
                        <p className="font-medium">Backup Incremental</p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                          20/08/2025 às 09:15
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-green-600 font-medium">1.2 MB</span>
                      <button className="p-2 hover:bg-dark-600 rounded-full transition-colors">
                        <Download size={16} weight="duotone" />
                      </button>
                      <button className="p-2 hover:bg-red-600 rounded-full transition-colors text-red-400">
                        <Trash size={16} weight="duotone" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      <FooterNavigation />

      {/* Modal de Usuário */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <button
                onClick={() => {
                  setShowUserModal(false)
                  setEditingUser(null)
                  setUserFormData({
                    nome: '',
                    email: '',
                    cargo: '',
                    nivel: 'operador',
                    senha: '',
                    confirmarSenha: ''
                  })
                }}
                className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'}`}
              >
                <X size={20} weight="duotone" className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} />
              </button>
            </div>

            <form onSubmit={handleUserSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={userFormData.nome}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: João Silva"
                  required
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark'
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                />
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Email *
                </label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Ex: joao@empresa.com"
                  required
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark'
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                />
              </div>

              {/* Cargo */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Cargo *
                </label>
                <input
                  type="text"
                  value={userFormData.cargo}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, cargo: e.target.value }))}
                  placeholder="Ex: Operador de Produção"
                  required
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark'
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                />
              </div>

              {/* Nível de Acesso */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Nível de Acesso *
                </label>
                <select
                  value={userFormData.nivel}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, nivel: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark'
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                >
                  <option value="operador">Operador</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrador</option>
                </select>
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  {userFormData.nivel === 'admin' && 'Acesso total ao sistema'}
                  {userFormData.nivel === 'supervisor' && 'Acesso limitado a operações e relatórios'}
                  {userFormData.nivel === 'operador' && 'Acesso básico para operações diárias'}
                </p>
              </div>

              {/* Senha */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  {editingUser ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha *'}
                </label>
                <input
                  type="password"
                  value={userFormData.senha}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, senha: e.target.value }))}
                  placeholder="Digite a senha"
                  required={!editingUser}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark'
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                />
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Confirmar Senha *
                </label>
                <input
                  type="password"
                  value={userFormData.confirmarSenha}
                  onChange={(e) => setUserFormData(prev => ({ ...prev, confirmarSenha: e.target.value }))}
                  placeholder="Confirme a senha"
                  required={!editingUser || userFormData.senha !== ''}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                    theme === 'dark'
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                      : 'bg-light-100 border-light-200 text-dark-900 focus:border-primary'
                  }`}
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false)
                    setEditingUser(null)
                    setUserFormData({
                      nome: '',
                      email: '',
                      cargo: '',
                      nivel: 'operador',
                      senha: '',
                      confirmarSenha: ''
                    })
                  }}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-full text-sm font-medium transition-colors"
                >
                  {editingUser ? 'Atualizar' : 'Criar'} Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
