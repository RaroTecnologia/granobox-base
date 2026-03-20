import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { X } from '@phosphor-icons/react'

interface ExistingCategory {
  id: string
  name: string
  parentId?: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  existingCategories: ExistingCategory[]
  onApply: (changes: {
    categoryId?: string
    newCategoryName?: string
    shelfLifeAmbient?: number
    shelfLifeRefrigerated?: number
    shelfLifeFrozen?: number
    acceptCorrections?: boolean
  }) => void
}

export default function BatchEditModal({
  isOpen,
  onClose,
  selectedCount,
  existingCategories,
  onApply,
}: Props) {
  const { theme } = useTheme()
  const [mode, setMode] = useState<'category' | 'shelfLife' | 'accept'>('category')
  const [categoryId, setCategoryId] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [shelfLifeAmbient, setShelfLifeAmbient] = useState<string>('')
  const [shelfLifeRefrigerated, setShelfLifeRefrigerated] = useState<string>('')
  const [shelfLifeFrozen, setShelfLifeFrozen] = useState<string>('')

  if (!isOpen) return null

  const handleApply = () => {
    if (mode === 'category') {
      onApply({
        categoryId: categoryId || undefined,
        newCategoryName: !categoryId && newCategoryName ? newCategoryName : undefined,
      })
    } else if (mode === 'shelfLife') {
      onApply({
        shelfLifeAmbient: shelfLifeAmbient ? Number(shelfLifeAmbient) : undefined,
        shelfLifeRefrigerated: shelfLifeRefrigerated ? Number(shelfLifeRefrigerated) : undefined,
        shelfLifeFrozen: shelfLifeFrozen ? Number(shelfLifeFrozen) : undefined,
      })
    } else {
      onApply({ acceptCorrections: true })
    }
    onClose()
  }

  const inputClass = `w-full px-3 py-2 rounded-lg border ${
    theme === 'dark'
      ? 'bg-dark-700 border-dark-500 text-white'
      : 'bg-white border-light-300 text-dark-900'
  }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`w-full max-w-md mx-4 rounded-xl shadow-xl ${
          theme === 'dark' ? 'bg-dark-800' : 'bg-white'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-dark-600">
          <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
            Editar {selectedCount} itens
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-black/10">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Mode selector */}
          <div className="flex space-x-2">
            {(['category', 'shelfLife', 'accept'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-primary text-white'
                    : theme === 'dark'
                    ? 'bg-dark-700 text-dark-300'
                    : 'bg-light-100 text-dark-600'
                }`}
              >
                {m === 'category' ? 'Categoria' : m === 'shelfLife' ? 'Validades' : 'Aceitar correções'}
              </button>
            ))}
          </div>

          {mode === 'category' && (
            <div className="space-y-3">
              <label className={`text-sm font-medium ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                Categoria existente
              </label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value)
                  if (e.target.value) setNewCategoryName('')
                }}
                className={inputClass}
              >
                <option value="">Selecione...</option>
                {existingCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className={`text-xs text-center ${theme === 'dark' ? 'text-dark-500' : 'text-dark-400'}`}>
                ou
              </p>
              <input
                type="text"
                placeholder="Nova categoria"
                value={newCategoryName}
                onChange={(e) => {
                  setNewCategoryName(e.target.value)
                  if (e.target.value) setCategoryId('')
                }}
                className={inputClass}
              />
            </div>
          )}

          {mode === 'shelfLife' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={`text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  Ambiente (dias)
                </label>
                <input
                  type="number"
                  min={0}
                  value={shelfLifeAmbient}
                  onChange={(e) => setShelfLifeAmbient(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={`text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  Refrigerado (dias)
                </label>
                <input
                  type="number"
                  min={0}
                  value={shelfLifeRefrigerated}
                  onChange={(e) => setShelfLifeRefrigerated(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={`text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                  Congelado (dias)
                </label>
                <input
                  type="number"
                  min={0}
                  value={shelfLifeFrozen}
                  onChange={(e) => setShelfLifeFrozen(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {mode === 'accept' && (
            <p className={`text-sm ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
              Aceitar todas as correções de nome sugeridas pela IA para os {selectedCount} itens selecionados.
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-4 border-t border-dark-600">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              theme === 'dark'
                ? 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                : 'bg-light-100 text-dark-600 hover:bg-light-200'
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
