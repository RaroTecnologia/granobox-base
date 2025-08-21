const { PrismaClient } = require('../generated/prisma')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...')
    
    // Testar conexão
    await prisma.$connect()
    console.log('✅ Conectado ao banco de dados!')
    
    // Limpar dados existentes
    console.log('🧹 Limpando dados existentes...')
    await prisma.movimentacaoEstoque.deleteMany()
    await prisma.itemPedido.deleteMany()
    await prisma.pedido.deleteMany()
    await prisma.itemProducao.deleteMany()
    await prisma.planoProducao.deleteMany()
    await prisma.itemReceita.deleteMany()
    await prisma.receita.deleteMany()
    await prisma.ingrediente.deleteMany()
    await prisma.cliente.deleteMany()
    
    console.log('📦 Criando ingredientes...')
    // Criar ingredientes
    const ingredientes = await Promise.all([
      prisma.ingrediente.create({
        data: {
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
          nome: 'Fermento Biológico',
          unidade: 'g',
          estoqueAtual: 500,
          estoqueMinimo: 100,
          custoUnitario: 0.02,
          fornecedor: 'Fleischmann'
        }
      }),
      prisma.ingrediente.create({
        data: {
          nome: 'Leite',
          unidade: 'litro',
          estoqueAtual: 15,
          estoqueMinimo: 5,
          custoUnitario: 4.20,
          fornecedor: 'Laticínios Bom Gosto'
        }
      }),
      prisma.ingrediente.create({
        data: {
          nome: 'Chocolate em Pó',
          unidade: 'kg',
          estoqueAtual: 3,
          estoqueMinimo: 1,
          custoUnitario: 18.00,
          fornecedor: 'Nestlé'
        }
      }),
      prisma.ingrediente.create({
        data: {
          nome: 'Sal',
          unidade: 'kg',
          estoqueAtual: 10,
          estoqueMinimo: 2,
          custoUnitario: 2.50,
          fornecedor: 'Sal Cisne'
        }
      })
    ])

    console.log('🍞 Criando receitas...')
    // Criar receitas
    const paoFrances = await prisma.receita.create({
      data: {
        nome: 'Pão Francês',
        descricao: 'Pão francês tradicional crocante por fora e macio por dentro',
        categoria: 'pao',
        rendimento: 20,
        tempoPreparo: 180,
        custoTotal: 4.70,
        precoVenda: 0.50,
        instrucoes: 'Misturar ingredientes secos, adicionar água morna, sovar por 10 min, deixar descansar 1h, modelar e assar por 25 min a 220°C.',
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
            },
            {
              ingredienteId: ingredientes[7].id, // Sal
              quantidade: 0.02
            }
          ]
        }
      }
    })

    const boloChocolate = await prisma.receita.create({
      data: {
        nome: 'Bolo de Chocolate',
        descricao: 'Bolo de chocolate fofinho e saboroso',
        categoria: 'doce',
        rendimento: 1,
        tempoPreparo: 90,
        custoTotal: 12.50,
        precoVenda: 35.00,
        instrucoes: 'Bater ovos com açúcar, adicionar farinha, chocolate e manteiga derretida, assar por 40 min a 180°C.',
        ativo: true,
        ingredientes: {
          create: [
            {
              ingredienteId: ingredientes[0].id, // Farinha
              quantidade: 0.3
            },
            {
              ingredienteId: ingredientes[1].id, // Açúcar
              quantidade: 0.25
            },
            {
              ingredienteId: ingredientes[2].id, // Ovos
              quantidade: 4
            },
            {
              ingredienteId: ingredientes[3].id, // Manteiga
              quantidade: 0.15
            },
            {
              ingredienteId: ingredientes[6].id, // Chocolate
              quantidade: 0.1
            }
          ]
        }
      }
    })

    const croissant = await prisma.receita.create({
      data: {
        nome: 'Croissant',
        descricao: 'Croissant francês folhado',
        categoria: 'pao',
        rendimento: 12,
        tempoPreparo: 240,
        custoTotal: 8.20,
        precoVenda: 3.50,
        instrucoes: 'Preparar massa, laminar com manteiga, dobrar 3 vezes, modelar e assar.',
        ativo: true,
        ingredientes: {
          create: [
            {
              ingredienteId: ingredientes[0].id, // Farinha
              quantidade: 0.5
            },
            {
              ingredienteId: ingredientes[3].id, // Manteiga
              quantidade: 0.3
            },
            {
              ingredienteId: ingredientes[5].id, // Leite
              quantidade: 0.2
            }
          ]
        }
      }
    })

    console.log('👥 Criando clientes...')
    // Criar clientes
    const clientes = await Promise.all([
      prisma.cliente.create({
        data: {
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
          nome: 'João Santos',
          email: 'joao@email.com',
          telefone: '(11) 88888-8888',
          endereco: {
            rua: 'Av. Paulista',
            numero: '1000',
            bairro: 'Bela Vista',
            cidade: 'São Paulo',
            cep: '01310-100'
          },
          ativo: true,
          totalCompras: 89.50
        }
      }),
      prisma.cliente.create({
        data: {
          nome: 'Ana Costa',
          email: 'ana@email.com',
          telefone: '(11) 77777-7777',
          ativo: true,
          totalCompras: 45.00
        }
      })
    ])

    console.log('🛒 Criando pedidos...')
    // Criar pedidos
    await Promise.all([
      prisma.pedido.create({
        data: {
          clienteId: clientes[0].id,
          subtotal: 45.00,
          desconto: 5.00,
          total: 40.00,
          status: 'concluido',
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
                precoUnitario: 35.00,
                subtotal: 35.00
              },
              {
                receitaId: croissant.id,
                quantidade: 2,
                precoUnitario: 3.50,
                subtotal: 7.00
              }
            ]
          }
        }
      }),
      prisma.pedido.create({
        data: {
          clienteId: clientes[1].id,
          subtotal: 21.00,
          desconto: 0,
          total: 21.00,
          status: 'pendente',
          tipo: 'delivery',
          formaPagamento: 'cartao',
          dataHoraEntrega: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 horas
          itens: {
            create: [
              {
                receitaId: paoFrances.id,
                quantidade: 20,
                precoUnitario: 0.50,
                subtotal: 10.00
              },
              {
                receitaId: croissant.id,
                quantidade: 3,
                precoUnitario: 3.50,
                subtotal: 10.50
              }
            ]
          }
        }
      })
    ])

    console.log('📋 Criando planos de produção...')
    // Criar planos de produção
    await Promise.all([
      prisma.planoProducao.create({
        data: {
          data: new Date(),
          status: 'em_andamento',
          observacoes: 'Produção para o dia - demanda alta',
          itens: {
            create: [
              {
                receitaId: paoFrances.id,
                quantidade: 200
              },
              {
                receitaId: croissant.id,
                quantidade: 50
              },
              {
                receitaId: boloChocolate.id,
                quantidade: 8
              }
            ]
          }
        }
      }),
      prisma.planoProducao.create({
        data: {
          data: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
          status: 'planejado',
          observacoes: 'Produção para amanhã',
          itens: {
            create: [
              {
                receitaId: paoFrances.id,
                quantidade: 150
              },
              {
                receitaId: boloChocolate.id,
                quantidade: 5
              }
            ]
          }
        }
      })
    ])
    
    console.log('✅ Banco de dados populado com sucesso!')
    console.log(`📊 Dados criados:`)
    console.log(`   - ${ingredientes.length} ingredientes`)
    console.log(`   - 3 receitas`)
    console.log(`   - ${clientes.length} clientes`)
    console.log(`   - 2 pedidos`)
    console.log(`   - 2 planos de produção`)
    
  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 