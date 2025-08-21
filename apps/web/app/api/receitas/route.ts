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

    const receitas = await db.getReceitas(session.user.organizacaoId)
    return NextResponse.json(receitas)
  } catch (error) {
    console.error('Erro ao buscar receitas:', error)
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
    if (!data.nome || !data.categoria || !data.precoVenda) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    const novaReceita = await db.addReceita({
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

    return NextResponse.json(novaReceita, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar receita:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 