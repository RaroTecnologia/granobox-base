import { NextRequest, NextResponse } from 'next/server';
import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer';
import { prisma } from '@/lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join } from 'path';
// Import do sharp removido do topo para evitar falhas de load no ambiente de produção

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { planoId, ingredientesNecessarios, itens, dataProducao, clientAgent } = await request.json();

    // Buscar configuração ativa da impressora
    const configImpressora = await prisma.configuracaoImpressora.findFirst({
      where: { ativa: true }
    });

    if (!configImpressora) {
      return NextResponse.json(
        { error: 'Nenhuma impressora configurada. Configure uma impressora em Configurações > Impressora.' },
        { status: 400 }
      );
    }

    // Buscar ingredientes do banco para usar no conteúdo
    const ingredientesDb = await prisma.ingrediente.findMany({
      where: {
        id: {
          in: Object.keys(ingredientesNecessarios)
        }
      }
    });
    // Mapear tipo da impressora
    let printerType;
    switch (configImpressora.tipo) {
      case 'EPSON':
        printerType = PrinterTypes.EPSON;
        break;
      case 'STAR':
        printerType = PrinterTypes.STAR;
        break;
      default:
        printerType = PrinterTypes.EPSON;
    }

    // Se o cliente solicitou apenas o payload para o Agent, gerar e retornar base64
    if (clientAgent === true) {
      try {
        const printer = new ThermalPrinter({
          type: PrinterTypes.EPSON,
          interface: 'buffer',
          characterSet: CharacterSet.PC860_PORTUGUESE,
          width: configImpressora.largura,
          removeSpecialCharacters: false,
          breakLine: BreakLine.WORD,
        })
        // Cabeçalho
        printer.alignCenter();
        printer.setTextSize(1, 0);
        printer.println('SEPARAÇÃO DE')
        printer.println('INGREDIENTES')
        printer.setTextSize(0, 0)
        printer.newLine()
        printer.alignLeft()
        for (const item of itens) {
          if (item.receita) {
            printer.bold(true)
            printer.println(`--- ${item.receita.nome.toUpperCase()} (${item.quantidade}x) ---`)
            printer.bold(false)
            const fatorMultiplicacao = item.quantidade / item.receita.rendimento
            for (const ingredienteReceita of item.receita.ingredientes) {
              let quantidadeIngrediente = ingredienteReceita.quantidade
              if (item.receita.sistemaCalculo === 'porcentagem') {
                const pesoBaseReceita = 1000
                quantidadeIngrediente = (ingredienteReceita.quantidade / 100) * pesoBaseReceita
                const pesoTotalReceitaBase = item.receita.pesoUnitario * item.receita.rendimento
                let somaPercentuais = 0
                item.receita.ingredientes.forEach((ing: any) => { somaPercentuais += ing.quantidade })
                const pesoTotalTeorico = (somaPercentuais / 100) * pesoBaseReceita
                const fatorAjuste = pesoTotalReceitaBase / pesoTotalTeorico
                quantidadeIngrediente = quantidadeIngrediente * fatorAjuste
              }
              const quantidadeTotal = quantidadeIngrediente * fatorMultiplicacao
              const unidadeExibicao = ingredienteReceita.ingrediente?.unidade === 'kg' ? 'g' : ingredienteReceita.ingrediente?.unidade === 'L' ? 'ml' : ingredienteReceita.ingrediente?.unidade || 'g'
              printer.println(`- ${ingredienteReceita.ingrediente?.nome}: ${Math.round(quantidadeTotal)}${unidadeExibicao}`)
            }
            printer.newLine()
          }
        }
        printer.newLine(); printer.cut();
        const raw = (printer as any).getBuffer ? (printer as any).getBuffer() : null
        if (!raw || !raw.length) {
          return NextResponse.json({ error: 'Falha ao gerar bytes ESC/POS' }, { status: 500 })
        }
        return NextResponse.json({ success: true, dataBase64: Buffer.from(raw).toString('base64') })
      } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Erro ao gerar payload' }, { status: 500 })
      }
    }

    // Se configurada para usar Agent local no servidor (ambiente local), enviar ESC/POS via Agent e retornar
    if ((configImpressora as any).usarAgent) {
      try {
        // Gerar conteúdo ESC/POS com node-thermal-printer em modo buffer
        const printer = new ThermalPrinter({
          type: printerType,
          interface: 'buffer',
          characterSet: CharacterSet.PC860_PORTUGUESE,
          width: configImpressora.largura,
          removeSpecialCharacters: false,
          breakLine: BreakLine.WORD,
        })
        // Cabeçalho mínimo
        printer.alignCenter();
        printer.setTextSize(1, 0);
        printer.println('SEPARAÇÃO DE')
        printer.println('INGREDIENTES')
        printer.setTextSize(0, 0)
        printer.newLine()
        printer.alignLeft()
        for (const item of itens) {
          if (item.receita) {
            printer.bold(true)
            printer.println(`--- ${item.receita.nome.toUpperCase()} (${item.quantidade}x) ---`)
            printer.bold(false)
            const fatorMultiplicacao = item.quantidade / item.receita.rendimento
            for (const ingredienteReceita of item.receita.ingredientes) {
              let quantidadeIngrediente = ingredienteReceita.quantidade
              if (item.receita.sistemaCalculo === 'porcentagem') {
                const pesoBaseReceita = 1000
                quantidadeIngrediente = (ingredienteReceita.quantidade / 100) * pesoBaseReceita
                const pesoTotalReceitaBase = item.receita.pesoUnitario * item.receita.rendimento
                let somaPercentuais = 0
                item.receita.ingredientes.forEach((ing: any) => { somaPercentuais += ing.quantidade })
                const pesoTotalTeorico = (somaPercentuais / 100) * pesoBaseReceita
                const fatorAjuste = pesoTotalReceitaBase / pesoTotalTeorico
                quantidadeIngrediente = quantidadeIngrediente * fatorAjuste
              }
              const quantidadeTotal = quantidadeIngrediente * fatorMultiplicacao
              const unidadeExibicao = ingredienteReceita.ingrediente?.unidade === 'kg' ? 'g' : ingredienteReceita.ingrediente?.unidade === 'L' ? 'ml' : ingredienteReceita.ingrediente?.unidade || 'g'
              printer.println(`- ${ingredienteReceita.ingrediente?.nome}: ${Math.round(quantidadeTotal)}${unidadeExibicao}`)
            }
            printer.newLine()
          }
        }
        printer.newLine(); printer.cut();

        // Obter bytes ESC/POS do buffer interno
        const raw = (printer as any).getBuffer ? (printer as any).getBuffer() : null
        if (!raw || !raw.length) {
          return NextResponse.json({ error: 'Falha ao gerar bytes ESC/POS' }, { status: 500 })
        }

        // Enviar ao agent local
        const profile = (configImpressora as any).agentProfile || 'cupom'
        const base = 'http://127.0.0.1:9123'
        const resp = await fetch(`${base}/print/escpos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile, dataBase64: Buffer.from(raw).toString('base64') })
        })
        if (!resp.ok) {
          const err = await resp.json().catch(()=>({}))
          return NextResponse.json({ error: err?.error || 'Falha ao enviar via Agent' }, { status: 500 })
        }
        return NextResponse.json({ success: true, message: 'Separação enviada via Agent local' })
      } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Erro no Agent' }, { status: 500 })
      }
    }

    // Configurar impressora baseado na interface
    let printerConfig: any = {
      type: printerType,
      // Usar PC860 (Português) para garantir compatibilidade de acentos
      characterSet: CharacterSet.PC860_PORTUGUESE,
      width: configImpressora.largura,
      removeSpecialCharacters: false,
      breakLine: BreakLine.WORD,
    };

    if (configImpressora.interface === 'USB') {
      // Para USB, usar interface printer com o nome da impressora
      printerConfig.interface = 'printer';
      printerConfig.options = {
        name: configImpressora.configuracao || 'GEZHI_micro_printer'
      };
    } else if (configImpressora.interface === 'TCP') {
      // Para TCP/IP
      printerConfig.interface = `tcp://${configImpressora.configuracao}`;
    } else if (configImpressora.interface === 'BLUETOOTH') {
      // Para Bluetooth
      printerConfig.interface = configImpressora.configuracao;
    }

    const printer = new ThermalPrinter(printerConfig);

    // Tentar imprimir logo do cliente (PNG) se existir em public/
    const candidates = [
      join(process.cwd(), 'public', 'logo_cliente.png'),
      join(process.cwd(), 'public', 'logo.png'),
      join(process.cwd(), 'apps', 'web', 'public', 'logo_cliente.png'),
      join(process.cwd(), 'apps', 'web', 'public', 'logo.png'),
    ];
    const logoPath = candidates.find(p => { try { return existsSync(p); } catch { return false; } });
    if (logoPath) {
      try {
        printer.alignCenter();
        // Fallback: sem redimensionar via sharp em produção; tentar imprimir direto se suportado
        if (typeof (printer as any).printImage === 'function') {
          await (printer as any).printImage(logoPath);
          printer.newLine();
        }
      } catch (e) {
        console.log('Falha ao imprimir logo redimensionado:', e);
      }
    }

    // Cabeçalho compacto
    printer.alignCenter();
    printer.setTextSize(1, 0);
    // Linha superior (48 colunas de '-')
    printer.println('------------------------');
    printer.bold(true);
    printer.println('SEPARAÇÃO DE');
    printer.println('INGREDIENTES');
    printer.bold(false);
    printer.println('------------------------');

    printer.setTextSize(0, 0);
    
    printer.alignCenter();
    printer.println(`Plano Produção ${new Date(dataProducao).toLocaleDateString('pt-BR')}`);
    printer.newLine();

    printer.alignLeft();
    // Itens por receita
    for (const item of itens) {
      if (item.receita) {
        printer.bold(true);
        printer.println(`--- ${item.receita.nome.toUpperCase()} (${item.quantidade}x) ---`);
        printer.bold(false);
        printer.newLine();
        
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
          const unidadeExibicao = ingredienteReceita.ingrediente?.unidade === 'kg' ? 'g' : 
                                 ingredienteReceita.ingrediente?.unidade === 'L' ? 'ml' : 
                                 ingredienteReceita.ingrediente?.unidade || 'g';
          
          // Evitar caracteres não ASCII (ex.: '□') que podem quebrar acentuação
          printer.println(`- ${ingredienteReceita.ingrediente?.nome}: ${Math.round(quantidadeTotal)}${unidadeExibicao}`);
        }
        printer.newLine();
      }
    }
    
    // Rodapé
    printer.alignCenter();
    printer.setTextSize(0, 0);
    printer.println('Granobox - Sistema de Gestão');
    printer.println(`Impresso em: ${new Date().toLocaleString('pt-BR')}`);
    printer.cut();

    // Executar impressão
    const execute = await printer.execute();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Separação impressa com sucesso!',
      data: execute 
    });

  } catch (error) {
    console.error('Erro ao imprimir separação:', error);
    return NextResponse.json(
      { error: 'Erro ao imprimir separação' },
      { status: 500 }
    );
  }
} 