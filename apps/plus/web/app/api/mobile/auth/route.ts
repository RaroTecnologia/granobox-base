import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, dominio } = await request.json();

    console.log('🔐 Mobile Auth - Tentativa de login:', {
      email,
      dominio,
      hasPassword: !!password
    });

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar usuário por email e domínio
    const user = await prisma.usuario.findFirst({
      where: {
        email: email,
        ativo: true,
        ...(dominio === 'admin' 
          ? { organizacaoId: null } // Admin do sistema
          : { 
              organizacao: {
                dominio: dominio
              }
            }
        )
      },
      include: {
        organizacao: true,
        permissoes: {
          include: {
            permissao: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ Mobile Auth - Usuário não encontrado');
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 401 }
      );
    }

    console.log('✅ Mobile Auth - Usuário encontrado:', {
      id: user.id,
      nome: user.nome,
      organizacaoId: user.organizacaoId,
      organizacao: user.organizacao?.nome
    });

    // Verificar senha
    if (!user.senha) {
      console.log('❌ Mobile Auth - Usuário sem senha');
      return NextResponse.json(
        { error: 'Usuário sem senha configurada' },
        { status: 401 }
      );
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.senha);
    
    if (!isPasswordValid) {
      console.log('❌ Mobile Auth - Senha inválida');
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 401 }
      );
    }

    console.log('✅ Mobile Auth - Senha válida');

    // Retornar dados do usuário (sem senha)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.nome,
      organizacaoId: user.organizacaoId || undefined,
      organizacao: user.organizacao ? {
        id: user.organizacao.id,
        nome: user.organizacao.nome
      } : undefined,
      permissoes: user.permissoes.map(p => p.permissao.nome),
      isAdmin: dominio === 'admin' || !user.organizacaoId
    };

    return NextResponse.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('❌ Mobile Auth - Erro na autenticação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 