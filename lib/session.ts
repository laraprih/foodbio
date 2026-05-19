import type { Session } from 'next-auth'

// Duas variantes de auth para rotas admin:
// requireAdmin   → só role 'admin'
// requireStaff   → 'admin' | 'attendant' | 'cook'
// requireSuper   → só role 'superadmin'

export function requireAdmin(session: Session | null): string | null {
  const user = session?.user as { role?: string; tenantId?: string } | undefined
  if (!user || user.role !== 'admin' || !user.tenantId) return null
  return user.tenantId
}

export function requireStaff(session: Session | null): string | null {
  const user = session?.user as { role?: string; tenantId?: string } | undefined
  if (!user || !['admin', 'attendant', 'cook'].includes(user.role ?? '') || !user.tenantId) return null
  return user.tenantId
}

export function requireSuper(session: Session | null): boolean {
  const user = session?.user as { role?: string } | undefined
  return user?.role === 'superadmin'
}

export function getSessionUserId(session: Session | null): string | null {
  return (session?.user as { id?: string } | undefined)?.id ?? null
}
