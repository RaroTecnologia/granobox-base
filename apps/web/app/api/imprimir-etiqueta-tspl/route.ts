import { NextRequest, NextResponse } from 'next/server'
import net from 'net'
import { prisma } from '@/lib/prisma'

type TsplData = {
  widthMm?: number
  heightMm?: number
  dpi?: 203 | 300
  gapMm?: number
  offsetX?: number // dots
  offsetY?: number // dots
  borderOnly?: boolean
}

function buildTsplBorder(data: TsplData, fallbackWidthMm: number, fallbackHeightMm: number): string {
  const widthMm = data.widthMm || fallbackWidthMm || 50
  const heightMm = data.heightMm || fallbackHeightMm || 50
  const dpi = data.dpi || 203
  const gapMm = typeof data.gapMm === 'number' ? data.gapMm : 2
  const dotsPerMm = dpi === 203 ? 8 : 12
  const wDots = Math.round(widthMm * dotsPerMm)
  const hDots = Math.round(heightMm * dotsPerMm)
  const offX = data.offsetX ?? 0
  const offY = data.offsetY ?? 0

  // TSPL
  const cmd: string[] = []
  cmd.push('SIZE ' + widthMm + ' mm,' + heightMm + ' mm')
  cmd.push('GAP ' + gapMm + ' mm,0')
  cmd.push('DIRECTION 1')
  cmd.push('REFERENCE ' + offX + ',' + offY)
  cmd.push('CLS')
  // Moldura (2 px) com pequena folga das bordas para evitar corte físico
  cmd.push('BOX 2,2,' + (wDots - 4) + ',' + (hDots - 4) + ',2')
  // Texto de debug com timestamp para confirmar atualização
  const now = new Date()
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  cmd.push('TEXT 20,20,"3",0,1,1,"DEBUG TSPL ' + hh + ':' + mm + ':' + ss + '"')
  cmd.push('PRINT 1,1')
  // TSPL usa \n como terminador na maioria dos firmwares
  return cmd.join('\r\n') + '\r\n'
}

async function sendRaw(host: string, port: number, payload: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const socket = new net.Socket()
    socket.setTimeout(5000)
    socket.once('error', reject)
    socket.once('timeout', () => reject(new Error('Timeout na conexão TCP')))
    socket.connect(port, host, () => {
      socket.write(Buffer.from(payload, 'latin1'), (err) => {
        if (err) return reject(err)
        setTimeout(() => { try { socket.end() } catch {} ; resolve() }, 50)
      })
    })
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, ip, port } = body as { data?: TsplData; ip?: string; port?: number }

    // Buscar impressora ativa caso IP não seja enviado
    let destinoIp = ip
    let destinoPort = port || 9100
    if (!destinoIp) {
      const config = await prisma.configuracaoImpressora.findFirst({ where: { ativa: true } })
      if (!config || (config.interface !== 'TCP' && !config.interface?.startsWith('tcp://'))) {
        return NextResponse.json({ error: 'Nenhuma impressora TCP ativa configurada' }, { status: 400 })
      }
      const cfg = config.configuracao || config.interface.replace('tcp://', '')
      const [host, prt] = cfg.split(':')
      destinoIp = host
      if (prt) destinoPort = parseInt(prt, 10) || 9100
    }

    const payload = buildTsplBorder(data || {}, 50, 50)
    await sendRaw(destinoIp!, destinoPort, payload)

    return NextResponse.json({ success: true, message: 'Etiqueta TSPL enviada', ip: destinoIp, port: destinoPort })
  } catch (error: any) {
    console.error('Erro ao imprimir etiqueta TSPL:', error)
    return NextResponse.json({ error: error?.message || 'Erro ao imprimir etiqueta TSPL' }, { status: 500 })
  }
}


