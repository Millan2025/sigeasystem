import { NegocioDashboard } from "@/components/NegocioDashboard";

export default function CarniceriaPage() {
  return (
    <NegocioDashboard 
      negocio="carniceria"
      config={{
        titulo: "Carnicería El Buen Sabor",
        icono: "🥩",
        categoria: "Carnicería",
        tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76"
      }}
    />
  );
}

