"use client";

import DemoProductosPage from "@/app/demo/restaurante/productos/page";
import { useSearchParams } from "next/navigation";

export default function SlugProductosPage() {
  const searchParams = useSearchParams();
  return <DemoProductosPage searchParams={searchParams} />;
}