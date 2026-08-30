"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Mail, Globe } from "lucide-react";
import { NEGOCIOS } from "@/config/negocios";
import { createClient } from "@/lib/supabase/client";

interface PageHeaderProps {
  negocioSlug: string;
  titulo: string;
  icono?: string;
  subtitulo?: string;
  acciones?: React.ReactNode;
  tenantId?: string;
}

interface ConfigNegocio {
  nombre_negocio?: string;
  slogan?: string;
  direccion?: string;
  telefono?: string;
  whatsapp?: string;
  correo_contacto?: string;
  logo_url?: string;
  color_principal?: string;
  color_secundario?: string;
  website?: string;
}

const DEFAULT_CONFIG: ConfigNegocio = {
  nombre_negocio: "Mi Negocio",
  slogan: "",
  direccion: "",
  telefono: "",
  correo_contacto: "",
  logo_url: "",
  color_principal: "#fdb813",
  color_secundario: "#0b1220",
  website: "",
};

export default function PageHeader({
  negocioSlug,
  titulo,
  icono = "📦",
  subtitulo,
  acciones,
  tenantId,
}: PageHeaderProps) {
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const [urlTenant, setUrlTenant] = useState<string | null>(null);
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tenant");
    if (t) setUrlTenant(t);
  }, []);
  const effectiveTenantId = tenantId || urlTenant || negocio?.tenantId;

  const [config, setConfig] = useState<ConfigNegocio>({
    ...DEFAULT_CONFIG,
    nombre_negocio: negocio?.titulo || "Mi Negocio",
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!effectiveTenantId) {
      setCargando(false);
      return;
    }

    const cargarConfig = async () => {
      try {
        const res = await fetch(`/api/tenant-config?tenant=${effectiveTenantId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setConfig({ ...DEFAULT_CONFIG, ...data.data });
        }
      } catch (e) {
        console.error("Error cargando config del negocio:", e);
      } finally {
        setCargando(false);
      }
    };

    cargarConfig();
  }, [effectiveTenantId]);

  const colorPrincipal = config.color_principal || "#F7B500";
  const colorSecundario = config.color_secundario || "#FFC107";

  return (
    <>
      {/* Franja institucional con colores dinámicos */}
      <div
        className="border-b-2"
        style={{
          background: `linear-gradient(to right, ${colorPrincipal}, ${colorSecundario})`,
          borderColor: colorPrincipal,
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 md:py-3">
          {/* FILA 1: Logo + Nombre + Teléfono */}
          <div className="flex items-center gap-2 md:gap-4">
            {config.logo_url ? (
              <img
                src={config.logo_url}
                alt={`Logo ${config.nombre_negocio}`}
                className="w-11 h-11 md:w-14 md:h-14 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0 bg-white"
              />
            ) : (
              <div className="w-11 h-11 md:w-14 md:h-14 rounded-full bg-white flex items-center justify-center text-2xl md:text-3xl border-2 border-white shadow-md flex-shrink-0">
                {icono}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-sm md:text-lg font-extrabold text-stone-900 truncate">
                {config.nombre_negocio || negocio?.titulo || "Mi Negocio"}
              </h2>
              {config.slogan && (
                <p className="text-[10px] md:text-sm text-white italic truncate font-medium hidden sm:block">
                  {config.slogan}
                </p>
              )}
              {config.telefono && (
                <a
                  href={`tel:${config.telefono.replace(/\s/g, "")}`}
                  className="flex items-center gap-1 text-[11px] md:hidden text-stone-900 font-semibold mt-0.5"
                >
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span>{config.telefono}</span>
                </a>
              )}
            </div>
          </div>

          {/* FILA 2: Dirección y contacto */}
          {(config.direccion || config.telefono || config.correo_contacto) && (
            <div className="flex flex-col gap-0.5 mt-1 md:mt-2 text-[11px] md:text-xs text-white font-medium">
              {config.direccion && (
                <div className="flex items-center gap-1.5 md:gap-2">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{config.direccion}</span>
                </div>
              )}
              {config.telefono && (
                <div className="hidden md:flex items-center gap-2">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span>{config.telefono}</span>
                </div>
              )}
              {config.correo_contacto && (
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{config.correo_contacto}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Header del módulo con acento dinámico */}
      <div
        className="bg-white shadow-sm border-b-2 sticky top-0 z-20"
        style={{ borderColor: colorPrincipal }}
      >
        <div className="px-3 sm:px-4 py-2.5 md:py-3 max-w-7xl mx-auto flex flex-wrap items-center gap-2 sm:gap-3">
          {isAuthenticated && <Link
            href={typeof window !== "undefined" ? (() => { const o = new URLSearchParams(window.location.search).get("origen"); if (o) return decodeURIComponent(o); return !window.location.pathname.startsWith("/demo/") ? `/${window.location.pathname.split("/")[1]}` : `/demo/${negocioSlug}`; })() : `/demo/${negocioSlug}`}
            className="p-2 hover:bg-stone-100 rounded-xl shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-stone-700" />
          </Link>}
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-stone-900 truncate flex items-center gap-2">
              <span className="text-2xl">{icono}</span>
              <span>{titulo}</span>
            </h1>
            {subtitulo && (
              <p className="text-xs sm:text-sm text-stone-700 truncate mt-0.5">
                {subtitulo}
              </p>
            )}
          </div>
          {acciones && (
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap max-w-full">
              {acciones}
            </div>
          )}
        </div>
      </div>
    </>
  );
}