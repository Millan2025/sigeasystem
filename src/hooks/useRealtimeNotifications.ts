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

  // Cargar notificaciones iniciales
  const cargarNotificaciones = useCallback(async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!error && data) {
        setNotificaciones(data as Notificacion[]);
        setNoLeidas(data.filter(n => !n.leida).length);
      }
    } catch (e) {
      console.error('Error cargando notificaciones:', e);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Suscribirse a notificaciones en tiempo real
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
          const nueva = payload.new as Notificacion;
          setNotificaciones(prev => [nueva, ...prev].slice(0, 50));
          if (!nueva.leida) {
            setNoLeidas(prev => prev + 1);
          }
          // Disparar evento custom para que otros componentes muestren toast
          window.dispatchEvent(new CustomEvent('nueva-notificacion', { detail: nueva }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, cargarNotificaciones]);

  // Marcar como leída
  const marcarLeida = async (id: string) => {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', id);
    
    if (!error) {
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
      setNoLeidas(prev => Math.max(0, prev - 1));
    }
  };

  // Marcar todas como leídas
  const marcarTodasLeidas = async () => {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('leida', false);
    
    if (!error) {
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      setNoLeidas(0);
    }
  };

  return { notificaciones, noLeidas, loading, marcarLeida, marcarTodasLeidas, cargarNotificaciones };
}
