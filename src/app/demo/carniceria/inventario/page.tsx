"use client";

import { useParams } from "next/navigation";
import { ModuloNegocioPage } from "@/components/demo-modules/ModuloNegocioPage";

// Mapeo de negocios con sus configuraciones
const NEGOCIOS: Record<string, { titulo: string; categoria: string; tenantId: string }> = {
  panaderia: { titulo: "Panadería Doña Rosa", categoria: "Panadería", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  restaurante: { titulo: "Restaurante Caribe", categoria: "Restaurante", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  carniceria: { titulo: "Carnicería El Buen Sabor", categoria: "Carnicería", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  salsamentaria: { titulo: "Salsamentaria La Especial", categoria: "Salsamentaria", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  ferreteria: { titulo: "Ferretería El Tornillo", categoria: "Ferretería", tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76" },
  tienda: { titulo: "Tienda Surtimax", categoria: "Tienda", tenantId: "58d06407-6d1c-4beb-acee-8965001fbbee" },
};

export default function ModuloNegocioPage() {
  const params = useParams();
  const negocioSlug = params?.negocio as string;
  const negocio = NEGOCIOS[negocioSlug];
  if (!negocio) return <div>Negocio no encontrado</div>;
  
  // Determinar el título del módulo basado en la URL
  const pathParts = window.location.pathname.split('/');
  const moduloName = pathParts[pathParts.length - 1];
  const titulos: Record<string, string> = {
    pos: "Punto de Venta",
    inventario: "Inventario",
    produccion: "Producción",
    finanzas: "Finanzas",
    pedidos: "Pedidos",
    personal: "Personal",
    reportes: "Reportes",
    tienda: "Tienda"
  };
  const titulo = titulos[moduloName] || "Módulo";
  
  return (
    <ModuloNegocioPage 
      titulo={`${titulo} - ${negocio.titulo}`}
      icono={<span className="text-2xl">{negocio.titulo === "Panadería Doña Rosa" ? "🍞" : 
               negocio.titulo === "Restaurante Caribe" ? "🍽️" :
               negocio.titulo === "Carnicería El Buen Sabor" ? "🥩" :
               negocio.titulo === "Salsamentaria La Especial" ? "🧀" :
               negocio.titulo === "Ferretería El Tornillo" ? "🔩" : "🏪"}</span>}
      negocioSlug={negocioSlug}
      categoria={negocio.categoria}
      tenantId={negocio.tenantId}
    />
  );
}
