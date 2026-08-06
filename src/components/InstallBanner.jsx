import { useState, useEffect } from 'react'

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [installed, setInstalled] = useState(false)

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone

  useEffect(() => {
    if (isInStandaloneMode) { setInstalled(true); return }

    if (isIOS) {
      setShowBanner(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => { setInstalled(true); setShowBanner(false) })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (isIOS) { setShowIOSGuide(true); return }
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') { setShowBanner(false) }
    setDeferredPrompt(null)
  }

  if (installed || !showBanner) return null

  return (
    <>
      {/* Main banner */}
      <div style={{
        position: 'fixed', bottom: showIOSGuide ? 0 : 72, left: 12, right: 12, zIndex: 200,
        background: 'linear-gradient(135deg, #141820, #1c2230)',
        border: '1px solid rgba(0,200,150,.3)',
        borderRadius: 16, padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,.4)',
        animation: 'slideUp .3s ease'
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(0,200,150,.15)', border: '1px solid rgba(0,200,150,.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, flexShrink: 0
        }}>⚽</div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Install ikonLeague</div>
          <div style={{ fontSize: 11, color: 'var(--sub)' }}>Add to your home screen for the full app experience</div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={() => setShowBanner(false)} style={{
            padding: '7px 12px', borderRadius: 8, background: 'transparent',
            border: '1px solid var(--border)', color: 'var(--muted)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer'
          }}>Later</button>
          <button onClick={handleInstall} style={{
            padding: '7px 14px', borderRadius: 8, background: 'var(--green)',
            border: 'none', color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer'
          }}>Install</button>
        </div>
      </div>

      {/* iOS guide popup */}
      {showIOSGuide && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,.7)', display: 'flex',
          alignItems: 'flex-end', justifyContent: 'center'
        }} onClick={() => setShowIOSGuide(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--card)', borderRadius: '20px 20px 0 0',
            padding: '28px 24px 48px', width: '100%', maxWidth: 480,
            border: '1px solid var(--border)', borderBottom: 'none'
          }}>
            <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--border)', margin: '0 auto 24px' }} />
            <h3 style={{ fontSize: 22, marginBottom: 6, textAlign: 'center' }}>Add to Home Screen</h3>
            <p style={{ fontSize: 13, color: 'var(--sub)', textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
              Install ikonLeague on your iPhone in 3 quick steps
            </p>

            {[
              ['1', '⋯', 'Tap the three dots (•••)', 'Find the three dots icon on the right side of the Safari address bar and tap it'],
              ['2', '📤', 'Or long press the address bar', 'You can also press and hold the URL bar to bring up the share options'],
              ['3', '📲', 'Tap "Add to Home Screen"', 'Find and tap "Add to Home Screen" from the menu that appears'],
              ['4', '✅', 'Tap "Add"', 'ikonLeague will appear on your home screen just like a native app'],
            ].map(([num, icon, title, sub]) => (
              <div key={num} style={{
                display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(0,200,150,.15)', border: '1px solid rgba(0,200,150,.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0
                }}>{icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.5 }}>{sub}</div>
                </div>
              </div>
            ))}

            <button onClick={() => { setShowIOSGuide(false); setShowBanner(false) }} style={{
              width: '100%', padding: 14, borderRadius: 12, background: 'var(--green)',
              color: '#000', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', marginTop: 8
            }}>Got it! 👍</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  )
}
