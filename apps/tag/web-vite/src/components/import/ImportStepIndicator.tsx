import { useTheme } from '@/contexts/ThemeContext'
import { Check } from '@phosphor-icons/react'

const STEPS = [
  { label: 'Upload' },
  { label: 'Mapeamento' },
  { label: 'Análise IA' },
  { label: 'Revisão' },
  { label: 'Importação' },
]

interface Props {
  currentStep: number
}

export default function ImportStepIndicator({ currentStep }: Props) {
  const { theme } = useTheme()

  return (
    <div className="flex items-center justify-between px-2 py-3">
      {STEPS.map((step, idx) => {
        const stepNum = idx + 1
        const isActive = stepNum === currentStep
        const isDone = stepNum < currentStep

        return (
          <div key={idx} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  isDone
                    ? 'bg-green-500 text-white'
                    : isActive
                    ? 'bg-primary text-white shadow-lg'
                    : theme === 'dark'
                    ? 'bg-dark-600 text-dark-400'
                    : 'bg-light-200 text-dark-500'
                }`}
              >
                {isDone ? <Check size={16} weight="bold" /> : stepNum}
              </div>
              <span
                className={`text-xs mt-1 text-center ${
                  isActive
                    ? 'text-primary font-medium'
                    : isDone
                    ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                    : theme === 'dark'
                    ? 'text-dark-500'
                    : 'text-dark-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mt-[-12px] ${
                  isDone
                    ? 'bg-green-500'
                    : theme === 'dark'
                    ? 'bg-dark-600'
                    : 'bg-light-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
