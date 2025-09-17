import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { InlineLoading, SectionLoading } from '@/components/LoadingSpinner'
import { 
  ArrowLeft,
  MapPin,
  Plus,
  PencilSimple,
  Trash,
  Snowflake,
  Thermometer,
  House,
  Package,
  CheckCircle,
  X
} from '@phosphor-icons/react'
import FooterNavigation from '@/components/FooterNavigation'
import toast from 'react-hot-toast'
import { storageLocationsService, StorageLocation, CreateStorageLocationDto, UpdateStorageLocationDto } from '@/services/storageLocationsService'

type Local = StorageLocation

interface TipoLocal {
  value: string
  label: string
  icon: React.ComponentType<any>
  color: string
  description: string
}

export default function CadastroLocaisPage() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { user } = useAuth()
  const { id } = useParams()
  const isEditing = !!id

  // Estados do formulário
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<string>('')
  const [descricao, setDescricao] = useState('')
  const [temperatura, setTemperatura] = useState('')
  const [capacidade, setCapacidade] = useState('')
  const [setor, setSetor] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLocais, setIsLoadingLocais] = useState(true)
  const [locais, setLocais] = useState<Local[]>([])
  const [showForm, setShowForm] = useState(false)

  // Tipos de locais disponíveis
  const tiposLocais: TipoLocal[] = [
    {
      value: 'geladeira',
      label: 'Geladeira',
      icon: Snowflake,
      color: 'bg-blue-500',
      description: 'Refrigeração (0°C a 8°C)'
    },
    {
      value: 'freezer',
      label: 'Freezer',
      icon: Snowflake,
      color: 'bg-cyan-500',
      description: 'Congelamento (-18°C ou menos)'
    },
    {
      value: 'prateleira',
      label: 'Prateleira',
      icon: Package,
      color: 'bg-amber-500',
      description: 'Armazenamento ambiente'
    },
    {
      value: 'estoque',
      label: 'Estoque',
      icon: House,
      color: 'bg-gray-500',
      description: 'Área de estoque geral'
    },
    {
      value: 'balcao',
      label: 'Balcão',
      icon: MapPin,
      color: 'bg-green-500',
      description: 'Área de exposição/venda'
    },
    {
      value: 'outro',
      label: 'Outro',
      icon: MapPin,
      color: 'bg-purple-500',
      description: 'Outro tipo de local'
    }
  ]

  // Carregar locais existentes
  useEffect(() => {
    loadLocais()
  }, [])

  // Carregar dados para edição
  useEffect(() => {
    if (isEditing && id) {
      loadLocalForEdit(id)
    }
  }, [isEditing, id])

  const loadLocais = async () => {
    try {
      setIsLoadingLocais(true)
      const locaisData = await storageLocationsService.getAll()
      setLocais(locaisData)
    } catch (error) {
      console.error('Erro ao carregar locais:', error)
      toast.error('Erro ao carregar locais de armazenamento')
    } finally {
      setIsLoadingLocais(false)
    }
  }

  const loadLocalForEdit = async (localId: string) => {
    try {
      const local = await storageLocationsService.getById(localId)
      setNome(local.nome)
      setTipo(local.tipo)
      setDescricao(local.descricao || '')
      setTemperatura(local.temperatura?.toString() || '')
      setCapacidade(local.capacidade?.toString() || '')
      setSetor(local.setor || '')
      setAtivo(local.ativo)
      setShowForm(true)
      
      // Navegar para a rota de edição para garantir que o parâmetro id seja definido
      navigate(`/cadastro/locais/${localId}`)
    } catch (error) {
      console.error('Erro ao carregar local:', error)
      toast.error('Erro ao carregar dados do local')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nome.trim() || !tipo) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    setIsLoading(true)
    
    try {
      const localData: CreateStorageLocationDto | UpdateStorageLocationDto = {
        nome: nome.trim(),
        tipo: tipo as any,
        descricao: descricao.trim() || undefined,
        temperatura: temperatura ? parseFloat(temperatura) : undefined,
        capacidade: capacidade ? parseInt(capacidade) : undefined,
        setor: setor.trim() || undefined,
        ativo
      }

      console.log('Modo de edição:', isEditing, 'ID:', id)
      console.log('Dados a enviar:', localData)

      if (isEditing && id) {
        console.log('Atualizando local com ID:', id)
        await storageLocationsService.update(id, localData)
        toast.success('Local atualizado com sucesso!')
      } else {
        console.log('Criando novo local')
        await storageLocationsService.create(localData as CreateStorageLocationDto)
        toast.success('Local cadastrado com sucesso!')
      }

      // Limpar formulário e recarregar lista
      handleClearForm()
      loadLocais()
      
      if (isEditing) {
        navigate('/cadastro/locais')
      }
    } catch (error: any) {
      console.error('Erro ao salvar local:', error)
      console.error('Detalhes do erro:', error.response?.data)
      const errorMessage = error.response?.data?.message || 'Erro ao salvar local'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearForm = () => {
    setNome('')
    setTipo('')
    setDescricao('')
    setTemperatura('')
    setCapacidade('')
    setSetor('')
    setAtivo(true)
    setShowForm(false)
  }

  const handleDelete = async (localId: string) => {
    if (!confirm('Tem certeza que deseja excluir este local?')) return

    try {
      await storageLocationsService.delete(localId)
      toast.success('Local excluído com sucesso!')
      loadLocais()
    } catch (error) {
      console.error('Erro ao excluir local:', error)
      toast.error('Erro ao excluir local')
    }
  }

  const handleToggleStatus = async (localId: string) => {
    try {
      await storageLocationsService.toggleStatus(localId)
      toast.success('Status alterado com sucesso!')
      loadLocais()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status')
    }
  }

  const getTipoLocal = (tipo: string) => {
    return tiposLocais.find(t => t.value === tipo) || tiposLocais[tiposLocais.length - 1]
  }

  const getTemperaturaColor = (temp?: number) => {
    return storageLocationsService.getTemperaturaColor(temp)
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'}`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-b`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/cadastros')}
              className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'}`}
            >
              <ArrowLeft size={24} className={theme === 'dark' ? 'text-white' : 'text-dark-900'} />
            </button>
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <MapPin size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Locais de Armazenamento
              </h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                Gerencie os locais de armazenamento
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            <span>Novo Local</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="p-4 space-y-6 pb-24">
        {/* Formulário */}
        {showForm && (
          <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                {isEditing ? 'Editar Local' : 'Novo Local'}
              </h2>
              <button
                onClick={handleClearForm}
                className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'}`}
              >
                <X size={20} className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                  Nome do Local *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Geladeira 1, Prateleira A2, Freezer Principal"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' 
                      : 'bg-light-50 border-light-300 text-dark-900 placeholder-dark-500'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                  required
                />
              </div>

              {/* Tipo */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                  Tipo de Local *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {tiposLocais.map((tipoLocal) => {
                    const Icon = tipoLocal.icon
                    return (
                      <button
                        key={tipoLocal.value}
                        type="button"
                        onClick={() => setTipo(tipoLocal.value)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          tipo === tipoLocal.value
                            ? 'border-primary bg-primary/10'
                            : theme === 'dark'
                            ? 'border-dark-600 hover:border-dark-500'
                            : 'border-light-300 hover:border-light-400'
                        }`}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <div className={`w-10 h-10 ${tipoLocal.color} rounded-full flex items-center justify-center`}>
                            <Icon size={20} className="text-white" />
                          </div>
                          <div className="text-center">
                            <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                              {tipoLocal.label}
                            </div>
                            <div className={`text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                              {tipoLocal.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Setor */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                  Setor/Área
                </label>
                <input
                  type="text"
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                  placeholder="Ex: Cozinha, Estoque A, Área de Produção"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' 
                      : 'bg-light-50 border-light-300 text-dark-900 placeholder-dark-500'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                />
              </div>

              {/* Temperatura e Capacidade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                    Temperatura (°C)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={temperatura}
                      onChange={(e) => setTemperatura(e.target.value)}
                      placeholder="Ex: -18, 4, 25"
                      className={`w-full px-4 py-3 pr-12 rounded-xl border ${
                        theme === 'dark' 
                          ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' 
                          : 'bg-light-50 border-light-300 text-dark-900 placeholder-dark-500'
                      } focus:outline-none focus:ring-2 focus:ring-primary`}
                    />
                    <Thermometer size={20} className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-500'}`} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                    Capacidade (L)
                  </label>
                  <input
                    type="number"
                    value={capacidade}
                    onChange={(e) => setCapacidade(e.target.value)}
                    placeholder="Ex: 500, 300, 1000"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      theme === 'dark' 
                        ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' 
                        : 'bg-light-50 border-light-300 text-dark-900 placeholder-dark-500'
                    } focus:outline-none focus:ring-2 focus:ring-primary`}
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                  Descrição
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição adicional do local..."
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' 
                      : 'bg-light-50 border-light-300 text-dark-900 placeholder-dark-500'
                  } focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
                />
              </div>

              {/* Status */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="ativo" className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                  Local ativo
                </label>
              </div>

              {/* Botões */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClearForm}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 transition-colors ${
                    theme === 'dark' 
                      ? 'border-dark-600 text-white hover:bg-dark-700' 
                      : 'border-light-300 text-dark-900 hover:bg-light-100'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                >
                  {isLoading ? <><InlineLoading size="sm" /> Salvando...</> : isEditing ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Locais */}
        <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
          <h2 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
            Locais Cadastrados ({locais.length})
          </h2>

          {isLoadingLocais ? (
            <SectionLoading text="Carregando locais..." size="lg" />
          ) : locais.length === 0 ? (
            <div className="text-center py-8">
              <MapPin size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-dark-400' : 'text-gray-400'}`} />
              <p className={`text-lg ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                Nenhum local cadastrado
              </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-500' : 'text-dark-500'}`}>
                Clique em "Novo Local" para começar
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locais.map((local) => {
                const tipoLocal = getTipoLocal(local.tipo)
                const Icon = tipoLocal.icon
                
                return (
                  <div
                    key={local.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col h-full ${
                      local.ativo
                        ? theme === 'dark' 
                          ? 'bg-dark-700 border-dark-600' 
                          : 'bg-light-50 border-light-300'
                        : theme === 'dark'
                        ? 'bg-dark-700/50 border-dark-600 opacity-60'
                        : 'bg-gray-100 border-gray-300 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 ${tipoLocal.color} rounded-full flex items-center justify-center`}>
                          <Icon size={20} className="text-white" />
                        </div>
                        <div>
                          <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                            {local.nome}
                          </h3>
                          <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                            {tipoLocal.label}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            loadLocalForEdit(local.id)
                          }}
                          className={`p-2 rounded-full transition-colors ${
                            theme === 'dark' ? 'hover:bg-dark-600' : 'hover:bg-light-200'
                          }`}
                          title="Editar"
                        >
                          <PencilSimple size={16} className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'} />
                        </button>
                        <button
                          onClick={() => handleDelete(local.id)}
                          className="p-2 rounded-full hover:bg-red-100 transition-colors"
                          title="Excluir"
                        >
                          <Trash size={16} className="text-red-500" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm flex-grow">
                      {local.setor && (
                        <p className={theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}>
                          <strong>Setor:</strong> {local.setor}
                        </p>
                      )}
                      
                      {local.temperatura !== undefined && local.temperatura !== null && (
                        <p className={theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}>
                          <strong>Temperatura:</strong>{' '}
                          <span className={getTemperaturaColor(local.temperatura)}>
                            {local.temperatura % 1 === 0 ? Math.floor(local.temperatura) : local.temperatura}°C
                          </span>
                        </p>
                      )}
                      
                      {local.capacidade && (
                        <p className={theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}>
                          <strong>Capacidade:</strong> {local.capacidade}L
                        </p>
                      )}
                      
                      {local.descricao && (
                        <p className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>
                          {local.descricao}
                        </p>
                      )}
                    </div>

                    <div className={`flex items-center justify-between mt-4 pt-3 border-t ${theme === 'dark' ? 'border-dark-600' : 'border-light-300'}`}>
                      <div className={`flex items-center space-x-1 ${local.ativo ? 'text-green-500' : 'text-red-500'}`}>
                        <CheckCircle size={16} />
                        <span className="text-sm font-medium">
                          {local.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleToggleStatus(local.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          local.ativo
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {local.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <FooterNavigation />
    </div>
  )
}
