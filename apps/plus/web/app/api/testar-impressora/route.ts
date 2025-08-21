import { NextRequest, NextResponse } from 'next/server';
import { ThermalPrinter, PrinterTypes, CharacterSet } from 'node-thermal-printer';
import { prisma } from '@/lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { configuracaoId } = await request.json();

    // Buscar configuração da impressora
    const config = await prisma.configuracaoImpressora.findUnique({
      where: { id: configuracaoId }
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Configuração não encontrada' },
        { status: 404 }
      );
    }

    // Se configurada para usar Agent local, gerar ESC/POS em buffer e enviar ao Agent
    if ((config as any).usarAgent) {
      try {
        // Construir conteúdo de teste
        const printer = new ThermalPrinter({
          type: PrinterTypes.EPSON,
          interface: 'buffer',
          characterSet: CharacterSet.PC860_PORTUGUESE,
          width: config.largura,
          removeSpecialCharacters: false,
        })
        printer.alignCenter();
        printer.setTextSize(0,0);
        printer.bold(true); printer.println('========== TESTE ==========' );
        printer.println('      GRANOBOX'); printer.bold(false);
        printer.println('===========================');
        printer.newLine();
        printer.alignLeft();
        printer.println(`Configuração: ${config.nome}`);
        printer.println(`Tipo: ${config.tipo}`);
        printer.println(`Interface: ${config.interface}`);
        printer.println(`Largura: ${config.largura} caracteres`);
        printer.newLine(); printer.println('Teste via Agent local');
        printer.newLine(); printer.cut();

        const raw = (printer as any).getBuffer ? (printer as any).getBuffer() : null;
        if (!raw || !raw.length) {
          return NextResponse.json({ error: 'Falha ao gerar ESC/POS (buffer vazio)' }, { status: 500 })
        }
        const base = 'http://127.0.0.1:9123';
        const profile = (config as any).agentProfile || 'cupom';
        const resp = await fetch(`${base}/print/escpos`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile, dataBase64: Buffer.from(raw).toString('base64') })
        })
        if (!resp.ok) {
          const err = await resp.json().catch(()=>({}));
          return NextResponse.json({ error: err?.error || 'Falha ao enviar via Agent' }, { status: 500 })
        }
        return NextResponse.json({ success: true, message: 'Teste enviado via Agent local' })
      } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Erro no Agent' }, { status: 500 })
      }
    }

    // Se for USB, usar método simples (sem formatação térmica)
    if (config.interface === 'USB') {
      // Para USB, aceitar limitações: texto simples sem formatação
      const textoSimples = `GRANOBOX - TESTE

Configuracao: ${config.nome}
Data: ${new Date().toLocaleDateString('pt-BR')}
Hora: ${new Date().toLocaleTimeString('pt-BR')}

Impressora USB funcionando!

Nota: USB tem limitacoes de formatacao.
Para melhor resultado, use TCP/IP.

`;

      try {
        const tempFile = join('/tmp', `teste-usb-${Date.now()}.txt`);
        writeFileSync(tempFile, textoSimples);
        
        const comando = `lp -d ${config.configuracao} ${tempFile}`;
        const { stdout, stderr } = await execAsync(comando);
        
        unlinkSync(tempFile);
        
        return NextResponse.json({ 
          success: true, 
          message: 'Teste USB enviado (texto simples)',
          data: { 
            stdout, 
            stderr, 
            aviso: 'USB tem limitações. Para melhor resultado, use TCP/IP.' 
          }
        });
      } catch (error) {
        return NextResponse.json(
          { error: 'Erro na impressão USB: ' + (error instanceof Error ? error.message : String(error)) },
          { status: 500 }
        );
      }
    }

    // Se for BLUETOOTH, tentar comunicação direta via dispositivo serial
    if (config.interface === 'BLUETOOTH') {
      try {
        // Usar a biblioteca com o dispositivo serial Bluetooth
        const printer = new ThermalPrinter({
          type: PrinterTypes.EPSON,
          interface: config.configuracao || '/dev/tty.JP80H-UWB', // /dev/tty.JP80H-UWB
          characterSet: CharacterSet.PC860_PORTUGUESE,
          width: config.largura,
          removeSpecialCharacters: false,
        });

        // Teste com comandos ESC/POS
        printer.alignCenter();
        printer.bold(true);
        printer.println('TESTE GRANOBOX');
        printer.bold(false);
        printer.newLine();
        
        printer.alignLeft();
        printer.println(`Config: ${config.nome}`);
        printer.println(`Data: ${new Date().toLocaleDateString('pt-BR')}`);
        printer.newLine();
        
        printer.println('Bluetooth funcionando!');
        printer.newLine();
        printer.newLine();
        
        // Cortar papel
        printer.cut();

        // Executar
        const result = await printer.execute();
        
        return NextResponse.json({ 
          success: true, 
          message: 'Teste Bluetooth via biblioteca enviado!',
          data: result
        });
      } catch (error) {
        // Fallback: método direto
        try {
          const comando = `printf "\\x1B\\x40TESTE GRANOBOX\\n\\nBluetooth direto!\\n\\n\\x1D\\x56\\x00" > ${config.configuracao || '/dev/tty.JP80H-UWB'}`;
          const { stdout, stderr } = await execAsync(comando);
          
          return NextResponse.json({ 
            success: true, 
            message: 'Teste Bluetooth direto enviado (biblioteca falhou)',
            data: { stdout, stderr, error: error instanceof Error ? error.message : String(error) }
          });
        } catch (fallbackError) {
          return NextResponse.json(
            { error: `Bluetooth falhou. Biblioteca: ${error instanceof Error ? error.message : String(error)}. Direto: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}` },
            { status: 500 }
          );
        }
      }
    }

    // Para TCP/IP e Bluetooth, usar a biblioteca node-thermal-printer
    // Mapear tipo da impressora
    let printerType;
    switch (config.tipo) {
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
    let printerConfig: any = {
      type: printerType,
      // Manter PC860 para melhor compatibilidade default
      characterSet: CharacterSet.PC860_PORTUGUESE,
      width: config.largura,
      removeSpecialCharacters: false,
      breakLine: 1,
    };

    if (config.interface === 'TCP') {
      // Para TCP/IP
      printerConfig.interface = `tcp://${config.configuracao}`;
    } else if (config.interface === 'BLUETOOTH') {
      // Para Bluetooth
      printerConfig.interface = config.configuracao;
    }

    const printer = new ThermalPrinter(printerConfig);

    // Imprimir página de teste
    printer.alignCenter();
    // Fonte normal
    printer.setTextSize(0, 0);
    printer.bold(true);
    printer.println('========== TESTE ==========');
    printer.println('      GRANOBOX');
    printer.println('===========================');
    printer.bold(false);
    printer.newLine();

    printer.alignLeft();
    printer.println(`Configuração: ${config.nome}`);
    printer.println(`Tipo: ${config.tipo}`);
    printer.println(`Interface: ${config.interface}`);
    printer.println(`Largura: ${config.largura} caracteres`);
    printer.newLine();

    printer.alignCenter();
    printer.println('Teste de impressão realizado');
    printer.println(`em ${new Date().toLocaleString('pt-BR')}`);
    printer.newLine();

    printer.println('Se você consegue ler esta');
    printer.println('mensagem, a impressora está');
    printer.println('funcionando corretamente!');
    printer.newLine();
    // Espaço mínimo e corte
    printer.newLine();
    printer.cut();

    // Executar impressão
    const execute = await printer.execute();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Teste de impressão enviado com sucesso!',
      data: execute 
    });

  } catch (error) {
    console.error('Erro no teste de impressão:', error);
    return NextResponse.json(
      { error: 'Erro no teste de impressão: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 