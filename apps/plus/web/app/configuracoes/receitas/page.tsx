'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Receita {
  id: string;
  nome: string;
  categoria: string;
  precoVenda: number;
  descricao?: string;
  tempoPreparo?: number;
  rendimento?: number;
  unidadeRendimento?: string;
  ativa: boolean;
  dataCriacao: string;
}

export default function ReceitasPage() {
  const router = useRouter();
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroStatus, setFiltroStatus] = useState('todas');

  useEffect(() => {
    carregarReceitas();
  }, []);

  const carregarReceitas = async () => {
    try {
      const response = await fetch('/api/receitas');
      if (response.ok) {
        const data = await response.json();
        setReceitas(data);
      } else {
        toast.error('Erro ao carregar receitas');
      }
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
      toast.error('Erro ao carregar receitas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta receita?')) {
      try {
        const response = await fetch(`/api/receitas/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setReceitas(prev => prev.filter(r => r.id !== id));
          toast.success('Receita excluída com sucesso!');
        } else {
          toast.error('Erro ao excluir receita');
        }
      } catch (error) {
        console.error('Erro ao excluir receita:', error);
        toast.error('Erro ao excluir receita');
      }
    }
  };

  const receitasFiltradas = receitas.filter(receita => {
    const matchBusca = !busca || 
      receita.nome.toLowerCase().includes(busca.toLowerCase()) ||
      receita.categoria.toLowerCase().includes(busca.toLowerCase());
    
    const matchCategoria = filtroCategoria === 'todas' || receita.categoria === filtroCategoria;
    const matchStatus = filtroStatus === 'todas' || 
      (filtroStatus === 'ativas' ? receita.ativa : !receita.ativa);
    
    return matchBusca && matchCategoria && matchStatus;
  });

  const categorias = [...new Set(receitas.map(r => r.categoria))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Carregando receitas...</div>
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
                <h1 className="text-3xl font-bold text-gray-900">Receitas</h1>
                <p className="text-gray-600 mt-1">Configure as receitas disponíveis para produção</p>
              </div>
              <button
                onClick={() => router.push('/configuracoes/receitas/novo')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nova Receita
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
              <option value="ativas">Ativas</option>
              <option value="inativas">Inativas</option>
            </select>
          </div>

          {/* Lista de Receitas */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {receitasFiltradas.map((receita) => (
                <li key={receita.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {receita.nome}
                          </h3>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Categoria: {receita.categoria}</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              receita.ativa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {receita.ativa ? 'Ativa' : 'Inativa'}
                            </span>
                          </div>
                          {receita.descricao && (
                            <p className="mt-1 text-sm text-gray-600">{receita.descricao}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            R$ {receita.precoVenda.toFixed(2)}
                          </div>
                          {receita.rendimento && (
                            <div className="text-sm text-gray-500">
                              Rendimento: {receita.rendimento} {receita.unidadeRendimento}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/configuracoes/receitas/${receita.id}/editar`)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Editar receita"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(receita.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir receita"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {receitasFiltradas.length === 0 && (
              <div className="text-center py-12">
                {busca || filtroCategoria !== 'todas' || filtroStatus !== 'todas' ? (
                  <>
                    <p className="text-gray-500 text-lg">Nenhuma receita encontrada</p>
                    <p className="text-gray-400 mt-2">Tente ajustar os filtros de busca</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 text-lg">Nenhuma receita cadastrada</p>
                    <p className="text-gray-400 mt-2">Comece adicionando sua primeira receita!</p>
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
