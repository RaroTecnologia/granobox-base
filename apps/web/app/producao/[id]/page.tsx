'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeftIcon,
  PrinterIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  ScaleIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { PlanoProducao, Receita, Ingrediente } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function DetalhePlanoPage() {
  const params = useParams();
  const planoId = params.id as string;
  
  const [plano, setPlano] = useState<PlanoProducao | null>(null);
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [imprimindo, setImprimindo] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewTitle, setPreviewTitle] = useState('Preview');
  
  // Estados do modal de confirmação
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    planoId: string;
    status: string;
    title: string;
    message: string;
    confirmText: string;
    type: 'primary' | 'danger';
  } | null>(null);

  useEffect(() => {
    carregarDados();
  }, [planoId]);

  const carregarDados = async () => {
    try {
      const [planoRes, receitasRes, ingredientesRes] = await Promise.all([
        fetch(`/api/planos-producao/${planoId}`),
        fetch('/api/receitas'),
        fetch('/api/ingredientes')
      ]);

      if (planoRes.ok) {
        const planoData = await planoRes.json();
        setPlano(planoData);
      } else {
        toast.error('Plano não encontrado');
      }

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

  const calcularIngredientesNecessarios = () => {
    if (!plano) return {};
    
    const ingredientesNecessarios: { [key: string]: number } = {};
    
    plano.itens.forEach(item => {
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

  const formatarQuantidade = (quantidade: number, unidade: string) => {
    let quantidadeExibida = quantidade;
    let unidadeExibida = unidade;
    
    if (unidade === 'kg') {
      unidadeExibida = 'g';
    } else if (unidade === 'l') {
      unidadeExibida = 'ml';
    }
    
    const valor = quantidadeExibida % 1 === 0 ? quantidadeExibida.toFixed(0) : quantidadeExibida.toFixed(2);
    return `${valor} ${unidadeExibida}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planejado': return 'bg-yellow-100 text-yellow-800';
      case 'em_producao': return 'bg-blue-100 text-blue-800';
      case 'concluido': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planejado': return 'Planejado';
      case 'em_producao': return 'Em Produção';
      case 'concluido': return 'Concluído';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const calcularResumoPlano = () => {
    if (!plano) return { totalItens: 0, totalPeso: 0, totalTempo: 0, totalCusto: 0 };
    
    const totalItens = plano.itens.reduce((acc, item) => acc + item.quantidade, 0);
    const totalPeso = plano.itens.reduce((acc, item) => 
      acc + (item.quantidade * (item.receita?.pesoUnitario || 0)), 0
    );
    const totalTempo = plano.itens.reduce((acc, item) => 
      acc + (item.quantidade * (item.receita?.tempoPreparo || 0)), 0
    );
    const totalCusto = plano.itens.reduce((acc, item) => 
      acc + (item.quantidade * (item.receita?.custoTotal || 0)), 0
    );

    return { totalItens, totalPeso, totalTempo, totalCusto };
  };

  const solicitarConfirmacao = (planoId: string, novoStatus: string) => {
    const configuracoes: { [key: string]: any } = {
      'em_producao': {
        title: 'Iniciar Produção',
        message: 'Tem certeza que deseja iniciar esta produção? O status será alterado para "Em Produção".',
        confirmText: 'Iniciar Produção',
        type: 'primary'
      },
      'concluido': {
        title: 'Finalizar Produção',
        message: 'Tem certeza que deseja finalizar esta produção? O estoque será atualizado automaticamente e não será possível reverter esta ação.',
        confirmText: 'Finalizar Produção',
        type: 'primary'
      },
      'cancelado': {
        title: 'Cancelar Produção',
        message: 'Tem certeza que deseja cancelar esta produção? Esta ação não poderá ser desfeita.',
        confirmText: 'Cancelar Produção',
        type: 'danger'
      }
    };

    const config = configuracoes[novoStatus];
    if (config) {
      setConfirmAction({
        planoId,
        status: novoStatus,
        ...config
      });
      setShowConfirmModal(true);
    }
  };

  const executarAtualizacaoStatus = async (planoId: string, novoStatus: string) => {
    try {
      const response = await fetch(`/api/planos-producao/${planoId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (response.ok) {
        const statusLabels: { [key: string]: string } = {
          'em_producao': 'Produção iniciada com sucesso!',
          'concluido': 'Produção finalizada! Estoque atualizado automaticamente.',
          'cancelado': 'Produção cancelada.'
        };
        
        toast.success(statusLabels[novoStatus] || 'Status atualizado');
        carregarDados(); // Recarregar dados para atualizar a interface
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const confirmarAcao = () => {
    if (confirmAction) {
      executarAtualizacaoStatus(confirmAction.planoId, confirmAction.status);
      setShowConfirmModal(false);
      setConfirmAction(null);
    }
  };

  const cancelarAcao = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const imprimirSeparacao = async () => {
    if (!plano) return;
    
    setImprimindo(true);
    
    try {
      const ingredientesNecessarios = calcularIngredientesNecessarios();
      // Primeiro tenta gerar payload para Agent local
      const payloadResp = await fetch('/api/imprimir-separacao', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planoId: plano.id, ingredientesNecessarios, itens: plano.itens, dataProducao: plano.data, clientAgent: true })
      })
      if (payloadResp.ok) {
        const { dataBase64 } = await payloadResp.json()
        // Tentar enviar ao Agent no cliente
        const base = 'http://127.0.0.1:9123'
        const health = await fetch(`${base}/health`).then(r=>r.json()).catch(()=>null)
        if (health?.ok) {
          const resp = await fetch(`${base}/print/escpos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataBase64 }) })
          if (resp.ok) {
            toast.success('Separação enviada via Agent local')
            return
          }
        }
        // Fallback: servidor imprime (ambiente local)
      }
      // Fallback para fluxo servidor
      const response = await fetch('/api/imprimir-separacao', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planoId: plano.id, ingredientesNecessarios, itens: plano.itens, dataProducao: plano.data }) })
      if (response.ok) { toast.success('Separação impressa com sucesso!') } else { const error = await response.json(); toast.error(error.error || 'Erro ao imprimir separação') }
    } catch (error) {
      console.error('Erro ao imprimir separação:', error);
      toast.error('Erro ao imprimir separação');
    } finally {
      setImprimindo(false);
    }
  };

  const visualizarSeparacao = async () => {
    if (!plano) return;
    
    try {
      const ingredientesNecessarios = calcularIngredientesNecessarios();
      
      const response = await fetch('/api/gerar-separacao-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planoId: plano.id,
          ingredientesNecessarios,
          itens: plano.itens,
          dataProducao: plano.data
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewContent(data.conteudo);
        setPreviewTitle('Separação de Ingredientes');
        setShowPreview(true);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao gerar separação');
      }
    } catch (error) {
      console.error('Erro ao gerar separação:', error);
      toast.error('Erro ao gerar separação');
    }
  };

  const visualizarPlanoCompleto = async () => {
    if (!plano) return;
    
    try {
      const response = await fetch('/api/gerar-plano-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planoId: plano.id,
          itens: plano.itens,
          dataProducao: plano.data,
          observacoes: plano.observacoes
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewContent(data.conteudo);
        setPreviewTitle('Plano de Produção Completo');
        setShowPreview(true);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao gerar plano');
      }
    } catch (error) {
      console.error('Erro ao gerar plano:', error);
      toast.error('Erro ao gerar plano');
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

  if (!plano) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Plano não encontrado</h1>
            <Link href="/producao" className="btn-primary">
              Voltar para Produção
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ingredientesNecessarios = calcularIngredientesNecessarios();
  const resumo = calcularResumoPlano();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link href="/producao" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                Produção - {format(new Date(plano.data), 'dd/MM/yyyy', { locale: ptBR })}
              </h1>
              <p className="text-gray-600">
                Criado em {format(new Date(plano.dataCriacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(plano.status)}`}>
              {getStatusLabel(plano.status)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Resumo Geral */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo Geral</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{resumo.totalItens}</div>
                  <div className="text-sm text-gray-600">Unidades</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{(resumo.totalPeso / 1000).toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Kg Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(resumo.totalTempo / 60)}</div>
                  <div className="text-sm text-gray-600">Horas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">R$ {resumo.totalCusto.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Custo</div>
                </div>
              </div>
            </div>

            {/* Observações */}
            {plano.observacoes && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Observações</h2>
                <p className="text-gray-700">{plano.observacoes}</p>
              </div>
            )}

            {/* Itens de Produção */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Itens de Produção</h2>
              <div className="space-y-4">
                {plano.itens.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium text-gray-900">{item.receita?.nome || 'Receita não encontrada'}</h3>
                      <span className="text-lg font-semibold text-blue-600">{item.quantidade}x</span>
                    </div>
                    
                    {item.receita && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {(item.receita.tempoPreparo || 0) * item.quantidade} min
                        </div>
                        {item.receita.pesoUnitario && (
                          <div className="flex items-center">
                            <ScaleIcon className="w-4 h-4 mr-1" />
                            {(item.receita.pesoUnitario * item.quantidade / 1000).toFixed(1)} kg
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
              </div>
            </div>

            {/* Mapa de Ingredientes */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Mapa de Ingredientes</h2>
              <div className="space-y-3">
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
                    <div key={ingredienteId} className={`flex justify-between items-center p-4 rounded-lg ${
                      disponivel ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                      <div>
                        <span className="font-medium text-gray-900">
                          {ingrediente?.nome || 'Ingrediente não encontrado'}
                        </span>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Necessário:</span> {ingrediente ? formatarQuantidade(quantidade, ingrediente.unidade) : `${quantidade.toFixed(2)} unidade`}
                        </div>
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">Disponível:</span> {ingrediente ? `${ingrediente.estoqueAtual} ${ingrediente.unidade}` : 'N/A'}
                        </div>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        disponivel ? 'bg-green-200' : 'bg-red-200'
                      }`}>
                        {disponivel ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        ) : (
                          <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar de Ações */}
          <div className="space-y-6">
            {/* Ações de Status */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações</h3>
              <div className="space-y-3">
                {plano.status === 'planejado' && (
                  <button 
                    onClick={() => solicitarConfirmacao(plano.id, 'em_producao')}
                    className="w-full btn-primary"
                  >
                    Iniciar Produção
                  </button>
                )}
                {plano.status === 'em_producao' && (
                  <button 
                    onClick={() => solicitarConfirmacao(plano.id, 'concluido')}
                    className="w-full btn-primary"
                  >
                    Finalizar Produção
                  </button>
                )}
                {(plano.status === 'planejado' || plano.status === 'em_producao') && (
                  <button 
                    onClick={() => solicitarConfirmacao(plano.id, 'cancelado')}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Cancelar Produção
                  </button>
                )}
              </div>
            </div>

            {/* Ações de Documentos */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentos</h3>
              <div className="space-y-3">
                <button
                  onClick={visualizarPlanoCompleto}
                  className="w-full btn-outline flex items-center justify-center"
                >
                  <DocumentTextIcon className="w-4 h-4 mr-2" />
                  Plano Completo
                </button>
                <button
                  onClick={visualizarSeparacao}
                  className="w-full btn-outline flex items-center justify-center"
                >
                  <ClipboardDocumentListIcon className="w-4 h-4 mr-2" />
                  Separação
                </button>
                <button
                  onClick={imprimirSeparacao}
                  disabled={imprimindo}
                  className="w-full btn-outline flex items-center justify-center"
                >
                  {imprimindo ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      Imprimindo...
                    </>
                  ) : (
                    <>
                      <PrinterIcon className="w-4 h-4 mr-2" />
                      Imprimir Separação
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Preview */}
        {showPreview && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Preview - {previewTitle}</h3>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm whitespace-pre-line">
                  {previewContent}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="btn-outline"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(previewContent);
                    toast.success('Conteúdo copiado para a área de transferência!');
                  }}
                  className="btn-primary"
                >
                  Copiar Texto
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação */}
        {showConfirmModal && confirmAction && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  {confirmAction.type === 'danger' ? (
                    <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                      <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-10 h-10 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                      <ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" />
                    </div>
                  )}
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {confirmAction.title}
                    </h3>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-sm text-gray-500">
                    {confirmAction.message}
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={cancelarAcao}
                    className="btn-outline"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmarAcao}
                    className={confirmAction.type === 'danger' 
                      ? 'bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                      : 'btn-primary'
                    }
                  >
                    {confirmAction.confirmText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 