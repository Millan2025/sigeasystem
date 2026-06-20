'use client'
import { useState } from 'react'
import { Bell } from 'lucide-react'

export default function PushNotificationButton() {
  const [activadas, setActivadas] = useState(false)

  async function activarNotificaciones() {
    if (!('Notification' in window)) { alert('Tu navegador no soporta notificaciones'); return }
    const permiso = await Notification.requestPermission()
    if (permiso === 'granted') {
      setActivadas(true)
      new Notification('SIGEA System', { body: 'Notificaciones activadas. Recibiras alertas de nuevos pedidos.', icon: '/icon-192.png' })
    }
  }

  return (
    <button onClick={activarNotificaciones} className="fixed bottom-4 right-4 z-50 bg-emerald-500 text-white p-3 rounded-full shadow-lg hover:bg-emerald-600">
      <Bell className="w-5 h-5" />
      {!activadas && <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-4 h-4 rounded-full">!</span>}
    </button>
  )
}
