export class EstoqueItemDto {
  productId: string;
  productName: string;
  productCode?: string;
  productType: string;
  quantidadeEtiquetas: number;
  quantidadeSemEtiqueta: number;
  quantidadeProximoVencimento: number;
  etiquetas: any[];
  recebimentosSemEtiqueta: any[];
}
