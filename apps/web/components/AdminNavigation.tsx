'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BuildingOffice2Icon, 
  CreditCardIcon, 
  UsersIcon, 
  ChartBarIcon,
  Cog6ToothIcon,
  HomeIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Organizações', href: '/admin/organizacoes', icon: BuildingOffice2Icon },
  { name: 'Planos', href: '/admin/planos', icon: CreditCardIcon },
  { name: 'Usuários', href: '/admin/usuarios', icon: UsersIcon },
  { name: 'Relatórios', href: '/admin/relatorios', icon: ChartBarIcon },
  { name: 'Configurações', href: '/admin/configuracoes', icon: Cog6ToothIcon },
]

export default function AdminNavigation() {
  const pathname = usePathname()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/admin" className="text-xl font-bold text-gray-900">
                Granobox Admin
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="ml-3 relative">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Admin</span>
                <Link 
                  href="/" 
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Voltar ao App
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
} 