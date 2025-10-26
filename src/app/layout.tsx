import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ErrorProvider } from '@/contexts/ErrorContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Admin Dashboard - Ahorro365',
  description: 'Panel administrativo para gestionar usuarios y analytics de Ahorro365',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ErrorProvider>
          {children}
        </ErrorProvider>
      </body>
    </html>
  )
}
