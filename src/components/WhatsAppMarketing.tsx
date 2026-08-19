"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle, Upload, Calendar, CheckCircle, XCircle, Plus, Trash2, Clock, Bell, Share2, Smartphone, Settings } from "lucide-react";

interface Props { tenantId: string; negocioNombre?: string; }

export default function WhatsAppMarketing({ tenantId, negocioNombre }: Props) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [numeroDueno, setNumeroDueno] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string; type: "success" | "error"} | null>(null);
  const [form, setForm] = useState({ nombre_pieza: "", tipo_archivo: "imagen", url_archivo: "", texto_mensaje: "", hashtag: "", grupo_whatsapp: "", numero_whatsapp: "", fecha_programada: "" });

  const showToast = (msg: string, type: "success" | "error" = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const cargar = async () => {
    if (!tenantId) return;
    const { data } = await supabase.from("publicaciones_whatsapp").select("*").eq("tenant_id", tenantId).order("fecha_programada", { ascending: false });
    setPublicaciones(data || []);
    const { data: cfg } = await supabase.from("config_whatsapp").select("*").eq("tenant_id", tenantId).maybeSingle();
    if (cfg?.numero_negocio) setNumeroDueno(cfg.numero_negocio);
  };
  useEffect(() => { cargar(); }, [tenantId]);

  const guardarNumeroDueno = async () => {
    const digits = numeroDueno.replace(/\D/g, "");
    if (!digits) { showToast("Escribe el numero del dueno", "error"); return; }
    const { data: exists } = await supabase.from("config_whatsapp").select("id").eq("tenant_id", tenantId).maybeSingle();
    if (exists) {
      await supabase.from("config_whatsapp").update({ numero_negocio: digits }).eq("tenant_id", tenantId);
    } else {
      await supabase.from("config_whatsapp").insert({ tenant_id: tenantId, numero_negocio: digits });
    }
    showToast("✅ Numero del dueno guardado");
  };

  const vencidas = publicaciones.filter(p => p.estado === "pendiente" && new Date(p.fecha_programada) <= new Date());
  const pendientes = publicaciones.filter(p => p.estado === "pendiente" && new Date(p.fecha_programada) > new Date());
  const publicadas = publicaciones.filter(p => p.estado === "publicado");

  const subirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const fileName = `${tenantId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("marketing").upload(fileName, file, { upsert: true });
    if (error) { showToast("Error al subir: " + error.message, "error"); setLoading(false); return; }
    const { data } = supabase.storage.from("marketing").getPublicUrl(fileName);
    setForm({ ...form, url_archivo: data.publicUrl, tipo_archivo: file.type.startsWith("video") ? "video" : "imagen" });
    showToast("✅ Archivo cargado");
    setLoading(false);
  };

  const programar = async () => {
    if (!form.nombre_pieza || !form.url_archivo || !form.grupo_whatsapp || !form.fecha_programada) {
      showToast("Completa nombre, archivo, grupo y fecha", "error"); return;
    }
    setLoading(true);
    const { error } = await supabase.from("publicaciones_whatsapp").insert({
      tenant_id: tenantId, nombre_pieza: form.nombre_pieza, tipo_archivo: form.tipo_archivo, url_archivo: form.url_archivo,
      texto_mensaje: form.texto_mensaje, hashtag: form.hashtag, grupo_whatsapp: form.grupo_whatsapp,
      numero_whatsapp: form.numero_whatsapp || numeroDueno, fecha_programada: new Date(form.fecha_programada).toISOString(), estado: "pendiente",
    });
    if (error) { showToast("Error al programar: " + error.message, "error"); }
    else {
      showToast("✅ Publicacion programada");
      setForm({ nombre_pieza: "", tipo_archivo: "imagen", url_archivo: "", texto_mensaje: "", hashtag: "", grupo_whatsapp: "", numero_whatsapp: "", fecha_programada: "" });
      cargar();
    }
    setLoading(false);
  };

  const construirTexto = (pub: any) => {
    const tags = pub.hashtag ? "#" + String(pub.hashtag).replace(/#/g, "").split(",").map((h: string) => h.trim()).filter(Boolean).join(" #") : "";
    return `${pub.texto_mensaje || ""}${tags ? "\n\n" + tags : ""}\n\n📎 ${pub.url_archivo}`.trim();
  };

  const marcarPublicado = async (id: string, enlace: string) => {
    await supabase.from("publicaciones_whatsapp").update({ estado: "publicado", fecha_publicacion_real: new Date().toISOString(), enlace_compartido: enlace }).eq("id", id);
    showToast("✅ Marcada como publicada");
    cargar();
  };

  // SIN META: abre WhatsApp del dueno con el anuncio ya escrito (1 tap)
  const enviarADueno = (pub: any) => {
    const num = String(pub.numero_whatsapp || numeroDueno).replace(/\D/g, "");
    if (!num) { showToast("Configura el numero del dueno arriba", "error"); return; }
    const url = `https://wa.me/${num}?text=${encodeURIComponent(construirTexto(pub))}`;
    window.open(url, "_blank");
    marcarPublicado(pub.id, url);
  };

  // SIN META: selector nativo con imagen + texto para soltar en grupos
  const compartirGrupo = async (pub: any) => {
    const texto = construirTexto(pub);
    try {
      const resp = await fetch(pub.url_archivo);
      const blob = await resp.blob();
      const ext = pub.tipo_archivo === "video" ? ".mp4" : ".jpg";
      const file = new File([blob], (pub.nombre_pieza || "pieza") + ext, { type: blob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: texto });
      } else {
        await navigator.share({ text: texto, url: pub.url_archivo });
      }
      marcarPublicado(pub.id, pub.url_archivo);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        await navigator.clipboard.writeText(texto).catch(() => {});
        showToast("📋 Copiado. Pegalo en el grupo", "success");
      }
    }
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta publicacion?")) return;
    await supabase.from("publicaciones_whatsapp").delete().eq("id", id);
    showToast("🗑️ Eliminada"); cargar();
  };

  const BotonesEnvio = ({ pub }: { pub: any }) => (
    <div className="flex gap-2 mt-2">
      <button onClick={() => enviarADueno(pub)} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-1 hover:bg-green-700">
        <Smartphone className="w-4 h-4" /> A mi WhatsApp
      </button>
      <button onClick={() => compartirGrupo(pub)} className="flex-1 bg-emerald-100 text-emerald-800 rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-1 hover:bg-emerald-200">
        <Share2 className="w-4 h-4" /> A grupos
      </button>
      <button onClick={() => eliminar(pub.id)} className="bg-stone-100 text-stone-700 rounded-lg px-2 hover:bg-stone-200"><Trash2 className="w-4 h-4" /></button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 w-full max-w-full overflow-x-hidden">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-xl"><MessageCircle className="w-8 h-8" /></div>
          <div>
            <h1 className="text-2xl font-bold">Marketing WhatsApp</h1>
            <p className="text-green-100 text-sm">{negocioNombre || "Tu negocio"} · Grupos de barrio · Sin Meta</p>
          </div>
        </div>
      </div>

      {/* CONFIG NUMERO DUENO */}
      <div className="bg-white rounded-2xl p-4 border shadow-sm">
        <div className="flex items-center gap-2 mb-2"><Settings className="w-4 h-4 text-stone-600" /><h3 className="font-semibold text-stone-800 text-sm">WhatsApp del dueño (recibe el anuncio listo, 1 tap)</h3></div>
        <div className="flex gap-2">
          <input placeholder={numeroDueno ? `Actual: ${numeroDueno}` : "Ej: 573001234567"} value={numeroDueno} onChange={(e) => setNumeroDueno(e.target.value)} className="flex-1 border-2 border-stone-300 bg-white rounded-lg p-2 text-stone-800 placeholder:text-stone-500" type="tel" />
          <button onClick={guardarNumeroDueno} className="bg-stone-800 text-white rounded-lg px-4 text-sm font-semibold">Guardar</button>
        </div>
      </div>

      {vencidas.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3"><Bell className="w-5 h-5 text-amber-600" /><h3 className="font-bold text-amber-900">⏰ Es hora de publicar ({vencidas.length})</h3></div>
          <div className="space-y-3">
            {vencidas.map((pub) => (
              <div key={pub.id} className="bg-white rounded-xl p-3">
                <div className="flex gap-3">
                  {pub.tipo_archivo === "imagen" ? <img src={pub.url_archivo} className="w-16 h-16 object-cover rounded-lg" alt="" /> : <video src={pub.url_archivo} className="w-16 h-16 object-cover rounded-lg" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-stone-800 text-sm">{pub.nombre_pieza}</div>
                    <div className="text-xs text-stone-600">📱 {pub.grupo_whatsapp}</div>
                  </div>
                </div>
                <BotonesEnvio pub={pub} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border shadow-sm">
        <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2"><Plus className="w-5 h-5" /> Nueva publicación</h2>
        <div className="flex flex-col gap-3 w-full max-w-full min-w-0">
          <input placeholder="Nombre de la pieza *" value={form.nombre_pieza} onChange={(e) => setForm({ ...form, nombre_pieza: e.target.value })} className="w-full border-2 border-stone-300 bg-white rounded-lg p-3 text-stone-800 placeholder:text-stone-500" />
          <input placeholder="Grupo de WhatsApp * (ej: Vecinos Barrio)" value={form.grupo_whatsapp} onChange={(e) => setForm({ ...form, grupo_whatsapp: e.target.value })} className="w-full border-2 border-stone-300 bg-white rounded-lg p-3 text-stone-800 placeholder:text-stone-500" />
          <textarea placeholder="Texto del mensaje (opcional)" value={form.texto_mensaje} onChange={(e) => setForm({ ...form, texto_mensaje: e.target.value })} rows={2} className="w-full border-2 border-stone-300 bg-white rounded-lg p-3 text-stone-800 placeholder:text-stone-500" />
          <input placeholder="Hashtags (ej: oferta, barrio)" value={form.hashtag} onChange={(e) => setForm({ ...form, hashtag: e.target.value })} className="w-full border-2 border-stone-300 bg-white rounded-lg p-3 text-stone-800 placeholder:text-stone-500" />
          <input type="datetime-local" value={form.fecha_programada} onChange={(e) => setForm({ ...form, fecha_programada: e.target.value })} className="w-full border-2 border-stone-300 bg-white rounded-lg p-3 text-stone-800" />
          <div>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={subirArchivo} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-stone-400 rounded-lg p-4 hover:bg-stone-100 flex items-center justify-center gap-2 text-stone-700 font-medium">
              <Upload className="w-5 h-5" /> {form.url_archivo ? "✅ Archivo cargado" : "Subir imagen o video *"}
            </button>
            {form.url_archivo && form.tipo_archivo === "imagen" && <img src={form.url_archivo} alt="preview" className="mt-2 rounded-lg max-h-40 object-contain" />}
          </div>
          <button onClick={programar} disabled={loading} className="bg-green-600 text-white rounded-lg p-3 font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
            <Calendar className="w-5 h-5" /> {loading ? "Procesando..." : "Programar publicación"}
          </button>
        </div>
      </div>

      {pendientes.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border shadow-sm">
          <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-amber-600" /> Programadas ({pendientes.length})</h2>
          <div className="space-y-3">
            {pendientes.map((pub) => (
              <div key={pub.id} className="border rounded-xl p-3">
                <div className="flex gap-3">
                  {pub.tipo_archivo === "imagen" ? <img src={pub.url_archivo} className="w-16 h-16 object-cover rounded-lg" alt="" /> : <video src={pub.url_archivo} className="w-16 h-16 object-cover rounded-lg" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-stone-800 text-sm">{pub.nombre_pieza}</div>
                    <div className="text-xs text-stone-600">📱 {pub.grupo_whatsapp} · 📅 {new Date(pub.fecha_programada).toLocaleString("es-CO")}</div>
                  </div>
                </div>
                <BotonesEnvio pub={pub} />
              </div>
            ))}
          </div>
        </div>
      )}

      {publicadas.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border shadow-sm">
          <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-600" /> Publicadas ({publicadas.length})</h2>
          <div className="space-y-2">
            {publicadas.slice(0, 5).map((pub) => (
              <div key={pub.id} className="flex items-center gap-3 border-b pb-2 last:border-0">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <div className="flex-1 text-sm">
                  <div className="font-medium text-stone-800">{pub.nombre_pieza}</div>
                  <div className="text-xs text-stone-600">{pub.grupo_whatsapp} · {new Date(pub.fecha_publicacion_real).toLocaleString("es-CO")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <h3 className="font-semibold text-amber-900 mb-2">🚧 Próximamente</h3>
        <p className="text-sm text-amber-800">Envío 100% automático (API oficial Meta) y otras redes en desarrollo.</p>
      </div>

      {toast && (
        <div className={`fixed bottom-4 right-4 left-4 md:left-auto px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
          {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="text-sm">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
