import { useMemo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface SimulatedLabelPreviewProps {
  widthMm: number;
  heightMm: number;
  variables: Record<string, string>;
  layout: 'validity' | 'generic';
}

// Campos que representam o nome do produto (ficam em destaque no topo)
const PRODUCT_NAME_KEYS = [
  'nome_produto', 'produto', 'nome', 'name', 'product', 'product_name',
  'nome_do_produto', 'produto_nome',
];

// Campos de conservação/validade para o layout validity
const CONSERVATION_LABELS: Record<string, string> = {
  ambiente: 'VALIDADE AMBIENTE',
  refrigerado: 'VALIDADE REFRIGERADO',
  congelado: 'VALIDADE CONGELADO',
  validade_original: 'VALIDADE ORIGINAL',
  indeterminada: 'VALIDADE INDETERMINADA',
};

function isProductNameKey(key: string): boolean {
  const lower = key.toLowerCase();
  return PRODUCT_NAME_KEYS.some(k => lower === k || lower.includes('nome_produto') || lower.includes('product_name'));
}

function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function formatDateBR(isoDate: string): string {
  if (!isoDate) return '';
  // Already in dd/mm/yyyy format
  if (/^\d{2}\/\d{2}\/\d{4}/.test(isoDate)) return isoDate;
  // ISO format yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(isoDate)) {
    const [y, m, d] = isoDate.split('-');
    return `${d}/${m}/${y}`;
  }
  return isoDate;
}

export default function SimulatedLabelPreview({ widthMm, heightMm, variables, layout }: SimulatedLabelPreviewProps) {
  const { theme } = useTheme();

  const aspectRatio = widthMm / heightMm;

  const conservationLabel = useMemo(() => {
    const cons = variables.conservacao || variables.conservation || variables.tipo_conservacao || '';
    return CONSERVATION_LABELS[cons.toLowerCase()] || (cons ? `VALIDADE ${cons.toUpperCase()}` : 'VALIDADE');
  }, [variables]);

  const productName = useMemo(() => {
    for (const key of Object.keys(variables)) {
      if (isProductNameKey(key) && variables[key]) return variables[key];
    }
    return '';
  }, [variables]);

  // For generic layout, separate product-name fields from the rest
  const genericFields = useMemo(() => {
    if (layout !== 'generic') return { highlight: [] as [string, string][], rest: [] as [string, string][] };
    const highlight: [string, string][] = [];
    const rest: [string, string][] = [];
    for (const [key, value] of Object.entries(variables)) {
      if (isProductNameKey(key)) {
        highlight.push([key, value]);
      } else {
        rest.push([key, value]);
      }
    }
    return { highlight, rest };
  }, [variables, layout]);

  const isDark = theme === 'dark';
  const borderColor = isDark ? '#555' : '#ccc';

  if (layout === 'validity') {
    return (
      <div
        className="w-full mb-4"
        style={{ maxWidth: 400 }}
      >
        <div
          style={{
            aspectRatio: `${aspectRatio}`,
            width: '100%',
            border: `2px dashed ${borderColor}`,
            borderRadius: 8,
            background: '#fff',
            padding: '5% 6%',
            fontFamily: '"Courier New", Courier, monospace',
            color: '#111',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Conservation header */}
          <div style={{ fontSize: '0.65em', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#666' }}>
            {conservationLabel}
          </div>

          {/* Product name */}
          <div style={{ fontSize: '0.85em', fontWeight: 800, marginTop: 2, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {productName || <span style={{ color: '#bbb' }}>—</span>}
          </div>

          {/* Brand / SIF line */}
          <div style={{ fontSize: '0.55em', color: '#555', marginTop: 1, display: 'flex', gap: 12 }}>
            {(variables.marca || variables.brand) && (
              <span>Marca: {variables.marca || variables.brand}</span>
            )}
            {(variables.sif || variables.codigo_sif) && (
              <span>SIF: {variables.sif || variables.codigo_sif}</span>
            )}
          </div>

          {/* Data fields */}
          <div style={{ fontSize: '0.55em', lineHeight: 1.6, marginTop: 4, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {(variables.data_manipulacao || variables.manipulacao || variables.dataManipulacao) && (
              <div>Manip: {formatDateBR(variables.data_manipulacao || variables.manipulacao || variables.dataManipulacao || '')}</div>
            )}
            {(variables.data_validade || variables.validade || variables.dataValidade) && (
              <div style={{ fontWeight: 700 }}>
                Validade: {formatDateBR(variables.data_validade || variables.validade || variables.dataValidade || '')}
              </div>
            )}
            {(variables.lote_fabricacao || variables.loteFabricacao) && (
              <div>Lote: {variables.lote_fabricacao || variables.loteFabricacao}</div>
            )}
            {(variables.peso || variables.weight) && (
              <div>Peso: {variables.peso || variables.weight} {variables.unidade || variables.unit || ''}</div>
            )}
            {(variables.local || variables.local_armazenamento || variables.localArmazenamento) && (
              <div>Local: {variables.local || variables.local_armazenamento || variables.localArmazenamento}</div>
            )}
            {(variables.responsavel || variables.operador || variables.operator) && (
              <div>Resp: {variables.responsavel || variables.operador || variables.operator}</div>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 2 }}>
            {/* QR placeholder */}
            <div style={{
              width: '14%',
              aspectRatio: '1',
              border: '1px solid #ddd',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.4em',
              color: '#bbb',
            }}>
              QR
            </div>
            <div style={{ fontSize: '0.45em', color: '#aaa', fontWeight: 600 }}>
              GRANOBOX TAG
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Generic layout
  return (
    <div
      className="w-full mb-4"
      style={{ maxWidth: 400 }}
    >
      <div
        style={{
          aspectRatio: `${aspectRatio}`,
          width: '100%',
          border: `2px dashed ${borderColor}`,
          borderRadius: 8,
          background: '#fff',
          padding: '5% 6%',
          fontFamily: '"Courier New", Courier, monospace',
          color: '#111',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Highlighted product name fields */}
        {genericFields.highlight.map(([key, value]) => (
          <div
            key={key}
            style={{
              fontSize: '0.85em',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: 4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {value || <span style={{ color: '#bbb' }}>—</span>}
          </div>
        ))}

        {/* Rest of fields as LABEL: value pairs */}
        <div style={{ fontSize: '0.55em', lineHeight: 1.7, flex: 1, overflow: 'hidden' }}>
          {genericFields.rest.map(([key, value]) => (
            <div key={key} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <span style={{ textTransform: 'uppercase', fontWeight: 600, color: '#666' }}>
                {formatLabel(key)}:
              </span>{' '}
              {value ? (
                <span>{value}</span>
              ) : (
                <span style={{ color: '#bbb' }}>—</span>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
          <div style={{ fontSize: '0.45em', color: '#aaa', fontWeight: 600 }}>
            GRANOBOX TAG
          </div>
        </div>
      </div>
    </div>
  );
}
