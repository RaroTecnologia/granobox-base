import { ThemeProvider } from '@/contexts/ThemeContext'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import LoginPage from '@/app/LoginPage'
import ForgotPasswordPage from '@/app/ForgotPasswordPage'
import ResetPasswordPage from '@/app/ResetPasswordPage'
import AcceptInvitePage from '@/app/AcceptInvitePage'
import DashboardPage from '@/app/DashboardPage'
import EtiquetasPage from '@/app/EtiquetasPage'
import CadastrosPage from '@/app/CadastrosPage'
import ConfiguracoesPage from '@/app/ConfiguracoesPage'
import ConfiguracoesImpressorasPage from '@/app/ConfiguracoesImpressorasPageSimple'
import ConfigurarImpressoraPage from '@/app/ConfigurarImpressoraPage'
import AdicionarImpressoraPage from '@/app/AdicionarImpressoraPage'
import NovaEtiquetaPage from '@/app/NovaEtiquetaPage'
import PreviewPage from '@/app/PreviewPage'
import FilaPage from '@/app/FilaPage'
import AlertasPage from '@/app/AlertasPage'
import EtiquetaDetalhesPage from '@/app/EtiquetaDetalhesPage'
import CadastroItemPage from '@/app/CadastroItemPage'
import CadastroCategoriaPage from '@/app/CadastroCategoriaPage'
import CadastroOperadoresPage from '@/app/CadastroOperadoresPage'
import ValidadeSelecaoPage from '@/app/ValidadeSelecaoPage'
import ValidadeImpressaoPage from '@/app/ValidadeImpressaoPage'
import RotuloSelecaoPage from '@/app/RotuloSelecaoPage'
import RotuloImpressaoPage from '@/app/RotuloImpressaoPage'
import PerfilPage from '@/app/PerfilPage'
import RelatoriosPage from '@/app/RelatoriosPage'
import RecebimentoPage from '@/app/RecebimentoPage'
import CadastroLocaisPage from '@/app/CadastroLocaisPage'
import ImportacaoProdutosPage from '@/app/ImportacaoProdutosPage'

const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },
  {
    path: "/accept-invite",
    element: <AcceptInvitePage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/etiquetas",
    element: (
      <ProtectedRoute>
        <EtiquetasPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/etiquetas/nova",
    element: (
      <ProtectedRoute>
        <NovaEtiquetaPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/etiquetas/validade",
    element: (
      <ProtectedRoute>
        <ValidadeSelecaoPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/etiquetas/validade/impressao",
    element: (
      <ProtectedRoute>
        <ValidadeImpressaoPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/etiquetas/rotulo",
    element: (
      <ProtectedRoute>
        <RotuloSelecaoPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/etiquetas/rotulo/impressao",
    element: (
      <ProtectedRoute>
        <RotuloImpressaoPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/cadastros",
    element: (
      <ProtectedRoute>
        <CadastrosPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/cadastro-item",
    element: (
      <ProtectedRoute>
        <CadastroItemPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/cadastro/item",
    element: (
      <ProtectedRoute>
        <CadastroItemPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/cadastro/item/:id",
    element: (
      <ProtectedRoute>
        <CadastroItemPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/cadastro/categoria",
    element: (
      <ProtectedRoute>
        <CadastroCategoriaPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/cadastro/categoria/:id",
    element: (
      <ProtectedRoute>
        <CadastroCategoriaPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/cadastro/operadores",
    element: (
      <ProtectedRoute>
        <CadastroOperadoresPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/cadastro/locais",
    element: (
      <ProtectedRoute>
        <CadastroLocaisPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/cadastro/locais/:id",
    element: (
      <ProtectedRoute>
        <CadastroLocaisPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/cadastros/importacao",
    element: (
      <ProtectedRoute>
        <ImportacaoProdutosPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/configuracoes",
    element: (
      <ProtectedRoute>
        <ConfiguracoesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/configuracoes/impressoras",
    element: (
      <ProtectedRoute>
        <ConfiguracoesImpressorasPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/configurar-impressora/:id",
    element: (
      <ProtectedRoute>
        <ConfigurarImpressoraPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/adicionar-impressora",
    element: (
      <ProtectedRoute>
        <AdicionarImpressoraPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/perfil",
    element: (
      <ProtectedRoute>
        <PerfilPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/relatorios",
    element: (
      <ProtectedRoute>
        <RelatoriosPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/preview",
    element: (
      <ProtectedRoute>
        <PreviewPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/fila",
    element: (
      <ProtectedRoute>
        <FilaPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/alertas",
    element: (
      <ProtectedRoute>
        <AlertasPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/recebimento",
    element: (
      <ProtectedRoute>
        <RecebimentoPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/etiqueta/:id",
    element: (
      <ProtectedRoute>
        <EtiquetaDetalhesPage />
      </ProtectedRoute>
    ),
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
})

// Suprimir warning do React Router v7
if (typeof window !== 'undefined') {
  const originalWarn = console.warn
  console.warn = (...args) => {
    if (args[0]?.includes?.('React Router Future Flag Warning')) {
      return
    }
    originalWarn.apply(console, args)
  }
}

function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App