"use client";
import { useEffect, useState } from "react";
import { Gamepad2, Heart, Brain, Gift, Trophy, MessageSquare, Lightbulb, Users, Sparkles } from "lucide-react";

export default function ConectaProximamente() {
  const [cd, setCd] = useState({ d: 0, h: 0, m: 0 });
  useEffect(() => {
    const target = new Date("2026-10-15T00:00:00");
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff > 0) setCd({ d: Math.floor(diff / 86400000), h: Math.floor(diff / 3600000) % 24, m: Math.floor(diff / 60000) % 60 });
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);
  const juegos = [
    { icon: Heart, color: "from-rose-400 to-pink-500", titulo: "¿Conoces a tu pareja?", desc: "10 preguntas divertidas para medir su compatibilidad y ganar descuentos.", tag: "Romántico" },
    { icon: Brain, color: "from-amber-400 to-orange-500", titulo: "Memoriza los ingredientes", desc: "Encuentra las parejas de ingredientes de nuestros platos estrella.", tag: "Desafío" },
    { icon: Gift, color: "from-emerald-400 to-teal-500", titulo: "Ruleta de sabores", desc: "Gira la ruleta después de tu compra y gana premios sorpresa.", tag: "Sorpresa" },
    { icon: Trophy, color: "from-violet-400 to-purple-500", titulo: "Ranking de parejas", desc: "Compite con otras parejas del barrio por experiencias exclusivas.", tag: "Competencia" },
  ];
  const feedback = [
    { icon: MessageSquare, color: "from-sky-400 to-blue-500", titulo: "Tu voz cuenta", desc: "Califica tu experiencia en 30 segundos." },
    { icon: Lightbulb, color: "from-yellow-400 to-amber-500", titulo: "Buzón de ideas", desc: "Propón platos y mejoras; las más votadas se implementan." },
    { icon: Users, color: "from-pink-400 to-rose-500", titulo: "Embajadores", desc: "Gana insignias y beneficios por participar." },
  ];
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-rose-500 text-white p-8 md:p-12 shadow-2xl">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-sm font-bold mb-4">
            <Sparkles className="w-4 h-4" /> EN DESARROLLO · PRÓXIMAMENTE
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">Conecta y Diviértete</h1>
          <p className="text-lg text-white/90 max-w-2xl mb-8">Juegos interactivos, retos de pareja y un espacio para tu voz: una nueva forma de conectar con tu negocio favorito.</p>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <div className="bg-white/20 rounded-2xl p-4 text-center border border-white/30"><div className="text-3xl font-extrabold">{cd.d}</div><div className="text-xs uppercase tracking-wider opacity-80">Días</div></div>
            <div className="bg-white/20 rounded-2xl p-4 text-center border border-white/30"><div className="text-3xl font-extrabold">{cd.h}</div><div className="text-xs uppercase tracking-wider opacity-80">Horas</div></div>
            <div className="bg-white/20 rounded-2xl p-4 text-center border border-white/30"><div className="text-3xl font-extrabold">{cd.m}</div><div className="text-xs uppercase tracking-wider opacity-80">Min</div></div>
          </div>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl"><Gamepad2 className="w-6 h-6 text-white" /></div>
          <div><h2 className="text-2xl font-bold text-stone-800">Juegos interactivos</h2><p className="text-stone-600 text-sm">Diversión para conectar con tu negocio</p></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {juegos.map((j, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className={"p-3 bg-gradient-to-br " + j.color + " rounded-xl"}><j.icon className="w-6 h-6 text-white" /></div>
                <span className="text-xs font-bold px-3 py-1 bg-stone-100 text-stone-700 rounded-full">{j.tag}</span>
              </div>
              <h3 className="text-lg font-bold text-stone-800 mb-2">{j.titulo}</h3>
              <p className="text-stone-600 text-sm">{j.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-gradient-to-br from-sky-500 to-blue-500 rounded-2xl"><MessageSquare className="w-6 h-6 text-white" /></div>
          <div><h2 className="text-2xl font-bold text-stone-800">Tu voz importa</h2><p className="text-stone-600 text-sm">Experiencias de satisfacción e ideas para mejorar SIGEA</p></div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {feedback.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm">
              <div className={"w-12 h-12 bg-gradient-to-br " + f.color + " rounded-xl flex items-center justify-center mb-4"}><f.icon className="w-6 h-6 text-white" /></div>
              <h3 className="text-lg font-bold text-stone-800 mb-2">{f.titulo}</h3>
              <p className="text-stone-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">Beneficios para tu negocio</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center"><div className="text-3xl font-extrabold text-yellow-400 mb-2">+40%</div><div className="text-sm text-stone-300">Clientes recurrentes</div></div>
          <div className="text-center"><div className="text-3xl font-extrabold text-yellow-400 mb-2">+60%</div><div className="text-sm text-stone-300">Interacción en redes</div></div>
          <div className="text-center"><div className="text-3xl font-extrabold text-yellow-400 mb-2">100+</div><div className="text-sm text-stone-300">Ideas de mejora al año</div></div>
          <div className="text-center"><div className="text-3xl font-extrabold text-yellow-400 mb-2">24/7</div><div className="text-sm text-stone-300">Feedback automático</div></div>
        </div>
      </div>
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
        <h3 className="font-bold text-stone-800 mb-1">Sé el primero en probarlo</h3>
        <p className="text-stone-600 text-sm">Cuando esté disponible recibirás una notificación en tu dashboard, con beneficios exclusivos de lanzamiento.</p>
      </div>
    </div>
  );
}
