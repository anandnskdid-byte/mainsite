"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { database } from '@/lib/firebase'
import { X } from 'lucide-react'

// Popup config shape stored at: siteSettings/popup
// {
//   enabled: boolean,
//   text: string,
//   imageUrl: string,
//   delaySeconds: number,
//   style: 1 | 2 | 3 | 4 | 5
// }

type PopupConfig = {
  enabled?: boolean
  text?: string
  imageUrl?: string
  delaySeconds?: number
  style?: 1 | 2 | 3 | 4 | 5
  layout?: 'image-top' | 'image-left'
  heading?: string
  headingSize?: number
  textSize?: number
}

const styleBase =
  'fixed z-50 transition-all duration-300 shadow-xl rounded-xl overflow-hidden'

export function SitePopup() {
  const [config, setConfig] = useState<PopupConfig | null>(null)
  const [visible, setVisible] = useState(false)
  const [loadedOnce, setLoadedOnce] = useState(false)

  useEffect(() => {
    const unsub = onValue(ref(database, 'siteSettings/popup'), (snap) => {
      const value = snap.val() as PopupConfig | null
      setConfig(value || null)
      setLoadedOnce(true)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!loadedOnce) return
    if (!config?.enabled) {
      setVisible(false)
      return
    }
    const delay = Math.max(0, Number(config?.delaySeconds || 0)) * 1000
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [config, loadedOnce])

  const containerClass = useMemo(() => {
    switch (config?.style) {
      case 2:
        // Bottom center toast
        return `${styleBase} bottom-6 left-1/2 -translate-x-1/2 w-[90vw] max-w-md bg-white/95 backdrop-blur border border-gray-200`
      case 3:
        // Fullscreen dim overlay center modal
        return `${styleBase} inset-0 flex items-center justify-center bg-black/50` 
      case 4:
        // Right slide-in panel
        return `${styleBase} top-0 right-0 h-full w-[90vw] max-w-sm bg-white`
      case 5:
        // Bottom-left minimal card
        return `${styleBase} bottom-6 left-6 w-[92vw] max-w-sm bg-white/95 backdrop-blur border border-gray-200`
      case 1:
      default:
        // Classic centered modal card
        return `${styleBase} top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-lg bg-white`
    }
  }, [config?.style])

  if (!visible || !config?.enabled) return null

  // For style 3 (fullscreen), the card content should be centered within; others render as card directly
  const isFullscreenOverlay = config?.style === 3
  const layout = (config?.layout || 'image-top') as 'image-top' | 'image-left'
  const headingSizePx = Math.max(14, Math.min(64, Number(config?.headingSize ?? 28)))
  const textSizePx = Math.max(12, Math.min(28, Number(config?.textSize ?? 20)))

  const Card = (
    <div className="relative bg-white rounded-xl overflow-hidden">
      <button
        aria-label="Close"
        onClick={() => setVisible(false)}
        className="absolute right-2 top-2 p-1 rounded-full hover:bg-gray-100 text-gray-600"
      >
        <X className="h-5 w-5" />
      </button>

      {layout === 'image-left' && config?.imageUrl ? (
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2 w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={config.imageUrl} alt="Popup" className="w-full h-full object-cover md:min-h-[260px]" />
          </div>
          <div className="md:w-1/2 w-full p-5">
            {config?.heading ? (
              <div className="font-semibold text-gray-900" style={{ fontSize: headingSizePx }}>
                {config.heading}
              </div>
            ) : null}
            <div
              className="site-popup-content mt-2 text-gray-700 leading-relaxed"
              style={{ fontSize: textSizePx }}
              dangerouslySetInnerHTML={{ __html: config?.text || 'Welcome to Shri Karni Home Solutions!' }}
            />
          </div>
        </div>
      ) : (
        <>
          {config?.imageUrl ? (
            <div className="w-full aspect-[16/9] relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={config.imageUrl} alt="Popup" className="w-full h-full object-cover" />
            </div>
          ) : null}
          <div className="p-5">
            {config?.heading ? (
              <div className="font-semibold text-gray-900" style={{ fontSize: headingSizePx }}>
                {config.heading}
              </div>
            ) : null}
            <div
              className="site-popup-content mt-2 text-gray-700 leading-relaxed"
              style={{ fontSize: textSizePx }}
              dangerouslySetInnerHTML={{ __html: config?.text || 'Welcome to Shri Karni Home Solutions!' }}
            />
          </div>
        </>
      )}
    </div>
  )

  if (isFullscreenOverlay) {
    const Styles = (
      <style jsx global>{`
        .site-popup-content .ql-align-center { text-align: center; }
        .site-popup-content .ql-align-right { text-align: right; }
        .site-popup-content .ql-align-justify { text-align: justify; }
        .site-popup-content .ql-size-small { font-size: 0.875em; }
        .site-popup-content .ql-size-large { font-size: 1.5em; }
        .site-popup-content .ql-size-huge { font-size: 2.5em; }
        .site-popup-content .ql-font-serif { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }
        .site-popup-content .ql-font-monospace { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
        .site-popup-content a { color: #2563eb; text-decoration: underline; }
        .site-popup-content ol { list-style: decimal; padding-left: 1.25rem; }
        .site-popup-content ul { list-style: disc; padding-left: 1.25rem; }
        .site-popup-content p { margin-top: 0.5rem; margin-bottom: 0.5rem; }
      `}</style>
    )
    return (
      <>
        <div className={containerClass}>
          <div className="w-[92vw] max-w-3xl">
            {Card}
          </div>
        </div>
        {Styles}
      </>
    )
  }

  const Styles = (
    <style jsx global>{`
      .site-popup-content .ql-align-center { text-align: center; }
      .site-popup-content .ql-align-right { text-align: right; }
      .site-popup-content .ql-align-justify { text-align: justify; }
      .site-popup-content .ql-size-small { font-size: 0.875em; }
      .site-popup-content .ql-size-large { font-size: 1.5em; }
      .site-popup-content .ql-size-huge { font-size: 2.5em; }
      .site-popup-content .ql-font-serif { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }
      .site-popup-content .ql-font-monospace { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      .site-popup-content a { color: #2563eb; text-decoration: underline; }
      .site-popup-content ol { list-style: decimal; padding-left: 1.25rem; }
      .site-popup-content ul { list-style: disc; padding-left: 1.25rem; }
      .site-popup-content p { margin-top: 0.5rem; margin-bottom: 0.5rem; }
    `}</style>
  )
  return (
    <>
      <div className={containerClass}>{Card}</div>
      {Styles}
    </>
  )
}

export default SitePopup
