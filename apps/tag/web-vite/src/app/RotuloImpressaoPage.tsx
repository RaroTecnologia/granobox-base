import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import {
  Printer,
  ArrowLeft,
  Tag,
  Package,
  Queue,
  CaretRight,
  Link as LinkIcon,
  Asterisk,
  Textbox,
  XCircle,
  Check,
  Eye,
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import DynamicFormField from '@/components/DynamicFormField';
import { labelTemplatesService, type LabelTemplate, type RenderableSchema } from '@/services/labelTemplatesService';
import { tagmentPrintService } from '@/services/tagmentPrintService';
import type { Product } from '@/services/productsService';
import { usePreview } from '@/hooks/usePreview';
import LabelPreview from '@/components/LabelPreview';
import SimulatedLabelPreview from '@/components/SimulatedLabelPreview';

type Step = 'rotulos' | 'produtos' | 'formulario';

interface FilaItem {
  id: string;
  rotulo: LabelTemplate;
  produto?: Product;
  dados: Record<string, any>;
  timestamp: Date;
}

export default function RotuloImpressaoPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const clientId = user?.clientId || (user?.role === 'manager' ? '6621e831-5d1d-4801-8c33-b0f93446a3df' : undefined);
  const { products, getProductById } = useProducts(clientId);
  
  // Estados da navegação
  const [currentStep, setCurrentStep] = useState<Step>('rotulos');
  const [rotuloSelecionado, setRotuloSelecionado] = useState<LabelTemplate | null>(null);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Product | null>(null);
  
  // Estados do schema e formulário
  const [schemaAtual, setSchemaAtual] = useState<RenderableSchema | null>(null);
  const [valoresFormulario, setValoresFormulario] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingSchema, setLoadingSchema] = useState(false);
  
  // Estados dos templates
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  
  // Fila de impressão
  const [filaImpressao, setFilaImpressao] = useState<FilaItem[]>([]);
  const [showFilaModal, setShowFilaModal] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [autoLoaded, setAutoLoaded] = useState(false);

  // Preview
  const preview = usePreview();
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Carregar templates
  useEffect(() => {
    if (clientId) {
      carregarRotulos();
    }
  }, [clientId]);

  // Verificar se veio com produto e template na URL (etiqueta personalizada)
  useEffect(() => {
    const productId = searchParams.get('productId');
    const templateId = searchParams.get('templateId');
    
    if (productId && templateId && clientId && !loadingTemplates && !autoLoaded && products.length > 0 && templates.length > 0) {
      const produto = getProductById(productId);
      if (produto) {
        // Buscar o template pelo tagmentTemplateId
        const rotulo = templates.find(r => r.tagmentTemplateId === templateId);
        if (rotulo) {
          setAutoLoaded(true);
          setRotuloSelecionado(rotulo);
          // Carregar schema automaticamente
          selecionarProduto(produto, rotulo);
        } else {
          console.error('Template não encontrado:', templateId);
          toast.error('Template não encontrado');
        }
      }
    }
  }, [searchParams, clientId, products, templates, loadingTemplates, autoLoaded, getProductById]);

  // Carregar fila do localStorage
  useEffect(() => {
    const fila = JSON.parse(localStorage.getItem('filaRotuloImpressao') || '[]');
    setFilaImpressao(fila.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    })));
  }, []);

  const carregarRotulos = async () => {
    if (!clientId) return;
    
    setLoadingTemplates(true);
    try {
      const rotulos = await labelTemplatesService.listTemplates(clientId);
      setTemplates(rotulos);
    } catch (error: any) {
      console.error('Erro ao carregar rótulos:', error);
      toast.error('Erro ao carregar rótulos');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const selecionarRotulo = (rotulo: LabelTemplate) => {
    setRotuloSelecionado(rotulo);
    setCurrentStep('produtos');
  };

  const selecionarProduto = async (produto: Product | null, rotulo?: LabelTemplate | null) => {
    const rotuloParaUsar = rotulo || rotuloSelecionado;
    setProdutoSelecionado(produto);
    
    if (!rotuloParaUsar || !clientId) return;
    
    setLoadingSchema(true);
    try {
      const schema = await labelTemplatesService.getRenderableSchema(
        rotuloParaUsar.id,
        clientId,
        produto?.id
      );
      
      setSchemaAtual(schema);
      setValoresFormulario(schema.autoFilledValues || {});
      setCurrentStep('formulario');
    } catch (error: any) {
      console.error('Erro ao carregar schema:', error);
      toast.error('Erro ao carregar formulário');
    } finally {
      setLoadingSchema(false);
    }
  };

  const pularSelecaoProduto = () => {
    selecionarProduto(null, rotuloSelecionado);
  };

  const voltarPasso = () => {
    if (currentStep === 'formulario') {
      setCurrentStep('produtos');
      setProdutoSelecionado(null);
      setSchemaAtual(null);
      setValoresFormulario({});
      setErrors({});
    } else if (currentStep === 'produtos') {
      setCurrentStep('rotulos');
      setRotuloSelecionado(null);
    }
  };

  const atualizarCampo = (fieldName: string, value: any) => {
    setValoresFormulario((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    
    // Limpar erro do campo
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validarFormulario = (): boolean => {
    if (!schemaAtual) return false;
    
    const newErrors: Record<string, string> = {};
    
    schemaAtual.schema.requiredFields.forEach((field) => {
      const value = valoresFormulario[field.name];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        newErrors[field.name] = `${field.label} é obrigatório`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const adicionarAFila = () => {
    if (!validarFormulario() || !rotuloSelecionado) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const item: FilaItem = {
      id: Date.now().toString(),
      rotulo: rotuloSelecionado,
      produto: produtoSelecionado || undefined,
      dados: { ...valoresFormulario },
      timestamp: new Date(),
    };

    const novaFila = [...filaImpressao, item];
    setFilaImpressao(novaFila);
    localStorage.setItem('filaRotuloImpressao', JSON.stringify(novaFila));

    toast.success(`Adicionado à fila de impressão (${novaFila.length})`, {
      action: {
        label: 'Ver Fila',
        onClick: () => setShowFilaModal(true),
      },
    });

    // Limpar e voltar
    setCurrentStep('rotulos');
    setRotuloSelecionado(null);
    setProdutoSelecionado(null);
    setSchemaAtual(null);
    setValoresFormulario({});
    setErrors({});
  };

  const handleVerPrevia = () => {
    if (!rotuloSelecionado?.tagmentTemplateId) {
      toast.error('Nenhum template selecionado');
      return;
    }
    setShowPreviewModal(true);
    preview.generate(
      rotuloSelecionado.tagmentTemplateId,
      { ...valoresFormulario },
      { width: 60, height: 40 },
    );
  };

  const imprimirAgora = async () => {
    if (!validarFormulario() || !rotuloSelecionado || !clientId) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsPrinting(true);
    try {
      await imprimirItem({
        rotulo: rotuloSelecionado,
        produto: produtoSelecionado || undefined,
        dados: { ...valoresFormulario },
      });

      // Limpar e voltar
      setCurrentStep('rotulos');
      setRotuloSelecionado(null);
      setProdutoSelecionado(null);
      setSchemaAtual(null);
      setValoresFormulario({});
      setErrors({});
    } catch (error: any) {
      console.error('Erro ao imprimir:', error);
      toast.error('Erro ao imprimir rótulo');
    } finally {
      setIsPrinting(false);
    }
  };

  const imprimirItem = async (item: { rotulo: LabelTemplate; produto?: Product; dados: Record<string, any> }) => {
    if (!clientId) return;

    try {
      // Buscar impressora de rótulo
      const printerId = await tagmentPrintService.getConfiguredPrinter(clientId, 'label');
      
      if (!printerId) {
        throw new Error('Nenhuma impressora de rótulo disponível');
      }

      const result = await tagmentPrintService.printLabel(clientId, {
        templateId: item.rotulo.tagmentTemplateId,
        data: item.dados,
        printerId: printerId,
      });

      if (result.success) {
        toast.success('Rótulo impresso com sucesso!');
      } else {
        throw new Error(result.message || 'Erro ao imprimir');
      }
    } catch (error: any) {
      console.error('Erro ao imprimir item:', error);
      throw error;
    }
  };

  const processarFila = async () => {
    if (filaImpressao.length === 0) {
      toast.error('Fila vazia');
      return;
    }

    setIsPrinting(true);
    setShowFilaModal(false);

    try {
      for (let i = 0; i < filaImpressao.length; i++) {
        const item = filaImpressao[i];
        await imprimirItem({
          rotulo: item.rotulo,
          produto: item.produto,
          dados: item.dados,
        });

        // Pequeno delay entre impressões
        if (i < filaImpressao.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      // Limpar fila
      setFilaImpressao([]);
      localStorage.setItem('filaRotuloImpressao', JSON.stringify([]));
      toast.success('Fila processada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao processar fila:', error);
      toast.error('Erro ao processar fila de impressão');
    } finally {
      setIsPrinting(false);
    }
  };

  const getSubtitulo = (): string => {
    switch (currentStep) {
      case 'rotulos':
        return 'Selecione o tipo de rótulo';
      case 'produtos':
        return 'Vincular a um produto (opcional)';
      case 'formulario':
        return 'Preencha os campos';
      default:
        return '';
    }
  };

  const produtosFinalizados = products.filter((p) => p.type === 'finished');

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'}`}>
      {/* Header */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-sm border-b ${
          theme === 'dark'
            ? 'bg-dark-800/95 border-dark-700'
            : 'bg-white/95 border-light-200'
        }`}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={currentStep === 'rotulos' ? () => navigate(-1) : voltarPasso}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'hover:bg-dark-700 text-dark-400 hover:text-white'
                    : 'hover:bg-light-100 text-dark-600 hover:text-dark-900'
                }`}
              >
                <ArrowLeft size={20} />
              </button>

              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Tag size={24} weight="duotone" className="text-white" />
              </div>

              <div>
                <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  Imprimir Rótulo
                </h1>
                <p className="text-primary text-sm">{getSubtitulo()}</p>
              </div>
            </div>

            {/* Botão de fila */}
            {filaImpressao.length > 0 && (
              <button
                onClick={() => setShowFilaModal(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Printer size={18} />
                <div className="bg-white text-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {filaImpressao.length}
                </div>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-6 py-6 pb-32">
        {currentStep === 'rotulos' && (
          <div>
            {loadingTemplates ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <Tag size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-dark-600' : 'text-gray-300'}`} />
                <p className={`text-lg ${theme === 'dark' ? 'text-dark-400' : 'text-gray-600'}`}>
                  Nenhum rótulo cadastrado
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-dark-500' : 'text-gray-500'} mt-2`}>
                  Cadastre rótulos nas configurações
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map((rotulo) => (
                  <div
                    key={rotulo.id}
                    onClick={() => selecionarRotulo(rotulo)}
                    className={`p-5 rounded-xl border cursor-pointer transition-all ${
                      theme === 'dark'
                        ? 'bg-dark-800 border-dark-700 hover:bg-dark-700'
                        : 'bg-white border-light-200 hover:bg-light-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                          <Tag size={24} weight="duotone" className="text-primary" />
                        </div>
                        <div>
                          <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                            {rotulo.name}
                          </h3>
                          {rotulo.description && (
                            <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-gray-500'} mt-1`}>
                              {rotulo.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <CaretRight size={20} className="text-primary" />
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                      <div
                        className={`px-3 py-1 rounded-lg text-xs ${
                          theme === 'dark' ? 'bg-dark-700 text-dark-300' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Textbox size={14} className="inline mr-1" />
                        {rotulo.fieldsSchema.fields.length} campos
                      </div>
                      <div
                        className={`px-3 py-1 rounded-lg text-xs ${
                          theme === 'dark' ? 'bg-dark-700 text-dark-300' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Asterisk size={14} className="inline mr-1" />
                        {rotulo.fieldsSchema.requiredFields.length} obrigatórios
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === 'produtos' && (
          <div>
            <div className="mb-6">
              <div
                className={`p-4 rounded-xl border ${
                  theme === 'dark'
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-primary/5 border-primary/20'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Package size={20} weight="duotone" className="text-primary" />
                  <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    Você pode pular esta etapa e preencher manualmente
                  </p>
                </div>
              </div>
              <button
                onClick={pularSelecaoProduto}
                className={`mt-4 w-full py-3 rounded-xl border transition-colors ${
                  theme === 'dark'
                    ? 'bg-dark-700 border-dark-600 hover:bg-dark-600'
                    : 'bg-white border-light-300 hover:bg-light-50'
                }`}
              >
                Preencher manualmente
              </button>
            </div>

            <div className="space-y-3">
              {produtosFinalizados.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-dark-600' : 'text-gray-300'}`} />
                  <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-gray-500'}`}>
                    Nenhum produto finalizado encontrado
                  </p>
                </div>
              ) : (
                produtosFinalizados.map((produto) => (
                  <div
                    key={produto.id}
                    onClick={() => selecionarProduto(produto)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      theme === 'dark'
                        ? 'bg-dark-800 border-dark-700 hover:bg-dark-700'
                        : 'bg-white border-light-200 hover:bg-light-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                          {produto.name}
                        </h3>
                        {produto.code && (
                          <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-gray-500'} mt-1`}>
                            Código: {produto.code}
                          </p>
                        )}
                      </div>
                      <CaretRight size={20} className="text-primary" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {currentStep === 'formulario' && (
          <div>
            {loadingSchema ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : schemaAtual ? (
              <div className="space-y-6">
                {/* Preview simulado em tempo real */}
                <div className="flex justify-center">
                  <SimulatedLabelPreview
                    widthMm={60}
                    heightMm={40}
                    variables={valoresFormulario}
                    layout="generic"
                  />
                </div>

                {/* Info do produto vinculado */}
                {produtoSelecionado && (
                  <div
                    className={`p-3 rounded-xl border ${
                      theme === 'dark'
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-primary/5 border-primary/20'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <LinkIcon size={18} weight="duotone" className="text-primary" />
                      <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                        Vinculado a: {produtoSelecionado.name}
                      </p>
                    </div>
                  </div>
                )}

                {/* Campos obrigatórios */}
                {schemaAtual.schema.requiredFields.length > 0 && (
                  <div>
                    <h3
                      className={`text-xs font-bold uppercase tracking-wider mb-3 ${
                        theme === 'dark' ? 'text-dark-400' : 'text-gray-500'
                      }`}
                    >
                      CAMPOS OBRIGATÓRIOS
                    </h3>
                    {schemaAtual.schema.requiredFields.map((field) => (
                      <DynamicFormField
                        key={field.name}
                        field={field}
                        value={valoresFormulario[field.name]}
                        onChange={(value) => atualizarCampo(field.name, value)}
                        error={errors[field.name]}
                      />
                    ))}
                  </div>
                )}

                {/* Campos opcionais */}
                {schemaAtual.schema.optionalFields.length > 0 && (
                  <div>
                    <h3
                      className={`text-xs font-bold uppercase tracking-wider mb-3 ${
                        theme === 'dark' ? 'text-dark-400' : 'text-gray-500'
                      }`}
                    >
                      CAMPOS OPCIONAIS
                    </h3>
                    {schemaAtual.schema.optionalFields.map((field) => (
                      <DynamicFormField
                        key={field.name}
                        field={field}
                        value={valoresFormulario[field.name]}
                        onChange={(value) => atualizarCampo(field.name, value)}
                        error={errors[field.name]}
                      />
                    ))}
                  </div>
                )}

                {/* Botões fixos */}
                <div
                  className={`fixed bottom-0 left-0 right-0 p-5 border-t ${
                    theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
                  }`}
                >
                  <div className="flex space-x-3">
                    <button
                      onClick={handleVerPrevia}
                      className={`py-3 px-4 rounded-xl border-2 border-primary font-medium transition-colors ${
                        theme === 'dark'
                          ? 'text-primary hover:bg-dark-700'
                          : 'text-primary hover:bg-primary/10'
                      }`}
                    >
                      <Eye size={18} className="inline mr-1" />
                      {preview.isDirty ? '!' : ''}
                    </button>
                    <button
                      onClick={adicionarAFila}
                      className={`flex-1 py-3 rounded-xl border font-medium transition-colors ${
                        theme === 'dark'
                          ? 'bg-dark-700 border-primary text-primary hover:bg-dark-600'
                          : 'bg-white border-primary text-primary hover:bg-light-50'
                      }`}
                    >
                      <Queue size={18} className="inline mr-2" />
                      Fila
                    </button>
                    <button
                      onClick={imprimirAgora}
                      disabled={isPrinting}
                      className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isPrinting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                          Imprimindo...
                        </>
                      ) : (
                        <>
                          <Printer size={18} className="inline mr-2" />
                          Imprimir
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className={theme === 'dark' ? 'text-dark-400' : 'text-gray-500'}>
                  Erro ao carregar formulário
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal da Fila */}
      {showFilaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div
            className={`w-full max-h-[80vh] rounded-t-2xl border-t ${
              theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
            }`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Printer size={24} weight="duotone" className="text-primary" />
                  <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                    Fila de Impressão ({filaImpressao.length})
                  </h3>
                </div>
                <button
                  onClick={() => setShowFilaModal(false)}
                  className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'}`}
                >
                  <XCircle size={24} weight="duotone" />
                </button>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto mb-6">
                {filaImpressao.length === 0 ? (
                  <div className="text-center py-12">
                    <p className={theme === 'dark' ? 'text-dark-400' : 'text-gray-500'}>Fila vazia</p>
                  </div>
                ) : (
                  filaImpressao.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border ${
                        theme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-light-50 border-light-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                            {item.rotulo.name}
                          </p>
                          {item.produto && (
                            <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-gray-500'} mt-1`}>
                              {item.produto.name}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const novaFila = filaImpressao.filter((i) => i.id !== item.id);
                            setFilaImpressao(novaFila);
                            localStorage.setItem('filaRotuloImpressao', JSON.stringify(novaFila));
                          }}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                        >
                          <XCircle size={20} weight="duotone" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {filaImpressao.length > 0 && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setFilaImpressao([]);
                      localStorage.setItem('filaRotuloImpressao', JSON.stringify([]));
                      setShowFilaModal(false);
                    }}
                    className="flex-1 py-3 border border-red-500 text-red-500 rounded-xl font-medium hover:bg-red-500/10 transition-colors"
                  >
                    Limpar Fila
                  </button>
                  <button
                    onClick={processarFila}
                    disabled={isPrinting}
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isPrinting ? 'Processando...' : 'Imprimir Tudo'}
                  </button>
                </div>
              )}
            </div>
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
          dimensions={{ width: 60, height: 40 }}
        />
      )}
    </div>
  );
}
