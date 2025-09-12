import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

interface SendInviteRequest {
  email: string;
  name: string;
  message?: string;
}

interface SendInviteResponse {
  message: string;
  inviteToken: string;
}

interface AcceptInviteRequest {
  token: string;
  password: string;
}

interface AcceptInviteResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
  };
}

interface ClientUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt?: string;
  createdAt: string;
}

export const useSendClientInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, inviteData }: { clientId: string; inviteData: SendInviteRequest }) => {
      const response = await api.post<SendInviteResponse>(
        `/clients/${clientId}/invite`,
        inviteData
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas ao cliente
      queryClient.invalidateQueries({ queryKey: ['clients', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
};

export const useAcceptInvite = () => {
  return useMutation({
    mutationFn: async (acceptData: AcceptInviteRequest) => {
      const response = await api.post<AcceptInviteResponse>(
        '/clients/accept-invite',
        acceptData
      );
      return response.data;
    },
  });
};

export const useClientUsers = (clientId: string) => {
  return useQuery({
    queryKey: ['clients', clientId, 'users'],
    queryFn: async (): Promise<ClientUser[]> => {
      const response = await api.get<ClientUser[]>(`/clients/${clientId}/users`);
      return response.data;
    },
    enabled: !!clientId,
  });
};
