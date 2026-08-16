"use client";
import { useEffect } from "react";

export default function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!navigator.onLine) return;
    const params = new URLSearchParams(window.location.search);
    const tenantId = params.get("tenant");
    if (!tenantId) return;
    if (sessionStorage.getItem("warm-" + tenantId)) return;
    const parts = window.location.pathname.split("/").filter(Boolean);
    const slug = parts[0] || "restaurante";
    const mods = ["pos","inventario","pedidos","finanzas","reportes","tienda","produccion","personal","compras","creditos"];
    const apis = ["/api/products?tenant=" + tenantId, "/api/inventory?tenant=" + tenantId, "/api/ventas?tenant=" + tenantId, "/api/tenant-config?tenant=" + tenantId];
    const timers: any[] = [];
    mods.forEach((m, i) => timers.push(setTimeout(() => { fetch("/" + slug + "/" + m + "?tenant=" + tenantId).catch(() => {}); }, 1200 + i * 250)));
    apis.forEach((u, i) => timers.push(setTimeout(() => { fetch(u).catch(() => {}); }, 1200 + i * 250)));
    sessionStorage.setItem("warm-" + tenantId, "1");
    return () => timers.forEach(clearTimeout);
  }, []);

  return null;
}
