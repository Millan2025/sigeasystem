"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          // No autenticado → login
          router.push("/login");
          return;
        }

        // Verificar si es admin_master
        const { data: userData } = await supabase
          .from('usuarios')
          .select('rol, tenant_id')
          .eq('id', session.user.id)
          .single();

        if (userData?.rol === 'admin_master') {
          router.push("/admin");
          return;
        }

        // Si tiene tenant_id, es cliente
        if (userData?.tenant_id) {
          // Generar slug desde el nombre del negocio
const { data: configData } = await supabase
  .from('business_config')
  .select('nombre_negocio')
  .eq('id', userData.tenant_id)
  .single();
const slug = configData?.nombre_negocio?.toLowerCase().replace(/\s+/g, '-') || 'restaurante';
router.push(`/demo/${slug}`);
          return;
        }

        // Fallback: si no tiene rol definido, ir a cliente
        // Generar slug desde el nombre del negocio
const { data: configData } = await supabase
  .from('business_config')
  .select('nombre_negocio')
  .eq('id', userData.tenant_id)
  .single();
const slug = configData?.nombre_negocio?.toLowerCase().replace(/\s+/g, '-') || 'restaurante';
router.push(`/demo/${slug}`);
      } catch (error) {
        console.error("Error en redirección:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-stone-600">Cargando...</p>
      </div>
    </div>
  );
}


