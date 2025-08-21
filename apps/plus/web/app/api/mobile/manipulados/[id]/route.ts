import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// PUT - Atualizar manipulado
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📱 Mobile Manipulados - Atualizando manipulado:', params.id);
    
    const body = await request.json();
    
    // Validar dados obrigatórios
    if (body.quantidade === undefined) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Quantidade é obrigatória' 
        },
        { status: 400 }
      );
    }

    // Buscar o manipulado existente
    const manipuladoExistente = await prisma.manipulado.findUnique({
      where: {
        id: params.id
      }
    });

    if (!manipuladoExistente) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Manipulado não encontrado' 
        },
        { status: 404 }
      );
    }

    // Atualizar manipulado
    const manipulado = await prisma.manipulado.update({
      where: {
        id: params.id
      },
      data: {
        quantidade: body.quantidade || 0,
        conservacaoRecomendada: body.conservacaoRecomendada || manipuladoExistente.conservacaoRecomendada,
        dataAtualizacao: new Date(),
      },
      include: {
        receita: {
          select: {
            id: true,
            nome: true
          }
        },
        usuario: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    });

    // Se a quantidade mudou, criar movimentação
    if (body.quantidade !== manipuladoExistente.quantidade) {
      const diferenca = body.quantidade - manipuladoExistente.quantidade;
      const tipo = diferenca > 0 ? 'entrada' : 'saida';
      
      await prisma.movimentacaoManipulado.create({
        data: {
          manipuladoId: manipulado.id,
          tipo: tipo,
          quantidade: Math.abs(diferenca),
          quantidadeAnterior: manipuladoExistente.quantidade,
          quantidadeNova: body.quantidade,
          motivo: tipo === 'entrada' ? 'Ajuste de estoque - entrada' : 'Ajuste de estoque - saída',
          usuarioId: manipulado.usuarioCriacao,
          observacoes: 'Atualização via app mobile'
        }
      });
    }

    console.log('✅ Mobile Manipulados - Manipulado atualizado:', manipulado.id);

    return NextResponse.json({
      success: true,
      message: 'Manipulado atualizado com sucesso',
      manipulado
    });

  } catch (error) {
    console.error('❌ Mobile Manipulados - Erro ao atualizar:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET - Buscar manipulado específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📱 Mobile Manipulados - Buscando manipulado:', params.id);

    const manipulado = await prisma.manipulado.findUnique({
      where: {
        id: params.id
      },
      include: {
        receita: {
          select: {
            id: true,
            nome: true
          }
        },
        usuario: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    });

    if (!manipulado) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Manipulado não encontrado' 
        },
        { status: 404 }
      );
    }

    console.log('✅ Mobile Manipulados - Manipulado encontrado:', manipulado.id);

    return NextResponse.json({
      success: true,
      manipulado
    });

  } catch (error) {
    console.error('❌ Mobile Manipulados - Erro ao buscar:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 