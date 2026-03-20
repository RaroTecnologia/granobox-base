import { useState, useMemo } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import {
  CaretDown,
  CaretRight,
  PencilSimple,
  CheckCircle,
  Warning,
  Info,
} from '@phosphor-icons/react'
import BatchEditModal from './BatchEditModal'
import type { AiAnalyzedItem, ExistingCategory } from '@/services/importService'

export interface ReviewItem extends AiAnalyzedItem {
  _index: number
  _selected: boolean
  _finalName: string
  _finalCategoryId?: string
  _finalNewCategoryName?: string
  _finalNewSubcategoryName?: string
  _finalParentCategoryId?: string
  _finalShelfLifeAmbient?: number
  _finalShelfLifeRefrigerated?: number
  _finalShelfLifeFrozen?: number
  _finalType: string
  _brand?: string
  _ingredients?: string
  _allergens?: string
}

interface Props {
  items: ReviewItem[]
  existingCategories: ExistingCategory[]
  onItemsChange: (items: ReviewItem[]) => void
  onConfirm: () => void
}

function getCategoryLabel(
  item: ReviewItem,
  categories: ExistingCategory[],
): string {
  if (item._finalCategoryId) {
    const cat = categories.find((c) => c.id === item._finalCategoryId)
    return cat?.name || 'Categoria existente'
  }
  if (item._finalNewCategoryName) return `${item._finalNewCategoryName} (nova)`
  const suggested = item.suggestedCategory
  if ('existingId' in suggested) {
    const cat = categories.find((c) => c.id === suggested.existingId)
    return cat?.name || 'Existente'
  }
  if ('newName' in suggested) return `${suggested.newName} (nova)`
  return 'Sem categoria'
}

function getGroupKey(item: ReviewItem, categories: ExistingCategory[]): string {
  return getCategoryLabel(item, categories)
}

const CONFIDENCE_STYLES = {
  high: { bg: 'bg-green-100 text-green-700', label: 'Alta' },
  medium: { bg: 'bg-yellow-100 text-yellow-700', label: 'Média' },
  low: { bg: 'bg-red-100 text-red-700', label: 'Baixa' },
}

export default function ImportReviewStep({
  items,
  existingCategories,
  onItemsChange,
  onConfirm,
}: Props) {
  const { theme } = useTheme()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [showBatchModal, setShowBatchModal] = useState(false)

  // Group items by category
  const groups = useMemo(() => {
    const map = new Map<string, ReviewItem[]>()
    for (const item of items) {
      const key = getGroupKey(item, existingCategories)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }
    return map
  }, [items, existingCategories])

  // Stats
  const totalProducts = items.length
  const newCategories = new Set(
    items
      .filter((i) => {
        if (i._finalNewCategoryName) return true
        const s = i.suggestedCategory
        return 'newName' in s && !i._finalCategoryId
      })
      .map((i) =>
        i._finalNewCategoryName ||
        ('newName' in i.suggestedCategory ? (i.suggestedCategory as any).newName : ''),
      ),
  ).size
  const corrections = items.filter((i) => i.nameWasCorrected).length
  const selectedCount = items.filter((i) => i._selected).length

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleSelect = (index: number) => {
    const updated = items.map((i) =>
      i._index === index ? { ...i, _selected: !i._selected } : i,
    )
    onItemsChange(updated)
  }

  const toggleSelectGroup = (groupKey: string) => {
    const groupItems = groups.get(groupKey) || []
    const allSelected = groupItems.every((i) => i._selected)
    const updated = items.map((i) => {
      if (getGroupKey(i, existingCategories) === groupKey) {
        return { ...i, _selected: !allSelected }
      }
      return i
    })
    onItemsChange(updated)
  }

  const handleBatchApply = (changes: {
    categoryId?: string
    newCategoryName?: string
    shelfLifeAmbient?: number
    shelfLifeRefrigerated?: number
    shelfLifeFrozen?: number
    acceptCorrections?: boolean
  }) => {
    const updated = items.map((i) => {
      if (!i._selected) return i
      const copy = { ...i }
      if (changes.categoryId) {
        copy._finalCategoryId = changes.categoryId
        copy._finalNewCategoryName = undefined
      }
      if (changes.newCategoryName) {
        copy._finalNewCategoryName = changes.newCategoryName
        copy._finalCategoryId = undefined
      }
      if (changes.shelfLifeAmbient !== undefined)
        copy._finalShelfLifeAmbient = changes.shelfLifeAmbient
      if (changes.shelfLifeRefrigerated !== undefined)
        copy._finalShelfLifeRefrigerated = changes.shelfLifeRefrigerated
      if (changes.shelfLifeFrozen !== undefined)
        copy._finalShelfLifeFrozen = changes.shelfLifeFrozen
      if (changes.acceptCorrections) {
        copy._finalName = copy.correctedName
      }
      return copy
    })
    onItemsChange(updated)
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div
        className={`flex items-center justify-between p-3 rounded-lg ${
          theme === 'dark' ? 'bg-dark-700' : 'bg-light-100'
        }`}
      >
        <div className="flex items-center space-x-4 text-sm">
          <span className={theme === 'dark' ? 'text-white' : 'text-dark-900'}>
            <strong>{totalProducts}</strong> produtos
          </span>
          {newCategories > 0 && (
            <span className="text-blue-500">
              <strong>{newCategories}</strong> categorias novas
            </span>
          )}
          {corrections > 0 && (
            <span className="text-green-500">
              <strong>{corrections}</strong> correções
            </span>
          )}
        </div>
      </div>

      {/* Groups */}
      {Array.from(groups.entries()).map(([groupKey, groupItems]) => {
        const isExpanded = expandedGroups.has(groupKey)
        const isNewCategory = groupKey.endsWith('(nova)')
        const allSelected = groupItems.every((i) => i._selected)

        return (
          <div
            key={groupKey}
            className={`rounded-lg border ${
              theme === 'dark' ? 'border-dark-600' : 'border-light-200'
            }`}
          >
            {/* Group header */}
            <div
              className={`flex items-center justify-between p-3 cursor-pointer ${
                theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-50'
              }`}
              onClick={() => toggleGroup(groupKey)}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => {
                    e.stopPropagation()
                    toggleSelectGroup(groupKey)
                  }}
                  className="w-4 h-4 rounded"
                />
                {isExpanded ? <CaretDown size={16} /> : <CaretRight size={16} />}
                <span className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                  {groupKey}
                </span>
                {isNewCategory && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    Nova
                  </span>
                )}
              </div>
              <span className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                {groupItems.length} {groupItems.length === 1 ? 'produto' : 'produtos'}
              </span>
            </div>

            {/* Items */}
            {isExpanded && (
              <div className={`border-t ${theme === 'dark' ? 'border-dark-600' : 'border-light-200'}`}>
                {groupItems.map((item) => {
                  const conf = CONFIDENCE_STYLES[item.confidence] || CONFIDENCE_STYLES.medium

                  return (
                    <div
                      key={item._index}
                      className={`flex items-start p-3 space-x-3 border-b last:border-b-0 ${
                        theme === 'dark' ? 'border-dark-700' : 'border-light-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item._selected}
                        onChange={() => toggleSelect(item._index)}
                        className="w-4 h-4 rounded mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          {item.nameWasCorrected ? (
                            <>
                              <span className={`line-through text-sm ${theme === 'dark' ? 'text-dark-500' : 'text-dark-400'}`}>
                                {item.originalName}
                              </span>
                              <span className="text-sm text-green-500 font-medium">
                                {item._finalName}
                              </span>
                            </>
                          ) : (
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                              {item._finalName}
                            </span>
                          )}
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${conf.bg}`}>
                            {conf.label}
                          </span>
                        </div>
                        <div className={`flex items-center space-x-3 mt-1 text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
                          {item._finalType && <span>Tipo: {item._finalType}</span>}
                          {(item._finalShelfLifeAmbient || item.shelfLifeAmbient) && (
                            <span>Amb: {item._finalShelfLifeAmbient ?? item.shelfLifeAmbient}d</span>
                          )}
                          {(item._finalShelfLifeRefrigerated || item.shelfLifeRefrigerated) && (
                            <span>Ref: {item._finalShelfLifeRefrigerated ?? item.shelfLifeRefrigerated}d</span>
                          )}
                          {(item._finalShelfLifeFrozen || item.shelfLifeFrozen) && (
                            <span>Cong: {item._finalShelfLifeFrozen ?? item.shelfLifeFrozen}d</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Floating batch action bar */}
      {selectedCount > 0 && (
        <div
          className={`fixed bottom-20 left-4 right-4 p-3 rounded-xl shadow-xl flex items-center justify-between z-30 ${
            theme === 'dark' ? 'bg-dark-700 border border-dark-500' : 'bg-white border border-light-300'
          }`}
        >
          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
            {selectedCount} selecionados
          </span>
          <button
            onClick={() => setShowBatchModal(true)}
            className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary/90"
          >
            <PencilSimple size={16} />
            <span>Editar em lote</span>
          </button>
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={onConfirm}
        className="w-full py-3 rounded-lg font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
      >
        Confirmar e importar
      </button>

      <BatchEditModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        selectedCount={selectedCount}
        existingCategories={existingCategories}
        onApply={handleBatchApply}
      />
    </div>
  )
}
