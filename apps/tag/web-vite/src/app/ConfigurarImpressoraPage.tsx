import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { usePrinters } from '@/hooks/usePrinters'
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  FloppyDisk,
  X,
  Printer,
  TestTube,
  Tag,
  Calendar,
  Package
} from '@phosphor-icons/react'
import { toast } from 'react-hot-toast'
import FooterNavigation from '@/components/FooterNavigation'


export default function ConfigurarImpressoraPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { theme } = useTheme()
  const { 
    currentPrinter, 
    loadPrinter, 
    updatePrinter, 
    testConnection, 
    isLoading 
  } = usePrinters()
  
  const [printerData, setPrinterData] = useState({
    name: '',
    ip: '',
    port: '',
    model: '',
    location: '',
    usage: [] as string[]
  })

  useEffect(() => {
    if (id) {
      loadPrinter(id).then(printer => {
        if (printer) {
          setPrinterData({
            name: printer.name,
            ip: printer.ip,
            port: printer.port,
            model: printer.model,
            location: printer.location || '',
            usage: printer.usage || []
          })
        }
      })
    }
  }, [id, loadPrinter])

  const toggleUsage = (usageType: string) => {
    setPrinterData(prev => ({
      ...prev,
      usage: prev.usage.includes(usageType)
        ? prev.usage.filter(u => u !== usageType)
        : [...prev.usage, usageType]
    }))
  }

  const handleSave = async () => {
    if (!id) return
    
    try {
      await updatePrinter(id, printerData)
      navigate('/configuracoes')
    } catch (error) {
      // Error já é tratado no hook
    }
  }

  const handleTest = async () => {
    if (!id) return
    
    try {
      await testConnection(id)
    } catch (error) {
      // Error já é tratado no hook
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600'
      case 'offline': return 'text-red-600'
      case 'connecting': return 'text-yellow-600'
      default: return 'text-gray-600'
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

  if (!id || !currentPrinter) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'}`}>
        {/* Header Fixo com Background Desfocado */}
        <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b shadow-2xl ${
          theme === 'dark' 
            ? 'bg-dark-950/95 border-dark-800' 
            : 'bg-white/95 border-light-200'
        }`}>
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/configuracoes')}
                className="p-2 hover:bg-dark-700/20 rounded-xl transition-colors"
              >
                <ArrowLeft size={24} className={theme === 'dark' ? 'text-white' : 'text-dark-900'} />
              </button>
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <Tag size={24} weight="duotone" className="text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Granobox Tag</h1>
                <p className="text-primary text-sm">Smart Tag. Smart Food.</p>
              </div>
            </div>
          </div>
        </header>

        <div className="pt-24 p-4">
          <div className="max-w-md mx-auto text-center">
            <XCircle size={64} className="mx-auto text-red-500 mb-4" />
            <h1 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              Impressora não encontrada
            </h1>
            <p className={`mb-6 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
              A impressora solicitada não foi encontrada.
            </p>
            <button
              onClick={() => navigate('/configuracoes')}
              className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
            >
              Voltar às Configurações
            </button>
          </div>
        </div>
        
        <FooterNavigation />
      </div>
    )
  }

  const printer = currentPrinter

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'}`}>
      {/* Header Fixo com Background Desfocado */}
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b shadow-2xl ${
        theme === 'dark' 
          ? 'bg-dark-950/95 border-dark-800' 
          : 'bg-white/95 border-light-200'
      }`}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/configuracoes')}
              className="p-2 hover:bg-dark-700/20 rounded-xl transition-colors"
            >
              <ArrowLeft size={24} className={theme === 'dark' ? 'text-white' : 'text-dark-900'} />
            </button>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Tag size={24} weight="duotone" className="text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>Granobox Tag</h1>
              <p className="text-primary text-sm">Smart Tag. Smart Food.</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="pt-24 p-4 pb-20">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Status Card */}
          <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 border shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Status da Impressora</h2>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  printer.status === 'online' ? 'bg-green-500' : 
                  printer.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span className={`text-sm font-medium ${getStatusColor(printer.status)}`}>
                  {getStatusText(printer.status)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Modelo:</span>
                <p className="font-medium">{printer.model}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Endereço:</span>
                <p className="font-medium">{printer.ip}:{printer.port}</p>
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 border shadow-xl`}>
            <h2 className="text-lg font-semibold mb-6">Configurações</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Nome da Impressora</label>
                <input
                  type="text"
                  value={printerData.name}
                  onChange={(e) => setPrinterData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                    theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                  }`}
                  placeholder="Digite o nome da impressora"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Endereço IP</label>
                  <input
                    type="text"
                    value={printerData.ip}
                    onChange={(e) => setPrinterData(prev => ({ ...prev, ip: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                      theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                    }`}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Porta</label>
                  <input
                    type="text"
                    value={printerData.port}
                    onChange={(e) => setPrinterData(prev => ({ ...prev, port: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                      theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                    }`}
                    placeholder="9100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Modelo</label>
                <select
                  value={printerData.model}
                  onChange={(e) => setPrinterData(prev => ({ ...prev, model: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                    theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                  }`}
                >
                  <option value="">Selecione o modelo</option>
                  <option value="Zebra ZD420">Zebra ZD420</option>
                  <option value="Zebra ZD620">Zebra ZD620</option>
                  <option value="Zebra ZD220">Zebra ZD220</option>
                  <option value="Zebra ZQ620">Zebra ZQ620</option>
                  <option value="Zebra ZT230">Zebra ZT230</option>
                  <option value="Zebra ZT410">Zebra ZT410</option>
                  <option value="Zebra ZT610">Zebra ZT610</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Localização</label>
                <input
                  type="text"
                  value={printerData.location || ''}
                  onChange={(e) => setPrinterData(prev => ({ ...prev, location: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                    theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-light-100 border-light-300 text-dark-900'
                  }`}
                  placeholder="Ex: Cozinha, Depósito, Balcão"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-4">Uso</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => toggleUsage('validade')}
                    className={`p-4 rounded-xl border-2 transition-all text-left group ${
                      printerData.usage.includes('validade')
                        ? 'border-primary bg-primary/10 text-primary'
                        : theme === 'dark' 
                          ? 'border-dark-600 bg-dark-700 text-white hover:border-dark-500 hover:bg-dark-600'
                          : 'border-light-300 bg-light-100 text-dark-900 hover:border-light-400 hover:bg-light-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg transition-colors ${
                        printerData.usage.includes('validade')
                          ? 'bg-primary/20'
                          : theme === 'dark'
                            ? 'bg-dark-600 group-hover:bg-dark-500'
                            : 'bg-light-200 group-hover:bg-light-300'
                      }`}>
                        <Calendar 
                          size={20} 
                          className={
                            printerData.usage.includes('validade')
                              ? 'text-primary'
                              : theme === 'dark' ? 'text-white' : 'text-dark-700'
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Etiqueta de Validade</p>
                        <p className="text-xs opacity-75 mt-1">Datas de validade</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        printerData.usage.includes('validade')
                          ? 'border-primary bg-primary'
                          : 'border-gray-400'
                      }`}>
                        {printerData.usage.includes('validade') && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleUsage('rotulo')}
                    className={`p-4 rounded-xl border-2 transition-all text-left group ${
                      printerData.usage.includes('rotulo')
                        ? 'border-primary bg-primary/10 text-primary'
                        : theme === 'dark' 
                          ? 'border-dark-600 bg-dark-700 text-white hover:border-dark-500 hover:bg-dark-600'
                          : 'border-light-300 bg-light-100 text-dark-900 hover:border-light-400 hover:bg-light-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg transition-colors ${
                        printerData.usage.includes('rotulo')
                          ? 'bg-primary/20'
                          : theme === 'dark'
                            ? 'bg-dark-600 group-hover:bg-dark-500'
                            : 'bg-light-200 group-hover:bg-light-300'
                      }`}>
                        <Package 
                          size={20} 
                          className={
                            printerData.usage.includes('rotulo')
                              ? 'text-primary'
                              : theme === 'dark' ? 'text-white' : 'text-dark-700'
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Rótulo de Produto</p>
                        <p className="text-xs opacity-75 mt-1">Rótulos de produtos</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        printerData.usage.includes('rotulo')
                          ? 'border-primary bg-primary'
                          : 'border-gray-400'
                      }`}>
                        {printerData.usage.includes('rotulo') && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-dark-700">
              <button
                onClick={handleTest}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-secondary hover:bg-secondary-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <TestTube size={20} />
                <span>{isLoading ? 'Testando...' : 'Testar Conexão'}</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <FloppyDisk size={20} />
                <span>{isLoading ? 'Salvando...' : 'Salvar'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
      
      <FooterNavigation />
    </div>
  )
}
