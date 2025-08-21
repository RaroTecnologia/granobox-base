import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({ 
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
  adjustFontFallback: false,
})

export const metadata: Metadata = {
  title: 'Granobox Tag - Sistema de Etiquetas',
  description: 'Sistema moderno de gestão de etiquetas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={manrope.variable}>
      <body 
        className={`${manrope.className} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  )
}
