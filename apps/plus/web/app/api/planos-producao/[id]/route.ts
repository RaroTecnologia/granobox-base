import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json({ error: 'Usuário não autenticado ou sem organização' }, { status: 401 });
    }

    const plano = await prisma.planoProducao.findFirst({
      where: {
        id: params.id,
        organizacaoId: session.user.organizacaoId
      },
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

    if (!plano) {
      return NextResponse.json(
        { error: 'Plano de produção não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(plano);
  } catch (error) {
    console.error('Erro ao buscar plano de produção:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 