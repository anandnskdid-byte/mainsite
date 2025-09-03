'use client'

import { useEffect } from 'react'

export default function ShrkarniPremium() {
  useEffect(() => {
    // Hide all other navigation elements on mount
    const hideElements = () => {
      const navs = document.querySelectorAll('nav:not(.premium-nav)')
      navs.forEach(nav => {
        if (nav instanceof HTMLElement) {
          nav.style.display = 'none'
        }
      })
      
      const popups = document.querySelectorAll('.site-popup, [class*="chat"], [class*="popup"]')
      popups.forEach(popup => {
        if (popup instanceof HTMLElement) {
          popup.style.display = 'none'
        }
      })
    }
    
    hideElements()
    
    // Set up observer to hide elements that might be added dynamically
    const observer = new MutationObserver(hideElements)
    observer.observe(document.body, { childList: true, subtree: true })
    
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #000000 !important;
            overflow: hidden !important;
          }
          nav:not(.premium-nav) {
            display: none !important;
          }
          .site-popup, [class*="chat"], [class*="popup"] {
            display: none !important;
          }
          .nav-item:hover {
            color:#BE9754 !important;
            text-shadow: 0 0 10px rgba(255, 215, 0, 0.5) !important;
          }
          .login-btn:hover {
            background-color: #000000 !important;
            color: #FFD700 !important;
            border: 2px solid #FFD700 !important;
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.5) !important;
          }
          .premium-nav {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            z-index: 999999 !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
        `
      }} />
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        zIndex: 99999
      }}>
        {/* Premium Navigation */}
        <nav className="premium-nav" style={{ 
          backgroundColor: '#000000', 
          borderBottom: '2px solidrgb(255, 209, 4)',
          height: '70px',
          display: 'flex !important',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 30px',
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 1000000
        }}>
          <div style={{ 
            color: '#FFD700', 
            fontSize: '1.8rem', 
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.3)'
          }}>
            ShriKarni Premium
          </div>
          <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
            <span className="nav-item" style={{ 
              color: '#EAEAEA', 
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}>
              Home
            </span>
            <span className="nav-item" style={{ 
              color: '#EAEAEA', 
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}>
              Premium Products
            </span>
            <span className="nav-item" style={{ 
              color: '#EAEAEA', 
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}>
              Collections
            </span>
            <span className="nav-item" style={{ 
              color: '#EAEAEA', 
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}>
              About
            </span>
            <button className="login-btn" style={{
              backgroundColor: '#FFD700',
              color: '#000000',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}>
              Login
            </button>
          </div>
        </nav>
        
        {/* Blank content area */}
        <div style={{
          width: '100%',
          height: 'calc(100vh - 70px)',
          backgroundColor: '#000000'
        }}>
        </div>
      </div>
    </>
  );
}
