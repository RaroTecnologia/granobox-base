import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../../../generated/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

// GET - Buscar manipulado por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json({ error: 'Usuário não autenticado ou sem organização' }, { status: 401 })
    }

    const manipulado = await prisma.manipulado.findFirst({
      where: { 
        id: params.id,
        organizacaoId: session.user.organizacaoId
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
        },
        movimentacoes: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true
              }
            }
          },
          orderBy: {
            dataMovimento: 'desc'
          }
        }
      }
    })

    if (!manipulado) {
      return NextResponse.json(
        { error: 'Manipulado não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(manipulado)
  } catch (error) {
    console.error('Erro ao buscar manipulado:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar manipulado
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json({ error: 'Usuário não autenticado ou sem organização' }, { status: 401 })
    }

    const body = await request.json()
    
    // Verificar se o manipulado existe e pertence à organização
    const manipuladoExistente = await prisma.manipulado.findFirst({
      where: { 
        id: params.id,
        organizacaoId: session.user.organizacaoId
      }
    })

    if (!manipuladoExistente) {
      return NextResponse.json(
        { error: 'Manipulado não encontrado' },
        { status: 404 }
      )
    }



    // Preparar dados para atualização
    const dadosAtualizacao: any = {
      nome: body.nome,
      descricao: body.descricao,
      categoria: body.categoria,
      unidade: body.unidade,
      estoqueMinimo: body.estoqueMinimo,
      custoUnitario: body.custoUnitario,
      conservacaoRecomendada: body.conservacaoRecomendada,
      validadeTemperaturaAmbiente: body.validadeTemperaturaAmbiente ? parseInt(body.validadeTemperaturaAmbiente) : null,
      validadeRefrigerado: body.validadeRefrigerado ? parseInt(body.validadeRefrigerado) : null,
      validadeCongelado: body.validadeCongelado ? parseInt(body.validadeCongelado) : null,
      instrucoes: body.instrucoes,
      ativo: body.ativo,
      receitaId: body.receitaId || null
    }

    // Atualizar manipulado
    const manipulado = await prisma.manipulado.update({
      where: { id: params.id },
      data: dadosAtualizacao,
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
    })

    return NextResponse.json({
      message: 'Manipulado atualizado com sucesso',
      manipulado
    })

  } catch (error) {
    console.error('Erro ao atualizar manipulado:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar manipulado
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json({ error: 'Usuário não autenticado ou sem organização' }, { status: 401 })
    }

    // Verificar se o manipulado existe e pertence à organização
    const manipulado = await prisma.manipulado.findFirst({
      where: { 
        id: params.id,
        organizacaoId: session.user.organizacaoId
      }
    })

    if (!manipulado) {
      return NextResponse.json(
        { error: 'Manipulado não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se há movimentações associadas
    const movimentacoes = await prisma.movimentacaoManipulado.findMany({
      where: { manipuladoId: params.id }
    })

    if (movimentacoes.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir um manipulado que possui movimentações' },
        { status: 400 }
      )
    }

    // Deletar manipulado
    await prisma.manipulado.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Manipulado deletado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar manipulado:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 