"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle, Plus, Calendar, Image as ImageIcon, Upload, Bell, Settings, TrendingUp } from "lucide-react";
import WhatsAppMarketing from "@/components/WhatsAppMarketing";

interface Props {
  tenantId: string;
  negocioNombre?: string;
}

const REDES = [
  { id: "facebook", nombre: "Facebook", emoji: "📘", color: "bg-blue-600" },
  { id: "instagram", nombre: "Instagram", emoji: "📷", color: "bg-pink-600" },
  { id: "tiktok", nombre: "TikTok", emoji: "🎵", color: "bg-black" },
  { id: "whatsapp", nombre: "WhatsApp Business", emoji: "💬", color: "bg-green-600" },
];

export default function MarketingModule({ tenantId, negocioNombre }: Props) {
  const supabase = createClient();
  const [tab, setTab] = useState<"whatsapp" | "redes" | "piezas" | "cronograma">("whatsapp");
  const [redesConectadas, setRedesConectadas] = useState<any[]>([]);
  const [piezas, setPiezas] = useState<any[]>([]);
  const [publicaciones, setPublicaciones] = useState<any[]>([]);
  const [showModal, setShowModal] = useState<"red" | "pieza" | "publicacion" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const cargar = async () => {
    const { data: r } = await supabase.from("redes_sociales").select("*").eq("tenant_id", tenantId);
    const { data: p } = await supabase.from("piezas_marketing").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
    const { data: pub } = await supabase.from("publicaciones_programadas").select("*, piezas_marketing(nombre), redes_sociales(plataforma)").eq("tenant_id", tenantId).order("fecha_programada");
    setRedesConectadas(r || []);
    setPiezas(p || []);
    setPublicaciones(pub || []);
  };

  useEffect(() => { cargar(); }, [tenantId]);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-7 h-7" /> Marketing Digital
          </h1>
          <p className="text-violet-100 mt-1">{negocioNombre || "Tu negocio"}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto p-4 overflow-x-hidden w-full max-w-full">
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 border shadow-sm overflow-x-auto">
          {[
            { id: "whatsapp", label: "WhatsApp Grupos", icon: MessageCircle },
            { id: "redes", label: "Otras Redes", icon: Settings },
            { id: "piezas", label: "Piezas Publicitarias", icon: ImageIcon },
            { id: "cronograma", label: "Cronograma", icon: Calendar },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition ${
                tab === t.id ? "bg-violet-600 text-white shadow-md" : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* TAB WHATSAPP - FUNCIONAL */}
        {tab === "whatsapp" && (
          <WhatsAppMarketing tenantId={tenantId} negocioNombre={negocioNombre} />
        )}

        {/* TAB REDES */}
        {tab === "redes" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {REDES.map((red) => {
                const conectada = redesConectadas.find(r => r.plataforma === red.id);
                return (
                  <div key={red.id} className="bg-white rounded-xl p-5 border shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`${red.color} text-white p-2 rounded-lg`}>
                          <span className="text-2xl">{red.emoji}</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-stone-800">{red.nombre}</h3>
                          {conectada ? (
                            <span className="text-xs text-emerald-600">● Conectada: {conectada.cuenta}</span>
                          ) : (
                            <span className="text-xs text-stone-400">No conectada</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (conectada) {
                            showToast("⚠️ Desconexión en desarrollo - Próximamente");
                          } else {
                            setShowModal("red");
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          conectada ? "bg-stone-100 text-stone-700" : "bg-violet-600 text-white"
                        }`}
                      >
                        {conectada ? "Desconectar" : "Conectar"}
                      </button>
                    </div>
                    <p className="text-xs text-stone-500">
                      {red.id === "whatsapp" ? "Envía mensajes masivos y catálogos" : `Publica posts, historias y ${red.id === "tiktok" ? "videos" : "reels"}`}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900">Notificaciones y seguimiento</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    Próximamente: recibirás notificaciones de comentarios y mensajes directos para responder desde aquí.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB PIEZAS */}
        {tab === "piezas" && (
          <div>
            <button
              onClick={() => setShowModal("pieza")}
              className="mb-4 bg-violet-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" /> Nueva pieza publicitaria
            </button>

            {piezas.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border">
                <ImageIcon className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500">Aún no tienes piezas publicitarias</p>
                <p className="text-xs text-stone-400 mt-1">Crea tu primera pieza para comenzar a publicar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {piezas.map((p: any) => (
                  <div key={p.id} className="bg-white rounded-xl border overflow-hidden shadow-sm">
                    {p.url_archivo && (
                      <img src={p.url_archivo} alt={p.nombre} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-3">
                      <h4 className="font-semibold text-stone-800">{p.nombre}</h4>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">{p.texto_post || "Sin texto"}</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {(p.plataforma_destino || []).map((pl: string) => (
                          <span key={pl} className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{pl}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB CRONOGRAMA */}
        {tab === "cronograma" && (
          <div>
            <button
              onClick={() => setShowModal("publicacion")}
              className="mb-4 bg-violet-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" /> Programar publicación
            </button>

            {publicaciones.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border">
                <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500">No hay publicaciones programadas</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border divide-y">
                {publicaciones.map((pub: any) => (
                  <div key={pub.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-stone-800">{pub.piezas_marketing?.nombre}</div>
                      <div className="text-xs text-stone-500">
                        {new Date(pub.fecha_programada).toLocaleString("es-CO")} • {pub.redes_sociales?.plataforma}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      pub.estado === "publicado" ? "bg-emerald-100 text-emerald-700" :
                      pub.estado === "fallido" ? "bg-rose-100 text-rose-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {pub.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL RED SOCIAL */}
      {showModal === "red" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-stone-800 mb-4">Conectar red social</h2>
            <div className="space-y-3">
              <select className="w-full border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-3">
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="whatsapp">WhatsApp Business</option>
              </select>
              <input placeholder="Nombre de cuenta / @usuario" className="w-full border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-3" />
              <input placeholder="Token de API / Contraseña" type="password" className="w-full border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-3" />
              <p className="text-xs text-stone-500">
                🔒 Tus credenciales se almacenan de forma segura y encriptada
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowModal(null)} className="flex-1 bg-stone-100 text-stone-700 rounded-lg p-3 font-medium">Cancelar</button>
                <button
                  onClick={() => { setShowModal(null); showToast("⚠️ Conexión real en desarrollo - Próximamente"); }}
                  className="flex-1 bg-violet-600 text-white rounded-lg p-3 font-medium"
                >
                  Conectar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PIEZA */}
      {showModal === "pieza" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-stone-800 mb-4">Nueva pieza publicitaria</h2>
            <div className="space-y-3">
              <input placeholder="Nombre de la pieza *" className="w-full border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-3" />
              <select className="w-full border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-3">
                <option value="imagen">Imagen</option>
                <option value="video">Video</option>
                <option value="carrusel">Carrusel</option>
                <option value="historia">Historia</option>
              </select>
              <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-stone-50">
                <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                <p className="text-sm text-stone-600">Subir archivo</p>
                <p className="text-xs text-stone-400">PNG, JPG, MP4 (máx 50MB)</p>
              </div>
              <textarea placeholder="Texto del post (opcional)" rows={3} className="w-full border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-3" />
              <input placeholder="Hashtags (separados por coma)" className="w-full border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-3" />
              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block"><strong className="text-stone-900 font-semibold">Plataformas destino:</strong></label>
                <div className="flex gap-2 flex-wrap">
                  {REDES.map((r) => (
                    <label key={r.id} className="flex items-center gap-1 text-sm">
                      <input type="checkbox" /> {r.nombre}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowModal(null)} className="flex-1 bg-stone-100 text-stone-700 rounded-lg p-3 font-medium">Cancelar</button>
                <button
                  onClick={() => { setShowModal(null); showToast("⚠️ Guardado en desarrollo - Próximamente"); }}
                  className="flex-1 bg-violet-600 text-white rounded-lg p-3 font-medium"
                >
                  Guardar pieza
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PUBLICACION */}
      {showModal === "publicacion" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-stone-800 mb-4">Programar publicación</h2>
            <div className="space-y-3">
              <select className="w-full border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-3">
                <option>Selecciona una pieza...</option>
                {piezas.map((p: any) => <option key={p.id}>{p.nombre}</option>)}
              </select>
              <select className="w-full border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-3">
                <option>Selecciona red social...</option>
                {redesConectadas.map((r: any) => <option key={r.id}>{r.plataforma} - {r.cuenta}</option>)}
              </select>
              <input type="datetime-local" className="w-full border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-3" />
              <div className="flex gap-2">
                <button onClick={() => setShowModal(null)} className="flex-1 bg-stone-100 text-stone-700 rounded-lg p-3 font-medium">Cancelar</button>
                <button
                  onClick={() => { setShowModal(null); showToast("⚠️ Publicación automática en desarrollo - Próximamente"); }}
                  className="flex-1 bg-violet-600 text-white rounded-lg p-3 font-medium"
                >
                  Programar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-stone-800 text-white px-4 py-3 rounded-xl shadow-2xl z-50 max-w-sm">
          {toast}
        </div>
      )}
    </div>
  );
}
