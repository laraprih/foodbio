'use client';

import React from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Package, User, Bike } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function EntregadorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const slug = params.slug as string;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top header */}
      <header className="bg-zinc-950 text-white sticky top-0 z-40 border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--color-lime-primary)] rounded-xl flex items-center justify-center">
              <Bike className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-black text-white text-sm tracking-tight">Foodbio</span>
              <span className="text-[var(--color-lime-primary)] text-[10px] ml-1 font-bold">entregador</span>
            </div>
          </div>
          <button className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
            <User className="w-4 h-4 text-white" />
          </button>
        </div>
      </header>

      <main className="flex-1 pb-20">{children}</main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center justify-around">
          <Link
            href={`/${slug}/entregas`}
            className={cn(
              'flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-colors',
              pathname.includes('/entregas')
                ? 'text-zinc-900'
                : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <Package className="w-5 h-5" />
            <span className="text-[10px] font-bold">Entregas</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
