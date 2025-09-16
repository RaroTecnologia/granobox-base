import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, PencilSimple, Trash, User, ArrowLeft } from '@phosphor-icons/react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useOperators, CreateOperatorRequest, UpdateOperatorRequest } from '../hooks/useOperators';
import { LoadingSpinner } from '../components/LoadingSpinner';
import FooterNavigation from '../components/FooterNavigation';
import toast from 'react-hot-toast';

export default function CadastroOperadoresPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  // Para usuários manager, usar o primeiro cliente disponível
  const clientId = user?.clientId || (user?.role === 'manager' ? '6621e831-5d1d-4801-8c33-b0f93446a3df' : undefined);

  const { operators, isLoading, createOperator, updateOperator, deleteOperator } = useOperators(clientId);

  const [showModal, setShowModal] = useState(false);
  const [editingOperator, setEditingOperator] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateOperatorRequest>({
    name: '',
    pin: '',
    phone: '',
    email: '',
    department: '',
    isActive: true,
    clientId: clientId || '',
  });

  const handleInputChange = (field: keyof CreateOperatorRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      pin: '',
      phone: '',
      email: '',
      department: '',
      isActive: true,
      clientId: clientId || '',
    });
    setEditingOperator(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (!formData.pin.trim() || formData.pin.length !== 4) {
      toast.error('PIN deve ter exatamente 4 dígitos');
      return;
    }

    setIsSubmitting(true);

    try {
      // Limpar campos vazios antes de enviar
      const cleanData = {
        ...formData,
        phone: formData.phone?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        department: formData.department?.trim() || undefined,
      };

      if (editingOperator) {
        await updateOperator(editingOperator, cleanData as UpdateOperatorRequest);
        toast.success('Operador atualizado com sucesso!');
      } else {
        await createOperator(cleanData);
        toast.success('Operador criado com sucesso!');
      }
      
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar operador');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (operator: any) => {
    setFormData({
      name: operator.name,
      pin: operator.pin,
      phone: operator.phone || '',
      email: operator.email || '',
      department: operator.department || '',
      isActive: operator.isActive,
      clientId: operator.clientId,
    });
    setEditingOperator(operator.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOperator(id);
      toast.success('Operador excluído com sucesso!');
      setShowDeleteModal(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir operador');
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-900' : 'bg-light-50'}`}>
      {/* Header fixo */}
      <header className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} border-b px-4 py-4 sticky top-0 z-10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/cadastros')}
              className={`p-2 ${theme === 'dark' ? 'hover:bg-dark-700' : 'hover:bg-light-100'} rounded-lg transition-colors`}
            >
              <ArrowLeft size={24} weight="duotone" />
            </button>
            
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User size={24} weight="duotone" className="text-white" />
            </div>
            
            <div>
              <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Operadores
              </h1>
              <p className="text-primary text-sm">
                Gerencie os operadores que podem imprimir etiquetas
              </p>
            </div>
          </div>
          
          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            <span>Novo Operador</span>
          </button>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="px-4 py-6 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Lista de Operadores */}
          <div className="grid gap-4">
          {operators.length === 0 ? (
            <div className={`text-center py-12 ${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl border`}>
              <User size={48} className={`mx-auto mb-4 ${theme === 'dark' ? 'text-dark-400' : 'text-light-400'}`} />
              <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                Nenhum operador cadastrado
              </h3>
              <p className={`${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'} mb-4`}>
                Cadastre operadores para controlar quem pode imprimir etiquetas
              </p>
              <button
                onClick={openCreateModal}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Cadastrar Primeiro Operador
              </button>
            </div>
          ) : (
            operators.map((operator) => (
              <div
                key={operator.id}
                className={`${theme === 'dark' ? 'bg-dark-800 border-dark-700' : 'bg-white border-light-200'} rounded-2xl p-6 border shadow-sm`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${operator.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                      <User size={24} className={operator.isActive ? 'text-green-600' : 'text-red-600'} />
                    </div>
                    
                    <div>
                      <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
                        {operator.name}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`text-sm ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
                          PIN: ••••
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      operator.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {operator.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                    
                    <button
                      onClick={() => handleEdit(operator)}
                      className={`p-2 rounded-lg transition-colors ${
                        theme === 'dark' 
                          ? 'hover:bg-dark-700 text-dark-300' 
                          : 'hover:bg-light-100 text-dark-600'
                      }`}
                    >
                      <PencilSimple size={18} />
                    </button>
                    
                    <button
                      onClick={() => setShowDeleteModal(operator.id)}
                      className="p-2 rounded-lg transition-colors text-red-500 hover:bg-red-50"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
          </div>
        </div>
      </main>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}>
            <h2 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              {editingOperator ? 'Editar Operador' : 'Novo Operador'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    theme === 'dark'
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                      : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                  } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                  placeholder="Nome do operador"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                  PIN (4 dígitos) *
                </label>
                <input
                  type="text"
                  value={formData.pin}
                  onChange={(e) => handleInputChange('pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                    theme === 'dark'
                      ? 'bg-dark-700 border-dark-600 text-white focus:border-primary'
                      : 'bg-white border-light-300 text-dark-900 focus:border-primary'
                  } focus:outline-none focus:ring-2 focus:ring-primary/20`}
                  placeholder="0000"
                  maxLength={4}
                />
              </div>


              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="isActive" className={`text-sm ${theme === 'dark' ? 'text-dark-300' : 'text-dark-700'}`}>
                  Operador ativo
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                    theme === 'dark'
                      ? 'border-dark-600 text-dark-300 hover:bg-dark-700'
                      : 'border-light-300 text-dark-600 hover:bg-light-50'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : editingOperator ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${theme === 'dark' ? 'bg-dark-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md`}>
            <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-dark-900'}`}>
              Confirmar Exclusão
            </h2>
            <p className={`mb-6 ${theme === 'dark' ? 'text-dark-300' : 'text-dark-600'}`}>
              Tem certeza que deseja excluir este operador? Esta ação não pode ser desfeita.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'border-dark-600 text-dark-300 hover:bg-dark-700'
                    : 'border-light-300 text-dark-600 hover:bg-light-50'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <FooterNavigation />
    </div>
  );
}
