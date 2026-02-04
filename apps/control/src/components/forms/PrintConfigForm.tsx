import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  printConfigService,
  printersService,
  studioTemplatesService,
  devicesService,
  type PrintConfigResponse,
  type UpdatePrintConfigDto,
  type Printer,
  type StudioTemplate,
} from '../../services/api';
import type { EdgeGoDevice } from '../../types/api';

interface PrintConfigFormProps {
  clientId: string;
}

export function PrintConfigForm({ clientId }: PrintConfigFormProps) {
  const [config, setConfig] = useState<PrintConfigResponse | null>(null);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [studioTemplates, setStudioTemplates] = useState<StudioTemplate[]>([]);
  const [studioTemplatesError, setStudioTemplatesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [tagmentLogoUuid, setTagmentLogoUuid] = useState('');
  const [defaultPrinterValidadeId, setDefaultPrinterValidadeId] = useState('');
  const [defaultPrinterRotuloId, setDefaultPrinterRotuloId] = useState('');
  const [defaultValidityTemplateId, setDefaultValidityTemplateId] = useState('');
  const [defaultRotuloTemplateId, setDefaultRotuloTemplateId] = useState('');
  const [defaultShippingLabelDeviceId, setDefaultShippingLabelDeviceId] = useState('');
  const [defaultDanfeLabelDeviceId, setDefaultDanfeLabelDeviceId] = useState('');
  const [edgeDevices, setEdgeDevices] = useState<EdgeGoDevice[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setStudioTemplatesError(null);
    Promise.all([
      printConfigService.get(clientId),
      printersService.getAll(clientId),
      studioTemplatesService.getByClient(clientId).catch((err) => {
        const message = err.response?.data?.message ?? err.message ?? 'Erro ao carregar templates';
        if (!cancelled) setStudioTemplatesError(message);
        console.warn('[PrintConfigForm] Falha ao carregar templates do Studio:', err.response?.data ?? err.message);
        return [] as StudioTemplate[];
      }),
      devicesService.getEdgeGoByClient(clientId).catch(() => [] as EdgeGoDevice[]),
    ])
      .then(([cfg, prs, templates, edgeList]) => {
        if (cancelled) return;
        setConfig(cfg);
        setTagmentLogoUuid(cfg.tagmentLogoUuid ?? '');
        setDefaultPrinterValidadeId(cfg.defaultPrinterValidadeId ?? '');
        setDefaultPrinterRotuloId(cfg.defaultPrinterRotuloId ?? '');
        setDefaultValidityTemplateId(cfg.defaultValidityTemplateId ?? '');
        setDefaultRotuloTemplateId(cfg.defaultRotuloTemplateId ?? '');
        setDefaultShippingLabelDeviceId(cfg.defaultShippingLabelDeviceId ?? '');
        setDefaultDanfeLabelDeviceId(cfg.defaultDanfeLabelDeviceId ?? '');
        setPrinters(prs);
        setStudioTemplates(templates ?? []);
        setEdgeDevices(edgeList ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message ?? err.message ?? 'Erro ao carregar');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);
    const dto: UpdatePrintConfigDto = {
      templateProvider: 'granobox', // Apenas Granobox é suportado
      defaultPrinterValidadeId: defaultPrinterValidadeId || undefined,
      defaultPrinterRotuloId: defaultPrinterRotuloId || undefined,
      defaultShippingLabelDeviceId: defaultShippingLabelDeviceId || undefined,
      defaultDanfeLabelDeviceId: defaultDanfeLabelDeviceId || undefined,
      tagmentLogoUuid: tagmentLogoUuid.trim() || undefined,
      defaultValidityTemplateId: defaultValidityTemplateId.trim() || undefined,
      defaultRotuloTemplateId: defaultRotuloTemplateId.trim() || undefined,
    };
    try {
      const updated = await printConfigService.update(clientId, dto);
      setConfig(updated);
      setSuccess(true);
      setTagmentApiKey('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            <p className="mt-3 text-sm">Carregando configuração...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-erp border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-800">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-erp border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800">
          Configuração salva com sucesso.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-section-title">Logo do cliente</CardTitle>
          <p className="text-sm text-gray-600">
            UUID do logo do cliente para uso nos templates do Granobox Studio.
          </p>
        </CardHeader>
        <CardContent>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              UUID do logo do cliente
            </label>
            <Input
              placeholder="UUID do logo do cliente"
              value={tagmentLogoUuid}
              onChange={(e) => setTagmentLogoUuid(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-section-title">Edge / Impressora para etiquetas de pedido</CardTitle>
          <p className="text-sm text-gray-600">
            Dispositivo Edge-Go usado por padrão para impressão de etiqueta de envio e etiqueta DANFE (caixa).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Etiqueta de envio
            </label>
            <select
              value={defaultShippingLabelDeviceId}
              onChange={(e) => setDefaultShippingLabelDeviceId(e.target.value)}
              className="h-10 w-full rounded-erp border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Nenhum</option>
              {edgeDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.name ?? d.deviceId}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Etiqueta DANFE (caixa)
            </label>
            <select
              value={defaultDanfeLabelDeviceId}
              onChange={(e) => setDefaultDanfeLabelDeviceId(e.target.value)}
              className="h-10 w-full rounded-erp border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Nenhum</option>
              {edgeDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.name ?? d.deviceId}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-section-title">Impressoras padrão</CardTitle>
          <p className="text-sm text-gray-600">
            Impressoras usadas por padrão para etiqueta de validade e rótulo.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Impressora padrão (validade)
            </label>
            <select
              value={defaultPrinterValidadeId}
              onChange={(e) => setDefaultPrinterValidadeId(e.target.value)}
              className="h-10 w-full rounded-erp border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Nenhuma</option>
              {printers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Impressora padrão (rótulo)
            </label>
            <select
              value={defaultPrinterRotuloId}
              onChange={(e) => setDefaultPrinterRotuloId(e.target.value)}
              className="h-10 w-full rounded-erp border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Nenhuma</option>
              {printers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
          <CardHeader>
            <CardTitle className="text-section-title">Templates padrão (Granobox)</CardTitle>
            <p className="text-sm text-gray-600">
              Templates do Studio disponíveis para este cliente (próprios e públicos com acesso).
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {studioTemplatesError && (
              <div className="flex items-center justify-between gap-3 rounded-erp border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <span>Não foi possível carregar os templates: {studioTemplatesError}</span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    setStudioTemplatesError(null);
                    try {
                      const templates = await studioTemplatesService.getByClient(clientId);
                      setStudioTemplates(templates);
                    } catch (err: any) {
                      const msg = err.response?.data?.message ?? err.message ?? 'Erro ao carregar';
                      setStudioTemplatesError(msg);
                    }
                  }}
                >
                  Tentar novamente
                </Button>
              </div>
            )}
            {!studioTemplatesError && studioTemplates.length === 0 && (
              <p className="text-sm text-gray-500">
                Nenhum template do Studio para este cliente. Crie templates no Studio (studio.granobox.com.br) para este cliente ou atribua templates públicos ao cliente.
              </p>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Template padrão (validade)
              </label>
              <select
                value={defaultValidityTemplateId}
                onChange={(e) => setDefaultValidityTemplateId(e.target.value)}
                className="h-10 w-full rounded-erp border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Nenhum</option>
                {studioTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Template padrão (rótulo)
              </label>
              <select
                value={defaultRotuloTemplateId}
                onChange={(e) => setDefaultRotuloTemplateId(e.target.value)}
                className="h-10 w-full rounded-erp border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Nenhum</option>
                {studioTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar configuração'}
        </Button>
      </div>
    </form>
  );
}
