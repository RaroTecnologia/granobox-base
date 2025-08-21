import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado ou sem organização' },
        { status: 401 }
      );
    }

    const configuracoes = await prisma.configuracaoImpressora.findMany({
      where: {
        organizacaoId: session.user.organizacaoId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(configuracoes);
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json(
        { error: 'Usuário não autenticado ou sem organização' },
        { status: 401 }
      );
    }

    const { nome, tipo, interface: interfaceStr, configuracao, largura } = await request.json();

    // Validar campos obrigatórios
    if (!nome || !tipo || !interfaceStr) {
      return NextResponse.json(
        { error: 'Nome, tipo e interface são obrigatórios' },
        { status: 400 }
      );
    }

    const novaConfiguracao = await prisma.configuracaoImpressora.create({
      data: {
        nome,
        tipo,
        interface: interfaceStr,
        configuracao: configuracao || null,
        largura: largura || 48,
        ativa: false,
        organizacaoId: session.user.organizacaoId
      }
    });

    return NextResponse.json(novaConfiguracao, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar configuração:', error);
    return NextResponse.json(
      { error: 'Erro ao criar configuração' },
      { status: 500 }
    );
  }
} 