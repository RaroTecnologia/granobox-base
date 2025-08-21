import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { planoId, ingredientesNecessarios, itens, dataProducao } = await request.json();

    // Buscar ingredientes do banco
    const ingredientesDb = await prisma.ingrediente.findMany({
      where: {
        id: {
          in: Object.keys(ingredientesNecessarios)
        }
      }
    });

    // Gerar conteúdo do ticket
    let conteudo = '';
    conteudo += '========== GRANOBOX ==========\n';
    conteudo += '   SEPARAÇÃO DE INGREDIENTES\n';
    conteudo += '==============================\n\n';
    
    conteudo += `Data: ${new Date(dataProducao).toLocaleDateString('pt-BR')}\n`;
    conteudo += `Plano: Produção ${new Date(dataProducao).toLocaleDateString('pt-BR')}\n\n`;

    // Itens por receita
    for (const item of itens) {
      if (item.receita) {
        conteudo += `--- ${item.receita.nome.toUpperCase()} (${item.quantidade}x) ---\n`;
        
        // Calcular ingredientes para este item específico
        const fatorMultiplicacao = item.quantidade / item.receita.rendimento;
        
        for (const ingredienteReceita of item.receita.ingredientes) {
          let quantidadeIngrediente = 0;
          
          if (item.receita.sistemaCalculo === 'porcentagem') {
            const pesoBaseReceita = 1000;
            quantidadeIngrediente = (ingredienteReceita.quantidade / 100) * pesoBaseReceita;
            
            const pesoTotalReceitaBase = item.receita.pesoUnitario * item.receita.rendimento;
            let somaPercentuais = 0;
            item.receita.ingredientes.forEach((ing: any) => {
              somaPercentuais += ing.quantidade;
            });
            const pesoTotalTeorico = (somaPercentuais / 100) * pesoBaseReceita;
            const fatorAjuste = pesoTotalReceitaBase / pesoTotalTeorico;
            quantidadeIngrediente = quantidadeIngrediente * fatorAjuste;
          } else {
            quantidadeIngrediente = ingredienteReceita.quantidade;
          }
          
          const quantidadeTotal = quantidadeIngrediente * fatorMultiplicacao;
          const ingredienteDb = ingredientesDb.find(i => i.id === ingredienteReceita.ingredienteId);
          const unidadeExibicao = ingredienteDb?.unidade === 'kg' ? 'g' : 
                                 ingredienteDb?.unidade === 'L' ? 'ml' : 
                                 ingredienteDb?.unidade || 'g';
          
          conteudo += `□ ${ingredienteDb?.nome}: ${Math.round(quantidadeTotal)}${unidadeExibicao}\n`;
        }
        conteudo += '\n';
      }
    }

    // Separador
    conteudo += '==============================\n';
    conteudo += 'TOTAL GERAL:\n';

    // Total consolidado por ingrediente
    for (const [ingredienteId, quantidade] of Object.entries(ingredientesNecessarios)) {
      const ingrediente = ingredientesDb.find(i => i.id === ingredienteId);
      const quantidadeFormatada = Math.round(quantidade as number);
      const unidadeExibicao = ingrediente?.unidade === 'kg' ? 'g' : 
                             ingrediente?.unidade === 'L' ? 'ml' : 
                             ingrediente?.unidade || 'g';
      conteudo += `${ingrediente?.nome || 'Ingrediente'}: ${quantidadeFormatada}${unidadeExibicao}\n`;
    }

    conteudo += '==============================\n\n';
    conteudo += 'Granobox - Sistema de Gestão\n';
    conteudo += `Impresso em: ${new Date().toLocaleString('pt-BR')}\n`;

    return NextResponse.json({ 
      success: true, 
      message: 'Separação gerada com sucesso!',
      conteudo: conteudo
    });

  } catch (error) {
    console.error('Erro ao gerar separação:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar separação' },
      { status: 500 }
    );
  }
} 