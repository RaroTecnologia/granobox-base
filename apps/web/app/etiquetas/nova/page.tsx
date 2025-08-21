'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  TagIcon, 
  ArrowLeftIcon,
  CheckIcon,
  QrCodeIcon,
  PrinterIcon,
  CameraIcon
} from '@heroicons/react/24/outline';

export default function NovaEtiquetaPage() {
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'materia-prima',
    codigo: '',
    descricao: '',
    unidade: 'g',
    quantidade: '',
    dataValidade: '',
    observacoes: ''
  });

  const [step, setStep] = useState(1);
  const [showQRCode, setShowQRCode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui implementaremos a lógica de salvamento
    console.log('Dados da etiqueta:', formData);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      if (i % 2 === 0) {
        result += chars.charAt(Math.floor(Math.random() * 26)); // Letras
      } else {
        result += chars.charAt(26 + Math.floor(Math.random() * 8)); // Números
      }
    }
    setFormData(prev => ({ ...prev, codigo: result }));
  };

  const steps = [
    { id: 1, name: 'Informações Básicas', icon: TagIcon },
    { id: 2, name: 'Detalhes', icon: CheckIcon },
    { id: 3, name: 'Revisão', icon: CheckIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <Link href="/etiquetas" className="flex items-center hover:text-orange-400 transition-colors">
                <ArrowLeftIcon className="h-6 w-6 mr-2" />
                <TagIcon className="h-8 w-8 text-orange-500" />
                <span className="ml-2 text-xl font-semibold">Granobox</span>
              </Link>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Passo {step} de {steps.length}</div>
              <div className="text-lg font-semibold">{steps[step - 1].name}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {steps.map((stepItem, index) => (
              <div key={stepItem.id} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  stepItem.id <= step 
                    ? 'bg-orange-500 border-orange-500 text-white' 
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {stepItem.id < step ? (
                    <CheckIcon className="w-6 h-6" />
                  ) : (
                    <stepItem.icon className="w-6 h-6" />
                  )}
                </div>
                <span className={`ml-3 text-sm font-medium ${
                  stepItem.id <= step ? 'text-orange-600' : 'text-gray-500'
                }`}>
                  {stepItem.name}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    stepItem.id < step ? 'bg-orange-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Informações Básicas */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-black mb-2">Informações Básicas</h1>
                <p className="text-gray-600">Configure os dados fundamentais da sua etiqueta</p>
              </div>

              {/* Nome e Tipo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold text-black mb-3">
                    Nome da Etiqueta *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full border-2 border-gray-300 rounded-full px-6 py-4 text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ex: Pão Francês, Farinha de Trigo"
                  />
                </div>
                
                <div>
                  <label className="block text-lg font-semibold text-black mb-3">
                    Tipo *
                  </label>
                  <select
                    required
                    value={formData.tipo}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full border-2 border-gray-300 rounded-full px-6 py-4 text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="materia-prima">Matéria Prima</option>
                    <option value="manipulados">Manipulados</option>
                    <option value="produtos">Produtos</option>
                  </select>
                </div>
              </div>

              {/* Código */}
              <div>
                <label className="block text-lg font-semibold text-black mb-3">
                  Código da Etiqueta *
                </label>
                <div className="flex space-x-4">
                  <input
                    type="text"
                    required
                    value={formData.codigo}
                    onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                    className="flex-1 border-2 border-gray-300 rounded-full px-6 py-4 text-lg font-mono focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="A2B4C6"
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full font-semibold transition-colors shadow-lg hover:shadow-xl"
                  >
                    Gerar
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2 ml-4">
                  Código de 6 caracteres (Letra-Número-Letra-Número-Letra-Número)
                </p>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-lg font-semibold text-black mb-3">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  rows={3}
                  className="w-full border-2 border-gray-300 rounded-2xl px-6 py-4 text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Descreva brevemente a etiqueta..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Detalhes */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-black mb-2">Detalhes da Etiqueta</h1>
                <p className="text-gray-600">Configure informações específicas e quantidades</p>
              </div>

              {/* Quantidade e Unidade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold text-black mb-3">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.quantidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantidade: e.target.value }))}
                    className="w-full border-2 border-gray-300 rounded-full px-6 py-4 text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="500"
                  />
                </div>
                
                <div>
                  <label className="block text-lg font-semibold text-black mb-3">
                    Unidade
                  </label>
                  <select
                    value={formData.unidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, unidade: e.target.value }))}
                    className="w-full border-2 border-gray-300 rounded-full px-6 py-4 text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="g">Gramas (g)</option>
                    <option value="kg">Quilogramas (kg)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="l">Litros (l)</option>
                    <option value="un">Unidades (un)</option>
                  </select>
                </div>
              </div>

              {/* Data de Validade */}
              <div>
                <label className="block text-lg font-semibold text-black mb-3">
                  Data de Validade
                </label>
                <input
                  type="date"
                  value={formData.dataValidade}
                  onChange={(e) => setFormData(prev => ({ ...prev, dataValidade: e.target.value }))}
                  className="w-full border-2 border-gray-300 rounded-full px-6 py-4 text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-lg font-semibold text-black mb-3">
                  Observações
                </label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  rows={3}
                  className="w-full border-2 border-gray-300 rounded-2xl px-6 py-4 text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Informações adicionais, instruções especiais..."
                />
              </div>
            </div>
          )}

          {/* Step 3: Revisão */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-black mb-2">Revisão da Etiqueta</h1>
                <p className="text-gray-600">Revise os dados antes de criar a etiqueta</p>
              </div>

              {/* Preview da Etiqueta */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-black mb-2">Preview da Etiqueta</h3>
                  <p className="text-gray-600">Como sua etiqueta será exibida</p>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-6 max-w-sm mx-auto">
                  <div className="text-center space-y-3">
                    <div className="text-3xl font-bold text-black">{formData.nome}</div>
                    <div className="text-2xl font-bold text-orange-600 font-mono">{formData.codigo}</div>
                    {formData.quantidade && (
                      <div className="text-lg text-gray-700">
                        {formData.quantidade} {formData.unidade}
                      </div>
                    )}
                    {formData.descricao && (
                      <div className="text-sm text-gray-600">{formData.descricao}</div>
                    )}
                    {formData.dataValidade && (
                      <div className="text-sm text-gray-600">
                        Validade: {new Date(formData.dataValidade).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code Toggle */}
                <div className="text-center mt-6">
                  <button
                    type="button"
                    onClick={() => setShowQRCode(!showQRCode)}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-full font-semibold transition-colors shadow-lg hover:shadow-xl flex items-center mx-auto"
                  >
                    <QrCodeIcon className="h-5 w-5 mr-2" />
                    {showQRCode ? 'Ocultar' : 'Mostrar'} QR Code
                  </button>
                </div>

                {showQRCode && (
                  <div className="text-center mt-4">
                    <div className="bg-white p-4 rounded-lg inline-block">
                      <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                        <QrCodeIcon className="h-16 w-16 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600 mt-2">QR Code será gerado automaticamente</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Resumo dos Dados */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-black mb-4">Resumo dos Dados</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><strong>Nome:</strong> {formData.nome}</div>
                  <div><strong>Tipo:</strong> {formData.tipo}</div>
                  <div><strong>Código:</strong> {formData.codigo}</div>
                  <div><strong>Quantidade:</strong> {formData.quantidade} {formData.unidade}</div>
                  {formData.dataValidade && <div><strong>Validade:</strong> {new Date(formData.dataValidade).toLocaleDateString('pt-BR')}</div>}
                  {formData.descricao && <div><strong>Descrição:</strong> {formData.descricao}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8">
            <button
              type="button"
              onClick={() => setStep(prev => Math.max(prev - 1, 1))}
              disabled={step === 1}
              className="bg-gray-800 text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Anterior
            </button>

            <div className="flex space-x-4">
              {step < steps.length ? (
                <button
                  type="button"
                  onClick={() => setStep(prev => Math.min(prev + 1, steps.length))}
                  className="bg-orange-500 text-white px-8 py-4 rounded-full font-semibold hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl flex items-center"
                >
                  Próximo
                  <ArrowLeftIcon className="h-5 w-5 ml-2 rotate-180" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="bg-orange-500 text-white px-8 py-4 rounded-full font-semibold hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl flex items-center"
                >
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Criar Etiqueta
                </button>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
