'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  categoria: string;
  unidade: string;
  precoVenda: number;
  conservacaoRecomendada: 'TEMPERATURA_AMBIENTE' | 'CONGELADO' | 'RESFRIADO';
  instrucoes?: string;
  ativo: boolean;
  dataCriacao: string;
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

export default function ProdutosPage() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroStatus, setFiltroStatus] = useState('todas');

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      const response = await fetch('/api/produtos');
      if (response.ok) {
        const data = await response.json();
        setProdutos(data);
      } else {
        toast.error('Erro ao carregar produtos');
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        const response = await fetch(`/api/produtos/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setProdutos(prev => prev.filter(p => p.id !== id));
          toast.success('Produto excluído com sucesso!');
        } else {
          toast.error('Erro ao excluir produto');
        }
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        toast.error('Erro ao excluir produto');
      }
    }
  };

  const produtosFiltrados = produtos.filter(produto => {
    const matchBusca = !busca || 
      produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
      produto.categoria.toLowerCase().includes(busca.toLowerCase());
    
    const matchCategoria = filtroCategoria === 'todas' || produto.categoria === filtroCategoria;
    const matchStatus = filtroStatus === 'todas' || 
      (filtroStatus === 'ativos' ? produto.ativo : !produto.ativo);
    
    return matchBusca && matchCategoria && matchStatus;
  });

  const categorias = [...new Set(produtos.map(p => p.categoria))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Carregando produtos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Produtos</h1>
                <p className="text-gray-600 mt-1">Configure os produtos finais disponíveis</p>
              </div>
              <button
                onClick={() => router.push('/configuracoes/produtos/novo')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Novo Produto
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Buscar por nome ou categoria..."
                />
              </div>
            </div>

            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todas">Todas as categorias</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todas">Todos os status</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
          </div>

          {/* Lista de Produtos */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {produtosFiltrados.map((produto) => (
                <li key={produto.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {produto.nome}
                          </h3>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Categoria: {produto.categoria}</span>
                            <span>Unidade: {produto.unidade}</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConservacaoColors[produto.conservacaoRecomendada]}`}>
                              {statusConservacaoLabels[produto.conservacaoRecomendada]}
                            </span>
                          </div>
                          {produto.descricao && (
                            <p className="mt-1 text-sm text-gray-600">{produto.descricao}</p>
                          )}
                          {produto.instrucoes && (
                            <p className="mt-1 text-sm text-gray-500">Instruções: {produto.instrucoes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            R$ {produto.precoVenda.toFixed(2)}
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            produto.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {produto.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/configuracoes/produtos/${produto.id}/editar`)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Editar produto"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(produto.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir produto"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {produtosFiltrados.length === 0 && (
              <div className="text-center py-12">
                {busca || filtroCategoria !== 'todas' || filtroStatus !== 'todas' ? (
                  <>
                    <p className="text-gray-500 text-lg">Nenhum produto encontrado</p>
                    <p className="text-gray-400 mt-2">Tente ajustar os filtros de busca</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 text-lg">Nenhum produto cadastrado</p>
                    <p className="text-gray-400 mt-2">Comece adicionando seu primeiro produto!</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
