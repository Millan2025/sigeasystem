"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Package, ShoppingCart, Store, ShoppingBag, CreditCard, Users, BarChart3, Settings } from "lucide-react";

interface BusinessConfig {
  id: string;
  nombre_negocio: string;
  gerente: string;
  correo_contacto: string;
  telefono: string;
  direccion: string;
  logo_url: string | null;
  color_principal: string;
  color_secundario: string;
  plan: string;
}

export default function ClienteDashboard() {
  const supabase = createClient();
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      // Obtener tenant del usuario
      const { data: { session } } = await supabase.auth.getSession();
      let tenant = session?.user?.user_metadata?.tenant_id;
      if (!tenant) {
        const { data: userData } = await supabase
          .from('usuarios')
          .select('tenant_id')
          .eq('id', session?.user?.id)
          .single();
        tenant = userData?.tenant_id;
      }
      setTenantId(tenant);

      if (tenant) {
        const { data: configData } = await supabase
          .from('business_config')
          .select('*')
          .eq('id', tenant)
          .single();
        setConfig(configData);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-stone-500">Cargando...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-stone-800">No se encontró configuración del negocio</h1>
          <p className="text-stone-500">Contacta al administrador.</p>
        </div>
      </div>
    );
  }

  const primaryColor = config.color_principal || '#10B981';
  const secondaryColor = config.color_secundario || '#059669';

  const modulos = [
    { name: 'Inventario', icon: Package, href: `/inventario?tenant=${tenantId}` },
    { name: 'POS', icon: ShoppingCart, href: `/demo/${config.nombre_negocio.toLowerCase().replace(/\s/g, '-')}/pos?tenant=${tenantId}` },
    { name: 'Tienda', icon: Store, href: `/demo/${config.nombre_negocio.toLowerCase().replace(/\s/g, '-')}/tienda?tenant=${tenantId}` },
    { name: 'Compras', icon: ShoppingBag, href: `/demo/${config.nombre_negocio.toLowerCase().replace(/\s/g, '-')}/compras?tenant=${tenantId}` },
    { name: 'Créditos', icon: CreditCard, href: `/demo/${config.nombre_negocio.toLowerCase().replace(/\s/g, '-')}/creditos?tenant=${tenantId}` },
    { name: 'Personal', icon: Users, href: `/personal?tenant=${tenantId}` },
    { name: 'Reportes', icon: BarChart3, href: `/reportes?tenant=${tenantId}` },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header con colores del negocio */}
      <div 
        className="p-6 text-white"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
      >
        <div className="flex items-center gap-4">
          {config.logo_url ? (
            <img src={config.logo_url} alt={config.nombre_negocio} className="w-16 h-16 rounded-full object-cover border-2 border-white" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">
              🏪
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{config.nombre_negocio}</h1>
            <p className="text-sm opacity-90">Gerente: {config.gerente}</p>
            <div className="flex flex-wrap gap-2 text-xs mt-1 opacity-80">
              <span>📞 {config.telefono}</span>
              <span>📍 {config.direccion}</span>
            </div>
            <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
              Plan {config.plan}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de módulos */}
      <div className="p-4 max-w-4xl mx-auto">
        <h2 className="text-lg font-bold text-stone-800 mb-4">📋 Módulos disponibles</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {modulos.map((modulo) => (
            <Link
              key={modulo.name}
              href={modulo.href}
              className="bg-white rounded-2xl p-4 border border-stone-200 hover:shadow-md transition flex flex-col items-center text-center"
              style={{ borderColor: primaryColor }}
            >
              <modulo.icon className="w-8 h-8 mb-2" style={{ color: primaryColor }} />
              <span className="font-medium text-stone-800 text-sm">{modulo.name}</span>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-stone-400 border-t border-stone-200 pt-4">
          <p>SIGEA System v1.0 · {config.nombre_negocio}</p>
        </div>
      </div>
    </div>
  );
}
