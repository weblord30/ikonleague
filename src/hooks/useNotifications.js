import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)

  const fetch = async () => {
    if (!userId) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
    setNotifications(data || [])
    setUnread((data || []).filter(n => !n.read).length)
  }

  useEffect(() => {
    fetch()
    if (!userId) return
    const channel = supabase.channel('notifications-' + userId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, () => fetch())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [userId])

  const markAllRead = async () => {
    if (!userId) return
    await supabase.from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    fetch()
  }

  return { notifications, unread, markAllRead, refetch: fetch }
}

export async function createNotification(userId, title, body, type) {
  if (!userId) return
  await supabase.from('notifications').insert({ user_id: userId, title, body, type })
}
