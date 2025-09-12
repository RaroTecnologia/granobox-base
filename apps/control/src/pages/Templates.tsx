import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MagnifyingGlass, Funnel, DotsThreeVertical, PencilSimple, Copy, Trash, Eye, Upload, Download } from '@phosphor-icons/react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useTemplates } from '../hooks/useTemplates';
import type { Template } from '../types/templates';

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const { templates, loading, error, deleteTemplate, duplicateTemplate } = useTemplates();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || template.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este template?')) {
      try {
        await deleteTemplate(id);
      } catch (error) {
        console.error('Erro ao deletar template:', error);
      }
    }
  };

  const handleDuplicate = async (id: string, name: string) => {
    const newName = prompt('Nome do novo template:', `${name} - Cópia`);
    if (newName) {
      try {
        await duplicateTemplate(id, newName);
      } catch (error) {
        console.error('Erro ao duplicar template:', error);
      }
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'produto_manipulado': 'Produto Manipulado',
      'produto_pronto': 'Produto Pronto',
      'recebimento': 'Recebimento',
      'etiqueta_validade': 'Etiqueta de Validade',
      'custom': 'Personalizado'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'produto_manipulado': 'bg-blue-100 text-blue-800',
      'produto_pronto': 'bg-green-100 text-green-800',
      'recebimento': 'bg-yellow-100 text-yellow-800',
      'etiqueta_validade': 'bg-purple-100 text-purple-800',
      'custom': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Erro: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates de Etiquetas</h1>
          <p className="text-gray-600">Gerencie templates criados no Tagment Studio</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => navigate('/templates/upload')}
          >
            <Upload className="h-4 w-4" />
            Upload Template
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => navigate('/templates/upload')}
          >
            <Plus className="h-4 w-4" />
            Novo Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Funnel className="h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">Todos os tipos</option>
              <option value="produto_manipulado">Produto Manipulado</option>
              <option value="produto_pronto">Produto Pronto</option>
              <option value="recebimento">Recebimento</option>
              <option value="etiqueta_validade">Etiqueta de Validade</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
            {/* Preview do Template */}
            <div className="mb-4">
              {template.preview ? (
                <img 
                  src={template.preview} 
                  alt={template.name}
                  className="w-full h-32 object-contain bg-gray-50 rounded border"
                />
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded border flex items-center justify-center">
                  <Eye className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {template.description}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getTypeColor(template.type)}>
                    {getTypeLabel(template.type)}
                  </Badge>
                  {template.isDefault && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Padrão
                    </Badge>
                  )}
                  {template.isActive ? (
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
              <div className="relative">
                <button
                  onClick={() => setSelectedTemplate(template)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <DotsThreeVertical className="h-4 w-4 text-gray-400" />
                </button>
                {selectedTemplate?.id === template.id && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
                    <button
                      onClick={() => {
                        setSelectedTemplate(null);
                        // Navigate to edit
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <PencilSimple className="h-4 w-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTemplate(null);
                        handleDuplicate(template.id, template.name);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Copy className="h-4 w-4" />
                      Duplicar
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTemplate(null);
                        // Download template
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTemplate(null);
                        handleDelete(template.id);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash className="h-4 w-4" />
                      Deletar
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {template.width}x{template.height}px • 
              Criado em {new Date(template.createdAt).toLocaleDateString('pt-BR')}
            </div>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <MagnifyingGlass className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum template encontrado
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterType !== 'all' 
              ? 'Tente ajustar os filtros de busca'
              : 'Comece criando seu primeiro template'
            }
          </p>
          <Button onClick={() => navigate('/templates/upload')}>
            Upload Primeiro Template
          </Button>
        </Card>
      )}

      {/* Click outside to close dropdown */}
      {selectedTemplate && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
};

export default Templates;
