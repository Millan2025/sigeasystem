import { NegocioDashboard } from "@/components/NegocioDashboard";

export default function FerreteriaPage() {
  return (
    <NegocioDashboard 
      negocio="ferreteria"
      config={{
        titulo: "Ferretería El Tornillo",
        icono: "🔩",
        categoria: "Ferretería",
        tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76"
      }}
    />
  );
}
