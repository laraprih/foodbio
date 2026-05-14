import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await auth()
  const user = (session?.user as any)
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 400 })

  const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5 MB' }, { status: 400 })
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Somente imagens são permitidas' }, { status: 400 })
  }

  // Use Cloudinary if configured
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET

  if (cloudName && uploadPreset) {
    const cloudForm = new FormData()
    cloudForm.append('file', file)
    cloudForm.append('upload_preset', uploadPreset)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: cloudForm,
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Cloudinary error:', err)
      return NextResponse.json({ error: 'Erro no upload para Cloudinary' }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ url: data.secure_url })
  }

  // Fallback: store as base64 data URL in the database
  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const dataUrl = `data:${file.type};base64,${base64}`

  return NextResponse.json({ url: dataUrl })
}
