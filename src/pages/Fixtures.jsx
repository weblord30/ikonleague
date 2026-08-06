import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { createNotification } from '../hooks/useNotifications'

export default function Fixtures({ player }) {
  const [fixtures, setFixtures] = useState([])
  const [players, setPlayers] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(null)
  const [submitForm, setSubmitForm] = useState({})
  const [preview, setPreview] = useState({})
  const [msg, setMsg] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('fixtures').select('*').order('matchday'),
      supabase.from('players').select('id,full_name,username,team_name,user_id').eq('status', 'approved'),
      supabase.from('score_submissions').select('*')
    ]).then(([{ data: f }, { data: p }, { data: s }]) => {
      setFixtures(f || [])
      setPlayers(p || [])
      setSubmissions(s || [])
      setLoading(false)
    })
  }, [])

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))
  const matchdays = [...new Set(fixtures.map(f => f.matchday))].sort((a, b) => a - b)

  const handleFile = (fixtureId, file) => {
    if (!file) return
    setSubmitForm(x => ({ ...x, [fixtureId]: { ...x[fixtureId], file } }))
    setPreview(x => ({ ...x, [fixtureId]: URL.createObjectURL(file) }))
  }

  const submitScore = async (fixture) => {
    const form = submitForm[fixture.id] || {}
    if (form.home === undefined || form.away === undefined) { setMsg('Enter both scores'); return }
    if (!form.file) { setMsg('Upload a screenshot as proof'); return }

    setSubmitting(fixture.id)

    const ext = form.file.name.split('.').pop()
    const fileName = `result-${fixture.id}-${player.id}-${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('payment-screenshots').upload(fileName, form.file)
    if (uploadErr) { setMsg('Upload failed. Try again.'); setSubmitting(null); return }

    const { data: { publicUrl } } = supabase.storage.from('payment-screenshots').getPublicUrl(fileName)

    // Check if opponent already submitted
    const existing = submissions.filter(s => s.fixture_id === fixture.id)
    const { error } = await supabase.from('score_submissions').insert({
      fixture_id: fixture.id,
      submitted_by: player.id,
      home_goals: form.home,
      away_goals: form.away,
      screenshot: publicUrl
    })

    if (error) { setMsg(error.message); setSubmitting(null); return }

    // If opponent submitted same score, auto confirm
    if (existing.length === 1) {
      const opp = existing[0]
      if (opp.home_goals === form.home && opp.away_goals === form.away) {
        await supabase.from('fixtures').update({ home_goals: form.home, away_goals: form.away, played: true }).eq('id', fixture.id)

        const home = playerMap[fixture.home_player_id]
        const away = playerMap[fixture.away_player_id]
        if (home) await createNotification(home.user_id, 'Result confirmed! 🏆', `Your match result has been confirmed: ${home.full_name} ${form.home} - ${form.away} ${away?.full_name}.`, 'result')
        if (away) await createNotification(away.user_id, 'Result confirmed! 🏆', `Your match result has been confirmed: ${home?.full_name} ${form.home} - ${form.away} ${away.full_name}.`, 'result')

        setMsg('Result confirmed automatically!')
      } else {
        // Scores don't match — flag for admin
        const home = playerMap[fixture.home_player_id]
        const away = playerMap[fixture.away_player_id]
        // Notify admin via a special user_id placeholder
        setMsg('Score submitted. Scores don\'t match — admin will review.')
      }
    } else {
      setMsg('Score submitted! Waiting for your opponent to confirm.')
    }

    // Refresh
    const { data: newSubs } = await supabase.from('score_submissions').select('*')
    const { data: newFix } = await supabase.from('fixtures').select('*').order('matchday')
    setSubmissions(newSubs || [])
    setFixtures(newFix || [])
    setSubmitting(null)
    setSubmitForm(x => { const n = { ...x }; delete n[fixture.id]; return n })
    setPreview(x => { const n = { ...x }; delete n[fixture.id]; return n })
    setTimeout(() => setMsg(''), 4000)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}>Loading fixtures...</div>
  if (!fixtures.length) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)', fontSize: 14 }}>Fixtures will be published here once the admin generates the schedule.</div>

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px 80px' }}>
      <h2 style={{ fontSize: 32, marginBottom: 4 }}>Fixtures</h2>
      <p style={{ color: 'var(--sub)', fontSize: 14, marginBottom: 28 }}>Season 1 · {fixtures.length} matches · {matchdays.length} matchdays</p>

      {msg && <div style={{ background: 'rgba(0,200,150,.1)', border: '1px solid rgba(0,200,150,.25)', color: 'var(--green)', padding: '10px 16px', borderRadius: 10, fontSize: 13, marginBottom: 20 }}>{msg}</div>}

      {matchdays.map(md => (
        <div key={md}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', margin: '24px 0 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
            Matchday {md}<div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          {fixtures.filter(f => f.matchday === md).map(f => {
            const h = playerMap[f.home_player_id]
            const a = playerMap[f.away_player_id]
            const isMyMatch = player && (f.home_player_id === player.id || f.away_player_id === player.id)
            const mySubmission = submissions.find(s => s.fixture_id === f.id && s.submitted_by === player?.id)
            const allSubs = submissions.filter(s => s.fixture_id === f.id)
            const form = submitForm[f.id] || {}

            return (
              <div key={f.id} style={{ background: isMyMatch ? 'rgba(0,200,150,.04)' : 'var(--card)', border: `1px solid ${isMyMatch ? 'rgba(0,200,150,.25)' : 'var(--border)'}`, borderRadius: 12, padding: '14px 18px', marginBottom: 8 }}>

                {/* Match header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isMyMatch && !f.played ? 14 : 0 }}>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{h?.full_name || 'TBD'}</div>
                  <div style={{ minWidth: 80, textAlign: 'center', fontFamily: 'Bebas Neue', fontSize: f.played ? 22 : 15, letterSpacing: '.06em', color: f.played ? 'var(--text)' : 'var(--muted)' }}>
                    {f.played ? `${f.home_goals} — ${f.away_goals}` : 'vs'}
                  </div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{a?.full_name || 'TBD'}</div>
                  {isMyMatch && !f.played && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(0,200,150,.15)', color: 'var(--green)', fontWeight: 600, flexShrink: 0 }}>YOUR MATCH</span>}
                </div>

                {/* Submission status */}
                {isMyMatch && !f.played && (
                  <div>
                    {mySubmission ? (
                      <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--amber)' }}>
                        ⏳ You submitted {mySubmission.home_goals} - {mySubmission.away_goals}. Waiting for {allSubs.length < 2 ? 'your opponent' : 'admin to resolve dispute'}.
                      </div>
                    ) : (
                      <div style={{ background: 'var(--card2)', borderRadius: 10, padding: '14px' }}>
                        <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 12, fontWeight: 500 }}>Submit your result</p>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ flex: 1, textAlign: 'right', fontSize: 12, color: 'var(--sub)' }}>{h?.full_name}</div>
                          <input type="number" min="0" max="99" value={form.home ?? ''} placeholder="0"
                            onChange={e => setSubmitForm(x => ({ ...x, [f.id]: { ...x[f.id], home: +e.target.value } }))}
                            style={{ width: 44, padding: '7px', textAlign: 'center', background: 'var(--dark)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 16, fontWeight: 700, outline: 'none' }} />
                          <span style={{ color: 'var(--muted)', fontWeight: 700 }}>—</span>
                          <input type="number" min="0" max="99" value={form.away ?? ''} placeholder="0"
                            onChange={e => setSubmitForm(x => ({ ...x, [f.id]: { ...x[f.id], away: +e.target.value } }))}
                            style={{ width: 44, padding: '7px', textAlign: 'center', background: 'var(--dark)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 16, fontWeight: 700, outline: 'none' }} />
                          <div style={{ flex: 1, fontSize: 12, color: 'var(--sub)' }}>{a?.full_name}</div>
                        </div>

                        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px', background: 'var(--dark)', border: `2px dashed ${preview[f.id] ? 'var(--green)' : 'var(--border)'}`, borderRadius: 10, cursor: 'pointer', marginBottom: 12 }}>
                          {preview[f.id]
                            ? <img src={preview[f.id]} alt="proof" style={{ maxHeight: 120, borderRadius: 8, objectFit: 'contain' }} />
                            : <>
                              <span style={{ fontSize: 20 }}>📸</span>
                              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Upload result screenshot</span>
                            </>
                          }
                          <input type="file" accept="image/*" onChange={e => handleFile(f.id, e.target.files[0])} style={{ display: 'none' }} />
                        </label>

                        <button onClick={() => submitScore(f)} disabled={submitting === f.id}
                          style={{ width: '100%', padding: '10px', background: 'var(--green)', color: '#000', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                          {submitting === f.id ? 'Submitting...' : 'Submit Result'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
