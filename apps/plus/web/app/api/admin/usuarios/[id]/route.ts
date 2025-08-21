import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../generated/prisma'

const prisma = new PrismaClient()

// GET - Buscar usuário por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: params.id },
      include: {
        organizacao: {
          select: {
            id: true,
            nome: true
          }
        },
        permissoes: {
          include: {
            permissao: {
              select: {
                id: true,
                nome: true,
                descricao: true
              }
            }
          }
        }
      }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Transformar os dados para o formato esperado pelo frontend
    const usuarioFormatado = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      ativo: usuario.ativo,
      dataCadastro: usuario.dataCadastro,
      organizacao: usuario.organizacao,
      permissoes: usuario.permissoes.map(p => p.permissao)
    }

    return NextResponse.json(usuarioFormatado)
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Verificar se o usuário existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: params.id }
    })

    if (!usuarioExistente) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Se o email foi alterado, verificar se já existe outro usuário com o mesmo email na mesma organização
    if (body.email && body.email !== usuarioExistente.email) {
      const emailExistente = await prisma.usuario.findFirst({
        where: { 
          email: body.email,
          organizacaoId: body.organizacaoId || null
        }
      })

      if (emailExistente) {
        return NextResponse.json(
          { error: 'Já existe um usuário com este email nesta organização' },
          { status: 400 }
        )
      }
    }

    // Preparar dados para atualização
    const dadosAtualizacao: any = {
      nome: body.nome,
      email: body.email,
      ativo: body.ativo,
      organizacaoId: body.organizacaoId || null
    }

    // Se uma nova senha foi fornecida, fazer o hash
    if (body.senha && body.senha.trim() !== '') {
      const bcrypt = require('bcryptjs')
      dadosAtualizacao.senha = await bcrypt.hash(body.senha, 12)
    }

    // Atualizar usuário
    const usuario = await prisma.usuario.update({
      where: { id: params.id },
      data: dadosAtualizacao,
      include: {
        organizacao: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    })

    // Se foram fornecidas permissões, atualizar as relações
    if (body.permissoes) {
      // Remover permissões existentes
      await prisma.permissaoUsuario.deleteMany({
        where: { usuarioId: params.id }
      })

      // Adicionar novas permissões
      if (body.permissoes.length > 0) {
        const permissoesData = body.permissoes.map((permissaoId: string) => ({
          usuarioId: params.id,
          permissaoId: permissaoId
        }))

        await prisma.permissaoUsuario.createMany({
          data: permissoesData
        })
      }
    }

    // Retornar usuário atualizado sem a senha
    const { senha, ...usuarioSemSenha } = usuario
    return NextResponse.json({
      message: 'Usuário atualizado com sucesso',
      usuario: usuarioSemSenha
    })

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar se o usuário existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: params.id }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Remover permissões do usuário
    await prisma.permissaoUsuario.deleteMany({
      where: { usuarioId: params.id }
    })

    // Deletar usuário
    await prisma.usuario.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Usuário deletado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 