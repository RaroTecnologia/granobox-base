import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../../generated/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

// GET - Buscar manipulados da organização atual
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 })
    }

    // Se for admin do sistema, não pode acessar manipulados (não tem organização)
    if (session.user.isAdmin && !session.user.organizacaoId) {
      return NextResponse.json({ error: 'Administradores do sistema não podem acessar manipulados' }, { status: 403 })
    }

    if (!session.user.organizacaoId) {
      return NextResponse.json({ error: 'Usuário sem organização associada' }, { status: 403 })
    }

    const manipulados = await prisma.manipulado.findMany({
      where: {
        organizacaoId: session.user.organizacaoId
      },
      include: {
        receita: {
          select: {
            id: true,
            nome: true
          }
        },
        usuario: {
          select: {
            id: true,
            nome: true
          }
        }
      },
      orderBy: {
        dataCriacao: 'desc'
      }
    })

    return NextResponse.json(manipulados)
  } catch (error) {
    console.error('Erro ao buscar manipulados:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo manipulado
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json({ error: 'Usuário não autenticado ou sem organização' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validar dados obrigatórios
    if (!body.nome || !body.categoria || !body.conservacaoRecomendada) {
      return NextResponse.json(
        { error: 'Nome, categoria e conservação recomendada são obrigatórios' },
        { status: 400 }
      )
    }

    // Criar manipulado
    const manipulado = await prisma.manipulado.create({
      data: {
        nome: body.nome,
        descricao: body.descricao,
        categoria: body.categoria,
        unidade: body.unidade || 'kg',
        quantidade: body.quantidade || 0,
        estoqueMinimo: body.estoqueMinimo || 0,
        custoUnitario: body.custoUnitario || 0,
        conservacaoRecomendada: body.conservacaoRecomendada,
        dataManipulacao: new Date(),
        validadeTemperaturaAmbiente: body.validadeTemperaturaAmbiente ? parseInt(body.validadeTemperaturaAmbiente) : null,
        validadeRefrigerado: body.validadeRefrigerado ? parseInt(body.validadeRefrigerado) : null,
        validadeCongelado: body.validadeCongelado ? parseInt(body.validadeCongelado) : null,
        instrucoes: body.instrucoes,
        ativo: body.ativo !== undefined ? body.ativo : true,
        organizacaoId: session.user.organizacaoId,
        receitaId: body.receitaId || null,
        usuarioCriacao: session.user.id
      },
      include: {
        receita: {
          select: {
            id: true,
            nome: true
          }
        },
        usuario: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    })

    // Se foi criado com quantidade > 0, criar movimentação de entrada
    if (body.quantidade && body.quantidade > 0) {
      await prisma.movimentacaoManipulado.create({
        data: {
          manipuladoId: manipulado.id,
          tipo: 'entrada',
          quantidade: body.quantidade,
          quantidadeAnterior: 0,
          quantidadeNova: body.quantidade,
          motivo: 'Criação do manipulado',
          usuarioId: session.user.id,
          observacoes: 'Quantidade inicial do manipulado'
        }
      })
    }

    return NextResponse.json({
      message: 'Manipulado criado com sucesso',
      manipulado
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar manipulado:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 