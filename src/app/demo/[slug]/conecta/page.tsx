"use client";
import PageHeader from "@/components/PageHeader";
import ConectaProximamente from "@/components/ConectaProximamente";
import { useParams, useSearchParams } from "next/navigation";

export default function ConectaPage() {
  const params = useParams();
  const sp = useSearchParams();
  const slug = (params.slug as string) || "";
  return (
    <div className="min-h-screen bg-stone-50">
      <PageHeader negocioSlug={slug} titulo="Conecta y Diviértete" icono="🎮" subtitulo="Juegos, retos y tu voz" tenantId={sp.get("tenant") || ""} />
      <ConectaProximamente />
    </div>
  );
}