import { useEffect, useState } from 'react'
import { supabase, ADMIN_EMAIL } from '../supabase'
import { createNotification } from '../hooks/useNotifications'

function generateRoundRobin(players) {
  const ids = players.map(p => p.id)
  const fixtures = []
  const list = ids.length % 2 === 0 ? [...ids] : [...ids, 'BYE']
  const rounds = list.length - 1
  const half = list.length / 2
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const h = list[i], a = list[list.length - 1 - i]
      if (h !== 'BYE' && a !== 'BYE')
        fixtures.push({ home_player_id: h, away_player_id: a, matchday: r + 1, played: false, home_goals: null, away_goals: null })
    }
    list.splice(1, 0, list.pop())
  }
  return fixtures
}

export default function Admin({ session }) {
  const isAdmin = session?.user?.email === ADMIN_EMAIL
  const [tab, setTab] = useState('pending')
  const [players, setPlayers] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [scores, setScores] = useState({})
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3500) }

  const load = async () => {
    const [{ data: p }, { data: f }, { data: s }] = await Promise.all([
      supabase.from('players').select('*').order('created_at'),
      supabase.from('fixtures').select('*').order('matchday'),
      supabase.from('score_submissions').select('*').order('created_at')
    ])
    setPlayers(p || [])
    setFixtures(f || [])
    setSubmissions(s || [])
  }

  useEffect(() => { if (isAdmin) load() }, [isAdmin])

  if (!isAdmin) return (
    <div style={{ textAlign: 'center', padding: '100px 24px', color: 'var(--muted)' }}>
      Access denied.
    </div>
  )

  const approve = async (player) => {
    await supabase.from('players').update({ status: 'approved' }).eq('id', player.id)
    await createNotification(player.user_id, 'You are approved! 🎉', 'Your payment has been verified. Welcome to ikonLeague Season 1. Join the WhatsApp group now.', 'approved')
    flash('Player approved ✓')
    load()
  }

  const reject = async (player, reason) => {
    if (reason === 'no_payment') {
      if (!window.confirm(`Delete ${player.full_name}'s account entirely? They will need to register again.`)) return
      await createNotification(player.user_id, 'Registration rejected', 'Your payment could not be verified and your account has been removed. Please register again and ensure you upload a clear payment screenshot.', 'rejected')
      await new Promise(r => setTimeout(r, 500))
      await supabase.from('players').delete().eq('id', player.id)
      flash('Player account deleted')
    } else {
      await supabase.from('players').update({ status: 'reupload' }).eq('id', player.id)
      await createNotification(player.user_id, 'Screenshot unclear 📸', 'We could not verify your payment screenshot clearly. Please re-upload a clearer image of your payment receipt.', 'rejected')
      flash('Player asked to re-upload ✓')
    }
    load()
  }

  const generateFixtures = async () => {
    const approved = players.filter(p => p.status === 'approved')
    if (approved.length < 2) { flash('Need at least 2 approved players'); return }
    if (!window.confirm(`Generate fixtures for ${approved.length} players?`)) return
    setLoading(true)
    await supabase.from('fixtures').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    const newFixtures = generateRoundRobin(approved)
    await supabase.from('fixtures').insert(newFixtures)
    for (const p of approved) {
      await createNotification(p.user_id, 'Fixtures are live! ⚽', `Season 1 fixtures have been generated. ${newFixtures.length} matches across ${[...new Set(newFixtures.map(f => f.matchday))].length} matchdays. Check the Fixtures tab.`, 'fixture')
    }
    flash(`${newFixtures.length} fixtures generated ✓`)
    setLoading(false)
    load()
  }

  const saveScore = async (f) => {
    const s = scores[f.id] || {}
    if (s.h === undefined || s.a === undefined) { flash('Enter both scores'); return }
    await supabase.from('fixtures').update({ home_goals: s.h, away_goals: s.a, played: true }).eq('id', f.id)
    const home = players.find(p => p.id === f.home_player_id)
    const away = players.find(p => p.id === f.away_player_id)
    const scoreText = `${s.h} - ${s.a}`
    if (home) await createNotification(home.user_id, 'Match result recorded 🏆', `Your match result has been confirmed: ${home.full_name} ${scoreText} ${away?.full_name}. Check the standings.`, 'result')
    if (away) await createNotification(away.user_id, 'Match result recorded 🏆', `Your match result has been confirmed: ${home?.full_name} ${scoreText} ${away.full_name}. Check the standings.`, 'result')
    setScores(x => { const n = { ...x }; delete n[f.id]; return n })
    flash('Score saved ✓')
    load()
  }

  const resolveDispute = async (fixtureId, homeGoals, awayGoals) => {
    await supabase.from('fixtures').update({ home_goals: homeGoals, away_goals: awayGoals, played: true }).eq('id', fixtureId)
    const home = players.find(p => p.id === fixtures.find(f => f.id === fixtureId)?.home_player_id)
    const away = players.find(p => p.id === fixtures.find(f => f.id === fixtureId)?.away_player_id)
    if (home) await createNotification(home.user_id, 'Dispute resolved ⚖️', `Admin has reviewed your disputed match and confirmed the final score: ${homeGoals} - ${awayGoals}.`, 'dispute')
    if (away) await createNotification(away.user_id, 'Dispute resolved ⚖️', `Admin has reviewed your disputed match and confirmed the final score: ${homeGoals} - ${awayGoals}.`, 'dispute')
    flash('Dispute resolved ✓')
    load()
  }

  const pending = players.filter(p => p.status === 'pending' || p.status === 'reupload')
  const approved = players.filter(p => p.status === 'approved')
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))

  const disputes = fixtures.filter(f => {
    if (f.played) return false
    const subs = submissions.filter(s => s.fixture_id === f.id)
    if (subs.length < 2) return false
    return subs[0].home_goals !== subs[1].home_goals || subs[0].away_goals !== subs[1].away_goals
  })

  const pendingSubmissions = fixtures.filter(f => {
    if (f.played) return false
    const subs = submissions.filter(s => s.fixture_id === f.id)
    return subs.length === 1
  })

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px 80px' }}>
      <h2 style={{ fontSize: 32, marginBottom: 4 }}>Admin Dashboard</h2>
      <p style={{ color: 'var(--sub)', fontSize: 14, marginBottom: 24 }}>ikonLeague Season 1</p>

      {msg && <div style={{ background: 'rgba(0,200,150,.1)', border: '1px solid rgba(0,200,150,.25)', color: 'var(--green)', padding: '10px 16px', borderRadius: 10, fontSize: 13, marginBottom: 20 }}>{msg}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 28 }}>
        {[
          ['Pending', pending.length, 'var(--amber)'],
          ['Approved', approved.length, 'var(--green)'],
          ['Disputes', disputes.length, 'var(--red)'],
          ['Fixtures', fixtures.length, 'var(--blue)'],
          ['Played', fixtures.filter(f => f.played).length, 'var(--sub)'],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--sub)', fontWeight: 500, marginBottom: 6 }}>{l}</div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 38, color: c, lineHeight: 1 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--card2)', borderRadius: 10, padding: 4, flexWrap: 'wrap' }}>
        {[
          ['pending', `Pending ${pending.length > 0 ? `(${pending.length})` : ''}`],
          ['disputes', `Disputes ${disputes.length > 0 ? `(${disputes.length})` : ''}`],
          ['players', 'Players'],
          ['fixtures', 'Fixtures'],
        ].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', border: 'none',
            background: tab === t ? 'var(--green)' : 'transparent',
            color: tab === t ? '#000' : 'var(--sub)'
          }}>{label}</button>
        ))}
      </div>

      {/* Pending registrations */}
      {tab === 'pending' && (
        <div>
          {pending.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 14 }}>No pending registrations.</p>}
          {pending.map(p => (
            <div key={p.id} style={{ background: 'var(--card)', border: `1px solid ${p.status === 'reupload' ? 'rgba(245,158,11,.3)' : 'var(--border)'}`, borderRadius: 14, padding: '18px 20px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{p.full_name}</div>
                    {p.status === 'reupload' && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(245,158,11,.15)', color: 'var(--amber)', fontWeight: 600 }}>RE-UPLOADED</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 3 }}>@{p.username} · Team: {p.team_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>WhatsApp: {p.whatsapp}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{new Date(p.created_at).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => approve(p)} style={{ padding: '8px 18px', background: 'var(--green)', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Approve</button>
                  <button onClick={() => reject(p, 'bad_screenshot')} style={{ padding: '8px 18px', background: 'rgba(245,158,11,.15)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Bad Screenshot</button>
                  <button onClick={() => reject(p, 'no_payment')} style={{ padding: '8px 18px', background: 'rgba(239,68,68,.15)', color: 'var(--red)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>No Payment</button>
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

      {/* Disputes */}
      {tab === 'disputes' && (
        <div>
          {disputes.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 14 }}>No disputed results. All clear! ✓</p>}
          {disputes.map(f => {
            const subs = submissions.filter(s => s.fixture_id === f.id)
            const home = playerMap[f.home_player_id]
            const away = playerMap[f.away_player_id]
            return (
              <div key={f.id} style={{ background: 'var(--card)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 14, padding: '18px 20px', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--red)', letterSpacing: '.06em', marginBottom: 12 }}>DISPUTED RESULT</div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>{home?.full_name} vs {away?.full_name} · Matchday {f.matchday}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {subs.map((s, i) => {
                    const submitter = players.find(p => p.id === s.submitted_by)
                    return (
                      <div key={i} style={{ background: 'var(--card2)', borderRadius: 12, padding: '14px 16px' }}>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>SUBMITTED BY {submitter?.full_name?.toUpperCase()}</div>
                        <div style={{ fontFamily: 'Bebas Neue', fontSize: 28, marginBottom: 10 }}>{s.home_goals} — {s.away_goals}</div>
                        {s.screenshot && (
                          <a href={s.screenshot} target="_blank" rel="noreferrer">
                            <img src={s.screenshot} alt="proof" style={{ width: '100%', borderRadius: 8, objectFit: 'contain', maxHeight: 160, border: '1px solid var(--border)' }} />
                          </a>
                        )}
                        <button onClick={() => resolveDispute(f.id, s.home_goals, s.away_goals)}
                          style={{ width: '100%', marginTop: 12, padding: '8px', background: 'var(--green)', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                          ✓ Use This Score
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {pendingSubmissions.length > 0 && (
            <>
              <h3 style={{ fontSize: 18, margin: '24px 0 14px', color: 'var(--amber)' }}>Waiting for second submission</h3>
              {pendingSubmissions.map(f => {
                const sub = submissions.find(s => s.fixture_id === f.id)
                const submitter = players.find(p => p.id === sub?.submitted_by)
                const home = playerMap[f.home_player_id]
                const away = playerMap[f.away_player_id]
                return (
                  <div key={f.id} style={{ background: 'var(--card)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{home?.full_name} vs {away?.full_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--sub)', marginTop: 2 }}>{submitter?.full_name} submitted {sub?.home_goals} - {sub?.away_goals} · Waiting for opponent</div>
                    </div>
                    <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'rgba(245,158,11,.12)', color: 'var(--amber)', fontWeight: 600 }}>Pending</span>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}

      {/* All players */}
      {tab === 'players' && (
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
              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: p.status === 'approved' ? 'rgba(0,200,150,.15)' : p.status === 'rejected' ? 'rgba(239,68,68,.15)' : p.status === 'reupload' ? 'rgba(245,158,11,.15)' : 'rgba(245,158,11,.15)',
                color: p.status === 'approved' ? 'var(--green)' : p.status === 'rejected' ? 'var(--red)' : 'var(--amber)' }}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Fixtures */}
      {tab === 'fixtures' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <button onClick={generateFixtures} disabled={loading || approved.length < 2}
              style={{ padding: '10px 22px', background: 'var(--green)', color: '#000', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {loading ? 'Generating...' : fixtures.length ? 'Regenerate Fixtures' : 'Generate Fixtures'}
            </button>
          </div>
          {fixtures.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 14 }}>No fixtures yet.</p>}
          {[...new Set(fixtures.map(f => f.matchday))].sort((a, b) => a - b).map(md => (
            <div key={md}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', margin: '20px 0 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
                Matchday {md}<div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              {fixtures.filter(f => f.matchday === md).map(f => {
                const h = playerMap[f.home_player_id]
                const a = playerMap[f.away_player_id]
                const s = scores[f.id] || {}
                const fixtureSubs = submissions.filter(sub => sub.fixture_id === f.id)
                return (
                  <div key={f.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 500, textAlign: 'right', minWidth: 80 }}>{h?.full_name || 'TBD'}</div>
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
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 500, minWidth: 80 }}>{a?.full_name || 'TBD'}</div>
                    </div>
                    {fixtureSubs.length > 0 && !f.played && (
                      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--amber)' }}>
                        ⚠️ {fixtureSubs.length} player submission{fixtureSubs.length > 1 ? 's' : ''} waiting for review
                      </div>
                    )}
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
