import { NextRequest, NextResponse } from 'next/server';
import net from 'net';
import { prisma } from '@/lib/prisma';

type ZplData = {
  title?: string;
  subtitle?: string;
  lines?: string[]; // linhas adicionais
  barcode?: string; // código para Code128
  qrcode?: string;  // texto para QR code (se preferir)
  widthDots?: number; // largura da etiqueta em dots (default usa config -> 800)
  heightDots?: number; // altura em dots (default = widthDots)
  marginLeftDots?: number; // margem interna esquerda
  marginRightDots?: number; // margem interna direita
  marginTopDots?: number; // margem interna superior
  marginBottomDots?: number; // margem interna inferior
  borderOnly?: boolean; // quando true, imprime apenas a moldura
  showBorder?: boolean; // quando true, desenha a moldura além do conteúdo
  labelShiftDots?: number; // ^LS - deslocamento horizontal (negativo move à direita)
  topOffsetDots?: number;   // ^LT - deslocamento vertical (negativo começa mais acima)
  calibrate?: boolean;      // quando true, envia comandos de calibração (gap sensing)
  qrPaddingDots?: number;   // ajuste fino para encostar/afastar o QR das bordas (pode ser negativo)
  titleTopPaddingDots?: number; // espaço extra acima do título dentro da área interna
};

// Toggle global para QR code nas etiquetas ZPL de teste
const ENABLE_QR = true;

function buildBasicZpl(data: ZplData, fallbackWidth: number): string {
  const width = data.widthDots || fallbackWidth || 400;
  const height = data.heightDots || width; // padrão 5x5 quando não informado
  const title = (data.title || '').toUpperCase();
  const subtitle = data.subtitle || '';
  const lines = data.lines || [];
  const borderOnly = !!data.borderOnly;
  const marginLeft = typeof data.marginLeftDots === 'number' ? data.marginLeftDots : 0;
  const marginRight = typeof data.marginRightDots === 'number' ? data.marginRightDots : marginLeft;
  const marginTop = typeof data.marginTopDots === 'number' ? data.marginTopDots : 0;
  const marginBottom = typeof data.marginBottomDots === 'number' ? data.marginBottomDots : 0;
  const requestedLabelShift = typeof data.labelShiftDots === 'number' ? data.labelShiftDots : 0;
  const requestedTopOffset = typeof data.topOffsetDots === 'number' ? data.topOffsetDots : 0;
  // ^LT geralmente limita a +-120 dots. ^LS também pode ter limites em alguns firmwares.
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  const ltApplied = clamp(requestedTopOffset, -120, 120);
  const lsApplied = clamp(requestedLabelShift, -120, 120);
  const extraY = requestedTopOffset - ltApplied; // compensação adicional via ^FO
  const extraX = requestedLabelShift - lsApplied; // compensação adicional via ^FO
  const innerWidth = Math.max(100, width - (marginLeft + marginRight));
  const innerHeight = Math.max(100, height - marginTop - marginBottom);

  // ZPL básico com CP1252 (^CI27) e largura configurável
  let zpl = '^XA\n';
  zpl += '^CI27\n'; // Code page 1252
  zpl += `^PW${width}\n`;
  zpl += `^LL${height}\n`;
  zpl += `^LH${marginLeft},${marginTop}\n`;
  zpl += `^LT${ltApplied}\n`;
  zpl += `^LS${lsApplied}\n`;
  zpl += '^PON\n';
  zpl += '^FWN\n';
  zpl += '^PQ1,0,1,N\n';

  // Moldura (opcional). Quando borderOnly=true, imprime somente a moldura.
  if (data.showBorder || borderOnly) {
    // Moldura completa da área de impressão para diagnóstico (com 2px de margem interna para evitar corte)
    zpl += `^FO${2 + extraX},${2 + extraY}^GB${Math.max(10, innerWidth - 4)},${Math.max(10, innerHeight - 4)},2^FS\n`;
  }

  if (borderOnly) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const stamp = `${hh}:${mm}:${ss}`;
    zpl += '^CF0,28\n';
    zpl += `^FO${10 + extraX},${10 + extraY}^FDDEBUG ZPL ${stamp}^FS\n`;
    // pequena marca no canto inferior direito
    zpl += `^FO${Math.max(4, innerWidth - 30) + extraX},${Math.max(4, innerHeight - 4) + extraY}^GB28,2,2^FS\n`;
    zpl += '^XZ\n';
    return zpl;
  }

  // Preparar dimensões do QR para reservar espaço à direita
  let qrScale = 4;
  if (width >= 600) qrScale = 6; // 300dpi, caso contrário usa 4 (203dpi)
  const qrBox = lines.length > 0 || subtitle || title ? qrScale * 21 + 40 : qrScale * 21 + 20;

  // Título
  if (title) {
    const titlePad = typeof data.titleTopPaddingDots === 'number' ? data.titleTopPaddingDots : 12; // ~1.5mm em 203dpi
    zpl += '^CF0,40\n';
    // "negrito" leve duplicando
    zpl += `^FO0,${titlePad}^FB${innerWidth},1,0,L,0^FD${title}^FS\n`;
    zpl += `^FO1,${titlePad + 1}^FB${innerWidth},1,0,L,0^FD${title}^FS\n`;
  }
  // Subtítulo
  const baseTitlePad = typeof data.titleTopPaddingDots === 'number' ? data.titleTopPaddingDots : 12;
  let y = title ? baseTitlePad + 40 : 8;
  if (subtitle) {
    zpl += '^CF0,30\n';
    zpl += `^FO0,${y}^FB${innerWidth - (qrBox + 8)},2,30,L,0^FD${subtitle}^FS\n`;
    y += 36;
  }
  // Demais linhas
  zpl += '^CF0,26\n';
  for (const line of lines) {
    zpl += `^FO0,${y}^FB${innerWidth - (qrBox + 8)},1,28,L,0^FD${line}^FS\n`;
    y += 30; // espaçamento entre linhas
  }

  // Código de barras (opcional)
  if (data.barcode) {
    zpl += '^BY2,2,60\n';
    zpl += `^FO0,${y}^BCN,60,Y,N,N^FD${data.barcode}^FS\n`;
    y += 100;
  }

  // QR Code (opcional)
  if (ENABLE_QR && data.qrcode) {
    // Alinhar ao canto inferior direito da área interna (borda direita e inferior)
    // Aproximação do tamanho do QR: (21 módulos + 8 de quiet zone) * escala
    const qrSide = (21 + 8) * qrScale; // 29 * escala (inclui quiet zone)
    const pad = typeof data.qrPaddingDots === 'number' ? data.qrPaddingDots : 0; // negativo aproxima das bordas
    const qrX = Math.max(0, innerWidth - qrSide + pad) + extraX;
    const qrY = Math.max(0, innerHeight - qrSide + pad) + extraY;
    zpl += `^FO${qrX},${qrY}^BQN,2,${qrScale}^FDLA,${data.qrcode}^FS\n`;
  }

  zpl += '^XZ\n';
  return zpl;
}

async function sendZplOverTcp(host: string, port: number, zpl: string): Promise<void> {
  // Enviar como latin1 para preservar CP1252
  const payload = Buffer.from(zpl, 'latin1');
  await new Promise<void>((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);
    socket.once('error', reject);
    socket.once('timeout', () => reject(new Error('Timeout na conexão TCP')));
    socket.connect(port, host, () => {
      socket.write(payload, (err) => {
        if (err) return reject(err);
        // Pequeno delay e encerrar
        setTimeout(() => {
          try { socket.end(); } catch {}
          resolve();
        }, 50);
      });
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { zpl, data, ip, port } = body as { zpl?: string; data?: ZplData; ip?: string; port?: number };

    // Buscar impressora ativa, se IP não for fornecido
    let destinoIp = ip;
    let destinoPort = port || 9100;
    let configWidthDots: number | undefined;

    if (!destinoIp) {
      const config = await prisma.configuracaoImpressora.findFirst({ where: { ativa: true } });
      if (!config || (config.interface !== 'TCP' && !config.interface?.startsWith('tcp://'))) {
        return NextResponse.json({ error: 'Nenhuma impressora TCP ativa configurada' }, { status: 400 });
      }

      const cfg = config.configuracao || config.interface.replace('tcp://', '');
      const [host, prt] = cfg.split(':');
      destinoIp = host;
      if (prt) destinoPort = parseInt(prt, 10) || 9100;
      // Se for ZPL, usar largura (dots) salva na configuração
      if ((config as any).tipo === 'ZEBRA_ZPL') {
        configWidthDots = config.largura || 800;
      }
    }

    // Montar ZPL
    let zplToSend = zpl || buildBasicZpl(data || {}, configWidthDots || 800);
    // Opcional: prefixo de calibração (detecção de GAP) para ajustar início/topo automaticamente
    if (data?.calibrate) {
      const calibratePrefix = '^XA^MNY^JUS^XZ'; // GAP sensing + auto calibrate
      zplToSend = calibratePrefix + zplToSend;
    }

    // Enviar
    await sendZplOverTcp(destinoIp!, destinoPort, zplToSend);

    return NextResponse.json({ success: true, message: 'Etiqueta enviada para impressão', ip: destinoIp, port: destinoPort });
  } catch (error: any) {
    console.error('Erro ao imprimir etiqueta ZPL:', error);
    return NextResponse.json({ error: error?.message || 'Erro ao imprimir etiqueta' }, { status: 500 });
  }
}


