import { prisma } from './prisma'

export async function seedDatabase() {
  try {
    // Buscar organização padrão
    const organizacao = await prisma.organizacao.findFirst({
      where: { ativo: true }
    });

    if (!organizacao) {
      console.error('❌ Nenhuma organização encontrada. Execute o seed-admin.js primeiro.');
      return false;
    }

    // Limpar dados existentes
    await prisma.movimentacaoEstoque.deleteMany()
    await prisma.itemPedido.deleteMany()
    await prisma.pedido.deleteMany()
    await prisma.itemProducao.deleteMany()
    await prisma.planoProducao.deleteMany()
    await prisma.itemReceita.deleteMany()
    await prisma.receita.deleteMany()
    await prisma.ingrediente.deleteMany()
    await prisma.cliente.deleteMany()

    // Criar ingredientes
    const ingredientes = await Promise.all([
      prisma.ingrediente.create({
        data: {
          organizacaoId: organizacao.id,
          nome: 'Farinha de Trigo',
          unidade: 'kg',
          estoqueAtual: 50,
          estoqueMinimo: 10,
          custoUnitario: 4.50,
          fornecedor: 'Moinho São Paulo'
        }
      }),
      prisma.ingrediente.create({
        data: {
          organizacaoId: organizacao.id,
          nome: 'Açúcar Cristal',
          unidade: 'kg',
          estoqueAtual: 25,
          estoqueMinimo: 5,
          custoUnitario: 3.20,
          fornecedor: 'Açúcar União'
        }
      }),
      prisma.ingrediente.create({
        data: {
          organizacaoId: organizacao.id,
          nome: 'Ovos',
          unidade: 'unidade',
          estoqueAtual: 120,
          estoqueMinimo: 30,
          custoUnitario: 0.50,
          fornecedor: 'Granja Feliz'
        }
      }),
      prisma.ingrediente.create({
        data: {
          organizacaoId: organizacao.id,
          nome: 'Manteiga',
          unidade: 'kg',
          estoqueAtual: 8,
          estoqueMinimo: 2,
          custoUnitario: 12.00,
          fornecedor: 'Laticínios Bom Gosto'
        }
      }),
      prisma.ingrediente.create({
        data: {
          organizacaoId: organizacao.id,
          nome: 'Fermento Biológico',
          unidade: 'g',
          estoqueAtual: 500,
          estoqueMinimo: 100,
          custoUnitario: 0.02,
          fornecedor: 'Fleischmann'
        }
      })
    ])

    // Criar receitas
    const paoFrances = await prisma.receita.create({
      data: {
        organizacaoId: organizacao.id,
        nome: 'Pão Francês',
        descricao: 'Pão francês tradicional',
        categoria: 'pao',
        rendimento: 20,
        tempoPreparo: 180,
        custoTotal: 4.70,
        precoVenda: 0.50,
        instrucoes: 'Misturar ingredientes, sovar, deixar descansar e assar.',
        ativo: true,
        ingredientes: {
          create: [
            {
              ingredienteId: ingredientes[0].id, // Farinha
              quantidade: 1
            },
            {
              ingredienteId: ingredientes[4].id, // Fermento
              quantidade: 10
            }
          ]
        }
      }
    })

    const boloChocolate = await prisma.receita.create({
      data: {
        organizacaoId: organizacao.id,
        nome: 'Bolo de Chocolate',
        descricao: 'Bolo de chocolate fofinho',
        categoria: 'doce',
        rendimento: 1,
        tempoPreparo: 90,
        custoTotal: 8.50,
        precoVenda: 25.00,
        instrucoes: 'Bater ovos com açúcar, adicionar farinha e manteiga, assar por 40 min.',
        ativo: true,
        ingredientes: {
          create: [
            {
              ingredienteId: ingredientes[0].id, // Farinha
              quantidade: 0.3
            },
            {
              ingredienteId: ingredientes[1].id, // Açúcar
              quantidade: 0.2
            },
            {
              ingredienteId: ingredientes[2].id, // Ovos
              quantidade: 3
            },
            {
              ingredienteId: ingredientes[3].id, // Manteiga
              quantidade: 0.1
            }
          ]
        }
      }
    })

    // Criar clientes
    const clientes = await Promise.all([
      prisma.cliente.create({
        data: {
          organizacaoId: organizacao.id,
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
          totalCompras: 150.00
        }
      }),
      prisma.cliente.create({
        data: {
          organizacaoId: organizacao.id,
          nome: 'João Santos',
          email: 'joao@email.com',
          telefone: '(11) 88888-8888',
          ativo: true,
          totalCompras: 89.50
        }
      })
    ])

    // Criar pedido de exemplo
    await prisma.pedido.create({
      data: {
        organizacaoId: organizacao.id,
        clienteId: clientes[0].id,
        subtotal: 30.00,
        desconto: 0,
        total: 30.00,
        status: 'pendente',
        tipo: 'balcao',
        formaPagamento: 'dinheiro',
        itens: {
          create: [
            {
              receitaId: paoFrances.id,
              quantidade: 10,
              precoUnitario: 0.50,
              subtotal: 5.00
            },
            {
              receitaId: boloChocolate.id,
              quantidade: 1,
              precoUnitario: 25.00,
              subtotal: 25.00
            }
          ]
        }
      }
    })

    // Criar plano de produção
    await prisma.planoProducao.create({
      data: {
        organizacaoId: organizacao.id,
        data: new Date(),
        status: 'planejado',
        observacoes: 'Produção para o dia',
        itens: {
          create: [
            {
              receitaId: paoFrances.id,
              quantidade: 100
            },
            {
              receitaId: boloChocolate.id,
              quantidade: 5
            }
          ]
        }
      }
    })

    console.log('✅ Banco de dados populado com sucesso!')
    return true
  } catch (error) {
    console.error('❌ Erro ao popular banco de dados:', error)
    return false
  }
} 