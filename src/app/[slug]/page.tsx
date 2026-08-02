"use client";

import NegocioHome from "@/components/NegocioHome";
import { useParams, useSearchParams } from "next/navigation";

export default function SlugPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tenant = searchParams.get("tenant") || "";
  
  // Manejar slug como string o array
  let slug = params.slug;
  if (Array.isArray(slug)) {
    slug = slug[0];
  }
  slug = slug || "restaurante";
  
  return <NegocioHome negocioSlug={slug} tenantId={tenant} />;
}
