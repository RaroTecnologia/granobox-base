import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Camera, FileText, X, Upload } from '@phosphor-icons/react';
import { useUploadEquipmentPhotos, useUploadEquipmentInvoice } from '../../hooks/useFileUpload';
import type { CreateEquipmentRequest, ApiEquipment } from '../../types/api';

interface InventoryEquipmentFormData {
  name: string;
  type: 'printer' | 'scale' | 'scanner' | 'tablet' | 'computer' | 'other';
  brand: string;
  model: string;
  serialNumber: string;
  patrimonyNumber: string;
  condition: 'new' | 'good' | 'fair' | 'poor' | 'damaged';
  purchaseValue: string;
  purchaseDate: string;
  location: string;
  specifications: string;
  accessories: string;
  notes: string;
  photos: File[];
  invoice: File | null;
}

interface InventoryEquipmentFormProps {
  initialData?: Partial<ApiEquipment>;
  onSubmit: (data: Omit<CreateEquipmentRequest, 'clientId' | 'loanStartDate' | 'status'>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitText?: string;
  equipmentId?: string; // Para uploads após criação
}

const equipmentTypes = [
  { value: 'printer', label: 'Impressora' },
  { value: 'scale', label: 'Balança' },
  { value: 'scanner', label: 'Scanner' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'computer', label: 'Computador' },
  { value: 'other', label: 'Outro' },
] as const;

const equipmentConditions = [
  { value: 'new', label: 'Novo' },
  { value: 'good', label: 'Bom' },
  { value: 'fair', label: 'Regular' },
  { value: 'poor', label: 'Ruim' },
  { value: 'damaged', label: 'Danificado' },
] as const;

export function InventoryEquipmentForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitText = 'Salvar no Inventário',
  equipmentId
}: InventoryEquipmentFormProps) {
  
  const uploadPhotosMutation = useUploadEquipmentPhotos();
  const uploadInvoiceMutation = useUploadEquipmentInvoice();
  
  const [formData, setFormData] = useState<InventoryEquipmentFormData>({
    name: '',
    type: 'printer',
    brand: '',
    model: '',
    serialNumber: '',
    patrimonyNumber: '',
    condition: 'new',
    purchaseValue: '',
    purchaseDate: '',
    location: '',
    specifications: '',
    accessories: '',
    notes: '',
    photos: [],
    invoice: null,
  });

  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Atualizar formData quando initialData mudar
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        name: initialData.name || '',
        type: initialData.type || 'printer',
        brand: initialData.brand || '',
        model: initialData.model || '',
        serialNumber: initialData.serialNumber || '',
        patrimonyNumber: initialData.patrimonyNumber || '',
        condition: initialData.condition || 'new',
        purchaseValue: initialData.purchaseValue ? initialData.purchaseValue.toFixed(2).replace('.', ',') : '',
        purchaseDate: initialData.purchaseDate ? initialData.purchaseDate.split('T')[0] : '',
        location: initialData.location || '',
        specifications: initialData.specifications || '',
        accessories: initialData.accessories || '',
        notes: initialData.notes || '',
      }));
    }
  }, [initialData]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Função para formatar valor monetário
  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Função para validar o formulário
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Marca é obrigatória';
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Modelo é obrigatório';
    }

    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = 'Número de série é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para lidar com mudanças nos campos
  const handleChange = (field: keyof InventoryEquipmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Função para lidar com mudanças no valor monetário
  const handleCurrencyChange = (value: string) => {
    const formatted = formatCurrency(value);
    handleChange('purchaseValue', formatted);
  };

  // Função para lidar com upload de fotos
  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });
    
    setFormData(prev => ({ 
      ...prev, 
      photos: [...prev.photos, ...validFiles].slice(0, 5) // Máximo 5 fotos
    }));
  };

  // Função para remover foto
  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  // Função para lidar com upload de nota fiscal
  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isValidType = file.type === 'application/pdf' || file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      
      if (isValidType && isValidSize) {
        setFormData(prev => ({ ...prev, invoice: file }));
      } else {
        alert('Arquivo deve ser PDF ou imagem e ter no máximo 10MB');
      }
    }
  };

  // Função para remover nota fiscal
  const removeInvoice = () => {
    setFormData(prev => ({ ...prev, invoice: null }));
  };

  // Função para lidar com drag & drop de fotos
  const handlePhotoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      const validFiles = imageFiles.filter(file => {
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
        return isValidSize;
      });
      
      setFormData(prev => ({ 
        ...prev, 
        photos: [...prev.photos, ...validFiles].slice(0, 5) // Máximo 5 fotos
      }));
    }
  };

  const handlePhotoDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Função para fazer upload dos arquivos
  const handleFileUploads = async (equipmentId: string) => {
    try {
      // Upload das fotos
      if (formData.photos.length > 0) {
        await uploadPhotosMutation.mutateAsync({
          equipmentId,
          photos: formData.photos,
        });
      }

      // Upload da nota fiscal
      if (formData.invoice) {
        await uploadInvoiceMutation.mutateAsync({
          equipmentId,
          invoice: formData.invoice,
        });
      }
    } catch (error) {
      console.error('Erro ao fazer upload dos arquivos:', error);
      alert('Erro ao fazer upload dos arquivos. Tente novamente.');
    }
  };

  // Função para submeter o formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Converter valor monetário para número
    const parseCurrency = (value: string): number | undefined => {
      if (!value) return undefined;
      const numbers = value.replace(/\D/g, '');
      return parseFloat(numbers) / 100;
    };

    const submitData = {
      name: formData.name.trim(),
      type: formData.type,
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      serialNumber: formData.serialNumber.trim(),
      patrimonyNumber: formData.patrimonyNumber.trim() || undefined,
      condition: formData.condition,
      purchaseValue: parseCurrency(formData.purchaseValue),
      purchaseDate: formData.purchaseDate || undefined,
      location: formData.location.trim() || undefined,
      specifications: formData.specifications.trim() || undefined,
      accessories: formData.accessories.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    };

    // Submeter dados básicos primeiro
    onSubmit(submitData);

    // Se temos um equipmentId (modo edição) e arquivos para upload, fazer upload
    if (equipmentId) {
      handleFileUploads(equipmentId);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Informações Básicas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome/Descrição *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: Impressora Térmica Zebra"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Equipamento *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value as InventoryEquipmentFormData['type'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {equipmentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marca *
            </label>
            <Input
              value={formData.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
              placeholder="Ex: Zebra, Epson, HP"
              className={errors.brand ? 'border-red-500' : ''}
            />
            {errors.brand && (
              <p className="text-red-500 text-sm mt-1">{errors.brand}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modelo *
            </label>
            <Input
              value={formData.model}
              onChange={(e) => handleChange('model', e.target.value)}
              placeholder="Ex: ZD220, L3150"
              className={errors.model ? 'border-red-500' : ''}
            />
            {errors.model && (
              <p className="text-red-500 text-sm mt-1">{errors.model}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Série *
            </label>
            <Input
              value={formData.serialNumber}
              onChange={(e) => handleChange('serialNumber', e.target.value.toUpperCase())}
              placeholder="Ex: ZBR123456789"
              className={errors.serialNumber ? 'border-red-500' : ''}
            />
            {errors.serialNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.serialNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número do Patrimônio
            </label>
            <Input
              value={formData.patrimonyNumber}
              onChange={(e) => handleChange('patrimonyNumber', e.target.value.toUpperCase())}
              placeholder="Ex: PAT001234"
            />
          </div>
        </div>
      </div>

      {/* Condição */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Estado do Equipamento</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Condição
          </label>
          <select
            value={formData.condition}
            onChange={(e) => handleChange('condition', e.target.value as InventoryEquipmentFormData['condition'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {equipmentConditions.map((condition) => (
              <option key={condition.value} value={condition.value}>
                {condition.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Informações Financeiras */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Informações de Compra</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor de Compra
            </label>
            <Input
              value={formData.purchaseValue}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Compra
            </label>
            <Input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => handleChange('purchaseDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Localização */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Localização no Estoque
        </label>
        <Input
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="Ex: Almoxarifado - Prateleira A3"
        />
      </div>

      {/* Especificações */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Especificações Técnicas
        </label>
        <textarea
          value={formData.specifications}
          onChange={(e) => handleChange('specifications', e.target.value)}
          placeholder="Descreva as especificações técnicas do equipamento"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Acessórios */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Acessórios Incluídos
        </label>
        <textarea
          value={formData.accessories}
          onChange={(e) => handleChange('accessories', e.target.value)}
          placeholder="Liste os acessórios incluídos com o equipamento"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Observações */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observações
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Observações adicionais sobre o equipamento"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Upload de Fotos */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Fotos do Equipamento</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adicionar Fotos (máximo 5 fotos, 5MB cada)
          </label>
          
          {/* Área de upload */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors"
            onDrop={handlePhotoDrop}
            onDragOver={handlePhotoDragOver}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotosChange}
              className="hidden"
              id="photos-upload"
              disabled={formData.photos.length >= 5}
            />
            <label 
              htmlFor="photos-upload" 
              className={`cursor-pointer ${formData.photos.length >= 5 ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <Camera className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                {formData.photos.length >= 5 
                  ? 'Máximo de 5 fotos atingido' 
                  : 'Clique para adicionar fotos ou arraste aqui'
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, JPEG até 5MB cada
              </p>
            </label>
          </div>

          {/* Preview das fotos */}
          {formData.photos.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Fotos selecionadas ({formData.photos.length}/5):
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setPreviewPhoto(URL.createObjectURL(photo))}
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {photo.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload de Nota Fiscal */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Nota Fiscal de Compra</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Anexar Nota Fiscal (PDF ou imagem, máximo 10MB)
          </label>
          
          {!formData.invoice ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleInvoiceChange}
                className="hidden"
                id="invoice-upload"
              />
              <label htmlFor="invoice-upload" className="cursor-pointer">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Clique para adicionar a nota fiscal
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF ou imagem até 10MB
                </p>
              </label>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {formData.invoice.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(formData.invoice.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeInvoice}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : submitText}
        </Button>
      </div>

      {/* Modal de Preview de Foto */}
      {previewPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-4xl p-4">
            <img
              src={previewPhoto}
              alt="Preview"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-2 right-2 bg-white text-gray-800 rounded-full p-2 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
