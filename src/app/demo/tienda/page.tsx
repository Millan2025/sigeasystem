import { NegocioDashboard } from "@/components/NegocioDashboard";

export default function TiendaPage() {
  return (
    <NegocioDashboard 
      negocio="tienda"
      config={{
        titulo: "Tienda Surtimax",
        icono: "🏪",
        categoria: "Tienda",
        tenantId: "58d06407-6d1c-4beb-acee-8965001fbbee"
      }}
    />
  );
}

