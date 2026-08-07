import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Mail } from "lucide-react";
import { NEGOCIOS } from "@/config/negocios";

interface PageHeaderProps {
  negocioSlug: string;
  titulo: string;
  icono?: string;
  subtitulo?: string;
  acciones?: React.ReactNode;
  tenantId?: string;
}

const LOGO_URL = "https://mlxpnvgputquoxwkhcko.supabase.co/storage/v1/object/sign/LOGO/LOGO%20LA%20CASA%20DEL%20PAN.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV81MTFhZjkwYy1mZTI5LTQ5ZDgtOTcwYi0yOWNiZDgwYThmZmMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJMT0dPL0xPR08gTEEgQ0FTQSBERUwgUEFOLmpwZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODU2MDQzMDMsImV4cCI6MTgxNzE0MDMwM30.PnLI9EmjwDR10CRQB0Zvqbn86cmkuAogIdTqfZ-zACM";

export default function PageHeader({
  negocioSlug,
  titulo,
  icono = "📦",
  subtitulo,
  acciones,
  tenantId
}: PageHeaderProps) {
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];

  const infoNegocio = {
    nombre: negocio?.titulo || "Mi Negocio",
    slogan: "DONDE EL PAN TIENE HISTORIA Y SABOR",
    direccion: "Diagonal 136 #9d1-13, Barranquilla, Colombia",
    telefono: "324 2570162",
    email: "lacasadelpanbarrabarranquilla@gmail.com",
  };

  return (
    <>
      {/* Franja institucional AMARILLO TAXI - Visible en TODOS los tamaños */}
      <div className="bg-gradient-to-r from-[#F7B500] via-[#FFC107] to-[#FFD54F] border-b-2 border-[#B8860B]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 md:py-3 flex items-center gap-3 md:gap-4">
          {/* Logo */}
          <img
            src={LOGO_URL}
            alt="Logo La Casa del Pan"
            className="w-10 h-10 md:w-14 md:h-14 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0 bg-white"
          />
          
          {/* Nombre y slogan */}
          <div className="flex-1 min-w-0">
            <h2 className="text-sm md:text-lg font-extrabold text-stone-900 truncate">
              {infoNegocio.nombre}
            </h2>
            <p className="text-xs md:text-sm text-stone-800 italic truncate font-medium hidden sm:block">
              {infoNegocio.slogan}
            </p>
          </div>
          
          {/* Info de contacto - solo en desktop */}
          <div className="hidden md:flex flex-col gap-1 text-xs text-stone-800 font-medium">
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-xs">{infoNegocio.direccion}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3 flex-shrink-0" />
              <span>{infoNegocio.telefono}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-xs">{infoNegocio.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Header del módulo con acento amarillo */}
      <div className="bg-white shadow-sm border-b-2 border-[#F7B500] sticky top-0 z-20">
        <div className="px-3 sm:px-4 py-3 max-w-7xl mx-auto flex items-center gap-2 sm:gap-3">
          <Link
            href={`/demo/${negocioSlug}`}
            className="p-2 hover:bg-amber-50 rounded-xl shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-stone-700" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-stone-800 truncate flex items-center gap-2">
              <span className="text-2xl">{icono}</span>
              <span>{titulo}</span>
            </h1>
            {subtitulo && (
              <p className="text-xs sm:text-sm text-stone-500 truncate mt-0.5">
                {subtitulo}
              </p>
            )}
          </div>
          {acciones && (
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {acciones}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
