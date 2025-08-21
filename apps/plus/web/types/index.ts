export interface Ingrediente {
  id: string;
  nome: string;
  unidade: 'kg' | 'g' | 'l' | 'ml' | 'unidade';
  estoqueAtual: number;
  estoqueMinimo: number;
  custoUnitario: number;
  fornecedor?: string;
  dataValidade?: Date;
}

export interface ItemReceita {
  ingredienteId: string;
  quantidade: number;
  ingrediente?: Ingrediente;
  isIngredienteBase?: boolean; // Para marcar farinhas no sistema de porcentagem
}

export interface EtapaReceita {
  id: string;
  receitaId: string;
  nome: string;
  ordem: number;
  descricao?: string;
  tempoMin?: number;
  tempoMax?: number;
  temperatura?: number;
  umidade?: number;
  observacoes?: string;
}

export interface Receita {
  id: string;
  nome: string;
  descricao?: string;
  categoria: 'pao' | 'doce' | 'salgado' | 'bebida' | 'outro';
  ingredientes: ItemReceita[];
  etapas: EtapaReceita[];
  rendimento: number; // quantidade de unidades que a receita produz
  tempoPreparo: number; // em minutos
  custoTotal: number;
  precoVenda: number;
  instrucoes?: string;
  tamanhoForma?: string; // tamanho da forma utilizada
  pesoUnitario?: number; // peso de cada unidade em gramas
  sistemaCalculo: 'peso' | 'porcentagem'; // sistema de cálculo usado
  pesoTotalBase?: number; // peso total das farinhas base (para sistema de porcentagem)
  ativo: boolean;
  dataCriacao: Date;
  dataAtualizacao: Date;
}

export interface ItemProducao {
  receitaId: string;
  quantidade: number;
  receita?: Receita;
}

export interface PlanoProducao {
  id: string;
  data: Date;
  itens: ItemProducao[];
  status: 'planejado' | 'em_producao' | 'concluido' | 'cancelado';
  observacoes?: string;
  dataCriacao: Date;
  dataAtualizacao: Date;
}

export interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  endereco?: {
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    cep: string;
  };
  dataNascimento?: Date;
  ativo: boolean;
  dataCadastro: Date;
  totalCompras: number;
}

export interface ItemPedido {
  receitaId: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  receita?: Receita;
}

export interface Pedido {
  id: string;
  clienteId?: string;
  cliente?: Cliente;
  itens: ItemPedido[];
  subtotal: number;
  desconto: number;
  total: number;
  status: 'pendente' | 'preparando' | 'pronto' | 'entregue' | 'cancelado';
  tipo: 'balcao' | 'online' | 'delivery';
  formaPagamento?: 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'pix';
  observacoes?: string;
  dataHoraPedido: Date;
  dataHoraEntrega?: Date;
}

export interface MovimentacaoEstoque {
  id: string;
  ingredienteId: string;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  motivo: string;
  dataMovimentacao: Date;
  usuario?: string;
} 