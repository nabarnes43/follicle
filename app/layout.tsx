import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/auth'
import NavBar from '@/components/navigation/NavBar'
import { Toaster } from '@/components/ui/sonner'
import { ScoringToast } from '@/components/analysis/ScoringToast'
import { Suspense } from 'react'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Follicle - Hair Care Recommendations',
  description: 'Data-driven hair product recommendations',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense>
          <NavBar />
        </Suspense>
        <AuthProvider>
          {children}
          <ScoringToast />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
