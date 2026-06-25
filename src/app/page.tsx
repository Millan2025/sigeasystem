import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Bienvenido a Sigea System</h1>
      <p>Ir a la demo de <Link href="/demo/restaurante/pos">Restaurante</Link></p>
    </div>
  );
}
