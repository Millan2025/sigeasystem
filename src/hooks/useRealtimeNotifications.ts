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

  // Obtener fecha de inicio del día actual en zona horaria Colombia
  const getInicioHoy = () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return hoy.toISOString();
  };

  // Cargar solo notificaciones del día actual
  const cargarNotificaciones = useCallback(async () => {
    if (!tenantId) return;
    try {
      const inicioHoy = getInicioHoy();
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('created_at', inicioHoy)
        .order('created_at', { ascending: false })
        .limit(100);

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
          // Solo agregar si es del día actual
          const inicioHoy = new Date(getInicioHoy());
          const fechaNotif = new Date(nueva.created_at);
          if (fechaNotif >= inicioHoy) {
            setNotificaciones(prev => [nueva, ...prev].slice(0, 100));
            if (!nueva.leida) {
              setNoLeidas(prev => prev + 1);
            }
            window.dispatchEvent(new CustomEvent('nueva-notificacion', { detail: nueva }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, cargarNotificaciones]);

  // Marcar una como leída
  const marcarLeida = async (id: string) => {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (!error) {
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
      setNoLeidas(prev => Math.max(0, prev - 1));
    }
  };

  // Marcar todas como leídas (SOLO del tenant actual)
  const marcarTodasLeidas = async () => {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('tenant_id', tenantId)
      .eq('leida', false);

    if (!error) {
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      setNoLeidas(0);
    }
  };

  return { notificaciones, noLeidas, loading, marcarLeida, marcarTodasLeidas, cargarNotificaciones };
}
