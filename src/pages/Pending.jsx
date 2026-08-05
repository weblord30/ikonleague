import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Pending({ player }) {
  const [status, setStatus] = useState(player?.status || 'pending')

  useEffect(() => {
    if (!player?.id) return
    const channel = supabase.channel('player-status')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'players', filter: `id=eq.${player.id}` },
        payload => setStatus(payload.new.status))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [player?.id])

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: status === 'approved' ? 'rgba(0,200,150,.15)' : 'rgba(245,158,11,.1)', border: `2px solid ${status === 'approved' ? 'var(--green)' : 'var(--amber)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', fontSize: 36 }}>
        {status === 'approved' ? '✅' : status === 'rejected' ? '❌' : '⏳'}
      </div>

      {status === 'pending' && (
        <>
          <h2 style={{ fontSize: 32, marginBottom: 12 }}>Payment Under Review</h2>
          <p style={{ color: 'var(--sub)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
            Your registration has been submitted. Admin is verifying your payment screenshot — this usually takes a few hours. You'll be notified here as soon as it's confirmed.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--amber)', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 13, color: 'var(--amber)', fontWeight: 500 }}>Awaiting admin verification</span>
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.3} }`}</style>
        </>
      )}

      {status === 'approved' && (
        <>
          <h2 style={{ fontSize: 32, marginBottom: 12, color: 'var(--green)' }}>You're In! 🎉</h2>
          <p style={{ color: 'var(--sub)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
            Your payment has been verified. Welcome to ikonLeague Season 1. Join the WhatsApp group below to stay updated on fixtures and announcements.
          </p>
          <a href="https://chat.whatsapp.com/CfsZtUjemEAChuEDJZhoYZ" target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#25d366', color: '#000', padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, marginBottom: 16, textDecoration: 'none' }}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.7 2 6.7L4 29l7.5-2c1.9 1 4 1.6 4.5 1.6C22.6 28.6 28 23.2 28 15S22.6 3 16 3zm0 2c6.1 0 11 4.9 11 11S22.1 26 16 26c-2 0-3.9-.6-5.5-1.6l-.4-.2-4.4 1.1 1.2-4.3-.2-.4C5.6 18.9 5 17 5 15 5 8.9 9.9 5 16 5zm-3.3 5.4c-.2 0-.5 0-.7.6-.2.6-.9 2.3-.9 2.5 0 .2-.1.5.1.8.2.3.9 1.2 1.7 1.9.8.7 1.7 1.1 1.9 1.2.2.1.4.1.6-.1l.5-.5c.2-.2.4-.2.6 0l1.4 1.4c.2.2.2.4 0 .6l-.4.4c-.5.5-1.1 1-1.8.9-.5-.1-2.5-.8-4.4-2.7C9.3 16 8.5 14.7 8.3 14.4c-.2-.3-.2-.7 0-1l1.1-1.3c.2-.2.2-.5 0-.7l-1.4-2.4c-.2-.3-.4-.4-.6-.4z"/></svg>
            Join the WhatsApp Group
          </a>
          <button onClick={() => window.location.href = '/dashboard'}
            style={{ width: '100%', padding: 13, borderRadius: 12, background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Go to My Dashboard →
          </button>
        </>
      )}

      {status === 'rejected' && (
        <>
          <h2 style={{ fontSize: 32, marginBottom: 12, color: 'var(--red)' }}>Payment Not Verified</h2>
          <p style={{ color: 'var(--sub)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
            We couldn't verify your payment screenshot. Please contact admin on WhatsApp or re-upload a clearer screenshot.
          </p>
          <a href="https://wa.me/2348082434420" target="_blank" rel="noreferrer"
            style={{ display: 'inline-block', padding: '12px 28px', background: '#25d366', color: '#000', borderRadius: 12, fontWeight: 700, fontSize: 14 }}>
            Contact Admin on WhatsApp
          </a>
        </>
      )}
    </div>
  )
}