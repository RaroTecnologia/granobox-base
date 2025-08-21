import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../../generated/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

// GET - Buscar usuários da organização atual
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json({ error: 'Usuário não autenticado ou sem organização' }, { status: 401 })
    }

    const organizacaoId = session.user.organizacaoId

    const usuarios = await prisma.usuario.findMany({
      where: {
        organizacaoId: organizacaoId
      },
      include: {
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
      },
      orderBy: {
        dataCadastro: 'desc'
      }
    })

    // Transformar os dados para o formato esperado pelo frontend
    const usuariosFormatados = usuarios.map(usuario => ({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      ativo: usuario.ativo,
      dataCadastro: usuario.dataCadastro,
      permissoes: usuario.permissoes.map(p => p.permissao)
    }))

    return NextResponse.json(usuariosFormatados)
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo usuário na organização atual
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.organizacaoId) {
      return NextResponse.json({ error: 'Usuário não autenticado ou sem organização' }, { status: 401 })
    }

    const body = await request.json()
    const organizacaoId = session.user.organizacaoId
    
    // Validar dados obrigatórios
    if (!body.nome || !body.email || !body.senha) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se já existe um usuário com o mesmo email na organização
    const usuarioExistente = await prisma.usuario.findFirst({
      where: { 
        email: body.email,
        organizacaoId: organizacaoId
      }
    })

    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'Já existe um usuário com este email na organização' },
        { status: 400 }
      )
    }

    // Hash da senha
    const bcrypt = require('bcryptjs')
    const senhaHash = await bcrypt.hash(body.senha, 12)

    // Criar usuário
    const usuario = await prisma.usuario.create({
      data: {
        nome: body.nome,
        email: body.email,
        senha: senhaHash,
        ativo: body.ativo !== undefined ? body.ativo : true,
        organizacaoId: organizacaoId
      },
      include: {
        organizacao: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    })

    // Se foram fornecidas permissões, criar as relações
    if (body.permissoes && body.permissoes.length > 0) {
      const permissoesData = body.permissoes.map((permissaoId: string) => ({
        usuarioId: usuario.id,
        permissaoId: permissaoId
      }))

      await prisma.permissaoUsuario.createMany({
        data: permissoesData
      })
    }

    // Retornar usuário criado sem a senha
    const { senha, ...usuarioSemSenha } = usuario
    return NextResponse.json({
      message: 'Usuário criado com sucesso',
      usuario: usuarioSemSenha
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 