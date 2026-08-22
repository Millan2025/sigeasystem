"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Phone, Mail, MapPin, Store, Calendar, Plus, ChevronDown, ChevronUp, MessageSquare, Crown, History } from "lucide-react";

const ETAPAS = [
  { id: "contacto", label: "Contacto", icon: "👋", color: "border-stone-300 bg-stone-50 text-stone-700" },
  { id: "demo", label: "Demo", icon: "🖥️", color: "border-sky-300 bg-sky-50 text-sky-700" },
  { id: "prueba", label: "Prueba", icon: "🧪", color: "border-amber-300 bg-amber-50 text-amber-700" },
  { id: "venta", label: "Venta", icon: "💰", color: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  { id: "premium", label: "Premium", icon: "👑", color: "border-purple-300 bg-purple-50 text-purple-700" },
  { id: "perdido", label: "Perdido", icon: "❌", color: "border-rose-300 bg-rose-50 text-rose-700" },
];

export default function AdminCRM() {
  const supabase = createClient();
  const [prospectos, setProspectos] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("todos");
  const [expandido, setExpandido] = useState<string | null>(null);
  const [nota, setNota] = useState<Record<string, string>>({});
  const [edit, setEdit] = useState<Record<string, any>>({});
  const [showNuevo, setShowNuevo] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: "", whatsapp: "", email: "", tipo_negocio: "tienda", negocio_nombre: "" });

  const cargar = async () => {
    const { data } = await supabase.from("crm_prospectos").select("*").order("created_at", { ascending: false });
    setProspectos(data || []);
  };
  useEffect(() => { cargar(); }, []);

  const hoy = new Date().toISOString().split("T")[0];
  const agenda = prospectos.filter(p => p.siguiente_contacto && p.siguiente_contacto <= hoy && p.estado !== "perdido" && p.estado !== "premium");

  const cambiarEstado = async (id: string, estado: string) => {
    const p = prospectos.find(x => x.id === id);
    const hist = [...(p?.historial || []), { fecha: new Date().toISOString(), texto: "Etapa cambiada a: " + estado }];
    await supabase.from("crm_prospectos").update({ estado, historial: hist }).eq("id", id);
    cargar();
  };

  const agregarNota = async (id: string) => {
    const texto = (nota[id] || "").trim();
    if (!texto) return;
    const p = prospectos.find(x => x.id === id);
    const hist = [...(p?.historial || []), { fecha: new Date().toISOString(), texto }];
    await supabase.from("crm_prospectos").update({ historial: hist }).eq("id", id);
    setNota({ ...nota, [id]: "" });
    cargar();
  };

  const guardarDatos = async (id: string) => {
    const e = edit[id] || {};
    await supabase.from("crm_prospectos").update(e).eq("id", id);
    setEdit({ ...edit, [id]: {} });
    cargar();
  };

  const crear = async () => {
    if (!nuevo.nombre || !nuevo.whatsapp || !nuevo.email) { alert("Nombre, WhatsApp y correo son obligatorios"); return; }
    await supabase.from("crm_prospectos").insert({ ...nuevo, estado: "contacto", fuente: "manual", plan_interes: "barrio", historial: [{ fecha: new Date().toISOString(), texto: "Prospecto creado manualmente" }] });
    setShowNuevo(false);
    setNuevo({ nombre: "", whatsapp: "", email: "", tipo_negocio: "tienda", negocio_nombre: "" });
    cargar();
  };

  const visibles = filtro === "todos" ? prospectos : prospectos.filter(p => p.estado === filtro);

  return (
    <div className="min-h-screen bg-stone-100 p-4 max-w-6xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-800 break-words">CRM - Embudo de Conversión</h1>
          <p className="text-sm text-stone-500">Trazabilidad completa: del contacto cero al cliente premium</p>
        </div>
        <button onClick={() => setShowNuevo(!showNuevo)} className="bg-emerald-600 text-white rounded-xl px-4 py-2 font-semibold flex items-center gap-2 hover:bg-emerald-700">
          <Plus className="w-4 h-4" /> Nuevo prospecto
        </button>
      </div>

      {showNuevo && (
        <div className="bg-white rounded-2xl p-4 border shadow-sm grid sm:grid-cols-2 gap-2">
          <input placeholder="Nombre *" value={nuevo.nombre} onChange={e => setNuevo({ ...nuevo, nombre: e.target.value })} className="border-2 border-stone-300 rounded-lg p-2 text-stone-800" />
          <input placeholder="WhatsApp *" value={nuevo.whatsapp} onChange={e => setNuevo({ ...nuevo, whatsapp: e.target.value })} className="border-2 border-stone-300 rounded-lg p-2 text-stone-800" />
          <input placeholder="Correo *" value={nuevo.email} onChange={e => setNuevo({ ...nuevo, email: e.target.value })} className="border-2 border-stone-300 rounded-lg p-2 text-stone-800" />
          <input placeholder="Nombre del negocio" value={nuevo.negocio_nombre} onChange={e => setNuevo({ ...nuevo, negocio_nombre: e.target.value })} className="border-2 border-stone-300 rounded-lg p-2 text-stone-800" />
          <select value={nuevo.tipo_negocio} onChange={e => setNuevo({ ...nuevo, tipo_negocio: e.target.value })} className="border-2 border-stone-300 rounded-lg p-2 text-stone-800">
            <option value="tienda">Tienda</option><option value="panaderia">Panadería</option><option value="carniceria">Carnicería</option>
            <option value="salsamentaria">Salsamentaria</option><option value="ferreteria">Ferretería</option><option value="restaurante">Restaurante</option>
          </select>
          <button onClick={crear} className="bg-stone-800 text-white rounded-lg p-2 font-semibold">Guardar prospecto</button>
        </div>
      )}

      {/* EMBUDO */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {ETAPAS.map(e => (
          <button key={e.id} onClick={() => setFiltro(filtro === e.id ? "todos" : e.id)}
            className={`rounded-xl border-2 p-3 text-center transition ${e.color} ${filtro === e.id ? "ring-2 ring-stone-800" : ""}`}>
            <div className="text-2xl">{e.icon}</div>
            <div className="text-xs font-semibold">{e.label}</div>
            <div className="text-xl font-bold">{prospectos.filter(p => p.estado === e.id).length}</div>
          </button>
        ))}
      </div>

      {/* AGENDA DE SEGUIMIENTO */}
      {agenda.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
          <h2 className="font-bold text-amber-900 flex items-center gap-2"><Calendar className="w-4 h-4" /> Seguimientos para hoy ({agenda.length})</h2>
          <div className="mt-2 space-y-1">
            {agenda.map(p => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-1 bg-white rounded-lg px-3 py-2 text-sm">
                <span className="font-semibold text-stone-800">{p.nombre} · {p.negocio_nombre || p.tipo_negocio}</span>
                <a href={`https://wa.me/57${String(p.whatsapp).replace(/\D/g, "")}`} target="_blank" className="text-emerald-700 font-semibold flex items-center gap-1"><Phone className="w-3 h-3" /> Contactar</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LISTA */}
      <div className="space-y-3">
        {visibles.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-4 flex flex-wrap items-center gap-3 cursor-pointer" onClick={() => setExpandido(expandido === p.id ? null : p.id)}>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-stone-800">{p.nombre} {p.estado === "premium" && <Crown className="w-4 h-4 inline text-purple-600" />}</div>
                <div className="text-xs text-stone-500 flex flex-wrap gap-2">
                  <span className="flex items-center gap-1"><Store className="w-3 h-3" /> {p.negocio_nombre || p.tipo_negocio}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {p.whatsapp}</span>
                  {p.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {p.email}</span>}
                  <span>· {p.fuente}</span>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border-2 ${(ETAPAS.find(e => e.id === p.estado) || ETAPAS[0]).color}`}>
                {(ETAPAS.find(e => e.id === p.estado) || ETAPAS[0]).icon} {(ETAPAS.find(e => e.id === p.estado) || ETAPAS[0]).label}
              </span>
              {expandido === p.id ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
            </div>

            {expandido === p.id && (
              <div className="border-t p-4 space-y-4 bg-stone-50">
                {/* Avanzar etapa */}
                <div>
                  <p className="text-xs font-bold text-stone-600 mb-1">Mover en el embudo:</p>
                  <div className="flex flex-wrap gap-1">
                    {ETAPAS.filter(e => e.id !== p.estado).map(e => (
                      <button key={e.id} onClick={() => cambiarEstado(p.id, e.id)} className={`text-xs px-2 py-1 rounded-lg border ${e.color} font-semibold`}>
                        {e.icon} {e.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Datos del negocio */}
                <div className="grid sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-stone-500">Negocio</label>
                    <input defaultValue={p.negocio_nombre || ""} onChange={e => setEdit({ ...edit, [p.id]: { ...(edit[p.id] || {}), negocio_nombre: e.target.value } })} className="w-full border rounded-lg p-2 text-sm text-stone-800" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500">Dirección</label>
                    <input defaultValue={p.direccion || ""} onChange={e => setEdit({ ...edit, [p.id]: { ...(edit[p.id] || {}), direccion: e.target.value } })} className="w-full border rounded-lg p-2 text-sm text-stone-800" />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500">Próximo contacto</label>
                    <input type="date" defaultValue={p.siguiente_contacto || ""} onChange={e => setEdit({ ...edit, [p.id]: { ...(edit[p.id] || {}), siguiente_contacto: e.target.value } })} className="w-full border rounded-lg p-2 text-sm text-stone-800" />
                  </div>
                </div>
                <button onClick={() => guardarDatos(p.id)} className="bg-stone-800 text-white text-sm rounded-lg px-3 py-1.5 font-semibold">Guardar datos</button>

                {/* Historial */}
                <div>
                  <p className="text-xs font-bold text-stone-600 mb-1 flex items-center gap-1"><History className="w-3 h-3" /> Historial de interacciones</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {(p.historial || []).slice().reverse().map((h: any, i: number) => (
                      <div key={i} className="text-xs bg-white rounded-lg px-3 py-1.5 border">
                        <span className="text-stone-400">{new Date(h.fecha).toLocaleString("es-CO")}</span> · <span className="text-stone-700">{h.texto}</span>
                      </div>
                    ))}
                    {(!p.historial || p.historial.length === 0) && <p className="text-xs text-stone-400">Sin interacciones aún.</p>}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input placeholder="Agregar seguimiento (llamada, demo, visita...)" value={nota[p.id] || ""} onChange={e => setNota({ ...nota, [p.id]: e.target.value })} className="flex-1 border rounded-lg p-2 text-sm text-stone-800" />
                    <button onClick={() => agregarNota(p.id)} className="bg-emerald-600 text-white rounded-lg px-3 text-sm font-semibold flex items-center gap-1"><MessageSquare className="w-4 h-4" /> Añadir</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {visibles.length === 0 && <p className="text-center text-stone-400 py-10">No hay prospectos en esta etapa.</p>}
      </div>
    </div>
  );
}
