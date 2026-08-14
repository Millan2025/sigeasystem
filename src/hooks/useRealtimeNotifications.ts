import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  icono: string;
  color: string;
  leida: boolean;
  datos: any;
  created_at: string;
}

export function useRealtimeNotifications(tenantId: string | null) {
  const supabase = createClient();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [loading, setLoading] = useState(true);

  // Cargar via API route (SERVICE_ROLE, evita problemas de RLS)
  const cargarNotificaciones = useCallback(async () => {
    if (!tenantId) return;
    try {
      console.log('🔔 Cargando notificaciones via API para tenant:', tenantId);
      const res = await fetch(`/api/notificaciones?tenant=${tenantId}`);
      const json = await res.json();

      if (json.success && json.data) {
        console.log('✅ Notificaciones cargadas via API:', json.data.length);
        setNotificaciones(json.data);
        setNoLeidas(json.data.filter((n: any) => !n.leida).length);
      } else {
        console.error('❌ Error en API:', json.error);
      }
    } catch (e) {
      console.error('Error cargando notificaciones:', e);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Suscripción realtime (sigue usando cliente con cookies, pero solo para nuevos eventos)
  useEffect(() => {
    if (!tenantId) return;
    cargarNotificaciones();

    const channel = supabase
      .channel(`notificaciones-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('🔔 Nueva notificación en tiempo real:', payload.new);
          const nueva = payload.new as Notificacion;
          setNotificaciones(prev => [nueva, ...prev].slice(0, 100));
          if (!nueva.leida) {
            setNoLeidas(prev => prev + 1);
          }
          window.dispatchEvent(new CustomEvent('nueva-notificacion', { detail: nueva }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, cargarNotificaciones, supabase]);

  // Marcar como leída via API
  const marcarLeida = async (id: string) => {
    try {
      const res = await fetch('/api/notificaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, tenant_id: tenantId, leida: true }),
      });
      const json = await res.json();
      if (json.success) {
        setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
        setNoLeidas(prev => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error('Error marcando leída:', e);
    }
  };

  // Marcar todas como leídas via API
  const marcarTodasLeidas = async () => {
    try {
      const res = await fetch('/api/notificaciones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, marcar_todas: true }),
      });
      const json = await res.json();
      if (json.success) {
        setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
        setNoLeidas(0);
      }
    } catch (e) {
      console.error('Error marcando todas:', e);
    }
  };

  return { notificaciones, noLeidas, loading, marcarLeida, marcarTodasLeidas, cargarNotificaciones };
}
