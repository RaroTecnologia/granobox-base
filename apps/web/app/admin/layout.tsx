import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import AdminNavigation from '@/components/AdminNavigation'

export const metadata: Metadata = {
  title: 'Granobox Admin - Gestão de Organizações',
  description: 'Painel administrativo do Granobox',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <main className="p-6">
        {children}
      </main>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            style: {
              background: '#10b981',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
        }}
      />
    </div>
  )
} 