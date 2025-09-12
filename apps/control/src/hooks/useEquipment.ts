import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipmentService } from '../services/api';
import type { ApiEquipment, CreateEquipmentRequest } from '../types/api';

// Hook para listar equipamentos de um cliente específico
export function useEquipmentByClient(clientId: string) {
  return useQuery<ApiEquipment[], Error>({
    queryKey: ['equipment', { clientId }],
    queryFn: () => equipmentService.getByClient(clientId),
    enabled: !!clientId, // Só executa se clientId existir
  });
}

// Hook para listar todos os equipamentos
export function useAllEquipment() {
  return useQuery<ApiEquipment[], Error>({
    queryKey: ['equipment'],
    queryFn: () => equipmentService.getAll(),
  });
}

// Hook para buscar um equipamento por ID
export function useEquipment(id: string) {
  return useQuery<ApiEquipment, Error>({
    queryKey: ['equipment', id],
    queryFn: () => equipmentService.getById(id),
    enabled: !!id,
  });
}

// Hook para obter estatísticas de equipamentos
export function useEquipmentStats(clientId?: string) {
  return useQuery({
    queryKey: ['equipment', 'stats', { clientId }],
    queryFn: () => equipmentService.getStats(clientId),
  });
}

// Hook para criar um novo equipamento
export function useCreateEquipment() {
  const queryClient = useQueryClient();
  return useMutation<ApiEquipment, Error, CreateEquipmentRequest>({
    mutationFn: equipmentService.create,
    onSuccess: (newEquipment) => {
      queryClient.invalidateQueries({ queryKey: ['equipment', { clientId: newEquipment.clientId }] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', 'stats'] });
    },
  });
}

// Hook para atualizar um equipamento
export function useUpdateEquipment() {
  const queryClient = useQueryClient();
  return useMutation<ApiEquipment, Error, { id: string; data: Partial<CreateEquipmentRequest> }>({
    mutationFn: ({ id, data }) => equipmentService.update(id, data),
    onSuccess: (updatedEquipment) => {
      queryClient.invalidateQueries({ queryKey: ['equipment', updatedEquipment.id] });
      queryClient.invalidateQueries({ queryKey: ['equipment', { clientId: updatedEquipment.clientId }] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', 'stats'] });
    },
  });
}

// Hook para atualizar status de um equipamento
export function useUpdateEquipmentStatus() {
  const queryClient = useQueryClient();
  return useMutation<ApiEquipment, Error, { id: string; status: ApiEquipment['status'] }>({
    mutationFn: ({ id, status }) => equipmentService.updateStatus(id, status),
    onSuccess: (updatedEquipment) => {
      queryClient.invalidateQueries({ queryKey: ['equipment', updatedEquipment.id] });
      queryClient.invalidateQueries({ queryKey: ['equipment', { clientId: updatedEquipment.clientId }] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', 'stats'] });
    },
  });
}

// Hook para ativar/desativar um equipamento
export function useToggleActiveEquipment() {
  const queryClient = useQueryClient();
  return useMutation<ApiEquipment, Error, string>({
    mutationFn: equipmentService.toggleActive,
    onSuccess: (updatedEquipment) => {
      queryClient.invalidateQueries({ queryKey: ['equipment', updatedEquipment.id] });
      queryClient.invalidateQueries({ queryKey: ['equipment', { clientId: updatedEquipment.clientId }] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', 'stats'] });
    },
  });
}

// Hook para excluir um equipamento
export function useDeleteEquipment() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: equipmentService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      queryClient.invalidateQueries({ queryKey: ['equipment', 'stats'] });
    },
  });
}
