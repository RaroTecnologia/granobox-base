'use client'

import { useState, useEffect } from 'react'
import { 
  CogIcon,
  BuildingOfficeIcon,
  BellIcon,
  ShieldCheckIcon,
  WifiIcon,
  CreditCardIcon,
  EnvelopeIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface ConfiguracaoSistema {
  id: string
  nomeEmpresa: string
  emailSuporte: string
  telefoneSuporte: string
  endereco: string
  cnpj: string
  corPrimaria: string
  corSecundaria: string
  timezone: string
  idioma: string
  moeda: string
  backupAutomatico: boolean
  notificacoesEmail: boolean
  notificacoesSMS: boolean
  politicaSenha: {
    tamanhoMinimo: number
    caracteresEspeciais: boolean
    numeros: boolean
    maiusculas: boolean
  }
  sessao: {
    tempoExpiracao: number
    maximoSessoes: number
  }
  pagamento: {
    gateway: string
    modoTeste: boolean
    webhookUrl: string
  }
}

export default function ConfiguracoesPage() {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoSistema | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('geral')

  useEffect(() => {
    fetchConfiguracoes()
  }, [])

  const fetchConfiguracoes = async () => {
    try {
      const response = await fetch('/api/admin/configuracoes')
      if (response.ok) {
        const data = await response.json()
        setConfiguracoes(data)
      } else {
        // Configurações padrão se não existir
        setConfiguracoes({
          id: '1',
          nomeEmpresa: 'Granobox',
          emailSuporte: 'suporte@granobox.com',
          telefoneSuporte: '(11) 99999-9999',
          endereco: 'São Paulo, SP',
          cnpj: '00.000.000/0001-00',
          corPrimaria: '#f2811d',
          corSecundaria: '#0ea5e9',
          timezone: 'America/Sao_Paulo',
          idioma: 'pt-BR',
          moeda: 'BRL',
          backupAutomatico: true,
          notificacoesEmail: true,
          notificacoesSMS: false,
          politicaSenha: {
            tamanhoMinimo: 8,
            caracteresEspeciais: true,
            numeros: true,
            maiusculas: true
          },
          sessao: {
            tempoExpiracao: 24,
            maximoSessoes: 5
          },
          pagamento: {
            gateway: 'stripe',
            modoTeste: true,
            webhookUrl: ''
          }
        })
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (section: string, field: string, value: any) => {
    if (!configuracoes) return

    setConfiguracoes(prev => {
      if (!prev) return prev

      if (section === 'politicaSenha') {
        return {
          ...prev,
          politicaSenha: {
            ...prev.politicaSenha,
            [field]: value
          }
        }
      }

      if (section === 'sessao') {
        return {
          ...prev,
          sessao: {
            ...prev.sessao,
            [field]: value
          }
        }
      }

      if (section === 'pagamento') {
        return {
          ...prev,
          pagamento: {
            ...prev.pagamento,
            [field]: value
          }
        }
      }

      return {
        ...prev,
        [field]: value
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!configuracoes) return

    setSaving(true)
    try {
      const response = await fetch('/api/admin/configuracoes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configuracoes),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar configurações')
      }

      toast.success('Configurações salvas com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar configurações')
      console.error('Erro:', error)
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'geral', name: 'Geral', icon: BuildingOfficeIcon },
    { id: 'notificacoes', name: 'Notificações', icon: BellIcon },
    { id: 'seguranca', name: 'Segurança', icon: ShieldCheckIcon },
    { id: 'integracao', name: 'Integração', icon: WifiIcon },
    { id: 'pagamento', name: 'Pagamento', icon: CreditCardIcon },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  if (!configuracoes) {
    return (
      <div className="text-center py-12">
        <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Erro ao carregar configurações</h3>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie as configurações globais do Granobox
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="mt-6">
          {activeTab === 'geral' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Informações da Empresa
                  </h3>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="nomeEmpresa" className="block text-sm font-medium text-gray-700">
                        Nome da Empresa *
                      </label>
                      <input
                        type="text"
                        id="nomeEmpresa"
                        value={configuracoes.nomeEmpresa}
                        onChange={(e) => handleInputChange('geral', 'nomeEmpresa', e.target.value)}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="emailSuporte" className="block text-sm font-medium text-gray-700">
                        Email de Suporte *
                      </label>
                      <input
                        type="email"
                        id="emailSuporte"
                        value={configuracoes.emailSuporte}
                        onChange={(e) => handleInputChange('geral', 'emailSuporte', e.target.value)}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notificacoes' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Configurações de Notificações
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="notificacoesEmail"
                      type="checkbox"
                      checked={configuracoes.notificacoesEmail}
                      onChange={(e) => handleInputChange('geral', 'notificacoesEmail', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="notificacoesEmail" className="ml-2 block text-sm text-gray-900">
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-1" />
                        Notificações por Email
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="backupAutomatico"
                      type="checkbox"
                      checked={configuracoes.backupAutomatico}
                      onChange={(e) => handleInputChange('geral', 'backupAutomatico', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="backupAutomatico" className="ml-2 block text-sm text-gray-900">
                      Backup Automático
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seguranca' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Política de Senhas
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="tamanhoMinimo" className="block text-sm font-medium text-gray-700">
                      Tamanho Mínimo
                    </label>
                    <input
                      type="number"
                      id="tamanhoMinimo"
                      min="6"
                      max="20"
                      value={configuracoes.politicaSenha.tamanhoMinimo}
                      onChange={(e) => handleInputChange('politicaSenha', 'tamanhoMinimo', parseInt(e.target.value))}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pagamento' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Configurações de Pagamento
                </h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="gateway" className="block text-sm font-medium text-gray-700">
                      Gateway de Pagamento
                    </label>
                    <select
                      id="gateway"
                      value={configuracoes.pagamento.gateway}
                      onChange={(e) => handleInputChange('pagamento', 'gateway', e.target.value)}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="stripe">Stripe</option>
                      <option value="paypal">PayPal</option>
                      <option value="mercadopago">Mercado Pago</option>
                      <option value="pix">PIX</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="modoTeste"
                      type="checkbox"
                      checked={configuracoes.pagamento.modoTeste}
                      onChange={(e) => handleInputChange('pagamento', 'modoTeste', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="modoTeste" className="ml-2 block text-sm text-gray-900">
                      Modo de Teste
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="mt-8 flex justify-end space-x-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
} 