import { createClient } from '@/lib/supabase/client'

export async function getTenantId(): Promise<string> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  // 1. Intentar obtener de user_metadata
  if (session?.user?.user_metadata?.tenant_id) {
    return session.user.user_metadata.tenant_id
  }
  
  // 2. Intentar obtener de la tabla usuarios
  if (session?.user?.id) {
    const { data: userData } = await supabase
      .from('usuarios')
      .select('tenant_id')
      .eq('id', session.user.id)
      .single()
    if (userData?.tenant_id) {
      return userData.tenant_id
    }
  }
  
  // 3. Fallback: tenant por defecto
  return '7e045520-5e36-4e3f-a39f-10ea7d6dce76'
}

export async function getBusinessConfig(tenantId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('business_config')
    .select('*')
    .eq('id', tenantId)
    .single()
  return data
}
