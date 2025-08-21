'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Receita {
  id: string;
  nome: string;
  categoria: string;
  precoVenda: number;
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
  receita: Receita;
}

export default function EditarProdutoProntoPage() {
  const router = useRouter();
  const params = useParams();
  const produtoId = params.id as string;
  
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [produto, setProduto] = useState<ProdutoPronto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    receitaId: '',
    lote: '',
    quantidade: 1,
    unidade: 'unidade',
    statusConservacao: 'TEMPERATURA_AMBIENTE' as const,
    dataProducao: '',
    dataValidade: '',
    observacoes: ''
  });

  useEffect(() => {
    if (produtoId) {
      carregarDados();
    }
  }, [produtoId]);

  const carregarDados = async () => {
    try {
      const [produtoRes, receitasRes] = await Promise.all([
        fetch(`/api/produtos-prontos/${produtoId}`),
        fetch('/api/receitas')
      ]);

      if (produtoRes.ok) {
        const produtoData = await produtoRes.json();
        setProduto(produtoData);
        setFormData({
          receitaId: produtoData.receitaId,
          lote: produtoData.lote,
          quantidade: produtoData.quantidade,
          unidade: produtoData.unidade,
          statusConservacao: produtoData.statusConservacao,
          dataProducao: produtoData.dataProducao.split('T')[0],
          dataValidade: produtoData.dataValidade.split('T')[0],
          observacoes: produtoData.observacoes || ''
        });
      } else {
        toast.error('Erro ao carregar produto');
        router.push('/produtos-prontos');
        return;
      }

      if (receitasRes.ok) {
        const receitasData = await receitasRes.json();
        setReceitas(receitasData);
      } else {
        toast.error('Erro ao carregar receitas');
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.receitaId) {
      toast.error('Selecione uma receita');
      return;
    }

    if (!formData.dataValidade) {
      toast.error('Defina a data de validade');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/produtos-prontos/${produtoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Produto atualizado com sucesso!');
        router.push('/produtos-prontos');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar produto');
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro ao atualizar produto');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Carregando produto...</div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Editar Produto Pronto</h1>
                  <p className="text-gray-600">Atualize as informações do produto</p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div className="bg-white shadow rounded-lg">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Receita e Lote */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receita *
                  </label>
                  <select
                    required
                    value={formData.receitaId}
                    onChange={(e) => handleChange('receitaId', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione uma receita</option>
                    {receitas.map(receita => (
                      <option key={receita.id} value={receita.id}>
                        {receita.nome} - {receita.categoria}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lote
                  </label>
                  <input
                    type="text"
                    value={formData.lote}
                    onChange={(e) => handleChange('lote', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Código do lote"
                  />
                </div>
              </div>

              {/* Quantidade, Unidade e Conservação */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantidade}
                    onChange={(e) => handleChange('quantidade', parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidade
                  </label>
                  <select
                    value={formData.unidade}
                    onChange={(e) => handleChange('unidade', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="unidade">Unidade</option>
                    <option value="kg">Kg</option>
                    <option value="g">Gramas</option>
                    <option value="fatia">Fatia</option>
                    <option value="porção">Porção</option>
                    <option value="l">Litro</option>
                    <option value="ml">Mililitro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conservação *
                  </label>
                  <select
                    required
                    value={formData.statusConservacao}
                    onChange={(e) => handleChange('statusConservacao', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="TEMPERATURA_AMBIENTE">Temperatura Ambiente</option>
                    <option value="CONGELADO">Congelado</option>
                    <option value="RESFRIADO">Resfriado</option>
                  </select>
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Produção *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dataProducao}
                    onChange={(e) => handleChange('dataProducao', e.target.value)}
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
                    onChange={(e) => handleChange('dataValidade', e.target.value)}
                    min={formData.dataProducao}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Informações adicionais sobre o produto..."
                />
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      <span>Salvar Alterações</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
