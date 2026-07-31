"use client";

import DemoInventarioPage from "@/app/demo/restaurante/inventario/page";
import { useSearchParams } from "next/navigation";

export default function SlugInventarioPage() {
  const searchParams = useSearchParams();
  return <DemoInventarioPage searchParams={searchParams} />;
}