// Polyfill para crypto no Node.js 18+
// Este arquivo deve ser importado antes de qualquer outro módulo

import { webcrypto } from 'node:crypto';

// Polyfill para crypto global
if (typeof globalThis !== 'undefined') {
  if (!globalThis.crypto) {
    globalThis.crypto = webcrypto as any;
  }
  
  // Garantir que randomUUID está disponível
  if (!globalThis.crypto.randomUUID) {
    globalThis.crypto.randomUUID = () => webcrypto.randomUUID();
  }
}

// Polyfill para global (Node.js)
if (typeof global !== 'undefined') {
  if (!(global as any).crypto) {
    (global as any).crypto = webcrypto;
  }
  
  if (!(global as any).crypto.randomUUID) {
    (global as any).crypto.randomUUID = () => webcrypto.randomUUID();
  }
}

// Polyfill adicional para window (caso necessário)
if (typeof (globalThis as any).window !== 'undefined' && !(globalThis as any).window.crypto) {
  (globalThis as any).window.crypto = webcrypto;
}

export {};
