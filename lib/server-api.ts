const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function serverGet<T>(
  path: string,
  revalidate: number | false = 60
): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      next: revalidate === false ? { revalidate: 0 } : { revalidate },
    })
    if (!res.ok) return null
    return res.json() as Promise<T>
  } catch {
    return null
  }
}
