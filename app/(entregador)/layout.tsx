'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Package, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function EntregadorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-zinc-900 text-white px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-black tracking-tight text-[var(--color-lime-primary)]">
          FOODIN<span className="text-white text-xs ml-1 font-bold">ENTREGADOR</span>
        </span>
        <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
        <Link
          href="/entregas"
          className={cn(
            'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-bold transition-colors',
            pathname.startsWith('/entregas') ? 'text-zinc-900' : 'text-gray-400'
          )}
        >
          <Package className="w-5 h-5" />
          Entregas
        </Link>
      </nav>
    </div>
  )
}
