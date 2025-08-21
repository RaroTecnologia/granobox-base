import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
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
  Warning
} from '@phosphor-icons/react'
import { toast } from 'react-hot-toast'
import FooterNavigation from '@/components/FooterNavigation'

export default function ConfiguracoesPage() {
  const { theme, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<'impressora' | 'sistema' | 'usuario' | 'usuarios' | 'backup'>('impressora')
  const [editMode, setEditMode] = useState<string | null>(null)
  
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

  const handleSave = (section: string) => {
    setEditMode(null)
    toast.success('Configurações salvas com sucesso!')
  }

  const handleCancel = () => {
    setEditMode(null)
    toast.error('Alterações canceladas')
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

  const testarImpressora = () => {
    toast.loading('Testando impressora...')
    setTimeout(() => {
      toast.success('Impressora funcionando perfeitamente!')
    }, 2000)
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
    { id: 'impressora', label: 'Impressora', icon: Printer },
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
            <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 border shadow-xl`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Configurações da Impressora</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={testarImpressora}
                    className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <CheckCircle size={16} weight="duotone" />
                    <span>Testar</span>
                  </button>
                  <button
                    onClick={() => setEditMode('impressora')}
                    className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2"
                  >
                    <PencilSimple size={16} weight="duotone" />
                    <span>Editar</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome da Impressora</label>
                  {editMode === 'impressora' ? (
                    <input
                      type="text"
                      value={impressoraConfig.nome}
                      onChange={(e) => setImpressoraConfig(prev => ({ ...prev, nome: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                      }`}
                    />
                  ) : (
                    <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                      {impressoraConfig.nome}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Endereço IP</label>
                  {editMode === 'impressora' ? (
                    <input
                      type="text"
                      value={impressoraConfig.ip}
                      onChange={(e) => setImpressoraConfig(prev => ({ ...prev, ip: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                      }`}
                    />
                  ) : (
                    <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                      {impressoraConfig.ip}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Porta</label>
                  {editMode === 'impressora' ? (
                    <input
                      type="text"
                      value={impressoraConfig.porta}
                      onChange={(e) => setImpressoraConfig(prev => ({ ...prev, porta: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                      }`}
                    />
                  ) : (
                    <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                      {impressoraConfig.porta}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Modelo</label>
                  {editMode === 'impressora' ? (
                    <input
                      type="text"
                      value={impressoraConfig.modelo}
                      onChange={(e) => setImpressoraConfig(prev => ({ ...prev, modelo: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                      }`}
                    />
                  ) : (
                    <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                      {impressoraConfig.modelo}
                    </p>
                  )}
                </div>
              </div>

              {/* Status da Impressora */}
              <div className="mt-6 p-4 rounded-xl bg-green-50 border border-green-200">
                <div className="flex items-center space-x-3">
                  <CheckCircle size={20} weight="duotone" className="text-green-600" />
                  <span className="text-green-800 font-medium">Impressora Online e Funcionando</span>
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
                  className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <PencilSimple size={16} weight="duotone" />
                  <span>Editar</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome da Empresa</label>
                  {editMode === 'sistema' ? (
                    <input
                      type="text"
                      value={sistemaConfig.nomeEmpresa}
                      onChange={(e) => setSistemaConfig(prev => ({ ...prev, nomeEmpresa: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                      }`}
                    />
                  ) : (
                    <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                      {sistemaConfig.nomeEmpresa}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">CNPJ</label>
                  {editMode === 'sistema' ? (
                    <input
                      type="text"
                      value={sistemaConfig.cnpj}
                      onChange={(e) => setSistemaConfig(prev => ({ ...prev, cnpj: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                      }`}
                    />
                  ) : (
                    <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                      {sistemaConfig.cnpj}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Endereço</label>
                  {editMode === 'sistema' ? (
                    <input
                      type="text"
                      value={sistemaConfig.endereco}
                      onChange={(e) => setSistemaConfig(prev => ({ ...prev, endereco: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                      }`}
                    />
                  ) : (
                    <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                      {sistemaConfig.endereco}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Telefone</label>
                  {editMode === 'sistema' ? (
                    <input
                      type="text"
                      value={sistemaConfig.telefone}
                      onChange={(e) => setSistemaConfig(prev => ({ ...prev, telefone: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                      }`}
                    />
                  ) : (
                    <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                      {sistemaConfig.telefone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  {editMode === 'sistema' ? (
                    <input
                      type="email"
                      value={sistemaConfig.email}
                      onChange={(e) => setSistemaConfig(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                      }`}
                    />
                  ) : (
                    <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                      {sistemaConfig.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Botões de Ação */}
              {editMode === 'sistema' && (
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleSave('sistema')}
                    className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-full text-sm font-medium transition-colors"
                  >
                    Salvar
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
                  className="px-4 py-2 bg-dark-600 hover:bg-dark-500 text-white rounded-full text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <PencilSimple size={16} weight="duotone" />
                  <span>Editar</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Nome Completo</label>
                  {editMode === 'usuario' ? (
                    <input
                      type="text"
                      value={usuarioConfig.nome}
                      onChange={(e) => setUsuarioConfig(prev => ({ ...prev, nome: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                      }`}
                    />
                  ) : (
                    <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                      {usuarioConfig.nome}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  {editMode === 'usuario' ? (
                    <input
                      type="email"
                      value={usuarioConfig.email}
                      onChange={(e) => setUsuarioConfig(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                      }`}
                    />
                  ) : (
                    <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                      {usuarioConfig.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Cargo</label>
                  {editMode === 'usuario' ? (
                    <input
                      type="text"
                      value={usuarioConfig.cargo}
                      onChange={(e) => setUsuarioConfig(prev => ({ ...prev, cargo: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                      }`}
                    />
                  ) : (
                    <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                      {usuarioConfig.cargo}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Telefone</label>
                  {editMode === 'usuario' ? (
                    <input
                      type="text"
                      value={usuarioConfig.telefone}
                      onChange={(e) => setUsuarioConfig(prev => ({ ...prev, telefone: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                      }`}
                    />
                  ) : (
                    <p className={`px-4 py-3 rounded-xl ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'}`}>
                      {usuarioConfig.telefone}
                    </p>
                  )}
                </div>
              </div>

              {/* Botões de Ação */}
              {editMode === 'usuario' && (
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleSave('usuario')}
                    className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-full text-sm font-medium transition-colors"
                  >
                    Salvar
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
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                      theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                    }`}
                  />
                </div>
                <button className="w-full px-4 py-3 bg-primary hover:bg-primary-600 text-white rounded-xl font-medium transition-colors">
                  Alterar Senha
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
