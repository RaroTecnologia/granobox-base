'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { PlusIcon, MinusIcon, TrashIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { dataStore } from '@/lib/data';
import { Receita, Cliente, ItemPedido } from '@/types';

export default function PDVPage() {
  const [carrinho, setCarrinho] = useState<ItemPedido[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix'>('dinheiro');
  const [desconto, setDesconto] = useState(0);

  const receitas = dataStore.getReceitas().filter(r => r.ativo);
  const clientes = dataStore.getClientes().filter(c => c.ativo);

  const adicionarAoCarrinho = (receita: Receita) => {
    const itemExistente = carrinho.find(item => item.receitaId === receita.id);
    
    if (itemExistente) {
      setCarrinho(carrinho.map(item => 
        item.receitaId === receita.id 
          ? { ...item, quantidade: item.quantidade + 1, subtotal: (item.quantidade + 1) * item.precoUnitario }
          : item
      ));
    } else {
      const novoItem: ItemPedido = {
        receitaId: receita.id,
        quantidade: 1,
        precoUnitario: receita.precoVenda,
        subtotal: receita.precoVenda,
        receita
      };
      setCarrinho([...carrinho, novoItem]);
    }
  };

  const removerDoCarrinho = (receitaId: string) => {
    setCarrinho(carrinho.filter(item => item.receitaId !== receitaId));
  };

  const alterarQuantidade = (receitaId: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerDoCarrinho(receitaId);
      return;
    }

    setCarrinho(carrinho.map(item => 
      item.receitaId === receitaId 
        ? { ...item, quantidade: novaQuantidade, subtotal: novaQuantidade * item.precoUnitario }
        : item
    ));
  };

  const subtotal = carrinho.reduce((total, item) => total + item.subtotal, 0);
  const total = subtotal - desconto;

  const finalizarVenda = () => {
    if (carrinho.length === 0) {
      alert('Adicione itens ao carrinho antes de finalizar a venda.');
      return;
    }

    const novoPedido = {
      clienteId: clienteSelecionado?.id,
      itens: carrinho,
      subtotal,
      desconto,
      total,
      status: 'pronto' as const,
      tipo: 'balcao' as const,
      formaPagamento,
      observacoes: ''
    };

    dataStore.addPedido(novoPedido);
    
    // Limpar carrinho
    setCarrinho([]);
    setClienteSelecionado(null);
    setDesconto(0);
    
    alert('Venda finalizada com sucesso!');
  };

  const getCategoriaColor = (categoria: string) => {
    const colors: { [key: string]: string } = {
      'pao': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'doce': 'bg-pink-100 text-pink-800 border-pink-200',
      'salgado': 'bg-orange-100 text-orange-800 border-orange-200',
      'bebida': 'bg-blue-100 text-blue-800 border-blue-200',
      'outro': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[categoria] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">PDV - Ponto de Venda</h1>
            <p className="mt-2 text-gray-600">Sistema de vendas no balcão</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Produtos */}
            <div className="lg:col-span-2">
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Produtos Disponíveis</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {receitas.map((receita) => (
                    <div 
                      key={receita.id} 
                      className={`border-2 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${getCategoriaColor(receita.categoria)}`}
                      onClick={() => adicionarAoCarrinho(receita)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{receita.nome}</h3>
                        <span className="text-lg font-bold text-primary-600">
                          R$ {receita.precoVenda.toFixed(2)}
                        </span>
                      </div>
                      
                      {receita.descricao && (
                        <p className="text-sm text-gray-600 mb-2">{receita.descricao}</p>
                      )}
                      
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Rendimento: {receita.rendimento}</span>
                        <span>{receita.tempoPreparo} min</span>
                      </div>
                    </div>
                  ))}
                </div>

                {receitas.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhum produto ativo disponível para venda.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Carrinho */}
            <div className="lg:col-span-1">
              <div className="card sticky top-6">
                <div className="flex items-center mb-4">
                  <ShoppingCartIcon className="h-6 w-6 text-gray-600 mr-2" />
                  <h2 className="text-xl font-semibold text-gray-900">Carrinho ({carrinho.length})</h2>
                </div>

                {/* Cliente */}
                <div className="mb-4">
                  <label className="label">Cliente (Opcional)</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowClienteModal(true)}
                      className="btn-outline flex-1"
                    >
                      {clienteSelecionado ? clienteSelecionado.nome : 'Selecionar Cliente'}
                    </button>
                    {clienteSelecionado && (
                      <button
                        onClick={() => setClienteSelecionado(null)}
                        className="btn-outline px-3"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Itens do Carrinho */}
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {carrinho.map((item) => (
                    <div key={item.receitaId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.receita?.nome}</h4>
                        <p className="text-sm text-gray-600">R$ {item.precoUnitario.toFixed(2)} cada</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => alterarQuantidade(item.receitaId, item.quantidade - 1)}
                          className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                        >
                          <MinusIcon className="w-3 h-3" />
                        </button>
                        
                        <span className="w-8 text-center font-medium">{item.quantidade}</span>
                        
                        <button
                          onClick={() => alterarQuantidade(item.receitaId, item.quantidade + 1)}
                          className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                        >
                          <PlusIcon className="w-3 h-3" />
                        </button>
                        
                        <button
                          onClick={() => removerDoCarrinho(item.receitaId)}
                          className="w-6 h-6 rounded-full bg-red-200 flex items-center justify-center hover:bg-red-300 ml-2"
                        >
                          <TrashIcon className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {carrinho.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCartIcon className="mx-auto h-12 w-12 mb-2" />
                    <p>Carrinho vazio</p>
                  </div>
                )}

                {/* Desconto */}
                {carrinho.length > 0 && (
                  <div className="mb-4">
                    <label className="label">Desconto (R$)</label>
                    <input
                      type="number"
                      min="0"
                      max={subtotal}
                      step="0.01"
                      value={desconto}
                      onChange={(e) => setDesconto(Number(e.target.value))}
                      className="input-field"
                    />
                  </div>
                )}

                {/* Forma de Pagamento */}
                {carrinho.length > 0 && (
                  <div className="mb-4">
                    <label className="label">Forma de Pagamento</label>
                    <select
                      value={formaPagamento}
                      onChange={(e) => setFormaPagamento(e.target.value as any)}
                      className="input-field"
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="pix">PIX</option>
                    </select>
                  </div>
                )}

                {/* Totais */}
                {carrinho.length > 0 && (
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>R$ {subtotal.toFixed(2)}</span>
                    </div>
                    {desconto > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Desconto:</span>
                        <span>- R$ {desconto.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-semibold border-t pt-2">
                      <span>Total:</span>
                      <span>R$ {total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Botão Finalizar */}
                {carrinho.length > 0 && (
                  <button
                    onClick={finalizarVenda}
                    className="btn-primary w-full mt-4"
                  >
                    Finalizar Venda
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Seleção de Cliente */}
      {showClienteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Selecionar Cliente</h3>
            
            <div className="space-y-2">
              {clientes.map((cliente) => (
                <button
                  key={cliente.id}
                  onClick={() => {
                    setClienteSelecionado(cliente);
                    setShowClienteModal(false);
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200"
                >
                  <div className="font-medium">{cliente.nome}</div>
                  {cliente.telefone && (
                    <div className="text-sm text-gray-500">{cliente.telefone}</div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowClienteModal(false)}
                className="btn-outline"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 