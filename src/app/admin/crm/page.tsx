"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ESTADOS = ["contacto","demo","prueba","venta","perdido"];
const COLORES: any = {
  contacto:"bg-stone-100 text-stone-700",
  demo:"bg-sky-100 text-sky-700",
  prueba:"bg-amber-100 text-amber-700",
  venta:"bg-emerald-100 text-emerald-700",
  perdido:"bg-rose-100 text-rose-700",
};
const FORM_INICIAL = { nombre:"", whatsapp:"", nombre_negocio:"", tipo_negocio:"tienda", fuente:"centro", plan_interes:"barrio", proximo_seguimiento:"", notas:"" };

export default function CRMPage() {
  const supabase = createClient();
  const [prospectos, setProspectos] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(FORM_INICIAL);

  const cargar = async () => {
    const { data } = await supabase.from("crm_prospectos").select("*").order("created_at", { ascending:false });
    setProspectos(data || []);
  };
  useEffect(()=>{ cargar(); },[]);

  const guardar = async () => {
    if (!form.nombre) { alert("Nombre obligatorio"); return; }
    await supabase.from("crm_prospectos").insert(form);
    setForm(FORM_INICIAL); setShowForm(false); cargar();
  };

  const cambiarEstado = async (id:string, estado:string) => {
    await supabase.from("crm_prospectos").update({ estado }).eq("id", id);
    cargar();
  };

  const filtrados = filtro==="todos" ? prospectos : prospectos.filter(p=>p.estado===filtro);
  const conteo = (e:string)=>prospectos.filter(p=>p.estado===e).length;

  return (
    <div className="min-h-screen bg-stone-50 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-stone-800">CRM - Prospectos</h1>
          <button onClick={()=>setShowForm(!showForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg">+ Nuevo prospecto</button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={()=>setFiltro("todos")} className={filtro==="todos"?"bg-stone-800 text-white px-3 py-1 rounded-full text-sm":"bg-white px-3 py-1 rounded-full text-sm"}>Todos ({prospectos.length})</button>
          {ESTADOS.map(e=>(
            <button key={e} onClick={()=>setFiltro(e)} className={filtro===e?"bg-stone-800 text-white px-3 py-1 rounded-full text-sm":"bg-white px-3 py-1 rounded-full text-sm"}>{e} ({conteo(e)})</button>
          ))}
        </div>

        {showForm && (
          <div className="bg-white rounded-xl p-4 mb-4 border grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="Nombre *" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} className="border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-2"/>
            <input placeholder="WhatsApp" value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} className="border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-2"/>
            <input placeholder="Nombre del negocio" value={form.nombre_negocio} onChange={e=>setForm({...form,nombre_negocio:e.target.value})} className="border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-2"/>
            <select value={form.tipo_negocio} onChange={e=>setForm({...form,tipo_negocio:e.target.value})} className="border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-2">
              {["tienda","panaderia","carniceria","salsamentaria","ferreteria","restaurante","distribuidora"].map(t=><option key={t}>{t}</option>)}
            </select>
            <select value={form.fuente} onChange={e=>setForm({...form,fuente:e.target.value})} className="border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-2">
              {["centro","referido","whatsapp","contador","redes"].map(t=><option key={t}>{t}</option>)}
            </select>
            <select value={form.plan_interes} onChange={e=>setForm({...form,plan_interes:e.target.value})} className="border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-2">
              {["barrio","negocio","distribuidora"].map(t=><option key={t}>{t}</option>)}
            </select>
            <input type="date" value={form.proximo_seguimiento} onChange={e=>setForm({...form,proximo_seguimiento:e.target.value})} className="border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-2"/>
            <input placeholder="Notas" value={form.notas} onChange={e=>setForm({...form,notas:e.target.value})} className="border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-2"/>
            <button onClick={guardar} className="bg-emerald-600 text-white rounded-lg p-2 md:col-span-2">Guardar</button>
          </div>
        )}

        <div className="space-y-2">
          {filtrados.map(p=>(
            <div key={p.id} className="bg-white rounded-xl p-3 border flex flex-col md:flex-row md:items-center gap-2">
              <div className="flex-1">
                <div className="font-semibold text-stone-800">{p.nombre} {p.nombre_negocio && <span className="text-sm text-stone-500">- {p.nombre_negocio}</span>}</div>
                <div className="text-xs text-stone-500">{p.tipo_negocio} | {p.fuente} | plan: {p.plan_interes} {p.whatsapp && <>| <a className="text-emerald-600" href={"https://wa.me/57"+p.whatsapp} target="_blank">WA {p.whatsapp}</a></>}</div>
                {p.notas && <div className="text-xs text-stone-400 mt-1">{p.notas}</div>}
              </div>
              <div className="flex items-center gap-2">
                <span className={"px-2 py-1 rounded-full text-xs "+(COLORES[p.estado]||"")}>{p.estado}</span>
                <select value={p.estado} onChange={e=>cambiarEstado(p.id, e.target.value)} className="border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-1 text-xs">
                  {ESTADOS.map(e=><option key={e}>{e}</option>)}
                </select>
              </div>
            </div>
          ))}
          {filtrados.length===0 && <div className="text-center text-stone-400 py-10">Sin prospectos en este estado</div>}
        </div>
      </div>
    </div>
  );
}
