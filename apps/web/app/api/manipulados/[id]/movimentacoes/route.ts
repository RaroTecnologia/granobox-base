import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../generated/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

// GET - Buscar movimentações de um manipulado
export async function GET(
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

    const movimentacoes = await prisma.movimentacaoManipulado.findMany({
      where: { manipuladoId: params.id },
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
    })

    return NextResponse.json(movimentacoes)
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova movimentação
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json({ error: 'Usuário não autenticado ou sem organização' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validar dados obrigatórios
    if (!body.tipo || !body.quantidade || !body.motivo) {
      return NextResponse.json(
        { error: 'Tipo, quantidade e motivo são obrigatórios' },
        { status: 400 }
      )
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

    const quantidadeAnterior = manipulado.quantidade
    let quantidadeNova = quantidadeAnterior

    // Calcular nova quantidade baseada no tipo de movimentação
    switch (body.tipo) {
      case 'entrada':
        quantidadeNova = quantidadeAnterior + body.quantidade
        break
      case 'saida':
        if (quantidadeAnterior < body.quantidade) {
          return NextResponse.json(
            { error: 'Quantidade insuficiente em estoque' },
            { status: 400 }
          )
        }
        quantidadeNova = quantidadeAnterior - body.quantidade
        break
      case 'ajuste':
        quantidadeNova = body.quantidade
        break
      case 'vencimento':
        if (quantidadeAnterior < body.quantidade) {
          return NextResponse.json(
            { error: 'Quantidade insuficiente em estoque' },
            { status: 400 }
          )
        }
        quantidadeNova = quantidadeAnterior - body.quantidade
        break
      default:
        return NextResponse.json(
          { error: 'Tipo de movimentação inválido' },
          { status: 400 }
        )
    }

    // Criar movimentação
    const movimentacao = await prisma.movimentacaoManipulado.create({
      data: {
        manipuladoId: params.id,
        tipo: body.tipo,
        quantidade: body.quantidade,
        quantidadeAnterior,
        quantidadeNova,
        motivo: body.motivo,
        usuarioId: session.user.id,
        observacoes: body.observacoes
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    })

    // Atualizar quantidade do manipulado
    await prisma.manipulado.update({
      where: { id: params.id },
      data: { quantidade: quantidadeNova }
    })

    return NextResponse.json({
      message: 'Movimentação criada com sucesso',
      movimentacao
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar movimentação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 