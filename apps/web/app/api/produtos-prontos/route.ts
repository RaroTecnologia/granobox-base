import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../generated/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET - Listar produtos prontos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado ou sem organização' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const vencimento = searchParams.get('vencimento');
    const receita = searchParams.get('receita');

    let whereClause: any = {
      ativo: true,
      organizacaoId: session.user.organizacaoId
    };

    // Filtro por status de conservação
    if (status) {
      whereClause.statusConservacao = status;
    }

    // Filtro por receita
    if (receita) {
      whereClause.receitaId = receita;
    }

    // Filtro por vencimento
    if (vencimento === 'vencidos') {
      whereClause.dataValidade = {
        lt: new Date()
      };
    } else if (vencimento === 'vencendo') {
      const hoje = new Date();
      const em3Dias = new Date();
      em3Dias.setDate(hoje.getDate() + 3);
      
      whereClause.dataValidade = {
        gte: hoje,
        lte: em3Dias
      };
    }

    const produtos = await prisma.produtoPronto.findMany({
      where: whereClause,
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
      },
      orderBy: [
        { dataValidade: 'asc' },
        { dataProducao: 'desc' }
      ]
    });

    return NextResponse.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos prontos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo produto pronto
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado ou sem organização' },
        { status: 401 }
      );
    }

    const data = await request.json();

    // Validações
    if (!data.receitaId || !data.quantidade || !data.dataValidade || !data.statusConservacao) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: receitaId, quantidade, dataValidade, statusConservacao' },
        { status: 400 }
      );
    }

    // Gerar lote automaticamente se não fornecido
    const lote = data.lote || `L${Date.now()}`;

    const produto = await prisma.produtoPronto.create({
      data: {
        receitaId: data.receitaId,
        lote,
        quantidade: data.quantidade,
        unidade: data.unidade || 'unidade',
        statusConservacao: data.statusConservacao,
        dataProducao: data.dataProducao ? new Date(data.dataProducao) : new Date(),
        dataValidade: new Date(data.dataValidade),
        observacoes: data.observacoes,
        organizacaoId: session.user.organizacaoId,
        movimentacoes: {
          create: {
            tipo: 'entrada',
            quantidade: data.quantidade,
            motivo: 'Produção inicial',
            observacoes: `Lote ${lote} criado`
          }
        }
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
        movimentacoes: true
      }
    });

    return NextResponse.json(produto, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar produto pronto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 