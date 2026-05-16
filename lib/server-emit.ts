const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? ''

interface EmitPayload {
  rooms: string | string[]
  event: string
  data: unknown
}

// Server-side only: calls Fastify /api/internal/emit so Socket.IO events fire
// from Vercel Next.js route handlers without needing a persistent WS connection.
export async function serverEmit(payload: EmitPayload): Promise<void> {
  if (!INTERNAL_SECRET) return // skip in local dev if not configured

  try {
    await fetch(`${API_URL}/api/internal/emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${INTERNAL_SECRET}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3_000), // fire-and-forget com timeout curto
    })
  } catch {
    // não bloqueia o fluxo principal se Fastify estiver indisponível
  }
}
