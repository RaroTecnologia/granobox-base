'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { PlusIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon, DocumentIcon, MagnifyingGlassIcon, TagIcon } from '@heroicons/react/24/outline';
import { Ingrediente } from '@/types';
import toast from 'react-hot-toast';
import IngredientesPDF from '../../components/IngredientesPDF';
import { useAuth } from '@/hooks/useAuth';
import { gerarCodigoEtiqueta, gerarCodigoLote, calcularDataValidadePadrao } from '@/lib/etiquetaUtils';

interface FormData {
  nome: string;
  unidade: string;
  estoqueAtual: string;
  estoqueMinimo: string;
  fornecedor: string;
}

export default function InventarioPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [ingredientesFiltrados, setIngredientesFiltrados] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const [editingIngrediente, setEditingIngrediente] = useState<Ingrediente | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busca, setBusca] = useState('');
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    unidade: 'kg',
    estoqueAtual: '',
    estoqueMinimo: '',
    fornecedor: ''
  });

  const unidades = ['kg', 'g', 'L', 'ml', 'unidade', 'pacote', 'caixa'];

  // Carregar ingredientes
  const loadIngredientes = async () => {
    try {
      const response = await fetch('/api/ingredientes');
      if (response.ok) {
        const data = await response.json();
        setIngredientes(data);
        setIngredientesFiltrados(data);
      }
    } catch (error) {
      console.error('Erro ao carregar ingredientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadIngredientes();
    }
  }, [isAuthenticated, authLoading]);

  // Filtrar ingredientes baseado na busca
  useEffect(() => {
    if (!busca.trim()) {
      setIngredientesFiltrados(ingredientes);
    } else {
      const filtrados = ingredientes.filter(ingrediente =>
        ingrediente.nome.toLowerCase().includes(busca.toLowerCase()) ||
        ingrediente.fornecedor?.toLowerCase().includes(busca.toLowerCase()) ||
        ingrediente.unidade.toLowerCase().includes(busca.toLowerCase())
      );
      setIngredientesFiltrados(filtrados);
    }
  }, [busca, ingredientes]);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este ingrediente?')) {
      try {
        const response = await fetch(`/api/ingredientes?id=${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          await loadIngredientes();
          toast.success('Ingrediente excluído com sucesso!');
        } else {
          toast.error('Erro ao excluir ingrediente');
        }
      } catch (error) {
        console.error('Erro ao excluir ingrediente:', error);
        toast.error('Erro ao excluir ingrediente');
      }
    }
  };

  const handleGerarEtiqueta = (ingrediente: Ingrediente) => {
    // Criar dados da etiqueta usando funções utilitárias
    const etiquetaData = {
      nome: ingrediente.nome,
      codigo: gerarCodigoEtiqueta(), // Código amigável de 6 caracteres
      descricao: ingrediente.fornecedor || 'Sem fornecedor',
      unidade: ingrediente.unidade,
      lote: gerarCodigoLote(), // Lote amigável com data/hora
      dataValidade: calcularDataValidadePadrao(), // 1 ano a partir de hoje
      dataCriacao: new Date().toISOString().split('T')[0],
      ativa: true
    };

    // Salvar no localStorage temporariamente (depois implementaremos banco de dados)
    const etiquetasExistentes = JSON.parse(localStorage.getItem('etiquetasMateriaPrima') || '[]');
    const novaEtiqueta = {
      id: `etiqueta-${Date.now()}`,
      ...etiquetaData
    };
    
    etiquetasExistentes.push(novaEtiqueta);
    localStorage.setItem('etiquetasMateriaPrima', JSON.stringify(etiquetasExistentes));

    // Redirecionar para a página de etiquetas com dados pré-preenchidos
    const queryParams = new URLSearchParams({
      tipo: 'materia-prima',
      etiquetaId: novaEtiqueta.id
    });
    
    window.location.href = `/etiquetas/materia-prima?${queryParams.toString()}`;
  };

  const handleEdit = (ingrediente: Ingrediente) => {
    setEditingIngrediente(ingrediente);
    setFormData({
      nome: ingrediente.nome,
      unidade: ingrediente.unidade,
      estoqueAtual: ingrediente.estoqueAtual.toString(),
      estoqueMinimo: ingrediente.estoqueMinimo.toString(),
      fornecedor: ingrediente.fornecedor || ''
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingIngrediente(null);
    setFormData({
      nome: '',
      unidade: 'kg',
      estoqueAtual: '',
      estoqueMinimo: '',
      fornecedor: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = '/api/ingredientes';
      const method = editingIngrediente ? 'PUT' : 'POST';
      const body = editingIngrediente 
        ? { ...formData, id: editingIngrediente.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowModal(false);
        await loadIngredientes();
        setFormData({
          nome: '',
          unidade: 'kg',
          estoqueAtual: '',
          estoqueMinimo: '',
          fornecedor: ''
        });
        toast.success(editingIngrediente ? 'Ingrediente atualizado com sucesso!' : 'Ingrediente criado com sucesso!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar ingrediente');
      }
    } catch (error) {
      console.error('Erro ao salvar ingrediente:', error);
      toast.error('Erro ao salvar ingrediente');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isEstoqueBaixo = (ingrediente: Ingrediente) => {
    return ingrediente.estoqueAtual <= ingrediente.estoqueMinimo;
  };

  const ingredientesComAlerta = ingredientesFiltrados.filter(isEstoqueBaixo);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Faça login para acessar o inventário</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Inventário</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPDF(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <DocumentIcon className="h-5 w-5 mr-2" />
                Gerar PDF
              </button>
              <button
                onClick={handleAdd}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                + Novo Ingrediente
              </button>
            </div>
          </div>

          {/* Barra de Busca */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Buscar por nome, fornecedor ou unidade..."
              />
            </div>
            {busca && (
              <p className="mt-2 text-sm text-gray-600">
                Mostrando {ingredientesFiltrados.length} de {ingredientes.length} ingredientes
              </p>
            )}
          </div>

          {showPDF ? (
            <div className="fixed inset-0 z-50 bg-white">
              <div className="flex justify-end p-4">
                <button
                  onClick={() => setShowPDF(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Fechar PDF
                </button>
              </div>
              <IngredientesPDF ingredientes={ingredientes} />
            </div>
          ) : (
            <>
              {/* Alertas de Estoque Baixo */}
              {ingredientesComAlerta.length > 0 && (
                <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                    <h2 className="text-lg font-semibold text-red-900">
                      Ingredientes com Estoque Baixo ({ingredientesComAlerta.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ingredientesComAlerta.map((ingrediente) => (
                      <div key={ingrediente.id} className="bg-white border border-red-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">{ingrediente.nome}</h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Estoque atual:</span>
                            <span className="font-medium text-red-600">
                              {ingrediente.estoqueAtual} {ingrediente.unidade}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Estoque mínimo:</span>
                            <span className="font-medium">
                              {ingrediente.estoqueMinimo} {ingrediente.unidade}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista de Ingredientes */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Todos os Ingredientes ({ingredientesFiltrados.length})
                </h2>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Ingrediente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Estoque Atual
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Estoque Mínimo
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
                      {ingredientesFiltrados.map((ingrediente) => (
                        <tr key={ingrediente.id} className={isEstoqueBaixo(ingrediente) ? 'bg-red-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{ingrediente.nome}</div>
                            <div className="text-sm text-gray-500">{ingrediente.fornecedor || 'Sem fornecedor'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              isEstoqueBaixo(ingrediente) ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {ingrediente.estoqueAtual} {ingrediente.unidade}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {ingrediente.estoqueMinimo} {ingrediente.unidade}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEstoqueBaixo(ingrediente) ? (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                Estoque Baixo
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                Normal
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleGerarEtiqueta(ingrediente)}
                                className="text-green-600 hover:text-green-900"
                                title="Gerar Etiqueta"
                              >
                                <TagIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(ingrediente)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Editar"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(ingrediente.id)}
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

                {ingredientesFiltrados.length === 0 && (
                  <div className="text-center py-12">
                    {busca ? (
                      <>
                        <p className="text-gray-500 text-lg">Nenhum ingrediente encontrado</p>
                        <p className="text-gray-400 mt-2">Tente buscar por outro termo</p>
                      </>
                    ) : (
                      <>
                        <p className="text-gray-500 text-lg">Nenhum ingrediente cadastrado</p>
                        <p className="text-gray-400 mt-2">Comece adicionando seu primeiro ingrediente!</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingIngrediente ? 'Editar Ingrediente' : 'Novo Ingrediente'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Ingrediente *
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Farinha de Trigo"
                />
              </div>

              <div>
                <label htmlFor="unidade" className="block text-sm font-medium text-gray-700 mb-1">
                  Unidade de Medida *
                </label>
                <select
                  id="unidade"
                  name="unidade"
                  value={formData.unidade}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {unidades.map(unidade => (
                    <option key={unidade} value={unidade}>{unidade}</option>
                  ))}
                </select>
              </div>



              <div>
                <label htmlFor="estoqueAtual" className="block text-sm font-medium text-gray-700 mb-1">
                  Estoque Atual
                </label>
                <input
                  type="number"
                  id="estoqueAtual"
                  name="estoqueAtual"
                  value={formData.estoqueAtual}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label htmlFor="estoqueMinimo" className="block text-sm font-medium text-gray-700 mb-1">
                  Estoque Mínimo
                </label>
                <input
                  type="number"
                  id="estoqueMinimo"
                  name="estoqueMinimo"
                  value={formData.estoqueMinimo}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label htmlFor="fornecedor" className="block text-sm font-medium text-gray-700 mb-1">
                  Fornecedor
                </label>
                <input
                  type="text"
                  id="fornecedor"
                  name="fornecedor"
                  value={formData.fornecedor}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nome do fornecedor"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-outline"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Salvando...' : (editingIngrediente ? 'Atualizar' : 'Cadastrar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 