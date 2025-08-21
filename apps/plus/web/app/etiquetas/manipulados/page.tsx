'use client';

import Navigation from '@/components/Navigation';
import { 
  BeakerIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PrinterIcon,
  MagnifyingGlassIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatarDataAmigavel } from '@/lib/etiquetaUtils';
import toast from 'react-hot-toast';

interface EtiquetaManipulado {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
  categoria: string;
  unidade: string;
  quantidade: number;
  processo: string;
  dataProducao: string;
  dataValidade: string;
  conservacao: 'TEMPERATURA_AMBIENTE' | 'CONGELADO' | 'RESFRIADO';
  lote: string;
  dataCriacao: string;
  ativa: boolean;
}

export default function EtiquetasManipuladosPage() {
  const searchParams = useSearchParams();
  const [etiquetas, setEtiquetas] = useState<EtiquetaManipulado[]>([]);
  const [busca, setBusca] = useState('');
  const [etiquetasFiltradas, setEtiquetasFiltradas] = useState<EtiquetaManipulado[]>([]);
  const [selectedEtiqueta, setSelectedEtiqueta] = useState<EtiquetaManipulado | null>(null);

  useEffect(() => {
    // Carregar etiquetas do localStorage
    const etiquetasSalvas = localStorage.getItem('etiquetasManipulados');
    if (etiquetasSalvas) {
      const etiquetasData = JSON.parse(etiquetasSalvas);
      setEtiquetas(etiquetasData);
      setEtiquetasFiltradas(etiquetasData);
    }

    // Verificar se há uma etiqueta selecionada na URL
    const etiquetaId = searchParams.get('etiquetaId');
    if (etiquetaId) {
      const etiquetasSalvas = localStorage.getItem('etiquetasManipulados');
      if (etiquetasSalvas) {
        const etiquetasData = JSON.parse(etiquetasSalvas);
        const etiquetaEncontrada = etiquetasData.find((e: EtiquetaManipulado) => e.id === etiquetaId);
        if (etiquetaEncontrada) {
          setSelectedEtiqueta(etiquetaEncontrada);
          // Mostrar notificação de sucesso
          toast.success(`Etiqueta "${etiquetaEncontrada.nome}" criada com sucesso!`);
        }
      }
    }
  }, [searchParams]);

  // Filtrar etiquetas baseado na busca
  useEffect(() => {
    if (busca.trim()) {
      const filtradas = etiquetas.filter(etiqueta =>
        etiqueta.nome.toLowerCase().includes(busca.toLowerCase()) ||
        etiqueta.codigo.toLowerCase().includes(busca.toLowerCase()) ||
        etiqueta.categoria.toLowerCase().includes(busca.toLowerCase())
      );
      setEtiquetasFiltradas(filtradas);
    } else {
      setEtiquetasFiltradas(etiquetas);
    }
  }, [busca, etiquetas]);

  const handleImprimir = (etiqueta: EtiquetaManipulado) => {
    // Implementar lógica de impressão
    console.log('Imprimindo etiqueta:', etiqueta);
    toast.success(`Etiqueta "${etiqueta.nome}" impressa com sucesso!`);
    setSelectedEtiqueta(null); // Fechar a etiqueta selecionada após a impressão
  };

  const handleEditar = (etiqueta: EtiquetaManipulado) => {
    // Implementar lógica de edição
    console.log('Editando etiqueta:', etiqueta);
    toast.info('Funcionalidade de edição será implementada em breve!');
  };

  const handleExcluir = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta etiqueta?')) {
      const etiquetasAtualizadas = etiquetas.filter(e => e.id !== id);
      setEtiquetas(etiquetasAtualizadas);
      setEtiquetasFiltradas(etiquetasAtualizadas);
      localStorage.setItem('etiquetasManipulados', JSON.stringify(etiquetasAtualizadas));
      toast.success('Etiqueta excluída com sucesso!');
      
      // Se a etiqueta excluída era a selecionada, limpar a seleção
      if (selectedEtiqueta?.id === id) {
        setSelectedEtiqueta(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BeakerIcon className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Etiquetas - Manipulados</h1>
                  <p className="mt-2 text-gray-600">Gerencie etiquetas para produtos manipulados e processados</p>
                </div>
              </div>
              <button
                onClick={() => toast.info('Funcionalidade será implementada em breve!')}
                className="btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nova Etiqueta
              </button>
            </div>
          </div>

          {/* Etiqueta Selecionada */}
          {selectedEtiqueta && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CubeIcon className="h-6 w-6 text-green-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">
                      Etiqueta Criada: {selectedEtiqueta.nome}
                    </h3>
                    <p className="text-sm text-green-700">
                      Código: {selectedEtiqueta.codigo} | Lote: {selectedEtiqueta.lote} | Validade: {formatarDataAmigavel(selectedEtiqueta.dataValidade)}
                    </p>
                    <p className="text-sm text-green-600">
                      Categoria: {selectedEtiqueta.categoria} | Quantidade: {selectedEtiqueta.quantidade} {selectedEtiqueta.unidade}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleImprimir(selectedEtiqueta)} className="btn-primary">
                    <PrinterIcon className="h-4 w-4 mr-2" /> Imprimir Agora
                  </button>
                  <button onClick={() => setSelectedEtiqueta(null)} className="btn-secondary">Fechar</button>
                </div>
              </div>
            </div>
          )}

          {/* Busca */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar etiquetas por nome ou código..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Lista de Etiquetas */}
          <div className="card">
              <div className="px-6 py-4 border-b border-gray-200">
    <h2 className="text-lg font-semibold text-gray-900">
      Etiquetas ({etiquetasFiltradas.length})
    </h2>
  </div>
            
                          {etiquetasFiltradas.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma etiqueta encontrada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {busca ? 'Tente ajustar os termos de busca.' : 'Comece criando sua primeira etiqueta.'}
                </p>
                {!busca && (
                  <div className="mt-6">
                    <button
                      onClick={() => toast.info('Funcionalidade será implementada em breve!')}
                      className="btn-primary"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Criar Etiqueta
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantidade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Produção
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Validade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {etiquetasFiltradas.map((etiqueta) => (
                      <tr key={etiqueta.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{etiqueta.nome}</div>
                            <div className="text-sm text-gray-500">{etiqueta.descricao}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {etiqueta.codigo}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {etiqueta.categoria}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {etiqueta.quantidade} {etiqueta.unidade}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatarDataAmigavel(etiqueta.dataProducao)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatarDataAmigavel(etiqueta.dataValidade)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleImprimir(etiqueta)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Imprimir"
                            >
                              <PrinterIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditar(etiqueta)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Editar"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleExcluir(etiqueta.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Excluir"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>


    </div>
  );
}
