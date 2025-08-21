'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import MovimentacoesProduto from '@/components/MovimentacoesProduto';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface Receita {
  id: string;
  nome: string;
  categoria: string;
  precoVenda: number;
  descricao?: string;
}

interface ProdutoPronto {
  id: string;
  receitaId: string;
  lote: string;
  quantidade: number;
  unidade: string;
  statusConservacao: 'TEMPERATURA_AMBIENTE' | 'CONGELADO' | 'RESFRIADO';
  dataProducao: string;
  dataValidade: string;
  observacoes?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  receita: Receita;
  movimentacoes: any[];
}

const statusConservacaoLabels = {
  TEMPERATURA_AMBIENTE: 'Temperatura Ambiente',
  CONGELADO: 'Congelado',
  RESFRIADO: 'Resfriado'
};

const statusConservacaoColors = {
  TEMPERATURA_AMBIENTE: 'bg-green-100 text-green-800',
  CONGELADO: 'bg-blue-100 text-blue-800',
  RESFRIADO: 'bg-yellow-100 text-yellow-800'
};

export default function DetalheProdutoProntoPage() {
  const params = useParams();
  const router = useRouter();
  const [produto, setProduto] = useState<ProdutoPronto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  const [formData, setFormData] = useState({
    lote: '',
    quantidade: 1,
    unidade: 'unidade',
    statusConservacao: 'TEMPERATURA_AMBIENTE' as const,
    dataProducao: '',
    dataValidade: '',
    observacoes: ''
  });

  useEffect(() => {
    if (params.id) {
      carregarProduto();
    }
  }, [params.id]);

  const carregarProduto = async () => {
    try {
      const response = await fetch(`/api/produtos-prontos/${params.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setProduto(data);
        
        // Preencher formulário para edição
        setFormData({
          lote: data.lote,
          quantidade: data.quantidade,
          unidade: data.unidade,
          statusConservacao: data.statusConservacao,
          dataProducao: data.dataProducao.split('T')[0],
          dataValidade: data.dataValidade.split('T')[0],
          observacoes: data.observacoes || ''
        });
      } else if (response.status === 404) {
        toast.error('Produto não encontrado');
        router.push('/produtos-prontos');
      } else {
        toast.error('Erro ao carregar produto');
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      toast.error('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const loadingToast = toast.loading('Atualizando produto...');

    try {
      const response = await fetch(`/api/produtos-prontos/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Produto atualizado!', { id: loadingToast });
        setShowEditForm(false);
        carregarProduto();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar produto', {
          id: loadingToast
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro ao atualizar produto', {
        id: loadingToast
      });
    }
  };

  const calcularDiasVencimento = (dataValidade: string) => {
    const hoje = new Date();
    const vencimento = new Date(dataValidade);
    const diffTime = vencimento.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusVencimento = (dataValidade: string) => {
    const dias = calcularDiasVencimento(dataValidade);
    if (dias < 0) return { label: 'Vencido', color: 'text-red-600', bg: 'bg-red-50' };
    if (dias <= 3) return { label: 'Vencendo', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { label: 'Válido', color: 'text-green-600', bg: 'bg-green-50' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Produto não encontrado</div>
        </div>
      </div>
    );
  }

  const statusVencimento = getStatusVencimento(produto.dataValidade);
  const diasVencimento = calcularDiasVencimento(produto.dataValidade);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/produtos-prontos')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {produto.receita.nome}
              </h1>
              <p className="text-gray-600 mt-1">Lote: {produto.lote}</p>
            </div>
          </div>
          <button
            onClick={() => setShowEditForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <PencilIcon className="h-5 w-5" />
            Editar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Principal */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Informações do Produto
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Receita</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {produto.receita.nome}
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {produto.receita.categoria}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Quantidade</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {produto.quantidade} {produto.unidade}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Status de Conservação</label>
                    <div className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConservacaoColors[produto.statusConservacao]}`}>
                        {statusConservacaoLabels[produto.statusConservacao]}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data de Produção</label>
                    <div className="flex items-center gap-2 mt-1">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(produto.dataProducao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Data de Validade</label>
                    <div className="flex items-center gap-2 mt-1">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {new Date(produto.dataValidade).toLocaleDateString('pt-BR')}
                        </p>
                        <p className={`text-sm ${statusVencimento.color}`}>
                          {diasVencimento >= 0 ? `${diasVencimento} dias restantes` : `Vencido há ${Math.abs(diasVencimento)} dias`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {(diasVencimento < 0 || diasVencimento <= 3) && (
                    <div className={`p-3 rounded-lg ${statusVencimento.bg} flex items-center gap-2`}>
                      <ExclamationTriangleIcon className={`h-5 w-5 ${statusVencimento.color}`} />
                      <span className={`text-sm font-medium ${statusVencimento.color}`}>
                        {statusVencimento.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {produto.observacoes && (
                <div className="mt-6 pt-6 border-t">
                  <label className="text-sm font-medium text-gray-500">Observações</label>
                  <p className="text-gray-900 mt-1">{produto.observacoes}</p>
                </div>
              )}
            </div>

            {/* Movimentações */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <MovimentacoesProduto
                produtoId={produto.id}
                movimentacoes={produto.movimentacoes}
                onMovimentacaoAdicionada={carregarProduto}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resumo Financeiro */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Resumo Financeiro
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Preço Unitário:</span>
                  <span className="font-semibold">
                    R$ {produto.receita.precoVenda.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Quantidade:</span>
                  <span className="font-semibold">{produto.quantidade}</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Valor Total:</span>
                    <span className="text-lg font-bold text-green-600">
                      R$ {(produto.receita.precoVenda * produto.quantidade).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações Técnicas */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informações Técnicas
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CubeIcon className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Lote</p>
                    <p className="font-medium">{produto.lote}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Criado em</p>
                    <p className="font-medium">
                      {new Date(produto.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Última atualização</p>
                    <p className="font-medium">
                      {new Date(produto.updatedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Edição */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Editar Produto</h2>
            
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lote
                  </label>
                  <input
                    type="text"
                    value={formData.lote}
                    onChange={(e) => setFormData(prev => ({ ...prev, lote: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 0 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidade
                  </label>
                  <select
                    value={formData.unidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, unidade: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="unidade">Unidade</option>
                    <option value="kg">Kg</option>
                    <option value="g">Gramas</option>
                    <option value="fatia">Fatia</option>
                    <option value="porção">Porção</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conservação *
                  </label>
                  <select
                    required
                    value={formData.statusConservacao}
                    onChange={(e) => setFormData(prev => ({ ...prev, statusConservacao: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="TEMPERATURA_AMBIENTE">Temperatura Ambiente</option>
                    <option value="CONGELADO">Congelado</option>
                    <option value="RESFRIADO">Resfriado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Produção
                  </label>
                  <input
                    type="date"
                    value={formData.dataProducao}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataProducao: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Validade *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dataValidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataValidade: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
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
                  placeholder="Informações adicionais sobre o produto..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Atualizar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 