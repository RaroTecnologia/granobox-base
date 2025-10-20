import { SetMetadata } from '@nestjs/common';

export type RastreabilidadeFeature = 
  | 'recebimentoQR'
  | 'porcionamento'
  | 'rastreabilidadeCompleta'
  | 'relatoriosANVISA'
  | 'integracaoFornecedores'
  | 'controleTemperatura'
  | 'hierarquiaEtiquetas'
  | 'movimentacaoEstoque';

export const RASTREABILIDADE_FEATURE_KEY = 'rastreabilidadeFeature';

export const RequireRastreabilidadeFeature = (feature: RastreabilidadeFeature) =>
  SetMetadata(RASTREABILIDADE_FEATURE_KEY, feature);
