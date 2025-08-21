import { v4 as uuidv4 } from 'uuid';
import { Ingrediente, Receita, Cliente, Pedido, PlanoProducao } from '@/types';

// Dados mock para ingredientes
export const ingredientesMock: Ingrediente[] = [
  {
    id: '1',
    nome: 'Farinha de Trigo',
    unidade: 'kg',
    estoqueAtual: 50,
    estoqueMinimo: 10,
    custoUnitario: 4.50,
    fornecedor: 'Moinho São Paulo'
  },
  {
    id: '2',
    nome: 'Açúcar Cristal',
    unidade: 'kg',
    estoqueAtual: 25,
    estoqueMinimo: 5,
    custoUnitario: 3.20,
    fornecedor: 'Açúcar União'
  },
  {
    id: '3',
    nome: 'Ovos',
    unidade: 'unidade',
    estoqueAtual: 120,
    estoqueMinimo: 30,
    custoUnitario: 0.50,
    fornecedor: 'Granja Feliz'
  },
  {
    id: '4',
    nome: 'Manteiga',
    unidade: 'kg',
    estoqueAtual: 8,
    estoqueMinimo: 2,
    custoUnitario: 12.00,
    fornecedor: 'Laticínios Bom Gosto'
  },
  {
    id: '5',
    nome: 'Fermento Biológico',
    unidade: 'g',
    estoqueAtual: 500,
    estoqueMinimo: 100,
    custoUnitario: 0.02,
    fornecedor: 'Fleischmann'
  }
];

// Dados mock para receitas
export const receitasMock: Receita[] = [
  {
    id: '1',
    nome: 'Pão Francês',
    descricao: 'Pão francês tradicional',
    categoria: 'pao',
    ingredientes: [
      { ingredienteId: '1', quantidade: 1 },
      { ingredienteId: '5', quantidade: 10 }
    ],
    etapas: [],
    rendimento: 20,
    tempoPreparo: 180,
    custoTotal: 4.70,
    precoVenda: 0.50,
    instrucoes: 'Misturar ingredientes, sovar, deixar descansar e assar.',
    sistemaCalculo: 'peso',
    ativo: true,
    dataCriacao: new Date('2024-01-01'),
    dataAtualizacao: new Date('2024-01-01')
  },
  {
    id: '2',
    nome: 'Bolo de Chocolate',
    descricao: 'Bolo de chocolate fofinho',
    categoria: 'doce',
    ingredientes: [
      { ingredienteId: '1', quantidade: 0.3 },
      { ingredienteId: '2', quantidade: 0.2 },
      { ingredienteId: '3', quantidade: 3 },
      { ingredienteId: '4', quantidade: 0.1 }
    ],
    etapas: [],
    rendimento: 1,
    tempoPreparo: 90,
    custoTotal: 8.50,
    precoVenda: 25.00,
    instrucoes: 'Bater ovos com açúcar, adicionar farinha e manteiga, assar por 40 min.',
    sistemaCalculo: 'peso',
    ativo: true,
    dataCriacao: new Date('2024-01-02'),
    dataAtualizacao: new Date('2024-01-02')
  }
];

// Dados mock para clientes
export const clientesMock: Cliente[] = [
  {
    id: '1',
    nome: 'Maria Silva',
    email: 'maria@email.com',
    telefone: '(11) 99999-9999',
    endereco: {
      rua: 'Rua das Flores',
      numero: '123',
      bairro: 'Centro',
      cidade: 'São Paulo',
      cep: '01234-567'
    },
    ativo: true,
    dataCadastro: new Date('2024-01-01'),
    totalCompras: 150.00
  },
  {
    id: '2',
    nome: 'João Santos',
    email: 'joao@email.com',
    telefone: '(11) 88888-8888',
    ativo: true,
    dataCadastro: new Date('2024-01-02'),
    totalCompras: 89.50
  }
];

// Dados mock para pedidos
export const pedidosMock: Pedido[] = [
  {
    id: '1',
    clienteId: '1',
    itens: [
      {
        receitaId: '1',
        quantidade: 10,
        precoUnitario: 0.50,
        subtotal: 5.00
      },
      {
        receitaId: '2',
        quantidade: 1,
        precoUnitario: 25.00,
        subtotal: 25.00
      }
    ],
    subtotal: 30.00,
    desconto: 0,
    total: 30.00,
    status: 'pendente',
    tipo: 'balcao',
    formaPagamento: 'dinheiro',
    dataHoraPedido: new Date()
  }
];

// Dados mock para planos de produção
export const planosProducaoMock: PlanoProducao[] = [
  {
    id: '1',
    data: new Date(),
    itens: [
      {
        receitaId: '1',
        quantidade: 100
      },
      {
        receitaId: '2',
        quantidade: 5
      }
    ],
    status: 'planejado',
    observacoes: 'Produção para o dia',
    dataCriacao: new Date(),
    dataAtualizacao: new Date()
  }
];

// Funções para simular operações CRUD
class DataStore {
  private ingredientes: Ingrediente[] = [...ingredientesMock];
  private receitas: Receita[] = [...receitasMock];
  private clientes: Cliente[] = [...clientesMock];
  private pedidos: Pedido[] = [...pedidosMock];
  private planosProducao: PlanoProducao[] = [...planosProducaoMock];

  // Ingredientes
  getIngredientes(): Ingrediente[] {
    return this.ingredientes;
  }

  addIngrediente(ingrediente: Omit<Ingrediente, 'id'>): Ingrediente {
    const novoIngrediente = { ...ingrediente, id: uuidv4() };
    this.ingredientes.push(novoIngrediente);
    return novoIngrediente;
  }

  updateIngrediente(id: string, updates: Partial<Ingrediente>): Ingrediente | null {
    const index = this.ingredientes.findIndex(i => i.id === id);
    if (index === -1) return null;
    this.ingredientes[index] = { ...this.ingredientes[index], ...updates };
    return this.ingredientes[index];
  }

  deleteIngrediente(id: string): boolean {
    const index = this.ingredientes.findIndex(i => i.id === id);
    if (index === -1) return false;
    this.ingredientes.splice(index, 1);
    return true;
  }

  // Receitas
  getReceitas(): Receita[] {
    return this.receitas;
  }

  addReceita(receita: Omit<Receita, 'id' | 'dataCriacao' | 'dataAtualizacao'>): Receita {
    const novaReceita = {
      ...receita,
      id: uuidv4(),
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    };
    this.receitas.push(novaReceita);
    return novaReceita;
  }

  updateReceita(id: string, updates: Partial<Receita>): Receita | null {
    const index = this.receitas.findIndex(r => r.id === id);
    if (index === -1) return null;
    this.receitas[index] = { 
      ...this.receitas[index], 
      ...updates, 
      dataAtualizacao: new Date() 
    };
    return this.receitas[index];
  }

  deleteReceita(id: string): boolean {
    const index = this.receitas.findIndex(r => r.id === id);
    if (index === -1) return false;
    this.receitas.splice(index, 1);
    return true;
  }

  // Clientes
  getClientes(): Cliente[] {
    return this.clientes;
  }

  addCliente(cliente: Omit<Cliente, 'id' | 'dataCadastro' | 'totalCompras'>): Cliente {
    const novoCliente = {
      ...cliente,
      id: uuidv4(),
      dataCadastro: new Date(),
      totalCompras: 0
    };
    this.clientes.push(novoCliente);
    return novoCliente;
  }

  updateCliente(id: string, updates: Partial<Cliente>): Cliente | null {
    const index = this.clientes.findIndex(c => c.id === id);
    if (index === -1) return null;
    this.clientes[index] = { ...this.clientes[index], ...updates };
    return this.clientes[index];
  }

  deleteCliente(id: string): boolean {
    const index = this.clientes.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.clientes.splice(index, 1);
    return true;
  }

  // Pedidos
  getPedidos(): Pedido[] {
    return this.pedidos;
  }

  addPedido(pedido: Omit<Pedido, 'id' | 'dataHoraPedido'>): Pedido {
    const novoPedido = {
      ...pedido,
      id: uuidv4(),
      dataHoraPedido: new Date()
    };
    this.pedidos.push(novoPedido);
    return novoPedido;
  }

  updatePedido(id: string, updates: Partial<Pedido>): Pedido | null {
    const index = this.pedidos.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.pedidos[index] = { ...this.pedidos[index], ...updates };
    return this.pedidos[index];
  }

  // Planos de Produção
  getPlanosProducao(): PlanoProducao[] {
    return this.planosProducao;
  }

  addPlanoProducao(plano: Omit<PlanoProducao, 'id' | 'dataCriacao' | 'dataAtualizacao'>): PlanoProducao {
    const novoPlano = {
      ...plano,
      id: uuidv4(),
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    };
    this.planosProducao.push(novoPlano);
    return novoPlano;
  }

  updatePlanoProducao(id: string, updates: Partial<PlanoProducao>): PlanoProducao | null {
    const index = this.planosProducao.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.planosProducao[index] = { 
      ...this.planosProducao[index], 
      ...updates, 
      dataAtualizacao: new Date() 
    };
    return this.planosProducao[index];
  }
}

export const dataStore = new DataStore(); 