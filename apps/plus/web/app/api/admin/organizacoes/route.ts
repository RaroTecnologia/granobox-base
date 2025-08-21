import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Listar organizações
export async function GET() {
  try {
    const organizacoes = await prisma.organizacao.findMany({
      include: {
        assinatura: {
          include: {
            plano: true
          }
        }
      },
      orderBy: {
        dataCadastro: 'desc'
      }
    })

    return NextResponse.json(organizacoes)
  } catch (error) {
    console.error('Erro ao buscar organizações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova organização
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados obrigatórios
    if (!body.nome || !body.email || !body.documento || !body.dominio || !body.planoId) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    // Verificar se o domínio já existe
    const dominioExistente = await prisma.organizacao.findUnique({
      where: { dominio: body.dominio }
    })

    if (dominioExistente) {
      return NextResponse.json(
        { error: 'Domínio já está em uso' },
        { status: 400 }
      )
    }

    // Verificar se o documento já existe
    const documentoExistente = await prisma.organizacao.findUnique({
      where: { documento: body.documento }
    })

    if (documentoExistente) {
      return NextResponse.json(
        { error: 'CPF/CNPJ já está cadastrado' },
        { status: 400 }
      )
    }

    // Criar organização
    const organizacao = await prisma.organizacao.create({
      data: {
        nome: body.nome,
        razaoSocial: body.razaoSocial,
        documento: body.documento,
        email: body.email,
        telefone: body.telefone,
        endereco: body.endereco,
        dominio: body.dominio,
        ativo: true
      }
    })

    // Criar assinatura
    const assinatura = await prisma.assinatura.create({
      data: {
        organizacaoId: organizacao.id,
        planoId: body.planoId,
        status: 'ativa',
        valor: body.valor || 0,
        moeda: 'BRL'
      }
    })

    // Criar configurações padrão
    await prisma.configuracaoOrganizacao.create({
      data: {
        organizacaoId: organizacao.id,
        tema: 'light',
        idioma: 'pt-BR',
        fusoHorario: 'America/Sao_Paulo',
        moeda: 'BRL',
        formatoData: 'dd/MM/yyyy',
        formatoHora: 'HH:mm'
      }
    })

    return NextResponse.json({
      message: 'Organização criada com sucesso',
      organizacao: {
        ...organizacao,
        assinatura
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar organização:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 