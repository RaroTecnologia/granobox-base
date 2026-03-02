import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  Ticket,
  CreditCard,
  ChatCircle,
  ChartBar,
  Gear,
  House,
  Envelope,
  WhatsappLogo,
  Wrench,
  HeadsetIcon,
  SignOut,
  GearSix,
  CloudArrowUp,
  Package,
  Truck,
  CaretLeft,
  CaretRight,
  Handshake,
  FileText,
  ArrowsClockwise,
} from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';

const SIDEBAR_COLLAPSED_KEY = 'granobox-sidebar-collapsed';

type NavItem = { name: string; href: string; icon: typeof House; /** Ativo só quando a URL for exatamente o href */ end?: boolean };

const navigationGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Início',
    items: [{ name: 'Dashboard', href: '/', icon: House }],
  },
  {
    label: 'Clientes e negócio',
    items: [{ name: 'Clientes', href: '/clients', icon: Users }],
  },
  {
    label: 'Vendas (CRM)',
    items: [
      { name: 'Pipeline', href: '/crm', icon: Handshake, end: true },
      { name: 'Propostas', href: '/crm/proposals', icon: FileText },
      { name: 'Produtos de proposta', href: '/crm/proposal-products', icon: Package },
      { name: 'Pedidos de suprimentos', href: '/label-orders', icon: Package },
      { name: 'Gestão de Rolos', href: '/supply-rolls-management', icon: Package },
      { name: 'Alertas de estoque', href: '/supply-alerts', icon: Package },
    ],
  },
  {
    label: 'Ativos e serviço',
    items: [
      { name: 'Equipamentos', href: '/equipment', icon: Wrench },
      { name: 'Manutenções', href: '/maintenances', icon: GearSix },
      { name: 'Suporte', href: '/support', icon: HeadsetIcon },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { name: 'Cobranças', href: '/billing', icon: CreditCard },
      { name: 'Vouchers', href: '/vouchers', icon: Ticket },
    ],
  },
  {
    label: 'Comunicação',
    items: [
      { name: 'Mensagens', href: '/messages', icon: ChatCircle },
      { name: 'Email', href: '/email', icon: Envelope },
      { name: 'WhatsApp', href: '/whatsapp', icon: WhatsappLogo },
    ],
  },
  {
    label: 'Produto e etiquetas',
    items: [
      { name: 'SKUs de Etiquetas', href: '/label-skus', icon: Package },
      { name: 'Bases para aprovação', href: '/bases', icon: Package },
      { name: 'Transportadoras', href: '/shipping-companies', icon: Truck },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { name: 'Planos', href: '/plans', icon: Package },
      { name: 'Firmware OTA', href: '/firmware', icon: CloudArrowUp },
      { name: 'Reboots', href: '/devices/reboots', icon: ArrowsClockwise },
      { name: 'Relatórios', href: '/reports', icon: ChartBar },
      { name: 'Configurações', href: '/settings', icon: Gear },
    ],
  },
];

function NavItemLink({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  return (
    <NavLink
      to={item.href}
      end={item.end}
      title={collapsed ? item.name : undefined}
      className={({ isActive }) =>
        `sidebar-item group flex items-center ${
          isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
        } ${collapsed ? 'justify-center px-2' : ''}`
      }
    >
      <item.icon size={20} className="shrink-0" />
      {!collapsed && <span className="font-medium truncate">{item.name}</span>}
    </NavLink>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored !== null) setCollapsed(stored === 'true');
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div
      className={`relative flex h-full flex-col overflow-visible bg-white border-r border-gray-200 transition-[width] duration-200 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Toggle: na linha entre sidebar e main, parte superior */}
      <button
        type="button"
        onClick={toggleCollapsed}
        className="absolute -right-3 top-4 z-20 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-erp transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        {collapsed ? (
          <CaretRight size={16} weight="bold" />
        ) : (
          <CaretLeft size={16} weight="bold" />
        )}
      </button>

      {/* Logo: recolhido = só o ícone (crop à esquerda), centralizado; expandido = logo menor */}
      <div className="flex h-16 items-center justify-center border-b border-gray-200 px-2">
        {collapsed ? (
          <div className="h-8 w-12 shrink-0 overflow-hidden rounded-md">
            <img
              src="https://cdn.granobox.com.br/assets/logo-granobox.png"
              alt="GranoBox"
              className="h-full w-auto min-w-full object-cover object-left"
            />
          </div>
        ) : (
          <img
            src="https://cdn.granobox.com.br/assets/logo-granobox.png"
            alt="GranoBox"
            className="max-h-8 w-auto object-contain"
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navigationGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItemLink key={item.href} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User info */}
      <div className="border-t border-gray-200 p-3">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : 'mb-3'}`}>
          {user?.avatar ? (
            <img
              className="h-10 w-10 shrink-0 rounded-full bg-gray-200"
              src={user.avatar}
              alt={user.name}
            />
          ) : (
            <div className="h-10 w-10 shrink-0 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-medium text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {user?.name || 'Usuário'}
              </p>
              <p className="truncate text-xs text-gray-500">
                {user?.email || 'email@exemplo.com'}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <SignOut size={16} className="shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
}
