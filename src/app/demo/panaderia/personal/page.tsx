"use client";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { NEGOCIOS } from "@/config/negocios";
import PersonalModule from "@/components/PersonalModule";
import PageHeader from "@/components/PageHeader";

function PersonalContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pathParts = pathname?.split("/") || [];
  const negocioSlug = pathParts[1] === "demo" ? (pathParts[2] || "restaurante") : (pathParts[1] || "restaurante");
  const negocio = NEGOCIOS[negocioSlug as keyof typeof NEGOCIOS];
  const tenantFromUrl = searchParams.get("tenant");
  const tenantId = tenantFromUrl || negocio?.tenantId || "7e045520-5e36-4e3f-a39f-10ea7d6dce76";

  return (
    <div className="min-h-screen bg-stone-100">
      <PageHeader
        negocioSlug={negocioSlug}
        titulo="Gestión de Personal"
        icono="👥"
        subtitulo="Empleados, asistencias, nómina, vacaciones y evaluaciones"
        tenantId={tenantId}
      />
      <PersonalModule tenantId={tenantId} />
    </div>
  );
}

export default function PersonalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-stone-500">Cargando...</p></div>}>
      <PersonalContent />
    </Suspense>
  );
}