import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

// GET - Buscar produto pronto específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const produto = await prisma.produtoPronto.findUnique({
      where: { id: params.id },
      include: {
        receita: true,
        movimentacoes: {
          orderBy: {
            dataMovimento: 'desc'
          }
        }
      }
    });

    if (!produto) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(produto);
  } catch (error) {
    console.error('Erro ao buscar produto pronto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar produto pronto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();

    const produto = await prisma.produtoPronto.update({
      where: { id: params.id },
      data: {
        lote: data.lote,
        quantidade: data.quantidade,
        unidade: data.unidade,
        statusConservacao: data.statusConservacao,
        dataProducao: data.dataProducao ? new Date(data.dataProducao) : undefined,
        dataValidade: data.dataValidade ? new Date(data.dataValidade) : undefined,
        observacoes: data.observacoes,
        ativo: data.ativo
      },
      include: {
        receita: {
          select: {
            id: true,
            nome: true,
            categoria: true,
            precoVenda: true
          }
        },
        movimentacoes: {
          orderBy: {
            dataMovimento: 'desc'
          },
          take: 5
        }
      }
    });

    return NextResponse.json(produto);
  } catch (error) {
    console.error('Erro ao atualizar produto pronto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover produto pronto (desativar)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.produtoPronto.update({
      where: { id: params.id },
      data: { ativo: false }
    });

    return NextResponse.json({ message: 'Produto removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover produto pronto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 