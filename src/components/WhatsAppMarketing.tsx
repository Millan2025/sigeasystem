"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle, Upload, Calendar, Send, CheckCircle, XCircle, Plus, Trash2, Clock } from "lucide-react";

interface Props {
  tenantId: string;
  negocioNombre?: string;
}

export default function WhatsAppMarketing({ tenantId, negocioNombre }: Props) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string; type: "success" | "error"} | null>(null);

  const [form, setForm] = useState({
    nombre_pieza: "",
    tipo_archivo: "imagen",
    url_archivo: "",
    texto_mensaje: "",
    hashtag: "",
    grupo_whatsapp: "",
    fecha_programada: "",
  });

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const cargar = async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from("publicaciones_whatsapp")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("fecha_programada", { ascending: false });
    setPublicaciones(data || []);
  };

  useEffect(() => { cargar(); }, [tenantId]);

  const subirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const fileName = `${tenantId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("marketing").upload(fileName, file, { upsert: true });
    if (error) {
      showToast("Error al subir: " + error.message, "error");
      setLoading(false);
      return;
    }
    const { data } = supabase.storage.from("marketing").getPublicUrl(fileName);
    setForm({ ...form, url_archivo: data.publicUrl, tipo_archivo: file.type.startsWith("video") ? "video" : "imagen" });
    showToast("✅ Archivo subido");
    setLoading(false);
  };

  const programar = async () => {
    if (!form.nombre_pieza || !form.url_archivo || !form.grupo_whatsapp || !form.fecha_programada) {
      showToast("Completa todos los campos obligatorios", "error");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("publicaciones_whatsapp").insert({
      tenant_id: tenantId,
      nombre_pieza: form.nombre_pieza,
      tipo_archivo: form.tipo_archivo,
      url_archivo: form.url_archivo,
      texto_mensaje: form.texto_mensaje,
      hashtag: form.hashtag,
      grupo_whatsapp: form.grupo_whatsapp,
      fecha_programada: new Date(form.fecha_programada).toISOString(),
      estado: "pendiente",
    });
    if (error) {
      showToast("Error al programar: " + error.message, "error");
    } else {
      showToast("✅ Publicación programada correctamente");
      setForm({ nombre_pieza: "", tipo_archivo: "imagen", url_archivo: "", texto_mensaje: "", hashtag: "", grupo_whatsapp: "", fecha_programada: "" });
      cargar();
    }
    setLoading(false);
  };

  const publicarAhora = async (pub: any) => {
    const mensajeCompleto = `${pub.texto_mensaje || ""}\n\n${pub.hashtag ? "#" + pub.hashtag.replace(/#/g, "").replace(/,/g, " #") : ""}\n\n📎 ${pub.url_archivo}`.trim();

    // Intentar Web Share API (nativa del navegador - incluye WhatsApp grupos)
    if (navigator.share) {
      try {
        await navigator.share({
          title: pub.nombre_pieza,
          text: mensajeCompleto,
          url: pub.url_archivo,
        });
        // Compartir exitoso
        await supabase.from("publicaciones_whatsapp").update({
          estado: "publicado",
          fecha_publicacion_real: new Date().toISOString(),
          enlace_compartido: pub.url_archivo,
        }).eq("id", pub.id);
        showToast("✅ Publicado exitosamente en WhatsApp");
        cargar();
      } catch (err: any) {
        if (err.name !== "AbortError") {
          await supabase.from("publicaciones_whatsapp").update({ estado: "fallido" }).eq("id", pub.id);
          showToast("❌ Error al compartir: " + err.message, "error");
        } else {
          await supabase.from("publicaciones_whatsapp").update({ estado: "cancelado" }).eq("id", pub.id);
          showToast("Cancelado por el usuario", "error");
        }
        cargar();
      }
    } else {
      // Fallback: copiar al portapapeles
      await navigator.clipboard.writeText(mensajeCompleto);
      showToast("📋 Texto copiado. Pégalo en el grupo de WhatsApp", "success");
    }
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta publicación?")) return;
    await supabase.from("publicaciones_whatsapp").delete().eq("id", id);
    showToast("🗑️ Eliminada");
    cargar();
  };

  const pendientes = publicaciones.filter(p => p.estado === "pendiente");
  const publicadas = publicaciones.filter(p => p.estado === "publicado");

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 w-full max-w-full overflow-x-hidden">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-xl">
            <MessageCircle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Marketing WhatsApp</h1>
            <p className="text-green-100 text-sm">{negocioNombre || "Tu negocio"} · Grupos de barrio</p>
          </div>
        </div>
      </div>

      {/* FORMULARIO NUEVA PUBLICACIÓN */}
      <div className="bg-white rounded-2xl p-6 border shadow-sm">
        <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Nueva publicación
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full min-w-0">
          <input
            placeholder="Nombre de la pieza *"
            value={form.nombre_pieza}
            onChange={(e) => setForm({ ...form, nombre_pieza: e.target.value })}
            className="border rounded-lg p-3"
          />
          <input
            placeholder="Grupo de WhatsApp * (ej: Vecinos Barrio)"
            value={form.grupo_whatsapp}
            onChange={(e) => setForm({ ...form, grupo_whatsapp: e.target.value })}
            className="border rounded-lg p-3"
          />
          <div className="md:col-span-2">
            <textarea
              placeholder="Texto del mensaje (opcional)"
              value={form.texto_mensaje}
              onChange={(e) => setForm({ ...form, texto_mensaje: e.target.value })}
              rows={3}
              className="w-full border rounded-lg p-3"
            />
          </div>
          <input
            placeholder="Hashtags (ej: oferta, barrio, promocion)"
            value={form.hashtag}
            onChange={(e) => setForm({ ...form, hashtag: e.target.value })}
            className="border rounded-lg p-3"
          />
          <input
            type="datetime-local"
            value={form.fecha_programada}
            onChange={(e) => setForm({ ...form, fecha_programada: e.target.value })}
            className="border rounded-lg p-3"
          />
          <div className="md:col-span-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={subirArchivo}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed rounded-lg p-4 hover:bg-stone-50 flex items-center justify-center gap-2 text-stone-600"
            >
              <Upload className="w-5 h-5" />
              {form.url_archivo ? "✅ Archivo cargado" : "Subir imagen o video *"}
            </button>
            {form.url_archivo && form.tipo_archivo === "imagen" && (
              <img src={form.url_archivo} alt="preview" className="mt-2 rounded-lg max-h-40 object-contain" />
            )}
          </div>
          <button
            onClick={programar}
            disabled={loading}
            className="md:col-span-2 bg-green-600 text-white rounded-lg p-3 font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Calendar className="w-5 h-5" /> {loading ? "Procesando..." : "Programar publicación"}
          </button>
        </div>
      </div>

      {/* PUBLICACIONES PENDIENTES */}
      {pendientes.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border shadow-sm">
          <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" /> Pendientes ({pendientes.length})
          </h2>
          <div className="space-y-3">
            {pendientes.map((pub) => (
              <div key={pub.id} className="border rounded-xl p-4">
                <div className="flex gap-3">
                  {pub.tipo_archivo === "imagen" ? (
                    <img src={pub.url_archivo} className="w-20 h-20 object-cover rounded-lg" alt="" />
                  ) : (
                    <video src={pub.url_archivo} className="w-20 h-20 object-cover rounded-lg" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-stone-800">{pub.nombre_pieza}</div>
                    <div className="text-xs text-stone-600">📱 Grupo: {pub.grupo_whatsapp}</div>
                    <div className="text-xs text-stone-600">📅 {new Date(pub.fecha_programada).toLocaleString("es-CO")}</div>
                    {pub.texto_mensaje && <div className="text-xs text-stone-600 mt-1 line-clamp-2">{pub.texto_mensaje}</div>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => publicarAhora(pub)}
                    className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-1 hover:bg-green-700"
                  >
                    <Send className="w-4 h-4" /> Publicar ahora
                  </button>
                  <button
                    onClick={() => eliminar(pub.id)}
                    className="bg-stone-100 text-stone-700 rounded-lg p-2 hover:bg-stone-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PUBLICACIONES EXITOSAS */}
      {publicadas.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border shadow-sm">
          <h2 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" /> Publicadas ({publicadas.length})
          </h2>
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

      {/* OTRAS REDES EN DESARROLLO */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <h3 className="font-semibold text-amber-900 mb-2">🚧 Próximamente</h3>
        <p className="text-sm text-amber-800">Integración con Facebook, Instagram y TikTok en desarrollo.</p>
      </div>

      {/* TOAST */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-2xl z-50 max-w-sm flex items-center gap-2 ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
