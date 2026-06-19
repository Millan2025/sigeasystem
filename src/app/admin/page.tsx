'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Upload, Users, UserPlus, Package, Search, Eye, Ban, Trash2, Activity, CreditCard, Settings, ChevronRight, ExternalLink, Copy, Bell } from 'lucide-react'

interface Cliente {
  id: string; nombre: string; tipo: string; estado: string; fechaCreacion: string; suscripcion: string;
  modulos: string[];
}

const clientesDemo: Cliente[] = [
  { id: '1', nombre: 'Panaderia Doña Rosa', tipo: 'panaderia', estado: 'activo', fechaCreacion: '2025-01-15', suscripcion: 'Pro', modulos: ['pos','produccion','inventario','personal','pedidos','reportes','finanzas','tienda'] },
  { id: '2', nombre: 'Restaurante Doña Rosa', tipo: 'restaurante', estado: 'activo', fechaCreacion: '2025-06-01', suscripcion: 'Pro', modulos: ['pos','produccion','inventario','pedidos','finanzas'] },
  { id: '3', nombre: 'Tienda La Esquina', tipo: 'tienda', estado: 'activo', fechaCreacion: '2025-03-20', suscripcion: 'Free', modulos: ['pos','inventario','finanzas','tienda'] },
  { id: '4', nombre: 'Distribuidora El Mayorista', tipo: 'distribuidora', estado: 'suspendido', fechaCreacion: '2025-02-10', suscripcion: 'Enterprise', modulos: ['pos','inventario','pedidos','finanzas','iot'] },
]

const cambios = [
  { fecha: '2025-06-18 14:30', cliente: 'Doña Rosa', accion: 'Nuevo producto: Pan Integral', tipo: 'producto' },
  { fecha: '2025-06-18 11:15', cliente: 'La Esquina', accion: 'Nuevo empleado: Ana Ruiz', tipo: 'personal' },
]

export default function AdminMasterPage() {
  const [tab, setTab] = useState<'clientes'|'trazabilidad'|'suscripciones'|'config'>('clientes')
  const [busqueda, setBusqueda] = useState('')
  const [copied, setCopied] = useState(false)

  function copiarEnlace() {
    navigator.clipboard.writeText('https://sigea-system.vercel.app/demo')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-5">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1"><h1 className="text-xl font-bold">Admin Master</h1><p className="text-stone-400 text-xs">Control total del sistema</p></div>
        </div>
        <div className="flex gap-2 mb-3">
          <a href="/demo" target="_blank" className="bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-600 inline-flex items-center gap-1 no-underline"><ExternalLink className="w-3 h-3" /> Ver Demo</a>
          <button onClick={copiarEnlace} className="bg-stone-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-stone-600 inline-flex items-center gap-1">{copied ? 'Copiado!' : <><Copy className="w-3 h-3" /> Copiar Enlace</>}</button>
        </div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1">
          {[{ id: 'clientes' as const, label: 'Clientes', icon: Users }, { id: 'trazabilidad' as const, label: 'Trazabilidad', icon: Activity }, { id: 'suscripciones' as const, label: 'Suscripciones', icon: CreditCard }, { id: 'config' as const, label: 'Config', icon: Settings }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={'flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium ' + (tab === t.id ? 'bg-white text-stone-800' : 'text-stone-300')}><t.icon className="w-3.5 h-3.5" /> {t.label}</button>
          ))}
        </div>
      </header>
      <div className="p-4">
        {tab === 'clientes' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <a href="/plantilla-maestra.csv" download className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 hover:bg-emerald-100 no-underline"><Download className="w-6 h-6 text-emerald-600 mb-2" /><span className="font-bold text-stone-800 block text-sm">Descargar Plantilla</span><span className="text-xs text-emerald-600">Excel Maestro</span></a>
              <button className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-left hover:bg-blue-100"><Upload className="w-6 h-6 text-blue-600 mb-2" /><span className="font-bold text-stone-800 block text-sm">Cargar Plantilla</span><span className="text-xs text-blue-600">Procesar datos</span></button>
              <button className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-left hover:bg-purple-100"><UserPlus className="w-6 h-6 text-purple-600 mb-2" /><span className="font-bold text-stone-800 block text-sm">Nuevo Cliente</span></button>
              <button className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left hover:bg-amber-100"><Package className="w-6 h-6 text-amber-600 mb-2" /><span className="font-bold text-stone-800 block text-sm">+ Producto/Insumo</span></button>
            <button onClick={() => setShowNotif(true)} className="relative bg-blue-50 border border-blue-200 rounded-2xl p-4 text-left hover:bg-blue-100">
              <Bell className="w-6 h-6 text-blue-600 mb-2" />
              <span className="font-bold text-stone-800 block text-sm">Notificaciones</span>
              {notificaciones.length > 0 && <span className="absolute top-2 right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{notificaciones.length}</span>}
            </div>
            <button onClick={() => setShowNotif(true)} className="w-full bg-blue-50 border border-blue-200 rounded-2xl p-4 text-left hover:bg-blue-100 mb-3">
              <Bell className="w-6 h-6 text-blue-600 mb-2 inline" />
              <span className="font-bold text-stone-800 block text-sm">Notificaciones {notificaciones.length > 0 ? '(' + notificaciones.length + ')' : ''}</span>
            </button>
</button>
            </div>
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" /><input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar cliente..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-stone-200 text-sm text-stone-900" /></div>
            {clientesDemo.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-stone-200 p-4">
                <div className="flex justify-between items-start mb-3"><div><h3 className="font-bold text-stone-900">{c.nombre}</h3><p className="text-xs text-stone-600">{c.tipo} - Creado: {c.fechaCreacion} - {c.suscripcion}</p></div><span className={'px-3 py-1 rounded-full text-xs font-bold ' + (c.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{c.estado}</span></div>
                <div className="flex gap-2"><button className="flex-1 bg-stone-100 hover:bg-stone-200 py-2 rounded-lg text-xs font-medium text-stone-700 flex items-center justify-center gap-1"><Eye className="w-3 h-3" /> Ver</button><button className="flex-1 bg-amber-50 hover:bg-amber-100 py-2 rounded-lg text-xs font-medium text-amber-700 flex items-center justify-center gap-1"><Ban className="w-3 h-3" /> Suspender</button><button className="flex-1 bg-red-50 hover:bg-red-100 py-2 rounded-lg text-xs font-medium text-red-600 flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" /> Eliminar</button></div>
              </div>
            ))}
          </div>
        )}
        {tab === 'trazabilidad' && (
          <div className="space-y-2"><h2 className="font-bold text-stone-800 mb-3">Ultimos Cambios</h2>
            {cambios.map((c, i) => (
              <div key={i} className="bg-white rounded-xl border border-stone-200 p-3 flex items-center gap-3"><div className={'p-2 rounded-lg ' + (c.tipo === 'producto' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600')}><Activity className="w-4 h-4" /></div><div><p className="text-sm font-medium text-stone-800">{c.accion}</p><p className="text-xs text-stone-600">{c.fecha} - {c.cliente}</p></div></div>
            ))}
          </div>
        )}
        {tab === 'suscripciones' && (
          <div className="space-y-4"><h2 className="font-bold text-stone-800">Planes y Pagos</h2>
            {[{ plan: 'Free', precio: '$0/mes', clientes: 1, color: 'bg-stone-50 border-stone-300' }, { plan: 'Pro', precio: '$49.900/mes', clientes: 2, color: 'bg-emerald-50 border-emerald-300' }, { plan: 'Enterprise', precio: '$199.900/mes', clientes: 1, color: 'bg-purple-50 border-purple-300' }].map(p => (
              <div key={p.plan} className={'rounded-2xl border-2 p-5 ' + p.color}><div className="flex justify-between"><div><h3 className="font-bold text-lg text-stone-900">{p.plan}</h3><p className="text-2xl font-bold mt-1 text-stone-800">{p.precio}</p></div><span className="text-sm text-stone-600">{p.clientes} clientes</span></div></div>
            ))}
          </div>
        )}
      </div>
    
      {/* MODAL NOTIFICACIONES */}
      {showNotif && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto" onClick={() => setShowNotif(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-xl text-stone-900">🔔 Nuevos Registros</h2><button onClick={() => setShowNotif(false)} className="p-2 hover:bg-stone-100 rounded-xl"><X className="w-5 h-5 text-stone-600" /></button></div>
            {notificaciones.length === 0 ? <p className="text-center text-stone-400 py-8">Sin notificaciones nuevas</p> : notificaciones.map((l: any, i: number) => (
              <div key={i} className="bg-blue-50 rounded-xl p-3 mb-2">
                <div className="flex justify-between items-start"><div><p className="font-bold text-stone-800 text-sm">{l.nombre}</p><p className="text-xs text-stone-500">{l.email} · {l.origen}</p></div><span className="text-[10px] text-stone-400">{new Date(l.created_at).toLocaleDateString()}</span></div>
                <div className="flex gap-2 mt-2">
                  <a href={'https://wa.me/57' + (l.telefono || '3016111412') + '?text=Hola ' + l.nombre + ', vi tu registro en SIGEA'} target="_blank" className="text-xs text-green-600 font-medium hover:underline">📞 Contactar</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
</div>
  )
}



