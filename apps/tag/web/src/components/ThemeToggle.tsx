'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon } from '@phosphor-icons/react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full transition-all duration-200 hover:scale-110"
      style={{
        backgroundColor: theme === 'dark' ? '#1DA154' : '#1DA154',
        color: 'white'
      }}
      title={`Alternar para tema ${theme === 'dark' ? 'light' : 'dark'}`}
    >
      {theme === 'dark' ? (
        <Sun size={20} weight="duotone" />
      ) : (
        <Moon size={20} weight="duotone" />
      )}
    </button>
  )
}
