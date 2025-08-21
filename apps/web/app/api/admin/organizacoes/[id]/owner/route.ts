import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../../generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// GET - Buscar o usuário owner da organização
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Buscar usuário com permissão de gerente na organização
    const owner = await prisma.usuario.findFirst({
      where: {
        organizacaoId: params.id,
        permissoes: {
          some: {
            permissao: {
              nome: 'gerente'
            }
          }
        }
      },
      include: {
        permissoes: {
          include: {
            permissao: true
          }
        }
      }
    })

    return NextResponse.json({ owner })
  } catch (error) {
    console.error('Erro ao buscar owner:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar usuário owner para a organização
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Validar dados obrigatórios
    if (!body.nome || !body.email || !body.senha) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se a organização existe
    const organizacao = await prisma.organizacao.findUnique({
      where: { id: params.id }
    })

    if (!organizacao) {
      return NextResponse.json(
        { error: 'Organização não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se já existe um owner para esta organização
    const ownerExistente = await prisma.usuario.findFirst({
      where: {
        organizacaoId: params.id,
        permissoes: {
          some: {
            permissao: {
              nome: 'gerente'
            }
          }
        }
      }
    })

    if (ownerExistente) {
      return NextResponse.json(
        { error: 'Esta organização já possui um usuário owner' },
        { status: 400 }
      )
    }

    // Verificar se já existe um usuário com o mesmo email na mesma organização
    const emailExistente = await prisma.usuario.findFirst({
      where: { 
        email: body.email,
        organizacaoId: params.id
      }
    })

    if (emailExistente) {
      return NextResponse.json(
        { error: 'Já existe um usuário com este email nesta organização' },
        { status: 400 }
      )
    }

    // Buscar permissão de gerente
    const permissaoGerente = await prisma.permissao.findFirst({
      where: { nome: 'gerente' }
    })

    if (!permissaoGerente) {
      return NextResponse.json(
        { error: 'Permissão de gerente não encontrada' },
        { status: 500 }
      )
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(body.senha, 12)

    // Criar usuário owner
    const owner = await prisma.usuario.create({
      data: {
        nome: body.nome,
        email: body.email,
        senha: senhaHash,
        ativo: true,
        organizacaoId: params.id
      }
    })

    // Atribuir permissão de gerente
    await prisma.permissaoUsuario.create({
      data: {
        usuarioId: owner.id,
        permissaoId: permissaoGerente.id
      }
    })

    // Retornar usuário criado sem a senha
    const { senha, ...ownerSemSenha } = owner
    return NextResponse.json({
      message: 'Owner criado com sucesso',
      owner: ownerSemSenha
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar owner:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar usuário owner da organização
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Buscar o owner atual
    const ownerAtual = await prisma.usuario.findFirst({
      where: {
        organizacaoId: params.id,
        permissoes: {
          some: {
            permissao: {
              nome: 'gerente'
            }
          }
        }
      }
    })

    if (!ownerAtual) {
      return NextResponse.json(
        { error: 'Owner não encontrado para esta organização' },
        { status: 404 }
      )
    }

    // Validar dados obrigatórios
    if (!body.nome || !body.email) {
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      )
    }

    // Se o email foi alterado, verificar se já existe outro usuário com o mesmo email na mesma organização
    if (body.email !== ownerAtual.email) {
      const emailExistente = await prisma.usuario.findFirst({
        where: { 
          email: body.email,
          organizacaoId: params.id
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
      email: body.email
    }

    // Se uma nova senha foi fornecida, fazer o hash
    if (body.senha && body.senha.trim() !== '') {
      dadosAtualizacao.senha = await bcrypt.hash(body.senha, 12)
    }

    // Atualizar usuário
    const owner = await prisma.usuario.update({
      where: { id: ownerAtual.id },
      data: dadosAtualizacao
    })

    // Retornar usuário atualizado sem a senha
    const { senha, ...ownerSemSenha } = owner
    return NextResponse.json({
      message: 'Owner atualizado com sucesso',
      owner: ownerSemSenha
    })

  } catch (error) {
    console.error('Erro ao atualizar owner:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 