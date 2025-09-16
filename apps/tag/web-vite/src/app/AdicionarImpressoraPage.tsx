import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { usePrinters } from '@/hooks/usePrinters'
import { 
  ArrowLeft,
  FloppyDisk,
  X,
  Calendar,
  Package
} from '@phosphor-icons/react'
import { toast } from 'react-hot-toast'
import FooterNavigation from '@/components/FooterNavigation'

export default function AdicionarImpressoraPage() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { createPrinter, isLoading } = usePrinters()
  
  const [printerData, setPrinterData] = useState({
    name: '',
    ip: '',
    port: '',
    model: '',
    location: '',
    usage: [] as string[]
  })

  const toggleUsage = (usageType: string) => {
    setPrinterData(prev => ({
      ...prev,
      usage: prev.usage.includes(usageType)
        ? prev.usage.filter(u => u !== usageType)
        : [...prev.usage, usageType]
    }))
  }

  const handleSave = async () => {
    // Validações básicas
    if (!printerData.name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }
    
    if (!printerData.ip.trim()) {
      toast.error('IP é obrigatório')
      return
    }
    
    if (!printerData.port.trim()) {
      toast.error('Porta é obrigatória')
      return
    }
    
    if (!printerData.model.trim()) {
      toast.error('Modelo é obrigatório')
      return
    }

    if (printerData.usage.length === 0) {
      toast.error('Selecione pelo menos um tipo de uso')
      return
    }

    try {
      await createPrinter(printerData)
      navigate('/configuracoes')
    } catch (error) {
      // Error já é tratado no hook
    }
  }

  const handleCancel = () => {
    navigate('/configuracoes')
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'}`}>
      {/* Header Fixo com Background Desfocado */}
      <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b shadow-2xl ${
        theme === 'dark' 
          ? 'bg-dark-900/80 border-dark-700' 
          : 'bg-white/80 border-light-300'
      }`}>
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={handleCancel}
            className={`p-2 rounded-xl transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-dark-700 text-white' 
                : 'hover:bg-light-100 text-dark-900'
            }`}
          >
            <ArrowLeft size={24} />
          </button>
          
          <h1 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-dark-900'
          }`}>
            Adicionar Impressora
          </h1>
          
          <div className="w-10"></div> {/* Spacer para centralizar o título */}
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="pt-20 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Card Principal */}
          <div className={`rounded-2xl border-2 p-6 ${
            theme === 'dark' 
              ? 'bg-dark-800 border-dark-700' 
              : 'bg-white border-light-300'
          }`}>
            
            {/* Informações Básicas */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nome da Impressora *
                </label>
                <input
                  type="text"
                  value={printerData.name}
                  onChange={(e) => setPrinterData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Impressora Principal"
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    theme === 'dark'
                      ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
                      : 'bg-light-100 border-light-300 text-dark-900 placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Endereço IP *
                  </label>
                  <input
                    type="text"
                    value={printerData.ip}
                    onChange={(e) => setPrinterData(prev => ({ ...prev, ip: e.target.value }))}
                    placeholder="192.168.1.100"
                    className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                      theme === 'dark'
                        ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
                        : 'bg-light-100 border-light-300 text-dark-900 placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Porta *
                  </label>
                  <input
                    type="text"
                    value={printerData.port}
                    onChange={(e) => setPrinterData(prev => ({ ...prev, port: e.target.value }))}
                    placeholder="9100"
                    className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                      theme === 'dark'
                        ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
                        : 'bg-light-100 border-light-300 text-dark-900 placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Modelo *
                </label>
                <input
                  type="text"
                  value={printerData.model}
                  onChange={(e) => setPrinterData(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="Ex: Zebra ZD420"
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    theme === 'dark'
                      ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
                      : 'bg-light-100 border-light-300 text-dark-900 placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Localização
                </label>
                <input
                  type="text"
                  value={printerData.location}
                  onChange={(e) => setPrinterData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Ex: Cozinha, Depósito, Balcão"
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    theme === 'dark'
                      ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20'
                      : 'bg-light-100 border-light-300 text-dark-900 placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/20'
                  }`}
                />
              </div>

              {/* Uso */}
              <div>
                <label className="block text-sm font-medium mb-4">Uso *</label>
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
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <X size={20} />
                <span>Cancelar</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-primary hover:bg-primary-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <FloppyDisk size={20} />
                <span>{isLoading ? 'Criando...' : 'Criar Impressora'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Fixo */}
      <FooterNavigation />
    </div>
  )
}


