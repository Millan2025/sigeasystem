"use client";
import { useState, useEffect } from "react";
import { Building2, Plus, TrendingUp, MessageSquare, Shield, MapPin, Users, Package, Trophy, Pencil, Trash2 } from "lucide-react";

export default function CentroControl() {
  const [orgId, setOrgId] = useState("");
  const [centralId, setCentralId] = useState("");
  const [setupId, setSetupId] = useState("");
  const [sedes, setSedes] = useState<any[]>([]);
  const [tab, setTab] = useState("dashboard");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState("");
  const [form, setForm] = useState({ nombre: "", zona: "", responsable: "", telefono: "", direccion: "", modulos: "pos,pedidos,reportes" });
  const VACIO = { nombre: "", zona: "", responsable: "", telefono: "", direccion: "", modulos: "pos,pedidos,reportes" };

  const cargar = (oid: string) => {
    fetch("/api/organizacion/sedes?org=" + oid).then((r) => r.json()).then((d) => { if (d.success) setSedes(d.sedes || []); });
  };

  useEffect(() => {
    const so = localStorage.getItem("org_id") || "";
    const sc = localStorage.getItem("central_id") || "";
    if (so) { setOrgId(so); cargar(so); }
    if (sc) setCentralId(sc);
  }, []);

  const activar = async () => {
    const res = await fetch("/api/organizacion/bootstrap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant_id: setupId, nombre_organizacion: "Central Master" }) });
    const d = await res.json();
    if (d.success) {
      localStorage.setItem("org_id", d.organizacion.id);
      localStorage.setItem("central_id", setupId);
      setOrgId(d.organizacion.id); setCentralId(setupId);
    } else alert("Error: " + d.error);
  };

  const abrirNueva = () => { setEditId(""); setForm(VACIO); setShowModal(true); };
  const abrirEditar = (s: any) => {
    setEditId(s.id);
    setForm({ nombre: s.nombre_negocio || "", zona: s.zona || "", responsable: s.responsable || "", telefono: s.telefono || "", direccion: s.direccion || "", modulos: s.modulos_activos || "pos,pedidos,reportes" });
    setShowModal(true);
  };

  const guardar = async () => {
    if (editId) {
      const res = await fetch("/api/organizacion/sedes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sede_id: editId, nombre_negocio: form.nombre, zona: form.zona, responsable: form.responsable, telefono: form.telefono, direccion: form.direccion, modulos_activos: form.modulos }) });
      const d = await res.json();
      if (d.success) { setSedes(sedes.map((s) => (s.id === editId ? d.sede : s))); setShowModal(false); }
      else alert("Error: " + d.error);
    } else {
      const res = await fetch("/api/organizacion/sedes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ central_id: centralId, ...form }) });
      const d = await res.json();
      if (d.success) { setSedes([...sedes, d.sede]); setShowModal(false); setForm(VACIO); alert("Sede creada. Productos clonados: " + d.productos_clonados); }
      else alert("Error: " + d.error);
    }
  };

  const eliminar = async (id: string, nombre: string) => {
    if (!confirm("Eliminar la sede " + nombre + "? Esta accion no se puede deshacer.")) return;
    const res = await fetch("/api/organizacion/sedes?id=" + id, { method: "DELETE" });
    const d = await res.json();
    if (d.success) setSedes(sedes.filter((s) => s.id !== id));
    else alert("Error: " + d.error);
  };

  const MODS = ["pos", "pedidos", "inventario", "reportes", "personal", "marketing", "finanzas", "produccion"];
  const toggleMod = (m: string) => {
    const arr = form.modulos.split(",").filter(Boolean);
    const next = arr.includes(m) ? arr.filter((x) => x !== m) : [...arr, m];
    setForm({ ...form, modulos: next.join(",") });
  };

  if (!orgId) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#fdb813] rounded-2xl flex items-center justify-center mx-auto mb-4"><Building2 className="w-8 h-8 text-stone-900" /></div>
          <h1 className="text-2xl font-extrabold text-stone-900">Centro de Control</h1>
          <p className="text-stone-600 text-sm mt-2">Activa tu Central Master pegando el ID del negocio central</p>
          <input value={setupId} onChange={(e) => setSetupId(e.target.value)} placeholder="UUID del tenant central" className="w-full mt-4 px-4 py-3 border border-stone-300 rounded-lg text-sm text-stone-800 placeholder-stone-400" />
          <button onClick={activar} disabled={!setupId} className="w-full mt-3 py-3 bg-[#fdb813] text-stone-900 rounded-lg font-bold disabled:opacity-50">Activar Central Master</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#fdb813] rounded-xl"><Building2 className="w-6 h-6 text-stone-900" /></div>
            <div>
              <h1 className="text-2xl font-extrabold">Centro de Control</h1>
              <p className="text-sm text-stone-300">Central Master · {sedes.length} sedes</p>
            </div>
          </div>
          <button onClick={abrirNueva} className="flex items-center gap-2 px-5 py-3 bg-[#fdb813] text-stone-900 rounded-xl font-bold hover:bg-yellow-400"><Plus className="w-5 h-5" />Nueva Sede</button>
        </div>
      </header>
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {[{ id: "dashboard", l: "Dashboard", I: TrendingUp }, { id: "sedes", l: "Sedes", I: Building2 }, { id: "ranking", l: "Ranking", I: Trophy }, { id: "mensajes", l: "Mensajes", I: MessageSquare }, { id: "autorizaciones", l: "Autorizaciones", I: Shield }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={"flex items-center gap-2 px-5 py-4 font-semibold border-b-2 whitespace-nowrap " + (tab === t.id ? "border-[#fdb813] text-stone-900" : "border-transparent text-stone-500")}>
              <t.I className="w-4 h-4" />{t.l}
            </button>
          ))}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {tab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sedes.length === 0 && <div className="col-span-full bg-white rounded-2xl p-10 border border-stone-200 text-center text-stone-500">No hay sedes aún. Crea la primera con "Nueva Sede".</div>}
            {sedes.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-stone-900">{s.nombre_negocio}</h3>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">{s.tipo_sede}</span>
                </div>
                <div className="space-y-1 text-xs text-stone-600">
                  <div className="flex items-center gap-2"><MapPin className="w-3 h-3" />{s.zona || "Sin zona"}</div>
                  <div className="flex items-center gap-2"><Users className="w-3 h-3" />{s.responsable || "Sin responsable"}</div>
                  <div className="flex items-center gap-2"><Package className="w-3 h-3" />{(s.modulos_activos || "").split(",").filter(Boolean).length} módulos</div>
                </div>
                <div className="flex gap-2 mt-4">
                  <a href={"/pos?tenant=" + s.id} className="flex-1 py-2 bg-stone-900 text-white rounded-lg text-sm font-semibold text-center hover:bg-stone-800">Entrar</a>
                  <button onClick={() => abrirEditar(s)} className="p-2 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-100" title="Editar"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => eliminar(s.id, s.nombre_negocio)} className="p-2 border border-red-200 rounded-lg text-red-600 hover:bg-red-50" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "sedes" && (
          <div className="bg-white rounded-2xl p-6 border border-stone-200 space-y-3">
            {sedes.length === 0 && <p className="text-stone-500 text-center py-8">Sin sedes.</p>}
            {sedes.map((s) => (
              <div key={s.id} className="border border-stone-200 rounded-xl p-4 flex items-center justify-between">
                <div><h3 className="font-bold text-stone-900">{s.nombre_negocio}</h3><p className="text-sm text-stone-600">{s.zona} · {s.responsable} · {s.telefono}</p></div>
                <div className="flex gap-2">
                  <button onClick={() => abrirEditar(s)} className="p-2 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-100"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => eliminar(s.id, s.nombre_negocio)} className="p-2 border border-red-200 rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "ranking" && (
          <div className="bg-white rounded-2xl p-6 border border-stone-200 space-y-3">
            {sedes.length === 0 && <p className="text-stone-500 text-center py-8">Sin datos de ventas aún.</p>}
            {sedes.map((s, i) => (
              <div key={s.id} className="flex items-center gap-4 border border-stone-200 rounded-xl p-4">
                <div className={"w-10 h-10 rounded-full flex items-center justify-center font-extrabold " + (i === 0 ? "bg-yellow-400 text-stone-900" : "bg-stone-200 text-stone-700")}>{i + 1}</div>
                <div className="flex-1"><h3 className="font-bold text-stone-900">{s.nombre_negocio}</h3><p className="text-sm text-stone-600">{s.zona}</p></div>
                <p className="text-xl font-extrabold text-stone-900">$0</p>
              </div>
            ))}
          </div>
        )}
        {tab === "mensajes" && <div className="bg-white rounded-2xl p-10 border border-stone-200 text-center text-stone-500">Chat Central a sedes: Fase 2</div>}
        {tab === "autorizaciones" && <div className="bg-white rounded-2xl p-10 border border-stone-200 text-center text-stone-500">Autorizaciones: Fase 2</div>}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-stone-200"><h2 className="text-xl font-bold text-stone-900">{editId ? "Editar Sede" : "Nueva Sede / Puesto de Venta"}</h2></div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-stone-500 mb-1">Nombre del puesto *</label><input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Puesto Norte 45" className="w-full px-4 py-3 border border-stone-300 rounded-lg text-stone-800 placeholder-stone-400" /></div>
              <div><label className="block text-xs font-semibold text-stone-500 mb-1">Zona / barrio</label><input value={form.zona} onChange={(e) => setForm({ ...form, zona: e.target.value })} placeholder="Ej: Norte" className="w-full px-4 py-3 border border-stone-300 rounded-lg text-stone-800 placeholder-stone-400" /></div>
              <div><label className="block text-xs font-semibold text-stone-500 mb-1">Responsable</label><input value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })} placeholder="Nombre del encargado" className="w-full px-4 py-3 border border-stone-300 rounded-lg text-stone-800 placeholder-stone-400" /></div>
              <div><label className="block text-xs font-semibold text-stone-500 mb-1">Teléfono</label><input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="300 123 4567" className="w-full px-4 py-3 border border-stone-300 rounded-lg text-stone-800 placeholder-stone-400" /></div>
              <div className="md:col-span-2"><label className="block text-xs font-semibold text-stone-500 mb-1">Dirección</label><input value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} placeholder="Calle 45 #12-34" className="w-full px-4 py-3 border border-stone-300 rounded-lg text-stone-800 placeholder-stone-400" /></div>
              <div className="md:col-span-2">
                <p className="text-xs font-semibold text-stone-500 mb-2">Módulos habilitados</p>
                <div className="flex flex-wrap gap-2">
                  {MODS.map((m) => (
                    <button key={m} onClick={() => toggleMod(m)} className={"px-3 py-2 rounded-lg text-sm font-semibold border " + (form.modulos.includes(m) ? "bg-[#fdb813] border-[#fdb813] text-stone-900" : "bg-white border-stone-300 text-stone-600")}>{m}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-stone-200 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-5 py-3 border border-stone-300 text-stone-700 rounded-lg font-semibold">Cancelar</button>
              <button onClick={guardar} disabled={!form.nombre} className="px-5 py-3 bg-[#fdb813] text-stone-900 rounded-lg font-bold disabled:opacity-50">{editId ? "Guardar Cambios" : "Crear Sede"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
