import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { nome, tipo, interface: interfaceStr, configuracao, largura } = await request.json();

    // Validar campos obrigatórios
    if (!nome || !tipo || !interfaceStr) {
      return NextResponse.json(
        { error: 'Nome, tipo e interface são obrigatórios' },
        { status: 400 }
      );
    }

    const configAtualizada = await prisma.configuracaoImpressora.update({
      where: { id: params.id },
      data: {
        nome,
        tipo,
        interface: interfaceStr,
        configuracao: configuracao || null,
        largura: largura || 48,
      }
    });

    return NextResponse.json(configAtualizada);
  } catch (error) {
    console.error('Erro ao atualizar configuração:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configuração' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.configuracaoImpressora.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir configuração:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir configuração' },
      { status: 500 }
    );
  }
} 