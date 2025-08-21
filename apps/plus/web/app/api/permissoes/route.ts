import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../../generated/prisma'

const prisma = new PrismaClient()

// GET - Buscar permissões disponíveis para usuários das organizações
export async function GET() {
  try {
    // Buscar apenas permissões que fazem sentido para usuários das organizações
    // (excluindo permissões administrativas do sistema)
    const permissoes = await prisma.permissao.findMany({
      where: {
        nome: {
          in: ['gerente', 'operador', 'visualizador']
        }
      },
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