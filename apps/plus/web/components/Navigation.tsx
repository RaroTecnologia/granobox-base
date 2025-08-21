'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { 
  HomeIcon, 
  BookOpenIcon, 
  CubeIcon, 
  CogIcon,
  UsersIcon,
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
  PrinterIcon,
  ChevronDownIcon,
  ListBulletIcon,
  ArchiveBoxIcon,
  WrenchScrewdriverIcon,
  BeakerIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  TagIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, category: 'main' },
];

const productionMenu = [
  { name: 'Receitas', href: '/receitas', icon: BookOpenIcon },
  { name: 'Produção', href: '/producao', icon: CogIcon },
  { name: 'Manipulados', href: '/manipulados', icon: BeakerIcon },
  { name: 'Produtos Prontos', href: '/produtos-prontos', icon: ArchiveBoxIcon },
];

const inventoryMenu = [
  { name: 'Inventário', href: '/inventario', icon: CubeIcon },
  { name: 'Lista de Compras', href: '/lista-compras', icon: ListBulletIcon },
];

const salesMenu = [
  { name: 'PDV', href: '/pdv', icon: ShoppingCartIcon },
  { name: 'Pedidos', href: '/pedidos', icon: ClipboardDocumentListIcon },
  { name: 'Clientes', href: '/clientes', icon: UsersIcon },
];

const etiquetasMenu = [
  { name: 'Matéria Prima', href: '/etiquetas/materia-prima', icon: CubeIcon },
  { name: 'Manipulados', href: '/etiquetas/manipulados', icon: BeakerIcon },
  { name: 'Produtos', href: '/etiquetas/produtos', icon: ArchiveBoxIcon },
];

const configMenu = [
  {
    name: 'Receitas',
    href: '/configuracoes/receitas',
    icon: DocumentTextIcon,
  },
  {
    name: 'Manipulados',
    href: '/configuracoes/manipulados',
    icon: BeakerIcon,
  },
  {
    name: 'Produtos',
    href: '/configuracoes/produtos',
    icon: CubeIcon,
  },
  {
    name: 'Ingredientes',
    href: '/inventario',
    icon: ArchiveBoxIcon,
  },
];

export default function Navigation() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const [showProductionMenu, setShowProductionMenu] = useState(false);
  const [showInventoryMenu, setShowInventoryMenu] = useState(false);
  const [showSalesMenu, setShowSalesMenu] = useState(false);
  const [showEtiquetasMenu, setShowEtiquetasMenu] = useState(false);
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isProductionActive = productionMenu.some(item => pathname === item.href);
  const isInventoryActive = inventoryMenu.some(item => pathname === item.href);
  const isSalesActive = salesMenu.some(item => pathname === item.href);
  const isEtiquetasActive = etiquetasMenu.some(item => pathname === item.href);
  const isConfigActive = pathname.startsWith('/configuracoes');

  // Fechar menus quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.menu-dropdown')) {
        setShowProductionMenu(false);
        setShowInventoryMenu(false);
        setShowSalesMenu(false);
        setShowEtiquetasMenu(false);
        setShowConfigMenu(false);
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fechar menus quando mudar de página
  useEffect(() => {
    setShowProductionMenu(false);
    setShowInventoryMenu(false);
    setShowSalesMenu(false);
    setShowEtiquetasMenu(false);
    setShowConfigMenu(false);
    setShowUserMenu(false);
  }, [pathname]);

  // Função para fechar outros menus quando abrir um
  const handleMenuToggle = (menuType: 'production' | 'inventory' | 'sales' | 'etiquetas' | 'config' | 'user') => {
    // Fechar todos os outros menus primeiro
    if (menuType !== 'production') setShowProductionMenu(false);
    if (menuType !== 'inventory') setShowInventoryMenu(false);
    if (menuType !== 'sales') setShowSalesMenu(false);
    if (menuType !== 'etiquetas') setShowEtiquetasMenu(false);
    if (menuType !== 'config') setShowConfigMenu(false);
    if (menuType !== 'user') setShowUserMenu(false);

    // Alternar o menu clicado
    switch (menuType) {
      case 'production':
        setShowProductionMenu(!showProductionMenu);
        break;
      case 'inventory':
        setShowInventoryMenu(!showInventoryMenu);
        break;
      case 'sales':
        setShowSalesMenu(!showSalesMenu);
        break;
      case 'etiquetas':
        setShowEtiquetasMenu(!showEtiquetasMenu);
        break;
      case 'config':
        setShowConfigMenu(!showConfigMenu);
        break;
      case 'user':
        setShowUserMenu(!showUserMenu);
        break;
    }
  };

  // Função para fechar um menu específico
  const closeMenu = (menuType: 'production' | 'inventory' | 'sales' | 'etiquetas' | 'config' | 'user') => {
    switch (menuType) {
      case 'production':
        setShowProductionMenu(false);
        break;
      case 'inventory':
        setShowInventoryMenu(false);
        break;
      case 'sales':
        setShowSalesMenu(false);
        break;
      case 'etiquetas':
        setShowEtiquetasMenu(false);
        break;
      case 'config':
        setShowConfigMenu(false);
        break;
      case 'user':
        setShowUserMenu(false);
        break;
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">Granobox</h1>
            </div>
            <div className="hidden lg:ml-6 lg:flex lg:items-center lg:space-x-4">
              {/* Dashboard */}
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors duration-200 h-16`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
              
              {/* Menu Produção */}
              <div className="relative menu-dropdown">
                <button
                  onClick={() => handleMenuToggle('production')}
                  className={`${
                    isProductionActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors duration-200 h-16`}
                >
                  <CogIcon className="w-4 h-4 mr-2" />
                  Produção
                  <ChevronDownIcon className={`w-3 h-3 ml-1 transition-transform duration-200 ${showProductionMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showProductionMenu && (
                  <div className="absolute left-0 top-full mt-0 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    {productionMenu.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => closeMenu('production')}
                      >
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Menu Estoque */}
              <div className="relative menu-dropdown">
                <button
                  onClick={() => handleMenuToggle('inventory')}
                  className={`${
                    isInventoryActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors duration-200 h-16`}
                >
                  <CubeIcon className="w-4 h-4 mr-2" />
                  Estoque
                  <ChevronDownIcon className={`w-3 h-3 ml-1 transition-transform duration-200 ${showInventoryMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showInventoryMenu && (
                  <div className="absolute left-0 top-full mt-0 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    {inventoryMenu.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => closeMenu('inventory')}
                      >
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Menu Vendas */}
              <div className="relative menu-dropdown">
                <button
                  onClick={() => handleMenuToggle('sales')}
                  className={`${
                    isSalesActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors duration-200 h-16`}
                >
                  <ShoppingCartIcon className="w-4 h-4 mr-2" />
                  Vendas
                  <ChevronDownIcon className={`w-3 h-3 ml-1 transition-transform duration-200 ${showSalesMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showSalesMenu && (
                  <div className="absolute left-0 top-full mt-0 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    {salesMenu.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => closeMenu('sales')}
                      >
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Menu Etiquetas */}
              <div className="relative menu-dropdown">
                <button
                  onClick={() => handleMenuToggle('etiquetas')}
                  className={`${
                    isEtiquetasActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors duration-200 h-16`}
                >
                  <TagIcon className="w-4 h-4 mr-2" />
                  Etiquetas
                  <ChevronDownIcon className={`w-3 h-3 ml-1 transition-transform duration-200 ${showEtiquetasMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showEtiquetasMenu && (
                  <div className="absolute left-0 top-full mt-0 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    {etiquetasMenu.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => closeMenu('etiquetas')}
                      >
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu de Configurações e Usuário - Lado Direito */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            {/* Menu de Configurações */}
            <div className="relative menu-dropdown">
              <button
                onClick={() => handleMenuToggle('config')}
                className={`${
                  isConfigActive
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors duration-200 h-16`}
              >
                <WrenchScrewdriverIcon className="w-4 h-4 mr-2" />
                Configurações
                <ChevronDownIcon className={`w-3 h-3 ml-1 transition-transform duration-200 ${showConfigMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showConfigMenu && (
                <div className="absolute right-0 top-full mt-0 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  {configMenu.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => closeMenu('config')}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Menu do Usuário */}
            {user && (
              <div className="relative menu-dropdown">
                <button
                  onClick={() => handleMenuToggle('user')}
                  className="inline-flex items-center px-3 py-2 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors duration-200 h-16"
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  {user.name}
                  <ChevronDownIcon className={`w-3 h-3 ml-1 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-0 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                      {user.email}
                    </div>
                    {user.organizacao && (
                      <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                        {user.organizacao.nome}
                      </div>
                    )}
                    <button
                      onClick={logout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="lg:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {/* Dashboard */}
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
              >
                <div className="flex items-center">
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </div>
              </Link>
            );
          })}

          {/* Produção Mobile */}
          <div className="border-t border-gray-200 pt-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Produção
            </div>
            {productionMenu.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  } block pl-6 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Estoque Mobile */}
          <div className="border-t border-gray-200 pt-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Estoque
            </div>
            {inventoryMenu.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  } block pl-6 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Vendas Mobile */}
          <div className="border-t border-gray-200 pt-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Vendas
            </div>
            {salesMenu.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  } block pl-6 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Etiquetas Mobile */}
          <div className="border-t border-gray-200 pt-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Etiquetas
            </div>
            {etiquetasMenu.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  } block pl-6 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>
          
          {/* Configurações Mobile */}
          <div className="border-t border-gray-200 pt-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Configurações
            </div>
            {configMenu.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  } block pl-6 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200`}
                >
                  <div className="flex items-center">
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Usuário Mobile */}
          {user && (
            <div className="border-t border-gray-200 pt-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Usuário
              </div>
              <div className="px-6 py-2 text-sm text-gray-700">
                {user.name}
              </div>
              <div className="px-6 py-1 text-xs text-gray-500">
                {user.email}
              </div>
              {user.organizacao && (
                <div className="px-6 py-1 text-xs text-gray-500">
                  {user.organizacao.nome}
                </div>
              )}
              <button
                onClick={logout}
                className="flex items-center w-full pl-6 pr-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 border-l-4 border-transparent"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 