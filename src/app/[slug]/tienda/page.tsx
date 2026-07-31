"use client";

import DemoTiendaPage from "@/app/demo/restaurante/tienda/page";
import { useSearchParams } from "next/navigation";

export default function SlugTiendaPage() {
  const searchParams = useSearchParams();
  return <DemoTiendaPage searchParams={searchParams} />;
}