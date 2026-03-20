import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import {
  CheckCircle,
  Warning,
  ArrowCounterClockwise,
  Spinner,
} from '@phosphor-icons/react'
import { importBatch, rollbackBatch } from '@/services/importService'
import type {
  ImportBatchItem,
  ImportBatchResult,
  RollbackResult,
} from '@/services/importService'
import type { ReviewItem } from './ImportReviewStep'

interface Props {
  items: ReviewItem[]
  existingCategories: { id: string; name: string; parentId?: string }[]
  operationId?: string
}

export default function ImportConfirmStep({
  items,
  existingCategories,
  operationId,
}: Props) {
  const { theme } = useTheme()
  const [status, setStatus] = useState<
    'ready' | 'importing' | 'success' | 'error' | 'rolledback'
  >('ready')
  const [result, setResult] = useState<ImportBatchResult | null>(null)
  const [rollbackResult, setRollbackResult] = useState<RollbackResult | null>(null)
  const [error, setError] = useState('')

  // Build batch items from review items
  const buildBatchItems = (): ImportBatchItem[] => {
    return items.map((item) => {
      const batchItem: ImportBatchItem = {
        name: item._finalName,
        type: item._finalType || undefined,
        brand: item._brand || undefined,
        shelfLifeAmbient: item._finalShelfLifeAmbient ?? item.shelfLifeAmbient ?? undefined,
        shelfLifeRefrigerated:
          item._finalShelfLifeRefrigerated ?? item.shelfLifeRefrigerated ?? undefined,
        shelfLifeFrozen: item._finalShelfLifeFrozen ?? item.shelfLifeFrozen ?? undefined,
        ingredients: item._ingredients || undefined,
        allergens: item._allergens || undefined,
      }

      // Resolve category
      if (item._finalCategoryId) {
        batchItem.categoryId = item._finalCategoryId
      } else if (item._finalNewCategoryName) {
        batchItem.newCategoryName = item._finalNewCategoryName
        if (item._finalNewSubcategoryName) {
          batchItem.newSubcategoryName = item._finalNewSubcategoryName
          batchItem.parentCategoryId = item._finalParentCategoryId
        }
      } else {
        const suggested = item.suggestedCategory
        if ('existingId' in suggested) {
          batchItem.categoryId = suggested.existingId
        } else if ('newName' in suggested) {
          batchItem.newCategoryName = suggested.newName
        }
        // Subcategory
        if (item.suggestedSubcategory) {
          if ('existingId' in item.suggestedSubcategory) {
            // subcategory is the actual categoryId
            batchItem.categoryId = item.suggestedSubcategory.existingId
          } else if ('newName' in item.suggestedSubcategory) {
            batchItem.newSubcategoryName = item.suggestedSubcategory.newName
          }
        }
      }

      return batchItem
    })
  }

  // Stats
  const newCategoryNames = new Set<string>()
  const existingCategoryNames = new Set<string>()
  for (const item of items) {
    if (item._finalCategoryId) {
      const cat = existingCategories.find((c) => c.id === item._finalCategoryId)
      if (cat) existingCategoryNames.add(cat.name)
    } else if (item._finalNewCategoryName) {
      newCategoryNames.add(item._finalNewCategoryName)
    } else {
      const s = item.suggestedCategory
      if ('existingId' in s) {
        const cat = existingCategories.find((c) => c.id === s.existingId)
        if (cat) existingCategoryNames.add(cat.name)
      } else if ('newName' in s) {
        newCategoryNames.add(s.newName)
      }
    }
  }

  const handleImport = async () => {
    setStatus('importing')
    setError('')
    try {
      const batchItems = buildBatchItems()
      const res = await importBatch(batchItems, operationId)
      setResult(res)
      setStatus('success')
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || 'Erro ao importar',
      )
      setStatus('error')
    }
  }

  const handleRollback = async () => {
    if (!result?.batchId) return
    try {
      const res = await rollbackBatch(result.batchId)
      setRollbackResult(res)
      setStatus('rolledback')
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || 'Erro ao desfazer',
      )
    }
  }

  if (status === 'ready') {
    return (
      <div className="space-y-6">
        <div
          className={`rounded-xl border p-6 ${
            theme === 'dark' ? 'bg-dark-700 border-dark-600' : 'bg-white border-light-200'
          }`}
        >
          <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
            Resumo da importação
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>
                Produtos a criar
              </p>
              <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                {items.length}
              </p>
            </div>
            <div>
              <p className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>
                Categorias novas
              </p>
              <p className={`text-2xl font-bold text-blue-500`}>
                {newCategoryNames.size}
              </p>
            </div>
            <div>
              <p className={theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}>
                Categorias existentes
              </p>
              <p className={`text-2xl font-bold text-green-500`}>
                {existingCategoryNames.size}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleImport}
          className="w-full py-3 rounded-lg font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          Importar {items.length} produtos
        </button>
      </div>
    )
  }

  if (status === 'importing') {
    return (
      <div className="text-center py-12">
        <Spinner size={48} className="mx-auto text-primary animate-spin mb-4" />
        <p className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
          Importando produtos...
        </p>
        <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
          Criando categorias e produtos no banco de dados
        </p>
      </div>
    )
  }

  if (status === 'success' && result) {
    return (
      <div className="space-y-6">
        <div className="text-center py-6">
          <CheckCircle size={64} weight="fill" className="mx-auto text-green-500 mb-4" />
          <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
            Importação concluída!
          </h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
            {result.productsCreated} produtos e {result.categoriesCreated} categorias criados
          </p>
        </div>

        <button
          onClick={handleRollback}
          className={`w-full py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
            theme === 'dark'
              ? 'bg-dark-700 text-red-400 hover:bg-dark-600 border border-dark-500'
              : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
          }`}
        >
          <ArrowCounterClockwise size={20} />
          <span>Desfazer importação</span>
        </button>
      </div>
    )
  }

  if (status === 'rolledback' && rollbackResult) {
    return (
      <div className="text-center py-12">
        <Warning size={48} className="mx-auto text-yellow-500 mb-4" />
        <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
          Importação desfeita
        </h3>
        <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
          {rollbackResult.deletedProducts} produtos e {rollbackResult.deletedCategories} categorias removidos
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-center py-12 space-y-4">
        <Warning size={48} className="mx-auto text-red-500" />
        <p className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
          Erro na importação
        </p>
        <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
          {error}
        </p>
        <button
          onClick={handleImport}
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return null
}
