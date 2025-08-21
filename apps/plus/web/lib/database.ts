import { prisma } from './prisma'
import type { Ingrediente, Receita, Cliente, Pedido, PlanoProducao } from '@/types'

export class DatabaseService {
  // Ingredientes
  async getIngredientes(organizacaoId: string) {
    return await prisma.ingrediente.findMany({
      where: { organizacaoId },
      orderBy: { nome: 'asc' }
    })
  }

  async addIngrediente(data: Omit<Ingrediente, 'id'>, organizacaoId: string) {
    return await prisma.ingrediente.create({
      data: {
        nome: data.nome,
        unidade: data.unidade,
        estoqueAtual: data.estoqueAtual,
        estoqueMinimo: data.estoqueMinimo,
        custoUnitario: data.custoUnitario,
        fornecedor: data.fornecedor,
        dataValidade: data.dataValidade,
        organizacaoId
      }
    })
  }

  async updateIngrediente(id: string, data: Partial<Ingrediente>, organizacaoId: string) {
    return await prisma.ingrediente.update({
      where: { 
        id,
        organizacaoId // Garante que só pode atualizar ingredientes da própria organização
      },
      data: {
        nome: data.nome,
        unidade: data.unidade,
        estoqueAtual: data.estoqueAtual,
        estoqueMinimo: data.estoqueMinimo,
        custoUnitario: data.custoUnitario,
        fornecedor: data.fornecedor,
        dataValidade: data.dataValidade
      }
    })
  }

  async deleteIngrediente(id: string, organizacaoId: string) {
    return await prisma.ingrediente.delete({
      where: { 
        id,
        organizacaoId // Garante que só pode deletar ingredientes da própria organização
      }
    })
  }

  // Receitas
  async getReceitas(organizacaoId: string) {
    return await prisma.receita.findMany({
      where: {
        organizacaoId: organizacaoId
      },
      include: {
        ingredientes: {
          include: {
            ingrediente: true
          }
        },
        etapas: {
          orderBy: {
            ordem: 'asc'
          }
        }
      },
      orderBy: { nome: 'asc' }
    })
  }

  async getReceita(id: string, organizacaoId: string) {
    return await prisma.receita.findFirst({
      where: { 
        id,
        organizacaoId
      },
      include: {
        ingredientes: {
          include: {
            ingrediente: true
          }
        },
        etapas: {
          orderBy: {
            ordem: 'asc'
          }
        }
      }
    })
  }

  async addReceita(data: Omit<Receita, 'id' | 'dataCriacao' | 'dataAtualizacao'>, organizacaoId: string) {
    return await prisma.receita.create({
      data: {
        nome: data.nome,
        descricao: data.descricao,
        categoria: data.categoria,
        rendimento: data.rendimento,
        tempoPreparo: data.tempoPreparo,
        custoTotal: data.custoTotal,
        precoVenda: data.precoVenda,
        instrucoes: data.instrucoes,
        tamanhoForma: data.tamanhoForma,
        pesoUnitario: data.pesoUnitario,
        sistemaCalculo: data.sistemaCalculo,
        pesoTotalBase: data.pesoTotalBase,
        ativo: data.ativo,
        organizacaoId: organizacaoId,
        ingredientes: {
          create: data.ingredientes.map(item => ({
            ingredienteId: item.ingredienteId,
            quantidade: item.quantidade,
            isIngredienteBase: item.isIngredienteBase || false
          }))
        },
        etapas: {
          create: data.etapas?.map(etapa => ({
            nome: etapa.nome,
            ordem: etapa.ordem,
            descricao: etapa.descricao,
            tempoMin: etapa.tempoMin,
            tempoMax: etapa.tempoMax,
            temperatura: etapa.temperatura,
            umidade: etapa.umidade,
            observacoes: etapa.observacoes
          })) || []
        }
      },
      include: {
        ingredientes: {
          include: {
            ingrediente: true
          }
        },
        etapas: {
          orderBy: {
            ordem: 'asc'
          }
        }
      }
    })
  }

  async updateReceita(id: string, data: Partial<Receita>, organizacaoId: string) {
    // Primeiro, deletar todos os ingredientes e etapas existentes da receita
    await prisma.itemReceita.deleteMany({
      where: { receitaId: id }
    })
    await prisma.etapaReceita.deleteMany({
      where: { receitaId: id }
    })

    return await prisma.receita.update({
      where: { 
        id,
        organizacaoId
      },
      data: {
        nome: data.nome,
        descricao: data.descricao,
        categoria: data.categoria,
        rendimento: data.rendimento,
        tempoPreparo: data.tempoPreparo,
        custoTotal: data.custoTotal,
        precoVenda: data.precoVenda,
        instrucoes: data.instrucoes,
        tamanhoForma: data.tamanhoForma,
        pesoUnitario: data.pesoUnitario,
        sistemaCalculo: data.sistemaCalculo,
        pesoTotalBase: data.pesoTotalBase,
        ativo: data.ativo,
        ingredientes: data.ingredientes ? {
          create: data.ingredientes.map(item => ({
            ingredienteId: item.ingredienteId,
            quantidade: item.quantidade,
            isIngredienteBase: item.isIngredienteBase || false
          }))
        } : undefined,
        etapas: data.etapas ? {
          create: data.etapas.map(etapa => ({
            nome: etapa.nome,
            ordem: etapa.ordem,
            descricao: etapa.descricao,
            tempoMin: etapa.tempoMin,
            tempoMax: etapa.tempoMax,
            temperatura: etapa.temperatura,
            umidade: etapa.umidade,
            observacoes: etapa.observacoes
          }))
        } : undefined
      },
      include: {
        ingredientes: {
          include: {
            ingrediente: true
          }
        },
        etapas: {
          orderBy: {
            ordem: 'asc'
          }
        }
      }
    })
  }

  async deleteReceita(id: string, organizacaoId: string) {
    return await prisma.receita.delete({
      where: { 
        id,
        organizacaoId
      }
    })
  }

  // Clientes
  async getClientes() {
    return await prisma.cliente.findMany({
      orderBy: { nome: 'asc' }
    })
  }

  async addCliente(data: Omit<Cliente, 'id' | 'dataCadastro' | 'totalCompras'>, organizacaoId: string) {
    return await prisma.cliente.create({
      data: {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        endereco: data.endereco as any,
        dataNascimento: data.dataNascimento,
        ativo: data.ativo,
        organizacaoId
      }
    })
  }

  async updateCliente(id: string, data: Partial<Cliente>) {
    return await prisma.cliente.update({
      where: { id },
      data: {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        endereco: data.endereco as any,
        dataNascimento: data.dataNascimento,
        ativo: data.ativo,
        totalCompras: data.totalCompras
      }
    })
  }

  async deleteCliente(id: string) {
    return await prisma.cliente.delete({
      where: { id }
    })
  }

  // Pedidos
  async getPedidos() {
    return await prisma.pedido.findMany({
      include: {
        cliente: true,
        itens: {
          include: {
            receita: true
          }
        }
      },
      orderBy: { dataHoraPedido: 'desc' }
    })
  }

  async addPedido(data: Omit<Pedido, 'id' | 'dataHoraPedido'>, organizacaoId: string) {
    return await prisma.pedido.create({
      data: {
        clienteId: data.clienteId,
        subtotal: data.subtotal,
        desconto: data.desconto,
        total: data.total,
        status: data.status,
        tipo: data.tipo,
        formaPagamento: data.formaPagamento,
        observacoes: data.observacoes,
        dataHoraEntrega: data.dataHoraEntrega,
        organizacaoId,
        itens: {
          create: data.itens.map(item => ({
            receitaId: item.receitaId,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            subtotal: item.subtotal
          }))
        }
      },
      include: {
        cliente: true,
        itens: {
          include: {
            receita: true
          }
        }
      }
    })
  }

  async updatePedido(id: string, data: Partial<Pedido>) {
    return await prisma.pedido.update({
      where: { id },
      data: {
        status: data.status,
        dataHoraEntrega: data.dataHoraEntrega,
        observacoes: data.observacoes
      },
      include: {
        cliente: true,
        itens: {
          include: {
            receita: true
          }
        }
      }
    })
  }

  // Planos de Produção
  async getPlanosProducao(organizacaoId: string) {
    return await prisma.planoProducao.findMany({
      where: {
        organizacaoId: organizacaoId
      },
      include: {
        itens: {
          include: {
            receita: true
          }
        }
      },
      orderBy: { data: 'desc' }
    })
  }

  async addPlanoProducao(data: Omit<PlanoProducao, 'id' | 'dataCriacao' | 'dataAtualizacao'>, organizacaoId: string) {
    return await prisma.planoProducao.create({
      data: {
        data: data.data,
        status: data.status,
        observacoes: data.observacoes,
        organizacaoId: organizacaoId,
        itens: {
          create: data.itens.map(item => ({
            receitaId: item.receitaId,
            quantidade: item.quantidade
          }))
        }
      },
      include: {
        itens: {
          include: {
            receita: true
          }
        }
      }
    })
  }

  async updatePlanoProducao(id: string, data: Partial<PlanoProducao>, organizacaoId: string) {
    return await prisma.planoProducao.update({
      where: { 
        id,
        organizacaoId
      },
      data: {
        status: data.status,
        observacoes: data.observacoes
      },
      include: {
        itens: {
          include: {
            receita: true
          }
        }
      }
    })
  }
}

export const db = new DatabaseService() 