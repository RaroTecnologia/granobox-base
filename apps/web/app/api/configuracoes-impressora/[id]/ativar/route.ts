import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Primeiro, desativar todas as configurações
    await prisma.configuracaoImpressora.updateMany({
      data: {
        ativa: false
      }
    });

    // Depois, ativar apenas a selecionada
    const configuracao = await prisma.configuracaoImpressora.update({
      where: { id: params.id },
      data: {
        ativa: true
      }
    });

    return NextResponse.json(configuracao);
  } catch (error) {
    console.error('Erro ao ativar configuração:', error);
    return NextResponse.json(
      { error: 'Erro ao ativar configuração' },
      { status: 500 }
    );
  }
} 