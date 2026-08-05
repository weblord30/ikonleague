import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const MAX_PLAYERS = 20

export default function Register() {
  const nav = useNavigate()
  const [step, setStep] = useState(1) // 1=info, 2=terms, 3=payment
  const [form, setForm] = useState({ fullName: '', username: '', teamName: '', whatsapp: '', email: '', password: '' })
  const [agreed, setAgreed] = useState(false)
  const [screenshot, setScreenshot] = useState(null)
  const [preview, setPreview] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const validateStep1 = () => {
    if (!form.fullName.trim()) return 'Enter your full name'
    if (!form.username.trim()) return 'Enter your eFootball username'
    if (!form.teamName.trim()) return 'Enter your team name'
    if (!form.whatsapp.trim()) return 'Enter your WhatsApp number'
    if (!form.email.trim() || !form.email.includes('@')) return 'Enter a valid email'
    if (form.password.length < 6) return 'Password must be at least 6 characters'
    return ''
  }

  const handleFile = e => {
    const file = e.target.files[0]
    if (!file) return
    setScreenshot(file)
    setPreview(URL.createObjectURL(file))
  }

  const submit = async () => {
    if (!screenshot) { setErr('Please upload your payment screenshot'); return }
    setLoading(true); setErr('')

    // Check spots
    const { count } = await supabase.from('players').select('id', { count: 'exact' }).eq('status', 'approved')
    if ((count || 0) >= MAX_PLAYERS) { setErr('Sorry, the league is now full.'); setLoading(false); return }

    // Sign up
    const { data: authData, error: authErr } = await supabase.auth.signUp({ email: form.email, password: form.password })
    if (authErr) { setErr(authErr.message); setLoading(false); return }

    // Upload screenshot
    const ext = screenshot.name.split('.').pop()
    const fileName = `${authData.user.id}-${Date.now()}.${ext}`
    const { data: uploadData, error: uploadErr } = await supabase.storage.from('payment-screenshots').upload(fileName, screenshot)
    if (uploadErr) { setErr('Screenshot upload failed. Try again.'); setLoading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('payment-screenshots').getPublicUrl(fileName)

    // Insert player
    const { error: insertErr } = await supabase.from('players').insert({
      user_id: authData.user.id,
      full_name: form.fullName,
      username: form.username,
      team_name: form.teamName,
      whatsapp: form.whatsapp,
      payment_screenshot: publicUrl,
      status: 'pending',
      player_code: 'IKN-' + Math.random().toString(36).slice(2, 7).toUpperCase()
    })

    if (insertErr) { setErr(insertErr.message); setLoading(false); return }
    nav('/pending')
  }

  const inputStyle = { width: '100%', padding: '11px 14px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 14, outline: 'none' }
  const labelStyle = { display: 'block', fontSize: 13, color: 'var(--sub)', marginBottom: 8, fontWeight: 500 }

  return (
    <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 20px 80px' }}>
      {/* Progress */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
        {['Your Info', 'Terms', 'Payment'].map((s, i) => (
          <div key={s} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: 4, borderRadius: 99, background: i + 1 <= step ? 'var(--green)' : 'var(--border)', marginBottom: 6, transition: '.3s' }} />
            <span style={{ fontSize: 11, color: i + 1 === step ? 'var(--green)' : 'var(--muted)', fontWeight: 500 }}>{s}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
        {err && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', color: '#fca5a5', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16 }}>{err}</div>}

        {/* Step 1 — Info */}
        {step === 1 && (
          <>
            <h3 style={{ fontSize: 22, marginBottom: 20 }}>Your Details</h3>
            {[
              ['fullName', 'Full name', 'text', 'e.g. Mustapha Sulaimon'],
              ['username', 'eFootball Username', 'text', 'The name friends search to find you'],
              ['teamName', 'Team Name', 'text', 'Name shown during matches'],
              ['whatsapp', 'WhatsApp Number', 'tel', '+234 xxx xxx xxxx'],
              ['email', 'Email Address', 'email', 'you@email.com'],
              ['password', 'Create Password', 'password', 'Min. 6 characters'],
            ].map(([k, label, type, ph]) => (
              <div key={k} style={{ marginBottom: 16 }}>
                <label style={labelStyle}>{label}</label>
                <input type={type} value={form[k]} onChange={set(k)} placeholder={ph} style={inputStyle} />
              </div>
            ))}
            <button onClick={() => { const e = validateStep1(); if (e) { setErr(e); return; } setErr(''); setStep(2) }}
              style={{ width: '100%', padding: 14, borderRadius: 12, background: 'var(--green)', color: '#000', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', marginTop: 8 }}>
              Continue →
            </button>
          </>
        )}

        {/* Step 2 — Terms */}
        {step === 2 && (
          <>
            <h3 style={{ fontSize: 22, marginBottom: 16 }}>Terms & Conditions</h3>
            <div style={{ height: 320, overflowY: 'auto', background: 'var(--card2)', borderRadius: 12, padding: '16px 18px', marginBottom: 20, fontSize: 13, color: 'var(--sub)', lineHeight: 1.8, border: '1px solid var(--border)' }}>
              {[
                ["Eligibility", "ikonLeague Season 1 is open to all players with an active eFootball mobile account. Participation is limited to one registration per person. Any player found to have created duplicate accounts will be permanently disqualified without refund."],
                ["Entry Fee & Payment", "The entry fee is ₦2,000, paid via Moniepoint to Mustapha Olabode Sulaimon (7025204373). After transferring, upload your payment screenshot. Your registration stays pending until admin verifies your payment. All fees are non-refundable once verified."],
                ["Registration & Spot Allocation", "Registration is capped at 20 players on a first-come, first-served basis. Submitting a form does not guarantee your spot — only admin approval does. Admin may close registration early if interest is low; in that case all verified payments will be refunded."],
                ["Fixtures & Scheduling", "The league uses a full round-robin format — every player faces every other player once. Fixtures are on the ikonLeague app. Each player must contact their opponent to agree a time. Unplayed matches default to 0 — 0 unless one player is clearly at fault."],
                ["Results Reporting", "Both players must submit a final score screenshot to admin after each match. Results are recorded on the app by admin. Falsifying results leads to immediate disqualification."],
                ["Code of Conduct", "Respect is expected at all times. Harassment, abuse or unsportsmanlike behaviour results in immediate disqualification without refund."],
                ["Prize Pool & Payouts", "Prize pool = 100% of all entry fees. Distribution: 1st (40%), 2nd (30%), 3rd (20%), 4th (10%). Admin may adjust tiers if fewer than 20 players register. Prizes paid within 48hrs of the final matchday via bank transfer."],
                ["Admin Rights", "Admin may disqualify players for cheating, exploiting bugs, or bad faith. Admin decisions are final."],
                ["Agreement", "By completing registration you confirm you have read, understood and agreed to all terms above in full."],
              ].map(([t, b]) => (
                <div key={t} style={{ marginBottom: 18 }}>
                  <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 4 }}>{t}</strong>
                  {b}
                </div>
              ))}
            </div>

            {/* Summary */}
            <div style={{ background: 'rgba(0,200,150,.07)', border: '1px solid rgba(0,200,150,.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', marginBottom: 10, letterSpacing: '.04em' }}>KEY THINGS TO KNOW</p>
              {['₦2,000 entry fee — non-refundable once verified', 'Spot only confirmed after admin approves your screenshot', 'Every player faces every other player', 'Results submitted via WhatsApp screenshot', 'Prizes paid within 48hrs of season end'].map((x, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--sub)', marginBottom: 6 }}>
                  <span style={{ color: 'var(--green)', fontWeight: 700, flexShrink: 0 }}>✓</span>{x}
                </div>
              ))}
            </div>

            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 20 }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2, accentColor: 'var(--green)', width: 16, height: 16, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--sub)', lineHeight: 1.5 }}>I have read and agree to the ikonLeague Season 1 Terms & Conditions</span>
            </label>

            <button onClick={() => { if (!agreed) { setErr('You must agree to the Terms & Conditions'); return; } setErr(''); setStep(3) }}
              disabled={!agreed}
              style={{ width: '100%', padding: 14, borderRadius: 12, background: agreed ? 'var(--green)' : '#1e4d3d', color: agreed ? '#000' : 'var(--muted)', fontWeight: 700, fontSize: 15, border: 'none', cursor: agreed ? 'pointer' : 'not-allowed', marginBottom: 10 }}>
              I Agree — Continue →
            </button>
            <button onClick={() => { setErr(''); setStep(1) }} style={{ width: '100%', padding: 12, borderRadius: 12, background: 'transparent', color: 'var(--sub)', fontWeight: 600, fontSize: 14, border: '1px solid var(--border)', cursor: 'pointer' }}>← Back</button>
          </>
        )}

        {/* Step 3 — Payment */}
        {step === 3 && (
          <>
            <h3 style={{ fontSize: 22, marginBottom: 20 }}>Complete Payment</h3>
            <div style={{ background: 'rgba(0,200,150,.07)', border: '1px solid rgba(0,200,150,.2)', borderRadius: 14, padding: '20px 22px', marginBottom: 24 }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14, letterSpacing: '.04em', fontWeight: 600 }}>TRANSFER DETAILS</p>
              {[['Bank', 'Moniepoint'], ['Account Name', 'Mustapha Olabode Sulaimon'], ['Account Number', '7025204373'], ['Amount', '₦2,000']].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: k === 'Amount' ? 'var(--green)' : 'var(--text)' }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Upload payment screenshot</label>
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '24px', background: 'var(--card2)', border: `2px dashed ${preview ? 'var(--green)' : 'var(--border)'}`, borderRadius: 12, cursor: 'pointer', transition: '.2s' }}>
                {preview
                  ? <img src={preview} alt="screenshot" style={{ maxHeight: 180, borderRadius: 8, objectFit: 'contain' }} />
                  : <>
                    <span style={{ fontSize: 28 }}>📎</span>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>Tap to upload screenshot</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>JPG, PNG or PDF</span>
                  </>
                }
                <input type="file" accept="image/*,.pdf" onChange={handleFile} style={{ display: 'none' }} />
              </label>
            </div>

            <button onClick={submit} disabled={loading || !screenshot}
              style={{ width: '100%', padding: 14, borderRadius: 12, background: screenshot ? 'var(--green)' : '#1e4d3d', color: screenshot ? '#000' : 'var(--muted)', fontWeight: 700, fontSize: 15, border: 'none', cursor: screenshot ? 'pointer' : 'not-allowed', marginBottom: 10 }}>
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
            <button onClick={() => { setErr(''); setStep(2) }} style={{ width: '100%', padding: 12, borderRadius: 12, background: 'transparent', color: 'var(--sub)', fontWeight: 600, fontSize: 14, border: '1px solid var(--border)', cursor: 'pointer' }}>← Back</button>
          </>
        )}
      </div>
    </div>
  )
}