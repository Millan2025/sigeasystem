'use client'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  return (
    <button onClick={() => window.location.href = '/login'} className="fixed top-4 right-4 z-50 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600">
      <LogOut className="w-4 h-4" />
    </button>
  )
}
