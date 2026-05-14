'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'
import { X, RotateCcw, Eraser, Check, Loader2, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

interface ImageEditorModalProps {
  file: File | null
  onConfirm: (blob: Blob, filename: string) => void
  onClose: () => void
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.crossOrigin = 'anonymous'
    el.onload = () => resolve(el)
    el.onerror = reject
    el.src = imageSrc
  })
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)
  return new Promise((res, rej) =>
    canvas.toBlob(b => (b ? res(b) : rej(new Error('canvas vazio'))), 'image/png')
  )
}

const ASPECT_OPTIONS = [
  { label: 'Livre', value: undefined as number | undefined },
  { label: '1:1',  value: 1 },
  { label: '4:1',  value: 4 },
  { label: '16:9', value: 16 / 9 },
]

export default function ImageEditorModal({ file, onConfirm, onClose }: ImageEditorModalProps) {
  const [imageSrc, setImageSrc]               = useState<string | null>(null)
  const [crop, setCrop]                        = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom]                        = useState(1)
  const [aspect, setAspect]                    = useState<number | undefined>(undefined)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [phase, setPhase]                      = useState<'crop' | 'removing' | 'preview'>('crop')
  const [bgBlob, setBgBlob]                    = useState<Blob | null>(null)
  const [bgUrl, setBgUrl]                      = useState<string | null>(null)
  const [applying, setApplying]                = useState(false)
  const [bgStatus, setBgStatus]                = useState('')
  const objUrlRef                              = useRef<string | null>(null)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    objUrlRef.current = url
    setImageSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleRemoveBg = async () => {
    if (!croppedAreaPixels || !imageSrc) return
    setPhase('removing')
    setBgStatus('Cortando imagem...')

    // Abort controller so we can cancel if the user closes the modal
    const controller = new AbortController()

    try {
      const cropped = await getCroppedBlob(imageSrc, croppedAreaPixels)

      setBgStatus('Carregando modelo… (pode demorar na 1ª vez)')
      const { removeBackground } = await import('@imgly/background-removal')

      setBgStatus('Removendo fundo…')
      // Note: progress callback intentionally omitted — it fires hundreds of
      // times per second and would flood React with state updates.
      const result = await removeBackground(cropped, {
        model: 'isnet_quint8',
        output: { format: 'image/png', quality: 0.9 },
      })

      if (controller.signal.aborted) return

      if (bgUrl) URL.revokeObjectURL(bgUrl)
      const preview = URL.createObjectURL(result)
      setBgBlob(result)
      setBgUrl(preview)
      setPhase('preview')
    } catch (err) {
      if (controller.signal.aborted) return
      console.error(err)
      toast.error('Não foi possível remover o fundo. Tente novamente.')
      setPhase('crop')
    }
  }

  const handleReset = () => {
    setPhase('crop')
    if (bgUrl) URL.revokeObjectURL(bgUrl)
    setBgUrl(null)
    setBgBlob(null)
  }

  const handleApply = async () => {
    if (applying) return
    setApplying(true)
    try {
      let blob: Blob
      if (phase === 'preview' && bgBlob) {
        blob = bgBlob
      } else {
        if (!croppedAreaPixels || !imageSrc) return
        blob = await getCroppedBlob(imageSrc, croppedAreaPixels)
      }
      const name = (file?.name ?? 'image').replace(/\.[^.]+$/, '.png')
      onConfirm(blob, name)
    } catch {
      toast.error('Erro ao processar imagem')
    } finally {
      setApplying(false)
    }
  }

  if (!file || !imageSrc) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg flex flex-col overflow-hidden"
        style={{ maxHeight: '95dvh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-black text-gray-900">Editar imagem</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {phase === 'crop' && 'Ajuste o recorte'}
              {phase === 'removing' && bgStatus}
              {phase === 'preview' && 'Fundo removido — confirme ou refaça'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas area */}
        <div className="relative shrink-0" style={{ height: 300 }}>
          {phase === 'preview' && bgUrl ? (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'repeating-conic-gradient(#d1d5db 0% 25%, #f9fafb 0% 50%) 0 0 / 20px 20px' }}
            >
              <img src={bgUrl} alt="sem fundo" className="max-w-full max-h-full object-contain" />
            </div>
          ) : phase === 'removing' ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-950">
              <Loader2 className="w-10 h-10 text-[var(--color-lime-primary)] animate-spin" />
              <p className="text-sm text-gray-300 text-center px-8">{bgStatus}</p>
            </div>
          ) : (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        {/* Controls — only visible when cropping */}
        {phase === 'crop' && (
          <div className="px-5 pt-3 pb-1 shrink-0 space-y-3">
            {/* Zoom */}
            <div className="flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="range" min={1} max={3} step={0.05} value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 accent-[var(--color-lime-primary)] h-1.5"
              />
              <ZoomIn className="w-4 h-4 text-gray-400 shrink-0" />
            </div>

            {/* Aspect ratio */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 shrink-0">Proporção</span>
              <div className="flex gap-1.5 flex-wrap">
                {ASPECT_OPTIONS.map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => setAspect(opt.value)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                      aspect === opt.value
                        ? 'bg-[var(--color-lime-primary)] text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 shrink-0 mt-auto">
          {phase === 'preview' ? (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Refazer
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={applying}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-lime-primary)] text-white text-sm font-bold hover:brightness-90 transition-all ml-auto disabled:opacity-60"
              >
                {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Usar imagem
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRemoveBg}
                disabled={phase === 'removing'}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                <Eraser className="w-4 h-4" /> Remover fundo
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={applying || phase === 'removing'}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-lime-primary)] text-white text-sm font-bold hover:brightness-90 transition-all ml-auto disabled:opacity-60"
              >
                {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Aplicar corte
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
