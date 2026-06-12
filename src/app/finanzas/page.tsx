'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, TrendingUp, TrendingDown, DollarSign, Calculator, FileText, Calendar, Eye } from 'lucide-react'

const ventasHoy = 450000
const comprasHoy = 180000
const nominaHoy = 85000
const gastosHoy = 45000
const utilidadHoy = ventasHoy - comprasHoy - nominaHoy - gastosHoy

const libroDiario = [
  { fecha: '2025-06-11', concepto: 'Venta mostrador', ingreso: 450000, egreso: 0 },
  { fecha: '2025-06-11', concepto: 'Compra harina El Trigo', ingreso: 0, egreso: 120000 },
  { fecha: '2025-06-11', concepto: 'Compra azucar', ingreso: 0, egreso: 60000 },
  { fecha: '2025-06-11', concepto: 'Nomina Carlos Gomez', ingreso: 0, egreso: 50000 },
  { fecha: '2025-06-11', concepto: 'Nomina Maria Lopez', ingreso: 0, egreso: 35000 },
  { fecha: '2025-06-11', concepto: 'Servicios publicos', ingreso: 0, egreso: 25000 },
  { fecha: '2025-06-11', concepto: 'Arriendo local', ingreso: 0, egreso: 20000 },
]

const totalIngresos = libroDiario.reduce((s, l) => s + l.ingreso, 0)
const totalEgresos = libroDiario.reduce((s, l) => s + l.egreso, 0)
const balance = totalIngresos - totalEgresos

export default function FinanzasPage() {
  const [tab, setTab] = useState<'resumen'|'libro'|'balance'|'cierre'>('resumen')
  const [showCierre, setShowCierre] = useState(false)
  const [efectivoContado, setEfectivoContado] = useState('')
  const [resultadoCierre, setResultadoCierre] = useState('')

  const tabs = [
    { id: 'resumen' as const, label: 'Resumen', icon: TrendingUp },
    { id: 'libro' as const, label: 'Libro Diario', icon: FileText },
    { id: 'balance' as const, label: 'Balance', icon: Calculator },
    { id: 'cierre' as const, label: 'Cierre Caja', icon: DollarSign },
  ]

  function descargarExcel() {
    var csv = 'Fecha,Concepto,Ingreso,Egreso\n'
    libroDiario.forEach(function(l) {
      csv += l.fecha + ',' + l.concepto + ',' + l.ingreso + ',' + l.egreso + '\n'
    })
    csv += ',,,\n'
    csv += 'TOTAL INGRESOS,,' + totalIngresos + ',\n'
    csv += 'TOTAL EGRESOS,,,' + totalEgresos + '\n'
    csv += 'BALANCE,,,' + balance + '\n'
    
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    var url = URL.createObjectURL(blob)
    var a = document.createElement('a')
    a.href = url
    a.download = 'libro_diario_' + new Date().toISOString().split('T')[0] + '.csv'
    a.click()
  }

  function calcularCierre() {
    var contado = Number(efectivoContado)
    if (!contado) return
    var efectivoEsperado = ventasHoy * 0.65
    var diferencia = contado - efectivoEsperado
    var porcentaje = ((Math.abs(diferencia) / efectivoEsperado) * 100).toFixed(1)
    
    if (Math.abs(diferencia) > efectivoEsperado * 0.02) {
      setResultadoCierre('⚠️ DESCUADRE: Diferencia de $' + Math.abs(diferencia).toLocaleString() + ' (' + porcentaje + '%). Revisar ventas del dia.')
    } else {
      setResultadoCierre('✅ CUADRE CORRECTO: Diferencia de solo $' + Math.abs(diferencia).toLocaleString() + ' (' + porcentaje + '%). Todo en orden.')
    }
    setShowCierre(true)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-5">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/" className="p-2 hover:bg-white/10 rounded-xl"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-xl font-bold">🏦 Finanzas</h1>
            <p className="text-stone-400 text-sm">Panaderia Doña Rosa</p>
          </div>
        </div>
        <div className="flex gap-1 bg-stone-700 rounded-xl p-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium ' + (tab === t.id ? 'bg-white text-stone-800' : 'text-stone-300')}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4">
        {tab === 'resumen' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-stone-200">
                <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-emerald-500" /><span className="text-xs text-stone-500">Ingresos</span></div>
                <p className="text-2xl font-bold text-emerald-600">${totalIngresos.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-stone-200">
                <div className="flex items-center gap-2 mb-1"><TrendingDown className="w-4 h-4 text-rose-500" /><span className="text-xs text-stone-500">Egresos</span></div>
                <p className="text-2xl font-bold text-rose-600">${totalEgresos.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-stone-200">
                <div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-amber-500" /><span className="text-xs text-stone-500">Nomina</span></div>
                <p className="text-2xl font-bold text-amber-600">${nominaHoy.toLocaleString()}</p>
              </div>
              <div className={'rounded-2xl p-4 border ' + (utilidadHoy >= 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300')}>
                <div className="flex items-center gap-2 mb-1"><Calculator className="w-4 h-4" /><span className="text-xs text-stone-500">Utilidad</span></div>
                <p className={'text-2xl font-bold ' + (utilidadHoy >= 0 ? 'text-emerald-600' : 'text-rose-600')}>${utilidadHoy.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200">
              <h3 className="font-bold text-stone-800 mb-3">Estado de Resultados (P&G)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-stone-500">Ventas Totales</span><span className="font-medium text-emerald-600">${ventasHoy.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Compras Proveedores</span><span className="font-medium text-rose-600">-${comprasHoy.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Nomina</span><span className="font-medium text-rose-600">-${nominaHoy.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Gastos Operativos</span><span className="font-medium text-rose-600">-${gastosHoy.toLocaleString()}</span></div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-lg"><span>Utilidad Neta</span><span className={utilidadHoy >= 0 ? 'text-emerald-600' : 'text-rose-600'}>${utilidadHoy.toLocaleString()}</span></div>
              </div>
            </div>

            <button onClick={descargarExcel} className="w-full bg-emerald-500 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2">
              <Download className="w-5 h-5" /> Descargar para Contador (Excel)
            </button>
          </div>
        )}

        {tab === 'libro' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-stone-800">Libro Diario</h2>
              <button onClick={descargarExcel} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1"><Download className="w-4 h-4" /> Excel</button>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="grid grid-cols-4 gap-2 p-3 bg-stone-100 text-xs font-medium text-stone-600">
                <span>Fecha</span><span>Concepto</span><span className="text-right">Ingreso</span><span className="text-right">Egreso</span>
              </div>
              {libroDiario.map((l, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 p-3 text-sm border-b border-stone-100">
                  <span className="text-stone-400">{l.fecha.split('-')[2]}/{l.fecha.split('-')[1]}</span>
                  <span className="text-stone-700">{l.concepto}</span>
                  <span className="text-right text-emerald-600">{l.ingreso > 0 ? '$'+l.ingreso.toLocaleString() : ''}</span>
                  <span className="text-right text-rose-600">{l.egreso > 0 ? '$'+l.egreso.toLocaleString() : ''}</span>
                </div>
              ))}
              <div className="grid grid-cols-4 gap-2 p-3 bg-stone-50 font-bold text-sm">
                <span></span><span>TOTALES</span>
                <span className="text-right text-emerald-600">${totalIngresos.toLocaleString()}</span>
                <span className="text-right text-rose-600">${totalEgresos.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {tab === 'balance' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-stone-200">
              <h3 className="font-bold text-stone-800 mb-3">Balance General Simplificado</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-stone-500">Caja</span><span className="font-medium">$292,500</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Inventario</span><span className="font-medium">$1,850,000</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Cuentas por Cobrar</span><span className="font-medium">$120,000</span></div>
                <hr />
                <div className="flex justify-between font-bold"><span>Total Activos</span><span>$2,262,500</span></div>
                <hr />
                <div className="flex justify-between"><span className="text-stone-500">Cuentas por Pagar</span><span className="font-medium text-rose-600">$180,000</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Prestamos</span><span className="font-medium text-rose-600">$500,000</span></div>
                <hr />
                <div className="flex justify-between font-bold"><span>Total Pasivos</span><span className="text-rose-600">$680,000</span></div>
                <hr />
                <div className="flex justify-between font-bold text-lg"><span>Patrimonio Neto</span><span className="text-emerald-600">$1,582,500</span></div>
              </div>
            </div>
          </div>
        )}

        {tab === 'cierre' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-stone-200">
              <h3 className="font-bold text-stone-800 mb-4">Cierre de Caja</h3>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between"><span>Ventas totales hoy</span><span className="font-bold">${ventasHoy.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Efectivo esperado (65%)</span><span className="font-bold">${(ventasHoy * 0.65).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Nequi esperado (20%)</span><span>${(ventasHoy * 0.20).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Daviplata esperado (15%)</span><span>${(ventasHoy * 0.15).toLocaleString()}</span></div>
              </div>
              <label className="block text-sm font-medium text-stone-600 mb-2">Efectivo contado en caja</label>
              <input type="number" value={efectivoContado} onChange={e => setEfectivoContado(e.target.value)} placeholder="Ingresa el efectivo fisico" className="w-full p-4 text-xl text-center bg-stone-100 rounded-2xl mb-3" />
              <button onClick={calcularCierre} disabled={!efectivoContado} className="w-full bg-stone-800 text-white rounded-2xl py-4 font-bold disabled:opacity-50">Calcular Cuadre</button>
              {showCierre && resultadoCierre && (
                <div className={'mt-4 p-4 rounded-2xl ' + (resultadoCierre.startsWith('✅') ? 'bg-emerald-50 border border-emerald-300' : 'bg-red-50 border border-red-300')}>
                  <p className="font-medium text-sm">{resultadoCierre}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}