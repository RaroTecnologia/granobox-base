declare global {
  interface Window {
    electronAPI?: {
      // Descoberta e conexão de impressoras
      discoverPrinters: () => Promise<Printer[]>;
      connectPrinter: (config: PrinterConfig) => Promise<ConnectionResult>;
      
      // Impressão
      printReceipt: (data: ReceiptData) => Promise<PrintResult>;
      printLabel: (data: LabelData) => Promise<PrintResult>;
      
      // Configurações
      getStoredConfig: (key: string) => Promise<any>;
      setStoredConfig: (key: string, value: any) => Promise<boolean>;
      
      // Sistema de arquivos
      selectFile: () => Promise<string | null>;
      
      // Navegação
      onNavigateTo: (callback: (event: any, path: string) => void) => void;
      
      // Utilitários
      isElectron: boolean;
      platform: string;
    };
  }
}

export interface Printer {
  id: string;
  name: string;
  type: 'USB' | 'Bluetooth' | 'Network';
  interface: string;
  connected: boolean;
}

export interface PrinterConfig {
  id: string;
  type: 'EPSON' | 'STAR' | 'CITIZEN' | 'BIXOLON';
  interface: string;
  width?: number;
  options?: {
    timeout?: number;
  };
}

export interface ConnectionResult {
  success: boolean;
  message: string;
}

export interface PrintResult {
  success: boolean;
  message: string;
}

export interface ReceiptData {
  printerId: string;
  title?: string;
  date?: string;
  items?: Array<{
    name: string;
    quantity: string;
    unit: string;
  }>;
  total?: string;
}

export interface LabelData {
  printerId: string;
  title?: string;
  productName: string;
  quantity: string;
  unit: string;
  date?: string;
  barcode?: string;
} 