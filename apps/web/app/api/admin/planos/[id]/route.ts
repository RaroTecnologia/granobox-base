import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Buscar plano específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const plano = await prisma.plano.findUnique({
      where: {
        id: params.id
      }
    })

    if (!plano) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(plano)
  } catch (error) {
    console.error('Erro ao buscar plano:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar plano
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Validar dados obrigatórios
    if (!body.nome || !body.preco) {
      return NextResponse.json(
        { error: 'Nome e preço são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o plano existe
    const planoExistente = await prisma.plano.findUnique({
      where: { id: params.id }
    })

    if (!planoExistente) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já existe outro plano com o mesmo nome
    const planoComMesmoNome = await prisma.plano.findFirst({
      where: { 
        nome: body.nome,
        id: { not: params.id }
      }
    })

    if (planoComMesmoNome) {
      return NextResponse.json(
        { error: 'Já existe um plano com este nome' },
        { status: 400 }
      )
    }

    // Atualizar plano
    const plano = await prisma.plano.update({
      where: { id: params.id },
      data: {
        nome: body.nome,
        descricao: body.descricao,
        preco: body.preco,
        moeda: body.moeda || 'BRL',
        periodo: body.periodo || 'mensal',
        recursos: body.recursos || {
          usuarios: 1,
          receitas: 10,
          backup: false,
          suporte: 'email'
        },
        ativo: body.ativo !== undefined ? body.ativo : true
      }
    })

    return NextResponse.json({
      message: 'Plano atualizado com sucesso',
      plano
    })

  } catch (error) {
    console.error('Erro ao atualizar plano:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir plano
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se o plano existe
    const planoExistente = await prisma.plano.findUnique({
      where: { id: params.id },
      include: {
        assinaturas: true
      }
    })

    if (!planoExistente) {
      return NextResponse.json(
        { error: 'Plano não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se há assinaturas ativas usando este plano
    const assinaturasAtivas = planoExistente.assinaturas.filter(
      assinatura => assinatura.status === 'ativa'
    )

    if (assinaturasAtivas.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir um plano que possui assinaturas ativas' },
        { status: 400 }
      )
    }

    // Excluir plano
    await prisma.plano.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Plano excluído com sucesso'
    })

  } catch (error) {
    console.error('Erro ao excluir plano:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 