import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    // Verificar se a organização paovivo existe
    let organizacao = await prisma.organizacao.findFirst({
      where: { dominio: 'paovivo' }
    });

    if (!organizacao) {
               // Criar organização se não existir
         organizacao = await prisma.organizacao.create({
           data: {
             nome: 'Pão Vivo Lab Bakery',
             email: 'contato@paovivo.com',
             dominio: 'paovivo',
             ativo: true,
           }
         });
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.usuario.findFirst({
      where: { email: 'paovivo.lab@gmail.com' }
    });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'Usuário já existe',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          nome: existingUser.nome,
          organizacaoId: existingUser.organizacaoId,
        }
      });
    }

    // Criar senha hash
    const hashedPassword = await bcrypt.hash('paovivo123', 10);

    // Criar usuário
    const user = await prisma.usuario.create({
      data: {
        email: 'paovivo.lab@gmail.com',
        nome: 'Pão Vivo Lab',
        senha: hashedPassword,
        ativo: true,
        organizacaoId: organizacao.id,
      },
      include: {
        organizacao: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        organizacaoId: user.organizacaoId,
        organizacao: user.organizacao ? {
          id: user.organizacao.id,
          nome: user.organizacao.nome,
          dominio: user.organizacao.dominio,
        } : null,
      }
    });

  } catch (error) {
    console.error('❌ Mobile Create Test User - Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 