'use client'
import Link from 'next/link'

export default function LogoHeader() {
  return (
    <Link href="/" className="shrink-0">
      <img src="/logo%20Blanco-sigea.png" alt="SIGEA" className="h-10 w-auto object-contain" onError={(e: any) => { e.target.style.display = 'none' }} />
    </Link>
  )
}

