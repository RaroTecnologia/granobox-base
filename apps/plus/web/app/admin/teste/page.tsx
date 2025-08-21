'use client'

export default function TestePage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Teste de Formatação</h1>
      
      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <div>
          <label htmlFor="test-input" className="block text-sm font-medium text-gray-700 mb-2">
            Input de Teste
          </label>
          <input
            type="text"
            id="test-input"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Digite algo aqui..."
          />
        </div>
        
        <div>
          <label htmlFor="test-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select de Teste
          </label>
          <select
            id="test-select"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option>Opção 1</option>
            <option>Opção 2</option>
            <option>Opção 3</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="test-textarea" className="block text-sm font-medium text-gray-700 mb-2">
            Textarea de Teste
          </label>
          <textarea
            id="test-textarea"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Digite um texto longo aqui..."
          />
        </div>
        
        <div className="flex items-center">
          <input
            id="test-checkbox"
            type="checkbox"
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="test-checkbox" className="ml-2 block text-sm text-gray-900">
            Checkbox de teste
          </label>
        </div>
        
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Botão de Teste
        </button>
      </div>
    </div>
  )
} 