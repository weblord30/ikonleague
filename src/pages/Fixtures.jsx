import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Fixtures({ player }) {
  const [fixtures, setFixtures] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('fixtures').select('*').order('matchday'),
      supabase.from('players').select('id,full_name,username,team_name').eq('status', 'approved')
    ]).then(([{ data: f }, { data: p }]) => {
      setFixtures(f || []); setPlayers(p || []); setLoading(false)
    })
  }, [])

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))
  const matchdays = [...new Set(fixtures.map(f => f.matchday))].sort((a, b) => a - b)

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>Loading fixtures...</div>
  if (!fixtures.length) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)', fontSize: 14 }}>Fixtures will be published here once the admin generates the schedule.</div>

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px 80px' }}>
      <h2 style={{ fontSize: 32, marginBottom: 4 }}>Fixtures</h2>
      <p style={{ color: 'var(--sub)', fontSize: 14, marginBottom: 28 }}>Season 1 · {fixtures.length} matches · {matchdays.length} matchdays</p>
      {matchdays.map(md => (
        <div key={md}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', margin: '24px 0 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
            Matchday {md}
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          {fixtures.filter(f => f.matchday === md).map(f => {
            const h = playerMap[f.home_player_id]
            const a = playerMap[f.away_player_id]
            const isMyMatch = player && (f.home_player_id === player.id || f.away_player_id === player.id)
            return (
              <div key={f.id} style={{ background: isMyMatch ? 'rgba(0,200,150,.04)' : 'var(--card)', border: `1px solid ${isMyMatch ? 'rgba(0,200,150,.25)' : 'var(--border)'}`, borderRadius: 12, padding: '14px 18px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{h?.full_name || 'TBD'}</div>
                <div style={{ minWidth: 80, textAlign: 'center', fontFamily: 'Bebas Neue', fontSize: f.played ? 22 : 15, letterSpacing: '.06em', color: f.played ? 'var(--text)' : 'var(--muted)' }}>
                  {f.played ? `${f.home_goals} — ${f.away_goals}` : 'vs'}
                </div>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{a?.full_name || 'TBD'}</div>
                {isMyMatch && !f.played && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(0,200,150,.15)', color: 'var(--green)', fontWeight: 600, flexShrink: 0 }}>YOUR MATCH</span>}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}