"use client";
import { useState } from "react";
import { Lightbulb, X, Send, CheckCircle, Bug, Wrench, Sparkles, MessageSquare } from "lucide-react";

interface SugerenciasMejorasProps {
  tenantId: string;
  onClose: () => void;
}

const CATEGORIAS = [
  { value: "bug", label: "Reportar error", icono: Bug, color: "bg-red-50 border-red-300 text-red-700" },
  { value: "mejora", label: "Mejorar algo", icono: Wrench, color: "bg-blue-50 border-blue-300 text-blue-700" },
  { value: "nueva_funcion", label: "Nueva función", icono: Sparkles, color: "bg-purple-50 border-purple-300 text-purple-700" },
  { value: "otro", label: "Otro", icono: MessageSquare, color: "bg-stone-50 border-stone-300 text-stone-700" }
];

const MODULOS = ["POS / Ventas", "Inventario", "Compras", "Finanzas", "Reportes", "Personal", "Producción", "Mesas", "Marketing", "Domicilios", "Clientes", "Créditos", "Otro"];

export default function SugerenciasMejoras({ tenantId, onClose }: SugerenciasMejorasProps) {
  const [categoria, setCategoria] = useState("");
  const [modulo, setModulo] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  const enviar = async () => {
    if (!categoria || !titulo || !descripcion) { setError("Por favor completa los campos obligatorios"); return; }
    setEnviando(true); setError("");
    try {
      const res = await fetch("/api/sugerencias", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, nombre_usuario: nombre || null, email_contacto: email || null, categoria, modulo_relacionado: modulo || null, titulo, descripcion, prioridad: "media" })
      });
      const data = await res.json();
      if (data.success) { setEnviado(true); } else { setError(data.error || "Error al enviar"); }
    } catch (e) { setError("Error de conexión. Intenta de nuevo."); } finally { setEnviando(false); }
  };

  if (enviado) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-stone-900 mb-3">¡Gracias!</h2>
          <p className="text-stone-600 mb-6">Tu sugerencia nos ayuda a mejorar SIGEA.</p>
          <button onClick={onClose} className="w-full py-3 bg-gradient-to-r from-stone-800 to-stone-900 text-white rounded-xl font-bold hover:shadow-xl transition">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 p-5 text-white relative rounded-t-2xl">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <Lightbulb className="w-10 h-10" />
            <div>
              <h2 className="text-2xl font-extrabold">Mejoras y Sugerencias</h2>
              <p className="text-sm opacity-90">Tu voz construye SIGEA</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">
              ¿Qué tipo de aporte es? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIAS.map((cat) => {
                const Icono = cat.icono;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setCategoria(cat.value)}
                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 text-sm ${
                      categoria === cat.value ? 'border-amber-500 bg-amber-50 shadow-lg scale-[1.02]' : `${cat.color} hover:scale-[1.02]`
                    }`}
                  >
                    <Icono className="w-5 h-5 flex-shrink-0" />
                    <span className="font-semibold">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">Módulo (opcional)</label>
            <select
              value={modulo}
              onChange={(e) => setModulo(e.target.value)}
              className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
            >
              <option value="">Selecciona un módulo</option>
              {MODULOS.map((m) => (<option key={m} value={m}>{m}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">
              Título corto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Agregar botón de impresión rápida"
              className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2">
              Cuéntanos más <span className="text-red-500">*</span>
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe tu idea o problema con detalle..."
              className="w-full border-2 border-stone-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none text-sm"
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-stone-500 mt-1">{descripcion.length}/1000</p>
          </div>

          <div className="bg-stone-50 rounded-xl p-4">
            <p className="text-sm font-bold text-stone-700 mb-2">¿Te contactamos? (opcional)</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="border-2 border-stone-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu email"
                className="border-2 border-stone-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            onClick={enviar}
            disabled={enviando}
            className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white rounded-xl font-extrabold flex items-center justify-center gap-2 hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            {enviando ? "Enviando..." : "Enviar sugerencia"}
          </button>
        </div>
      </div>
    </div>
  );
}
