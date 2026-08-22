"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  onSuccess: () => void;
  tipoNegocio?: string;
  fuente?: "qr_publico" | "redes" | "face_to_face";
}

export default function LeadForm({ onSuccess, tipoNegocio = "tienda", fuente = "qr_publico" }: Props) {
  const supabase = createClient();
  const [form, setForm] = useState({
    nombre: "",
    whatsapp: "",
    email: "",
    tipo_negocio: tipoNegocio,
    facebook: "",
    instagram: "",
    tiktok: "",
  });
  const [loading, setLoading] = useState(false);

  const guardar = async () => {
    if (!form.nombre || !form.whatsapp || !form.email) {
      alert("Nombre, WhatsApp y correo son obligatorios");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      alert("El correo electrónico no es válido");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("crm_prospectos").insert({
      nombre: form.nombre,
      whatsapp: form.whatsapp,
      email: form.email || null,
      tipo_negocio: form.tipo_negocio,
      estado: "demo",
      fuente: fuente,
      plan_interes: "barrio",
      notas: [
        form.email ? `Email: ${form.email}` : null,
        form.facebook ? `Facebook: ${form.facebook}` : null,
        form.instagram ? `Instagram: ${form.instagram}` : null,
        form.tiktok ? `TikTok: ${form.tiktok}` : null,
      ].filter(Boolean).join(" | "),
    });
    setLoading(false);
    if (error) {
      alert("Error al guardar: " + error.message);
      return;
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full my-8">
        <h2 className="text-xl font-bold text-stone-800 mb-2">🎁 Accede al dashboard completo</h2>
        <p className="text-sm text-stone-600 mb-4">
          Descubre todas las herramientas que harán crecer tu negocio
        </p>
        <div className="space-y-3">
          <input
            placeholder="Tu nombre *"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-3"
          />
          <input
            placeholder="WhatsApp (solo números) *"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            className="w-full border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-3"
            type="tel"
          />
          <input
            placeholder="Correo electrónico *"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-3"
            type="email"
          />
          <select
            value={form.tipo_negocio}
            onChange={(e) => setForm({ ...form, tipo_negocio: e.target.value })}
            className="w-full border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-3"
          >
            <option value="tienda">Tienda</option>
            <option value="panaderia">Panadería</option>
            <option value="carniceria">Carnicería</option>
            <option value="salsamentaria">Salsamentaria</option>
            <option value="ferreteria">Ferretería</option>
            <option value="restaurante">Restaurante</option>
            <option value="distribuidora">Distribuidora</option>
          </select>

          <div className="border-t pt-3 mt-3">
            <p className="text-xs text-stone-500 mb-2">Tus redes (opcional, para enviarte contenido):</p>
            <input
              placeholder="Facebook"
              value={form.facebook}
              onChange={(e) => setForm({ ...form, facebook: e.target.value })}
              className="w-full border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-2 text-sm mb-2"
            />
            <input
              placeholder="Instagram"
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              className="w-full border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-2 text-sm mb-2"
            />
            <input
              placeholder="TikTok"
              value={form.tiktok}
              onChange={(e) => setForm({ ...form, tiktok: e.target.value })}
              className="w-full border-2 border-stone-300 bg-white rounded-lg text-stone-800 placeholder:text-stone-500 focus:outline-none focus:border-emerald-600 p-2 text-sm"
            />
          </div>

          <button
            onClick={guardar}
            disabled={loading}
            className="w-full bg-emerald-600 text-white rounded-lg p-3 font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "🚀 Acceder al dashboard completo"}
          </button>
          <p className="text-xs text-stone-400 text-center">
            Te contactaremos para personalizar tu experiencia
          </p>
        </div>
      </div>
    </div>
  );
}
