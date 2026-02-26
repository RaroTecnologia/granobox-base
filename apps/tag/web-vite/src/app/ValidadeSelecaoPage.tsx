import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useOperationContext } from '@/contexts/OperationContext' // ⭐ NOVO
import { useCategories } from '@/hooks/useCategories'
import { useProducts } from '@/hooks/useProducts'
import { MagnifyingGlass, Clock, Plus, Minus, House, Thermometer, Snowflake, ArrowLeft, ArrowRight, Printer, User, CaretDown, MapPin, Calendar, Eye } from '@phosphor-icons/react'
import toast from 'react-hot-toast'
import FooterNavigation from '@/components/FooterNavigation'
import { PageLoading } from '@/components/LoadingSpinner'
import { labelsService } from '@/services/labelsService'
import { useOperators, Operator } from '@/hooks/useOperators'
import { storageLocationsService, StorageLocation } from '@/services/storageLocationsService'
import edgePrintingService, { EdgePrinter } from '@/services/edgePrintingService'
import { v2PrintService } from '@/services/v2PrintService'
import { api, getApiBaseUrl } from '@/services/api'
import { usePreview } from '@/hooks/usePreview'
import LabelPreview from '@/components/LabelPreview'
import SimulatedLabelPreview from '@/components/SimulatedLabelPreview'

// Função para normalizar data (igual ao edgePrintingService)
const normalizeDate = (date?: string): string | undefined => {
  if (!date) return undefined
  const trimmed = date.trim()
  if (!trimmed) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }
  // Se já está no formato brasileiro, converter para ISO
  if (/^\d{2}\/\d{2}\/\d{4}/.test(trimmed)) {
    const [day, month, year] = trimmed.split('/')
    return `${year}-${month}-${day}`
  }
  const value = new Date(trimmed)
  if (Number.isNaN(value.getTime())) {
    return undefined
  }
  return value.toISOString().split('T')[0]
}
import { useConfig } from '@/hooks/useConfig'

type Step = 'categorias' | 'subcategorias' | 'produtos' | 'configuracao'

export default function ValidadeSelecaoPage() {
  const { theme } = useTheme()
  const { user, isLoading: authLoading } = useAuth()
  const { selectedOperation } = useOperationContext() // ⭐ NOVO
  const navigate = useNavigate()
  
  // Estados da navegação
  const [currentStep, setCurrentStep] = useState<Step>('categorias')
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<any>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Estados da configuração
  const [conservacao, setConservacao] = useState<'ambiente' | 'refrigerado' | 'congelado' | 'validade_original' | 'indeterminada' | null>(null)
  const [quantidade, setQuantidade] = useState(1)
  const [showTimeInDates, setShowTimeInDates] = useState(true)
  const [peso, setPeso] = useState('')
  const [unidade, setUnidade] = useState('KG')
  const [dataManipulacao, setDataManipulacao] = useState(new Date().toISOString().split('T')[0])
  const [dataValidade, setDataValidade] = useState('')
  const [loteFabricacao, setLoteFabricacao] = useState('') // ✅ NOVO: Lote de fabricação para validade original
  const [dataValidadeOriginal, setDataValidadeOriginal] = useState('') // ✅ NOVO: Data de validade original do lote
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
  const [showOperatorModal, setShowOperatorModal] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([])
  const [printersLoading, setPrintersLoading] = useState(false)
  const [availablePrinters, setAvailablePrinters] = useState<EdgePrinter[]>([])
  const edgeFingerprint = selectedOperation?.agentFingerprint?.trim() || null

  // Preview
  const preview = usePreview()
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  // Mark preview dirty when form data changes
  useEffect(() => {
    preview.markDirty()
  }, [selectedProduct?.id, conservacao, selectedOperator?.id, selectedLocation?.id, dataManipulacao, dataValidade, peso, unidade, loteFabricacao, dataValidadeOriginal])

  // Simulated preview variables
  const previewVariables = useMemo(() => {
    const vars: Record<string, string> = {}
    if (selectedProduct?.name) vars.nome_produto = selectedProduct.name
    if (selectedProduct?.brand) vars.marca = selectedProduct.brand
    if (selectedProduct?.sif) vars.sif = selectedProduct.sif
    if (conservacao) vars.conservacao = conservacao
    if (dataManipulacao) vars.data_manipulacao = dataManipulacao
    if (dataValidade) vars.data_validade = dataValidade
    if (peso) vars.peso = `${peso} ${unidade}`
    if (selectedLocation?.name) vars.local = selectedLocation.name
    if (selectedOperator?.name) vars.responsavel = selectedOperator.name
    if (loteFabricacao) vars.lote_fabricacao = loteFabricacao
    return vars
  }, [selectedProduct, conservacao, dataManipulacao, dataValidade, peso, unidade, selectedLocation, selectedOperator, loteFabricacao])

  // ⭐ IGUAL AO FLUTTER: Detectar Edge-Go baseado em edgeAgentFingerprint, connection.type, deviceId, etc.
  const edgeGoPrinter = availablePrinters.find((printer: any) => {
    console.log('[ValidadeSelecaoPage] Verificando impressora para Edge-Go:', {
      name: printer.name,
      edgeAgentFingerprint: printer.edgeAgentFingerprint,
      connection: printer.connection,
      deviceId: printer.deviceId,
      type: printer.type,
      interface: printer.interface,
      printMethod: printer.printMethod,
    })
    
    // Prioridade 1: edgeAgentFingerprint (igual Flutter linha 203-205)
    if (printer.edgeAgentFingerprint) {
      console.log('[ValidadeSelecaoPage] ✅ Edge-Go detectado por edgeAgentFingerprint')
      return true
    }
    
    // Prioridade 2: connection.type === 'edge-go' ou 'edge' (igual Flutter linha 232-235)
    if (printer.connection?.type) {
      const type = printer.connection.type.toLowerCase()
      if (type === 'edge-go' || type === 'edge') {
        console.log('[ValidadeSelecaoPage] ✅ Edge-Go detectado por connection.type:', type)
        return true
      }
    }
    
    // Prioridade 3: deviceId começa com 'edge-go' (igual Flutter linha 290)
    const device = printer.deviceId?.toLowerCase() || ''
    if (device.startsWith('edge-go') || device.startsWith('esp32')) {
      console.log('[ValidadeSelecaoPage] ✅ Edge-Go detectado por deviceId:', device)
      return true
    }
    
    // Prioridade 4: type === 'edge' (igual Flutter linha 289)
    if (printer.type?.toLowerCase() === 'edge') {
      console.log('[ValidadeSelecaoPage] ✅ Edge-Go detectado por type:', printer.type)
      return true
    }
    
    // Prioridade 5: interface ou printMethod === 'websocket' ou 'mqtt' (fallback)
    const iface = printer.interface?.toLowerCase()
    const method = printer.printMethod?.toLowerCase()
    if (iface === 'websocket' || method === 'websocket' || iface === 'mqtt' || method === 'mqtt') {
      console.log('[ValidadeSelecaoPage] ✅ Edge-Go detectado por interface/method:', iface, method)
      return true
    }
    
    console.log('[ValidadeSelecaoPage] ❌ Não é Edge-Go')
    return false
  })
  
  console.log('[ValidadeSelecaoPage] Edge-Go encontrado:', edgeGoPrinter ? 'SIM' : 'NÃO', edgeGoPrinter)
  
  // Depois, buscar impressora Edge-Pro (WebSocket)
  const edgeProPrinter = availablePrinters.find((printer) => {
    const iface = printer.interface?.toLowerCase()
    const method = printer.printMethod?.toLowerCase()
    const device = printer.deviceId?.toLowerCase()
    return (
      iface === 'websocket' ||
      method === 'websocket' ||
      device?.startsWith('edge-pro')
    )
  })
  
  // Detectar tipo baseado nas impressoras encontradas ou no edgeFingerprint
  let edgeType: 'edge-go' | 'edge-pro' | null = null
  let edgePrinter: EdgePrinter | undefined = undefined
  
  console.log('[ValidadeSelecaoPage] Detecção de Edge:', {
    edgeGoPrinter: edgeGoPrinter ? 'encontrado' : 'não encontrado',
    edgeProPrinter: edgeProPrinter ? 'encontrado' : 'não encontrado',
    edgeFingerprint,
    availablePrintersCount: availablePrinters.length,
  })
  
  if (edgeGoPrinter) {
    edgeType = 'edge-go'
    edgePrinter = edgeGoPrinter
    console.log('[ValidadeSelecaoPage] ✅ Edge-Go selecionado:', edgeGoPrinter.name)
  } else if (edgeProPrinter) {
    edgeType = 'edge-pro'
    edgePrinter = edgeProPrinter
    console.log('[ValidadeSelecaoPage] ✅ Edge-Pro selecionado:', edgeProPrinter.name)
  } else if (edgeFingerprint) {
    // Fallback: tentar detectar pelo edgeFingerprint
    edgeType = edgePrintingService.detectEdgeType(edgeFingerprint)
    edgePrinter = availablePrinters[0] // Último recurso
    console.log('[ValidadeSelecaoPage] ⚠️ Usando fallback - edgeType:', edgeType, 'edgePrinter:', edgePrinter?.name)
  } else {
    console.log('[ValidadeSelecaoPage] ❌ Nenhum Edge detectado')
  }

  const unidades = ['KG', 'G', 'L', 'ML', 'UN']

  // Hooks para dados (só carregam após auth estar pronta, evitando 401 e categorias vazias)
  const clientId = user?.clientId || (user?.role === 'manager' ? '6621e831-5d1d-4801-8c33-b0f93446a3df' : undefined)
  const dataEnabled = !authLoading
  const { categories, rootCategories, loading: categoriesLoading } = useCategories(dataEnabled)
  const { products, loading: productsLoading } = useProducts({ clientId: clientId ?? undefined }, dataEnabled)
  const { operators } = useOperators(clientId)

  // Mostrar loading até auth estar pronta e categorias/produtos carregados
  const [initializing, setInitializing] = useState(true)
  useEffect(() => {
    if (!authLoading && !categoriesLoading && !productsLoading) {
      setInitializing(false)
    }
  }, [authLoading, categoriesLoading, productsLoading])

  // Debug dos produtos
  useEffect(() => {
    console.log('Produtos carregados:', products);
    console.log('ClientId:', clientId);
  }, [products, clientId]);

  // Carregar responsável salvo do localStorage
  useEffect(() => {
    const savedOperatorId = localStorage.getItem('selectedOperatorId');
    if (savedOperatorId && operators.length > 0) {
      const savedOperator = operators.find(op => op.id === savedOperatorId && op.isActive);
      if (savedOperator) {
        setSelectedOperator(savedOperator);
      }
    }
  }, [operators]);

  // Carregar configuração de data
  useEffect(() => {
    const loadDateConfig = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          console.log('Token não encontrado, usando configuração padrão');
          setShowTimeInDates(true);
          return;
        }
        
        const response = await fetch(`${getApiBaseUrl()}/config/date`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const config = await response.json();
          setShowTimeInDates(config.showTimeInDates ?? true);
          console.log('✅ Configuração de data carregada:', config);
        } else {
          console.log('Usando configuração padrão de data (com hora)');
          setShowTimeInDates(true);
        }
      } catch (error) {
        console.log('Erro ao carregar config de data, usando padrão:', error);
        setShowTimeInDates(true);
      }
    };
    
    loadDateConfig();
  }, []);

  // Salvar responsável no localStorage quando selecionado
  useEffect(() => {
    if (selectedOperator) {
      localStorage.setItem('selectedOperatorId', selectedOperator.id);
    }
  }, [selectedOperator]);

  // Carregar locais de armazenamento
  useEffect(() => {
    const loadStorageLocations = async () => {
      if (clientId) {
        try {
          const locations = await storageLocationsService.getAll();
          setStorageLocations(locations.filter(loc => loc.ativo));
        } catch (error) {
          console.error('Erro ao carregar locais:', error);
        }
      }
    };
    loadStorageLocations();
  }, [clientId]);

  useEffect(() => {
    console.log('[ValidadeSelecaoPage] 🔄 useEffect executado - verificando condições...')
    console.log('   - user?.clientId:', user?.clientId)
    console.log('   - selectedOperation?.id:', selectedOperation?.id)
    
    const loadPrinters = async () => {
      // ⭐ IGUAL AO FLUTTER: operationId é opcional, só precisa de clientId
      if (!user?.clientId) {
        console.log('[ValidadeSelecaoPage] ⚠️ ClientId não encontrado, não carregando impressoras')
        setAvailablePrinters([])
        return
      }
      
      console.log('[ValidadeSelecaoPage] 🔄 Carregando impressoras...')
      console.log('   - ClientId:', user.clientId)
      console.log('   - OperationId:', selectedOperation?.id || 'não selecionado (opcional)')
      
      setPrintersLoading(true)
      try {
        const printers = await edgePrintingService.getPrinters({
          clientId: user.clientId,
          operationId: selectedOperation?.id, // ⭐ Opcional, igual ao Flutter
          usage: 'validity',
        })
        
        console.log('[ValidadeSelecaoPage] ✅ Impressoras recebidas da API:', printers.length, printers)
        printers.forEach((printer: any, index: number) => {
          console.log(`[ValidadeSelecaoPage] Impressora ${index + 1}:`, {
            id: printer.id,
            name: printer.name,
            deviceId: printer.deviceId,
            edgeAgentFingerprint: printer.edgeAgentFingerprint,
            type: printer.type,
            interface: printer.interface,
            printMethod: printer.printMethod,
            connection: printer.connection,
            isActive: printer.isActive,
            usage: printer.usage,
          })
        })
        
        const activePrinters = printers.filter((printer) => printer.isActive !== false)
        console.log('[ValidadeSelecaoPage] ✅ Impressoras ativas:', activePrinters.length)
        setAvailablePrinters(activePrinters)
      } catch (error) {
        console.error('[ValidadeSelecaoPage] ❌ Erro ao carregar impressoras:', error)
        setAvailablePrinters([])
      } finally {
        setPrintersLoading(false)
      }
    }

    loadPrinters()
  }, [user?.clientId, selectedOperation?.id])

  // Calcular subcategorias da categoria selecionada
  const subcategories = selectedCategory 
    ? categories.filter(cat => cat.parentId === selectedCategory.id)
    : []

  // Filtrar produtos da categoria/subcategoria selecionada
  const categoryProducts = selectedSubcategory 
    ? products.filter(product => 
        product.categoryId === selectedSubcategory.id && 
        (product.type === 'finished' || product.type === 'manipulated')
      ).filter(product => 
        searchTerm === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : selectedCategory && !categories.some(cat => cat.parentId === selectedCategory.id)
    ? products.filter(product => 
        product.categoryId === selectedCategory.id && 
        (product.type === 'finished' || product.type === 'manipulated')
      ).filter(product => 
        searchTerm === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : []

  // Mapa de filhos por categoria e contagem total de produtos (inclui descendentes)
  const { childrenByCategory, totalProductsByCategory } = useMemo(() => {
    const children = new Map<string, string[]>();
    categories.forEach(cat => {
      if (cat.parentId) {
        const list = children.get(cat.parentId) || []
        list.push(cat.id)
        children.set(cat.parentId, list)
      }
    })

    const directCount = new Map<string, number>()
    products.forEach(p => {
      const c = directCount.get(p.categoryId) || 0
      directCount.set(p.categoryId, c + 1)
    })

    const memo = new Map<string, number>()
    const dfs = (id: string): number => {
      if (memo.has(id)) return memo.get(id) as number
      let count = directCount.get(id) || 0
      const kids = children.get(id) || []
      for (const kid of kids) count += dfs(kid)
      memo.set(id, count)
      return count
    }

    const totals = new Map<string, number>()
    categories.forEach(cat => {
      totals.set(cat.id, dfs(cat.id))
    })

    return { childrenByCategory: children, totalProductsByCategory: totals }
  }, [categories, products])

  // Verificar se a conservação selecionada ainda é válida quando o produto mudar
  useEffect(() => {
    if (selectedProduct && conservacao) {
      let isCurrentConservacaoValid = true
      
      switch (conservacao) {
        case 'ambiente':
          isCurrentConservacaoValid = (selectedProduct.shelfLifeAmbient || 0) > 0
          break
        case 'refrigerado':
          isCurrentConservacaoValid = (selectedProduct.shelfLifeRefrigerated || 0) > 0
          break
        case 'congelado':
          isCurrentConservacaoValid = (selectedProduct.shelfLifeFrozen || 0) > 0
          break
        case 'validade_original':
          // ✅ CORRIGIDO: Validade original sempre é válida
          // Usuário pode usar data do produto OU informar manualmente
          isCurrentConservacaoValid = true
          break
      }
      
      // Se a conservação atual não é mais válida, limpar seleção
      if (!isCurrentConservacaoValid) {
        setConservacao(null)
        setDataValidade('')
      }
    }
  }, [selectedProduct, conservacao])

  // Calcular data de validade automaticamente baseada na data de manipulação e produto selecionado
  useEffect(() => {
    if (conservacao && selectedProduct) {
      if (conservacao === 'indeterminada') {
        setDataValidade('')
        return
      }
      if (conservacao === 'validade_original') {
        // ✅ Para validade original, copiar a data informada pelo usuário
        setDataValidade(dataValidadeOriginal || '')
      } else if (dataManipulacao) {
        const dataBase = new Date(dataManipulacao)
        let diasValidade = 0
        
        // Usar os dias de validade cadastrados no produto, ou valores padrão se não estiver definido
        switch (conservacao) {
          case 'ambiente':
            diasValidade = selectedProduct.shelfLifeAmbient || 7
            break
          case 'refrigerado':
            diasValidade = selectedProduct.shelfLifeRefrigerated || 30
            break
          case 'congelado':
            diasValidade = selectedProduct.shelfLifeFrozen || 90
            break
        }
        
        const dataFutura = new Date(dataBase.getTime() + (diasValidade * 24 * 60 * 60 * 1000))
        setDataValidade(dataFutura.toISOString().split('T')[0])
      }
    }
  }, [conservacao, dataManipulacao, selectedProduct, dataValidadeOriginal])

  const getConservacaoInfo = (tipo: 'ambiente' | 'refrigerado' | 'congelado' | 'validade_original' | 'indeterminada') => {
    let dias = '0 dias'
    
    if (tipo === 'indeterminada') {
      return { icon: Clock, label: 'Indeterminada', color: 'text-amber-500', dias: 'Sem data' }
    }
    if (selectedProduct) {
      switch (tipo) {
        case 'ambiente':
          dias = `${selectedProduct.shelfLifeAmbient || 7} dias`
          break
        case 'refrigerado':
          dias = `${selectedProduct.shelfLifeRefrigerated || 30} dias`
          break
        case 'congelado':
          dias = `${selectedProduct.shelfLifeFrozen || 90} dias`
          break
        case 'validade_original':
          dias = 'Data original'
          break
      }
    } else {
      const defaultDays = {
        ambiente: '7 dias',
        refrigerado: '30 dias',
        congelado: '90 dias',
        validade_original: 'Data original'
      }
      dias = defaultDays[tipo]
    }
    
    const info = {
      ambiente: { icon: House, label: 'Ambiente', color: 'text-green-500', dias },
      refrigerado: { icon: Thermometer, label: 'Refrigerado', color: 'text-blue-500', dias },
      congelado: { icon: Snowflake, label: 'Congelado', color: 'text-cyan-500', dias },
      validade_original: { icon: Calendar, label: 'Ven. Original', color: 'text-orange-500', dias },
      indeterminada: { icon: Clock, label: 'Indeterminada', color: 'text-amber-500', dias: 'Sem data' }
    }
    return info[tipo]
  }

  const handleBack = () => {
    if (currentStep === 'configuracao') {
      setCurrentStep('produtos')
      setSelectedProduct(null)
    } else if (currentStep === 'produtos') {
      setCurrentStep('subcategorias')
      setSelectedSubcategory(null)
    } else if (currentStep === 'subcategorias') {
      setCurrentStep('categorias')
      setSelectedCategory(null)
    } else {
      navigate('/etiquetas/nova')
    }
  }

  const handleSelectCategory = (category: any) => {
    setSelectedCategory(category)
    setSelectedSubcategory(null)
    setSelectedProduct(null)
    
    const hasSubcategories = categories.some(cat => cat.parentId === category.id)
    if (hasSubcategories) {
      setCurrentStep('subcategorias')
    } else {
      // Para categorias sem subcategorias, ir direto para produtos
      setCurrentStep('produtos')
    }
  }

  const handleSelectSubcategory = (subcategory: any) => {
    setSelectedSubcategory(subcategory)
    setSelectedProduct(null)
    setCurrentStep('produtos')
  }

  const handleSelectProduct = (product: any) => {
    console.log('Produto selecionado:', product);
    console.log('ID do produto:', product?.id);
    
    // 🏷️ Verificar se o produto é etiqueta personalizada (rótulo sem rastreabilidade)
    if (product.isLabelOnly === true) {
      // 🆕 HIERARQUIA: Produto > Categoria
      let templateId = product.customTemplateId;
      
      // Se o produto não tem template, buscar da categoria
      if (!templateId || templateId.trim() === '') {
        const categoria = categories.find((c: any) => c.id === product.categoryId);
        templateId = categoria?.defaultTemplateId;
        console.log('🏷️ Template não encontrado no produto, usando da categoria:', templateId);
      }
      
      if (templateId && templateId.trim() !== '') {
        console.log('🏷️ Produto é etiqueta personalizada:', templateId);
        // Navegar para a tela de etiqueta personalizada com o produto e template
        navigate(`/etiquetas/personalizada?productId=${product.id}&templateId=${templateId}`);
        return;
      } else {
        console.warn('⚠️ Produto é etiqueta personalizada mas não tem template configurado');
        toast.error('Este produto não tem template configurado. Configure no produto ou na categoria.');
        return;
      }
    }
    
    setSelectedProduct(product)
    setCurrentStep('configuracao')
    // Produto com validade indeterminada: não exibir tipo de conservação nem data de validade na tela
    if (product?.validityIndeterminate === true) {
      setConservacao('indeterminada')
      setDataValidade('')
    }
  }

  const handleAdicionarAFila = async () => {
    console.log('Validações:', {
      selectedProduct: !!selectedProduct,
      selectedProductId: selectedProduct?.id,
      conservacao: !!conservacao,
      selectedOperator: !!selectedOperator,
      userClientId: !!user?.clientId,
      dataValidade: !!dataValidade
    });

    if (!selectedProduct || !conservacao || !selectedOperator || !user?.clientId) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (!dataManipulacao) {
      toast.error('Selecione a data de manipulação')
      return
    }

    if (conservacao !== 'indeterminada' && !dataValidade) {
      toast.error('Selecione o tipo de conservação para calcular a data de validade')
      return
    }

    if (!selectedProduct.id) {
      toast.error('Produto selecionado não possui ID válido')
      return
    }

    console.log('Dados da etiqueta:', {
      type: 'validity',
      conservationType: conservacao,
      quantity: quantidade,
      weight: peso || undefined,
      unit: unidade || undefined,
      productionDate: dataManipulacao,
      validityDate: dataValidade,
      clientId: user.clientId,
      productId: selectedProduct.id,
      notes: undefined,
      metadata: {
        conservacao,
        dataProducao: new Date().toLocaleDateString('pt-BR'),
      }
    });

    console.log('selectedProduct:', selectedProduct);
    console.log('user:', user);

    try {
      await labelsService.createLabel({
        type: 'validity',
        conservationType: conservacao,
        quantity: quantidade,
        weight: peso || undefined,
        unit: unidade || undefined,
        productionDate: dataManipulacao,
        validityDate: dataValidade,
        clientId: user.clientId,
        productId: selectedProduct.id,
        storageLocationId: selectedLocation?.id,
        operationId: selectedOperation?.id, // ⭐ NOVO: Enviar operationId
        notes: undefined,
        operatorId: selectedOperator?.id,
        metadata: {
          conservacao,
          dataProducao: new Date().toLocaleDateString('pt-BR'),
        }
      })

      toast.success('Produto adicionado à fila de impressão!')
      
      // Reset form (mantém responsável selecionado)
      setConservacao(null)
      setQuantidade(1)
      setPeso('')
      setUnidade('KG')
      setDataManipulacao(new Date().toISOString().split('T')[0])
      setDataValidade('')
      setSelectedLocation(null)
      setSelectedProduct(null)
      setCurrentStep('produtos')
    } catch (error) {
      console.error('Erro ao adicionar etiqueta:', error);
      toast.error('Erro ao adicionar etiqueta à fila');
    }
  }

  const handleVerFila = () => {
    navigate('/etiquetas/validade/impressao')
  }

  const handleVerPrevia = async () => {
    if (!selectedProduct || !conservacao || !selectedOperator || !user?.clientId) {
      toast.error('Preencha todos os campos obrigatórios para ver a previa')
      return
    }
    if (!dataManipulacao || (conservacao !== 'indeterminada' && !dataValidade)) {
      toast.error('Configure a data de validade antes de ver a previa')
      return
    }

    const isIndeterminada = conservacao === 'indeterminada'
    const isValidadeOriginal = conservacao === 'validade_original'
    const formatarDataComHorario = (data: string) => {
      const [y, m, d] = data.split('-')
      const dataBR = `${d}/${m}/${y}`
      if (showTimeInDates) {
        const now = new Date()
        const hora = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
        return `${dataBR} ${hora}`
      }
      return dataBR
    }
    const formatarNomeResponsavel = (nome: string | undefined): string => {
      if (!nome) return ''
      const partes = nome.trim().split(' ')
      if (partes.length === 1) return partes[0]
      return `${partes[0]} ${partes[partes.length - 1][0]}`
    }
    const getLabelValidade = (ct: string) => {
      switch (ct) {
        case 'ambiente': return 'VALIDADE T. AMBIENTE'
        case 'refrigerado': return 'VALIDADE REFRIGERADO'
        case 'congelado': return 'VALIDADE CONGELADO'
        case 'indeterminada': return 'VALIDADE'
        default: return 'VALIDADE T. AMBIENTE'
      }
    }

    // Resolve templateId (same logic as handleImprimirAgora)
    let templateId = selectedProduct.customTemplateId || null
    if (!templateId) {
      try {
        const defaultTemplate = await api.get('/tagment/default-template', { params: { clientId: user.clientId, labelType: 'validity' } })
        if (defaultTemplate.data?.templateId) templateId = defaultTemplate.data.templateId
      } catch (_) {}
    }
    templateId = templateId || '1c12926f-849b-4bd7-8a61-05036f39f443'

    let logoUuid: string | undefined
    try {
      const res = await api.get(`/clients/${user.clientId}`)
      logoUuid = res.data?.tagmentLogoUuid
    } catch (_) {}

    const dataStr = formatarDataComHorario(dataManipulacao)
    const validadeStr = isIndeterminada ? 'INDETERMINADA' : formatarDataComHorario(dataValidade)

    const variables: Record<string, any> = {
      nome_produto: selectedProduct.name,
      produto: selectedProduct.name,
      marca: selectedProduct.brand || '',
      sif: selectedProduct.sif || '',
      emb_original: dataStr,
      manipulacao: dataStr,
      dataFabricacao: dataStr,
      validade: validadeStr,
      dataValidade: validadeStr,
      qtd_peso: peso ? `${peso} ${unidade}` : '',
      peso: peso ? `${peso} ${unidade}` : '',
      responsavel: formatarNomeResponsavel(selectedOperator?.name),
      operador: formatarNomeResponsavel(selectedOperator?.name),
      armazenamento: selectedLocation?.nome || '',
      label_validade: getLabelValidade(conservacao),
      lote_industria: isValidadeOriginal ? '' : (loteFabricacao || ''),
      lote: isValidadeOriginal ? '' : (loteFabricacao || ''),
      data_vencimento_industria: isValidadeOriginal ? '' : (dataValidadeOriginal || ''),
      ...(logoUuid && { logo: logoUuid }),
    }

    setShowPreviewModal(true)
    preview.generate(templateId, variables, { width: 60, height: 40 })
  }

  const handleImprimirAgora = async () => {
    console.log('Validações:', {
      selectedProduct: !!selectedProduct,
      selectedProductId: selectedProduct?.id,
      conservacao: !!conservacao,
      selectedOperator: !!selectedOperator,
      userClientId: !!user?.clientId,
      dataValidade: !!dataValidade
    });

    // ⭐ NOVO: Verificar se há impressoras configuradas (buscar novamente se necessário)
    let finalEdgeType = edgeType
    let finalEdgePrinter = edgePrinter
    
    if (!finalEdgePrinter && availablePrinters.length > 0) {
      // ⭐ IGUAL AO FLUTTER: Detectar Edge-Go usando mesma lógica
      const edgeGoPrinter = availablePrinters.find((printer: any) => {
        // Prioridade 1: edgeAgentFingerprint
        if (printer.edgeAgentFingerprint) {
          return true
        }
        
        // Prioridade 2: connection.type
        if (printer.connection?.type) {
          const type = printer.connection.type.toLowerCase()
          if (type === 'edge-go' || type === 'edge') {
            return true
          }
        }
        
        // Prioridade 3: deviceId
        const deviceId = printer.deviceId?.toLowerCase() || ''
        if (deviceId.startsWith('edge-go') || deviceId.startsWith('esp32')) {
          return true
        }
        
        // Prioridade 4: type
        if (printer.type?.toLowerCase() === 'edge') {
          return true
        }
        
        // Prioridade 5: interface/method
        if (printer.interface === 'mqtt' || printer.printMethod === 'mqtt') {
          return true
        }
        
        return false
      })
      
      if (edgeGoPrinter) {
        finalEdgeType = 'edge-go'
        finalEdgePrinter = edgeGoPrinter
      }
    }
    
    // ⭐ Removido: Validações de impressora (igual ao Flutter - erro vem do backend)

    if (!selectedProduct || !conservacao || !selectedOperator || !user?.clientId) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (!dataManipulacao) {
      toast.error('Selecione a data de manipulação')
      return
    }

    if (!dataValidade) {
      toast.error('Selecione o tipo de conservação para calcular a data de validade')
      return
    }

    if (!selectedProduct.id) {
      toast.error('Produto selecionado não possui ID válido')
      return
    }

    const getLabelValidade = (conservationType: string) => {
      switch (conservationType) {
        case 'ambiente': return 'VALIDADE T. AMBIENTE';
        case 'refrigerado': return 'VALIDADE REFRIGERADO';
        case 'congelado': return 'VALIDADE CONGELADO';
        case 'indeterminada': return 'VALIDADE';
        default: return 'VALIDADE T. AMBIENTE';
      }
    };
    const isIndeterminada = conservacao === 'indeterminada';
    const formatarDataComHorario = (data: string) => {
      const [y, m, d] = data.split('-');
      const dataBR = `${d}/${m}/${y}`;
      if (showTimeInDates) {
        const now = new Date();
        const hora = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        return `${dataBR} ${hora}`;
      }
      return dataBR;
    };
    const formatarNomeResponsavel = (nome: string | undefined): string => {
      if (!nome) return '';
      const partes = nome.trim().split(' ');
      if (partes.length === 1) return partes[0];
      return `${partes[0]} ${partes[partes.length - 1][0]}`;
    };
    const isValidadeOriginal = conservacao === 'validade_original';

    let logoUuid: string | undefined;
    try {
      const res = await api.get(`/clients/${user.clientId}`);
      logoUuid = res.data?.tagmentLogoUuid;
    } catch (_) {}

    try {
      // ⭐ Igual ao Flutter: com Edge usa só v2/print-label (API cria etiquetas e imprime). Sem Tagment.
      if (finalEdgeType && finalEdgePrinter) {
        const printerId = (finalEdgePrinter as any).edgeAgentFingerprint || finalEdgePrinter.deviceId || finalEdgePrinter.id;
        if (!printerId) throw new Error('Impressora não possui deviceId configurado');
        let templateId = selectedProduct.customTemplateId || null;
        if (!templateId) {
          try {
            const defaultTemplate = await api.get('/tagment/default-template', { params: { clientId: user.clientId, labelType: 'validity' } });
            if (defaultTemplate.data?.templateId) templateId = defaultTemplate.data.templateId;
          } catch (_) {}
        }
        templateId = templateId || '1c12926f-849b-4bd7-8a61-05036f39f443';
        // Offset aplicado na API (cadastro da impressora no DB) — não enviar offsets
        const dataStr = formatarDataComHorario(dataManipulacao);
        const validadeStr = isIndeterminada ? 'INDETERMINADA' : formatarDataComHorario(dataValidade);
        console.log('[v2] v2/print-label (Edge-Go e Edge-Pro - 100% Granobox, sem Tagment)');
        const result = await v2PrintService.printLabel({
          printerId,
          templateType: 'tag',
          templateId,
          copies: quantidade,
          variables: {
            nome_produto: selectedProduct.name,
            produto: selectedProduct.name,
            marca: selectedProduct.brand || '',
            sif: selectedProduct.sif || '',
            emb_original: dataStr,
            manipulacao: dataStr,
            dataFabricacao: dataStr,
            validade: validadeStr,
            dataValidade: validadeStr,
            qtd_peso: peso ? `${peso} ${unidade}` : '',
            peso: peso ? `${peso} ${unidade}` : '',
            responsavel: formatarNomeResponsavel(selectedOperator?.name),
            operador: formatarNomeResponsavel(selectedOperator?.name),
            armazenamento: selectedLocation?.nome || '',
            label_validade: getLabelValidade(conservacao),
            lote_industria: isValidadeOriginal ? '' : (loteFabricacao || ''),
            lote: isValidadeOriginal ? '' : (loteFabricacao || ''),
            data_vencimento_industria: isValidadeOriginal ? '' : (dataValidadeOriginal || ''),
            ...(logoUuid && { logo: logoUuid }),
          },
          dimensions: { width: 60, height: 40 },
          tagMetadata: {
            productId: selectedProduct.id,
            ...(isIndeterminada ? { validityIndeterminate: true } : { validityDate: normalizeDate(dataValidade) || dataValidade }),
            productionDate: normalizeDate(dataManipulacao) || dataManipulacao,
            conservationType: conservacao as any,
            ...(selectedLocation?.id && { storageLocationId: selectedLocation.id }),
            ...(selectedOperation?.id && { operationId: selectedOperation.id }),
            ...(loteFabricacao && { manufacturingBatch: loteFabricacao }),
            ...(dataValidadeOriginal && { expiryDate: dataValidadeOriginal }),
          },
        });
        if (result.success) {
          toast.success(result.message || `${quantidade} etiqueta(s) enviada(s) para impressão!`);
          if (result.labels?.length) await labelsService.markAsPrinted(result.labels.map((l: { id: string }) => l.id));
          if (result.supplyUsage?.alertLevel === 'warning') {
            toast(`⚠️ Ribbon baixo: ${result.supplyUsage.ribbonRemainingPercent.toFixed(0)}% restante`, { icon: '🎗️', duration: 5000 });
          } else if (result.supplyUsage?.alertLevel === 'critical') {
            toast.error(`🚨 Ribbon crítico: ${result.supplyUsage.ribbonRemainingPercent.toFixed(0)}% restante - Troque em breve!`, { duration: 8000 });
          }
        } else {
          toast.error(result.message || 'Erro ao imprimir etiquetas');
          throw new Error(result.message || 'Erro ao imprimir etiquetas');
        }
      } else {
        // Sem Edge: criar etiquetas no backend (sem imprimir)
        const createdLabels = [];
        for (let i = 0; i < quantidade; i++) {
          const label = await labelsService.createLabel({
            type: 'validity',
            conservationType: conservacao,
            quantity: 1,
            weight: peso || undefined,
            unit: unidade || undefined,
            productionDate: dataManipulacao,
            validityDate: isIndeterminada ? undefined : dataValidade,
            clientId: user.clientId,
            productId: selectedProduct.id,
            storageLocationId: selectedLocation?.id,
            operationId: selectedOperation?.id,
            notes: undefined,
            operatorId: selectedOperator?.id,
            metadata: { conservacao, dataProducao: new Date(dataManipulacao).toLocaleDateString('pt-BR') },
          });
          createdLabels.push(label);
        }
        toast.success(`${createdLabels.length} etiqueta(s) criada(s)! Configure um Edge para imprimir.`, { duration: 5000 });
      }
      
      // Reset form (mantém responsável selecionado)
      setConservacao(null)
      setQuantidade(1)
      setPeso('')
      setUnidade('KG')
      setDataManipulacao(new Date().toISOString().split('T')[0])
      setDataValidade('')
      setSelectedLocation(null)
      setSelectedProduct(null)
      setCurrentStep('produtos')
    } catch (error) {
      console.error('Erro ao criar etiqueta:', error);
      toast.error('Erro ao criar etiqueta para impressão');
    }
  }

  const renderBreadcrumb = () => {
    // Verificar se a categoria selecionada tem subcategorias
    const hasSubcategories = selectedCategory ? categories.some(cat => cat.parentId === selectedCategory.id) : false
    
    return (
      <div className="px-6 py-4">
        <div className="flex items-center space-x-2 text-sm">
          <button onClick={() => navigate('/etiquetas')} className="text-primary hover:underline">
            Etiquetas
          </button>
          <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>&gt;</span>
          <button onClick={() => navigate('/etiquetas/nova')} className="text-primary hover:underline">
            Nova Etiqueta
          </button>
          <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>&gt;</span>
          {currentStep === 'categorias' ? (
            <span className={theme === 'dark' ? 'text-white' : 'text-dark-900'}>Validade</span>
          ) : (
            <button onClick={() => setCurrentStep('categorias')} className="text-primary hover:underline">
              Validade
            </button>
          )}
          
          {/* Mostrar categoria sempre que selecionada */}
          {selectedCategory && (
            <>
              <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>&gt;</span>
              {(currentStep === 'subcategorias' || (currentStep === 'produtos' && !hasSubcategories)) ? (
                <span className={theme === 'dark' ? 'text-white' : 'text-dark-900'}>{selectedCategory.name}</span>
              ) : (
                <button onClick={() => setCurrentStep(hasSubcategories ? 'subcategorias' : 'produtos')} className="text-primary hover:underline">
                  {selectedCategory.name}
                </button>
              )}
            </>
          )}
          
          {/* Mostrar subcategoria apenas se existe */}
          {selectedSubcategory && currentStep !== 'subcategorias' && (
            <>
              <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>&gt;</span>
              {currentStep === 'produtos' ? (
                <span className={theme === 'dark' ? 'text-white' : 'text-dark-900'}>{selectedSubcategory.name}</span>
              ) : (
                <button onClick={() => setCurrentStep('produtos')} className="text-primary hover:underline">
                  {selectedSubcategory.name}
                </button>
              )}
            </>
          )}
          
          {/* Mostrar produto selecionado na configuração */}
          {selectedProduct && currentStep === 'configuracao' && (
            <>
              <span className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>&gt;</span>
              <span className={theme === 'dark' ? 'text-white' : 'text-dark-900'}>Configurar</span>
            </>
          )}
        </div>
      </div>
    )
  }

  if (initializing) {
    return <PageLoading text="Carregando dados..." />
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'}`}>
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 ${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-b`}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className={`p-2 ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'} rounded-lg transition-colors`}
            >
              <ArrowLeft size={24} className={theme === 'dark' ? 'text-white' : 'text-dark-900'} />
            </button>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Clock size={24} weight="duotone" className="text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Etiqueta de Validade
              </h1>
              <p className="text-primary text-sm">
                {currentStep === 'categorias' && 'Selecione uma categoria'}
                {currentStep === 'subcategorias' && 'Selecione uma subcategoria'}
                {currentStep === 'produtos' && 'Selecione um produto'}
                {currentStep === 'configuracao' && 'Configure a etiqueta'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Quantidade de Etiquetas no Header */}
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>Qtd.</span>
              <button
                onClick={() => setQuantidade(Math.max(1, quantidade - 1))}
                className={`w-9 h-9 rounded-lg ${theme === 'dark' ? 'bg-dark-700' : 'bg-light-200'} flex items-center justify-center transition-colors`}
              >
                <Minus size={14} className={theme === 'dark' ? 'text-white' : 'text-dark-900'} />
              </button>
              <span className={`w-10 text-center font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>{quantidade}</span>
              <button
                onClick={() => setQuantidade(quantidade + 1)}
                className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center transition-colors"
              >
                <Plus size={14} className="text-white" />
              </button>
            </div>

            {/* Botão Ver Prévia */}
            {currentStep === 'configuracao' && (
              <button
                onClick={handleVerPrevia}
                disabled={!selectedProduct || !conservacao || !selectedOperator || !dataManipulacao || (conservacao !== 'indeterminada' && !dataValidade) || !selectedProduct?.id}
                className={`py-2.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
                  !selectedProduct || !conservacao || !selectedOperator || !dataManipulacao || (conservacao !== 'indeterminada' && !dataValidade) || !selectedProduct?.id
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'border-2 border-primary text-primary hover:bg-primary/10'
                }`}
              >
                <Eye size={18} />
              </button>
            )}

            {/* Botão Imprimir no Header */}
            <button
              onClick={handleImprimirAgora}
              disabled={!selectedProduct || !conservacao || !selectedOperator || !dataManipulacao || (conservacao !== 'indeterminada' && !dataValidade) || !selectedProduct?.id}
              className={`py-2.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
                !selectedProduct || !conservacao || !selectedOperator || !dataManipulacao || (conservacao !== 'indeterminada' && !dataValidade) || !selectedProduct?.id
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <Printer size={18} />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="pt-20">
        {renderBreadcrumb()}
      </div>

      {/* Conteúdo Principal */}
      <main className="pt-4 px-6 py-4 pb-40">
        {/* Busca (apenas nas telas de produtos) */}
        {currentStep === 'produtos' && (
          <div className="mb-6 max-w-md mx-auto">
            <div className="relative">
              <MagnifyingGlass 
                size={20} 
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-500'}`} 
              />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 ${theme === 'dark' ? 'bg-dark-800 border-dark-600 text-white' : 'bg-white border-light-300 text-dark-900'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
              />
            </div>
          </div>
        )}

        {/* Conteúdo baseado no step atual */}
        {currentStep === 'categorias' && (
          <div className="max-w-4xl mx-auto mt-8">
            <h2 className={`text-2xl font-semibold mb-10 text-center ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              Selecione uma Categoria
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rootCategories.map((category) => (
                <div
                  key={category.id}
                  onClick={() => handleSelectCategory(category)}
                  className={`p-6 ${theme === 'dark' ? 'bg-dark-800 hover:bg-dark-700 border-dark-600' : 'bg-white hover:bg-light-50 border-light-200'} border rounded-xl cursor-pointer transition-all group`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                        {category.name}
                      </h3>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                        {(() => {
                          const subCount = categories.filter(cat => cat.parentId === category.id).length
                          const prodCount = totalProductsByCategory.get(category.id) || 0
                          const parts: string[] = []
                          if (subCount > 0) {
                            parts.push(`${subCount} ${subCount === 1 ? 'subcategoria' : 'subcategorias'}`)
                          }
                          parts.push(prodCount === 0 ? 'nenhum produto' : `${prodCount} ${prodCount === 1 ? 'produto' : 'produtos'}`)
                          return parts.join(' • ')
                        })()}
                      </p>
                    </div>
                    <ArrowRight size={24} className="text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'subcategorias' && (
          <div className="max-w-4xl mx-auto mt-8">
            <h2 className={`text-2xl font-semibold mb-10 text-center ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              Selecione uma Subcategoria
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subcategories.map((subcategory) => (
                <div
                  key={subcategory.id}
                  onClick={() => handleSelectSubcategory(subcategory)}
                  className={`p-6 ${theme === 'dark' ? 'bg-dark-800 hover:bg-dark-700 border-dark-600' : 'bg-white hover:bg-light-50 border-light-200'} border rounded-xl cursor-pointer transition-all group`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                        {subcategory.name}
                      </h3>
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                        {products.filter(p => p.categoryId === subcategory.id).length} produtos
                      </p>
                    </div>
                    <ArrowRight size={24} className="text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'produtos' && (
          <div className="max-w-4xl mx-auto mt-8">
            <h2 className={`text-2xl font-semibold mb-10 text-center ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              Selecione um Produto
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className={`p-6 ${theme === 'dark' ? 'bg-dark-800 hover:bg-dark-700 border-dark-600' : 'bg-white hover:bg-light-50 border-light-200'} border rounded-xl cursor-pointer transition-all group`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                        {product.name}
                      </h3>
                      {product.code && (
                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                          Código: {product.code}
                        </p>
                      )}
                    </div>
                    <ArrowRight size={24} className="text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tela de Configuração - Exatamente como no Flutter */}
        {currentStep === 'configuracao' && selectedProduct && (
          <div className="max-w-2xl mx-auto space-y-4 mb-8 mt-8">
            {/* Preview simulado em tempo real */}
            <div className="flex justify-center">
              <SimulatedLabelPreview
                widthMm={60}
                heightMm={40}
                variables={previewVariables}
                layout="validity"
              />
            </div>

            {/* Título do produto - Como no Flutter */}
            <div className="space-y-1">
              <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                {selectedProduct.name}
              </h2>
              <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                Código: {selectedProduct.code}
              </p>
            </div>

            {/* Responsável - Igual ao Flutter */}
            <div>
              <button
                onClick={() => setShowOperatorModal(true)}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedOperator
                    ? 'border-primary bg-primary/10'
                    : theme === 'dark'
                    ? 'border-dark-600 bg-dark-700'
                    : 'border-light-300 bg-light-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User 
                      size={20} 
                      className={selectedOperator ? 'text-primary' : theme === 'dark' ? 'text-dark-300' : 'text-dark-600'} 
                    />
                    <div className="text-left">
                      <div className={`font-semibold ${
                        selectedOperator 
                          ? 'text-primary' 
                          : theme === 'dark' ? 'text-primary' : 'text-primary'
                      }`}>
                        Responsável
                      </div>
                      <div className={`text-sm ${
                        selectedOperator 
                          ? theme === 'dark' ? 'text-white' : 'text-dark-900'
                          : theme === 'dark' ? 'text-dark-400' : 'text-dark-600'
                      }`}>
                        {selectedOperator ? selectedOperator.name : 'Selecione o responsável'}
                      </div>
                    </div>
                  </div>
                  <CaretDown 
                    size={16} 
                    className={selectedOperator ? 'text-primary' : theme === 'dark' ? 'text-dark-300' : 'text-dark-600'} 
                  />
                </div>
              </button>
            </div>

            {/* Informações da Indústria - Lote e Data de Vencimento Original */}
            {selectedProduct?.expiryDate && (
              <div className={`p-4 ${theme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-light-50 border-light-300'} border rounded-xl`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`text-base font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'} flex items-center`}>
                    <Clock size={18} className="mr-2 text-primary" />
                    Informações da Indústria
                  </h4>
                  <Calendar size={18} className="text-primary" />
                </div>
                <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  Lote e data de vencimento da embalagem original
                </p>
                
                <div className="space-y-3">
                  {/* Lote Original */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                      Lote Original
                    </label>
                    <input
                      type="text"
                      value={loteFabricacao}
                      onChange={(e) => setLoteFabricacao(e.target.value)}
                      placeholder="Ex: L20251015-003"
                      className={`w-full px-4 py-3 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-dark-800 border-dark-600 text-white placeholder-dark-400'
                          : 'bg-white border-light-300 text-dark-900 placeholder-dark-500'
                      } focus:ring-2 focus:ring-primary focus:border-primary`}
                    />
                  </div>

                  {/* Data de Vencimento Original */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                      Data de Vencimento Original
                    </label>
                    <input
                      type="date"
                      value={dataValidadeOriginal}
                      onChange={(e) => setDataValidadeOriginal(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-dark-800 border-dark-600 text-white'
                          : 'bg-white border-light-300 text-dark-900'
                      } focus:ring-2 focus:ring-primary focus:border-primary`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Validade indeterminada: não exibir tipo de conservação nem data de validade */}
            {selectedProduct?.validityIndeterminate === true ? (
              <div className={`p-4 rounded-xl border-2 border-primary bg-primary/10 ${theme === 'dark' ? 'text-dark-200' : 'text-dark-700'}`}>
                <div className="flex items-center gap-3">
                  <Clock size={24} className="text-primary shrink-0" />
                  <p className="text-sm font-medium">
                    VALIDADE INDETERMINADA
                  </p>
                </div>
              </div>
            ) : (
              <>
            {/* Tipo de Conservação - Exatamente como no Flutter + Indeterminada quando produto permite */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                Tipo de Conservação
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {([
                  'ambiente',
                  'refrigerado',
                  'congelado',
                  'validade_original',
                  ...(selectedProduct?.validityIndeterminate ? (['indeterminada'] as const) : []),
                ] as const).map((tipo) => {
                  const info = getConservacaoInfo(tipo)
                  const Icon = info.icon
                  const isSelected = conservacao === tipo
                  
                  // Verificar se a opção deve estar desabilitada (0 dias)
                  let isDisabled = false
                  if (selectedProduct) {
                    switch (tipo) {
                      case 'ambiente':
                        isDisabled = (selectedProduct.shelfLifeAmbient || 0) === 0
                        break
                      case 'refrigerado':
                        isDisabled = (selectedProduct.shelfLifeRefrigerated || 0) === 0
                        break
                      case 'congelado':
                        isDisabled = (selectedProduct.shelfLifeFrozen || 0) === 0
                        break
                      case 'validade_original':
                        isDisabled = !selectedProduct.showExpiryDateOnLabel || !dataValidadeOriginal
                        break
                      case 'indeterminada':
                        isDisabled = false
                        break
                    }
                  }
                  
                  return (
                    <button
                      key={tipo}
                      onClick={() => !isDisabled && setConservacao(tipo)}
                      disabled={isDisabled}
                      className={`py-3 rounded-xl border-2 transition-all ${
                        isDisabled
                          ? theme === 'dark'
                            ? 'border-dark-700 bg-dark-800 cursor-not-allowed opacity-60'
                            : 'border-gray-300 bg-gray-200 cursor-not-allowed opacity-60'
                          : isSelected
                          ? 'border-primary bg-primary/20'
                          : theme === 'dark'
                          ? 'border-dark-600 bg-dark-700 hover:border-dark-500'
                          : 'border-light-300 bg-light-50 hover:border-light-400'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <Icon 
                          size={24} 
                          className={
                            isDisabled
                              ? theme === 'dark' ? 'text-dark-500' : 'text-gray-500'
                              : isSelected 
                              ? 'text-primary' 
                              : theme === 'dark' ? 'text-dark-300' : 'text-dark-600'
                          } 
                        />
                        <span className={`text-xs font-semibold ${
                          isDisabled
                            ? theme === 'dark' ? 'text-dark-500' : 'text-gray-500'
                            : isSelected 
                            ? 'text-primary' 
                            : theme === 'dark' ? 'text-white' : 'text-dark-900'
                        }`}>
                          {info.label}
                        </span>
                        <span className={`text-xs ${
                          isDisabled
                            ? theme === 'dark' ? 'text-dark-500' : 'text-gray-500'
                            : theme === 'dark' ? 'text-dark-300' : 'text-dark-600'
                        }`}>
                          {isDisabled ? 'Indisponível' : info.dias}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Local de Armazenamento */}
            <div className={`p-3 ${theme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-light-50 border-light-300'} border rounded-xl`}>
              <button
                onClick={() => setShowLocationModal(true)}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedLocation
                    ? 'border-primary bg-primary/10'
                    : theme === 'dark'
                    ? 'border-dark-600 bg-dark-700'
                    : 'border-light-300 bg-light-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MapPin 
                      size={20} 
                      className={selectedLocation ? 'text-primary' : theme === 'dark' ? 'text-dark-300' : 'text-dark-600'} 
                    />
                    <div className="text-left">
                      <div className={`font-semibold ${
                        selectedLocation 
                          ? 'text-primary' 
                          : theme === 'dark' ? 'text-primary' : 'text-primary'
                      }`}>
                        Local de Armazenamento
                      </div>
                      <div className={`text-sm ${
                        selectedLocation 
                          ? theme === 'dark' ? 'text-white' : 'text-dark-900'
                          : theme === 'dark' ? 'text-dark-400' : 'text-dark-600'
                      }`}>
                        {selectedLocation ? selectedLocation.nome : 'Nenhum local selecionado'}
                      </div>
                    </div>
                  </div>
                  <CaretDown 
                    size={16} 
                    className={selectedLocation ? 'text-primary' : theme === 'dark' ? 'text-dark-300' : 'text-dark-600'} 
                  />
                </div>
              </button>
            </div>


            {/* Data de Validade */}
            <div className={`p-3 ${theme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-light-50 border-light-300'} border rounded-xl`}>
              <h4 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                Data de Validade *
              </h4>
              <div className={`w-full px-4 py-3 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-dark-600 border-dark-500 text-dark-300'
                  : 'bg-gray-100 border-gray-300 text-gray-600'
              } cursor-not-allowed`}>
                {conservacao === 'indeterminada' ? 'INDETERMINADA' : dataValidade ? new Date(dataValidade).toLocaleDateString('pt-BR') : 'Selecione o tipo de conservação'}
              </div>
            </div>
            </>
            )}

            {/* Local de Armazenamento */}
            <div>
              <button
                onClick={() => setShowLocationModal(true)}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedLocation
                    ? 'border-primary bg-primary/10'
                    : theme === 'dark'
                    ? 'border-dark-600 bg-dark-700'
                    : 'border-light-300 bg-light-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MapPin 
                      size={20} 
                      className={selectedLocation ? 'text-primary' : theme === 'dark' ? 'text-dark-300' : 'text-dark-600'} 
                    />
                    <div className="text-left">
                      <div className={`font-semibold ${
                        selectedLocation 
                          ? 'text-primary' 
                          : theme === 'dark' ? 'text-primary' : 'text-primary'
                      }`}>
                        Local de Armazenamento
                      </div>
                      <div className={`text-sm ${
                        selectedLocation 
                          ? theme === 'dark' ? 'text-white' : 'text-dark-900'
                          : theme === 'dark' ? 'text-dark-400' : 'text-dark-600'
                      }`}>
                        {selectedLocation ? selectedLocation.nome : 'Nenhum local selecionado'}
                      </div>
                    </div>
                  </div>
                  <CaretDown 
                    size={16} 
                    className={selectedLocation ? 'text-primary' : theme === 'dark' ? 'text-dark-300' : 'text-dark-600'} 
                  />
                </div>
              </button>
            </div>

            {/* Peso/Quantidade - Ocupa toda a largura */}
            <div className={`p-4 ${theme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-light-50 border-light-300'} border rounded-xl`}>
              <h4 className={`text-base font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Peso/Quantidade (Opcional)
              </h4>
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  placeholder="Ex: 500"
                  className={`flex-1 px-5 py-4 text-lg rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-dark-800 border-dark-600 text-white placeholder-dark-400'
                      : 'bg-white border-light-300 text-dark-900 placeholder-dark-500'
                  } focus:ring-2 focus:ring-primary focus:border-primary`}
                />
                <select
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value)}
                  className={`px-5 py-4 text-lg rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-dark-800 border-dark-600 text-white'
                      : 'bg-white border-light-300 text-dark-900'
                  } focus:ring-2 focus:ring-primary focus:border-primary`}
                >
                  {unidades.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Removido rodapé de ações; controles movidos para o header */}
          </div>
        )}
      </main>

      {/* Modal de Seleção de Responsável */}
      {showOperatorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Selecionar Responsável
              </h2>
              <button
                onClick={() => setShowOperatorModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-dark-700 text-dark-300' 
                    : 'hover:bg-light-100 text-dark-600'
                }`}
              >
                ×
              </button>
            </div>

            {operators.filter(op => op.isActive).length === 0 ? (
              <div className="text-center py-8">
                <User size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-dark-400' : 'text-light-400'}`} />
                <p className={`${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'} mb-4`}>
                  Nenhum operador cadastrado
                </p>
                <button
                  onClick={() => {
                    setShowOperatorModal(false)
                    navigate('/cadastro/operadores')
                  }}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Cadastrar Operadores
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {operators.filter(op => op.isActive).map((operator) => (
                  <button
                    key={operator.id}
                    onClick={() => {
                      setSelectedOperator(operator);
                      setShowOperatorModal(false);
                      toast.success(`Responsável selecionado: ${operator.name}`);
                    }}
                    className={`w-full p-4 rounded-xl border transition-colors text-left ${
                      selectedOperator?.id === operator.id
                        ? 'border-primary bg-primary/10'
                        : theme === 'dark'
                        ? 'border-dark-600 hover:border-dark-500'
                        : 'border-light-300 hover:border-light-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedOperator?.id === operator.id ? 'bg-primary text-white' : 'bg-green-100'
                        }`}>
                          <User size={20} className={selectedOperator?.id === operator.id ? 'text-white' : 'text-green-600'} />
                        </div>
                        <div>
                          <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                            {operator.name}
                          </h3>
                          {operator.department && (
                            <p className={`text-sm ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                              {operator.department}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {selectedOperator?.id === operator.id && (
                        <div className="text-primary">✓</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Seleção de Local */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Selecionar Local
              </h2>
              <button
                onClick={() => setShowLocationModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'hover:bg-dark-700 text-dark-300' 
                    : 'hover:bg-light-100 text-dark-600'
                }`}
              >
                ×
              </button>
            </div>

            {/* Opção para não selecionar local */}
            <div className="mb-4">
              <button
                onClick={() => {
                  setSelectedLocation(null);
                  setShowLocationModal(false);
                  toast.success('Local removido');
                }}
                className={`w-full p-4 rounded-xl border transition-colors text-left ${
                  !selectedLocation
                    ? 'border-primary bg-primary/10'
                    : theme === 'dark'
                    ? 'border-dark-600 hover:border-dark-500'
                    : 'border-light-300 hover:border-light-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    !selectedLocation ? 'bg-primary text-white' : 'bg-gray-100'
                  }`}>
                    <MapPin size={20} className={!selectedLocation ? 'text-white' : 'text-gray-600'} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                      Sem local específico
                    </h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                      Não especificar local
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {storageLocations.length === 0 ? (
              <div className="text-center py-8">
                <MapPin size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-dark-400' : 'text-light-400'}`} />
                <p className={`${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'} mb-4`}>
                  Nenhum local cadastrado
                </p>
                <button
                  onClick={() => {
                    setShowLocationModal(false)
                    navigate('/cadastro/locais')
                  }}
                  className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Cadastrar Locais
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {storageLocations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => {
                      setSelectedLocation(location);
                      setShowLocationModal(false);
                      toast.success(`Local selecionado: ${location.nome}`);
                    }}
                    className={`w-full p-4 rounded-xl border transition-colors text-left ${
                      selectedLocation?.id === location.id
                        ? 'border-primary bg-primary/10'
                        : theme === 'dark'
                        ? 'border-dark-600 hover:border-dark-500'
                        : 'border-light-300 hover:border-light-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedLocation?.id === location.id ? 'bg-primary text-white' : storageLocationsService.getTemperaturaColor(location.tipo)
                        }`}>
                          <MapPin size={20} className={selectedLocation?.id === location.id ? 'text-white' : 'text-white'} />
                        </div>
                        <div>
                          <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                            {location.nome}
                          </h3>
                          <div className={`text-sm ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                            <span className="capitalize">{location.tipo}</span>
                            {location.setor && ` • ${location.setor}`}
                            {location.temperatura !== undefined && location.temperatura !== null && (
                              <span> • {location.temperatura % 1 === 0 ? Math.floor(location.temperatura) : location.temperatura} °C</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {selectedLocation?.id === location.id && (
                        <div className="text-primary">✓</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
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

      {/* Footer Navigation */}
      <FooterNavigation />
    </div>
  )
}