import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Buscar todos os planos de produção
    const planos = await prisma.planoProducao.findMany({
      include: {
        itens: {
          include: {
            receita: {
              include: {
                etapas: true,
                ingredientes: {
                  include: {
                    ingrediente: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        dataCriacao: 'desc'
      },
      take: 50 // Limitar a 50 planos
    });

    console.log('📋 Mobile Planos - Encontrados:', planos.length);

    return NextResponse.json({
      success: true,
      planos: planos.map(plano => ({
        id: plano.id,
        data: plano.data,
        status: plano.status,
        observacoes: plano.observacoes,
        dataCriacao: plano.dataCriacao,
        dataAtualizacao: plano.dataAtualizacao,
        itens: plano.itens.map(item => ({
          id: item.id,
          receitaId: item.receitaId,
          quantidade: item.quantidade,
          receita: {
            id: item.receita.id,
            nome: item.receita.nome,
            descricao: item.receita.descricao,
            rendimento: item.receita.rendimento,
            unidadeRendimento: 'unidades', // Campo não existe no schema, usar padrão
            etapas: item.receita.etapas.map(etapa => ({
              id: etapa.id,
              nome: etapa.nome,
              descricao: etapa.descricao,
              ordem: etapa.ordem,
                             tempoMinutos: etapa.tempoMin || 0
            })),
            ingredientes: item.receita.ingredientes.map(ingrediente => ({
              id: ingrediente.id,
              ingredienteId: ingrediente.ingredienteId,
              quantidade: ingrediente.quantidade,
              ingrediente: {
                id: ingrediente.ingrediente.id,
                nome: ingrediente.ingrediente.nome,
                unidade: ingrediente.ingrediente.unidade,
                estoqueAtual: ingrediente.ingrediente.estoqueAtual
              }
            }))
          }
        }))
      }))
    });

  } catch (error) {
    console.error('❌ Mobile Planos - Erro ao buscar planos:', error);
    return NextResponse.json(
             { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 