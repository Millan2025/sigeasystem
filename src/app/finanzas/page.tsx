'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, TrendingUp, DollarSign, Calculator, FileText, Link2, Building } from 'lucide-react'

const ventasHoy = 450000
const comprasHoy = 180000
const nominaHoy = 85000
const gastosHoy = 45000
const utilidadHoy = ventasHoy - comprasHoy - nominaHoy - gastosHoy

const libroDiario = [
  { fecha: '2025-06-14', concepto: 'Venta mostrador', ingreso: 450000, egreso: 0, cuenta: 'Ingresos operacionales' },
  { fecha: '2025-06-14', concepto: 'Compra harina El Trigo', ingreso: 0, egreso: 120000, cuenta: 'Compras materia prima' },
  { fecha: '2025-06-14', concepto: 'Compra azucar', ingreso: 0, egreso: 60000, cuenta: 'Compras materia prima' },
  { fecha: '2025-06-14', concepto: 'Nomina Carlos Gomez', ingreso: 0, egreso: 50000, cuenta: 'Gastos de personal' },
  { fecha: '2025-06-14', concepto: 'Nomina Maria Lopez', ingreso: 0, egreso: 35000, cuenta: 'Gastos de personal' },
  { fecha: '2025-06-14', concepto: 'Servicios publicos', ingreso: 0, egreso: 25000, cuenta: 'Gastos operativos' },
  { fecha: '2025-06-14', concepto: 'Arriendo local', ingreso: 0, egreso: 20000, cuenta: 'Gastos operativos' },
]

const totalIngresos = libroDiario.reduce((s, l) => s + l.ingreso, 0)
const totalEgresos = libroDiario.reduce((s, l) => s + l.egreso, 0)

export default function FinanzasPage() {
  const [tab, setTab] = useState<'resumen'|'libro'|'balance'|'cierre'|'api'>('resumen')
  const [efectivoContado, setEfectivoContado] = useState('')
  const [resultadoCierre, setResultadoCierre] = useState('')

  const tabs = [
    { id: 'resumen' as const, label: 'Resumen', icon: TrendingUp },
    { id: 'libro' as const, label: 'Libro Diario', icon: FileText },
    { id: 'balance' as const, label: 'Balance', icon: Calculator },
    { id: 'cierre' as const, label: 'Cierre Caja', icon: DollarSign },
    { id: 'api' as const, label: 'API', icon: Link2 },
  ]

  function descargarExcel() {
    var csv = '\uFEFFFecha,Concepto,Cuenta,Ingreso,Egreso\n'
    libroDiario.forEach(l => { csv += l.fecha + ',' + l.concepto + ',' + l.cuenta + ',' + l.ingreso + ',' + l.egreso + '\n' })
    csv += '\nTOTAL INGRESOS,,,' + totalIngresos + '\nTOTAL EGRESOS,,,' + totalEgresos
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url; a.download = 'libro_diario_' + new Date().toISOString().split('T')[0] + '.csv'; a.click()
  }

  function calcularCierre() {
    var contado = Number(efectivoContado)
    if (!contado) return
    var efectivoEsperado = ventasHoy * 0.65
    var diferencia = contado - efectivoEsperado
    var porcentaje = ((Math.abs(diferencia) / efectivoEsperado) * 100).toFixed(1)
    if (Math.abs(diferencia) > efectivoEsperado * 0.02) {
      setResultadoCierre('⚠️ DESCUADRE: $' + Math.abs(diferencia).toLocaleString() + ' (' + porcentaje + '%)')
    } else {
      setResultadoCierre('✅ CUADRE CORRECTO: $' + Math.abs(diferencia).toLocaleString() + ' (' + porcentaje + '%)')
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-800 to-stone-700 text-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
          <div><h1 className="text-xl font-bold">Finanzas</h1><p className="text-stone-300 text-xs">Panaderia Doña Rosa</p></div>
        </div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={'flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ' + (tab === t.id ? 'bg-white text-stone-800' : 'text-stone-300')}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4">
        {/* RESUMEN - 4 filas verticales */}
        {tab === 'resumen' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 border border-stone-200">
              <p className="text-sm font-bold text-stone-700">Ingresos</p>
              <p className="text-xl font-bold text-emerald-600">${totalIngresos.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-stone-200">
              <p className="text-sm font-bold text-stone-700">Egresos</p>
              <p className="text-xl font-bold text-rose-600">${totalEgresos.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-stone-200">
              <p className="text-sm font-bold text-stone-700">Nomina</p>
              <p className="text-xl font-bold text-amber-600">${nominaHoy.toLocaleString()}</p>
            </div>
            <div className={'rounded-2xl p-4 border ' + (utilidadHoy >= 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300')}>
              <p className="text-sm font-bold text-stone-700">Utilidad</p>
              <p className={'text-xl font-bold ' + (utilidadHoy >= 0 ? 'text-emerald-600' : 'text-rose-600')}>${utilidadHoy.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200">
              <h3 className="font-bold text-stone-800 mb-3">Estado de Resultados (P&G)</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-stone-700 font-medium">Ventas Totales</span><span className="text-emerald-600 font-bold">${ventasHoy.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-stone-700">Compras Proveedores</span><span className="text-rose-600">-${comprasHoy.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-stone-700">Nomina</span><span className="text-rose-600">-${nominaHoy.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-stone-700">Gastos Operativos</span><span className="text-rose-600">-${gastosHoy.toLocaleString()}</span></div>
                <hr />
                <div className="flex justify-between font-bold text-base"><span className="text-stone-900">Utilidad Neta</span><span className={utilidadHoy >= 0 ? 'text-emerald-600' : 'text-rose-600'}>${utilidadHoy.toLocaleString()}</span></div>
              </div>
            </div>
            <button onClick={descargarExcel} className="w-full bg-emerald-500 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2"><Download className="w-5 h-5" /> Descargar para Contador</button>
          </div>
        )}

        {/* LIBRO DIARIO - formato lista vertical */}
        {tab === 'libro' && (
          <div>
            <div className="flex justify-between items-center mb-3"><h2 className="font-bold text-stone-800">Libro Diario</h2><button onClick={descargarExcel} className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"><Download className="w-3 h-3" /> Excel</button></div>
            <div className="space-y-2">
              {libroDiario.map((l, i) => (
                <div key={i} className="bg-white rounded-xl p-3 border border-stone-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-stone-500">{l.fecha.split('-')[2]}/{l.fecha.split('-')[1]}</span>
                    <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">{l.cuenta}</span>
                  </div>
                  <p className="text-sm font-medium text-stone-800 mb-2">{l.concepto}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600 font-bold">{l.ingreso > 0 ? '$' + l.ingreso.toLocaleString() : ''}</span>
                    <span className="text-rose-600 font-bold">{l.egreso > 0 ? '-$' + l.egreso.toLocaleString() : ''}</span>
                  </div>
                </div>
              ))}
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <p className="text-sm font-bold text-stone-700">Total Ingresos: <span className="text-emerald-600">${totalIngresos.toLocaleString()}</span></p>
              </div>
              <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
                <p className="text-sm font-bold text-stone-700">Total Egresos: <span className="text-rose-600">${totalEgresos.toLocaleString()}</span></p>
              </div>
            </div>
          </div>
        )}

        {/* BALANCE - texto oscuro */}
        {tab === 'balance' && (
          <div className="bg-white rounded-2xl p-5 border border-stone-200">
            <h3 className="font-bold text-stone-800 mb-3">Balance General Simplificado</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-stone-700 font-medium">Caja</span><span className="text-stone-800">$292,500</span></div>
              <div className="flex justify-between"><span className="text-stone-700 font-medium">Inventario</span><span className="text-stone-800">$1,850,000</span></div>
              <div className="flex justify-between"><span className="text-stone-700 font-medium">Cuentas por Cobrar</span><span className="text-stone-800">$120,000</span></div>
              <hr /><div className="flex justify-between font-bold text-stone-900"><span>Total Activos</span><span>$2,262,500</span></div>
              <hr /><div className="flex justify-between"><span className="text-stone-700 font-medium">Cuentas por Pagar</span><span className="text-rose-600">$180,000</span></div>
              <div className="flex justify-between"><span className="text-stone-700 font-medium">Prestamos</span><span className="text-rose-600">$500,000</span></div>
              <hr /><div className="flex justify-between font-bold text-stone-900"><span>Total Pasivos</span><span className="text-rose-600">$680,000</span></div>
              <hr /><div className="flex justify-between font-bold text-base text-stone-900"><span>Patrimonio Neto</span><span className="text-emerald-600">$1,582,500</span></div>
            </div>
          </div>
        )}

        {/* CIERRE CAJA - texto oscuro */}
        {tab === 'cierre' && (
          <div className="bg-white rounded-2xl p-5 border border-stone-200">
            <h3 className="font-bold text-stone-800 mb-4">Cierre de Caja</h3>
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between"><span className="text-stone-700 font-medium">Ventas totales hoy</span><span className="font-bold text-stone-800">${ventasHoy.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-stone-700 font-medium">Efectivo esperado (65%)</span><span className="font-bold text-stone-800">${(ventasHoy * 0.65).toLocaleString()}</span></div>
            </div>
            <label className="block text-sm font-bold text-stone-700 mb-2">Efectivo contado en caja</label>
            <input type="number" value={efectivoContado} onChange={e => setEfectivoContado(e.target.value)} placeholder="Ingresa el efectivo fisico" className="w-full p-4 text-xl text-center bg-stone-100 rounded-2xl mb-3 text-stone-900" />
            <button onClick={calcularCierre} disabled={!efectivoContado} className="w-full bg-stone-800 text-white rounded-2xl py-4 font-bold disabled:opacity-50">Calcular Cuadre</button>
            {resultadoCierre && (
              <div className={'mt-4 p-4 rounded-2xl font-bold text-sm ' + (resultadoCierre.startsWith('✅') ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300')}>
                {resultadoCierre}
              </div>
            )}
          </div>
        )}

        {/* API - sin cambios */}
        {tab === 'api' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-stone-200">
              <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2"><Link2 className="w-4 h-4" /> Conexion API Contable</h3>
              <p className="text-sm text-stone-700 mb-4">Conecta SIGEA con software contable legalizado ante la DIAN.</p>
              <div className="bg-stone-50 rounded-xl p-4 mb-3">
                <h4 className="font-bold text-stone-700 text-sm mb-2">Endpoints disponibles</h4>
                <div className="space-y-2 text-xs">
                  {['GET /api/finanzas/libro-diario','GET /api/finanzas/balance','GET /api/finanzas/pyg','POST /api/finanzas/exportar-dian'].map(e => (
                    <div key={e} className="flex justify-between items-center py-1.5 border-b border-stone-200 last:border-0">
                      <span className="font-medium text-stone-700">{e}</span>
                      <span className={e.includes('POST') ? 'bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px]' : 'bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px]'}>{e.includes('POST') ? 'Proximamente' : 'Activo'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <h4 className="font-bold text-purple-700 text-sm mb-2 flex items-center gap-2"><Building className="w-4 h-4" /> Software Compatible</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['SIIGO','Alegra','Siesa','Helisa','SAP','WorldOffice'].map(s => <span key={s} className="text-purple-600 font-medium">{s}</span>)}
                </div>
              </div>
              <div className="mt-4 bg-stone-50 rounded-xl p-4">
                <h4 className="font-bold text-stone-700 text-sm mb-2">Configuracion</h4>
                <div className="space-y-2">
                  <input placeholder="URL del software contable" className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900" />
                  <input placeholder="API Key / Token" type="password" className="w-full p-2.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900" />
                  <button onClick={() => alert('API configurada. Los datos se exportaran automaticamente.')} className="w-full bg-purple-500 text-white rounded-xl py-2.5 text-sm font-bold">Conectar API</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

