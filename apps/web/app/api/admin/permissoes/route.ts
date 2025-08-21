import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../../../generated/prisma'

const prisma = new PrismaClient()

// GET - Buscar todas as permissões
export async function GET() {
  try {
    const permissoes = await prisma.permissao.findMany({
      orderBy: {
        nome: 'asc'
      }
    })

    return NextResponse.json(permissoes)
  } catch (error) {
    console.error('Erro ao buscar permissões:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova permissão
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados obrigatórios
    if (!body.nome || !body.descricao) {
      return NextResponse.json(
        { error: 'Nome e descrição são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se já existe uma permissão com o mesmo nome
    const permissaoExistente = await prisma.permissao.findFirst({
      where: { nome: body.nome }
    })

    if (permissaoExistente) {
      return NextResponse.json(
        { error: 'Já existe uma permissão com este nome' },
        { status: 400 }
      )
    }

    // Criar permissão
    const permissao = await prisma.permissao.create({
      data: {
        nome: body.nome,
        descricao: body.descricao,
        recursos: body.recursos || {},
        ativo: body.ativo !== undefined ? body.ativo : true
      }
    })

    return NextResponse.json({
      message: 'Permissão criada com sucesso',
      permissao
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar permissão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 