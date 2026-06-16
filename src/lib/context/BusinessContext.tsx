'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface BusinessConfig {
  tipoNegocio: string
  modulosActivos: string[]
}

const defaultConfig: BusinessConfig = {
  tipoNegocio: 'panaderia',
  modulosActivos: ['pos', 'produccion', 'inventario', 'finanzas', 'personal', 'pedidos', 'reportes', 'tienda']
}

const BusinessContext = createContext<BusinessConfig>(defaultConfig)

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<BusinessConfig>(defaultConfig)

  useEffect(() => {
    // Cargar configuración desde API o localStorage
    const saved = localStorage.getItem('businessConfig')
    if (saved) {
      setConfig(JSON.parse(saved))
    }
  }, [])

  return (
    <BusinessContext.Provider value={config}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  return useContext(BusinessContext)
}

// Helper para saber si un módulo está activo
export function useModuloActivo(modulo: string): boolean {
  const { modulosActivos } = useBusiness()
  return modulosActivos.includes(modulo)
}
