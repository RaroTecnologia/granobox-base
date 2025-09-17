import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  Package, 
  MagnifyingGlass, 
  Calendar, 
  Thermometer, 
  Camera, 
  Image as ImageIcon,
  X,
  Barcode,
  Buildings,
  Plus,
  ArrowLeft
} from '@phosphor-icons/react'
import FooterNavigation from '@/components/FooterNavigation'
import toast from 'react-hot-toast'

interface Tag {
  id: string
  name: string
  selected: boolean
}

interface Produto {
  codigo: string
  nome: string
  marca?: string
  sku?: string
  codigoBarras?: string
  unidade: string
  fornecedor?: string
}

interface Fornecedor {
  nome: string
  codigo: string
  cnpj: string
  contato: string
  endereco: string
}

export default function RecebimentoPage() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()

  // Estados do formulário
  const [codigo, setCodigo] = useState('')
  const [nome, setNome] = useState('')
  const [fornecedor, setFornecedor] = useState('')
  const [dataRecebimento, setDataRecebimento] = useState('')
  const [dataFabricacao, setDataFabricacao] = useState('')
  const [dataValidade, setDataValidade] = useState('')
  const [temperatura, setTemperatura] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)

  // Estados para modais e busca
  const [showProdutoModal, setShowProdutoModal] = useState(false)
  const [showFornecedorModal, setShowFornecedorModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Tags disponíveis
  const [tags, setTags] = useState<Tag[]>([
    { id: '1', name: 'Embalagem Danificada', selected: false },
    { id: '2', name: 'Produto Vencido', selected: false },
    { id: '3', name: 'Temperatura Inadequada', selected: false },
    { id: '4', name: 'Quantidade Divergente', selected: false },
    { id: '5', name: 'Qualidade Comprometida', selected: false },
    { id: '6', name: 'Documentação Incompleta', selected: false },
    { id: '7', name: 'Produto Contaminado', selected: false },
    { id: '8', name: 'Lote Recusado', selected: false },
    { id: '9', name: 'Devolução Fornecedor', selected: false },
    { id: '10', name: 'Urgente - Vencimento Próximo', selected: false },
    { id: '11', name: 'Retrabalho Necessário', selected: false },
    { id: '12', name: 'Amostra para Teste', selected: false },
    { id: '13', name: 'Produto Congelado', selected: false },
    { id: '14', name: 'Produto Refrigerado', selected: false },
    { id: '15', name: 'Produto Ambiente', selected: false },
    { id: '16', name: 'Orgânico', selected: false },
    { id: '17', name: 'Importado', selected: false },
    { id: '18', name: 'Granel', selected: false },
    { id: '19', name: 'Frágil', selected: false },
    { id: '20', name: 'Pesado', selected: false }
  ])

  // Mock de produtos
  const produtos: Produto[] = [
    {
      codigo: 'PROD001',
      nome: 'Arroz Integral 5kg',
      marca: 'Tio João',
      sku: 'TJ-ARZ-5KG',
      codigoBarras: '7891234567890',
      unidade: 'UN',
      fornecedor: 'Distribuidora Central'
    },
    {
      codigo: 'PROD002',
      nome: 'Feijão Preto 1kg',
      marca: 'Camil',
      sku: 'CAM-FEJ-1KG',
      codigoBarras: '7891234567891',
      unidade: 'UN'
    },
    {
      codigo: 'PROD003',
      nome: 'Açúcar Cristal 1kg',
      marca: 'União',
      sku: 'UNI-ACU-1KG',
      codigoBarras: '7891234567892',
      unidade: 'UN',
      fornecedor: 'Distribuidora Sul'
    },
    {
      codigo: 'PROD004',
      nome: 'Óleo de Soja 900ml',
      marca: 'Liza',
      sku: 'LIZ-OLE-900ML',
      codigoBarras: '7891234567893',
      unidade: 'UN'
    },
    {
      codigo: 'PROD005',
      nome: 'Sal Refinado 1kg',
      marca: 'Cisne',
      sku: 'CIS-SAL-1KG',
      codigoBarras: '7891234567894',
      unidade: 'UN',
      fornecedor: 'Distribuidora Norte'
    }
  ]

  // Mock de fornecedores
  const fornecedores: Fornecedor[] = [
    {
      nome: 'Distribuidora Central',
      codigo: 'FOR001',
      cnpj: '12.345.678/0001-90',
      contato: '(11) 99999-9999',
      endereco: 'Rua das Flores, 123 - Centro'
    },
    {
      nome: 'Distribuidora Sul',
      codigo: 'FOR002',
      cnpj: '12.345.678/0001-91',
      contato: '(11) 88888-8888',
      endereco: 'Av. Sul, 456 - Zona Sul'
    },
    {
      nome: 'Distribuidora Norte',
      codigo: 'FOR003',
      cnpj: '12.345.678/0001-92',
      contato: '(11) 77777-7777',
      endereco: 'Rua Norte, 789 - Zona Norte'
    },
    {
      nome: 'Atacadão Central',
      codigo: 'FOR004',
      cnpj: '12.345.678/0001-93',
      contato: '(11) 66666-6666',
      endereco: 'Av. Central, 321 - Centro'
    },
    {
      nome: 'Mercado Atacado',
      codigo: 'FOR005',
      cnpj: '12.345.678/0001-94',
      contato: '(11) 55555-5555',
      endereco: 'Rua do Comércio, 654 - Comercial'
    }
  ]

  useEffect(() => {
    // Pré-preenche a data de recebimento com a data atual
    const hoje = new Date().toISOString().split('T')[0]
    setDataRecebimento(hoje)
  }, [])

  const handleSelecionarProduto = (produto: Produto) => {
    setCodigo(produto.codigo)
    setNome(produto.nome)
    if (produto.fornecedor) {
      setFornecedor(produto.fornecedor)
    }
    setShowProdutoModal(false)
    setSearchTerm('')
  }

  const handleSelecionarFornecedor = (fornecedorSelecionado: Fornecedor) => {
    setFornecedor(fornecedorSelecionado.nome)
    setShowFornecedorModal(false)
    setSearchTerm('')
  }

  const handleToggleTag = (tagId: string) => {
    setTags(tags.map(tag => 
      tag.id === tagId ? { ...tag, selected: !tag.selected } : tag
    ))
  }

  const handleRemoverTag = (tagId: string) => {
    setTags(tags.map(tag => 
      tag.id === tagId ? { ...tag, selected: false } : tag
    ))
  }

  const handleFotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setFoto(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setFotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoverFoto = () => {
    setFoto(null)
    setFotoPreview(null)
  }

  const handleScanBarcode = () => {
    // TODO: Implementar scanner de código de barras
    toast.success('Scanner de código de barras ativado!')
  }

  const handleLimparCampos = () => {
    setCodigo('')
    setNome('')
    setFornecedor('')
    setDataFabricacao('')
    setDataValidade('')
    setTemperatura('')
    setObservacoes('')
    setFoto(null)
    setFotoPreview(null)
    setTags(tags.map(tag => ({ ...tag, selected: false })))
    
    // Re-preenche a data de recebimento
    const hoje = new Date().toISOString().split('T')[0]
    setDataRecebimento(hoje)
  }

  const handleSalvarRecebimento = async () => {
    // Validações básicas
    if (!codigo || !nome || !fornecedor || !dataFabricacao || !dataValidade || !dataRecebimento) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      // TODO: Implementar salvamento na API
      const dadosRecebimento = {
        codigo,
        nome,
        fornecedor,
        dataRecebimento,
        dataFabricacao,
        dataValidade,
        temperatura,
        observacoes,
        tags: tags.filter(tag => tag.selected).map(tag => tag.name),
        foto: foto ? await convertFileToBase64(foto) : null
      }

      console.log('Dados do recebimento:', dadosRecebimento)
      
      toast.success(`Recebimento de ${nome} salvo com sucesso!`)
      handleLimparCampos()
    } catch (error) {
      console.error('Erro ao salvar recebimento:', error)
      toast.error('Erro ao salvar recebimento')
    }
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const produtosFiltrados = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.codigoBarras?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const fornecedoresFiltrados = fornecedores.filter(fornecedor =>
    fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fornecedor.cnpj.includes(searchTerm) ||
    fornecedor.contato.includes(searchTerm)
  )

  const tagsSelecionadas = tags.filter(tag => tag.selected)

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'}`}>
      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-b`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'}`}
            >
              <ArrowLeft size={24} className={theme === 'dark' ? 'text-white' : 'text-dark-900'} />
            </button>
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Package size={24} weight="duotone" className="text-primary" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Recebimento
              </h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                Registrar entrada de mercadoria
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="p-4 space-y-6 pb-24">
        <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-xl`}>
          
          {/* Código do produto */}
          <div className="space-y-2">
            <label className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
              Código do Produto *
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Digite o código ou use o scanner"
                className={`flex-1 px-4 py-3 rounded-xl border ${
                  theme === 'dark' 
                    ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' 
                    : 'bg-light-50 border-light-300 text-dark-900 placeholder-dark-500'
                } focus:outline-none focus:ring-2 focus:ring-primary`}
              />
              <button
                onClick={handleScanBarcode}
                className="px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
              >
                <Barcode size={20} />
              </button>
            </div>
          </div>

          {/* Nome do produto */}
          <div className="space-y-2">
            <label className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
              Nome do Produto *
            </label>
            <div className="relative">
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do produto"
                className={`w-full px-4 py-3 pr-12 rounded-xl border ${
                  theme === 'dark' 
                    ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' 
                    : 'bg-light-50 border-light-300 text-dark-900 placeholder-dark-500'
                } focus:outline-none focus:ring-2 focus:ring-primary`}
              />
              <button
                onClick={() => setShowProdutoModal(true)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <MagnifyingGlass size={16} />
              </button>
            </div>
          </div>

          {/* Fornecedor */}
          <div className="space-y-2">
            <label className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
              Fornecedor *
            </label>
            <div className="relative">
              <input
                type="text"
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                placeholder="Nome do fornecedor"
                className={`w-full px-4 py-3 pr-12 rounded-xl border ${
                  theme === 'dark' 
                    ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' 
                    : 'bg-light-50 border-light-300 text-dark-900 placeholder-dark-500'
                } focus:outline-none focus:ring-2 focus:ring-primary`}
              />
              <button
                onClick={() => setShowFornecedorModal(true)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <MagnifyingGlass size={16} />
              </button>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                Data de Recebimento *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dataRecebimento}
                  onChange={(e) => setDataRecebimento(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 rounded-xl border ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white' 
                      : 'bg-light-50 border-light-300 text-dark-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                />
                <Calendar size={20} className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-500'}`} />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                Data de Fabricação *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dataFabricacao}
                  onChange={(e) => setDataFabricacao(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 rounded-xl border ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white' 
                      : 'bg-light-50 border-light-300 text-dark-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                />
                <Calendar size={20} className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-500'}`} />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                Data de Validade *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dataValidade}
                  onChange={(e) => setDataValidade(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 rounded-xl border ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 text-white' 
                      : 'bg-light-50 border-light-300 text-dark-900'
                  } focus:outline-none focus:ring-2 focus:ring-primary`}
                />
                <Calendar size={20} className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-500'}`} />
              </div>
            </div>
          </div>

          {/* Temperatura */}
          <div className="space-y-2">
            <label className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
              Temperatura de Recebimento (°C)
            </label>
            <div className="relative">
              <input
                type="number"
                value={temperatura}
                onChange={(e) => setTemperatura(e.target.value)}
                placeholder="Ex: -18, 5, 25"
                className={`w-full px-4 py-3 pr-12 rounded-xl border ${
                  theme === 'dark' 
                    ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' 
                    : 'bg-light-50 border-light-300 text-dark-900 placeholder-dark-500'
                } focus:outline-none focus:ring-2 focus:ring-primary`}
              />
              <Thermometer size={20} className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-500'}`} />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <label className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre o recebimento..."
              rows={3}
              className={`w-full px-4 py-3 rounded-xl border ${
                theme === 'dark' 
                  ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' 
                  : 'bg-light-50 border-light-300 text-dark-900 placeholder-dark-500'
              } focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
            />
          </div>

          {/* Foto do produto */}
          <div className="space-y-2">
            <label className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
              Foto do Produto
            </label>
            
            {fotoPreview ? (
              <div className="relative">
                <img
                  src={fotoPreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-xl border border-dark-600"
                />
                <button
                  onClick={handleRemoverFoto}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <label className="flex-1 cursor-pointer">
                  <div className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 border-dashed ${
                    theme === 'dark' 
                      ? 'border-dark-600 hover:border-primary' 
                      : 'border-light-300 hover:border-primary'
                  } transition-colors`}>
                    <Camera size={20} className="text-primary" />
                    <span className={`text-sm ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                      Tirar Foto
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFotoUpload}
                    className="hidden"
                  />
                </label>
                
                <label className="flex-1 cursor-pointer">
                  <div className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 border-dashed ${
                    theme === 'dark' 
                      ? 'border-dark-600 hover:border-primary' 
                      : 'border-light-300 hover:border-primary'
                  } transition-colors`}>
                    <ImageIcon size={20} className="text-primary" />
                    <span className={`text-sm ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                      Galeria
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Tags selecionadas */}
          {tagsSelecionadas.length > 0 && (
            <div className="space-y-2">
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                Tags Selecionadas
              </label>
              <div className="flex flex-wrap gap-2">
                {tagsSelecionadas.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-primary text-white text-xs rounded-full"
                  >
                    <span>{tag.name}</span>
                    <button
                      onClick={() => handleRemoverTag(tag.id)}
                      className="hover:bg-primary/80 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags disponíveis */}
          <div className="space-y-2">
            <label className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
              Tags Disponíveis
            </label>
            <div className={`max-h-48 overflow-y-auto p-4 rounded-xl border ${
              theme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-light-50 border-light-300'
            }`}>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleToggleTag(tag.id)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      tag.selected
                        ? 'bg-primary text-white'
                        : theme === 'dark'
                        ? 'bg-dark-600 text-dark-300 hover:bg-dark-500'
                        : 'bg-light-200 text-dark-700 hover:bg-light-300'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex space-x-4">
          <button
            onClick={handleLimparCampos}
            className={`flex-1 px-6 py-3 rounded-xl border-2 ${
              theme === 'dark' 
                ? 'border-dark-600 text-white hover:bg-dark-700' 
                : 'border-light-300 text-dark-900 hover:bg-light-100'
            } transition-colors font-medium`}
          >
            Limpar
          </button>
          <button
            onClick={handleSalvarRecebimento}
            className="flex-1 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium"
          >
            Salvar Recebimento
          </button>
        </div>
      </main>

      {/* Modal de busca de produtos */}
      {showProdutoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className={`w-full max-w-md max-h-[80vh] ${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-t-2xl`}>
            <div className="p-4 border-b border-dark-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Buscar Produto
                </h3>
                <button
                  onClick={() => setShowProdutoModal(false)}
                  className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'}`}
                >
                  <X size={20} className={theme === 'dark' ? 'text-white' : 'text-dark-900'} />
                </button>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produto..."
                className={`w-full px-4 py-2 rounded-xl border ${
                  theme === 'dark' 
                    ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' 
                    : 'bg-light-50 border-light-300 text-dark-900 placeholder-dark-500'
                } focus:outline-none focus:ring-2 focus:ring-primary`}
              />
            </div>
            <div className="max-h-96 overflow-y-auto p-4">
              {produtosFiltrados.map((produto) => (
                <button
                  key={produto.codigo}
                  onClick={() => handleSelecionarProduto(produto)}
                  className={`w-full p-3 mb-2 rounded-xl border text-left ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 hover:bg-dark-600' 
                      : 'bg-light-50 border-light-300 hover:bg-light-100'
                  } transition-colors`}
                >
                  <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    {produto.nome}
                  </div>
                  <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                    {produto.marca && `${produto.marca} • `}
                    {produto.sku && `SKU: ${produto.sku} • `}
                    Código: {produto.codigo}
                  </div>
                  {produto.fornecedor && (
                    <div className="text-xs text-primary font-medium">
                      Fornecedor: {produto.fornecedor}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de busca de fornecedores */}
      {showFornecedorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className={`w-full max-w-md max-h-[80vh] ${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-t-2xl`}>
            <div className="p-4 border-b border-dark-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Buscar Fornecedor
                </h3>
                <button
                  onClick={() => setShowFornecedorModal(false)}
                  className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'}`}
                >
                  <X size={20} className={theme === 'dark' ? 'text-white' : 'text-dark-900'} />
                </button>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar fornecedor..."
                className={`w-full px-4 py-2 rounded-xl border ${
                  theme === 'dark' 
                    ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400' 
                    : 'bg-light-50 border-light-300 text-dark-900 placeholder-dark-500'
                } focus:outline-none focus:ring-2 focus:ring-primary`}
              />
            </div>
            <div className="max-h-96 overflow-y-auto p-4">
              {fornecedoresFiltrados.map((fornecedor) => (
                <button
                  key={fornecedor.codigo}
                  onClick={() => handleSelecionarFornecedor(fornecedor)}
                  className={`w-full p-3 mb-2 rounded-xl border text-left ${
                    theme === 'dark' 
                      ? 'bg-dark-700 border-dark-600 hover:bg-dark-600' 
                      : 'bg-light-50 border-light-300 hover:bg-light-100'
                  } transition-colors`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <Buildings size={20} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                        {fornecedor.nome}
                      </div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                        CNPJ: {fornecedor.cnpj}
                      </div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                        {fornecedor.contato}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <FooterNavigation />
    </div>
  )
}

