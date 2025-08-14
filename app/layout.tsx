import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'
import { CartProvider } from '@/contexts/cart-context'
import SitePopup from '@/components/ui/site-popup'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Shri Karni Home Solutions',
  description: 'Your trusted partner for quality construction materials',
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <Navbar />
          {children}
          <SitePopup />
        </CartProvider>
      </body>
    </html>
  )
}
