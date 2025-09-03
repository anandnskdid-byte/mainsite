'use client'

import { CartProvider } from '@/contexts/cart-context'

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ 
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: '#000000'
    }}>
      <style jsx global>{`
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: #000000 !important;
        }
        nav:first-child {
          display: none !important;
        }
        .site-popup {
          display: none !important;
        }
        [class*="chat"] {
          display: none !important;
        }
      `}</style>
      <CartProvider>
        {children}
      </CartProvider>
    </div>
  )
}
