import { useState } from 'react'

const typeIcon = {
  registration: '📝',
  approved: '✅',
  rejected: '❌',
  fixture: '⚽',
  result: '🏆',
  dispute: '⚠️',
}

export default function NotificationPanel({ notifications, unread, markAllRead }) {
  const [open, setOpen] = useState(false)

  const toggle = () => {
    setOpen(o => !o)
    if (!open && unread > 0) markAllRead()
  }

  return (
    <>
      {/* Bell button */}
      <button onClick={toggle} style={{
        position: 'relative', background: 'transparent', border: 'none',
        cursor: 'pointer', padding: '8px', borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ fontSize: 20 }}>🔔</span>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 16, height: 16, borderRadius: '50%',
            background: 'var(--red)', color: '#fff',
            fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{
            position: 'fixed', inset: 0, zIndex: 150
          }} />
          <div style={{
            position: 'fixed', top: 60, right: 12, width: 320, maxWidth: 'calc(100vw - 24px)',
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 16, zIndex: 151, maxHeight: 420, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 8px 32px rgba(0,0,0,.4)'
          }}>
            <div style={{
              padding: '14px 18px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
              {unread > 0 && (
                <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, cursor: 'pointer' }}
                  onClick={markAllRead}>Mark all read</span>
              )}
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  No notifications yet
                </div>
              ) : notifications.map(n => (
                <div key={n.id} style={{
                  padding: '12px 18px', borderBottom: '1px solid var(--border)',
                  background: n.read ? 'transparent' : 'rgba(0,200,150,.04)',
                  display: 'flex', gap: 12, alignItems: 'flex-start'
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{typeIcon[n.type] || '🔔'}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--sub)', lineHeight: 1.5 }}>{n.body}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                  {!n.read && (
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', flexShrink: 0, marginTop: 4 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
