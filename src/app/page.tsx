'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, DollarSign, Package, Users, Truck, BarChart3, TrendingUp, Share2, ChefHat } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [isDemo, setIsDemo] = useState(false)
  const [cajaAbierta, setCajaAbierta] = useState(true)
  const [ventasHoy, setVentasHoy] = useState(0)
  const [showShare, setShowShare] = useState(false)

  useEffect(() => {
    // Detectar demo desde la URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setIsDemo(params.get('demo') === 'fjmillan39')
    }

    // Cargar ventas
    fetch('/api/sales')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.totales) setVentasHoy(d.totales.total || 0)
      })
      .catch(() => {})
  }, [])

  // ... resto del componente
}
