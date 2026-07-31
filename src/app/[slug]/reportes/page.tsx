"use client";

import DemoReportesPage from "@/app/demo/restaurante/reportes/page";
import { useSearchParams } from "next/navigation";

export default function SlugReportesPage() {
  const searchParams = useSearchParams();
  return <DemoReportesPage searchParams={searchParams} />;
}