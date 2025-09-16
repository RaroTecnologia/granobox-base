import { api } from './api'

export interface GranoboxPrinter {
  id: string
  tagmentId: string
  location: string
  usage: string[]
  isActive: boolean
  notes?: string
  clientId: string
  createdAt: string
  updatedAt: string
}

export interface CreatePrinterRequest {
  tagmentId: string
  location: string
  usage?: string[]
  isActive?: boolean
  notes?: string
  clientId: string
  createdById: string
}

export interface UpdatePrinterRequest {
  location?: string
  usage?: string[]
  isActive?: boolean
  notes?: string
}

class PrintersService {
  async getPrinters(clientId?: string): Promise<GranoboxPrinter[]> {
    try {
      const params = clientId ? { clientId } : {}
      const response = await api.get<GranoboxPrinter[]>('/printers', { params })
      return response.data
    } catch (error) {
      console.error('Erro ao buscar impressoras:', error)
      throw error
    }
  }

  async getPrinter(id: string): Promise<GranoboxPrinter> {
    try {
      const response = await api.get<GranoboxPrinter>(`/printers/${id}`)
      return response.data
    } catch (error) {
      console.error('Erro ao buscar impressora:', error)
      throw error
    }
  }

  async createPrinter(data: CreatePrinterRequest): Promise<GranoboxPrinter> {
    try {
      const response = await api.post<GranoboxPrinter>('/printers', data)
      return response.data
    } catch (error) {
      console.error('Erro ao criar impressora:', error)
      throw error
    }
  }

  async updatePrinter(id: string, data: UpdatePrinterRequest): Promise<GranoboxPrinter> {
    try {
      const response = await api.patch<GranoboxPrinter>(`/printers/${id}`, data)
      return response.data
    } catch (error) {
      console.error('Erro ao atualizar impressora:', error)
      throw error
    }
  }

  async deletePrinter(id: string): Promise<void> {
    try {
      await api.delete(`/printers/${id}`)
    } catch (error) {
      console.error('Erro ao deletar impressora:', error)
      throw error
    }
  }

  async syncWithTagment(clientId: string, createdBy: string): Promise<GranoboxPrinter[]> {
    try {
      const response = await api.get<GranoboxPrinter[]>('/printers/sync-tagment', {
        params: { clientId, createdBy }
      })
      return response.data
    } catch (error) {
      console.error('Erro ao sincronizar com Tagment:', error)
      throw error
    }
  }

  async getPrintersByUsage(usage: string, clientId: string): Promise<GranoboxPrinter[]> {
    try {
      const response = await api.get<GranoboxPrinter[]>('/printers/by-usage', {
        params: { usage, clientId }
      })
      return response.data
    } catch (error) {
      console.error('Erro ao buscar impressoras por uso:', error)
      throw error
    }
  }
}

export const printersService = new PrintersService()
