import React, { useState } from 'react';
import { 
  Plus, 
  PencilSimple, 
  Trash, 
  Eye, 
  CalendarBlank,
  Building,
  MapPin,
  Phone,
  EnvelopeSimple,
  Play,
  Pause,
  Stop
} from '@phosphor-icons/react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { SubscriptionForm } from './forms/SubscriptionForm';
import { OperationForm } from './forms/OperationForm';
import { PlanLimits } from './PlanLimits';
import { useSubscriptions } from '../hooks/useSubscriptions';
import type { Plan, Subscription, Operation } from '../services/subscriptionsService';

interface ClientSubscriptionsProps {
  clientId: string;
}

const ClientSubscriptions: React.FC<ClientSubscriptionsProps> = ({ clientId }) => {
  const {
    subscriptions,
    operations,
    plans,
    isLoading,
    error,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    createOperation,
    updateOperation,
    deleteOperation
  } = useSubscriptions(clientId);

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showOperationModal, setShowOperationModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);

  const handleCreateSubscription = async (data: any) => {
    try {
      await createSubscription(data);
      setShowSubscriptionModal(false);
    } catch (error) {
      console.error('Erro ao criar subscription:', error);
    }
  };

  const handleUpdateSubscription = async (data: any) => {
    if (!editingSubscription) return;
    
    try {
      await updateSubscription(editingSubscription.id, data);
      setEditingSubscription(null);
      setShowSubscriptionModal(false);
    } catch (error) {
      console.error('Erro ao atualizar subscription:', error);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar esta subscription?')) {
      try {
        await deleteSubscription(id);
      } catch (error) {
        console.error('Erro ao deletar subscription:', error);
      }
    }
  };

  const handleCreateOperation = async (data: any) => {
    try {
      await createOperation(data);
      setShowOperationModal(false);
    } catch (error) {
      console.error('Erro ao criar operation:', error);
    }
  };

  const handleUpdateOperation = async (data: any) => {
    if (!editingOperation) return;
    
    try {
      await updateOperation(editingOperation.id, data);
      setEditingOperation(null);
      setShowOperationModal(false);
    } catch (error) {
      console.error('Erro ao atualizar operation:', error);
    }
  };

  const handleDeleteOperation = async (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar esta operation?')) {
      try {
        await deleteOperation(id);
      } catch (error) {
        console.error('Erro ao deletar operation:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOperationStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
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
          <h2 className="text-xl font-semibold text-gray-900">Subscriptions</h2>
          <p className="text-gray-600">Gerencie subscriptions e operations do cliente</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowOperationModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Operation
          </Button>
          <Button 
            onClick={() => setShowSubscriptionModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Subscription
          </Button>
        </div>
      </div>

      {/* Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarBlank className="h-5 w-5" />
            Subscriptions Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-8">
              <CalendarBlank className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma subscription encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                Crie a primeira subscription para este cliente
              </p>
              <Button onClick={() => setShowSubscriptionModal(true)}>
                Criar Subscription
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {subscription.plan?.name || 'Plano não encontrado'}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(subscription.status)}`}>
                          {subscription.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Início:</span> {new Date(subscription.startDate).toLocaleDateString('pt-BR')}
                        </div>
                        <div>
                          <span className="font-medium">Fim:</span> {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString('pt-BR') : 'Indefinido'}
                        </div>
                        <div>
                          <span className="font-medium">Limite de Tags:</span> {subscription.plan?.tagLimit || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Tags Usadas:</span> {subscription.tagsUsed || 0}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingSubscription(subscription);
                          setShowSubscriptionModal(true);
                        }}
                      >
                        <PencilSimple className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSubscription(subscription.id)}
                        className="text-red-600"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Operations Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {operations.length === 0 ? (
            <div className="text-center py-8">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma operation encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                Crie a primeira operation para este cliente
              </p>
              <Button onClick={() => setShowOperationModal(true)}>
                Criar Operation
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {operations.map((operation) => (
                <div key={operation.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {operation.type}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded ${getOperationStatusColor(operation.status)}`}>
                          {operation.status}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <div className="mb-1">
                          <span className="font-medium">Data:</span> {new Date(operation.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                        {operation.description && (
                          <div>
                            <span className="font-medium">Descrição:</span> {operation.description}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingOperation(operation);
                          setShowOperationModal(true);
                        }}
                      >
                        <PencilSimple className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOperation(operation.id)}
                        className="text-red-600"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showSubscriptionModal && (
        <SubscriptionForm
          isOpen={showSubscriptionModal}
          onClose={() => {
            setShowSubscriptionModal(false);
            setEditingSubscription(null);
          }}
          onSubmit={editingSubscription ? handleUpdateSubscription : handleCreateSubscription}
          subscription={editingSubscription}
          plans={plans}
          clientId={clientId}
        />
      )}

      {showOperationModal && (
        <OperationForm
          isOpen={showOperationModal}
          onClose={() => {
            setShowOperationModal(false);
            setEditingOperation(null);
          }}
          onSubmit={editingOperation ? handleUpdateOperation : handleCreateOperation}
          operation={editingOperation}
          clientId={clientId}
        />
      )}
    </div>
  );
};

export default ClientSubscriptions;
