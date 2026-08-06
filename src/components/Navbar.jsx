import { useNavigate, useLocation } from 'react-router-dom'
import { supabase, ADMIN_EMAIL } from '../supabase'
import NotificationPanel from './NotificationPanel'
import { useNotifications } from '../hooks/useNotifications'

export default function Navbar({ session, player }) {
  const nav = useNavigate()
  const loc = useLocation()
  const isAdmin = session?.user?.email === ADMIN_EMAIL
  const { notifications, unread, markAllRead } = useNotifications(session?.user?.id)

  const logout = async () => { await supabase.auth.signOut(); nav('/') }

  const tabs = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/standings', label: 'Standings', icon: '🏆' },
    { path: '/fixtures', label: 'Fixtures', icon: '⚽' },
    ...(session
      ? [{ path: '/dashboard', label: 'Profile', icon: '👤' }]
      : [{ path: '/login', label: 'Login', icon: '🔑' }]
    ),
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: '⚙️' }] : []),
  ]

  const isActive = (path) => {
    if (path === '/') return loc.pathname === '/'
    return loc.pathname.startsWith(path)
  }

  return (
    <>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: '1px solid var(--border)',
        background: 'var(--dark)', position: 'sticky', top: 0, zIndex: 99
      }}>
        <span onClick={() => nav('/')} style={{
          fontFamily: 'Bebas Neue', fontSize: 22, color: 'var(--green)',
          letterSpacing: '.1em', cursor: 'pointer'
        }}>⚽ ikonLeague</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {session && (
            <NotificationPanel
              notifications={notifications}
              unread={unread}
              markAllRead={markAllRead}
            />
          )}

          {/* Desktop nav */}
          <div className="desktop-nav" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {tabs.map(t => (
              <button key={t.path} onClick={() => nav(t.path)} style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', border: 'none',
                background: isActive(t.path) ? 'var(--green)' : 'transparent',
                color: isActive(t.path) ? '#000' : 'var(--sub)', transition: '.15s'
              }}>{t.label}</button>
            ))}
            {session && (
              <button onClick={logout} style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--sub)', marginLeft: 4
              }}>Logout</button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="mobile-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99,
        background: 'var(--dark)', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'stretch',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        {tabs.map(t => (
          <button key={t.path} onClick={() => nav(t.path)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 4, padding: '10px 4px',
            border: 'none', background: 'transparent', cursor: 'pointer',
            borderTop: `2px solid ${isActive(t.path) ? 'var(--green)' : 'transparent'}`,
            transition: '.15s'
          }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: isActive(t.path) ? 'var(--green)' : 'var(--muted)', letterSpacing: '.03em' }}>{t.label}</span>
          </button>
        ))}
      </div>

      <style>{`
        @media (min-width: 640px) {
          .mobile-nav { display: none !important; }
          .desktop-nav { display: flex !important; }
        }
        @media (max-width: 639px) {
          .mobile-nav { display: flex !important; }
          .desktop-nav { display: none !important; }
        }
      `}</style>
    </>
  )
}
