'use client';

import Link from 'next/link';
import { TagIcon, QrCodeIcon, PrinterIcon, PlusIcon, CogIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <TagIcon className="h-10 w-10 text-orange-500" />
              <h1 className="ml-3 text-2xl font-bold">Granobox</h1>
            </div>
            <button className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
              <CogIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Sistema de Etiquetas
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Crie, gerencie e imprima etiquetas de forma simples e rápida
          </p>
        </div>

        {/* Main Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Criar Nova Etiqueta */}
          <Link href="/etiquetas/nova" className="group">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-orange-500">
              <div className="text-center">
                <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
                  <PlusIcon className="h-10 w-10 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">Nova Etiqueta</h3>
                <p className="text-gray-600">Crie uma nova etiqueta do zero</p>
              </div>
            </div>
          </Link>

          {/* Etiquetas Existentes */}
          <Link href="/etiquetas" className="group">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-orange-500">
              <div className="text-center">
                <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                  <TagIcon className="h-10 w-10 text-gray-600" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">Minhas Etiquetas</h3>
                <p className="text-gray-600">Visualize e gerencie suas etiquetas</p>
              </div>
            </div>
          </Link>

          {/* Imprimir */}
          <Link href="/imprimir" className="group">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-orange-500">
              <div className="text-center">
                <div className="mx-auto w-20 h-20 bg-black rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-800 transition-colors">
                  <PrinterIcon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">Imprimir</h3>
                <p className="text-gray-600">Imprima suas etiquetas</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
          <h3 className="text-2xl font-bold text-black mb-6 text-center">Ações Rápidas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="bg-orange-500 text-white py-4 px-6 rounded-full text-lg font-semibold hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl">
              📱 Etiqueta Rápida
            </button>
            <button className="bg-gray-800 text-white py-4 px-6 rounded-full text-lg font-semibold hover:bg-gray-700 transition-colors shadow-lg hover:shadow-xl">
              🏷️ Lote de Etiquetas
            </button>
            <button className="bg-orange-500 text-white py-4 px-6 rounded-full text-lg font-semibold hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl">
              📊 Relatórios
            </button>
            <button className="bg-gray-800 text-white py-4 px-6 rounded-full text-lg font-semibold hover:bg-gray-700 transition-colors shadow-lg hover:shadow-xl">
              ⚙️ Configurações
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-black mb-6 text-center">Atividade Recente</h3>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gray-50 rounded-xl">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-4"></div>
              <div className="flex-1">
                <p className="text-black font-medium">Etiqueta "Pão Francês" criada</p>
                <p className="text-gray-600 text-sm">Há 2 minutos</p>
              </div>
              <TagIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex items-center p-4 bg-gray-50 rounded-xl">
              <div className="w-3 h-3 bg-gray-500 rounded-full mr-4"></div>
              <div className="flex-1">
                <p className="text-black font-medium">Lote de 50 etiquetas impresso</p>
                <p className="text-gray-600 text-sm">Há 15 minutos</p>
              </div>
              <PrinterIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex items-center p-4 bg-gray-50 rounded-xl">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-4"></div>
              <div className="flex-1">
                <p className="text-black font-medium">Etiqueta "Bolo Chocolate" editada</p>
                <p className="text-gray-600 text-sm">Há 1 hora</p>
              </div>
              <QrCodeIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-400">© 2025 Granobox - Sistema de Etiquetas</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 