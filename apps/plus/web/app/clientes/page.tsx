'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon } from '@heroicons/react/24/outline';
import { dataStore } from '@/lib/data';
import { Cliente } from '@/types';
import { format } from 'date-fns';

export default function ClientesPage() {
  const [clientes, setClientes] = useState(dataStore.getClientes());
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      dataStore.deleteCliente(id);
      setClientes(dataStore.getClientes());
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingCliente(null);
    setShowModal(true);
  };

  const clientesAtivos = clientes.filter(c => c.ativo);
  const clientesInativos = clientes.filter(c => !c.ativo);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
              <p className="mt-2 text-gray-600">Gerencie seus clientes e histórico de compras</p>
            </div>
            <button
              onClick={handleAdd}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Novo Cliente
            </button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100">
                  <UsersIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total de Clientes</p>
                  <p className="text-2xl font-semibold text-gray-900">{clientes.length}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-green-100">
                  <UsersIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Clientes Ativos</p>
                  <p className="text-2xl font-semibold text-gray-900">{clientesAtivos.length}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-100">
                  <UsersIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total em Compras</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    R$ {clientes.reduce((total, cliente) => total + cliente.totalCompras, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Clientes */}
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Lista de Clientes ({clientes.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Compras
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Data Cadastro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientes.map((cliente) => (
                    <tr key={cliente.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{cliente.nome}</div>
                          {cliente.endereco && (
                            <div className="text-sm text-gray-500">
                              {cliente.endereco.cidade}, {cliente.endereco.bairro}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {cliente.email && <div>{cliente.email}</div>}
                          {cliente.telefone && <div>{cliente.telefone}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        R$ {cliente.totalCompras.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(cliente.dataCadastro), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          cliente.ativo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {cliente.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(cliente)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cliente.id)}
                            className="text-red-600 hover:text-red-900"
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

            {clientes.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <UsersIcon className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cliente cadastrado</h3>
                <p className="text-gray-500 mb-4">Comece adicionando seus primeiros clientes.</p>
                <button
                  onClick={handleAdd}
                  className="btn-primary"
                >
                  Adicionar Primeiro Cliente
                </button>
              </div>
            )}
          </div>

          {/* Clientes por Status */}
          {clientes.length > 0 && (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Clientes Ativos */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Clientes Ativos ({clientesAtivos.length})
                </h3>
                <div className="space-y-3">
                  {clientesAtivos.slice(0, 5).map((cliente) => (
                    <div key={cliente.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{cliente.nome}</p>
                        <p className="text-sm text-gray-600">
                          Total: R$ {cliente.totalCompras.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-green-600">
                        <UsersIcon className="h-5 w-5" />
                      </div>
                    </div>
                  ))}
                  {clientesAtivos.length > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      +{clientesAtivos.length - 5} clientes ativos
                    </p>
                  )}
                </div>
              </div>

              {/* Top Clientes */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Melhores Clientes
                </h3>
                <div className="space-y-3">
                  {clientes
                    .sort((a, b) => b.totalCompras - a.totalCompras)
                    .slice(0, 5)
                    .map((cliente, index) => (
                      <div key={cliente.id} className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-yellow-600 mr-3">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-gray-900">{cliente.nome}</p>
                            <p className="text-sm text-gray-600">
                              R$ {cliente.totalCompras.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
            </h3>
            <p className="text-gray-600 mb-4">
              Funcionalidade de edição será implementada na próxima versão.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
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