'use client'

import { 
  Tag, 
  ArrowLeft,
  Printer,
  Plus,
  Clock,
  Check,
  X,
  Package,
  Calendar,
  Hash,
  Ruler,
  Eye
} from '@phosphor-icons/react'
import { useState, useEffect } from 'react'

export default function PreviewEtiquetaPage() {
  const [isAddingToQueue, setIsAddingToQueue] = useState(false)
  const [isPrintingNow, setIsPrintingNow] = useState(false)

  // Pegar dados da URL
  const [etiqueta, setEtiqueta] = useState({
    nome: '',
    codigo: '',
    segmento: '',
    categoria: '',
    unidade: '',
    quantidade: '',
    dataValidade: '',
    observacoes: '',
    foto: '',
    estabelecimento: 'Padaria do João',
    endereco: 'Rua das Flores, 123 - Centro',
    telefone: '(11) 99999-9999',
    cnpj: '12.345.678/0001-90'
  })

  // Carregar dados da URL quando a página carregar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      setEtiqueta(prev => ({
        ...prev,
        nome: urlParams.get('nome') || '',
        codigo: urlParams.get('codigo') || '',
        segmento: urlParams.get('segmento') || '',
        categoria: urlParams.get('categoria') || '',
        unidade: urlParams.get('unidade') || '',
        quantidade: urlParams.get('quantidade') || '',
        dataValidade: urlParams.get('dataValidade') || '',
        observacoes: urlParams.get('observacoes') || '',
        foto: urlParams.get('foto') || ''
      }))
    }
  }, [])

  const handleAddToQueue = async () => {
    setIsAddingToQueue(true)
    
    // Criar objeto da etiqueta para a fila
    const etiquetaFila = {
      id: Date.now().toString(),
      nome: etiqueta.nome,
      codigo: etiqueta.codigo,
      segmento: etiqueta.segmento,
      categoria: etiqueta.categoria,
      quantidade: etiqueta.quantidade,
      unidade: etiqueta.unidade,
      dataValidade: etiqueta.dataValidade,
      observacoes: etiqueta.observacoes,
      foto: etiqueta.foto,
      timestamp: new Date(),
      status: 'pendente' as const,
      prioridade: 'normal' as const
    }
    
    // Adicionar à fila (localStorage para simular)
    const filaAtual = JSON.parse(localStorage.getItem('filaImpressao') || '[]')
    filaAtual.push(etiquetaFila)
    localStorage.setItem('filaImpressao', JSON.stringify(filaAtual))
    
    setTimeout(() => {
      setIsAddingToQueue(false)
      // Redirecionar para a fila de impressão
      window.location.href = '/etiquetas/fila'
    }, 1500)
  }

  const handlePrintNow = async () => {
    setIsPrintingNow(true)
    // Simular impressão imediata
    setTimeout(() => {
      setIsPrintingNow(false)
      // Redirecionar para dashboard ou mostrar mensagem de sucesso
      alert('Etiqueta impressa com sucesso!')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header Fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-dark-950/95 backdrop-blur-sm border-b border-dark-800 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <a href="/etiquetas/nova" className="p-2 text-dark-400 hover:text-white transition-colors">
              <ArrowLeft size={24} weight="duotone" />
            </a>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Tag size={24} weight="duotone" className="text-white" />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">Preview da Etiqueta</h1>
              <p className="text-primary text-sm">Revise e imprima a etiqueta</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="pt-32 px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Informações da Etiqueta */}
          <div className="bg-dark-800 rounded-3xl p-8 border border-dark-800 shadow-2xl">
            <h2 className="text-white text-2xl font-bold mb-6 flex items-center space-x-3">
              <Eye size={28} weight="duotone" className="text-primary" />
              <span>Informações da Etiqueta</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-1">Nome do Produto</label>
                  <p className="text-white text-lg font-semibold">{etiqueta.nome}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-1">Código</label>
                  <p className="text-white font-mono text-lg bg-dark-700 px-3 py-2 rounded-lg">{etiqueta.codigo}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-1">Segmento</label>
                  <p className="text-white text-lg">{etiqueta.segmento}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-1">Categoria</label>
                  <p className="text-white text-lg">{etiqueta.categoria}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-1">Quantidade</label>
                  <p className="text-white text-lg font-semibold">{etiqueta.quantidade} {etiqueta.unidade}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-1">Data de Validade</label>
                  <p className="text-white text-lg">{etiqueta.dataValidade}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-400 mb-1">Observações</label>
                  <p className="text-white text-lg">{etiqueta.observacoes}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview da Etiqueta */}
          <div className="bg-dark-800 rounded-3xl p-8 border border-dark-800 shadow-2xl">
            <h2 className="text-white text-2xl font-bold mb-6 flex items-center space-x-3">
              <Tag size={28} weight="duotone" className="text-primary" />
              <span>Preview da Etiqueta</span>
            </h2>
            
                  {/* Etiqueta Simulada */}
      <div className="bg-white rounded-2xl p-8 max-w-md mx-auto shadow-2xl border-4 border-dashed border-dark-800">
        {/* Logo/Header da Etiqueta */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
            <Tag size={32} weight="duotone" className="text-white" />
          </div>
          <h3 className="text-gray-800 text-xl font-bold">{etiqueta.estabelecimento}</h3>
          <p className="text-gray-600 text-sm">{etiqueta.endereco}</p>
          <p className="text-gray-600 text-sm">{etiqueta.telefone}</p>
        </div>
        
        {/* Linha divisória */}
        <div className="border-t-2 border-dark-800 my-4"></div>
        
        {/* Foto do Produto */}
        {etiqueta.foto && (
          <div className="text-center mb-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-dark-100 border border-dark-800 mx-auto">
              <img 
                src={etiqueta.foto} 
                alt={etiqueta.nome}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
            </div>
          </div>
        )}
        
        {/* Informações do Produto */}
        <div className="space-y-3 mb-6">
          <div className="text-center">
            <h4 className="text-gray-800 text-lg font-bold">{etiqueta.nome}</h4>
            <p className="text-gray-600 text-sm">{etiqueta.categoria}</p>
          </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Código</label>
                    <p className="text-gray-800 font-mono text-lg font-bold">{etiqueta.codigo}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Quantidade</label>
                    <p className="text-gray-800 text-lg font-bold">{etiqueta.quantidade} {etiqueta.unidade}</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <label className="block text-xs text-gray-500 mb-1">Validade</label>
                  <p className="text-gray-800 font-bold">{etiqueta.dataValidade}</p>
                </div>
              </div>
              
              {/* Linha divisória */}
              <div className="border-t-2 border-dark-800 my-4"></div>
              
              {/* Footer da Etiqueta */}
              <div className="text-center">
                <p className="text-gray-600 text-xs">CNPJ: {etiqueta.cnpj}</p>
                <p className="text-gray-600 text-xs">Granobox Tag System</p>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="bg-dark-800 rounded-3xl p-8 border border-dark-800 shadow-2xl">
            <h2 className="text-white text-2xl font-bold mb-6 flex items-center space-x-3">
              <Printer size={28} weight="duotone" className="text-primary" />
              <span>Ações de Impressão</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Adicionar à Fila */}
              <button
                onClick={handleAddToQueue}
                disabled={isAddingToQueue}
                className="bg-dark-700 hover:bg-dark-600 disabled:bg-dark-700 text-white rounded-2xl p-6 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex flex-col items-center space-y-4 group"
              >
                {isAddingToQueue ? (
                  <>
                    <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-lg font-medium">Adicionando...</span>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus size={32} weight="duotone" className="text-primary" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-white text-xl font-bold mb-2">Adicionar à Fila</h3>
                      <p className="text-dark-400 text-sm">Imprimir junto com outras etiquetas</p>
                    </div>
                  </>
                )}
              </button>
              
              {/* Imprimir Agora */}
              <button
                onClick={handlePrintNow}
                disabled={isPrintingNow}
                className="bg-primary hover:bg-primary-600 disabled:bg-primary-700 text-white rounded-2xl p-6 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex flex-col items-center space-y-4 group"
              >
                {isPrintingNow ? (
                  <>
                    <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-lg font-medium">Imprimindo...</span>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Printer size={32} weight="duotone" className="text-white" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-white text-xl font-bold mb-2">Imprimir Agora</h3>
                      <p className="text-white/80 text-sm">Impressão imediata da etiqueta</p>
                    </div>
                  </>
                )}
              </button>
            </div>
            
            {/* Informações Adicionais */}
            <div className="mt-8 p-6 bg-dark-700 rounded-2xl border border-dark-800">
              <div className="flex items-center space-x-3 mb-4">
                <Clock size={24} weight="duotone" className="text-primary" />
                <h3 className="text-white text-lg font-semibold">Informações da Fila</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-dark-400">Etiquetas na fila:</span>
                  <span className="text-white ml-2 font-semibold">12</span>
                </div>
                <div>
                  <span className="text-dark-400">Tempo estimado:</span>
                  <span className="text-white ml-2 font-semibold">~3 minutos</span>
                </div>
                <div>
                  <span className="text-dark-400">Próxima impressão:</span>
                  <span className="text-white ml-2 font-semibold">Em 30s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-dark-950/95 backdrop-blur-sm border-t border-dark-800 shadow-2xl">
        <div className="flex justify-around items-center px-6 py-4">
          <a href="/dashboard" className="flex flex-col items-center space-y-1 text-dark-400 hover:text-white transition-colors">
            <Tag size={24} weight="duotone" />
            <span className="text-xs font-medium">Dash</span>
          </a>
          <a href="/etiquetas" className="flex flex-col items-center space-y-1 text-primary">
            <Tag size={24} weight="duotone" />
            <span className="text-xs font-medium">Etiquetas</span>
          </a>
          <a href="/cadastros" className="flex flex-col items-center space-y-1 text-dark-400 hover:text-white transition-colors">
            <Tag size={24} weight="duotone" />
            <span className="text-xs font-medium">Cadastros</span>
          </a>
          <a href="/configuracoes" className="flex flex-col items-center space-y-1 text-dark-400 hover:text-white transition-colors">
            <Tag size={24} weight="duotone" />
            <span className="text-xs font-medium">Config</span>
          </a>
        </div>
      </nav>

      {/* Espaçamento para o bottom navigation */}
      <div className="h-24"></div>
    </div>
  )
}
