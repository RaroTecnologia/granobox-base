import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// GET - Buscar tipo de manipulado por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📋 Buscando tipo de manipulado:', params.id);

    const tipo = await prisma.tipoManipulado.findUnique({
      where: {
        id: params.id
      }
    });

    if (!tipo) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Tipo de manipulado não encontrado' 
        },
        { status: 404 }
      );
    }

    console.log('✅ Tipo de manipulado encontrado');

    return NextResponse.json({
      success: true,
      tipo
    });

  } catch (error) {
    console.error('❌ Erro ao buscar tipo de manipulado:', error);
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

// PUT - Atualizar tipo de manipulado
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📋 Atualizando tipo de manipulado:', params.id);
    
    const body = await request.json();
    
    // Validar dados obrigatórios
    if (!body.nome || !body.categoria || !body.conservacaoRecomendada) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Nome, categoria e conservação recomendada são obrigatórios' 
        },
        { status: 400 }
      );
    }

    // Verificar se o tipo existe
    const tipoExistente = await prisma.tipoManipulado.findUnique({
      where: {
        id: params.id
      }
    });

    if (!tipoExistente) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Tipo de manipulado não encontrado' 
        },
        { status: 404 }
      );
    }

    // Verificar se já existe outro tipo com o mesmo nome na organização
    const nomeDuplicado = await prisma.tipoManipulado.findFirst({
      where: { 
        nome: body.nome,
        organizacaoId: tipoExistente.organizacaoId,
        id: {
          not: params.id
        }
      }
    });

    if (nomeDuplicado) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Já existe um tipo de manipulado com este nome na organização' 
        },
        { status: 400 }
      );
    }

    // Atualizar tipo de manipulado
    const tipo = await prisma.tipoManipulado.update({
      where: {
        id: params.id
      },
      data: {
        nome: body.nome,
        descricao: body.descricao || '',
        categoria: body.categoria,
        unidade: body.unidade || 'kg',
        estoqueMinimo: body.estoqueMinimo || 0,
        custoUnitario: body.custoUnitario || 0,
        conservacaoRecomendada: body.conservacaoRecomendada,
        validadeTemperaturaAmbiente: body.validadeTemperaturaAmbiente ? parseInt(body.validadeTemperaturaAmbiente) : null,
        validadeRefrigerado: body.validadeRefrigerado ? parseInt(body.validadeRefrigerado) : null,
        validadeCongelado: body.validadeCongelado ? parseInt(body.validadeCongelado) : null,
        instrucoes: body.instrucoes || '',
        ativo: body.ativo !== undefined ? body.ativo : true
      }
    });

    console.log('✅ Tipo de manipulado atualizado');

    return NextResponse.json({
      success: true,
      message: 'Tipo de manipulado atualizado com sucesso',
      tipo
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar tipo de manipulado:', error);
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

// DELETE - Excluir tipo de manipulado
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📋 Excluindo tipo de manipulado:', params.id);

    // Verificar se o tipo existe
    const tipoExistente = await prisma.tipoManipulado.findUnique({
      where: {
        id: params.id
      }
    });

    if (!tipoExistente) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Tipo de manipulado não encontrado' 
        },
        { status: 404 }
      );
    }

    // Verificar se existem manipulados usando este tipo
    const manipuladosUsandoTipo = await prisma.manipulado.findFirst({
      where: {
        tipoManipuladoId: params.id
      }
    });

    if (manipuladosUsandoTipo) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Não é possível excluir este tipo pois existem manipulados cadastrados que o utilizam' 
        },
        { status: 400 }
      );
    }

    // Excluir tipo de manipulado
    await prisma.tipoManipulado.delete({
      where: {
        id: params.id
      }
    });

    console.log('✅ Tipo de manipulado excluído');

    return NextResponse.json({
      success: true,
      message: 'Tipo de manipulado excluído com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao excluir tipo de manipulado:', error);
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