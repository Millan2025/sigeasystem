'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, DollarSign, Download, Plus, X, FileText, Pencil, Trash2 } from 'lucide-react'

interface Empleado {
  id: string; nombre: string; documento: string; cargo: string; tipoContrato: string;
  salarioBase: number; auxilioTransporte: boolean; riesgoLaboral: number;
  fechaIngreso: string; estado: string;
  horasExtrasDiurnas: number; horasExtrasNocturnas: number; horasDominicales: number;
  comisiones: number; bonificaciones: number;
  salud: number; pension: number; fondoSolidaridad: number;
  embargos: number; anticipos: number;
}

const empleadosDemo: Empleado[] = [
  { id: '1', nombre: 'Carlos Gómez', documento: '12345678', cargo: 'Cajero', tipoContrato: 'Fijo', salarioBase: 1423500, auxilioTransporte: true, riesgoLaboral: 1, fechaIngreso: '2024-01-15', estado: 'Activo', horasExtrasDiurnas: 4, horasExtrasNocturnas: 0, horasDominicales: 0, comisiones: 0, bonificaciones: 50000, salud: 56940, pension: 56940, fondoSolidaridad: 0, embargos: 0, anticipos: 0 },
  { id: '2', nombre: 'María López', documento: '87654321', cargo: 'Panadera', tipoContrato: 'Indefinido', salarioBase: 1500000, auxilioTransporte: false, riesgoLaboral: 2, fechaIngreso: '2023-06-01', estado: 'Activo', horasExtrasDiurnas: 8, horasExtrasNocturnas: 3, horasDominicales: 2, comisiones: 0, bonificaciones: 80000, salud: 60000, pension: 60000, fondoSolidaridad: 0, embargos: 0, anticipos: 100000 },
  { id: '3', nombre: 'Juan Pérez', documento: '56781234', cargo: 'Repartidor', tipoContrato: 'Fijo', salarioBase: 1300000, auxilioTransporte: true, riesgoLaboral: 3, fechaIngreso: '2024-03-01', estado: 'Activo', horasExtrasDiurnas: 3, horasExtrasNocturnas: 0, horasDominicales: 0, comisiones: 20000, bonificaciones: 0, salud: 52000, pension: 52000, fondoSolidaridad: 0, embargos: 0, anticipos: 0 },
]

const SMMLV = 1423500
const AUXILIO_TRANSPORTE = 200000

export default function PersonalPage() {
  const [tab, setTab] = useState<'empleados'|'nomina'|'exportar'>('empleados')
  const [perfil, setPerfil] = useState<'micro'|'mediana'>('micro')
  const [showAdd, setShowAdd] = useState(false)
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [empleados, setEmpleados] = useState<Empleado[]>(empleadosDemo)
  const [editForm, setEditForm] = useState<Empleado | null>(null)

  function calcularNomina(emp: Empleado) {
    const valorHora = emp.salarioBase / 240
    const totalHorasExtras = (emp.horasExtrasDiurnas * valorHora * 1.25) + (emp.horasExtrasNocturnas * valorHora * 1.75) + (emp.horasDominicales * valorHora * 1.75)
    const auxilioTransp = emp.auxilioTransporte ? AUXILIO_TRANSPORTE : 0
    const totalDevengado = emp.salarioBase + totalHorasExtras + auxilioTransp + emp.comisiones + emp.bonificaciones
    const ibc = totalDevengado
    const saludEmp = Math.round(ibc * 0.04)
    const pensionEmp = Math.round(ibc * 0.04)
    const fondo = ibc > (SMMLV * 4) ? Math.round(ibc * 0.01) : 0
    const totalDeducciones = saludEmp + pensionEmp + fondo + emp.embargos + emp.anticipos
    const netoPagar = totalDevengado - totalDeducciones
    return { valorHora, totalHorasExtras, auxilioTransp, totalDevengado, saludEmp, pensionEmp, fondo, totalDeducciones, netoPagar, ibc }
  }

  function exportarDesprendible(emp: Empleado) {
    const n = calcularNomina(emp)
    var csv = '\uFEFFDESPRENDIBLE DE PAGO\nEMPLEADO:,' + emp.nombre + '\nDOCUMENTO:,' + emp.documento + '\nCARGO:,' + emp.cargo + '\n\nCONCEPTO,VALOR\n'
    csv += 'Salario Basico,$' + emp.salarioBase.toLocaleString() + '\n'
    if (emp.horasExtrasDiurnas > 0) csv += 'Horas Extra Diurnas,$' + Math.round(emp.horasExtrasDiurnas * n.valorHora * 1.25).toLocaleString() + '\n'
    if (n.auxilioTransp > 0) csv += 'Auxilio Transporte,$' + n.auxilioTransp.toLocaleString() + '\n'
    csv += 'TOTAL DEVENGADO,$' + n.totalDevengado.toLocaleString() + '\n\nDEDUCCIONES,VALOR\n'
    csv += 'Salud (4%),-$' + n.saludEmp.toLocaleString() + '\nPension (4%),-$' + n.pensionEmp.toLocaleString() + '\n'
    csv += 'TOTAL DEDUCCIONES,-$' + n.totalDeducciones.toLocaleString() + '\n\nNETO A PAGAR,$' + n.netoPagar.toLocaleString()
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url; a.download = 'desprendible_' + emp.nombre.replace(/ /g,'_') + '.csv'; a.click()
  }

  function exportarExcel() {
    var csv = '\uFEFFEMPLEADO,DOCUMENTO,CARGO,SALARIO BASE,DEVENGADO,DEDUCCIONES,NETO\n'
    empleados.forEach(e => { const n = calcularNomina(e); csv += e.nombre + ',' + e.documento + ',' + e.cargo + ',' + e.salarioBase + ',' + n.totalDevengado + ',' + n.totalDeducciones + ',' + n.netoPagar + '\n' })
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url; a.download = 'nomina_' + new Date().toISOString().split('T')[0] + '.csv'; a.click()
  }

  function guardarEdicion() {
    if (!editForm) return
    setEmpleados(prev => prev.map(e => e.id === editForm.id ? editForm : e))
    setShowEdit(false)
    setEditForm(null)
  }

  function eliminarEmpleado() {
    if (!editForm) return
    setEmpleados(prev => prev.filter(e => e.id !== editForm.id))
    setShowDelete(false)
    setEditForm(null)
    setEmpleadoSeleccionado(null)
  }

  function abrirEditar(emp: Empleado) {
    setEditForm({...emp})
    setShowEdit(true)
  }

  function abrirEliminar(emp: Empleado) {
    setEditForm({...emp})
    setShowDelete(true)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex-1"><h1 className="text-xl font-bold">Personal</h1></div>
          <select value={perfil} onChange={e => setPerfil(e.target.value as any)} className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-xs text-white">
            <option value="micro" className="text-stone-800">Microempresa</option>
            <option value="mediana" className="text-stone-800">Mediana Empresa</option>
          </select>
        </div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1">
          {[{ id: 'empleados' as const, label: 'Empleados', icon: Users }, { id: 'nomina' as const, label: 'Nomina', icon: DollarSign }, { id: 'exportar' as const, label: 'Exportar', icon: FileText }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium ' + (tab === t.id ? 'bg-white text-stone-800' : 'text-stone-300')}><t.icon className="w-4 h-4" /> {t.label}</button>
          ))}
        </div>
      </header>

      <div className="p-4">
        {tab === 'empleados' && (
          <div className="space-y-3">
            <button onClick={() => setShowAdd(true)} className="w-full bg-emerald-500 text-white rounded-2xl py-3 font-bold flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> Agregar Empleado</button>
            {empleados.map(e => (
              <div key={e.id} className="bg-white rounded-2xl p-4 border border-stone-200">
                <div className="flex justify-between items-start mb-3 cursor-pointer" onClick={() => setEmpleadoSeleccionado(e)}>
                  <div><h3 className="font-semibold text-stone-900 text-base">{e.nombre}</h3><p className="text-sm text-stone-500">{e.cargo} - {e.tipoContrato}</p><p className="text-xs text-stone-400">CC: {e.documento}</p></div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">{e.estado}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                  <div className="bg-stone-50 rounded-xl p-2"><p className="text-stone-400">Salario Base</p><p className="font-bold text-stone-800">${e.salarioBase.toLocaleString()}</p></div>
                  <div className="bg-stone-50 rounded-xl p-2"><p className="text-stone-400">Aux. Transporte</p><p className="font-bold text-stone-800">{e.auxilioTransporte ? 'Si' : 'No'}</p></div>
                  <div className="bg-stone-50 rounded-xl p-2"><p className="text-stone-400">Riesgo</p><p className="font-bold text-stone-800">Nivel {e.riesgoLaboral}</p></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEmpleadoSeleccionado(e)} className="flex-1 bg-stone-100 hover:bg-stone-200 py-2 rounded-lg text-xs font-medium text-stone-700 flex items-center justify-center gap-1">👁️ Ver</button>
                  <button onClick={() => abrirEditar(e)} className="flex-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-2 rounded-lg text-xs font-medium text-amber-700 flex items-center justify-center gap-1"><Pencil className="w-3 h-3" /> Editar</button>
                  <button onClick={() => abrirEliminar(e)} className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 py-2 rounded-lg text-xs font-medium text-red-600 flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" /> Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'nomina' && (
          <div className="space-y-4">
            {empleados.map(e => { const n = calcularNomina(e); return (
              <div key={e.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="bg-stone-100 px-4 py-3"><h3 className="font-bold text-stone-900">{e.nombre} - {e.cargo}</h3></div>
                <div className="p-4 space-y-3">
                  <div><h4 className="text-sm font-bold text-emerald-600 mb-2">DEVENGADOS</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-stone-600">Salario basico</span><span className="font-medium text-stone-800">${e.salarioBase.toLocaleString()}</span></div>
                      {e.horasExtrasDiurnas > 0 && <div className="flex justify-between"><span className="text-stone-600">Horas extra diurnas ({e.horasExtrasDiurnas}h)</span><span className="font-medium text-stone-800">${Math.round(e.horasExtrasDiurnas * n.valorHora * 1.25).toLocaleString()}</span></div>}
                      {n.auxilioTransp > 0 && <div className="flex justify-between"><span className="text-stone-600">Auxilio transporte</span><span className="font-medium text-stone-800">${n.auxilioTransp.toLocaleString()}</span></div>}
                      <hr /><div className="flex justify-between font-bold"><span className="text-stone-800">Total Devengado</span><span className="text-emerald-600">${n.totalDevengado.toLocaleString()}</span></div>
                    </div>
                  </div>
                  <div><h4 className="text-sm font-bold text-red-500 mb-2">DEDUCCIONES</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-stone-600">Salud (4%)</span><span className="font-medium text-stone-800">-${n.saludEmp.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-stone-600">Pension (4%)</span><span className="font-medium text-stone-800">-${n.pensionEmp.toLocaleString()}</span></div>
                      <hr /><div className="flex justify-between font-bold"><span className="text-stone-800">Total Deducciones</span><span className="text-red-600">-${n.totalDeducciones.toLocaleString()}</span></div>
                    </div>
                  </div>
                  <div className="bg-emerald-50 rounded-2xl p-4"><div className="flex justify-between text-lg font-bold"><span className="text-stone-800">NETO A PAGAR</span><span className="text-emerald-600">${n.netoPagar.toLocaleString()}</span></div></div>
                </div>
              </div>
            )})}
            <button onClick={exportarExcel} className="w-full bg-emerald-500 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2"><Download className="w-5 h-5" /> Descargar Nomina para Contador</button>
          </div>
        )}

        {tab === 'exportar' && (
          <div className="bg-white rounded-2xl p-6 border border-stone-200 text-center">
            <FileText className="w-12 h-12 text-stone-400 mx-auto mb-3" />
            <h3 className="font-bold text-stone-900 text-lg mb-2">Exportar Informacion</h3>
            <p className="text-stone-500 text-sm mb-4">Descarga la nomina en formato CSV compatible con software contable.</p>
            <button onClick={exportarExcel} className="bg-emerald-500 text-white rounded-2xl py-4 px-8 font-bold"><Download className="w-5 h-5 inline mr-2" />Descargar CSV</button>
          </div>
        )}
      </div>

      {/* MODAL VER DETALLE */}
      {empleadoSeleccionado && !showEdit && !showDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto" onClick={() => setEmpleadoSeleccionado(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5"><h2 className="font-bold text-xl text-stone-900">{empleadoSeleccionado.nombre}</h2><button onClick={() => setEmpleadoSeleccionado(null)} className="p-2 hover:bg-stone-100 rounded-xl"><X className="w-5 h-5 text-stone-600" /></button></div>
            {(() => { const n = calcularNomina(empleadoSeleccionado); return (
              <div className="space-y-3">
                <p className="text-sm text-stone-500">CC: {empleadoSeleccionado.documento} - {empleadoSeleccionado.cargo}</p>
                <p className="text-sm text-stone-500">Contrato: {empleadoSeleccionado.tipoContrato} - Ingreso: {empleadoSeleccionado.fechaIngreso}</p>
                <div className="bg-stone-50 rounded-xl p-3"><p className="text-xs text-stone-400">Salario Base</p><p className="text-xl font-bold text-stone-900">${empleadoSeleccionado.salarioBase.toLocaleString()}</p></div>
                <div className="bg-emerald-50 rounded-xl p-3"><p className="text-xs text-emerald-500">Neto a Pagar (Mes)</p><p className="text-xl font-bold text-emerald-600">${n.netoPagar.toLocaleString()}</p></div>
                <button onClick={() => { exportarDesprendible(empleadoSeleccionado!); setEmpleadoSeleccionado(null) }} className="w-full bg-emerald-500 text-white rounded-2xl py-3 font-bold flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Descargar Desprendible</button>
              </div>
            )})()}
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {showEdit && editForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto" onClick={() => setShowEdit(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5"><h2 className="font-bold text-xl text-stone-900">Editar - {editForm.nombre}</h2><button onClick={() => setShowEdit(false)} className="p-2 hover:bg-stone-100 rounded-xl"><X className="w-5 h-5 text-stone-600" /></button></div>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Nombre completo</label><input value={editForm.nombre} onChange={e => setEditForm({...editForm, nombre: e.target.value})} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-stone-700 mb-1">Cargo</label><select value={editForm.cargo} onChange={e => setEditForm({...editForm, cargo: e.target.value})} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 outline-none"><option>Cajero</option><option>Panadero</option><option>Repartidor</option><option>Vendedor</option></select></div>
                <div><label className="block text-sm font-medium text-stone-700 mb-1">Tipo Contrato</label><select value={editForm.tipoContrato} onChange={e => setEditForm({...editForm, tipoContrato: e.target.value})} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 outline-none"><option>Fijo</option><option>Indefinido</option><option>Obra/Labor</option><option>Aprendiz</option></select></div>
              </div>
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Salario base</label><input type="number" value={editForm.salarioBase} onChange={e => setEditForm({...editForm, salarioBase: Number(e.target.value)})} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 outline-none" /></div>
              <label className="flex items-center gap-2 text-sm text-stone-700"><input type="checkbox" checked={editForm.auxilioTransporte} onChange={e => setEditForm({...editForm, auxilioTransporte: e.target.checked})} className="w-4 h-4 rounded" /> Auxilio de transporte</label>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="block text-xs font-medium text-stone-500 mb-1">Hrs Extras Diurnas</label><input type="number" value={editForm.horasExtrasDiurnas} onChange={e => setEditForm({...editForm, horasExtrasDiurnas: Number(e.target.value)})} className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 outline-none" /></div>
                <div><label className="block text-xs font-medium text-stone-500 mb-1">Hrs Extras Nocturnas</label><input type="number" value={editForm.horasExtrasNocturnas} onChange={e => setEditForm({...editForm, horasExtrasNocturnas: Number(e.target.value)})} className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 outline-none" /></div>
                <div><label className="block text-xs font-medium text-stone-500 mb-1">Dominicales</label><input type="number" value={editForm.horasDominicales} onChange={e => setEditForm({...editForm, horasDominicales: Number(e.target.value)})} className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-stone-700 mb-1">Comisiones</label><input type="number" value={editForm.comisiones} onChange={e => setEditForm({...editForm, comisiones: Number(e.target.value)})} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 outline-none" /></div>
                <div><label className="block text-sm font-medium text-stone-700 mb-1">Bonificaciones</label><input type="number" value={editForm.bonificaciones} onChange={e => setEditForm({...editForm, bonificaciones: Number(e.target.value)})} className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 outline-none" /></div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowEdit(false)} className="flex-1 bg-stone-200 py-3 rounded-xl font-bold text-stone-700">Cancelar</button>
              <button onClick={guardarEdicion} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold">💾 Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {showDelete && editForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowDelete(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-xl text-stone-900 mb-3">Eliminar Empleado</h2>
            <p className="text-stone-500 mb-2">Estas seguro de eliminar a:</p>
            <p className="font-bold text-lg text-stone-900 mb-4">{editForm.nombre} - {editForm.cargo}</p>
            <p className="text-xs text-red-500 mb-4">Esta accion no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} className="flex-1 bg-stone-200 py-3 rounded-xl font-bold text-stone-700">Cancelar</button>
              <button onClick={eliminarEmpleado} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold">🗑️ Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AGREGAR */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5"><h2 className="font-bold text-xl text-stone-900">Agregar Empleado</h2><button onClick={() => setShowAdd(false)} className="p-2 hover:bg-stone-100 rounded-xl"><X className="w-5 h-5 text-stone-600" /></button></div>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Nombre completo</label><input placeholder="Ej: Carlos Gomez" className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 outline-none" /></div>
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Documento (CC)</label><input placeholder="12345678" className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 outline-none" /></div>
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Cargo</label><select className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 outline-none"><option>Cajero</option><option>Panadero</option><option>Repartidor</option></select></div>
              <div><label className="block text-sm font-medium text-stone-700 mb-1">Salario base</label><input type="number" placeholder="$1,423,500" className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 outline-none" /></div>
            </div>
            <div className="flex gap-3 mt-5"><button onClick={() => setShowAdd(false)} className="flex-1 bg-stone-200 py-3 rounded-xl font-bold text-stone-700">Cancelar</button><button onClick={() => { alert('Empleado agregado'); setShowAdd(false) }} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold">Guardar</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
