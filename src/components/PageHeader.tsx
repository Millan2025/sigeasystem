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
    logo: "🥖",
  };

  return (
    <>
      {/* Info del negocio (visible solo en tablet+) */}
      <div className="hidden md:block bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="text-4xl flex-shrink-0">{infoNegocio.logo}</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-stone-800 truncate">
              {infoNegocio.nombre}
            </h2>
            <p className="text-sm text-stone-600 italic truncate">
              {infoNegocio.slogan}
            </p>
          </div>
          <div className="flex flex-col gap-1 text-xs text-stone-600">
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

      {/* Header del módulo (siempre visible) */}
      <div className="bg-white shadow-sm border-b border-stone-200 sticky top-0 z-20">
        <div className="px-3 sm:px-4 py-3 max-w-7xl mx-auto flex items-center gap-2 sm:gap-3">
          <Link
            href={`/demo/${negocioSlug}`}
            className="p-2 hover:bg-stone-100 rounded-xl shrink-0"
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
