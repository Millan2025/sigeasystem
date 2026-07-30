import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const TENANT_STORAGE_KEY = 'sigea_tenant_id'
const TENANT_FALLBACK = '20e53ee4-44df-40d5-bcd0-cc8b5fbc8965'

export function useTenant() {
  const searchParams = useSearchParams()
  const [tenant, setTenant] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Intentar obtener de la URL (prioridad máxima)
    let tenantId = searchParams.get('tenant')
    
    // 2. Si no está en URL, intentar de localStorage (para modo offline)
    if (!tenantId && typeof window !== 'undefined') {
      tenantId = localStorage.getItem(TENANT_STORAGE_KEY)
      if (tenantId) {
        console.log('📦 Tenant recuperado de localStorage:', tenantId)
      }
    }
    
    // 3. Si aún no hay, usar fallback
    if (!tenantId) {
      tenantId = TENANT_FALLBACK
      console.warn('⚠️ No se encontró tenant. Usando fallback:', tenantId)
    }
    
    // 4. Guardar en localStorage para futuras visitas offline
    if (tenantId && typeof window !== 'undefined') {
      localStorage.setItem(TENANT_STORAGE_KEY, tenantId)
    }
    
    setTenant(tenantId)
    setLoading(false)
  }, [searchParams])

  return { tenant, loading }
}
