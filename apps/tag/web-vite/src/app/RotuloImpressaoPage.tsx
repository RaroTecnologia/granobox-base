import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { Printer, ArrowLeft, Trash, CheckCircle, Package, Square, Warning, Tag } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import FooterNavigation from '@/components/FooterNavigation'

interface ItemFila {
  id: number
  produto: any
  quantidade: number
  preco: string
  peso: string
  timestamp: Date
}

export default function RotuloImpressaoPage() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [filaItens, setFilaItens] = useState<ItemFila[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Carregar fila do localStorage
  useEffect(() => {
    const fila = JSON.parse(localStorage.getItem('filaRotuloEtiquetas') || '[]')
    setFilaItens(fila.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp)
    })))
  }, [])

  // Salvar fila no localStorage
  const salvarFila = (novaFila: ItemFila[]) => {
    setFilaItens(novaFila)
    localStorage.setItem('filaRotuloEtiquetas', JSON.stringify(novaFila))
  }

  const removerItem = (id: number) => {
    const novaFila = filaItens.filter(item => item.id !== id)
    salvarFila(novaFila)
    toast.success('Item removido da fila')
  }

  const limparFila = () => {
    salvarFila([])
    toast.success('Fila limpa')
  }

  const processarFila = async () => {
    if (filaItens.length === 0) {
      toast.error('Nenhum item na fila para processar')
      return
    }

    setIsProcessing(true)

    try {
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Limpar fila após processamento
      salvarFila([])
      
      toast.success(`${filaItens.length} rótulo(s) enviado(s) para impressão!`)
    } catch (error) {
      toast.error('Erro ao processar fila de impressão')
    } finally {
      setIsProcessing(false)
    }
  }

  // Função para criar card de informação (igual ao Flutter)
  const buildInfoCard = (title: string, value: string, icon: any, color: string) => {
    const IconComponent = icon
    return (
      <div className={`p-4 ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-200'} rounded-xl`}>
        <div className="flex flex-col items-center text-center space-y-2">
          <IconComponent size={24} className={color} />
          <span className={`text-xs ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
            {title}
          </span>
          <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
            {value}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'}`}>
      {/* Conteúdo Principal - Exatamente como no Flutter */}
      <main className="pt-5 px-5 pb-32">
        {/* Título da tela - Como no Flutter */}
        <div className="flex items-center space-x-3 mb-6">
          <Printer size={28} className="text-primary" />
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
            Impressão
          </h1>
        </div>

        {/* Status da Impressora - Exatamente como no Flutter */}
        <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
          Status da Impressora
        </h2>

        <div className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border rounded-2xl p-5 mb-6`}>
          {/* Status principal */}
          <div className="flex items-center space-x-4 mb-5">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle size={24} className="text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Impressora Conectada
              </h3>
              <p className={`${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                Zebra ZD420
              </p>
            </div>
          </div>

          {/* Informações da impressora */}
          <div className="grid grid-cols-2 gap-3">
            {buildInfoCard('Papel', 'Disponível', Square, 'text-blue-500')}
            {buildInfoCard('Temperatura', 'Normal', Warning, 'text-orange-500')}
          </div>
        </div>

        {/* Fila de Impressão - Exatamente como no Flutter */}
        <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
          Fila de Impressão
        </h2>

        {/* Lista da fila */}
        <div className="space-y-3">
          {filaItens.length === 0 ? (
            // Estado vazio
            <div className="text-center py-12">
              <Package size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-dark-600' : 'text-dark-400'}`} />
              <p className={`text-lg ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                Nenhum rótulo na fila
              </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-500' : 'text-dark-500'} mt-2`}>
                Adicione produtos para começar a imprimir
              </p>
              <button
                onClick={() => navigate('/etiquetas/rotulo')}
                className="mt-4 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Adicionar Produtos
              </button>
            </div>
          ) : (
            // Lista de itens - Como no Flutter
            <>
              {filaItens.map((item, index) => (
                <div
                  key={item.id}
                  className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border rounded-2xl p-4 mb-3`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Ícone da etiqueta */}
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Tag size={24} className="text-primary" />
                    </div>
                    
                    {/* Informações do item */}
                    <div className="flex-1">
                      <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                        Etiqueta {index + 1}
                      </h3>
                      <p className={`text-sm ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                        {item.produto.name} - {item.quantidade} unidade(s)
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {item.preco && (
                          <span className={`text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-dark-500'}`}>
                            R$ {item.preco}
                          </span>
                        )}
                        {item.peso && (
                          <span className={`text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-dark-500'}`}>
                            {item.peso}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Status */}
                    <div className="bg-primary/20 px-2 py-1 rounded-xl">
                      <span className="text-primary text-xs font-semibold">
                        Pendente
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Botões de ação */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={limparFila}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                >
                  Limpar Fila
                </button>
                <button
                  onClick={processarFila}
                  disabled={isProcessing}
                  className={`flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2 ${
                    isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <Printer size={20} />
                      <span>Imprimir Tudo ({filaItens.length})</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer Navigation */}
      <FooterNavigation />
    </div>
  )
}