import { useState, useCallback, useContext } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { useCategories } from '@/hooks/useCategories'
import { ArrowLeft, UploadSimple } from '@phosphor-icons/react'
import FooterNavigation from '@/components/FooterNavigation'
import ImportStepIndicator from '@/components/import/ImportStepIndicator'
import ImportUploadStep from '@/components/import/ImportUploadStep'
import type { ParsedSheet } from '@/components/import/ImportUploadStep'
import ImportMappingStep from '@/components/import/ImportMappingStep'
import ImportAnalysisStep from '@/components/import/ImportAnalysisStep'
import ImportReviewStep from '@/components/import/ImportReviewStep'
import type { ReviewItem } from '@/components/import/ImportReviewStep'
import ImportConfirmStep from '@/components/import/ImportConfirmStep'
import type {
  ImportProductRow,
  AiAnalyzedItem,
  ExistingCategory,
} from '@/services/importService'

export default function ImportacaoProdutosPage() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { categories } = useCategories()

  const [step, setStep] = useState(1)

  // Step 1: Upload
  const [parsedSheet, setParsedSheet] = useState<ParsedSheet | null>(null)

  // Step 2: Mapping
  const [mappedProducts, setMappedProducts] = useState<ImportProductRow[]>([])

  // Step 3: AI Analysis
  const [analyzedItems, setAnalyzedItems] = useState<AiAnalyzedItem[]>([])
  const [skippedAi, setSkippedAi] = useState(false)

  // Step 4: Review
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([])

  // Build existing categories for AI
  const existingCategories: ExistingCategory[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId || undefined,
  }))

  /* ── Step handlers ── */

  const handleParsed = useCallback((data: ParsedSheet) => {
    setParsedSheet(data)
    setStep(2)
  }, [])

  const handleMapped = useCallback(
    (mapping: Record<string, keyof ImportProductRow>) => {
      if (!parsedSheet) return

      const products: ImportProductRow[] = parsedSheet.rows.map((row) => {
        const product: any = {}
        for (const [header, field] of Object.entries(mapping)) {
          let value: any = row[header]
          // Convert numeric fields
          if (
            ['shelfLifeAmbient', 'shelfLifeRefrigerated', 'shelfLifeFrozen'].includes(
              field,
            )
          ) {
            value = value ? Number(value) : undefined
          }
          product[field] = value || undefined
        }
        return product as ImportProductRow
      })

      // Filter out rows without a name
      const valid = products.filter((p) => p.name?.trim())
      setMappedProducts(valid)
      setStep(3)
    },
    [parsedSheet],
  )

  const handleAnalyzed = useCallback(
    (items: AiAnalyzedItem[]) => {
      setAnalyzedItems(items)
      // Build review items merging AI results with original data
      const review: ReviewItem[] = items.map((ai, idx) => {
        const original = mappedProducts[idx] || ({} as ImportProductRow)
        return {
          ...ai,
          _index: idx,
          _selected: true,
          _finalName: ai.correctedName || ai.originalName,
          _finalType: ai.type || original.type || 'finished',
          _brand: original.brand,
          _ingredients: original.ingredients,
          _allergens: original.allergens,
          _finalShelfLifeAmbient:
            ai.shelfLifeAmbient ?? original.shelfLifeAmbient,
          _finalShelfLifeRefrigerated:
            ai.shelfLifeRefrigerated ?? original.shelfLifeRefrigerated,
          _finalShelfLifeFrozen:
            ai.shelfLifeFrozen ?? original.shelfLifeFrozen,
        }
      })
      setReviewItems(review)
      setStep(4)
    },
    [mappedProducts],
  )

  const handleSkipAi = useCallback(() => {
    setSkippedAi(true)
    // Build review items from raw data (no AI)
    const review: ReviewItem[] = mappedProducts.map((p, idx) => ({
      originalName: p.name,
      correctedName: p.name,
      nameWasCorrected: false,
      suggestedCategory: p.category
        ? { newName: p.category }
        : { newName: 'Sem categoria' },
      suggestedSubcategory: p.subcategory
        ? { newName: p.subcategory }
        : null,
      shelfLifeAmbient: p.shelfLifeAmbient ?? null,
      shelfLifeRefrigerated: p.shelfLifeRefrigerated ?? null,
      shelfLifeFrozen: p.shelfLifeFrozen ?? null,
      type: p.type || 'finished',
      confidence: 'low' as const,
      _index: idx,
      _selected: true,
      _finalName: p.name,
      _finalType: p.type || 'finished',
      _brand: p.brand,
      _ingredients: p.ingredients,
      _allergens: p.allergens,
      _finalShelfLifeAmbient: p.shelfLifeAmbient,
      _finalShelfLifeRefrigerated: p.shelfLifeRefrigerated,
      _finalShelfLifeFrozen: p.shelfLifeFrozen,
    }))
    setReviewItems(review)
    setStep(4)
  }, [mappedProducts])

  const handleConfirmReview = useCallback(() => {
    // Filter only selected items
    const selected = reviewItems.filter((i) => i._selected)
    setReviewItems(selected)
    setStep(5)
  }, [reviewItems])

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'}`}>
      {/* Header */}
      <header
        className={`${
          theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'
        } border-b px-4 py-4 sticky top-0 z-10`}
      >
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/cadastros')}
            className={`p-2 rounded-lg ${
              theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'
            }`}
          >
            <ArrowLeft size={24} />
          </button>
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <UploadSimple size={24} weight="duotone" className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Importar Produtos</h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
              Upload de planilha com análise por IA
            </p>
          </div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="px-4 pt-4">
        <ImportStepIndicator currentStep={step} />
      </div>

      {/* Content */}
      <main className="px-4 py-6 pb-24">
        {step === 1 && <ImportUploadStep onParsed={handleParsed} />}

        {step === 2 && parsedSheet && (
          <ImportMappingStep
            headers={parsedSheet.headers}
            previewRows={parsedSheet.rows.slice(0, 3)}
            onMapped={handleMapped}
          />
        )}

        {step === 3 && (
          <ImportAnalysisStep
            products={mappedProducts}
            existingCategories={existingCategories}
            onAnalyzed={handleAnalyzed}
            onSkip={handleSkipAi}
          />
        )}

        {step === 4 && (
          <ImportReviewStep
            items={reviewItems}
            existingCategories={existingCategories}
            onItemsChange={setReviewItems}
            onConfirm={handleConfirmReview}
          />
        )}

        {step === 5 && (
          <ImportConfirmStep
            items={reviewItems}
            existingCategories={existingCategories}
          />
        )}
      </main>

      <FooterNavigation />
    </div>
  )
}
