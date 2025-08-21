'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { 
  PlusIcon, 
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { PlanoProducao } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function ProducaoPage() {
  const [planos, setPlanos] = useState<PlanoProducao[]>([]);
  const [planosFiltrados, setPlanosFiltrados] = useState<PlanoProducao[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados dos filtros
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroData, setFiltroData] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  useEffect(() => {
    carregarPlanos();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [planos, filtroStatus, filtroData, filtroBusca]);

  const carregarPlanos = async () => {
    try {
      const response = await fetch('/api/planos-producao');
      if (response.ok) {
        const data = await response.json();
        setPlanos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast.error('Erro ao carregar planos de produção');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let planosFiltrados = [...planos];

    // Filtro por status
    if (filtroStatus !== 'todos') {
      planosFiltrados = planosFiltrados.filter(plano => plano.status === filtroStatus);
    }

         // Filtro por data
     if (filtroData) {
       planosFiltrados = planosFiltrados.filter(plano => 
         format(new Date(plano.data), 'yyyy-MM-dd') === filtroData
       );
     }

    // Filtro por busca (observações)
    if (filtroBusca) {
      planosFiltrados = planosFiltrados.filter(plano => 
        plano.observacoes?.toLowerCase().includes(filtroBusca.toLowerCase())
      );
    }

    setPlanosFiltrados(planosFiltrados);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planejado': return 'bg-yellow-100 text-yellow-800';
      case 'em_producao': return 'bg-blue-100 text-blue-800';
      case 'concluido': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planejado': return 'Planejado';
      case 'em_producao': return 'Em Produção';
      case 'concluido': return 'Concluído';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const calcularResumoPlano = (plano: PlanoProducao) => {
    const totalItens = plano.itens.reduce((acc, item) => acc + item.quantidade, 0);
    const totalPeso = plano.itens.reduce((acc, item) => 
      acc + (item.quantidade * (item.receita?.pesoUnitario || 0)), 0
    );
    const totalTempo = plano.itens.reduce((acc, item) => 
      acc + (item.quantidade * (item.receita?.tempoPreparo || 0)), 0
    );

    return { totalItens, totalPeso, totalTempo };
  };

  const limparFiltros = () => {
    setFiltroStatus('todos');
    setFiltroData('');
    setFiltroBusca('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Produção</h1>
              <p className="text-gray-600">Gerencie seus planos de produção</p>
            </div>
            <Link href="/producao/novo" className="btn-primary">
              <PlusIcon className="w-5 h-5 mr-2" />
              Novo Plano
            </Link>
          </div>

          {/* Barra de filtros */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Busca */}
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar nas observações..."
                    value={filtroBusca}
                    onChange={(e) => setFiltroBusca(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtro Status */}
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos os Status</option>
                <option value="planejado">Planejado</option>
                <option value="em_producao">Em Produção</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>

              {/* Filtro Data */}
              <input
                type="date"
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {/* Botões */}
              <button
                onClick={limparFiltros}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Limpar
              </button>
            </div>

            {/* Contador de resultados */}
            <div className="mt-3 text-sm text-gray-500">
              {planosFiltrados.length} de {planos.length} planos
            </div>
          </div>
        </div>

        {/* Lista de Planos */}
        <div className="space-y-4">
          {planosFiltrados.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <p className="text-gray-500">Nenhum plano de produção encontrado</p>
              <Link href="/producao/novo" className="btn-primary mt-4 inline-flex">
                <PlusIcon className="w-5 h-5 mr-2" />
                Criar Primeiro Plano
              </Link>
            </div>
          ) : (
            planosFiltrados.map((plano) => {
              const resumo = calcularResumoPlano(plano);
              
              return (
                <div key={plano.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div>
                                                     <h3 className="text-lg font-semibold text-gray-900">
                             Produção - {format(new Date(plano.data), 'dd/MM/yyyy', { locale: ptBR })}
                           </h3>
                           <p className="text-sm text-gray-500">
                             Criado em {format(new Date(plano.dataCriacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                           </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(plano.status)}`}>
                          {getStatusLabel(plano.status)}
                        </span>
                      </div>
                      
                      <Link 
                        href={`/producao/${plano.id}`}
                        className="btn-outline flex items-center"
                      >
                        <EyeIcon className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Link>
                    </div>

                    {/* Resumo rápido */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-gray-500">Itens</div>
                        <div className="text-lg font-semibold">{resumo.totalItens}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-gray-500">Peso Total</div>
                        <div className="text-lg font-semibold">{(resumo.totalPeso / 1000).toFixed(1)} kg</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-gray-500">Tempo Est.</div>
                        <div className="text-lg font-semibold">{Math.round(resumo.totalTempo / 60)}h</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm text-gray-500">Receitas</div>
                        <div className="text-lg font-semibold">{plano.itens.length}</div>
                      </div>
                    </div>

                    {/* Observações (se houver) */}
                    {plano.observacoes && (
                      <div className="text-sm text-gray-600 bg-gray-50 rounded p-3">
                        <strong>Observações:</strong> {plano.observacoes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
} 