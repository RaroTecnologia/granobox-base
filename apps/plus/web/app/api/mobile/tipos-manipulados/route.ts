import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    console.log('📱 Mobile Tipos Manipulados - Buscando tipos...');

    // TODO: Implementar autenticação real
    // Por enquanto, vamos buscar todos os tipos ativos
    const tipos = await prisma.tipoManipulado.findMany({
      where: {
        ativo: true
      },
      orderBy: {
        nome: 'asc'
      }
    });

    console.log('✅ Mobile Tipos Manipulados - Dados retornados:', tipos.length);

    return NextResponse.json({
      success: true,
      tipos
    });

  } catch (error) {
    console.error('❌ Mobile Tipos Manipulados - Erro:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 