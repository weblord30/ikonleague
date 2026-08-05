import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Navbar({ session, player }) {
  const nav = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState(false)

  const logout = async () => { await supabase.auth.signOut(); nav('/') }

  const links = [
    { path: '/', label: 'Home' },
    { path: '/standings', label: 'Standings' },
    { path: '/fixtures', label: 'Fixtures' },
    ...(session && player?.status === 'approved' ? [{ path: '/dashboard', label: 'My Profile' }] : []),
    ...(session && !player ? [{ path: '/register', label: 'Register' }] : []),
  ]

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px', borderBottom: '1px solid var(--border)',
      background: 'var(--dark)', position: 'sticky', top: 0, zIndex: 99
    }}>
      <span onClick={() => nav('/')} style={{
        fontFamily: 'Bebas Neue', fontSize: 22, color: 'var(--green)',
        letterSpacing: '.1em', cursor: 'pointer'
      }}>⚽ ikonLeague</span>

      {/* Desktop links */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {links.map(l => (
          <button key={l.path} onClick={() => nav(l.path)} style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', border: 'none', background: loc.pathname === l.path ? 'var(--green)' : 'transparent',
            color: loc.pathname === l.path ? '#000' : 'var(--sub)', transition: '.15s'
          }}>{l.label}</button>
        ))}
        {session
          ? <button onClick={logout} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--border)', background: 'transparent', color: 'var(--sub)', marginLeft: 4 }}>Logout</button>
          : <button onClick={() => nav('/login')} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: 'var(--green)', color: '#000', marginLeft: 4 }}>Login</button>
        }
      </div>
    </nav>
  )
}