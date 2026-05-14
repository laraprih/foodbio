import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import QueryProvider from '@/components/providers/QueryProvider'
import SocketProvider from '@/components/providers/SocketProvider'
import { Toaster } from '@/components/ui/Toast'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Foodin — Delivery',
  description: 'Peça agora no seu restaurante favorito',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#18181b',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.variable} font-sans bg-gray-100 text-gray-900 antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <SocketProvider>
            {children}
            <Toaster />
          </SocketProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
