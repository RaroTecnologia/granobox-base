'use client';

import Navigation from '@/components/Navigation';
import { 
  CubeIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PrinterIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatarDataAmigavel } from '@/lib/etiquetaUtils';

interface EtiquetaMateriaPrima {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
  unidade: string;
  lote: string;
  dataValidade: string;
  dataCriacao: string;
  ativa: boolean;
}

export default function EtiquetasMateriaPrimaPage() {
  const searchParams = useSearchParams();
  const [etiquetas, setEtiquetas] = useState<EtiquetaMateriaPrima[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEtiqueta, setSelectedEtiqueta] = useState<EtiquetaMateriaPrima | null>(null);

  // Carregar etiquetas do localStorage
  useEffect(() => {
    const etiquetasSalvas = localStorage.getItem('etiquetasMateriaPrima');
    if (etiquetasSalvas) {
      setEtiquetas(JSON.parse(etiquetasSalvas));
    }
  }, []);

  // Verificar se há uma etiqueta específica na URL
  useEffect(() => {
    const etiquetaId = searchParams.get('etiquetaId');
    if (etiquetaId) {
      const etiqueta = etiquetas.find(e => e.id === etiquetaId);
      if (etiqueta) {
        setSelectedEtiqueta(etiqueta);
        // Limpar a URL para não mostrar o parâmetro
        window.history.replaceState({}, '', '/etiquetas/materia-prima');
        // Mostrar notificação de sucesso
        alert(`Etiqueta criada com sucesso para "${etiqueta.nome}"!`);
      }
    }
  }, [searchParams, etiquetas]);

  const filteredEtiquetas = etiquetas.filter(etiqueta =>
    etiqueta.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    etiqueta.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImprimir = (etiqueta: EtiquetaMateriaPrima) => {
    // TODO: Implementar impressão via Agent Local
    console.log('Imprimindo etiqueta:', etiqueta);
    alert('Funcionalidade de impressão em desenvolvimento!');
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta etiqueta?')) {
      const novasEtiquetas = etiquetas.filter(e => e.id !== id);
      setEtiquetas(novasEtiquetas);
      localStorage.setItem('etiquetasMateriaPrima', JSON.stringify(novasEtiquetas));
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
                <CubeIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Etiquetas - Matéria Prima</h1>
                  <p className="mt-2 text-gray-600">Gerencie etiquetas para ingredientes e componentes básicos</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nova Etiqueta
              </button>
            </div>
          </div>

          {/* Barra de Busca */}
          <div className="mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar etiquetas por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Etiqueta Selecionada (quando criada automaticamente) */}
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
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleImprimir(selectedEtiqueta)}
                    className="btn-primary"
                  >
                    <PrinterIcon className="h-4 w-4 mr-2" />
                    Imprimir Agora
                  </button>
                  <button
                    onClick={() => setSelectedEtiqueta(null)}
                    className="btn-secondary"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Etiquetas */}
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Etiquetas ({filteredEtiquetas.length})
              </h2>
            </div>
            
            {filteredEtiquetas.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma etiqueta encontrada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Tente ajustar os termos de busca.' : 'Comece criando sua primeira etiqueta.'}
                </p>
                {!searchTerm && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowCreateModal(true)}
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
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lote
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Validade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEtiquetas.map((etiqueta) => (
                      <tr key={etiqueta.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{etiqueta.nome}</div>
                            <div className="text-sm text-gray-500">{etiqueta.descricao}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {etiqueta.codigo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {etiqueta.lote}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatarDataAmigavel(etiqueta.dataValidade)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            etiqueta.ativa 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {etiqueta.ativa ? 'Ativa' : 'Inativa'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleImprimir(etiqueta)}
                              className="text-primary-600 hover:text-primary-900"
                              title="Imprimir"
                            >
                              <PrinterIcon className="h-4 w-4" />
                            </button>
                            <button
                              className="text-gray-600 hover:text-gray-900"
                              title="Editar"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(etiqueta.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Excluir"
                            >
                              <TrashIcon className="h-4 w-4" />
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

      {/* TODO: Modal para criar/editar etiqueta */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Criar Nova Etiqueta</h3>
              <p className="text-sm text-gray-500 mt-2">
                Funcionalidade em desenvolvimento...
              </p>
              <div className="mt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
