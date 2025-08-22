import { ThemeProvider } from '@/contexts/ThemeContext'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import LoginPage from '@/app/LoginPage'
import DashboardPage from '@/app/DashboardPage'
import EtiquetasPage from '@/app/EtiquetasPage'
import CadastrosPage from '@/app/CadastrosPage'
import ConfiguracoesPage from '@/app/ConfiguracoesPage'
import NovaEtiquetaPage from '@/app/NovaEtiquetaPage'
import PreviewPage from '@/app/PreviewPage'
import FilaPage from '@/app/FilaPage'
import AlertasPage from '@/app/AlertasPage'
import EtiquetaDetalhesPage from '@/app/EtiquetaDetalhesPage'
import CadastroItemPage from '@/app/CadastroItemPage'
import PerfilPage from '@/app/PerfilPage'
import RelatoriosPage from '@/app/RelatoriosPage'

const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/dashboard",
    element: <DashboardPage />,
  },
  {
    path: "/etiquetas",
    element: <EtiquetasPage />,
  },
  {
    path: "/etiquetas/nova",
    element: <NovaEtiquetaPage />,
  },
  {
    path: "/cadastros",
    element: <CadastrosPage />,
  },
  {
    path: "/configuracoes",
    element: <ConfiguracoesPage />,
  },
  {
    path: "/perfil",
    element: <PerfilPage />,
  },
  {
    path: "/relatorios",
    element: <RelatoriosPage />,
  },
  {
    path: "/preview",
    element: <PreviewPage />,
  },
  {
    path: "/fila",
    element: <FilaPage />,
  },
  {
    path: "/alertas",
    element: <AlertasPage />,
  },
  {
    path: "/etiqueta/:id",
    element: <EtiquetaDetalhesPage />,
  },
  {
    path: "/cadastro-item",
    element: <CadastroItemPage />,
  },
  {
    path: "/cadastro/item",
    element: <CadastroItemPage />,
  },
  {
    path: "/cadastro/item/:id",
    element: <CadastroItemPage />,
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
})

function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            border: '1px solid var(--toast-border)',
            borderRadius: '16px',
            padding: '16px',
            fontSize: '14px',
            maxWidth: '400px',
          },
          success: { iconTheme: { primary: '#1DA154', secondary: '#ffffff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
        }}
      />
    </ThemeProvider>
  )
}

export default App
