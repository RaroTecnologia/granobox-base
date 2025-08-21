import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '../../../../generated/prisma';

const prisma = new PrismaClient();

// POST - Operações em lote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'limpar':
        await prisma.itemListaCompras.deleteMany({});
        return NextResponse.json({ message: 'Lista limpa com sucesso' });

      case 'gerar-estoque-baixo':
        // Buscar ingredientes com estoque baixo
        const ingredientesEmFalta = await prisma.$queryRaw`
          SELECT * FROM ingredientes 
          WHERE "estoqueAtual" <= "estoqueMinimo"
        `;

        // Verificar quais já estão na lista
        const itensExistentes = await prisma.itemListaCompras.findMany({
          where: {
            ingredienteId: {
              in: (ingredientesEmFalta as any[]).map(i => i.id)
            },
            comprado: false
          }
        });

        const idsExistentes = itensExistentes.map(item => item.ingredienteId);
        const ingredientesNovos = (ingredientesEmFalta as any[]).filter(
          ingrediente => !idsExistentes.includes(ingrediente.id)
        );

        // Criar novos itens
        const novosItens = await Promise.all(
          ingredientesNovos.map(ingrediente =>
            prisma.itemListaCompras.create({
              data: {
                ingredienteId: ingrediente.id,
                nome: ingrediente.nome,
                quantidade: Math.max(1, ingrediente.estoqueMinimo - ingrediente.estoqueAtual),
                unidade: ingrediente.unidade,
                observacoes: 'Gerado automaticamente - estoque baixo'
              },
              include: {
                ingrediente: true
              }
            })
          )
        );

        return NextResponse.json({
          message: `${novosItens.length} ingredientes adicionados à lista`,
          itens: novosItens
        });

      case 'marcar-todos-comprados':
        await prisma.itemListaCompras.updateMany({
          where: { comprado: false },
          data: { comprado: true }
        });
        return NextResponse.json({ message: 'Todos os itens marcados como comprados' });

      case 'desmarcar-todos':
        await prisma.itemListaCompras.updateMany({
          where: { comprado: true },
          data: { comprado: false }
        });
        return NextResponse.json({ message: 'Todos os itens desmarcados' });

      case 'remover-comprados':
        const removidos = await prisma.itemListaCompras.deleteMany({
          where: { comprado: true }
        });
        return NextResponse.json({ 
          message: `${removidos.count} itens comprados removidos da lista` 
        });

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erro na operação em lote:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 