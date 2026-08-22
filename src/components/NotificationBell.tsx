"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, X, ExternalLink } from 'lucide-react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

// Reproducir sonido de notificación
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('Audio no disponible');
  }
};

// Vibración en móvil
const vibrateDevice = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200]);
  }
};

interface Props {
  tenantId: string | null;
  negocioSlug?: string;
}

const iconos: Record<string, string> = {
  pedido: 'ðŸ›µ', stock: 'ðŸ“¦', orden: 'ðŸ­', pago: 'ðŸ’°',
  cliente: 'ðŸ‘¤', alerta: 'âš ï¸', exito: 'âœ…', default: 'ðŸ””'
};

const colores: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700 border-blue-300',
  red: 'bg-red-100 text-red-700 border-red-300',
  green: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  amber: 'bg-amber-100 text-amber-700 border-amber-300',
  purple: 'bg-purple-100 text-purple-700 border-purple-300',
};

const moduloPorTipo: Record<string, string> = {
  pedido: 'pedidos',
  stock: 'inventario',
  orden: 'produccion',
  pago: 'finanzas',
  cliente: 'tienda',
  venta: 'reportes',
  alerta: 'inventario',
};

export default function NotificationBell({ tenantId, negocioSlug }: Props) {
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = useRealtimeNotifications(tenantId);
  const [abierto, setAbierto] = useState(false);
  const [toast, setToast] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: any) => {
      const n = e.detail;
      setToast(n);
      
      // Reproducir sonido y vibración
      playNotificationSound();
      vibrateDevice();
      
      // Mostrar notificación del navegador si tiene permisos
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(n.titulo, {
          body: n.mensaje,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          requireInteraction: false,
        });
      }
      
      setTimeout(() => setToast(null), 5000);
    };
    window.addEventListener('nueva-notificacion', handler);
    return () => window.removeEventListener('nueva-notificacion', handler);
  }, []);

  // Solicitar permisos de notificación al montar
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (!tenantId) return null;

  const verNotificacion = (n: any) => {
    marcarLeida(n.id);
    const modulo = moduloPorTipo[n.tipo] || moduloPorTipo[n.icono] || 'finanzas';
    const slug = negocioSlug || 'panaderia';
    const url = `/${slug}/${modulo}?tenant=${tenantId}`;
    setAbierto(false);
    router.push(url);
  };

  return (
    <>
      {toast && (
        <div className={`fixed top-20 right-4 z-[100] ${colores[toast.color] || colores.blue} border-l-4 px-4 py-3 rounded-xl shadow-2xl max-w-sm animate-[slideIn_0.3s_ease-out]`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{iconos[toast.icono] || iconos.default}</span>
            <div className="flex-1">
              <p className="font-bold text-sm">{toast.titulo}</p>
              <p className="text-xs mt-1 opacity-90">{toast.mensaje}</p>
            </div>
            <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => setAbierto(!abierto)}
          className="relative p-2 hover:bg-stone-100 rounded-xl transition"
          title="Notificaciones"
        >
          <Bell className="w-6 h-6 text-stone-700" />
          {noLeidas > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1">
              {noLeidas > 99 ? '99+' : noLeidas}
            </span>
          )}
        </button>

        {abierto && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
            <div className="fixed top-16 z-50 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 max-h-[70vh] bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-stone-800">Notificaciones</h3>
                  <p className="text-xs text-stone-500">Hoy</p>
                </div>
                {noLeidas > 0 && (
                  <button
                    onClick={marcarTodasLeidas}
                    className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="w-3 h-3" /> Marcar todas
                  </button>
                )}
              </div>

              <div className="overflow-y-auto flex-1">
                {notificaciones.length === 0 ? (
                  <div className="p-8 text-center text-stone-500 text-sm">
                    <Bell className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                    <p>No hay notificaciones hoy</p>
                  </div>
                ) : (
                  notificaciones.map(n => (
                    <div
                      key={n.id}
                      className={`p-3 border-b border-stone-100 transition ${!n.leida ? 'bg-blue-50/50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl shrink-0">{iconos[n.icono] || iconos.default}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm ${!n.leida ? 'font-bold' : 'font-medium'} text-stone-800 truncate`}>
                              {n.titulo}
                            </p>
                            {!n.leida && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                          </div>
                          <p className="text-xs text-stone-600 mt-1 line-clamp-2">{n.mensaje}</p>
                          <div className="flex items-center justify-between mt-2 gap-2">
                            <p className="text-xs text-stone-400">
                              {new Date(n.created_at).toLocaleString('es-CO', {
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                            <div className="flex items-center gap-2">
                              {!n.leida && (
                                <button
                                  onClick={() => marcarLeida(n.id)}
                                  className="text-xs text-stone-500 hover:text-stone-700"
                                  title="Marcar como leÃ­da"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                onClick={() => verNotificacion(n)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" /> Ver
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

