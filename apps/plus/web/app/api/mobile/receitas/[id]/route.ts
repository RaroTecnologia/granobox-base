import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const receitaId = params.id;

    // Buscar receita com ingredientes e etapas
    const receita = await prisma.receita.findUnique({
      where: {
        id: receitaId,
      },
      include: {
        ingredientes: {
          include: {
            ingrediente: true,
          },
        },
        etapas: {
          orderBy: {
            ordem: 'asc',
          },
        },
      },
    });

    if (!receita) {
      return NextResponse.json(
        { success: false, error: 'Receita não encontrada' },
        { status: 404 }
      );
    }

    console.log('📋 Mobile Receita Detalhes - Encontrada:', receita.nome);

    return NextResponse.json({
      success: true,
      receita,
    });
  } catch (error) {
    console.error('❌ Mobile Receita Detalhes - Erro ao buscar receita:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 