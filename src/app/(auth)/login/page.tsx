'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase.from('profiles').select('rol').eq('id', data.user.id).single()

    if (profile?.rol === 'admin_master') {
      window.location.href = '/admin'
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-6xl block mb-4">🍞</span>
          <h1 className="text-2xl font-bold text-stone-800">SIGEA System</h1>
          <p className="text-stone-500 text-sm mt-1">Inicia sesion para continuar</p>
        </div>
        <form onSubmit={handleLogin} className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium text-center">{error}</div>}
          <div><label className="block text-sm font-bold text-stone-700 mb-1">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 outline-none focus:border-emerald-400" /></div></div>
          <div><label className="block text-sm font-bold text-stone-700 mb-1">Contrasena</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" /><input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="w-full pl-10 pr-12 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 outline-none focus:border-emerald-400" /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">{showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div></div>
          <button type="submit" disabled={loading} className="w-full bg-emerald-500 text-white rounded-2xl py-4 font-bold text-lg hover:bg-emerald-600 transition disabled:opacity-50 flex items-center justify-center gap-2"><LogIn className="w-5 h-5" />{loading ? 'Ingresando...' : 'Iniciar Sesion'}</button>
          <p className="text-center text-sm text-stone-500">No tienes cuenta? <Link href="/registro" className="text-emerald-600 font-bold hover:underline">Registrate</Link></p>
        </form>
      </div>
    </div>
  )
}
