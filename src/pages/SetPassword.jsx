import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function SetPassword() {
  const nav = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase puts the session in the URL hash after invite click
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
      else setErr('Invalid or expired invite link. Ask admin to resend.')
    })
  }, [])

  const submit = async () => {
    if (password.length < 6) { setErr('Password must be at least 6 characters'); return }
    if (password !== confirm) { setErr('Passwords do not match'); return }
    setLoading(true); setErr('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setErr(error.message); setLoading(false); return }
    nav('/')
  }

  return (
    <div style={{ maxWidth: 420, margin: '80px auto', padding: '0 20px' }}>
      <h2 style={{ fontSize: 32, marginBottom: 4 }}>Set your password</h2>
      <p style={{ color: 'var(--sub)', fontSize: 14, marginBottom: 28 }}>
        Welcome to ikonLeague Admin. Set a password to complete your account.
      </p>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
        {err && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', color: '#fca5a5', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>{err}</div>}

        {ready ? (
          <>
            {[['New password', password, setPassword], ['Confirm password', confirm, setConfirm]].map(([label, val, setter]) => (
              <div key={label} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--sub)', marginBottom: 8, fontWeight: 500 }}>{label}</label>
                <input type="password" value={val} onChange={e => setter(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '11px 14px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 14, outline: 'none' }} />
              </div>
            ))}
            <button onClick={submit} disabled={loading}
              style={{ width: '100%', padding: 14, borderRadius: 12, background: 'var(--green)', color: '#000', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', marginTop: 8 }}>
              {loading ? 'Setting password...' : 'Set Password & Login'}
            </button>
          </>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>Verifying invite link...</p>
        )}
      </div>
    </div>
  )
}
