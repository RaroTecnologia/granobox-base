import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../../generated/prisma';

const prisma = new PrismaClient();

// GET - Listar etapas de uma receita
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const etapas = await prisma.etapaReceita.findMany({
      where: {
        receitaId: params.id
      },
      orderBy: {
        ordem: 'asc'
      }
    });

    return NextResponse.json(etapas);
  } catch (error) {
    console.error('Erro ao buscar etapas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova etapa
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    // Buscar a próxima ordem disponível
    const ultimaEtapa = await prisma.etapaReceita.findFirst({
      where: { receitaId: params.id },
      orderBy: { ordem: 'desc' }
    });
    
    const proximaOrdem = ultimaEtapa ? ultimaEtapa.ordem + 1 : 1;

    const etapa = await prisma.etapaReceita.create({
      data: {
        receitaId: params.id,
        nome: data.nome,
        ordem: data.ordem || proximaOrdem,
        descricao: data.descricao,
        tempoMin: data.tempoMin,
        tempoMax: data.tempoMax,
        temperatura: data.temperatura,
        umidade: data.umidade,
        observacoes: data.observacoes
      }
    });

    return NextResponse.json(etapa, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar etapa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 