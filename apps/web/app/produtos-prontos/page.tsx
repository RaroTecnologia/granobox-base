'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import { 
  PlusIcon, 
  FunnelIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  ArchiveBoxIcon,
  PencilIcon,
  TrashIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { gerarCodigoEtiqueta, gerarCodigoLote, calcularDataValidadePadrao } from '@/lib/etiquetaUtils';
import Link from 'next/link';

interface ProdutoPronto {
  id: string;
  produtoId: string;
  lote: string;
  quantidade: number;
  unidade: string;
  statusConservacao: 'TEMPERATURA_AMBIENTE' | 'CONGELADO' | 'RESFRIADO';
  dataProducao: string;
  dataValidade: string;
  observacoes?: string;
  ativo: boolean;
  produto: {
    id: string;
    nome: string;
    categoria: string;
    precoVenda: number;
  };
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

export default function ProdutosProntosPage() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<ProdutoPronto[]>([]);
  const [receitas, setReceitas] = useState<any[]>([]); // Assuming receitas are not directly used in this simplified view
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    status: '',
    vencimento: '',
    receita: ''
  });
  const [showEtiquetaModal, setShowEtiquetaModal] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoPronto | null>(null);
  const [dadosEtiqueta, setDadosEtiqueta] = useState({
    lote: '',
    quantidade: 1,
    dataProducao: new Date().toISOString().split('T')[0],
    dataValidade: '',
    observacoes: ''
  });

  useEffect(() => {
    carregarDados();
  }, [filtros]);

  const carregarDados = async () => {
    try {
      const params = new URLSearchParams();
      if (filtros.status) params.append('status', filtros.status);
      if (filtros.vencimento) params.append('vencimento', filtros.vencimento);
      if (filtros.receita) params.append('receita', filtros.receita);

      const [produtosRes, receitasRes] = await Promise.all([
        fetch(`/api/produtos-prontos?${params.toString()}`),
        fetch('/api/receitas') // This fetch is no longer needed for the simplified view
      ]);

      if (produtosRes.ok) {
        const data = await produtosRes.json();
        setProdutos(data);
      } else {
        toast.error('Erro ao carregar produtos');
      }

      if (receitasRes.ok) {
        const data = await receitasRes.json();
        setReceitas(data);
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

  const removerProduto = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este produto?')) {
      try {
        const response = await fetch(`/api/produtos-prontos/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setProdutos(prev => prev.filter(p => p.id !== id));
          toast.success('Produto removido com sucesso!');
        } else {
          toast.error('Erro ao remover produto');
        }
      } catch (error) {
        console.error('Erro ao remover produto:', error);
        toast.error('Erro ao remover produto');
      }
    }
  };

  const handleGerarEtiqueta = (produto: ProdutoPronto) => {
    setProdutoSelecionado(produto);
    setDadosEtiqueta({
      lote: produto.lote || '',
      quantidade: produto.quantidade,
      dataProducao: produto.dataProducao.split('T')[0],
      dataValidade: produto.dataValidade.split('T')[0],
      observacoes: produto.observacoes || ''
    });
    setShowEtiquetaModal(true);
  };

  const confirmarGerarEtiqueta = () => {
    if (!produtoSelecionado) return;

    // Criar dados da etiqueta para produtos prontos
    const etiquetaData = {
      nome: produtoSelecionado.produto.nome,
      codigo: gerarCodigoEtiqueta(), // Código amigável de 6 caracteres
      descricao: `Produto final - ${produtoSelecionado.produto.categoria}`,
      categoria: produtoSelecionado.produto.categoria,
      unidade: produtoSelecionado.unidade,
      quantidade: dadosEtiqueta.quantidade,
      preco: produtoSelecionado.produto.precoVenda,
      processo: 'Produção Final',
      dataProducao: dadosEtiqueta.dataProducao,
      dataValidade: dadosEtiqueta.dataValidade,
      conservacao: produtoSelecionado.statusConservacao,
      lote: dadosEtiqueta.lote || gerarCodigoLote(), // Usar lote informado ou gerar novo
      dataCriacao: new Date().toISOString().split('T')[0],
      ativa: true
    };

    // Salvar no localStorage temporariamente
    const etiquetasExistentes = JSON.parse(localStorage.getItem('etiquetasProdutos') || '[]');
    const novaEtiqueta = {
      id: `etiqueta-${Date.now()}`,
      ...etiquetaData
    };
    
    etiquetasExistentes.push(novaEtiqueta);
    localStorage.setItem('etiquetasProdutos', JSON.stringify(etiquetasExistentes));

    // Redirecionar para a página de etiquetas de produtos
    const queryParams = new URLSearchParams({
      tipo: 'produtos',
      etiquetaId: novaEtiqueta.id
    });
    
    setShowEtiquetaModal(false);
    setProdutoSelecionado(null);
    window.location.href = `/etiquetas/produtos?${queryParams.toString()}`;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Produtos Prontos</h1>
            <p className="text-gray-600 mt-1">Gerencie o estoque de produtos finalizados</p>
          </div>
          <Link
            href="/produtos-prontos/novo"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Novo Produto Pronto
          </Link>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <h3 className="font-medium text-gray-900">Filtros</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status de Conservação
              </label>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="TEMPERATURA_AMBIENTE">Temperatura Ambiente</option>
                <option value="CONGELADO">Congelado</option>
                <option value="RESFRIADO">Resfriado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vencimento
              </label>
              <select
                value={filtros.vencimento}
                onChange={(e) => setFiltros(prev => ({ ...prev, vencimento: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="vencendo">Vencendo (3 dias)</option>
                <option value="vencidos">Vencidos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receita
              </label>
              <select
                value={filtros.receita}
                onChange={(e) => setFiltros(prev => ({ ...prev, receita: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas</option>
                {receitas.map(receita => (
                  <option key={receita.id} value={receita.id}>
                    {receita.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Produtos */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {produtos.map((produto) => {
            const statusVencimento = getStatusVencimento(produto.dataValidade);
            const diasVencimento = calcularDiasVencimento(produto.dataValidade);
            
            return (
              <div key={produto.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 cursor-pointer" onClick={() => router.push(`/produtos-prontos/${produto.id}`)}>
                    <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                      {produto.produto.nome}
                    </h3>
                    <p className="text-sm text-gray-500">Lote: {produto.lote}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGerarEtiqueta(produto)}
                      className="text-gray-400 hover:text-green-600"
                      title="Gerar Etiqueta"
                    >
                      <TagIcon className="h-4 w-4" />
                    </button>
                    <Link
                      href={`/produtos-prontos/${produto.id}/editar`}
                      className="text-gray-400 hover:text-blue-600"
                      title="Editar produto"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => removerProduto(produto.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Remover produto"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Quantidade:</span>
                    <span className="font-semibold">
                      {produto.quantidade} {produto.unidade}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Conservação:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConservacaoColors[produto.statusConservacao]}`}>
                      {statusConservacaoLabels[produto.statusConservacao]}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Produção:</span>
                    <span className="text-sm">
                      {new Date(produto.dataProducao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Vencimento:</span>
                    <div className="text-right">
                      <div className="text-sm">
                        {new Date(produto.dataValidade).toLocaleDateString('pt-BR')}
                      </div>
                      <div className={`text-xs ${statusVencimento.color}`}>
                        {diasVencimento >= 0 ? `${diasVencimento} dias` : `${Math.abs(diasVencimento)} dias atrás`}
                      </div>
                    </div>
                  </div>

                  {produto.observacoes && (
                    <div className="pt-3 border-t">
                      <p className="text-sm text-gray-600">
                        <strong>Obs:</strong> {produto.observacoes}
                      </p>
                    </div>
                  )}

                  {(diasVencimento < 0 || diasVencimento <= 3) && (
                    <div className={`p-2 rounded-lg ${statusVencimento.bg} flex items-center gap-2`}>
                      <ExclamationTriangleIcon className={`h-4 w-4 ${statusVencimento.color}`} />
                      <span className={`text-xs font-medium ${statusVencimento.color}`}>
                        {statusVencimento.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {produtos.length === 0 && (
          <div className="text-center py-12">
            <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comece criando seu primeiro produto pronto.
            </p>
          </div>
        )}
      </main>

      {/* Modal de Geração de Etiqueta */}
      {showEtiquetaModal && produtoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              Gerar Etiqueta - {produtoSelecionado.produto.nome}
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lote
                  </label>
                  <input
                    type="text"
                    value={dadosEtiqueta.lote}
                    onChange={(e) => setDadosEtiqueta(prev => ({ ...prev, lote: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Código do lote"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dadosEtiqueta.quantidade}
                    onChange={(e) => setDadosEtiqueta(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 1 }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Produção
                  </label>
                  <input
                    type="date"
                    value={dadosEtiqueta.dataProducao}
                    onChange={(e) => setDadosEtiqueta(prev => ({ ...prev, dataProducao: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Validade
                  </label>
                  <input
                    type="date"
                    value={dadosEtiqueta.dataValidade}
                    onChange={(e) => setDadosEtiqueta(prev => ({ ...prev, dataValidade: e.target.value }))}
                    min={dadosEtiqueta.dataProducao}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={dadosEtiqueta.observacoes}
                  onChange={(e) => setDadosEtiqueta(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Informações adicionais sobre a etiqueta..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowEtiquetaModal(false);
                  setProdutoSelecionado(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarGerarEtiqueta}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
              >
                Gerar Etiqueta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 