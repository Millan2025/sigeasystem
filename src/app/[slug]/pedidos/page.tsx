"use client";

import DemoPedidosPage from "@/app/demo/restaurante/pedidos/page";
import { useSearchParams } from "next/navigation";

export default function SlugPedidosPage() {
  const searchParams = useSearchParams();
  return <DemoPedidosPage searchParams={searchParams} />;
}