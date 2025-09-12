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
  FileText
} from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: House },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Equipamentos', href: '/equipment', icon: Wrench },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Suporte', href: '/support', icon: HeadsetIcon },
  { name: 'Vouchers', href: '/vouchers', icon: Ticket },
  { name: 'Cobranças', href: '/billing', icon: CreditCard },
  { name: 'Mensagens', href: '/messages', icon: ChatCircle },
  { name: 'Email', href: '/email', icon: Envelope },
  { name: 'WhatsApp', href: '/whatsapp', icon: WhatsappLogo },
  { name: 'Relatórios', href: '/reports', icon: ChartBar },
  { name: 'Configurações', href: '/settings', icon: Gear },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <h1 className="text-xl font-bold text-primary-600">
            GranoBox Control
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-4 py-6">
        {navigation.map((item, index) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `sidebar-item group ${
                isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          {user?.avatar ? (
            <img
              className="h-10 w-10 rounded-full bg-gray-200"
              src={user.avatar}
              alt={user.name}
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 font-medium">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'Usuário'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || 'email@exemplo.com'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <SignOut size={16} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}
