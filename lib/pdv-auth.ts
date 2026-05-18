import { jwtVerify } from 'jose'
import { NextRequest } from 'next/server'

function secret() {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? 'foodin-super-secret-key-2026')
}

export interface PDVSession {
  id: string
  name: string
  email: string
  role: string
  tenantId: string
  tenantName: string
  section: string
  slug: string
}

export async function getPDVSession(req: NextRequest): Promise<PDVSession | null> {
  const token = req.cookies.get('pdv_session')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret())
    if (payload.role !== 'attendant') return null
    return payload as unknown as PDVSession
  } catch {
    return null
  }
}
