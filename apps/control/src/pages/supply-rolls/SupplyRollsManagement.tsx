import { useState, useEffect, useCallback } from 'react';
import {
  QrCode,
  Package,
  Truck,
  Plus,
  Funnel,
  ClipboardText,
  DownloadSimple,
  CheckCircle,
  ArrowRight,
} from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import {
  supplyRollsService,
  type SupplyRoll,
  type CreateBatchDto,
} from '../../services/supplyRollsService';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

// ── Types ──

interface LabelSku {
  id: string;
  code: string;
  name: string;
  labelsPerRoll?: number;
}

interface LabelOrder {
  id: string;
  clientId: string;
  client?: { tradeName?: string; companyName?: string };
  status: string;
  rolls: number;
  items?: LabelOrderItem[];
  createdAt: string;
}

interface LabelOrderItem {
  id: string;
  skuId: string;
  sku?: { id: string; name: string; code?: string };
  rolls: number;
  isRibbon: boolean;
}

type TabType = 'generate' | 'receive' | 'assign';

// ── Main Component ──

export function SupplyRollsManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('generate');

  const tabs: { id: TabType; label: string; icon: typeof QrCode }[] = [
    { id: 'generate', label: 'Gerar & Imprimir QR', icon: QrCode },
    { id: 'receive', label: 'Recebimento', icon: Package },
    { id: 'assign', label: 'Associar a Pedido', icon: Truck },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Rolos</h1>
        <p className="text-gray-600">
          Gere QR codes, registre NFs de fornecedor e associe rolos a pedidos.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-1 sm:gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'generate' && <GenerateTab />}
      {activeTab === 'receive' && <ReceiveTab />}
      {activeTab === 'assign' && <AssignTab />}
    </div>
  );
}

// ═══════════════════════════════════════════
// Tab 1 — Gerar & Imprimir QR
// ═══════════════════════════════════════════

function GenerateTab() {
  const [skus, setSkus] = useState<LabelSku[]>([]);
  const [rolls, setRolls] = useState<SupplyRoll[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRolls, setLoadingRolls] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form
  const [selectedSkuId, setSelectedSkuId] = useState('');
  const [rollType, setRollType] = useState<'LABEL' | 'RIBBON'>('LABEL');
  const [quantity, setQuantity] = useState(10);
  const [batchCode, setBatchCode] = useState('');

  // Filters
  const [filterBatchCode, setFilterBatchCode] = useState('');

  const loadSkus = useCallback(async () => {
    try {
      const { data } = await api.get('/label-skus');
      setSkus(data);
    } catch {
      toast.error('Erro ao carregar SKUs');
    }
  }, []);

  const loadRolls = useCallback(async () => {
    setLoadingRolls(true);
    try {
      const result = await supplyRollsService.getAll({
        status: 'in_stock',
        batchCode: filterBatchCode || undefined,
        limit: 200,
      });
      setRolls(result.data);
    } catch {
      toast.error('Erro ao carregar rolos');
    } finally {
      setLoadingRolls(false);
    }
  }, [filterBatchCode]);

  useEffect(() => {
    loadSkus();
  }, [loadSkus]);

  useEffect(() => {
    loadRolls();
  }, [loadRolls]);

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
    setLoading(true);
    try {
      const dto: CreateBatchDto = {
        skuId: selectedSkuId,
        type: rollType,
        quantity,
        batchCode: batchCode || undefined,
      };
      await supplyRollsService.createBatch(dto);
      toast.success(`${quantity} rolo(s) gerado(s) com sucesso`);
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
    return rollsToExport
      .map((roll) => {
        const skuName = roll.sku?.name || 'SKU';
        const typeLabel = roll.type === 'LABEL' ? 'Etiqueta' : 'Ribbon';
        const qrContent = roll.shortCode || roll.id;
        return [
          '^XA',
          '^FO20,20^BQN,2,4^FDLA,' + qrContent + '^FS',
          '^FO150,20^A0N,20,20^FD' + skuName + '^FS',
          '^FO150,45^A0N,16,16^FD' + typeLabel + ' - Lote ' + roll.batchCode + '^FS',
          roll.shortCode ? '^FO150,70^A0N,14,14^FD' + roll.shortCode + '^FS' : '',
          '^XZ',
        ]
          .filter(Boolean)
          .join('\n');
      })
      .join('\n');
  };

  const handleCopyZpl = () => {
    if (rolls.length === 0) {
      toast.error('Nenhum rolo para exportar');
      return;
    }
    const zpl = generateQrZpl(rolls);
    navigator.clipboard
      .writeText(zpl)
      .then(() => toast.success(`ZPL de ${rolls.length} QR code(s) copiado`))
      .catch(() => toast.error('Falha ao copiar'));
  };

  const handleDownloadZpl = () => {
    if (rolls.length === 0) {
      toast.error('Nenhum rolo para exportar');
      return;
    }
    const zpl = generateQrZpl(rolls);
    const blob = new Blob([zpl], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-codes-${new Date().toISOString().slice(0, 10)}.zpl`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Arquivo ZPL baixado');
  };

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Funnel size={16} className="text-gray-500" />
          <input
            type="text"
            placeholder="Filtrar por lote..."
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            value={filterBatchCode}
            onChange={(e) => setFilterBatchCode(e.target.value)}
          />
          <span className="text-sm text-gray-500">{rolls.length} rolo(s) em estoque</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyZpl}
            disabled={rolls.length === 0}
          >
            <ClipboardText size={16} className="mr-1" />
            Copiar ZPL
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadZpl}
            disabled={rolls.length === 0}
          >
            <DownloadSimple size={16} className="mr-1" />
            Download ZPL
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setShowForm(true);
              generateBatchCode();
            }}
          >
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade (1-500)
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.min(500, Math.max(1, parseInt(e.target.value) || 1)))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código do Lote
                </label>
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

      {/* Rolls table */}
      {loadingRolls ? (
        <div className="text-center py-8 text-gray-500">Carregando rolos...</div>
      ) : rolls.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Nenhum rolo em estoque. Clique em "Gerar Rolos" para criar.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Código
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  SKU
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Lote
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  NF
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Criado
                </th>
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
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {roll.supplierInvoice || '-'}
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

// ═══════════════════════════════════════════
// Tab 2 — Recebimento (NF fornecedor)
// ═══════════════════════════════════════════

function ReceiveTab() {
  const [rolls, setRolls] = useState<SupplyRoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [supplierInvoice, setSupplierInvoice] = useState('');
  const [receivedAt, setReceivedAt] = useState(new Date().toISOString().slice(0, 10));
  const [filterBatchCode, setFilterBatchCode] = useState('');

  const loadRolls = useCallback(async () => {
    setLoading(true);
    try {
      const result = await supplyRollsService.getAll({
        status: 'in_stock',
        hasInvoice: 'false',
        batchCode: filterBatchCode || undefined,
        limit: 500,
      });
      setRolls(result.data);
    } catch {
      toast.error('Erro ao carregar rolos');
    } finally {
      setLoading(false);
    }
  }, [filterBatchCode]);

  useEffect(() => {
    loadRolls();
  }, [loadRolls]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === rolls.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rolls.map((r) => r.id)));
    }
  };

  const selectByBatch = (batchCode: string) => {
    const ids = rolls.filter((r) => r.batchCode === batchCode).map((r) => r.id);
    setSelectedIds(new Set(ids));
  };

  const batchCodes = [...new Set(rolls.map((r) => r.batchCode).filter(Boolean))];

  const handleReceive = async () => {
    if (selectedIds.size === 0) {
      toast.error('Selecione ao menos um rolo');
      return;
    }
    if (!supplierInvoice.trim()) {
      toast.error('Informe o número da NF');
      return;
    }
    setSubmitting(true);
    try {
      const result = await supplyRollsService.receiveBatch({
        rollIds: Array.from(selectedIds),
        supplierInvoice: supplierInvoice.trim(),
        receivedAt: receivedAt || undefined,
      });
      toast.success(`${result.updated} rolo(s) atualizado(s) com NF ${supplierInvoice}`);
      setSelectedIds(new Set());
      setSupplierInvoice('');
      loadRolls();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao registrar recebimento');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Receive form */}
      <Card>
        <CardHeader>
          <CardTitle>Registrar Recebimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NF Fornecedor</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={supplierInvoice}
                onChange={(e) => setSupplierInvoice(e.target.value)}
                placeholder="Ex: NF-001234"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Recebimento
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={receivedAt}
                onChange={(e) => setReceivedAt(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleReceive}
                disabled={submitting || selectedIds.size === 0 || !supplierInvoice.trim()}
              >
                <CheckCircle size={16} className="mr-1" />
                {submitting
                  ? 'Salvando...'
                  : `Registrar ${selectedIds.size} rolo(s)`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Funnel size={16} className="text-gray-500" />
        <input
          type="text"
          placeholder="Filtrar por lote..."
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          value={filterBatchCode}
          onChange={(e) => setFilterBatchCode(e.target.value)}
        />
        {batchCodes.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {batchCodes.map((bc) => (
              <button
                key={bc}
                type="button"
                onClick={() => selectByBatch(bc!)}
                className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
              >
                {bc}
              </button>
            ))}
          </div>
        )}
        <span className="text-sm text-gray-500">
          {rolls.length} rolo(s) sem NF | {selectedIds.size} selecionado(s)
        </span>
      </div>

      {/* Rolls table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Carregando...</div>
      ) : rolls.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Todos os rolos em estoque já possuem NF registrada.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === rolls.length && rolls.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Código
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  SKU
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Lote
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Criado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rolls.map((roll) => (
                <tr
                  key={roll.id}
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selectedIds.has(roll.id) ? 'bg-primary-50' : ''
                  }`}
                  onClick={() => toggleSelect(roll.id)}
                >
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(roll.id)}
                      onChange={() => toggleSelect(roll.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-2 text-xs font-mono text-gray-600" title={roll.id}>
                    {roll.shortCode || roll.id.slice(0, 8) + '...'}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {roll.type === 'LABEL' ? 'Etiqueta' : 'Ribbon'}
                  </td>
                  <td className="px-4 py-2 text-sm">{roll.sku?.name || '-'}</td>
                  <td className="px-4 py-2 text-sm font-mono">{roll.batchCode}</td>
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

// ═══════════════════════════════════════════
// Tab 3 — Associar a Pedido
// ═══════════════════════════════════════════

function AssignTab() {
  const [orders, setOrders] = useState<LabelOrder[]>([]);
  const [rolls, setRolls] = useState<SupplyRoll[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingRolls, setLoadingRolls] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<LabelOrder | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterSkuId, setFilterSkuId] = useState('');

  // Load orders with status approved/processing
  useEffect(() => {
    const loadOrders = async () => {
      setLoadingOrders(true);
      try {
        const { data } = await api.get('/label-orders');
        const filtered = (data as LabelOrder[]).filter(
          (o) => o.status === 'approved' || o.status === 'processing',
        );
        setOrders(filtered);
      } catch {
        toast.error('Erro ao carregar pedidos');
      } finally {
        setLoadingOrders(false);
      }
    };
    loadOrders();
  }, []);

  // When order changes, load its details and available rolls
  useEffect(() => {
    if (!selectedOrderId) {
      setSelectedOrder(null);
      setRolls([]);
      return;
    }

    const loadOrderDetail = async () => {
      try {
        const { data } = await api.get(`/label-orders/${selectedOrderId}`);
        setSelectedOrder(data as LabelOrder);
      } catch {
        toast.error('Erro ao carregar pedido');
      }
    };

    const loadAvailableRolls = async () => {
      setLoadingRolls(true);
      try {
        const result = await supplyRollsService.getAll({
          status: 'in_stock',
          hasInvoice: 'true',
          skuId: filterSkuId || undefined,
          limit: 500,
        });
        setRolls(result.data);
      } catch {
        toast.error('Erro ao carregar rolos');
      } finally {
        setLoadingRolls(false);
      }
    };

    loadOrderDetail();
    loadAvailableRolls();
    setSelectedIds(new Set());
  }, [selectedOrderId, filterSkuId]);

  // Count assigned rolls for the current order
  const [assignedCount, setAssignedCount] = useState(0);
  useEffect(() => {
    if (!selectedOrderId) {
      setAssignedCount(0);
      return;
    }
    const countAssigned = async () => {
      try {
        const result = await supplyRollsService.getAll({
          status: 'assigned',
          limit: 500,
        });
        const count = result.data.filter((r) => r.orderId === selectedOrderId).length;
        setAssignedCount(count);
      } catch {
        // silent
      }
    };
    countAssigned();
  }, [selectedOrderId, submitting]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === rolls.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rolls.map((r) => r.id)));
    }
  };

  const handleAssign = async () => {
    if (!selectedOrderId) {
      toast.error('Selecione um pedido');
      return;
    }
    if (selectedIds.size === 0) {
      toast.error('Selecione ao menos um rolo');
      return;
    }
    setSubmitting(true);
    try {
      const result = await supplyRollsService.assignToOrder({
        rollIds: Array.from(selectedIds),
        orderId: selectedOrderId,
      });
      toast.success(`${result.assigned} rolo(s) vinculado(s) ao pedido`);
      setSelectedIds(new Set());
      // Reload rolls (assigned ones should disappear from IN_STOCK list)
      const updated = await supplyRollsService.getAll({
        status: 'in_stock',
        hasInvoice: 'true',
        skuId: filterSkuId || undefined,
        limit: 500,
      });
      setRolls(updated.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao vincular rolos');
    } finally {
      setSubmitting(false);
    }
  };

  const totalRollsNeeded = selectedOrder?.items?.reduce((sum, i) => sum + (i.rolls || 0), 0) || selectedOrder?.rolls || 0;

  // Get unique SKU ids from order items
  const orderSkuIds = selectedOrder?.items?.map((i) => i.skuId).filter(Boolean) || [];

  return (
    <div className="space-y-4">
      {/* Order selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingOrders ? (
            <div className="text-gray-500 text-sm">Carregando pedidos...</div>
          ) : orders.length === 0 ? (
            <div className="text-gray-400 text-sm">
              Nenhum pedido aprovado/em processamento encontrado.
            </div>
          ) : (
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
            >
              <option value="">Selecione um pedido...</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  #{order.id.slice(0, 8)} — {order.client?.tradeName || order.client?.companyName || order.clientId.slice(0, 8)} — {order.rolls} rolo(s) — {order.status}
                </option>
              ))}
            </select>
          )}
        </CardContent>
      </Card>

      {/* Order details + progress */}
      {selectedOrder && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Itens do Pedido</h3>
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-primary-600">{assignedCount}</span>
                <span className="text-gray-400"> / </span>
                <span className="font-semibold">{totalRollsNeeded}</span>
                <span className="text-gray-400"> rolos associados</span>
              </div>
            </div>

            {/* Progress bar */}
            {totalRollsNeeded > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (assignedCount / totalRollsNeeded) * 100)}%`,
                  }}
                />
              </div>
            )}

            {selectedOrder.items && selectedOrder.items.length > 0 ? (
              <div className="space-y-2">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <div>
                      <span className="font-medium">{item.sku?.name || 'SKU'}</span>
                      <span className="text-gray-400 ml-2">
                        {item.isRibbon ? '(Ribbon)' : '(Etiqueta)'}
                      </span>
                    </div>
                    <div className="font-mono text-gray-600">{item.rolls} rolo(s)</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                {selectedOrder.rolls} rolo(s) no pedido (sem itens detalhados)
              </div>
            )}

            {/* SKU filter shortcut */}
            {orderSkuIds.length > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">Filtrar rolos por SKU do pedido:</span>
                {selectedOrder.items?.map((item) => (
                  <button
                    key={item.skuId}
                    type="button"
                    onClick={() => setFilterSkuId(item.skuId === filterSkuId ? '' : item.skuId)}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      filterSkuId === item.skuId
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {item.sku?.name || item.skuId.slice(0, 8)}
                  </button>
                ))}
                {filterSkuId && (
                  <button
                    type="button"
                    onClick={() => setFilterSkuId('')}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    limpar
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available rolls for assignment */}
      {selectedOrderId && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm text-gray-500">
              {rolls.length} rolo(s) disponível(is) com NF | {selectedIds.size} selecionado(s)
            </span>
            <Button
              onClick={handleAssign}
              disabled={submitting || selectedIds.size === 0}
            >
              <ArrowRight size={16} className="mr-1" />
              {submitting
                ? 'Vinculando...'
                : `Vincular ${selectedIds.size} rolo(s) ao pedido`}
            </Button>
          </div>

          {loadingRolls ? (
            <div className="text-center py-8 text-gray-500">Carregando rolos...</div>
          ) : rolls.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Nenhum rolo disponível (IN_STOCK com NF). Registre o recebimento primeiro.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === rolls.length && rolls.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Código
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipo
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      SKU
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Lote
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      NF
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rolls.map((roll) => (
                    <tr
                      key={roll.id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedIds.has(roll.id) ? 'bg-primary-50' : ''
                      }`}
                      onClick={() => toggleSelect(roll.id)}
                    >
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(roll.id)}
                          onChange={() => toggleSelect(roll.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td
                        className="px-4 py-2 text-xs font-mono text-gray-600"
                        title={roll.id}
                      >
                        {roll.shortCode || roll.id.slice(0, 8) + '...'}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {roll.type === 'LABEL' ? 'Etiqueta' : 'Ribbon'}
                      </td>
                      <td className="px-4 py-2 text-sm">{roll.sku?.name || '-'}</td>
                      <td className="px-4 py-2 text-sm font-mono">{roll.batchCode}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {roll.supplierInvoice || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
