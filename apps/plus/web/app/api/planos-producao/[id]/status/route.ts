import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const planoId = params.id;

    // Validar status
    const statusValidos = ['planejado', 'em_producao', 'concluido', 'cancelado'];
    if (!statusValidos.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      );
    }

    // Buscar plano atual
    const planoAtual = await prisma.planoProducao.findUnique({
      where: { id: planoId },
      include: {
        itens: {
          include: {
            receita: {
              include: {
                ingredientes: {
                  include: {
                    ingrediente: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!planoAtual) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    // Validar transições de status
    const transicoesValidas: { [key: string]: string[] } = {
      'planejado': ['em_producao', 'cancelado'],
      'em_producao': ['concluido', 'cancelado'],
      'concluido': [], // Status final
      'cancelado': [] // Status final
    };

    if (!transicoesValidas[planoAtual.status].includes(status)) {
      return NextResponse.json(
        { error: `Não é possível mudar de ${planoAtual.status} para ${status}` },
        { status: 400 }
      );
    }

    // Se estiver finalizando a produção, atualizar estoque
    if (status === 'concluido' && planoAtual.status === 'em_producao') {
      await atualizarEstoque(planoAtual);
    }

    // Atualizar status do plano
    const planoAtualizado = await prisma.planoProducao.update({
      where: { id: planoId },
      data: { 
        status,
        dataAtualizacao: new Date()
      },
      include: {
        itens: {
          include: {
            receita: true
          }
        }
      }
    });

    return NextResponse.json(planoAtualizado);

  } catch (error) {
    console.error('Erro ao atualizar status do plano:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

async function atualizarEstoque(plano: any) {
  // Calcular ingredientes necessários
  const ingredientesNecessarios: { [key: string]: number } = {};

  for (const item of plano.itens) {
    const receita = item.receita;
    const fatorMultiplicacao = item.quantidade / receita.rendimento;

    for (const ingredienteReceita of receita.ingredientes) {
      let quantidadeIngrediente = 0;

      if (receita.sistemaCalculo === 'porcentagem') {
        const pesoBaseReceita = 1000;
        quantidadeIngrediente = (ingredienteReceita.quantidade / 100) * pesoBaseReceita;

        const pesoTotalReceitaBase = (receita.pesoUnitario || 0) * receita.rendimento;
        let somaPercentuais = 0;
        receita.ingredientes.forEach((ing: any) => {
          somaPercentuais += ing.quantidade;
        });
        const pesoTotalTeorico = (somaPercentuais / 100) * pesoBaseReceita;
        const fatorAjuste = pesoTotalReceitaBase / pesoTotalTeorico;
        quantidadeIngrediente = quantidadeIngrediente * fatorAjuste;
      } else {
        quantidadeIngrediente = ingredienteReceita.quantidade;
      }

      const quantidadeTotal = quantidadeIngrediente * fatorMultiplicacao;

      if (ingredientesNecessarios[ingredienteReceita.ingredienteId]) {
        ingredientesNecessarios[ingredienteReceita.ingredienteId] += quantidadeTotal;
      } else {
        ingredientesNecessarios[ingredienteReceita.ingredienteId] = quantidadeTotal;
      }
    }
  }

  // Atualizar estoque de cada ingrediente
  for (const [ingredienteId, quantidadeConsumida] of Object.entries(ingredientesNecessarios)) {
    const ingrediente = await prisma.ingrediente.findUnique({
      where: { id: ingredienteId }
    });

    if (ingrediente) {
      // Converter quantidade consumida para a unidade do estoque
      let quantidadeParaSubtrair = quantidadeConsumida;
      
      // Se o ingrediente está em kg e a receita em gramas, converter
      if (ingrediente.unidade === 'kg') {
        quantidadeParaSubtrair = quantidadeConsumida / 1000;
      }
      // Se o ingrediente está em litros e a receita em ml, converter
      else if (ingrediente.unidade === 'l') {
        quantidadeParaSubtrair = quantidadeConsumida / 1000;
      }

      // Atualizar estoque
      const novoEstoque = Math.max(0, ingrediente.estoqueAtual - quantidadeParaSubtrair);
      
      await prisma.ingrediente.update({
        where: { id: ingredienteId },
        data: { estoqueAtual: novoEstoque }
      });

      // Registrar movimentação
      await prisma.movimentacaoEstoque.create({
        data: {
          ingredienteId,
          tipo: 'saida',
          quantidade: quantidadeParaSubtrair,
          motivo: `Produção finalizada - Plano ${plano.id}`,
          usuario: 'Sistema'
        }
      });
    }
  }
} 