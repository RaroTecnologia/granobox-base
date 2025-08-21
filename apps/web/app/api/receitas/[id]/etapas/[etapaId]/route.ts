import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../../generated/prisma';

const prisma = new PrismaClient();

// PUT - Atualizar etapa
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; etapaId: string } }
) {
  try {
    const data = await request.json();

    const etapa = await prisma.etapaReceita.update({
      where: {
        id: params.etapaId
      },
      data: {
        nome: data.nome,
        ordem: data.ordem,
        descricao: data.descricao,
        tempoMin: data.tempoMin,
        tempoMax: data.tempoMax,
        temperatura: data.temperatura,
        umidade: data.umidade,
        observacoes: data.observacoes
      }
    });

    return NextResponse.json(etapa);
  } catch (error) {
    console.error('Erro ao atualizar etapa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Remover etapa
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; etapaId: string } }
) {
  try {
    await prisma.etapaReceita.delete({
      where: {
        id: params.etapaId
      }
    });

    return NextResponse.json({ message: 'Etapa removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover etapa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 