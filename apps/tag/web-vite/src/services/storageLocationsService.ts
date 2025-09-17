import { api } from './api'

export interface StorageLocation {
  id: string
  nome: string
  tipo: 'geladeira' | 'freezer' | 'prateleira' | 'estoque' | 'balcao' | 'outro'
  descricao?: string
  temperatura?: number
  capacidade?: number
  setor?: string
  ativo: boolean
  clientId: string
  createdAt: string
  updatedAt: string
}

export interface CreateStorageLocationDto {
  nome: string
  tipo: 'geladeira' | 'freezer' | 'prateleira' | 'estoque' | 'balcao' | 'outro'
  descricao?: string
  temperatura?: number
  capacidade?: number
  setor?: string
  ativo?: boolean
}

export interface UpdateStorageLocationDto extends Partial<CreateStorageLocationDto> {}

class StorageLocationsService {
  private baseUrl = '/storage-locations'

  async getAll(activeOnly = false): Promise<StorageLocation[]> {
    const params = activeOnly ? '?active=true' : ''
    const response = await api.get<StorageLocation[]>(`${this.baseUrl}${params}`)
    return response.data
  }

  async getById(id: string): Promise<StorageLocation> {
    const response = await api.get<StorageLocation>(`${this.baseUrl}/${id}`)
    return response.data
  }

  async create(data: CreateStorageLocationDto): Promise<StorageLocation> {
    const response = await api.post<StorageLocation>(this.baseUrl, data)
    return response.data
  }

  async update(id: string, data: UpdateStorageLocationDto): Promise<StorageLocation> {
    const response = await api.patch<StorageLocation>(`${this.baseUrl}/${id}`, data)
    return response.data
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`)
  }

  async toggleStatus(id: string): Promise<StorageLocation> {
    const response = await api.patch<StorageLocation>(`${this.baseUrl}/${id}/toggle-status`)
    return response.data
  }

  async getByType(type: string): Promise<StorageLocation[]> {
    const response = await api.get<StorageLocation[]>(`${this.baseUrl}/by-type/${type}`)
    return response.data
  }

  async getBySetor(setor: string): Promise<StorageLocation[]> {
    const response = await api.get<StorageLocation[]>(`${this.baseUrl}/by-setor/${setor}`)
    return response.data
  }

  // Métodos utilitários
  getTipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      geladeira: 'Geladeira',
      freezer: 'Freezer',
      prateleira: 'Prateleira',
      estoque: 'Estoque',
      balcao: 'Balcão',
      outro: 'Outro'
    }
    return labels[tipo] || tipo
  }

  getTipoDescription(tipo: string): string {
    const descriptions: Record<string, string> = {
      geladeira: 'Refrigeração (0°C a 8°C)',
      freezer: 'Congelamento (-18°C ou menos)',
      prateleira: 'Armazenamento ambiente',
      estoque: 'Área de estoque geral',
      balcao: 'Área de exposição/venda',
      outro: 'Outro tipo de local'
    }
    return descriptions[tipo] || 'Tipo personalizado'
  }

  getTemperaturaColor(temperatura?: number): string {
    if (!temperatura) return 'text-gray-500'
    if (temperatura <= -10) return 'text-cyan-500'
    if (temperatura <= 8) return 'text-blue-500'
    return 'text-orange-500'
  }
}

export const storageLocationsService = new StorageLocationsService()

