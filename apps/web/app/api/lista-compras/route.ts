import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET - Listar todos os itens da lista de compras
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json({ error: 'Usuário não autenticado ou sem organização' }, { status: 401 });
    }

    const itens = await prisma.itemListaCompras.findMany({
      where: {
        ingrediente: {
          organizacaoId: session.user.organizacaoId
        }
      },
      include: {
        ingrediente: true
      },
      orderBy: [
        { comprado: 'asc' },
        { adicionadoEm: 'desc' }
      ]
    });

    return NextResponse.json(itens);
  } catch (error) {
    console.error('Erro ao buscar lista de compras:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Adicionar item à lista de compras
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json({ error: 'Usuário não autenticado ou sem organização' }, { status: 401 });
    }

    const body = await request.json();
    const { ingredienteId, quantidade, observacoes } = body;

    if (!ingredienteId || !quantidade) {
      return NextResponse.json(
        { error: 'Ingrediente e quantidade são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar dados do ingrediente
    const ingrediente = await prisma.ingrediente.findFirst({
      where: { 
        id: ingredienteId,
        organizacaoId: session.user.organizacaoId
      }
    });

    if (!ingrediente) {
      return NextResponse.json(
        { error: 'Ingrediente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já existe um item para este ingrediente
    const itemExistente = await prisma.itemListaCompras.findFirst({
      where: { 
        ingredienteId,
        comprado: false
      }
    });

    if (itemExistente) {
      // Atualizar quantidade do item existente
      const itemAtualizado = await prisma.itemListaCompras.update({
        where: { id: itemExistente.id },
        data: {
          quantidade: itemExistente.quantidade + parseFloat(quantidade),
          observacoes: observacoes || itemExistente.observacoes
        },
        include: {
          ingrediente: true
        }
      });

      return NextResponse.json(itemAtualizado);
    } else {
      // Criar novo item
      const novoItem = await prisma.itemListaCompras.create({
        data: {
          ingredienteId,
          nome: ingrediente.nome,
          quantidade: parseFloat(quantidade),
          unidade: ingrediente.unidade,
          observacoes
        },
        include: {
          ingrediente: true
        }
      });

      return NextResponse.json(novoItem);
    }
  } catch (error) {
    console.error('Erro ao adicionar item à lista:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar item da lista de compras
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, quantidade, observacoes, comprado } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do item é obrigatório' },
        { status: 400 }
      );
    }

    const itemAtualizado = await prisma.itemListaCompras.update({
      where: { id },
      data: {
        ...(quantidade !== undefined && { quantidade: parseFloat(quantidade) }),
        ...(observacoes !== undefined && { observacoes }),
        ...(comprado !== undefined && { comprado })
      },
      include: {
        ingrediente: true
      }
    });

    return NextResponse.json(itemAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar item da lista:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover item da lista de compras
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do item é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.itemListaCompras.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Item removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover item da lista:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 