import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// GET - Listar tipos de manipulados
export async function GET() {
  try {
    console.log('📋 Buscando tipos de manipulados...');

    const tipos = await prisma.tipoManipulado.findMany({
      where: {
        ativo: true
      },
      orderBy: {
        nome: 'asc'
      }
    });

    console.log('✅ Tipos de manipulados encontrados:', tipos.length);

    return NextResponse.json({
      success: true,
      tipos
    });

  } catch (error) {
    console.error('❌ Erro ao buscar tipos de manipulados:', error);
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

// POST - Criar novo tipo de manipulado
export async function POST(request: NextRequest) {
  try {
    console.log('📋 Criando novo tipo de manipulado...');
    
    const body = await request.json();
    
    // Validar dados obrigatórios
    if (!body.nome || !body.categoria || !body.conservacaoRecomendada) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Nome, categoria e conservação recomendada são obrigatórios' 
        },
        { status: 400 }
      );
    }

    // TODO: Implementar autenticação real
    // Por enquanto, vamos usar uma organização padrão
    const organizacaoId = 'cmdur6w2k00032fbgs39nsujk'; // ID da organização paovivo

    // Verificar se já existe um tipo com o mesmo nome na organização
    const tipoExistente = await prisma.tipoManipulado.findFirst({
      where: { 
        nome: body.nome,
        organizacaoId: organizacaoId
      }
    });

    if (tipoExistente) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Já existe um tipo de manipulado com este nome na organização' 
        },
        { status: 400 }
      );
    }

    // Criar tipo de manipulado
    const tipo = await prisma.tipoManipulado.create({
      data: {
        nome: body.nome,
        descricao: body.descricao || '',
        categoria: body.categoria,
        unidade: body.unidade || 'kg',
        estoqueMinimo: body.estoqueMinimo || 0,
        custoUnitario: body.custoUnitario || 0,
        conservacaoRecomendada: body.conservacaoRecomendada,
        validadeTemperaturaAmbiente: body.validadeTemperaturaAmbiente ? parseInt(body.validadeTemperaturaAmbiente) : null,
        validadeRefrigerado: body.validadeRefrigerado ? parseInt(body.validadeRefrigerado) : null,
        validadeCongelado: body.validadeCongelado ? parseInt(body.validadeCongelado) : null,
        instrucoes: body.instrucoes || '',
        ativo: body.ativo !== undefined ? body.ativo : true,
        organizacaoId: organizacaoId
      }
    });

    console.log('✅ Tipo de manipulado criado:', tipo.id);

    return NextResponse.json({
      success: true,
      message: 'Tipo de manipulado criado com sucesso',
      tipo
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Erro ao criar tipo de manipulado:', error);
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