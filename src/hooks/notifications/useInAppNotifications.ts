import { useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/auth/useAuth'

export interface AppNotification {
  id: string
  subject: string | null
  content: string
  context_type: string | null
  ticket_id: string | null
  created_at: string
  sent_at: string | null
  status: string | null
  is_read: boolean
}

async function fetchNotifications(): Promise<AppNotification[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: logs, error } = await supabase
    .from('communication_logs')
    .select('*')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error

  const { data: reads } = await supabase
    .from('notification_reads')
    .select('log_id')
    .eq('user_id', user.id)

  const readSet = new Set((reads || []).map(r => r.log_id))

  return (logs || []).map(l => ({
    id: l.id as string,
    subject: l.subject as string | null,
    content: l.content as string,
    context_type: l.context_type as string | null,
    ticket_id: l.ticket_id as string | null,
    created_at: l.created_at as string,
    sent_at: l.sent_at as string | null,
    status: l.status as string | null,
    is_read: readSet.has(l.id as string),
  }))
}

export function useInAppNotifications() {
  const { user, isReady } = useAuth()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['inapp-notifications'],
    queryFn: fetchNotifications,
    staleTime: 30_000,
    enabled: isReady && !!user,
  })

  const unreadCount = useMemo(() => (query.data || []).filter(n => !n.is_read).length, [query.data])

  // realtime subscription - DÉSACTIVÉ
  useEffect(() => {
    // if (!isReady || !user?.id) return
    // const sub = supabase.channel('inapp-notifs')
    //   .on('postgres_changes', {
    //     event: 'INSERT',
    //     schema: 'public',
    //     table: 'communication_logs',
    //     filter: `recipient_id=eq.${user.id}`
    //   }, () => {
    //     qc.invalidateQueries({ queryKey: ['inapp-notifications'] })
    //   })
    //   .subscribe()
    // return () => { sub.unsubscribe() }
  }, [isReady, user?.id, qc])

  const markAsRead = useMutation({
    mutationFn: async (logId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      const { error } = await supabase
        .from('notification_reads')
        .upsert({ log_id: logId, user_id: user.id, is_read: true, read_at: new Date().toISOString() }, { onConflict: 'log_id,user_id' })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inapp-notifications'] }),
  })

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      const { data: logs } = await supabase
        .from('communication_logs')
        .select('id')
        .eq('recipient_id', user.id)
        .limit(200)
      const rows = (logs || []).map(l => ({ log_id: l.id as string, user_id: user.id, is_read: true, read_at: new Date().toISOString() }))
      if (rows.length > 0) {
        const { error } = await supabase.from('notification_reads').upsert(rows as any, { onConflict: 'log_id,user_id' })
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inapp-notifications'] }),
  })

  return { ...query, unreadCount, markAsRead, markAllAsRead }
}

