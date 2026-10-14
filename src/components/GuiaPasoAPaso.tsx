"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Package, ShoppingBag, Armchair, ShoppingCart, Megaphone, CheckCircle2, ChevronRight, ChevronLeft, X, Sparkles, Lightbulb, BookOpen } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface GuiaPasoAPasoProps {
  tenantId: string;
  negocioNombre?: string;
  onClose: () => void;
  onOpenCentroAyuda?: () => void;
}

type ModuloId = "inicio" | "inventario" | "compras" | "mesas" | "pos" | "marketing" | "final";

interface PasoGuia {
  titulo: string;
  descripcion: string;
  icono: string;
  tip?: string;
}

interface GuiaModulo {
  id: ModuloId;
  titulo: string;
  subtitulo: string;
  icono: any;
  color: string;
  pasos: PasoGuia[];
}

const GUIAS: Record<ModuloId, GuiaModulo> = {
  inicio: { id: "inicio", titulo: "¡Bienvenido!", subtitulo: "Prepara tu negocio paso a paso", icono: Sparkles, color: "from-amber-400 to-orange-500", pasos: [] },
  inventario: { id: "inventario", titulo: "Paso 1: Tu menú", subtitulo: "Registra lo que vendes", icono: Package, color: "from-amber-400 to-amber-600", pasos: [
    { titulo: "Abre Inventario", descripcion: "En el dashboard, toca el botón 'Inventario'.", icono: "📦" },
    { titulo: "Agrega un producto", descripcion: "Toca '+ Nuevo Producto' y llena nombre, precio y costo.", icono: "➕", tip: "¡El costo es clave! Así SIGEA calcula tu ganancia real." },
    { titulo: "Define stock mínimo", descripcion: "Ejemplo: mínimo 10 unidades. El sistema te avisará cuando baje.", icono: "📊" },
    { titulo: "Sube una foto", descripcion: "Una buena foto vende más. Tómala desde tu celular.", icono: "📸" }
  ]},
  compras: { id: "compras", titulo: "Paso 2: Repón stock", subtitulo: "Registra tus compras", icono: ShoppingBag, color: "from-indigo-400 to-indigo-600", pasos: [
    { titulo: "Abre Compras", descripcion: "Verás en rojo los productos con stock bajo.", icono: "🚚" },
    { titulo: "Selecciona qué comprar", descripcion: "Marca los productos que necesitas reponer.", icono: "✅" },
    { titulo: "Elige proveedor", descripcion: "Selecciona de la lista o crea uno nuevo.", icono: "🏪" },
    { titulo: "Registra la compra", descripcion: "Toca 'Registrar Compra'. ¡El inventario se actualiza solo!", icono: "🎉", tip: "El gasto se registra en Finanzas automáticamente." }
  ]},
  mesas: { id: "mesas", titulo: "Paso 3: Mesas QR", subtitulo: "Pedidos digitales", icono: Armchair, color: "from-yellow-400 to-yellow-600", pasos: [
    { titulo: "Abre Mesas", descripcion: "En el dashboard, toca 'Mesas'.", icono: "🪑" },
    { titulo: "Genera rango", descripcion: "Ejemplo: prefijo 'M', del 1 al 10. ¡En 1 segundo!", icono: "⚡" },
    { titulo: "Imprime QRs", descripcion: "Toca 'Imprimir Hoja A4'. Saldrán todos listos.", icono: "🖨️" },
    { titulo: "Plastifica y pega", descripcion: "Recorta y pega cada QR en su mesa.", icono: "🪑", tip: "Pégalo visible, ¡no debajo del plato!" }
  ]},
  pos: { id: "pos", titulo: "Paso 4: ¡A vender!", subtitulo: "Todo listo para cobrar", icono: ShoppingCart, color: "from-emerald-400 to-emerald-600", pasos: [
    { titulo: "Abre el POS", descripcion: "Verás tus productos con fotos.", icono: "💰" },
    { titulo: "Toca productos", descripcion: "El cliente te dice qué quiere. Toca cada uno.", icono: "👆" },
    { titulo: "Toca COBRAR", descripcion: "Botón verde grande abajo.", icono: "🟢" },
    { titulo: "Elige método de pago", descripcion: "Efectivo, Nequi, Daviplata, tarjeta...", icono: "💳", tip: "Tip Pro: pide el teléfono para fidelizar." }
  ]},
  marketing: { id: "marketing", titulo: "Paso 5: Fideliza", subtitulo: "Haz que vuelvan", icono: Megaphone, color: "from-fuchsia-400 to-fuchsia-600", pasos: [
    { titulo: "Abre Marketing", descripcion: "Aquí están tus clientes y campañas.", icono: "📣" },
    { titulo: "Elige segmento", descripcion: "Ejemplo: 'Inactivos (+30 días)'.", icono: "🎯" },
    { titulo: "Escribe mensaje", descripcion: "Sé claro: '¡Te extrañamos! Vuelve con 20% OFF'.", icono: "✍️" },
    { titulo: "Crea cupón", descripcion: "Código 'VUELVE20' con 20% OFF.", icono: "🎟️", tip: "Cupones con fecha corta (48h) se redimen 3x más." }
  ]},
  final: { id: "final", titulo: "¡Lo lograste!", subtitulo: "Tu negocio está listo", icono: CheckCircle2, color: "from-green-400 to-emerald-600", pasos: [] }
};

const ORDEN_MODULOS: ModuloId[] = ["inicio", "inventario", "compras", "mesas", "pos", "marketing", "final"];

export default function GuiaPasoAPaso({ tenantId, negocioNombre, onClose, onOpenCentroAyuda }: GuiaPasoAPasoProps) {
  const [moduloActual, setModuloActual] = useState<ModuloId>("inicio");
  const [pasoActual, setPasoActual] = useState(0);
  const [progresoCompletado, setProgresoCompletado] = useState<Set<string>>(new Set());

  useEffect(() => { cargarProgreso(); }, [tenantId]);

  const cargarProgreso = async () => {
    try {
      const { data } = await supabase.from('progreso_guias').select('modulo').eq('tenant_id', tenantId).eq('completado', true);
      if (data) setProgresoCompletado(new Set(data.map((p: any) => p.modulo)));
    } catch (e) { console.error('Error:', e); }
  };

  const marcarModuloCompletado = async (modulo: string) => {
    try {
      await supabase.from('progreso_guias').upsert({ tenant_id: tenantId, modulo, completado: true, completado_en: new Date().toISOString() }, { onConflict: 'tenant_id,modulo' });
      setProgresoCompletado(prev => new Set([...prev, modulo]));
    } catch (e) { console.error('Error:', e); }
  };

  const guia = GUIAS[moduloActual];
  const totalPasos = guia.pasos.length;
  const esUltimoPaso = pasoActual >= totalPasos - 1;
  const indiceModulo = ORDEN_MODULOS.indexOf(moduloActual);

  const siguiente = async () => {
    if (moduloActual === "inicio") { setModuloActual("inventario"); setPasoActual(0); }
    else if (moduloActual === "final") { onClose(); }
    else if (esUltimoPaso) {
      await marcarModuloCompletado(moduloActual);
      const siguienteModulo = ORDEN_MODULOS[indiceModulo + 1];
      if (siguienteModulo) { setModuloActual(siguienteModulo); setPasoActual(0); }
    } else { setPasoActual(pasoActual + 1); }
  };

  const anterior = () => {
    if (pasoActual > 0) { setPasoActual(pasoActual - 1); }
    else if (indiceModulo > 0) {
      const anteriorModulo = ORDEN_MODULOS[indiceModulo - 1];
      setModuloActual(anteriorModulo);
      setPasoActual(GUIAS[anteriorModulo].pasos.length - 1);
    }
  };

  const Icono = guia.icono;

  if (moduloActual === "inicio") {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3">
        <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl">
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-5 text-white relative rounded-t-2xl">
            <button onClick={onClose} className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
            <Sparkles className="w-10 h-10 mb-2" />
            <h1 className="text-2xl font-extrabold mb-1">¡Bienvenido!</h1>
            <p className="text-sm opacity-95">Prepara tu negocio paso a paso.</p>
          </div>
          <div className="p-5">
            <h2 className="text-base font-bold text-stone-900 mb-3">📋 Ten a la mano:</h2>
            <div className="space-y-2 mb-5">
              {[
                { icono: "🏪", texto: "Datos del negocio (nombre, NIT, logo)" },
                { icono: "📦", texto: "Productos (nombre, precio, costo, stock)" },
                { icono: "📸", texto: "Fotos de tus productos" },
                { icono: "🚚", texto: "Proveedores (nombres y teléfonos)" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-xl">{item.icono}</span>
                  <p className="text-sm text-stone-700 font-medium">{item.texto}</p>
                </div>
              ))}
            </div>
            <button onClick={siguiente} className="w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-extrabold flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95">
              ¡Empezar! <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (moduloActual === "final") {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-8 text-white text-center relative">
            <div className="text-6xl mb-3">🏆</div>
            <h1 className="text-3xl font-extrabold mb-1">¡Lo lograste!</h1>
            <p className="text-base opacity-95">Tu negocio está listo para brillar.</p>
          </div>
          <div className="p-5">
            <div className="flex gap-2">
              <button onClick={() => { onClose(); if (onOpenCentroAyuda) onOpenCentroAyuda(); }} className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-extrabold flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95 text-sm">
                <BookOpen className="w-5 h-5" /> Centro de Ayuda
              </button>
              <button onClick={onClose} className="flex-1 py-3 bg-gradient-to-r from-stone-800 to-stone-900 text-white rounded-xl font-extrabold flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95 text-sm">
                Ir al Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const paso = guia.pasos[pasoActual];
  const progresoPorcentaje = ((pasoActual + 1) / totalPasos) * 100;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className={`bg-gradient-to-br ${guia.color} p-4 text-white relative rounded-t-2xl`}>
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Icono className="w-9 h-9" />
            <div>
              <h2 className="text-lg font-extrabold">{guia.titulo}</h2>
              <p className="text-xs opacity-90">{guia.subtitulo}</p>
            </div>
          </div>
          <div className="bg-white/20 rounded-full h-1.5 overflow-hidden">
            <div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: `${progresoPorcentaje}%` }} />
          </div>
          <p className="text-xs mt-1.5 opacity-90">Paso {pasoActual + 1} de {totalPasos}</p>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <div className="flex items-start gap-3">
              <span className="text-4xl flex-shrink-0">{paso.icono}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-stone-900 mb-1.5">{paso.titulo}</h3>
                <p className="text-sm text-stone-700 leading-relaxed">{paso.descripcion}</p>
                {paso.tip && (
                  <div className="mt-3 bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-stone-700"><strong>Tip:</strong> {paso.tip}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={anterior} disabled={indiceModulo === 1 && pasoActual === 0} className="flex-1 py-3 border-2 border-stone-300 text-stone-700 rounded-xl font-bold flex items-center justify-center gap-1 hover:bg-stone-50 transition disabled:opacity-40 disabled:cursor-not-allowed text-sm">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <button onClick={siguiente} className="flex-[2] py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-extrabold flex items-center justify-center gap-1 hover:shadow-lg transition-all active:scale-95 text-sm">
              {esUltimoPaso ? "¡Completar!" : "Siguiente"} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

