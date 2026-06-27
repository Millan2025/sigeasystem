import NegocioDashboard from "@/components/NegocioDashboard";

export default function PanaderiaPage() {
  return (
    <NegocioDashboard 
      negocio="panaderia"
      config={{
        titulo: "Panadería Doña Rosa",
        icono: "🍞",
        categoria: "Panadería",
        tenantId: "7e045520-5e36-4e3f-a39f-10ea7d6dce76"
      }}
    />
  );
}

