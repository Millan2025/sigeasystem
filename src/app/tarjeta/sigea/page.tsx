"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Maximize2, Minimize2, Zap } from "lucide-react";

const SIGEA_DATA = {
  nombre: "SIGEA",
  slogan: "Tu negocio bajo control",
  descripcion: "Sistema integral para restaurantes, panaderías, tiendas y más",
  responsable: "Ing. Francisco Millán",
  telefono: "3136436488",
  email: "sigea.millan@gmail.com",
  direccion: "Calle 134 # 8g-101 Conjunto Koralia",
  urlCorta: "sigea.app/demo",
  urlCompleta: "https://sigea-system.vercel.app/demo",
  beneficios: [
    "POS + Inventario + Finanzas + Personal",
    "Multi-sede y franquicias",
    "Pedidos y mesas con QR",
    "Reportes en tiempo real"
  ]
};

export default function TarjetaSIGEA() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [presentacion, setPresentacion] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(SIGEA_DATA.urlCompleta, {
      width: 800,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" }
    }).then(setQrDataUrl);
  }, []);

  useEffect(() => {
    if (presentacion) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      (navigator as any).wakeLock?.request("screen").catch(() => {});
    } else {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    }
  }, [presentacion]);

  const descargarTarjeta = async () => {
    if (!canvasRef.current || !qrDataUrl) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 675;

    const gradient = ctx.createLinearGradient(0, 0, 1200, 675);
    gradient.addColorStop(0, "#0c0a09");
    gradient.addColorStop(1, "#1c1917");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 675);

    ctx.strokeStyle = "#fdb813";
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 1160, 635);

    // Logo SIGEA
    ctx.fillStyle = "#fdb813";
    ctx.fillRect(60, 60, 100, 100);
    ctx.fillStyle = "#0c0a09";
    ctx.font = "bold 64px Arial";
    ctx.textAlign = "center";
    ctx.fillText("S", 110, 130);
    ctx.textAlign = "left";

    // Nombre y slogan
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 56px Arial";
    ctx.fillText(SIGEA_DATA.nombre, 200, 120);
    ctx.fillStyle = "#fdb813";
    ctx.font = "28px Arial";
    ctx.fillText(SIGEA_DATA.slogan, 200, 155);

    // Responsable
    ctx.fillStyle = "#d6d3d1";
    ctx.font = "24px Arial";
    ctx.fillText(SIGEA_DATA.responsable, 200, 210);

    // Contacto
    ctx.fillStyle = "#ffffff";
    ctx.font = "22px Arial";
    let y = 280;
    ctx.fillText("📱 " + SIGEA_DATA.telefono, 200, y);
    y += 40;
    ctx.fillText("✉️ " + SIGEA_DATA.email, 200, y);
    y += 40;
    ctx.fillText("📍 " + SIGEA_DATA.direccion, 200, y);
    y += 50;

    // URL corta
    ctx.fillStyle = "#fdb813";
    ctx.font = "bold 32px Arial";
    ctx.fillText("🌐 " + SIGEA_DATA.urlCorta, 200, y);

    // QR
    const qr = new Image();
    qr.src = qrDataUrl;
    qr.onload = () => {
      ctx.fillStyle = "#fdb813";
      ctx.fillRect(720, 80, 420, 420);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(740, 100, 380, 380);
      ctx.drawImage(qr, 755, 115, 350, 350);

      ctx.fillStyle = "#0c0a09";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Escanea y descubre cómo SIGEA", 930, 530);
      ctx.fillText("transforma tu negocio", 930, 555);
      ctx.textAlign = "left";

      const link = document.createElement("a");
      link.download = "tarjeta-sigea.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
  };

  if (presentacion) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center p-3 select-none overflow-auto">
        <button
          onClick={() => setPresentacion(false)}
          className="absolute top-3 right-3 p-3 bg-white/10 rounded-full text-white z-30"
        >
          <Minimize2 className="w-6 h-6" />
        </button>

        <div className="relative w-full max-w-3xl md:aspect-[1.8] rounded-3xl overflow-hidden shadow-2xl border border-[#fdb813]/40 bg-gradient-to-br from-stone-900 via-stone-950 to-black">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(#fdb813 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#fdb813]/10 blur-3xl" />

          <div className="relative h-full flex flex-col md:flex-row">
            <div className="flex-1 p-6 md:p-8 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#fdb813] flex items-center justify-center shadow-lg">
                    <span className="text-stone-900 font-black text-2xl">S</span>
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{SIGEA_DATA.nombre}</h1>
                    <p className="text-[#fdb813] text-sm md:text-base font-semibold">{SIGEA_DATA.slogan}</p>
                  </div>
                </div>
                <div className="mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-[#fdb813] to-transparent" />
                <p className="text-stone-300 text-sm mt-3">{SIGEA_DATA.responsable}</p>
              </div>

              <div className="space-y-2 text-stone-200 text-sm md:text-base">
                <p>📱 {SIGEA_DATA.telefono}</p>
                <p>✉️ {SIGEA_DATA.email}</p>
                <p>📍 {SIGEA_DATA.direccion}</p>
              </div>

              <p className="text-[#fdb813] font-bold text-base md:text-lg tracking-wide">🌐 {SIGEA_DATA.urlCorta}</p>
            </div>

            <div className="md:w-[38%] bg-gradient-to-b from-[#fdb813] to-[#b8860b] p-4 md:p-5 flex flex-col items-center justify-center gap-2">
              <p className="text-stone-900 font-extrabold text-sm md:text-base text-center leading-tight">Escanea y descubre cómo SIGEA transforma tu negocio</p>
              <div className="bg-white rounded-2xl p-2.5 md:p-3 shadow-xl" style={{ width: "min(46vw, 240px)" }}>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR" className="w-full h-auto rounded-lg" />
                ) : (
                  <div className="w-full aspect-square bg-stone-200 rounded-lg animate-pulse" />
                )}
              </div>
              <p className="text-stone-900/80 text-[11px] md:text-xs font-semibold text-center">Apunta tu cámara · abre al instante</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Tarjeta Digital SIGEA</h1>
            <p className="text-stone-400">Descárgala o muéstrala en Modo Presentación</p>
          </div>
          <button
            onClick={() => setPresentacion(true)}
            className="flex items-center gap-2 px-6 py-4 bg-[#fdb813] text-stone-900 rounded-xl font-extrabold text-lg hover:bg-yellow-400"
          >
            <Maximize2 className="w-6 h-6" />
            Modo Presentación
          </button>
        </div>

        <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 rounded-2xl p-8 border-4 border-[#fdb813] shadow-2xl mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-[#fdb813] flex items-center justify-center shadow-lg">
                  <span className="text-stone-900 font-black text-3xl">S</span>
                </div>
                <div>
                  <h2 className="text-4xl font-extrabold text-white">{SIGEA_DATA.nombre}</h2>
                  <p className="text-xl text-[#fdb813] font-semibold">{SIGEA_DATA.slogan}</p>
                </div>
              </div>

              <p className="text-stone-300 text-lg mb-4">{SIGEA_DATA.descripcion}</p>
              <p className="text-stone-400 font-semibold mb-6">{SIGEA_DATA.responsable}</p>

              <div className="space-y-2 text-lg text-white mb-4">
                <p>📱 {SIGEA_DATA.telefono}</p>
                <p>✉️ {SIGEA_DATA.email}</p>
                <p>📍 {SIGEA_DATA.direccion}</p>
              </div>

              <p className="text-2xl font-bold text-[#fdb813]">🌐 {SIGEA_DATA.urlCorta}</p>
            </div>
            <div className="w-full md:w-72 flex flex-col items-center">
              {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-64 h-64 bg-white rounded-xl p-3 shadow-lg" />}
              <p className="text-stone-400 text-sm mt-3 text-center">Escanea y descubre SIGEA</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={descargarTarjeta}
            className="py-4 bg-[#fdb813] text-stone-900 rounded-xl font-extrabold text-lg hover:bg-yellow-400 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" /> Descargar PNG
          </button>
          <button
            onClick={() => setPresentacion(true)}
            className="py-4 bg-stone-700 text-white rounded-xl font-bold text-lg hover:bg-stone-600 flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" /> Modo Presentación
          </button>
        </div>

        <div className="bg-stone-800 rounded-xl p-6 text-stone-300">
          <h3 className="text-xl font-bold text-white mb-3">Cómo usarla en visitas:</h3>
          <ol className="space-y-2 list-decimal list-inside">
            <li>Descarga el PNG y guárdalo en tu galería</li>
            <li>En cada visita, abre <strong>Modo Presentación</strong> y muestra la tarjeta en tu cel</li>
            <li>El cliente apunta su cámara al QR → abre la demo completa de SIGEA</li>
            <li>También puede escribir: <strong className="text-[#fdb813]">{SIGEA_DATA.urlCorta}</strong></li>
          </ol>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
