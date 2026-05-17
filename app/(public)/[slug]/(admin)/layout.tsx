'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Utensils, ShoppingBag, DollarSign,
  Settings, LogOut, Menu, X, ChevronRight, Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { signOut, useSession } from 'next-auth/react';
import useSessionStore from '@/store/session-store';
import { get } from '@/lib/api-client';
import type { TenantInfo } from '@/types';

function NavItem({
  href, label, icon: Icon, active, collapsed, onClick,
}: {
  href: string; label: string; icon: React.ElementType;
  active: boolean; collapsed?: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group',
        collapsed ? 'justify-center' : '',
        active
          ? 'bg-[var(--color-lime-primary)] text-white shadow-sm'
          : 'text-gray-500 hover:bg-[var(--color-app-bg)] hover:text-gray-900'
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
        </>
      )}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: session, status } = useSession();
  const setTenant = useSessionStore((s) => s.setTenant);

  // Auth guard
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/${slug}/admin/login?callbackUrl=${pathname}`);
      return;
    }
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'admin') {
        router.replace(`/${slug}/admin/login`);
      }
    }
  }, [status, session, slug, pathname, router]);

  useEffect(() => {
    if ((session?.user as any)?.tenantId) {
      get<TenantInfo & Record<string, unknown>>('/api/admin/tenant').then((res) => {
        if (res && !('error' in res)) {
          setTenant({ id: res.id, slug: res.slug, name: res.name, gateway: res.gateway as TenantInfo['gateway'] });
        }
      });
    }
  }, [(session?.user as any)?.tenantId, setTenant]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--color-lime-primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if ((session?.user as any)?.role !== 'admin') {
    return null;
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard',    href: `/${slug}/dashboard` },
    { icon: ShoppingBag,     label: 'Pedidos',       href: `/${slug}/pedidos` },
    { icon: Utensils,        label: 'Cardápio',      href: `/${slug}/cardapio` },
    { icon: Users,           label: 'Equipe',        href: `/${slug}/equipe` },
    { icon: DollarSign,      label: 'Financeiro',    href: `/${slug}/financeiro` },
    { icon: Settings,        label: 'Configurações', href: `/${slug}/configuracoes` },
  ];

  const handleSignOut = () => signOut({ callbackUrl: `/${slug}/admin/login` });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col z-50 transition-transform duration-300 lg:hidden shadow-xl',
        drawerOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--color-lime-primary)] rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">F</span>
            </div>
            <span className="font-black text-gray-900 text-base tracking-tight">
              Foodbio<span className="text-[var(--color-lime-primary)] text-xs ml-0.5">admin</span>
            </span>
          </div>
          <button onClick={() => setDrawerOpen(false)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavItem key={item.href} {...item} active={pathname === item.href} onClick={() => setDrawerOpen(false)} />
          ))}
        </nav>
        <div className="px-3 pb-5 border-t border-gray-100 pt-3">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-500 hover:bg-red-50 transition-colors font-semibold text-sm"
          >
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      {/* Tablet icon-only sidebar */}
      <aside className="hidden md:flex lg:hidden flex-col w-16 bg-white border-r border-gray-100 shrink-0">
        <div className="flex items-center justify-center h-14 border-b border-gray-100">
          <div className="w-8 h-8 bg-[var(--color-lime-primary)] rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-sm">F</span>
          </div>
        </div>
        <nav className="flex-1 flex flex-col items-center gap-1 px-2 pt-3">
          {menuItems.map((item) => (
            <NavItem key={item.href} {...item} active={pathname === item.href} collapsed />
          ))}
        </nav>
        <div className="px-2 pb-4 border-t border-gray-100 pt-2 flex justify-center">
          <button
            onClick={handleSignOut}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 transition-colors"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Desktop full sidebar */}
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 bg-white border-r border-gray-100 shrink-0">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="w-8 h-8 bg-[var(--color-lime-primary)] rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white font-black text-sm">F</span>
          </div>
          <span className="font-black text-gray-900 text-base tracking-tight">
            Foodbio<span className="text-[var(--color-lime-primary)] text-xs ml-0.5">admin</span>
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavItem key={item.href} {...item} active={pathname === item.href} />
          ))}
        </nav>
        <div className="px-3 pb-5 border-t border-gray-100 pt-3">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-500 hover:bg-red-50 transition-colors font-semibold text-sm"
          >
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-gray-100 shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[var(--color-lime-primary)] rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">F</span>
            </div>
            <span className="font-black text-gray-900 text-sm tracking-tight">
              Foodbio<span className="text-[var(--color-lime-primary)] text-[10px] ml-0.5">admin</span>
            </span>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
