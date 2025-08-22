import React from 'react'
import { useNavigate } from 'react-router-dom'

interface EtiquetaPreviewProps {
  etiqueta: {
    id: number
    codigo: string
    nome: string
    categoria: string
    segmento: string
    status: string
    dataCriacao: string
    quantidade: number
    vencimento: string
    prioridade: string
  }
  className?: string
}

export function EtiquetaPreview({ etiqueta, className = '' }: EtiquetaPreviewProps) {
  const navigate = useNavigate()
  
  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-green-500'
      case 'inativa': return 'bg-gray-500'
      case 'pendente': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const handleClick = () => {
    navigate(`/etiqueta/${etiqueta.id}`)
  }

  return (
    <div 
      className={`bg-white text-black rounded-lg border border-gray-400 shadow-md relative p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-102 ${className}`}
      style={{ 
        width: '350px', 
        height: '350px',
        fontFamily: 'Manrope, system-ui, sans-serif'
      }}
      onClick={handleClick}
    >
      {/* Indicador de Status - Bolinha no canto superior direito */}
      <div className="absolute top-3 right-3">
        <div className={`w-4 h-4 rounded-full ${getStatusColor(etiqueta.status)}`}></div>
      </div>

      {/* Nome do Produto - Centralizado no topo */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 leading-tight">
          {etiqueta.nome.split(' ')[0]}
        </h3>
        <p className="text-sm font-medium text-gray-700 leading-tight">
          {etiqueta.nome.split(' ').slice(1).join(' ')}
        </p>
      </div>

      {/* Informações do Produto */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs">
          <span className="font-semibold">CONSERVAÇÃO</span>
          <span>RESFRIADO</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="font-semibold">MARCA</span>
          <span>BON-MART</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="font-semibold">LOTE/SIF</span>
          <span>{etiqueta.codigo}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="font-semibold">EMB. ORIGINAL</span>
          <span>{formatarData(etiqueta.dataCriacao)} 14:55</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="font-semibold">MANIPULAÇÃO</span>
          <span>{formatarData(etiqueta.dataCriacao)} 14:55</span>
        </div>
      </div>

      {/* Validade - Centralizada */}
      <div className="text-center mb-4">
        <p className="text-xs font-bold text-gray-900 mb-1">VALIDADE</p>
        <p className="text-sm font-bold text-gray-900">{formatarData(etiqueta.vencimento)} 14:55</p>
      </div>

      {/* Rodapé - RESPONSÁVEL e GRANOBOX */}
      <div className="flex justify-between items-end">
        <div className="text-xs">
          <p className="font-semibold mb-1">RESPONSÁVEL</p>
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center mb-1">
            <span className="text-white text-xs font-mono">QR</span>
          </div>
          <p className="text-xs font-mono">#{etiqueta.id.toString().padStart(6, '0')}</p>
        </div>
        
        <div className="text-right text-xs">
          <p className="font-semibold mb-1">GRANOBOX</p>
          <div className="text-gray-600">
            <span className="font-bold">TAG</span>
            <br />
            <span className="text-xs">SYSTEM</span>
          </div>
        </div>
      </div>
    </div>
  )
}
