'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'

export type SectionType = 'pdv' | 'cozinha' | 'entregador'

export interface SectionUser {
  id: string
  name: string
  email: string
  role: string
  tenantId: string
  tenantName?: string
  section: string
  slug: string
}

export interface SectionAuth {
  user: SectionUser | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  logout: () => Promise<void>
}

const LOGIN_PATH: Record<SectionType, string> = {
  pdv: 'pdv/login',
  cozinha: 'cozinha/login',
  entregador: 'entregador/login',
}

export function useSectionAuth(section: SectionType): SectionAuth {
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string

  const [user, setUser] = useState<SectionUser | null>(null)
  const [status, setStatus] = useState<SectionAuth['status']>('loading')

  useEffect(() => {
    let cancelled = false
    fetch(`/api/auth/section?section=${section}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (cancelled) return
        if (data?.user) {
          setUser(data.user as SectionUser)
          setStatus('authenticated')
        } else {
          setStatus('unauthenticated')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('unauthenticated')
      })
    return () => { cancelled = true }
  }, [section])

  const logout = useCallback(async () => {
    await fetch(`/api/auth/section?section=${section}`, { method: 'DELETE' })
    setUser(null)
    setStatus('unauthenticated')
    router.push(`/${slug}/${LOGIN_PATH[section]}`)
  }, [section, slug, router])

  return { user, status, logout }
}
