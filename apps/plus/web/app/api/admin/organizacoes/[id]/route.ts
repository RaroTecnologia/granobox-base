import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../generated/prisma'

const prisma = new PrismaClient()

// GET - Buscar organização específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const organizacao = await prisma.organizacao.findUnique({
      where: {
        id: params.id
      },
      include: {
        assinatura: {
          include: {
            plano: true
          }
        }
      }
    })

    if (!organizacao) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(organizacao)
  } catch (error) {
    console.error('Erro ao buscar organização:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar organização
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Validar dados obrigatórios
    if (!body.nome || !body.email) {
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se a organização existe
    const organizacaoExistente = await prisma.organizacao.findUnique({
      where: { id: params.id }
    })

    if (!organizacaoExistente) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se já existe outra organização com o mesmo email
    const organizacaoComMesmoEmail = await prisma.organizacao.findFirst({
      where: { 
        email: body.email,
        id: { not: params.id }
      }
    })

    if (organizacaoComMesmoEmail) {
      return NextResponse.json(
        { error: 'Já existe uma organização com este email' },
        { status: 400 }
      )
    }

    // Verificar se já existe outra organização com o mesmo documento
    if (body.documento) {
      const organizacaoComMesmoDocumento = await prisma.organizacao.findFirst({
        where: { 
          documento: body.documento,
          id: { not: params.id }
        }
      })

      if (organizacaoComMesmoDocumento) {
        return NextResponse.json(
          { error: 'Já existe uma organização com este documento' },
          { status: 400 }
        )
      }
    }

    // Atualizar organização
    const organizacao = await prisma.organizacao.update({
      where: { id: params.id },
      data: {
        nome: body.nome,
        razaoSocial: body.razaoSocial,
        documento: body.documento,
        email: body.email,
        telefone: body.telefone,
        endereco: body.endereco,
        ativo: body.ativo !== undefined ? body.ativo : true
      },
      include: {
        assinatura: {
          include: {
            plano: true
          }
        }
      }
    })

    // Se foi fornecido um novo plano, atualizar a assinatura
    if (body.planoId && body.planoId !== organizacao.assinatura?.planoId) {
      // Se já existe uma assinatura, atualizar
      if (organizacao.assinatura) {
        await prisma.assinatura.update({
          where: { id: organizacao.assinatura.id },
          data: {
            planoId: body.planoId,
            dataAtualizacao: new Date()
          }
        })
      } else {
        // Criar nova assinatura
        await prisma.assinatura.create({
          data: {
            organizacaoId: organizacao.id,
            planoId: body.planoId,
            status: 'ativa',
            valor: 0, // Será calculado baseado no plano
            moeda: 'BRL'
          }
        })
      }
    }

    return NextResponse.json({
      message: 'Organização atualizada com sucesso',
      organizacao
    })

  } catch (error) {
    console.error('Erro ao atualizar organização:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir organização
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se a organização existe
    const organizacaoExistente = await prisma.organizacao.findUnique({
      where: { id: params.id },
      include: {
        assinatura: true,
        usuarios: true,
        ingredientes: true,
        receitas: true,
        clientes: true,
        pedidos: true
      }
    })

    if (!organizacaoExistente) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se há dados associados
    const temDados = organizacaoExistente.usuarios.length > 0 ||
                    organizacaoExistente.ingredientes.length > 0 ||
                    organizacaoExistente.receitas.length > 0 ||
                    organizacaoExistente.clientes.length > 0 ||
                    organizacaoExistente.pedidos.length > 0

    if (temDados) {
      return NextResponse.json(
        { error: 'Não é possível excluir uma organização que possui dados associados' },
        { status: 400 }
      )
    }

    // Excluir organização (cascade irá excluir assinatura e configurações)
    await prisma.organizacao.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Organização excluída com sucesso'
    })

  } catch (error) {
    console.error('Erro ao excluir organização:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 