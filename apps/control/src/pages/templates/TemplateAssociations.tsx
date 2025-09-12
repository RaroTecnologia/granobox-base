import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, PencilSimple, Trash, Check, X } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useTemplates } from '../../hooks/useTemplates';
import type { TemplateAssociation } from '../../types/templates';

const TemplateAssociations: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { 
    associations, 
    templates, 
    loading, 
    createAssociation, 
    updateAssociation, 
    deleteAssociation 
  } = useTemplates(clientId);

  const [showModal, setShowModal] = useState(false);
  const [editingAssociation, setEditingAssociation] = useState<TemplateAssociation | null>(null);
  const [formData, setFormData] = useState({
    templateId: '',
    labelType: '',
    isActive: true,
  });

  const labelTypes = [
    { value: 'produto_manipulado', label: 'Produto Manipulado' },
    { value: 'produto_pronto', label: 'Produto Pronto' },
    { value: 'recebimento', label: 'Recebimento' },
    { value: 'etiqueta_validade', label: 'Etiqueta de Validade' },
  ];

  const getLabelTypeLabel = (type: string) => {
    return labelTypes.find(lt => lt.value === type)?.label || type;
  };

  const getLabelTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'produto_manipulado': 'bg-blue-100 text-blue-800',
      'produto_pronto': 'bg-green-100 text-green-800',
      'recebimento': 'bg-yellow-100 text-yellow-800',
      'etiqueta_validade': 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAssociation) {
        await updateAssociation(editingAssociation.id, formData);
      } else {
        await createAssociation(formData);
      }
      
      setShowModal(false);
      setEditingAssociation(null);
      setFormData({
        templateId: '',
        labelType: '',
        isActive: true,
      });
    } catch (error) {
      console.error('Erro ao salvar associação:', error);
    }
  };

  const handleEdit = (association: TemplateAssociation) => {
    setEditingAssociation(association);
    setFormData({
      templateId: association.templateId,
      labelType: association.labelType,
      isActive: association.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar esta associação?')) {
      try {
        await deleteAssociation(id);
      } catch (error) {
        console.error('Erro ao deletar associação:', error);
      }
    }
  };

  const toggleActive = async (association: TemplateAssociation) => {
    try {
      await updateAssociation(association.id, {
        isActive: !association.isActive,
      });
    } catch (error) {
      console.error('Erro ao atualizar associação:', error);
    }
  };

  const getTemplateName = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    return template?.name || 'Template não encontrado';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Associações de Templates</h1>
          <p className="text-gray-600">Configure quais templates usar para cada tipo de etiqueta</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Associação
        </Button>
      </div>

      {/* Associations List */}
      <div className="space-y-4">
        {associations.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Plus className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma associação configurada
            </h3>
            <p className="text-gray-600 mb-4">
              Configure as associações para definir quais templates usar para cada tipo de etiqueta
            </p>
            <Button onClick={() => setShowModal(true)}>
              Criar Primeira Associação
            </Button>
          </Card>
        ) : (
          associations.map((association) => (
            <Card key={association.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getTemplateName(association.templateId)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Template para {getLabelTypeLabel(association.labelType)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getLabelTypeColor(association.labelType)}>
                      {getLabelTypeLabel(association.labelType)}
                    </Badge>
                    {association.isActive ? (
                      <Badge className="bg-green-100 text-green-800">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">
                        Inativo
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(association)}
                    className={association.isActive ? 'text-red-600' : 'text-green-600'}
                  >
                    {association.isActive ? (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Ativar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(association)}
                  >
                    <PencilSimple className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(association.id)}
                    className="text-red-600"
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Deletar
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingAssociation ? 'Editar Associação' : 'Nova Associação'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template
                </label>
                <select
                  value={formData.templateId}
                  onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  required
                >
                  <option value="">Selecione um template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Etiqueta
                </label>
                <select
                  value={formData.labelType}
                  onChange={(e) => setFormData({ ...formData, labelType: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  required
                >
                  <option value="">Selecione o tipo</option>
                  {labelTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Ativo
                </label>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingAssociation(null);
                    setFormData({
                      templateId: '',
                      labelType: '',
                      isActive: true,
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingAssociation ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateAssociations;
