import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Standings() {
  const [players, setPlayers] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('players').select('*').eq('status', 'approved'),
      supabase.from('fixtures').select('*').eq('played', true)
    ]).then(([{ data: p }, { data: f }]) => {
      setPlayers(p || []); setFixtures(f || []); setLoading(false)
    })
  }, [])

  const table = (() => {
    const stats = {}
    players.forEach(p => { stats[p.id] = { ...p, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 } })
    fixtures.forEach(f => {
      const h = stats[f.home_player_id]; const a = stats[f.away_player_id]
      if (!h || !a) return
      h.played++; a.played++; h.gf += f.home_goals; h.ga += f.away_goals; a.gf += f.away_goals; a.ga += f.home_goals
      if (f.home_goals > f.away_goals) { h.won++; h.pts += 3; a.lost++ }
      else if (f.home_goals < f.away_goals) { a.won++; a.pts += 3; h.lost++ }
      else { h.drawn++; a.drawn++; h.pts++; a.pts++ }
    })
    return Object.values(stats).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
  })()

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>Loading standings...</div>
  if (!players.length) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)', fontSize: 14 }}>Standings will appear once the league kicks off.</div>

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 16px 80px' }}>
      <h2 style={{ fontSize: 32, marginBottom: 4 }}>Standings</h2>
      <p style={{ color: 'var(--sub)', fontSize: 14, marginBottom: 24 }}>Season 1 · Round-robin · {players.length} players</p>
      <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: 'var(--card2)' }}>
            <tr>{['#', 'Player', 'P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'].map(h => (
              <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--sub)', fontWeight: 600, fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {table.map((r, i) => {
              const gd = r.gf - r.ga
              const posColor = i === 0 ? 'var(--amber)' : i === 1 ? 'var(--sub)' : i === 2 ? '#cd7c3a' : 'var(--text)'
              return (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '11px 14px', fontWeight: 700, color: posColor }}>{i + 1}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,200,150,.15)', border: '1px solid rgba(0,200,150,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--green)', flexShrink: 0 }}>
                        {r.full_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.full_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>@{r.username}</div>
                      </div>
                    </div>
                  </td>
                  {[r.played, r.won, r.drawn, r.lost, r.gf, r.ga].map((v, j) => (
                    <td key={j} style={{ padding: '11px 14px' }}>{v}</td>
                  ))}
                  <td style={{ padding: '11px 14px', color: gd > 0 ? 'var(--green)' : gd < 0 ? 'var(--red)' : 'var(--sub)' }}>{gd > 0 ? '+' : ''}{gd}</td>
                  <td style={{ padding: '11px 14px', fontWeight: 700, color: 'var(--green)', fontSize: 15 }}>{r.pts}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}