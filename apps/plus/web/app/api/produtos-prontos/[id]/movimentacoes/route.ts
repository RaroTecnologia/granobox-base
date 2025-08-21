import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../generated/prisma';

const prisma = new PrismaClient();

// POST - Criar movimentação
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    // Validações
    if (!data.tipo || !data.quantidade || !data.motivo) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: tipo, quantidade, motivo' },
        { status: 400 }
      );
    }

    // Buscar produto atual
    const produto = await prisma.produtoPronto.findUnique({
      where: { id: params.id }
    });

    if (!produto) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Calcular nova quantidade
    let novaQuantidade = produto.quantidade;
    if (data.tipo === 'entrada' || data.tipo === 'ajuste_positivo') {
      novaQuantidade += data.quantidade;
    } else if (data.tipo === 'saida' || data.tipo === 'ajuste_negativo' || data.tipo === 'vencimento') {
      novaQuantidade -= data.quantidade;
    }

    // Validar se não ficará negativo
    if (novaQuantidade < 0) {
      return NextResponse.json(
        { error: 'Quantidade insuficiente em estoque' },
        { status: 400 }
      );
    }

    // Criar movimentação e atualizar produto em transação
    const resultado = await prisma.$transaction([
      // Criar movimentação
      prisma.movimentacaoProdutoPronto.create({
        data: {
          produtoProntoId: params.id,
          tipo: data.tipo,
          quantidade: data.quantidade,
          motivo: data.motivo,
          usuario: data.usuario,
          observacoes: data.observacoes
        }
      }),
      // Atualizar quantidade do produto
      prisma.produtoPronto.update({
        where: { id: params.id },
        data: { quantidade: novaQuantidade }
      })
    ]);

    // Buscar produto atualizado com movimentações
    const produtoAtualizado = await prisma.produtoPronto.findUnique({
      where: { id: params.id },
      include: {
        receita: {
          select: {
            id: true,
            nome: true,
            categoria: true
          }
        },
        movimentacoes: {
          orderBy: {
            dataMovimento: 'desc'
          },
          take: 10
        }
      }
    });

    return NextResponse.json(produtoAtualizado, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar movimentação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 