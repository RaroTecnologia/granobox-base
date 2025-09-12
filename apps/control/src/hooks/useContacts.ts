import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsService } from '../services/api';
import type { ApiContact, CreateContactRequest } from '../types/api';

// Hook para listar todos os contatos
export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: contactsService.getAll,
  });
}

// Hook para listar contatos de um cliente específico
export function useContactsByClient(clientId: string) {
  return useQuery({
    queryKey: ['contacts', 'client', clientId],
    queryFn: () => contactsService.getByClient(clientId),
    enabled: !!clientId,
  });
}

// Hook para buscar um contato específico
export function useContact(id: string) {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: () => contactsService.getById(id),
    enabled: !!id,
  });
}

// Hook para criar contato
export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: contactsService.create,
    onSuccess: (newContact) => {
      // Invalidar cache dos contatos
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', 'client', newContact.clientId] });
    },
  });
}

// Hook para atualizar contato
export function useUpdateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateContactRequest> }) => 
      contactsService.update(id, data),
    onSuccess: (updatedContact) => {
      // Invalidar cache para atualizar a lista e o item específico
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', 'client', updatedContact.clientId] });
      queryClient.invalidateQueries({ queryKey: ['contacts', updatedContact.id] });
    },
  });
}

// Hook para definir contato como principal
export function useSetPrimaryContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: contactsService.setPrimary,
    onSuccess: (updatedContact) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', 'client', updatedContact.clientId] });
      queryClient.invalidateQueries({ queryKey: ['contacts', updatedContact.id] });
    },
  });
}

// Hook para ativar/desativar contato
export function useToggleActiveContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: contactsService.toggleActive,
    onSuccess: (updatedContact) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', 'client', updatedContact.clientId] });
      queryClient.invalidateQueries({ queryKey: ['contacts', updatedContact.id] });
    },
  });
}

// Hook para excluir contato
export function useDeleteContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: contactsService.delete,
    onSuccess: (_, deletedId) => {
      // Invalidar cache
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      // Remover o contato específico do cache
      queryClient.removeQueries({ queryKey: ['contacts', deletedId] });
    },
  });
}
