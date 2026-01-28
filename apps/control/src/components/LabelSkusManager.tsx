import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  PencilSimple,
  Trash,
  CheckCircle,
  XCircle,
  Spinner,
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { labelSkusService } from '../services/api';
import type { LabelSku, CreateLabelSkuRequest, UpdateLabelSkuRequest } from '../types/api';

export function LabelSkusManager() {
  const [skus, setSkus] = useState<LabelSku[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSku, setEditingSku] = useState<LabelSku | null>(null);
  const [formData, setFormData] = useState<CreateLabelSkuRequest>({
    code: '',
    name: '',
    description: '',
    labelsPerRoll: 1000,
    width: undefined,
    height: undefined,
    unit: 'mm',
    material: '',
    supplier: '',
    unitPrice: undefined,
    isActive: true,
  });

  useEffect(() => {
    loadSkus();
  }, []);

  const loadSkus = async () => {
    try {
      setIsLoading(true);
      const data = await labelSkusService.getAll(true); // Incluir inativos
      setSkus(data);
    } catch (error) {
      console.error('Erro ao carregar SKUs:', error);
      alert('Erro ao carregar SKUs de etiquetas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Limpar campos opcionais que estão vazios ou inválidos
      const cleanData: CreateLabelSkuRequest | UpdateLabelSkuRequest = {
        ...formData,
        width: formData.width && !isNaN(formData.width) && formData.width > 0 ? formData.width : undefined,
        height: formData.height && !isNaN(formData.height) && formData.height > 0 ? formData.height : undefined,
        unitPrice: formData.unitPrice && !isNaN(formData.unitPrice) && formData.unitPrice >= 0 ? formData.unitPrice : undefined,
        description: formData.description || undefined,
        material: formData.material || undefined,
        supplier: formData.supplier || undefined,
      };

      if (editingSku) {
        // Para update, garantir que code seja string se presente
        const updateData: UpdateLabelSkuRequest = {
          ...cleanData,
          code: cleanData.code || editingSku.code,
        };
        await labelSkusService.update(editingSku.id, updateData);
      } else {
        // Para create, garantir que campos obrigatórios sejam definidos
        const createData: CreateLabelSkuRequest = {
          code: cleanData.code || '',
          name: cleanData.name || '',
          labelsPerRoll: cleanData.labelsPerRoll ?? 1000,
          description: cleanData.description,
          width: cleanData.width,
          height: cleanData.height,
          unit: cleanData.unit,
          material: cleanData.material,
          supplier: cleanData.supplier,
          unitPrice: cleanData.unitPrice,
          isActive: cleanData.isActive ?? true,
          metadata: cleanData.metadata,
        };
        await labelSkusService.create(createData);
      }
      setShowForm(false);
      setEditingSku(null);
      resetForm();
      loadSkus();
    } catch (error: any) {
      console.error('Erro ao salvar SKU:', error);
      alert(error.response?.data?.message || 'Erro ao salvar SKU de etiqueta');
    }
  };

  const handleEdit = (sku: LabelSku) => {
    setEditingSku(sku);
    setFormData({
      code: sku.code,
      name: sku.name,
      description: sku.description || '',
      labelsPerRoll: sku.labelsPerRoll,
      width: sku.width ? Number(sku.width) : undefined,
      height: sku.height ? Number(sku.height) : undefined,
      unit: sku.unit || 'mm',
      material: sku.material || '',
      supplier: sku.supplier || '',
      unitPrice: sku.unitPrice ? Number(sku.unitPrice) : undefined,
      isActive: sku.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este SKU?')) {
      return;
    }
    try {
      await labelSkusService.delete(id);
      loadSkus();
    } catch (error: any) {
      console.error('Erro ao excluir SKU:', error);
      alert(error.response?.data?.message || 'Erro ao excluir SKU');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await labelSkusService.toggleActive(id);
      loadSkus();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status do SKU');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      labelsPerRoll: 1000,
      width: undefined,
      height: undefined,
      unit: 'mm',
      material: '',
      supplier: '',
      unitPrice: undefined,
      isActive: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SKUs de Etiquetas</h2>
          <p className="text-gray-600 mt-1">
            Cadastre os tipos de etiquetas disponíveis para pedidos
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingSku(null);
            resetForm();
          }}
        >
          <Plus size={16} className="mr-2" />
          Novo SKU
        </Button>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSku ? 'Editar SKU' : 'Novo SKU de Etiqueta'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código do SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="Ex: ETQ-50x30-1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Etiqueta 50x30mm - 1000 por rolo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Descrição adicional do tipo de etiqueta..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etiquetas por Rolo *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.labelsPerRoll}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        labelsPerRoll: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Largura (mm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.width || ''}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      setFormData({
                        ...formData,
                        width: value ? (isNaN(parseFloat(value)) ? undefined : parseFloat(value)) : undefined,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Altura (mm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.height || ''}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      setFormData({
                        ...formData,
                        height: value ? (isNaN(parseFloat(value)) ? undefined : parseFloat(value)) : undefined,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço por Rolo (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitPrice || ''}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      setFormData({
                        ...formData,
                        unitPrice: value ? (isNaN(parseFloat(value)) ? undefined : parseFloat(value)) : undefined,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material
                  </label>
                  <input
                    type="text"
                    value={formData.material || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, material: e.target.value })
                    }
                    placeholder="Ex: Papel adesivo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    value={formData.supplier || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                    placeholder="Nome do fornecedor"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label className="text-sm text-gray-700">SKU ativo</label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSku(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSku ? 'Salvar Alterações' : 'Criar SKU'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de SKUs */}
      <Card>
        <CardHeader>
          <CardTitle>SKUs Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size={24} className="animate-spin text-primary-600" />
              <span className="ml-2 text-gray-600">Carregando...</span>
            </div>
          ) : skus.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package size={48} className="mx-auto mb-4 text-gray-400" />
              <p>Nenhum SKU cadastrado</p>
              <p className="text-sm mt-2">
                Clique em "Novo SKU" para criar o primeiro
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Código
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Nome
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Etiquetas/Rolo
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Dimensões
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Preço/Rolo
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {skus.map((sku) => (
                    <tr
                      key={sku.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-medium">{sku.code}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{sku.name}</span>
                        {sku.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {sku.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">
                          {sku.labelsPerRoll.toLocaleString('pt-BR')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {sku.width && sku.height
                          ? `${Number(sku.width)} x ${Number(sku.height)} ${sku.unit || 'mm'}`
                          : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {sku.unitPrice
                          ? `R$ ${Number(sku.unitPrice).toFixed(2)}`
                          : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            sku.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          <div className="flex items-center gap-1">
                            {sku.isActive ? (
                              <CheckCircle size={14} />
                            ) : (
                              <XCircle size={14} />
                            )}
                            {sku.isActive ? 'Ativo' : 'Inativo'}
                          </div>
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(sku)}
                          >
                            <PencilSimple size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleActive(sku.id)}
                          >
                            {sku.isActive ? 'Desativar' : 'Ativar'}
                          </Button>
                          {!sku.isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(sku.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash size={14} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
