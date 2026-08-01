import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

const TENANT_STORAGE_KEY = 'sigea_tenant_id'
const TENANT_FALLBACK = '7e045520-5e36-4e3f-a39f-10ea7d6dce76' // Cambia a tu tenant por defecto

export function useTenant() {
  const searchParams = useSearchParams()
  const [tenant, setTenant] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Intentar desde la URL (prioridad máxima)
    let tenantId = searchParams.get('tenant')

    // 2. Si no está en URL, de localStorage
    if (!tenantId && typeof window !== 'undefined') {
      tenantId = localStorage.getItem(TENANT_STORAGE_KEY)
    }

    // 3. Si aún no hay, usar fallback (y guardarlo)
    if (!tenantId) {
      tenantId = TENANT_FALLBACK
      console.warn('⚠️ No se encontró tenant. Usando fallback:', tenantId)
      if (typeof window !== 'undefined') {
        localStorage.setItem(TENANT_STORAGE_KEY, tenantId)
      }
    } else {
      // Guardar en localStorage para futuras visitas offline
      if (typeof window !== 'undefined') {
        localStorage.setItem(TENANT_STORAGE_KEY, tenantId)
      }
    }

    setTenant(tenantId)
    setLoading(false)
  }, [searchParams])

  return { tenant, loading }
}