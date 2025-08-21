import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Listar planos
export async function GET() {
  try {
    const planos = await prisma.plano.findMany({
      orderBy: {
        preco: 'asc'
      }
    })

    return NextResponse.json(planos)
  } catch (error) {
    console.error('Erro ao buscar planos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo plano
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados obrigatórios
    if (!body.nome || !body.preco) {
      return NextResponse.json(
        { error: 'Nome e preço são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se já existe um plano com o mesmo nome
    const planoExistente = await prisma.plano.findFirst({
      where: { nome: body.nome }
    })

    if (planoExistente) {
      return NextResponse.json(
        { error: 'Já existe um plano com este nome' },
        { status: 400 }
      )
    }

    // Criar plano
    const plano = await prisma.plano.create({
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
      message: 'Plano criado com sucesso',
      plano
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar plano:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 