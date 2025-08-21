'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Movimentacao {
  id: string;
  tipo: string;
  quantidade: number;
  motivo: string;
  dataMovimento: string;
  usuario?: string;
  observacoes?: string;
}

interface MovimentacoesProdutoProps {
  produtoId: string;
  movimentacoes: Movimentacao[];
  onMovimentacaoAdicionada: () => void;
}

const tiposMovimentacao = [
  { value: 'entrada', label: 'Entrada', icon: ArrowUpIcon, color: 'text-green-600' },
  { value: 'saida', label: 'Saída', icon: ArrowDownIcon, color: 'text-red-600' },
  { value: 'ajuste_positivo', label: 'Ajuste +', icon: AdjustmentsHorizontalIcon, color: 'text-blue-600' },
  { value: 'ajuste_negativo', label: 'Ajuste -', icon: AdjustmentsHorizontalIcon, color: 'text-orange-600' },
  { value: 'vencimento', label: 'Vencimento', icon: ExclamationTriangleIcon, color: 'text-gray-600' }
];

export default function MovimentacoesProduto({ 
  produtoId, 
  movimentacoes, 
  onMovimentacaoAdicionada 
}: MovimentacoesProdutoProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tipo: 'saida',
    quantidade: 1,
    motivo: '',
    usuario: '',
    observacoes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.motivo) {
      toast.error('Motivo é obrigatório');
      return;
    }

    const loadingToast = toast.loading('Registrando movimentação...');

    try {
      const response = await fetch(`/api/produtos-prontos/${produtoId}/movimentacoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Movimentação registrada!', { id: loadingToast });
        setShowForm(false);
        resetForm();
        onMovimentacaoAdicionada();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao registrar movimentação', {
          id: loadingToast
        });
      }
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
      toast.error('Erro ao registrar movimentação', {
        id: loadingToast
      });
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'saida',
      quantidade: 1,
      motivo: '',
      usuario: '',
      observacoes: ''
    });
  };

  const getTipoInfo = (tipo: string) => {
    return tiposMovimentacao.find(t => t.value === tipo) || tiposMovimentacao[0];
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Movimentações</h3>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
        >
          <PlusIcon className="h-4 w-4" />
          Nova Movimentação
        </button>
      </div>

      {/* Lista de Movimentações */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {movimentacoes.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            Nenhuma movimentação registrada
          </p>
        ) : (
          movimentacoes.map((mov) => {
            const tipoInfo = getTipoInfo(mov.tipo);
            const IconComponent = tipoInfo.icon;
            
            return (
              <div key={mov.id} className="bg-gray-50 rounded-lg p-3 border">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className={`h-4 w-4 ${tipoInfo.color}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{tipoInfo.label}</span>
                        <span className="text-sm text-gray-600">
                          {mov.quantidade} {mov.quantidade === 1 ? 'unidade' : 'unidades'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{mov.motivo}</p>
                      {mov.observacoes && (
                        <p className="text-xs text-gray-500 mt-1">{mov.observacoes}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {new Date(mov.dataMovimento).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(mov.dataMovimento).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {mov.usuario && (
                      <div className="text-xs text-gray-400 mt-1">
                        {mov.usuario}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal do Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nova Movimentação</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Movimentação *
                </label>
                <select
                  required
                  value={formData.tipo}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {tiposMovimentacao.map(tipo => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.quantidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 1 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.motivo}
                  onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Venda, Produção, Ajuste de estoque..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuário
                </label>
                <input
                  type="text"
                  value={formData.usuario}
                  onChange={(e) => setFormData(prev => ({ ...prev, usuario: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nome do responsável"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Informações adicionais..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 