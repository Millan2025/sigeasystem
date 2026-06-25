import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'API funcionando en dev',
    timestamp: new Date().toISOString(),
    env: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ No configurada'
    }
  })
}
