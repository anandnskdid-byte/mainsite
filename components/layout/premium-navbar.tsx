'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, User, LogOut, Home, Crown, Star, Menu } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { logoutUser } from '@/lib/auth'
import { useCart } from '@/contexts/cart-context'
import { useState } from 'react'

export function PremiumNavbar() {
  const { user, userData } = useAuth()
  const pathname = usePathname()
  const { state } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { name: 'Home', href: '/shrkarni-premium', icon: Home },
    { name: 'Premium Products', href: '/shrkarni-premium/products', icon: Crown },
    { name: 'Collections', href: '/shrkarni-premium/collections', icon: Star },
    { name: 'About', href: '/shrkarni-premium/about', icon: User },
  ]

  return (
    <nav className="premium-nav premium-glass-nav" style={{ position: 'relative', zIndex: 10001 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
          {/* Logo */}
          <div>
            <Link href="/shrkarni-premium" style={{ textDecoration: 'none' }}>
              <span className="brand-title">
                ShriKarni Premium
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {navLinks.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`menu-link ${active ? 'active' : ''}`}
                >
                  {item.name}
                </Link>
              )
            })}
            
            <Link 
              href="/shrkarni-premium/cart" 
              className="cart-link"
            >
              <ShoppingCart size={20} />
              {state.items.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#FFD700',
                  color: '#000000',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {state.items.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </Link>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', marginLeft: '16px' }}>
                <span style={{ color: '#C0A060', marginRight: '12px' }}>
                  Hi, {userData?.name || 'User'}
                </span>
                <button
                  onClick={logoutUser}
                  className="gold-btn"
                >
                  <LogOut size={16} style={{ marginRight: '4px' }} />
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/auth/login">
                <button className="gold-btn" style={{ display: 'flex', alignItems: 'center' }}>
                  <User size={16} style={{ marginRight: '4px' }} />
                  Login
                </button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div style={{ display: 'none' }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ color: '#EAEAEA', padding: '8px' }}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div style={{ backgroundColor: '#111111', borderTop: '1px solid rgba(255, 215, 0, 0.3)' }}>
          <div style={{ padding: '16px' }}>
            {navLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  color: '#EAEAEA',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  marginBottom: '4px'
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon size={20} style={{ marginRight: '8px' }} />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
      <style jsx>{`
        .premium-glass-nav {
          background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.75) 100%);
          border-bottom: 3px solid transparent;
          border-image: linear-gradient(90deg, transparent 0%, #C5A100 20%, #FFD700 50%, #C5A100 80%, transparent 100%) 1;
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          box-shadow: 
            0 8px 32px rgba(255, 215, 0, 0.12),
            inset 0 1px 0 rgba(255, 215, 0, 0.15),
            0 1px 3px rgba(0, 0, 0, 0.3);
          position: relative;
        }
        .premium-glass-nav::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,215,0,0.4), transparent);
          pointer-events: none;
        }
        .brand-title {
          background: linear-gradient(135deg, #D4AF37, #FFD700 30%, #FFF2B2 60%, #FFD700 90%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          font-size: 1.6rem;
          font-weight: 900;
          letter-spacing: 0.8px;
          text-shadow: 0 0 25px rgba(255, 215, 0, 0.4);
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }
        .menu-link {
          position: relative;
          color: #F5F5F5;
          padding: 10px 18px;
          border-radius: 12px;
          text-decoration: none;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.3px;
          transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
          background: transparent;
          border: 1px solid transparent;
        }
        .menu-link::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 12px;
          padding: 1px;
          background: linear-gradient(135deg, transparent, rgba(255,215,0,0.3), transparent);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: xor;
          opacity: 0;
          transition: opacity .3s ease;
        }
        .menu-link::after {
          content: '';
          position: absolute;
          left: 18px;
          right: 18px;
          bottom: 8px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #FFD700 20%, #FFF2B2 50%, #FFD700 80%, transparent);
          transform: scaleX(0);
          transform-origin: center;
          transition: transform .4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 15px rgba(255,215,0,0.5);
          border-radius: 1px;
        }
        .menu-link:hover {
          color: #FFD700;
          background: rgba(255,215,0,0.08);
          transform: translateY(-2px);
          text-shadow: 0 0 12px rgba(255,215,0,0.4);
          border-color: rgba(255,215,0,0.2);
        }
        .menu-link:hover::before { opacity: 1; }
        .menu-link:hover::after { transform: scaleX(1); }
        .menu-link.active {
          color: #FFD700;
          background: rgba(255,215,0,0.12);
          border-color: rgba(255,215,0,0.3);
          text-shadow: 0 0 15px rgba(255,215,0,0.5);
        }
        .menu-link.active::before { opacity: 1; }
        .menu-link.active::after { transform: scaleX(1); }

        .cart-link {
          position: relative;
          padding: 10px;
          color: #F5F5F5;
          border-radius: 12px;
          border: 1px solid transparent;
          transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cart-link::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 12px;
          padding: 1px;
          background: linear-gradient(135deg, transparent, rgba(255,215,0,0.4), transparent);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: xor;
          opacity: 0;
          transition: opacity .3s ease;
        }
        .cart-link:hover {
          color: #FFD700;
          background: rgba(255,215,0,0.1);
          box-shadow: 0 0 20px rgba(255,215,0,0.3);
          transform: translateY(-2px);
          border-color: rgba(255,215,0,0.3);
        }
        .cart-link:hover::before { opacity: 1; }

        .gold-btn {
          background: linear-gradient(135deg, #B8860B 0%, #DAA520 25%, #FFD700 50%, #DAA520 75%, #B8860B 100%);
          color: #000;
          border: 1px solid rgba(255,215,0,0.4);
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all .3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            0 8px 25px rgba(255, 215, 0, 0.25),
            inset 0 1px 0 rgba(255,255,255,0.2);
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          position: relative;
          overflow: hidden;
        }
        .gold-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left .5s ease;
        }
        .gold-btn:hover {
          transform: translateY(-3px);
          box-shadow: 
            0 15px 35px rgba(255, 215, 0, 0.4),
            inset 0 1px 0 rgba(255,255,255,0.3);
          filter: saturate(1.2) brightness(1.1);
          border-color: rgba(255,215,0,0.6);
        }
        .gold-btn:hover::before { left: 100%; }
        .gold-btn:active {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(255, 215, 0, 0.3);
        }
      `}</style>
    </nav>
  )
}

export default PremiumNavbar
