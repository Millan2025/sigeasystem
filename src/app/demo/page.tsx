"use client";

import Link from "next/link";
import { ShoppingBag, Receipt, Store, Armchair,
  ShoppingCart, ChefHat, Package, Users, Truck, BarChart3, TrendingUp,
  MessageCircle, ArrowRight, CheckCircle2, Zap,
} from "lucide-react";

const NEGOCIOS = [
  { slug: "panaderia", nombre: "Panadería", emoji: "🍞", desc: "Hornadas, mermas y pan del día bajo control" },
  { slug: "carniceria", nombre: "Carnicería", emoji: "🥩", desc: "Pesos, mermas y ganancia por kilo exacta" },
  { slug: "restaurante", nombre: "Restaurante", emoji: "🍽️", desc: "Costo real por plato y cocina sin caos" },
  { slug: "tienda", nombre: "Tienda", emoji: "🛒", desc: "Cientos de productos sin sufrir por inventario" },
  { slug: "salsamentaria", nombre: "Salsamentaria", emoji: "🌭", desc: "Vencimientos y stock siempre al día" },
  { slug: "ferreteria", nombre: "Ferretería", emoji: "🔩", desc: "Miles de referencias bajo control total" },
];

const DOLORES = [
  { emoji: "😰", dolor: "Trabajas 14 horas y al cerrar no sabes si ganaste o perdiste.", solucion: "Con SIGEA ves tu ganancia exacta del día en un solo número." },
  { emoji: "🕳️", dolor: "Se te va plata en mermas, regalos y 'robo hormiga' sin darte cuenta.", solucion: "Inventario con control total: nada se mueve sin que lo veas." },
  { emoji: "🚪", dolor: "Clientes se van a la competencia porque 'hoy no había'.", solucion: "Stock en tiempo real y alertas antes de agotarse." },
  { emoji: "⛓️", dolor: "No puedes ni enfermarte: si no estás, el negocio no vende.", solucion: "Domicilios + Marketing WhatsApp venden por ti, incluso mientras duermes." },
];

const SENSACIONES = [
  { emoji: "😌", titulo: "PAZ", texto: "Cierras el local y duermes: la plata cuadra y nadie te roba." },
  { emoji: "🏆", titulo: "ORGULLO", texto: "Tu negocio con el mismo sistema de las grandes cadenas." },
  { emoji: "🌱", titulo: "CRECIMIENTO", texto: "Decisiones con datos: abres la segunda sede sin miedo." },
];

const MODULOS = [
  { Icon: ShoppingCart, nombre: "Nueva Venta (POS)", color: "border-emerald-300 bg-emerald-50", icon: "text-emerald-600", beneficios: ["Cobra efectivo, Nequi y Daviplata", "Descuenta el inventario él solo", "Venta por peso sin calculadora"] },
  { Icon: ChefHat, nombre: "Producción", color: "border-lime-300 bg-lime-50", icon: "text-lime-600", beneficios: ["Recetas con costo exacto", "Te dice cuánto producir hoy", "Lista de compras automática"] },
  { Icon: Package, nombre: "Inventario", color: "border-amber-300 bg-amber-50", icon: "text-amber-600", beneficios: ["Cero fugas ni robo hormiga", "Alertas antes de agotarse", "Sabes qué producto sí deja plata"] },
  { Icon: Users, nombre: "Personal", color: "border-purple-300 bg-purple-50", icon: "text-purple-600", beneficios: ["Asistencia sin cuaderno", "Nómina sin errores", "Permisos por empleado"] },
  { Icon: Truck, nombre: "Pedidos y Domicilios", color: "border-sky-300 bg-sky-50", icon: "text-sky-600", beneficios: ["Clientes piden desde el celular", "Vendes sin estar en el mostrador", "Reparto con seguimiento"] },
  { Icon: BarChart3, nombre: "Reportes", color: "border-rose-300 bg-rose-50", icon: "text-rose-600", beneficios: ["Top de productos ganadores", "Ventas por hora y por día", "Decisiones con datos, no susto"] },
  { Icon: TrendingUp, nombre: "Finanzas", color: "border-teal-300 bg-teal-50", icon: "text-teal-600", beneficios: ["Ganancia real al día", "Cierre de caja cuadrado", "Listo para el contador"] },
  { Icon: MessageCircle, nombre: "Marketing WhatsApp", color: "border-green-300 bg-green-50", icon: "text-green-600", beneficios: ["Tu anuncio en los grupos del barrio", "Programas 1 vez, publica la semana", "Sin pagarle publicidad a Meta"] },
  { Icon: ShoppingBag, nombre: "Compras a Proveedores", color: "border-indigo-300 bg-indigo-50", icon: "text-indigo-600", beneficios: ["Recomendación automática por bajo stock", "Lista de compras por proveedor", "Órdenes de compra con historial"] },
  { Icon: Receipt, nombre: "Gestión de Créditos", color: "border-pink-300 bg-pink-50", icon: "text-pink-600", beneficios: ["Control de saldos sin errores", "Abonos parciales o totales", "Historial completo por cliente"] },
  { Icon: Store, nombre: "Tienda Online", color: "border-blue-300 bg-blue-50", icon: "text-blue-600", beneficios: ["Clientes piden desde el celular", "Catálogo con carrito de compras", "Enlace listo para WhatsApp"] },
  { Icon: Armchair, nombre: "Mesas con QR", color: "border-yellow-300 bg-yellow-50", icon: "text-yellow-600", beneficios: ["Cliente pide desde su mesa", "Notificación directa a cocina", "Solicita cuenta o mesero al instante"] },
];

export default function DemoIntro() {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-800">
      <style>{`
        @media (max-width: 640px) {
          .text-xs { font-size: 1rem !important; line-height: 1.45 !important; }
          .text-sm { font-size: 1.125rem !important; line-height: 1.45 !important; }
          .text-base { font-size: 1.25rem !important; line-height: 1.45 !important; }
          .text-lg { font-size: 1.45rem !important; }
          .text-xl { font-size: 1.6rem !important; }
        }
      `}</style>
      {/* ===== A · ATENCION ===== */}
      <header className="bg-gradient-to-b from-stone-950 via-stone-900 to-emerald-950 text-white px-4 sm:px-6 pt-8 sm:pt-12 pb-8 sm:pb-12 text-center overflow-hidden">
  <div className="max-w-6xl mx-auto">
    <span className="inline-flex items-center justify-center bg-emerald-500/20 border border-emerald-300 text-emerald-200 text-sm sm:text-base font-extrabold tracking-widest uppercase px-4 py-2 rounded-full shadow-lg">
      Demo interactiva · Sin registro · 2 minutos
    </span>
    <h1 className="mt-5 text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
      ¿Y si tu negocio te diera <span className="text-[#fdb813] drop-shadow-lg">PAZ</span> en vez de dolor de cabeza?
    </h1>
    <div className="mt-6 max-w-5xl mx-auto rounded-[2rem] border-4 border-[#fdb813]/60 bg-white/10 backdrop-blur-sm shadow-2xl px-4 py-5 sm:px-8 sm:py-7">
      <p className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight text-white">
        SIGEA es el socio silencioso que vigila tu inventario, tus ventas y tu plata
        <span className="block mt-3 text-[#fdb813]">mientras tú vives.</span>
      </p>
    </div>
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-5xl mx-auto">
      <div className="bg-white/15 border border-white/20 rounded-2xl px-4 py-4 shadow-lg">
        <div className="text-2xl sm:text-3xl font-black text-[#fdb813]">✅</div>
        <p className="mt-1 text-xl sm:text-2xl font-extrabold leading-tight">Sabrás cuánto ganas cada día</p>
      </div>
      <div className="bg-white/15 border border-white/20 rounded-2xl px-4 py-4 shadow-lg">
        <div className="text-2xl sm:text-3xl font-black text-[#fdb813]">✅</div>
        <p className="mt-1 text-xl sm:text-2xl font-extrabold leading-tight">Cero fugas de producto</p>
      </div>
      <div className="bg-white/15 border border-white/20 rounded-2xl px-4 py-4 shadow-lg">
        <div className="text-2xl sm:text-3xl font-black text-[#fdb813]">✅</div>
        <p className="mt-1 text-xl sm:text-2xl font-extrabold leading-tight">Vende mientras duermes</p>
      </div>
    </div>
  </div>
</header>

      {/* ===== I · INTERES ===== */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <p className="text-center text-[11px] tracking-widest uppercase text-stone-400">Paso 1 · ¿Te suena familiar?</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center mt-1">El negocio de barrio pierde plata <span className="text-rose-600">sin darse cuenta</span></h2>
        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          {DOLORES.map((d) => (
            <div key={d.dolor} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
              <p className="text-2xl">{d.emoji}</p>
              <p className="font-semibold mt-1">{d.dolor}</p>
              <p className="text-sm text-emerald-700 mt-2 flex gap-1 items-start"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> {d.solucion}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== D · DESEO ===== */}
      <section className="bg-stone-900 text-white px-4 py-10">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-[11px] tracking-widest uppercase text-stone-400">Paso 2 · Lo que vas a sentir</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center mt-1">Esto no es un software. <span className="text-[#fdb813]">Es tu vida de vuelta.</span></h2>
          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            {SENSACIONES.map((s) => (
              <div key={s.titulo} className="bg-stone-800 border border-stone-700 rounded-2xl p-4 text-center">
                <p className="text-3xl">{s.emoji}</p>
                <p className="font-extrabold text-[#fdb813] tracking-widest mt-1">{s.titulo}</p>
                <p className="text-sm text-stone-300 mt-1">{s.texto}</p>
              </div>
            ))}
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-center mt-10">12 módulos trabajando por ti <span className="text-[#fdb813]">desde el día 1</span></h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
            {MODULOS.map((m) => (
              <div key={m.nombre} className={"rounded-2xl border-2 p-4 " + m.color}>
                <m.Icon className={"w-6 h-6 " + m.icon} />
                <p className="font-bold mt-2 text-stone-800">{m.nombre}</p>
                <ul className="mt-2 space-y-1">
                  {m.beneficios.map((b) => (
                    <li key={b} className="text-xs text-stone-600 flex gap-1 items-start"><CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0 text-emerald-600" /> {b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== A · ACCION ===== */}
      <section id="negocios" className="max-w-5xl mx-auto px-4 py-10">
        <p className="text-center text-[11px] tracking-widest uppercase text-stone-400">Paso 3 · Tu turno</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center mt-1">Elige tu negocio y <span className="text-emerald-600">tócalo por dentro</span></h2>
        <p className="text-center text-sm text-stone-500 mt-2">Entra, haz una venta de prueba y mira cómo se siente tener el control.</p>
        <div className="mt-4 flex justify-center">
          <Link href="/demo/panaderia/pos" className="inline-flex items-center gap-2 bg-stone-900 text-[#fdb813] font-bold rounded-xl px-5 py-3 hover:bg-stone-800">
            <Zap className="w-4 h-4" /> Ir directo al POS (sin ver nada más)
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
          {NEGOCIOS.map((n) => (
            <Link key={n.slug} href={"/demo/" + n.slug} className="group bg-white rounded-2xl border-2 border-stone-200 hover:border-[#fdb813] p-4 shadow-sm hover:shadow-lg transition">
              <p className="text-3xl">{n.emoji}</p>
              <p className="font-extrabold text-lg mt-1">{n.nombre}</p>
              <p className="text-xs text-stone-500 mt-1">{n.desc}</p>
              <p className="mt-3 text-sm font-bold text-emerald-700 flex items-center gap-1 group-hover:gap-2 transition-all">Ver cómo funciona <ArrowRight className="w-4 h-4" /></p>
            </Link>
          ))}
        </div>
        <div className="mt-8 bg-gradient-to-r from-[#fdb813] to-[#e8a800] rounded-2xl p-5 text-center text-stone-900 shadow-xl">
          <p className="font-extrabold text-lg sm:text-xl">¿Listo para dormir tranquilo y vender más?</p>
          <p className="text-sm mt-1">Sin tarjeta · Sin instalación · Funciona en tu celular</p>
          <div className="mt-3 flex justify-center">
            <a href="https://wa.me/573016111412" target="_blank" className="bg-stone-900 text-white font-bold rounded-xl px-6 py-3">💬 Escríbenos: 301 611 1412</a>
          </div>
        </div>
      </section>

      <footer className="text-center text-xs text-stone-400 pb-8 px-4">
        SIGEA System · Gestión empresarial para el negocio de barrio · Barranquilla, Colombia
      </footer>
    </div>
  );
}