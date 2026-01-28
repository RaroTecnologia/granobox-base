import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  PencilSimple,
  Trash,
  Spinner,
  X,
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { labelOrdersService, labelSkusService } from '../services/api';
import type { LabelOrder, CreateLabelOrderRequest, CreateLabelOrderItemRequest, UpdateLabelOrderRequest, LabelOrderStats, LabelSku } from '../types/api';

interface LabelOrdersTabProps {
  clientId: string;
}

export function LabelOrdersTab({ clientId }: LabelOrdersTabProps) {
  const [orders, setOrders] = useState<LabelOrder[]>([]);
  const [stats, setStats] = useState<LabelOrderStats | null>(null);
  const [skus, setSkus] = useState<LabelSku[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSkus, setIsLoadingSkus] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<LabelOrder | null>(null);
  const [editingTrackingCode, setEditingTrackingCode] = useState<string | null>(null);
  const [trackingCodeValue, setTrackingCodeValue] = useState<string>('');
  const [shippingCompanyValue, setShippingCompanyValue] = useState<string>('');
  const [formData, setFormData] = useState<CreateLabelOrderRequest>({
    items: [{ skuId: '', rolls: 1 }],
    freight: 0,
    notes: '',
  });

  useEffect(() => {
    loadOrders();
    loadStats();
    loadSkus();
  }, [clientId]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const data = await labelOrdersService.getByClient(clientId);
      setOrders(data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      alert('Erro ao carregar pedidos de etiquetas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await labelOrdersService.getClientStats(clientId);
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const loadSkus = async () => {
    try {
      setIsLoadingSkus(true);
      const data = await labelSkusService.getAll(false); // Apenas ativos
      setSkus(data);
    } catch (error) {
      console.error('Erro ao carregar SKUs:', error);
    } finally {
      setIsLoadingSkus(false);
    }
  };

  const getSelectedSku = (skuId: string) => {
    return skus.find((s) => s.id === skuId);
  };

  const calculateItemSubtotal = (item: CreateLabelOrderItemRequest) => {
    const sku = getSelectedSku(item.skuId);
    if (!sku || !sku.unitPrice) return 0;
    return item.rolls * Number(sku.unitPrice);
  };

  const calculateItemQuantity = (item: CreateLabelOrderItemRequest) => {
    const sku = getSelectedSku(item.skuId);
    if (!sku) return 0;
    return item.rolls * sku.labelsPerRoll;
  };

  const calculateTotal = () => {
    const itemsTotal = formData.items.reduce((sum, item) => {
      return sum + calculateItemSubtotal(item);
    }, 0);
    return itemsTotal + (formData.freight || 0);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { skuId: '', rolls: 1 }],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index),
      });
    }
  };

  const updateItem = (index: number, field: keyof CreateLabelOrderItemRequest, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que todos os itens têm SKU selecionado e rolls válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // Filtrar apenas itens válidos
    const validItems = formData.items.filter(item => {
      const hasSku = item.skuId && item.skuId.trim() !== '';
      const isValidUuid = hasSku && uuidRegex.test(item.skuId.trim());
      const rolls = Number(item.rolls);
      const isValidRolls = !isNaN(rolls) && rolls >= 1 && rolls <= 10000 && Number.isInteger(rolls);
      return isValidUuid && isValidRolls;
    });
    
    if (validItems.length === 0) {
      alert('Por favor, preencha pelo menos um item corretamente. SKU deve ser selecionado e quantidade de rolos entre 1 e 10000.');
      return;
    }
    
    // Verificar se há itens inválidos que não foram filtrados
    const invalidItems = formData.items.filter(item => {
      const hasSku = item.skuId && item.skuId.trim() !== '';
      const isValidUuid = hasSku && uuidRegex.test(item.skuId.trim());
      const rolls = Number(item.rolls);
      const isValidRolls = !isNaN(rolls) && rolls >= 1 && rolls <= 10000 && Number.isInteger(rolls);
      return !isValidUuid || !isValidRolls;
    });
    
    if (invalidItems.length > 0 && validItems.length < formData.items.length) {
      alert('Alguns itens estão incompletos. Apenas itens válidos serão enviados.');
    }

    try {
      if (editingOrder) {
        // Para edição, ainda não suportamos múltiplos itens
        // Por enquanto, apenas atualizar status e notas
        await labelOrdersService.update(editingOrder.id, {
          notes: formData.notes,
        } as UpdateLabelOrderRequest);
      } else {
        // Usar apenas os itens válidos já validados acima
        const payloadItems = validItems.map(item => {
          const rolls = Math.floor(Number(item.rolls));
          
          if (rolls < 1 || rolls > 10000) {
            throw new Error(`Quantidade de rolos inválida: ${rolls}`);
          }
          
          const itemPayload: any = {
            skuId: item.skuId!.trim(),
            rolls: rolls,
          };
          
          if (item.isRibbon !== undefined && item.isRibbon !== null) {
            itemPayload.isRibbon = Boolean(item.isRibbon);
          }
          
          if (item.notes && item.notes.trim()) {
            itemPayload.notes = item.notes.trim();
          }
          
          return itemPayload;
        });
        
        const payload: any = {
          items: payloadItems,
        };
        
        // Adicionar apenas campos que existem e têm valor
        if (formData.freight !== undefined && formData.freight !== null && formData.freight > 0) {
          payload.freight = Number(formData.freight);
        }
        
        if (formData.notes && formData.notes.trim()) {
          payload.notes = formData.notes.trim();
        }
        
        // Não incluir requestedDate - será gerenciado no dashboard
        
        // Validação final antes de enviar
        if (!payload.items || payload.items.length === 0) {
          alert('Erro: Nenhum item válido para enviar.');
          return;
        }
        
        // Validar cada item uma última vez
        const finalUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        for (const item of payload.items) {
          if (!item.skuId || typeof item.skuId !== 'string' || !finalUuidRegex.test(item.skuId)) {
            throw new Error(`SKU inválido: ${item.skuId}`);
          }
          if (typeof item.rolls !== 'number' || !Number.isInteger(item.rolls) || item.rolls < 1 || item.rolls > 10000) {
            throw new Error(`Quantidade de rolos inválida: ${item.rolls}`);
          }
        }
        
        console.log('Enviando payload:', JSON.stringify(payload, null, 2));
        await labelOrdersService.create(clientId, payload);
      }
      setShowForm(false);
      setEditingOrder(null);
            setFormData({
              items: [{ skuId: '', rolls: 1 }],
              freight: 0,
              notes: '',
            });
      loadOrders();
      loadStats();
    } catch (error: any) {
      console.error('Erro ao salvar pedido:', error);
      console.error('Response data:', error?.response?.data);
      if (error?.response?.data?.message && Array.isArray(error.response.data.message)) {
        console.error('Mensagens de erro detalhadas:');
        error.response.data.message.forEach((msg: string, index: number) => {
          console.error(`  ${index + 1}. ${msg}`);
        });
      }
      
      // Tentar extrair a mensagem de erro do backend
      let errorMessage = 'Erro ao salvar pedido de etiquetas';
      
      if (error?.response?.data) {
        const data = error.response.data;
        
        // NestJS geralmente retorna mensagens em 'message' (string ou array)
        if (data.message) {
          if (Array.isArray(data.message)) {
            errorMessage = data.message.join(', ');
          } else {
            errorMessage = data.message;
          }
        } else if (data.error) {
          errorMessage = data.error;
        } else if (typeof data === 'string') {
          errorMessage = data;
        } else {
          // Tentar extrair todas as mensagens de validação
          const messages: string[] = [];
          if (data.message) messages.push(...(Array.isArray(data.message) ? data.message : [data.message]));
          if (data.error) messages.push(data.error);
          if (messages.length > 0) {
            errorMessage = messages.join(', ');
          } else {
            errorMessage = JSON.stringify(data);
          }
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      alert(`Erro ao salvar pedido:\n\n${errorMessage}`);
    }
  };

  const handleEdit = (order: LabelOrder) => {
    setEditingOrder(order);
    // Se o pedido tem itens, usar os itens; senão, criar um item com os dados antigos
    if (order.items && order.items.length > 0) {
      setFormData({
        items: order.items.map(item => ({
          skuId: item.skuId || '',
          rolls: item.rolls,
          notes: item.notes,
        })),
        freight: order.freight || 0,
        notes: order.notes || '',
      });
    } else {
      // Compatibilidade com pedidos antigos
      setFormData({
        items: [{ 
          skuId: order.skuId || '', 
          rolls: order.rolls || 1,
        }],
        freight: order.freight || 0,
        notes: order.notes || '',
      });
    }
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este pedido?')) {
      return;
    }
    try {
      await labelOrdersService.delete(id);
      loadOrders();
      loadStats();
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
      alert('Erro ao excluir pedido');
    }
  };

  const handleStatusChange = async (id: string, status: LabelOrder['status']) => {
    try {
      await labelOrdersService.update(id, { status });
      loadOrders();
      loadStats();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do pedido');
    }
  };

  const handleEditTrackingCode = (order: LabelOrder) => {
    setEditingTrackingCode(order.id);
    setTrackingCodeValue(order.trackingCode || '');
    setShippingCompanyValue(order.shippingCompany || '');
  };

  const handleSaveTrackingCode = async (orderId: string) => {
    try {
      await labelOrdersService.update(orderId, { 
        trackingCode: trackingCodeValue.trim() || undefined,
        shippingCompany: shippingCompanyValue.trim() || undefined,
      });
      setEditingTrackingCode(null);
      setTrackingCodeValue('');
      setShippingCompanyValue('');
      loadOrders();
    } catch (error: any) {
      console.error('Erro ao salvar código de rastreio:', error);
      alert(error?.response?.data?.message || 'Erro ao salvar código de rastreio');
    }
  };

  const handleCancelEditTrackingCode = () => {
    setEditingTrackingCode(null);
    setTrackingCodeValue('');
    setShippingCompanyValue('');
  };

  const getStatusIcon = (status: LabelOrder['status']) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} className="text-yellow-600" />;
      case 'approved':
        return <CheckCircle size={16} className="text-blue-600" />;
      case 'processing':
        return <Spinner size={16} className="text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'cancelled':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getStatusLabel = (status: LabelOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'approved':
        return 'Aprovado';
      case 'processing':
        return 'Em Processamento';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusColor = (status: LabelOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Package size={24} className="text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock size={24} className="text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Concluídos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle size={24} className="text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Solicitado</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {stats.totalQuantity.toLocaleString('pt-BR')}
                  </p>
                </div>
                <Package size={24} className="text-primary-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header com botão de novo pedido */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pedidos de Etiquetas</h2>
          <p className="text-gray-600 mt-1">
            Gerencie os pedidos de etiquetas do cliente
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingOrder(null);
            setFormData({
              items: [{ skuId: '', rolls: 1 }],
              freight: 0,
              notes: '',
            });
          }}
        >
          <Plus size={16} className="mr-2" />
          Novo Pedido
        </Button>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingOrder ? 'Editar Pedido' : 'Novo Pedido de Etiquetas'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Itens do Pedido */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Itens do Pedido *
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                  >
                    <Plus size={14} className="mr-1" />
                    Adicionar Item
                  </Button>
                </div>

                {formData.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 relative">
                    {formData.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="absolute top-2 right-2 h-6 w-6 text-danger-600 hover:text-danger-700"
                      >
                        <X size={14} />
                      </Button>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          SKU *
                        </label>
                        <select
                          required
                          value={item.skuId}
                          onChange={(e) => updateItem(index, 'skuId', e.target.value)}
                          disabled={isLoadingSkus}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Selecione um SKU</option>
                          {skus.map((sku) => (
                            <option key={sku.id} value={sku.id}>
                              {sku.code} - {sku.name} ({sku.labelsPerRoll.toLocaleString('pt-BR')} etiquetas/rolo)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantidade de Rolos *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10000"
                          step="1"
                          required
                          value={item.rolls}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numValue = parseInt(value, 10);
                            if (!isNaN(numValue) && numValue >= 1 && numValue <= 10000) {
                              updateItem(index, 'rolls', numValue);
                            } else if (value === '') {
                              updateItem(index, 'rolls', 1);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        {getSelectedSku(item.skuId) && (
                          <p className="text-xs text-gray-500 mt-1">
                            Total: {calculateItemQuantity(item).toLocaleString('pt-BR')} etiquetas
                          </p>
                        )}
                      </div>

                    </div>

                    {getSelectedSku(item.skuId) && item.rolls > 0 && (
                      <div className="mt-3 text-sm text-gray-600">
                        <span className="font-medium">Subtotal deste item:</span>{' '}
                        R$ {calculateItemSubtotal(item).toFixed(2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frete (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.freight || 0}
                  onChange={(e) =>
                    setFormData({ ...formData, freight: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Resumo do Pedido */}
              {formData.items.some(item => item.skuId && item.rolls > 0) && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Resumo do Pedido</h4>
                  <div className="space-y-2 text-sm">
                    {formData.items.map((item, index) => {
                      const sku = getSelectedSku(item.skuId);
                      if (!sku || item.rolls === 0) return null;
                      return (
                        <div key={index} className="flex justify-between items-center border-b border-blue-200 pb-2">
                          <div>
                            <span className="font-medium">{sku.code}</span>
                            <div className="text-xs text-gray-600">
                              {item.rolls} rolo(s) × {sku.labelsPerRoll.toLocaleString('pt-BR')} etiquetas = {calculateItemQuantity(item).toLocaleString('pt-BR')} etiquetas
                            </div>
                          </div>
                          <div className="font-medium">
                            R$ {calculateItemSubtotal(item).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-between items-center pt-2 border-t-2 border-blue-300">
                      <div>
                        <div className="text-gray-600">Frete:</div>
                        <div className="font-bold text-lg text-blue-900">Total:</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-600">R$ {Number(formData.freight || 0).toFixed(2)}</div>
                        <div className="font-bold text-lg text-blue-900">
                          R$ {Number(calculateTotal()).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Informações adicionais sobre o pedido..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingOrder(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingOrder ? 'Salvar Alterações' : 'Criar Pedido'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size={24} className="animate-spin text-primary-600" />
              <span className="ml-2 text-gray-600">Carregando...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package size={48} className="mx-auto mb-4 text-gray-400" />
              <p>Nenhum pedido de etiquetas encontrado</p>
              <p className="text-sm mt-2">
                Clique em "Novo Pedido" para criar o primeiro pedido
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      SKU
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Rolos
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Total Etiquetas
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Valor Total
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Código de Rastreio
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Criado em
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Observações
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="font-mono font-medium">{item.sku?.code || '-'}</span>
                                {item.sku && (
                                  <p className="text-xs text-gray-500">{item.sku.name}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : order.sku ? (
                          <div>
                            <span className="font-mono font-medium text-sm">{order.sku.code}</span>
                            <p className="text-xs text-gray-500">{order.sku.name}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="font-medium">{item.rolls}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="font-medium">{order.rolls || 0}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="font-medium">
                                  {(item.quantity || 0).toLocaleString('pt-BR')} un
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="font-medium">
                            {(order.quantity || 0).toLocaleString('pt-BR')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {order.totalPrice ? (
                          <span className="font-medium text-green-600">
                            R$ {Number(order.totalPrice).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(order.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {getStatusLabel(order.status)}
                          </div>
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {editingTrackingCode === order.id ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={shippingCompanyValue}
                                onChange={(e) => setShippingCompanyValue(e.target.value)}
                                placeholder="Transportadora"
                                className="px-2 py-1 border border-gray-300 rounded-md text-sm w-40"
                                maxLength={100}
                              />
                              <input
                                type="text"
                                value={trackingCodeValue}
                                onChange={(e) => setTrackingCodeValue(e.target.value)}
                                placeholder="Código de rastreio"
                                className="px-2 py-1 border border-gray-300 rounded-md text-sm w-40"
                                maxLength={100}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveTrackingCode(order.id)}
                              >
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEditTrackingCode}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {order.shippingCompany && (
                              <div className="text-sm font-medium text-gray-700">
                                {order.shippingCompany}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 font-mono">
                                {order.trackingCode || '-'}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditTrackingCode(order)}
                                className="h-6 w-6"
                              >
                                <PencilSimple size={14} />
                              </Button>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {order.notes || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 justify-end">
                          {order.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusChange(order.id, 'approved')
                                }
                              >
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(order)}
                              >
                                <PencilSimple size={14} />
                              </Button>
                            </>
                          )}
                          {order.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleStatusChange(order.id, 'processing')
                              }
                            >
                              Processar
                            </Button>
                          )}
                          {order.status === 'processing' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleStatusChange(order.id, 'completed')
                              }
                            >
                              Concluir
                            </Button>
                          )}
                          {(order.status === 'pending' ||
                            order.status === 'cancelled') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(order.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash size={14} />
                            </Button>
                          )}
                          {order.status !== 'cancelled' &&
                            order.status !== 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusChange(order.id, 'cancelled')
                                }
                                className="text-red-600 hover:text-red-700"
                              >
                                Cancelar
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
