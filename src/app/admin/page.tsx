'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Upload, Users, UserPlus, Package, Search, Eye, Ban, Trash2, Activity, CreditCard, Settings, ChevronRight, ExternalLink, Copy, Bell, X, CheckCircle } from 'lucide-react'

interface Cliente {
  id: string; nombre: string; tipo: string; estado: string; fechaCreacion: string; suscripcion: string;
  modulos: string[]; gerente: string; email: string; telefono: string;
}

const clientesDemo: Cliente[] = [
  { id: '1', nombre: 'Panaderia Doña Rosa', tipo: 'panaderia', estado: 'activo', fechaCreacion: '2025-01-15', suscripcion: 'Pro', modulos: ['pos','produccion','inventario','personal','pedidos','reportes','finanzas','tienda'], gerente: 'Rosa Martinez', email: 'rosa@email.com', telefono: '3001112233' },
  { id: '2', nombre: 'Restaurante Doña Rosa', tipo: 'restaurante', estado: 'activo', fechaCreacion: '2025-06-01', suscripcion: 'Pro', modulos: ['pos','produccion','inventario','pedidos','finanzas'], gerente: 'Pedro Lopez', email: 'pedro@email.com', telefono: '3004445566' },
  { id: '3', nombre: 'Tienda La Esquina', tipo: 'tienda', estado: 'activo', fechaCreacion: '2025-03-20', suscripcion: 'Free', modulos: ['pos','inventario','finanzas','tienda'], gerente: 'Luis Martinez', email: 'luis@email.com', telefono: '3007778899' },
  { id: '4', nombre: 'Distribuidora El Mayorista', tipo: 'distribuidora', estado: 'suspendido', fechaCreacion: '2025-02-10', suscripcion: 'Enterprise', modulos: ['pos','inventario','pedidos','finanzas','iot'], gerente: 'Ana Ruiz', email: 'ana@email.com', telefono: '3009990011' },
]

const cambios = [
  { fecha: '2025-06-18 14:30', cliente: 'Doña Rosa', accion: 'Nuevo producto: Pan Integral', tipo: 'producto' },
  { fecha: '2025-06-18 11:15', cliente: 'La Esquina', accion: 'Nuevo empleado: Ana Ruiz', tipo: 'personal' },
]

export default function AdminMasterPage() {
  const [tab, setTab] = useState<'clientes'|'trazabilidad'|'suscripciones'|'config'>('clientes')
  const [busqueda, setBusqueda] = useState('')
  const [copied, setCopied] = useState(false)
  const [notificaciones, setNotificaciones] = useState<any[]>([])
  const [clientes, setClientes] = useState<Cliente[]>(clientesDemo)
  const [clienteDetalle, setClienteDetalle] = useState<Cliente | null>(null)
  const [showNuevoCliente, setShowNuevoCliente] = useState(false)
  const [showProducto, setShowProducto] = useState(false)
  const [showCargar, setShowCargar] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')

  useEffect(() => {
    fetch('/api/leads').then(r => r.json()).then(d => {
      if (d.success) setNotificaciones(d.data || [])
    }).catch(() => {})
  }, [])

  function copiarEnlace() {
    navigator.clipboard.writeText('https://sigea-system.vercel.app/demo')
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  function verCliente(c: Cliente) { setClienteDetalle(c) }
  function suspenderCliente(id: string) {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, estado: c.estado === 'activo' ? 'suspendido' : 'activo' } : c))
  }
  function eliminarCliente(id: string) {
    if (confirm('Eliminar este cliente?')) setClientes(prev => prev.filter(c => c.id !== id))
  }
  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) { setUploadMsg('✅ Plantilla cargada: ' + file.name); setTimeout(() => setUploadMsg(''), 3000) }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-5">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1"><h1 className="text-xl font-bold">Admin Master</h1><p className="text-stone-400 text-xs">Control total del sistema</p></div>
        </div>
        <div className="flex gap-2 mb-3">
          <a href="/demo" target="_blank" className="bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-purple-600 inline-flex items-center gap-1 no-underline"><ExternalLink className="w-3 h-3" /> Demo</a>
          <button onClick={copiarEnlace} className="bg-stone-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-stone-600 inline-flex items-center gap-1">{copied ? '✓ Copiado' : <><Copy className="w-3 h-3" /> Copiar</>}</button>
        </div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1 overflow-x-auto">
          {[{ id: 'clientes' as const, label: 'Clientes', icon: Users }, { id: 'trazabilidad' as const, label: 'Trazabilidad', icon: Activity }, { id: 'suscripciones' as const, label: 'Pagos', icon: CreditCard }, { id: 'config' as const, label: 'Config', icon: Settings }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={'flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium whitespace-nowrap ' + (tab === t.id ? 'bg-white text-stone-800' : 'text-stone-300')}><t.icon className="w-3.5 h-3.5" /> {t.label}</button>
          ))}
        </div>
      </header>

      <div className="p-4">
        {tab === 'clientes' && (
          <div className="space-y-4">
            {notificaciones.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2"><Bell className="w-5 h-5 text-blue-600" /><span className="text-sm font-bold text-blue-800">{notificaciones.length} nuevo(s) registro(s)</span></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <a href="/admin/excel-maestro" className="bg-teal-50 border border-teal-200 rounded-2xl p-4 hover:bg-teal-100 no-underline"><Download className="w-6 h-6 text-teal-600 mb-2" /><span className="font-bold text-stone-800 block text-sm">Excel Maestro</span><span className="text-xs text-teal-600">Descargar/Cargar</span></a>
              <button onClick={() => setShowCargar(true)} className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-left hover:bg-blue-100"><Upload className="w-6 h-6 text-blue-600 mb-2" /><span className="font-bold text-stone-800 block text-sm">Cargar Plantilla</span><span className="text-xs text-blue-600">Procesar datos</span></button>
              <button onClick={() => setShowNuevoCliente(true)} className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-left hover:bg-purple-100"><UserPlus className="w-6 h-6 text-purple-600 mb-2" /><span className="font-bold text-stone-800 block text-sm">Nuevo Cliente</span></button>
              <button onClick={() => setShowProducto(true)} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left hover:bg-amber-100"><Package className="w-6 h-6 text-amber-600 mb-2" /><span className="font-bold text-stone-800 block text-sm">+ Producto/Insumo</span></button>
            </div>
            {uploadMsg && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-sm font-medium">{uploadMsg}</div>}
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" /><input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar cliente..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border text-sm text-stone-900" /></div>
            {clientes.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-stone-200 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div><h3 className="font-bold text-stone-900">{c.nombre}</h3><p className="text-xs text-stone-600">{c.tipo} · {c.suscripcion} · {c.gerente}</p></div>
                  <span className={'px-3 py-1 rounded-full text-xs font-bold ' + (c.estado === 'activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{c.estado}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => verCliente(c)} className="flex-1 bg-stone-100 hover:bg-stone-200 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1"><Eye className="w-3 h-3" /> Ver</button>
                  <button onClick={() => suspenderCliente(c.id)} className="flex-1 bg-amber-50 hover:bg-amber-100 py-2 rounded-lg text-xs font-medium text-amber-700 flex items-center justify-center gap-1"><Ban className="w-3 h-3" /> {c.estado === 'activo' ? 'Suspender' : 'Activar'}</button>
                  <button onClick={() => eliminarCliente(c.id)} className="flex-1 bg-red-50 hover:bg-red-100 py-2 rounded-lg text-xs font-medium text-red-600 flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" /> Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'trazabilidad' && (
          <div className="space-y-2"><h2 className="font-bold text-stone-800 mb-3">Ultimos Cambios</h2>
            {cambios.map((c, i) => (
              <div key={i} className="bg-white rounded-xl border p-3 flex items-center gap-3"><div className={'p-2 rounded-lg ' + (c.tipo === 'producto' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600')}><Activity className="w-4 h-4" /></div><div><p className="text-sm font-medium text-stone-800">{c.accion}</p><p className="text-xs text-stone-600">{c.fecha} · {c.cliente}</p></div></div>
            ))}
          </div>
        )}

        {tab === 'suscripciones' && (
          <div className="space-y-4"><h2 className="font-bold text-stone-800">Planes y Pagos</h2>
            {[{ plan: 'Free', precio: '$0/mes', clientes: clientes.filter(c => c.suscripcion === 'Free').length, color: 'bg-stone-50 border-stone-300' }, { plan: 'Pro', precio: '$49.900/mes', clientes: clientes.filter(c => c.suscripcion === 'Pro').length, color: 'bg-emerald-50 border-emerald-300' }, { plan: 'Enterprise', precio: '$199.900/mes', clientes: clientes.filter(c => c.suscripcion === 'Enterprise').length, color: 'bg-purple-50 border-purple-300' }].map(p => (
              <div key={p.plan} className={'rounded-2xl border-2 p-5 ' + p.color}><div className="flex justify-between"><div><h3 className="font-bold text-lg text-stone-900">{p.plan}</h3><p className="text-2xl font-bold mt-1 text-stone-800">{p.precio}</p></div><span className="text-sm text-stone-600">{p.clientes} clientes</span></div></div>
            ))}
          </div>
        )}

        {tab === 'config' && (
          <div className="space-y-3">
            <h2 className="font-bold text-stone-800">Configuracion Global</h2>
            {[{ label: 'Notificaciones', desc: 'Alertas y recordatorios' }, { label: 'Seguridad', desc: 'Permisos y accesos' }, { label: 'Actualizaciones', desc: 'Version del sistema' }, { label: 'Precios y Planes', desc: 'Gestionar suscripciones' }].map(c => (
              <div key={c.label} className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-3 cursor-pointer hover:bg-stone-50"><Settings className="w-5 h-5 text-stone-500" /><div className="flex-1"><p className="font-bold text-stone-800 text-sm">{c.label}</p><p className="text-xs text-stone-500">{c.desc}</p></div><ChevronRight className="w-4 h-4 text-stone-300" /></div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL VER CLIENTE */}
      {clienteDetalle && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setClienteDetalle(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-xl text-stone-900">{clienteDetalle.nombre}</h2><button onClick={() => setClienteDetalle(null)} className="p-2 hover:bg-stone-100 rounded-xl"><X className="w-5 h-5 text-stone-600" /></button></div>
            <div className="space-y-2 text-sm"><p className='text-stone-700 font-medium'><span className='text-stone-500'>Tipo:</span> {clienteDetalle.tipo}</p><p className='text-stone-700 font-medium'><span className='text-stone-500'>Gerente:</span> {clienteDetalle.gerente}</p><p className='text-stone-700 font-medium'><span className='text-stone-500'>Email:</span> {clienteDetalle.email}</p><p className='text-stone-700 font-medium'><span className='text-stone-500'>Telefono:</span> {clienteDetalle.telefono}</p><p><span className="text-stone-500">Plan:</span> <span className="font-bold text-emerald-600">{clienteDetalle.suscripcion}</span></p><p><span className="text-stone-500">Modulos:</span> {clienteDetalle.modulos.join(', ')}</p></div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO CLIENTE */}
      {showNuevoCliente && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowNuevoCliente(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-xl text-stone-900 mb-4">Nuevo Cliente</h2>
            <div className="space-y-3"><div><label className="block text-xs font-bold text-stone-700 mb-1">Nombre del Negocio</label><input placeholder="Ej: Panaderia Doña Rosa" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" /></div>
              <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-bold text-stone-700 mb-1">Gerente</label><input placeholder="Nombre completo" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" /></div><div><label className="block text-xs font-bold text-stone-700 mb-1">Tipo Negocio</label><select className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900"><option>panaderia</option><option>restaurante</option><option>tienda</option><option>distribuidora</option></select></div></div>
              <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-bold text-stone-700 mb-1">Email</label><input type="email" placeholder="correo@email.com" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" /></div><div><label className="block text-xs font-bold text-stone-700 mb-1">Telefono</label><input placeholder="3001234567" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" /></div></div>
              <div><label className="block text-xs font-bold text-stone-700 mb-1">Direccion</label><input placeholder="Calle 123 #45-67" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" /></div>
              <div><label className="block text-xs font-bold text-stone-700 mb-1">Plan</label><select className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900"><option>Free</option><option>Pro</option><option>Enterprise</option></select></div> className="w-full p-3 bg-stone-50 border rounded-xl text-sm" /><input placeholder="Gerente" className="w-full p-3 bg-stone-50 border rounded-xl text-sm" /><input placeholder="Email" className="w-full p-3 bg-stone-50 border rounded-xl text-sm" /><input placeholder="Telefono" className="w-full p-3 bg-stone-50 border rounded-xl text-sm" /></div>
            <div className="flex gap-3 mt-4"><button onClick={() => setShowNuevoCliente(false)} className="flex-1 bg-stone-200 py-3 rounded-xl font-bold">Cancelar</button><button onClick={() => { alert('Cliente creado'); setShowNuevoCliente(false) }} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold">Guardar</button></div>
          </div>
        </div>
      )}

      {/* MODAL PRODUCTO */}
      {showProducto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowProducto(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-xl text-stone-900 mb-4">Agregar Producto</h2>
            <div className="space-y-3"><div><label className="block text-xs font-bold text-stone-700 mb-1">Cliente</label><select className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900">{clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
              <div><label className="block text-xs font-bold text-stone-700 mb-1">Nombre del Producto</label><input placeholder="Ej: Pan Aliñado Familiar" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" /></div>
              <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-bold text-stone-700 mb-1">SKU</label><input placeholder="PAN-001" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" /></div><div><label className="block text-xs font-bold text-stone-700 mb-1">Categoria</label><select className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900"><option>Panaderia</option><option>Pasteleria</option><option>Bebidas</option><option>Lacteos</option><option>Verduras</option></select></div></div>
              <div className="grid grid-cols-3 gap-2"><div><label className="block text-xs font-bold text-stone-700 mb-1">Precio</label><input type="number" placeholder="$5000" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" /></div><div><label className="block text-xs font-bold text-stone-700 mb-1">Costo</label><input type="number" placeholder="$1800" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" /></div><div><label className="block text-xs font-bold text-stone-700 mb-1">Stock</label><input type="number" placeholder="50" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" /></div></div>
              <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-bold text-stone-700 mb-1">Unidad</label><select className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900"><option>unidad</option><option>kg</option><option>g</option><option>L</option><option>ml</option></select></div><div><label className="block text-xs font-bold text-stone-700 mb-1">Proveedor</label><input placeholder="Nombre proveedor" className="w-full p-3 bg-stone-50 border rounded-xl text-sm text-stone-900" /></div></div>
              <label className="flex items-center gap-2 text-sm text-stone-700"><input type="checkbox" className="w-4 h-4 rounded" /> Producto por peso (precio variable)</label> className="w-full p-3 bg-stone-50 border rounded-xl text-sm" /><div className="grid grid-cols-2 gap-2"><input type="number" placeholder="Precio" className="p-3 bg-stone-50 border rounded-xl text-sm" /><input type="number" placeholder="Stock" className="p-3 bg-stone-50 border rounded-xl text-sm" /></div></div>
            <div className="flex gap-3 mt-4"><button onClick={() => setShowProducto(false)} className="flex-1 bg-stone-200 py-3 rounded-xl font-bold">Cancelar</button><button onClick={() => { alert('Producto agregado'); setShowProducto(false) }} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold">Guardar</button></div>
          </div>
        </div>
      )}

      {/* MODAL CARGAR PLANTILLA */}
      {showCargar && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCargar(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-xl text-stone-900 mb-4">Cargar Plantilla</h2>
            <label className="block cursor-pointer"><input type="file" accept=".csv" onChange={handleUpload} className="hidden" /><div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-2xl p-8 text-center"><Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" /><p className="text-blue-600 font-bold">Seleccionar archivo CSV</p></div></label>
            {uploadMsg && <p className="mt-3 text-sm text-emerald-600 font-medium">{uploadMsg}</p>}
            <button onClick={() => setShowCargar(false)} className="w-full mt-4 bg-stone-200 py-3 rounded-xl font-bold">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}


