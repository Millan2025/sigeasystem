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

  const cargarNotificaciones = useCallback(async () => {
    if (!tenantId) {
      console.log('⚠️ No hay tenantId, skip carga');
      return;
    }
    try {
      console.log('🔔 Cargando notificaciones para tenant:', tenantId);
      
      // Verificar autenticación
      const { data: authData } = await supabase.auth.getUser();
      console.log('🔐 Usuario autenticado:', authData?.user?.email || 'NO AUTENTICADO');

      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('❌ Error cargando notificaciones:', error);
      } else {
        console.log('✅ Notificaciones cargadas:', data?.length || 0, data);
        setNotificaciones((data || []) as Notificacion[]);
        setNoLeidas((data || []).filter(n => !n.leida).length);
      }
    } catch (e) {
      console.error('Error cargando notificaciones:', e);
    } finally {
      setLoading(false);
    }
  }, [tenantId, supabase]);

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
          console.log('🔔 Nueva notificación recibida:', payload.new);
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

  const marcarLeida = async (id: string) => {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (!error) {
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
      setNoLeidas(prev => Math.max(0, prev - 1));
    } else {
      console.error('❌ Error marcando leída:', error);
    }
  };

  const marcarTodasLeidas = async () => {
    const { error } = await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('tenant_id', tenantId)
      .eq('leida', false);

    if (!error) {
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      setNoLeidas(0);
    } else {
      console.error('❌ Error marcando todas:', error);
    }
  };

  return { notificaciones, noLeidas, loading, marcarLeida, marcarTodasLeidas, cargarNotificaciones };
}
