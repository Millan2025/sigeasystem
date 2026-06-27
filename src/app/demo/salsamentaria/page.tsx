import NegocioDashboard from "@/components/NegocioDashboard";

export default function SalsamentariaPage() {
  return (
    <NegocioDashboard 
      negocio="salsamentaria"
      config={{
        titulo: "Salsamentaria La Especial",
        icono: "🧀",
        categoria: "Salsamentaria",
        tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76"
      }}
    />
  );
}

