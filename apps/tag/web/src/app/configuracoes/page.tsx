'use client'

import { 
  Tag, 
  Gear,
  User,
  Printer,
  Database,
  Bell,
  Shield,
  Palette,
  Globe,
  Key,
  Eye,
  EyeSlash,
  Check,
  X,
  Queue
} from '@phosphor-icons/react'
import React, { useState } from 'react'

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('sistema')
  const [showPassword, setShowPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Estados para configurações
  const [configSistema, setConfigSistema] = useState({
    nomeEstabelecimento: 'Padaria do João',
    cnpj: '12.345.678/0001-90',
    endereco: 'Rua das Flores, 123 - Centro',
    telefone: '(11) 99999-9999',
    email: 'contato@padariadojoao.com.br',
    timezone: 'America/Sao_Paulo',
    idioma: 'pt-BR'
  })

  const [configUsuario, setConfigUsuario] = useState({
    nome: 'João Silva',
    email: 'joao@padariadojoao.com.br',
    cargo: 'Gerente',
    telefone: '(11) 98888-8888',
    notificacoes: true,
    tema: 'dark'
  })

  const [configImpressora, setConfigImpressora] = useState({
    nome: 'Impressora Principal',
    modelo: 'Zebra ZT410',
    ip: '192.168.1.100',
    porta: '9100',
    tipo: 'zpl',
    larguraEtiqueta: '4',
    alturaEtiqueta: '6',
    densidade: '203',
    velocidade: '2'
  })

  const [configNotificacoes, setConfigNotificacoes] = useState({
    email: true,
    push: true,
    impressao: true,
    erro: true,
    fila: true
  })

  const handleSaveSistema = async () => {
    setIsSaving(true)
    // Simular salvamento
    setTimeout(() => {
      setIsSaving(false)
      alert('Configurações do sistema salvas com sucesso!')
    }, 1500)
  }

  const handleSaveUsuario = async () => {
    setIsSaving(true)
    // Simular salvamento
    setTimeout(() => {
      setIsSaving(false)
      alert('Configurações do usuário salvas com sucesso!')
    }, 1500)
  }

  const handleSaveImpressora = async () => {
    setIsSaving(true)
    // Simular salvamento
    setTimeout(() => {
      setIsSaving(false)
      alert('Configurações da impressora salvas com sucesso!')
    }, 1500)
  }

  const handleTestImpressora = async () => {
    // Simular teste de impressora
    alert('Teste de impressora iniciado. Verifique se a etiqueta foi impressa.')
  }

  const renderTabButton = (id: string, label: string, icon: React.ComponentType<any>, active: boolean) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all ${
        active 
          ? 'bg-primary text-white shadow-lg' 
          : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white'
      }`}
    >
      {React.createElement(icon, { size: 24, weight: "duotone" })}
      <span className="font-medium">{label}</span>
    </button>
  )

  const renderSistema = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-white text-2xl font-bold">Configurações do Sistema</h2>
        <button
          onClick={handleSaveSistema}
          disabled={isSaving}
          className="bg-primary hover:bg-primary-600 disabled:bg-primary-700 text-white px-6 py-2 rounded-full font-medium transition-colors shadow-lg flex items-center space-x-2"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Check size={20} weight="duotone" />
              <span>Salvar</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Nome do Estabelecimento</label>
            <input
              type="text"
              value={configSistema.nomeEstabelecimento}
              onChange={(e) => setConfigSistema(prev => ({ ...prev, nomeEstabelecimento: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">CNPJ</label>
            <input
              type="text"
              value={configSistema.cnpj}
              onChange={(e) => setConfigSistema(prev => ({ ...prev, cnpj: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Endereço</label>
            <input
              type="text"
              value={configSistema.endereco}
              onChange={(e) => setConfigSistema(prev => ({ ...prev, endereco: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Telefone</label>
            <input
              type="text"
              value={configSistema.telefone}
              onChange={(e) => setConfigSistema(prev => ({ ...prev, telefone: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Email</label>
            <input
              type="email"
              value={configSistema.email}
              onChange={(e) => setConfigSistema(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Fuso Horário</label>
            <select
              value={configSistema.timezone}
              onChange={(e) => setConfigSistema(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
              <option value="America/Manaus">Manaus (UTC-4)</option>
              <option value="America/Belem">Belém (UTC-3)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderUsuario = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-white text-2xl font-bold">Configurações do Usuário</h2>
        <button
          onClick={handleSaveUsuario}
          disabled={isSaving}
          className="bg-primary hover:bg-primary-600 disabled:bg-primary-700 text-white px-6 py-2 rounded-full font-medium transition-colors shadow-lg flex items-center space-x-2"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Check size={20} weight="duotone" />
              <span>Salvar</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Nome Completo</label>
            <input
              type="text"
              value={configUsuario.nome}
              onChange={(e) => setConfigUsuario(prev => ({ ...prev, nome: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Email</label>
            <input
              type="email"
              value={configUsuario.email}
              onChange={(e) => setConfigUsuario(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Cargo</label>
            <input
              type="text"
              value={configUsuario.cargo}
              onChange={(e) => setConfigUsuario(prev => ({ ...prev, cargo: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Telefone</label>
            <input
              type="text"
              value={configUsuario.telefone}
              onChange={(e) => setConfigUsuario(prev => ({ ...prev, telefone: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Tema</label>
            <select
              value={configUsuario.tema}
              onChange={(e) => setConfigUsuario(prev => ({ ...prev, tema: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="dark">Escuro</option>
              <option value="light">Claro</option>
              <option value="auto">Automático</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="notificacoes"
              checked={configUsuario.notificacoes}
              onChange={(e) => setConfigUsuario(prev => ({ ...prev, notificacoes: e.target.checked }))}
              className="w-4 h-4 text-primary bg-dark-700 border-dark-800 rounded focus:ring-primary focus:ring-2"
            />
            <label htmlFor="notificacoes" className="text-white">Receber notificações</label>
          </div>
        </div>
      </div>

      {/* Alterar Senha */}
      <div className="bg-dark-800 rounded-2xl p-6 border border-dark-800">
        <h3 className="text-white text-lg font-semibold mb-4 flex items-center space-x-2">
          <Key size={20} weight="duotone" className="text-primary" />
          <span>Alterar Senha</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Senha Atual</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-12"
                placeholder="Digite sua senha atual"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeSlash size={20} weight="duotone" /> : <Eye size={20} weight="duotone" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Nova Senha</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Digite a nova senha"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Confirmar Nova Senha</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              placeholder="Confirme a nova senha"
            />
          </div>
        </div>

        <div className="mt-4">
          <button className="bg-primary hover:bg-primary-600 text-white px-6 py-2 rounded-full font-medium transition-colors shadow-lg">
            Alterar Senha
          </button>
        </div>
      </div>
    </div>
  )

  const renderImpressora = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-white text-2xl font-bold">Configurações da Impressora</h2>
        <div className="flex space-x-3">
          <button
            onClick={handleTestImpressora}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-medium transition-colors shadow-lg flex items-center space-x-2"
          >
            <Printer size={20} weight="duotone" />
            <span>Testar</span>
          </button>
          <button
            onClick={handleSaveImpressora}
            disabled={isSaving}
            className="bg-primary hover:bg-primary-600 disabled:bg-primary-700 text-white px-6 py-2 rounded-full font-medium transition-colors shadow-lg flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Check size={20} weight="duotone" />
                <span>Salvar</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Nome da Impressora</label>
            <input
              type="text"
              value={configImpressora.nome}
              onChange={(e) => setConfigImpressora(prev => ({ ...prev, nome: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Modelo</label>
            <input
              type="text"
              value={configImpressora.modelo}
              onChange={(e) => setConfigImpressora(prev => ({ ...prev, modelo: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Endereço IP</label>
            <input
              type="text"
              value={configImpressora.ip}
              onChange={(e) => setConfigImpressora(prev => ({ ...prev, ip: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Porta</label>
            <input
              type="text"
              value={configImpressora.porta}
              onChange={(e) => setConfigImpressora(prev => ({ ...prev, porta: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Tipo de Etiqueta</label>
            <select
              value={configImpressora.tipo}
              onChange={(e) => setConfigImpressora(prev => ({ ...prev, tipo: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="zpl">ZPL (Zebra)</option>
              <option value="tspl">TSPL (TSC)</option>
              <option value="epl">EPL (Epson)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Largura da Etiqueta (pol)</label>
            <input
              type="text"
              value={configImpressora.larguraEtiqueta}
              onChange={(e) => setConfigImpressora(prev => ({ ...prev, larguraEtiqueta: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Altura da Etiqueta (pol)</label>
            <input
              type="text"
              value={configImpressora.alturaEtiqueta}
              onChange={(e) => setConfigImpressora(prev => ({ ...prev, alturaEtiqueta: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Densidade (DPI)</label>
            <select
              value={configImpressora.densidade}
              onChange={(e) => setConfigImpressora(prev => ({ ...prev, densidade: e.target.value }))}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="203">203 DPI</option>
              <option value="300">300 DPI</option>
              <option value="600">600 DPI</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderNotificacoes = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-white text-2xl font-bold">Configurações de Notificações</h2>
        <button
          onClick={() => alert('Configurações de notificações salvas!')}
          className="bg-primary hover:bg-primary-600 text-white px-6 py-2 rounded-full font-medium transition-colors shadow-lg flex items-center space-x-2"
        >
          <Check size={20} weight="duotone" />
          <span>Salvar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-white text-lg font-semibold mb-4">Canais de Notificação</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-dark-800 rounded-xl border border-dark-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Globe size={20} weight="duotone" className="text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Email</p>
                  <p className="text-dark-400 text-sm">Notificações por email</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={configNotificacoes.email}
                onChange={(e) => setConfigNotificacoes(prev => ({ ...prev, email: e.target.checked }))}
                className="w-5 h-5 text-primary bg-dark-700 border-dark-800 rounded focus:ring-primary focus:ring-2"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-dark-800 rounded-xl border border-dark-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Bell size={20} weight="duotone" className="text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Push</p>
                  <p className="text-dark-400 text-sm">Notificações push no navegador</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={configNotificacoes.push}
                onChange={(e) => setConfigNotificacoes(prev => ({ ...prev, push: e.target.checked }))}
                className="w-5 h-5 text-primary bg-dark-700 border-dark-800 rounded focus:ring-primary focus:ring-2"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-white text-lg font-semibold mb-4">Tipos de Notificação</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-dark-800 rounded-xl border border-dark-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Printer size={20} weight="duotone" className="text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Impressão</p>
                  <p className="text-dark-400 text-sm">Status de impressão</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={configNotificacoes.impressao}
                onChange={(e) => setConfigNotificacoes(prev => ({ ...prev, impressao: e.target.checked }))}
                className="w-5 h-5 text-primary bg-dark-700 border-dark-800 rounded focus:ring-primary focus:ring-2"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-dark-800 rounded-xl border border-dark-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <X size={20} weight="duotone" className="text-red-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Erros</p>
                  <p className="text-dark-400 text-sm">Alertas de erro</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={configNotificacoes.erro}
                onChange={(e) => setConfigNotificacoes(prev => ({ ...prev, erro: e.target.checked }))}
                className="w-5 h-5 text-primary bg-dark-700 border-dark-800 rounded focus:ring-primary focus:ring-2"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-dark-800 rounded-xl border border-dark-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Queue size={20} weight="duotone" className="text-yellow-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Fila</p>
                  <p className="text-dark-400 text-sm">Atualizações da fila</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={configNotificacoes.fila}
                onChange={(e) => setConfigNotificacoes(prev => ({ ...prev, fila: e.target.checked }))}
                className="w-5 h-5 text-primary bg-dark-700 border-dark-800 rounded focus:ring-primary focus:ring-2"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'usuario':
        return renderUsuario()
      case 'impressora':
        return renderImpressora()
      case 'notificacoes':
        return renderNotificacoes()
      default:
        return renderSistema()
    }
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header Fixo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-dark-950/95 backdrop-blur-sm border-b border-dark-800 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Gear size={24} weight="duotone" className="text-white" />
            </div>
            <div>
                                <h1 className="text-white text-xl font-bold">Configurações</h1>
              <p className="text-primary text-sm">Gerencie as configurações do sistema</p>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="pt-32 px-6 py-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Tabs de Navegação */}
          <div className="flex flex-wrap gap-3 mb-8">
            {renderTabButton('sistema', 'Sistema', Database, activeTab === 'sistema')}
            {renderTabButton('usuario', 'Usuário', User, activeTab === 'usuario')}
            {renderTabButton('impressora', 'Impressora', Printer, activeTab === 'impressora')}
            {renderTabButton('notificacoes', 'Notificações', Bell, activeTab === 'notificacoes')}
          </div>

          {/* Conteúdo da Tab */}
          <div className="bg-dark-800 rounded-3xl p-8 border border-dark-800 shadow-2xl">
            {renderContent()}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-dark-950/95 backdrop-blur-sm border-t border-dark-800 shadow-2xl">
        <div className="flex justify-around items-center px-6 py-4">
          <a href="/dashboard" className="flex flex-col items-center space-y-1 text-dark-400 hover:text-white transition-colors">
            <Tag size={24} weight="duotone" />
            <span className="text-xs font-medium">Dash</span>
          </a>
          <a href="/etiquetas" className="flex flex-col items-center space-y-1 text-dark-400 hover:text-white transition-colors">
            <Tag size={24} weight="duotone" />
            <span className="text-xs font-medium">Etiquetas</span>
          </a>
          <a href="/cadastros" className="flex flex-col items-center space-y-1 text-dark-400 hover:text-white transition-colors">
            <Tag size={24} weight="duotone" />
            <span className="text-xs font-medium">Cadastros</span>
          </a>
          <a href="/configuracoes" className="flex flex-col items-center space-y-1 text-primary">
            <Tag size={24} weight="duotone" />
            <span className="text-xs font-medium">Config</span>
          </a>
        </div>
      </nav>

      {/* Espaçamento para o bottom navigation */}
      <div className="h-24"></div>
    </div>
  )
}
