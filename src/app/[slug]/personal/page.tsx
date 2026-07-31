"use client";

import DemoPersonalPage from "@/app/demo/restaurante/personal/page";
import { useSearchParams } from "next/navigation";

export default function SlugPersonalPage() {
  const searchParams = useSearchParams();
  return <DemoPersonalPage searchParams={searchParams} />;
}