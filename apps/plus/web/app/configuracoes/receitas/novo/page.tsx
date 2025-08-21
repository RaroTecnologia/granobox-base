'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import { 
  ArrowLeftIcon, 
  CheckIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  DocumentTextIcon,
  CalculatorIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { BeakerIcon } from '@heroicons/react/24/solid';

interface Ingrediente {
  id: string;
  nome: string;
  unidade: string;
  custoUnitario: number;
}

interface ItemReceita {
  ingredienteId: string;
  quantidade: number;
  ingrediente?: Ingrediente;
  isIngredienteBase?: boolean;
}

interface EtapaReceita {
  id?: string;
  receitaId?: string;
  nome: string;
  ordem: number;
  descricao?: string;
  tempoMin?: number;
  tempoMax?: number;
  temperatura?: number;
  umidade?: number;
  observacoes?: string;
}

interface Receita {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  rendimento: number;
  tempoPreparo: number;
  custoTotal: number;
  precoVenda: number;
  instrucoes: string;
  tamanhoForma?: string;
  pesoUnitario?: number;
  ativo: boolean;
  ingredientes: ItemReceita[];
  etapas: EtapaReceita[];
  sistemaCalculo?: 'peso' | 'porcentagem';
  pesoTotalBase?: number;
}

const categorias = [
  { value: 'paes', label: 'Pães' },
  { value: 'doces', label: 'Doces' },
  { value: 'salgados', label: 'Salgados' },
  { value: 'bebidas', label: 'Bebidas' }
];

const passos = [
  { id: 1, nome: 'Informações Básicas', icon: DocumentTextIcon },
  { id: 2, nome: 'Sistema de Cálculo', icon: CalculatorIcon },
  { id: 3, nome: 'Ingredientes', icon: BeakerIcon },
  { id: 4, nome: 'Etapas', icon: ClockIcon },
  { id: 5, nome: 'Revisão', icon: EyeIcon }
];

export default function NovaReceitaWizardPage() {
  const router = useRouter();
  const [passoAtual, setPassoAtual] = useState(1);
  const [ingredientesDisponiveis, setIngredientesDisponiveis] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'paes',
    descricao: '',
    rendimento: 1,
    tempoPreparo: 0,
    precoVenda: 0,
    instrucoes: '',
    tamanhoForma: '',
    pesoUnitario: 0,
    ingredientes: [] as ItemReceita[],
    etapas: [] as EtapaReceita[]
  });

  const [sistemaCalculo, setSistemaCalculo] = useState<'peso' | 'porcentagem'>('peso');
  const [pesoTotalBase, setPesoTotalBase] = useState<number>(1000);

  const [novoIngrediente, setNovoIngrediente] = useState({
    ingredienteId: '',
    nome: '',
    unidade: 'g',
    quantidade: 0,
    isIngredienteBase: false
  });

  useEffect(() => {
    carregarIngredientes();
  }, []);

  const carregarIngredientes = async () => {
    try {
      const response = await fetch('/api/ingredientes');
      if (response.ok) {
        const data = await response.json();
        setIngredientesDisponiveis(data);
      }
    } catch (error) {
      console.error('Erro ao carregar ingredientes:', error);
      toast.error('Erro ao carregar ingredientes');
    } finally {
      setLoading(false);
    }
  };

  const proximoPasso = () => {
    if (validarPassoAtual()) {
      setPassoAtual(prev => Math.min(prev + 1, passos.length));
    }
  };

  const passoAnterior = () => {
    setPassoAtual(prev => Math.max(prev - 1, 1));
  };

  const validarPassoAtual = () => {
    switch (passoAtual) {
      case 1:
        if (!formData.nome || !formData.categoria) {
          toast.error('Preencha todos os campos obrigatórios');
          return false;
        }
        break;
      case 2:
        if (sistemaCalculo === 'porcentagem' && pesoTotalBase <= 0) {
          toast.error('Defina o peso total das farinhas base');
          return false;
        }
        break;
      case 3:
        if (formData.ingredientes.length === 0) {
          toast.error('Adicione pelo menos um ingrediente');
          return false;
        }
        if (sistemaCalculo === 'porcentagem') {
          const ingredientesBase = formData.ingredientes.filter(item => item.isIngredienteBase);
          if (ingredientesBase.length === 0) {
            toast.error('Marque pelo menos um ingrediente como base');
            return false;
          }
        }
        break;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validarPassoAtual()) return;
    
    setSubmitting(true);
    const loadingToast = toast.loading('Salvando receita...');

    try {
      const response = await fetch('/api/receitas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          sistemaCalculo,
          pesoTotalBase: sistemaCalculo === 'porcentagem' ? pesoTotalBase : undefined,
          ativo: true
        }),
      });

      if (response.ok) {
        toast.success('Receita criada com sucesso!', { id: loadingToast });
        router.push('/configuracoes/receitas');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar receita', { id: loadingToast });
      }
    } catch (error) {
      console.error('Erro ao criar receita:', error);
      toast.error('Erro ao criar receita', { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const adicionarIngrediente = () => {
    if (!novoIngrediente.ingredienteId || novoIngrediente.quantidade <= 0) return;

    const ingredienteExistente = formData.ingredientes.find(
      (item) => item.ingredienteId === novoIngrediente.ingredienteId
    );

    if (ingredienteExistente) {
      toast.error('Este ingrediente já foi adicionado.');
      return;
    }

    const novoItem: ItemReceita = {
      ingredienteId: novoIngrediente.ingredienteId,
      quantidade: novoIngrediente.quantidade,
      nome: novoIngrediente.nome,
      unidade: novoIngrediente.unidade,
      isIngredienteBase: novoIngrediente.isIngredienteBase
    };

    setFormData(prev => ({
      ...prev,
      ingredientes: [...prev.ingredientes, novoItem]
    }));

    setNovoIngrediente({
      ingredienteId: '',
      nome: '',
      unidade: 'g',
      quantidade: 0,
      isIngredienteBase: false
    });
  };

  const removerIngrediente = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredientes: prev.ingredientes.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Carregando ingredientes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Nova Receita</h1>
                  <p className="text-gray-600">Crie uma nova receita passo a passo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {passos.map((passo, index) => (
                <div key={passo.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    passo.id <= passoAtual 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-500'
                  }`}>
                    {passo.id < passoAtual ? (
                      <CheckIcon className="w-5 h-5" />
                    ) : (
                      <passo.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    passo.id <= passoAtual ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {passo.nome}
                  </span>
                  {index < passos.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      passo.id < passoAtual ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Conteúdo do Passo */}
          <div className="bg-white shadow rounded-lg p-6">
            {/* Renderizar conteúdo baseado no passo atual */}
            <div className="min-h-[400px]">
              {passoAtual === 1 && (
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Informações Básicas da Receita</h2>
                    <p className="text-gray-600 mt-1">Configure os dados fundamentais da sua receita</p>
                  </div>

                  {/* Nome e Categoria */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome da Receita *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nome}
                        onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Pão Francês, Bolo de Chocolate, Pizza Margherita"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoria *
                      </label>
                      <select
                        required
                        value={formData.categoria}
                        onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {categorias.map(categoria => (
                          <option key={categoria.value} value={categoria.value}>
                            {categoria.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descreva brevemente a receita, características especiais, etc."
                    />
                  </div>

                  {/* Rendimento e Tempo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rendimento (unidades)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.rendimento}
                        onChange={(e) => setFormData(prev => ({ ...prev, rendimento: parseInt(e.target.value) || 1 }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Quantas unidades esta receita produz"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Ex: 12 pães, 1 bolo, 8 pizzas, etc.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tempo de Preparo (minutos)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.tempoPreparo}
                        onChange={(e) => setFormData(prev => ({ ...prev, tempoPreparo: parseInt(e.target.value) || 0 }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tempo total de preparo"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Inclui tempo de fermentação, assamento, etc.
                      </p>
                    </div>
                  </div>

                  {/* Preço de Venda */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço de Venda (R$)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">R$</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.precoVenda}
                        onChange={(e) => setFormData(prev => ({ ...prev, precoVenda: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-12 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Preço por unidade ou por receita completa
                    </p>
                  </div>

                  {/* Campos Opcionais */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Detalhes Opcionais</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tamanho da Forma
                        </label>
                        <input
                          type="text"
                          value={formData.tamanhoForma}
                          onChange={(e) => setFormData(prev => ({ ...prev, tamanhoForma: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: 30x20cm, Forma grande, etc."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Especificação da forma utilizada
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Peso Unitário (gramas)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.pesoUnitario}
                          onChange={(e) => setFormData(prev => ({ ...prev, pesoUnitario: parseFloat(e.target.value) || 0 }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Peso de cada unidade"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Peso individual de cada unidade produzida
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {passoAtual === 2 && (
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Sistema de Cálculo</h2>
                    <p className="text-gray-600 mt-1">Escolha como calcular as quantidades dos ingredientes</p>
                  </div>

                  {/* Seleção do Sistema */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="sistema-peso"
                        name="sistemaCalculo"
                        value="peso"
                        checked={sistemaCalculo === 'peso'}
                        onChange={(e) => setSistemaCalculo(e.target.value as 'peso' | 'porcentagem')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="sistema-peso" className="text-lg font-medium text-gray-900">
                        🏋️ Sistema por Peso Absoluto
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="sistema-porcentagem"
                        name="sistemaCalculo"
                        value="porcentagem"
                        checked={sistemaCalculo === 'porcentagem'}
                        onChange={(e) => setSistemaCalculo(e.target.value as 'peso' | 'porcentagem')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label htmlFor="sistema-porcentagem" className="text-lg font-medium text-gray-900">
                        📊 Sistema por Porcentagem (Padeiro)
                      </label>
                    </div>
                  </div>

                  {/* Explicação dos Sistemas */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="space-y-4">
                      {sistemaCalculo === 'peso' ? (
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <span className="mr-2">🏋️</span>
                            Sistema por Peso Absoluto
                          </h3>
                          <p className="text-gray-700">
                            Cada ingrediente tem uma quantidade fixa em gramas ou mililitros. 
                            Ideal para receitas com medidas precisas e consistentes.
                          </p>
                          <div className="bg-white rounded-lg p-4 border">
                            <h4 className="font-medium text-gray-900 mb-2">Exemplo:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Farinha de trigo: 500g</li>
                              <li>• Água: 300ml</li>
                              <li>• Sal: 10g</li>
                              <li>• Fermento: 7g</li>
                            </ul>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <span className="mr-2">📊</span>
                            Sistema por Porcentagem (Padeiro)
                          </h3>
                          <p className="text-gray-700">
                            As quantidades são calculadas como porcentagem do peso total das farinhas base. 
                            Sistema profissional usado por padeiros e confeiteiros.
                          </p>
                          <div className="bg-white rounded-lg p-4 border">
                            <h4 className="font-medium text-gray-900 mb-2">Exemplo:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• Farinha de trigo: 100% (base de cálculo)</li>
                              <li>• Água: 60% (60% do peso da farinha)</li>
                              <li>• Sal: 2% (2% do peso da farinha)</li>
                              <li>• Fermento: 1.4% (1.4% do peso da farinha)</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Configuração do Peso Base (apenas para porcentagem) */}
                  {sistemaCalculo === 'porcentagem' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-4">
                        ⚖️ Configuração do Peso Base
                      </h3>
                      <p className="text-blue-700 mb-4">
                        Defina o peso total das farinhas base para calcular as porcentagens dos outros ingredientes.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-blue-900 mb-2">
                            Peso Total das Farinhas Base (gramas)
                          </label>
                          <input
                            type="number"
                            min="100"
                            step="50"
                            value={pesoTotalBase}
                            onChange={(e) => setPesoTotalBase(parseInt(e.target.value) || 1000)}
                            className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            placeholder="1000"
                          />
                          <p className="text-xs text-blue-600 mt-1">
                            Ex: 1000g = 1kg de farinha base
                          </p>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                          <h4 className="font-medium text-blue-900 mb-2">📋 Próximos Passos:</h4>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>1. Marque ingredientes como "base"</li>
                            <li>2. Sistema calculará automaticamente</li>
                            <li>3. Outros ingredientes em % da base</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vantagens do Sistema Escolhido */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">
                      ✅ Vantagens do Sistema {sistemaCalculo === 'peso' ? 'por Peso' : 'por Porcentagem'}
                    </h4>
                    <div className="text-sm text-green-700 space-y-1">
                      {sistemaCalculo === 'peso' ? (
                        <>
                          <p>• <strong>Precisão:</strong> Quantidades fixas e consistentes</p>
                          <p>• <strong>Simplicidade:</strong> Fácil de entender e replicar</p>
                          <p>• <strong>Controle:</strong> Resultado sempre igual</p>
                        </>
                      ) : (
                        <>
                          <p>• <strong>Flexibilidade:</strong> Fácil de escalar receitas</p>
                          <p>• <strong>Profissional:</strong> Padrão da indústria</p>
                          <p>• <strong>Proporcional:</strong> Mantém proporções perfeitas</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {passoAtual === 3 && (
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Ingredientes da Receita</h2>
                    <p className="text-gray-600 mt-1">
                      {sistemaCalculo === 'peso' 
                        ? 'Adicione os ingredientes com suas quantidades em peso/volume'
                        : 'Adicione os ingredientes e marque quais são base para cálculo'
                      }
                    </p>
                  </div>

                  {/* Adicionar Novo Ingrediente */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">
                      ➕ Adicionar Novo Ingrediente
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-2">
                          Ingrediente *
                        </label>
                        <select
                          value={novoIngrediente.ingredienteId || ''}
                          onChange={(e) => {
                            const ingrediente = ingredientesDisponiveis.find(i => i.id === e.target.value);
                            setNovoIngrediente(prev => ({
                              ...prev,
                              ingredienteId: e.target.value,
                              nome: ingrediente?.nome || '',
                              unidade: ingrediente?.unidade || 'g'
                            }));
                          }}
                          className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          <option value="">Selecione um ingrediente</option>
                          {ingredientesDisponiveis.map(ingrediente => (
                            <option key={ingrediente.id} value={ingrediente.id}>
                              {ingrediente.nome} ({ingrediente.unidade})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-2">
                          {sistemaCalculo === 'peso' ? 'Quantidade *' : 'Porcentagem *'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step={sistemaCalculo === 'peso' ? "0.1" : "0.01"}
                          value={novoIngrediente.quantidade}
                          onChange={(e) => setNovoIngrediente(prev => ({ ...prev, quantidade: parseFloat(e.target.value) || 0 }))}
                          className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          placeholder={sistemaCalculo === 'peso' ? "500" : "60.0"}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-2">
                          Unidade
                        </label>
                        <input
                          type="text"
                          value={novoIngrediente.unidade}
                          onChange={(e) => setNovoIngrediente(prev => ({ ...prev, unidade: e.target.value }))}
                          className="w-full border border-blue-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          placeholder="g, ml, kg, etc."
                        />
                      </div>
                    </div>

                    {/* Opções específicas para sistema de porcentagem */}
                    {sistemaCalculo === 'porcentagem' && (
                      <div className="mb-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={novoIngrediente.isIngredienteBase}
                            onChange={(e) => setNovoIngrediente(prev => ({ ...prev, isIngredienteBase: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm font-medium text-blue-900">
                            🏗️ Este é um ingrediente base (farinha, etc.)
                          </span>
                        </label>
                        <p className="text-xs text-blue-600 mt-1 ml-6">
                          Marque ingredientes como farinha de trigo, centeio, etc. para cálculo de porcentagens
                        </p>
                      </div>
                    )}

                    <button
                      onClick={adicionarIngrediente}
                      disabled={!novoIngrediente.ingredienteId || novoIngrediente.quantidade <= 0}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ➕ Adicionar Ingrediente
                    </button>
                  </div>

                  {/* Lista de Ingredientes */}
                  <div className="bg-white border border-gray-200 rounded-lg">
                    <div className="px-6 py-4 border-b bg-gray-50">
                      <h3 className="text-lg font-semibold text-gray-900">
                        📋 Ingredientes Adicionados ({formData.ingredientes.length})
                      </h3>
                    </div>
                    
                    {formData.ingredientes.length === 0 ? (
                      <div className="p-8 text-center">
                        <BeakerIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum ingrediente adicionado</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Adicione o primeiro ingrediente para começar sua receita
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {formData.ingredientes.map((item, index) => (
                          <div key={index} className="px-6 py-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    {sistemaCalculo === 'porcentagem' && item.isIngredienteBase ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        🏗️ Base
                                      </span>
                                    ) : null}
                                  </div>
                                  
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900">{item.nome}</h4>
                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                      <span>
                                        {sistemaCalculo === 'peso' 
                                          ? `${item.quantidade} ${item.unidade}`
                                          : `${item.quantidade}%`
                                        }
                                      </span>
                                      {sistemaCalculo === 'porcentagem' && item.isIngredienteBase && (
                                        <span className="text-blue-600">
                                          = {(item.quantidade * pesoTotalBase / 100).toFixed(1)}g
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => removerIngrediente(index)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Remover ingrediente"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Resumo e Validações */}
                  {formData.ingredientes.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">📊 Resumo da Receita</h4>
                      
                      {sistemaCalculo === 'porcentagem' ? (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Ingredientes base:</span>
                            <span className="font-medium">
                              {formData.ingredientes.filter(i => i.isIngredienteBase).length} ingrediente(s)
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total base:</span>
                            <span className="font-medium">
                              {formData.ingredientes
                                .filter(i => i.isIngredienteBase)
                                .reduce((sum, i) => sum + i.quantidade, 0)
                                .toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Peso total base:</span>
                            <span className="font-medium">{pesoTotalBase}g</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total de ingredientes:</span>
                            <span className="font-medium">{formData.ingredientes.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Peso total estimado:</span>
                            <span className="font-medium">
                              {formData.ingredientes
                                .filter(i => i.unidade === 'g' || i.unidade === 'kg')
                                .reduce((sum, i) => sum + (i.unidade === 'kg' ? i.quantidade * 1000 : i.quantidade), 0)
                                .toFixed(1)}g
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Avisos e Validações */}
                  {sistemaCalculo === 'porcentagem' && (
                    <div className="space-y-3">
                      {formData.ingredientes.filter(i => i.isIngredienteBase).length === 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800">
                                ⚠️ Nenhum ingrediente base selecionado
                              </h3>
                              <p className="mt-1 text-sm text-yellow-700">
                                Para o sistema de porcentagem, você deve marcar pelo menos um ingrediente como base (farinha, etc.)
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {formData.ingredientes.filter(i => i.isIngredienteBase).length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-green-800">
                                ✅ Sistema configurado corretamente
                              </h3>
                              <p className="mt-1 text-sm text-green-700">
                                Os ingredientes base estão definidos. O sistema calculará automaticamente as quantidades.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Placeholder para outros passos */}
              {passoAtual !== 1 && (
                <div className="text-center py-20">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Passo {passoAtual}: {passos[passoAtual - 1].nome}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Conteúdo do passo será implementado...
                  </p>
                </div>
              )}
            </div>

            {/* Navegação */}
            <div className="flex justify-between pt-6 border-t mt-6">
              <button
                type="button"
                onClick={passoAnterior}
                disabled={passoAtual === 1}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-4 h-4 mr-2" />
                Anterior
              </button>

              <div className="flex space-x-3">
                {passoAtual < passos.length ? (
                  <button
                    type="button"
                    onClick={proximoPasso}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                  >
                    Próximo
                    <ChevronRightIcon className="w-4 h-4 ml-2" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4 mr-2" />
                        Criar Receita
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
