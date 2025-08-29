'use client'

import { useEffect } from 'react'

interface WallPanelsLoadingProps {
  onComplete: () => void
}

export function WallPanelsLoading({ onComplete }: WallPanelsLoadingProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background with wallloading.png - starts black and white */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat filter grayscale animate-glow-to-color"
        style={{ backgroundImage: 'url(/wallloading.png)' }}
      >
        {/* Animated Glow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber-500/20 to-transparent opacity-0 animate-glow-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-orange-500/15 to-transparent opacity-0 animate-glow-pulse-delayed"></div>
      </div>

      {/* Custom CSS Animations */}
      <style jsx>{`
        @keyframes glow-to-color {
          0% {
            filter: grayscale(100%);
          }
          50% {
            filter: grayscale(50%);
          }
          100% {
            filter: grayscale(0%);
          }
        }
        
        @keyframes glow-pulse {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }
        
        @keyframes glow-pulse-delayed {
          0%, 100% {
            opacity: 0;
          }
          25%, 75% {
            opacity: 0.8;
          }
        }
        
        .animate-glow-to-color {
          animation: glow-to-color 3s ease-in-out;
        }
        
        .animate-glow-pulse {
          animation: glow-pulse 2s ease-in-out infinite;
        }
        
        .animate-glow-pulse-delayed {
          animation: glow-pulse-delayed 2.5s ease-in-out infinite;
          animation-delay: 0.5s;
        }
      `}</style>
    </div>
  )
}
