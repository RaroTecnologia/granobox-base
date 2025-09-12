import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsService } from '../services/api';
import type { ApiClient, CreateClientRequest } from '../types/api';

// Hook para listar clientes
export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: clientsService.getAll,
  });
}

// Hook para buscar cliente por ID
export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientsService.getById(id),
    enabled: !!id,
  });
}

// Hook para criar cliente
export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: clientsService.create,
    onSuccess: () => {
      // Invalidar cache para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

// Hook para atualizar cliente
export function useUpdateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateClientRequest> }) => 
      clientsService.update(id, data),
    onSuccess: (_, { id }) => {
      // Invalidar cache para atualizar a lista e o item específico
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', id] });
    },
  });
}

// Hook para ativar cliente
export function useActivateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: clientsService.activate,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', id] });
    },
  });
}

// Hook para desativar cliente
export function useDeactivateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: clientsService.deactivate,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients', id] });
    },
  });
}

// Hook para excluir cliente
export function useDeleteClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: clientsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
