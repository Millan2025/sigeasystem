"use client";

import DemoProduccionPage from "@/app/demo/restaurante/produccion/page";
import { useSearchParams } from "next/navigation";

export default function SlugProduccionPage() {
  const searchParams = useSearchParams();
  return <DemoProduccionPage searchParams={searchParams} />;
}