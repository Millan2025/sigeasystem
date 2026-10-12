"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { BookOpen, Package, ShoppingBag, Armchair, ShoppingCart, Megaphone, CheckCircle2, ChevronRight, ChevronLeft, X, Sparkles, Lightbulb } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function GuiaPasoAPaso({ tenantId, negocioNombre, onClose }) {
  const [moduloActual, setModuloActual] = useState("inicio");
  const [pasoActual, setPasoActual] = useState(0);
  const [progresoCompletado, setProgresoCompletado] = useState(new Set());

  useEffect(() => {
    cargarProgreso();
  }, [tenantId]);

  const cargarProgreso = async () => {
    try {
      const { data } = await supabase.from('progreso_guias').select('modulo').eq('tenant_id', tenantId).eq('completado', true);
      if (data) setProgresoCompletado(new Set(data.map((p) => p.modulo)));
    } catch (e) { console.error('Error cargando progreso:', e); }
  };

  const marcarModuloCompletado = async (modulo) => {
    try {
      await supabase.from('progreso_guias').upsert({ tenant_id: tenantId, modulo, completado: true, completado_en: new Date().toISOString() }, { onConflict: 'tenant_id,modulo' });
      setProgresoCompletado(prev => new Set([...prev, modulo]));
    } catch (e) { console.error('Error guardando progreso:', e); }
  };

  const ORDEN_MODULOS = ["inicio", "inventario", "compras", "mesas", "pos", "marketing", "final"];
  
  const GUIAS = {
    inicio: { id: "inicio", titulo: "¡Bienvenido a SIGEA!", subtitulo: "Vamos a preparar tu negocio paso a paso", icono: Sparkles, color: "from-amber-400 to-orange-500", pasos: [] },
    inventario: { id: "inventario", titulo: "Paso 1: Dale vida a tu menú", subtitulo: "Registra todo lo que vendes", icono: Package, color: "from-amber-400 to-amber-600", pasos: [
      { titulo: "Abre el módulo Inventario", descripcion: "Haz clic en el botón 'Inventario' del dashboard principal.", icono: "📦" },
      { titulo: "Agrega un producto nuevo", descripcion: "Haz clic en '+ Nuevo Producto' y llena: nombre, precio de venta y costo.", icono: "➕" },
      { titulo: "Define el stock mínimo", descripcion: "Ejemplo: si vendes pan, pon mínimo 10. El sistema te avisará cuando baje.", icono: "📊", tip: "¡El costo es clave! Así SIGEA calcula tu ganancia real." },
      { titulo: "Sube una foto", descripcion: "Una buena foto vende más. Toma la foto desde tu celular.", icono: "📸" }
    ]},
    compras: { id: "compras", titulo: "Paso 2: Repone tu despensa", subtitulo: "Registra tus compras a proveedores", icono: ShoppingBag, color: "from-indigo-400 to-indigo-600", pasos: [
      { titulo: "Abre el módulo Compras", descripcion: "Verás en rojo los productos con stock bajo.", icono: "🚚" },
      { titulo: "Selecciona qué comprar", descripcion: "Marca los productos que necesitas reponer.", icono: "✅" },
      { titulo: "Elige tu proveedor", descripcion: "Selecciona de la lista o crea uno nuevo con nombre y teléfono.", icono: "🏪" },
      { titulo: "Registra la compra", descripcion: "Haz clic en 'Registrar Compra'. ¡El inventario se actualiza solo!", icono: "🎉", tip: "Magia: el gasto se registra en Finanzas automáticamente." }
    ]},
    mesas: { id: "mesas", titulo: "Paso 3: Prepara tus mesas", subtitulo: "Crea códigos QR para pedidos digitales", icono: Armchair, color: "from-yellow-400 to-yellow-600", pasos: [
      { titulo: "Abre el módulo Mesas", descripcion: "Haz clic en 'Mesas' en el dashboard.", icono: "🪑" },
      { titulo: "Genera un rango de mesas", descripcion: "Ejemplo: prefijo 'M', del 1 al 10. ¡En 1 segundo tendrás 10 mesas!", icono: "⚡" },
      { titulo: "Imprime los QRs", descripcion: "Haz clic en 'Imprimir Hoja A4'. Saldrán todos los QRs listos.", icono: "🖨️" },
      { titulo: "Plastifica y pega", descripcion: "Recorta cada QR, plastifícalo y pégalo en su mesa correspondiente.", icono: "🪑", tip: "Pégalo en una esquina visible, ¡no debajo del plato!" }
    ]},
    pos: { id: "pos", titulo: "Paso 4: ¡A vender!", subtitulo: "Todo está listo para cobrar", icono: ShoppingCart, color: "from-emerald-400 to-emerald-600", pasos: [
      { titulo: "Abre el módulo POS", descripcion: "Verás tus productos con sus fotos en pantalla.", icono: "💰" },
      { titulo: "Toca los productos", descripcion: "El cliente te dice qué quiere. Toca cada producto y se suma al carrito.", icono: "👆" },
      { titulo: "Haz clic en COBRAR", descripcion: "El botón verde grande abajo. Se abre el modal de pago.", icono: "🟢" },
      { titulo: "Elige método de pago", descripcion: "Efectivo, Nequi, Daviplata, tarjeta... lo que use el cliente.", icono: "💳", tip: "Tip Pro: siempre pide el teléfono del cliente para sumarle sellos de fidelidad." }
    ]},
    marketing: { id: "marketing", titulo: "Paso 5: Haz que vuelvan", subtitulo: "Envía mensajes y crea cupones", icono: Megaphone, color: "from-fuchsia-400 to-fuchsia-600", pasos: [
      { titulo: "Abre el módulo Marketing", descripcion: "Aquí están tus clientes y campañas.", icono: "📣" },
      { titulo: "Elige un segmento", descripcion: "Ejemplo: 'Clientes inactivos (+30 días)'. El sistema te dice cuántos son.", icono: "🎯" },
      { titulo: "Escribe tu mensaje", descripcion: "Sé claro y con gancho. Ej: '¡Te extrañamos! Vuelve con 20% OFF'.", icono: "✍️" },
      { titulo: "Activa un cupón", descripcion: "Crea un código como 'VUELVE20' con 20% de descuento.", icono: "🎟️", tip: "Los cupones con fecha corta (48h) se redimen 3x más." }
    ]},
    final: { id: "final", titulo: "¡Lo lograste!", subtitulo: "Tu negocio está listo para brillar", icono: CheckCircle2, color: "from-green-400 to-emerald-600", pasos: [] }
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-8 rounded-t-3xl text-white relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-xl transition"><X className="w-6 h-6" /></button>
            <Sparkles className="w-16 h-16 mb-4" />
            <h1 className="text-4xl font-extrabold mb-2">¡Bienvenido a SIGEA!</h1>
            <p className="text-xl opacity-90">Vamos a preparar tu negocio paso a paso. Es más fácil de lo que crees.</p>
          </div>
          <div className="p-8">
            <h2 className="text-2xl font-bold text-stone-900 mb-4">📋 Antes de empezar, ten a la mano:</h2>
            <div className="space-y-3 mb-8">
              {[{ icono: "🏪", texto: "Datos de tu negocio: nombre, NIT, dirección, teléfono y logo" },
                { icono: "📦", texto: "Tus productos: nombre, precio de venta, costo y stock mínimo" },
                { icono: "📸", texto: "Fotos de tus productos (¡una buena foto vende más!)" },
                { icono: "🚚", texto: "Tus proveedores: nombres y teléfonos" }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-2xl">{item.icono}</span>
                  <p className="text-stone-700 font-medium">{item.texto}</p>
                </div>
              ))}
            </div>
            <button onClick={siguiente} className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl font-extrabold text-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all hover:scale-[1.02]">
              ¡Entendido, vamos a configurar! <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (moduloActual === "final") {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-12 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              {[...Array(15)].map((_, i) => (<div key={i} className="absolute animate-ping" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s` }}>🎊</div>))}
            </div>
            <div className="relative z-10">
              <div className="text-8xl mb-4">🏆</div>
              <h1 className="text-5xl font-extrabold mb-3">¡Lo lograste!</h1>
              <p className="text-2xl opacity-95">Has configurado tu negocio como un profesional.</p>
            </div>
          </div>
          <div className="p-8">
            <div className="space-y-3 mb-8">
              {[{ icono: "📦", texto: "Tu inventario está al día" }, { icono: "🪑", texto: "Tus mesas tienen códigos QR" }, { icono: "💰", texto: "Estás listo para vender y ver ganancias en tiempo real" }, { icono: "📣", texto: "Puedes enviar campañas para que tus clientes vuelvan" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  <span className="text-2xl">{item.icono}</span>
                  <p className="text-stone-800 font-semibold">{item.texto}</p>
                </div>
              ))}
            </div>
            <button onClick={onClose} className="w-full py-4 bg-gradient-to-r from-stone-800 to-stone-900 text-white rounded-2xl font-extrabold text-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all hover:scale-[1.02]">
              Ir al Dashboard Principal 🏠
            </button>
          </div>
        </div>
      </div>
    );
  }

  const paso = guia.pasos[pasoActual];
  const progresoPorcentaje = ((pasoActual + 1) / totalPasos) * 100;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className={`bg-gradient-to-br ${guia.color} p-6 text-white relative`}>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-xl transition"><X className="w-6 h-6" /></button>
          <div className="flex items-center gap-4 mb-3">
            <Icono className="w-12 h-12" />
            <div><h2 className="text-2xl font-extrabold">{guia.titulo}</h2><p className="text-lg opacity-90">{guia.subtitulo}</p></div>
          </div>
          <div className="bg-white/20 rounded-full h-2 overflow-hidden"><div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: `${progresoPorcentaje}%` }} /></div>
          <p className="text-sm mt-2 opacity-90">Paso {pasoActual + 1} de {totalPasos}</p>
        </div>
        <div className="p-8">
          <div className="mb-8">
            <div className="flex items-start gap-4">
              <span className="text-5xl">{paso.icono}</span>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-stone-900 mb-3">{paso.titulo}</h3>
                <p className="text-lg text-stone-700 leading-relaxed">{paso.descripcion}</p>
                {paso.tip && (
                  <div className="mt-4 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-stone-700 text-sm"><strong>Consejo:</strong> {paso.tip}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={anterior} disabled={indiceModulo === 1 && pasoActual === 0} className="flex-1 py-4 border-2 border-stone-300 text-stone-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-50 transition disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronLeft className="w-5 h-5" /> Anterior
            </button>
            <button onClick={siguiente} className="flex-[2] py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-2xl font-extrabold flex items-center justify-center gap-2 hover:shadow-xl transition-all hover:scale-[1.02]">
              {esUltimoPaso ? "¡Completar módulo!" : "Siguiente paso"} <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="border-t border-stone-200 p-6 bg-stone-50">
          <p className="text-sm font-semibold text-stone-600 mb-3">Saltar a otro módulo:</p>
          <div className="flex flex-wrap gap-2">
            {ORDEN_MODULOS.filter(m => m !== "inicio" && m !== "final").map((m) => {
              const g = GUIAS[m];
              const IconoM = g.icono;
              const completado = progresoCompletado.has(m);
              return (
                <button key={m} onClick={() => { setModuloActual(m); setPasoActual(0); }} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition ${moduloActual === m ? 'bg-amber-500 text-white' : completado ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100'}`}>
                  <IconoM className="w-4 h-4" />
                  {g.titulo.replace("Paso ", "").split(":")[0]}
                  {completado && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
