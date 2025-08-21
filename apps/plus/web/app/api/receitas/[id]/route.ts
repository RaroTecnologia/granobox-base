import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json({ error: 'Usuário não autenticado ou sem organização' }, { status: 401 })
    }

    const { id } = params
    
    const receita = await db.getReceita(id, session.user.organizacaoId)
    
    if (!receita) {
      return NextResponse.json({ error: 'Receita não encontrada' }, { status: 404 })
    }

    return NextResponse.json(receita)
  } catch (error) {
    console.error('Erro ao buscar receita:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json({ error: 'Usuário não autenticado ou sem organização' }, { status: 401 })
    }

    const data = await request.json()
    const { id } = params
    
    // Validação básica
    if (!data.nome || !data.categoria || !data.precoVenda) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    const receitaAtualizada = await db.updateReceita(id, {
      nome: data.nome,
      descricao: data.descricao || '',
      categoria: data.categoria,
      rendimento: data.rendimento || 1,
      tempoPreparo: data.tempoPreparo || 0,
      custoTotal: data.custoTotal || 0,
      precoVenda: data.precoVenda,
      instrucoes: data.instrucoes || '',
      tamanhoForma: data.tamanhoForma || null,
      pesoUnitario: data.pesoUnitario || null,
      sistemaCalculo: data.sistemaCalculo || 'peso',
      pesoTotalBase: data.pesoTotalBase || null,
      ativo: data.ativo !== false,
      ingredientes: data.ingredientes || [],
      etapas: data.etapas || []
    }, session.user.organizacaoId)

    if (!receitaAtualizada) {
      return NextResponse.json({ error: 'Receita não encontrada' }, { status: 404 })
    }

    return NextResponse.json(receitaAtualizada)
  } catch (error) {
    console.error('Erro ao atualizar receita:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json({ error: 'Usuário não autenticado ou sem organização' }, { status: 401 })
    }

    const { id } = params
    
    await db.deleteReceita(id, session.user.organizacaoId)
    
    return NextResponse.json({ message: 'Receita excluída com sucesso' })
  } catch (error: any) {
    console.error('Erro ao excluir receita:', error)
    
    // Se for erro de registro não encontrado
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Receita não encontrada' }, { status: 404 })
    }
    
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 