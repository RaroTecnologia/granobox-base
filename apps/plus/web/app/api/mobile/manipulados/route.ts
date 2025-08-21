import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    console.log('📱 Mobile Manipulados - Buscando manipulados...');

    // TODO: Implementar autenticação real
    // Por enquanto, vamos buscar todos os manipulados
    const manipulados = await prisma.manipulado.findMany({
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
      },
      orderBy: {
        dataCriacao: 'desc'
      }
    });

    console.log('✅ Mobile Manipulados - Dados retornados:', manipulados.length);

    return NextResponse.json({
      success: true,
      manipulados
    });

  } catch (error) {
    console.error('❌ Mobile Manipulados - Erro:', error);
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

// POST - Criar novo manipulado
export async function POST(request: NextRequest) {
  try {
    console.log('📱 Mobile Manipulados - Criando novo manipulado...');
    
    const body = await request.json();
    
    // Validar dados obrigatórios
    if (!body.tipoManipuladoId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Tipo de manipulado é obrigatório' 
        },
        { status: 400 }
      );
    }

    // TODO: Implementar autenticação real
    // Por enquanto, vamos usar uma organização padrão
    const organizacaoId = 'cmdur6w2k00032fbgs39nsujk'; // ID da organização paovivo
    const usuarioId = 'cmdvjn9w100012ftm85ocxnzh'; // ID do usuário paovivo

    // Buscar o tipo de manipulado para preencher os dados
    const tipoManipulado = await prisma.tipoManipulado.findUnique({
      where: {
        id: body.tipoManipuladoId
      }
    });

    if (!tipoManipulado) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Tipo de manipulado não encontrado' 
        },
        { status: 400 }
      );
    }



    // Criar manipulado usando os dados do tipo
    const manipulado = await prisma.manipulado.create({
      data: {
        nome: tipoManipulado.nome,
        descricao: tipoManipulado.descricao,
        categoria: tipoManipulado.categoria,
        unidade: tipoManipulado.unidade,
        quantidade: body.quantidade || 0,
        estoqueMinimo: tipoManipulado.estoqueMinimo,
        custoUnitario: tipoManipulado.custoUnitario,
        conservacaoRecomendada: tipoManipulado.conservacaoRecomendada,
        dataManipulacao: new Date(),
        validadeTemperaturaAmbiente: tipoManipulado.validadeTemperaturaAmbiente,
        validadeRefrigerado: tipoManipulado.validadeRefrigerado,
        validadeCongelado: tipoManipulado.validadeCongelado,
        instrucoes: tipoManipulado.instrucoes,
        ativo: true,
        organizacaoId: organizacaoId,
        receitaId: body.receitaId || null,
        tipoManipuladoId: body.tipoManipuladoId,
        usuarioCriacao: usuarioId
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

    // Se foi criado com quantidade > 0, criar movimentação de entrada
    if (body.quantidade && body.quantidade > 0) {
      await prisma.movimentacaoManipulado.create({
        data: {
          manipuladoId: manipulado.id,
          tipo: 'entrada',
          quantidade: body.quantidade,
          quantidadeAnterior: 0,
          quantidadeNova: body.quantidade,
          motivo: 'Criação do manipulado',
          usuarioId: usuarioId,
          observacoes: 'Quantidade inicial do manipulado'
        }
      });
    }

    console.log('✅ Mobile Manipulados - Manipulado criado:', manipulado.id);

    return NextResponse.json({
      success: true,
      message: 'Manipulado criado com sucesso',
      manipulado
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Mobile Manipulados - Erro ao criar:', error);
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