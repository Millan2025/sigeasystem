import { redirect } from "next/navigation";

export default function VentasPage() {
  // Redirigir al POS del restaurante (demo)
  redirect("/demo/restaurante/pos");
}
