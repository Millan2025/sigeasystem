"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Factory,
  DollarSign,
  ClipboardList,
  Users,
  FileText,
  Store,
  ShoppingBag,
} from "lucide-react";

const MODULOS = [
  { slug: "pos", nombre: "POS", icono: ShoppingCart },
  { slug: "inventario", nombre: "Inventario", icono: Package },
  { slug: "produccion", nombre: "Producción", icono: Factory },
  { slug: "finanzas", nombre: "Finanzas", icono: DollarSign },
  { slug: "pedidos", nombre: "Pedidos", icono: ClipboardList },
  { slug: "personal", nombre: "Personal", icono: Users },
  { slug: "reportes", nombre: "Reportes", icono: FileText },
  { slug: "tienda", nombre: "Tienda", icono: Store },
  { slug: "compras", nombre: "Compras", icono: ShoppingBag },
];

export default function NegocioDashboard({ negocioSlug }: { negocioSlug: string }) {
  const pathname = usePathname();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {MODULOS.map((mod) => {
        const href = `/demo/${negocioSlug}/${mod.slug}`;
        const isActive = pathname === href;
        const Icon = mod.icono;
        return (
          <Link
            key={mod.slug}
            href={href}
            className={`p-4 rounded-2xl border transition flex flex-col items-center gap-2 hover:shadow-md ${
              isActive
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-sm font-medium">{mod.nombre}</span>
          </Link>
        );
      })}
    </div>
  );
}
