"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Sparkles, Heart, Music, MessageCircle, Gift, CheckCircle, XCircle } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ConectaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mesa = searchParams.get("mesa");
  const tenant = searchParams.get("tenant") || "39d09849-939d-4004-9c17-f72be4fb114d";

  // Estado de la experiencia
  const [paso, setPaso] = useState<"bienvenida" | "jugando" | "esperando" | "revelacion" | "premio">("bienvenida");
  const [juegoActual, setJuegoActual] = useState<any>(null);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<string | null>(null);
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Generar o recuperar token anónimo del dispositivo
  const [tokenDispositivo, setTokenDispositivo] = useState("");
  useEffect(() => {
    let token = localStorage.getItem("conecta_token");
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem("conecta_token", token);
    }
    setTokenDispositivo(token);
  }, []);

  // Cargar un juego aleatorio al iniciar
  const iniciarJuego = async () => {
    setLoading(true);
    try {
      // Obtenemos un juego de tipo 'sincronia' o 'termometro' aleatorio
      const { data: juegos } = await supabase
        .from('conecta_juegos')
        .select('*')
        .eq('tenant_id', tenant)
        .eq('activo', true)
        .in('tipo', ['sincronia', 'termometro']);

      if (juegos && juegos.length > 0) {
        const juegoRandom = juegos[Math.floor(Math.random() * juegos.length)];
        setJuegoActual(juegoRandom);
        setPaso("jugando");
      }
    } catch (e) {
      console.error("Error cargando juego", e);
    }
    setLoading(false);
  };

  const enviarRespuesta = async () => {
    if (!respuestaSeleccionada || !juegoActual) return;
    setLoading(true);

    try {
      const res = await fetch("/api/conecta/jugar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant,
          mesa_codigo: mesa,
          token_dispositivo: tokenDispositivo,
          juego_id: juegoActual.id,
          respuesta: respuestaSeleccionada
        })
      });
      const data = await res.json();

      if (data.success) {
        if (data.estado === "esperando") {
          setPaso("esperando");
        } else if (data.estado === "revelacion") {
          setResultado(data);
          setPaso("revelacion");
          // Efecto de confeti o vibración del celular podría ir aquí
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        }
      }
    } catch (e) {
      console.error("Error enviando respuesta", e);
    }
    setLoading(false);
  };

  // --- RENDERIZADO DE PASOS ---

  if (paso === "bienvenida") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 to-stone-800 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 max-w-md w-full shadow-2xl">
          <Sparkles className="w-16 h-16 text-[#fdb813] mx-auto mb-4 animate-pulse" />
          <h1 className="text-3xl font-extrabold text-white mb-2">¡Bienvenido a la Mesa {mesa}!</h1>
          <p className="text-stone-300 mb-8">
            Mientras llega tu pedido, pon a prueba qué tanto se conocen con tu acompañante. ¡Hay una sorpresa al final! 🎁
          </p>
          <button
            onClick={iniciarJuego}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#fdb813] to-[#e8a800] text-stone-900 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform"
          >
            <Heart className="w-6 h-6" />
            {loading ? "Cargando..." : "Iniciar Reto de Sincronía"}
          </button>
        </div>
      </div>
    );
  }

  if (paso === "jugando" && juegoActual) {
    const opciones = JSON.parse(juegoActual.opciones);
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-stone-900 flex flex-col items-center justify-center p-6">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 max-w-md w-full shadow-2xl">
          <p className="text-[#fdb813] text-sm font-bold uppercase tracking-wider mb-2">Pregunta para la mesa</p>
          <h2 className="text-2xl font-bold text-white mb-6 leading-relaxed">{juegoActual.pregunta}</h2>
          
          <div className="space-y-3">
            {opciones.map((opcion: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setRespuestaSeleccionada(opcion)}
                className={`w-full p-4 rounded-xl text-left font-semibold transition-all border-2 ${
                  respuestaSeleccionada === opcion
                    ? "bg-[#fdb813] text-stone-900 border-[#fdb813] scale-105"
                    : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                }`}
              >
                {opcion.replace(/["\[\]]/g, "")}
              </button>
            ))}
          </div>

          <button
            onClick={enviarRespuesta}
            disabled={!respuestaSeleccionada || loading}
            className="w-full mt-8 py-4 bg-white text-stone-900 rounded-2xl font-extrabold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-200 transition"
          >
            {loading ? "Enviando..." : "Enviar mi respuesta en secreto"}
          </button>
        </div>
      </div>
    );
  }

  if (paso === "esperando") {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-bounce mb-4">
          <MessageCircle className="w-16 h-16 text-[#fdb813]" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">¡Respuesta guardada!</h2>
        <p className="text-stone-400 max-w-xs">
          Pídele a tu acompañante que escanee el QR o abra el enlace en su celular para responder.
        </p>
        <div className="mt-8 w-8 h-8 border-4 border-[#fdb813] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (paso === "revelacion" && resultado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-stone-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-500">
          {resultado.coinciden ? (
            <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
          ) : (
            <XCircle className="w-20 h-20 text-orange-400 mx-auto mb-4" />
          )}
          
          <h2 className="text-3xl font-extrabold text-white mb-2">
            {resultado.coinciden ? "¡Sincronía Total!" : "¡Misterio Revelado!"}
          </h2>
          <p className="text-xl text-[#fdb813] font-semibold mb-6">"{resultado.mensaje}"</p>

          <div className="bg-stone-800/80 border border-dashed border-[#fdb813] rounded-2xl p-6 mb-6">
            <p className="text-stone-400 text-xs uppercase tracking-widest mb-2">Tu Premio por Jugar</p>
            <p className="text-3xl font-mono font-bold text-white tracking-wider mb-2">{resultado.premio.codigo}</p>
            <p className="text-sm text-stone-300">{resultado.premio.descripcion}</p>
          </div>

          <p className="text-stone-400 text-sm mb-6">Muéstrale este código a tu mesero al momento de pedir o pagar.</p>

          <button
            onClick={() => router.push(`/mesa?m=${mesa}&tenant=${tenant}`)}
            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2"
          >
            <Music className="w-5 h-5" />
            Volver al Menú de la Mesa
          </button>
        </div>
      </div>
    );
  }

  return null;
}