'use client';

import { useState, useEffect } from 'react';
import { PrinterIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface ItemCompra {
  id: string;
  ingredienteId?: string;
  nome: string;
  quantidade: number;
  unidade: string;
  observacoes?: string;
  comprado: boolean;
  adicionadoEm: string;
  ingrediente?: {
    id: string;
    nome: string;
    unidade: string;
    custoUnitario: number;
    estoqueAtual: number;
    estoqueMinimo: number;
    fornecedor?: string;
  };
}

export default function CompartilharListaPage() {
  const [itens, setItens] = useState<ItemCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<ItemCompra | null>(null);
  const [quantidadeComprada, setQuantidadeComprada] = useState<number>(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    const carregarItens = async () => {
      try {
        const response = await fetch('/api/lista-compras');
        if (response.ok) {
          const itensCarregados = await response.json();
          // Filtrar observações de estoque baixo
          const itensFormatados = itensCarregados.map((item: any) => ({
            ...item,
            observacoes: item.observacoes?.includes('estoque baixo') ? undefined : item.observacoes
          }));
          setItens(itensFormatados);
        } else {
          console.error('Erro ao carregar lista de compras');
        }
      } catch (error) {
        console.error('Erro ao carregar lista de compras:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarItens();
  }, []);

  const handleImprimir = () => {
    window.print();
  };

  const handleItemClick = (item: ItemCompra) => {
    if (item.comprado) return; // Não permitir alterar itens já comprados
    
    setItemSelecionado(item);
    setQuantidadeComprada(item.quantidade);
    setShowConfirmModal(true);
  };

  const confirmarCompra = async () => {
    if (!itemSelecionado) return;

    const loadingToast = toast.loading('Marcando item como comprado...');

    try {
      const response = await fetch('/api/lista-compras', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: itemSelecionado.id,
          quantidade: quantidadeComprada,
          comprado: true
        }),
      });

      if (response.ok) {
        // Atualizar o item na lista local
        setItens(prevItens => 
          prevItens.map(item => 
            item.id === itemSelecionado.id 
              ? { ...item, comprado: true, quantidade: quantidadeComprada }
              : item
          )
        );
        
        toast.success('Item marcado como comprado!', { id: loadingToast });
        setShowConfirmModal(false);
        setItemSelecionado(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao marcar item como comprado', {
          id: loadingToast
        });
      }
    } catch (error) {
      console.error('Erro ao marcar item como comprado:', error);
      toast.error('Erro ao marcar item como comprado', {
        id: loadingToast
      });
    }
  };

  const cancelarConfirmacao = () => {
    setShowConfirmModal(false);
    setItemSelecionado(null);
    setQuantidadeComprada(0);
  };

  const desmarcarItem = async (item: ItemCompra) => {
    const loadingToast = toast.loading('Desmarcando item...');

    try {
      const response = await fetch('/api/lista-compras', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: item.id,
          comprado: false
        }),
      });

      if (response.ok) {
        // Atualizar o item na lista local
        setItens(prevItens => 
          prevItens.map(i => 
            i.id === item.id 
              ? { ...i, comprado: false }
              : i
          )
        );
        
        toast.success('Item desmarcado!', { id: loadingToast });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao desmarcar item', {
          id: loadingToast
        });
      }
    } catch (error) {
      console.error('Erro ao desmarcar item:', error);
      toast.error('Erro ao desmarcar item', {
        id: loadingToast
      });
    }
  };

  const itensNaoComprados = itens.filter(item => !item.comprado);
  const itensComprados = itens.filter(item => item.comprado);
  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg text-gray-600">Carregando lista...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho - oculto na impressão */}
      <div className="print:hidden bg-orange-600 text-white p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Lista de Compras</h1>
            <p className="text-orange-100 text-sm">Granobox - {dataAtual}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleImprimir}
              className="inline-flex items-center px-3 py-2 bg-orange-500 hover:bg-orange-400 rounded-lg text-sm font-medium transition-colors"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* Cabeçalho para impressão */}
      <div className="hidden print:block p-6 border-b">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lista de Compras</h1>
          <p className="text-gray-600">Granobox - {dataAtual}</p>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {itens.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">Lista de compras vazia</p>
              <p className="text-gray-400 mt-2">Nenhum item foi adicionado ainda</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Botão de Ajuda */}
              <div className="flex justify-end print:hidden">
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Como usar esta lista"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>

              {/* Instruções (expansível) */}
              {showInstructions && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 print:hidden animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-bold">i</span>
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-blue-800">
                          Como usar esta lista
                        </h3>
                        <button
                          onClick={() => setShowInstructions(false)}
                          className="text-blue-400 hover:text-blue-600 p-1"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>• Clique em qualquer item pendente para marcá-lo como comprado</p>
                        <p>• Você pode ajustar a quantidade antes de confirmar</p>
                        <p>• Clique em itens comprados para desmarcá-los se necessário</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">{itens.length}</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total de Itens
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {itens.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckIcon className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Comprados
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {itensComprados.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 font-bold">!</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Pendentes
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {itensNaoComprados.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de Itens Pendentes */}
              {itensNaoComprados.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Itens Pendentes</h2>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {itensNaoComprados.map((item, index) => (
                      <div 
                        key={item.id} 
                        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-all duration-200 border-l-4"
                        style={{ 
                          borderLeftColor: hoveredItem === item.id ? '#4ade80' : 'transparent'
                        }}
                        onClick={() => handleItemClick(item)}
                        onMouseEnter={() => setHoveredItem(item.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        <div className="flex items-center flex-1">
                          <div className="mr-4 p-1 rounded-full border-2 border-gray-300 hover:border-green-400 transition-colors">
                            <div className="w-4 h-4"></div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900">
                              {item.nome}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Quantidade: {item.quantidade} {item.unidade}
                            </p>
                            {item.observacoes && (
                              <p className="text-xs text-gray-400 mt-1">{item.observacoes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 print:hidden flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          Clique para marcar
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista de Itens Comprados */}
              {itensComprados.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Itens Comprados</h2>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {itensComprados.map((item, index) => (
                      <div 
                        key={item.id} 
                        className="px-6 py-4 flex items-center justify-between opacity-60 cursor-pointer hover:opacity-80 transition-all duration-200 print:cursor-default print:hover:opacity-60 border-l-4 border-green-500 hover:border-green-600"
                        onClick={() => desmarcarItem(item)}
                      >
                        <div className="flex items-center flex-1">
                          <div className="mr-4 p-1 rounded-full border-2 border-green-500 bg-green-500 hover:bg-green-600 transition-colors">
                            <CheckIcon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-gray-900 line-through">
                              {item.nome}
                            </h3>
                            <p className="text-sm text-gray-500 line-through">
                              Quantidade: {item.quantidade} {item.unidade}
                            </p>
                            {item.observacoes && (
                              <p className="text-xs text-gray-400 mt-1">{item.observacoes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 print:hidden flex items-center gap-1">
                          <CheckIcon className="w-3 h-3 text-green-500" />
                          Clique para desmarcar
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Rodapé */}
      <div className="border-t bg-gray-50 p-6 mt-8">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-500">
          <p>Lista gerada pelo sistema Granobox</p>
          <p className="mt-1">Sistema de Gestão para Padarias e Confeitarias</p>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {showConfirmModal && itemSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmar Compra
              </h3>
              <button
                onClick={cancelarConfirmacao}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Você está marcando como comprado:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">{itemSelecionado.nome}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Quantidade original: {itemSelecionado.quantidade} {itemSelecionado.unidade}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade comprada:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={quantidadeComprada}
                  onChange={(e) => setQuantidadeComprada(parseFloat(e.target.value) || 0)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-600">{itemSelecionado.unidade}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Ajuste a quantidade se necessário
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelarConfirmacao}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCompra}
                disabled={quantidadeComprada <= 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <CheckIcon className="h-4 w-4" />
                Confirmar Compra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 