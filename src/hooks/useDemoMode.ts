import { useEffect, useState } from 'react'

export function useDemoMode() {
  const [isDemo, setIsDemo] = useState(false)
  const [demoTenantId, setDemoTenantId] = useState<string | null>(null)

  useEffect(() => {
    // Verificar si estamos en modo demo
    const params = new URLSearchParams(window.location.search)
    const demo = params.get('demo')
    
    if (demo === 'fjmillan39') {
      setIsDemo(true)
      // Tenant ID fijo de fjmillan39
      setDemoTenantId('7e045520-5e36-4e3f-a39f-10ea7d6dce76')
      // Guardar en sessionStorage para persistencia
      sessionStorage.setItem('demo_mode', 'true')
      sessionStorage.setItem('demo_tenant', '7e045520-5e36-4e3f-a39f-10ea7d6dce76')
    } else if (sessionStorage.getItem('demo_mode') === 'true') {
      setIsDemo(true)
      setDemoTenantId(sessionStorage.getItem('demo_tenant'))
    }
  }, [])

  return { isDemo, demoTenantId }
}
