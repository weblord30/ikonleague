import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const MAX_PLAYERS = 20

export default function Landing() {
  const nav = useNavigate()
  const [count, setCount] = useState(0)

  useEffect(() => {
    supabase.from('players').select('id', { count: 'exact' }).eq('status', 'approved')
      .then(({ count }) => setCount(count || 0))
  }, [])

  const spotsLeft = Math.max(0, MAX_PLAYERS - count)
  const pct = (count / MAX_PLAYERS) * 100
  const full = spotsLeft === 0

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        padding: '72px 24px 56px', textAlign: 'center',
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,200,150,.18), transparent)'
      }}>
        <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: 'rgba(0,200,150,.12)', border: '1px solid rgba(0,200,150,.3)', color: 'var(--green)', fontSize: 12, fontWeight: 600, letterSpacing: '.06em', marginBottom: 24 }}>
          SEASON 1 — NOW OPEN
        </div>
        <h1 style={{ fontSize: 'clamp(56px,10vw,96px)', lineHeight: .9, marginBottom: 20 }}>
          IKON<span style={{ color: 'var(--green)' }}>LEAGUE</span>
        </h1>
        <p style={{ fontSize: 15, color: 'var(--sub)', maxWidth: 440, margin: '0 auto 40px', lineHeight: 1.6 }}>
          Nigeria's most competitive eFootball mobile league. Register, compete, and claim your prize.
        </p>

        {/* Spots counter */}
        <div style={{ maxWidth: 360, margin: '0 auto 40px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px' }}>
          {full ? (
            <div style={{ color: 'var(--red)', fontFamily: 'Bebas Neue', fontSize: 22, letterSpacing: '.06em' }}>Registration Closed — Season 1 Underway</div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--sub)', fontWeight: 500 }}>Spots remaining</span>
                <span style={{ fontFamily: 'Bebas Neue', fontSize: 40, color: 'var(--green)', lineHeight: 1 }}>{spotsLeft}</span>
              </div>
              <div style={{ background: 'var(--card2)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green)', borderRadius: 99, transition: '1s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--muted)' }}>
                <span>{count} registered</span>
                <span>{MAX_PLAYERS} max</span>
              </div>
            </>
          )}
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
          {[['₦2,000', 'Entry Fee', '#f59e0b'], ['Round-Robin', 'Format', 'var(--green)'], ['₦2k × players', 'Prize Pool', 'var(--blue)']].map(([v, l, c]) => (
            <div key={l} style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: c }}>{v}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {!full && (
          <button onClick={() => nav('/register')} style={{
            padding: '14px 40px', borderRadius: 12, background: 'var(--green)', color: '#000',
            fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer', letterSpacing: '.04em'
          }}>Register Now →</button>
        )}
      </div>

      {/* Prize breakdown */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px 48px' }}>
        <h2 style={{ fontSize: 28, textAlign: 'center', marginBottom: 24 }}>Prize Breakdown</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {[['🥇', '1st Place', '40%'], ['🥈', '2nd Place', '30%'], ['🥉', '3rd Place', '20%'], ['4️⃣', '4th Place', '10%']].map(([e, p, pct]) => (
            <div key={p} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 28 }}>{e}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p}</div>
                <div style={{ fontFamily: 'Bebas Neue', fontSize: 24, color: 'var(--green)' }}>{pct}</div>
              </div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 16 }}>
          Prize pool = total entry fees collected · Paid within 48hrs of season end
        </p>
      </div>
    </div>
  )
}