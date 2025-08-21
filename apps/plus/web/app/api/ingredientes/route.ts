import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const db = new DatabaseService()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json({ error: 'Usuário não autenticado ou sem organização' }, { status: 401 })
    }

    const ingredientes = await db.getIngredientes(session.user.organizacaoId)
    return NextResponse.json(ingredientes)
  } catch (error) {
    console.error('Erro ao buscar ingredientes:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
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
    if (!data.nome || !data.unidade) {
      return NextResponse.json(
        { error: 'Nome e unidade são obrigatórios' },
        { status: 400 }
      )
    }

    const novoIngrediente = await db.addIngrediente({
      nome: data.nome,
      unidade: data.unidade,
      custoUnitario: parseFloat(data.custoUnitario || 0),
      estoqueAtual: parseFloat(data.estoqueAtual || 0),
      estoqueMinimo: parseFloat(data.estoqueMinimo || 0),
      fornecedor: data.fornecedor || null,
      dataValidade: undefined,
    }, session.user.organizacaoId)

    return NextResponse.json(novoIngrediente, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar ingrediente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json({ error: 'Usuário não autenticado ou sem organização' }, { status: 401 })
    }

    const data = await request.json()
    
    if (!data.id) {
      return NextResponse.json(
        { error: 'ID é obrigatório para atualização' },
        { status: 400 }
      )
    }

    const ingredienteAtualizado = await db.updateIngrediente(data.id, {
      nome: data.nome,
      unidade: data.unidade,
      custoUnitario: parseFloat(data.custoUnitario || 0),
      estoqueAtual: parseFloat(data.estoqueAtual),
      estoqueMinimo: parseFloat(data.estoqueMinimo),
      fornecedor: data.fornecedor || null,
      dataValidade: undefined,
    }, session.user.organizacaoId)

    return NextResponse.json(ingredienteAtualizado)
  } catch (error) {
    console.error('Erro ao atualizar ingrediente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json({ error: 'Usuário não autenticado ou sem organização' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório para exclusão' },
        { status: 400 }
      )
    }

    await db.deleteIngrediente(id, session.user.organizacaoId)
    return NextResponse.json({ message: 'Ingrediente excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir ingrediente:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 