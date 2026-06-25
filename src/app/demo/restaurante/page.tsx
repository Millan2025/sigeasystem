import { NegocioDashboard } from "@/components/NegocioDashboard";

export default function RestaurantePage() {
  return (
    <NegocioDashboard 
      negocio="restaurante"
      config={{
        titulo: "Restaurante Caribe",
        icono: "🍽️",
        categoria: "Restaurante",
        tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76"
      }}
    />
  );
}

