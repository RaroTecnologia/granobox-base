'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Manipulado {
  id: string;
  nome: string;
  descricao?: string;
  categoria: string;
  unidade: string;
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

export default function ManipuladosPage() {
  const router = useRouter();
  const [manipulados, setManipulados] = useState<Manipulado[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroStatus, setFiltroStatus] = useState('todas');

  useEffect(() => {
    carregarManipulados();
  }, []);

  const carregarManipulados = async () => {
    try {
      const response = await fetch('/api/manipulados');
      if (response.ok) {
        const data = await response.json();
        setManipulados(data);
      } else {
        toast.error('Erro ao carregar manipulados');
      }
    } catch (error) {
      console.error('Erro ao carregar manipulados:', error);
      toast.error('Erro ao carregar manipulados');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este manipulado?')) {
      try {
        const response = await fetch(`/api/manipulados/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setManipulados(prev => prev.filter(m => m.id !== id));
          toast.success('Manipulado excluído com sucesso!');
        } else {
          toast.error('Erro ao excluir manipulado');
        }
      } catch (error) {
        console.error('Erro ao excluir manipulado:', error);
        toast.error('Erro ao excluir manipulado');
      }
    }
  };

  const manipuladosFiltrados = manipulados.filter(manipulado => {
    const matchBusca = !busca || 
      manipulado.nome.toLowerCase().includes(busca.toLowerCase()) ||
      manipulado.categoria.toLowerCase().includes(busca.toLowerCase());
    
    const matchCategoria = filtroCategoria === 'todas' || manipulado.categoria === filtroCategoria;
    const matchStatus = filtroStatus === 'todas' || 
      (filtroStatus === 'ativos' ? manipulado.ativo : !manipulado.ativo);
    
    return matchBusca && matchCategoria && matchStatus;
  });

  const categorias = [...new Set(manipulados.map(m => m.categoria))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Carregando manipulados...</div>
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
                <h1 className="text-3xl font-bold text-gray-900">Manipulados</h1>
                <p className="text-gray-600 mt-1">Configure os produtos manipulados e processados</p>
              </div>
              <button
                onClick={() => router.push('/configuracoes/manipulados/novo')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Novo Manipulado
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

          {/* Lista de Manipulados */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {manipuladosFiltrados.map((manipulado) => (
                <li key={manipulado.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {manipulado.nome}
                          </h3>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            <span>Categoria: {manipulado.categoria}</span>
                            <span>Unidade: {manipulado.unidade}</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConservacaoColors[manipulado.conservacaoRecomendada]}`}>
                              {statusConservacaoLabels[manipulado.conservacaoRecomendada]}
                            </span>
                          </div>
                          {manipulado.descricao && (
                            <p className="mt-1 text-sm text-gray-600">{manipulado.descricao}</p>
                          )}
                          {manipulado.instrucoes && (
                            <p className="mt-1 text-sm text-gray-500">Instruções: {manipulado.instrucoes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            manipulado.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {manipulado.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/configuracoes/manipulados/${manipulado.id}/editar`)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Editar manipulado"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(manipulado.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir manipulado"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {manipuladosFiltrados.length === 0 && (
              <div className="text-center py-12">
                {busca || filtroCategoria !== 'todas' || filtroStatus !== 'todas' ? (
                  <>
                    <p className="text-gray-500 text-lg">Nenhum manipulado encontrado</p>
                    <p className="text-gray-400 mt-2">Tente ajustar os filtros de busca</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 text-lg">Nenhum manipulado cadastrado</p>
                    <p className="text-gray-400 mt-2">Comece adicionando seu primeiro manipulado!</p>
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
