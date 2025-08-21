import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { planoId, ingredientesNecessarios, itens, dataProducao } = await request.json();

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

    // Preparar conteúdo para impressão offline
    const printContent = {
      commands: [
        { type: 'align', value: 'center' },
        { type: 'bold', value: true },
        { type: 'text', text: '   SEPARAÇÃO DE INGREDIENTES' },
        { type: 'text', text: '==============================' },
        { type: 'bold', value: false },
        { type: 'newline' },
        { type: 'align', value: 'left' },
        { type: 'text', text: `Data: ${new Date(dataProducao).toLocaleDateString('pt-BR')}` },
        { type: 'text', text: `Plano: Produção ${new Date(dataProducao).toLocaleDateString('pt-BR')}` },
        { type: 'newline' }
      ]
    };

    // Adicionar itens por receita
    for (const item of itens) {
      if (item.receita) {
        printContent.commands.push(
          { type: 'bold', value: true },
          { type: 'text', text: `--- ${item.receita.nome.toUpperCase()} (${item.quantidade}x) ---` },
          { type: 'bold', value: false }
        );
        
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
          
          printContent.commands.push({
            type: 'text',
            text: `□ ${ingredienteReceita.ingrediente?.nome}: ${Math.round(quantidadeTotal)}${unidadeExibicao}`
          });
        }
        
        printContent.commands.push({ type: 'newline' });
      }
    }

    // Adicionar total consolidado
    printContent.commands.push(
      { type: 'text', text: '==============================' },
      { type: 'bold', value: true },
      { type: 'text', text: 'TOTAL GERAL:' },
      { type: 'bold', value: false }
    );

    for (const [ingredienteId, quantidade] of Object.entries(ingredientesNecessarios)) {
      const ingrediente = ingredientesDb.find(i => i.id === ingredienteId);
      const quantidadeFormatada = Math.round(quantidade as number);
      const unidadeExibicao = ingrediente?.unidade === 'kg' ? 'g' : 
                             ingrediente?.unidade === 'L' ? 'ml' : 
                             ingrediente?.unidade || 'g';
      
      printContent.commands.push({
        type: 'text',
        text: `${ingrediente?.nome || 'Ingrediente'}: ${quantidadeFormatada}${unidadeExibicao}`
      });
    }

    printContent.commands.push(
      { type: 'text', text: '==============================' },
      { type: 'newline' }
    );

    // Configuração da impressora para o serviço offline
    const printerConfig = {
      type: configImpressora.tipo,
      interface: configImpressora.interface === 'TCP' 
        ? `tcp://${configImpressora.configuracao}` 
        : configImpressora.configuracao,
      width: configImpressora.largura
    };

    // Tentar enviar para o serviço offline primeiro
    try {
      const offlineResponse = await fetch('http://localhost:3001/api/print/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: JSON.stringify(printContent),
          printerConfig: printerConfig
        }),
        signal: AbortSignal.timeout(5000) // Timeout de 5 segundos
      });

      if (offlineResponse.ok) {
        const offlineData = await offlineResponse.json();
        return NextResponse.json({ 
          success: true, 
          message: 'Separação adicionada à fila de impressão offline!',
          queueId: offlineData.queueId,
          mode: 'offline'
        });
      }
    } catch (error) {
      console.log('Serviço offline não disponível, tentando impressão direta...');
    }

    // Fallback: tentar impressão direta (código original)
    const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');

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

    // Configurar impressora baseado na interface
    let printerConfigDirect: any = {
      type: printerType,
      characterSet: CharacterSet.PC860_PORTUGUESE,
      width: configImpressora.largura,
      removeSpecialCharacters: false,
    };

    if (configImpressora.interface === 'USB') {
      printerConfigDirect.interface = 'printer';
      printerConfigDirect.options = {
        name: configImpressora.configuracao || 'GEZHI_micro_printer'
      };
    } else if (configImpressora.interface === 'TCP') {
      printerConfigDirect.interface = `tcp://${configImpressora.configuracao}`;
    } else if (configImpressora.interface === 'BLUETOOTH') {
      printerConfigDirect.interface = configImpressora.configuracao;
    }

    const printer = new ThermalPrinter(printerConfigDirect);

    // Processar comandos de impressão
    for (const command of printContent.commands) {
      switch (command.type) {
        case 'text':
          printer.println(command.text);
          break;
        case 'bold':
          printer.bold(command.value);
          break;
        case 'align':
          if (command.value === 'center') printer.alignCenter();
          else if (command.value === 'left') printer.alignLeft();
          else if (command.value === 'right') printer.alignRight();
          break;
        case 'newline':
          printer.newLine();
          break;
      }
    }

    // Rodapé e corte
    printer.alignCenter();
    printer.setTextSize(0, 0);
    printer.println('Granobox - Sistema de Gestão');
    printer.println(`Impresso em: ${new Date().toLocaleString('pt-BR')}`);
    printer.newLine();
    printer.newLine();
    printer.cut();

    // Executar impressão direta
    const execute = await printer.execute();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Separação impressa diretamente!',
      data: execute,
      mode: 'direct'
    });

  } catch (error) {
    console.error('Erro ao imprimir separação:', error);
    return NextResponse.json(
      { error: 'Erro ao imprimir separação: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 