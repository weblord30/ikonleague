import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const MAX_PLAYERS = 20
const REGISTRATION_URL = 'https://ikonleague-tylq.vercel.app/register'

export default function Landing({ session, player }) {
  const nav = useNavigate()
  const [count, setCount] = useState(0)
  const [standings, setStandings] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [players, setPlayers] = useState([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    supabase.from('players').select('id', { count: 'exact' }).eq('status', 'approved')
      .then(({ count }) => setCount(count || 0))
    supabase.from('players').select('*').eq('status', 'approved')
      .then(({ data }) => setPlayers(data || []))
    supabase.from('fixtures').select('*').order('matchday')
      .then(({ data }) => setFixtures(data || []))
  }, [])

  useEffect(() => {
    if (!players.length) return
    const stats = {}
    players.forEach(p => { stats[p.id] = { ...p, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 } })
    fixtures.filter(f => f.played).forEach(f => {
      const h = stats[f.home_player_id]; const a = stats[f.away_player_id]
      if (!h || !a) return
      h.played++; a.played++; h.gf += f.home_goals; h.ga += f.away_goals
      a.gf += f.away_goals; a.ga += f.home_goals
      if (f.home_goals > f.away_goals) { h.won++; h.pts += 3; a.lost++ }
      else if (f.home_goals < f.away_goals) { a.won++; a.pts += 3; h.lost++ }
      else { h.drawn++; a.drawn++; h.pts++; a.pts++ }
    })
    setStandings(Object.values(stats).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf))
  }, [players, fixtures])

  const copyLink = () => {
    navigator.clipboard.writeText(REGISTRATION_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const shareWhatsApp = () => {
    const msg = `⚽ *ikonLeague Season 1 is live!*\n\nNigeria's most competitive eFootball mobile league. Entry fee is ₦2,000 with a full prize pool for top 4.\n\n🔗 Register here: ${REGISTRATION_URL}\n\nSpots are limited — secure yours now!`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const spotsLeft = Math.max(0, MAX_PLAYERS - count)
  const pct = (count / MAX_PLAYERS) * 100
  const full = spotsLeft === 0

  // ── NOT LOGGED IN — Marketing page ──────────────────────────────────────
  if (!session) return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ padding: '72px 24px 56px', textAlign: 'center', background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,200,150,.18), transparent)' }}>
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
                <span>{count} registered</span><span>{MAX_PLAYERS} max</span>
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
          {[['₦2,000', 'Entry Fee', '#f59e0b'], ['Round-Robin', 'Format', 'var(--green)'], ['Top 4 Win', 'Prize Pool', 'var(--blue)']].map(([v, l, c]) => (
            <div key={l} style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, color: c }}>{v}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {!full && <button onClick={() => nav('/register')} style={{ padding: '14px 40px', borderRadius: 12, background: 'var(--green)', color: '#000', fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer' }}>Register Now →</button>}
      </div>

      {/* Prize breakdown */}
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 24px 80px' }}>
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
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 16 }}>Prize pool = total entry fees · Paid within 48hrs of season end</p>
      </div>
    </div>
  )

  // ── PENDING — Lite home ──────────────────────────────────────────────────
  if (player?.status === 'pending' || player?.status === 'rejected') return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Status banner */}
      <div style={{ background: player?.status === 'rejected' ? 'rgba(239,68,68,.08)' : 'rgba(245,158,11,.08)', border: `1px solid ${player?.status === 'rejected' ? 'rgba(239,68,68,.25)' : 'rgba(245,158,11,.25)'}`, borderRadius: 16, padding: '20px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 32, flexShrink: 0 }}>{player?.status === 'rejected' ? '❌' : '⏳'}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
            {player?.status === 'rejected' ? 'Payment Not Verified' : 'Payment Under Review'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.6 }}>
            {player?.status === 'rejected'
              ? 'Your payment could not be verified. Please contact admin on WhatsApp to resolve this.'
              : 'Admin is reviewing your payment screenshot. You\'ll be notified once approved — usually within a few hours.'}
          </div>
          {player?.status === 'rejected' && (
            <a href="https://wa.me/234YOURPHONENUMBER" target="_blank" rel="noreferrer"
              style={{ display: 'inline-block', marginTop: 10, padding: '7px 16px', background: '#25d366', color: '#000', borderRadius: 8, fontWeight: 700, fontSize: 12 }}>
              Contact Admin on WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Mini standings */}
      <h3 style={{ fontSize: 22, marginBottom: 14 }}>Current Standings</h3>
      {standings.length === 0
        ? <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginBottom: 28 }}>Standings will appear once the league kicks off.</div>
        : <MiniStandings standings={standings} />
      }

      {/* Mini fixtures */}
      <h3 style={{ fontSize: 22, margin: '28px 0 14px' }}>Latest Fixtures</h3>
      {fixtures.length === 0
        ? <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Fixtures will be published once the season starts.</div>
        : <MiniFixtures fixtures={fixtures.slice(0, 6)} players={players} />
      }
    </div>
  )

  // ── APPROVED — Personal home ─────────────────────────────────────────────
  const myFixtures = fixtures.filter(f => f.home_player_id === player?.id || f.away_player_id === player?.id)
  const myPlayed = myFixtures.filter(f => f.played)
  const myUpcoming = myFixtures.filter(f => !f.played)
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))

  let w = 0, d = 0, l = 0, gf = 0, ga = 0
  myPlayed.forEach(f => {
    const isHome = f.home_player_id === player?.id
    const my = isHome ? f.home_goals : f.away_goals
    const op = isHome ? f.away_goals : f.home_goals
    gf += my; ga += op
    if (my > op) w++; else if (my < op) l++; else d++
  })
  const pts = w * 3 + d
  const myRank = standings.findIndex(s => s.id === player?.id) + 1

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 80px' }}>

      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 28, marginBottom: 4 }}>Welcome back, {player?.full_name?.split(' ')[0]} 👋</h2>
        <p style={{ fontSize: 14, color: 'var(--sub)' }}>Season 1 is underway. Here's your overview.</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          ['League Position', myRank ? `#${myRank}` : '—', 'var(--amber)'],
          ['Points', pts, 'var(--green)'],
          ['Record', `${w}W ${d}D ${l}L`, 'var(--sub)'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 14px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 28, color, lineHeight: 1, marginBottom: 4 }}>{val}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Next fixture */}
      {myUpcoming.length > 0 && (() => {
        const next = myUpcoming[0]
        const isHome = next.home_player_id === player?.id
        const opp = playerMap[isHome ? next.away_player_id : next.home_player_id]
        return (
          <div style={{ background: 'rgba(0,200,150,.06)', border: '1px solid rgba(0,200,150,.2)', borderRadius: 14, padding: '18px 20px', marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', letterSpacing: '.06em', marginBottom: 10 }}>NEXT FIXTURE</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>vs {opp?.full_name || 'TBD'}</div>
                <div style={{ fontSize: 12, color: 'var(--sub)', marginTop: 3 }}>@{opp?.username} · Team: {opp?.team_name} · Matchday {next.matchday}</div>
              </div>
              <span style={{ fontSize: 11, padding: '5px 12px', borderRadius: 20, background: 'rgba(245,158,11,.12)', color: 'var(--amber)', fontWeight: 600 }}>Upcoming</span>
            </div>
          </div>
        )
      })()}

      {/* Mini standings */}
      <h3 style={{ fontSize: 22, marginBottom: 14 }}>Standings</h3>
      <MiniStandings standings={standings} highlightId={player?.id} />

      {/* Recent results */}
      {myPlayed.length > 0 && (
        <>
          <h3 style={{ fontSize: 22, margin: '28px 0 14px' }}>Recent Results</h3>
          {myPlayed.slice(-3).reverse().map(f => {
            const isHome = f.home_player_id === player?.id
            const opp = playerMap[isHome ? f.away_player_id : f.home_player_id]
            const my = isHome ? f.home_goals : f.away_goals
            const op = isHome ? f.away_goals : f.home_goals
            const outcome = my > op ? 'W' : my < op ? 'L' : 'D'
            const color = outcome === 'W' ? 'var(--green)' : outcome === 'L' ? 'var(--red)' : 'var(--sub)'
            return (
              <div key={f.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '13px 18px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>vs {opp?.full_name || 'TBD'}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Matchday {f.matchday}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'Bebas Neue', fontSize: 20 }}>{my} — {op}</span>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: `${color}22`, color, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{outcome}</span>
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* Referral */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 24px', marginTop: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', letterSpacing: '.06em', marginBottom: 8 }}>INVITE A FRIEND</p>
        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Know someone who can compete?</p>
        <p style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.6, marginBottom: 20 }}>
          Share the registration link and get them in before spots run out.
        </p>
        <div style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--muted)', marginBottom: 14, wordBreak: 'break-all' }}>
          {REGISTRATION_URL}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={copyLink} style={{ flex: 1, padding: '11px', borderRadius: 10, background: copied ? 'rgba(0,200,150,.15)' : 'var(--card2)', border: '1px solid var(--border)', color: copied ? 'var(--green)' : 'var(--sub)', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: '.2s' }}>
            {copied ? '✓ Copied!' : '📋 Copy Link'}
          </button>
          <button onClick={shareWhatsApp} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#25d366', color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none' }}>
            📲 Share on WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Mini components ──────────────────────────────────────────────────────────
function MiniStandings({ standings, highlightId }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead style={{ background: 'var(--card2)' }}>
          <tr>
            {['#', 'Player', 'P', 'W', 'D', 'L', 'Pts'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--muted)', fontWeight: 600, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.slice(0, 5).map((r, i) => {
            const isMe = r.id === highlightId
            const posColor = i === 0 ? 'var(--amber)' : i === 1 ? 'var(--sub)' : i === 2 ? '#cd7c3a' : 'var(--text)'
            return (
              <tr key={r.id} style={{ borderTop: '1px solid var(--border)', background: isMe ? 'rgba(0,200,150,.06)' : 'transparent' }}>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: posColor }}>{i + 1}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ fontWeight: isMe ? 700 : 500, color: isMe ? 'var(--green)' : 'var(--text)' }}>{r.full_name}</span>
                  {isMe && <span style={{ fontSize: 9, color: 'var(--green)', marginLeft: 6, fontWeight: 600 }}>YOU</span>}
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--sub)' }}>{r.played}</td>
                <td style={{ padding: '10px 12px', color: 'var(--sub)' }}>{r.won}</td>
                <td style={{ padding: '10px 12px', color: 'var(--sub)' }}>{r.drawn}</td>
                <td style={{ padding: '10px 12px', color: 'var(--sub)' }}>{r.lost}</td>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--green)' }}>{r.pts}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MiniFixtures({ fixtures, players }) {
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))
  return (
    <div>
      {fixtures.map(f => {
        const h = playerMap[f.home_player_id]; const a = playerMap[f.away_player_id]
        return (
          <div key={f.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{h?.full_name || 'TBD'}</div>
            <div style={{ minWidth: 70, textAlign: 'center', fontFamily: 'Bebas Neue', fontSize: f.played ? 20 : 13, color: f.played ? 'var(--text)' : 'var(--muted)' }}>
              {f.played ? `${f.home_goals} — ${f.away_goals}` : 'vs'}
            </div>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{a?.full_name || 'TBD'}</div>
          </div>
        )
      })}
    </div>
  )
}
