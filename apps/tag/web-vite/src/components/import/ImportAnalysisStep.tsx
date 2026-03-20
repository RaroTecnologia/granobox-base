import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { SectionLoading } from '@/components/LoadingSpinner'
import { Warning, SkipForward } from '@phosphor-icons/react'
import { analyzeProducts } from '@/services/importService'
import type { ImportProductRow, AiAnalyzedItem, ExistingCategory } from '@/services/importService'

interface Props {
  products: ImportProductRow[]
  existingCategories: ExistingCategory[]
  onAnalyzed: (items: AiAnalyzedItem[]) => void
  onSkip: () => void
}

export default function ImportAnalysisStep({
  products,
  existingCategories,
  onAnalyzed,
  onSkip,
}: Props) {
  const { theme } = useTheme()
  const [status, setStatus] = useState<'loading' | 'error' | 'done'>('loading')
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const CHUNK = 30
      const total = Math.ceil(products.length / CHUNK)
      setProgress(`Analisando lote 1 de ${total}...`)

      try {
        const result = await analyzeProducts(products, existingCategories)
        if (cancelled) return
        setStatus('done')
        onAnalyzed(result)
      } catch (err: any) {
        if (cancelled) return
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Erro desconhecido'
        setError(msg)
        setStatus('error')
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading') {
    return (
      <div className="text-center py-12">
        <SectionLoading text={progress} size="lg" />
        <p className={`mt-4 text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
          A IA está classificando e corrigindo {products.length} produtos...
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="text-center py-12 space-y-4">
        <Warning size={48} className="mx-auto text-yellow-500" />
        <p className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
          Não foi possível analisar com IA
        </p>
        <p className={`text-sm ${theme === 'dark' ? 'text-dark-400' : 'text-dark-600'}`}>
          {error}
        </p>
        <button
          onClick={onSkip}
          className="inline-flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <SkipForward size={20} />
          <span>Pular análise IA e usar dados originais</span>
        </button>
      </div>
    )
  }

  return null // done state is handled by parent
}
