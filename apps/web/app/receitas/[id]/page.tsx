'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import EtapasReceita from '@/components/EtapasReceita';
import { ArrowLeftIcon, ClockIcon, CurrencyDollarIcon, ScaleIcon } from '@heroicons/react/24/outline';

interface Ingrediente {
  id: string;
  nome: string;
  unidade: string;
  custoUnitario: number;
}

interface ItemReceita {
  id: string;
  ingredienteId: string;
  quantidade: number;
  isIngredienteBase?: boolean;
  ingrediente?: Ingrediente;
}

interface Receita {
  id: string;
  nome: string;
  descricao?: string;
  categoria: string;
  rendimento: number;
  tempoPreparo: number;
  custoTotal: number;
  precoVenda: number;
  instrucoes?: string;
  tamanhoForma?: string;
  pesoUnitario?: number;
  sistemaCalculo: string;
  pesoTotalBase?: number;
  ativo: boolean;
  dataCriacao: string;
  dataAtualizacao: string;
  ingredientes: ItemReceita[];
}

const categorias = [
  { value: 'paes', label: 'Pães' },
  { value: 'doces', label: 'Doces' },
  { value: 'salgados', label: 'Salgados' },
  { value: 'bebidas', label: 'Bebidas' }
];

export default function DetalhesReceitaPage() {
  const params = useParams();
  const router = useRouter();
  const receitaId = params.id as string;
  
  const [receita, setReceita] = useState<Receita | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarReceita();
  }, [receitaId]);

  const carregarReceita = async () => {
    try {
      const response = await fetch(`/api/receitas/${receitaId}`);
      if (response.ok) {
        const data = await response.json();
        setReceita(data);
      } else if (response.status === 404) {
        toast.error('Receita não encontrada');
        router.push('/receitas');
      } else {
        toast.error('Erro ao carregar receita');
      }
    } catch (error) {
      console.error('Erro ao carregar receita:', error);
      toast.error('Erro ao carregar receita');
    } finally {
      setLoading(false);
    }
  };

  const formatarTempo = (minutos: number) => {
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
  };

  const obterLabelCategoria = (categoria: string) => {
    return categorias.find(c => c.value === categoria)?.label || categoria;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Carregando receita...</div>
        </div>
      </div>
    );
  }

  if (!receita) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Receita não encontrada</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Voltar
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{receita.nome}</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  {obterLabelCategoria(receita.categoria)}
                </span>
                <span className={`inline-block text-sm px-3 py-1 rounded-full ${
                  receita.ativo 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {receita.ativo ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Informações Básicas */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações Gerais</h2>
              
              {receita.descricao && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Descrição</h3>
                  <p className="text-gray-600">{receita.descricao}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <ClockIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tempo de Preparo</p>
                    <p className="font-semibold">{formatarTempo(receita.tempoPreparo)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Preço de Venda</p>
                    <p className="font-semibold">R$ {receita.precoVenda.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <ScaleIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rendimento</p>
                    <p className="font-semibold">{receita.rendimento} unidade(s)</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <CurrencyDollarIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Custo Total</p>
                    <p className="font-semibold">R$ {receita.custoTotal.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {(receita.pesoUnitario || receita.tamanhoForma) && (
                <div className="mt-6 pt-6 border-t">
                  <div className="grid grid-cols-2 gap-6">
                    {receita.pesoUnitario && (
                      <div>
                        <p className="text-sm text-gray-500">Peso Unitário</p>
                        <p className="font-semibold">{receita.pesoUnitario}g</p>
                      </div>
                    )}
                    {receita.tamanhoForma && (
                      <div>
                        <p className="text-sm text-gray-500">Tamanho da Forma</p>
                        <p className="font-semibold">{receita.tamanhoForma}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Ingredientes */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Ingredientes ({receita.ingredientes.length})
              </h2>
              
              {receita.sistemaCalculo === 'porcentagem' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-700">
                    <strong>Sistema de Porcentagem:</strong> Os valores são baseados na porcentagem 
                    do peso total das farinhas base.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {receita.ingredientes.map((item, index) => (
                  <div 
                    key={index} 
                    className={`flex justify-between items-center p-3 rounded-lg ${
                      item.isIngredienteBase ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.isIngredienteBase && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          Base
                        </span>
                      )}
                      <span className="font-medium text-gray-900">
                        {item.ingrediente?.nome || 'Ingrediente não encontrado'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">
                        {item.quantidade} {receita.sistemaCalculo === 'porcentagem' ? '%' : item.ingrediente?.unidade}
                      </span>
                      {item.ingrediente && (
                        <p className="text-sm text-gray-500">
                          R$ {(item.ingrediente.custoUnitario * item.quantidade).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instruções */}
            {receita.instrucoes && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Instruções</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-600 whitespace-pre-wrap">{receita.instrucoes}</p>
                </div>
              </div>
            )}

            {/* Etapas da Receita */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <EtapasReceita receitaId={receita.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resumo Financeiro */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo Financeiro</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Custo Total:</span>
                  <span className="font-semibold">R$ {receita.custoTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Preço de Venda:</span>
                  <span className="font-semibold">R$ {receita.precoVenda.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between border-t pt-4">
                  <span className="text-gray-600">Margem de Lucro:</span>
                  <span className="font-semibold text-green-600">
                    {((receita.precoVenda - receita.custoTotal) / receita.precoVenda * 100).toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Lucro por Unidade:</span>
                  <span className="font-semibold text-green-600">
                    R$ {(receita.precoVenda - receita.custoTotal).toFixed(2)}
                  </span>
                </div>

                {receita.pesoUnitario && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Custo por 100g:</span>
                    <span className="font-semibold">
                      R$ {((receita.custoTotal / receita.pesoUnitario) * 100).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Informações Técnicas */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Técnicas</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sistema de Cálculo:</span>
                  <span className="font-medium">
                    {receita.sistemaCalculo === 'porcentagem' ? 'Porcentagem' : 'Peso Absoluto'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Data de Criação:</span>
                  <span className="font-medium">
                    {new Date(receita.dataCriacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Última Atualização:</span>
                  <span className="font-medium">
                    {new Date(receita.dataAtualizacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 