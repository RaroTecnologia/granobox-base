import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    // Verificar se há planos de produção
    const planos = await prisma.planoProducao.findMany({
      take: 5
    });

    // Verificar se há receitas
    const receitas = await prisma.receita.findMany({
      take: 5
    });

    return NextResponse.json({
      success: true,
      debug: {
        planosCount: planos.length,
        receitasCount: receitas.length,
                 planos: planos.map(p => ({
           id: p.id,
           status: p.status,
           data: p.data,
           observacoes: p.observacoes
         })),
        receitas: receitas.map(r => ({
          id: r.id,
          nome: r.nome,
          rendimento: r.rendimento
        }))
      }
    });

  } catch (error) {
    console.error('❌ Mobile Debug Planos - Erro:', error);
    return NextResponse.json(
             { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 