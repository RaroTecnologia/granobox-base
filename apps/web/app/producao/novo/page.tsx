'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  ScaleIcon,
  CubeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { Receita, Ingrediente } from '@/types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface ItemPlanoForm {
  receitaId: string;
  quantidade: number;
  receita?: Receita;
}

export default function NovoPlanoPage() {
  const router = useRouter();
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Estados do formulário
  const [dataProducao, setDataProducao] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [itensPlano, setItensPlano] = useState<ItemPlanoForm[]>([]);

  useEffect(() => {
    carregarDados();
    // Definir data padrão como hoje
    const hoje = new Date();
    setDataProducao(format(hoje, 'yyyy-MM-dd'));
  }, []);

  const carregarDados = async () => {
    try {
      const [receitasRes, ingredientesRes] = await Promise.all([
        fetch('/api/receitas'),
        fetch('/api/ingredientes')
      ]);

      if (receitasRes.ok) {
        const receitasData = await receitasRes.json();
        setReceitas(receitasData);
      }

      if (ingredientesRes.ok) {
        const ingredientesData = await ingredientesRes.json();
        setIngredientes(ingredientesData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const adicionarItem = () => {
    setItensPlano([...itensPlano, { receitaId: '', quantidade: 1 }]);
  };

  const removerItem = (index: number) => {
    setItensPlano(itensPlano.filter((_, i) => i !== index));
  };

  const atualizarItem = (index: number, campo: keyof ItemPlanoForm, valor: any) => {
    const novosItens = [...itensPlano];
    novosItens[index] = { ...novosItens[index], [campo]: valor };
    
    // Se mudou a receita, buscar os dados da receita
    if (campo === 'receitaId') {
      const receita = receitas.find(r => r.id === valor);
      novosItens[index].receita = receita;
    }
    
    setItensPlano(novosItens);
  };

  const calcularIngredientesNecessarios = (itens: ItemPlanoForm[]) => {
    const ingredientesNecessarios: { [key: string]: number } = {};
    
    itens.forEach(item => {
      if (item.receita) {
        // Calcular fator de multiplicação baseado na quantidade de unidades
        const fatorMultiplicacao = item.quantidade / item.receita.rendimento;
        
        item.receita.ingredientes.forEach(ingredienteReceita => {
          const ingrediente = ingredientes.find(i => i.id === ingredienteReceita.ingredienteId);
          if (ingrediente) {
            let quantidadeIngrediente = 0;
            
            // Verificar se a receita usa sistema de porcentagem
            if (item.receita && item.receita.sistemaCalculo === 'porcentagem' && item.receita.pesoTotalBase) {
              // Sistema de porcentagem do padeiro (sempre baseado em 1000g de farinhas)
              const pesoBaseReceita = 1000; // Base padrão do sistema do padeiro
              
              // Calcular quantidade baseada na porcentagem
              quantidadeIngrediente = (ingredienteReceita.quantidade / 100) * pesoBaseReceita;
              
              // Calcular peso total da receita base (1000g farinhas + outros ingredientes)
              const pesoTotalReceitaBase = (item.receita.pesoUnitario || 0) * item.receita.rendimento;
              
              // Calcular soma de todas as porcentagens para saber o peso total teórico
              let somaPercentuais = 0;
              item.receita.ingredientes.forEach(ing => {
                somaPercentuais += ing.quantidade;
              });
              const pesoTotalTeorico = (somaPercentuais / 100) * pesoBaseReceita;
              
              // Fator de ajuste: peso real da receita ÷ peso teórico
              const fatorAjuste = pesoTotalReceitaBase / pesoTotalTeorico;
              
              // Aplicar o fator de ajuste
              quantidadeIngrediente = quantidadeIngrediente * fatorAjuste;
            } else {
              // Sistema de peso absoluto
              quantidadeIngrediente = ingredienteReceita.quantidade;
            }
            
            // Multiplicar pelo fator de unidades
            const quantidadeTotal = quantidadeIngrediente * fatorMultiplicacao;
            
            if (ingredientesNecessarios[ingredienteReceita.ingredienteId]) {
              ingredientesNecessarios[ingredienteReceita.ingredienteId] += quantidadeTotal;
            } else {
              ingredientesNecessarios[ingredienteReceita.ingredienteId] = quantidadeTotal;
            }
          }
        });
      }
    });

    return ingredientesNecessarios;
  };

  const verificarDisponibilidadeEstoque = (ingredientesNecessarios: { [key: string]: number }) => {
    const alertas: string[] = [];
    
    Object.entries(ingredientesNecessarios).forEach(([ingredienteId, quantidadeNecessaria]) => {
      const ingrediente = ingredientes.find(i => i.id === ingredienteId);
      if (ingrediente) {
        // Converter estoque para gramas para comparação
        let estoqueEmGramas = ingrediente.estoqueAtual;
        if (ingrediente.unidade === 'kg') {
          estoqueEmGramas = ingrediente.estoqueAtual * 1000;
        } else if (ingrediente.unidade === 'l') {
          estoqueEmGramas = ingrediente.estoqueAtual * 1000;
        }
        
        if (estoqueEmGramas < quantidadeNecessaria) {
          alertas.push(`${ingrediente.nome}: necessário ${formatarQuantidade(quantidadeNecessaria, ingrediente.unidade)}, disponível ${ingrediente.estoqueAtual} ${ingrediente.unidade}`);
        }
      }
    });

    return alertas;
  };

  const calcularResumoProducao = (itens: ItemPlanoForm[]) => {
    let tempoTotal = 0;
    let pesoTotal = 0;
    let custoTotal = 0;
    let formasNecessarias = 0;

    itens.forEach(item => {
      if (item.receita) {
        tempoTotal += (item.receita.tempoPreparo || 0) * item.quantidade;
        pesoTotal += (item.receita.pesoUnitario || 0) * item.quantidade;
        custoTotal += (item.receita.custoTotal || 0) * item.quantidade;
        formasNecessarias += item.quantidade;
      }
    });

    return { tempoTotal, pesoTotal, custoTotal, formasNecessarias };
  };

  const formatarQuantidade = (quantidade: number, unidade: string) => {
    // Para ingredientes que são armazenados em kg, mostrar em gramas
    // Para ingredientes que são armazenados em L, mostrar em ml
    let quantidadeExibida = quantidade;
    let unidadeExibida = unidade;
    
    if (unidade === 'kg') {
      unidadeExibida = 'g';
      // quantidade já está em gramas
    } else if (unidade === 'l') {
      unidadeExibida = 'ml';
      // quantidade já está em ml (assumindo densidade da água)
    }
    
    const valor = quantidadeExibida % 1 === 0 ? quantidadeExibida.toFixed(0) : quantidadeExibida.toFixed(2);
    return `${valor} ${unidadeExibida}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dataProducao || itensPlano.length === 0) {
      toast.error('Data e pelo menos um item são obrigatórios');
      return;
    }

    // Validar se todos os itens têm receita e quantidade
    const itensValidos = itensPlano.every(item => item.receitaId && item.quantidade > 0);
    if (!itensValidos) {
      toast.error('Todos os itens devem ter receita e quantidade válidas');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/planos-producao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: dataProducao,
          observacoes,
          itens: itensPlano.map(item => ({
            receitaId: item.receitaId,
            quantidade: item.quantidade
          }))
        }),
      });

      if (response.ok) {
        toast.success('Plano de produção criado com sucesso!');
        router.push('/producao');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar plano de produção');
      }
    } catch (error) {
      console.error('Erro ao criar plano:', error);
      toast.error('Erro ao criar plano de produção');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    );
  }

  // Calcular dados do formulário atual
  const ingredientesNecessarios = calcularIngredientesNecessarios(itensPlano);
  const alertasEstoque = verificarDisponibilidadeEstoque(ingredientesNecessarios);
  const resumoProducao = calcularResumoProducao(itensPlano);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link href="/producao" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Novo Plano de Produção</h1>
              <p className="text-gray-600">Crie um novo plano de produção</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações Básicas */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="w-4 h-4 inline mr-1" />
                  Data de Produção *
                </label>
                <input
                  type="date"
                  value={dataProducao}
                  onChange={(e) => setDataProducao(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Observações sobre o plano de produção..."
                />
              </div>
            </div>
          </div>

          {/* Informações sobre Unidades */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">📏 Informações sobre Unidades</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <p><strong>Receitas:</strong> Todas as quantidades dos ingredientes nas receitas são armazenadas em gramas.</p>
              <p><strong>Estoque:</strong> Os ingredientes no estoque podem ter diferentes unidades (kg, g, L, ml, unidade, etc.).</p>
              <p><strong>Conversão:</strong> O sistema converte automaticamente as quantidades das receitas para as unidades do estoque.</p>
              <p><strong>Peso das receitas:</strong> O peso unitário é sempre em gramas por unidade produzida.</p>
            </div>
          </div>

          {/* Itens de Produção */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Itens de Produção</h2>
              <button
                type="button"
                onClick={adicionarItem}
                className="btn-secondary text-sm"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Adicionar Item
              </button>
            </div>

            <div className="space-y-4">
              {itensPlano.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="font-medium text-gray-900">Item {index + 1}</h5>
                    <button
                      type="button"
                      onClick={() => removerItem(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Receita *
                      </label>
                      <select
                        value={item.receitaId}
                        onChange={(e) => atualizarItem(index, 'receitaId', e.target.value)}
                        className="input-field"
                        required
                      >
                        <option value="">Selecione uma receita</option>
                        {receitas.map((receita) => (
                          <option key={receita.id} value={receita.id}>
                            {receita.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantidade *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) => atualizarItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>

                  {/* Informações da Receita */}
                  {item.receita && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                              <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {(item.receita.tempoPreparo || 0) * item.quantidade} min
                        </div>
                      {item.receita.pesoUnitario && (
                        <div className="flex items-center">
                          <ScaleIcon className="w-4 h-4 mr-1" />
                          {(item.receita.pesoUnitario * item.quantidade).toFixed(0)}g
                        </div>
                      )}
                      <div className="flex items-center">
                        <CubeIcon className="w-4 h-4 mr-1" />
                        R$ {((item.receita.custoTotal || 0) * item.quantidade).toFixed(2)}
                      </div>
                      {item.receita.tamanhoForma && (
                        <div className="text-xs">
                          Forma: {item.receita.tamanhoForma}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {itensPlano.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardDocumentListIcon className="mx-auto h-8 w-8 mb-2" />
                  <p>Nenhum item adicionado</p>
                  <p className="text-sm">Clique em "Adicionar Item" para começar</p>
                </div>
              )}
            </div>
          </div>

          {/* Resumo da Produção */}
          {itensPlano.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Resumo da Produção</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(resumoProducao.tempoTotal / 60)}</div>
                  <div className="text-blue-700">Horas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{(resumoProducao.pesoTotal / 1000).toFixed(1)}</div>
                  <div className="text-blue-700">Kg Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">R$ {resumoProducao.custoTotal.toFixed(2)}</div>
                  <div className="text-blue-700">Custo Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{resumoProducao.formasNecessarias}</div>
                  <div className="text-blue-700">Unidades</div>
                </div>
              </div>
            </div>
          )}

          {/* Mapa de Ingredientes */}
          {Object.keys(ingredientesNecessarios).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mapa de Ingredientes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(ingredientesNecessarios).map(([ingredienteId, quantidade]) => {
                  const ingrediente = ingredientes.find(i => i.id === ingredienteId);
                  
                  // Converter estoque para gramas para comparação
                  let estoqueEmGramas = 0;
                  if (ingrediente) {
                    estoqueEmGramas = ingrediente.estoqueAtual;
                    if (ingrediente.unidade === 'kg') {
                      estoqueEmGramas = ingrediente.estoqueAtual * 1000;
                    } else if (ingrediente.unidade === 'l') {
                      estoqueEmGramas = ingrediente.estoqueAtual * 1000;
                    }
                  }
                  
                  const disponivel = ingrediente ? estoqueEmGramas >= quantidade : false;
                  
                  return (
                    <div key={ingredienteId} className={`flex justify-between items-center p-3 rounded ${
                      disponivel ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div>
                        <span className="font-medium">
                          {ingrediente?.nome || 'Ingrediente não encontrado'}
                        </span>
                        <div className="text-xs text-gray-600">
                          Necessário: {ingrediente ? formatarQuantidade(quantidade, ingrediente.unidade) : `${quantidade.toFixed(2)} unidade`} | 
                          Disponível: {ingrediente ? `${ingrediente.estoqueAtual} ${ingrediente.unidade}` : 'N/A'}
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        disponivel ? 'bg-green-200' : 'bg-red-200'
                      }`}>
                        {disponivel ? (
                          <CheckCircleIcon className="w-3 h-3 text-green-600" />
                        ) : (
                          <ExclamationTriangleIcon className="w-3 h-3 text-red-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Alertas de Estoque */}
          {alertasEstoque.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-md font-medium text-red-900 mb-2 flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                Alertas de Estoque
              </h4>
              <ul className="space-y-1">
                {alertasEstoque.map((alerta, index) => (
                  <li key={index} className="text-sm text-red-700">• {alerta}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Link href="/producao" className="btn-outline">
              Cancelar
            </Link>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || itensPlano.length === 0}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : (
                'Criar Plano de Produção'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 