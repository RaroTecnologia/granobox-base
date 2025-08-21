import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json({ error: 'Usuário não autenticado ou sem organização' }, { status: 401 })
    }

    const planos = await db.getPlanosProducao(session.user.organizacaoId)
    return NextResponse.json(planos)
  } catch (error) {
    console.error('Erro ao buscar planos de produção:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json({ error: 'Usuário não autenticado ou sem organização' }, { status: 401 })
    }

    const data = await request.json()
    
    // Validação básica
    if (!data.data || !data.itens || data.itens.length === 0) {
      return NextResponse.json(
        { error: 'Data e itens são obrigatórios' },
        { status: 400 }
      )
    }

    const novoPlano = await db.addPlanoProducao({
      data: new Date(data.data),
      status: data.status || 'planejado',
      observacoes: data.observacoes || '',
      itens: data.itens
    }, session.user.organizacaoId)

    return NextResponse.json(novoPlano, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar plano de produção:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 