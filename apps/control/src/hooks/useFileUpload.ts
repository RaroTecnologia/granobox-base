import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

interface UploadPhotosResponse {
  message: string;
  photos: string[];
  totalPhotos: number;
}

interface UploadInvoiceResponse {
  message: string;
  invoiceUrl: string;
}

export const useUploadEquipmentPhotos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ equipmentId, photos }: { equipmentId: string; photos: File[] }) => {
      const formData = new FormData();
      photos.forEach((photo) => {
        formData.append('photos', photo);
      });

      const response = await api.post<UploadPhotosResponse>(
        `/equipment/${equipmentId}/photos`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas ao equipamento
      queryClient.invalidateQueries({ queryKey: ['equipment', variables.equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
};

export const useUploadEquipmentInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ equipmentId, invoice }: { equipmentId: string; invoice: File }) => {
      const formData = new FormData();
      formData.append('invoice', invoice);

      const response = await api.post<UploadInvoiceResponse>(
        `/equipment/${equipmentId}/invoice`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas ao equipamento
      queryClient.invalidateQueries({ queryKey: ['equipment', variables.equipmentId] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
    },
  });
};
