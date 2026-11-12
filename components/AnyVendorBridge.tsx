'use client'

import { useEffect } from 'react'

// Starts the AnyVendor editor bridge (anyvendor.bridge/v1) on the draft page.
// The script is AnyVendor's own child script, copied unchanged to
// public/anyvendor-bridge.js; the protocol is theirs (docs/backend/
// HANDOFF-TL-SITE-BRIDGE.md in jakeylee93/anyvendor). It is loaded only inside
// a frame and only when the address has av_edit=1; the script itself then
// stays silent until one of the listed origins says hello. It holds no token
// and makes no request.
type Bridge = { start: (o: { slug: string; origins: string[]; capabilities: { text: boolean; image: boolean; chapters: boolean }; keepVisible: string[] }) => boolean }

export function AnyVendorBridge({ slug, origins }: { slug: string; origins: string[] }) {
  useEffect(() => {
    if (window.parent === window || new URLSearchParams(location.search).get('av_edit') !== '1') return
    document.documentElement.dataset.avEdit = '1'
    const start = () => {
      const bridge = (window as unknown as { AnyVendorBridge?: Bridge }).AnyVendorBridge
      // the quote form is always rendered, so the editor cannot hide it live either
      if (bridge) bridge.start({ slug, origins, capabilities: { text: true, image: true, chapters: true }, keepVisible: ['plan'] })
    }
    const script = document.createElement('script')
    script.src = '/anyvendor-bridge.js'
    script.onload = start
    document.head.appendChild(script)
  }, [slug, origins])
  return null
}
