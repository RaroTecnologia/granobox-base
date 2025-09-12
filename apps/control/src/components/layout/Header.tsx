import { Bell, MagnifyingGlass, User } from '@phosphor-icons/react';
import { Button } from '../ui/Button';

export function Header() {
  return (
    <header className="h-16 border-b border-gray-200 bg-white">
      <div className="flex h-full items-center justify-between px-6">
        {/* Search */}
        <div className="flex items-center gap-4 flex-1 max-w-lg">
          <div className="relative flex-1">
            <MagnifyingGlass 
              size={18} 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" 
            />
            <input
              type="text"
              placeholder="Buscar clientes, vouchers, cobranças..."
              className="w-full pl-12 pr-4 py-3 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 transition-colors placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              3
            </span>
          </button>

          {/* User menu */}
          <button className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <div className="h-8 w-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900">Admin</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
