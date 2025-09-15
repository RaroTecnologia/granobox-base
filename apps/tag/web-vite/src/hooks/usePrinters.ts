import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { printerService, Printer, CreatePrinterDto, UpdatePrinterDto } from '../services/printerService';

export function usePrinters() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [currentPrinter, setCurrentPrinter] = useState<Printer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: any, defaultMsg: string) => {
    const msg = err.response?.data?.message || err.message || defaultMsg;
    toast.error(msg);
    setError(msg);
  }, []);

  // Carregar todas as impressoras
  const loadPrinters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await printerService.getAll();
      setPrinters(data);
    } catch (err) {
      handleError(err, 'Erro ao carregar impressoras.');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Carregar impressora por ID
  const loadPrinter = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await printerService.getById(id);
      setCurrentPrinter(data);
      return data;
    } catch (err) {
      handleError(err, 'Erro ao carregar impressora.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Criar nova impressora
  const createPrinter = useCallback(async (data: CreatePrinterDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const newPrinter = await printerService.create(data);
      setPrinters(prev => [newPrinter, ...prev]);
      toast.success('Impressora criada com sucesso!');
      return newPrinter;
    } catch (err) {
      handleError(err, 'Erro ao criar impressora.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Atualizar impressora
  const updatePrinter = useCallback(async (id: string, data: UpdatePrinterDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedPrinter = await printerService.update(id, data);
      setPrinters(prev => prev.map(p => p.id === id ? updatedPrinter : p));
      setCurrentPrinter(updatedPrinter);
      toast.success('Impressora atualizada com sucesso!');
      return updatedPrinter;
    } catch (err) {
      handleError(err, 'Erro ao atualizar impressora.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Remover impressora
  const deletePrinter = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await printerService.delete(id);
      setPrinters(prev => prev.filter(p => p.id !== id));
      if (currentPrinter?.id === id) {
        setCurrentPrinter(null);
      }
      toast.success('Impressora removida com sucesso!');
    } catch (err) {
      handleError(err, 'Erro ao remover impressora.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPrinter, handleError]);

  // Testar conexão
  const testConnection = useCallback(async (id: string, testMessage?: string) => {
    setIsLoading(true);
    setError(null);
    toast.loading('Testando conexão...');
    try {
      const result = await printerService.testConnection(id, testMessage);
      if (result.success) {
        toast.success(result.message);
        // Recarregar dados diretamente sem usar callbacks
        const updatedPrinter = await printerService.getById(id);
        setCurrentPrinter(updatedPrinter);
        const allPrinters = await printerService.getAll();
        setPrinters(allPrinters);
      } else {
        toast.error(result.message);
      }
      return result;
    } catch (err) {
      handleError(err, 'Erro ao testar conexão.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  return {
    printers,
    currentPrinter,
    isLoading,
    error,
    loadPrinters,
    loadPrinter,
    createPrinter,
    updatePrinter,
    deletePrinter,
    testConnection,
  };
}