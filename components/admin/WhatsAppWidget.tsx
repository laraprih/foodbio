'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  MessageCircle, Wifi, WifiOff, QrCode,
  RefreshCw, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WaStatus {
  provider: 'evolution' | 'zapi' | null
  connected: boolean
  qrCode: string | null
  state?: string
  error?: string
}

const PROVIDER_LABEL: Record<string, string> = {
  evolution: 'Evolution API',
  zapi:      'Z-API',
}

export default function WhatsAppWidget() {
  const { data, isLoading, refetch, isFetching } = useQuery<WaStatus>({
    queryKey: ['whatsapp-status'],
    queryFn:  () => fetch('/api/admin/whatsapp/status').then(r => r.json()),
    // Quando conectado: checa a cada 30s; desconectado: a cada 5s (QR expira)
    refetchInterval: (query) => {
      const d = query.state.data as WaStatus | undefined
      if (!d || !d.connected) return 5_000
      return 30_000
    },
  })

  const connected  = data?.connected ?? false
  const qrCode     = data?.qrCode    ?? null
  const provider   = data?.provider  ?? null
  const error      = data?.error     ?? null

  return (
    <div className={cn(
      'bg-white rounded-2xl border shadow-sm overflow-hidden',
      connected ? 'border-emerald-200' : qrCode ? 'border-amber-200' : 'border-gray-100'
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-5 py-4 border-b',
        connected ? 'bg-emerald-50 border-emerald-100' :
        qrCode    ? 'bg-amber-50 border-amber-100' :
                    'bg-gray-50 border-gray-100'
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center',
            connected ? 'bg-emerald-500' : 'bg-gray-300'
          )}>
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-gray-900">WhatsApp</p>
            <p className="text-[11px] text-gray-500">
              {provider ? PROVIDER_LABEL[provider] : 'Não configurado'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isLoading && (
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-1.5 rounded-lg hover:bg-white/60 text-gray-400 transition-colors"
              title="Atualizar status"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
            </button>
          )}

          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
            connected ? 'bg-emerald-100 text-emerald-700' :
            qrCode    ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-500'
          )}>
            {connected
              ? <><Wifi className="w-3 h-3" /> Conectado</>
              : qrCode
                ? <><QrCode className="w-3 h-3" /> Aguardando</>
                : <><WifiOff className="w-3 h-3" /> Desconectado</>
            }
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {isLoading ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-8 h-8 border-2 border-t-transparent border-gray-300 rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Verificando conexão…</p>
          </div>
        ) : !provider ? (
          /* Não configurado */
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-700">WhatsApp não configurado</p>
              <p className="text-xs text-gray-400 mt-1">
                Configure <code className="bg-gray-100 px-1 rounded">EVOLUTION_URL</code> +{' '}
                <code className="bg-gray-100 px-1 rounded">EVOLUTION_INSTANCE</code> +{' '}
                <code className="bg-gray-100 px-1 rounded">EVOLUTION_API_KEY</code> no servidor para ativar o envio de mensagens.
              </p>
            </div>
          </div>
        ) : connected ? (
          /* Conectado */
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Conectado e pronto!</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Mensagens de confirmação de pedido serão enviadas automaticamente após o pagamento.
              </p>
            </div>
          </div>
        ) : qrCode ? (
          /* QR code para escanear */
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <p className="font-bold text-sm text-gray-900">Escaneie o QR Code</p>
              <p className="text-xs text-gray-500 mt-1">
                Abra o WhatsApp no celular do restaurante →{' '}
                <strong>Menu</strong> → <strong>Dispositivos Conectados</strong> → <strong>Conectar dispositivo</strong>
              </p>
            </div>

            <div className="p-3 bg-white border-2 border-gray-200 rounded-2xl shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCode}
                alt="QR Code WhatsApp"
                width={220}
                height={220}
                className="rounded-xl block"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Atualizando a cada 5 segundos…
            </div>
          </div>
        ) : (
          /* Desconectado sem QR */
          <div className="flex items-start gap-3">
            <WifiOff className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-700">WhatsApp desconectado</p>
              <p className="text-xs text-gray-400 mt-1">
                {error ?? 'Não foi possível obter o QR Code. Verifique se o servidor da Evolution API está rodando.'}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
