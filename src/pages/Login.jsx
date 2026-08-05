import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Login() {
  const nav = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    setLoading(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (error) { setErr(error.message); setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', padding: '0 20px' }}>
      <h2 style={{ fontSize: 32, marginBottom: 4 }}>Welcome back</h2>
      <p style={{ color: 'var(--sub)', fontSize: 14, marginBottom: 28 }}>Login to your ikonLeague account</p>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
        {err && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', color: '#fca5a5', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>{err}</div>}
        {['email', 'password'].map(k => (
          <div key={k} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--sub)', marginBottom: 8, fontWeight: 500 }}>{k.charAt(0).toUpperCase() + k.slice(1)}</label>
            <input type={k} value={form[k]} onChange={set(k)} placeholder={k === 'email' ? 'you@email.com' : '••••••••'}
              style={{ width: '100%', padding: '11px 14px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 14, outline: 'none' }} />
          </div>
        ))}
        <button onClick={submit} disabled={loading} style={{ width: '100%', padding: 14, borderRadius: 12, background: 'var(--green)', color: '#000', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', marginTop: 8 }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--sub)', marginTop: 16 }}>
          Don't have an account? <span onClick={() => nav('/register')} style={{ color: 'var(--green)', cursor: 'pointer', fontWeight: 600 }}>Register</span>
        </p>
      </div>
    </div>
  )
}