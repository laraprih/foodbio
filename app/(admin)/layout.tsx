'use client';

import React from 'react';
import { LayoutDashboard, Utensils, ShoppingBag, DollarSign, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: ShoppingBag, label: 'Pedidos', href: '/pedidos' },
  { icon: Utensils, label: 'Cardápio', href: '/cardapio' },
  { icon: DollarSign, label: 'Financeiro', href: '/financeiro' },
  { icon: Settings, label: 'Configurações', href: '/configuracoes' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-black tracking-tighter text-[var(--color-lime-primary)]">
            FOODIN<span className="text-white text-xs ml-1 font-bold">ADMIN</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-bold text-sm',
                  isActive
                    ? 'bg-[var(--color-lime-primary)] text-black'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400 hover:bg-red-500/10 transition-colors font-bold text-sm"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
