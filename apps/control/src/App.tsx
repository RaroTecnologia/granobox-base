import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';

// Criar cliente do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Não tentar novamente se for erro 401 (autenticação/autorização)
        if (error?.response?.status === 401) {
          return false;
        }
        // Para outros erros, tentar apenas 1 vez
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
  },
});
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { NewClient } from './pages/clients/NewClient';
import { EditClient } from './pages/clients/EditClient';
import { ClientDetails } from './pages/clients/ClientDetails';
import { EdgeGoAvailabilityPage } from './pages/clients/EdgeGoAvailabilityPage';
import { Equipment } from './pages/Equipment';
import { NewEquipment } from './pages/equipment/NewEquipment';
import { EditEquipment } from './pages/equipment/EditEquipment';
import { Maintenances } from './pages/Maintenances';
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
import { EmailCampaignDetail } from './pages/email/EmailCampaignDetail';
import { NewCampaignWizard } from './pages/email/NewCampaignWizard';
import { WhatsApp } from './pages/WhatsApp';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { UserDetails } from './pages/settings/UserDetails';
import { NewUser } from './pages/settings/NewUser';
import { EditUser } from './pages/settings/EditUser';
import AcceptInvite from './pages/AcceptInvite';
import FirmwareManagement from './pages/firmware/FirmwareManagement';
import { LabelSkus } from './pages/LabelSkus';
import { ShippingCompanies } from './pages/ShippingCompanies';
import { CRMPipeline } from './pages/crm/CRMPipeline';
import { LeadDetail } from './pages/crm/LeadDetail';
import { ProposalsList } from './pages/crm/ProposalsList';
import { ProposalDetail } from './pages/crm/ProposalDetail';
import { NewProposal } from './pages/crm/NewProposal';
import { ProposalProducts } from './pages/crm/ProposalProducts';
import { PlansManagement } from './pages/plans/PlansManagement';
import { LabelOrdersList } from './pages/label-orders/LabelOrdersList';
import { ClientBases } from './pages/bases/ClientBases';
import { BaseDetail } from './pages/bases/BaseDetail';
import DeviceReboots from './pages/devices/DeviceReboots';
import { SupplyAlerts } from './pages/SupplyAlerts';
import { SupplyRollsManagement } from './pages/supply-rolls/SupplyRollsManagement';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <Routes>
            {/* Rota de login (pública) */}
            <Route path="/login" element={<Login />} />
            {/* Rota pública para aceitar convite */}
            <Route path="/accept-invite" element={<AcceptInvite />} />
            
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
              <Route path="clients/:id/edge-go" element={<EdgeGoAvailabilityPage />} />
              <Route path="clients/:id/edit" element={<EditClient />} />
              <Route path="equipment" element={<Equipment />} />
              <Route path="equipment/new" element={<NewEquipment />} />
              <Route path="equipment/:id/edit" element={<EditEquipment />} />
              <Route path="maintenances" element={<Maintenances />} />
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
              <Route path="email/new" element={<NewCampaignWizard />} />
              <Route path="email/campaigns/:id" element={<EmailCampaignDetail />} />
              <Route path="whatsapp" element={<WhatsApp />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="firmware" element={<FirmwareManagement />} />
              <Route path="label-skus" element={<LabelSkus />} />
              <Route path="shipping-companies" element={<ShippingCompanies />} />
              <Route path="plans" element={<PlansManagement />} />
              <Route path="crm" element={<CRMPipeline />} />
              <Route path="crm/leads/:id" element={<LeadDetail />} />
              <Route path="crm/proposals" element={<ProposalsList />} />
              <Route path="crm/proposals/new" element={<NewProposal />} />
              <Route path="crm/proposals/:id" element={<ProposalDetail />} />
              <Route path="crm/proposal-products" element={<ProposalProducts />} />
              <Route path="label-orders" element={<LabelOrdersList />} />
              <Route path="bases" element={<ClientBases />} />
              <Route path="bases/:id" element={<BaseDetail />} />
              <Route path="devices/reboots" element={<DeviceReboots />} />
              <Route path="supply-alerts" element={<SupplyAlerts />} />
              <Route path="supply-rolls-management" element={<SupplyRollsManagement />} />
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
