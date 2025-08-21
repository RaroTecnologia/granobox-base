'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface EtapaReceita {
  id: string;
  nome: string;
  ordem: number;
  descricao?: string;
  tempoMin?: number;
  tempoMax?: number;
  temperatura?: number;
  umidade?: number;
  observacoes?: string;
}

interface EtapasReceitaProps {
  receitaId: string;
}

export default function EtapasReceita({ receitaId }: EtapasReceitaProps) {
  const [etapas, setEtapas] = useState<EtapaReceita[]>([]);
  const [loading, setLoading] = useState(true);
  const [editandoEtapa, setEditandoEtapa] = useState<string | null>(null);
  const [novaEtapa, setNovaEtapa] = useState({
    nome: '',
    descricao: '',
    tempoMin: '',
    tempoMax: '',
    temperatura: '',
    umidade: '',
    observacoes: ''
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => {
    carregarEtapas();
  }, [receitaId]);

  const carregarEtapas = async () => {
    try {
      const response = await fetch(`/api/receitas/${receitaId}/etapas`);
      if (response.ok) {
        const data = await response.json();
        setEtapas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
      toast.error('Erro ao carregar etapas');
    } finally {
      setLoading(false);
    }
  };

  const adicionarEtapa = async () => {
    try {
      const response = await fetch(`/api/receitas/${receitaId}/etapas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: novaEtapa.nome,
          descricao: novaEtapa.descricao || null,
          tempoMin: novaEtapa.tempoMin ? parseInt(novaEtapa.tempoMin) : null,
          tempoMax: novaEtapa.tempoMax ? parseInt(novaEtapa.tempoMax) : null,
          temperatura: novaEtapa.temperatura ? parseFloat(novaEtapa.temperatura) : null,
          umidade: novaEtapa.umidade ? parseFloat(novaEtapa.umidade) : null,
          observacoes: novaEtapa.observacoes || null
        }),
      });

      if (response.ok) {
        toast.success('Etapa adicionada com sucesso!');
        setNovaEtapa({
          nome: '',
          descricao: '',
          tempoMin: '',
          tempoMax: '',
          temperatura: '',
          umidade: '',
          observacoes: ''
        });
        setMostrarFormulario(false);
        carregarEtapas();
      } else {
        toast.error('Erro ao adicionar etapa');
      }
    } catch (error) {
      console.error('Erro ao adicionar etapa:', error);
      toast.error('Erro ao adicionar etapa');
    }
  };

  const removerEtapa = async (etapaId: string) => {
    if (!confirm('Tem certeza que deseja remover esta etapa?')) return;

    try {
      const response = await fetch(`/api/receitas/${receitaId}/etapas/${etapaId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Etapa removida com sucesso!');
        carregarEtapas();
      } else {
        toast.error('Erro ao remover etapa');
      }
    } catch (error) {
      console.error('Erro ao remover etapa:', error);
      toast.error('Erro ao remover etapa');
    }
  };

  const formatarTempo = (min?: number, max?: number) => {
    if (!min && !max) return '';
    if (min && max && min !== max) return `${min}-${max} min`;
    return `${min || max} min`;
  };

  if (loading) {
    return <div className="text-center py-4">Carregando etapas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Etapas da Receita ({etapas.length})
        </h3>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {mostrarFormulario ? 'Cancelar' : 'Nova Etapa'}
        </button>
      </div>

      {mostrarFormulario && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-3">Adicionar Nova Etapa</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Etapa *
              </label>
              <input
                type="text"
                value={novaEtapa.nome}
                onChange={(e) => setNovaEtapa({ ...novaEtapa, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Misturar ingredientes secos"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={novaEtapa.descricao}
                onChange={(e) => setNovaEtapa({ ...novaEtapa, descricao: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Descreva detalhadamente como executar esta etapa..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tempo Mínimo (min)
              </label>
              <input
                type="number"
                value={novaEtapa.tempoMin}
                onChange={(e) => setNovaEtapa({ ...novaEtapa, tempoMin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tempo Máximo (min)
              </label>
              <input
                type="number"
                value={novaEtapa.tempoMax}
                onChange={(e) => setNovaEtapa({ ...novaEtapa, tempoMax: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperatura (°C)
              </label>
              <input
                type="number"
                value={novaEtapa.temperatura}
                onChange={(e) => setNovaEtapa({ ...novaEtapa, temperatura: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                step="0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Umidade (%)
              </label>
              <input
                type="number"
                value={novaEtapa.umidade}
                onChange={(e) => setNovaEtapa({ ...novaEtapa, umidade: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="100"
                step="0.1"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={novaEtapa.observacoes}
                onChange={(e) => setNovaEtapa({ ...novaEtapa, observacoes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Dicas importantes, cuidados especiais..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setMostrarFormulario(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={adicionarEtapa}
              disabled={!novaEtapa.nome.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Adicionar Etapa
            </button>
          </div>
        </div>
      )}

      {etapas.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>Nenhuma etapa cadastrada para esta receita.</p>
          <p className="text-sm mt-1">Clique em "Nova Etapa" para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {etapas.map((etapa, index) => (
            <div key={etapa.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                      Etapa {etapa.ordem}
                    </span>
                    <h4 className="font-medium text-gray-900">{etapa.nome}</h4>
                  </div>

                  {etapa.descricao && (
                    <p className="text-gray-600 mb-3">{etapa.descricao}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    {(etapa.tempoMin || etapa.tempoMax) && (
                      <span className="flex items-center gap-1">
                        ⏱️ {formatarTempo(etapa.tempoMin, etapa.tempoMax)}
                      </span>
                    )}
                    {etapa.temperatura && (
                      <span className="flex items-center gap-1">
                        🌡️ {etapa.temperatura}°C
                      </span>
                    )}
                    {etapa.umidade && (
                      <span className="flex items-center gap-1">
                        💧 {etapa.umidade}%
                      </span>
                    )}
                  </div>

                  {etapa.observacoes && (
                    <div className="mt-3 p-2 bg-yellow-50 border-l-4 border-yellow-400">
                      <p className="text-sm text-yellow-800">
                        <strong>Observação:</strong> {etapa.observacoes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => removerEtapa(etapa.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Remover etapa"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 