import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import type { ImportProductRow } from '@/services/importService'

const FIELD_OPTIONS: { value: keyof ImportProductRow | ''; label: string }[] = [
  { value: '', label: '(Ignorar)' },
  { value: 'name', label: 'Nome do produto *' },
  { value: 'category', label: 'Categoria' },
  { value: 'subcategory', label: 'Subcategoria' },
  { value: 'brand', label: 'Marca' },
  { value: 'type', label: 'Tipo' },
  { value: 'shelfLifeAmbient', label: 'Validade ambiente (dias)' },
  { value: 'shelfLifeRefrigerated', label: 'Validade refrigerado (dias)' },
  { value: 'shelfLifeFrozen', label: 'Validade congelado (dias)' },
  { value: 'ingredients', label: 'Ingredientes' },
  { value: 'allergens', label: 'Alérgenos' },
]

const AUTO_MAP: Record<string, keyof ImportProductRow> = {
  nome: 'name',
  produto: 'name',
  name: 'name',
  product: 'name',
  categoria: 'category',
  category: 'category',
  subcategoria: 'subcategory',
  subcategory: 'subcategory',
  marca: 'brand',
  brand: 'brand',
  tipo: 'type',
  type: 'type',
  'validade ambiente': 'shelfLifeAmbient',
  'shelf life ambient': 'shelfLifeAmbient',
  'validade refrigerado': 'shelfLifeRefrigerated',
  'validade refrigerada': 'shelfLifeRefrigerated',
  'validade congelado': 'shelfLifeFrozen',
  'validade congelada': 'shelfLifeFrozen',
  ingredientes: 'ingredients',
  ingredients: 'ingredients',
  alergenos: 'allergens',
  'alérgenos': 'allergens',
  allergens: 'allergens',
}

interface Props {
  headers: string[]
  previewRows: Record<string, string>[]
  onMapped: (mapping: Record<string, keyof ImportProductRow>) => void
}

export default function ImportMappingStep({ headers, previewRows, onMapped }: Props) {
  const { theme } = useTheme()
  const [mapping, setMapping] = useState<Record<string, string>>({})

  useEffect(() => {
    // Auto-detect mapping
    const auto: Record<string, string> = {}
    const usedFields = new Set<string>()
    for (const h of headers) {
      const key = h.toLowerCase().trim()
      const match = AUTO_MAP[key]
      if (match && !usedFields.has(match)) {
        auto[h] = match
        usedFields.add(match)
      }
    }
    setMapping(auto)
  }, [headers])

  const hasName = Object.values(mapping).includes('name')

  const handleChange = (header: string, value: string) => {
    setMapping((prev) => ({ ...prev, [header]: value }))
  }

  const handleConfirm = () => {
    const validMapping: Record<string, keyof ImportProductRow> = {}
    for (const [header, field] of Object.entries(mapping)) {
      if (field) validMapping[header] = field as keyof ImportProductRow
    }
    onMapped(validMapping)
  }

  return (
    <div className="space-y-4">
      <p className={`text-sm ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
        Associe cada coluna do arquivo a um campo do produto. O campo <strong>Nome</strong> é obrigatório.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className={`text-left px-3 py-2 font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                Coluna do arquivo
              </th>
              <th className={`text-left px-3 py-2 font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                Campo do produto
              </th>
              <th className={`text-left px-3 py-2 font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                Preview
              </th>
            </tr>
          </thead>
          <tbody>
            {headers.map((h) => (
              <tr
                key={h}
                className={`border-t ${theme === 'dark' ? 'border-dark-600' : 'border-light-200'}`}
              >
                <td className={`px-3 py-3 font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  {h}
                </td>
                <td className="px-3 py-3">
                  <select
                    value={mapping[h] || ''}
                    onChange={(e) => handleChange(h, e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark'
                        ? 'bg-dark-700 border-dark-500 text-white'
                        : 'bg-white border-light-300 text-dark-900'
                    }`}
                  >
                    {FIELD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className={`px-3 py-3 text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-dark-500'}`}>
                  {previewRows
                    .slice(0, 3)
                    .map((r) => String(r[h] ?? '').slice(0, 30))
                    .join(' | ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!hasName && (
        <p className="text-sm text-red-500 font-medium">
          Mapeie pelo menos uma coluna para "Nome do produto"
        </p>
      )}

      <button
        onClick={handleConfirm}
        disabled={!hasName}
        className={`w-full py-3 rounded-lg font-medium transition-colors ${
          hasName
            ? 'bg-primary text-white hover:bg-primary/90'
            : theme === 'dark'
            ? 'bg-dark-600 text-dark-400 cursor-not-allowed'
            : 'bg-light-200 text-dark-400 cursor-not-allowed'
        }`}
      >
        Confirmar mapeamento
      </button>
    </div>
  )
}
