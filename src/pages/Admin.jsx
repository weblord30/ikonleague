import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

const ADMIN_PIN = '0407'
const MAX_PLAYERS = 20

function generateRoundRobin(players) {
  const ids = players.map(p => p.id)
  const fixtures = []
  const list = ids.length % 2 === 0 ? [...ids] : [...ids, 'BYE']
  const rounds = list.length - 1
  const half = list.length / 2
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const h = list[i], a = list[list.length - 1 - i]
      if (h !== 'BYE' && a !== 'BYE') fixtures.push({ home_player_id: h, away_player_id: a, matchday: r + 1, played: false, home_goals: null, away_goals: null })
    }
    list.splice(1, 0, list.pop())
  }
  return fixtures
}

export default function Admin() {
  const [pin, setPin] = useState('')
  const [auth, setAuth] = useState(false)
  const [pinErr, setPinErr] = useState(false)
  const [tab, setTab] = useState('pending')
  const [players, setPlayers] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [scores, setScores] = useState({})
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3500) }

  const load = async () => {
    const [{ data: p }, { data: f }] = await Promise.all([
      supabase.from('players').select('*').order('created_at'),
      supabase.from('fixtures').select('*').order('matchday')
    ])
    setPlayers(p || []); setFixtures(f || [])
  }

  useEffect(() => { if (auth) load() }, [auth])

  const approve = async (id) => {
    await supabase.from('players').update({ status: 'approved' }).eq('id', id)
    flash('Player approved ✓'); load()
  }

  const reject = async (id) => {
    await supabase.from('players').update({ status: 'rejected' }).eq('id', id)
    flash('Player rejected'); load()
  }

  const generateFixtures = async () => {
    const approved = players.filter(p => p.status === 'approved')
    if (approved.length < 2) { flash('Need at least 2 approved players'); return }
    if (!window.confirm(`Generate fixtures for ${approved.length} players?`)) return
    setLoading(true)
    await supabase.from('fixtures').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    const newFixtures = generateRoundRobin(approved)
    await supabase.from('fixtures').insert(newFixtures)
    flash(`${newFixtures.length} fixtures generated ✓`)
    setLoading(false); load()
  }

  const saveScore = async (f) => {
    const s = scores[f.id] || {}
    if (s.h === undefined || s.a === undefined) { flash('Enter both scores'); return }
    await supabase.from('fixtures').update({ home_goals: s.h, away_goals: s.a, played: true }).eq('id', f.id)
    setScores(x => { const n = { ...x }; delete n[f.id]; return n })
    flash('Score saved ✓'); load()
  }

  const pending = players.filter(p => p.status === 'pending')
  const approved = players.filter(p => p.status === 'approved')
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))

  if (!auth) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 24px', textAlign: 'center' }}>
      <h2 style={{ fontSize: 32, marginBottom: 8 }}>Admin Access</h2>
      <p style={{ color: 'var(--sub)', fontSize: 14, marginBottom: 28 }}>Enter your PIN to continue</p>
      <input type="password" maxLength={6} value={pin} placeholder="••••"
        onChange={e => { setPin(e.target.value); setPinErr(false) }}
        onKeyDown={e => e.key === 'Enter' && (pin === ADMIN_PIN ? setAuth(true) : setPinErr(true))}
        style={{ width: 160, padding: '14px', textAlign: 'center', fontSize: 24, letterSpacing: '.3em', background: 'var(--card2)', border: `1px solid ${pinErr ? 'var(--red)' : 'var(--border)'}`, borderRadius: 12, color: 'var(--text)', outline: 'none', fontWeight: 700 }} />
      {pinErr && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>Incorrect PIN</p>}
      <button onClick={() => pin === ADMIN_PIN ? setAuth(true) : setPinErr(true)}
        style={{ marginTop: 20, padding: '12px 40px', borderRadius: 12, background: 'var(--green)', color: '#000', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>Enter</button>
    </div>
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px 80px' }}>
      <h2 style={{ fontSize: 32, marginBottom: 4 }}>Admin Dashboard</h2>
      <p style={{ color: 'var(--sub)', fontSize: 14, marginBottom: 24 }}>ikonLeague Season 1</p>

      {msg && <div style={{ background: 'rgba(0,200,150,.1)', border: '1px solid rgba(0,200,150,.25)', color: 'var(--green)', padding: '10px 16px', borderRadius: 10, fontSize: 13, marginBottom: 20 }}>{msg}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
        {[['Pending', pending.length, 'var(--amber)'], ['Approved', approved.length, 'var(--green)'], ['Fixtures', fixtures.length, 'var(--blue)'], ['Played', fixtures.filter(f => f.played).length, 'var(--sub)']].map(([l, v, c]) => (
          <div key={l} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--sub)', fontWeight: 500, marginBottom: 6 }}>{l}</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 38, color: c, lineHeight: 1 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--card2)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {['pending', 'players', 'fixtures'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: tab === t ? 'var(--green)' : 'transparent', color: tab === t ? '#000' : 'var(--sub)' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)} {t === 'pending' && pending.length > 0 && `(${pending.length})`}
          </button>
        ))}
      </div>

      {/* Pending registrations */}
      {tab === 'pending' && (
        <div>
          {pending.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 14 }}>No pending registrations.</p>}
          {pending.map(p => (
            <div key={p.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{p.full_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 3 }}>@{p.username} · Team: {p.team_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>WhatsApp: {p.whatsapp}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Registered: {new Date(p.created_at).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => approve(p.id)} style={{ padding: '8px 18px', background: 'var(--green)', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Approve</button>
                  <button onClick={() => reject(p.id)} style={{ padding: '8px 18px', background: 'rgba(239,68,68,.15)', color: 'var(--red)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Reject</button>
                </div>
              </div>
              {p.payment_screenshot && (
                <div style={{ marginTop: 14 }}>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>PAYMENT SCREENSHOT</p>
                  <a href={p.payment_screenshot} target="_blank" rel="noreferrer">
                    <img src={p.payment_screenshot} alt="payment" style={{ maxHeight: 220, borderRadius: 10, border: '1px solid var(--border)', objectFit: 'contain' }} />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* All players */}
      {tab === 'players' && (
        <div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            {players.length === 0 && <p style={{ padding: 20, color: 'var(--muted)', fontSize: 14 }}>No players yet.</p>}
            {players.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < players.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,200,150,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: 'var(--green)', flexShrink: 0 }}>
                  {p.full_name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.full_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--sub)', marginTop: 2 }}>@{p.username} · {p.team_name} · {p.whatsapp}</div>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: p.status === 'approved' ? 'rgba(0,200,150,.15)' : p.status === 'rejected' ? 'rgba(239,68,68,.15)' : 'rgba(245,158,11,.15)', color: p.status === 'approved' ? 'var(--green)' : p.status === 'rejected' ? 'var(--red)' : 'var(--amber)' }}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fixtures */}
      {tab === 'fixtures' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            <button onClick={generateFixtures} disabled={loading || approved.length < 2}
              style={{ padding: '10px 22px', background: 'var(--green)', color: '#000', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {loading ? 'Generating...' : fixtures.length ? 'Regenerate Fixtures' : 'Generate Fixtures'}
            </button>
          </div>
          {fixtures.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 14 }}>No fixtures yet. Generate them above.</p>}
          {[...new Set(fixtures.map(f => f.matchday))].sort((a, b) => a - b).map(md => (
            <div key={md}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', margin: '20px 0 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
                Matchday {md}<div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              {fixtures.filter(f => f.matchday === md).map(f => {
                const h = playerMap[f.home_player_id]; const a = playerMap[f.away_player_id]
                const s = scores[f.id] || {}
                return (
                  <div key={f.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 500, textAlign: 'right', minWidth: 100 }}>{h?.full_name || 'TBD'}</div>
                    {f.played ? (
                      <div style={{ fontFamily: 'Bebas Neue', fontSize: 22, minWidth: 80, textAlign: 'center' }}>{f.home_goals} — {f.away_goals}</div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 160, justifyContent: 'center' }}>
                        <input type="number" min="0" max="99" value={s.h ?? ''} placeholder="0"
                          onChange={e => setScores(x => ({ ...x, [f.id]: { ...x[f.id], h: +e.target.value } }))}
                          style={{ width: 40, padding: '5px', textAlign: 'center', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 15, fontWeight: 600, outline: 'none' }} />
                        <span style={{ color: 'var(--muted)', fontWeight: 700 }}>—</span>
                        <input type="number" min="0" max="99" value={s.a ?? ''} placeholder="0"
                          onChange={e => setScores(x => ({ ...x, [f.id]: { ...x[f.id], a: +e.target.value } }))}
                          style={{ width: 40, padding: '5px', textAlign: 'center', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 15, fontWeight: 600, outline: 'none' }} />
                        <button onClick={() => saveScore(f)} style={{ padding: '5px 12px', background: 'var(--green)', color: '#000', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Save</button>
                      </div>
                    )}
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 500, minWidth: 100 }}>{a?.full_name || 'TBD'}</div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}