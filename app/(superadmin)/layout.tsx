'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Building2, LogOut, Menu, X, ChevronRight,
  ShieldCheck,
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard',  href: '/superadmin/dashboard' },
  { icon: Building2,       label: 'Empresas',   href: '/superadmin/empresas' },
];

function NavItem({ item, active, collapsed, onClick }: {
  item: typeof menuItems[0]; active: boolean; collapsed?: boolean; onClick?: () => void
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
        collapsed ? 'justify-center' : '',
        active
          ? 'bg-violet-600 text-white shadow-sm'
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
        </>
      )}
    </Link>
  );
}

function Logo({ small }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn('bg-violet-600 rounded-xl flex items-center justify-center shrink-0', small ? 'w-8 h-8' : 'w-9 h-9')}>
        <ShieldCheck className={cn('text-white', small ? 'w-4 h-4' : 'w-5 h-5')} />
      </div>
      {!small && (
        <div>
          <p className="font-black text-gray-900 text-sm leading-tight">Foodin</p>
          <p className="text-violet-600 text-[10px] font-bold uppercase tracking-wider leading-tight">Master Admin</p>
        </div>
      )}
    </div>
  );
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const signOutUrl = '/superadmin/login';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {drawerOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col z-50 transition-transform duration-300 lg:hidden shadow-xl',
        drawerOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <Logo />
          <button onClick={() => setDrawerOpen(false)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map(item => (
            <NavItem key={item.href} item={item} active={pathname.startsWith(item.href)} onClick={() => setDrawerOpen(false)} />
          ))}
        </nav>
        <div className="px-3 pb-5 border-t border-gray-100 pt-3">
          <button onClick={() => signOut({ callbackUrl: signOutUrl })} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-500 hover:bg-red-50 transition-colors font-semibold text-sm">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      {/* Tablet icon-only sidebar */}
      <aside className="hidden md:flex lg:hidden flex-col w-16 bg-white border-r border-gray-100 shrink-0">
        <div className="flex items-center justify-center h-14 border-b border-gray-100">
          <Logo small />
        </div>
        <nav className="flex-1 flex flex-col items-center gap-1 px-2 pt-3">
          {menuItems.map(item => (
            <NavItem key={item.href} item={item} active={pathname.startsWith(item.href)} collapsed />
          ))}
        </nav>
        <div className="px-2 pb-4 border-t border-gray-100 pt-2 flex justify-center">
          <button onClick={() => signOut({ callbackUrl: signOutUrl })} className="w-10 h-10 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 transition-colors" title="Sair">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 bg-white border-r border-gray-100 shrink-0">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <Logo />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map(item => (
            <NavItem key={item.href} item={item} active={pathname.startsWith(item.href)} />
          ))}
        </nav>
        <div className="px-3 pb-5 border-t border-gray-100 pt-3">
          <button onClick={() => signOut({ callbackUrl: signOutUrl })} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-500 hover:bg-red-50 transition-colors font-semibold text-sm">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-gray-100 shrink-0">
          <button onClick={() => setDrawerOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-600">
            <Menu className="w-5 h-5" />
          </button>
          <Logo />
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
