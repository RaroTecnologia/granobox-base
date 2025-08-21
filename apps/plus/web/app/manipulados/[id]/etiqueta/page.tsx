'use client'

import { useEffect, useMemo, useState } from 'react'
import Navigation from '@/components/Navigation'
import { useParams } from 'next/navigation'
import { ArrowLeftIcon, PrinterIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import * as QRCode from 'qrcode'
import toast from 'react-hot-toast'

type Manipulado = {
  id: string
  nome: string
  categoria: string
  unidade: string
  quantidade: number
  conservacaoRecomendada: 'TEMPERATURA_AMBIENTE' | 'CONGELADO' | 'RESFRIADO'
  dataManipulacao: string
  validadeTemperaturaAmbiente?: number
  validadeRefrigerado?: number
  validadeCongelado?: number
  descricao?: string
}

function formatarDataHoraISO(date: Date) {
  const data = date.toLocaleDateString('pt-BR')
  const hora = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${data} - ${hora}`
}

export default function EtiquetaManipuladoPage() {
  const params = useParams()
  const [manipulado, setManipulado] = useState<Manipulado | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [configZplAtiva, setConfigZplAtiva] = useState<null | {
    id: string;
    nome: string;
    tipo: string;
    interface: string;
    largura?: number;
    configuracao?: string;
    usarAgent?: boolean;
    agentProfile?: string;
  }>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/manipulados/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setManipulado(data)
        }
        // carregar config ativa (ZPL) para imprimir via Agent quando disponível
        const cfgRes = await fetch('/api/configuracoes-impressora')
        if (cfgRes.ok) {
          const cfgs = await cfgRes.json()
          const ativaZpl = cfgs.find((c: any) => c.ativa && c.tipo === 'ZEBRA_ZPL') || cfgs.find((c: any) => c.ativa)
          if (ativaZpl) setConfigZplAtiva(ativaZpl)
        }
      } finally {
        setLoading(false)
      }
    }
    if (params?.id) load()
  }, [params?.id])

  // Dados deriváveis para etiqueta de referência visual
  const referencia = useMemo(() => {
    if (!manipulado) return null
    const dataOrig = new Date(manipulado.dataManipulacao)
    // calcular validade conforme conservação
    let addMin = 0
    switch (manipulado.conservacaoRecomendada) {
      case 'TEMPERATURA_AMBIENTE':
        addMin = manipulado.validadeTemperaturaAmbiente || 0
        break
      case 'RESFRIADO':
        addMin = manipulado.validadeRefrigerado || 0
        break
      case 'CONGELADO':
        addMin = manipulado.validadeCongelado || 0
        break
    }
    const validade = addMin > 0 ? new Date(dataOrig.getTime() + addMin * 60 * 1000) : undefined
    return {
      titulo: manipulado.nome,
      subtitulo: manipulado.conservacaoRecomendada === 'RESFRIADO' ? 'RESFRIADO / DESCONGELANDO' : manipulado.conservacaoRecomendada,
      peso: `${manipulado.quantidade} ${manipulado.unidade}`,
      dataOriginal: dataOrig,
      dataManipulacao: dataOrig,
      dataValidade: validade,
      marca: manipulado.categoria?.toUpperCase(),
      sif: '358',
      resp: '-',
      doc: '-'
    }
  }, [manipulado])

  useEffect(() => {
    const gen = async () => {
      if (!manipulado) return
      const url = `${window.location.origin}/manipulados/${manipulado.id}`
      const data = await QRCode.toDataURL(url, { margin: 0, scale: 6 })
      setQrDataUrl(data)
    }
    gen()
  }, [manipulado])

  const imprimir = async () => {
    if (!manipulado || !referencia) return
    // Monta ZPL aproximando o layout de referência (preto e branco), com moldura, divisórias e "negrito" no título
    const title = referencia.titulo
    const subtitle = referencia.subtitulo
    const lines: string[] = [
      `VAL. ORIGINAL:;${referencia.dataOriginal ? referencia.dataOriginal.toLocaleDateString('pt-BR') : '-'}`,
      `MANIPULAÇÃO:;${formatarDataHoraISO(referencia.dataManipulacao)}`,
      `VALIDADE:;${referencia.dataValidade ? formatarDataHoraISO(referencia.dataValidade) : '-'}`,
      `MARCA / FORN:;${referencia.marca || '-'}`,
      `SIF:;${referencia.sif}`,
    ]

    // Dimensões e layout (usar largura da impressora ativa quando disponível)
    const widthDots = (configZplAtiva?.largura as number | undefined) || 400
    const heightDots = widthDots // 5x5cm padrão
    const margin = 28 // margem interna mais segura
    const innerWidth = widthDots - margin * 2
    const innerHeight = heightDots - margin * 2
    let y = 8 // padding superior interno

    // Tokens para substituição posterior
    const FRAME_TOKEN = '__FRAME__'
    const LL_TOKEN = '__LL__'

    // Cabeçalho básico
    let zpl = '^XA\n^CI27\n'
    zpl += `^PW${widthDots}\n`
    zpl += `^LL${heightDots}\n`
    zpl += `^LH${margin},${margin}\n`
    zpl += '^PON\n^FWN\n^PQ1,0,1,N\n'
    // Moldura
    zpl += `^FO0,0^GB${innerWidth},${innerHeight},2^FS\n`

    // Reservar área do QR à direita
    let qrScale = widthDots >= 600 ? 6 : 4
    let qrSide = (21 + 8) * qrScale
    // Garantir que a coluna de texto tenha ao menos 220 dots
    let leftColWidth = innerWidth - (qrSide + 8)
    if (leftColWidth < 220) {
      qrScale = 4
      qrSide = (21 + 8) * qrScale
      leftColWidth = Math.max(220, innerWidth - (qrSide + 8))
    }

    // Título em "negrito" leve
    zpl += '^CF0,32\n'
    zpl += `^FO0,${y}^FD${title.toUpperCase()}^FS\n`
    y += 32
    // Subtítulo e peso (sem FB para evitar wrap involuntário)
    zpl += '^CF0,22\n'
    zpl += `^FO0,${y}^FD${subtitle}^FS\n`
    // Peso à direita da coluna
    zpl += `^FO${Math.max(0, leftColWidth - 110)},${y}^FB110,1,0,R,0^FD${referencia.peso}^FS\n`
    y += 26
    // Linha divisória superior (apenas na coluna esquerda)
    zpl += `^FO0,${y}^GB${leftColWidth},2,2^FS\n`
    y += 8
    // Linhas de dados: labels fixos e valores alinhados à direita
    const valueColX = Math.max(140, Math.round(leftColWidth * 0.56))
    const valueColWidth = leftColWidth - valueColX
    zpl += '^CF0,22\n'
    for (const line of lines) {
      const [label, value] = line.split(';')
      zpl += `^FO0,${y}^FD${label}^FS\n`
      zpl += `^FO${valueColX},${y}^FB${valueColWidth},1,0,R,0^FD${value}^FS\n`
      y += 26
    }
    // Linha divisória inferior (apenas na coluna esquerda)
    zpl += `^FO0,${y}^GB${leftColWidth},2,2^FS\n`
    y += 8
    // Responsável
    zpl += '^CF0,20\n'
    zpl += `^FO0,${y}^FDRESP.: ${referencia.resp}^FS\n`

    // QR code no canto inferior direito da área interna
    const qrX = innerWidth - qrSide
    const qrY = innerHeight - qrSide
    zpl += `^FO${qrX},${qrY}^BQN,2,${qrScale}^FDLA,${manipulado.id}^FS\n`

    zpl += '^XZ\n'

    try {
      // Tentar via Agent local primeiro
      const base = 'http://127.0.0.1:9123'
      const health = await fetch(`${base}/health`).then(r=>r.json()).catch(()=>null)
      if (health?.ok) {
        let body: any = { zpl }
        if (configZplAtiva?.agentProfile) {
          body.profile = configZplAtiva.agentProfile
        } else if (configZplAtiva?.configuracao) {
          const cfg = (configZplAtiva.configuracao || '').trim()
          if (cfg.includes(':')) { const [host, p] = cfg.split(':'); body.ip = host; body.port = parseInt(p || '9100', 10) || 9100 }
          else if (cfg) { body.ip = cfg; body.port = 9100 }
        }
        const resp = await fetch(`${base}/print/zpl`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (resp.ok) { toast.success('Etiqueta enviada via Agent local'); return }
        const err = await resp.json().catch(()=>({} as any))
        toast.error(err?.error || 'Falha ao enviar via Agent')
      }
      // Fallback: enviar para rota do servidor (TCP direto no ambiente local)
      const respSrv = await fetch('/api/imprimir-etiqueta-zpl', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ zpl }) })
      if (respSrv.ok) { toast.success('Etiqueta enviada para impressão') }
      else { const e = await respSrv.json().catch(()=>({} as any)); toast.error(e?.error || 'Erro ao imprimir etiqueta') }
    } catch (e) {
      console.error('Erro ao imprimir etiqueta:', e)
      toast.error('Erro ao imprimir etiqueta')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">Carregando...</div>
      </div>
    )
  }

  if (!manipulado || !referencia) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">Manipulado não encontrado</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <Link href={`/manipulados/${manipulado.id}`} className="mr-4 p-2 text-gray-400 hover:text-gray-600">
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-semibold text-gray-900">Etiqueta — {manipulado.nome}</h1>
            </div>
            <button onClick={imprimir} className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              <PrinterIcon className="h-5 w-5 mr-2" />
              Imprimir
            </button>
          </div>

          {/* Preview visual */}
          <div className="bg-gray-50 p-6 rounded-xl shadow border flex">
            <div className="w-[360px] h-[260px] relative rounded-xl overflow-hidden bg-white border border-gray-300">
              <div className="absolute top-3 left-4 right-4 text-gray-900 font-extrabold text-xl tracking-wide">
                {referencia.titulo.toUpperCase()}
              </div>
              <div className="absolute top-12 left-4 right-4 text-gray-800 text-xs font-semibold">
                {referencia.subtitulo} <span className="float-right font-bold">{referencia.peso}</span>
              </div>
              <div className="absolute top-24 left-4 right-4 text-gray-900 text-xs">
                <div className="grid grid-cols-2 gap-y-1">
                  <div className="font-bold">VAL. ORIGINAL:</div>
                  <div className="text-right">{referencia.dataOriginal?.toLocaleDateString('pt-BR')}</div>
                  <div className="font-bold">MANIPULAÇÃO:</div>
                  <div className="text-right">{formatarDataHoraISO(referencia.dataManipulacao)}</div>
                  <div className="font-bold">VALIDADE:</div>
                  <div className="text-right">{referencia.dataValidade ? formatarDataHoraISO(referencia.dataValidade) : '-'}</div>
                  <div className="font-bold">MARCA / FORN:</div>
                  <div className="text-right">{referencia.marca}</div>
                  <div className="font-bold">SIF:</div>
                  <div className="text-right">{referencia.sif}</div>
                </div>
              </div>
              <div className="absolute left-4 right-4 bottom-4 flex items-end justify-between">
                <div className="text-[10px] text-gray-800">
                  <div><span className="font-bold">RESP.:</span> {referencia.resp}</div>
                  <div>RESTAURANTE SUFLEX</div>
                  <div>CNPJ: 12.345.678.0001-12  CEP: 05435-030</div>
                  <div>RUA PURPURINA, 400</div>
                  <div>SÃO PAULO - SP</div>
                  <div className="font-semibold">#T154B3</div>
                </div>
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="QR" className="w-16 h-16" />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


