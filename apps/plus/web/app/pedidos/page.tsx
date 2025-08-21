'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { ClipboardDocumentListIcon, EyeIcon } from '@heroicons/react/24/outline';
import { dataStore } from '@/lib/data';
import { Pedido } from '@/types';
import { format } from 'date-fns';

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState(dataStore.getPedidos());
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [showDetalhes, setShowDetalhes] = useState<Pedido | null>(null);

  const clientes = dataStore.getClientes();
  const receitas = dataStore.getReceitas();

  const pedidosFiltrados = pedidos.filter(pedido => {
    return filtroStatus === 'todos' || pedido.status === filtroStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'pendente': 'bg-yellow-100 text-yellow-800',
      'preparando': 'bg-blue-100 text-blue-800',
      'pronto': 'bg-green-100 text-green-800',
      'entregue': 'bg-gray-100 text-gray-800',
      'cancelado': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'pendente': 'Pendente',
      'preparando': 'Preparando',
      'pronto': 'Pronto',
      'entregue': 'Entregue',
      'cancelado': 'Cancelado'
    };
    return labels[status] || status;
  };

  const getTipoLabel = (tipo: string) => {
    const labels: { [key: string]: string } = {
      'balcao': 'Balcão',
      'online': 'Online',
      'delivery': 'Delivery'
    };
    return labels[tipo] || tipo;
  };

  const atualizarStatus = (pedidoId: string, novoStatus: string) => {
    dataStore.updatePedido(pedidoId, { status: novoStatus as any });
    setPedidos(dataStore.getPedidos());
  };

  const estatisticas = {
    total: pedidos.length,
    pendentes: pedidos.filter(p => p.status === 'pendente').length,
    preparando: pedidos.filter(p => p.status === 'preparando').length,
    prontos: pedidos.filter(p => p.status === 'pronto').length,
    valorTotal: pedidos.reduce((total, pedido) => total + pedido.total, 0)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
            <p className="mt-2 text-gray-600">Gerencie todos os pedidos da sua padaria</p>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="card text-center">
              <p className="text-2xl font-bold text-gray-900">{estatisticas.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-yellow-600">{estatisticas.pendentes}</p>
              <p className="text-sm text-gray-500">Pendentes</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-blue-600">{estatisticas.preparando}</p>
              <p className="text-sm text-gray-500">Preparando</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-green-600">{estatisticas.prontos}</p>
              <p className="text-sm text-gray-500">Prontos</p>
            </div>
            <div className="card text-center">
              <p className="text-2xl font-bold text-primary-600">R$ {estatisticas.valorTotal.toFixed(2)}</p>
              <p className="text-sm text-gray-500">Valor Total</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="card mb-6">
            <div className="flex gap-4">
              <div>
                <label className="label">Filtrar por Status</label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="input-field"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="pendente">Pendente</option>
                  <option value="preparando">Preparando</option>
                  <option value="pronto">Pronto</option>
                  <option value="entregue">Entregue</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Pedidos */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Pedidos ({pedidosFiltrados.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Pedido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Itens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Data/Hora
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pedidosFiltrados.map((pedido) => {
                    const cliente = clientes.find(c => c.id === pedido.clienteId);
                    return (
                      <tr key={pedido.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            #{pedido.id.slice(0, 8)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {cliente ? cliente.nome : 'Cliente não identificado'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {pedido.itens.length} {pedido.itens.length === 1 ? 'item' : 'itens'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            R$ {pedido.total.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getTipoLabel(pedido.tipo)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={pedido.status}
                            onChange={(e) => atualizarStatus(pedido.id, e.target.value)}
                            className={`text-xs font-medium rounded-full px-2 py-1 border-0 ${getStatusColor(pedido.status)}`}
                          >
                            <option value="pendente">Pendente</option>
                            <option value="preparando">Preparando</option>
                            <option value="pronto">Pronto</option>
                            <option value="entregue">Entregue</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(pedido.dataHoraPedido), 'dd/MM/yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => setShowDetalhes(pedido)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pedidosFiltrados.length === 0 && (
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
                <p className="text-gray-500">Não há pedidos com os filtros selecionados.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Detalhes */}
      {showDetalhes && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Detalhes do Pedido #{showDetalhes.id.slice(0, 8)}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Informações Gerais</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Status:</strong> {getStatusLabel(showDetalhes.status)}</div>
                  <div><strong>Tipo:</strong> {getTipoLabel(showDetalhes.tipo)}</div>
                  <div><strong>Data/Hora:</strong> {format(new Date(showDetalhes.dataHoraPedido), 'dd/MM/yyyy HH:mm')}</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Cliente</h4>
                <div className="text-sm">
                  {showDetalhes.clienteId ? (
                    <div>
                      {clientes.find(c => c.id === showDetalhes.clienteId)?.nome || 'Cliente não encontrado'}
                    </div>
                  ) : (
                    <div className="text-gray-500">Cliente não identificado</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-2">Itens do Pedido</h4>
              <div className="space-y-2">
                {showDetalhes.itens.map((item, index) => {
                  const receita = receitas.find(r => r.id === item.receitaId);
                  return (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{receita?.nome || 'Produto não encontrado'}</div>
                        <div className="text-sm text-gray-600">
                          {item.quantidade}x R$ {item.precoUnitario.toFixed(2)}
                        </div>
                      </div>
                      <div className="font-medium">
                        R$ {item.subtotal.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm">Subtotal: R$ {showDetalhes.subtotal.toFixed(2)}</div>
                  {showDetalhes.desconto > 0 && (
                    <div className="text-sm text-red-600">Desconto: -R$ {showDetalhes.desconto.toFixed(2)}</div>
                  )}
                </div>
                <div className="text-lg font-semibold">
                  Total: R$ {showDetalhes.total.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDetalhes(null)}
                className="btn-outline"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 