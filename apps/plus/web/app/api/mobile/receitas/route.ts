import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Buscar todas as receitas
    const receitas = await prisma.receita.findMany({
      select: {
        id: true,
        nome: true,
        categoria: true,
        unidadeRendimento: true,
        descricao: true,
        dataCriacao: true,
        dataAtualizacao: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });

    console.log('📋 Mobile Receitas - Encontradas:', receitas.length);

    return NextResponse.json({
      success: true,
      receitas,
    });
  } catch (error) {
    console.error('❌ Mobile Receitas - Erro ao buscar receitas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 