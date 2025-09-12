import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';

// Criar cliente do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { NewClient } from './pages/clients/NewClient';
import { EditClient } from './pages/clients/EditClient';
import { ClientDetails } from './pages/clients/ClientDetails';
import { Equipment } from './pages/Equipment';
import { NewEquipment } from './pages/equipment/NewEquipment';
import { EditEquipment } from './pages/equipment/EditEquipment';
import { Support } from './pages/Support';
import { TicketDetails } from './pages/support/TicketDetails';
import { NewTicket } from './pages/support/NewTicket';
import { Vouchers } from './pages/Vouchers';
import { NewVoucher } from './pages/vouchers/NewVoucher';
import { EditVoucher } from './pages/vouchers/EditVoucher';
import { Billing } from './pages/Billing';
import { InvoiceDetails } from './pages/billing/InvoiceDetails';
import { Messages } from './pages/Messages';
import { Email } from './pages/Email';
import { WhatsApp } from './pages/WhatsApp';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { UserDetails } from './pages/settings/UserDetails';
import { NewUser } from './pages/settings/NewUser';
import { EditUser } from './pages/settings/EditUser';
import Templates from './pages/Templates';
import UploadTemplate from './pages/templates/UploadTemplate';
import TemplateAssociations from './pages/templates/TemplateAssociations';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Rota de login (pública) */}
            <Route path="/login" element={<Login />} />
            
            {/* Rotas protegidas */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/new" element={<NewClient />} />
              <Route path="clients/:id" element={<ClientDetails />} />
              <Route path="clients/:id/edit" element={<EditClient />} />
              <Route path="equipment" element={<Equipment />} />
              <Route path="equipment/new" element={<NewEquipment />} />
              <Route path="equipment/:id/edit" element={<EditEquipment />} />
              <Route path="templates" element={<Templates />} />
              <Route path="templates/upload" element={<UploadTemplate />} />
              <Route path="templates/associations/:clientId" element={<TemplateAssociations />} />
              <Route path="support" element={<Support />} />
              <Route path="support/new" element={<NewTicket />} />
              <Route path="support/:id" element={<TicketDetails />} />
              <Route path="vouchers" element={<Vouchers />} />
              <Route path="vouchers/new" element={<NewVoucher />} />
              <Route path="vouchers/:id/edit" element={<EditVoucher />} />
              <Route path="billing" element={<Billing />} />
              <Route path="billing/:id" element={<InvoiceDetails />} />
              <Route path="messages" element={<Messages />} />
              <Route path="email" element={<Email />} />
              <Route path="whatsapp" element={<WhatsApp />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="settings/users/new" element={<NewUser />} />
              <Route path="settings/users/:id" element={<UserDetails />} />
              <Route path="settings/users/:id/edit" element={<EditUser />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
