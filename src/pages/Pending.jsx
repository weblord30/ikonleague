import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Pending({ player }) {
  const nav = useNavigate()
  const [status, setStatus] = useState(player?.status || 'pending')
  const [screenshot, setScreenshot] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!player?.id) return
    const channel = supabase.channel('player-status-' + player.id)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'players',
        filter: `id=eq.${player.id}`
      }, payload => setStatus(payload.new.status))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [player?.id])

  const handleFile = e => {
    const file = e.target.files[0]
    if (!file) return
    setScreenshot(file)
    setPreview(URL.createObjectURL(file))
  }

  const reupload = async () => {
    if (!screenshot) { setMsg('Please select a screenshot first'); return }
    setUploading(true)

    const ext = screenshot.name.split('.').pop()
    const fileName = `${player.user_id}-reupload-${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('payment-screenshots')
      .upload(fileName, screenshot)

    if (uploadErr) { setMsg('Upload failed. Try again.'); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage
      .from('payment-screenshots')
      .getPublicUrl(fileName)

    await supabase.from('players').update({
      payment_screenshot: publicUrl,
      status: 'pending'
    }).eq('id', player.id)

    setStatus('pending')
    setMsg('Screenshot re-uploaded successfully! Awaiting admin review.')
    setUploading(false)
    setScreenshot(null)
    setPreview(null)
  }

  const statusConfig = {
    pending: {
      icon: '⏳',
      color: 'var(--amber)',
      bg: 'rgba(245,158,11,.1)',
      border: 'rgba(245,158,11,.25)',
      title: 'Payment Under Review',
      body: "Admin is reviewing your payment screenshot. This usually takes a few hours. You'll be notified here as soon as it's confirmed.",
    },
    approved: {
      icon: '✅',
      color: 'var(--green)',
      bg: 'rgba(0,200,150,.1)',
      border: 'rgba(0,200,150,.25)',
      title: "You're In! 🎉",
      body: 'Your payment has been verified. Welcome to ikonLeague Season 1. Join the WhatsApp group below.',
    },
    rejected: {
      icon: '❌',
      color: 'var(--red)',
      bg: 'rgba(239,68,68,.1)',
      border: 'rgba(239,68,68,.25)',
      title: 'Registration Rejected',
      body: "Your payment could not be verified and your account has been removed. Please register again with a clear payment screenshot.",
    },
    reupload: {
      icon: '📸',
      color: 'var(--amber)',
      bg: 'rgba(245,158,11,.08)',
      border: 'rgba(245,158,11,.25)',
      title: 'Screenshot Unclear',
      body: "We couldn't read your payment screenshot clearly. Please re-upload a clearer image of your payment receipt below.",
    },
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: config.bg, border: `2px solid ${config.color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 28px', fontSize: 36
      }}>{config.icon}</div>

      <h2 style={{ fontSize: 32, marginBottom: 12, color: status === 'approved' ? 'var(--green)' : status === 'rejected' ? 'var(--red)' : 'var(--text)' }}>
        {config.title}
      </h2>
      <p style={{ color: 'var(--sub)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
        {config.body}
      </p>

      {msg && <div style={{ background: 'rgba(0,200,150,.1)', border: '1px solid rgba(0,200,150,.25)', color: 'var(--green)', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 20 }}>{msg}</div>}

      {/* Pending — pulsing dot */}
      {status === 'pending' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 13, color: 'var(--amber)', fontWeight: 500 }}>Awaiting admin verification</span>
          <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.3} }`}</style>
        </div>
      )}

      {/* Approved — WhatsApp link */}
      {status === 'approved' && (
        <>
          <a href="https://chat.whatsapp.com/YOUR_GROUP_LINK_HERE" target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#25d366', color: '#000', padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, marginBottom: 16, textDecoration: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.7 2 6.7L4 29l7.5-2c1.9 1 4 1.6 4.5 1.6C22.6 28.6 28 23.2 28 15S22.6 3 16 3zm0 2c6.1 0 11 4.9 11 11S22.1 26 16 26c-2 0-3.9-.6-5.5-1.6l-.4-.2-4.4 1.1 1.2-4.3-.2-.4C5.6 18.9 5 17 5 15 5 8.9 9.9 5 16 5zm-3.3 5.4c-.2 0-.5 0-.7.6-.2.6-.9 2.3-.9 2.5 0 .2-.1.5.1.8.2.3.9 1.2 1.7 1.9.8.7 1.7 1.1 1.9 1.2.2.1.4.1.6-.1l.5-.5c.2-.2.4-.2.6 0l1.4 1.4c.2.2.2.4 0 .6l-.4.4c-.5.5-1.1 1-1.8.9-.5-.1-2.5-.8-4.4-2.7C9.3 16 8.5 14.7 8.3 14.4c-.2-.3-.2-.7 0-1l1.1-1.3c.2-.2.2-.5 0-.7l-1.4-2.4c-.2-.3-.4-.4-.6-.4z"/></svg>
            Join the WhatsApp Group
          </a>
          <button onClick={() => nav('/')}
            style={{ width: '100%', padding: 13, borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Go to My Dashboard →
          </button>
        </>
      )}

      {/* Rejected — register again */}
      {status === 'rejected' && (
        <button onClick={() => nav('/register')}
          style={{ width: '100%', padding: 14, borderRadius: 12, background: 'var(--green)', color: '#000', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
          Register Again →
        </button>
      )}

      {/* Reupload — upload new screenshot */}
      {status === 'reupload' && (
        <div style={{ textAlign: 'left' }}>
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px', background: 'var(--card)', border: `2px dashed ${preview ? 'var(--green)' : 'var(--border)'}`, borderRadius: 12, cursor: 'pointer', marginBottom: 14 }}>
            {preview
              ? <img src={preview} alt="screenshot" style={{ maxHeight: 180, borderRadius: 8, objectFit: 'contain' }} />
              : <>
                <span style={{ fontSize: 32 }}>📎</span>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Tap to upload new screenshot</span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>JPG or PNG</span>
              </>
            }
            <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          </label>
          <button onClick={reupload} disabled={uploading || !screenshot}
            style={{ width: '100%', padding: 14, borderRadius: 12, background: screenshot ? 'var(--green)' : '#1e4d3d', color: screenshot ? '#000' : 'var(--muted)', fontWeight: 700, fontSize: 15, border: 'none', cursor: screenshot ? 'pointer' : 'not-allowed' }}>
            {uploading ? 'Uploading...' : 'Re-upload Screenshot'}
          </button>
        </div>
      )}
    </div>
  )
}
