"use client";
import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

interface Props {
  tenantId: string | null;
}

const iconos: Record<string, string> = {
  pedido: '🛵', stock: '📦', orden: '🏭', pago: '💰',
  cliente: '👤', alerta: '⚠️', exito: '✅', default: '🔔'
};

const colores: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700 border-blue-300',
  red: 'bg-red-100 text-red-700 border-red-300',
  green: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  amber: 'bg-amber-100 text-amber-700 border-amber-300',
  purple: 'bg-purple-100 text-purple-700 border-purple-300',
};

export default function NotificationBell({ tenantId }: Props) {
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = useRealtimeNotifications(tenantId);
  const [abierto, setAbierto] = useState(false);
  const [toast, setToast] = useState<any>(null);

  // Escuchar notificaciones en tiempo real para mostrar toast
  useEffect(() => {
    const handler = (e: any) => {
      const n = e.detail;
      setToast(n);
      setTimeout(() => setToast(null), 5000);
    };
    window.addEventListener('nueva-notificacion', handler);
    return () => window.removeEventListener('nueva-notificacion', handler);
  }, []);

  if (!tenantId) return null;

  return (
    <>
      {/* Toast flotante */}
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

      {/* Botón campana */}
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

        {/* Dropdown */}
        {abierto && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />
            <div className="absolute top-12 z-50 left-4 right-4 sm:left-auto sm:right-0 sm:w-96 max-h-[70vh] bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-stone-800">Notificaciones</h3>
                {noLeidas > 0 && (
                  <button
                    onClick={marcarTodasLeidas}
                    className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" /> Marcar todas
                  </button>
                )}
              </div>
              
              <div className="overflow-y-auto flex-1">
                {notificaciones.length === 0 ? (
                  <div className="p-8 text-center text-stone-500 text-sm">
                    <Bell className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                    <p>Sin notificaciones</p>
                  </div>
                ) : (
                  notificaciones.map(n => (
                    <div
                      key={n.id}
                      onClick={() => marcarLeida(n.id)}
                      className={`p-3 border-b border-stone-100 hover:bg-stone-50 cursor-pointer transition ${!n.leida ? 'bg-blue-50/50' : ''}`}
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
                          <p className="text-xs text-stone-400 mt-1">
                            {new Date(n.created_at).toLocaleString('es-CO', { 
                              hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' 
                            })}
                          </p>
                        </div>
                        {n.leida && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
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
