import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './supabase'
import Navbar from './components/Navbar'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import Pending from './pages/Pending'
import Dashboard from './pages/Dashboard'
import Standings from './pages/Standings'
import Fixtures from './pages/Fixtures'
import Terms from './pages/Terms'
import Admin from './pages/Admin'

export default function App() {
  const [session, setSession] = useState(null)
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchPlayer(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchPlayer(session.user.id)
      else { setPlayer(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchPlayer = async (userId) => {
    const { data } = await supabase.from('players').select('*').eq('user_id', userId).single()
    setPlayer(data || null)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: 32, color: 'var(--green)', letterSpacing: '.1em' }}>ikonLeague</div>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTop: '3px solid var(--green)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <>
      <Navbar session={session} player={player} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/register" element={!session ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" />} />
       <Route path="/pending" element={
  session
    ? player?.status === 'approved'
      ? <Navigate to="/dashboard" />
      : <Pending player={player} />
    : <Navigate to="/login" />
} />
<Route path="/dashboard" element={
  session
    ? player?.status === 'approved'
      ? <Dashboard player={player} />
      : <Navigate to="/pending" />
    : <Navigate to="/login" />
} />        <Route path="/standings" element={<Standings />} />
        <Route path="/fixtures" element={<Fixtures player={player} />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </>
  )
}
