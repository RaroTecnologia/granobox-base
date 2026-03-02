import { useState, useEffect } from 'react';
import { QrCode, Plus, Funnel } from '@phosphor-icons/react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { supplyRollsService, type SupplyRoll, type CreateBatchDto } from '../services/supplyRollsService';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface LabelSku {
  id: string;
  name: string;
  labelsPerRoll?: number;
}

interface SupplyRollsGeneratorProps {
  clientId: string;
}

export function SupplyRollsGenerator({ clientId }: SupplyRollsGeneratorProps) {
  const [skus, setSkus] = useState<LabelSku[]>([]);
  const [rolls, setRolls] = useState<SupplyRoll[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRolls, setLoadingRolls] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Form state
  const [selectedSkuId, setSelectedSkuId] = useState('');
  const [rollType, setRollType] = useState<'LABEL' | 'RIBBON'>('LABEL');
  const [quantity, setQuantity] = useState(10);
  const [batchCode, setBatchCode] = useState('');

  useEffect(() => {
    loadSkus();
    loadRolls();
  }, [clientId]);

  const loadSkus = async () => {
    try {
      const { data } = await api.get('/label-skus');
      setSkus(data);
    } catch {
      toast.error('Erro ao carregar SKUs');
    }
  };

  const loadRolls = async () => {
    setLoadingRolls(true);
    try {
      const data = await supplyRollsService.getByClient(clientId, filterStatus || undefined);
      setRolls(data);
    } catch {
      toast.error('Erro ao carregar rolos');
    } finally {
      setLoadingRolls(false);
    }
  };

  useEffect(() => {
    loadRolls();
  }, [filterStatus]);

  const generateBatchCode = () => {
    const now = new Date();
    const code = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setBatchCode(code);
  };

  const handleGenerate = async () => {
    if (!selectedSkuId) {
      toast.error('Selecione um SKU');
      return;
    }
    if (quantity < 1 || quantity > 500) {
      toast.error('Quantidade deve ser entre 1 e 500');
      return;
    }

    setLoading(true);
    try {
      const dto: CreateBatchDto = {
        skuId: selectedSkuId,
        type: rollType,
        quantity,
        batchCode: batchCode || undefined,
        clientId,
      };
      const newRolls = await supplyRollsService.createBatch(dto);
      toast.success(`${newRolls.length} rolo(s) gerado(s) com sucesso`);
      setShowForm(false);
      setSelectedSkuId('');
      setQuantity(10);
      setBatchCode('');
      loadRolls();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao gerar rolos');
    } finally {
      setLoading(false);
    }
  };

  const generateQrZpl = (rollsToExport: SupplyRoll[]) => {
    const zplCommands = rollsToExport.map((roll) => {
      const skuName = roll.sku?.name || 'SKU';
      const typeLabel = roll.type === 'LABEL' ? 'Etiqueta' : 'Ribbon';
      // Usar shortCode no QR (mais compacto) ou UUID como fallback
      const qrContent = roll.shortCode || roll.id;
      return [
        '^XA',
        '^FO20,20^BQN,2,4^FDLA,' + qrContent + '^FS',
        '^FO150,20^A0N,20,20^FD' + skuName + '^FS',
        '^FO150,45^A0N,16,16^FD' + typeLabel + ' - Lote ' + roll.batchCode + '^FS',
        roll.shortCode ? '^FO150,70^A0N,14,14^FD' + roll.shortCode + '^FS' : '',
        '^XZ',
      ].filter(Boolean).join('\n');
    });
    return zplCommands.join('\n');
  };

  const handlePrintQrCodes = () => {
    const inStockRolls = rolls.filter((r) => r.status === 'IN_STOCK');
    if (inStockRolls.length === 0) {
      toast.error('Nenhum rolo em estoque para imprimir QR');
      return;
    }
    const zpl = generateQrZpl(inStockRolls);

    // Copy ZPL to clipboard
    navigator.clipboard.writeText(zpl).then(() => {
      toast.success(`ZPL de ${inStockRolls.length} QR code(s) copiado para clipboard`);
    }).catch(() => {
      // Fallback: download as file
      const blob = new Blob([zpl], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-codes-${new Date().toISOString().slice(0, 10)}.zpl`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Arquivo ZPL baixado');
    });
  };

  const statusColors: Record<string, string> = {
    IN_STOCK: 'bg-blue-100 text-blue-700',
    ASSIGNED: 'bg-yellow-100 text-yellow-700',
    INSTALLED: 'bg-green-100 text-green-700',
    DEPLETED: 'bg-gray-100 text-gray-500',
  };

  const statusLabels: Record<string, string> = {
    IN_STOCK: 'Em estoque',
    ASSIGNED: 'Atribuido',
    INSTALLED: 'Instalado',
    DEPLETED: 'Esgotado',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Rolos de Suprimentos</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintQrCodes}
            disabled={rolls.filter((r) => r.status === 'IN_STOCK').length === 0}
          >
            <QrCode size={16} className="mr-1" />
            Imprimir QR Codes
          </Button>
          <Button size="sm" onClick={() => { setShowForm(true); generateBatchCode(); }}>
            <Plus size={16} className="mr-1" />
            Gerar Rolos
          </Button>
        </div>
      </div>

      {/* Generation form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Gerar Lote de Rolos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={selectedSkuId}
                  onChange={(e) => setSelectedSkuId(e.target.value)}
                >
                  <option value="">Selecione um SKU...</option>
                  {skus.map((sku) => (
                    <option key={sku.id} value={sku.id}>
                      {sku.name} {sku.labelsPerRoll ? `(${sku.labelsPerRoll}/rolo)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={rollType}
                  onChange={(e) => setRollType(e.target.value as 'LABEL' | 'RIBBON')}
                >
                  <option value="LABEL">Etiqueta</option>
                  <option value="RIBBON">Ribbon</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade (1-500)</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(500, Math.max(1, parseInt(e.target.value) || 1)))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Codigo do Lote</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value)}
                    placeholder="Auto-gerado se vazio"
                  />
                  <Button variant="outline" size="sm" onClick={generateBatchCode}>
                    Auto
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? 'Gerando...' : `Gerar ${quantity} Rolo(s)`}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Funnel size={16} className="text-gray-500" />
        <select
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="IN_STOCK">Em estoque</option>
          <option value="ASSIGNED">Atribuidos</option>
          <option value="INSTALLED">Instalados</option>
          <option value="DEPLETED">Esgotados</option>
        </select>
        <span className="text-sm text-gray-500">{rolls.length} rolo(s)</span>
      </div>

      {/* Rolls list */}
      {loadingRolls ? (
        <div className="text-center py-8 text-gray-500">Carregando rolos...</div>
      ) : rolls.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Nenhum rolo encontrado. Clique em "Gerar Rolos" para criar.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Codigo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lote</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Uso</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Criado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rolls.map((roll) => (
                <tr key={roll.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-xs font-mono text-gray-600" title={roll.id}>
                    {roll.shortCode || roll.id.slice(0, 8) + '...'}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {roll.type === 'LABEL' ? 'Etiqueta' : 'Ribbon'}
                  </td>
                  <td className="px-4 py-2 text-sm">{roll.sku?.name || '-'}</td>
                  <td className="px-4 py-2 text-sm font-mono">{roll.batchCode}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[roll.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabels[roll.status] || roll.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {roll.printsSinceInstall > 0 ? `${roll.printsSinceInstall} imp.` : '-'}
                    {roll.ribbonUsedMetersSinceInstall > 0 ? ` / ${roll.ribbonUsedMetersSinceInstall.toFixed(1)}m` : ''}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {new Date(roll.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
