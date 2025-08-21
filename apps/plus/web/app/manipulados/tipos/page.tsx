'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TipoManipulado {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  unidade: string;
  estoqueMinimo: number;
  custoUnitario: number;
  conservacaoRecomendada: 'TEMPERATURA_AMBIENTE' | 'CONGELADO' | 'RESFRIADO';
  validadeTemperaturaAmbiente?: number;
  validadeRefrigerado?: number;
  validadeCongelado?: number;
  instrucoes: string;
  ativo: boolean;
  dataCriacao: string;
}

export default function TiposManipuladosPage() {
  const router = useRouter();
  const [tipos, setTipos] = useState<TipoManipulado[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoManipulado | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoria: 'massa',
    unidade: 'kg',
    estoqueMinimo: 0,
    custoUnitario: 0,
    conservacaoRecomendada: 'TEMPERATURA_AMBIENTE' as 'TEMPERATURA_AMBIENTE' | 'CONGELADO' | 'RESFRIADO',
    validadeTemperaturaAmbiente: 0,
    validadeRefrigerado: 0,
    validadeCongelado: 0,
    instrucoes: '',
    ativo: true,
  });

  const categorias = [
    { value: 'massa', label: 'Massa' },
    { value: 'creme', label: 'Creme' },
    { value: 'calda', label: 'Calda' },
    { value: 'pasta', label: 'Pasta' },
    { value: 'recheio', label: 'Recheio' },
    { value: 'cobertura', label: 'Cobertura' },
  ];

  const conservacaoRecomendada = [
    { value: 'TEMPERATURA_AMBIENTE', label: 'Temperatura Ambiente' },
    { value: 'CONGELADO', label: 'Congelado' },
    { value: 'RESFRIADO', label: 'Resfriado' },
  ];

  const unidades = [
    { value: 'kg', label: 'Quilogramas (kg)' },
    { value: 'g', label: 'Gramas (g)' },
    { value: 'l', label: 'Litros (l)' },
    { value: 'ml', label: 'Mililitros (ml)' },
  ];

  useEffect(() => {
    loadTipos();
  }, []);

  const loadTipos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/manipulados/tipos');
      if (response.ok) {
        const data = await response.json();
        setTipos(data.tipos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar tipos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingTipo 
        ? `/api/manipulados/tipos/${editingTipo.id}`
        : '/api/manipulados/tipos';
      
      const method = editingTipo ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingTipo(null);
        resetForm();
        loadTipos();
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao salvar tipo:', error);
      alert('Erro ao salvar tipo de manipulado');
    }
  };

  const handleEdit = (tipo: TipoManipulado) => {
    setEditingTipo(tipo);
    setFormData({
      nome: tipo.nome,
      descricao: tipo.descricao,
      categoria: tipo.categoria,
      unidade: tipo.unidade,
      estoqueMinimo: tipo.estoqueMinimo,
      custoUnitario: tipo.custoUnitario,
      conservacaoRecomendada: tipo.conservacaoRecomendada,
      validadeTemperaturaAmbiente: tipo.validadeTemperaturaAmbiente || 0,
      validadeRefrigerado: tipo.validadeRefrigerado || 0,
      validadeCongelado: tipo.validadeCongelado || 0,
      instrucoes: tipo.instrucoes,
      ativo: tipo.ativo,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de manipulado?')) {
      return;
    }

    try {
      const response = await fetch(`/api/manipulados/tipos/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadTipos();
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao excluir tipo:', error);
      alert('Erro ao excluir tipo de manipulado');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      categoria: 'massa',
      unidade: 'kg',
      estoqueMinimo: 0,
      custoUnitario: 0,
      conservacaoRecomendada: 'TEMPERATURA_AMBIENTE',
      validadeTemperaturaAmbiente: 0,
      validadeRefrigerado: 0,
      validadeCongelado: 0,
      instrucoes: '',
      ativo: true,
    });
  };

  const handleNewTipo = () => {
    setEditingTipo(null);
    resetForm();
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando tipos de manipulados...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tipos de Manipulados</h1>
              <p className="text-gray-600 mt-1">
                Cadastre os tipos de manipulados que podem ser produzidos
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/manipulados')}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleNewTipo}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Novo Tipo
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingTipo ? 'Editar Tipo' : 'Novo Tipo de Manipulado'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Massa de Pão Integral"
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categorias.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Descrição */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descrição detalhada do tipo de manipulado"
                  />
                </div>

                {/* Unidade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidade
                  </label>
                  <select
                    value={formData.unidade}
                    onChange={(e) => setFormData({...formData, unidade: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {unidades.map(un => (
                      <option key={un.value} value={un.value}>
                        {un.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conservação Recomendada */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conservação Recomendada *
                  </label>
                  <select
                    value={formData.conservacaoRecomendada}
                    onChange={(e) => setFormData({...formData, conservacaoRecomendada: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {conservacaoRecomendada.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estoque Mínimo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.estoqueMinimo}
                    onChange={(e) => setFormData({...formData, estoqueMinimo: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Custo Unitário */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custo Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.custoUnitario}
                    onChange={(e) => setFormData({...formData, custoUnitario: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Validade por Temperatura */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Validade por Temperatura (em minutos)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Temperatura Ambiente
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.validadeTemperaturaAmbiente}
                        onChange={(e) => setFormData({...formData, validadeTemperaturaAmbiente: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Refrigerado
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.validadeRefrigerado}
                        onChange={(e) => setFormData({...formData, validadeRefrigerado: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Congelado
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.validadeCongelado}
                        onChange={(e) => setFormData({...formData, validadeCongelado: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Instruções */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instruções
                  </label>
                  <textarea
                    value={formData.instrucoes}
                    onChange={(e) => setFormData({...formData, instrucoes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Manter refrigerado entre 2-8°C"
                  />
                </div>

                {/* Ativo */}
                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Tipo ativo</span>
                  </label>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTipo(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTipo ? 'Atualizar' : 'Criar'} Tipo
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Tipos */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Tipos Cadastrados ({tipos.length})
            </h2>
          </div>
          
          {tipos.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum tipo cadastrado</h3>
              <p className="text-gray-500 mb-4">
                Comece cadastrando os tipos de manipulados que podem ser produzidos.
              </p>
              <button
                onClick={handleNewTipo}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Primeiro Tipo
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tipos.map((tipo) => (
                <div key={tipo.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-gray-900">{tipo.nome}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          tipo.ativo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {tipo.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {tipo.categoria}
                        </span>
                      </div>
                      
                      {tipo.descricao && (
                        <p className="text-gray-600 mt-1">{tipo.descricao}</p>
                      )}
                      
                      <div className="flex items-center gap-6 mt-3 text-sm text-gray-500">
                        <span>Unidade: {tipo.unidade}</span>
                        <span>Estoque Mín: {tipo.estoqueMinimo}</span>
                        <span>Custo: R$ {tipo.custoUnitario.toFixed(2)}</span>
                        <span>Conservação: {tipo.conservacaoRecomendada.replace('_', ' ')}</span>
                      </div>
                      
                      {(tipo.validadeTemperaturaAmbiente || tipo.validadeRefrigerado || tipo.validadeCongelado) && (
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          {tipo.validadeTemperaturaAmbiente && (
                            <span>Ambiente: {tipo.validadeTemperaturaAmbiente} min</span>
                          )}
                          {tipo.validadeRefrigerado && (
                            <span>Refrigerado: {tipo.validadeRefrigerado} min</span>
                          )}
                          {tipo.validadeCongelado && (
                            <span>Congelado: {tipo.validadeCongelado} min</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(tipo)}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(tipo.id)}
                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 