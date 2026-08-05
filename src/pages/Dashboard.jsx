import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Dashboard({ player }) {
  const [fixtures, setFixtures] = useState([])
  const [players, setPlayers] = useState([])

  useEffect(() => {
    if (!player) return
    supabase.from('fixtures').select('*').or(`home_player_id.eq.${player.id},away_player_id.eq.${player.id}`).then(({ data }) => setFixtures(data || []))
    supabase.from('players').select('id,full_name,username,team_name').eq('status', 'approved').then(({ data }) => setPlayers(data || []))
  }, [player])

  if (!player) return null

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))
  const played = fixtures.filter(f => f.played)
  const upcoming = fixtures.filter(f => !f.played)

  let w = 0, d = 0, l = 0, gf = 0, ga = 0
  played.forEach(f => {
    const isHome = f.home_player_id === player.id
    const my = isHome ? f.home_goals : f.away_goals
    const op = isHome ? f.away_goals : f.home_goals
    gf += my; ga += op
    if (my > op) w++; else if (my < op) l++; else d++
  })
  const pts = w * 3 + d

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Profile card */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: '28px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,200,150,.15)', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue', fontSize: 22, color: 'var(--green)' }}>
            {player.full_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{player.full_name}</div>
            <div style={{ fontSize: 13, color: 'var(--sub)', marginTop: 2 }}>@{player.username} · {player.team_name}</div>
            <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 4, fontWeight: 600 }}>{player.player_code}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
          {[['Pts', pts, 'var(--green)'], ['W', w, 'var(--green)'], ['D', d, 'var(--sub)'], ['L', l, 'var(--red)'], ['GD', gf - ga, gf - ga >= 0 ? 'var(--green)' : 'var(--red)']].map(([label, val, color]) => (
            <div key={label} style={{ background: 'var(--card2)', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 26, color, lineHeight: 1 }}>{val > 0 && label === 'GD' ? '+' + val : val}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming fixtures */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 20, marginBottom: 14 }}>Upcoming Fixtures</h3>
          {upcoming.slice(0, 5).map(f => {
            const isHome = f.home_player_id === player.id
            const opp = playerMap[isHome ? f.away_player_id : f.home_player_id]
            return (
              <div key={f.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13 }}>
                  <span style={{ color: 'var(--green)', fontWeight: 600 }}>vs {opp?.full_name || 'TBD'}</span>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>Matchday {f.matchday} · @{opp?.username}</div>
                </div>
                <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(245,158,11,.1)', color: 'var(--amber)', fontWeight: 600 }}>Upcoming</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Results */}
      {played.length > 0 && (
        <div>
          <h3 style={{ fontSize: 20, marginBottom: 14 }}>Recent Results</h3>
          {played.slice(-5).reverse().map(f => {
            const isHome = f.home_player_id === player.id
            const opp = playerMap[isHome ? f.away_player_id : f.home_player_id]
            const my = isHome ? f.home_goals : f.away_goals
            const op = isHome ? f.away_goals : f.home_goals
            const outcome = my > op ? 'W' : my < op ? 'L' : 'D'
            const color = outcome === 'W' ? 'var(--green)' : outcome === 'L' ? 'var(--red)' : 'var(--sub)'
            return (
              <div key={f.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>vs {opp?.full_name || 'TBD'}</span>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>Matchday {f.matchday}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'Bebas Neue', fontSize: 20 }}>{my} — {op}</span>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: `${color}22`, color, fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{outcome}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {played.length === 0 && upcoming.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)', fontSize: 14 }}>
          Fixtures will appear here once the admin generates the schedule.
        </div>
      )}
    </div>
  )
}