'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { 
  PrinterIcon,
  PlusIcon,
  CheckCircleIcon,
  XMarkIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ConfiguracaoImpressora {
  id: string;
  nome: string;
  tipo: 'EPSON' | 'STAR' | 'GENERIC' | 'ELGIN' | 'ZEBRA_ZPL';
  interface: string;
  largura: number;
  ativa: boolean;
  configuracao?: string;
  usarAgent?: boolean;
  agentProfile?: string;
}

export default function ConfiguracaoImpressoraPage() {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoImpressora[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editando, setEditando] = useState<ConfiguracaoImpressora | null>(null);

  // Estados do formulário
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'EPSON' | 'STAR' | 'GENERIC' | 'ELGIN' | 'ZEBRA_ZPL'>('EPSON');
  const [modoImpressao, setModoImpressao] = useState<'CUPOM' | 'ETIQUETA'>('CUPOM');
  const [tipoInterface, setTipoInterface] = useState<'tcp' | 'usb' | 'bluetooth'>('tcp');
  const [enderecoIp, setEnderecoIp] = useState('192.168.1.100');
  const [porta, setPorta] = useState('9100');
  const [largura, setLargura] = useState(48);
  const [usarAgent, setUsarAgent] = useState(false);
  const [agentProfile, setAgentProfile] = useState('');
  // Etiqueta: DPI e preset
  const [dpi, setDpi] = useState<203 | 300>(203);
  const [etiquetaPreset, setEtiquetaPreset] = useState<'5x5' | 'custom'>('5x5');
  
  // Estados para descoberta Bluetooth
  const [dispositivosBluetooth, setDispositivosBluetooth] = useState<any[]>([]);
  const [escaneandoBluetooth, setEscaneandoBluetooth] = useState(false);
  const [servicoBluetoothDisponivel, setServicoBluetoothDisponivel] = useState(false);

  useEffect(() => {
    carregarConfiguracoes();
    verificarServicoBluetoothLocal();
  }, []);

  // Sincroniza largura (dots) quando etiqueta 5x5 e DPI mudam
  useEffect(() => {
    if (modoImpressao === 'ETIQUETA' && etiquetaPreset === '5x5') {
      const dotsPerMm = dpi === 203 ? 8 : 12;
      setLargura(50 * dotsPerMm);
    }
  }, [dpi, etiquetaPreset, modoImpressao]);

  const verificarServicoBluetoothLocal = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/status');
      if (response.ok) {
        setServicoBluetoothDisponivel(true);
        console.log('✅ Serviço Bluetooth local disponível');
      }
    } catch (error) {
      console.log('ℹ️ Serviço Bluetooth local não disponível');
      setServicoBluetoothDisponivel(false);
    }
  };

  const escanearDispositivosBluetooth = async () => {
    if (!servicoBluetoothDisponivel) {
      toast.error('Serviço Bluetooth local não está rodando');
      return;
    }

    setEscaneandoBluetooth(true);
    setDispositivosBluetooth([]);

    try {
      const response = await fetch('http://localhost:3001/api/bluetooth/scan');
      const data = await response.json();

      if (data.success) {
        setDispositivosBluetooth(data.devices);
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Erro ao escanear dispositivos');
      }
    } catch (error) {
      console.error('Erro ao escanear Bluetooth:', error);
      toast.error('Erro ao conectar com serviço Bluetooth');
    } finally {
      setEscaneandoBluetooth(false);
    }
  };

  const selecionarDispositivoBluetooth = (dispositivo: any) => {
    setEnderecoIp(dispositivo.address);
    setNome(nome || `Impressora ${dispositivo.name}`);
    toast.success(`Dispositivo selecionado: ${dispositivo.name}`);
  };

  const carregarConfiguracoes = async () => {
    try {
      const response = await fetch('/api/configuracoes-impressora');
      if (response.ok) {
        const data = await response.json();
        setConfiguracoes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleNovaConfiguracao = () => {
    setEditando(null);
    setNome('');
    setTipo('EPSON');
    setModoImpressao('CUPOM');
    setTipoInterface('tcp');
    setEnderecoIp('192.168.1.100');
    setPorta('9100');
    setLargura(48);
    setDpi(203);
    setEtiquetaPreset('5x5');
    setUsarAgent(false);
    setAgentProfile('');
    setShowModal(true);
  };

  const handleEditarConfiguracao = (config: ConfiguracaoImpressora) => {
    setEditando(config);
    setNome(config.nome);
    setTipo(config.tipo as any);
    setModoImpressao((config.tipo as any) === 'ZEBRA_ZPL' ? 'ETIQUETA' : 'CUPOM');
    
    // Parsear interface e configuracao
    if (config.interface === 'TCP') {
      setTipoInterface('tcp');
      if (config.configuracao) {
        const [ip, portaStr] = config.configuracao.split(':');
        setEnderecoIp(ip);
        setPorta(portaStr || '9100');
      } else {
        setEnderecoIp('192.168.1.100');
        setPorta('9100');
      }
    } else if (config.interface === 'USB') {
      setTipoInterface('usb');
      setEnderecoIp(config.configuracao || '');
      setPorta('9100');
    } else if (config.interface === 'BLUETOOTH') {
      setTipoInterface('bluetooth');
      setEnderecoIp(config.configuracao || '');
      setPorta('9100');
    } else {
      // Fallback para formato antigo
      if (config.interface.startsWith('tcp://')) {
        setTipoInterface('tcp');
        const url = config.interface.replace('tcp://', '');
        const [ip, portaStr] = url.split(':');
        setEnderecoIp(ip);
        setPorta(portaStr || '9100');
      } else {
        setTipoInterface('tcp');
        setEnderecoIp('192.168.1.100');
        setPorta('9100');
      }
    }
    
    setLargura(config.largura);
    setUsarAgent((config as any).usarAgent || false);
    setAgentProfile((config as any).agentProfile || '');
    // Inferir preset/dpi para etiqueta (heurística)
    if ((config as any).tipo === 'ZEBRA_ZPL') {
      if (Math.abs(config.largura - 400) <= 10) { setDpi(203); setEtiquetaPreset('5x5'); }
      else if (Math.abs(config.largura - 600) <= 15) { setDpi(300); setEtiquetaPreset('5x5'); }
      else { setEtiquetaPreset('custom'); }
    } else {
      setEtiquetaPreset('5x5');
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let interfaceStr = '';
      let configuracaoStr = '';
      
      if (tipoInterface === 'tcp') {
        interfaceStr = 'TCP';
        configuracaoStr = `${enderecoIp}:${porta}`;
      } else if (tipoInterface === 'bluetooth') {
        interfaceStr = 'BLUETOOTH';
        configuracaoStr = enderecoIp; // Para Bluetooth, usamos o caminho do dispositivo
      } else if (tipoInterface === 'usb') {
        interfaceStr = 'USB';
        configuracaoStr = enderecoIp; // Para USB, usa o nome da impressora
      }

      // Normalizar tipo conforme modo de impressão
      const tipoFinal = modoImpressao === 'ETIQUETA' ? 'ZEBRA_ZPL' : (tipo === 'ZEBRA_ZPL' ? 'EPSON' : tipo)
      const larguraFinal = modoImpressao === 'ETIQUETA' ? (largura || 800) : (largura < 16 ? 48 : largura)

      const dados = {
        nome,
        tipo: tipoFinal,
        interface: interfaceStr,
        configuracao: configuracaoStr,
        largura: larguraFinal,
        usarAgent,
        agentProfile,
      };

      const url = editando ? `/api/configuracoes-impressora/${editando.id}` : '/api/configuracoes-impressora';
      const method = editando ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      });

      if (response.ok) {
        toast.success(editando ? 'Configuração atualizada!' : 'Configuração criada!');
        setShowModal(false);
        carregarConfiguracoes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar configuração');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSubmitting(false);
    }
  };

  const ativarConfiguracao = async (id: string) => {
    try {
      const response = await fetch(`/api/configuracoes-impressora/${id}/ativar`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Configuração ativada!');
        carregarConfiguracoes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao ativar configuração');
      }
    } catch (error) {
      console.error('Erro ao ativar configuração:', error);
      toast.error('Erro ao ativar configuração');
    }
  };

  const imprimirEtiquetaZplTeste = async (config: ConfiguracaoImpressora) => {
    try {
      // Padrão 5x5cm (50x50mm) conforme seleção de DPI
      const widthDotsDefault = etiquetaPreset === '5x5' ? (dpi === 203 ? 400 : 600) : (config.largura || (dpi === 203 ? 400 : 600));
      const heightDots = widthDotsDefault; // 5x5: altura = largura
      const body: any = {
        data: {
          title: 'ETIQUETA TESTE',
          subtitle: etiquetaPreset === '5x5' ? `5x5 cm @ ${dpi} dpi` : `Largura: ${widthDotsDefault} dots`,
          lines: [
            `Impressora: ${config.nome}`,
            `Marca: ${config.tipo}`,
            `Interface: ${config.interface}`,
            `Data: ${new Date().toLocaleDateString('pt-BR')}`,
          ],
          qrcode: 'TEST-5x5',
          widthDots: widthDotsDefault,
          heightDots,
          // margens internas ~2mm (esquerda e inferior). Superior fica 0 para começar mais alto.
          marginLeftDots: (dpi === 203 ? 10 : 12) * 2,
          marginTopDots: 0, // topo 0 porque a impressora imprime invertida
          marginBottomDots: (dpi === 203 ? 10 : 12) * 3, // ~3mm no footer
          qrPaddingDots: 28,
          titleTopPaddingDots: 20,
          borderOnly: false,
          showBorder: false,
          // Sem ajuste manual de offsets
          labelShiftDots: 0,
          topOffsetDots: 0,
          calibrate: false,
        },
      };

      if (config.interface === 'TCP') {
        const cfg = (config.configuracao || '').trim();
        if (cfg.includes(':')) {
          const [host, p] = cfg.split(':');
          body.ip = host;
          body.port = parseInt(p || '9100', 10) || 9100;
        } else if (cfg) {
          body.ip = cfg;
          body.port = 9100;
        }
      }

      const response = await fetch('/api/imprimir-etiqueta-zpl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success('Etiqueta ZPL enviada!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao imprimir etiqueta');
      }
    } catch (error) {
      console.error('Erro ao imprimir etiqueta ZPL:', error);
      toast.error('Erro ao imprimir etiqueta ZPL');
    }
  };

  const imprimirEtiquetaTsplBorda = async (config: ConfiguracaoImpressora) => {
    try {
      const body: any = {
        data: {
          widthMm: 50,
          heightMm: 50,
          dpi: dpi,
          gapMm: 2,
          borderOnly: true,
          offsetX: 0,
          offsetY: 0,
        },
      };

      if (config.interface === 'TCP') {
        const cfg = (config.configuracao || '').trim();
        if (cfg.includes(':')) {
          const [host, p] = cfg.split(':');
          body.ip = host;
          body.port = parseInt(p || '9100', 10) || 9100;
        } else if (cfg) {
          body.ip = cfg;
          body.port = 9100;
        }
      }

      const response = await fetch('/api/imprimir-etiqueta-tspl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success('Etiqueta TSPL (borda) enviada!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao imprimir TSPL');
      }
    } catch (error) {
      console.error('Erro ao imprimir etiqueta TSPL:', error);
      toast.error('Erro ao imprimir etiqueta TSPL');
    }
  };

  const imprimirViaAgentZpl = async (config: ConfiguracaoImpressora) => {
    try {
      // Detectar agent local
      const base = 'http://127.0.0.1:9123';
      const health = await fetch(`${base}/health`).then(r => r.json()).catch(() => null);
      if (!health?.ok) {
        toast.error('Agent local não encontrado em 127.0.0.1:9123');
        return;
      }

      // Extrair IP:porta da impressora
      let ip: string | undefined;
      let port = 9100;
      const cfg = (config.configuracao || '').trim();
      if (cfg.includes(':')) {
        const [host, p] = cfg.split(':');
        ip = host; port = parseInt(p || '9100', 10) || 9100;
      } else if (cfg) {
        ip = cfg;
      }
      if (!ip) {
        toast.error('Configuração sem IP');
        return;
      }

      // Montar ZPL simples de teste (5x5, cabeçalho e QR)
      const dotsPerMm = dpi === 203 ? 8 : 12;
      const widthDots = etiquetaPreset === '5x5' ? (dpi === 203 ? 400 : 600) : (config.largura || 400);
      const margin = 2 * dotsPerMm; // 2mm
      const inner = widthDots - margin * 2;
      let zpl = '^XA\n^CI27\n';
      zpl += `^PW${widthDots}\n`;
      zpl += `^LL${widthDots}\n`;
      zpl += `^LH${margin},0\n`;
      zpl += '^CF0,40\n';
      zpl += `^FO0,16^FB${inner},1,0,L,0^FDETIQUETA VIA AGENT^FS\n`;
      zpl += '^CF0,28\n';
      zpl += `^FO0,64^FB${inner},2,30,L,0^FD5x5 cm @ ${dpi} dpi^FS\n`;
      // QR no canto inferior direito
      const qrScale = widthDots >= 600 ? 6 : 4;
      const qrSide = (21 + 8) * qrScale;
      const qrX = Math.max(0, inner - qrSide);
      const qrY = Math.max(0, widthDots - qrSide - 2 * dotsPerMm);
      zpl += `^FO${qrX},${qrY}^BQN,2,${qrScale}^FDLA,AGENT-OK^FS\n`;
      zpl += '^XZ\n';

      const resp = await fetch(`${base}/print/zpl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, port, zpl })
      });
      if (resp.ok) {
        toast.success('Enviado via Agent local');
      } else {
        const err = await resp.json().catch(() => ({} as any));
        toast.error(err?.error || 'Falha ao enviar via Agent');
      }
    } catch (e) {
      toast.error('Erro ao usar Agent local');
      console.error(e);
    }
  };

  const imprimirViaAgentEscpos = async (config: ConfiguracaoImpressora) => {
    try {
      const base = 'http://127.0.0.1:9123';
      const health = await fetch(`${base}/health`).then(r => r.json()).catch(() => null);
      if (!health?.ok) {
        toast.error('Agent local não encontrado em 127.0.0.1:9123');
        return;
      }

      // Extrair IP/porta
      let ip: string | undefined; let port = 9100;
      const cfgStr = (config.configuracao || '').trim();
      if (cfgStr.includes(':')) { const [host, p] = cfgStr.split(':'); ip = host; port = parseInt(p || '9100', 10) || 9100; }
      else if (cfgStr) { ip = cfgStr; }
      if (!ip) { toast.error('Configuração sem IP'); return; }

      // Montar bytes ESC/POS simples
      const ESC = 0x1B, GS = 0x1D;
      const data: number[] = [];
      data.push(ESC, 0x40); // init
      data.push(ESC, 0x61, 0x01); // center
      data.push(ESC, 0x45, 0x01); // bold on
      const title = 'TESTE ESC/POS VIA AGENT'; for (let i=0;i<title.length;i++) data.push(title.charCodeAt(i)); data.push(0x0A);
      data.push(ESC, 0x45, 0x00, ESC, 0x61, 0x00); // bold off, left
      const lines = [
        `Impressora: ${config.nome}`,
        `Tipo: ${config.tipo}`,
        `Interface: ${config.interface}`,
        `Largura: ${config.largura} colunas`,
        `Data: ${new Date().toLocaleString('pt-BR')}`
      ];
      for (const l of lines) { for (let i=0;i<l.length;i++) data.push(l.charCodeAt(i)); data.push(0x0A); }
      data.push(0x0A, 0x0A); // espaçamento
      data.push(GS, 0x56, 0x01); // corte parcial
      // Base64
      const bin = String.fromCharCode.apply(null, data as unknown as number[]);
      const dataBase64 = typeof btoa !== 'undefined' ? btoa(bin) : Buffer.from(bin, 'binary').toString('base64');

      const resp = await fetch(`${base}/print/escpos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ip, port, dataBase64 }) });
      if (!resp.ok) {
        const err = await resp.json().catch(()=>({} as any));
        toast.error(err?.error || 'Falha ao enviar via Agent');
        return;
      }
      toast.success('Cupom enviado via Agent local');
    } catch (e) {
      console.error(e);
      toast.error('Erro ao usar Agent local (ESC/POS)');
    }
  };

  const testarImpressora = async (config: ConfiguracaoImpressora) => {
    try {
      // Se for ZPL, redirecionar para teste ZPL
      if ((config as any).tipo === 'ZEBRA_ZPL') {
        await imprimirEtiquetaZplTeste(config);
        return;
      }
      // Se for Bluetooth e o serviço estiver disponível, usar o serviço local
      if (config.interface.includes('tty') || config.interface.includes('COM') || config.interface.includes(':')) {
        if (servicoBluetoothDisponivel) {
          const response = await fetch('http://localhost:3001/api/bluetooth/test', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              address: config.interface,
              name: config.nome
            }),
          });

          const data = await response.json();
          if (data.success) {
            toast.success(data.message);
          } else {
            toast.error(data.error || 'Erro no teste Bluetooth');
          }
          return;
        }
      }

      // Fallback para teste padrão
      const response = await fetch('/api/testar-impressora', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ configuracaoId: config.id }),
      });

      if (response.ok) {
        toast.success('Teste de impressão enviado!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro no teste de impressão');
      }
    } catch (error) {
      console.error('Erro no teste:', error);
      toast.error('Erro no teste de impressão');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configuração da Impressora</h1>
              <p className="mt-2 text-gray-600">Configure sua impressora térmica para impressão de separações</p>
            </div>
            <button
              onClick={handleNovaConfiguracao}
              className="btn-primary flex items-center"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Nova Configuração
            </button>
          </div>

          {/* Lista de Configurações */}
          <div className="space-y-4">
            {configuracoes.map((config) => (
              <div key={config.id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${config.ativa ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <PrinterIcon className={`w-6 h-6 ${config.ativa ? 'text-green-600' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">{config.nome}</h3>
                        {config.ativa && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircleIcon className="w-3 h-3 mr-1" />
                            Ativa
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        <p><strong>Tipo:</strong> {config.tipo === 'ZEBRA_ZPL' ? 'Etiqueta (ZPL)' : config.tipo}</p>
                        <p><strong>Interface:</strong> {config.interface}</p>
                        <p><strong>Largura:</strong> {config.tipo === 'ZEBRA_ZPL' ? `${config.largura} dots` : `${config.largura} caracteres`}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => testarImpressora(config)}
                      className="btn-outline text-sm"
                    >
                      {(config as any).tipo === 'ZEBRA_ZPL' ? 'Testar (ZPL)' : 'Testar'}
                    </button>
                    {(config as any).tipo === 'ZEBRA_ZPL' && (
                      <button
                        onClick={() => imprimirEtiquetaZplTeste(config)}
                        className="btn-outline text-sm"
                      >
                        Etiqueta ZPL (teste)
                      </button>
                    )}
                    {(config as any).tipo === 'ZEBRA_ZPL' && (
                      <button
                        onClick={() => imprimirViaAgentZpl(config)}
                        className="btn-secondary text-sm"
                      >
                        Enviar via Agent (local)
                      </button>
                    )}
                    {(config as any).tipo !== 'ZEBRA_ZPL' && (
                      <button
                        onClick={() => imprimirViaAgentEscpos(config)}
                        className="btn-secondary text-sm"
                      >
                        Enviar via Agent (local)
                      </button>
                    )}
                    {!config.ativa && (
                      <button
                        onClick={() => ativarConfiguracao(config.id)}
                        className="btn-secondary text-sm"
                      >
                        Ativar
                      </button>
                    )}
                    <button
                      onClick={() => handleEditarConfiguracao(config)}
                      className="btn-outline text-sm"
                    >
                      <CogIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {configuracoes.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <PrinterIcon className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma impressora configurada</h3>
                <p className="text-gray-500 mb-4">Configure sua primeira impressora térmica.</p>
                <button
                  onClick={handleNovaConfiguracao}
                  className="btn-primary"
                >
                  Configurar Impressora
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Configuração */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <form onSubmit={handleSubmit}>
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editando ? 'Editar Configuração' : 'Nova Configuração'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Nome da configuração */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Configuração *</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="input-field"
                    placeholder="Ex: Impressora Cozinha"
                    required
                  />
                </div>

                {/* Tipo de impressão */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Impressão *</label>
                  <select
                    value={modoImpressao}
                    onChange={(e) => {
                      const novoModo = e.target.value as 'CUPOM' | 'ETIQUETA'
                      setModoImpressao(novoModo)
                      // Garantir estado consistente ao alternar
                      if (novoModo === 'CUPOM') {
                        // Se estava em ZPL, forçar tipo válido para cupom e largura padrão se necessário
                        setTipo((prev) => (prev === 'ZEBRA_ZPL' ? 'EPSON' : prev))
                        if (!largura || largura > 80) setLargura(48)
                      } else {
                        // Em etiqueta, largura é em dots; manter calculado pelo preset
                        const dotsPerMm = dpi === 203 ? 8 : 12
                        setLargura(50 * dotsPerMm)
                      }
                    }}
                    className="input-field"
                    required
                  >
                    <option value="CUPOM">Cupom (ESC/POS)</option>
                    <option value="ETIQUETA">Etiqueta (ZPL)</option>
                  </select>
                </div>

                {/* Marca e largura para CUPOM */}
                {modoImpressao === 'CUPOM' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Marca/Compatibilidade</label>
                      <select
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value as any)}
                        className="input-field"
                      >
                        <option value="EPSON">EPSON</option>
                        <option value="STAR">STAR</option>
                        <option value="GENERIC">GENERIC</option>
                        <option value="ELGIN">ELGIN</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Largura (caracteres por linha) *</label>
                      <input
                        type="number"
                        value={largura}
                        onChange={(e) => setLargura(parseInt(e.target.value) || 48)}
                        className="input-field"
                        min="32"
                        max="80"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Papel 80mm: 48 caracteres | Papel 58mm: 32 caracteres</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="inline-flex items-center space-x-2">
                          <input type="checkbox" checked={usarAgent} onChange={(e)=>setUsarAgent(e.target.checked)} />
                          <span>Usar Agent local</span>
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Perfil do Agent (opcional)</label>
                        <input type="text" value={agentProfile} onChange={(e)=>setAgentProfile(e.target.value)} className="input-field" placeholder="ex.: cupom" />
                        <p className="text-xs text-gray-500 mt-1">Quando marcado, o Web enviará via Agent usando este perfil.</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Etiqueta (ZPL): preset, DPI e largura calculada */}
                {modoImpressao === 'ETIQUETA' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Preset de Tamanho</label>
                        <select
                          value={etiquetaPreset}
                          onChange={(e) => setEtiquetaPreset(e.target.value as '5x5' | 'custom')}
                          className="input-field"
                        >
                          <option value="5x5">5x5 cm</option>
                          <option value="custom">Personalizado</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">DPI</label>
                        <select
                          value={dpi}
                          onChange={(e) => setDpi(parseInt(e.target.value, 10) as 203 | 300)}
                          className="input-field"
                        >
                          <option value={203}>203 dpi</option>
                          <option value={300}>300 dpi</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Largura da etiqueta (dots) *</label>
                      <input
                        type="number"
                        value={largura}
                        onChange={(e) => setLargura(parseInt(e.target.value) || 800)}
                        className="input-field"
                        min="300"
                        max="1200"
                        required
                        disabled={etiquetaPreset === '5x5'}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {etiquetaPreset === '5x5' ? (
                          <>5x5 cm @ {dpi} dpi = {dpi === 203 ? 400 : 600} dots</>
                        ) : (
                          <>4" @203dpi ≈ 800 dots. Ajuste conforme sua mídia.</>
                        )}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="inline-flex items-center space-x-2">
                          <input type="checkbox" checked={usarAgent} onChange={(e)=>setUsarAgent(e.target.checked)} />
                          <span>Usar Agent local</span>
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Perfil do Agent (opcional)</label>
                        <input type="text" value={agentProfile} onChange={(e)=>setAgentProfile(e.target.value)} className="input-field" placeholder="ex.: etiqueta" />
                        <p className="text-xs text-gray-500 mt-1">Quando marcado, o Web enviará via Agent usando este perfil.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Conexão *
                  </label>
                  <select
                    value={tipoInterface}
                    onChange={(e) => setTipoInterface(e.target.value as 'tcp' | 'usb' | 'bluetooth')}
                    className="input-field"
                    required
                  >
                    <option value="tcp">TCP/IP (Ethernet/WiFi)</option>
                    <option value="usb">USB</option>
                    <option value="bluetooth">Bluetooth</option>
                  </select>
                </div>

                {tipoInterface === 'tcp' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Endereço IP *
                      </label>
                      <input
                        type="text"
                        value={enderecoIp}
                        onChange={(e) => setEnderecoIp(e.target.value)}
                        className="input-field"
                        placeholder="192.168.1.100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Porta *
                      </label>
                      <input
                        type="text"
                        value={porta}
                        onChange={(e) => setPorta(e.target.value)}
                        className="input-field"
                        placeholder="9100"
                        required
                      />
                    </div>
                  </div>
                )}

                {tipoInterface === 'bluetooth' && (
                  <div className="space-y-4">
                    {servicoBluetoothDisponivel ? (
                      <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium text-green-900">Descoberta Automática:</h4>
                          <button
                            type="button"
                            onClick={escanearDispositivosBluetooth}
                            disabled={escaneandoBluetooth}
                            className="btn-outline text-xs"
                          >
                            {escaneandoBluetooth ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                                Escaneando...
                              </>
                            ) : (
                              'Escanear Dispositivos'
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-green-800">
                          Serviço Bluetooth detectado! Use o botão para encontrar impressoras automaticamente.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Configuração Manual:</h4>
                        <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                          <li>Pareie a impressora com o computador via Bluetooth</li>
                          <li>Anote o caminho do dispositivo serial criado</li>
                          <li>Digite o caminho no campo abaixo</li>
                        </ol>
                        <p className="text-xs text-blue-600 mt-2">
                          💡 Para descoberta automática, instale o serviço Bluetooth local
                        </p>
                      </div>
                    )}

                    {/* Lista de dispositivos encontrados */}
                    {dispositivosBluetooth.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-md p-3">
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Impressoras Encontradas:</h5>
                        <div className="space-y-2">
                          {dispositivosBluetooth.map((dispositivo, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                              onClick={() => selecionarDispositivoBluetooth(dispositivo)}
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900">{dispositivo.name}</p>
                                <p className="text-xs text-gray-500">{dispositivo.address}</p>
                              </div>
                              <button
                                type="button"
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Selecionar
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Endereço/Caminho do Dispositivo *
                      </label>
                      <input
                        type="text"
                        value={enderecoIp}
                        onChange={(e) => setEnderecoIp(e.target.value)}
                        className="input-field"
                        placeholder="XX:XX:XX:XX:XX:XX ou /dev/tty.SerialPort-1"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        <strong>Endereço Bluetooth:</strong> XX:XX:XX:XX:XX:XX<br/>
                        <strong>Dispositivo Serial:</strong> /dev/tty.SerialPort-1, COM3, etc.
                      </p>
                    </div>
                  </div>
                )}

                {tipoInterface === 'usb' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <h4 className="text-sm font-medium text-green-900 mb-2">✅ Impressora USB Detectada:</h4>
                      <div className="text-xs text-green-800 space-y-1">
                        <p><strong>GEZHI micro-printer</strong> - Disponível como: <code>GEZHI_micro_printer</code></p>
                        <p>💡 Use o nome exato da impressora no campo abaixo</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome da Impressora no Sistema *
                      </label>
                      <input
                        type="text"
                        value={enderecoIp}
                        onChange={(e) => setEnderecoIp(e.target.value)}
                        className="input-field"
                        placeholder="GEZHI_micro_printer"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        <strong>Dica:</strong> Use exatamente: <code>GEZHI_micro_printer</code>
                      </p>
                    </div>
                  </div>
                )}

                {/* Campo de largura global removido (duplicado). Campo correto já aparece em CUPOM e ETIQUETA acima. */}
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-outline"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    editando ? 'Atualizar' : 'Salvar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 