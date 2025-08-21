import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    const users = await prisma.usuario.findMany({
      include: {
        organizacao: true,
      },
      take: 10, // Limitar a 10 usuários
    });

    return NextResponse.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        nome: user.nome,
        ativo: user.ativo,
        organizacaoId: user.organizacaoId,
        organizacao: user.organizacao ? {
          id: user.organizacao.id,
          nome: user.organizacao.nome,
          dominio: user.organizacao.dominio,
        } : null,
      }))
    });

  } catch (error) {
    console.error('❌ Mobile Users - Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 