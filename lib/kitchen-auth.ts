import { jwtVerify } from 'jose'
import { NextRequest } from 'next/server'

function secret() {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? 'foodin-super-secret-key-2026')
}

export interface KitchenSession {
  id: string
  name: string
  email: string
  role: string
  tenantId: string
  tenantName: string
  section: string
  slug: string
}

export async function getKitchenSession(req: NextRequest): Promise<KitchenSession | null> {
  const token = req.cookies.get('cozinha_session')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret())
    if (payload.role !== 'cook') return null
    return payload as unknown as KitchenSession
  } catch {
    return null
  }
}
