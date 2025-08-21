import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { planoId, itens, dataProducao, observacoes } = await request.json();

    // Buscar receitas para os itens
    const receitasIds = itens.map((item: any) => item.receitaId);
    const receitas = await prisma.receita.findMany({
      where: { id: { in: receitasIds } },
      include: {
        ingredientes: {
          include: {
            ingrediente: true
          }
        }
      }
    });

    // Buscar ingredientes para cálculos
    const ingredientes = await prisma.ingrediente.findMany();

    // Função para calcular ingredientes necessários
    const calcularIngredientesNecessarios = (itens: any[]) => {
      const ingredientesNecessarios: { [key: string]: number } = {};

      itens.forEach(item => {
        const receita = receitas.find(r => r.id === item.receitaId);
        if (!receita) return;

        const fatorMultiplicacao = item.quantidade / receita.rendimento;

        receita.ingredientes.forEach(ingredienteReceita => {
          let quantidadeIngrediente = 0;

          if (receita.sistemaCalculo === 'porcentagem') {
            const pesoBaseReceita = 1000;
            quantidadeIngrediente = (ingredienteReceita.quantidade / 100) * pesoBaseReceita;

            const pesoTotalReceitaBase = (receita.pesoUnitario || 0) * receita.rendimento;
            let somaPercentuais = 0;
            receita.ingredientes.forEach((ing: any) => {
              somaPercentuais += ing.quantidade;
            });
            const pesoTotalTeorico = (somaPercentuais / 100) * pesoBaseReceita;
            const fatorAjuste = pesoTotalReceitaBase / pesoTotalTeorico;
            quantidadeIngrediente = quantidadeIngrediente * fatorAjuste;
          } else {
            quantidadeIngrediente = ingredienteReceita.quantidade;
          }

          const quantidadeTotal = quantidadeIngrediente * fatorMultiplicacao;

          if (ingredientesNecessarios[ingredienteReceita.ingredienteId]) {
            ingredientesNecessarios[ingredienteReceita.ingredienteId] += quantidadeTotal;
          } else {
            ingredientesNecessarios[ingredienteReceita.ingredienteId] = quantidadeTotal;
          }
        });
      });

      return ingredientesNecessarios;
    };

    const ingredientesNecessarios = calcularIngredientesNecessarios(itens);

    // Gerar conteúdo do PDF
    let conteudo = '';
    
    // Cabeçalho
    conteudo += '========== GRANOBOX ==========\n';
    conteudo += '      PLANO DE PRODUÇÃO\n';
    conteudo += '==============================\n\n';

    // Informações do plano
    conteudo += `Data: ${new Date(dataProducao).toLocaleDateString('pt-BR')}\n`;
    conteudo += `Plano: Produção ${new Date(dataProducao).toLocaleDateString('pt-BR')}\n`;
    if (observacoes) {
      conteudo += `Observações: ${observacoes}\n`;
    }
    conteudo += '\n';

    // Resumo geral
    let tempoTotal = 0;
    let pesoTotal = 0;
    let custoTotal = 0;
    let formasTotal = 0;

    itens.forEach((item: any) => {
      const receita = receitas.find(r => r.id === item.receitaId);
      if (receita) {
        tempoTotal += (receita.tempoPreparo || 0) * item.quantidade;
        pesoTotal += (receita.pesoUnitario || 0) * item.quantidade;
        custoTotal += (receita.custoTotal || 0) * item.quantidade;
        formasTotal += item.quantidade;
      }
    });

    conteudo += '==============================\n';
    conteudo += 'RESUMO GERAL:\n';
    conteudo += '==============================\n';
    conteudo += `Total de Itens: ${formasTotal} unidades\n`;
    conteudo += `Peso Total: ${(pesoTotal / 1000).toFixed(2)} kg\n`;
    conteudo += `Tempo Total: ${Math.ceil(tempoTotal / 60)} horas\n`;
    conteudo += `Custo Total: R$ ${custoTotal.toFixed(2)}\n\n`;

    // Itens de produção
    conteudo += '==============================\n';
    conteudo += 'ITENS DE PRODUÇÃO:\n';
    conteudo += '==============================\n\n';

    itens.forEach((item: any, index: number) => {
      const receita = receitas.find(r => r.id === item.receitaId);
      if (!receita) return;

      conteudo += `${index + 1}. ${receita.nome.toUpperCase()}\n`;
      conteudo += `   Quantidade: ${item.quantidade} unidades\n`;
      conteudo += `   Rendimento: ${receita.rendimento} por receita\n`;
      if (receita.pesoUnitario) {
        conteudo += `   Peso unitário: ${receita.pesoUnitario}g\n`;
        conteudo += `   Peso total: ${(receita.pesoUnitario * item.quantidade / 1000).toFixed(2)}kg\n`;
      }
      conteudo += `   Tempo preparo: ${receita.tempoPreparo || 0} min/receita\n`;
      conteudo += `   Tempo total: ${((receita.tempoPreparo || 0) * item.quantidade / receita.rendimento).toFixed(0)} min\n`;
      conteudo += `   Custo unitário: R$ ${receita.custoTotal.toFixed(2)}\n`;
      conteudo += `   Custo total: R$ ${(receita.custoTotal * item.quantidade / receita.rendimento).toFixed(2)}\n`;
      
      if (receita.tamanhoForma) {
        conteudo += `   Forma: ${receita.tamanhoForma}\n`;
      }
      
      if (receita.instrucoes) {
        conteudo += `   Instruções: ${receita.instrucoes}\n`;
      }
      
      conteudo += '\n';
    });

    // Separação de ingredientes
    conteudo += '==============================\n';
    conteudo += 'SEPARAÇÃO DE INGREDIENTES:\n';
    conteudo += '==============================\n\n';

    // Ingredientes por receita
    itens.forEach((item: any) => {
      const receita = receitas.find(r => r.id === item.receitaId);
      if (!receita) return;

      conteudo += `--- ${receita.nome.toUpperCase()} (${item.quantidade}x) ---\n`;
      
      const fatorMultiplicacao = item.quantidade / receita.rendimento;
      
      receita.ingredientes.forEach(ingredienteReceita => {
        let quantidadeIngrediente = 0;
        
        if (receita.sistemaCalculo === 'porcentagem') {
          const pesoBaseReceita = 1000;
          quantidadeIngrediente = (ingredienteReceita.quantidade / 100) * pesoBaseReceita;
          
          const pesoTotalReceitaBase = (receita.pesoUnitario || 0) * receita.rendimento;
          let somaPercentuais = 0;
          receita.ingredientes.forEach((ing: any) => {
            somaPercentuais += ing.quantidade;
          });
          const pesoTotalTeorico = (somaPercentuais / 100) * pesoBaseReceita;
          const fatorAjuste = pesoTotalReceitaBase / pesoTotalTeorico;
          quantidadeIngrediente = quantidadeIngrediente * fatorAjuste;
        } else {
          quantidadeIngrediente = ingredienteReceita.quantidade;
        }
        
        const quantidadeTotal = quantidadeIngrediente * fatorMultiplicacao;
        const unidadeExibicao = ingredienteReceita.ingrediente?.unidade === 'kg' ? 'g' : 
                               ingredienteReceita.ingrediente?.unidade === 'l' ? 'ml' : 
                               ingredienteReceita.ingrediente?.unidade || 'g';
        
        conteudo += `□ ${ingredienteReceita.ingrediente?.nome}: ${Math.round(quantidadeTotal)}${unidadeExibicao}\n`;
      });
      conteudo += '\n';
    });

    // Total consolidado
    conteudo += '==============================\n';
    conteudo += 'TOTAL CONSOLIDADO:\n';
    conteudo += '==============================\n\n';

    for (const [ingredienteId, quantidade] of Object.entries(ingredientesNecessarios)) {
      const ingrediente = ingredientes.find(i => i.id === ingredienteId);
      const quantidadeFormatada = Math.round(quantidade as number);
      const unidadeExibicao = ingrediente?.unidade === 'kg' ? 'g' : 
                             ingrediente?.unidade === 'l' ? 'ml' : 
                             ingrediente?.unidade || 'g';
      conteudo += `${ingrediente?.nome || 'Ingrediente'}: ${quantidadeFormatada}${unidadeExibicao}\n`;
    }

    conteudo += '\n==============================\n';
    conteudo += 'Granobox - Sistema de Gestão\n';
    conteudo += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;

    return NextResponse.json({ 
      success: true, 
      conteudo 
    });

  } catch (error) {
    console.error('Erro ao gerar PDF do plano:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar PDF do plano' },
      { status: 500 }
    );
  }
} 