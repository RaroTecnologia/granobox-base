import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import {
  Printer,
  ArrowLeft,
  Tag,
  House,
  Minus,
  Plus,
  Layout,
  Warning,
  CalendarBlank,
  Package,
  Thermometer,
  Snowflake,
  CheckCircle,
  TextT,
  User,
  Clock,
  Flask,
  Drop,
  Scales,
  Barcode,
  TextAa,
  Eye,
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import { tagmentPrintService } from '@/services/tagmentPrintService';
import { v2PrintService } from '@/services/v2PrintService';
import { usePreview } from '@/hooks/usePreview';
import LabelPreview from '@/components/LabelPreview';
import SimulatedLabelPreview from '@/components/SimulatedLabelPreview';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Product } from '@/services/productsService';

interface TagmentTemplate {
  id: string;
  name: string;
  description?: string;
  zpl?: string;
  width?: number;
  height?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Extrai variáveis do ZPL (formato {{variavel}})
function extractVariables(zpl: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const matches = new Set<string>();
  let match;
  while ((match = regex.exec(zpl)) !== null) {
    matches.add(match[1]);
  }
  return Array.from(matches);
}

export default function EtiquetaPersonalizadaPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const productId = searchParams.get('productId');
  const templateId = searchParams.get('templateId');

  const clientId = user?.clientId || (user?.role === 'manager' ? '6621e831-5d1d-4801-8c33-b0f93446a3df' : undefined);
  const { products, getProductById } = useProducts(clientId);

  const [template, setTemplate] = useState<TagmentTemplate | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(1);

  // Controladores dinâmicos para os campos
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  // Preview
  const preview = usePreview();
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Campos especiais
  const [dataManipulacao, setDataManipulacao] = useState<Date>(new Date());
  const [dataValidade, setDataValidade] = useState<Date | null>(null);
  const [conservacaoSelecionada, setConservacaoSelecionada] = useState<string | null>(null);

  // Variáveis extraídas do template
  const variables = useMemo(() => {
    if (!template?.zpl) return [];
    return extractVariables(template.zpl);
  }, [template?.zpl]);

  // Carregar produto
  useEffect(() => {
    if (productId && products.length > 0) {
      const p = getProductById(productId);
      if (p) {
        setProduct(p);
      }
    }
  }, [productId, products, getProductById]);

  // Carregar template do Tagment
  useEffect(() => {
    if (!templateId || !clientId) return;

    const carregarTemplate = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Buscar template diretamente do Tagment
        const templates = await tagmentPrintService.getAvailableTemplates(clientId);
        const foundTemplate = templates.find((t: any) => t.id === templateId);

        if (!foundTemplate) {
          setError('Template não encontrado');
          setIsLoading(false);
          return;
        }

        setTemplate(foundTemplate);
      } catch (err: any) {
        console.error('Erro ao carregar template:', err);
        setError(`Erro ao carregar template: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    carregarTemplate();
  }, [templateId, clientId]);

  // Inicializar valores dos campos quando template e produto carregarem
  useEffect(() => {
    if (!template || variables.length === 0) return;

    const initialValues: Record<string, string> = {};
    variables.forEach((variable) => {
      initialValues[variable] = getDefaultValue(variable);
    });

    setFieldValues(initialValues);

    // Verificar se deve inicializar conservação automaticamente
    if (product) {
      const opcoesDisponiveis = getOpcoesConservacao().filter(o => o.disponivel);
      if (opcoesDisponiveis.length === 1) {
        setConservacaoSelecionada(opcoesDisponiveis[0].nome);
        calcularDataValidade(opcoesDisponiveis[0].nome);
      }
    }
  }, [template, variables, product]);

  // Atualizar campos quando data de manipulação mudar
  useEffect(() => {
    if (conservacaoSelecionada) {
      calcularDataValidade(conservacaoSelecionada);
    }
    // Atualizar campo de manipulação
    updateFieldsWithDate('manipulacao', dataManipulacao);
  }, [dataManipulacao, conservacaoSelecionada]);

  const formatDate = (date: Date): string => {
    return format(date, 'dd/MM/yyyy');
  };

  const updateFieldsWithDate = (tipo: 'manipulacao' | 'validade', date: Date | null) => {
    if (!date) return;
    
    const formattedDate = formatDate(date);
    const newValues = { ...fieldValues };
    
    variables.forEach((variable) => {
      const lowerVar = variable.toLowerCase();
      if (tipo === 'manipulacao' && (lowerVar === 'manipulacao' || lowerVar === 'data_manipulacao' || lowerVar === 'manipulation_date')) {
        newValues[variable] = formattedDate;
      }
      if (tipo === 'validade' && (lowerVar === 'validade' || lowerVar === 'data_validade' || lowerVar === 'validity_date' || lowerVar === 'vencimento')) {
        newValues[variable] = formattedDate;
      }
    });
    
    setFieldValues(newValues);
  };

  const getDefaultValue = (variable: string): string => {
    if (!product) return '';
    
    const lowerVar = variable.toLowerCase();

    // Nome do produto - usando mesma lógica de isHiddenField para consistência
    if (lowerVar.includes('produto') || lowerVar.includes('product')) {
      if (lowerVar.includes('nome') || lowerVar.includes('name')) {
        return product.name;
      }
      if (lowerVar === 'produto' || lowerVar === 'product') {
        return product.name;
      }
    }
    if (lowerVar === 'nome' || lowerVar === 'name') {
      return product.name;
    }

    // Data de Manipulação
    if (['manipulacao', 'data_manipulacao', 'manipulation_date'].includes(lowerVar)) {
      return formatDate(dataManipulacao);
    }

    // Marca
    if (['marca', 'brand'].includes(lowerVar) && product.brand) {
      return product.brand;
    }

    // SIF/Código
    if (['sif', 'codigo', 'code'].includes(lowerVar) && product.sif) {
      return product.sif;
    }

    // Peso
    if (['peso', 'weight'].includes(lowerVar) && product.weight) {
      return product.weight;
    }

    // Unidade
    if (['unidade', 'unit'].includes(lowerVar) && product.weightUnit) {
      return product.weightUnit;
    }

    // Descrição
    if (['descricao', 'description'].includes(lowerVar) && product.description) {
      return product.description;
    }

    return '';
  };

  const isHiddenField = (variable: string): boolean => {
    const lowerVar = variable.toLowerCase();
    
    // Ocultar campos de nome do produto (já sabemos qual é, não faz sentido exibir)
    // Usando includes() para capturar variações como nome_do_produto, produto_nome_completo, etc.
    if (lowerVar.includes('produto') || lowerVar.includes('product')) {
      // É um campo relacionado ao produto
      if (lowerVar.includes('nome') || lowerVar.includes('name')) {
        return true;
      }
      // Se é apenas "produto" ou "product" sozinho
      if (lowerVar === 'produto' || lowerVar === 'product') {
        return true;
      }
    }
    
    // Se é exatamente "nome" ou "name" (sem outras palavras)
    if (lowerVar === 'nome' || lowerVar === 'name') {
      return true;
    }
    
    return false;
  };

  const isSpecialField = (variable: string): boolean => {
    const lowerVar = variable.toLowerCase();
    return ['manipulacao', 'data_manipulacao', 'manipulation_date', 'validade', 'data_validade', 'validity_date', 'vencimento', 'conservacao', 'conservation', 'tipo_conservacao'].includes(lowerVar);
  };

  const getSpecialFieldType = (variable: string): 'manipulacao' | 'validade' | 'conservacao' | null => {
    const lowerVar = variable.toLowerCase();
    if (['manipulacao', 'data_manipulacao', 'manipulation_date'].includes(lowerVar)) return 'manipulacao';
    if (['validade', 'data_validade', 'validity_date', 'vencimento'].includes(lowerVar)) return 'validade';
    if (['conservacao', 'conservation', 'tipo_conservacao'].includes(lowerVar)) return 'conservacao';
    return null;
  };

  const getOpcoesConservacao = () => {
    if (!product) return [];
    return [
      {
        nome: 'Ambiente',
        dias: product.shelfLifeAmbient,
        disponivel: (product.shelfLifeAmbient ?? 0) > 0,
        icon: House,
      },
      {
        nome: 'Refrigerado',
        dias: product.shelfLifeRefrigerated,
        disponivel: (product.shelfLifeRefrigerated ?? 0) > 0,
        icon: Thermometer,
      },
      {
        nome: 'Congelado',
        dias: product.shelfLifeFrozen,
        disponivel: (product.shelfLifeFrozen ?? 0) > 0,
        icon: Snowflake,
      },
    ];
  };

  const calcularDataValidade = (conservacao: string) => {
    if (!product) return;

    let diasValidade = 7;
    if (conservacao === 'Ambiente' && product.shelfLifeAmbient) {
      diasValidade = product.shelfLifeAmbient;
    } else if (conservacao === 'Refrigerado' && product.shelfLifeRefrigerated) {
      diasValidade = product.shelfLifeRefrigerated;
    } else if (conservacao === 'Congelado' && product.shelfLifeFrozen) {
      diasValidade = product.shelfLifeFrozen;
    }

    const novaValidade = addDays(dataManipulacao, diasValidade);
    setDataValidade(novaValidade);
    updateFieldsWithDate('validade', novaValidade);
  };

  const handleConservacaoChange = (nome: string) => {
    setConservacaoSelecionada(nome);
    
    // Atualizar campo de conservação
    const newValues = { ...fieldValues };
    variables.forEach((variable) => {
      const lowerVar = variable.toLowerCase();
      if (['conservacao', 'conservation', 'tipo_conservacao'].includes(lowerVar)) {
        newValues[variable] = nome;
      }
    });
    setFieldValues(newValues);
    
    calcularDataValidade(nome);
  };

  const handleFieldChange = (variable: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [variable]: value }));
  };

  const formatLabel = (variable: string): string => {
    return variable
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getIconForVariable = (variable: string) => {
    const lowerVar = variable.toLowerCase();
    if (lowerVar.includes('nome') || lowerVar.includes('name')) return TextT;
    if (lowerVar.includes('paciente') || lowerVar.includes('patient')) return User;
    if (lowerVar.includes('data') || lowerVar.includes('date')) return CalendarBlank;
    if (lowerVar.includes('hora') || lowerVar.includes('time')) return Clock;
    if (lowerVar.includes('formula')) return Flask;
    if (lowerVar.includes('volume') || lowerVar.includes('ml')) return Drop;
    if (lowerVar.includes('peso') || lowerVar.includes('weight')) return Scales;
    if (lowerVar.includes('lote') || lowerVar.includes('batch')) return Barcode;
    return TextAa;
  };

  const handleVerPrevia = () => {
    if (!templateId) {
      toast.error('Nenhum template carregado');
      return;
    }
    setShowPreviewModal(true);
    preview.generate(
      templateId,
      { ...fieldValues },
      { width: template?.width || 60, height: template?.height || 40 },
    );
  };

  const handleImprimir = async () => {
    if (!templateId || !clientId) {
      toast.error('Dados incompletos para impressão');
      return;
    }

    setIsPrinting(true);

    try {
      // Buscar impressora configurada
      const printerId = await tagmentPrintService.getConfiguredPrinter(clientId, 'label');

      if (!printerId) {
        toast.error('Nenhuma impressora de rótulo configurada ou online');
        setIsPrinting(false);
        return;
      }

      // Montar dados para impressão
      const data: Record<string, string> = { ...fieldValues };

      // ⚡ Imprimir usando v2 - Engine ZPL Granobox
      console.log('[v2] Chamando endpoint v2/print-label para rótulo...');
      const result = await v2PrintService.printLabel({
        printerId: printerId,
        templateType: 'label', // Rótulo de produto (não rastreável)
        templateId: templateId,
        copies: quantidade,
        variables: data,
        dimensions: { 
          width: template?.width || 60,  // Usar dimensões do template se disponível
          height: template?.height || 40,
        },
      });

      if (result.success) {
        toast.success(result.message || `${quantidade} rótulo(s) enviado(s) para impressão!`);
        console.log('[v2] Resposta:', result);
        
        // Mostrar alerta de ribbon se necessário
        if (result.supplyUsage?.alertLevel === 'warning') {
          toast(`⚠️ Ribbon baixo: ${result.supplyUsage.ribbonRemainingPercent.toFixed(0)}% restante`, {
            icon: '🎗️',
            duration: 5000,
          });
        } else if (result.supplyUsage?.alertLevel === 'critical') {
          toast.error(`🚨 Ribbon crítico: ${result.supplyUsage.ribbonRemainingPercent.toFixed(0)}% restante - Troque em breve!`, {
            duration: 8000,
          });
        }
        
        navigate(-1);
      } else {
        toast.error(result.message || 'Erro ao imprimir');
      }
    } catch (err: any) {
      console.error('Erro ao imprimir:', err);
      toast.error(err.message || 'Erro ao imprimir rótulo');
    } finally {
      setIsPrinting(false);
    }
  };

  const incrementarQuantidade = () => setQuantidade(q => q + 1);
  const decrementarQuantidade = () => setQuantidade(q => (q > 1 ? q - 1 : 1));

  const inputClasses = `w-full px-4 py-3 rounded-lg border transition-colors ${
    theme === 'dark'
      ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400'
      : 'bg-white border-light-300 text-dark-900 placeholder-dark-500'
  } focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary`;

  const disabledInputClasses = `w-full px-4 py-3 rounded-lg border transition-colors ${
    theme === 'dark'
      ? 'bg-dark-800 border-primary text-dark-300'
      : 'bg-light-200 border-primary text-dark-600'
  } cursor-not-allowed`;

  const renderSpecialField = (variable: string) => {
    const fieldType = getSpecialFieldType(variable);

    if (fieldType === 'manipulacao') {
      return (
        <div key={variable} className="mb-4">
          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
            Data de Manipulação
          </label>
          <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-dark-700 border-primary' : 'bg-white border-primary'}`}>
            <DatePicker
              selected={dataManipulacao}
              onChange={(date: Date | null) => date && setDataManipulacao(date)}
              dateFormat="dd/MM/yyyy"
              locale={ptBR}
              maxDate={new Date()}
              className={inputClasses}
              wrapperClassName="w-full"
              customInput={
                <button
                  type="button"
                  className={`w-full px-4 py-3 rounded-lg border flex items-center justify-between ${theme === 'dark' ? 'bg-dark-700 border-dark-600 text-white' : 'bg-white border-light-300 text-dark-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <CalendarBlank size={20} className="text-primary" />
                    <span>{formatDate(dataManipulacao)}</span>
                  </div>
                </button>
              }
            />
          </div>
        </div>
      );
    }

    if (fieldType === 'validade') {
      return (
        <div key={variable} className="mb-4">
          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
            Data de Validade
            <span className={`ml-2 px-2 py-1 text-xs rounded ${theme === 'dark' ? 'bg-dark-600 text-dark-300' : 'bg-light-200 text-dark-600'}`}>
              Auto
            </span>
          </label>
          <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'bg-dark-800 border-primary' : 'bg-light-200 border-primary'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarBlank size={20} className="text-primary" />
                <span className={dataValidade ? (theme === 'dark' ? 'text-white' : 'text-dark-900') : (theme === 'dark' ? 'text-dark-400' : 'text-dark-500')}>
                  {dataValidade ? formatDate(dataValidade) : 'Selecione a conservação'}
                </span>
              </div>
              {dataValidade && <CheckCircle size={20} className="text-primary" />}
            </div>
          </div>
        </div>
      );
    }

    if (fieldType === 'conservacao') {
      const opcoes = getOpcoesConservacao();
      return (
        <div key={variable} className="mb-4">
          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
            Tipo de Conservação
          </label>
          <div className="grid grid-cols-3 gap-2">
            {opcoes.map((opcao) => {
              const Icon = opcao.icon;
              const isSelected = conservacaoSelecionada === opcao.nome;
              return (
                <button
                  key={opcao.nome}
                  type="button"
                  onClick={() => opcao.disponivel && handleConservacaoChange(opcao.nome)}
                  disabled={!opcao.disponivel}
                  className={`p-3 rounded-lg border transition-all flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-primary/20 border-primary border-2'
                      : opcao.disponivel
                        ? theme === 'dark'
                          ? 'bg-dark-700 border-dark-600 hover:border-dark-500'
                          : 'bg-white border-light-300 hover:border-light-400'
                        : theme === 'dark'
                          ? 'bg-dark-800 border-dark-700 cursor-not-allowed'
                          : 'bg-light-100 border-light-200 cursor-not-allowed'
                  }`}
                >
                  <Icon
                    size={24}
                    className={
                      isSelected
                        ? 'text-primary'
                        : opcao.disponivel
                          ? theme === 'dark' ? 'text-dark-300' : 'text-dark-600'
                          : theme === 'dark' ? 'text-dark-500' : 'text-dark-400'
                    }
                  />
                  <span
                    className={`text-xs mt-1 font-medium ${
                      isSelected
                        ? 'text-primary'
                        : opcao.disponivel
                          ? theme === 'dark' ? 'text-dark-300' : 'text-dark-600'
                          : theme === 'dark' ? 'text-dark-500' : 'text-dark-400'
                    }`}
                  >
                    {opcao.nome}
                  </span>
                  <span
                    className={`text-xs ${
                      isSelected
                        ? 'text-primary'
                        : opcao.disponivel
                          ? theme === 'dark' ? 'text-dark-400' : 'text-dark-500'
                          : theme === 'dark' ? 'text-dark-600' : 'text-dark-400'
                    }`}
                  >
                    {opcao.disponivel ? `${opcao.dias} dias` : 'N/D'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderDynamicField = (variable: string) => {
    if (isHiddenField(variable)) return null;
    if (isSpecialField(variable)) return renderSpecialField(variable);

    const Icon = getIconForVariable(variable);
    const label = formatLabel(variable);

    return (
      <div key={variable} className="mb-4">
        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
          {label}
        </label>
        <div className="relative">
          <div className={`absolute left-4 top-1/2 transform -translate-y-1/2`}>
            <Icon size={20} className="text-primary" />
          </div>
          <input
            type="text"
            value={fieldValues[variable] || ''}
            onChange={(e) => handleFieldChange(variable, e.target.value)}
            placeholder={`Digite ${label}`}
            className={`${inputClasses} pl-12`}
          />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className={`text-lg ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
            Carregando template...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'} flex items-center justify-center`}>
        <div className="text-center px-6">
          <Warning size={64} className="mx-auto text-red-500 mb-4" />
          <p className="text-lg text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 border-b ${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'}`}>
        <div className="px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(-1)}
                className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-dark-700 text-dark-400 hover:text-white' : 'hover:bg-light-100 text-dark-600 hover:text-dark-900'}`}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  {product?.name || 'Etiqueta Personalizada'}
                </h1>
                <p className="text-primary text-xs">
                  {template?.name || 'Carregando...'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-dark-700 text-primary' : 'hover:bg-light-100 text-primary'}`}
            >
              <House size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className={`px-5 py-2 border-b ${theme === 'dark' ? 'border-dark-700' : 'border-light-200'}`}>
        <div className="flex items-center text-sm">
          <span className="text-primary">Categorias</span>
          <span className={`mx-2 ${theme === 'dark' ? 'text-dark-500' : 'text-dark-400'}`}>&gt;</span>
          <span className="text-primary">Configurar</span>
        </div>
        {product && (
          <div className="flex items-center gap-2 mt-1">
            <Package size={16} className="text-primary" />
            <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              {product.name}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <main className="px-5 py-4 pb-32">
        {template && (
          <>
            {/* Info do template */}
            <div className={`p-4 mb-6 rounded-xl border ${theme === 'dark' ? 'bg-dark-700 border-primary/30' : 'bg-white border-primary/20'}`}>
              <div className="flex items-center gap-3">
                <Layout size={24} className="text-primary" />
                <div>
                  <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    {template.name}
                  </h3>
                  {template.description && (
                    <p className={`text-xs ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                      {template.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Preview simulado em tempo real */}
            <div className="flex justify-center mb-6">
              <SimulatedLabelPreview
                widthMm={template.width || 60}
                heightMm={template.height || 40}
                variables={fieldValues}
                layout="generic"
              />
            </div>

            {variables.length === 0 ? (
              <div className="text-center py-12">
                <Layout size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-dark-600' : 'text-dark-400'}`} />
                <p className={`text-lg ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  Este template não possui campos personalizáveis.
                </p>
              </div>
            ) : (
              <div>
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Preencha os campos
                </h3>
                {variables.map((variable) => renderDynamicField(variable))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom Bar */}
      {template && (
        <div className={`fixed bottom-0 left-0 right-0 p-4 border-t ${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'}`}>
          <div className="flex items-center gap-3">
            {/* Seletor de quantidade */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${theme === 'dark' ? 'bg-dark-700 border border-dark-600' : 'bg-light-100 border border-light-300'}`}>
              <button
                onClick={decrementarQuantidade}
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-dark-600 hover:bg-dark-500' : 'bg-light-200 hover:bg-light-300'}`}
              >
                <Minus size={16} className={theme === 'dark' ? 'text-white' : 'text-dark-900'} />
              </button>
              <span className={`w-8 text-center font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                {quantidade}
              </span>
              <button
                onClick={incrementarQuantidade}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary hover:bg-primary/90"
              >
                <Plus size={16} className="text-white" />
              </button>
            </div>

            {/* Botão Ver Prévia */}
            <button
              onClick={handleVerPrevia}
              className={`py-3 px-4 rounded-xl border-2 border-primary font-medium transition-colors ${
                theme === 'dark'
                  ? 'text-primary hover:bg-dark-700'
                  : 'text-primary hover:bg-primary/10'
              }`}
            >
              <Eye size={20} />
            </button>

            {/* Botão Imprimir */}
            <button
              onClick={handleImprimir}
              disabled={isPrinting}
              className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPrinting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Imprimindo...</span>
                </>
              ) : (
                <>
                  <Printer size={20} />
                  <span>Imprimir</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && (
        <LabelPreview
          imageBase64={preview.imageBase64}
          isLoading={preview.isLoading}
          error={preview.error}
          isDirty={preview.isDirty}
          onGenerate={handleVerPrevia}
          onClose={() => setShowPreviewModal(false)}
          dimensions={{ width: template?.width || 60, height: template?.height || 40 }}
        />
      )}
    </div>
  );
}
