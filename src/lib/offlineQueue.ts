// Cola de operaciones offline persistente en localStorage
export interface OfflineOperation {
  id: string;
  timestamp: number;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body: any;
  descripcion: string;
  tenantId: string;
}

const QUEUE_KEY = 'sigea_offline_queue_v1';

export const offlineQueue = {
  getAll(): OfflineOperation[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  add(op: Omit<OfflineOperation, 'id' | 'timestamp'>): void {
    if (typeof window === 'undefined') return;
    const queue = this.getAll();
    queue.push({
      ...op,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('offline-queue-changed'));
  },

  remove(id: string): void {
    if (typeof window === 'undefined') return;
    const queue = this.getAll().filter(op => op.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('offline-queue-changed'));
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(QUEUE_KEY);
    window.dispatchEvent(new CustomEvent('offline-queue-changed'));
  },

  async syncAll(onProgress?: (msg: string) => void): Promise<{ exitosos: number; fallidos: number }> {
    const queue = this.getAll();
    let exitosos = 0, fallidos = 0;
    for (const op of queue) {
      try {
        onProgress?.(`Sincronizando: ${op.descripcion}...`);
        const res = await fetch(op.url, {
          method: op.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(op.body),
        });
        if (res.ok) {
          this.remove(op.id);
          exitosos++;
        } else {
          fallidos++;
          console.error(`Sync fallido: ${op.descripcion}`, await res.text());
        }
      } catch (e) {
        fallidos++;
        console.error(`Error de red sincronizando ${op.descripcion}:`, e);
        break; // Si falla la red, parar y reintentar después
      }
    }
    return { exitosos, fallidos };
  },
};

// Hook para usar en componentes
export function useOfflineQueue() {
  if (typeof window === 'undefined') return { count: 0, operations: [] };
  const [ops, setOps] = useState<OfflineOperation[]>(offlineQueue.getAll());
  
  useEffect(() => {
    const handler = () => setOps(offlineQueue.getAll());
    window.addEventListener('offline-queue-changed', handler);
    return () => window.removeEventListener('offline-queue-changed', handler);
  }, []);
  
  return { count: ops.length, operations: ops };
}

import { useState, useEffect } from 'react';
