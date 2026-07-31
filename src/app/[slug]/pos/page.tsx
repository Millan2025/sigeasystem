"use client";

import DemoPosPage from "@/app/demo/restaurante/pos/page";
import { useSearchParams } from "next/navigation";

export default function SlugPosPage() {
  const searchParams = useSearchParams();
  return <DemoPosPage searchParams={searchParams} />;
}