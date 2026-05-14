import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';
import SocketProvider from '@/components/providers/SocketProvider';
import { Toaster } from '@/components/ui/Toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Food Delivery App',
  description: 'A mobile-first food delivery experience',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a1a1a" />
      </head>
      <body className={`${inter.variable} font-sans bg-gray-100 text-gray-900 antialiased`} suppressHydrationWarning>
        <QueryProvider>
          <SocketProvider>
            <div className="mx-auto max-w-[414px] bg-white min-h-[100dvh] relative shadow-2xl overflow-x-hidden flex flex-col">
              {children}
            </div>
            <Toaster />
          </SocketProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
