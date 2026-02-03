export interface RastreabilidadeFeatures {
  recebimentoQR: boolean; // Recebimento com QR code
  porcionamento: boolean; // Porcionamento de produtos
  rastreabilidadeCompleta: boolean; // Rastreabilidade total
  relatoriosANVISA: boolean; // Relatórios de conformidade
  integracaoFornecedores: boolean; // Integração com fornecedores
  controleTemperatura: boolean; // Controle de temperatura
  hierarquiaEtiquetas: boolean; // Sistema de hierarquia (pai/filho)
  movimentacaoEstoque: boolean; // Controle de movimentações
}

export const PLAN_FEATURES = {
  BASIC: {
    recebimentoQR: false,
    porcionamento: false,
    rastreabilidadeCompleta: false,
    relatoriosANVISA: false,
    integracaoFornecedores: false,
    controleTemperatura: false,
    hierarquiaEtiquetas: false,
    movimentacaoEstoque: false,
  } as RastreabilidadeFeatures,

  PROFESSIONAL: {
    recebimentoQR: true,
    porcionamento: true,
    rastreabilidadeCompleta: false,
    relatoriosANVISA: false,
    integracaoFornecedores: false,
    controleTemperatura: true,
    hierarquiaEtiquetas: false,
    movimentacaoEstoque: true,
  } as RastreabilidadeFeatures,

  ENTERPRISE: {
    recebimentoQR: true,
    porcionamento: true,
    rastreabilidadeCompleta: true,
    relatoriosANVISA: true,
    integracaoFornecedores: true,
    controleTemperatura: true,
    hierarquiaEtiquetas: true,
    movimentacaoEstoque: true,
  } as RastreabilidadeFeatures,
};
