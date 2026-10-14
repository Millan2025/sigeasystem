"use client";
import { useState } from "react";
import { X, ArrowLeft, BookOpen, LayoutDashboard, ShoppingCart, Package, ShoppingBag, Receipt, TrendingUp, Truck, Armchair, CreditCard, ChefHat, BarChart3, UserCheck, Heart, Megaphone, Gamepad2 } from "lucide-react";
import { MODULOS_AYUDA, ModuloAyuda } from "@/data/contenidoAyuda";

const ICONOS: Record<string, any> = {
  dashboard: LayoutDashboard, pos: ShoppingCart, inventario: Package, compras: ShoppingBag,
  facturacion: Receipt, finanzas: TrendingUp, domicilios: Truck, mesas: Armchair,
  creditos: CreditCard, produccion: ChefHat, reportes: BarChart3, personal: UserCheck,
  clientes: Heart, marketing: Megaphone, conecta: Gamepad2
};

interface CentroAyudaProps { onClose: () => void; }

export default function CentroAyuda({ onClose }: CentroAyudaProps) {
  const [modulo, setModulo] = useState<ModuloAyuda | null>(null);

  if (modulo) {
    const Icono = ICONOS[modulo.id] || BookOpen;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3">
        <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
          <div className={`bg-gradient-to-br ${modulo.color} p-5 text-white relative rounded-t-3xl`}>
            <button onClick={() => setModulo(null)} className="absolute top-4 left-4 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition">
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
            <button onClick={onClose} className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 mt-8">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Icono className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold">{modulo.nombre}</h2>
                <p className="text-sm opacity-90 mt-1">{modulo.queEs}</p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-5">
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
              <h3 className="text-sm font-bold text-blue-900 mb-1">Para que sirve</h3>
              <p className="text-sm text-blue-800">{modulo.paraQueSirve}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 mb-2">Como se usa, paso a paso</h3>
              <div className="space-y-2">
                {modulo.pasos.map((paso, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-stone-50 rounded-xl">
                    <div className="w-6 h-6 bg-amber-400 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">{idx + 1}</div>
                    <p className="text-sm text-stone-700">{paso}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
              <h3 className="text-sm font-bold text-amber-900 mb-2">Tips de oro</h3>
              <ul className="space-y-1.5">
                {modulo.tips.map((tip, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-amber-800"><span className="flex-shrink-0">•</span><span>{tip}</span></li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
              <h3 className="text-sm font-bold text-red-900 mb-2">Errores tipicos que debes evitar</h3>
              <ul className="space-y-1.5">
                {modulo.errores.map((err, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-red-800"><span className="flex-shrink-0">✗</span><span>{err}</span></li>
                ))}
              </ul>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
              <h3 className="text-sm font-bold text-emerald-900 mb-1">Ejemplo real</h3>
              <p className="text-sm text-emerald-800">{modulo.ejemplo}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setModulo(null)} className="flex-1 py-3 border-2 border-stone-300 text-stone-700 rounded-xl font-bold text-sm hover:bg-stone-50 transition">Ver otro modulo</button>
              <button onClick={onClose} className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-bold text-sm hover:shadow-lg transition">Volver al Dashboard</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-white relative rounded-t-3xl">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <BookOpen className="w-10 h-10" />
            <div>
              <h2 className="text-2xl font-extrabold">Centro de Ayuda SIGEA</h2>
              <p className="text-sm opacity-90">Toca un modulo para ver su guia completa, en palabras simples</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {MODULOS_AYUDA.map((m) => {
              const Icono = ICONOS[m.id] || BookOpen;
              return (
                <button key={m.id} onClick={() => setModulo(m)} className="group bg-white rounded-2xl border border-stone-200/70 p-4 flex flex-col items-center gap-2.5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <span className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icono className="w-6 h-6 text-white" strokeWidth={2} />
                  </span>
                  <span className="text-[13px] font-semibold text-stone-700 text-center leading-tight">{m.nombre}</span>
                </button>
              );
            })}
          </div>
          <button onClick={onClose} className="w-full mt-5 py-3 bg-stone-900 text-white rounded-xl font-bold text-sm hover:bg-stone-700 transition flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver al Dashboard Principal
          </button>
        </div>
      </div>
    </div>
  );
}
