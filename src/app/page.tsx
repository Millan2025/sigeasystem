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
          router.push("/login");
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('rol, tenant_id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (userError || !userData) {
          console.error('Error obteniendo datos del usuario:', userError);
          router.push("/login");
          return;
        }

        // Admin Master
        if (userData.rol === 'admin_master') {
          router.push("/admin");
          return;
        }

        // Cliente con tenant
        if (userData.tenant_id) {
          const { data: configData } = await supabase
            .from('business_config')
            .select('nombre_negocio')
            .eq('id', userData.tenant_id)
            .single();

          const slug = configData?.nombre_negocio?.toLowerCase().replace(/\s+/g, '-') || 'restaurante';
          router.push(`/${slug}?tenant=${userData.tenant_id}`);
          return;
        }

        // Fallback
        router.push("/login");
      } catch (error) {
        console.error('Error en redirección:', error);
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

