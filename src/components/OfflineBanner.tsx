"use client";

import { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { offlineQueue } from '@/lib/offlineQueue';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    const update = () => setQueueCount(offlineQueue.getAll().length);
    update();
    window.addEventListener('offline-queue-changed', update);
    return () => window.removeEventListener('offline-queue-changed', update);
  }, []);

  // Auto-sincronizar cuando vuelve la conexión
  useEffect(() => {
    if (isOnline && queueCount > 0 && !syncing) {
      const sync = async () => {
        setSyncing(true);
        const { exitosos, fallidos } = await offlineQueue.syncAll();
        setSyncing(false);
        if (exitosos > 0) {
          setJustSynced(true);
          setTimeout(() => setJustSynced(false), 3000);
        }
      };
      sync();
    }
  }, [isOnline, queueCount, syncing]);

  if (justSynced) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-emerald-500 text-white py-2 px-4 text-center text-sm font-medium shadow-md animate-[slideDown_0.3s_ease-out]">
        <Wifi className="w-4 h-4 inline mr-2" />
        Conexión restaurada. {queueCount === 0 ? '✅ Todo sincronizado' : 'Sincronizando...'}
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white py-2 px-4 text-center text-sm font-medium shadow-md">
        <WifiOff className="w-4 h-4 inline mr-2" />
        Sin conexión - trabajando en modo local
        {queueCount > 0 && <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">{queueCount} pendiente(s)</span>}
      </div>
    );
  }

  if (queueCount > 0 && syncing) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-blue-500 text-white py-2 px-4 text-center text-sm font-medium shadow-md">
        <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
        Sincronizando {queueCount} operación(es)...
      </div>
    );
  }

  return null;
}
