import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../../../generated/prisma'

const prisma = new PrismaClient()

// GET - Buscar organizações disponíveis para um email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar usuários com este email
    const usuarios = await prisma.usuario.findMany({
      where: {
        email: email,
        ativo: true
      },
      include: {
        organizacao: {
          select: {
            id: true,
            nome: true,
            razaoSocial: true,
            documento: true,
            dominio: true
          }
        }
      }
    })

    // Formatar resposta
    const organizacoes = usuarios
      .filter(usuario => usuario.organizacao) // Apenas usuários com organização
      .map(usuario => ({
        id: usuario.organizacao!.id,
        nome: usuario.organizacao!.nome,
        razaoSocial: usuario.organizacao!.razaoSocial,
        documento: usuario.organizacao!.documento,
        dominio: usuario.organizacao!.dominio,
        cargo: usuario.cargo
      }))

    // Verificar se existe usuário admin
    const temAdmin = usuarios.some(usuario => !usuario.organizacaoId)

    return NextResponse.json({
      organizacoes,
      temAdmin,
      total: organizacoes.length + (temAdmin ? 1 : 0)
    })

  } catch (error) {
    console.error('Erro ao buscar organizações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 