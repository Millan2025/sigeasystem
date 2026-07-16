"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePathname } from "next/navigation";

export default function BackButton() {
  const pathname = usePathname();
  // Extraer el slug: de /[slug]/modulo o /[slug]
  const segments = pathname.split('/').filter(Boolean);
  const slug = segments[0] || 'restaurante';

  return (
    <Link href={`/${slug}`} className="p-2 hover:bg-stone-100 rounded-xl">
      <ArrowLeft className="w-5 h-5 text-stone-700" />
    </Link>
  );
}
